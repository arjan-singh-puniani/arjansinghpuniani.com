# Validation

The baseline workspace had no BODY//ATLAS application, database, tests, or Git repository. A separate repository was created without changing other projects. Validation applies to this implementation only.

## Commands

```sh
npm run typecheck
npm test
npm run test:ingestion
npm run build
npm run test:browser
node --import tsx scripts/validate.ts
python3 ingestion/mapping_queue.py
python3 ingestion/mapping_queue.py --validate validation/anatomical-review-queue.csv
```

`npm test` checks immutable source hashes, unique identities, original regulatory dates, De Novo semantics, graph links, anatomy distinctions, unknown placement abstention, date precision, timeline behavior, retrieval citations, filters, and exported brief limitations. Python tests check transaction isolation, deduplication/versioning, schema drift, partial updates, provider outages, bounded retries, lease recovery, URL restrictions, and conservative candidate mapping.

Playwright runs the production build in installed Chrome at desktop 1440×1000 and iPhone 13 viewport/touch emulation. It exercises actual body-surface clicks and anchored callout clicks, repeated view controls, partial search, body and brain model loading, region selection, placement versus target, evidence links, timeline cutoff, comparison, Markdown download, source lookup, natural-language retrieval, unknown-location inspection, keyboard tabs and dialog focus, API boundaries, security headers, and automated WCAG A/AA checks. Emulation is not physical iPhone/Safari verification.

## Evidence and precision

`validation/data-integrity-report.json` contains exact dataset counts, failed job states, accepted/abstained assertion counts, and explicit null accuracy fields. `validation/curated-anatomy-sample.json` contains the full reviewable curated set. `validation/anatomical-review-queue.csv` contains 100+ genuine regulatory candidate rows, all unreviewed and none automatically accepted.

There is no independently adjudicated representative set of 100 positive device-anatomy relationships. The available bounded record identities do not themselves provide suitable detailed placement evidence. Therefore mapping precision, recall, and uncertainty intervals are **not estimable**. Computing a Wilson interval on the curator's own assertions or the abstention queue would misrepresent validation. The 95% auto-acceptance precision target is unverified; auto-acceptance remains disabled.

## Testing limitations

No clinical usability study, penetration test, full corpus backfill, production outage drill, low-end physical-device benchmark, broad Safari/Firefox check, or expert anatomical sign-off has been completed. Automated accessibility passes cover inspected rendered states, not universal accessibility. Dependency advisory checks describe a point in time, not a security guarantee.

Actual final command outcomes and measured browser evidence are recorded in DEMO_VERIFICATION.md and validation artifacts. Failed initial checks and their fixes are documented in the audit reports; they were not counted as successful verification.

The compact-preview regression uses 540×680, checks that the intervention panel and its first original source link are in the viewport, switches interventions without losing the regional context, resets the historical filter, and expands/restores anatomy. Automated WCAG checks also cover that compact selected-device state. Model manifests test source-frame identity, hash integrity, hierarchy references and buffer bounds for the registered brain/spinal extraction. Mobile surface-callout collisions found during this revision were corrected by separating the coarse UI label positions; these remain navigation locators, not device coordinates.

On-model intervention regression checks tap/click selection, immediate action text, exact FDA descriptive-document URLs, projected leader movement during orbit, retention of selection during rotation, an expanded-view source summary, brain-view keyboard selection, exclusion of unlocalized entries, historical cutoff behavior and automated WCAG checks. Domain tests verify accepted-source requirements and that chest implant labels remain distinct from neural targets. The original region navigation remains tested using the label-mode toggle.

## Whole-body regression scope

