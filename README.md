# Portfolio repository

The production portfolio and its interactive projects share this repository. Each source project has a separate build boundary.

| Project | Canonical source | Deployment / validation |
| --- | --- | --- |
| Portfolio, Vector Tennis / VectorCourt | `arjan-portfolio` | Next.js application; `npm ci`, `npm run verify`, `npm run start` |
| Rally House, Championship, Performance Lab | `rally-house-source-v16/src` | TypeScript source; compiled runtime is mirrored into `arjan-portfolio/public/rally-house` |
| HoloAnatomy atlas and shoulder studio | `arjan-portfolio/public/holoanatomy` | Attributed local anatomy assets and browser modules; isolated shoulder runtime under `shoulder/` |
| REPLISOME | `replisome-source` | Independent TypeScript/Vite project; portfolio embed under `arjan-portfolio/public/replisome` |
| Other research and portfolio work | Named case studies and libraries under `arjan-portfolio` | Retain independent scientific and project boundaries |

Use the Node version supported by each project's package dependencies. Install using its committed lockfile. From `arjan-portfolio`, run `npm run verify` for lint, TypeScript, coverage tests and the production build. Run `npm run test:shoulder` for geometry/provenance, interaction and learning-domain checks. From `replisome-source`, run `npm test` and `npm run build`.

From `rally-house-source-v16`, run `npm ci`, `npm test` and `npm run release:check`. The release check builds source, compares the complete served module set and static entry/CSS bytes, and validates relative imports. Required compiled JavaScript is versioned because the portfolio serves it as a static application. After an intentional source change, use `npm run release:sync`, inspect the source and served changes together, and run the check again.

For isolated Rally House browser checks, start `PORT=18080 npm run serve`. Use `QA_BASE_URL=http://127.0.0.1:18080 QA_OUT=/tmp/rally-house-qa node qa/same-world.mjs` for club → Challenge → Championship → Return → Performance Lab → exit and repeated matches. `qa/session-lifecycle.mjs` accepts the same base URL and checks 32 repeated match sessions, pause/resume, court ownership, input, camera and transient audio cleanup. `qa/object-browser.mjs` accepts both variables for native object actions, touch and accessibility. Browser QA needs Playwright and a compatible installed browser; the runtime helper also supports `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE`.

For shoulder browser QA, serve the portfolio's `public` directory with `node tools/shoulder/serve.mjs` from `arjan-portfolio`, then run `npm run test:shoulder:browser`. Optional `SHOULDER_URL`, `QA_OUT` and `CHROMIUM_EXECUTABLE` select an isolated server, evidence directory and browser executable. The managed Playwright browser is the default. On this Mac, `QA_METAL=1` selects the native Metal backend used for the successful full visual/interaction run; the default graphics path timed out. `QA_SCREENSHOTS=0` runs functional assertions without claiming screenshot validation. For Vector Tennis control QA, run the portfolio production server and `VECTOR_URL=http://127.0.0.1:3000/playground/vector-tennis node tests/vector-tennis-controls.browser.mjs`.

Historical prototypes and patch kits are not additional production trees. Start with [the consolidation audit](REPOSITORY-CONSOLIDATION-AUDIT.md), [cleanup manifest](REPOSITORY-CLEANUP-MANIFEST.md), [recovery catalog](archive/consolidation-20261017/RECOVERY-CATALOG.md) and [validation record](REPOSITORY-CONSOLIDATION-VALIDATION.md). Unique historical text has an indexed, content-addressed home under `archive/`; original containers, personal media and unresolved cloud files have an explicit local recovery vault. Verify the versioned archive with `python3 tools/consolidation/verify-archive.py`.
