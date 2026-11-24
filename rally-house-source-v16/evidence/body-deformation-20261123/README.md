# Analyze Swing deformation repair — 2026-11-23

The report was mainly about Analyze Swing. The original in-memory recording was unavailable, so verification uses a controlled match through the real Character, InteractiveMatchSystem, capture and PerformanceLab paths. The screenshots are not a reconstruction of the exact reported pose.

## Causes and changes

- `src/animation/ArjanUpperBody.ts` uses linear stroke progress to build its live skin palette. `src/analysis/MotionCapture.ts` instead rebuilt it with the other authored rig’s smoothed progress. Interpolated frames could therefore disagree with captured frames. The capture now carries Arjan’s actual twist parameter, and replay interpolates that value. Other rigs retain their existing policy.
- `src/animation/TaylorBody.ts` previously moved the shoulders farther than the torso center during contact loading and reach correction. This sheared the torso. Arjan now rotates the torso, shoulders and head together around the pelvis; residual reach moves the body together while preserving hand contact. `Character.ts` enables this only for Arjan’s groundstrokes. An initial shared version worsened Taylor’s sleeve penetration test; it was narrowed before release. Her existing solve and all serve motion remain unchanged.
- `tests/replay-deformation.mjs` checks actual skinned vertices as replay approaches recorded timestamps and checks torso length through contact loads. It is included in the regular test command.

## Verification

- 16 affected suites pass: see `tests.json` and individual logs.
- 210,600 sampled vertex checks, maximum frame-boundary discontinuity 0.000000366 game units (tolerance 0.0001).
- 54 torso loading cases preserve the torso segment length. The same test fails against the original solver (`hinge-before.log`).
- 108 stroke cases: minimum wrist continuity 0.9935, maximum contact error below 0.00000002 game units.
- 84 Taylor/cast jersey poses pass their existing thresholds; no thresholds were relaxed.
- Chromium desktop and compact WebKit browser each replay 363 captured frames from an 8-contact controlled rally without console errors. Four matched desktop poses and four compact captures are retained. See `comparison.html`.
- Source and portfolio runtime mirrors match across 133 release artifacts. The local tester ZIP has been rebuilt and CRC checked.

## Reproduction

Run `npm run build`, then `node tests/replay-deformation.mjs` from the game directory. With the local server at port 18132 and the installed Playwright module available, run `node evidence/body-deformation-20261123/browser.mjs after chromium` or `after webkit`. `before chromium` routes the two original animation/replay modules from commit `7788b9ef`.

## Limits

This repairs verified replay discontinuity and torso shearing; it does not certify every animation pose as anatomically correct. The exact user clip has not been replayed. No physical-device, heat or battery test was performed. No production deployment or merge was performed.

## WebKit performance smoke check

Both 30-second runs failed the existing minimum of 1,000 frames. Original animation modules: 870 frames, median 27 ms, p95 79 ms. Repaired modules: 801 frames, median 27 ms, p95 93 ms. Both reported zero console errors. These short sequential desktop WebKit runs do not isolate host load or establish a performance improvement; smooth frame pacing remains unverified. Full raw timings are retained in the two JSON reports.
