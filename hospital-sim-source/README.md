# hospitalSIM · Hospital diorama

An original, AI-assisted browser hospital management vertical slice for Arjan Singh Puniani. **Not production-ready.** No clinician review, learner study, educational efficacy, clinical experience, admissions impact, or external collaborator contribution is claimed.

## Run and reproduce

No package installation or build step is required. From this directory:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
node tests/diorama.mjs
node tests/expansion.mjs
node tests/release.mjs
node tests/motion-release.mjs
node tests/animation.mjs
node tests/simulation.cjs
/Applications/Blender.app/Contents/MacOS/Blender --factory-startup -b --python blender/hospital.py
/Applications/Blender.app/Contents/MacOS/Blender --factory-startup -b --python blender/characters.py
/Applications/Blender.app/Contents/MacOS/Blender --factory-startup -b --python blender/drape.py
```

Open `http://127.0.0.1:8765`. In the portfolio repository, serve `arjan-portfolio/public` from its repository root and open `/hospitalsim/index.html`; the retained REPLISOME is the sibling `/replisome/index.html` there. Serving only the symlinked hospital directory runs the hospital, but its optional science module needs that sibling route. Blender 4.0.2 was actually executed on macOS. The sandboxed launch could not access Metal device registration; approved execution outside that restriction worked. `rtk` was requested by local instructions but is not installed; shell calls used a pass-through function named rtk. Python 3.10, Node 22, Three.js 0.186.1, the browser SDK, and bundled FFmpeg were available. There is no asset-store dependency.

## Play

The hospital starts moving immediately. A shift lasts 480 fixed one-second ticks: eight real minutes at 1×, with 3× and pause. Select people/equipment in the scene or use People & rooms. Choose a module, preview a clear location, and place with pointer, keyboard arrows/Enter, or the non-spatial location selector. Escape cancels. Build mode pauses time; press Play when finished. Undo works only before time advances or another policy action takes effect.

Rooms need explicit clinicians from the unassigned pool. Recruitment supplies a person, not a global speed bonus. Upgrades improve only the selected module and add a visible brass rail badge. Occupied/reserved rooms cannot be removed. Costs, wages, times, flags and outcomes are fictional gameplay parameters.

Shift settings has five scenarios in sandbox or a mastery campaign, a manual surge, reduced motion, optional sound, checkpoint import/export, the experiment lab, a device-check panel and an unvalidated assessment draft. Debrief exports readable JSON with definitions and denominators. Autosaves stay on this device. No analytics, external gameplay transmission or real patient information. Previous v1 local saves remain untouched; v2 uses a separate key. Corrupt or unsupported checkpoints are rejected without replacing the current shift.

## Architecture

- `dist/simulation.mjs`: original LCG, BFS and pathway adapted into a renderer-independent fixed-timestep model. Explicit assignments, queues, protected breaks, access delay, budget, actions, reports and import validation.
- `dist/renderer.mjs`: Three.js adapter; metre-based GLBs, orthographic framing, depth/picking, route floor instances, ghost placement, animation mixers, shadows, material/LOD handling.
- `dist/app.mjs`: UI/input, fixed-step accumulator, local persistence, recording and report download.
- `blender/hospital.py` and `characters.py`: reproducible original geometry/material/rig/clip exports. Editable `.blend` sources retained. `blender/textures/` retains procedural texture sources; PNGs are embedded in equipment GLBs and also exported separately.
- `dist/vendor/`: locally served Three.js modules and MIT license; no CDN runtime dependencies.

## Preserved content and integration

The original Site source commit `bc5c124a881bbc7e91f1c120a70d51ff36130fd8` was archived before edits and work began on `hospital-diorama`. The original Canvas experience remains at `/legacy/`, with its original simulation tests and documentation. The same Common Good Site identity, static deployment configuration and owner-private audience are retained.

hospitalSIM replaces the REPLISOME card as the lead Playground project in an isolated portfolio branch. The existing `/playground/replisome` and `/replisome/index.html` remain intact. REPLISOME is lazy-loaded from the hospital science workstation; hospital time and rendering pause until it is closed. Its original Site remains separate and unchanged. Actual publication is recorded in the release evidence; a prepared branch alone is not a deployment.

