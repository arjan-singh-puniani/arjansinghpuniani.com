# One persistent Rally House world

This correction supersedes the earlier Championship gallery, blue-court and mode-lighting presentation. The generated audience, seating, tier and backboard are removed, along with ChampionshipArena's source and compiled/served modules. Championship uses the original green court, permanent net and club objects. The normal time/weather/lamp lighting applies in every mode. The same camera visibly establishes, orbits and descends around that court.

Performance Lab now shares the normal world composition. All four existing club members remain rendered and simulated. Only the existing player's visual pose is presented from replay samples; registered annotations are overlays within the same club. Reviewing a historical pose does not teleport the live player or change physical/social state. Phone capture owns its participant while the surrounding simulation continues. Busy practices retain their court reservation, and match cleanup leaves nonparticipant coaching state alone. Explicit user pause is respected.

No replacement character assets are added in this pass. Stationary strokes now load onto a world-space support foot through contact, releasing for recovery or when root travel calls for a running stroke. Existing contact solving, hip/torso turn, split step and stepping remain shared with rendering and analysis.

See the permanent [product rule and KEEP/REMOVE/REWORK audit](../../docs/WORLD-CONTINUITY.md).

## Actual visual acceptance

These unretouched captures come from the production renderer in the same browser session. The QA fixture establishes a known club before A, including a real Barbara/Lucresia social activity. No actors or props are teleported/recreated between A–D. Approach travel may be advanced through the real fixed-step simulation; camera motion, serve input and screenshots use the actual browser render loop.

| Stage | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| A: club before challenge | [View](chromium/A-club.webp) | [View](firefox/A-club.webp) | [View](webkit/A-club.webp) |
| B: court establishment/orbit | [View](chromium/B-transition.webp) | [View](firefox/B-transition.webp) | [View](webkit/B-transition.webp) |
| C: gameplay on the same court | [View](chromium/C-gameplay.webp) | [View](firefox/C-gameplay.webp) | [View](webkit/C-gameplay.webp) |
| D: returned club | [View](chromium/D-returned.webp) | [View](firefox/D-returned.webp) | [View](webkit/D-returned.webp) |
| E: Lab within the living club | [View](chromium/E-lab.webp) | [View](firefox/E-lab.webp) | [View](webkit/E-lab.webp) |

The [image manifest](image-manifest.json) records original PNG and lossless WebP hashes, with identical RGBA pixels verified. PNG originals remain local.

## Validation

- All **32 game suites** pass: [full log](game-tests.log). Existing walking checks retain zero planted-foot slide in 12 scenarios across four members and three rates. New stroke checks cover six adults, four strokes and three rates, with **1,053 fully planted samples and zero pivot drift**. Exact racket attachment, bounded adult limb lengths, emitted skin registration and continuous replay checks pass.
- Native [Chromium](chromium/report.json), [Firefox](firefox/report.json) and [WebKit](webkit/report.json) each pass three challenge/return cycles: ordinary exit after a real Space-key serve, completed-result exit, and cancellation during approach. Result scoring in the second cycle uses controller events to test memory/lifecycle; it is not evidence of human tennis skill.
- Each browser records **nine state checkpoints**. World, object and character references remain identical; original static transforms and placements stay unchanged; permanent court/net surfaces stay present; all four NPC bodies remain rendered; no artificial crowd or extra court layer appears; and lighting follows the same time/weather logic. The pre-existing social activity advances causally. Camera snapshots restore exactly; court reservation, match input and competitor ownership clear after every exit. A busy existing court survives a rejected challenge.
- Lab checkpoints verify advancing club time and NPC animation, the same world/cast, visible original surroundings and exact camera return. The portrait [phone report](phone-arjan/report.json) verifies the actual World/cast are retained and the clock/mind continue during capture, in addition to exact hand attachment, real video/pose capture, synchronized review, accessible controls, full-body framing and stream cleanup.
- [Portfolio verification](portfolio-verify.log) passes **91 tests**, TypeScript, the **32-route** production build and lint with zero errors / 12 retained warnings. [Portfolio entry](portfolio-entry.json) checks the served game and capture entry.
- All **74** source/served release artifacts match. Release checks now reject orphan compiled modules and unequal module sets. The **76-file** standalone passes CRC and exact runtime bytes, with no arena module: [archive metadata](package.json). [Native standalone startup, selection, members, save and reload](standalone/report.json) pass.

## Retained diagnostics

The initial headless simulation harness has no PerformanceLab instance; an unguarded optional access failed and was corrected. The next run reached an old test that explicitly required Lab to freeze time, which conflicts with the new product requirement. That assertion now verifies continuing time and no player teleport. Both incomplete logs are retained. A Firefox run passed all match cycles but reached the busy-court fixture while the original social activity was still resolving. The fixture now lets that activity finish naturally before asking its participants to join practice; its [incomplete report](firefox-first-attempt/report.json) is retained. No product activity is cancelled to make that test available.

During the date change the prior temporary checkout lost unrelated tracked files. The two in-progress source edits were preserved, then applied to a fresh checkout of pushed revision `e4dbb3d9523f2784f0c3a66229a7200a1aa4e1f1`; unrelated deletions are excluded from this correction.

## Reproduction

Run `npm test`, `npm run release:check` and `node qa/serve.mjs` from `rally-house-source-v16`. Run `QA_ENGINE=chromium node qa/same-world.mjs`, repeating for Firefox and WebKit. `qa/championship-detail.mjs` now delegates to this continuity acceptance instead of validating a generated gallery. Run `QA_AVATAR=Arjan QA_WIDTH=390 QA_OUT=/tmp/phone-world node qa/phone-capture.mjs` for real phone capture. Run `QA_METAL=1 QA_OUT=/tmp/standalone-world node qa/standalone-compare.mjs /path/to/extracted/Rally-House-v16-Playtest` for the tested standalone renderer configuration.
