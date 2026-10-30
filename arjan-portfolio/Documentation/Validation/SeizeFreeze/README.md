# SeizeFreeze anatomical interface — release verification, 30 October 2026

This revision replaces the procedural head and cortical slab with attributed Human Reference Atlas brain and registered head skin. The compact proposed device is anchored to an actual vertex of the named left superior temporal gyrus. This is an illustrative reference target, not a clinically localized epileptogenic zone.

## What works

- Placement, Assembly and Signal + control share the same scene and simulation. Region, Interface and Head views preserve the target; Reset restores a useful camera.
- A continuous peel slider, named layer buttons, click picking and keyboard alternatives open a local scalp, bone, dura and arachnoid window. Pia follows the atlas folds and stays attached. CSF is represented as a compartment marker.
- Skull and dura are explicitly schematic inward offsets of registered skin, not segmented patient bone or meninges. Window size, flap hinges, thicknesses and exploded spacing are explanatory. The model does not establish an implantation method or chronic packaging solution.
- The assembled contact remains 10 × 10 mm (assumed). Exploded components, selection connections and individual seating remain spatially registered to the cortex. Device dimensions are concept assumptions.
- The existing worker solver, synthetic signals, 11 illustrative scenarios, local accessible equations, energy ledger and three explanation depths remain functional. No seizure suppression is inferred from the signal animation or anatomical tint.
- Static reference render, keyboard controls, paused reduced-motion opening and solver/graphics failure states remain usable. Static imagery is labeled as a reference render; numerical readouts remain interactive.
- Case-study iframe and full-screen launch continue through the existing portfolio routes and hosting project.

## Reproduce

From the repository's `arjan-portfolio` directory, Node 20+:

```sh
npm ci
node tools/seizefreeze/anatomy-asset.mjs
node tools/seizefreeze/model-check.mjs
npm run lint -- --ignore-pattern 'public/hospitalsim/vendor/**'
npm run typecheck
npm run test:coverage
npm run build
npm run start -- --port 3214 --hostname 127.0.0.1
```

The asset builder reads the repository's already attributed `public/atlas/anatomy/brain.glb` and `body.glb`. It embeds source hashes, retained parcel names, units, license and modifications. Derived GLB SHA-256: `a8a3383d5ac5122e13e1d8372eb662211abcb73ecb3722ce70edf5c1f83ff60e` (6,573,512 bytes). Regeneration on the clean production-base checkout reproduces that hash.

With locally installed Playwright Chromium, Firefox and WebKit:

```sh
SEIZEFREEZE_BASE_URL=http://127.0.0.1:3214 node tools/seizefreeze/browser-qa.mjs
SEIZEFREEZE_BASE_URL=http://127.0.0.1:3214 node tools/seizefreeze/anatomy-qa.mjs
SF_QA_URL=http://127.0.0.1:3214/seizefreeze-lab/index.html node tools/seizefreeze/accessibility-qa.mjs
SEIZEFREEZE_BASE_URL=http://127.0.0.1:3214 node tools/seizefreeze/integration-qa.mjs
SEIZEFREEZE_BASE_URL=http://127.0.0.1:3214 node tools/seizefreeze/regression-qa.mjs
SEIZEFREEZE_BASE_URL=http://127.0.0.1:3214 node tools/seizefreeze/performance-qa.mjs
```

Run performance alone, after other browser jobs close. Native Chromium requests Metal; recorded adapter strings establish whether native graphics was actually used. Firefox's executable fallback is specific to this host's installed revision. Phone and tablet checks are desktop-host viewport emulation, not physical-device testing.

## Build and numerical results

Next 15.5.28 production build, TypeScript, all 150 existing tests and the scoped lint command pass. Lint retains 21 existing unused-variable warnings in unrelated projects. Unmodified `npm run verify` still fails on inherited HospitalSIM third-party renderer lint errors; it is not reported as passing, and no unrelated source or lint setting was changed.

The unchanged solver passes its limiting cases, parameter sensitivity, sensor loss, finite rejection, determinism and convergence checks. Across all scenarios, maximum energy residual is **1.59 × 10⁻¹² J**, below the **10⁻⁸ J** numerical tolerance. Default 0.01 s time steps differ from the 0.0025 s reference by approximately **0.00656 °C**; reconstructed surface temperature with 0.5 mm cells differs from the 0.25 mm reference by approximately **0.0575 °C**. These are discretization comparisons, not physiological accuracy or uncertainty bounds.

`MODEL.md` defines equations, parameters, units, assumptions, boundaries and omitted physics. The depth-only solver predicts no lateral cooling field or therapeutic volume. It does not solve the displayed cranial layers individually. `EVIDENCE.md` maps scientific and project claims; `ANATOMY.md` records geometry and localization limits; `THIRD_PARTY_NOTICES.txt` retains asset and runtime attribution.

## Three rendered review passes for this revision

