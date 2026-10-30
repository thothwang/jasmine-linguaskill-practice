#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (!["--manifest", "--questions"].includes(option) || !argv[index + 1]) {
      throw new Error(`Usage: node link-audio-assets.mjs --manifest <file> --questions <file>`);
    }
    result[option.slice(2)] = argv[++index];
  }
  if (!result.manifest || !result.questions) throw new Error("--manifest and --questions are required");
  return result;
}

const args = parseArgs(process.argv.slice(2));
const manifestPath = path.resolve(args.manifest);
const questionsPath = path.resolve(args.questions);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const bank = JSON.parse(await readFile(questionsPath, "utf8"));
const assets = new Map((manifest.jobs || []).map((job) => [job.id, job.sourceAsset]));

let linked = 0;
for (const set of bank.sets || []) {
  if (set.skill !== "listening") continue;
  const sourceAsset = assets.get(set.id);
  if (!sourceAsset) throw new Error(`No audio manifest entry for listening set ${set.id}`);
  set.audio ??= {};
  set.audio.src = sourceAsset.replaceAll("\\", "/");
  linked += 1;
}

if (linked !== assets.size) {
  throw new Error(`Linked ${linked} listening sets, but the manifest contains ${assets.size} jobs`);
}

await writeFile(questionsPath, `${JSON.stringify(bank, null, 2)}\n`, "utf8");
console.log(`Linked ${linked} listening sets to deployment audio assets.`);
