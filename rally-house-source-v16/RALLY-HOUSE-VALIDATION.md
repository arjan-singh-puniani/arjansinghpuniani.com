# Rally House validation — 6 October 2026

The October 9 Championship contact follow-up is recorded separately in [Championship impact](CHAMPIONSHIP-IMPACT-20261009.md), with its own dated evidence. The results below describe the October 6 pass.

All final automated checks listed below passed. Results refer to the isolated candidate branch, not physical phones or independent human play. Exact JSON and selected captures are in `evidence`.

| Check | Baseline | Candidate evidence |
|---|---|---|
| Game build and deterministic tests | 16 suites pass | 17 suites pass, including `tests/experience.mjs` |
| Portfolio lint/typecheck/coverage/build | 88 tests, 31 routes, 17 warnings, no errors | 91 tests in 9 files, 31 routes, 15 warnings, no errors |
| Source / served release | 57 artifacts match | Final `release:sync` / `release:check`: 57 match; relative imports resolve |
| Net routes | Missing collision constraint | 144 routes; actual crossing locomotion at 30/60/120 Hz; thin-obstacle segment regression |
| Walking / planted feet | Existing suite passes | 12 member/rate scenarios, starts/corners/stops; no measured stance slide in those fixtures |
| Contact / aiming / shot safety | Existing suites pass | Existing physical capture/release and 180 safe-flight tests pass; six interception cases, 33–35 contacts each |
| New surface action | Floor/effect mismatch | Real Game bell approach, hand gap below .12, physical effect anchor, receipt and cancellation checks |
| Reach release | New candidate first release popped | Target tail regression passes; per-frame bound and eventual transient cleanup |
| Championship memory | No player completion card | Final-callback race, exact-once ticks, equal-score rematches and serialized context tests pass |
| Browser persistence | Existing storage tests | Complete 7–0, await save, reload, same event ID/score and member card; no active court reservation |
| Landing forecast | Absent | Nine exact discrete forecasts at three rates; stopped/invalid states return no cue |
| Early swing cue | Delayed first return misses in bot matrix | Three-rate delayed-intent regression passes without pre-bounce contact |
| Tuning | 216 baseline scenarios | Controlled movement/feed profiles and four refined lead sweeps; selected current/current 24/24 accessible, mean 13.25 contacts |
| Pose proxies | Existing pose/asset tests | 30,240 sampled poses, 4 members × 3 rates × 18 states; finite values, zero proxy warnings |
| Studio browser | Four views pass after harness timing correction | Desktop/tablet/portrait/landscape, five contacts each, exit restoration, no recorded errors |
| Portfolio/browser sizes | Three baseline sizes | Nine sizes: no horizontal overflow, zero Axe violations, manual scenes and iframe on intent |
| Game sizes | Existing matrix | All nine sizes preserve four court corners; no recorded page errors or overflow |
| Repeated sessions | Existing controller tests | 32 challenge → complete → rematch → complete → return cycles over all four opponents |
| Lifecycle soak | — | Every cycle releases reservation, controller, match input and touch runs; camera/pause restored; DOM 193 in all rows |
| Active five-minute club soak | Paused baseline sample only | 30 ten-second batches: median ~16.7 ms; batch p95 16.7–16.8, p99 16.8; no page errors |
| Final short active samples | Not a directly comparable active baseline | 600 frames each in club and an automated eight-contact Championship rally; exact timings in `after/final.json` |
| Audio structure | Existing material model | 120 impacts, 12 cached quality/variant buffers, peak <.921, no context when muted, running after gesture, disposal clears owned cache/context |
| Media and entry | Old eager iframe | Real WebM metadata/seek, caption track, keyboard entry and controlled fullscreen-rejection fallback pass |
| Standalone package | Two linked styles absent | 59-file ZIP CRC; extracted boot, all styles loaded; five reloads on revised Python launcher server |

Viewports: 1920×1080, 1728×1117, 1440×900, 1280×800, 1024×768, 844×390, 430×932, 390×844, plus split-width 720×900. Touch emulation and reduced motion were used in the page matrix. Screenshots of those layouts, camera alternatives, contact/transition/return, bell and representative poses were visually inspected. The page's final pass fixes contrast, headline wrapping and the bell crop.

## Performance interpretation

The baseline 240-frame sample was paused: median 16.7, p95 17.3, p99 17.7 ms. It is not an active performance control, so no speedup percentage is claimed. The five-minute active run kept a coarse Chromium heap reading near 11.2 MB and DOM counts stable; some batches overlapped capture work on the same GPU. Final short club and rally samples were taken after those heavy jobs ended. Renderer telemetry measures smoothed CPU submission, not GPU time. Vsync-capped headless frame times and coarse heap readings do not prove zero leaks, zero GC pauses or equivalent phone performance. There was no observable sustained frame-pacing failure in these samples.

## Failures encountered and resolved

- Baseline portrait studio harness selected an actor then pinned the camera before focus settled. Awaiting focus before pinning made its existing Challenge action reachable; this was a harness race.
- Portfolio tests initially needed a jsdom `scrollIntoView` fixture and a scene-scoped selector; production behavior was not altered to satisfy the test environment.
- First Axe pass found four tiny decision-number contrast failures. Darker text passed all nine sizes.
- First hand-release regression exceeded .08 world units in one 60 Hz frame at sharpness 10; sharpness 4 passed.
- Capture harness initially awaited a nonexistent `#world` instead of the actual canvas; corrected and recaptured.
- A final telemetry harness referenced nonexistent `match.stats`, then an object-shaped cue despite the actual string cue API. Both harness errors were corrected; final rally sample uses `queueSwing` and the actual `playerCue`.
- Python's default local HTTP queue intermittently reset a module request. The packaged launcher now increases the queue; its actual server code passed five independent page loads.
- Video seek/reload canceled WebM range requests with `ERR_ABORTED`. These expected cancellations are recorded separately from failed asset loads; metadata, seek and captions were verified. No unrelated failed request was ignored.

Historical hardening and old reference-only harness results are not candidate passes. Existing lint warnings are retained, identified in the verify output, and are not suppressed. All additions preserve the existing source/served contract.

## Reproduction

From the game folder, run `npm test`, `npm run release:check`, and `npm run qa:studio`. Portfolio verification is `npm run verify` from `arjan-portfolio`. Use the configured Playwright runtime or set `PLAYWRIGHT_MODULE` / `CHROMIUM_EXECUTABLE`.

The new QA scripts document local URLs: game 8078 and portfolio production 3096. `experience-browser.mjs` runs the matrix, 32 accelerated lifecycle cycles and five-minute active soak. `experience-tuning.mjs` runs the Node-only matrix. `experience-capture.mjs`, `experience-detail.mjs`, `experience-poses.mjs` and `experience-film.mjs` capture live evidence. `experience-final.mjs` also expects an extracted ZIP served on 8079; `experience-media.mjs` expects the launcher's Python server on 8082. Create an output directory at `../takeover-evidence/after` and `../takeover-evidence/experiments` when running them in another checkout. These fixed URLs are QA setup, not production dependencies.

The strongest unsupported claims remain subjective and device-specific. Follow the human protocol before describing sound as materially satisfying, the camera as excellent, the cast as lovable, or the game as unusually fun.
