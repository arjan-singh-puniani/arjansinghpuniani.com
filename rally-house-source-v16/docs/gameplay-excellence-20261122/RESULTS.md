# Implementation and verification

Status: local implementation and browser validation recorded. Production release held for physical-phone and uncoached playtest evidence.

## Feature accounting

| Change | Why | Verified | Still unverified / further investment gate |
|---|---|---|---|
| Player-owned placement spread | The same player command should not become less accurate because an opponent has more angle bias | Reproduced old defect; 300 matched inputs across four profiles; capture/reset regressions | Humans’ perceived control; tune only if misses are repeatedly unexplained |
| Direct return + lob | Pace versus height/depth/recovery is one comprehensible tactical choice | 54 flights at 30/60/120 Hz; real lob/string contacts; keyboard Q and touch button; six browser/view configurations | Which choice players use and why; no additional shots until this pair earns its complexity |
| Pressure / retriever styles | Recognizable court position creates exploitable space | Four actual point traces: Leo reaches 5.4 depth; Lucresia stays at 6.65; input-only movement policy remains effective | Unprompted recognition, balance, fairness and bounded learning’s perceptual value |
| Softer lob impact + original reactions | Sound reflects contact and strength without borrowed media | 24 actual OfflineAudioContext outputs; monotonic power/energy, headroom, short envelopes; suspended/mute cleanup | Phone speakers/headphones and subjective satisfaction; record neutral comparisons |
| Championship memory and rivalry | Results change what the opponent does next | Three participants, deduplication, save migration, actual director travel/practice/completion; expiry of 100 old scene records | Visibility to ordinary players, whether the rematch invitation feels earned |
| Short contextual teaching | Teach after an actual return; leave next activity optional | Counters increment on contact, Lob cue and control fit, existing immediate Play flow | First rally under 90 seconds and voluntary rematch are provisional human targets |
| Release asset guard | Removed audio must not remain publicly shipped | Source/public audio-set equality and 133 artifact parity check | Broader provenance legal review was not performed |

## Automated regression scope

Baseline: full `npm test` passed. After implementation: 20 distinct targeted suites passed (see `regressions.json`): placement, tactical slice, memory, arcade feel, court sound, impact feel, controller, studio polish, interception, experience, reactions, court entry, avatar-switch lockout, everyday life, character life, interface and causality. Final focused reruns cover scene-bookkeeping expiry and interface behavior; serve ballistics, sequence and head-clearance suites also passed. Geometry/appearance was unchanged; the expensive full geometry suite was not repeated after these gameplay-only edits.

The movement assertion was corrected because a moving player won a shorter point (10 contacts) while the stationary policy lost after 12. A tracked point must extend the rally **or win**, and aggregate tracking still must exceed stationary contacts by 1.5×. This does not make automated rally length a measure of fun.

## Browser input and visual evidence

Chromium and WebKit each passed at 1440×900 desktop, 402×681 portrait and 756×352 landscape. Both choices contacted through real keyboard/touch events. Observed string-bed gaps stayed below 0.035 world units. No horizontal page overflow or page errors. The high ball remained in frame. Lob is 76×48 pixels, above the primary Swing target; two-pointer movement + Lob and cancellation were exercised in Chromium. WebKit used actual emulated taps, not physical two-thumb input.

Screenshots and recorded sessions are under `evidence/gameplay-slice-20261122/tactical-{chromium,webkit}`. Visual review covered desktop and phone framing. These are Mac browser emulations, not iOS Safari measurements.

## Audio observations

`audio/report.json` contains 24 rendered cases: drive/lob × four qualities × three launch speeds. Peaks remained below 0.101 full scale, with strong attack and short tails. Higher measured launch speed increased RMS for every quality/shot pair. This verifies signal behavior, not whether a listener finds it satisfying. Existing material synthesis was preserved; lob softens the high shelf by 3 dB and reduces camera response to 65%.

## Performance and live club transition

Chromium, 600 seconds, 440×763 CSS pixels at DPR 3, Mac desktop touch emulation:

