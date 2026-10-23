# Demonstration verification

Verified locally on 2026-10-19 against the actual production build. No external deployment performed.

| Command | Result / artifact |
| --- | --- |
| `npm run verify` | Typecheck, 29 domain/data/geometry/retrieval checks, 23 ingestion/mapping checks and production build passed. Final ingestion-scope correction was rerun separately: 24 ingestion/mapping checks passed. `validation/core-checks.txt`. |
| `npm run test:browser` | 16 passed, 0 failed; final desktop/mobile outcomes in `validation/browser-summary.json` and `validation/browser-checks.txt`. |
| `node --import tsx scripts/validate.ts` | Exact counts and null independent precision fields in `validation/data-integrity-report.json`; curated assertions and 150-row context review queue saved separately. |
| `python3 ingestion/build_catalogue.py` | Reproducible offline index; exact source spans/hashes tested for every generated edge. No automatic physical-placement acceptance. |
| Fresh temp `npm ci --offline --audit=false`, build, restore | Passed on same macOS host/cache; restored 2,490 records and three historical failed jobs. `validation/clean-environment.json`. |
| `npm audit --json` | Zero reported advisories at scan time. `validation/dependency-audit.json`. |
| `node scripts/benchmark.mjs` | Local search and all-geometry orbit observations in `validation/interaction-benchmark.json`; no physical-device/GPU FPS claim. |

## Authentic coverage

The snapshot contains 1,564 FDA clearances, 37 separately classified De Novo authorizations, 836 canonical original PMA approvals, 10 product classifications, 17 trial registrations, 21 PubMed metadata records and five grants. Original JSON responses remain under content hashes. There are 52 completed jobs and three retained historical failures; corrected OR/canonical-P replacement queries succeeded. Failure history is not silently erased.

The index adds 650 FDA application entries and 721 **Provisional source-context** edges across 39 anatomical regions. Ten curated neurotechnology entries retain 21 component assertions, including one unlocalized cochlear abstention. Applications are not asserted to be distinct product families, active implants, current marketed models, patients or evidence of benefit.

The licensed HRA male reference includes skin (5.93 MB), registered brain/spinal geometry (12.51 MB), and registered organ/skeletal reference (30.56 MB, 227 meshes, 1,061,132 triangles). A separate detailed brain loads on demand. Source hierarchies/frames, buffer bounds and hashes are checked. Not every region has geometry; female-only structures remain text-only on the male reference.

## Exercised workflow

- Dense whole-body map renders authentic indexed entries. Mouse selection of a reviewed glyph opens its intervention; touch selection of a region filters its entries. Native selectors reach decluttered regions.
- Heart entry opens the exact FDA source text/name, historical decision and original link. Its brief retains Provisional context semantics and source citations. Knee and female-only text discovery work; no female structure is placed on the male model.
- Reviewed-layer filtering removes catalogue context. Named labels preserve original intervention facts and source links; leaders move with camera orbit.
- Brain → thalamus → Activa distinguishes the original VIM interface/target from the chest generator, with original FDA evidence and locators.
- History excludes events after the selected year; decision dates are not invention dates. Publication dates preserve source precision.
- Comparison and Markdown download work. Source-record search resolves RNS identity; retrieval returns linked VNS evidence and excludes context-only entries from physical-interface answers.
- Unknown cochlear placement remains explicit. Aborted body loading retains text discovery and brief export. Internal organs load separately.
- Desktop, touch emulation, 540×680 split preview, keyboard tabs/dialog focus, API limits, source-path restrictions, headers and automated WCAG checks are exercised. Physical Safari/iPhone and universal external URL availability are unverified.

## Defects found and repaired

Incidental source words originally admitted hand-held dental tools as hand context and feet-length tubing as foot context. Generic cortical bone/pulmonary-valve language risked brain/lung confusion. Conservative phrase exclusions now cover these cases; all remaining contexts are still unreviewed. Truncated artery/intestine rules were corrected. Excerpt windows now preserve word boundaries.

The new compact filters initially hid the first original source link; controls were condensed and the source-visibility regression passed. Expanded mobile source summaries initially blocked the restore-view control; spacing was corrected and the complete workflow passed. Overlapping contextual glyph clouds intercepted a reviewed marker; reviewed groups now render above contextual groups. Compact glyph spacing scales with viewport height so record clouds do not obscure the entire reference.

## Performance interpretation

`validation/browser-performance.json` records local FCP, body fetch and heap samples at surface readiness; organs may still load at that point. `validation/interaction-benchmark.json` waits for all anatomy layers before scripted orbit sampling and includes asset timings and heap. These are same-host loopback observations without CPU/network throttling. requestAnimationFrame intervals are not independent GPU frame-rate measurements or physical-phone benchmarks.

