# People and presence — runtime157

Model1.0.0-rc9 is unchanged. This release develops the people and the existing opening loop, without adding another management screen. Substantial AI assistance; original procedural geometry, rigs, materials, writing and animation, CC0-1.0. No reviewer, player-study, educational-effectiveness or reference-parity claim.

## Executed Blender work

Blender4.0.2 actually executed `blender/people_presence.py -- --parallel` and `blender/people_motion.py`. Editable combined sources: `people_presence.blend` and `people_motion.blend`. Execution logs and per-actor measurements live in `evidence/people-presence/`.

35 original skinned actors: eleven patients in everyday clothing, eleven gown variants and thirteen staff roles. Face, jaw, eyelid, hand and digit geometry is protected from body reduction. Clothing receives local subdivision and 3–4mm modeled folds. Twelve deterministic local occlusion rays per vertex produce restrained baked shading in the embedded colour palette; two adjacency smoothing passes avoid speckle. Each actor still uses one skinned draw primitive and39joints. No acquired human-model license dependencies. Original source GLBs are retained.

13 motion packages preserve the existing Walk/SeatDown/SeatUp/Sit tracks, with new waiting/breathing/blinking, greeting and thanks actions. Staff packages also contain seated typing, counter work and an authored attending pose. The current opening uses reception greeting/counter work, GP typing blended with conversation, patient waiting and goodbye. The attending clip is retained source work, not evidence of a bespoke bedside performance. Walking remains distance-driven; no new gait speed or simulation timing changes.

Hand contact is measured on actual skinned exported index-finger vertices, not just rig targets. The Blender evaluated pose is updated before local hand-axis roll. GP keyboard is raised18mm to sit on the actual desk and aligned with the authored reach. Reception keyboard is centred at the actual staff post. CPU skinning checks strip texture references only in memory; the delivered GLBs keep embedded textures, checked separately in browser. These two keyboard performances pass sampled fingertip clearance checks. This does not establish perfect contact for every hand or item across the hospital.

A second Blender execution of `blender/drape.py -- --fit-people` retained `people_drape.blend` and exported a fitted original cloth. The old mesh let shoes protrude by up to about65mm in the new resting skins. The revised contours clear the sampled torso/feet and lift while gathering lengthwise. Existing transfer/uncover timing, bed capacity and the original `drape.glb` are preserved. The check evaluates actual skinned positions for all eleven variants; see `asset-motion-tests.json`.

## Play and presentation

The existing empty reception → paid administrator → live GP build → paid GP → consultation fee → exit flow is retained. New equipment rises and settles over0.8s when a room is placed; reduced motion snaps to its final transform. One existing speech bubble now carries short original dialogue at real reception, consultation and goodbye states. It consumes no simulation randomness and invents no diagnosis or outcome. Existing pickup reactions, half-opacity dangling and green landing cells remain.

The walkable slab is aligned to the actual0.25m character floor, correcting an approximately9cm visual gap. Two instanced foot contacts follow the actual feet. Ordinary view frames a platform around the built clinic; Land, building and pickup reveal the entire32×28 estate. This is presentation cropping, not a change to walkability, routing, capacity, land ownership or saved layout. All three advanced equipment platform heights remain. Warm key/fill balance, exposure and shadow softness are adjusted. Character detail no longer pops out when zooming to inspect someone.

Replacing a hospital clears previous actor/room render objects so reused IDs cannot retain the wrong role appearance or platform. A new source-method check covers state identity and browser import checks cover rendering.

Active saved shifts resume paused after loading, preserving the current visit rather than consuming time while the player gets oriented. Explicit Resume continues the same state. Existing saves and local archives remain supported. No analytics, external patient data or new dependencies.

## Reproduce and verify

From `hospital-sim-source`:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -t 1 --python blender/people_presence.py -- --parallel
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -t 2 --python blender/people_motion.py
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -t 2 --python blender/drape.py -- --fit-people
node tests/people-presence.mjs
python3 tools/audit-assets.py
python3 tools/qa-server.py --port 8774
```

Canonical game checks exclude recovered Finder files whose names contain spaces. All34 test files passed, plus the new native155 recording replay: actual new skin/clip structure, preserved old gait/chair transforms, planted standing feet, keyboard contact, room reveal/reduced endpoints, state-derived dialogue; simulation arrival conservation, capacity, blocked routes, occupied removal, staffing, timing, fixed seed, save/load and shift termination. Historical evidence generated by old tests is preserved at its original revision; current run outputs are in `regressions.json`. Portfolio34 test files /301 assertions and typecheck passed; production build result recorded separately.

Browser evidence and native recording are described on the public `docs/people-presence.html` page. Local test server request backlog initially caused module-load failure; restarting the isolated QA server with uncached responses and a larger request backlog resolved it. This was not represented as a successful game load. Runtime graceful failure remained visible.

## Limits

This is an engineering game slice, not production-ready and not equivalent to the supplied reference or a commercial hospital game. The reference has richer faces/hair, cloth silhouettes, subtle material response, authored full-body interaction and softer integrated light. New folds and AO improve the existing procedural people but do not replace a dedicated character art/animation pass. Generic legacy work poses, hand contact outside the tested desks, crowd spacing, rigid queues, and the sparse empty estate still need improvement. No matching-reference or outstanding-fun claim follows from a passing export/test.

Physical iPhone/Safari, thermal stability and accessibility conformance are not established by desktop narrow-viewport testing. The owner reported runtime150 responsive and clear; that does not validate this heavier character release. The latest physical retest must be recorded separately. No clinician/educator review, learner evaluation or broad balance/playtesting has occurred. The evaluation protocol remains a proposal.
