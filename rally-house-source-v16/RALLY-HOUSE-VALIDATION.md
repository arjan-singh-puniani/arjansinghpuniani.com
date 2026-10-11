# Rally House validation — 6 October 2026

The October 9 follow-ups are recorded separately in [Championship impact](CHAMPIONSHIP-IMPACT-20261009.md) and [event demo resilience](DEMO-RESILIENCE-20261009.md), with their own dated evidence. The results below describe the October 6 pass.

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


## Authored object identity — 10 October 2026

This is a fresh candidate pass on main `846d1c7`, distinct from the October 6/9 historical results above. Current reports, provenance and selected actual captures are in [evidence/objects-20261010](evidence/objects-20261010/README.md).

| Check | Current result |
|---|---|
| Game build/tests | All 19 suites pass, including 42 real primary object travel/use/completion flows and a secondary seated-rally regression |
| Portfolio verify | 91 tests / 9 files, TypeScript, 31-route production build; 0 lint errors, 14 retained warnings |
| Release boundary | 61 source/served artifacts match; relative imports resolve |
| Stable identity | 43 built-in assemblies plus all 16 existing furniture catalog types have deliberate mappings; unknown catalog types cannot invent a generic action |
| Clock | 240 full, 240 cancelled, 240 reduced-motion exact TRS restores; three live-clock invocation snapshots |
| Embodied state | Water hand/soil gap 0.000; actual wet soil/cooldown/reload; real sketch/erase geometry; interrupted use does not invent a completion |
| Native object browser | 13 flows, 12 viewports, zero Axe WCAG A/AA violations, native touch and saved-state reload |
| Seated watch | Exhibition requested after arrival, 120 actual-ball gaze samples at zero target gap, then seat release |
| Engines | Firefox and WebKit: three layouts each, native keyboard action, clock completion/restoration, no recorded errors or failed requests |
| Repeated Championship | 32 cycles across four opponents/motion modes; exact pause/return, DOM 204 throughout, zero instrumented transient audio nodes after settle |
| Resilience | Four layouts, eight exact paused-flight/contact freezes, nine stall cases, protected saves and native multi-touch; physical OS focus remains open |
| Portfolio/package | Nine embed layouts/Axe 0, Discover capture loads, 16 held-contact exits, bounded audio/disposal, five extracted-package reloads |
| Standalone ZIP | 63 files / about 195 KiB, CRC verified and re-extracted from final source |
| Isolated real frames | 16 physical contacts / 1200 RAF frames, median 16.70 ms, p95 16.70 ms, p99 16.80 ms; no recorded errors |
| Autonomous life | 600 seconds: 17 completed scenes, no interruptions. Simulated hour: 20 scene variants, 10 places, all initiators, one safe cancellation |
| Historical preservation | 886 scoped original files archived and read back against hashes; originals remain in place |

Viewports for the object matrix: 1920×1080, 1728×1117, 1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844, 375×667, 844×390, 640×800 and 390×280. Actual clock, bonsai and seat captures were inspected; their modest procedural art is not claimed to equal studio character work.

Failures repaired: wrong/hard-to-select surface targets; static cached foliage that could not respond; an inaccessible basket/bench aisle; two actors blocking a shared narrow bench entry; nonparticipants sharing one court exit; high hanging frames falsely implying reachable string contact; and a seated watch starting its exhibition before the spectator arrived. Gaze now samples the court's final authoritative ball pose. Cross-engine Find timing needed a RAF-aware harness wait. Rebuilding Next while its old server stayed alive caused stale chunk requests; the final integration run uses a restarted production server.

Reproduce with `npm test`, `npm run release:check`, `node qa/object-inventory.mjs`, `node qa/object-browser.mjs`, `node qa/object-engines.mjs`, `node qa/session-lifecycle.mjs`, `node qa/session-validation.mjs`, `node qa/impact-validation.mjs` and `node qa/impact-browser.mjs objects-release`; portfolio verification is `npm run verify`. Browser fixtures expect source 8078, the production portfolio 3096, and the extracted package 8079. `python3 qa/package-playtest.py` creates the CRC-checked standalone ZIP.

Native UI actions are real, while fixed-step acceleration makes travel/use/session coverage efficient. Headless RAF is vsync-capped and heap readings are coarse; there is no measured speedup, zero-leak proof or physical-phone performance claim. Page-switch tests explicitly exercise lifecycle handlers when headless switching does not deliver a true OS event. Independent human enjoyment, audio balance, character appeal and physical-device lifecycle checks remain required before a studio-caliber claim. The stronger contact pause/camera profile from PR9 is preserved, not relabeled as a new tuning result.


## Art pass — 2026-10-11

All 20 game suites pass, including the new geometry and shop-circulation regressions. Portfolio verification passes 91 tests and 31 routes, with zero lint errors and 14 retained warnings. Original runtime before/after captures and browser, touch, accessibility, package and rally measurements are curated under evidence/art-20261011. The detailed scope and remaining human/physical-device gates are recorded in RALLY-HOUSE-ART-DIRECTION-20261011.md.

## Performance Lab — 11 October 2026

