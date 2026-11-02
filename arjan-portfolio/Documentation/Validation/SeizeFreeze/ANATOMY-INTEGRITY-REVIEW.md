# Cortical completeness repair — 2 November 2026

The published brain had an artificial frontal gap because the display extractor selected mesh-number ranges. The source atlas stores bilateral frontal poles and 24 other cortical parcels outside those ranges. The extraction now selects 104 cortical parcels by exact anatomical name and retains registered bilateral forebrain white matter as separate interior context. It restores source anatomy without welding, filling, inflating or substituting a different brain. Source licenses and attribution are retained.

## Three rendered review passes

1. Source fidelity: compared the published opening with the first repaired native render. Restored the absent frontal contour, insula, opercula and basal/medial cortical parcels. Added a geometry regression that checks 10,450 source vertices from all 26 restored parcels against actual output positions (maximum nearest-vertex distance 0.7861 mm under 1 mm display clustering), the complete 104-name set and valid finite/indexed geometry. The old production GLB fails this regression. The target position/index buffers match the previous production asset exactly; source hashes and registration center are unchanged.
2. Orientation and framing: inspected four orbital angles. Found that the left-temporal callout and lens leader appeared through the opposite hemisphere. They now hide when the camera is behind the registered target tangent plane. This is a facing check, not a general occlusion solver. Found that the phone view cropped the brain silhouette; pulled the narrow camera back and centered it. Inspected the updated opposite-side and phone renders. The inset remains a separate enlarged view of the same actual device and target.
3. Access, performance and failure behavior: captured all four orbit angles, peel states, contact inspection and the active laboratory at 1440, 768 and 390 CSS pixels in Chromium, Firefox and WebKit. Nine viewport/engine cases pass; two automated WCAG scans per case report zero violations. Rechecked the existing studio (including 320 px reflow), assembly/model comparison, keyboard, reduced-motion, non-WebGL and worker-failure flows. Refreshed the static poster from the actual repaired scene. Existing production-build case-study embedding and sampled portfolio routes pass.

Selected evidence: [before](integrity-before-1440.png), [corrected opening](integrity-chromium-1440-opening.png), [frontal oblique](integrity-chromium-1440-orbit-1.png), [opposite hemisphere](integrity-chromium-1440-orbit-2.png), [posterior oblique](integrity-chromium-1440-orbit-3.png), [phone](integrity-chromium-390-opening.png), [bone flap](integrity-chromium-1440-peel-0.44.png), [pial interface](integrity-chromium-1440-peel-1.png), [phone contact](integrity-webkit-390-contact.png), [phone laboratory](integrity-webkit-390-lab.png). Full captures and raw reports are in the recovery package.

## Verification

- Ordinary unit suite: 175 tests across 18 files pass; typecheck and Next production build pass (35 generated pages). Scoped ESLint and whitespace checks pass.
- Numerical solver and sensitivity checks pass. Maximum numerical energy residual remains 1.585e-12 J, below the documented 1e-8 J tolerance; core solver and coefficients are unchanged.
- Independent complete-footprint device audit: same target [-63.6175804, -1.8063536, 10.4811316] mm, datum 2.9991324 mm and minimum rigid display clearance 0.3 mm. This is geometry against the reference triangles, not tissue mechanics or a clinical safety margin. White matter is excluded from cortical fitting and local pial sampling.
- Native Apple M2 Metal: all 12 short workload/viewport-DPR probes measured 60.04–60.12 rendered fps. Explicit SwiftShader: anatomy peeling 1.75–3.21 fps, lab scrubbing 0.55–2.65 fps, isolated component rotation 14.61–37.89 fps. Software defaults to the static reference. Measurements were run without concurrent browser/test workloads. These are desktop-host probes, not physical phones, sustained thermal tests or GPU execution timings.
- Corrected GLB: 8,187,608 bytes (previously 6,573,512); 454,500 total triangles including skin, interior context and hindbrain. Full lab plus shared-runtime inventory at measurement: 11,329,712 bytes raw, 5,928,377 summed per-file default Node gzip bytes. This is not a network transfer measurement.

## Reproduce

    node tools/seizefreeze/anatomy-asset.mjs
    node tools/seizefreeze/anatomy-check.mjs
    node tools/seizefreeze/device-check.mjs
    node tools/seizefreeze/model-check.mjs
    node tools/seizefreeze/sensitivity-check.mjs
    npm run typecheck
    npm test
    npm run build
    npm run start -- --hostname 127.0.0.1 --port 3221
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 node tools/seizefreeze/anatomy-integrity-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 SEIZEFREEZE_ENGINE=firefox node tools/seizefreeze/anatomy-integrity-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 SEIZEFREEZE_ENGINE=webkit node tools/seizefreeze/anatomy-integrity-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 node tools/seizefreeze/studio-qa.mjs
    SF_QA_URL=http://127.0.0.1:3221/seizefreeze-lab/index.html node tools/seizefreeze/accessibility-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 node tools/seizefreeze/inspection-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 node tools/seizefreeze/integration-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 node tools/seizefreeze/performance-qa.mjs

Run performance alone. Regeneration requires the existing attributed source brain/body GLBs; the original repository and recovery source archive preserve them.

The HRA model remains a mirrored reference parcel atlas, with visible parcel boundaries and display simplification. It is not patient anatomy or a continuous measured pial reconstruction. The seizure focus, cranial coverings, device specifications, contact mechanics and chronic heat rejection retain their existing stated limitations. No fabricated hardware, clinical suppression, physical-phone result, manual screen-reader certification, independent clinical review or employer/admissions outcome was established.
