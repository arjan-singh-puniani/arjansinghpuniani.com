# Tennis-first walkthrough review · 23 November 2026

The user reports testers kept playing, shared Rally House with friends and requested broader social activities. These are secondhand observations without participant counts or timings. The user wants tennis to remain the focus. The playtest protocol records that direction; no new social mechanics were added.

## Changes

- Replaced five outdated walkthrough images with captures of the current feature build: isometric club, member challenge, serve contact, completed point and recorded swing analysis.
- Championship highlights both Swing and Lob. The existing capture helper computes their combined bounds.
- Instructions include immediate Play tennis entry, drive/lob controls and recovery purpose. Replay copy and metadata explicitly describe the character's in-game motion and rig-derived angles.
- Preserved the approved headline, four-step layout and gameplay.

## Verification

- `capture/capture.json`: actual Championship recording, player and opponent contact callbacks, 146 samples, zero rig offset; no browser errors. Replay hides ambient actors and restores them without moving them.
- `verification.json`: desktop Chromium 1440×900; touch-emulated WebKit 402×874 and 320×740. All six image instances loaded, three callouts stayed inside their images, no horizontal overflow or browser errors. Desktop opens the embedded game; touch opens the full-page game.
- Five existing Rally House component tests passed. The first run failed because linked local dependencies contain Vitest 4.0.8 while the repository expects 4.1.12 and configures OXC. A temporary config used equivalent automatic JSX with esbuild, the same jsdom environment, setup, alias and worker settings. No dependency or project configuration was changed.
- Targeted ESLint and `git diff --check` passed.
- First browser verification waited for lazy images without scrolling through them and timed out; the final script scrolls and decodes every image before asserting. Full-page captures wait for instant return to page top.

## Limits and recommendation

Ready for a further tennis-focused preview session. This does not establish an objective rating, admissions outcome or independently measured player retention. No physical iPhone, battery, heat or audio listening test was performed. No full production build or deployment was performed. Game code is unchanged from the previous WebKit smoothness fix; its ten-minute results remain documented in `../../docs/gameplay-excellence-20261122/WEBKIT-SMOOTHNESS.md` rather than being counted as a new run here.

Reproduce from the game root using the installed Playwright module:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node qa/landing-walkthrough.mjs http://127.0.0.1:18132 evidence/reviewer-walkthrough-20261123/capture
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node evidence/reviewer-walkthrough-20261123/verify.mjs
```

The second command expects the isolated portfolio development server on port 18133. Screenshots contain development-server chrome where present.
