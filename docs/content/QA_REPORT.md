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

## Expanded-bank validation

The bank was subsequently expanded without removing or rewriting any of the original 32 reviewed sets. It now contains:

| Domain | Scored responses |
|---|---:|
| Business Listening | 104 |
| Business Reading | 219 |
| General Listening | 100 |
| General Reading | 208 |
| **Total** | **631** |

The current bank has 148 task sets. General Listening was subsequently rebuilt from 7 reviewed sets plus 27 new original sets while the 15 formulaic `gl-expand-*` sets were retired. The rebuilt domain still contains exactly 100 scored responses and retains the two-play rule.

The 74 added Reading sets were independently authored and do not reuse a paired Listening topic, script, or answer fact. Their stimuli are natural articles, notices, or four-part texts of 160–280 words. They test paraphrase, purpose, implication, evidence evaluation, and cross-text location rather than copying a visible bullet. The added Reading mix is 26 extended multiple-choice sets, 24 five-gap cloze sets, and 24 multiple-text matching sets.

The task mix was checked against Cambridge's current official Linguaskill and Linguaskill Business sample tests and answer keys. No Cambridge passage, option, answer, or recording is copied into the bank. The website instead links learners to the official free sample tests and answer keys in a separate browser tab.

### Reading-template correction (2026-11-01)

Learner testing identified that the first expanded Reading release reused three predictable structures. Multiple-text matching repeatedly followed the same rhetorical order, and extended multiple-choice answers copied source wording too closely. The passages were therefore regenerated with varied document forms and question purposes rather than merely changing surface topics.

The corrected bank now enforces these additional checks:

- all 130 prompts in expanded five-question multiple-choice sets are unique;
- all 120 prompts in expanded multiple-text matching sets are unique;
- 24 matching sets use 19 answer sequences, with no fixed `ABCCD` sequence;
- correct multiple-choice options are not verbatim substrings of their passage;
- no complete sentence of eight or more words appears in five or more expanded Reading sets;
- no pair of expanded Reading passages exceeds 0.35 four-word-phrase Jaccard similarity;
- every expanded Reading stimulus remains between 160 and 280 words.

Exact scored-response counts by task family across the complete bank:

| Task family | Responses |
|---|---:|
| listening_picture_mc | 4 |
| listening_one_question_mc | 12 |
| listening_two_question_mc | 20 |
| listening_five_question_mc | 95 |
| listening_note_completion | 40 |
| listening_one_task_matching | 15 |
| listening_two_task_matching | 18 |
| reading_one_question_mc | 2 |
| reading_one_question_gap_mc | 1 |
| reading_two_question_mc | 4 |
| reading_five_question_mc | 135 |
| reading_five_question_gap_mc | 130 |
| reading_open_gap | 10 |
| reading_missing_sentence | 10 |
| reading_missing_paragraph | 5 |
| reading_multiple_text_matching | 130 |

Across the complete bank, every schema-supported Listening and Reading family remains represented.

`content/counts.json` is the machine-readable count report. `content/expand-bank.mjs` makes the expansion reproducible and idempotent by refusing to append an ID already present.

Post-expansion automated checks confirmed:

- 148 unique set IDs and 631 unique set/item pairs;
- at least 100 scored responses in every domain;
- valid answer references and complete distractor diagnostics;
- no completion answer above its declared one-to-three-word ceiling;
- no more than two TTS speaker identities in any newly added Listening set;
- every expanded Reading stimulus is between 160 and 280 words;
- no expanded Reading topic or title duplicates an expanded Listening topic or title;
- valid JSON, valid expansion-script syntax, and no whitespace errors.

## Residual release requirements

These are production checks, not unresolved answer-key defects:

1. Every generated audio asset must be listened to against the authoritative transcript, especially names, numbers, dates, corrected information, and gap-fill answers.
2. Prosody must not emphasise the answer phrase or otherwise reveal the key.
3. The scorer should normalise case, surrounding whitespace, straight/curly apostrophes, and café/cafe variants only where the accepted-answer list permits them; it should not silently accept semantic alternatives absent from the list.
4. A phone-size interaction test must confirm that dual matching shows the relevant option family clearly and that transcripts remain hidden until the mode permits review.

