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
