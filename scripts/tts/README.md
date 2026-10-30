# Static TTS asset generator

This is a dependency-free Node.js skeleton for generating reviewed WAV masters from a JSON manifest. It supports Gemini's native one/two-speaker Interactions API and the legacy OpenAI Speech endpoint for one-speaker comparison clips.

Build the full listening manifest from the original question bank:

```powershell
node scripts/tts/build-question-manifest.mjs `
  --questions content/questions.json `
  --output scripts/tts/question-audio.manifest.json
```

The converter preserves every authored segment. Ordinary dialogue is grouped into native one/two-speaker Gemini calls. Narrator introductions and three/five-speaker matching tasks are split into clips with deterministic voices, then concatenated with controlled silence into one reviewed WAV master per task set.

Validate without making any API request:

```powershell
node scripts/tts/generate-audio.mjs `
  --manifest scripts/tts/manifest.example.json `
  --out public/audio/samples `
  --dry-run
```

Generate with Gemini after setting a session-scoped key:

For a short interactive PowerShell session, prompt without echoing the key:

```powershell
$env:GEMINI_API_KEY = Read-Host "Gemini key" -MaskInput
```

For recurring generation, use an operating-system or CI secret store instead of a profile or `.env` file. Then run:

```powershell
node scripts/tts/generate-audio.mjs `
  --manifest scripts/tts/question-audio.manifest.json `
  --out public/audio/masters
```

Important:

- Never put a key in the manifest, command line, repository, browser code, or GitHub Pages settings.
- Gemini 3.8 returns uncompressed WAV by default. Review WAV masters, then encode deployment copies as mono MP3 (roughly 64–80 kbps) with a trusted `ffmpeg` installation or CI job.
- The OpenAI adapter is for a limited comparison only. Its default Speech API model is deprecated and scheduled to shut down in January 2027.
- The generator runs jobs sequentially to respect free-tier limits. Existing files are skipped unless `--force` is supplied.

After human review, if `ffmpeg` is already installed, create the MP3 paths referenced by the question bank:

```powershell
node scripts/tts/compress-audio.mjs `
  --manifest scripts/tts/question-audio.manifest.json `
  --masters public/audio/masters `
  --public public
```

This project does not download `ffmpeg`. Until reviewed MP3s exist, the application must treat the listening asset as unavailable; WAV masters are production inputs, not learner-facing files.

Validate the dependency-free WAV joining utility:

```powershell
node scripts/tts/test-wav.mjs
```

Track accepted audio against the exact transcript/voice manifest and create a resumable missing-or-stale-only manifest:

```powershell
node scripts/tts/plan-audio.mjs `
  --manifest scripts/tts/question-audio.manifest.json `
  --masters public/audio/masters `
  --public public `
  --state scripts/tts/audio-state.json `
  --pending scripts/tts/pending-audio.manifest.json
```

After generation, human review, MP3 compression, and decode checks, add `--trust-existing --write-state` once to accept the validated files. Later content changes are then reported as `stale`, while newly added sets are `missing`. Generate only `pending-audio.manifest.json`; use `--force` for a pending manifest that contains stale jobs.

