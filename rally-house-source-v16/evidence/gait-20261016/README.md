# Fluid adult walking and visible swing analysis — October 16, 2026

The previous adult walk combined rapid short steps with sharply bent, outward-pointing elbows. The updated walk uses longer strides, narrower foot tracks, lower swing clearance, relaxed hands beside the thighs, and subtle weight transfer through the pelvis. Each member retains their individual locomotion style. Start/stop blending now saves the authored pose before adult retargeting, avoiding a second retarget during transitions.

The toolbar now names **VectorCourt**, including on narrow screens. Its accessible name is **Analyze swing with VectorCourt**. The existing physical Performance Lab instrument offers **Analyze swing** and **Mount phone & record**. The replay panel names both VectorCourt and AnatomyMotion, with forehand, serve, recorded Championship and anchored-phone sources where available. This analyzes simulated game motion; it does not estimate a real person's swing from an uploaded video.

No geometry, clothing, world or replacement scene was added. Free walking arms use the new targets; props, reaches and racket contacts retain their existing constraints. The same authoritative pose continues to drive the visible skin and motion replay.

## Actual before and after

Baseline compiled runtime: `84f515bb9f60822a1916270130fb131bd1d53f35`.

- [Before: native browser recording](before-walk.webm)
- [After: native browser recording](after-walk.webm)
- [Before walking frame](before-walking.webp) / [after walking frame](after-walking.webp)

The recordings are unedited browser video, including startup and character selection. The QA camera follows the real player along the same controlled court path in the normal production renderer. Other existing members remain present. The images are native captures, encoded losslessly as WebP; decoded-pixel equality and hashes are in `image-manifest.json`. Private reference photographs are not included.

Independent steady-walk sampling across six adults reports approximately 180–200 steps/min before and 120–140 after; the three-second windows quantize cadence in 20-step increments. Mean outward elbow displacement falls from 0.212–0.225 to about 0.023 club units, with mean elbow flexion changing from 63–65° to 37–39°. Swing clearance falls from 0.075 to 0.045 units. Planted-foot drift remains zero. These are procedural game measurements, not clinical gait validation. See `before-audit.json` and `after-audit.json`.

## Verification

- All **33 game suites pass** (`game-tests.log`). The new test covers six adults at 30/60/120 Hz, 5,881 planted-foot comparisons with zero drift, uncrossed foot tracks, hands below elbows, bounded clearance and actual path arrival/start/stop transitions. Existing racket contact, body lengths, skin registration, replay, phone and cast checks pass.
- Chromium, Firefox and WebKit each pass three Championship/return cycles and nine identity/render/state checkpoints. The same World, original objects and four NPC bodies persist; live Lab activity continues and camera/input cleanup passes. Reports are in each browser folder; `C-gameplay.webp` is the corresponding native gameplay capture.
- Portrait Arjan anchored-phone capture passes exact hand attachment, 135 motion samples, synchronized video/replay (5.754 ms observed discrepancy), exact paused seek, visible full body, zero Axe/runtime/HTTP errors and complete stream cleanup. The real video is `phone-arjan/phone-recording.webm`.
- The portfolio iframe entry reaches the phone action with app attribution and zero runtime/HTTP errors (`portfolio-entry.json`).
- `vectorcourt/` records actual desktop and 390-pixel toolbar entry, forehand court view, elbow measurement, serve selection and return to club, with same-world identity checks and Axe coverage.
- All **74 release artifacts match** source and served trees. The **76-file standalone ZIP** passes CRC and exact-runtime-byte checks (`package.json`), with native Metal startup/selection/save/reload evidence in `standalone/report.json`.

The generated simulation reports from the full test run are preserved under `generated-simulation/`; shared historical QA fixtures remain unchanged.

The first portrait entry check clicked the temporary Find button while the camera was still centering the instrument, and timed out as that button disappeared. Its report is preserved as `vectorcourt/initial-camera-transition-390.json`; the final check waits for the camera transition before choosing the instrument action. Visual review also caught the longer toolbar label compressing into its neighbor, corrected by keeping that button's natural width.

## Reproduction

Run from `rally-house-source-v16` with its dependencies installed and `node qa/serve.mjs` serving port 8078:

```sh
npm test
npm run release:sync
node qa/gait-audit.mjs
QA_BASELINE_RUNTIME=/path/to/baseline/dist QA_LABEL=before node qa/gait-look.mjs
QA_LABEL=after node qa/gait-look.mjs
node qa/vectorcourt-entry.mjs
QA_ENGINE=chromium QA_OUT=evidence/gait-20261016/chromium node qa/same-world.mjs
QA_ENGINE=firefox QA_OUT=evidence/gait-20261016/firefox node qa/same-world.mjs
QA_ENGINE=webkit QA_OUT=evidence/gait-20261016/webkit node qa/same-world.mjs
QA_AVATAR=Arjan QA_WIDTH=390 QA_OUT=evidence/gait-20261016/phone-arjan node qa/phone-capture.mjs
QA_OUT=evidence/gait-20261016 node qa/portfolio-phone-entry.mjs
QA_METAL=1 QA_OUT=evidence/gait-20261016/standalone node qa/standalone-compare.mjs /path/to/extracted/Rally-House-v16-Playtest
```

The portfolio check additionally needs port 3096 running. Native Chromium captures use the host Metal renderer; Firefox/WebKit use their native browser engines. No new full portfolio framework test run is claimed for these game-runtime and static UI changes.
