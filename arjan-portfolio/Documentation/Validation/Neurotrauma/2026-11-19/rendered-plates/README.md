# Rendered brain and cockpit illustration plates

19 November 2026. Follow-up to `c367d112`, replacing the flat sagittal and occupant drawings after the user's visual review. The original incident explorer, fictional handoff and print workflow remain available.

## What changed

Two original AI-assisted 1536×1024 illustration plates were generated with the built-in image-generation tool. The complete prompts and production paths are recorded in `assets/neurotrauma-plates/prompts.json`. Optimized WebP assets total 711,982 bytes; there are no new dependencies or remote image services. Next Image supplies responsive sizes, intrinsic dimensions and hero prioritization. The brain plate loads lazily.

The midsagittal plate uses modeled gyri and sulci, corpus callosum, cerebellar folia and branching white matter, pons/medulla, cranial cut edge and upper cervical continuity. The cockpit cutaway differentiates suit, helmet, padding, composite wall, halo, FHR, tether and harness materials. Numbered annotations remain authored SVG; keys, descriptions, source links and limitations remain HTML. Full-resolution assets can be opened directly. Small anatomy boundaries, exact equipment geometry and restraint installation are explicitly illustrative.

The previous vehicle plan view remains the incident explorer's explanatory schematic. The previous anatomical motion drawing has become a small, separate explanation of whole-head translation and pitch; its arrows do not suggest tissue displacement or injury location. No diagnostic or injury-risk model was added.

## Source and gross-relationship review

- [Neuroscience Online, UT Medical School at Houston](https://nba.uth.tmc.edu/neuroscience/m/s2/chapter01.html), revised 7 October 2020: midsagittal vocabulary, commissural fibers, cerebellum, pons and medulla relationships. The plate labels gross structures only. Fine generated boundaries and individual anatomy are not validated.
- [NCI brain definition](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/brain), undated: cerebrum, cerebellum, brainstem, cranial protection and spinal continuity.
- [FIA FHR guidelines](https://api.fia.com/sites/default/files/fia_standard_guidelines_-_frontal_head_restrain.pdf), undated public guide accessed 19 November 2026, sections 4–7 and printed pp. 16–21: helmet/FHR compatibility, tether and shoulder-strap relationships. The guide itself has no independent regulatory value. No numerical fit instructions were reproduced. The image is not a homologated F1 design or an installation guide.
- [Nature figure-preparation guide](https://research-figure-guide.nature.com/figures/preparing-figures-our-specifications/): used as a design reference for separate editable labeling and accessible typography; no journal approval, peer review or publication is claimed.

The claim ledger now contains 16 entries. The new sources support gross vocabulary and equipment relationships, not the exact AI-generated image. No published illustration was copied or traced; no patient image, official logo or team livery was supplied. No qualified medical illustrator or clinician has independently validated these assets.

## Verification

`npm run verify` passes: lint (41 existing warnings, zero errors), TypeScript, 306 tests across 35 files with coverage, and production build. The route is statically prerendered; route JS is 10.2 kB and first-load JS is 122 kB. `verify.log` is the full check output.

`tests/neurotrauma.browser.mjs` passes against the optimized production server: Chromium 1440×1000, 1024×768, 768×1024, 390×844 and 320×740; WebKit touch 390×844. Checks cover all four incident stages, keyboard/touch, reduced motion, seven handoff explanations, 16 evidence disclosures, anchors, internal links, metadata, social image, print action and one-page A4 handoff. Axe reports zero WCAG A/AA violations across the five Chromium layouts. No-JavaScript text and blocked-image fallbacks pass. Results are in `browser-results.json`.

The desktop and mobile screenshots were opened and visually reviewed. The refinement pass fixed the anatomy overlay's inherited maximum width, corrected a skull label anchor, and made the numbered HTML keys explicit. Detailed-figure crops use the same desktop/mobile widths with a tall capture viewport to keep sticky navigation outside the crop. Opening captures retain 1440×1000 and 390×844. At 390×844 the incident action begins at y=341.94 and the complete cockpit image occupies y=460.13–693.64. At 320×740 the action begins at y=375.23 and the image occupies y=493.42–680.23. The compact first-screen opening is preserved.

The print handoff was rendered and visually inspected as a legible single A4 page with sources and prototype labeling. Physical devices and human screen-reader sessions were not tested. These are educational illustrations and a portfolio communication prototype, not a clinical atlas, approved equipment drawing or validated medical instrument.
