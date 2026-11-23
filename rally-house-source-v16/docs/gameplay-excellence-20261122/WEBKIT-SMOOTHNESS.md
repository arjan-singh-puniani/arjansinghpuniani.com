# WebKit frame-stall investigation — 22 November 2026

## Cause and change

`Game.updateFixed()` retries autonomous club opportunities every two seconds. `Game.startActivity()` previously calculated every participant's walking route before `ActivitySystem.begin()` rejected an occupied resource or busy participant. During a championship, the opening practice could repeatedly try to reserve the already occupied court. Routing around that reserved court was real synchronous work on the same thread as tennis input and rendering.

The fix checks the existing resource and participant reservations before routing or changing the player's watching state. `ActivitySystem.begin()` retains its final validation. Successful activities still validate destinations and find paths before acquiring a reservation. Navigation rules, court boundaries, AI decision frequency, graphics, resolution, audio, save format and match physics are unchanged.

The production change is two lines in `src/Game.ts`, mirrored into both compiled game trees. `tests/activity-reservation-cost.mjs` exercises repeated rejected invitations, release followed by a successful invitation, and unreachable destinations. It failed on the baseline with 210 route calls instead of zero, then passed after the fix. It is included in `npm test`.

## Evidence and interpretation

Raw artifacts are in `evidence/webkit-smoothness-20261122/`. Baseline revision: `a8799ac6`.

The initial 60-second driver-input trace and browser-owned-input trace both had a 22ms frame p95. Removing protocol-driven input did not remove the recurring simulation spikes. This narrowed the investigation to actual game work. Method-level timing then identified repeated `clubPath()` calls in slow simulation frames.

Sequential 40-second traces used the same WebKit engine, 440 × 763 viewport, DPR 3, touch-driver loop and method-level instrumentation:

| Measurement | Before | After |
| --- | ---: | ---: |
| Maximum simulation time per frame | 42ms | 5ms |
| Simulation frames above 8ms | 21 | 0 |
| Frame intervals above 50ms | 7 | 0 |
| Maximum frame interval | 118ms | 27ms |
| Frame-interval p95 | 22ms | 21ms |
| Render scale | 1 | 1 |
| Successful player returns | 9 | 9 |
| Console/page errors | 0 | 0 |

These are measured sessions, not guaranteed frame rates. Input timing changes rally outcomes, so this is the same scenario and instrumentation, not an identical sequence of points. The deterministic regression establishes that rejected invitations no longer do navigation work. The paired traces establish that the recurring simulation spikes disappeared in the observed session. Overall p95 changes little because the expensive work happened infrequently.

The final sustained report, `soak-webkit/report.json`, passed after 600.017 seconds: 174 shot inputs including 73 lob inputs, five rematches and six replay reviews. Across 36,742 measured frame intervals, every sample window had a median of 17ms and a p95 of 21–22ms. Ten intervals exceeded 50ms; this is not a zero-stall or locked-60fps claim. The session includes UI transitions and automated screenshots, but the report does not attribute each outlier to a particular cause.

No console/page errors, WebGL errors or context losses were observed. Geometry count stayed at 86, DOM count at 309, recording history at or below 360 frames and audio material cache at or below 12 entries. Render scale stayed at 1. WebKit retained heap is unavailable in this harness, so bounded observed resources are not a complete heap-leak proof. `sustained-summary.json` provides the compact totals; raw window measurements remain available.

## Regression coverage

`regressions.json` records passing activity-reservation-cost, life-integration, avatar-switch-lockout, court-entry, championship-memory and everyday suites. The club-life integration exercises real activities, lessons, follow-ups and after-hours behavior; generated simulation receipts are saved alongside the performance evidence. This verifies that removing rejected work did not stop valid club life or reintroduce control lockouts.

Chromium also passed the browser readiness scenario: actual drive and lob contact, analysis/resume, keyboard focus recovery, return to club and compact result layouts, with zero console errors. Release parity checks passed for all 133 runtime artifacts; the refreshed 135-file ZIP passed CRC verification and has an updated per-file SHA-256 manifest.

## Reproduce

With the isolated preview running on port 18132 and Playwright available:

```sh
node qa/webkit-frame-profile.mjs http://127.0.0.1:18132 evidence/recheck/profile.json driver 40
node qa/sustained-play.mjs http://127.0.0.1:18132 evidence/recheck/soak 600 webkit
node tests/activity-reservation-cost.mjs
npm run release:check
```

`PLAYWRIGHT_MODULE` can select an existing Playwright installation. To compare historical runtime code, export `rally-house-source-v16/dist/Game.js` from baseline revision `a8799ac6` to a temporary file and set `QA_BASELINE_GAME` to its absolute path for the profiler. It overrides that response in the test browser only. Run timing sessions sequentially without other browser tests or CPU-heavy work.

This remains browser emulation on the Mac. Physical iPhone frame pacing, heat, battery use and speakers remain untested in this pass. External playtest enjoyment is also unmeasured. No production deployment is part of this change.

Recommendation: the recurring simulation stall is fixed and verified sufficiently for controlled browser playtesting. Keep the remaining isolated frame outliers visible in the evidence and investigate further if testers report perceptible interruption. Do not claim device-wide smoothness from this desktop WebKit result.
