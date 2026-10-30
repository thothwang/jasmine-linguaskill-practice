import assert from "node:assert/strict";
import { buildPcmWav, concatPcmWav, parsePcmWav } from "./wav.mjs";

const format = { channels: 1, sampleRate: 24000, bitsPerSample: 16 };
const firstFrames = 2400;
const secondFrames = 4800;
const first = buildPcmWav(Buffer.alloc(firstFrames * 2, 0x11), format);
const second = buildPcmWav(Buffer.alloc(secondFrames * 2, 0x22), format);
const combined = concatPcmWav([first, second], [50]);
const parsed = parsePcmWav(combined);

assert.equal(parsed.sampleRate, 24000);
assert.equal(parsed.channels, 1);
assert.equal(parsed.bitsPerSample, 16);
assert.equal(parsed.dataLength, (firstFrames + 1200 + secondFrames) * 2);
assert.deepEqual(parsed.data.subarray(0, 4), Buffer.alloc(4, 0x11));
assert.deepEqual(parsed.data.subarray(firstFrames * 2, firstFrames * 2 + 4), Buffer.alloc(4));
assert.deepEqual(parsed.data.subarray((firstFrames + 1200) * 2, (firstFrames + 1200) * 2 + 4), Buffer.alloc(4, 0x22));

console.log("WAV concatenation test passed");
