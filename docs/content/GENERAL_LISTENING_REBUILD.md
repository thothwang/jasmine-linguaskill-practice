# General Listening rebuild — 2026-11

## Outcome

Replace the short, formulaic `gl-expand-*` material with an original B2–C1 General Listening bank that follows the learner-facing structure of the current Linguaskill sample without copying Cambridge content.

The released bank must keep at least 100 scored responses and must not deploy a changed transcript until its matching audio asset is ready.

## Target distribution

| Family | Task structure | Sets | Scored responses |
| --- | --- | ---: | ---: |
| Picture | One recording, three original images | 4 | 4 |
| Short recording | Eight one-question and eight two-question tasks | 16 | 24 |
| Extended listening | Five ordered questions | 6 | 30 |
| Completion | Five gaps, no more than three words each | 4 | 20 |
| Matching | Two five-speaker tasks and two dual three-speaker tasks | 4 | 22 |
| **Total** |  | **34** | **100** |

The seven existing reviewed sets contribute 25 responses. The rebuild adds 27 sets / 75 responses and removes all 15 `gl-expand-*` sets from learner selection.

## Content requirements

- Level range: B2, B2+, and C1; no elementary distractors.
- Picture and one-question recordings: normally 35–85 transcript words.
- Two-question recordings: normally 85–160 transcript words.
- Extended recordings: 280–430 transcript words, five questions, evidence in question order.
- Completion recordings: 150–240 transcript words, five gaps, evidence in question order.
- One-task matching: five distinct speakers and eight options.
- Two-task matching: three distinct speakers of 70–110 words, two questions per speaker, and two groups of five options.
- Correct multiple-choice options must express a paraphrase or inference rather than copy a distinctive answer phrase from the transcript.
- Distractors must be plausible from the recording: an abandoned plan, a nearby detail, a partial truth, or a reversed relationship.
- Every scored response needs an English evidence phrase and a useful Traditional Chinese explanation.
- All scripts, options, images, and explanations are original and non-affiliated.

## Audio and release gates

- Gemini TTS uses the existing server-side generation pipeline and is never exposed to browser code.
- Each changed set needs a reviewed WAV master, deployment MP3, matching source digest, and successful decode/duration check.
- The website continues to play the recording exactly twice.
- Validation fails for missing task families, invalid counts, unordered evidence, copied correct options, missing image alternatives, stale audio, or transcript-length violations.
- Mobile QA covers the family picker, image choices, completion fields, matching controls, two-pass playback, submission, feedback, and transcript reveal.

