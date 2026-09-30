# Validation — studio polish

## Baseline

The original TypeScript build and complete original `npm test` passed before source changes. Copying dependencies initially flattened the local `tsc` symlink; restoring that symlink fixed the staging-only tooling error. No original code-test failure was found.

The original source, original Git status, recovered bundle and execution logs are preserved in `RallyHouse/Studio-Polish-20260930`.

## Automated gates

| Gate | Result |
| --- | --- |
| TypeScript build + complete `npm test` (staging and active source) | PASS |
| Existing portfolio integration tests (five assertions) | PASS |
| Scoped Git whitespace check and delivery hash verification | PASS |
| Original simulation, walking, causality, presence, asset and save-related suites | PASS |
| Championship lifecycle and scoring | PASS |
| Camera orbit and exact restoration, including spring velocity | PASS |
| Continuous movement at 30/60/120 Hz; reversal, release, stroke continuity | PASS |
| Animated contact authority; broken-contact negative control | PASS |
| Four competitors visibly equipped and cleaned up | PASS |
| 180 perfect/clean/defensive first-bounce trajectories | PASS |
| Legal first bounce followed by escape cannot become a false long | PASS |
| Real Game touch transaction and persistent completion | PASS |
| Witness distance/busy/cooldown and gaze expiry | PASS |
| Live spectator tracking and relaxation | PASS |
| Atmosphere suppression and weather interpolation | PASS |
| Reduced-motion effect expiry and audio mute/reuse/stop in browser | PASS |

The recovered controller test assumed fixed 1.8-second intro and 1.2-second point-result waits. It now reads centralized timing constants because the intentional cinematic intro is 1.9 seconds and the point pause is 2.2 seconds. Assertions and scoring coverage were retained.

## Four-viewport Chromium matrix

1280×800 desktop, 1024×768 tablet landscape, 390×844 phone portrait and 844×390 phone landscape all passed. Each case used the visible Challenge action, natural character travel, a keyboard/touch serve, five real animated contacts, controller-assisted scoring to exercise two match results, Rematch, Return to Club, exact camera restoration, paused-clock restoration, and reduced-motion cancellation during approach. All court corners remained in the viewport. No horizontal overflow or console/page errors were recorded.

The initial studio matrix was also repeated against the installed portfolio static build on port 8087.

The score-injection hook tests lifecycle; it is not evidence of winning a human-played match. Rally inputs used the public timing cue in an automated driver. Device sizes/touch events were emulated, not physical phones.

Evidence: `qa/studio/matrix.json`, `qa/studio/match-*.png`, `qa/studio/club-*.png`.

## Existing cross-browser QA

The existing browser matrix passed startup, club book, keyboard selection, save/reload, concurrent-save conflict detection and phone-width overflow checks in Chromium, WebKit and Firefox. Each recorded an empty error list. This is not a full Championship playthrough on every engine.

Evidence: `qa/studio-browsers.json` and associated captures.

## Performance

Apple M2; headless Chromium with ANGLE Metal; 1280×800; full render resolution; 180 measured animation frames after warm-up per case.

| Live club | Before | After |
| --- | ---: | ---: |
| Median frame interval | 16.7 ms | 16.7 ms |
| p95 frame interval | 16.8 ms | 16.7 ms |
| Smoothed JS render submission | 4.39 ms | 2.64 ms |
| Render items in sample | 770 | 792 |
| Triangles in sample | 237,580 | 247,020 |

The paused visual comparison also held 16.7 ms median and approximately 2 ms JS render submission. These short samples show no observed local regression; CPU timing and heap samples vary and are not benchmarks across devices. There was no GPU timer-query measurement or prolonged memory soak.

Evidence: `qa/studio/performance.json`, `qa/studio/performance-active.json`. Comparable evening captures: `verified-before-evening.png`, `verified-after-evening.png`.

## Reproduce

```sh
npm test
npm run serve
# In a second terminal, with Playwright available:
npm run qa:studio
node qa/studio-objects.mjs
node qa/browser-matrix.mjs . studio-browsers
```

The server uses local port 8078. Browser QA accepts the existing `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE` overrides through `qa/runtime.mjs`. The comparison runner additionally expects the untouched baseline on 8079. The normal production entry exposes no debug hooks unless `?debug` is present.

## Open gates

Physical-device touch/audio, independent human game feel, replay desire, long-session memory behavior and recruiter's visual judgment remain open. See PLAYTEST-CHECKLIST.md. No remote deployment or production certification was performed.

## Ball-feel follow-up

- Complete `npm test`: PASS, including original suites and new rebound/contact/trail regressions.
- First-bounce position is unchanged; outgoing vertical rebound is about 14% stronger. The autonomous ball retains its original coefficient.
- Real contact produces face-aligned compression and 28 string segments; strings settle afterward. The negative control still rejects a ball that never meets the racket.
- Comet taper, stationary expiry, reset, reduced-motion shortening and comparable length at 30/60/120 Hz: PASS.
- Browser captures verify the real animated serve's contact, connected flight trail and floor squash; no console/page errors.
- Four gameplay viewports repeat the same real-contact, result/rematch/return and cleanup coverage for the new ball behavior. Evidence is in `qa/studio/matrix.json`.

The prior performance comparison above predates this small ball follow-up. New geometry remains bounded; no new per-frame GPU resources or post-processing passes were introduced. The user's positive feedback applies to the initial studio pass; the revised ball feel awaits their next playthrough.

## Return-interception correction

`npm test` now includes `tests/contact-interception.mjs`. It covers both baselines while turning, forehand/backhand target placement, 45-second club and Championship rallies at 30/60/120 Hz, and moving returns. All monitored return frames remain ahead of the striker; real contact counts ensure the fix did not simply remove playable returns. The existing broken-contact negative control remains in the studio suite.

`qa/club-contact.mjs` follows an actual reserved club match through natural travel and six contacts, records the minimum front distance, and captures the contact frame. Evidence: `qa/studio/club-front-contact.json` and `.png`. The four-viewport Championship matrix is repeated for the corrected strike timing.

The pre-edit source/compiled files are retained in `Studio-Polish-20260930/contact-fix-before.tar.gz`.
