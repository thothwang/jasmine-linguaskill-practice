const ENDPOINT = "https://api.openai.com/v1/audio/speech";

function apiKey() {
  const value = process.env.OPENAI_API_KEY;
  if (!value) throw new Error("Set OPENAI_API_KEY in the process environment");
  return value;
}

export async function generateOpenAI(job, defaults = {}) {
  if (job.turns.length !== 1) {
    throw new Error(`${job.id}: the OpenAI Speech endpoint adapter accepts one speaker/turn; generate turns separately before concatenation`);
  }
  const turn = job.turns[0];
  const payload = {
    model: job.model || defaults.model || "gpt-4o-mini-tts",
    voice: turn.voice || job.voice || defaults.voice || "marin",
    input: turn.text,
    response_format: "wav",
    ...(turn.style || job.style ? { instructions: turn.style || job.style } : {}),
  };

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = (await response.text()).slice(0, 500).replace(/[\r\n]+/g, " ");
    throw new Error(`OpenAI request returned HTTP ${response.status}: ${message}`);
  }
  return { bytes: Buffer.from(await response.arrayBuffer()), extension: "wav" };
}

