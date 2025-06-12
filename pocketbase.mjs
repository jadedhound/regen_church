#!/usr/bin/env bun

import { spawnSync } from "child_process";
import { promises as fs } from "node:fs";
import path from "path";
import PocketBase from "pocketbase";
import { argv, exit } from "process";

const secretsFile = "secrets.json.gpg";
const outputDir = "pb/";
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
 * @param {str} imagePath
 * @param {import("pocketbase").RecordModel} record
 */
async function getImages(imagePath, record) {
  for (const [_, value] of Object.entries(record)) {
    if (/\.(jpg|jpeg|png|webp)$/i.test(value)) {
      const imageURL = `${url}/api/files/${record.collectionId}/${record.id}/${value}`
      const outputPath = path.join(imagePath, value);

      if (await fs.exists(outputPath)) {
        const response = await fetch(imageURL, { method: 'HEAD' });
        const urlSize = response.headers.get('content-length');
        const cachedSize = (await fs.stat(outputPath)).size;
        if (urlSize == cachedSize) {
          continue
        }
      }

      const response = await fetch(imageURL);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      await Bun.write(outputPath, await response.bytes());
      console.log(`Downloaded: ${value}`);
    }
  }
}

/**
 * Downloads a given collection.
 * @param {import("pocketbase").CollectionModel} collection
 * @param {str} basePath
 * @param {str} imagePath
 */
async function getCollection(collection, basePath, imagePath) {
  const records = await pb.collection(collection.name).getFullList();
  console.log(`${collection.name}: ${records.length} records.`);
  for (const record of records) {
    const outputPath = path.join(basePath, `${record.id}.json`);
    await Bun.write(outputPath, JSON.stringify(record));
    await getImages(imagePath, record);
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
    const collections = (await pb.collections.getFullList())
      .filter(
        (collection) => !collection.name.startsWith("_") && collection.name != "users",
      );
    for (const collection of collections) {
      const basePath = path.join(outputDir, collection.name);
      const imagePath = path.join(basePath, "images");
      await fs.mkdir(imagePath, { recursive: true });
      await getCollection(collection, basePath, imagePath);
      await createFilenamesJson(basePath);
    }
  } catch (error) {
    console.error(error.stack);
    exit(1);
  }
}

main();
