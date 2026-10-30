# Question-bank independent QA report

Date: 2026-10-31 (Asia/Taipei)  
Reviewed file: `content/questions.json`  
Schema: `docs/content/QUESTION_SCHEMA.md`

## Result

The bank is structurally valid and editorially suitable for the first practice release after the corrections below. The review covered all 32 task sets and all 111 scored responses, rather than a sample.

Coverage retained after QA:

- Business Listening: 10 sets
- Business Reading: 9 sets
- General Listening: 7 sets
- General Reading: 6 sets
- Editorial levels: B2, B2+, and C1
- All task families declared in the project schema are represented

The material is original and uses generic situations, fictional people, and non-branded organisations. No item presents itself as a Cambridge question, reconstructs a live test, or uses learner booking/personal data.

## Checks performed

Each set was read against its transcript or stimulus. The audit checked:

- whether every keyed response is uniquely defensible;
- whether evidence supports the answer and contradicts or excludes distractors;
- matching-option validity and required one-to-one use in speaker/insertion tasks;
- completion answers, spelling variants, and the three-word ceiling for Listening completion;
- natural English, grammar, cohesion, and Traditional-Chinese explanation alignment;
- plausibility without ambiguity of multiple-choice distractors;
- topic fit for Business versus General;
- reasonable B2/B2+/C1 editorial calibration;
- complete Listening transcript, voice cue, asset path, preparation time, and two-play metadata.

Automated validation additionally confirmed:

- 32 unique set IDs and 111 unique set/item pairs;
- all choice answers refer to an existing option;
- all matching answers refer to a shared option;
- every short-text item has a valid `maxWords` value from 1 to 3;
- no accepted short-text answer exceeds its word limit;
- every item has evidence and a Traditional-Chinese explanation;
- every Listening set has audio segments and `maxPlays: 2`;
- every Reading set has no audio and `maxPlays: 0`;
- JSON parsing and `git diff --check` pass.

## Corrections made

### `br-open-001`

- Replaced two English-only explanation fields with proper Traditional-Chinese teaching explanations for `thank ... for + V-ing` and `send ... to ...`.

### `gl-note-001`

- Reworked the coach departure point from **sports-centre car park** to **east car park, beside the sports centre**.
- The former American-spelling variant, `sports center car park`, contained four whitespace-delimited words while the item declared a three-word maximum. The revised keyed answer, `east car park`, is heard verbatim, fits the note naturally, and complies with the maximum.
- Updated the transcript, accepted answer, explanation, and evidence together.

### `gr-open-001`

- Removed `by` as an accepted answer in `travelled ___ an overnight train`. With the article `an` already present, **on an overnight train** is correct; **by an overnight train** is not idiomatic. Updated the explanation and evidence accordingly.

## Editorial observations

- The Business bank is intentionally larger than the General bank because the Business test occurs first. This is a product-priority choice, not a quality defect.
- `B2+` is an internal routing label, not an official CEFR band. The product must continue to describe it as an editorial/practice level.
- Matching tasks that contain two dimensions use prefixed option IDs (for example `S`/`L` and `A`/`B`). The UI should visually separate the two option families so learners cannot choose a lesson option for a situation field.
- Multiple-text matching deliberately permits reuse of a source text; missing-sentence/paragraph and speaker-matching sets use each keyed option only once.

## Residual release requirements

These are production checks, not unresolved answer-key defects:

1. Every generated audio asset must be listened to against the authoritative transcript, especially names, numbers, dates, corrected information, and gap-fill answers.
2. Prosody must not emphasise the answer phrase or otherwise reveal the key.
3. The scorer should normalise case, surrounding whitespace, straight/curly apostrophes, and café/cafe variants only where the accepted-answer list permits them; it should not silently accept semantic alternatives absent from the list.
4. A phone-size interaction test must confirm that dual matching shows the relevant option family clearly and that transcripts remain hidden until the mode permits review.

