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
const levels = new Set(["B1", "B2", "B2+", "C1"]);
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
      for (const option of item.options || []) {
        if (option.image) {
          if (!option.alt) errors.push(`${fullId}/${option.id}: image option is missing alt text`);
          try { await access(resolve(root,"src",option.image),constants.R_OK); }
          catch { errors.push(`${fullId}/${option.id}: image asset is missing (${option.image})`); }
        }
      }
    }
    if (item.responseType === "matching" && answers.some(answer => !sharedIds.has(answer))) errors.push(`${fullId}: answer does not match a shared option`);
    if (["short_text", "gap_text"].includes(item.responseType)) {
      if (!Number.isInteger(item.maxWords) || item.maxWords < 1 || item.maxWords > 3) errors.push(`${fullId}: invalid maxWords`);
      if (answers.some(answer => answer.trim().split(/\s+/).length > item.maxWords)) errors.push(`${fullId}: accepted answer exceeds maxWords`);
    }
  }
}

const alignedGeneralListening = (bank.sets || []).filter(set => set.domain === "general" && set.skill === "listening" && set.formatAligned);
const alignedTypes = new Set(alignedGeneralListening.map(set => set.taskType));
for (const required of ["listening_picture_mc","listening_one_question_mc","listening_two_question_mc","listening_five_question_mc","listening_note_completion","listening_one_task_matching","listening_two_task_matching"]) {
  if (!alignedTypes.has(required)) errors.push(`General Listening: missing format-aligned ${required}`);
}

for (const set of alignedGeneralListening) {
  const transcript = set.audio.segments.map(segment => segment.text).join(" ");
  const transcriptWords = transcript.trim().split(/\s+/).filter(Boolean).length;
  if (set.taskType === "listening_picture_mc") {
    if (set.items.length !== 1 || set.items[0].options?.length !== 3 || set.items[0].options.some(option => !option.image)) {
      errors.push(`${set.id}: picture task must have one question and three image options`);
    }
  }
  if (set.taskType === "listening_one_question_mc" && set.items.length !== 1) errors.push(`${set.id}: one-question task must have one item`);
  if (set.taskType === "listening_two_question_mc" && set.items.length !== 2) errors.push(`${set.id}: two-question task must have two items`);
  if (set.taskType === "listening_five_question_mc" && (set.items.length !== 5 || transcriptWords < 180)) {
    errors.push(`${set.id}: extended Listening must have five items and at least 180 transcript words`);
  }
  if (set.taskType === "listening_note_completion" && (set.items.length !== 5 || set.items.some(item => item.maxWords > 3))) {
    errors.push(`${set.id}: completion task must have five gaps of no more than three words`);
  }
  if (set.taskType === "listening_one_task_matching" && (set.items.length !== 5 || set.sharedOptions?.length !== 8)) {
    errors.push(`${set.id}: one-task matching must have five speakers and eight options`);
  }
  if (set.taskType === "listening_two_task_matching") {
    const families = new Map();
    for (const option of set.sharedOptions || []) {
      const family = String(option.id).match(/^[A-Z]+/)?.[0] || "";
      families.set(family,(families.get(family) || 0) + 1);
    }
    if (set.items.length !== 6 || families.size !== 2 || [...families.values()].some(count => count !== 5)) {
      errors.push(`${set.id}: two-task matching must have three speakers and two groups of five options`);
    }
  }
  if (["listening_two_question_mc","listening_five_question_mc","listening_note_completion"].includes(set.taskType)) {
    const positions = set.items.map(item => transcript.toLocaleLowerCase("en").indexOf(String(item.evidence).toLocaleLowerCase("en")));
    if (positions.some((position,index) => position < 0 || (index > 0 && position <= positions[index - 1]))) {
      errors.push(`${set.id}: answer evidence must appear in the same order as the questions`);
    }
  }
}

const normalise = (value) => String(value ?? "")
  .toLowerCase()
  .replace(/\{\{\d+\}\}/g, "gap")
  .replace(/[^a-z0-9 ]/g, " ")
  .replace(/\s+/g, " ")
  .trim();
const stimulusText = (set) => Array.isArray(set.stimulus?.texts)
  ? set.stimulus.texts.map(entry => entry.text).join(" ")
  : set.stimulus?.text || "";
const expandedReading = (bank.sets || []).filter(set => /-expand-/.test(set.id) && set.skill === "reading");
const promptOwners = new Map();
const repeatedSentences = new Map();

