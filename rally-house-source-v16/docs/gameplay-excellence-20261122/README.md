# Rally House playable gameplay slice

Start with [audit and architecture](AUDIT.md), [reference decisions and priorities](REFERENCE-MATRIX.md), [implemented features and results](RESULTS.md), [latest browser polish](TESTER-POLISH.md), and [neutral playtest protocol](PLAYTEST.md).

This branch is an experiment ready for evaluation, not a production release or a claim that fun has been proven. The canonical dirty checkout and production site were preserved.

## Run locally

From `rally-house-source-v16`:

```sh
npm run release:sync
PORT=18132 node qa/serve.mjs
```

Open `http://127.0.0.1:18132`. The separate port keeps the preview’s schema-12 save away from the existing production/local game. A tester should start with fresh browser storage on this preview origin, without importing a valued production save.

Run `python3 qa/package-playtest.py` to reproduce the complete asset-bearing ZIP. A portable static preview ZIP is also generated locally under `evidence/gameplay-slice-20261122`. Extract it, enter its `Rally-House-v16-Playtest` directory, and run:

```sh
python3 -m http.server 18132 --bind 127.0.0.1
```

Open the same local URL. Opening `index.html` directly as a file is unsupported. This package is not publicly hosted; do not send localhost links to remote testers as if they were public URLs.

## Reproduce evidence

With the preview running, use an installed Playwright via `PLAYWRIGHT_MODULE` if it is not available in the game package:

```sh
npm run test:slice
node tests/arcade-feel.mjs
node tests/impact-feel.mjs
node tests/court-sound.mjs
node qa/tactical-play.mjs http://127.0.0.1:18132 evidence/recheck/chromium chromium
node qa/tactical-play.mjs http://127.0.0.1:18132 evidence/recheck/webkit webkit
node qa/impact-audio.mjs http://127.0.0.1:18132 evidence/recheck/audio current chromium
node qa/sustained-play.mjs http://127.0.0.1:18132 evidence/recheck/soak 600 chromium
node qa/sustained-play.mjs http://127.0.0.1:18132 evidence/recheck/soak-webkit 600 webkit
node qa/webkit-media-controls.mjs evidence/recheck/webkit-native-media.json
node qa/championship-followup.mjs http://127.0.0.1:18132 evidence/recheck/followup
npm run release:check
```

Run performance sessions sequentially; other heavy processes affect the measurements. Browser artifacts identify emulation explicitly. No results have been substituted for unavailable physical hardware or external players.
