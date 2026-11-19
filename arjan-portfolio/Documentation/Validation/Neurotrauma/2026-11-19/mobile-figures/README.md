# Mobile opening and figure refinement

19 November 2026. Follow-up to the original overview release, based on production `b4e51e2c`.

## Visitor-visible change

The mobile masthead, heading, copy and spacing are shorter. The headline occupies two lines and both actions share a row. At 390×844, the incident action begins at y=341.94 and the car occupies y=442.13–652.03. At 320×740, the action begins at y=375.23 and the car occupies y=475.42–643.34. Coordinates are CSS pixels from the top of the initial browser viewport. The independent-project label, source access, clinical scope and author attribution remain available.

The browser test now requires the action and complete car to be on the first screen at both phone sizes and the action to begin before y=430.

## Scientific illustration decisions

- Annotated the vehicle view with helmet, halo and cockpit/survival-cell context. The front-direction indicator follows the vehicle's drawn longitudinal orientation. The artwork does not specify an F1 chassis geometry.
- Replaced the occupant stick-figure treatment with a reclined-driver cutaway. Helmet, tether, FHR and harness are separately labeled. The halo uses a simplified side projection; no installation dimensions or forces are supplied.
- Replaced the two head outlines with an original sagittal anatomy figure identifying skull, cerebrum, cerebellum and brainstem, plus distinct panels for whole-head translation and illustrative pitch. Sulcal patterns are explicitly schematic. Colours identify structures, not injuries or computed strain. No lesion, brain displacement, tissue load or probability is inferred.
- Added the NIH National Cancer Institute anatomy reference to the claim ledger, bringing it to 14 entries. Existing FIA helmet/FHR and F1 structural references support the equipment relationships.

References checked for this refinement:

- [FIA helmet guidance](https://www.fia.com/sites/default/files/guidelines_helmets-to_publish_bd.pdf), introduction and FHR compatibility, especially helmet-to-FHR tether loading and its relationship to the harness.
- [F1 Technical Issue 21](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_c_technical_-_iss_21_-_2026-10-19.pdf), C12.4.2, secondary roll structure.
- [NCI brain definition](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/brain), basic structures and cranium; undated, accessed 19 November 2026.
- [Nature figure-preparation guide](https://research-figure-guide.nature.com/figures/preparing-figures-our-specifications/), design principles of editable vector artwork, consistent typography and accessibility. This is a design reference, not journal review or endorsement.

All artwork is original SVG. No third-party illustration was traced, copied or licensed into the site. Journal-level scientific review or clinical validation is not claimed.

## Verification

`npm run verify` passes: lint (41 existing warnings, zero errors), TypeScript, 306 tests across 35 files with coverage and the production build. The route remains statically prerendered with 116 kB first-load JS; the route bundle is 9.57 kB.

`tests/neurotrauma.browser.mjs` passes against the optimized production server: Chromium 1440×1000, 1024×768, 768×1024, 390×844 and 320×740; WebKit touch 390×844; keyboard, touch, normal/reduced motion, no-JavaScript text, 14 source disclosures, seven handoff explanations, internal links, metadata and print output. Axe reports zero WCAG A/AA violations in the five Chromium layouts. Screenshots were opened and visually reviewed after the final drawing changes.

Physical devices and human screen-reader sessions were not tested. These remain explanatory illustrations and an educational communication prototype, not a validated biomechanical model or clinical instrument.
