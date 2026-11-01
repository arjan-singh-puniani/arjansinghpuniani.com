# SeizeFreeze studio revision — 31 October 2026

## Artifact and release identity

The inspected production URL still served commit 788c70b1's procedural tissue-block application while PR #62 remained open. `redesign-before-live.png` captures that actual live view with a detected native Apple M2 Metal adapter; it was not the static fallback. The HRA anatomical revision existed only on the pending release branch. PR #62 was merged during this work, followed by unrelated HospitalSIM PR #63. The studio revision is rebased onto that latest production main on `codex/seizefreeze-studio-20261031`; no unrelated changes are reverted or included in its patch.

## Implemented behavior

The opening now gives the reference anatomy the full viewport. The compact proposed device remains mounted on the actual named left superior temporal atlas parcel. A synchronized second camera enlarges the same device state and exact local atlas triangles; it is explicitly labeled ENLARGED. The neutral dashed leader links that view to the main placement rather than depicting a heat path. Actual mesh picking in the enlarged view opens the corresponding component in Assembly.

“Explore layers” restores the intact reference head. Subsequent keyboard or pointer actions advance scalp → bone flap → dura → arachnoid → interface inspection; pia remains attached. The continuous slider and named layer buttons remain alternatives. Initial overview hides the coverings for clarity; Head view restores their context. The final seated component restores the compact assembly overview.

The native renderer uses more legible neutral anatomy, brighter titanium-like surfaces, cached device-contact shadows and 650 ms visitor-initiated camera transitions. Reduced motion makes camera transitions immediate; paused scenes have no idle animation. Two-finger input supports dolly/rotate, with native keyboard and view-button alternatives. Labels remain world anchored. The inset, component model and thermal contact tint share the same state.

All thermal calculations, synthetic signals, detector assumptions, finite heat rejection and numerical energy accounting are retained. No new biological model, patient localization, efficacy claim or safe operating setting is introduced. See ANATOMY.md, MODEL.md and EVIDENCE.md beside the public application for interpretation and sources.

## Three actual rendered review passes

1. **Composition and teaching:** `studio-pass1-desktop.png`, `studio-pass1-phone.png` and `studio-pass1-assembly.png` exposed dominating lifted flaps, a dark device lid, repeated bottom annotations and the disconnect between true-scale placement and device detail. Added the explicitly labeled second camera and connector, clean opening overview, brighter materials, guided peeling and one concise scene caption. Historical baseline is `redesign-before-live.png`.
2. **Materials and physical framing:** Native Metal comparisons found atlas self-shadow checker artifacts. Atlas meshes now receive device-contact shadows without casting those unstable self shadows. The enlarged view reuses exact local triangles rather than another full brain pass; geometry bounds and shadows are cached. Exploded device camera offsets were adjusted to keep the lower case above view controls, including on phone. `studio-final-1440.png`, `studio-final-390.png`, the studio lens images and assembly images show the resulting renders.
3. **Mobile, accessibility and failures:** Actual 390 px renders exposed camera buttons partly hidden under the peel card; 320 px wrapping worsened it. Controls were raised and their clearances are now asserted: approximately 20.75 px desktop, 19.61 px tablet and 11.75 px at 390/320. A bright brain underneath tablet target text required a dark inspector background. A contrast-gradient pseudo-element caused phone horizontal overflow; its bounds were corrected. Final 320/390/768/1440 checks pass without page overflow. Default software graphics remains static; the optional software 3D stress test exposed severe full-head transparency overdraw, addressed with reduced overlays and resolution.

## Verification

