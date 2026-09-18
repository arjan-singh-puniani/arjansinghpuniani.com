# HoloAnatomy integration

Source: supplied `holoANATOMY/holo-v04`, version 0.4.0.

- Website entry: `/playground/holoanatomy`, linked from Playground and sitemap.
- Standalone viewer: `/holoanatomy/index.html`.
- Runtime, styles, and 261 BodyParts3D meshes live in `public/holoanatomy`.
- The iframe keeps viewer CSS, events, and WebGL state separate from the portfolio. Anatomy loads only when the viewer is visited; no package dependencies were added.
- Entry assets use relative paths. Mesh URLs resolve relative to the manifest module, so they work inside the website subdirectory.
- Original license and anatomy provenance are included. The original source folder is unchanged.

## Verify

Run `npm run build`, then `npm run start -- --hostname 127.0.0.1 --port 4187`.
In another terminal, run `node scripts/check-holoanatomy.mjs` (requires installed Playwright Chromium). Override the origin with `HOLOANATOMY_TEST_URL` if needed.
The browser check covers existing routes, navigation, all three exhibits, quizzes, mobile overflow, browser exceptions, and missing local assets. It blocks the remote mesh mirror to verify the bundled anatomy is sufficient.

## Update

Copy a future release's runtime files and anatomy into `public/holoanatomy`, preserving the relative stylesheet/script URLs in `index.html` and module-relative `localUrl` in `src/anatomy/manifest.js`. Preserve the canonical URL, readable loading-error message, license, and provenance. Re-run the checks before deployment.

## Roll back only this integration

Remove `public/holoanatomy`, `src/app/playground/holoanatomy`, and `scripts/check-holoanatomy.mjs`; remove the HoloAnatomy Playground card, sitemap entry, and ESLint ignore entry. Do not reset other changes in this working tree.

No deployment is performed by this integration.