Current screenshots are under `validation/screenshots/`: whole-body overviews, heart evidence, named intervention labels and compact selection. No independent anatomical accuracy score is claimed. The 150-row region-balanced convenience queue remains for human adjudication.

## Direct website launch

The website now mounts the actual app at `/atlas`, with its own compiled assets. Desktop and mobile-emulated checks cover model loading, device selection, original FDA links, byte-for-byte cached-source hashes, Markdown download and cited retrieval. Website/browser records are saved separately from the historical October 19 atlas checks. No new device placements or clinical outcomes are inferred by this deployment.

## Relevance regression — 2026-10-21

The public snapshot now defaults to explicitly explained interventions. `npm run typecheck`, `npm test` (33 passing) and `npm run test:ingestion` (25 passing) check source identity, exact quote spans, missing-purpose abstention and restricted anatomical associations. Portfolio TypeScript, 95 tests, production build and isolated atlas export pass.

`node tests/body-atlas.browser.mjs http://127.0.0.1:3210` now exercises the actual Shiley airway example on desktop and mobile emulation: two explained regional interventions and two matching historical events; a concise functional explanation with its original FDA PDF; no Shiley tube under Eyes; explicit coverage gaps where an explanation is unavailable. The prior Activa/source-hash/brief/retrieval workflow, automated accessibility checks and twelve existing portfolio routes remain covered. Physical phones and independent expert precision evaluation remain unverified.


## Whole-body explanation expansion — 2026-10-22

The explained layer contains 91 entries associated with 44 anatomical structures/regions. Seventy-five record-specific additions have a clear purpose, regional rationale and original FDA source. All 73 additional PMA statements and decision dates matched a bounded October 22 FDA API response; two 510(k) PDF indications were checked separately. The frozen original response, request/hash and per-entry review ledger are in `validation/`.

Validation commands: `npm run typecheck`, `npm test` (35 passing), `npm run test:ingestion` (26 passing), `node scripts/export-static.mjs ../arjan-portfolio/public/atlas`, portfolio `npm run typecheck`, `npm test` (95 passing) and `npm run build` pass. `node tests/body-atlas.browser.mjs http://127.0.0.1:3210` checks every one of the 75 additions on both desktop and mobile emulation through the real regional picker, inspector, explanation and source link. Female-only regions show an explicit text-only notice and no model annotation. Existing FDA source/hash, cited download, retrieval, accessibility and twelve-route regression checks pass.

These checks establish functional behavior and source traceability, not clinical effectiveness, complete current safety/labeling coverage or an independent anatomical precision estimate. Provisional context edges have not been upgraded to verified placement. Physical-phone testing remains unverified.


## Dossier workflow verification — 2026-10-22

`npm test`: **41 passed**; `npm run test:ingestion`: **36 passed**; `npm run typecheck`: passed. `npm run build -- --webpack` and the static exporter passed. The temporary source worktree uses an external dependency symlink, which Turbopack rejects; webpack is used explicitly here. The normal portfolio `npm run typecheck`, `npm test` (**95 passed**) and `npm run build` passed.

From `arjan-portfolio`, both `node tests/body-atlas-dossiers.browser.mjs http://127.0.0.1:3210` and `node tests/body-atlas.browser.mjs http://127.0.0.1:3210` passed. Each of desktop 1440×1000 and mobile 390×844 Chrome touch emulation exercised **all 91 dossier selections** and the established **75 explanation/region cases**. Original BHR label/recall links, lot 64803 / reference 74120146, source dates, uncertainty, Markdown citations, keyboard tabs, lazy loading, missing-artifact error/retry, Axe and zero page errors passed. Twelve existing portfolio routes and sitemap checks passed. Zero dossier requests occurred before opening Dossier. Local cached selection-to-dossier p95 was 39 ms desktop / 38 ms mobile; these are loopback observations, not production or physical-device performance guarantees.

Results: `validation/dossier-dossiers-local-2026-10-22.json` and `validation/dossier-workflow-local-2026-10-22.json`. Browser screenshots remain generated artifacts. Physical phones/Safari and comprehensive current-label/model-lot clinical review remain unverified. See [DOSSIERS.md](DOSSIERS.md) for exact scientific coverage.

Portfolio CLI lint passes with **0 errors and 14 existing warnings** in generated Rally House files. Generated `public/atlas/_next/` bundles are excluded from source lint; the maintained atlas TypeScript, unit checks and build are verified separately. The dossier branch incorporates the already merged Rally House update without editing its files.

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