## Status

Implemented: three original medical zones, rigged scrub/coat/patient figures, nine clips, selectable patients and rooms, fictional consultation → optional imaging → care → exit, route-aware construction, five buildable module types, explicit staffing, upgrades, queue policy, fatigue/breaks, access delay support, eight-minute shifts, 1×/3×, local saves/checkpoints/reports, planning undo, responsive lists and controls, reduced motion, background pause, loading/failure handling, and recording.

Implemented since v0.2: campaign/unlocks; compatible staff skills and manual assignments; handoffs and local personality tradeoffs; procedural plants/prints/palette decoration; checkpoint branching and paired future experiments; opt-in sound; smaller traffic nodes, occupied-route yielding and detours; original eyelid/jaw/finger rigging; three-second bed entry/exit clips; community follow-up specialist planning and a future access workshop; broader automated balance checks. The lab and device/assessment tools are in `dist/extras.mjs`; shared definitions are in `dist/content.mjs`. `dist/experiments.mjs` is pure and runs through a module worker.

Remaining visual/model limits: original procedural humans still have coarse anatomy, simple clothes and repeated appearances; heading transitions are softened and patients walk through doorways, but interior turns and clinician hand contact remain approximate; the mattress is rigid with up to 12 mm authored soft overlap. Crowd routing is conservative grid traffic, not a continuous human dynamics solver. The specialist zone reuses the planning equipment. The community workshop is a narrow fictional access-delay mechanism, not a full longitudinal care or prevention model. These are disclosed limits of implemented features, not claims of commercial-studio polish.

Real evidence still pending: actual iPhone Safari results, assistive-technology user testing, qualified clinician/educator review, learner sessions and any learning-effectiveness study. A local assessment form and evaluation protocol are drafts; producing them does not complete an evaluation.
Unvalidated: accessibility conformance, real midrange mobile performance, clinical assumptions, learning transfer, educational effectiveness and professional reception. A desktop narrow viewport is not a phone benchmark. This build is a working vertical slice with remaining visual and interaction gaps; the supplied reference remains more realistic.

See `docs/MODEL.md`, `docs/ART_DIRECTION.md`, `docs/EVALUATION_DRAFT.md`, `CHANGELOG.md`, `ASSET_MANIFEST.json` and `evidence/` for details.

## v0.4 changes

Renamed hospitalSIM at the owner’s request. Fixed visit timing double-counting: each elapsed tick now belongs to exactly one of waiting, walking, handoff, equipment transfer or service. Prior saves retain an explicit elapsedOffset rather than silently rewriting historical observations. Old corridor positions/routes may shift to the nearest clear position for the new platform-clearance rule; migration is recorded. New patients spend three seconds entering and three seconds leaving each room. Quarter-grid navigation retains the same 1.65m/s nominal walking speed and provides passing space. Doorways remain reserved through service and exit. These changed model parameters make v0.3 outcome counts unsuitable as v0.4 benchmarks.

Neighborhood guidance asks players to add consultation then inspect/upgrade care. The v0.4 goal permits eight departures, with an18-second baseline arrival interval. This is an explicit scenario adjustment for the added doorway time and body clearance, not evidence of real hospital economics.

## v0.4.1 motion corrections

Blender was executed again for a phase-correct walk: opposite arm at heel strike, less crouched midstance, and a small lateral weight shift. Nine clips and39bones remain; all non-Walk actions were numerically unchanged. Measured authored stance drift remains3.06mm maximum. This is an improvement to the existing procedural gait, not motion capture or a claim of reference-level animation.

Manual bed-transfer sampling now bypasses clock-dependent fades. Staff take explicit three-second doorway transitions before/after protected breaks, and lounge entry/exit when built. Capacity returns only at the workstation. This adds modeled break travel time; prior v0.4 checkpoints retain visits and assignments. The care clinician steps aside rather than snapping, and Escape restores inspector trigger focus. Import rejects negative service durations. The portfolio mobile embed expands to the game's actual content height to reduce nested scrolling.
