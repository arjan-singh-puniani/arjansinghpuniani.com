# Serve reach — 2026-10-30

The full-length ARJAN frame exposed a serve contact-height defect. Human competitors still aimed at the former fixed 3.04 height, leaving Taylor’s elbow bent about 74° and Arjan’s about 112° at impact. This comparison uses production Character poses against commit d5d8a436, with the same authored asset loaded, at 30/60/120 Hz. It is a numerical pose inspection, not a running-game visual verdict.

Character now derives the target from the existing adult shoulder height, actual upper arm and wrist-to-elbow lengths, and racket rise. Both planned shots and the unplanned animation fallback share the calculation. Compact competitors retain the existing 2.36 court-relative height. Timing, input, footwork, walking, resting hands and recordings are not rewritten.

At 60 Hz, the impact elbow bend changes:

| Character | Before | After |
| --- | ---: | ---: |
| Taylor | 74.5° | 14.8° |
| Arjan | 112.0° | 43.0° |
| Coach Contessa | 76.3° | 18.9° |
| Lucresia | 66.0° | 20.9° |
| Leo | 107.3° | 30.8° |
| Barbara | 67.2° | 20.9° |

Bone lengths remain equal within floating-point precision. A uniformly higher target was rejected: the existing reach compensation starts lifting the shoulder/head to follow an unreachable wrist. This pass does not claim to reproduce a filmed serve or validate the entire kinematic sequence.

`tests/serve-sequence.mjs` checks soft extension at contact across 72 cast/rate/yaw combinations, alongside the existing palm release, descending toss, exact contact, wrist continuity, shoulder transfer, leg drive, recovery and observed-replay assertions. Its new impact test fails on the previous production code. `comparison.json` retains per-character/rate limb and angle measurements.

The exact baseline recreation in `../arjan-rackets-20261030/check-approved-presentation.mjs` still passes all 300 walking/resting body and hand samples. Existing head-centreline clearance, anatomical chain, clothing fold, grip registration and footwork thresholds are retained.

The browser inspection capability is unavailable in this session. No new running-game screenshot, sound judgement, performance measurement or human acceptance is implied. The latest racket and serve still need a refreshed browser play comparison; the overall Valve/Rockstar colleague-send gate remains open.

Validation on the final production code: the existing regression sequence through groundstrokes passed; the first full run then stopped on a newly added compact-fixture expectation that incorrectly assumed root-relative Y. After correcting the fixture to the existing court-relative contract, every remaining package test from serve-sequence through rigid-interpolation passed (terminal exit 0). This was not a single uninterrupted successful `npm test` invocation. No production changes followed the initial build.

Final results: 72 serve cases, elbow bend 13.86–43.00°, wrist direction continuity at impact at least 0.99866, maximum racket-contact error 1.13e-8; 72 jersey poses, maximum residual fold depth 0.0111239 within unchanged state-specific bounds. All 117 source/public release artifacts match; HTTP responses for Character, RacketGeometry and RacketWordmark equal the tested local files. No browser render was collected.
