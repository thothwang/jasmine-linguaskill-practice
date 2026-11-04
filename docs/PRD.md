# Jasmine's Linguaskill Practice — Product Requirements Document

Status: Draft for implementation  
Date: 2026-10-31 (Asia/Taipei)  
Primary learner: Jasmine  
Target: CEFR B2 or higher; Cambridge English Scale 160+

## 1. Product summary

Create a public, phone-first practice website for the current/enhanced Linguaskill Listening and Reading exams. The experience covers both Linguaskill Business (職場) and Linguaskill/General (實用), gives friendly bilingual coaching, and saves progress locally without an account or backend.

The product is an independent educational practice tool. It must not use Cambridge branding, imply endorsement, reproduce protected exam content, or claim to calculate an official Linguaskill score.

## 2. Context and priorities

Jasmine has booked:

- Linguaskill Business Listening and Reading on 2026-11-04.
- Linguaskill/General Listening and Reading on 2026-11-07.

The first release therefore prioritises Business exercises, followed immediately by General exercises. The target is not merely to touch 160; practice should build a buffer above the B2 threshold while introducing selected C1-level stretch items.

Official Cambridge reporting places B2 at 160–179, C1 at 180–199, and C2 at 200–210. The site may display practice bands and readiness signals, but it must clearly distinguish them from Cambridge scores. See [Cambridge: How results are presented](https://www.cambridgeenglish.org/exams-and-tests/linguaskill/information-about-the-exam/how-results-are-presented/).

## 3. Goals

1. Make short, useful practice sessions easy on a phone.
2. Familiarise the learner with current/enhanced Listening and Reading task formats.
3. Teach why an answer is correct, not merely mark it.
4. Identify weak domains and task types when none are known in advance.
5. Build confidence through calm, friendly feedback and rotating personal encouragement.
6. Support a realistic mock experience without overstating the site's scoring accuracy.
7. Work as a static, installable PWA hosted on GitHub Pages.

## 4. Non-goals

- Reproducing, scraping, memorising, or reconstructing live or past examination items.
- Claiming to be Cambridge, an official test centre, or an official score predictor.
- User accounts, cloud sync, leaderboards, payments, analytics, or advertising.
- Speaking and Writing preparation in the first release.
- A psychometrically validated computer-adaptive test.
- Runtime calls to paid AI APIs from the public browser.
- Collecting personal information or sending study data to a server.

## 5. User and usage assumptions

- One principal learner uses a modern iOS or Android phone, with optional desktop use.
- Sessions may be brief (5–15 minutes) or a longer mock session.
- The learner understands Traditional Chinese and is preparing to answer English-only exam content.
- Questions, answer options, transcripts, and audio are in English; guidance and explanations are bilingual where useful.
- Progress remains on the current browser/device. Clearing site data or changing devices resets it.

## 6. Information architecture

### Home

- Date-aware, rotating Jasmine encouragement message.
- Four primary study cards:
  - 職場聽力 / Business Listening
  - 職場閱讀 / Business Reading
  - 實用聽力 / General Listening
  - 實用閱讀 / General Reading
- Prominent recommended-next-action card.
- Compact progress summary and target reminder.
- Links to Review Mistakes, Mock Tests, Settings, About/Disclaimer.

### Section dashboard

- Practice by task type.
- Mixed adaptive-like practice.
- Mini mock.
- Accuracy, attempts, practice-band trend, and weak task types.

### Question player

- Context/rubric, question, options/input, progress, and accessible controls.
- Listening-specific preparation and playback states.
- Practice-mode explanation panel after submission.
- Mock-mode review only after the set is finished.

### Review

- Incorrect and flagged questions.
- Filter by Business/General, Listening/Reading, task type, and difficulty.
- Retry without erasing the original attempt history.

## 7. Core user flows

### 7.1 First visit

1. Learner opens the public link.
2. Site shows a short independent-practice disclaimer and AI-voice disclosure.
3. Learner chooses Practice or a recommended Business diagnostic.
4. Results initialise a local weakness profile.
5. Site recommends the next task type.

### 7.2 Five-minute practice

1. Learner taps the recommended card.
2. Site selects a B2 item in an under-sampled or weak task type.
3. Learner answers and receives immediate bilingual feedback.
4. Site updates local progress and offers Continue, Review, or Home.

### 7.3 Listening practice

1. Learner reads the scene setter, prompt, and choices during preparation time.
2. Learner starts the recording.
3. Practice mode permits up to two complete plays; mock mode follows the same cap and hides seeking/speed controls.
4. Learner answers.
5. Practice mode reveals transcript, evidence phrase, distractor analysis, vocabulary, and strategy.

### 7.4 Mock test

1. Learner chooses one of the four domains and a mini-mock.
2. Site presents original items under a timer with no immediate feedback.
3. Back-navigation is restricted within the current task as configured by task type.
4. At completion, the learner receives accuracy, coverage, practice band, strengths, weaknesses, and full review.
5. Results are explicitly labelled as practice results, not Cambridge scores.

### 7.5 Return visit

1. A new non-repeating encouragement message appears.
2. The home page restores progress from local storage.
3. The recommendation favours Business through 2026-11-04, then General through 2026-11-07; afterwards it follows measured weaknesses.

## 8. Functional requirements

### 8.1 Modes

**Practice mode**

- Immediate correctness feedback.
- Transcript after answering Listening items.
- Correct-answer rationale, distractor rationale, vocabulary, and strategy tip.
- Retry and flag controls.

**Mock mode**

- Timed set.
- No answer feedback or transcript until completion.
- Limited audio playback and exam-like navigation.
- Final review and practice-readiness summary.

### 8.2 Content coverage

The bank must include original items for the current task families documented by Cambridge:

**Reading**

- One-question multiple choice.
- One-question multiple-choice gap fill.
- Five-question multiple-choice gap fill.
- Five-question open gap fill.
- Two- and five-question reading comprehension.
- Missing sentence/paragraph text completion.
- Multiple-text matching.

**Listening**

- One-question multiple choice, including original picture-choice items.
- Two- and five-question multiple choice; answer-bearing information follows question order.
- Note/sentence completion with no more than three words.
- One-task multiple matching.
- Two-task multiple matching.

General Listening exposes these as five learner-facing practice families: picture, short recording, extended listening, completion, and matching. Official Cambridge material remains an external reference; every in-site script, option, recording, and image is original.

See [Cambridge: Exam formats and task types](https://www.cambridgeenglish.org/exams-and-tests/linguaskill/information-about-the-exam/exam-formats-and-task-types/) and [Cambridge: Practice materials](https://www.cambridgeenglish.org/exams-and-tests/linguaskill/information-about-the-exam/practice-materials/).

### 8.3 Practice adaptation

- Start at B2 for a new domain.
- Correct answers gradually increase difficulty or complexity.
- Incorrect answers trigger another item targeting the same skill at B2 or slightly easier before changing task type.
- Prefer weak and under-sampled task types.
- Ensure recent questions are not immediately repeated.
- Call the result a **practice band** or **readiness signal**, never a Cambridge score prediction.

### 8.4 Progress

- Store attempts, accuracy, streaks, last-seen dates, flagged questions, and task-type mastery locally.
- Display coverage as well as accuracy so a small sample is not misleading.
- Provide a reset/export/import option if feasible; reset requires confirmation.
- Never transmit progress or personal data.

### 8.5 Personal encouragement

- Rotate from a curated set without immediate repetition.
- Change emphasis according to the local date:
  - Through 2026-11-04: Business-first encouragement.
  - 2026-11-05 through 2026-11-07: General-first encouragement.
  - After 2026-11-07: balanced growth and congratulations.
- Keep the tone warm, adult, and non-patronising.
- Example: “Jasmine，今天的每一題，都讓 160+ 更靠近一步。”

### 8.6 Audio

- Use pre-generated audio assets; no API key or generation call in the browser.
- Use distinct voices for multi-speaker tasks and normalise perceived volume.
- Prefer British-led, clear international English appropriate to exam preparation.
- Provide an on-page notice that voices are AI-generated.
- The site must remain usable if an audio file fails: show a retry state, not the transcript during an active mock.

OpenAI's public TTS guidance requires a clear disclosure that its generated voices are AI-generated; the disclosure remains required if that provider is selected. See [OpenAI: Text to speech](https://developers.openai.com/api/docs/guides/text-to-speech).

### 8.7 PWA and offline behaviour

- Installable manifest with icons and theme colour.
- Cache the application shell and question data.
- Cache audio on demand and retain a bounded recent/offline set.
- Clearly show offline status and which mock sets are fully downloaded.
- Updates must not corrupt stored progress.

## 9. Content quality requirements

- All questions and scripts are original and traceable to an internal content ID/version.
- Each item has one defensible answer (or a precisely defined accepted-answer set for gap fill).
- Listening answers depend on audio meaning, not on visual guessing.
- Distractors are plausible but unambiguously wrong in context.
- B2 items test paraphrase, detail, purpose, attitude, and manageable inference; C1 stretch items may require denser discourse and subtler inference.
- Business contexts include meetings, scheduling, HR, sales/services, travel, projects, and workplace communication.
- General contexts include study, travel, services, technology, plans, and everyday/non-specialist work.
- Every item is reviewed for grammar, answer-key integrity, cultural neutrality, and accidental ambiguity before release.

## 10. Design requirements

- Clean exam-style interface without copying Cambridge trade dress or logos.
- Friendly feedback colour system that does not rely on colour alone.
- Minimum 44×44 CSS-pixel tap targets.
- Readable at 320 CSS pixels wide without horizontal scrolling.
- Persistent but unobtrusive progress and timer indicators.
- Respect reduced-motion preferences.
- Keyboard support and visible focus states for desktop users.
- Semantic headings, labels, form controls, and screen-reader announcements.

## 11. Privacy and safety

- No account, cookies for tracking, analytics, ads, or external data collection in the MVP.
- Do not include the learner's email, booking reference, or other personal information.
- Only the first name “Jasmine” appears in encouragement copy, with owner approval.
- GitHub repository and site assets are public; secrets and API keys must never be committed.
- Include an independent-study disclaimer and links to official Cambridge materials.

## 12. Success criteria

### Release readiness

- All four domains are reachable and contain validated original practice.
- Business has enough breadth for meaningful practice before General is expanded to parity.
- Practice and Mock modes behave as specified.
- Progress survives reload and PWA relaunch on the same device.
- Listening works on current iOS Safari and Android Chrome after a user gesture.
- No API keys, personal information, copyrighted sample questions, or broken asset paths are present.
- Core pages meet a basic automated accessibility check and manual phone-size review.

### Learner-facing indicators

- Completed questions and task-type coverage.
- Accuracy and trend over recent attempts.
- Weakest two task types once minimum evidence exists.
- Practice band with confidence language based on sample size.
- Clear next recommendation.

## 13. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Learner mistakes practice result for an official score | Use “practice band/readiness,” repeated disclaimer, no official-looking certificate |
| TTS sounds unnatural or gives away answers | Blind listening review, multiple voices, pronunciation QA, regenerate failed assets |
| Question ambiguity | Structured authoring schema, independent answer-key review, item versioning |
| Limited time before tests | Business-first milestone, ship a useful vertical slice before expanding volume |
| GitHub Pages path/caching errors | Base-path-safe URLs, service-worker scope tests, versioned cache names |
| Device storage pressure from audio | On-demand caching, bounded cache, clear offline-download controls |
| Progress lost on clear data/new phone | Explain local-only storage; optional JSON export/import |
| Public repository exposes a secret | Generation is build-time only; secret scan and repository review before push |

## 14. Milestones

1. **Foundation:** PRD, technical specification, content schema, TTS decision, visual system.
2. **Business vertical slice:** home, one complete Business Listening flow, one Business Reading flow, local progress.
3. **Business breadth:** current task-type coverage, Business mini-mock, reviewed audio.
4. **General parity:** equivalent General content and mini-mock.
5. **PWA and QA:** offline behaviour, mobile/accessibility testing, data migration/reset.
6. **Publish:** public GitHub Pages URL, final privacy/secret/copyright review.

## 15. Definition of done

- The public HTTPS URL opens successfully on a phone.
- The site is responsive, installable, and usable without an account.
- Each of the four domains has practice and mock content with correct scoring and explanations.
- Listening assets are clear, appropriately paced, and disclosed as AI-generated.
- Local progress, review flags, rotating messages, and date-aware recommendations work.
- Offline-ready content is accurately indicated and loads after reconnect/relaunch tests.
- Automated data validation and core interaction tests pass.
- Manual QA covers representative iOS/Android phone widths, audio playback, reload, and update behaviour.
- The repository contains no credentials, personal booking data, or copied Cambridge questions.
- The About page states that the tool is independent, unofficial, educational, and does not issue an official score.

