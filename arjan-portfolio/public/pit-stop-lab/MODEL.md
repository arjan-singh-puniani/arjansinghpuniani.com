# Pit Stop Lab 2.0 — model and implementation

This is a reduced-order educational model of a generic four-wheel Formula-style pit stop. Pit-stop telemetry is calculated rather than measured. The optional decision room separately loads measured historical OpenF1 laps, stints, weather and race-control records for ML calibration; it does not provide live telemetry. The retained center-lock assembly is the original application's geometry. The car, people, environment and all timings are illustrative; no team hardware specification or certified operating procedure is reproduced.

## Run locally

From `arjan-portfolio/`, use `npm run dev`, then open `/playground/pit-stop` for the portfolio embed or `/pit-stop-lab/index.html` for the standalone lab. For the static lab alone: `python3 -m http.server 4173 --bind 127.0.0.1 --directory public`.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. With that static server running, execute `node tools/pit-stop/browser-qa.mjs`. `PIT_STOP_URL` changes the server origin and `PIT_STOP_EVIDENCE` changes the screenshot/report directory (default `/tmp/pit-stop-evidence`). The repository's `test:e2e` script has no existing Playwright configuration or e2e directory; the explicit browser script provides this lab's regression checks.

## Architecture and scope

- `simulation.js`: configuration validation, seeded generator, exact-event scheduler, corner states, snapshots, telemetry, sensitivity, bounded Monte Carlo and linear tire strategy. No DOM, renderer, clock or audio dependency.
- `facility.js`: instanced three-bay campus, display stocks, furnishings, lighting and a preparation trolley.
- `operations.js`: read-only operational projections from snapshots, including inventory, concurrent service roles, blocking tasks and pipeline state.
- `world.js`: the miniature scene, generic vehicle and crew, camera interpolation, component picking, and preserved mechanical inspection. Consumes the same snapshots in both scales.
- `crew.js`: deterministic bay-relative body paths, compiled world-space foot contacts, standing/kneeling posture and two-link limb bends. Each support foot stays fixed until its next swing; contact plans also reproduce under backward seeking. The upper body pivots at the pelvis. This is authored animation, not motion capture or a whole-body collision solver.
- `mechanics.js`: extracted original wheel, retained nut, hub, brake, suspension, chassis corner, wheel gun and jack construction; original component explanations, cutaway and exploded geometry remain available.
- `audio.js`: the original procedural Web Audio synthesis, activated by an explicit user action. Operational sounds are triggered from scheduled events.
- `main.js`, `index.html`, `style.css`: playback clock, responsive drawers, event tracks, SVG telemetry, experiments, strategy, accessible controls and export.
- `intelligence.js`: pure historical-data validation, filtering, ridge training, chronological evaluation, stint bootstrap and race-scenario comparison.
- `intelligence-ui.js`: on-demand decision room, historical refresh/import, model audit and decision export.
- `data/bahrain-2024.json`: compact, attributed OpenF1 historical snapshot.
- `tests/pit-stop.test.js`: deterministic domain and analytical checks. `tools/pit-stop/browser-qa.mjs`: rendered interaction/regression checks.
- `src/app/playground/pit-stop/page.tsx`: retained public route, canonical metadata, schema and iframe integration, with updated copy.

No framework migration, new runtime dependency, remote script or downloaded 3D asset. Existing local Three.js and OrbitControls are retained. Other portfolio applications are outside the change.

## Clock, scheduler and random variation

`simulate(configuration)` compiles a directed acyclic graph of operations. Each event starts at `max(earliest, all dependency completion times)` and ends at `start + duration`. Each event has an ID, track, state, car number, start, end, duration and dependency IDs. A chronological event list and per-car corner schedules form the immutable experiment.

`snapshot(simulation, time)` evaluates every position and state directly at a clamped finite time. There is no accumulated physical state to rewind. Browser frame rate controls only when snapshots are presented. A separate session clock advances from monotonic wall-clock elapsed time and playback multiplier; pause, seek, step and reset freeze or reconstruct that clock. Hidden/offscreen time is excluded. Reduced-motion preference disables requested autoplay and camera transitions; intentional playback remains available.

