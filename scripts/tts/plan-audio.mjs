#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { parsePcmWav } from "./wav.mjs";

function parseArgs(argv) {
  const result = { trustExisting: false, writeState: false };
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (["--manifest", "--masters", "--public", "--state", "--pending"].includes(option)) {
      if (!argv[index + 1]) throw new Error(`Missing value after ${option}`);
      result[option.slice(2)] = argv[++index];
    } else if (option === "--trust-existing") result.trustExisting = true;
    else if (option === "--write-state") result.writeState = true;
    else throw new Error(`Unknown argument: ${option}`);
  }
  if (!result.manifest || !result.masters || !result.public || !result.state) {
    throw new Error("--manifest, --masters, --public and --state are required");
  }
  return result;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function jobDigest(job) {
  return sha256(JSON.stringify({
    provider: job.provider,
    model: job.model,
    sourceAsset: job.sourceAsset,
    masterFile: job.masterFile,
    clips: job.clips,
    turns: job.turns,
  }));
}

function safeRelative(value) {
  if (typeof value !== "string" || path.isAbsolute(value)) throw new Error(`Unsafe relative path: ${String(value)}`);
  const normal = path.normalize(value);
  if (normal === ".." || normal.startsWith(`..${path.sep}`)) throw new Error(`Unsafe relative path: ${value}`);
  return normal;
}

async function exists(file) {
  try { await access(file); return true; } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function readJsonIfPresent(file, fallback) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function validateMp3(bytes) {
  if (bytes.length < 1024) throw new Error("MP3 is unexpectedly small");
  const isId3 = bytes.toString("ascii", 0, 3) === "ID3";
  const isFrame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  if (!isId3 && !isFrame) throw new Error("MP3 header/frame sync was not found");
}

async function inspectFiles(masterFile, mp3File) {
  const masterBytes = await readFile(masterFile);
  const parsed = parsePcmWav(masterBytes);
  if (parsed.channels !== 1 || parsed.sampleRate !== 24000 || parsed.bitsPerSample !== 16) {
    throw new Error("WAV is not 24 kHz mono 16-bit PCM");
  }
  const mp3Bytes = await readFile(mp3File);
  validateMp3(mp3Bytes);
  return {
    masterSha256: sha256(masterBytes),
    mp3Sha256: sha256(mp3Bytes),
    durationSeconds: Number((parsed.dataLength / parsed.byteRate).toFixed(3)),
    masterBytes: masterBytes.length,
    mp3Bytes: mp3Bytes.length,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = path.resolve(args.manifest);
  const mastersRoot = path.resolve(args.masters);
  const publicRoot = path.resolve(args.public);
  const statePath = path.resolve(args.state);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const state = await readJsonIfPresent(statePath, { version: 1, jobs: {} });
  if (state.version !== 1 || typeof state.jobs !== "object") throw new Error("Audio state must contain version: 1 and jobs");

  const rows = [];
  const pendingJobs = [];
  const nextJobs = { ...state.jobs };
  for (const job of manifest.jobs || []) {
    const digest = jobDigest(job);
    const masterFile = path.join(mastersRoot, safeRelative(job.masterFile || `${job.id}.wav`));
    const mp3File = path.join(publicRoot, safeRelative(job.sourceAsset));
    const hasMaster = await exists(masterFile);
    const hasMp3 = await exists(mp3File);
    let status = "ready";
    let details = null;
    let reason = "";

    if (!hasMaster || !hasMp3) {
      status = "missing";
      reason = [!hasMaster ? "WAV master" : null, !hasMp3 ? "MP3 asset" : null].filter(Boolean).join(" and ");
    } else {
      try { details = await inspectFiles(masterFile, mp3File); } catch (error) {
        status = "invalid";
        reason = error instanceof Error ? error.message : String(error);
      }
      const entry = state.jobs[job.id];
      if (status === "ready" && !entry && !args.trustExisting) {
        status = "untracked";
        reason = "no accepted source digest";
      } else if (status === "ready" && entry && entry.sourceDigest !== digest) {
        status = "stale";
        reason = "source transcript/configuration changed";
      } else if (status === "ready" && entry
        && (entry.masterSha256 !== details.masterSha256 || entry.mp3Sha256 !== details.mp3Sha256)) {
        status = "modified";
        reason = "audio file hash changed";
      }
    }

    const acceptedExisting = args.trustExisting && ["untracked", "stale", "modified"].includes(status);
    if (status !== "ready" && !acceptedExisting) pendingJobs.push(job);
    if (details && (status === "ready" || acceptedExisting)) {
      status = "ready";
      reason = acceptedExisting ? "accepted existing validated audio" : reason;
      nextJobs[job.id] = { sourceDigest: digest, ...details };
    }
    rows.push({ id: job.id, status, reason, durationSeconds: details?.durationSeconds ?? null });
  }

  const manifestIds = new Set((manifest.jobs || []).map((job) => job.id));
  for (const id of Object.keys(nextJobs)) if (!manifestIds.has(id)) delete nextJobs[id];

  if (args.pending) {
    const pendingPath = path.resolve(args.pending);
    await mkdir(path.dirname(pendingPath), { recursive: true });
    await writeFile(pendingPath, `${JSON.stringify({ ...manifest, jobs: pendingJobs }, null, 2)}\n`, "utf8");
  }
  if (args.writeState) {
    await mkdir(path.dirname(statePath), { recursive: true });
    await writeFile(statePath, `${JSON.stringify({
      version: 1,
      sourceContentVersion: manifest.sourceContentVersion,
      jobs: nextJobs,
    }, null, 2)}\n`, "utf8");
  }

  const counts = rows.reduce((result, row) => {
    result[row.status] = (result[row.status] || 0) + 1;
    return result;
  }, {});
  console.log(JSON.stringify({ total: rows.length, pending: pendingJobs.length, counts, rows }, null, 2));
}

main().catch((error) => {
  console.error(`Audio plan failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