Current domain checks cover 2,490 original record identities and artifacts, all 721 contextual quote spans, explicit Provisional semantics, absence of invented clinical links/modalities, and licensed organ mesh integrity/source frame. Python adds bounded cross-panel acquisition, quoted OR handling, legacy N-identifier rejection, incidental-word/IVD/negation exclusions and positive anatomical contexts. The 150-row context review queue supplements the original neuro triage queue; both remain unadjudicated. Interface tests cover the dense map, organ load, heart/knee/female-only text discovery, original FDA links, context-aware exports and reviewed-layer filtering. Native region selectors provide keyboard/touch access when visual labels are decluttered.


### Relevance correction — 2026-10-21

The 2026-10-21 release introduced 16 explicitly explained interventions (10 existing neurotechnology entries and six record-specific FDA explanations). Device purpose, anatomical relevance and the supporting source are separate. Unexplained applications remain available through explicit source-context layers and Records; a raw product title is never used as a functional explanation. An empty explained region states the coverage gap instead of suggesting unrelated devices.

`anatomical-context-v2` excludes Murphy/needle-eye product features and aortic-valve wording from separate eye/aorta assignments. Regeneration yields 650 applications and 717 exact contextual spans before six editorial region restrictions. These remain Provisional; explanation review does not validate component placement. “Upper airway” was broadened to “Airway” to avoid calling the trachea an upper-airway structure. Timeline events, counts and model annotations now follow the selected evidence layer and filters. Earlier counts and the unadjudicated v1 review queue above describe the previous snapshot, not a precision measurement.

The Shiley explanation was checked against K250173, PDF pages 4, 7 and 8. Other additions use the original FDA approval statements for P130008, P010047, P130013, P140031 and P020023. These are historical indications; later supplements and current labeling have not been exhaustively reviewed. Regression checks cover source identity, region restrictions, missing-purpose abstention, exported explanation citations, and the actual airway/eye desktop/mobile workflow.


### Whole-body explanation expansion — 2026-10-22

The default collection now contains **91 explained entries**, up from 16, with direct associations to **44 anatomical structures/regions**. The 75 additions cover 36 regions, including cardiac/vascular, pulmonary, ophthalmic, hearing, dental, digestive, hepatobiliary, renal/urinary, reproductive, breast, skin, hand/shoulder/hip/knee/ankle/foot and spinal interventions. These are explained application entries, not a claim of 91 distinct invention categories or current marketed product families.

Every addition is keyed to one original FDA record and has a specific purpose, regional rationale, source and scope restrictions in `lib/whole-body-explanations.json`. The 73 PMA originals were checked in one bounded live FDA request on October 22: all original approval statements and decision dates matched the cached source records. The two 510(k) explanations were checked against K260007 (PDF page 5) and K260721 (PDF page 4). The original response, digest, request and review ledger are preserved in `validation/fda-originals-2026-10-22.json`, `validation/whole-body-source-check.json` and `validation/whole-body-explanation-review.json`.

Version 3 context extraction applies explicit editorial region scopes only where an exact anatomical phrase can be recovered from the source. It does not upgrade Provisional context to a physical placement. Regression cases exclude colorectal-primary liver treatment from the colon, above-knee vascular stents from the knee joint, glaucoma stents from lens replacement, and disc prostheses or hand neuroprostheses from spinal-cord implantation. Organ-perfusion systems are explained as extracorporeal; original product-name changes remain explicit. Female-only anatomy stays text-only on the male mesh and now has a visible notice.

The catalogue contains 652 applications and 712 contextual assertions after the restrictions; original raw records remain intact. Completeness, current labeling, recall status and independent expert mapping precision have not been exhaustively established. This editorial review is not a representative clinical validation study.


## Dossier inventory checks — 2026-10-22

All 91 explained entries resolve to a dossier. FDA history/recall counts reconcile to provider totals; original application identifiers/dates, source hashes, exact source fields and safe direct joins are regression checked. 41 domain/export and 36 Python checks pass, including byte-identical offline reconstruction and retention after an incomplete refresh. These are inventory/conformance checks, not an independently adjudicated anatomical or clinical precision estimate. All 91 dossiers were exercised on desktop and mobile-emulated Chrome with zero Axe violations/page errors. See DOSSIERS.md and DEMO_VERIFICATION.md for commands, source coverage and unresolved reviews.