An unsigned 32-bit seed initializes Mulberry32. Each variable task duration is `nominal × (1 + variability × (U1 + U2 − 1))`, with independent uniform draws. This is a symmetric bounded triangular distribution, not an empirically fitted team distribution. Corner reaction offsets are uniform on `[0, coordination]`. Scenario penalties are explicit additions. A seed and configuration reproduce identical events, results and snapshots. Rendered audio noise is intentionally outside the simulation.

## Dependency graph and corner mechanics

Car stop starts two independent jack lifts and a positioning/reaction task. Every wheel corner has its own ordered states:

`READY → GUN_APPROACH → SOCKET_ENGAGED → LOOSENING → NUT_RELEASED → WHEEL_REMOVAL → WHEEL_CLEAR → REPLACEMENT_ALIGNMENT → WHEEL_INSTALLED → TIGHTENING → FASTENING_CONFIRMED → TOOL_CLEAR → COMPLETE`

Gun approach can overlap lifting. Loosening waits for the socket and both completed lifts. Old-wheel removal follows fastener release. Replacement alignment follows complete old-wheel clearance. Tightening follows installation. Confirmation follows tightening. Tool and carrier clearance follow confirmation. Each corner proceeds independently; wheel durations are never added across corners to determine stop time.

Each snapshot includes car kinematics, independent front/rear lift, corner state/progress, old/new attachment, retention, gun activity, crew task/clearance, tool engagement/clearance and safety guard conditions. The world uses those quantities for wheels, gun, carrier hands, jack motion and release indicators. Crew poses are authored procedural segments, not a biomechanical inverse-dynamics or contact simulation. The detailed view switches to the original rig at the selected corner's timestamp, rather than playing its old fixed 3.05 s choreography.

Normal release requires four confirmed wheels, tools and crew clear, both jacks lowered and clear, and no conflict in the defined traffic window. The unsecured-wheel scenario never schedules jack lowering or departure; completed timing metrics are `null`, displayed as HOLD. No unsafe-release mode is provided.

The critical chain is reconstructed backward through each event's latest-finishing predecessor. Tied chains use a stable corner/dependency order; the highlighted chain is one of the valid critical paths. A corner's slack is the last corner completion minus its own completion. Event inspection names its immediate blocking dependencies. A critical alignment extension changes the stop directly; a small noncritical extension can consume slack without changing departure.

## Kinematics and timing definitions

Approach speed is converted from km/h to m/s. The driver travels at constant speed `v` for a response interval `r`, then decelerates constantly at positive `a` to rest:

- `t_approach = r + v/a`
- `d_approach = v r + v²/(2a)`
- During braking, `v(t) = v − a(t − r)` and remaining distance is `0.5 a (v/a − (t − r))²`.

Stop error shifts the stopping location longitudinally and adds `abs(error)/1.5 m/s` to crew positioning time. This penalty models crew relocation, not tire friction or driver control dynamics. The poor-position scenario enforces at least 0.45 m error.

Departure covers 30 longitudinal metres with constant 8 m/s² acceleration capped at approach speed. A schematic lateral blend moves the car into the fast lane between 7 and 15 m after departure; lateral dynamics and tire loads are not calculated. The path shown by the Motion path option depicts this centerline. Wheel rolling rotation uses traveled longitudinal distance / tire radius. The miniature path and traffic conflict window are teaching representations, not a circuit reconstruction.

- **Stationary**: complete stop to departure motion onset, including settling, service, clearance, lowering, confirmation and any release wait.
- **Service**: positioning-start timestamp to the final completed fastening confirmation. This excludes final tool clearance, jack lowering and traffic waiting.
- **Transit**: response/braking approach plus departure. In double stack, add the second car's 0.9 s transfer from the queue marker.
- **Queue wait**: second car's arrival at the queue marker to transfer start. Separate from its stationary service interval.
- **Pit-lane total**: transit + stationary + queue wait. This is the modeled local entry-to-exit segment, approximately 45 m at defaults, not a complete real circuit pit lane.
- **Race loss**: local segment total minus `(approach distance + 30 m) / 55 m/s`, an explicit synthetic no-stop equivalent-position reference. It is not an imported race delta. For Car 02, the same moving reference and approach time are reused, with queue/transfer added; this is a simplified shared-segment accounting convention.

