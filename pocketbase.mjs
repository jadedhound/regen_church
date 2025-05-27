#!/usr/bin/env bun

import { spawnSync } from "child_process";
import { promises as fs } from "fs";
import { get as httpsGet } "https";
import path from "path";
import PocketBase from "pocketbase";
import { argv, exit } from "process";

const secretsFile = "secrets.json.gpg";
const outputDir = "pb/";

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
 * Downloads images from a record.
 * @param {PocketBase} pb
 * @param {import("pocketbase").RecordModel} record
 */
async function getImages(pb, record) {
  for (const [_, value] of Object.entries(record)) {
    if (/\.(jpg|jpeg|png)$/i.test(value)) {
      const result = await fetch(``);
      const path = "./file.txt";
      await Bun.write(path, result);
    }
  }
}

/**
 * Downloads a given collection.
 * @param {PocketBase} pb
 * @param {import("pocketbase").CollectionModel} collection
 */
async function getCollection(pb, collection) {
  const basePath = path.join(outputDir, collection.name);
  const imagePath = path.join(basePath, "images");
  await fs.mkdir(imagePath, { recursive: true });
  const records = await pb.collection(collection.name).getFullList();
  for (const record of records) {
    await fs.writeFile(path.join(basePath, `${record.id}.json`), JSON.stringify(record));
    getImages(pb, record);
  }
}

async function main() {
  try {
    if (argv.length < 3) {
      throw ("No passphrase provided.");
    }
    const passphrase = argv[2];
    const { url, email, password } = decryptSecrets(passphrase);

    const pb = new PocketBase(url);
    await pb.collection("_superusers").authWithPassword(email, password);
    if (!pb.authStore.isSuperuser && !pb.authStore.isValid) {
      throw ("Unable to authenticate");
    }

    (await pb.collections.getFullList())
      .filter(
        (collection) => !collection.name.startsWith("_") && collection.name != "users",
      )
      .forEach((c) => getCollection(pb, c));
  } catch (e) {
    console.error(`Pocketbase fetching failed: ${e}`);
    exit(1);
  }
}

main();
