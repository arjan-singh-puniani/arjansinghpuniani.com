## v13 addendum

The v13 merge preserves the v12 browser-tested causal architecture and adds a deterministic ambient-social planner. The full TypeScript build passes. All 44 inherited simulation checks and 22 causal/persistence/aliveness checks pass. A static HTTP smoke test returned 200. System Chromium in this container failed WebGL/EGL initialization, so the new v13 ambient-social changes were not visually recaptured here; final Mac/iPhone visual QA remains required.

# Rally House v12 QA — 2026-09-12

This is a tested development build, not a production-readiness or engagement certification. A human 15–20 minute playtest and physical-device performance testing remain outstanding. All sessions described below were automated Chromium sessions driven through Playwright.

## Baseline audit

The supplied v11 archive was extracted and its source, documentation, scripts, saves, schedules, social executor, character and tennis pipelines inspected. The original TypeScript build and all 44 inherited tests passed. Browser startup failed because lamp-shadow uniforms used by the lighting shader were undeclared. `qa/startup-failure.png` records the failed startup. Therefore there was no valid original-v11 manual session or live before/after performance comparison. Repairs preserved the original palette, skins, animation clips, room geometry and casting-lamp design.

## Defect inventory

| Priority | Verified defect | v12 disposition |
|---|---|---|
| P0 | Lighting shader fails browser startup despite successful TS build | Declare the missing lamp uniforms; WebGL scene now renders |
| P0 | Drill selection directly awards progress, money, trust and memory | Eight measured student contacts plus resolution required |
| P0 | Social event initiation writes its purported outcome | Completed activity owns consequences |
| P0 | Court social activity depends on initial coordinate proximity | Reservation remains throughout normal tennis movement |
| P0 | Schedules compete with committed activity movement | Reserved members are excluded from schedule updates |
| P0 | Social rally sides/depth/error attribution produce wrong results | Corrected sides, fixed receive baseline and physical error scoring |
| P0 | New state could duplicate or strand partial activity on reload | Explicit safe reset; completed receipts and sequence persist |
| P0 | Stale IndexedDB can outrank newer fallback; concurrent saves alias mutable state | Timestamp selection, immutable queued snapshots, visible failure |
| P1 | Blocked destination can produce a straight route through furniture | Refuse unreachable destinations; correct semantic approach positions |
| P1 | Low render rate discards simulation time | Bounded catch-up increased to 30 fixed steps / 0.5 seconds |
| P1 | Mobile build panel covers context controls | Mutually exclusive panels, close build selection on exit |
| P1 | Watching can claim a daily intention immediately | Count on completed observation |
| P1 | Placed objects have no persistent social use | Reserved shared visits, preferences, history and move/remove rules |
| P1 | Match history does not influence tomorrow | Saved rematch and post-court intentions; day-two browser check |
| P2 | Primitive winding and malformed court markings | Corrected without replacing the art pipeline |
| P2 | Limited keyboard/motion/audio controls | Keyboard selection, focus, volume and reduced-motion settings |

## Automated tests

`npm test` passes the TypeScript build, all 44 unchanged inherited checks and 19 added causal/persistence checks. Full output: `qa/final-tests.txt`.

New checks cover phase ordering, ownership, release, interruption, once-only consequences, safe activity reload, student-only contact evidence, quality-dependent gains, breakthrough prerequisites, retained first-win memory, rematch persistence, object visits/preferences/removal/movement, v11 migration, corrupt/future save rejection, latest-store selection, unreachable routes and immutable concurrent saves.

The first-Mika-win branch is tested with deterministic match-result fixtures. A natural first Mika victory has not been demonstrated in the browser sessions. The test suite does not prove every animation is readable or every possible save corruption is recoverable.

## Browser integration

The final integrated run completed successfully (`VERIFY PASSED`, no reported page errors) in `qa/final-browser.txt`. An earlier keyboard assertion raced the context-panel visibility transition; the final harness waits for the opened panel before asserting its title.

- Observation records 16 recent contacts.
- Selecting Drop-feed leaves Mika at 28. Completing eight student contacts (seven clean) moves her to 32.
- A separately exercised match ends Leo 3–0 Mika after 44 contacts; longest rally 14.
- Placing a bench causes a completed Nia/Mika visit and retained object history.
- Save/reload preserves earned progress and the match ID.
- Reload during an active lesson and active tea resets both without progress/coin changes or a new receipt: `qa/reload-safety.json`.
- A saved day-one result leads to an autonomous day-two rematch when the simulation is advanced to morning. It ends 2–2 after 60 contacts: `qa/tomorrow.json`. This is accelerated simulation, not an additional real-time day-long playtest.
- Mobile emulation at 390×844: touch opens coaching, two-finger zoom changes camera distance, touch places a bench, settings toggle reduced motion, keyboard selects June, and Club Book opens at 844×390. `qa/mobile-results.json` and screenshots retain evidence.
- Morning, midday, golden light, rain and evening screenshots were inspected. These use controlled clock/weather settings; they are not a continuous recorded day.

