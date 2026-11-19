# RB19 3D direction study

19 November 2026. Based on production `f262ac57`. The user requested impact-direction exploration, then explicitly redirected the vehicle presentation to a detailed Ferrari or Red Bull virtual model rather than generated car artwork.

## Visitor-visible result

The opening and incident explorer use Redgrund's detailed **Oracle Red Bull F1 Car RB19 2023** reconstruction. The opening has a local creator preview; visitors can activate the hosted 3D model in the explorer, orbit/zoom it, select top/cockpit views, reset the view or close 3D. Four native radio controls select front-left, front, driver-left side and rear contexts. Each choice changes the camera, the authored evidence questions and a direction-specific unknown across all four incident stages.

The driver report remains constant; direction does not generate symptoms, loading, a diagnosis or a sporting decision. The Impact stage now treats the chosen direction as an assumption rather than pretending a video was observed. The printable M01 front-left worksheet remains fixed, with that distinction stated beside its link. Every comparison is also available as a native text disclosure. Controls are disabled without JavaScript; text disclosures, source access and printing remain usable.

The repeated image-generation captions were replaced by concise figure descriptions. The methods disclosure preserves the actual production method of the retained brain/cockpit illustrations. No claim of journal approval, clinical validation, affiliation or official team CAD was added.

## Asset and implementation evidence

- Model: [Oracle Red Bull F1 Car RB19 2023](https://sketchfab.com/3d-models/oracle-red-bull-f1-car-rb19-2023-e4afe46f3aab4b23a418da06fc163821), by [Redgrund](https://sketchfab.com/redgrund), published 21 February 2024.
- License checked against the [public Sketchfab model API](https://api.sketchfab.com/v3/models/e4afe46f3aab4b23a418da06fc163821): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), attribution required, commercial use allowed. The creator and license are linked beside the model and in the source ledger.
- The interactive model is hosted by its creator on Sketchfab. Its creator-supplied 1920×1080 preview was converted to a 138,466-byte WebP and is served locally through Next Image. Full provenance, source URLs, adaptation notice and SHA-256 are in `assets/neurotrauma-rb19/provenance.json`.
- The official [Viewer API](https://sketchfab.com/developers/viewer) 1.12.1 is loaded only after the visitor requests 3D. No Sketchfab requests occur on the initial page view. `dnt: 1` requests the provider's do-not-track mode; no analytics was added to the application. The scene uses progressive texture loading, a 2048px texture limit, no autoplay animation, and a close action that unmounts the iframe and stops rendering. No npm dependency was added.
- The source is a creator reconstruction of a 2023 vehicle, not a 2026 hardware reference or a validated engineering model. Existing references still describe their own editions and applicability. Team/livery marks are not presented as an endorsement.

## Scientific and communication review

The authored questions ask about contact sequence, available views, sensor source/axes/timing/quality, driver/responder reports and unresolved head contact. They are design interpretations, not a validated investigation checklist. The existing [2017 motorsport review](https://journals.sagepub.com/doi/10.1177/2059700217733916), technical challenges and future directions, supports keeping vehicle data, head motion and clinical interpretation distinct. The [2024 FIA concussion leaflet](https://www.fia.com/sites/default/files/concussion_leaflet_12062024_1.pdf), pp. 2–3, supports the need for reported/observed information and qualified medical assessment. The Amsterdam consensus reference retains its general-sport applicability; no new F1 procedural rule or recovery threshold was inferred. The source ledger now contains 17 records, including the model/license record.

## Visual refinement and checks

The actual Red Bull model was opened in hardware-rendered Chrome. Front-left, front, left-side, rear, top and cockpit views were visually inspected. An initial camera-clipping issue was traced to the provider's opening animation overwriting the API-selected pose; the documented `camera: 0` option removes that animation. The browser check asserts camera stability after three seconds. Camera distances were then adjusted to keep the full car in the default view. The refinement also fixed a hero source-link contrast failure and a narrow-screen information-link overflow.

`tests/neurotrauma.viewer.mjs` checks the real hosted model in Chrome with hardware rendering at 1440×1000, 390×844 and 320×740: load on demand, stable camera, real orbit drag, four distinct rendered camera views, top/cockpit presets, close/unmount, responsive layout and browser exceptions. It records screenshots for visual review. This is separate from the headless core suite because the model host rejects software-only WebGL.

## Final optimized-build verification

`npm run verify` passes: lint (41 existing warnings, zero errors), TypeScript, 307 tests across 35 files with coverage and the production build. The route is statically prerendered, with 11.8 kB route JS and 124 kB first-load JS. `verify.log` records the final successful command. An earlier run timed out in the unchanged pit-crew test at its five-second limit; it passed in isolation and the complete default verification command subsequently passed without changing that test or its timeout.

The core optimized-production browser suite passes in Chromium at 1440×1000, 1024×768, 768×1024, 390×844 and 320×740, plus WebKit touch at 390×844. It covers all 16 direction/stage combinations per Chromium layout, keyboard/touch selection, unknowns, the constant report, actual poster loading, source/anchor links, metadata, 17 source disclosures, seven handoff rationales, reduced motion, disabled enhanced controls without JavaScript, all native comparison text, blocked images and a blocked model service. It also verifies that retry makes a fresh script request after failure. Axe reports zero WCAG A/AA violations at all five Chromium sizes. `browser-results.json` records the run.

The separate real-renderer suite also passes against the optimized build in hardware-rendered Chrome at 1440×1000, 390×844 and 320×740. It confirms no model-provider requests before activation, a stable selected camera after three seconds, four different real camera renders, orbit drag, top/cockpit/reset actions, responsive layout, no browser exceptions, and iframe removal on close. `viewer-results.json` records this run. Final screenshots were opened and visually reviewed; tall figure crops retain the tested widths and keep sticky navigation outside the capture. No screenshot styling was injected. The fictional handoff still prints as one A4 page.

Physical phones, human screen-reader sessions and clinical/engineering validation were not performed. The 3D feature depends on the model host and GPU support; a local preview and the full information comparison remain available when 3D cannot load.
