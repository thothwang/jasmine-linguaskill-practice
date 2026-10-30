#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const bankPath = resolve(root, "content", "questions.json");
const bank = JSON.parse(await readFile(bankPath, "utf8"));
const errors = [];
const setIds = new Set();
const questionIds = new Set();
const domains = new Set(["business", "general"]);
const skills = new Set(["listening", "reading"]);
const levels = new Set(["B2", "B2+", "C1"]);
const responseTypes = new Set(["single_choice", "short_text", "gap_text", "matching"]);

if (bank.schemaVersion !== "1.0.0") errors.push("Unsupported schemaVersion");
if (!Array.isArray(bank.sets) || !bank.sets.length) errors.push("Bank has no sets");

for (const set of bank.sets || []) {
  if (!set.id || setIds.has(set.id)) errors.push(`Duplicate or missing set id: ${set.id}`);
  setIds.add(set.id);
  if (!domains.has(set.domain)) errors.push(`${set.id}: invalid domain`);
  if (!skills.has(set.skill)) errors.push(`${set.id}: invalid skill`);
  if (!levels.has(set.level)) errors.push(`${set.id}: invalid level`);
  if (!Array.isArray(set.items) || !set.items.length) errors.push(`${set.id}: no items`);
  if (set.skill === "listening") {
    if (!set.audio?.asset || !Array.isArray(set.audio?.segments) || !set.audio.segments.length) errors.push(`${set.id}: incomplete audio metadata`);
    if (set.maxPlays !== 2) errors.push(`${set.id}: listening maxPlays must be 2`);
  } else if (set.audio !== null || set.maxPlays !== 0) errors.push(`${set.id}: reading audio/maxPlays invalid`);

  const sharedIds = new Set((set.sharedOptions || []).map(option => option.id));
  for (const item of set.items || []) {
    const fullId = `${set.id}/${item.id}`;
    if (!item.id || questionIds.has(fullId)) errors.push(`Duplicate or missing question id: ${fullId}`);
    questionIds.add(fullId);
    if (!responseTypes.has(item.responseType)) errors.push(`${fullId}: invalid responseType`);
    if (!item.explanationZh || !item.evidence) errors.push(`${fullId}: explanation/evidence missing`);
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer];
    if (!answers.length || answers.some(answer => typeof answer !== "string" || !answer.trim())) errors.push(`${fullId}: invalid answer`);
    if (item.responseType === "single_choice") {
      const optionIds = new Set((item.options || []).map(option => option.id));
      if (!optionIds.size || answers.some(answer => !optionIds.has(answer))) errors.push(`${fullId}: answer does not match an option`);
    }
    if (item.responseType === "matching" && answers.some(answer => !sharedIds.has(answer))) errors.push(`${fullId}: answer does not match a shared option`);
    if (["short_text", "gap_text"].includes(item.responseType)) {
      if (!Number.isInteger(item.maxWords) || item.maxWords < 1 || item.maxWords > 3) errors.push(`${fullId}: invalid maxWords`);
      if (answers.some(answer => answer.trim().split(/\s+/).length > item.maxWords)) errors.push(`${fullId}: accepted answer exceeds maxWords`);
    }
  }
}

const manifestPath = resolve(root, "scripts", "tts", "question-audio.manifest.json");
try {
  await access(manifestPath, constants.R_OK);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const listening = new Set((bank.sets || []).filter(set => set.skill === "listening").map(set => set.id));
  const jobs = new Set((manifest.jobs || []).map(job => job.id));
  for (const id of listening) if (!jobs.has(id)) errors.push(`${id}: missing TTS manifest job`);
} catch {
  errors.push("TTS manifest is missing or unreadable");
}

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} issue(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  const itemCount = bank.sets.reduce((sum, set) => sum + set.items.length, 0);
  console.log(`Content validation passed: ${bank.sets.length} sets, ${itemCount} scored responses.`);
}