- TypeScript, scoped lint, production build and existing portfolio tests pass. Legacy HospitalSIM vendor lint remains excluded explicitly; no unrelated lint setting or source is changed.
- `studio-qa.json` verifies guided steps, keyboard/slider/layer alternatives, camera target invariance, real projected-lid picking, static lens hiding and suspended render counts, sensor-failure actuation off and matching numerical readouts. It includes 19 rendered captures and 320 px reflow checks. Nine automated axe scans report zero violations; manual color-contrast checks are retained as manual items, not certified away.
- `browser-results.json` records all eight Chromium/Firefox/WebKit viewport cases. No script errors or missing assets; assembly, equations, model parameter changes, 11 scenarios and static restore pass.
- `integration-results.json` checks the case-study iframe, full-screen launch, homepage launch, canonical URL and unrelated portfolio pages. `accessibility-results.json` checks keyboard controls, reduced motion, no-WebGL and worker-failure states. `regression-qa.mjs` confirms restoring 3D uses the current model frame.
- The unchanged numerical checks pass with maximum energy residual 1.59e-12 J against 1e-8 J tolerance. Temporal refinement comparison is approximately 0.00656 °C and spatial reconstructed-surface comparison approximately 0.0575 °C; these are numerical differences, not physiological confidence intervals.

## Reproduce

From `arjan-portfolio`, use the committed package lock and installed Playwright binaries:

```sh
npm ci
node tools/seizefreeze/model-check.mjs
npm run lint -- --ignore-pattern 'public/hospitalsim/vendor/**'
npm run typecheck
npm run test:coverage
npm run build
npm run start -- --port 3216 --hostname 127.0.0.1
SEIZEFREEZE_BASE_URL=http://127.0.0.1:3216 node tools/seizefreeze/studio-qa.mjs
SEIZEFREEZE_BASE_URL=http://127.0.0.1:3216 node tools/seizefreeze/browser-qa.mjs
SEIZEFREEZE_BASE_URL=http://127.0.0.1:3216 node tools/seizefreeze/integration-qa.mjs
SF_QA_URL=http://127.0.0.1:3216/seizefreeze-lab/index.html node tools/seizefreeze/accessibility-qa.mjs
SEIZEFREEZE_BASE_URL=http://127.0.0.1:3216 node tools/seizefreeze/regression-qa.mjs
SEIZEFREEZE_BASE_URL=http://127.0.0.1:3216 node tools/seizefreeze/capture-studio.mjs
```

Run `performance-qa.mjs` separately, after all other browser jobs close. It measures both full-scene peeling and laboratory scrubbing; native Metal and explicit SwiftShader are recorded separately. Native tests include DPR 1 and high-DPI emulation, with the actual capped pixel ratio and adapter recorded. `capture-studio.mjs` rebuilds the attributed SVG static poster from the actual native render; it does not invent a separate device image.

## Performance and remaining limits

Native ANGLE Metal / Apple M2 held approximately **60.00–60.15 fps** in all eight 3-second workloads (peeling and model scrubbing at desktop/phone viewport sizes, including requested DPR 2 and 3 capped at 1.6). Native 95th percentile animation intervals were **16.7–16.8 ms**. The explicit SwiftShader path measured **0.15–1.52 fps** across four workloads and retained occasional long frame stalls; it is not a comfortable continuous 3D path. Its default is therefore the responsive static reference view, with optional reduced 3D clearly labeled slow. Do not describe software 3D as fluid or free of stalls.

The measured complete inventory is **9,639,856 bytes raw / 4,890,914 bytes per-file gzip**, including the laboratory, all math fonts/docs/licenses and its reused Three.js, GLTFLoader and BufferGeometryUtils dependencies. This is not initial network transfer or measured internet startup. Exact startup, draw calls, triangles, pixel ratio and results per viewport are in `performance-results.json`. Startup-to-model and first-3D-frame timings are distinguished. CPU submission time is not GPU execution time. Tests use a desktop host, viewport and DPR emulation; no physical-phone performance is asserted. The software path defaults to the static image; explicitly requested software 3D is a reduced rendering path with the same numerical model.

The reference atlas is not a patient scan or diagnosed epileptogenic zone. Cranial coverings, access window, device dimensions and interface choice remain schematic or assumed. No physical implant, clinical outcome, independent expert certification, current patent legal status or historical film-media contract was validated. Hosted preview and production status are recorded in the separate release handoff; local success alone does not establish deployment.
