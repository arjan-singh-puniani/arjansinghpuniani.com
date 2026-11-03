# RC3: walking and the first minute

Substantial AI assistance. This is a playable release candidate, with no validated enjoyment or educational benefit.

## Executed changes

Blender4.0.2 reauthored locomotion on the13original39-joint rigs (two staff bases and11patient variants). The new in-place stride is1.11375metres over0.9seconds, with reduced foot lift, heel/toe roll and arm swing. Original body meshes, wardrobes, resting, transfer and task clips remain intact. Small walk-only GLBs use a three-vertex skin carrier; the browser loads only their clips. Editable source is `blender/locomotion.blend`; regenerate with `blender --factory-startup -b --python blender/locomotion.py`.

Source stance checks at quarter frames measured maximum support-foot drift0.002465m and minimum sole-0.001341m. These describe the authored straight walk, not world-space curved or blended contact. Browser gait phase is driven by actual translated metres, not a free-running clip clock. Idle/Walk/task transitions blend and restore effective animation weight after manually sampled transfers. Pause holds the phase. Reduced motion preserves smooth positional interpolation without limb cycling. Tiny route arcs are used only when clear of platform collision bounds; tight turns remain square. There is no full-body inverse-kinematics or collision-aware ragdoll solver.

Patient, staff and support routing now advances at most three quarter-cells per fictional second, approximately1.2375m/s. This changes model outcomes and future timing; old visit timestamps and reservations are retained on import. All comparisons must name the model version. The historicalRC1recording is not a recording ofRC3, and its action replay is no longer claimed identical under this model.

## Opening decision and evidence

The neighborhood's first three scheduled arrivals occur at1,5and9seconds; other arrivals keep their prior schedule. The first goal is one neighbor home, then the full shift goal. The player places a consultation; Sage physically arrives before it opens. The next action follows the neighbor using the added room, without opening the long inspector. A selected service visit shows actual progress.

Measured seed431, first60ticks, construction at0: baseline first-three cumulative wait58s; added consultation27s. Both complete one visit by60s; the added room serves additional consultations rather than magically adding downstream capacity. The first three are still ordinary fictional cases and keep their scenario flags. An unattended baseline with incident responses completes7; the documented managed plan completes13, with5departures and9unfinished. These are regression observations, not general strategy superiority. The slower walk reduces some completed counts; tests retain accounting, reservation and timing invariants instead of assuming monotonic improvement.

## Verification scope

The new locomotion regression uses the actual Three.js mixer to reproduce zero clip weight after manual sampling and checks restoration, distance-based phase, no cycling without translation, all13rig assets, useful first-minute construction and active save/load equivalence. Platform-clearance checks exercise the actual rounded-route sampler. Existing suites exercise100whole-shift paired runs and other invariants. Browser and narrow-viewport evidence is retained separately. Desktop Chromium/Apple M2 emulation does not establish actual iPhone Safari performance or native touch behavior.

Remaining gaps: procedural anatomy, rigid garments, approximate hands and task contact; limited character personality; no external enjoyment or learning study. The resulting first minute is a tested design revision, not evidence that players find it fun.