for (const set of expandedReading) {
  const source = stimulusText(set);
  const words = source.trim().split(/\s+/).filter(Boolean).length;
  if (words < 160 || words > 280) errors.push(`${set.id}: expanded Reading stimulus must contain 160-280 words (found ${words})`);

  if (["reading_five_question_mc", "reading_multiple_text_matching"].includes(set.taskType)) {
    for (const item of set.items) {
      if (promptOwners.has(item.question)) errors.push(`${set.id}/${item.id}: repeats prompt from ${promptOwners.get(item.question)}`);
      else promptOwners.set(item.question, `${set.id}/${item.id}`);
    }
  }

  if (set.taskType === "reading_five_question_mc") {
    const normalisedSource = normalise(source);
    for (const item of set.items) {
      const correct = item.options?.find(option => option.id === item.answer)?.text;
      if (correct && normalise(correct).length > 12 && normalisedSource.includes(normalise(correct))) {
        errors.push(`${set.id}/${item.id}: correct option is copied verbatim from the passage`);
      }
    }
  }

  for (const sentence of source.split(/[.!?]\s+/)) {
    const key = normalise(sentence);
    if (key.split(" ").length < 8) continue;
    if (!repeatedSentences.has(key)) repeatedSentences.set(key, new Set());
    repeatedSentences.get(key).add(set.id);
  }
}

for (const [sentence, owners] of repeatedSentences) {
  if (owners.size >= 5) errors.push(`Expanded Reading sentence repeated in ${owners.size} sets: ${sentence.slice(0, 90)}...`);
}

const matchingSets = expandedReading.filter(set => set.taskType === "reading_multiple_text_matching");
const answerPatterns = new Set(matchingSets.map(set => set.items.map(item => item.answer).join("")));
if (answerPatterns.size < Math.ceil(matchingSets.length / 2)) {
  errors.push(`Expanded matching tasks use only ${answerPatterns.size} answer patterns across ${matchingSets.length} sets`);
}
if (matchingSets.some(set => set.items.map(item => item.answer).join("") === "ABCCD")) {
  errors.push("Expanded matching task still uses the predictable ABCCD answer sequence");
}

const ngrams = (value, size = 4) => {
  const words = normalise(value).split(" ");
  const result = new Set();
  for (let index = 0; index <= words.length - size; index += 1) result.add(words.slice(index, index + size).join(" "));
  return result;
};
for (let leftIndex = 0; leftIndex < expandedReading.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < expandedReading.length; rightIndex += 1) {
    const left = ngrams(stimulusText(expandedReading[leftIndex]));
    const right = ngrams(stimulusText(expandedReading[rightIndex]));
    let overlap = 0;
    for (const gram of left) if (right.has(gram)) overlap += 1;
    const similarity = overlap / (left.size + right.size - overlap);
    if (similarity > 0.35) errors.push(`${expandedReading[leftIndex].id}/${expandedReading[rightIndex].id}: Reading passages too similar (${similarity.toFixed(3)})`);
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

const vocabularyPath = resolve(root,"content","vocabulary.json");
try {
  const vocabulary = JSON.parse(await readFile(vocabularyPath,"utf8"));
  const cards = vocabulary.cards || [];
  const ids = new Set();
  const words = new Set();
  let sprintCount = 0;
  let attributedExamples = 0;
  if (vocabulary.schemaVersion !== "1.0.0") errors.push("Vocabulary: unsupported schemaVersion");
  if (cards.length < 5000 || cards.length > 10000) errors.push(`Vocabulary: expected 5,000-10,000 cards (found ${cards.length})`);
  for (const card of cards) {
    if (!card.id || ids.has(card.id)) errors.push(`Vocabulary: duplicate or missing id ${card.id}`);
    if (!card.word || words.has(card.word)) errors.push(`Vocabulary: duplicate or missing word ${card.word}`);
    ids.add(card.id); words.add(card.word);
    if (!Array.isArray(card.domains) || !card.domains.length || card.domains.some(domain => !domains.has(domain))) errors.push(`${card.id}: invalid vocabulary domains`);
    if (!levels.has(card.level) && card.level !== "Foundation") errors.push(`${card.id}: invalid vocabulary level`);
    if (!card.definitionEn && !card.definitionZh) errors.push(`${card.id}: vocabulary definition missing`);
    if (!Array.isArray(card.examples) || card.examples.length !== 3) errors.push(`${card.id}: expected three vocabulary examples`);
    for (const example of card.examples || []) {
      if (!example.text || !new RegExp(`(^|[^a-z])${card.word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-z]|$)`,`i`).test(example.text)) errors.push(`${card.id}: example does not contain the headword`);
      if (example.sourceId) {
        attributedExamples += 1;
        if (!example.sourceLicense) errors.push(`${card.id}: sourced example has no licence`);
      }
    }
    if (card.sprint) sprintCount += 1;
  }
  if (sprintCount < 500 || sprintCount > 1000) errors.push(`Vocabulary: expected 500-1,000 sprint cards (found ${sprintCount})`);
  if (attributedExamples < cards.length * 2) errors.push(`Vocabulary: too few natural sourced examples (${attributedExamples})`);
} catch (error) {
  errors.push(`Vocabulary library is missing or unreadable: ${error.message}`);
}

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} issue(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  const itemCount = bank.sets.reduce((sum, set) => sum + set.items.length, 0);
  console.log(`Content validation passed: ${bank.sets.length} sets, ${itemCount} scored responses, plus vocabulary library.`);
}
