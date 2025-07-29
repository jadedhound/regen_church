#!/usr/bin/env bun

import { promises as fs } from "node:fs";
import path from "path";

const INDIR = "./svg";
const OUTFILE = "./static/sprites.svg";

async function generateSvgSprite() {
  try {
    const iconFiles = await fs.readdir(INDIR);
    const svgFiles = iconFiles.filter(file => file.endsWith(".svg"));

    if (svgFiles.length === 0) {
      console.warn(`No SVG files found in ${INDIR}.`);
      return;
    }

    let symbols = [];
    for (const file of svgFiles) {
      const id = path.parse(file).name;
      const filePath = path.join(INDIR, file);
      var svg = await fs.readFile(filePath, "utf-8");
      svg = svg.replace("<svg", `<symbol id="${id}"`);
      svg = svg.replace("</svg", "</symbol");
      symbols.push(svg);
    }

    if (symbols.length === 0) {
      console.error("No valid SVG symbols could be generated.");
      return;
    }

    const spriteContent = `<svg xmlns="http://www.w3.org/2000/svg" version="1.2">\n${
      symbols.join("")
    }</svg>`
      .trim();

    await fs.writeFile(OUTFILE, spriteContent);
    console.log(
      `Successfully created SVG sprite at ${OUTFILE} with ${symbols.length} icons.`,
    );
  } catch (error) {
    console.error("Error generating SVG sprite:", error);
  }
}

generateSvgSprite();