- 171 swing inputs, including 73 Lob inputs; five automatic rematches and six replay reviews.
- 35,845 sampled frames; each 30-second window had p95 16.7–16.8 ms. Nine frames exceeded 50 ms; transitions and normal workstation activity are included.
- Geometry count stayed at 86; DOM count stayed at 309; recorded replay frames stayed ≤360; impact material cache stayed ≤12. No context loss or GL error; no page exceptions.
- Post-GC JavaScript heap: 9.83 MiB before warm-up, 14.54 MiB after the run. This includes warmed caches and replay; it is not proof of zero leaks. Backing storage rose from 75.82 to 77.98 MiB.
- This run loaded before the final scene-expiry cleanup, follow-up scheduler fixes and shorter teaching copy. Those changes have targeted regression coverage; the subsequent WebKit/follow-up runs use the final build.

WebKit completed 600.075 seconds on the final build with 175 inputs (73 Lob), five automated rematches and six analysis reviews. Across 36,696 sampled frames, window p95 was 21–23 ms; 13 frames exceeded 50 ms. Geometry count stayed at 86 and DOM count at 309. Replay stayed ≤360 frames, impact materials ≤12 and audio stayed running. No GL error or context loss. JavaScript heap is not exposed by this WebKit harness.

**The raw WebKit run is not a clean pass.** Its strict console assertion failed on four native video-control icon messages (invalid, picture-in-picture and AirPlay placards). `qa/webkit-media-controls.mjs` reproduced the same four messages on an empty document containing one native video control and no game code. `webkit-native-media.json` preserves that isolation; `webkit-assessment.json` separates the completed workload from the failed console gate. There were no other captured errors. This does not establish that native video controls work on the physical phone.

Physical-device validation remains blocked: Apple’s device inventory reports the paired iPhone 17 Pro Max as unavailable. See `physical-device.json`. No phone heat, battery, speaker or touch-latency measurements were taken.

Natural match → club → save/reload passed in Chromium touch emulation. A normally resolved 0–7 match created one Leo outcome and +2 rivalry. The club visibly performed “Leo takes in the win”; the follow-up completed 59.293 seconds after returning. Reload retained exactly one outcome, consumed pending follow-up and unchanged rivalry. The test also captures the first-return Lob cue and verifies the complete result panel fits 756×352 landscape. No console or page errors. The loser’s recovery-practice path and after-hours win/loss scheduling are covered by actual simulation-director regressions; the browser run observed the winner path.

## Issues found through verification

- Player placement previously inherited the opponent’s angle-bias scatter. Reproduced before correcting ownership.
- A tracked player could win a shorter rally; the old test incorrectly required every tracked point to be longer. The corrected test accepts a win while retaining the aggregate movement requirement.
- New per-match scene IDs needed expiry in the existing director’s cooldown/count maps. A 100-scene regression covers cleanup.
- The first natural match → club test saved the outcome but never showed its scene within 180 seconds. A late-win regression reproduced exclusion by the evening scheduler and insufficient priority against unrelated idle scenes. The pending player-match consequence now gets a bounded priority boost and remains eligible after hours; it still respects actor/place reservations and does not reopen the autonomous tennis court. See `followup-before-fix.json` and final follow-up report.
- The old playtest packager omitted runtime character assets. It now includes the full assets tree, checks for character assets/removal of the TV clip, and ships neutral participant instructions.

## Human results

No uncoached sessions yet. Arjan can arrange participants. `PLAYTEST.md` contains participant wording, neutral questions, timestamped observer fields, provisional targets and a physical-iPhone follow-up. Never report scripted rematches as voluntary rematches.

## Release recommendation

Hold production. Review the isolated preview with first-time players, validate the actual iPhone’s touch/audio/frame pacing and longer-session heat/battery behavior, and address observed blockers. The current evidence supports a playable experiment; it cannot establish “11/10,” hiring outcomes, admissions outcomes or commercial demand.
