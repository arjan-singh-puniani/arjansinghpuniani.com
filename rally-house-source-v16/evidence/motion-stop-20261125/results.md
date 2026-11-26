# Running-shot stop continuity · 2026-11-25

Baseline: `9de4d831`, branch `feature/rally-house-motion-20261123`. Local continuation of the broader animation direction pass; production has not been changed.

## Reproduced defect

Arjan moves sideways, begins a forehand, keeps moving, then releases movement during the stroke. At 0.55 seconds the root is stationary, but the receiving shoe jumps about 0.386 game units. `WalkCycle.update` re-evaluates the swing target using a zero direction vector even though its distance-driven phase has not advanced. Confidence: high; reproduced with the actual Character and replay recorder.

## Fix

Preserve an initialized stepping cycle when travel distance is zero. First-time initialization and explicit reset still run. The fix is shared by walking and court shuffle callers. A source comment explains why zero-distance updates must retain the target. This does not add a movement delay or change swing duration, contact timing, ball physics, rules or input handling.

## Verification

- Regression reproduced before the fix; now passes for forehand/backhand direction at 30, 60 and 120 Hz.
- Five suites pass: motion-direction, court-footwork, stroke-footwork, walking, replay-deformation. See `tests.json`.
- Twelve deterministic rally traces exactly equal baseline: 19,854 frames, 187 contacts. Checked recorded root, ball velocity, contacts, input cues and point outcomes. See `physics-comparison.json` and `physics-after.json.gz`.
- Matched desktop Chromium captures at normal and quarter speed, with frame stills. The comparison page shows the same camera and scenario before and after.
- Portrait WebKit replay at 402 × 874, normal and quarter-speed playback plus timeline seeks; no browser errors.
- Live Chromium UI check completed actual serve, lob and drive returns, paused, entered Analyze Swing, scrubbed the serve phases, returned to play, accepted movement input, and returned to the club. No browser errors. Includes 402 × 681 analysis view and small-layout checks. See `live/report.json` and `live/play.webm`.
- TypeScript build and release synchronization passed: 133 artifacts match and compiled relative imports resolve. Synchronization only updates the local portfolio's public game files.

## Remaining limits

This removes the sudden retargeting, not every limitation of the procedural gait. The distance-driven cycle can hold an airborne foot briefly until stroke recovery. A separately authored planted-stop transition would need additional work and contact regression checks. The previous pass's limitations for tight reversals and reach silhouettes still apply.

Browser checks ran on this Mac, not on a physical iPhone. These short samples do not measure sustained heat, battery drain or long-session frame pacing. No production deployment or push was performed.

## Paired performance check

Eight 15-second active-match samples, ordered before/after/after/before per engine. Apple M2 Mac; two samples per build per engine. Each sample included 10 contacts.

| Environment | Baseline p95 | Updated p95 | Frames over 50 ms |
|---|---|---|---|
| Chromium · 1200 × 900 | 16.7, 16.7 ms | 16.8, 16.7 ms | 0 |
| WebKit · 402 × 874 | 18, 20 ms | 18, 20 ms | 0 |

No frame-pacing regression was detected in these short samples. WebKit values varied between 18 and 20 ms on both builds. This is not evidence about physical iPhone performance or sustained sessions. Raw data: `performance.json`.
