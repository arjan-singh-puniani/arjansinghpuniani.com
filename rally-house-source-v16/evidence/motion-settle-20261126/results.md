# Timed stopping and recovery landing · 2026-11-26

Baseline: deployed merge `6ae0bb3e8bff598331115d682d98eec2d9c84997`. Branch: `feature/rally-house-stop-settle-20261126`. Local preview only; no deployment in this pass.

## Cause and fix

`WalkCycle` advances its foot arc using distance travelled. The prior zero-distance guard prevented a horizontal snap, but left a raised shoe frozen until the stroke ended. In the matched stop scenario, right ankle height stayed at 0.1376 from 0.55 through 0.90 seconds, above the 0.11 grounded ankle height.

The court shuffle caller now invokes a timed landing when travel is zero. Over 160 ms, a smooth curve lowers each shoe to ground level while preserving its world-space horizontal position. Existing leg IK follows the ankle targets; the root, torso, arms and racket solve are unchanged. The new method returns the normal landing event for footstep feedback.

Restarting motion rebases the next step on the visible feet with a full half-cycle available. The initial implementation exposed a 0.60-unit restart jump when the old phase was almost complete; the restart regression caught it. The final maximum first-frame restart movement is 0.0634 across the tested cases. No input delay was introduced.

## Evidence

- The new landing assertion failed on deployed code before editing.
- Seven suites pass: motion-direction, court-footwork, stroke-footwork, walking, replay-deformation, contact-interception, rig-registration. `tests.json` contains their output.
- Forty-eight stop/restart cases cover both directions, four step phases, 30/60/120 Hz, and restarts during and after landing. Assertions cover fixed root, no horizontal shoe drift, no court penetration, monotonic lowering, both feet grounded within 0.2 seconds, and immediate restart movement. Maximum landing displacement per frame: 0.01621 units.
- Final deterministic traces exactly match the deployed baseline across 12 rallies, 19,854 frames and 187 contacts. Root movement, ball trajectories, contacts, cues and point outcomes are unchanged in those traces. See `physics-comparison.json`.
- Matched desktop replay captures show stopping and interrupted-landing reversal at normal and quarter speed, plus fixed-time frames. The corrected stop reaches the grounded ankle height by 0.70 seconds.
- Mobile-sized WebKit replay at 402 × 874 completed playback and scrubbing without browser errors. This is desktop browser validation, not a physical iPhone test.
- TypeScript build and local release synchronization passed: 133 artifacts match.

## Limits

The landing is procedural, with the existing knee solve and torso motion. It is not authored motion capture or a complete momentum-based stopping system. Tight reversals and extreme reaching still inherit the existing rig and gait limitations. Physical iPhone, battery and thermal behavior were not tested. Production remains at the prior release until separately authorized.

## Live browser check

Chromium live input produced serve, drive and lob contacts. Pause, Analyze Swing entry, recorded serve phase selection, portrait layout, return to gameplay, keyboard movement and return to the club all passed with no browser errors. Recording: `live/play.webm`; report: `live/report.json`.

## Performance

Apple M2 Mac; eight 15-second active-match samples, before/after/after/before per engine. Each sample had at least 10 contacts.

| Environment | Baseline p95 | Updated p95 | Frames over 50 ms |
|---|---|---|---|
| Chromium · 1200 × 900 | 16.8, 16.8 ms | 16.8, 16.7 ms | 0 |
| WebKit · 402 × 874 | 20, 21 ms | 21, 21 ms | 0 |

Frame pacing remained comparable in these short samples. The updated WebKit p95 was 21 ms versus 20–21 ms at baseline; Chromium stayed at 16.7–16.8 ms. This does not establish sustained-session or physical-device performance. Raw data: `performance.json`.
