# Pit Stop Lab visual and capability audit

26 October 2026, before SF-26 work. Entry: Next.js `/playground/pit-stop`, iframe `public/pit-stop-lab/index.html`. Current uncommitted lab work and unrelated Rally House changes are preserved. No external publication is authorized.

## Verified capability and baseline

Next 15.5.24 / React 19; buildless ES modules inside the iframe; local Three.js r184 and OrbitControls. Pure `simulation.js` drives deterministic events/snapshots, `world.js` consumes them, `mechanics.js` retains center-lock inspection, `facility.js` builds the campus, and `intelligence*.js` / `data-experience.js` provide historical ridge/Monte Carlo strategy and replay. Existing Web Audio is synthesized locally. No physics dependency or remote script is needed.

`/Applications/Blender.app/Contents/MacOS/Blender` is installed: **4.0.2**. Both `--version` and background Python invocation succeeded; `bpy.ops.export_scene.gltf` is available. No Blender MCP tool is configured. Existing repository GLBs are anatomy/human assets, not a suitable car. A local MIT Three.js GLTFLoader/BufferGeometryUtils pair exists under Holoanatomy and can be reused with local import paths.

Before editing: `npm test -- --maxWorkers=1 --testTimeout=15000 --reporter=dot` passed **131 tests**, `npm run typecheck` passed. All three actual browser suites passed: **53 world + 23 intelligence + 21 experience = 97 checks**, no application errors. Baseline screenshots/reports are under `/tmp/pit-sf26-baseline/`. Chromium identifies SwiftShader software Vulkan; existing scene sampled **12 fps, 375 draws, 83,684 triangles** with a pinned ghost. That is not a hardware performance claim. `npm run test:e2e -- --list` still fails pre-existing discovery (Next imports and no Playwright config); no tests were removed or weakened to hide it.

## Visual diagnosis

- **Silhouette:** center body uses only 16 radial samples with a few longitudinal stations; major wing elements, floor strakes, intake covers and mirrors are cuboids. A broad generic floor intersects the implied tire envelope. Existing 0.96 m wheel-center offsets produce an over-wide generic silhouette, not a measured 2026 Ferrari.
- **Surface continuity:** straight transitions between sparse sections, blunt sidepod lips, solid cockpit/engine volumes and boxlike wing cross-sections. Merely adding subdivisions to this shape would not establish SF-26 fidelity.
- **Materials:** generic MeshStandard colors, mostly uniform roughness; no automotive clearcoat on the full car, no directional woven normal map, no tire wear maps or UV-authored asset.
- **Lighting:** high hemisphere/key exposure against a pale background, no environment reflection map, limited contact grounding. View defaults to distant overhead diorama framing.
- **Environment:** furnished three-bay campus has a consistent operational purpose, but the full floating slab, trees and simplified architecture read as miniature logistics rather than a ground-level garage.
- **Motion:** event-driven wheel/crew/jack motion is valuable and must survive. The crew uses ellipsoid bodies and instanced articulated limbs. Hands follow tools, but no constrained contact/rig calibration proves human accuracy.
- **Agency:** visitors can watch, scrub and change parameters; they cannot yet perform a wheel change. Add a separate deterministic challenge rather than mislabeling the automatic sequence as a game.
- **Interface:** latest headlines are already removed, but seven spatial pins, KPI cards, map, toolbar, analysis instruments and inspector still compete for space. Default Explore should disclose these instruments on demand.

## Asset approach and reference board

Approach A evaluated: Sketchfab candidates include Excalibur's [SF-26](https://sketchfab.com/3d-models/f1-2026-ferrari-sf-26-9d375a5bb71e4439b2637cc5e1dd9930), described for Grand Prix 4; no verified redistribution license or downloadable source was obtained. Another candidate returned 403. A 2024 concept uses NoDerivs and is not the launch car. None will be ripped or silently substituted.

Selected **B: original reference-driven Blender mesh/material authoring**. C offers no verified reusable car base. Preserve editable `.blend`, build/export script, source manifest, primary/runtime GLBs and automated hierarchy/bounds/material checks. Reference the **launch specification**, not every later aero revision. Mesh dimensions beyond public bounds are explicit visual estimates, not Ferrari CAD.

Official primary reference: [Formula 1 launch gallery, 23 January 2026](https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-ferraris-2026-f1-car.7HdOPtJJwN5VHJ8XAWVtuS.7HdOPtJJwN5VHJ8XAWVtuS). Ferrari's [SF-26 page](https://www.ferrari.com/en-EN/formula1/sf-26) currently requires JavaScript verification; no access was bypassed. Gallery photos were inspected locally for reference only and are not bundled in the application.

| Official gallery image | Supports |
| --- | --- |
| `F678_still_f03_16_9_v10.webp` | Front: narrow rounded nose, layered curved carbon front wing, large open sidepod mouths, halo center support, suspension clearances |
| `F678_still_f08_16_9_v10.webp` | Top: wheelbase/track relationships, coke-bottle taper, sidepod outer contours, cockpit opening, white upper engine/cockpit region and red shoulders |
| `F678_still_f15_16_9_v10.webp` | Rear three-quarter: engine fin, airbox, rear-wing pylons/endplates, diffuser/rain lights, tire shoulders |
| `F678_still_f09_16_9_v10.webp` | Elevated front: front-wing sweep, halo outline, cockpit aperture, body color separation and aero surface continuity |

Image URL prefix: `https://media.formula1.com/image/upload/c_fit,w_1600/q_auto/v1740000001/fom-website/2026/Ferrari/`. Images are copyrighted reference material, not a texture license. Red/white original materials can be authored; sponsor marks, Ferrari shield and photographic textures will not be redistributed without established rights. Branding belongs in a replaceable identity configuration. Do not call a visually estimated recreation an official or exact Ferrari model.

## Scope and acceptance evidence

Reach: Blender source/export pipeline → GLB hierarchy/materials → loader/runtime body and removable wheels → world camera/lighting/garage → dedicated challenge state/render adapter → UI/audio → pure tests + actual browser journeys + visual comparisons. Preserve original timing, source-to-decision ML, replay, failure scenarios, exports and fallback. No framework migration. Validate actual loadable assets, direct manipulation and keyboard/touch alternatives; measure transfer, draw/triangle/GPU allocation and startup on the available browser. Hardware 60/30 fps targets require real hardware and remain separate from software-renderer evidence.
