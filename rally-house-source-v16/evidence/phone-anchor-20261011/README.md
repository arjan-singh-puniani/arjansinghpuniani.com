# Selected-avatar phone anchor — October 11

Choose Taylor or Arjan, select **Lab → Mount phone & record**. The avatar approaches the actual instrument, reaches the clamp with its authoritative right hand, seats one phone, and steps back into the anchored view. A countdown leads into a side-step, real forehand animation and recovery. The new local video opens alongside VectorCourt/AnatomyMotion replay. All three apps explicitly credit Arjan Singh Puniani. The instrument has one object identity, tight selection bounds and specific capture/analyze actions.

The video is a real MediaRecorder capture of the game's rendered canvas, from the lens at the physical phone anchor. It contains no UI overlay. Motion samples are detached snapshots of the actual selected avatar after rendering; video time drives continuous pose reconstruction and scrubbing. This is known game motion, not camera CV or force/muscle measurement. Unsupported encoders retain the motion and explicitly show motion-only replay. Footage stays in this tab until downloaded; a new recording replaces the prior local blob. Completed captures update object history; cancelled captures do not.

## Actual checks

| Engine | Taylor 1440×900 samples | Arjan 390×844 samples | Maximum observed video/replay discrepancy |
| --- | ---: | ---: | ---: |
| Chromium / Metal | 163 | 163 | 6.84 ms |
| Firefox | 123 | 162 | 0 ms |
| WebKit | 159 | 161 | 16.19 ms |

These six native browser runs use actual selection and capture controls. Each saves the real encoded video and captures mounting, recording and paused review. All report zero page/console/HTTP errors, zero Axe violations, no horizontal overflow, exact hand/phone attachment, zero live stream tracks after completion, opaque replay surfaces and the owner byline. Paused video and replay seek times agree. Firefox's lower desktop sample count reflects its observed rendering rate; this is not a physical-phone performance benchmark.

An additional Chromium Arjan 1440×900 run passes real recording, cancellation during the next recording, and a successful third attempt. Re-entry uses the existing mounted phone. Cancellation leaves zero live tracks, no completed-use increment, no retained partial recording and no player activity reservation. A replacement recording gets a different blob URL and increments completed history once; disposal clears the retained recording. The same run's initial review discrepancy is 10.30 ms.

Final review identified a delayed encoder stop callback that could stop a newer stream. It now checks its recording generation before touching shared state. A controlled late-callback regression passes, as does the real Chromium lifecycle repeat in `final-lifecycle` (6.62 ms observed replay discrepancy, zero errors and zero Axe violations).

All **25 game suites** pass. The new unit suite exercises both avatars at 30/60/120 simulation rates, exact hand attachment and anchored lens position, genuine detached pose samples, four cancellation phases, unsupported-encoder fallback, full camera restoration and phone replay cameras inside the actual club walls. Existing Championship, geometry, continuous pose, contact and GPU registration checks pass. Full portfolio verification passes **91 tests**, TypeScript, a **32-route production build**, and lint with **zero errors / 12 retained warnings**. **69 release artifacts** match source/served trees. The **71-file standalone ZIP** passes CRC and exact source-byte comparison; five independent uncached starts pass.

## Evidence and reproduction

Each engine/avatar folder contains `report.json`, three genuine screenshot WebP copies and the actual downloadable `phone-recording.webm`. `capture-manifest.json` records SHA-256 hashes of the unedited source PNGs; raw PNGs remain locally preserved. The portfolio still is the genuine Chromium Arjan review. Test/build logs, the standalone startup report and package hash are included. New nondeterministic simulation results are preserved in `generated-simulation`; historical QA fixtures retain their original bytes.

Production portfolio entry also passes native Play Rally House, iframe loading, Arjan selection and discoverable capture controls, with the ownership label and zero page/HTTP errors (`node qa/portfolio-phone-entry.mjs`, port 3096). Initial wrapper harness checks read the frame before attachment and then waited for dev-only hooks in the production iframe; both reports are preserved. The corrected check uses native loading and controls.

After the previous PR merged, current main was integrated without conflicts so this branch includes the recently merged work on other apps. Rally House source and served bytes remained identical. Full portfolio verification passed again (`portfolio-main-verify.log`). This follow-up review contains the phone capture changes only.

Run `npm test`, `npm run release:check`, then `node qa/phone-capture.mjs` with the source served on port 8078. Set `QA_ENGINE=firefox` or `webkit`, `QA_AVATAR=Arjan` and `QA_WIDTH=390` for the other cases. `QA_LIFECYCLE=1 QA_AVATAR=Arjan node qa/phone-capture.mjs` adds repeated recording and cancellation. `python3 qa/package-playtest.py` creates the standalone. Serve its extracted contents on port 8079 using the launcher's 128-connection queue, then run `QA_OUT=evidence/phone-anchor-20261011 node qa/standalone-diagnostic.mjs`.

The first review exposed a camera behind the opaque back wall; phone replay framing and orbit/zoom limits now keep it inside. The initial wider mount view was tightened to show the hand and clamp. The first Axe invocation required an explicit browser context; the corrected audit then found the existing canvas outside a landmark, fixed by making the game root a named main landmark. Initial camera captures and the partial context report remain locally preserved separately from the passing evidence. Native camera inference, physical device/OS lifecycle and independent human taste remain separate validation gates.
