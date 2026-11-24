# Motion assessment — before production code changes

Baseline: origin/main 382163c1896e1447c6534c1f4baea1f62c8138b5. Work branch: feature/rally-house-motion-20261123. Production is unchanged. Source: rally-house-source-v16; the portfolio public copy is a generated release artifact.

Captured five controlled motion studies at 60 Hz, replayed at 1× and 0.25× with a fixed three-quarter camera; selected frames inspected. Separately, Chromium live keyboard/pointer match produced drive and lob returns, opened recent-play analysis, scrubbed serve phases, checked a portrait viewport and returned to responsive live controls. Those live runs are not deterministic matched matches; the motion studies are.

## Five consequential problems

| Action / conditions | Visible defect | Likely cause and confidence | Proposed correction / gameplay risk |
|---|---|---|---|
| Forehand/backhand while the player keeps moving | Both shoes travel with the body during the stroke instead of taking recovery steps. | High: Character.update advances shuffleCycle only in shuffle, while poseFor gives strokes root-relative feet. The stroke support deliberately releases after travel, leaving no stepping mechanism. Character.ts update, poseFor and pose. | Continue the existing world-space stepping cycle for moving groundstrokes; retain stationary pivots. Presentation only, but check contact and body retargeting because leg constraints influence body height. |
| Low forehand preparation, especially around 0.50–0.52 s in the controlled fixture | Head rises 0.1204 game units in one 60 Hz frame; the body looks like it pops out of its crouch. Backhand has a smaller 0.0788 jump. | High: Character.pose computes the loading grip as future contact minus the CURRENT rotating racket offset. That goal moves independently of the actual hand curve; TaylorBody's reach-height square root amplifies the change. Instrumentation shows the posture drop changing from .1878 to .0972 in one frame. | Load toward the actual groundstroke hand path; retain exact contact constraints. Verify racket endpoints, contact timing, arm reach and recorded poses before accepting. Preserve serve calibration. |
| Explicit split step before lateral movement | Upper body lifts unevenly relative to the hips and shoes. | High code confidence, modest visual severity: splitHop enters pelvis/shoulders/head, but not hip joints; shuffle shoes are then replaced with planted cycle feet. Character.poseFor and pose. | Make the hop coherent or remove the misleading body-only lift. Do not change the existing movement delay or root travel. Check leg lengths, shoe clearance and ready-to-shuffle continuity. |
| Fast lateral reversal | Receiving shoe can cross tightly toward the other foot; the stance briefly narrows. | Medium: WalkCycle retargets a swing toward the changed travel vector while preserving the support anchor. The captured 2.6 s reversal looks cramped. | Investigate a bounded receiving-foot target using existing stepping state. Defer if a small fix compromises planted-foot guarantees or introduces popping. No movement acceleration/difficulty changes. |
| Planted groundstroke rotation and lateral ready movement | Hips and chest rotate in near lockstep; the torso is upright during side travel. | Medium: Character.poseFor drives hipCoil from the same turn curve as coil and keeps a constant shuffle lean. This is an expressiveness limit, not a contact bug. | Only add modest presentation separation if contact and silhouette remain sound. Prioritize the reproduced discontinuities; do not reshape the successful racket path merely for style. |

## Architecture and scope

Hand-authored curve library plus procedural world-space hands/feet, adult two-bone IK and GPU skinning. No motion capture or athlete-derived animation. Character owns root movement and shot timing; TaylorBody retargets the procedural landmarks. MotionCapture records the solved pose and skin palette; Analyze Swing interpolates those records. Existing rigid torso reach/replay reconstruction repairs remain in place.

Expected change reach: Character stepping/pose callers; TaylorBody only if solver correction requires it; regression tests; generated dist and portfolio release copy; QA captures. No ball, match rules, input, audio, UI, camera or social-system changes intended. Baseline compiled modules retained outside the repository for comparison.

## Validation plan

Compare deterministic roots, racket contact endpoints and timing against the baseline; run existing stroke sequencing, court/stroke footwork, replay deformation and anatomy tests. Add a meaningful continuity/stepping regression. Capture the same five studies after changes, independently exercise live match and Analyze Swing, and check desktop and mobile-sized Chromium/WebKit. Browser-only: no physical iPhone, heat or battery claims. Browser frame pacing is measured separately from deterministic CPU pose cost.
