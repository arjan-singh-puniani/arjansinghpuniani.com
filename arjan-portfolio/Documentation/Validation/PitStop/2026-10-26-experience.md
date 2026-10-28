# Pit Stop Lab — direct interaction and visible data flow

26 October 2026. Local implementation only; no push or production deployment. Existing unrelated Rally House edits were left alone. RTK is unavailable, so native tools were used.

## Result

Removed the route's large introductory and case-study sections and the scene/strategy slogans. A compact route toolbar now leads directly into the lab. Added an explicit camera-guided Watch action, safe looping, quick clean/gun/traffic/double-stack experiments and real clean-run reference ghosts. Added a direct Data → decisions entry, selectable source/calculation graph, actual record samples, upstream/downstream dependency highlights and a source-to-scene return action. Ranked strategies now offer nominal race playback with pause, scrubbing and action comparison against the baseline/rivals.

The graph identifies the four historical OpenF1 streams as one provider, separately identifies pit simulation and operator assumptions, and routes weather into a dry-condition gate rather than claiming it is a learned weather forecast. Counts, stop timings, validation error and decisions come from the existing models. Connectors animate only while calculating; there is no fabricated live feed.

New modules: `experience.js` chooses event-derived watch shots; `data-experience.js` manages graph inspection and nominal replay. `intelligence.js` exports pure `raceProfile` and `raceFrame` functions. Integration updates reach `main.js`, `intelligence-ui.js`, `index.html`, `style.css`, the public route and its CSS, domain tests, browser QA and `MODEL.md`. No new dependency, 3D asset or AI service was added.

## Validation

- `npm test -- --maxWorkers=1 --testTimeout=15000 --reporter=dot`: **131 tests passed in 12 files**. Four new tests cover nominal pit holds/lap accounting, deterministic backward seeking/start gaps/finishes, service effects versus stay-out, and actual watch-camera event boundaries. An earlier unrestricted parallel run hit the existing 5-second component-test and worker-start timeouts during host contention; the serialized run passed without changing repository test configuration.
- `npm run typecheck`: passed.
- `npm run lint`: passed, 0 errors and 14 existing Holoanatomy/Rally House warnings. Public pit-lab modules remain excluded by the existing ESLint configuration; they are checked through parsing, domain tests and browser execution.
- `npm run build`: passed; 33 static pages. The compact public route is generated with its existing canonical and iframe integration.
- `node --check` for new and touched browser modules: passed.
- Scoped `git diff --check`: passed.
- `node tools/pit-stop/experience-qa.mjs`: **21 checks passed**, no runtime errors; seven screenshots. Covers guided camera advancement, manual takeover, quick experiment timing, pinned ghost, safe loop restart, one-action calibration/evaluation, real source counts, all nine graph edges, sample inspection, dependency tracing, weather role, replay pause/seek, alternate actions, scene return, non-overlapping mobile controls, 390/320 px flow layout, and safety holds never restarting into a fabricated release.

The browser run briefly encountered an automatic approval-review timeout; the allowed retry succeeded. Earlier browser assertions were corrected to sample camera state atomically and compare the actual seeded gun-delay delta rather than assuming a fixed 0.900 s total (the other corners' slack matters). A timing-boundary wait was extended under host contention; the final safety-loop assertion passed. The watch camera target is evaluated after the simulation clock advances, keeping direction and chapter text on the same timestamp.

The existing intelligence and complete-lab browser suite results, plus final artifact locations, are recorded below after execution.

## Run

From `arjan-portfolio/`:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory public
# Separate terminal, after npm run build:
npm run start -- --hostname 127.0.0.1 --port 4174
# Separate terminal:
node tools/pit-stop/experience-qa.mjs
node tools/pit-stop/intelligence-qa.mjs
node tools/pit-stop/browser-qa.mjs
```

`PIT_EXPERIENCE_EVIDENCE` overrides the new suite's output directory. Source/math/uncertainty limits and all other run variables are documented in `public/pit-stop-lab/MODEL.md`.

## Limits

The race replay is a schematic central-model trace at 120×, with explicit pit holds; it excludes the Monte Carlo model/residual/event draws and does not claim physical overtaking or calibrated race-win outcomes. The 3D stop remains a generic educational simulation. Live data, proprietary telemetry, Safari, physical mobile hardware and hardware frame-rate targets were not newly validated. The root `test:e2e` entry point is still unconfigured; the dedicated scripts are the executed browser checks. Owned preview servers are stopped during final teardown.

## Final regression and preview artifacts

- `node tools/pit-stop/intelligence-qa.mjs`: **23 checks passed**, no runtime errors; six screenshots. Historical training, imports/exports, failed-request recovery, invalidation, probability scope, safety gating, mobile, fallback and production iframe still work.
- `node tools/pit-stop/browser-qa.mjs`: **53 checks passed**, no runtime errors or missing resources; seventeen screenshots. Existing geometry, all scenarios/cameras, event timing, seeking, telemetry, uncertainty experiments, pinned ghosts, synthetic strategy, responsive controls, fallback, canonical and public integration remain intact.
- Total rendered checks: **97** across the three dedicated suites.
- Additional Chromium capture verified that the old “small world” heading is absent on the local production page and the iframe starts at **131 px** in a 1440 × 1000 viewport. Screenshot: `08-compact-production-route.png`.
- Recorded `watch-stop.webm` directly from the running app in a 1280 × 800 Chromium viewport, golden-hour lighting, actual camera-guided stop at 0.5×. This is an application capture, not a generated concept video. The browser uses SwiftShader software rendering; the world regression sampled 11 fps, so this does not establish hardware smoothness or performance targets.

Seven interaction screenshots, the compact route capture, the watch video, new QA report, and both regression reports are retained outside the repository at:

`/Users/arjan/.codex/visualizations/2026/10/24/01a16fd8-9529-7623-b5b8-c9e9ddd053a5/pit-experience-2026-10-26/`

The local production build is a verification server, not a deployment. No remote publication has occurred. Owned servers were stopped after capture.
