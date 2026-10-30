# TTS evaluation for the Linguaskill practice site

Last verified: 2026-10-31 (Asia/Taipei)

## Decision

Use **Gemini 3.8 Flash TTS** (`gemini-3.8-flash-tts`) as the primary generator for the final static listening assets, with **Gemini 3.8 Flash-Lite TTS** (`gemini-3.8-flash-lite-tts`) as the high-volume fallback. Generate audio during development, review it, compress it, and deploy only the finished audio files. The public site must never contain an API key or call a paid/private TTS API from the browser.

Why this is the best fit now:

- Google documents both Gemini 3.8 TTS models as generally available, with single- and native two-speaker generation, structured per-turn style control, regional-accent support, and prebuilt/extended voice libraries.
- The current Gemini Developer API pricing page lists Standard requests for both models as free of charge on the Free Tier. Actual quotas are project-specific and must be checked in AI Studio.
- The free tier may use submitted content to improve Google products. Only original, non-sensitive practice scripts should be sent. No learner data, names beyond fictional characters, scores, or browser progress should ever enter the TTS request.
- Native two-speaker output avoids stitching separately generated voices for most dialogue tasks.

Use the flagship model for the initial four-clip quality comparison and final dialogue assets. Switch routine one-speaker clips to Flash-Lite only if its blind scores are not materially worse.

## Current provider comparison

| Option | Free/credit reality | Speaker and style control | Output and workflow | Fit for this project |
| --- | --- | --- | --- | --- |
| Gemini 3.8 Flash TTS | Standard Free Tier is listed as free; availability and quotas depend on the AI Studio project. Free-tier content may be used to improve Google products. | Native one- or two-speaker requests, structured turn metadata, regional accents, 30 featured voices plus an extended library | Unary calls return 24 kHz mono WAV by default. Generate once, then compress for the site. | **Recommended primary** |
| Gemini 3.8 Flash-Lite TTS | Same Free Tier position; lower paid price if the project later moves to paid | Same request schema and native two-speaker support; optimized for throughput | WAV by default | **Recommended fallback / bulk candidate** |
| OpenAI `gpt-4o-mini-tts` | Metered API. Official OpenAI documentation lists token pricing; an account credit can pay for it, but it is not the preferred free route. | 13 built-in voices and prompt control over accent, pace, tone, and intonation; one voice per Speech API request | Direct MP3/WAV output through `/v1/audio/speech` | Useful comparison only; deprecated and scheduled to shut down 2027-01-06 |
| OpenAI `gpt-realtime-2.1-mini` | Official model page says Free Tier is not supported | Modern realtime audio model | Realtime workflow, not the simple Speech API batch endpoint | Not justified for pre-rendered static clips |
| Browser Web Speech API | No project API charge | Voices come from the learner's device and vary by browser/OS | Runtime speech, difficult to make deterministic or cache as reviewed assets | Emergency accessibility fallback only, not exam audio |
| `edge-tts` community package | No API key according to its project README | Many Microsoft Edge online voices | Convenient MP3 generation, but it is an unofficial client for an online service with no project SLA | Prototype fallback only; do not make the production pipeline depend on it |
| Windows SAPI on this PC | No charge | Only Microsoft Zira Desktop (`en-US`, female) was found | Deterministic local WAV, but only one dated voice | Inadequate for multi-speaker exam practice |

## Official-source notes

- Gemini's current TTS guide: <https://ai.google.dev/gemini-api/docs/speech-generation>
- Gemini 3.8 Flash TTS model card: <https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts>
- Gemini Developer API pricing: <https://ai.google.dev/gemini-api/docs/pricing>
- OpenAI text-to-speech guide: <https://developers.openai.com/api/docs/guides/text-to-speech>
- OpenAI GPT-4o Mini TTS model page: <https://developers.openai.com/api/docs/models/gpt-4o-mini-tts>
- OpenAI GPT-Realtime 2.1 Mini model page: <https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini>
- Web Speech API reference: <https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis>
- Community `edge-tts` project: <https://github.com/rany2/edge-tts>

The OpenAI documentation requires a clear disclosure that OpenAI-generated voices are AI-generated. The website should show the same disclosure for all synthetic voices regardless of provider: **「本網站聽力音檔為 AI 合成語音，並非真人錄音。」**

## Cost scale if the free quota is unavailable

Google's pricing page currently gives these paid Standard equivalents through 2026-12-31:

- Gemini 3.8 Flash TTS: USD 0.00225 per 10 seconds
- Gemini 3.8 Flash-Lite TTS: USD 0.0015 per 10 seconds

