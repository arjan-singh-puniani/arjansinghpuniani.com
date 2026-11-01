# hospitalSIM — playable1.0.0-rc2

An original, substantially AI-assisted browser hospital management release candidate for Arjan Singh Puniani. Real-time Three.js dioramas use reproducible Blender equipment and rigged characters. It is not certified production-ready, clinically validated or demonstrated superior to a commercial game.

Play: https://arjansinghpuniani.com/playground/hospitalsim (check the in-game model label for the deployed version). Direct game: `/hospitalsim/index.html`. The preserved2D game is `dist/legacy/`; existing portfolio REPLISOME remains independent and accessible as an optional science workstation.

## Run

Node22 for checks. The game itself is buildless:

```sh
python3 -m http.server 8766 --directory dist
# Open http://127.0.0.1:8766/
node tests/simulation.cjs
node tests/diorama.mjs
node tests/release.mjs
node tests/animation.mjs
node tests/motion-release.mjs
node tests/patient-release.mjs
node tests/interaction.mjs
node tests/touch-roles.mjs
node tests/first-shift.mjs
node tests/roles-operations.mjs
node tests/navigation.mjs
node tests/landing.mjs
node tests/construction.mjs
node tests/waiting.mjs
node tests/continuing.mjs
node tests/browser-replay.mjs
node tests/expansion.mjs
node tests/staffing-flow.mjs
python3 tools/audit-assets.py
```

 There is no package installation for the static game. Serve over HTTP; module imports do not run from a file URL.

## Play

Tap/click a person or role label to lift; drag or tap a green path to put down. Cancel returns them. Role labels toggle with Roles; full people/room lists remain available. Build opens a compact palette. Rotate its doorway, use the location list or arrow keys and Enter, and keep the route clear. Escape cancels planning or clears inspection. Pause/1×/3×, recruitment, policies, event decisions, saves, exports and scenario settings remain available on narrow screens. A second care room needs a recruited surgeon and RN, not free staff from construction.

The opening visit can complete within a minute at1×. Resolve the paperwork jam; decide where the next bottleneck is. A scanner spill requires an actual facilities visit. Earn a lounge voucher, arrange a waiting bench, compare a checkpoint or continue the same sandbox hospital into another shift.

## Sources and limits

`blender/` retains editable sources and scripts; `dist/assets/` contains self-contained browser GLBs. Rebuild equipment with `hospital.py`, people with `characters.py`, drape/doors/role wardrobes with their named scripts; `lobby.py`, `service_staff.py` and `equipment_lod.py` add the executed1.0asset pass. Blender4.0.2 was executed. Provenance and CC0/MIT terms are in `ASSET_MANIFEST.json`, `ASSET_LICENSE.md` and the vendor license. Original patient and equipment sources remain retained.

See `docs/VERIFICATION-v10.md` for measured checks, actual recording and remaining gaps; `docs/MODEL.md` for timing/capacity assumptions; `docs/ART_DIRECTION.md` for camera/material/lighting; `docs/EVALUATION_DRAFT.md` for proposed evaluation. No clinician/educator review or learner study has occurred. Device-local only, fictional patients, no gameplay analytics. Real iPhone Safari, assistive technology, fun, learning and harder-scenario balance remain unvalidated.
