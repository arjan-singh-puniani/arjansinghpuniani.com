# Pit Stop Lab — historical ML and race decision support

Validated locally on 25 October 2026. Existing checkout and public `/playground/pit-stop` route retained. No push or deployment. RTK was unavailable; native commands were used. Existing unrelated Rally House changes were left alone.

## Delivered change

Strategy now opens an accessible decision room without replacing the miniature world or original synthetic sandbox. The room trains a regularized pace model on a bundled OpenF1 historical race, audits held-out accuracy, and compares supported compounds and pit windows in common seeded race futures. Real pit-stop duration/queue samples feed the decision, and unsafe retention blocks it. Historical refresh, local bundle import/export, decision export, tire-age support plots and uncertainty ranges work on desktop and mobile, with or without WebGL.

Changed implementation: `public/pit-stop-lab/intelligence.js` (pure data/ML/strategy), `intelligence-ui.js` (room and data controls), `data/bahrain-2024.json` (historical evidence), and integration in `main.js`, `index.html`, `style.css`, route metadata and `MODEL.md`. Added `tests/pit-intelligence.test.js` and `tools/pit-stop/intelligence-qa.mjs`. No dependency or framework changes.

## Calibration evidence

OpenF1 session 9472, Sakhir race, 2 March 2024. Snapshot retrieved 25 October 2026. SHA-256: `8c3380c7d5ba428d4609e61b4cdff365146bdd91634217d43c6d49301e63acd4`.

1,129 recorded laps → 974 accepted after 105 start/pit and 50 incident exclusions. Training: 745 laps through race lap 45. Validation: 229 later laps, 46–57. Held-out MAE 0.409521 s vs driver/compound training-mean baseline 0.828059 s. Bias +0.281370 s; P90 absolute error 0.860586 s. Outcome probabilities have not been calibrated against actual race wins. See `public/pit-stop-lab/MODEL.md` for equations, filters, features, uncertainty, source URLs and limitations.

## Executed checks

| Command/check | Result |
| --- | --- |
| `node --check public/pit-stop-lab/intelligence.js` and `intelligence-ui.js` | Passed |
| `npm test -- --reporter=dot` | 127 tests passed in 12 files; includes 9 new ML/decision tests |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed, 0 errors and 14 existing Holoanatomy/Rally House warnings |
| `npm run build` | Passed; 33 static pages generated |
| `node tools/pit-stop/intelligence-qa.mjs` | 23 checks passed; no application runtime errors; 6 screenshots |
| `node tools/pit-stop/browser-qa.mjs` | Existing lab suite: 53 checks passed; no runtime errors/missing resources; 17 screenshots |
| Real historical refresh from Chromium | Sessions, laps, stints, race-control and weather all returned HTTP 200; retraining succeeded with 745/229 split |
| Scoped `git diff --check` | Passed |

Public pit-lab modules are excluded by the repository's existing ESLint configuration. Their parsing, domain tests and actual browser execution provide the relevant checks. The repository-wide `test:e2e` entry point remains unconfigured (no Playwright config/e2e directory); its existing discovery failure was recorded in the earlier lab report. The two dedicated scripts above are the executed browser suites, not a claim that the root entry point passes.

Unit checks cover source joins, chequered/incident flags, pit/start exclusions, wet and mixed-session rejection, insufficient evidence, chronological isolation under held-out target perturbation, measured error/baseline, unsupported compounds, replay, probability/interval bounds, slower mechanical service, distinct full-lane transit loss, rival state, neutralisation, extrapolating rivals, holds and input/work limits.

New browser checks cover actual training, unsupported compound omission, modal semantics, all nine candidates, simulation-derived service variation, scoped probability language, evidence/decision exports, stale-result invalidation, changed transit assumptions, duplicate rivals, exact import replay, blank values, HTTP 429 and malformed-import recovery, 390/320 px layouts, sticky close control, Escape, safety holds, production iframe, reduced motion and WebGL fallback. External-network success was checked separately from deterministic failure mocks.

## Reproduce and evidence

From `arjan-portfolio/`, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory public
# In another terminal, after npm run build:
npm run start -- --hostname 127.0.0.1 --port 4174
# In another terminal:
node tools/pit-stop/intelligence-qa.mjs
node tools/pit-stop/browser-qa.mjs
```

Standalone: `http://127.0.0.1:4173/pit-stop-lab/`. Production embed: `http://127.0.0.1:4174/playground/pit-stop`. Select Strategy → Open decision room → Evaluate race futures. Change a race assumption to invalidate the recommendation; export decisions and calibration together to reproduce it.

`PIT_STOP_URL` and `PIT_STOP_PORTFOLIO_URL` override server origins. `PIT_INTELLIGENCE_EVIDENCE` controls the new suite's output directory. Final six screenshots, decision/data exports, browser report and real-network response report were retained outside the repository at:

`/Users/arjan/.codex/visualizations/2026/10/24/01a16fd8-9529-7623-b5b8-c9e9ddd053a5/pit-race-intelligence-2026-10-25/`

Owned preview servers were stopped after validation.

## Verification limits

This is an experimental dry-race, single-stop scenario model. Its score means finishing ahead of the entered rivals, not full-grid race-win probability. No operational race-winning improvement, cross-circuit generalization, proprietary telemetry, live feed, wet model, inventory/sporting eligibility, overtaking, retirement, energy deployment or safety-car pack compression is claimed. User-entered neutralisation likelihood and pit/traffic factors are assumptions. Residuals calibrate scenario noise; no independent strategy-outcome test set exists. Physical mobile hardware and Safari were not tested. Chromium uses SwiftShader software rendering; the existing world regression sampled 12 fps, so desktop/mobile frame-rate targets remain unverified. No new generated media or large model dependency was added.
