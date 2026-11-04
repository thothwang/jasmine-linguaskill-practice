# Jasmine's Linguaskill Practice — Technical Specification

Status: Draft for implementation  
Date: 2026-10-31 (Asia/Taipei)

## 1. Architecture decision

Build a static, phone-first progressive web application for GitHub Pages. Use buildless HTML/CSS/JavaScript modules unless implementation needs justify a small bundler later. All question content and generated audio are deployed as static assets. All learner state stays in the browser.

This architecture intentionally has:

- No server runtime.
- No database or authentication.
- No API key in client code.
- No runtime TTS or LLM dependency.
- No tracking or analytics in the MVP.

GitHub Pages directly hosts static HTML, CSS, JavaScript, and assets and supports HTTPS. See [GitHub: What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) and [GitHub: Securing Pages with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

## 2. Proposed repository layout

```text
/
  docs/
    PRD.md
    TECH_SPEC.md
  src/
    index.html
    styles/
      tokens.css
      base.css
      components.css
    js/
      app.js
      router.js
      store.js
      selector.js
      scoring.js
      audio-player.js
      pwa.js
      views/
      components/
    content/
      manifest.json
      business-listening.json
      business-reading.json
      general-listening.json
      general-reading.json
    assets/
      audio/
      icons/
  public/
    manifest.webmanifest
    service-worker.js
  scripts/
    validate-content.mjs
    build-static.mjs
    generate-audio.*
  tests/
    content-validation/
    unit/
    e2e/
  dist/                 # generated deployment output
```

The final layout may be flattened for a completely buildless deployment, but source and generated audio should remain clearly separated.

## 3. Runtime model

### 3.1 Application shell

- Single-page app with history/hash-safe routing. Hash routing is the lowest-risk option for GitHub Pages project sites because direct deep links do not require server rewrites.
- Semantic server-independent `index.html` containing a functional loading/failure state.
- ES modules loaded with relative, repository-subpath-safe URLs.
- CSS custom properties define colour, spacing, typography, radius, shadow, and motion tokens.

### 3.2 Data flow

```text
Static JSON bank -> schema validation -> app content loader
                                      -> item selector
Local state ------> migration/store --> item selector + dashboards
Selected task ----> question player --> attempt record --> local state
Audio manifest ---> controlled player -> playback record
```

### 3.3 Browser support target

- Current iOS Safari.
- Current Android Chrome.
- Current desktop Chrome/Edge/Safari for secondary use.
- Graceful non-PWA operation when installation is unsupported.

## 4. Content model

### 4.1 Content manifest

```json
{
  "schemaVersion": 1,
  "contentVersion": "2026.10.31.1",
  "generatedAt": "2026-10-31T00:00:00+08:00",
  "banks": [
    {
      "id": "business-listening",
      "url": "./content/business-listening.json",
      "sha256": "optional-build-time-integrity-value"
    }
  ]
}
```

### 4.2 Task-set schema

A task set groups a shared passage/audio and one or more questions.

```json
{
  "id": "bl-two-mcq-001",
  "version": 1,
  "domain": "business",
  "skill": "listening",
  "taskType": "two_question_multiple_choice",
  "difficulty": "B2",
  "tags": ["scheduling", "paraphrase", "corrected-information"],
  "title": "Rescheduling a supplier visit",
  "sceneSetter": "You will hear two colleagues discussing a supplier visit.",
  "instructions": "Choose the best answer for each question.",
  "preparationSeconds": 15,
  "audio": {
    "src": "./assets/audio/bl-two-mcq-001.mp3",
    "durationSeconds": 64,
    "maxPlays": 2,
    "aiGenerated": true,
    "speakers": ["Maya", "Daniel"]
  },
  "transcript": "Hidden until permitted by mode.",
  "questions": [
    {
      "id": "bl-two-mcq-001-q1",
      "prompt": "Why has the visit been moved?",
      "responseType": "single_choice",
      "options": [
        {"id": "A", "text": "..."},
        {"id": "B", "text": "..."},
        {"id": "C", "text": "..."}
      ],
      "answer": {"optionId": "B"},
      "evidence": {"transcriptQuote": "...", "startSeconds": 19, "endSeconds": 25},
      "explanation": {
        "zhHant": "...",
        "en": "...",
        "distractors": {"A": "...", "C": "..."},
        "strategy": "...",
        "vocabulary": [{"term": "bring forward", "meaningZhHant": "提前"}]
      }
    }
  ],
  "quality": {
    "authorReview": "approved",
    "answerReview": "approved",
    "audioReview": "approved"
  }
}
```

### 4.3 Response types

- `single_choice`
- `gap_text` with accepted exact/case-normalised forms and a three-word maximum where applicable
- `matching` with unique option constraints determined by task definition
- `sequence_completion` if needed for missing sentence/paragraph tasks

Every scorer must operate from explicit schema fields rather than parsing display text.

### 4.4 Content validation

Build/deployment fails when:

- IDs are missing or duplicated.
- A single-choice answer does not reference an option.
- Required explanations are missing.
- A listening item lacks audio metadata or transcript.
- A gap answer exceeds the task word limit.
- A format-aligned General Listening family is missing, a picture item lacks three image options, or multi-question evidence is not in question order.
- Difficulty/domain/skill/task type values are invalid.
- Referenced audio files do not exist.
- A mock set cannot meet its declared question/task distribution.

## 5. Local state

### 5.1 Storage keys

- `jlp.settings.v1`
- `jlp.progress.v1`
- `jlp.session.v1` for resumable in-progress practice, if enabled
- `jlp.messageDeck.v1`

Use a short namespace and version every persisted payload.

### 5.2 Progress schema

```json
{
  "schemaVersion": 1,
  "contentVersionSeen": "2026.10.31.1",
  "createdAt": "2026-10-31T00:00:00.000Z",
  "updatedAt": "2026-10-31T00:00:00.000Z",
  "attempts": [
    {
      "attemptId": "uuid",
      "questionId": "bl-two-mcq-001-q1",
      "taskSetId": "bl-two-mcq-001",
      "mode": "practice",
      "answeredAt": "2026-10-31T00:00:00.000Z",
      "correct": true,
      "response": "B",
      "elapsedMs": 18000,
      "playsUsed": 1,
      "contentVersion": "2026.10.31.1"
    }
  ],
  "flaggedQuestionIds": [],
  "domainStats": {},
  "taskTypeStats": {}
}
```

Keep raw attempts bounded, for example the most recent 2,000, while retaining aggregate statistics. On malformed state, preserve a downloadable recovery copy when practical, then initialise safe defaults.

### 5.3 Migration

- Parse under `try/catch`.
- Validate schema version.
- Apply ordered pure migrations.
- Never delete old state until the new payload has been written and verified.
- Content updates preserve attempts by immutable question ID and item version.

## 6. Adaptive-like selector

This selector personalises practice; it is not a psychometric CAT and must not be described as one.

### 6.1 State per domain/task type

- Attempts and correct count.
- Exponentially weighted recent accuracy.
- Last practised timestamp.
- Current working difficulty: `B2`, `B2_PLUS`, or `C1`.
- Consecutive correct/incorrect count.
- Coverage count and confidence category: `insufficient`, `developing`, `supported`.

### 6.2 Selection outline

1. Build eligible unseen/review-due sets for the selected domain and skill.
2. Assign priority weights:
   - Under-sampled task type: high positive weight.
   - Weak recent accuracy: positive weight.
   - Due mistake review: positive weight in review-aware sessions.
   - Recently seen item: large negative weight.
   - Target difficulty mismatch: negative weight.
3. Weighted-randomly select a task set to avoid a deterministic loop.
4. Update working difficulty after enough evidence:
   - Two or three consecutive correct responses with supported coverage may raise one step.
   - One incorrect response at C1 lowers to B2+ for confirmation.
   - Repeated B2 errors retain B2 and vary task/context rather than dropping below the product's target scope.
5. Periodically force breadth across task types.

### 6.3 Readiness display

Never transform accuracy directly into a Cambridge score. Display:

- `Building evidence` when sample size or task coverage is insufficient.
- `B2 skills developing`, `B2 practice range`, or `B2+/C1 stretch` based on transparent local thresholds.
- Sample size and coverage alongside any band.
- A fixed note: “Practice estimate only; not an official Cambridge result.”

## 7. Audio system

### 7.1 Asset production

- Generate audio at build time or as a controlled content-production step.
- Store no API keys in repository files, logs, commits, browser code, or generated metadata.
- Prefer one final compressed asset per task set.
- For multi-speaker dialogue, render speakers separately when necessary, then concatenate with controlled pauses and loudness normalisation.
- Preserve generation metadata outside the public learner payload when it includes provider details not needed at runtime.

### 7.2 Runtime state machine

```text
idle -> preparing -> ready -> playing -> completed
                         |        |          |
                         |        -> error --+
                         -> error
completed -> ready (only when playsUsed < maxPlays)
```

- Audio starts only after an explicit user gesture for mobile browser compatibility.
- In Mock mode, do not expose the native audio element's seek or speed UI.
- Increment play count when meaningful playback starts; define a small grace period for accidental taps/network failure.
- Pause playback when the page is backgrounded; resume policy must be explicit and tested.
- Do not reveal transcript/evidence before the mode permits it.
- Preload metadata, not every MP3, to protect mobile bandwidth.

### 7.3 Accessibility

The transcript is a learning accommodation in Practice review, but hidden during active mock questions. Controls require accessible names, status announcements, visible focus, and non-colour play-count feedback.

### 7.4 AI disclosure

Show a persistent About-page statement and a short first-use notice: “Listening voices are AI-generated for original practice material; they are not recordings from a Cambridge exam.”

## 8. Practice and mock session engines

### 8.1 Practice

- Persist after every submitted response.
- Explanations are rendered only after scoring.
- Retrying creates a new attempt linked to the same item; it does not overwrite history.
- `Continue` calls the selector with updated state.

### 8.2 Mock

- Mock manifest declares task-set IDs, distribution, duration, and mode rules.
- Shuffle answer options only when item metadata explicitly permits it.
- Save answers locally as the learner proceeds so an accidental reload can offer safe resume.
- Completion freezes the result; review displays all tasks and explanations.
- A mock result includes accuracy and task coverage, not an official-score conversion.

## 9. Recommendation engine

Date priority in Asia/Taipei:

```text
date <= 2026-11-04: prioritise Business, then weakest Business skill
2026-11-05..2026-11-07: prioritise General, then weakest General skill
date > 2026-11-07: prioritise globally weakest supported task type
```

If local evidence is insufficient, recommend a balanced diagnostic. User choice always overrides the recommendation.

## 10. Rotating message deck

- Store messages with `phase`, `domain`, `tone`, and stable ID.
- Filter by date phase, then use a shuffle-bag algorithm.
- Persist remaining IDs and last-shown ID locally.
- When the bag empties, reshuffle while preventing the previous message from becoming first.
- Provide a generic fallback when storage is unavailable.

## 11. PWA and caching

### 11.1 Manifest

- `name`, `short_name`, `start_url`, `scope`, `display: standalone`, theme/background colours, and maskable icons.
- Paths must work under a GitHub project subpath, not assume `/` is the repository root.

### 11.2 Service worker strategy

- **Application shell:** cache-first with versioned precache.
- **Content JSON:** stale-while-revalidate, with schema/content-version compatibility check.
- **Audio:** cache-on-success/on-demand; optional “Download this mock” prefetch.
- **Navigation:** serve cached shell when offline.
- **Failed requests:** friendly offline/error state; never silently substitute a transcript for audio.

### 11.3 Cache lifecycle

- Cache names include application/content version.
- Activate removes obsolete app-shell caches but preserves current audio until storage policy evicts it.
- Use `navigator.storage.estimate()` where supported to show/download responsibly.
- An update banner lets the learner finish an active mock before reloading the new version.

## 12. Security and privacy

- Strictly static deployment; no secret-dependent runtime features.
- Add a restrictive Content Security Policy compatible with self-hosted assets.
- Avoid third-party fonts/scripts; use a system font stack.
- Escape learner-visible dynamic strings; do not render question content with unsafe HTML.
- Validate imported progress JSON before use.
- Run secret scanning or at least repository grep for common credential patterns before publication.
- Do not embed booking screenshot, email, order number, or other personal data.

## 13. Accessibility implementation

- Target WCAG 2.2 AA principles for core flows.
- Semantic `button`, `fieldset`, `legend`, `label`, and heading structure.
- One clear page-level heading per view.
- Live regions for answer feedback, timer warnings, and audio state, used sparingly.
- Focus moves predictably on navigation and feedback reveal.
- Tap targets at least 44×44 CSS pixels.
- Contrast checked for normal, hover, focus, correct, and incorrect states.
- Reduced-motion media query disables celebratory/transitional motion.
- Timer warnings are visual and announced, not sound-only.

## 14. Performance budgets

- Initial compressed application shell: target under 250 KB excluding audio.
- Initial route should not fetch the entire audio library.
- Largest Contentful Paint target under 2.5 seconds on a typical 4G phone after first connection, where practical.
- Avoid layout shifts by reserving component dimensions.
- MP3/AAC assets use speech-appropriate bitrate; verify intelligibility before aggressive compression.
- Lazy-load explanations and task banks by domain if the bank becomes large.

## 15. Build and deployment

### 15.1 Build

1. Validate content JSON and referenced assets.
2. Copy source/static assets into `dist/` with repository-subpath-safe references.
3. Generate content/app version markers and service-worker precache list.
4. Run unit/content checks.
5. Scan `dist/` and tracked files for credentials/personal booking data.

### 15.2 GitHub Pages

- Publish `dist/` through a GitHub Actions workflow or a dedicated Pages branch.
- Prefer Actions for repeatable validation before deploy.
- Enforce HTTPS.
- Do not place secrets in the Pages environment; TTS generation remains a separate local/controlled workflow.
- Use only original/public-safe assets because Pages output is publicly accessible even when some repository configurations are private. See [GitHub: Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

## 16. Testing strategy

### 16.1 Content tests

- Schema validation and unique IDs.
- Answer keys reference valid responses.
- Gap-fill normalisation and word-count boundary tests.
- All audio/transcript/evidence references exist.
- Mock distributions satisfy declarations.

### 16.2 Unit tests

- Selector difficulty movement, breadth forcing, and no-immediate-repeat behaviour.
- Scoring for every response type.
- Local-state migration, malformed-state recovery, and bounded history.
- Message shuffle bag and date-phase selection using Asia/Taipei dates.
- Recommendation cutovers around 2026-11-04 and 2026-11-07.

### 16.3 Interaction/e2e tests

- First visit, disclosure, and diagnostic start.
- Practice feedback gating.
- Mock feedback/transcript gating.
- Audio two-play limit and failure recovery.
- Reload/resume during practice and mock.
- Review filters, flag/retry, reset confirmation.
- Offline shell, cached content, and not-yet-downloaded audio error.
- PWA update while a mock is active.

### 16.4 Manual QA matrix

| Area | Required checks |
|---|---|
| iOS Safari | User-gesture audio, lock/background interruption, add-to-home-screen, local storage |
| Android Chrome | Audio, install prompt/path, offline relaunch, local storage |
| 320–430 px widths | No horizontal scroll, readable options, timer/progress fit |
| Keyboard desktop | Complete flows without pointer; visible focus |
| Screen reader smoke test | Labels, option grouping, feedback and audio state |
| Content | Independent answer-key review and audio/transcript match |

## 17. Observability without analytics

The public MVP sends no telemetry. Provide a local-only Diagnostics/About panel with:

- App/content version.
- Service-worker/cache status.
- Stored attempt count and approximate storage use.
- Exportable redacted diagnostic JSON that contains no answer history unless the learner explicitly chooses to include it.

## 18. Release gates

1. No credential or personal-data findings.
2. All content validation passes.
3. Representative item from each supported response type scores correctly.
4. All public audio has passed transcript, pronunciation, loudness, and answer-leak review.
5. Phone-size manual QA passes for core Practice and Mock flows.
6. Offline/update behaviour does not lose progress.
7. Disclaimer and AI-voice disclosure are visible and accurate.
8. Deployed HTTPS URL and asset paths are verified under the GitHub project subpath.

## 19. Open implementation decisions

- Final TTS provider/model and voice mapping after blinded quality/cost evaluation.
- Whether to use a small build tool or remain entirely buildless.
- Exact first-release bank size by task type after content-review capacity is known.
- Whether progress export/import is MVP or immediate follow-up.
- Whether mock timing uses fixed pedagogical durations or configurable approximations; it must not imply exact replication without verified official rules.

