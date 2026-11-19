# Motorsport neurotrauma overview · validation

Reviewed 19 November 2026. Isolated branch from production main `59bd0539`; unrelated desktop checkout changes were not copied or changed.

## Scope

Replaces the dedicated neurotrauma case study with an independent, F1-focused educational overview. Preserves the route, portfolio navigation, related Belmont study and contact links. Updates only this project's Work summary, route metadata, social artwork, content and tests. Original diagrams use SVG; no dependencies, data collection, telemetry, injury model or clinical scoring were added.

The original page and portfolio were opened in installed Chromium before implementation. The repository content audit documents the Version 0.2 grassroots/regional card, draft algorithm and March correspondence. The original PDFs were not present as public downloads and were not independently re-reviewed. The new handoff is explicitly an educational reconstruction, not the historical form or an approved protocol.

## Evidence

The claim-to-source ledger lives in `src/content/neurotrauma.ts` and is rendered in full under Methods & sources. Thirteen entries include direct URLs, publication/edition dates, sections/pages, support, applicability, limitations and where each claim appears.

The applicable 2026 FIA F1 Sporting Issue 09, Technical Issue 21, Appendix H and Appendix L were read from the FIA. FIA concussion and equipment materials, the Amsterdam consensus, SCAT6, the RESCUE-RACER protocol and a motorsport biomechanics review inform the explanations. Historical engineering sources are identified as historical. The newly published 2027 medical guidance is listed but not used as a 2026 event protocol. Publisher access restrictions affected some BMJ full-text requests; indexed primary excerpts and the tool's public primary-resource record were available. No SCAT instrument is reproduced or modified.

The design explicitly distinguishes requiring an examination from performing it: F1 B1.1.5 permits the Race Director, CMO or Medical Delegate to require examination; B1.3.3 separately specifies sporting powers. No diagnostic threshold, clearance or return date is supplied.

## Checks

- `npm ci --no-audit --no-fund`: installed the existing lockfile without changes.
- `npm run verify`: passed lint, TypeScript, all 306 tests in 35 files with coverage, and the production build (39 static pages).
- Lint retains 41 existing warnings in unrelated code. Two exclusions bring unchanged third-party PDF.js/Three.js artifacts into line with the existing vendor-ignore policy. No authored-code rule was relaxed.
- The route remains statically prerendered: 9.04 kB route / 116 kB first-load JS in the Next.js build report.
- `node tests/neurotrauma.browser.mjs`: passed against the optimized production server. `NEUROTRAUMA_URL` and `QA_OUT` can select another base and evidence directory.
- Chromium: 1440×1000, 1024×768, 768×1024, 390×844, 320×740. Mobile touch emulated; normal motion on desktop and reduced motion at remaining sizes. Each size passed WCAG 2 A/AA and 2.1 AA axe checks with zero reported violations.
- Browser checks exercise every stage, revisiting a prior stage, persistent unknowns, all seven field rationales, all thirteen source disclosures, internal anchors and local destination responses, canonical metadata, social-image response, print-button invocation and horizontal overflow.
- JavaScript-disabled Chromium: all four native text stages and field explanations accessible. WebKit at 390×844: touch stage selection, content and overflow checks passed.
- Print: generated A4 PDF is one page. Rendered output was opened and visually inspected. Fictional status, unknowns, sources and limitations remain on the sheet.
- No runtime page errors in the tested Chromium journeys.

## Visual review and refinement

Desktop and mobile screenshots were opened and reviewed, not only captured. The first pass exposed mobile stage feedback below the diagram and small technical labels. The final version puts mobile stage explanations first, keeps stage controls sticky beneath the site header, enlarges diagram/metadata text and labels the two information-stream meanings explicitly on phones. The print and social-image renderings were also reviewed.

Selected evidence: `1440-opening.png`, `390-incident.png`, `390-protection.png`, `print-review.png`. Browser matrix: `results.json`. Full check output: `verify.log`.

## Limits

Browser mobile/device dimensions are emulated; no physical phone, human screen-reader session or real printer was used. Automated accessibility checks do not prove complete accessibility. No clinical validation, field study, medical endorsement, affiliation or operational use is claimed. Proposed handoff fields and diagram geometry require separate evaluation before any care setting.

Release target verified through the existing successful GitHub Production deployment: Vercel project `arjan3/arjansinghpuniani-com`, production branch `main`, public domain `https://arjansinghpuniani.com`. Publication is handled by the existing GitHub→Vercel workflow; release status must be verified separately before claiming it occurred.
