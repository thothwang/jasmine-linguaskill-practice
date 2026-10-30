#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const VOICES = {
  female: ["Kore", "Aoede", "Leda", "Erinome", "Achernar", "Callirrhoe"],
  male: ["Puck", "Charon", "Orus", "Iapetus", "Gacrux", "Algenib"],
  neutral: ["Schedar", "Zephyr", "Autonoe", "Umbriel", "Rasalgethi", "Laomedeia"],
};

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === "--questions" || option === "--output") {
      if (!argv[index + 1]) throw new Error(`Missing value after ${option}`);
      result[option.slice(2)] = argv[++index];
    } else if (option === "--help" || option === "-h") {
      console.log("Usage: node scripts/tts/build-question-manifest.mjs --questions content/questions.json --output scripts/tts/question-audio.manifest.json");
      process.exit(0);
    } else throw new Error(`Unknown argument: ${option}`);
  }
  if (!result.questions || !result.output) throw new Error("--questions and --output are required");
  return result;
}

function stableNumber(text) {
  let value = 2166136261;
  for (const character of text) {
    value ^= character.codePointAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function voiceCategory(cue = "") {
  if (/\b(woman|female|girl)\b/i.test(cue)) return "female";
  if (/\b(man|male|boy)\b/i.test(cue)) return "male";
  return "neutral";
}

function assignVoices(set) {
  const assigned = new Map();
  const used = new Set();
  for (const segment of set.audio.segments) {
    if (assigned.has(segment.speaker)) continue;
    const category = segment.speaker === "Narrator" ? "female" : voiceCategory(segment.voiceCue);
    const pool = VOICES[category];
    let index = stableNumber(`${set.id}:${segment.speaker}`) % pool.length;
    for (let tries = 0; tries < pool.length && used.has(pool[index]); tries += 1) {
      index = (index + 1) % pool.length;
    }
    const voice = pool[index];
    assigned.set(segment.speaker, voice);
    used.add(voice);
  }
  return assigned;
}

function makeTurn(segment, voice) {
  const neutralDirection = "Read the supplied text exactly once. Add no words. Natural exam-practice delivery at a normal B2 listening pace. Do not emphasise answer-bearing words.";
  return {
    speaker: segment.speaker,
    voice,
    text: segment.text,
    style: `${segment.voiceCue || "Clear international English"}. ${neutralDirection}`,
  };
}

function splitClips(set, turns) {
  if (set.taskType.includes("matching")) {
    return turns.map((turn, index) => ({
      id: index === 0 && turn.speaker === "Narrator" ? "intro" : `speaker-${index}`,
      pauseAfterMs: turn.speaker === "Narrator" ? 900 : 1300,
      turns: [turn],
    }));
  }

  const allSpeakers = new Set(turns.map((turn) => turn.speaker));
  if (allSpeakers.size <= 2) return [{ id: "main", pauseAfterMs: 0, turns }];

  const clips = [];
  let remaining = turns;
  if (turns[0]?.speaker === "Narrator") {
    clips.push({ id: "intro", pauseAfterMs: 900, turns: [turns[0]] });
    remaining = turns.slice(1);
  }

  let current = [];
  let speakers = new Set();
  for (const turn of remaining) {
    const next = new Set(speakers).add(turn.speaker);
    if (next.size > 2 && current.length) {
      clips.push({ id: `part-${clips.length + 1}`, pauseAfterMs: 700, turns: current });
      current = [];
      speakers = new Set();
    }
    current.push(turn);
    speakers.add(turn.speaker);
  }
  if (current.length) clips.push({ id: `part-${clips.length + 1}`, pauseAfterMs: 0, turns: current });
  return clips;
}

function toJob(set) {
  const voices = assignVoices(set);
  const turns = set.audio.segments.map((segment) => makeTurn(segment, voices.get(segment.speaker)));
  const clips = splitClips(set, turns);
  for (const clip of clips) {
    if (new Set(clip.turns.map((turn) => turn.speaker)).size > 2) {
      throw new Error(`${set.id}: clip ${clip.id} exceeds Gemini's two-speaker limit`);
    }
  }
  return {
    id: set.id,
    sourceAsset: set.audio.asset,
    masterFile: `${set.id}.wav`,
    provider: "gemini",
    model: "gemini-3.8-flash-tts",
    clips,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const bank = JSON.parse(await readFile(path.resolve(args.questions), "utf8"));
  if (!Array.isArray(bank.sets)) throw new Error("Question bank must contain a sets array");
  const listening = bank.sets.filter((set) => set.skill === "listening");
  for (const set of listening) {
    if (!set.audio?.asset || !Array.isArray(set.audio.segments) || set.audio.segments.length === 0) {
      throw new Error(`${set.id}: missing audio asset or segments`);
    }
  }
  const manifest = {
    version: 1,
    sourceContentVersion: bank.contentVersion,
    defaults: {
      provider: "gemini",
      gemini: { model: "gemini-3.8-flash-tts", voice: "Kore" },
    },
    jobs: listening.map(toJob),
  };
  const output = path.resolve(args.output);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Wrote ${manifest.jobs.length} listening job(s) to ${path.relative(process.cwd(), output)}`);
}

main().catch((error) => {
  console.error(`Manifest build failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
