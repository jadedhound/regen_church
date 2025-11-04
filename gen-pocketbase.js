#!/usr/bin/env bun

import { spawnSync } from "child_process";
import { promises as fs } from "node:fs";
import path from "path";
import PocketBase from "pocketbase";
import { argv, exit } from "process";
import sharp from "sharp";

const secretsFile = "secrets.json.gpg";
const outputDir = "pocketbase/";
const staticDir = "static/pocketbase/";
const imageDir = path.join(outputDir, "img");
const lqipDir = path.join(outputDir, "lqip")
/** @type {str} */
let url;
/** @type {PocketBase} */
let pb;

function decryptSecrets(passphrase) {
  const result = spawnSync(
    "gpg",
    ["--batch", "--passphrase", passphrase, "--decrypt", secretsFile],
    {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (result.error) {
    throw (`Error executing GPG: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw (`GPG decryption failed: ${result.stderr}`);
  }

  return JSON.parse(result.stdout);
}

/**
 * Downloads images from a record, if they exist.
 * @param {str} basePath
 */
async function createFilenamesJson(basePath) {
  const outputName = "filenames.json";
  const outputPath = path.join(basePath, outputName);
  const files = await fs.readdir(basePath, { withFileTypes: true });
  const filenames = files
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name)
    .filter(name => name != outputName);
  await Bun.write(outputPath, JSON.stringify(filenames));
}

/**
 * Downloads images from a record, if they exist.
 * @param {import("pocketbase").RecordModel} record
 */
async function getImages(record) {
  for (const [_, value] of Object.entries(record)) {
    if (/\.(jpg|jpeg|png|webp)$/i.test(value)) {
      const imageURL = `${url}/api/files/${record.collectionId}/${record.id}/${value}`;
      const outputPath = path.join(imageDir, value);

      if (await fs.exists(outputPath)) {
        const response = await fetch(imageURL, { method: "HEAD" });
        const urlSize = response.headers.get("content-length");
        const cachedSize = (await fs.stat(outputPath)).size;
        if (urlSize == cachedSize) {
          continue;
        }
      }

      const response = await fetch(imageURL);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const resp = await response.bytes();
      await Bun.write(outputPath, resp);
      await genLQIP(outputPath, value);
      console.log(`Downloaded: ${value}`);
    }
  }
}

/**
 * Downloads images from a record, if they exist.
 * @param {import("pocketbase").RecordModel} record
 */
async function getStatic(record) {
  if ('static' in record) {
    const value = record['static'];
    const fileURL = `${url}/api/files/${record.collectionId}/${record.id}/${value}`;
    const outputPath = path.join(staticDir, value);

    if (await fs.exists(outputPath)) {
      const response = await fetch(fileURL, { method: "HEAD" });
      const urlSize = response.headers.get("content-length");
      const cachedSize = (await fs.stat(outputPath)).size;
      if (urlSize == cachedSize) {
        return;
      }
    }

    const response = await fetch(fileURL);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const resp = await response.bytes();
    await Bun.write(outputPath, resp);
    console.log(`Downloaded: ${value}`);
  }
}

async function genLQIP(imagePath, imageName) {
  const buffer = await sharp(imagePath)
    .rotate()
    .resize(32)
    .blur(2)
    .avif({ quality: 35, chromaSubsampling: '4:2:0' })
    .toBuffer();
  const base64 = `data:image/avif;base64,${buffer.toString("base64")}`;
  await Bun.write(path.join(lqipDir, `${imageName}.base64`), base64);
}

/**
 * Downloads a given collection.
 * @param {import("pocketbase").CollectionModel} collection
 * @param {str} basePath
 * @param {str} imagePath
 */
async function getCollection(collection, basePath) {
  const records = await pb.collection(collection.name).getFullList();
  console.log(`${collection.name}: ${records.length} records.`);
  for (const record of records) {
    const outputPath = path.join(basePath, `${record.id}.json`);
    await Bun.write(outputPath, JSON.stringify(record));
    await getImages(record);
    await getStatic(record);
  }
}

async function createRedirectFiles() {
  const inDir = path.join(outputDir, "Links");
  const linkDir = "./content/link";

  const files = (await fs.readdir(inDir))
    .filter((f) => f.endsWith(".json") && !f.startsWith("filenames"));

  for (const f of files) {
    const inPath = path.join(inDir, f);
    const content = await Bun.file(inPath).json();

    const { id, url } = content;
    const markdownContent = `+++\ntitle = "${id}"\nredirect_to = "${url}"\n+++\n`;
    const outDir = path.join(linkDir, id);
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, `_index.md`);

    await Bun.write(outPath, markdownContent);
    console.log(`Created link ${id}`);
  }
}

async function main() {
  try {
    if (argv.length < 3) {
      throw ("No passphrase provided.");
    }
    const passphrase = argv[2];
    const secrets = decryptSecrets(passphrase);

    url = secrets.url;
    pb = new PocketBase(url);
    await pb.collection("_superusers").authWithPassword(secrets.email, secrets.password);
    if (!pb.authStore.isSuperuser && !pb.authStore.isValid) {
      throw ("Unable to authenticate");
    }

    await fs.mkdir(imageDir, { recursive: true });

    const collections = (await pb.collections.getFullList())
      .filter((c) => !c.name.startsWith("_") && c.name != "users");
    for (const collection of collections) {
      const basePath = path.join(outputDir, collection.name);
      await fs.mkdir(lqipDir, { recursive: true });
      await fs.mkdir(staticDir, { recursive: true });
      await getCollection(collection, basePath);
      await createFilenamesJson(basePath);
    }
    createRedirectFiles();
  } catch (err) {
    console.error(err);
    if (err.stack) {
      console.error(err.stack);
    }
    exit(1);
  }
}

main();