## Real-time sessions

`qa/final-golden.jsonl` is the final scripted interaction session. `qa/final-spectator.jsonl` is the final unattended run extracted from the last segment of `qa/spectator.jsonl`. `qa/session-summary.json` contains exact elapsed times, completed/interrupted activities, pairings, object histories, sampled room/idle states and rendering counters.

The interaction session lasted 1,011.783 seconds (16 minutes 52 seconds), completing six activities with one deliberate interruption. It selected coaching, later placed a bench, changed weather to rain and saved/reloaded. The observed chain was completed practice → retained improvement → 2–2 Mika/Leo match → post-court tea → repeated bench visits → saved intention to try again tomorrow. One interruption was deliberate: selecting coaching cancelled the initial observation. No reward was given for that interrupted observation.

The unattended run lasted 645.820 seconds, completing three activities with zero interruptions: an opening practice, a Mika/Leo match and a post-court break. It ended on day 2 at minute 42. Its absence of clicks does not establish absence of boredom. Overnight inactivity and repeated routines remain design concerns.

The long-run harnesses began before the last small panel/reward corrections; the scripted reload loaded the later build. Final integrated browser checks and unit tests exercise the final compiled source. Do not read these logs as a full-duration soak of every final line of code. Older `golden.jsonl` and the earlier spectator segment are diagnostic runs made before the timing correction.

Room usage is inferred from sampled coordinates, and idle counts count the literal `idle` pose. These are coarse samples, not exact dwell times. Relationship effects are checked through completed results and saved integration state; a full relationship-delta time series was not captured. Activity history is bounded to 48 receipts, so summary code deduplicates IDs across samples.

## Performance interpretation

Chromium reported ANGLE/SwiftShader software rendering. The summary reports sampled simulation CPU, render submission CPU, draw calls, triangles and entities. Across the scripted session, sampled simulation CPU averaged 0.50 ms (maximum smoothed sample 11.32 ms); render submission CPU averaged 3.06 ms (maximum 3.70 ms). Draw calls ranged up to 803, triangles up to 229,612, with five entities. These are instrumented smoothed CPU samples, not frame-time percentiles. Render CPU is not GPU frame time and does not demonstrate 60 fps. Parallel software-rendered browsers also slowed automation substantially. No MacBook Air hardware-GPU budget, physical iPhone Safari budget, thermal behavior, battery impact or transient-mesh allocation profile has been certified.

## Remaining defects and limits

- P1: Emotional readability, coaching comprehension and desire to return are untested with humans. Use PLAYTEST.md before expanding content.
- P1: A small set of social breaks and reactions repeats. Nia anchors object visits; there is no general multi-person social planner or room utility simulation.
- P1: Dense furniture can make routes unavailable. Activities decline or time out safely, but crowd avoidance is not a robust continuous collision solver.
- P1: Physical iPhone/Safari performance and WebGL context-loss recovery are unverified.
- P2: Coaching uses normalized game proxies. Demonstrations reuse existing clips; not every cue has distinct bespoke animation. Earlier preparation and faster recovery have persistent modifiers; spacing/rhythm primarily shape the current block and general skill.
- P2: Plant/lamp interactions are quiet-use poses, not full watering or object-handling choreography. The new memento is a small ball on a shelf, not a photo/trophy collection.
- P2: Existing equipment purchases and decorative effects remain lightweight immediate actions. Optional player-controlled tennis/feed timing was not added.
- P2: Save validation rejects invalid required numeric fields and unsupported versions; it is not a repair tool for arbitrary malformed nested data. No cloud sync or cross-tab conflict resolution.
- P2: A bounded callback transaction prevents normal duplicate awards; it is not a general rollback engine for unexpected exceptions inside consequence code.
- P2: Canvas keyboard actions are present, but this is not complete screen-reader or accessibility conformance testing.
- P3: Static seat alignment, pose transitions, camera composition and all lighting combinations need further human art review.

## Reproduction

Run `npm ci`, `npm test`, then `npm run serve`. Open `http://localhost:8080`.

Browser harnesses use local Playwright/Chromium paths from this development machine. To run them elsewhere, install Playwright and point the import/executable in `qa/browser.mjs` and `qa/longrun.mjs` to that installation. Modes: `verify`, `mobile`, `safety`, `tomorrow`, `spectator`. `node qa/longrun.mjs` runs the scripted long session. `python3 qa/summarize.py` regenerates session aggregates. Tests use isolated browser profiles and do not modify the player's normal browser save.