## Labeling and safety follow-up — 2026-10-22

Supersedes the earlier blanket pending status: all 91 entries have model-scoped source assessments; 349 recall source-field audits and 15 notice-scope decisions are recorded. Five original-label gaps were closed (105 links / 76 entries). Three product-specific label gaps remain, and historical or model-limited sources are not certified as complete current IFUs. Individual unit applicability remains undetermined. Full methodology, original links, exceptions and the 91-entry ledger: [LABELING_SAFETY_REVIEW.md](LABELING_SAFETY_REVIEW.md).


## Final local verification — 2026-10-22

- Atlas `npm test`: 45 passed; `npm run test:ingestion`: 36 passed; typecheck passed.
- Portfolio `npm test`: 95 passed; typecheck and production build passed. Static atlas webpack export passed. Original standalone default production build passed. The maintained-source checkout uses external symlinked dependencies locally; its default Turbopack build cannot resolve that workspace root, so the documented static exporter is the verified build path there.
- `node tests/body-atlas-dossiers.browser.mjs http://127.0.0.1:3210`: all 91 dossiers on desktop and mobile, 91 source-linked findings/status checks per viewport, full-text model/lot search, stable entry links, brief citations, keyboard tabs and simulated outage/retry recovery passed. Zero Axe violations or browser errors. Local selection-to-dossier p95: desktop 228 ms; mobile 117 ms. These are local measurements, not a production SLA.
- `node tests/body-atlas.browser.mjs http://127.0.0.1:3210`: 75 expanded explanations/region cases per viewport, anatomical model, source hash checks, retrieval, brief export and existing portfolio routes passed. Mobile testing is Chrome viewport/touch emulation, not a physical device or Safari.
- No independent clinical signoff, complete latest-IFU certification or individual-unit safety determination was performed. Three product-specific label gaps and historical/model-limited sources remain visible.


### Original-label trace and warning clarity — 2026-10-22

A deeper trace added Hudi’s exact condom restriction, Advanced Glenoid cemented/compatibility distinctions and archival Braun-Cutter/Avanta CMC manufacturer-insert excerpts with an explicit PMA identity crosswalk. No complete revision-controlled IFU was recovered; all three full-label gaps remain open. Historical excerpts are not certified as the original approved or current label. Review meanings, compared models, unknown revisions and the leading entry-specific limit are visible and included in briefs. See [LABELING_SAFETY_REVIEW.md](LABELING_SAFETY_REVIEW.md) and the linked source-trace ledger. Requests remain unsent.


### Original-label follow-up checks — 2026-10-22

`npm test`: 47 atlas checks passed. `npm run test:ingestion`: 36 passed; TypeScript passed. Portfolio `npm test`: 95 passed; typecheck, full portfolio production build, standalone production build and static webpack export passed. Desktop and mobile Chrome tested all 91 dossier review boundaries, first limitations and original finding links, model/lot search, model context, exports and recovery. Zero Axe violations or browser errors. The broader anatomy/region/retrieval/brief workflow and 12 portfolio routes also passed. Mobile is viewport/touch emulation, not a physical device or Safari. All three complete-label gaps remain open; partial excerpts and decisions are not upgraded into complete IFUs.

## Body contour — 2026-10-23

The preview uses geometry-only body contours. Unit checks verify the single-mesh GLB and manifest/hash, absence of vertex colors/textures/photographs, unchanged neutral head, legs and unaffected regions, and broader shoulder/tapered waist geometry. Existing tests retain source-model checksums and reference evidence assertions. Updated browser checks exercise rotation, contour/reference switching, original-source selection and contour-asset failure recovery on desktop and mobile.