1. **Scientific coherence and teaching:** `anatomy-pass1-desktop.png` and `anatomy-pass1-intact.png` exposed an opaque oversized head obscuring the brain. Registered the device to an actual atlas parcel, changed the region context to translucent surroundings, retained an opaque Head view, distinguished arachnoid from pia, and kept the thermal result restricted to the assumed contact. Source/terminology review was performed by internal agents, not independent clinical reviewers.
2. **Geometry, materials and camera:** `anatomy-pass2-desktop.png`, `anatomy-pass2-interface.png` and `anatomy-pass2-assembly.png` exposed overly bright surfaces, dark overlapping flap undersides and insufficient assembly separation. Reduced exposure, separated flap angles, closed the bone edge, improved underside lighting, increased exploded spacing and tilted the Assembly camera. That oblique view initially exposed an occluding lifted flap; close-ups now hide the cranial coverings, including the oversized window rim, and picking ignores hidden ancestors. Placement and Head retain all covering flaps. Seated dimensions remain unchanged. Updated evidence: `anatomy-refined-assembly-1440.png` and phone equivalent.
3. **Mobile, accessibility and failure behavior:** `anatomy-pass2-phone.png` exposed clipped long annotations and camera controls below the peel panel. Shortened anchored mobile labels, moved camera controls above the canvas, compacted the heading, and removed the duplicate heading inside the case-study embed. Updated actual renders: `anatomy-pass3-desktop.png`, `anatomy-pass3-phone.png`, the anatomy QA camera/layer series and cross-browser results. Static fallback now uses an actual attributed anatomy render rather than the old slab. Repeated surface samples are cached to reduce loading work without changing geometry.

## Browser, accessibility and integration evidence

`browser-results.json` records Chromium at 390/768/1440/1920 widths and Firefox/WebKit at 390/1440. All eight cases pass: no page overflow, script errors or missing assets; assembly seating, anchored camera views, 11 model scenarios, changed initial conditions, equations and static restoration work. Native Chromium reports ANGLE Metal / Apple M2. Firefox reports its privacy-limited renderer string; it must not be interpreted as a hardware identification.

`anatomy-qa.json` adds continuous peel endpoints, layer buttons, native range Home/End/Arrow keys, camera target invariance, mount offset, contact scale, actual lid picking through hidden coverings, reduced-motion idle behavior, sensor-failure actuation off, and WebGL-unavailable operation at phone, tablet and desktop widths. Nine automated axe scans across all modes and three sizes find zero violations. Manual/incomplete checks remain recorded and are not accessibility certification.

`accessibility-results.json` adds keyboard assembly, playback/scrubbing, static mode, focus indication, small targets, non-repeating live announcements and worker failure behavior. `integration-results.json` checks homepage launch, embedded model, full-screen route, canonical URL and unrelated portfolio routes. `regression-qa.mjs` confirms restored 3D agrees with the currently scrubbed frame rather than a stale cooling state.

## Performance and asset budget

Final isolated results on this desktop host at DPR 1:

| Backend | Viewport | Startup | Rendered update rate | 95th percentile interval |
| --- | --- | --- | --- | --- |
| Native ANGLE Metal / Apple M2 | 1440 × 1000 | 2.31 s | 60.14 fps | 16.7 ms |
| Native ANGLE Metal / Apple M2 | 390 × 844 | 2.22 s | 60.05 fps | 16.7 ms |
| Explicit SwiftShader 3D | 1440 × 1000 | 4.55 s | 1.05 fps | 1300 ms |
| Explicit SwiftShader 3D | 390 × 844 | 4.63 s | 1.45 fps | 1377 ms |

The complete public laboratory, all local math fonts/docs/licenses and shared Three.js/GLTFLoader inventory total **9,570,986 bytes raw / 4,864,073 bytes per-file gzip**. This is an inventory, not initial transfer or a measured internet load time. The atlas asset is 6.57 MB raw. The interface scene submits 55 calls and 397,277 triangles; the full context view uses approximately 454K triangles. There are four textures, 66 geometries and a DPR cap of 1.6 (1.0 on software). One queued frame can settle after active measurements stop; paused reduced-motion and static-mode checks verify no continuing render loop.

`performance-results.json` contains exact measurements and the per-file inventory. CPU submission time is not GPU execution time; local results do not guarantee physical-phone performance. Rendering occurs on demand; no decorative idle animation runs. Software rendering is a separate, slower path: the application opens the static reference view automatically on a detected software backend and lets visitors explicitly request 3D. Static mode suspends hidden GPU renders while numerical readouts and plots remain interactive. The performance script explicitly re-enables 3D before measuring that backend.

## Release boundary and remaining limits

Release branch: `codex/seizefreeze-anatomical-interface-20261030`, based on production main `788c70b1313bbe2fd021f40d20d6ad1f0309d4d4` (user-squashed PR #61). Only SeizeFreeze application assets, source notices, checks and validation evidence are included. Domain, dependencies, unrelated pages and integrations retain production state.

Target: existing Vercel **arjan3 / arjansinghpuniani-com**, **arjansinghpuniani.com**, through its existing GitHub integration. Inspect the branch preview before production promotion. Deployment URLs and actual hosted checks are recorded separately; local success does not establish deployment.

No physical phone, SeizeFreeze hardware, patient localization, clinical effect, independent expert review, chronic interface, safety threshold, current patent legal status or media-rights contract was validated. The provisional filing remains explicitly founder-reported. These limits do not change through visual refinement.
