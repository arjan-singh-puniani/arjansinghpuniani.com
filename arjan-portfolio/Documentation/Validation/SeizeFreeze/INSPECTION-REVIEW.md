# SeizeFreeze inspection and comparative model review — 1 November 2026

The revision develops the published device construction into a focused inspection experience and adds a reproducible resistance-sensitivity study. It does not add bench data, a selected implant architecture, validated sensing, biological suppression or clinical predictions.

## Rendered passes

1. Physical explanation and framing: reviewed the published cutaway, then native desktop assembly and isolated TEC renders. Found that the full bright atlas competed with engineering details, selection did not reframe, label positions could sit beneath the inspector and glyph halos were heavy. The Device chapter now uses an explicit inspection stage with fitted assembly/component cameras and an appropriate device-local up direction. Contact and sensing close-ups keep the exact local reference cortex. Other component close-ups hide anatomy. Callouts reserve the inspector area and use small neutral backings.
2. Materials, lighting and camera behavior: actual first renders exposed stale shadows from hidden parts and overly conservative fitting of world-axis bounds. The final camera fits transformed mesh corners, hidden parts no longer cast stale inspection shadows, local lighting/reflection orientation separates metal and ceramic, and isolated components use the neutral background. Pointer, keyboard and click rotations use the device frame in Device mode; controls are reconstructed when the up direction changes. The contact envelope is faint with edges. No vertex, cortical label, target pose, module dimension or solver coefficient was changed by these display choices.
3. Responsive access and numerical teaching: inspected desktop/tablet/phone renders in Chromium, Firefox and WebKit, all seven component close-ups, restoration of assembly state and CSV downloads. Found and fixed keyboard access for an overflowed equation, stale component captions and dimensions referring to hidden components. The comparative study is visible within Inspect the model, with an entry from parameter controls. Its chart/table values are computed from the actual plotted superficial cell, not the minimum across all depths; a warm-start regression verifies that distinction. The CSV contains all three computed trajectories.

## Scientific meaning

The same conservative 1D solver computes all comparison runs. Only the selected resistance input changes (0.25×, 1×, 4×, bounded and labeled with effective values); signal and detector remain identical, while feedback current can change. This is sensitivity to assumptions, not a confidence interval or measured uncertainty. Temperatures use 20 Hz displayed-frame extrema and identify the first cell's default0.25mm depth. Electrical energy is integrated at the solver time step. The table and downloaded data share the same computed runs. Scenario multipliers are applied once by the existing solver.

The reference GLB and registered target remain unchanged. Coincident display normals are averaged for softer shading. HRA source attribution and its limitations remain in ANATOMY.md. The inspection floor and lighting are presentation choices. No segmented meninges, patient-specific seizure focus or solved chronic contact/rejection architecture is inferred.

## Reproduce

    node tools/seizefreeze/model-check.mjs
    node tools/seizefreeze/device-check.mjs
    node tools/seizefreeze/sensitivity-check.mjs
    npm run typecheck
    npm test
    npm run lint -- --ignore-pattern 'public/hospitalsim/vendor/**'
    npm run build
    npm run start -- --hostname 127.0.0.1 --port 3220
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3220 node tools/seizefreeze/inspection-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3220 SEIZEFREEZE_ENGINE=webkit node tools/seizefreeze/inspection-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3220 SEIZEFREEZE_ENGINE=firefox node tools/seizefreeze/inspection-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3220 node tools/seizefreeze/browser-qa.mjs
    SF_QA_URL=http://127.0.0.1:3220/seizefreeze-lab/index.html node tools/seizefreeze/accessibility-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3220 node tools/seizefreeze/integration-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3220 node tools/seizefreeze/performance-qa.mjs

Run performance alone. Probes include explicit software3D, native Metal and a component-rotation stress workload. They are desktop-host viewport/DPR emulation, not physical-phone measurements. After rebasing onto the latest portfolio base5265c8b1, the ordinary npm test command passes166 tests across17 files. The upstream hospitalSIM fixture now supplies its browser API stub. Typecheck and the Next production build pass, with35 generated pages. Unrelated product code and its default tests are preserved and excluded from this change. Scoped SeizeFreeze lint passes with0 errors or warnings.

Verification limits: no physical phone, manual screen-reader certification, fabricated hardware, calibrated thermal/sensor measurements, independent clinical review, clinical effect or employer/admissions assessment. Numerical energy closure establishes bookkeeping within this model, not physiological accuracy. Complete renders and raw reports are preserved in the recoverable release package.


## Measured rendering and asset inventory

Native M2 Metal component-rotation probes measured approximately 59.8–60.2 rendered fps across the four viewport/DPR profiles. Native anatomy peeling ranged 31.0–60.2 fps; the high-DPI desktop probe is the slower case. Lab scrubbing ranged 52.0–60.1 fps. These short unthrottled desktop-host probes are observations, not a performance guarantee.

Explicit software3D component inspection measured 17.6–23.4 fps; anatomy and lab probes remain much slower, so software still defaults to the static reference. Native and software results remain separate. The complete lab/shared-runtime inventory is 9,712,477 bytes raw and 4,915,075 summed gzip. It includes documents/fonts and is not a measured network transfer size. The reference GLB remains unchanged.

The performance idle-tail counts may include one final queued frame after the last input; settled studio checks confirm no continuing idle animation.
