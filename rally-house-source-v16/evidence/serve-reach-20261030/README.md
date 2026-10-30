# Serve reach — 2026-10-30

The full-length ARJAN frame exposed a serve contact-height defect. Human competitors still aimed at the former fixed 3.04 height, leaving Taylor’s elbow bent about 74° and Arjan’s about 112° at impact. This comparison uses production Character poses against commit d5d8a436, with the same authored asset loaded, at 30/60/120 Hz. It is a numerical pose inspection, not a running-game visual verdict.

Character now derives the target from the existing adult shoulder height, actual upper arm and wrist-to-elbow lengths, and racket rise. Both planned shots and the unplanned animation fallback share the calculation. Compact competitors retain the existing 2.36 court-relative height. Contact timing, input, footwork, walking, resting hands and existing recordings are not rewritten.

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

## Follow-up: release from the rising hand

The existing 45%-of-contact-time release happens after the actual tossing hand has crested. A production-pose sweep across six competitors, three update rates and four directions found downward hand movement at release in all 72 cases (vertical velocity -0.547 to -0.176 game units/second). At 35%, all 72 hands are rising (7.370 to 9.411 units/second). The shared `SERVE_RELEASE` phase now drives both held-ball release and subsequent toss progress. This changes the ball attachment boundary; it does not alter the athlete’s motion curves, shot duration or contact time.

The regression fails on the old phase because the measured hand falls before release. With the corrected phase, all 72 serve cases pass, including a rising hand, exact attachment at the release boundary, the existing toss/contact/arm/recovery checks and faithful replay. The smallest measured hand rise over the checked pre-release interval is 0.053486 game units. Gameplay interception, studio polish, Performance Lab, phone capture, point reactions, racket equipment and 3,800 fractional replay samples also pass.

An exact comparison against `8be26d0e` covered 108 state/cast/rate cases and 2,520 complete body/racket poses (idle, walking, ready, serve, forehand and backhand). Every sampled pose was identical. Heavy unchanged clothing checks were not rerun for this ball-only follow-up.

The fixed-duration toss remains an arcade trajectory. This correction does not establish velocity continuity at release, reproduce personal serve footage, or prove normal-speed visual naturalness. A longer serve or an unrelated arm rewrite was rejected for this pass: neither is needed to release the existing ball from the rising portion of the existing hand trajectory. Running-game visual acceptance remains unverified.

Qualitative phase-order reference: [USTA high-school tennis manual, serve preparation → toss release → loading → contact → finish](https://www.usta.com/es/content/dam/usta/sections/southern/pdf/net-generation-high-school-team-tennis-manual.pdf). The measured release fraction is specific to this game, not a value taken from that reference.