Candidate begins at merged main `8790d34`. Taylor's prior likeness/rig work and the selected heavy Championship profile are preserved. This evidence is separate from the older counts above.

| Gate | Result |
|---|---|
| Game | All **22 suites pass**; includes 43 actual object flows, held-contact ball snapshot isolation, three real-solver lab demos, derived metrics, missing-gap abstention, cosine contact-lens envelope, bounded 360-sample capture and live-state freeze |
| Portfolio | 91 tests pass; TypeScript and production build pass; latest lint has zero errors and 12 retained warnings |
| Source/served boundary | **68 artifacts match**, including lab.css and four new compiled modules; relative imports resolve |
| Lab browser matrix | Chromium, Firefox and WebKit each pass **24 viewports/modes**, native station use, native controls, visible joint picking at peak separation, 100 replay cycles, exact camera restoration, simulation isolation and persisted-pagehide/native reopening |
| Shipped portfolio | Eight viewport sizes pass: Analyze image loads, no iframe before Play, zero Axe violations, native station entry and all three lab modes, source labels, ankle-height terminology, return, no production debug hooks and no recorded JS/asset errors |
| Real Championship replay | Fresh RAF capture: 61 samples, one player contact, one actual bounce; contact ball/string-center gap .050 club units; selected timeline time and frame both .3166667s |
| Match regression | Native shipped 390×844 match; 16 exits during held contact across four opponents/full and reduced motion; exact restoration, no stale hold/input/match; 12 bounded audio buffers/disposal |
| Standalone package | 70 files, approximately 221 KiB, CRC verified; refreshed extraction survives five independent reloads |
| Native capability checks | VectorCourt: 35 Swift + 28 Python tests. AnatomyMotion archive core: 77 Swift tests. No native source modified or private footage copied |
| Original dirty trees | Both Desktop trees preserved; scoped status/patch/hash inventories retained outside the release; no blanket reset/clean/deletion |

Viewport sizes: 1920×1080, 1728×1117, 1440×900, 1280×800, 1024×768, 844×390, 430×932, 390×844. Browser tests use native actions, with explicit fixed-step acceleration for long travel and repeated lifecycle checks. Real recording uses the ordinary RAF loop. Automation is not a human participant.

### Observed frame intervals

120 RAF intervals per scene, 1440×900, same local Mac, sequential engine runs. The lab sample is playing gait, so differing engine elapsed time also means differing rendered trail prefixes. Values are milliseconds; these are observed frame intervals, not an isolated GPU benchmark.

| Engine | Club median / p95 / p99 | Lab median / p95 / p99 |
|---|---|---|
| Chromium, ANGLE Metal Apple M2 | 16.7 / 18.4 / 18.6 | 16.7 / 19.4 / 24.3 |
| WebKit, Apple GPU | 17 / 18 / 19 | 17 / 18 / 19 |
| Firefox, renderer reports Apple M1 or similar | 16 / 22 / 35 | 28 / 30 / 32 |

Chromium and WebKit remain around 60 fps here; Firefox lab is approximately 35 fps. This is not a universal 60-fps or physical-phone claim. An earlier software-backend Chromium run was very slow even at baseline; its separate report is preserved rather than hidden or used as hardware evidence.

Failures found and fixed: coverage buried inside the court; a held contact ball absent from free-flight-only capture; foreground pendants hiding serve contact; Safari native selects below the intended target height; small landscape station framing; pointer/pinch/hover isolation; persisted-pagehide removing reusable controls; and picking the unshifted joint instead of the contact-lens node. Harness fixes include exact action names, explicit Axe contexts and fresh first-run contexts. A/B/C quiet cells, overlapping discs and strong cells were actually captured; the quiet cells remain selected.

Reproduce: `npm test`, `npm run release:check`, `npm run qa:lab`, `QA_ENGINE=firefox npm run qa:lab`, `QA_ENGINE=webkit npm run qa:lab`, `node qa/lab-release.mjs`, `QA_RECORDING_ONLY=1 node qa/lab-release.mjs`, `python3 qa/package-playtest.py`, and `QA_WIDTH=390 QA_OUT=evidence/performance-lab-20261011/impact node qa/impact-validation.mjs`. Source 8078, portfolio 3096 and extracted package 8079 are QA URLs. Set `WEBKIT_EXECUTABLE` when needed; the harness uses the available installed runtime or the normal Playwright default. `node qa/curate-lab-evidence.mjs` produces smaller genuine capture copies and the portfolio still.

See [current evidence](evidence/performance-lab-20261011/README.md). Raw PNGs remain locally preserved; curated WebP copies and source hashes accompany the release. The five nondeterministic simulation outputs are retained under the new evidence folder while dated historical QA fixtures retain their original bytes.

Open gates: independent human taste/listening, physical iPhone/Android performance and OS lifecycle, Firefox optimization, specialist assets, and native camera/held-out research validation. The browser lab computes **simulation geometry**. It does not run CV, infer ground reaction force, measure muscle activation or make a clinical claim. The scripted page-cache event exercises handlers; it is not proof of every OS/browser cache behavior or a zero-memory-leak result.
