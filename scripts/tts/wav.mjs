const RIFF = "RIFF";
const WAVE = "WAVE";

function fourCC(buffer, offset) {
  return buffer.toString("ascii", offset, offset + 4);
}

export function parsePcmWav(bytes) {
  const buffer = Buffer.from(bytes);
  if (buffer.length < 44 || fourCC(buffer, 0) !== RIFF || fourCC(buffer, 8) !== WAVE) {
    throw new Error("Expected a RIFF/WAVE file");
  }

  let format = null;
  let data = null;
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = fourCC(buffer, offset);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + chunkSize;
    if (end > buffer.length) throw new Error(`Invalid WAV chunk length for ${chunkId}`);

    if (chunkId === "fmt ") {
      if (chunkSize < 16) throw new Error("WAV fmt chunk is too short");
      format = {
        audioFormat: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        byteRate: buffer.readUInt32LE(start + 8),
        blockAlign: buffer.readUInt16LE(start + 12),
        bitsPerSample: buffer.readUInt16LE(start + 14),
      };
    } else if (chunkId === "data") {
      data = Buffer.from(buffer.subarray(start, end));
    }
    offset = end + (chunkSize % 2);
  }

  if (!format || !data) throw new Error("WAV must contain fmt and data chunks");
  if (format.audioFormat !== 1) throw new Error(`Only PCM WAV is supported (format ${format.audioFormat})`);
  if (data.length % format.blockAlign !== 0) throw new Error("WAV data is not block-aligned");
  return { ...format, data, dataLength: data.length };
}

export function buildPcmWav(dataBytes, format = {}) {
  const data = Buffer.from(dataBytes);
  const channels = format.channels ?? 1;
  const sampleRate = format.sampleRate ?? 24000;
  const bitsPerSample = format.bitsPerSample ?? 16;
  const blockAlign = channels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  if (!Number.isInteger(blockAlign) || blockAlign < 1) throw new Error("Invalid PCM format");
  if (data.length % blockAlign !== 0) throw new Error("PCM data is not block-aligned");

  const output = Buffer.alloc(44 + data.length);
  output.write(RIFF, 0, "ascii");
  output.writeUInt32LE(36 + data.length, 4);
  output.write(WAVE, 8, "ascii");
  output.write("fmt ", 12, "ascii");
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(channels, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(byteRate, 28);
  output.writeUInt16LE(blockAlign, 32);
  output.writeUInt16LE(bitsPerSample, 34);
  output.write("data", 36, "ascii");
  output.writeUInt32LE(data.length, 40);
  data.copy(output, 44);
  return output;
}

function sameFormat(left, right) {
  return left.audioFormat === right.audioFormat
    && left.channels === right.channels
    && left.sampleRate === right.sampleRate
    && left.blockAlign === right.blockAlign
    && left.bitsPerSample === right.bitsPerSample;
}

export function concatPcmWav(wavBuffers, pauseAfterMs = []) {
  if (!Array.isArray(wavBuffers) || wavBuffers.length === 0) {
    throw new Error("At least one WAV buffer is required");
  }
  const parsed = wavBuffers.map(parsePcmWav);
  const reference = parsed[0];
  for (const [index, item] of parsed.entries()) {
    if (!sameFormat(reference, item)) throw new Error(`WAV clip ${index + 1} has a mismatched PCM format`);
    if (item.channels !== 1 || item.bitsPerSample !== 16 || item.sampleRate !== 24000) {
      throw new Error("Expected 24 kHz, mono, 16-bit PCM WAV from the TTS provider");
    }
  }

  const chunks = [];
  for (let index = 0; index < parsed.length; index += 1) {
    chunks.push(parsed[index].data);
    const milliseconds = index < parsed.length - 1 ? Number(pauseAfterMs[index] ?? 0) : 0;
    if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > 10000) {
      throw new Error(`Invalid pause after clip ${index + 1}`);
    }
    const silenceFrames = Math.round(reference.sampleRate * milliseconds / 1000);
    if (silenceFrames > 0) chunks.push(Buffer.alloc(silenceFrames * reference.blockAlign));
  }
  return buildPcmWav(Buffer.concat(chunks), reference);
}
