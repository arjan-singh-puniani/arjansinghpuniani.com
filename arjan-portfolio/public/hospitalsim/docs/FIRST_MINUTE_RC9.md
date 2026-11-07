# First-minute flow — RC9

Model `1.0.0-rc9`, browser runtime `149`. Original AI-assisted engineering prototype for Arjan Singh Puniani. No production-readiness, educational-benefit or commercial-game-superiority claim.

## Opening and continuity

Fresh clinic: no rooms/staff, $9,000. Build reception ($400), hire/assign Quinn ($500) to open. Build GP ($900), hire/assign Mira ($800) during live arrivals. Staff enter through the actual entrance; each station waits for its own colleague. Seed431 arrivals begin at2,19,31,48. First three are routine GP-only; the fourth later needs the existing pharmacy. Fees/operating costs remain fictional. New opening shifts remain16minutes.

`enableFirstMinute` adopts only untouched closed default clinics; active/custom schedules retain their actual visits and tape. New flag `clinic.opening = reception-first` is validated. Unchanged legacy Boolean gentle schedules remain available. The default exit moves to x5.5 to shorten the first route; customized exits are retained. Saves preserve queues, assignments, visits, random state and time categories.

First reception hire+assignment+opening is one reversible planning action. Tick invalidates its undo. Construction stays live for this opening; explicit pause freezes it. Existing authoritative placement still rejects people, occupied equipment, blocked doors and disconnected routes. Fixed timestep remains independent of rendering. Guidance uses actual intake/GP waiting states, requiring two queued people per station before offering another. A new station requires its own paid colleague. The first completed GP fee is shown beside the real room; no fabricated progress or free capacity.

## Executed Blender work

Blender4.0.2 executed `blender/first_minute_motion.py` and retained `blender/first_minute_motion.blend`, `evidence/first-minute-rc9/blender-execution.log`, per-rig measurements and13 `assets/stride-*.glb` exports. Original geometry/39-joint rigs, substantial AI assistance, CC0-1.0. No downloaded/ripped assets. Original earlier GLBs remain byte-for-byte. See ASSET_MANIFEST.json and ASSET_LICENSE.md.

Each export has Walk, SeatDown, SeatUp and Sit. Walk:0.8s, shorter stride,56% stance,26mm swing lift. Maximum authored support drift2.26mm; minimum authored sole about2.2mm below nominal floor. Exported chair support drift below0.63mm across13rigs. These are clip-space checks, not perfect in-game contact. Renderer walks to the chair's standing foot point, uses0.65s seating within the existing3s doorway reservation, then rests. Leaving reverses this before movement. Reduced motion uses endpoints. Original anatomical simplifications remain. Face/hand quality and exact prop contact still need work.

Route sampling merges collinear waypoints, eases only obstacle-clear corners and locks gait time to travelled distance. Conversation head/forearm gestures alternate during actual seated consultation. Three.js sanitized bone names are handled in both landing and conversation gestures. No new service/drama system.

## Reproducible checks

From `hospital-sim-source`:

```sh
python3 tools/qa-server.py --port 8772
node tests/first-minute-rc9.mjs
node tests/browser-first-minute-rc9.mjs
node tests/clinic-flow.mjs
python3 tools/audit-assets.py
```

Run all canonical tests with Node, excluding Finder copies whose names contain spaces.32 suites passed, covering arrival conservation, capacity, route/door blocking, occupied removal, staffing, fixed-seed replay, exact save/load, bounded fatigue, timing conservation and shift termination. The chair endpoint contract in clinic-flow.mjs now explicitly ends the walk at the foot point; seated behavior uses authored clips.

Native film `evidence/first-minute-rc9/desktop-loop.mp4` records real browser game0–90,90.868real seconds, seed431. GP built/staffed at4, first fee49, Maya home61,2completed by90. Second reception/admin at80. Native checkpoint, full action list, tracked visit and all final counts replay exactly. Public film is losslessly remuxed for seeking; no synthetic scene frames. Canvas captions summarize HTML actions rather than recording menus. Runtime146 film uses the same RC9 model;149 fixes camera/control/prompt presentation. Failed earlier QA hires uncovered a moving button centre; final fixed transport keeps its centre stable. Those failed runs are not presented as successful films.

Paired model experiment: same exogenous tape, seed431, GP staffed at10, compare no expansion versus extra reception/admin placed(.25,22) at51. At180, waiting282 versus230ticks;3completed in both, with extra staffing/operating costs. Sample count:one deterministic pair. This is a model check, not proof of general strategy or learning benefit.

## Browser and measurement limits

Desktop and390×844 in-app Chromium, AppleM2. Placement/first hires on first clicks, real door entry, live construction, GP chair sit/stand and opposed seats, first fee/exit, second paid reception/admin, pause, reduced motion and no horizontal overflow checked. Visible primary controls at least44px high. Native movie playback/seek inspected. No unresolved application errors observed. Phone camera keeps the opening desk/GP/doors together rather than centring each newly placed room. Browser inspector latency is not included as a user responsiveness benchmark.

Initial65GLBs measured6,357,443gzip bytes, plus runtime/vendor; optional equipment lazy-loads. Three-patient/two-staff snapshot49,409main-pass triangles /57calls. A pooled1800frame phone-width sample33.41ms mean /50ms p95 includes pause/inspector activity, not a controlled real-device benchmark. A later run during host dependency/build work measured42.49ms mean /100ms p95,1.60s placement preparation,45.2ms pickup preparation. Physical-phone responsiveness is not established. Physical iPhone/Safari, thermal behavior, background lifecycle and assistive-technology audit remain unverified. Dense campuses exceed provisional graphics limits. See browser-checks.json and regressions.json.

## Remaining quality gaps

The supplied reference has richer faces/fabric, smoother material lighting, softer contact shadows, denser intentional composition and convincing clinician hand contact. The fresh runtime149 reference comparison uses the advanced compact scene at129, paused,1.16× camera zoom. The left panel retains the supplied earlier comparison; the right is an unretouched current browser screenshot. RC9 does not rebuild scanner/equipment geometry. The empty estate remains plain; queues are rigid; people are simplified procedural humans. Sitting and walking improve contact but are not bespoke full-body task performances. This pass establishes functioning measurable interactions, not that play is fun. No outside player/clinician/educator review or learning study occurred. Evaluation protocol remains a draft. No new analytics or personal data collection.