Displayed millisecond digits expose deterministic differences, not measurement precision. The final result cards are completed-experiment predictions; the session clock and inspector are current-state measurements.

## Scenarios and contention

1. Coordinated: default independent bounded task variation.
2. Slow gun: FR loosening and tightening each receive +0.45 s.
3. Misalignment: RR alignment receives +0.65 s and the incoming wheel visibly oscillates through an authored correction.
4. Poor position: at least 0.45 m stopping error, with an explicit relocation penalty for all crews.
5. Traffic: a car crosses a designated release conflict interval beginning `trafficAt` seconds after stopping and lasting `trafficWindow`. If release confirmation plus required gap overlaps that interval, departure waits until conflict end plus gap. Otherwise there is no traffic penalty.
6. Double stack: Car 02 reaches a queue marker 9 m behind the box after `arrivalSpacing`. It waits until Car 01 clears a 7 m longitudinal envelope at the modeled exit acceleration, plus `occupancy` reset time. A smooth 0.9 s queue-to-box transfer follows. Every service event has a car ID; Car 02 gets its own complete wheel service. The transfer is a prescribed kinematic movement, not a tire-force model.
7. Unsecured: RR never confirms retention; safe hold persists for the finite observation horizon. The absence of a completed stop is not replaced with a fictitious duration.

## Sensitivity, uncertainty and strategy

Sensitivity changes one configured parameter while preserving the seed and all other inputs; parameter bounds apply. It reports before/after stationary times and limiting corners. Pinning a scenario retains its actual result for comparison with subsequent experiments.

Monte Carlo uses 1,000 or 3,000 sequential seeds and the same configuration/distributions. It yields to the browser every 40 runs. P10, median and P90 use linearly interpolated empirical quantiles. Exceedance is `(completed times > threshold + held runs) / all runs`; held runs are counted as over threshold and reported separately. A held batch has no finite quantiles. The histogram contains completed outcomes only. No confidence intervals, fitted probabilities or claims of real-team reliability are made.

Race strategy uses a fictional constant-pace rival, an explicit horizon and three stop choices (now, in one lap, in two laps). Old tires cost `degradation × tire age` per lap. New tires cost compound offset plus `degradation × compound wear × laps since change`; the first new-tire lap adds 0.35 s warm-up. Soft: offset −0.6 s, wear 1.6; medium: 0 s, wear 1; hard: +0.5 s, wear 0.65. Every alternative adds the current experiment's race loss exactly once. A positive cost for waiting is an illustrative undercut benefit; negative favors waiting (overcut). Reported gaps are at the end of the chosen horizon, not instantaneous pit-exit gaps. No professional strategy, weather, stochastic race traffic, energy, fuel-load or tire-temperature model is implied.

## Numerical provenance

All defaults below are authored illustrative choices. The operational sequence is informed by the references; no individual slider is presented as a measured 2026 team timing. The Mercedes historical explainer describes approximate operation scales (about half a second to loosen, a further second for wheel replacement, roughly four tenths securing, roughly two tenths dropping), rather than supplying a complete independent task-time dataset.

The 60 km/h approach is a teaching choice below the FIA 2026 default limit of 80 km/h; the Race Director may amend that limit. 8 m/s² exit acceleration, 30 m departure, 55 m/s race reference, 1.5 m/s crew relocation, 7 m box envelope, 0.9 s queue transfer, all strategy parameters and every scenario penalty are illustrative constants.

