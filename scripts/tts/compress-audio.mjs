#!/usr/bin/env node

import { access, mkdir, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
  const result = { force: false };
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (["--manifest", "--masters", "--public"].includes(option)) {
      if (!argv[index + 1]) throw new Error(`Missing value after ${option}`);
      result[option.slice(2)] = argv[++index];
    } else if (option === "--force") result.force = true;
    else throw new Error(`Unknown argument: ${option}`);
  }
  if (!result.manifest || !result.masters || !result.public) {
    throw new Error("--manifest, --masters and --public are required");
  }
  return result;
}

function safeRelative(value) {
  if (typeof value !== "string" || path.isAbsolute(value)) throw new Error(`Unsafe asset path: ${String(value)}`);
  const normal = path.normalize(value);
  if (normal === ".." || normal.startsWith(`..${path.sep}`)) throw new Error(`Unsafe asset path: ${value}`);
  return normal;
}

async function exists(file) {
  try { await access(file); return true; } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function runFfmpeg(input, output, force) {
  const args = [force ? "-y" : "-n", "-hide_banner", "-loglevel", "error", "-i", input,
    "-map_metadata", "-1", "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "72k", output];
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.FFMPEG_PATH || "ffmpeg", args, { stdio: "inherit", windowsHide: true });
    child.on("error", (error) => reject(new Error(`Unable to start ffmpeg: ${error.message}`)));
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`)));
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(await readFile(path.resolve(args.manifest), "utf8"));
  for (const job of manifest.jobs || []) {
    const source = path.join(path.resolve(args.masters), safeRelative(job.masterFile || `${job.id}.wav`));
    const target = path.join(path.resolve(args.public), safeRelative(job.sourceAsset));
    if (!args.force && await exists(target)) {
      console.log(`${job.id}: skipped (deployment MP3 exists)`);
      continue;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await runFfmpeg(source, target, args.force);
    console.log(`${job.id}: wrote ${path.relative(process.cwd(), target)}`);
  }
}

main().catch((error) => {
  console.error(`Audio compression failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
