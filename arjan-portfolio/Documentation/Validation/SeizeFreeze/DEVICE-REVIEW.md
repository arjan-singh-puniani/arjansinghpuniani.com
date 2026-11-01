# SeizeFreeze device construction review — 1 November 2026

This revision preserves the published studio layout and reference anatomy. It addresses demonstrable physical explanation defects in the device, using the supplied anatomical cutaways as visual references only. It does not create validated implant CAD or device measurements.

## Baseline findings

Captured in device-before-*.png and device-before-audit.json: incomplete TEC interconnects; a stretched device transform; rigid contact/cortex intersections; buried sensor pads; an open lid/rail assembly presented as packaging; an undestined hot-side stub. Exact baseline geometry findings and primary-source context are in public/seizefreeze-lab/DEVICE.md.

## Numerical and evidence review

The new assert-based device-check.mjs verifies the actual atlas footprint by two independent triangle-intersection implementations, edge cases with all source vertices outside the rectangle, upper-surface selection, analytical flat/sloped cases and explicit incomplete-coverage failure. A single 74-node, 73-edge path contains all 36 alternating N/P legs and 35 interconnects. It verifies all nominal thermal layer interfaces. Scale is one on all axes.

At the expanded reference footprint, minimum raw-cortex rigid clearance is 0.3000000 mm (display assumption); the datum-to-cortex gap sampled at 0.5 mm spans approximately 1.11–8.03 mm. The displayed envelope uses a 24 × 24 grid and a 0.20 mm offset above raw cortex; its metadata records its distinct rendered thickness range. The pia proxy is a display surface, not segmented meninges. Contact-envelope thickness exposes an unresolved mechanical/thermal interface; it does not establish material suitability or the solver's assumed 4 K/W contact resistance.

The thermal model remains unchanged: maximum whole-system energy residual 1.58465e-12 J against tolerance 1e-8 J, temporal refinement error 0.006558 °C, reconstructed-surface spatial error 0.057462 °C. Energy closure verifies accounting, not biological prediction. No thermal coefficients or masses are inferred from rendered dimensions.

## Verification commands

    node tools/seizefreeze/model-check.mjs
    node tools/seizefreeze/device-check.mjs
    npm run typecheck
    npm test
    npm run lint -- --ignore-pattern 'public/hospitalsim/vendor/**'
    npm run build
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3218 node tools/seizefreeze/device-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3218 node tools/seizefreeze/studio-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3218 node tools/seizefreeze/browser-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3218 node tools/seizefreeze/integration-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3218 node tools/seizefreeze/performance-qa.mjs

Use the production Next.js server for all checks: npm run start -- --hostname 127.0.0.1 --port 3218 after the build. The actual final test run used a high-backlog static server on 3219 for laboratory checks and Next.js on 3220 for integration. A preliminary Python default-backlog server caused connection resets; those failed infrastructure attempts are not reported as device passes. Run performance measurements alone, with other test browsers closed.

## Boundaries

Reference atlas placement is not patient localization. Materials, fixation, encapsulation, power delivery, long-term rejection, sensor calibration, packaging lifetime and hardware fault protection remain unqualified. Physical phones, implant hardware and clinical outcomes are not tested. Specialist software/source review is not independent clinical expert review.


## Upstream test-harness exception

After rebasing onto e28be96b (hospitalSIM PR #68), the ordinary suite reports 149/150 passing: its existing hospitalSIM desktop-iframe test throws because JSDOM lacks window.matchMedia, newly called by that unrelated mobile-launch change. Neither that component nor its tests are changed in this release. The earlier cffbed07 baseline passed 150/150. The harness exception is recorded, not hidden by modifying unrelated product code. A temporary external test configuration supplying a matchMedia browser-API stub is used as an additional check; the normal command's failure remains part of the record. Real-browser portfolio integration checks exercise the actual browser API independently.


The additional browser-API harness passes all 150 tests. Reproduce it without editing the default harness:

    npx vitest run tests --config Documentation/Validation/SeizeFreeze/unit-browser-api.config.mjs

The shim supplies matchMedia with matches=false, exercising hospitalSIM's desktop iframe branch. Mobile launch behavior is checked in a real browser; this shim is not physical-phone testing.


## Rendered review passes

1. Scientific coherence and teaching: inspected native desktop opening, lens, exploded and seated views against the numerical circuit/atlas checks. The first section left the PCB, hot spreader and upper ceramic hiding the legs. The independent actual-route audit found coincident signal conductors. Fixes: authored capped half-sections through the three broad plates; separated surface routes with distinct lanes/elevations; raised surface rendering above the pia proxy; labeled the circuit's through-solid overlay. Initial defects are retained in device-review1-defect-*.png.
2. Construction, materials and interaction: inspected the updated desktop section and enlarged lid; semiconductor legs and alternating patterned interconnects are now visible, case walls/rounded corners/feedthroughs are continuous, and the hot spreader reaches the shell. Corrected inward triangle winding on the contact envelope and electrode sidewalls, matched pin/hole polygon facets, removed incompatible UVs before batching, and excluded hidden/overlay meshes from selection outlines. Unit scale and assumed dimensional guides remain consistent. Updated device-pass2-*.png records the result.
3. Mobile/accessibility/failure behavior: inspected 390, 768 and 1440 pixel device renders, notes, closed/section toggles and keyboard circuit activation. Phone captures explicitly return to the scene after selecting lower controls. No horizontal overflow; dimensions and explanations remain readable. The original scene suspension outside the viewport is retained; verification waits for its on-demand frame. Final Chromium/Firefox/WebKit tests, automated accessibility scans, WebGL/worker failure paths and static-state restoration pass. These are desktop-host viewport tests, not physical-phone testing.

Actual sampled signal routes were independently checked segment-by-segment: the smallest interchannel jacket clearance is approximately 0.05645 mm and all conductor gaps are positive. This establishes separation of illustrative paths, not wire manufacturability or implant insulation qualification. No source screenshots or private documents are republished.


The software-renderer review removed environment-map prefiltering from that path; native Metal lighting is unchanged. Software still defaults to the attributed static render and requires an explicit request for reduced 3D. Native and software measurements, startup times and asset sizes are recorded separately in device-final-performance-results.json. No GPU execution timing is inferred from CPU submission timing.

New validation records use device-final-*.json; complete uncropped browser evidence is preserved in the recoverable release package. Previous studio reports and captures retain their historical contents.


## Final measured budgets

Eight native Metal workload probes across four viewport/DPR profiles measured approximately 38.5–60.1 rendered fps after adaptive DPR. The high-DPI desktop case improved from about 23.4/30.9 fps (peeling/lab) to 38.5/58.5 fps. These short probes are observations on this host, not guarantees for other hardware. Four explicitly requested software-3D probes measured 0–0.55 fps with multi-second stalls; software remains static by default. Native rendering stops when idle, paused or outside the viewport.

The complete lab plus shared Three.js dependency inventory is 9,686,087 bytes raw / 4,907,664 bytes summed gzip, including documents, local equation fonts and the 6,573,512-byte reference GLB. This is an asset inventory, not a measured network-transfer size. Original construction uses code geometry, with no new raster model/texture downloads. Exact adapter, startup times, DPR changes, counts and per-asset bytes are in device-final-performance-results.json.

Release limits: software 3D performance remains poor, no physical phone/hardware/clinical tests, and the ordinary unit command retains the documented upstream JSDOM API exception. All 150 tests pass in the explicit browser-API verification harness; real-browser mobile and desktop hospitalSIM launch checks also pass.
