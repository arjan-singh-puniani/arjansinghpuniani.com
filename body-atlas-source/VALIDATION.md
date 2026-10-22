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
