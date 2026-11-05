# Equipment that unfolds — hospitalSIM RC8

Model `1.0.0-rc8`, browser runtime `138`. Original AI-assisted engineering prototype for Arjan Singh Puniani; no production-readiness, validated usefulness, or commercial-game superiority claim.

## Play and inspect

Play https://arjansinghpuniani.com/playground/hospitalsim . Direct game `/hospitalsim/index.html?release=138`. Current films/comparison `/hospitalsim/docs/equipment.html`. Begin empty, build reception, hire an administrator, build/hire a GP, open the doors. The first minute schedules one visitor; later arrivals introduce booked services. Existing hospitals are archived before a fresh start. REPLISOME and unrelated portfolio projects remain independent.

## Equipment rules

Every public room upgrade purchases a complete room-specific three-piece package: $900 for level 2; $1,300 for level 3. The GP Exam suite contains a 1.85m upholstered adjustable examination plinth, assessment trolley and articulated task light. Its next package adds a display, clinical storage and visitor chair. Nine equipment families have two tiers each; consult aliases GP, planning aliases neurology. The catalogue names all 54 components and declares each room's fictional service factor and reset saving. Some recording/procedure packages shorten only room reset, not active service. No free colleague, universal bonus or capacity increase is implied: one visit per room still requires its actual assigned team.

The model requires exactly three unique matching component IDs. It rejects missing, duplicated or unrelated pieces, insufficient funds, an occupied/reserved room, and an ended shift without mutating payment/state. A paid receipt with component IDs, cost and simulation timestamp persists in the room; validation rejects incomplete receipts. Old paid levels become grandfathered bases; no new purchase is invented for them. Historical headless replay retains its original upgrade API until equipment mode is explicitly enabled. The current browser enables equipment mode in all scenarios.

Only newly purchased pieces unfold: a staggered1.25 s rise/vertical reveal with bounded turn/settle and opacity. The base room/people do not move. A restrained floor frame fades after 2 s. Cosmetic animation can finish while simulation is paused; background tabs stop it. Reduced motion presents the finished installation immediately. Loaded receipts render at their final pose without replay. Uncommitted paused planning actions can be undone before simulation consequences begin. The three pieces arrive together; individual furniture placement is not implemented.

## Land, placement and time

Current clinic site: 32 × 28 cells, placement step0.25 cell. The ghost pins to the chosen site; Rotate/R turns it before Place/Enter confirms. Invalid doors do not trigger a silent relocation. Arrows adjust a quarter cell; numeric X/Y covers the whole site. Nearby suggestions are bounded to avoid scanning all 896 cells on each pointer move. Build preparation observed 21.6 ms in a desktop narrow session; this is not an iPhone measurement.

Site migration translates compact clinic active coordinates by +20Y, or prior 24 × 20 campus coordinates by +8Y, once. It shifts active people, routes, rooms, staff travel, doors and jobs together, retaining counts, payments and simulation RNG. Historical recorded coordinates keep their original frame with an explicit migration decision. Exact supported site shapes are validated before older migrations allocate navigation storage.

Fresh gentle clinics use960 simulation seconds (16 real minutes at 1×). Their arrival tape spans the longer shift. The first arrival is seeded1–4s, second 70–78s; gaps decrease later. Older active 8-minute shifts finish on their original clock; subsequent continuing clinic shifts use16 minutes. Archived advanced scenarios retain 8 minutes. Duration, period number, staffing end, continuation, progress, validation and exports share the same helpers. No render/wall-clock timing determines outcomes. A longer shift is not evidence of balanced economy or improved fun.

## Executed Blender pipeline

