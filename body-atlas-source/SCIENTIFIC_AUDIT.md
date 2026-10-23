# Scientific audit

## Disposition

Useful local whole-body source index with a curated neurotechnology demonstration; **not certified for public or clinical release**. The central workflow is implemented, but independent anatomical precision, comprehensive regulatory/safety coverage, and current-labeling completeness remain unverified.

## Method

Inspected actual application code, source responses, persisted SQLite state, HRA GLB metadata, original regulatory database pages and FDA summaries through web retrieval, trial intervention fields, PubMed metadata, generated briefs, browser interactions, and test failures. No prior implementation claims were accepted as evidence; the starting workspace had no BODY//ATLAS implementation.

Representative original sources independently compared with cached structured fields:

- [RNS P100026](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P100026), [original SSED](https://www.accessdata.fda.gov/cdrh_docs/pdf10/P100026B.pdf): NeuroPace identity, original 2013-11-14 PMA approval, skull-mounted generator, cortical/depth leads and patient-localized foci. FDA record explicitly links NCT00264810.
- [Activa P960009](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P960009), [original SSED](https://www.accessdata.fda.gov/cdrh_docs/pdf/P960009B.pdf): original 1997-07-31 approval; unilateral thalamic VIM; separate subclavicular/subcostal generator. Later DBS indications are not inherited.
- [VNS P970003](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P970003), [original SSED](https://www.accessdata.fda.gov/cdrh_docs/pdf/P970003B.pdf): 1997-07-16 approval; left chest generator versus left vagus interface.
- [ExAblate SSED](https://www.accessdata.fda.gov/cdrh_docs/pdf15/P150038B.pdf): external head/transducer apparatus and original unilateral VIM thermal ablation indication. This is not a cortical implant or cooling procedure.
- [Precision SCS SSED](https://www.accessdata.fda.gov/cdrh_docs/pdf3/P030017B.pdf): lead insertion into epidural space, distinct from spinal cord tissue penetration.
- [NeuroStar K130233 summary](https://www.accessdata.fda.gov/cdrh_docs/pdf13/K130233.pdf): external coil/contact sensing, cortical induced currents, and a labeling-change clearance. It is not a PMA approval or first-invention milestone.

## Findings corrected

| Severity | Finding | Correction / evidence |
| --- | --- | --- |
| High | FDA PMA query may return a later supplement instead of original approval. | Explicit application query, oldest decision ordering, supplement-qualified IDs; curated original approval checks require empty supplement and APPR. Regression covers original/supplement separation. |
| High | The nominal 510(k) API returned DEN identifiers with DENG decisions. | Schema accepts the actual De Novo identifier and routes it to distinct De Novo authorization semantics; never labels it a clearance. |
| High | Generator, interface and physiological target could otherwise collapse into one location. | Separate component assertions and typed relationships; DBS, RNS, VNS, FUS, SCS and TMS regression checks. |
| Medium | Trial registration and related publications risk implying authorization or trial success. | Research entries have no asserted marketing authorization; study and paper links remain separate and describe relation limits. BrainGate program paper is not presented as results of the newer linked trial. |
| Medium | Month-only publication metadata could be dropped or falsely assigned a day. | Timeline preserves year/month/day precision; cooling literature predating the registry study now appears without invented days. |
| Medium | Fixed screen orientation labels became anatomically misleading after model orbit. | Removed direction labels; reference geometry and regional selection remain available. |
| Medium | Experimental cooling action field could imply established therapy. | Uses physiological-target semantics and explicitly limits evidence to mapping/experimental perturbation. |
| Medium | Single-substring retrieval produced incidental hits. | Word-based matching, plural normalization, minimum term coverage, linked-source display, and abstention tests. Intracortical recording retrieval distinguishes generic recording entries. |

## Remaining gaps, prioritized

1. **High / release blocker:** no independent 100-relationship benchmark. Curated source inspection and regression tests are not proof of ≥95% precision. No auto-acceptance is enabled.
2. **High / release blocker for current-status claims:** incomplete supplements, current labeling, recall and adverse-event coverage. Original approvals are historical evidence only. No claim that these records establish current authorization for every product/model or indication.
3. **Medium:** ten curated approaches versus desired 100–300 reviewed entries. Source-context indexing does not add accepted physical anatomy. Cochlear component placement remains explicitly Unknown. Licensed whole-body organ geometry is bundled for a subset of regions.
4. **Medium:** linked studies/publications are curated sparse relationships, not systematic reviews. Topic-level grants are not linked to individual technologies or anatomical regions. No organization-name similarity merging is used.
5. **Medium:** original PDFs cannot currently be reproduced from direct command-line downloads in this environment; web source inspection was possible. Original URLs/locators are preserved, while authentic API responses are cached. Independent re-review should confirm originals and capture permitted immutable documents.

## Anatomical validation interpretation

The reviewable curated assertion sample and 100+ unreviewed regulatory triage queue are separate artifacts. The queue includes external monitoring/software, implanted systems, multi-component devices, unrelated surgical tools, and ambiguous records. It is not a positive gold-standard validation set. Precision and confidence interval fields are null because independent adjudication is absent. Species, source geometry, unspecified laterality, broad resolution, and abstention are explicit; no smooth heatmap or invented device coordinate is present.

See VALIDATION.md, validation/data-integrity-report.json, and DEMO_VERIFICATION.md for actual checks and results.

## Intervention-first UI and anatomy revision

No clinical outcomes, regulatory identities or accepted anatomical edges changed. Concise intervention/action labels summarize the existing curated assertions, preserving investigational language for BrainGate and cortical cooling. Primary evidence and descriptive source links are exposed directly; component source assertions remain auditable. An internal HRA brain/spinal reference is extracted from the same licensed united assembly as the skin and preserves source registration. Its regional highlights do not establish device coordinates or improve mapping confidence. Additional whole-body organs are now bundled; vagus nerve geometry remains unavailable. Independent anatomical precision remains unverified.

## On-model intervention labels

Reviewed annotations derive from accepted Verified/Supported localized mappings; the new amber layer separately shows Provisional source contexts. Each shows the chosen relationship type and region and links to the exact existing assertion source. The overview uses coarse reference-region navigation locators; the detailed brain uses source-mesh group bounds centers. These are UI endpoints, not implantation coordinates, electrode/lesion locations or treatment trajectories. Unknown cochlear placement is omitted. Chest generator placement and neural targets remain distinct when changing region. No regulatory state, source assertion, anatomical precision or accepted graph edge changes in this revision.

## Whole-body expansion audit

The 2,490-record snapshot includes 650 generated application entries, not 650 independently reviewed product families. All 721 new anatomy edges are `indication_context` / Provisional. There are no new accepted physical-placement edges, clinical outcomes, study joins or inferred modalities. Each exact quote/span is checked against its source record and content hash. The FDA decision event can be Verified while its anatomical interpretation remains Provisional; these are separate assertions.

Actual failure cases found and repaired: hand-held dental tools mapped to hand; 6-foot/50-feet tubing mapped to foot; generic cortical bone risked becoming cerebral cortex; pulmonary valve risked becoming lung. Rules now exclude these cases. Truncated artery/intestine patterns missed genuine explicit mentions and were corrected. Specimen/IVD and negated text are excluded conservatively. Remaining false positives and false negatives are expected: no independent accuracy estimate exists. A 150-row region-balanced convenience review queue is saved for adjudication, not represented as validation.

The HRA organs preserve source registration and licensed attribution; display glyphs deliberately encode record membership around a region, not implant coordinates. Female-only source contexts remain text-only on this male reference. The two evidence layers can be filtered independently. Physical-interface retrieval excludes unreviewed catalogue entries. No invention date is inferred from an FDA event.


### Relevance correction — 2026-10-21

The 2026-10-21 release introduced 16 explicitly explained interventions (10 existing neurotechnology entries and six record-specific FDA explanations). Device purpose, anatomical relevance and the supporting source are separate. Unexplained applications remain available through explicit source-context layers and Records; a raw product title is never used as a functional explanation. An empty explained region states the coverage gap instead of suggesting unrelated devices.

`anatomical-context-v2` excludes Murphy/needle-eye product features and aortic-valve wording from separate eye/aorta assignments. Regeneration yields 650 applications and 717 exact contextual spans before six editorial region restrictions. These remain Provisional; explanation review does not validate component placement. “Upper airway” was broadened to “Airway” to avoid calling the trachea an upper-airway structure. Timeline events, counts and model annotations now follow the selected evidence layer and filters. Earlier counts and the unadjudicated v1 review queue above describe the previous snapshot, not a precision measurement.

The Shiley explanation was checked against K250173, PDF pages 4, 7 and 8. Other additions use the original FDA approval statements for P130008, P010047, P130013, P140031 and P020023. These are historical indications; later supplements and current labeling have not been exhaustively reviewed. Regression checks cover source identity, region restrictions, missing-purpose abstention, exported explanation citations, and the actual airway/eye desktop/mobile workflow.


### Whole-body explanation expansion — 2026-10-22

The default collection now contains **91 explained entries**, up from 16, with direct associations to **44 anatomical structures/regions**. The 75 additions cover 36 regions, including cardiac/vascular, pulmonary, ophthalmic, hearing, dental, digestive, hepatobiliary, renal/urinary, reproductive, breast, skin, hand/shoulder/hip/knee/ankle/foot and spinal interventions. These are explained application entries, not a claim of 91 distinct invention categories or current marketed product families.

Every addition is keyed to one original FDA record and has a specific purpose, regional rationale, source and scope restrictions in `lib/whole-body-explanations.json`. The 73 PMA originals were checked in one bounded live FDA request on October 22: all original approval statements and decision dates matched the cached source records. The two 510(k) explanations were checked against K260007 (PDF page 5) and K260721 (PDF page 4). The original response, digest, request and review ledger are preserved in `validation/fda-originals-2026-10-22.json`, `validation/whole-body-source-check.json` and `validation/whole-body-explanation-review.json`.

Version 3 context extraction applies explicit editorial region scopes only where an exact anatomical phrase can be recovered from the source. It does not upgrade Provisional context to a physical placement. Regression cases exclude colorectal-primary liver treatment from the colon, above-knee vascular stents from the knee joint, glaucoma stents from lens replacement, and disc prostheses or hand neuroprostheses from spinal-cord implantation. Organ-perfusion systems are explained as extracorporeal; original product-name changes remain explicit. Female-only anatomy stays text-only on the male mesh and now has a visible notice.

The catalogue contains 652 applications and 712 contextual assertions after the restrictions; original raw records remain intact. Completeness, current labeling, recall status and independent expert mapping precision have not been exhaustively established. This editorial review is not a representative clinical validation study.


## Per-entry regulatory, labeling and safety dossiers — 2026-10-22

All **91 explained entries** now have an inspectable, downloadable dossier. The original search corpus remains 2,490 records; the dossier corpus is separate and overlaps its original decisions. The 89 marketing applications comprise 85 PMAs and four 510(k)s. BrainGate and cortical cooling retain investigational/public-authorization-not-established status.

The checked public PMA inventory contains **6,505 original/supplement decision records** (85 originals plus 6,420 supplements; provider update 2026-10-12). All 85 original identifiers/dates reconcile to the existing entries. The four 510(k) identities/decisions remain linked to their authentic cached sources. The 351-result FDA recall query (provider update 2026-10-19) yields **349 accepted direct application-linked records** and **two malformed references held separately**. Accepted supplement references normalize to their parent PMA; broad `openfda.*` manufacturer harmonization never establishes a recall join. Positive records preserve product, lot/serial, reason, action, initiation/posting dates and status as supplied. Status is not independently verified current lifecycle. Zero direct matches is not a safety finding.

There are **100 original labeling document links across 71 entries**, plus four clearly separated 510(k) summaries. The other 14 PMA entries have no accepted original labeling link yet. Sixty-one exact section headings in 19 readable documents have direct PDF-page links; heading discovery is not section-content review. Original label discovery uses publicly retrieved FDA application pages, including cached web retrieval where direct downloads were provider-blocked. The inventory records access method/date, source URL, missing documents and unavailable text. Original labeling is not certified current.

Six FDA safety/early-alert index pages contain 410 unique notice URLs. Explicit product/class title screening produces candidates, never a confirmed model/application association. Pre-2023 web archives, complete manufacturer notices, enforcement classification reconciliation and MAUDE are outside the checked inventory. **Current instructions/revision, contraindications, warnings, precautions, interactions and affected model/lot applicability remain pending.** No dossier is labeled clinically complete or safe. Broad disclaimers in brief exports are replaced with per-entry coverage, source links and named remaining review tasks.

Reproduce without network or an ingestion database: `python3 ingestion/build_dossiers.py`. It rehydrates the compact `data/dossier-acquisition-index.json` manifest from SHA-256-verified original files in `public/dossier-sources/`. Corrupt sources, inconsistent pagination and incomplete history/recall refreshes fail rather than replace the published collection. New live acquisition is explicit: `npm run dossiers:scope`, `npm run dossiers:acquire` (cached resumable jobs), then `npm run dossiers:build`; use `python3 ingestion/dossiers.py acquire --force` for an intentional refresh. Original labeling discovery is an attributed, separately reviewed inventory, not guessed PDF paths or an automated current-IFU scraper.

The interface lazy-loads `/dossiers/<entry>.json` only after opening Dossier. It offers dated decisions, a labeling-mention filter, original labeling and section links, full affected-product recall detail, candidate safety notices, source timestamps/checksums, JSON download and dossier citations in Markdown briefs. Switching entries preserves the chosen detail tab. Data is text/JSON; third-party HTML is preserved as `.txt`, never executable HTML.

## Labeling and safety follow-up — 2026-10-22

Supersedes the earlier blanket pending status: all 91 entries have model-scoped source assessments; 349 recall source-field audits and 15 notice-scope decisions are recorded. Five original-label gaps were closed (105 links / 76 entries). Three product-specific label gaps remain, and historical or model-limited sources are not certified as complete current IFUs. Individual unit applicability remains undetermined. Full methodology, original links, exceptions and the 91-entry ledger: [LABELING_SAFETY_REVIEW.md](LABELING_SAFETY_REVIEW.md).


### Original-label trace and warning clarity — 2026-10-22

A deeper trace added Hudi’s exact condom restriction, Advanced Glenoid cemented/compatibility distinctions and archival Braun-Cutter/Avanta CMC manufacturer-insert excerpts with an explicit PMA identity crosswalk. No complete revision-controlled IFU was recovered; all three full-label gaps remain open. Historical excerpts are not certified as the original approved or current label. Review meanings, compared models, unknown revisions and the leading entry-specific limit are visible and included in briefs. See [LABELING_SAFETY_REVIEW.md](LABELING_SAFETY_REVIEW.md) and the linked source-trace ledger. Requests remain unsent.