| Parameter | Default | Supported range |
| --- | --- | --- |
| Approach speed (approachSpeed) | 60 km/h | 30–80 km/h |
| Braking capability (deceleration) | 12 m/s² | 5–18 m/s² |
| Braking response (driverResponse) | 0.22 s | 0.05–0.6 s |
| Stop-position error (stopError) | 0.03 m | 0–0.7 m |
| Position settling (positioning) | 0.08 s | 0.02–0.4 s |
| Gun alignment (engagement) | 0.2 s | 0.08–0.6 s |
| Fastener operation (fastener) | 0.3 s | 0.15–0.8 s |
| Old-wheel extraction (removal) | 0.35 s | 0.15–0.8 s |
| Replacement alignment (alignment) | 0.36 s | 0.15–0.9 s |
| Wheel installation (installation) | 0.18 s | 0.08–0.5 s |
| Per-task variability (variability) | 0.06 fraction | 0–0.3 fraction |
| Rear-right extra alignment (rrDelay) | 0 s | 0–1.5 s |
| Front-jack engagement (frontJack) | 0.22 s | 0.1–0.7 s |
| Rear-jack engagement (rearJack) | 0.26 s | 0.1–0.7 s |
| Jack release (jackRelease) | 0.2 s | 0.1–0.6 s |
| Crew reaction (reaction) | 0.1 s | 0.04–0.4 s |
| Corner reaction variation (coordination) | 0.04 s | 0–0.25 s |
| Equipment clearance (clearance) | 0.24 s | 0.1–0.7 s |
| Release confirmation (confirmation) | 0.12 s | 0.05–0.6 s |
| Second-car spacing (arrivalSpacing) | 1.6 s | 0.8–10 s |
| Box reset after clearance (occupancy) | 0.25 s | 0–2 s |
| Traffic arrival after stop (trafficAt) | 2.5 s | 0–7 s |
| Traffic conflict duration (trafficWindow) | 1.5 s | 0.5–3 s |
| Required release gap (releaseGap) | 0.5 s | 0.2–2 s |

## References checked 24 October 2026

