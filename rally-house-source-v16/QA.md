# Rally House v16 — QA and release assessment

**Development candidate; not production-approved.** This release fixes a real inherited body-transform defect and improves movement, acting and persistence. Automated tests establish technical behavior within their fixtures. They do not establish that a human recognizes the personalities, enjoys ten minutes of watching, or forms an attachment.

## Baseline and provenance

The supplied canonical v15 ZIP was extracted and all seven original suites passed before candidate application changes. A 609-second untouched Chromium observation and a 1,206.633-second mixed browser session were completed first. Their records are copied into qa/baseline-reference/. The canonical archive is preserved intact under reference-v15/, SHA-256 `2fd173c7a81d57c338cdc50f6a1bba1a54491f441d5a98f500694ebe10a2a488`.

The later working-copy Taylor/Arjan selection and Contessa/Lucresia/Barbara display names were retained. WalkCycle.ts and CharacterSkin.ts match their recorded original hashes. The body-transform correction is in Character.ts, not a replacement foot solver or imported rig.

## Deterministic and actual-Game checks

`npm test` retains 44 simulation checks, 22 causal checks, 13 everyday checks, 12 walking scenarios across four members and three update rates, the extra obstacle/short-path/ankle regressions, and 27 character-life checks. It also runs the actual Game director for a ten-minute scenario, completed lesson and favorite visits, ten varied coaching input timings, and a 3,600-second variety run with furniture and changing weather.

New coverage includes 12 bounded acting/memory/dialogue checks, a head-on pass with actual arrival and zero measured planted-foot drift, recovery of an accepted lesson after interrupted travel, five-heading inverse/distance checks for the corrected body transform, an actual witnessed match leading to a three-person conversation, an earned reconciliation, malformed asset rejection, and a valid GLB/provenance CLI test. See qa/v16-tests-transform.log and qa/v16-asset-intake.log; the final consolidated log is qa/v16-tests-release.log.

The 100-day ordinary simulation completes 2,737 activities with zero interruptions. Three additional 20-day randomized input/furniture runs retain rare travel timeouts in two seeds. They are documented failures, not hidden or counted as completed scenes. LONG-HORIZON-QA.md contains the tables and measurement limits.

## Browser behavior

- Two real Chromium tabs race different saves: one wins, the other is rejected. The same test passes with injected IndexedDB write failure and localStorage fallback. The saved winner is read back.
- A real canonical-v15 browser save migrates without losing progress, equipment, placements, relationships, activities, important memories or events. Repeated ordinary memories may compress while preserving occurrence counts.
- Earlier candidate avatar checks selected both Taylor and Arjan through UI and retained identity, position, money and progress across reload. The final standalone package separately passes Arjan selection/save/reload. The final two-avatar rerun did not complete: initial picker-navigation error, then startup timeout. Earlier screenshots are not final-transform avatar approval.
- The final-transform real-time coaching test completes both timing and after-hours queued movement lessons through actual contacts. Requesting the lesson does not grant progress.
- Canvas context-loss recovery preserves the saved club. Malformed everyday state is rejected visibly without replacing storage. Its deliberate console error is expected test evidence.
- A 1.5-second frame stall catches up; a hidden document does not advance simulation; adaptive render scale reduces under synthetic slow frames and full detail restores it.
- Keyboard focus return, live-caption markup and portrait overflow checks pass. Actual screen-reader testing is not performed.

The mixed browser session ran for 1,208.015 seconds with all 20 action steps and no page errors. It placed four objects, requested coaching, saved, reloaded and used portrait/landscape viewports; progress changed from 28 to 34. That session began before the final body-transform correction. The final-transform coaching and pose checks are separate.

The final-transform observation ran for 2,444 wall-clock seconds (40m44s), with 24 completed activities, zero interruptions and no page errors. It is recorded in qa/v16-release-soak/watch.json. Sampling had a 959.586-second gap, plus shorter gaps; this is **not an uninterrupted performance pass**. Earlier completed 30-minute candidate observations are development history, not substitutes for this final run. Audio was disabled in automated long observation, so audible quality and resume behavior are not established.

## Pose review

Twenty seeded samples are captured per requested animation state. The final set is qa/v16-release-poses/; the earlier skewed set is qa/v16-poses/. Open qa/pose-review.html through the local server for a side-by-side frame browser. Sitting includes a real bench fixture. The body-transform correction removes the visible asymmetric neutral stance.

This is not an artist-quality pass. Coarse hands, garment seams and racket occlusion remain. The jog navigation request resolves to the walking state, and stationary shuffle captures do not replace on-court movement coverage. Freeze samples alone do not prove smooth cadence or full-body mesh collision avoidance. Pose time samples and kinematic measurements are included so the limits are inspectable.

## Performance interpretation

qa/v16-performance.json compares 10-second samples of smoothed internal CPU measurements against the baseline. These sessions overlapped other QA and are not an uncontended device benchmark. Render time is CPU submission time, not GPU frame time. The reported heap is a coarse browser bucket, not a leak proof. `aiMs` measures the roughly 1 Hz mind/quiet-acting block, not all navigation and scene-director work.

Provisional same-host review targets are p95 sampled simulation below 3 ms, render submission below 5 ms, mind block below 1 ms, fewer than 850 draw calls, 260,000 triangles and 1,000 transient render items. These are conservative engineering targets relative to the observed baseline, not a promise of 60 FPS on phones. Final sampled p95 simulation was 4.651 ms and render submission 6.054 ms: both miss their provisional targets. Mind block p95 was 0.0766 ms, draw calls 763 and triangles 237,852, within their respective targets. Maximum render items were 766. The coarse heap reading stayed at 9.54 MiB; this cannot establish absence of leaks. An uncontended performance run with continuous sampling remains required.

## Remaining release blockers

Uninterrupted performance validation and CPU target misses; unresolved WebKit keyboard selection; rare crowded-layout travel failures; incomplete world-owned prop handling and universal seating/interactions; procedural pose/hand quality; no independent attachment responses; no physical-device or audible mix evaluation. The reproduced coaching-loss path is fixed, but it does not prove the cause of every historical timeout. No professional character asset is active.

A few automation screenshot/startup/click attempts timed out while multiple browser runs overlapped. Successful reruns and final captures are distinguished from those attempts; a timeout is not a pass. DEVICE-QA.md records engine coverage separately from physical-device gates. HUMAN-PLAYTEST.md and HUMAN-RESPONSES.md remain explicitly unperformed until actual responses arrive.

## Packaging

The standalone tester package passed fresh extraction, startup, avatar selection, save and reload (qa/v16-package-smoke.json). The full release includes a SHA-256 file manifest and the unchanged canonical reference archive. The packaging script verifies ZIP CRCs for both archives.