Blender 4.0.2 actually executed `blender/upgrades.py`, saving `equipment_upgrades.blend` and `dist/assets/equipment-upgrades.glb`. Canonical part definitions: `blender/upgrade_catalog.json`; export also generates `dist/upgrades.mjs`. Run from this directory:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --factory-startup --background --python blender/upgrades.py
python3 tools/audit-assets.py
```

The sandboxed Blender process crashed in graphics enumeration before Python; the authorized unsandboxed process completed. Its actual execution log is retained in `evidence/equipment-upgrades/blender-execution.log`. Metres, applied mesh transforms, local floor pivots and separate named component roots; Blender Z-up exports to glTF Y-up. Components consolidate their visible meshes by material. Beveled surfaces, handles, drawers, supports, joints, upholstery and rubber wheels are geometry. PBR roughness differentiates powder-coated plastic, metal, matte fabric, rubber and restrained fictional display glass. No new raster textures or external dependencies. Original CC0-1.0 geometry/materials; substantial AI assistance, no downloaded/ripped models or real patient imagery. The catalogue accompanies the editable source for reproduction. No new human modeling or human clip export was executed in this pass.

The GLB contains 54 component pivots /92,132source triangles,4,115,592raw bytes /759,379gzip bytes. It lazy-loads when Equipment opens or an installed save is restored; initial65GLBs remain6,235,383gzip bytes. The source file's full geometry count is not the visible scene count. Errors show Retry and prevent payment until models are ready. Existing GLBs, texture sources, rigging and animations are reused unchanged.

## Verification and actual media

Run Node22 checks from `hospital-sim-source`:

```sh
python3 tools/qa-server.py --port8771
node tests/equipment.mjs
node tests/planning.mjs
node tests/campus.mjs
node tests/browser-upgrades-rc8.mjs
```

All 30game suites pass. New checks cover complete-package atomicity, saved receipts, occupied/reserved rejection, legacy bases, undo, room-specific factors, an identical-arrival pair with a shorter recorded GP service after its package,960s termination/1920s continuation and bounded reduced-motion endpoints. Prior routing, staffing, arrival conservation, waiting-time conservation, exact saves and historical browser replays still pass. Ten expanding default seeded runs recorded 25–30 completions; one strategy exhausted funds in one seed and left 8–14 departures. These are model observations, not player studies or a guarantee of balance.

Browser: in-app Chromium on Apple M2, desktop 1280 × 800 and narrow 390 × 844. Exercised actual UI build/hire/open, quarter-cell X/Y and rotation, explicit placement, keyboard arrows/R/Escape, undo, room selection, both packages, reload, reduced motion, visible purchase/cancel buttons and a clean application error console. Narrow controls fit without horizontal overflow; purchase and close targets are at least 44px. Physical touch/iPhone Safari and assistive-technology user tests remain pending. The in-app tab switch did not set document.hidden, so automatic background pause was inspected in source but not established by that emulation.

Native first-loop film: runtime 137 / same RC8 model, game 0–90,92.195 real seconds including planning. Actual rotated quarter-grid reception/GP, explicit recruitment/opening, two arrivals, one fully completed intake/GP/exit visit, $180revenue. Native final transformation: runtime 138, game 80–88,8.008 real seconds,3-piece $900 purchase. Its controlled checkpoint has only one scheduled visitor and earned funds, no extra money; the full initial checkpoint and actual action list are retained. Exact native log replay matches actions/counts/tracked visit. Public video is indexed for playback/seek; original native files remain in source. The first loop is transcoded to H.264 for compatibility, without added/removed gameplay frames; transformation is losslessly remuxed. Menu HTML is summarized in recorder captions, not filmed.

## Measured limits and remaining gaps

A settled two-room scene with3 new pieces observed42,038triangles /65draw calls;6pieces45,598/76. These are snapshots, not worst-case or phone benchmarks. GPU: ANGLE Metal Apple M2. The fresh narrow mobile30 profile observed mean33.39ms/p9534.4ms over its pooled1,800frame sample; these are rendered intervals, not isolated GPU timings. Pooled frame samples and earlier stress peaks are not isolated performance benchmarks. A 40-room fully visible overview still exceeds250k triangle / 150 call provisional budgets. Updated evidence retains this limitation instead of declaring mobile readiness.

The comparison uses the retained supplied reference panel and an actual runtime 138 compact advanced scenario at game 129, with both imaging/procedure active. It is not the empty clinic opening. Faces/hands, cloth, task contact, material richness, shadow softness and editorial composition remain visibly below the reference. New equipment does not yet have bespoke clinician contact animations. Estate terrain is plain, queues are rigid and high-density rendering needs further batching. No external usability, fun/retention, clinician review, educational evaluation or accessibility conformance has been established. Evaluation draft remains proposed, unperformed work.