- [FIA 2026 Sporting Regulations, Section B, Issue 09, 1 October 2026](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_b_sporting_-_iss_09_-_2026-10-01.pdf), B1.6.2: safe release and safe vehicle condition; B1.6.3: default speed limit and event variation. The lab's departure timestamp is motion onset; the FIA's regulatory release definition uses axle passage and is deliberately not claimed by the lab. Our explicit guard is a teaching implementation of safe operation, not a claim that the rules mandate this exact software sequence.
- [Mercedes-AMG PETRONAS, Chasing Pit Stop Perfection](https://www.mercedesamgf1.com/news/insight-chasing-pit-stop-perfection): historical roles, parallel wheel service, human traffic oversight and approximate task scales. Team practice, not regulation.
- [Formula 1, Gone in 1.9 seconds](https://www.formula1.com/en/latest/article/f1-quest-perfect-pitstop.1lwNTV7z6MiEA2weCMsS8E), 9 January 2017: captive wheel nuts, timing convention and coordinated wheel-gun operation. Historical context, not current hardware specification.

## Performance, fallback and limits

The original Blender GLB supplies the car; shared geometry and instancing serve the procedural garage, crew and preserved campus. Pixel ratio is capped at 1.6. Detected software renderers start at ratio 1, without dynamic shadows, and submit at most 15 frames per second. A GPU fence prevents an unbounded queue of unfinished frames. The procedural wall monitors reuse one canvas texture, updated at most five times per simulated second from actual corner snapshots. Seeking and mode changes do not allocate new GPU resources after initial visibility upload. Rendering stops while hidden/offscreen; the simulation clock excludes those intervals. ResizeObserver, input handlers, controls, geometries, materials, textures, renderer and audio are released on teardown. WebGL context loss leaves analysis usable; restoration resumes rendering. A WebGL construction failure retains the full timing model and the 2D analysis dock.

Desktop 60 fps and physical mobile 30 fps are targets, not broad compatibility assertions. Headless Chromium emulation does not establish physical-device performance. The scene has estimated reference geometry, authored articulated motion, no rigid-body collision/contact solver, no hose dynamics, no force/torque model and no CFD. The original mechanical PNG is retained. The active OpenGraph and Playground WebP previews are actual browser captures of the garage. Real timing import, longer stints as an optimizer, full race traffic and professional hardware calibration are deferred.


## Pit complex expansion — 25 October 2026

The facility now includes three furnished bays (race operations, aero assembly, tire preparation), a static teal assembly car, detached aero elements, compound-organized display tires, cabinets, tools, overhead reels, a pit-wall command area, safety fencing, grandstand seating, planting and flag structures. These are illustrative assets, not a representation of a specific team's building. Adjacent bays and monitor artwork are static exhibits; no fake telemetry or invented operational percentages are shown on them.

The reference screenshot informed the miniature scale, clustered equipment and spatial object labels. Its WareTrack branding, figures and business model are not used.

A startup event named `REPLACEMENTS READY` lasts `min(0.9 s, approach duration)`. It is an explicit prerequisite of positioning/service. A preparation worker and cart move on a prescribed path during that interval. The 0.9 s and 3.3 m path are authored teaching choices, not measured supply logistics. The trolley displays four tires; its capacity, delivery force and subsequent replenishment are not simulated. The supply worker is separate from the 14 scheduled pit-service roles.

`operations(sim, snapshot)` computes the following without storing independent state:

- Active corner stations (0–4) and scheduled active service crew (0–14: three per active wheel corner and one per engaged jack).
- Secured wheel count, current blocking critical-chain event and exact remaining duration.
- A five-stage progression: arrival, lift, parallel corner service, clearance/verification, departure. Retention-hold scenarios never display a completed departure.
- Service inventory: four allocated replacements per scheduled car, remaining replacements, fitted replacements and removed wheels. This inventory is reconstructed at any seek time. The compound rack's 36 display tires are separate scenery, not stock deducted from this inventory.

Spatial pins follow the wheel stations and report exact corner states, or inspect garage, tire preparation and pit-wall assets. The facility plan projects modeled longitudinal position and the same authored lateral release blend used by the scene. It shows Car 02 and conflicting traffic only when those entities exist in the scenario. Off-plan positions are clamped at the map edge.

Daylight, golden-hour and night controls change actual scene illumination. Night enables local garage/service lights. Mechanical inspection keeps its studio lighting. Roof section toggles the modeled removable roof slab. These controls alter presentation, not the operational outcome.

Pinning a run also retains its full compiled schedule. The optional translucent reference car evaluates that saved schedule at the current run's session time, so changing timing inputs can reveal a different departure position. Its simplified attached-wheel silhouette is a trajectory comparison, not a second complete mechanical-service animation. The two runs share a pit-entry time origin and use their respective model results; no extra random draw is introduced by the ghost.

Vehicle surfaces are longitudinal lofts with generic undercut sidepods, cooling features, wing elements, suspension and diffuser strakes. Crew hands, limbs and footsteps remain authored kinematics driven by the authoritative timestamp; there is no full constrained IK, contact solver, or calibrated human gait. All eight arm/leg segments of each person share an instanced skeleton. Body and carrier translations blend continuously between preparation, work and clearance positions.

The expanded browser runner adds spatial asset inspection, KPI consistency, inventory, roof geometry, three lighting presets, full-complex cameras, reference ghosts, map visibility and mobile-header checks to the original regression suite. Physical GPU/phone performance is still unverified; software rendering measurements are retained in the dated validation report.

## Historical ML decision room · 25 October 2026

Open **Strategy → Open decision room**. This is an added analytical layer; the original synthetic strategy sandbox and deterministic mechanical simulation remain available. Historical inputs and hypothetical race-state assumptions are labeled separately. No generative AI or remote inference service is used. The trained statistical model and scenario evaluator run locally without new dependencies.

### Evidence and preparation

The included OpenF1 snapshot is race session **9472**, Sakhir, 2 March 2024, retrieved 25 October 2026. Its five source requests are linked inside the audit: [sessions](https://api.openf1.org/v1/sessions?session_key=9472), [laps](https://api.openf1.org/v1/laps?session_key=9472), [stints](https://api.openf1.org/v1/stints?session_key=9472), [race control](https://api.openf1.org/v1/race_control?session_key=9472), [weather](https://api.openf1.org/v1/weather?session_key=9472). Fields follow the [OpenF1 documentation](https://openf1.org/docs/). Historical access is public; the app does not subscribe to real-time feeds.

The compact bundle keeps the original required field values, not invented laps: 1,129 laps, 63 stints, 71 control messages, 157 weather samples. Joining uses driver and stint lap ranges. Age is `tyre_age_at_start + lap_number − lap_start`. Start/pit-out laps, first laps of stints, inferred pit-in laps at non-final stint ends, incident laps and their successors, neutralised intervals, incomplete timings and duplicate driver/lap pairs are removed. A 107% pace gate uses only that driver's training-period median, not future lap outcomes. Yellow flags are conservatively applied to all drivers for that lap. Chequered flags are retained. Unsupported compounds/drivers with too few examples are omitted. Wet or unknown-rainfall bundles and missing race-control evidence block training.

This yields **974 accepted / 155 excluded** laps: 105 start/pit exclusions and 50 incident exclusions. The fixture supports soft and hard tires; medium is not fabricated. Track temperatures span 21.9–26.5 °C. Weather is context, not a learned causal predictor. Imports are not cryptographically authenticated; the user is responsible for their provenance. Schema, session identity, dates, size, numerical bounds, dry conditions and training coverage are checked before replacing a working calibration. Invalid imports or failed requests preserve the previous model.

### Learned model and held-out evaluation

Ridge regression minimizes `Σ(y − Xβ)² + 0.1 Σ βⱼ²`, leaving the intercept unpenalized. Features are intercept, race lap / 60, compound-specific age / 30, compound offsets (first compound is reference), and driver offsets (first driver is reference). Targets are observed lap durations in seconds, centered during fitting. Normal equations are solved directly; no opaque inference or rules presented as ML.

Training uses accepted laps **through lap 45** (745 samples). Laps **46–57** (229 samples) are held out. The fit never uses their durations. Held-out MAE is **0.409521 s**; the driver's training mean on that compound has **0.828059 s** MAE on the same laps. Positive prediction bias is **0.281370 s**, P90 absolute error **0.860586 s**. This is within-race pace evaluation, not evidence of cross-circuit generalization, improved race wins, or a reconstructed prospective decision at an earlier lap of that same historical race. The decision room explicitly sets up a separate hypothetical race state.

Thirty-two seeded bootstrap fits resample whole training stints within each driver. The validation residuals form an empirical predictive-error pool, held constant for blocks of three simulated laps per car. Thus the held-out set evaluates the central pace model and supplies the scenario noise calibration; there is no independent validation of the combined strategy model. A data-perturbation test confirms that changing only held-out durations leaves all central/bootstrap training weights unchanged.

Driver intent, traffic, fuel burn, weather and tire management remain confounded. The race-lap coefficient is a shared trend, not a fuel-mass measurement. Compound slopes are predictive associations, not isolated physical degradation. The model does not implement a state-of-the-art claim: recent work such as [Cappello & Hoegh's Bayesian state-space approach](https://arxiv.org/abs/2512.00640) motivates separating latent tire/fuel effects and evaluating uncertainty; reproducing its methods or claiming its reported performance would require a separate implementation and validation.

### Strategy trials and probability meaning

Each candidate is stay out, or a supported compound at pit windows 0, +1, +2 and +5 laps (deduplicated/capped for short horizons). The default two-compound fixture produces nine actions. Users enter the selected car, race lap, horizon, tire ages, two rivals' gaps and pit intentions, full-lane transit loss, traffic cost, rival stationary time, and probability of one three-lap neutralisation. All are explicit assumptions rather than inferred current race state.

A trial draws one bootstrap model, the event lap, a sampled own-stop duration, and each car's residual blocks. All actions share those draws. A car's accumulated time is the sum of predicted lap times plus its stop loss when applicable. A rival starts with the entered signed gap; positive means behind. The score is the fraction of trials where your elapsed time is strictly less than every entered rival's. The UI says **first of entered cars**, never calibrated full-grid race-win probability. Ranking prioritizes that score, with median elapsed time as tie-breaker. Uplift is percentage-point difference from the selected baseline compound's box-now call. P10/P50/P90 summarize the gap to the fastest entered rival. Overlapping 95% Wilson intervals prompt retaining both leading calls. Wilson intervals cover Monte Carlo sampling error only; neither they nor the probabilities are calibrated against race-winning outcomes.

Your stop samples come from 128 deterministic reruns of the actual active pit configuration. They include stationary time, any stack queue and the 0.9 s box transfer. A failed retention guard blocks evaluation entirely. Rivals use their separately entered stationary-time assumption. **The local segment's ~6-second race-loss output is not used as full-lane loss.** Full-lane transit is an explicit independent input, added to stationary/queue costs. Neutralisation uniformly starts within the horizon, multiplies affected lap times by 1.4 and transit loss by 0.55. There is no safety-car pack compression. These factors and fixed traffic costs are illustrative scenario assumptions, not learned forecasts.

Training tire-age support is shown in the pace plot; extrapolating actions and rival plans are flagged. The evaluator does not enforce stock availability, sporting compound-use rules, overtaking, retirements, energy deployment, changing weather, pit-lane closures or multiple stops. It optimizes among a small, explicit set of actions rather than proving global optimality. Teams would need representative multi-session calibration, real state estimation, rules/inventory constraints, and independently calibrated outcome predictions before operational deployment.

### Refresh, export and validation

**Fetch & train** retrieves a completed historical race from OpenF1, sequentially with bounded requests and timeouts. **Import bundle** accepts schema-1 JSON up to 5 MB; files remain in the tab. Export the bundled data to see the required format. Data export preserves the calibration bundle. Decision export includes all race inputs, results, seed, validation, source/retrieval dates, learned coefficients with feature order, age support and the exact pit configuration. Export calibration data alongside decisions to reproduce the fit. Nothing is sent to an AI provider or stored remotely by this app.

Run `npm test` for the domain checks and, with the static and production servers described above, `node tools/pit-stop/intelligence-qa.mjs` for the decision room's browser checks. `PIT_INTELLIGENCE_EVIDENCE` chooses its report/image directory. Existing `node tools/pit-stop/browser-qa.mjs` covers the miniature, mechanics and legacy analysis. See `Documentation/Validation/PitStop/2026-10-25-intelligence.md` for exact results and verification limits.

## Direct interaction and data flow · 26 October 2026

The public route now uses a compact toolbar above the embedded lab; the introductory/case-study marketing sections and scene slogans have been removed. The scene offers **Watch stop**, optional **Loop**, and quick clean/gun-delay/traffic/double-stack experiments. The quick experiments preserve a clean run with the same configuration/seed as a visible reference ghost. Their stationary-time delta and queue cost come from the actual two simulations, not a preset claimed penalty.

`experience.js` selects camera targets from the current stop's actual approach, positioning, mechanical completion, retention and release boundaries. Cameras interpolate through the renderer's existing controls, or switch immediately for reduced-motion preferences. The explicit Watch action plays at 0.5×, without enabling sound. Manual camera/asset selection ends automatic direction. The optional loop waits 1.8 real seconds after a completed safe stop; safety holds never loop into a fabricated departure. Seeking cancels automatic direction and retains exact reconstruction of the underlying simulation.

**Data → decisions** opens from the world toolbar in one action. It loads the historical example, trains and evaluates the default scenario; existing calibration is reused when available. The Strategy entry remains available for manual calibration/evaluation. No background subscription or live data feed is implied.

`data-experience.js` draws a selectable dependency graph with the real record counts and calculation state:

- OpenF1 laps, stints and race-control messages → joined/filtered samples.
- OpenF1 weather → dry-condition gate and historical context, not learned pace features.
- Clean samples → trained/validated pace model → seeded race futures.
- The current pit simulation and separately entered race assumptions → race futures.
- Race futures → ranked decision.

Selecting a node highlights its upstream/downstream dependency paths and displays actual source samples or calculated values. Records use text content, never executable imported markup. Only the calculation state animates the connectors; completed historical records do not masquerade as an incoming telemetry stream. Selecting the pit source also offers a direct return to watch the active 3D experiment.

Each ranked action can be previewed in a **nominal dry pace replay** alongside the baseline and two entered rivals. `raceProfile()` builds cumulative lap intervals using the central trained coefficients and median own-stop sample (fixed entered rival service). At a planned stop it inserts full-lane transit + service/queue + traffic before lap movement. `raceFrame()` maps an arbitrary clock value to lap progress and PIT/TRACK/FINISHED state, so backward seeking reconstructs the same positions. Positive rival gaps delay their replay clock; negative gaps advance it. The circuit is schematic and does not simulate physical passing or pit-entry trajectories. This replay explicitly excludes random neutralisation/residual/model draws; it is not a sampled Monte Carlo outcome or an additional uncertainty claim.

Replay advances at 120× while explicitly playing. Pause, scrubbing, closing the room, and document hiding stop its clock; its animation frame is canceled. No frame loop is retained for an idle replay. Source-layout observation is disconnected on teardown. The existing main lab clock remains separate and pauses when entering the data room.

Additional checks: `node tools/pit-stop/experience-qa.mjs` exercises automatic camera direction, manual takeover, actual ghost comparisons, safe looping, graph samples/paths, one-action calibration, replay pause/seek/action changes, scene return and mobile layout. `PIT_EXPERIENCE_EVIDENCE` chooses its report/image directory. New domain assertions cover nominal pit holds, elapsed-time accounting, replay reconstruction and event-derived watch shots. See `Documentation/Validation/PitStop/2026-10-26-experience.md` for executed results.

## Garage, Explore and manual challenge · 26 October 2026

The default experience is a grounded garage with an original Blender SF-26 launch-reference study. It is an estimated visual recreation, not official Ferrari CAD. The original generic campus, timing, mechanics, synthetic strategies, historical ML, source graph and race replay remain in **Race Engineer**. Explore offers nine camera views, free orbit, click/hover component descriptions, hidden panels and isolated running gear. Branding is replaceable in `hero-car.js`; references, rights limits, editable source and exact export instructions are in `docs/pit-stop-assets.md`.

**Pit Stop Challenge** is a separate fixed, coordinated training setup using the current seed; it does not import an unsafe engineering scenario as a supposedly safe team stop. The player handles front-left service, while the other three corners follow the existing deterministic model. It is an illustrative procedure, not calibrated torque/force training. One reducer (`challenge.js`) accepts monotonically timestamped actions. Preparation, equipment positioning, stopped-car/jack gate, gun alignment, loosening, removal, seating, fastening, clearance, lowering and guarded release are explicit states. A secured wheel cannot be dragged off. The renderer uses the reducer's removal/alignment/installation/fastening/lift fractions through the existing corner contract. Other corners must actually be retained and clear; no automatic timer alone authorizes departure. No forces, pneumatic torque or exact team procedure are claimed.

Drag the gun marker onto the nut; hold it for loosening/fastening; pull outward and push inward for the wheel trajectories. The scene camera settles before contact. A focused contextual action offers the same procedure using Enter/Space or a held touch button, without precision dragging. Leaving the document pauses the clock, and blur cancels a held action. Error count and elapsed procedure time are recorded; zero-error personal best is stored locally when storage is available. The saved input trace replays through the exact same reducer. Replay cannot improve the score. The log stops growing after completion; no post-completion animation adds unbounded actions.

Paint regions share a continuous mesh; clearcoat, baked weave and rubber micro-normals use a generated room reflection map. Shadows and pixel ratio adapt to weak rendering. Detected SwiftShader/llvmpipe software renderers start at pixel ratio 1 with dynamic shadows disabled and a 15 Hz render ceiling to keep GPU queues bounded; the simulation clock remains independent. A soft, original contact-shadow approximation provides grounding when dynamic shadows are absent. This is a quality fallback, **not** evidence of 60 fps desktop or 30 fps hardware-mobile performance.

Additional checks: `npm test`, `python3 tools/pit-stop/assets/validate.py`, `node tools/pit-stop/garage-qa.mjs`. The last records the real application video, all required viewing angles, direct manipulation, retention/release, exact replay, keyboard alternative, preserved source graph, mobile layout and GPU allocation stability. Existing engineering browser scripts explicitly select Race Engineer before exercising their original features.
