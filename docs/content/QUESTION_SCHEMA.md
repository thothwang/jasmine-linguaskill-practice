# Linguaskill-style question-bank schema

This project uses original practice material inspired by the publicly documented task families of the enhanced/current Linguaskill exam. It is not an official Cambridge product, and the bank must never contain copied, reconstructed, or memorised live-test content.

## Top-level object

```json
{
  "schemaVersion": "1.0.0",
  "contentVersion": "2026-10-31.1",
  "disclaimer": "...",
  "sets": []
}
```

`sets` is the collection rendered by the application. A **set** is one screen/task. A set may contain one question or several linked questions.

## Set fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable unique ID, e.g. `bl-short-001`. Prefixes: `bl`, `br`, `gl`, `gr`. |
| `domain` | `business` \| `general` | Linguaskill Business or general/academic/everyday context. |
| `skill` | `listening` \| `reading` | Skill measured. |
| `taskType` | string | One of the task types listed below. |
| `level` | `B2` \| `B2+` \| `C1` | Editorial target, not a predicted official score. |
| `topic` | string | Search/filter label. |
| `title` | string | Short learner-facing title. |
| `directions` | string | English task instruction. |
| `prepSeconds` | integer | Listening preparation time; `0` for reading. |
| `maxPlays` | integer | `2` for listening; `0` for reading. |
| `audio` | object or null | Present only for listening. |
| `stimulus` | object or null | Written passage/message/notes. |
| `sharedOptions` | array | Optional common options for matching tasks. |
| `items` | array | Scored responses. |
| `strategyTags` | string[] | Skills used for analytics and review. |
| `vocabularyTags` | string[] | Topic/language tags. |

## Audio object

```json
{
  "asset": "audio/bl-short-001.mp3",
  "durationEstimateSeconds": 24,
  "segments": [
    {
      "speaker": "Narrator",
      "voiceCue": "Neutral British woman; clear exam pace",
      "text": "You hear a project manager leaving a message."
    },
    {
      "speaker": "Manager",
      "voiceCue": "British man, 30s; calm and matter-of-fact",
      "text": "..."
    }
  ]
}
```

`asset` is the intended generated file path. Until generation, the transcript is authoritative. `voiceCue` guides TTS casting and delivery. Audio must disclose that it is AI-generated in the product UI.

## Stimulus object

Common keys are:

- `format`: `message`, `notice`, `email`, `article`, `passage`, `notes`, `multiple_texts`.
- `text`: the main text, with numbered placeholders such as `{{1}}` when needed.
- `texts`: an array of `{ "id": "A", "heading": "...", "text": "..." }` for multiple-text tasks.
- `removed`: an array of candidate sentences/paragraphs for text-completion tasks.

## Item fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique within the set. |
| `question` | string | Prompt, sentence, note, or matching statement. |
| `responseType` | `single_choice` \| `short_text` \| `matching` | UI/scoring widget. |
| `options` | array | For item-specific choices; each is `{ "id", "text" }`. |
| `answer` | string or string[] | Option ID or accepted answer(s). Case-insensitive for `short_text`. |
| `maxWords` | integer | Required for listening completion/open gap; normally 1 or 3. |
| `explanationZh` | string | Traditional-Chinese explanation of evidence and reasoning. |
| `distractorRationales` | object | Maps wrong option IDs to concise Traditional-Chinese diagnostics. Omit for free text. |
| `evidence` | string | Short original supporting phrase or explanation; may be shown after submission. |

## Supported task types

Listening:

- `listening_one_question_mc`
- `listening_two_question_mc`
- `listening_five_question_mc`
- `listening_note_completion`
- `listening_one_task_matching`
- `listening_two_task_matching`

Reading:

- `reading_one_question_mc`
- `reading_one_question_gap_mc`
- `reading_five_question_gap_mc`
- `reading_open_gap`
- `reading_two_question_mc`
- `reading_five_question_mc`
- `reading_missing_sentence`
- `reading_missing_paragraph`
- `reading_multiple_text_matching`

## Scoring and analytics

- Each item is one raw point unless future metadata says otherwise.
- Set percentage is for practice feedback only and must not be presented as a Cambridge score.
- `level`, `strategyTags`, and `taskType` drive adaptive-like routing and weakness summaries.
- After a wrong answer, the engine should prefer another set with the same `strategyTags` at the same or one lower editorial level.
- After two strong sets, it may offer `B2+` or `C1` material.

## Editorial validation checklist

1. Exactly one defensible answer per item (except explicit accepted spelling variants).
2. Listening answers are supported by the audio transcript, not outside knowledge.
3. Distractors are plausible but contradicted, incomplete, or irrelevant.
4. Completion answers respect `maxWords` and use words heard/read in the stimulus.
5. British spelling is preferred unless the context calls for another variety.
6. Every explanation is in Traditional Chinese and identifies the relevant clue.
7. All scripts and passages are original and free of personal data, brands, and live-test content.
