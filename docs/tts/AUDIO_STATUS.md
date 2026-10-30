# Listening audio production status

Last updated: 2026-10-31 (Asia/Taipei)

## Current bank coverage

- Question bank: 136 task sets / 631 scored responses.
- Listening task sets requiring audio: 47.
- Generated and source-matched audio: 47 task sets.
- Pending generation: 0.
- This release added 30 new Listening assets and regenerated `gl-note-001`
  after its departure-point wording changed.

`scripts/tts/question-audio.manifest.json` is the complete 47-job manifest. `scripts/tts/pending-audio.manifest.json` is the bounded resumable generation input. `scripts/tts/audio-state.json` records accepted source digests plus WAV/MP3 hashes, allowing later transcript changes to be detected as stale rather than silently reusing old audio.

## Final asset validation

The original 17 MP3 assets were decoded with FFmpeg 9.0.2 and probed successfully before the content expansion:

- codec: MP3
- sample rate: 24 kHz
- channels: mono
- duration range: 18.62–88.46 seconds
- combined duration: 800.08 seconds
- missing/corrupt assets: 0

All 47 final MP3 assets decode successfully with FFmpeg and have matching
24 kHz, mono, 16-bit PCM WAV masters. The source-digest state reports all 47
jobs as ready and no missing, stale, modified, or invalid assets. The 30 new
deployment MP3s add approximately 6.8 MiB; the complete listening bank is
approximately 13.0 MiB.

## Release note

The restricted Gemini key was retrieved only into a process-scoped environment
from the authenticated Google Cloud project. It was not written to the
repository, manifest, command line, browser bundle, or log. The production
site contains only static MP3 files and makes no runtime TTS API request.

Automated format, hash, decode, duration, and source-link checks are complete.
Listening with headphones remains the final subjective check for pronunciation,
prosody, and answer-word emphasis when field-testing the public site.