Previous full-workflow verification: 48 source tests, 36 ingestion tests, 95 portfolio tests and 20 desktop/mobile browser tests passed for the preceding preview; the 91 dossier checks also passed. These are historical results, not automatic certification of the revised contour. Current rerun results are recorded below after completion. Calibrated body-fit accuracy and physical-device Safari/GPU performance remain unverified.

Initial contour rerun (superseded shape): 48/48 source tests, 95/95 portfolio tests and 20/20 desktop/mobile Playwright tests pass. Maintained-source webpack build, static export, standalone build and full portfolio production build/typecheck pass. Geometry assertions verify the 1.38 glans radial scale in both cross-section axes, unchanged neutral head/legs, localized external edits and absence of identifying subject metadata, portrait colors and legacy face assets. The mobile on-model label pager is tested after fixing its collision with the view controls. No ingestion or dossier content changed; those previous checks were not repeated for this geometry revision. This validates the model edit, not correspondence to a real person's anatomy.

### Smooth local contour revision

The stretched source patch is superseded by a closed parametric shaft and rounded glans, joined locally to the surface. Unit checks now verify a consistent circular shaft at three sections, the modeled 1.38 head-to-shaft radius ratio, a closed distal pole, unchanged neutral head/legs, source hashes and absence of photographic or identifying payloads. The generator asserts closure of the new surface before union. TypeScript and all 48 source tests pass. Front and oblique neutral clay renders were inspected. This is an illustrative mesh, not a measurement or validated personal anatomy. No scientific records or internal source meshes were changed.

Desktop and mobile preview checks for this revision both passed: exact served-asset SHA matched the manifest, the new model rendered, orbit changed the rendered view, Contour/Reference switching worked, and an original FDA source link remained available. No page errors occurred. The full application build, ingestion and dossier suites were not repeated for this asset-only change; their prior results remain recorded above.

### Glans girth refinement

The rounded glans profile and coronal rim were reduced radially by 7%; shaft and length parameters are unchanged. The new modeled glans-to-shaft radius ratio is 1.2834. All 48 source tests pass, including the circular shaft and length checks. Desktop/mobile browser checks confirm rendering, rotation, reference switching, exact served-asset hash and original evidence access with no page errors. No application rebuild or ingestion rerun was needed for this asset-only adjustment. Anatomical fit remains illustrative.

### Holographic face, muscle relief and 1999 history window

Authored jaw angles, chin, cheek contours, nose bridge, brows and lips adapt the reference head without photos, textures or vertex colors. Paired abdominal and oblique relief is part of the mesh, with normal-based shading in grid/surface modes. Surface mode reveals the contour; the Organs control now also hides the reference brain and spinal cord. Internal geometry and intervention anchors retain the original reference frame.

A regression fingerprint verifies all 47,447 unique coordinates at or below reference y=0.02 match the approved published contour, including the entire lower-body surface. Facial projection and abdominal relief have geometry assertions; the asset remains 4.60 MB with 191,726 triangles. The slider/playback begin at 1999. Earlier genuine dates remain in source records, event buttons and exports. No scientific or regulatory data changed.

This is an authored artistic approximation from visual references. Facial identity, body-fit accuracy, unseen surfaces and physical-device Safari/GPU behavior are unverified. No calibrated reconstruction or exact anatomical correspondence is claimed.

Verification on 2026-10-23: `npm test` passes 48/48 source tests; `npm run typecheck` and `npm run build -- --webpack` pass. `npx playwright test --config playwright.contour.config.ts` passes 20/20 desktop/mobile workflow tests (temporary local config pointed at port 3101). The first run found two stale 1997 slider expectations; these were corrected to 1999, and the complete suite passed on rerun. `node scripts/export-static.mjs ../arjan-portfolio/public/atlas` succeeds. Portfolio `npm test` passes 95/95; portfolio production build and typecheck pass. Front/oblique clay renders and actual holographic surface views were inspected. Ingestion and source-data acquisition were not rerun because this change does not modify those paths or any source records.

