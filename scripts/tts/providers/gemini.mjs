const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MIN_REQUEST_INTERVAL_MS = Number.parseInt(process.env.GEMINI_TTS_INTERVAL_MS || "21000", 10);
const MAX_RATE_LIMIT_RETRIES = 4;
const MAX_AUTOMATIC_RETRY_MS = Number.parseInt(process.env.GEMINI_TTS_MAX_RETRY_MS || "300000", 10);
let lastRequestStartedAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function paceRequest() {
  if (!Number.isFinite(MIN_REQUEST_INTERVAL_MS) || MIN_REQUEST_INTERVAL_MS < 0) {
    throw new Error("GEMINI_TTS_INTERVAL_MS must be a non-negative integer");
  }
  const waitMs = Math.max(0, lastRequestStartedAt + MIN_REQUEST_INTERVAL_MS - Date.now());
  if (waitMs > 0) await sleep(waitMs);
  lastRequestStartedAt = Date.now();
}

function retryDelayMs(response, body, attempt) {
  const retryAfter = Number.parseFloat(response.headers.get("retry-after") || "");
  if (Number.isFinite(retryAfter) && retryAfter >= 0) return Math.ceil(retryAfter * 1000) + 1000;
  const messageDelay = /retry in\s+([0-9.]+)s/i.exec(body)?.[1];
  if (messageDelay) return Math.ceil(Number.parseFloat(messageDelay) * 1000) + 1000;
  return Math.min(60000, 15000 * (attempt + 1));
}

function apiKey() {
  const value = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!value) throw new Error("Set GEMINI_API_KEY or GOOGLE_API_KEY in the process environment");
  return value;
}

function speakerConfig(job, defaults) {
  const speakerMap = new Map();
  for (const turn of job.turns) {
    const speaker = turn.speaker || job.speaker || "Narrator";
    const voice = turn.voice || job.voice || defaults.voice || "Kore";
    if (speakerMap.has(speaker) && speakerMap.get(speaker) !== voice) {
      throw new Error(`${job.id}: speaker ${speaker} uses more than one voice`);
    }
    speakerMap.set(speaker, voice);
  }
  if (speakerMap.size > 2) {
    throw new Error(`${job.id}: Gemini native multi-speaker generation supports at most two speakers per request`);
  }
  if (speakerMap.size === 1) return [{ voice: [...speakerMap.values()][0] }];
  return {
    speakers: [...speakerMap.entries()].map(([speaker, voice]) => ({ speaker, voice })),
  };
}

function content(job, isMultiSpeaker) {
  return job.turns.map((turn) => {
    const metadata = {
      type: "speech_metadata",
      ...(isMultiSpeaker ? { speaker: turn.speaker || job.speaker || "Narrator" } : {}),
      ...(turn.style || job.style ? { style: turn.style || job.style } : {}),
    };
    return {
      type: "text",
      text: turn.text,
      annotations: [metadata],
    };
  });
}

function extractAudioData(response) {
  const audioBlocks = [];
  for (const step of response.steps || []) {
    if (step.type !== "model_output") continue;
    for (const block of step.content || []) {
      if (block.type === "audio" && typeof block.data === "string") audioBlocks.push(block.data);
    }
  }
  const data = audioBlocks.at(-1);
  if (!data) throw new Error("Gemini response contained no audio block");
  return data;
}

export async function generateGemini(job, defaults = {}) {
  const speechConfig = speakerConfig(job, defaults);
  const isMultiSpeaker = !Array.isArray(speechConfig);
  const payload = {
    model: process.env.GEMINI_TTS_MODEL || job.model || defaults.model || "gemini-3.8-flash-tts",
    input: [{ type: "user_input", content: content(job, isMultiSpeaker) }],
    response_format: { type: "audio", mime_type: "audio/wav", sample_rate: 24000 },
    generation_config: { speech_config: speechConfig },
  };

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    await paceRequest();
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey(),
      },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const json = await response.json();
      return { bytes: Buffer.from(extractAudioData(json), "base64"), extension: "wav" };
    }
    const rawMessage = await response.text();
    const message = rawMessage.slice(0, 500).replace(/[\r\n]+/g, " ");
    if (response.status !== 429 || attempt === MAX_RATE_LIMIT_RETRIES) {
      throw new Error(`Gemini request returned HTTP ${response.status}: ${message}`);
    }
    const waitMs = retryDelayMs(response, rawMessage, attempt);
    if (waitMs > MAX_AUTOMATIC_RETRY_MS) {
      throw new Error(`Gemini free-tier daily quota exhausted; retry after approximately ${Math.ceil(waitMs / 1000)}s`);
    }
    console.warn(`${job.id}: free-tier rate limit reached; retrying in ${Math.ceil(waitMs / 1000)}s`);
    await sleep(waitMs);
  }
  throw new Error(`${job.id}: exhausted Gemini rate-limit retries`);
}

