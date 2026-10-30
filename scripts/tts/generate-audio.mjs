#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { generateGemini } from "./providers/gemini.mjs";
import { generateOpenAI } from "./providers/openai.mjs";
import { concatPcmWav, parsePcmWav } from "./wav.mjs";

const providers = {
  gemini: generateGemini,
  openai: generateOpenAI,
};

const extensions = {
  gemini: "wav",
  openai: "wav",
};

function usage() {
  return [
    "Usage:",
    "  node scripts/tts/generate-audio.mjs --manifest <file> --out <directory> [options]",
    "",
    "Options:",
    "  --provider gemini|openai   Override the manifest default",
    "  --dry-run                  Validate and list jobs without calling an API",
    "  --force                    Replace existing output files",
    "  --limit N                  Generate at most N jobs",
    "",
    "Keys are read only from GEMINI_API_KEY/GOOGLE_API_KEY or OPENAI_API_KEY.",
  ].join("\n");
}

function parseArgs(argv) {
  const result = { dryRun: false, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--dry-run") result.dryRun = true;
    else if (value === "--force") result.force = true;
    else if (["--manifest", "--out", "--provider", "--limit"].includes(value)) {
      const next = argv[i + 1];
      if (!next) throw new Error(`Missing value after ${value}`);
      result[value.slice(2)] = next;
      i += 1;
    } else if (value === "--help" || value === "-h") {
      console.log(usage());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  if (!result.manifest || !result.out) throw new Error("--manifest and --out are required");
  if (result.limit !== undefined) {
    result.limit = Number.parseInt(result.limit, 10);
    if (!Number.isInteger(result.limit) || result.limit < 1) throw new Error("--limit must be a positive integer");
  }
  return result;
}

function safeId(value) {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9_-]{0,99}$/i.test(value)) {
    throw new Error(`Invalid job id: ${String(value)}`);
  }
  return value;
}

function safeRelativeFile(value) {
  if (typeof value !== "string" || path.isAbsolute(value)) throw new Error(`Invalid output file: ${String(value)}`);
  const normalized = path.normalize(value);
  if (normalized === ".." || normalized.startsWith(`..${path.sep}`)) throw new Error(`Invalid output file: ${value}`);
  return normalized;
}

function compactGeminiClips(clips) {
  if (process.env.GEMINI_TTS_COMPACT_CLIPS !== "1") return clips;
  const compacted = [];
  for (let index = 0; index < clips.length; index += 1) {
    const first = clips[index];
    const second = clips[index + 1];
    const speakers = new Set([
      ...(first?.turns || []).map((turn) => turn.speaker || "Narrator"),
      ...(second?.turns || []).map((turn) => turn.speaker || "Narrator"),
    ]);
    if (second && first.turns.length === 1 && second.turns.length === 1 && speakers.size <= 2) {
      const firstTurn = first.turns[0];
      compacted.push({
        id: `${first.id || index + 1}__${second.id || index + 2}`,
        pauseAfterMs: second.pauseAfterMs ?? 0,
        turns: [
          {
            ...firstTurn,
            style: [firstTurn.style, "Pause briefly after speaking before the next speaker begins."].filter(Boolean).join(" "),
          },
          second.turns[0],
        ],
      });
      index += 1;
    } else {
      compacted.push(first);
    }
  }
  return compacted;
}

function validateManifest(manifest) {
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.jobs)) {
    throw new Error("Manifest must contain version: 1 and a jobs array");
  }
  const ids = new Set();
  for (const job of manifest.jobs) {
    const id = safeId(job.id);
    if (ids.has(id)) throw new Error(`Duplicate job id: ${id}`);
    ids.add(id);
    const clips = job.clips ?? [{ id: "main", pauseAfterMs: 0, turns: job.turns }];
    if (!Array.isArray(clips) || clips.length === 0) throw new Error(`${id}: clips must be a non-empty array`);
    for (const [clipIndex, clip] of clips.entries()) {
      if (!Array.isArray(clip.turns) || clip.turns.length === 0) {
        throw new Error(`${id}: clip ${clipIndex + 1} turns must be a non-empty array`);
      }
      if (new Set(clip.turns.map((turn) => turn.speaker || job.speaker || "Narrator")).size > 2) {
        throw new Error(`${id}: clip ${clipIndex + 1} exceeds the two-speaker provider limit`);
      }
      for (const [turnIndex, turn] of clip.turns.entries()) {
        if (typeof turn.text !== "string" || !turn.text.trim()) {
          throw new Error(`${id}: clip ${clipIndex + 1}, turn ${turnIndex + 1} has no text`);
        }
        if (turn.text.length > 4096) throw new Error(`${id}: clip ${clipIndex + 1}, turn ${turnIndex + 1} is too long`);
      }
    }
  }
}

async function exists(file) {
  try {
    await readFile(file);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = path.resolve(args.manifest);
  const outputDirectory = path.resolve(args.out);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  validateManifest(manifest);

  const jobs = args.limit ? manifest.jobs.slice(0, args.limit) : manifest.jobs;
  console.log(`Validated ${jobs.length} TTS job(s).`);

  if (args.dryRun) {
    for (const job of jobs) {
      const provider = args.provider ?? job.provider ?? manifest.defaults?.provider ?? "gemini";
      const sourceClips = job.clips ?? [{ turns: job.turns }];
      const clips = provider === "gemini" ? compactGeminiClips(sourceClips) : sourceClips;
      const turnCount = clips.reduce((sum, clip) => sum + clip.turns.length, 0);
      console.log(`${job.id}: ${provider}, ${clips.length} clip(s), ${turnCount} turn(s)`);
    }
    return;
  }

  await mkdir(outputDirectory, { recursive: true });
  for (const job of jobs) {
    const providerName = args.provider ?? job.provider ?? manifest.defaults?.provider ?? "gemini";
    const generate = providers[providerName];
    if (!generate) throw new Error(`${job.id}: unsupported provider ${providerName}`);

    const defaults = manifest.defaults?.[providerName] ?? {};
    const outputFile = path.join(outputDirectory, safeRelativeFile(job.masterFile || `${safeId(job.id)}.${extensions[providerName]}`));
    if (!args.force && (await exists(outputFile))) {
      console.log(`${job.id}: skipped (already exists)`);
      continue;
    }
    const sourceClips = job.clips ?? [{ id: "main", pauseAfterMs: 0, turns: job.turns }];
    const clips = providerName === "gemini" ? compactGeminiClips(sourceClips) : sourceClips;
    const generated = [];
    for (const [index, clip] of clips.entries()) {
      const result = await generate({ ...job, id: `${job.id}-${clip.id || index + 1}`, turns: clip.turns, clips: undefined }, defaults);
      generated.push(result.bytes);
    }
    const bytes = generated.length === 1
      ? generated[0]
      : concatPcmWav(generated, clips.map((clip) => clip.pauseAfterMs ?? 0));
    const parsed = parsePcmWav(bytes);
    if (parsed.channels !== 1 || parsed.sampleRate !== 24000 || parsed.bitsPerSample !== 16) {
      throw new Error(`${job.id}: provider output is not 24 kHz mono 16-bit PCM WAV`);
    }
    await mkdir(path.dirname(outputFile), { recursive: true });
    await writeFile(outputFile, bytes);
    console.log(`${job.id}: wrote ${path.relative(process.cwd(), outputFile)} (${bytes.length} bytes)`);
  }
}

main().catch((error) => {
  console.error(`TTS generation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

