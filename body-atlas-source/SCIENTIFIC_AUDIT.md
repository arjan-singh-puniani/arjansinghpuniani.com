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