The exported portfolio workflow also passes on desktop/mobile: homepage/work links, original cached-source checksums, retrieval, Markdown brief export, all 75 expanded explanations, 12 existing routes and sitemap. Additional preview checks verify the served contour SHA, 1999 minimum, hidden internal anatomy, surface/reference switching, rotation and original FDA link access, with zero page errors.

### Contour taper and upper-body sharing — 2026-10-24

Corrected the facial taper's sign calculation so negative chin/cheek offsets narrow the surface instead of always expanding it. The offset now fades smoothly through the centerline and the generator asserts against facial folds across that line. Added eyelid and clavicle relief and a swept scalp silhouette. Unit checks cover narrowed chin width, crown silhouette, absence of photo/identifying payloads and the unchanged approved lower-body fingerprint. The mesh stays at 4.60 MB and 191,726 triangles. Facial likeness remains visually approximate and unvalidated.

The optional `view=portrait` presentation crops the surface below reference y=0.14, hides internal anatomy, bounds the orbit/zoom and provides copy-link and Explore atlas controls. The URL is parsed before mounting the 3D scene. Browser checks cover desktop/mobile rotation, clipboard success and denial, query/fragment removal, normal atlas navigation, accessible controls and a minimum canvas height to prevent the first mobile layout regression. This is presentation cropping, not private storage or authentication. No scientific records or reference organ geometry changed.

Final local checks: `npm test` passes 48 source tests; source typecheck and webpack build pass. `npx playwright test --config playwright.contour.config.ts` passes all 22 desktop/mobile workflows against port 3101, including the two new share-view cases. Static export succeeds; portfolio production build, typecheck and all 95 tests pass. Neutral clay and browser renders were inspected from front/oblique/back views. The visual checks caught and corrected a mobile canvas-height regression and transparent two-sided surface overlap; the final share material uses depth-tested opaque rendering with a subtle grid. Face/body correspondence is not a measured or validated reconstruction. Physical-device Safari remains unverified.

The exported portfolio integration workflow passes on desktop/mobile: original source checksums, retrieval, brief export, all 75 expanded explanations, 12 existing portfolio routes and sitemap. No scientific data acquisition or ingestion logic changed, so ingestion was not rerun.

### Intervention-first map — 2026-10-24

The default explained layer now labels named interventions on the body, with original-source arrows and region drill-down. The overview distributes representative labels across anatomy, prioritizes brain/heart examples, and pages remaining labels. A focused region exposes its other indexed approaches. All 12 heart entries are traversed in the new desktop/mobile browser case. Selected-intervention timeline filtering removes unrelated whole-body milestones from that context; event dates and source records are unchanged.

The UI continues to distinguish reviewed relationships from provisional FDA text context. Markers and leader lines remain schematic regional associations. This change adds no records, new mapping assertions, anatomical coordinates or scientific claims. The body mesh and the optional upper-body share view are unchanged. Tests wait for the exterior model to load before taking the new map screenshots.

Current checks: 48 source tests passed; source typecheck/build and static export passed. All 24 desktop/mobile browser workflows pass, including the new loaded-model map checks, original-source arrows, region drill-down, all 12 heart entries and selected-family timeline assertions. Existing compact-layout, keyboard/accessibility, outage/fallback, exports and share-view workflows also pass. Screenshots were inspected after waiting for model loading. No new records or anatomical precision are claimed. Physical-device Safari remains unverified.

Exported website verification also passes on desktop/mobile: 24 named overview labels on the 1440×1000 viewport and 10 on 390×844, direct original-source links, selection-scoped history, all 12 heart entries reachable, and zero accessibility violations/page errors. Portfolio build/typecheck and all 95 tests pass. The portfolio integration workflow checks original-source hashes, retrieval, brief export, all 75 expanded explanations, 12 existing routes and sitemap. Data ingestion was not rerun because no records or ingestion paths changed.