At those rates, 100 minutes of finished audio is approximately USD 1.35 with Flash or USD 0.90 with Flash-Lite, before regeneration. This is only an estimate; verify the live pricing page before enabling billing.

## Generation pipeline

1. Freeze and review the original transcript and answer key first.
2. Generate a WAV with Gemini 3.8 Flash TTS using structured turns. Use one request for at most two speakers.
3. For three or more voices, generate each speaker/segment separately and concatenate PCM/WAV frames in the intended order. Avoid simulated overlapping speech in exam items.
4. Listen for omissions, number/date errors, unnatural answer-word emphasis, voice switching, and clipped edges.
5. Optionally transcribe the generated audio with ASR and compare it to the source transcript. ASR is a useful error flag, not proof of correctness; a human must review every final clip.
6. Normalize loudness and compress reviewed sources to mono MP3 (about 64–80 kbps) for broad phone compatibility. Keep master WAV files out of the deployed bundle unless needed.
7. Save a manifest linking every question ID to its final audio asset, transcript revision, provider/model, voice IDs, and generation date.
8. Deploy only static audio. Keep API calls, keys, intermediate responses, and provider logs outside the browser bundle.

### Implemented bank pipeline

`scripts/tts/build-question-manifest.mjs` converts every Listening set in `content/questions.json` into deterministic generation jobs. A single Gemini request never contains more than two speakers. Narrator introductions and three/five-speaker matching tasks become multiple clips; `scripts/tts/generate-audio.mjs` generates those clips sequentially and joins compatible 24 kHz, mono, 16-bit PCM WAV data with explicit silence. The joiner is dependency-free and rejects mismatched formats.

The manifest retains each authored `.mp3` deployment path while assigning a `.wav` master. After transcript and audio QA, `scripts/tts/compress-audio.mjs` uses an existing trusted `ffmpeg` installation to create mono 72 kbps MP3s under `public/audio/`. No encoder is downloaded automatically, and unreviewed WAV masters are not deployment assets.

## Reproducible four-clip evaluation

Generate the same four original scripts with two candidate configurations, randomize the labels, and review with headphones and a phone speaker:

1. Business: 25–35 second two-person scheduling correction with two dates and one time.
2. Business: 45–60 second one-person note-completion briefing containing five short answers.
3. General: 20–30 second short monologue with three plausible options.
4. General: 60–90 second two-person discussion requiring attitude/inference, not keyword matching.

Score each clip from 1 (poor) to 5 (excellent):

| Criterion | Acceptance rule |
| --- | --- |
| Verbatim fidelity | All words, names, numbers, dates, and corrections are accurate; any content error is an automatic rejection |
| Naturalness | Mean score at least 4.0 |
| Speaker separation | At least 4.0 for dialogue; identities must not drift or swap |
| Accent clarity at B2 | At least 4.0; intelligible without sounding artificially slow |
| Assessment neutrality | No prosodic emphasis that gives away the correct answer; any answer cue is an automatic rejection |
| Technical quality | No clipping, long leading silence, abrupt ending, or large volume jump |
| Mobile audibility | Speech remains clear through a phone speaker at normal volume |

The final choice should be made from the blinded scores, not the provider name.

## Key and repository safety

- Accepted environment variables: `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) and `OPENAI_API_KEY`.
- Never accept an API key as a command-line argument, manifest field, URL parameter, browser setting, or committed file.
- Never print keys, authorization headers, full provider requests, or raw error objects that may echo credentials.
- `.env` files should remain ignored; prefer session-scoped environment variables.
- GitHub Pages cannot protect a secret. All TTS calls must happen before deployment.

Environment check on 2026-10-31: none of the three accepted key variables was present, Node.js 24 was available, Python was not runnable, and `ffmpeg` was not installed. Therefore no provider call or paid-credit use was attempted, and no synthetic sample was produced yet.

## Why not collect and clip existing real voices

Do not take dialogue from YouTube, podcasts, Cambridge materials, films, or other third-party recordings and turn it into questions. That creates copyright, speaker-consent, provenance, and redistribution problems, and the background context may accidentally reveal the answer. ASR can also mishear exactly the numbers, names, and corrections that listening tests depend on.

Real human recordings are acceptable only when a volunteer records the project's original scripts with explicit permission for public redistribution. That is slower and harder to revise than TTS. For this short preparation window, original scripts plus reviewed TTS are the safer choice. ASR should be used only as a quality-control check on our own generated or consented recordings.

