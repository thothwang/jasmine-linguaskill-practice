# Jasmine's Linguaskill Practice

A phone-first practice site for Cambridge Linguaskill preparation, covering:

- Business Listening
- Business Reading
- General Listening
- General Reading

The original bank contains 32 task sets and 111 scored responses, with a B2+/Cambridge 160+ study target. Listening recordings are generated from original fictional scripts; this project does not reproduce Cambridge past papers.

## Local checks

```powershell
node scripts/validate-content.mjs
node tests/site/logic.test.mjs
node scripts/tts/test-wav.mjs
node scripts/build-static.mjs
```

The static production output is written to `dist/`. GitHub Pages deployment is handled by `.github/workflows/pages.yml`.

## Important notice

This is an independent personal practice resource. It is not affiliated with, endorsed by, or scored by Cambridge University Press & Assessment. Practice results are not official Cambridge scores.
