Current people/animation iteration: [runtime157 notes](docs/PEOPLE_PRESENCE.md), including executed Blender work and remaining reference gaps. Model1.0.0-rc9 is unchanged.

# hospitalSIM — first-minute flow (RC9)

Build reception and hire Quinn to open. Add a GP and hire Mira while the first neighbor checks in. Four seeded first-minute arrivals create a small, visible queue; completed consultations earn $180. The next construction prompt follows the actual intake/GP queue, scaled by existing room count. Construction stays live, with pause available. No new service family, management menu or progression system was added in RC9.

Play https://arjansinghpuniani.com/playground/hospitalsim . [Current flow, Blender execution, verification and limits](docs/FIRST_MINUTE_RC9.md). [Actual patient-loop movie and retained reference comparison](https://arjansinghpuniani.com/hospitalsim/docs/first-minute.html). Substantial AI assistance; this remains an engineering prototype.

---

## Historical equipment release

# hospitalSIM — equipment that unfolds (RC8)

Build on a **32 × 28** estate with quarter-cell rotation/confirmation, **16-minute** new-clinic shifts and room-specific three-piece equipment packages. Equipment unfolds into the actual room; saved purchases remain visible.

Play https://arjansinghpuniani.com/playground/hospitalsim . [Current model, executed Blender pipeline, tests and limitations](docs/EQUIPMENT_RC8.md). Films and comparison: `/hospitalsim/docs/equipment.html`. Substantial AI assistance; this remains an engineering prototype.

---

## Historical RC6 campus

# hospitalSIM — room to grow (RC6)

Juniper Clinic now has a **24 × 20 cell estate**: about 6.7× the old 9 × 8 area. Build near reception first, then expand north and east. **Land** shows the whole estate; **Home** returns to your starter clinic. Existing clinic saves expand without resetting visits or billing. Room and staff safety limits rise to 64 each; dense overviews still exceed the provisional mobile graphics budget.

Play: https://arjansinghpuniani.com/playground/hospitalsim . [Campus implementation, reproducible checks and limitations](docs/CAMPUS_RC6.md). Public evidence: `/hospitalsim/docs/campus.html`. Run `python3 tools/qa-server.py --port 8769` and `node tests/campus.mjs` from this directory. No new Blender execution for this land change; existing editable sources and GLBs remain unchanged.

---

# Historical RC5 clinic flow

Reception and an administrator first, then a GP. Patients arrive in everyday clothes, check in, spin into gowns, queue for their booked service, and change back before leaving. Completed services earn individual fees. Pharmacy, neurology, gait assessment, video EEG and sleep labs open as booked visits need them. Existing hospitals remain device-local and can be archived/restored.

See [current model, executed Blender work and limitations](docs/CLINIC_FLOW_RC5.md). Play: https://arjansinghpuniani.com/hospitalsim/index.html . The current evidence page is /hospitalsim/docs/clinic-flow.html. Run with `python3 tools/qa-server.py --port 8769`; run `node tests/clinic-flow.mjs` plus the regression checks below.

---

## Historical RC4 opening

# Little Juniper: the default opening (RC4)

The game now begins with an empty clinic. Build the first consultation ($900), then hire/assign Mira ($800). This opens the doors and starts the eight-minute clock. Before opening, time and operating expenses stay still. The first default visit completes at game second 40.

The first chapter is deliberately consultation-only, with no reception staff or surprise incidents. After helping one neighbor, choose a faster room, a second room with its own doctor, or waiting seats. Seats change where people wait; they do not increase clinical capacity. Existing full hospital scenarios remain in Shift settings → More challenges & reports. This chapter does not yet grow continuously into those advanced scenarios.

Existing saves are preserved until the player chooses an empty clinic. Starting over first appends the current hospital to a device-local archive; Previous hospitals restores it. A failed archive write prevents replacement. No records leave the device unless the player explicitly exports them.

Model: `1.0.0-rc4`. Default scenario: `first`. Historical regression setups now explicitly request `neighborhood`. Old RC3 saves migrate without resetting their visits, assignments or routes. The old full-hospital arrival schedule and service rules remain unchanged.

New checks: `node tests/opening.mjs` and `node tests/browser-opening-rc4.mjs` from hospital-sim-source. The actual first-minute video and state log are in public/hospitalsim/docs/first-clinic.html. Original Blender sources and licenses below remain applicable. No new Blender execution was needed for this opening.

This is an AI-assisted engineering prototype. The simpler opening has not undergone external usability or learning evaluation, and it is not evidence of superiority over a commercial game.

---

# hospitalSIM — playable1.0.0-rc3

An original, substantially AI-assisted browser hospital management release candidate for Arjan Singh Puniani. Real-time Three.js dioramas use reproducible Blender equipment and rigged characters. It is not certified production-ready, clinically validated or demonstrated superior to a commercial game.

Play: https://arjansinghpuniani.com/playground/hospitalsim (check the in-game model label for the deployed version). Direct game: `/hospitalsim/index.html`. The preserved2D game is `dist/legacy/`; existing portfolio REPLISOME remains independent and accessible as an optional science workstation.

Current walking and first-minute changes, model observations and limits: [RC3 notes](docs/LOCOMOTION_RC3.md). HistoricalRC1recording outcomes are not presented asRC3results.

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
node tests/locomotion.mjs
node tests/browser-opening.mjs
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
