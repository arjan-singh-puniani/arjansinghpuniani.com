# Incident explorer car illustration

19 November 2026. Follow-up to production `2221a9a1`, extending the rendered illustration language of the brain and cockpit to the incident explorer.

## Design and integrity

Replaced the flat car SVG with an original AI-assisted 1536×1024 overhead plate. Pearl-ivory bodywork, graphite composite surfaces, slick tires, suspension, cockpit padding, helmet and metallic halo use the same restrained material and lighting treatment as the existing plates. The production WebP is 180,260 bytes, served through responsive Next Image at quality 90. No dependency or external service was added.

The full prompt and production asset path are in `assets/neurotrauma-plates/incident-car-prompt.json`. The built-in image-generation tool created the original image; the generated source is retained outside the repository and the optimized production image is committed. No official branding, team livery, published illustration or race photograph was used.

Code-native annotations identify helmet, halo and suggested front-left contact. The car points right; the driver's left is at the top of the image. A short dashed cue marks the fictional suggested contact location. It has no arrowhead and represents neither force nor measured damage. Later stages add an outline around the cockpit to direct attention; it does not encode head loading, injury or a calculated quantity. The image does not change geometry between stages.

The native HTML key, descriptive alternative text, full-size image link and visible limitations remain usable without enhanced graphics. The source ledger and provenance now explicitly include the AI-assisted generic vehicle. The existing [FIA halo engineering explanation](https://www.fia.com/news/f1-why-halo-best-solution), July 2017, supports the general protection context only; it does not validate this vehicle geometry, current chassis compliance or protective performance. No new clinical or regulatory assertion, telemetry or simulation was introduced.

On screens up to 800px wide, the illustration precedes the stage explanation so visitors encounter it directly after the stage controls. The page opening is unchanged. All four stages, available/unknown information, source links, text walkthrough and fictional print handoff remain available.

## Visual refinement

Desktop and mobile previews were opened and reviewed. Refinement increased responsive-image quality, changed the caption to readable 14px sans-serif text and gave the full-size link a high-contrast keyboard focus outline on its pale background. Authored marker positions and the later-stage cockpit outline were checked against the image. Detailed screenshot crops use a tall capture viewport to keep sticky controls outside the crop; viewport screenshots retain the stated desktop/mobile heights.

## Verification

`npm run verify` passes: lint (41 existing warnings, zero errors), TypeScript, 306 tests across 35 files with coverage and the production build. The route remains statically prerendered, with 9.58 kB route JS and 122 kB first-load JS. `verify.log` records the complete checks.

The full optimized-production browser suite passes in Chromium at 1440×1000, 1024×768, 768×1024, 390×844 and 320×740, plus WebKit touch at 390×844. This covers all incident stages, visual emphasis, actual image loading, mobile content order, keyboard/touch, reduced motion, no-JavaScript walkthrough, image-blocked text and interaction, 16 source disclosures, seven handoff rationales, internal links, metadata, social image and print output. Axe reports zero WCAG A/AA violations at all five Chromium sizes. Results are in `browser-results.json`.

The final optimized screenshots were opened and reviewed at desktop and both phone widths. From the explorer's top, the entire car image fits in the 390×844 and 320×740 screenshot viewports. The later-stage cockpit emphasis was also reviewed. Print output remains a legible single A4 handoff page. The supplied figure crops use the actual rendered interface; no screenshot styling was injected.

The rendering is educational, not a homologated chassis, crash reconstruction, equipment-installation drawing or validated biomechanical model. Physical devices were not tested; no independent engineering or clinical illustration review was performed.
