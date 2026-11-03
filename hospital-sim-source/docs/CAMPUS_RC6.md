# Room to grow — hospitalSIM RC6

The current Juniper Clinic occupies a **24 × 20 cell site**, up from 9 × 8: 480 cells instead of 72, about 6.7 times the original area. The empty-start fund, room costs, service fees, bookings and arrival schedule are unchanged. More land does not supply free rooms or colleagues.

The starter clinic stays near the south-west corner. **Land** frames the entire estate; **Home** returns to reception and the first GP. Drag clear floor to pan, use the zoom controls or pinch, and select a room from People to focus its district. Non-spatial placement lists locations across the whole site; selecting a distant location brings its preview into view. Green pickup cells cover the larger connected floor. Construction still protects people, their reserved routes, entrances and every service doorway.

The clinic's safety limits are now 64 rooms and 64 colleagues (previously 18 and 16). Those are state limits, not a promise that every arrangement fits or that a fully populated overview meets the mobile graphics budget. Legacy advanced scenarios keep their original compact maps and recorded paths.

## Existing saves

Loading an earlier `clinic` save expands it once. Rooms, doors and active people/routes translate together by +12 on the Y axis; the old core occupies rows 12–19. Gate orientation is retained. Counts, money, assignments, billing, random seed/tape and active service progress are preserved. No fresh start is required. Historical decisions and completed visit coordinates retain their old frame, with an explicit `expand-site` action documenting the translation. New reports include site dimensions.

`initial('clinic')` remains the historical compact model template for replaying existing films. The browser calls `expandSite(state)` after initialization or a validated import/restore. Headless code creating the current clinic should do the same. Expanded checkpoints persist `site` and do not translate again. Save import rejects unsupported site dimensions before allocating navigation buffers.

## Implementation and reproducibility

Run from `hospital-sim-source` with Node 22:

```sh
python3 tools/qa-server.py --port 8769
node tests/campus.mjs
node tests/clinic-flow.mjs
```

The game remains buildless. Model `1.0.0-rc6`, runtime imports `130`. State bounds now reach navigation, placement, staff travel, landing previews, renderer land/grid, camera, keyboard and location controls, validation and reports. Placement uses one connectivity flood for each candidate, rather than a BFS for each doorway. Footprint rasterization preserves the original strict clearance edges. Pickup articulation checking uses an iterative traversal, avoiding a deep recursive stack on the larger navigation grid. The renderer uses one procedural foundation and one instanced landing layer; it does not generate an all-pairs corridor mesh across the estate.

No Blender work was executed for RC6. Existing original Blender sources, 107 GLBs, textures and their licenses are reused unchanged. The enlarged foundation/grid are runtime Three.js geometry. All 24 standalone REPLISOME files are byte-identical to the release base. No unrelated portfolio content or access setting is replaced.

## Verification and measured limits

The new campus suite checks live migrations at eight visit times, preserved gate orientation, idempotence, exact continued save/load reports, full clothing/service/fee flow, bounds/door/reserved-route rejection, 3,921 flood-versus-BFS comparisons and safe staff release when removing an idle room. A deliberately funded fixture builds and pays for **40 rooms and 40 actual staff**, saves/loads them, and checks 3,487 valid pickup cells. It is a QA fixture, not earned gameplay or a successful player run. Additional funds and its altered arrival tape are explicit in the checkpoint.

All 27 game test files pass, including the campus suite and exact historical browser-recording replays. Portfolio tests, TypeScript and production build results are retained with the release evidence. Test-generated historical evidence is restored rather than relabeled as current observations.

Browser checks use the in-app Chromium browser on an Apple M2, at desktop size and an actual 390 × 844 viewport. They exercise the opening, Land/Home, a distant GP at X20/Y2, room focus, save/reload, legacy checkpoint import, green translucent pickup and narrow controls. This is **not a physical iPhone/Safari test**. Camera controls measure at least 44px in both dimensions; page width remains 390px. Screenshots and DOM instrumentation are retained in `evidence/campus/browser`.

The normal two-room narrow scene observed 53,324 rendered triangles and 57 draw calls; the mobile profile intentionally renders around 30fps. These are snapshots, not worst-case phone benchmarks. A fully visible 40-room stress overview observed **484,738 triangles and 555 draw calls**, exceeding the provisional 250,000/150 budgets. A fresh 40-room browser sample and its exact frame counts/mean/p95 are retained separately; pooled samples from earlier scenes are not presented as isolated stress results. Full-estate rendering still needs batching/LOD work before a dense hospital can be called mobile-ready. More distant rooms also lengthen walks; staff and patients do not teleport to erase that consequence.

## Remaining gaps

This release provides space, not a claim that the larger ambitions are finished. The estate is deliberately vacant and visually plain. Natural faces/hands, cloth, task contact, richer terrain/composition, crowd behavior, large-hospital rendering and actual-phone calibration remain below the requested target. Fun, retention, clinical assumptions and educational usefulness have not been validated through external testing. Substantial AI assistance remains recorded.

The RC5 first-patient film and reference comparison remain historical evidence for the preceding compact clinic. They are not relabeled as an RC6 recording or proof of visual parity. The new [campus review](../dist/docs/campus.html) shows the actual expanded land and its limits.
