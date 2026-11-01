# Jasmine's Linguaskill Practice

A phone-first practice site for Cambridge Linguaskill preparation, covering:

- Business Listening
- Business Reading
- General Listening
- General Reading
- Business and General vocabulary review

The original bank contains 136 task sets and 631 scored responses. The separate vocabulary library contains 5,043 entries, including a 767-word exam-sprint collection, optional Traditional Chinese hints, pronunciation, examples, swipe grading, and local spaced review. Listening recordings are generated from original fictional scripts; this project does not reproduce Cambridge past papers.

Vocabulary selection is derived from the NGSL, BSL, and NAWL open lists. Dictionary enrichment uses ECDICT, and attributed example sentences use Tatoeba. Full licence and attribution notes are in `docs/content/VOCABULARY_SOURCES.md`.

## Local checks

```powershell
node scripts/validate-content.mjs
node tests/site/logic.test.mjs
node tests/site/vocabulary.test.mjs
node scripts/tts/test-wav.mjs
node scripts/build-static.mjs
```

The static production output is written to `dist/`. GitHub Pages deployment is handled by `.github/workflows/pages.yml`.

## Important notice

This is an independent personal practice resource. It is not affiliated with, endorsed by, or scored by Cambridge University Press & Assessment. Practice results are not official Cambridge scores.
