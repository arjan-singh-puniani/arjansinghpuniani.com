# Data sources and rights

All displayed scientific records originate from public APIs. `data/atlas.json` records export time, source URLs, retrieval timestamps, provider update values where supplied, immutable hashes, and job status. `data/sources/` preserves actual JSON responses, not fabricated fixtures. The collection is cached and bounded; provider coverage is not corpus coverage.

## Implemented adapters

| Source | Endpoint / bounded plan | Handling |
| --- | --- | --- |
| FDA submissions | [device/510k](https://open.fda.gov/apis/device/510k/), `https://api.fda.gov/device/510k.json` | Latest 100 submissions per panel across 16 panels (including neurology), with overlapping previous acquisitions deduplicated by application identity. This endpoint returned De Novo IDs; they are represented separately from clearance records. The panel sample includes neurosurgical tools and some non-neural applications. |
| FDA classification | [device/classification](https://open.fda.gov/apis/device/classification/) | Ten selected product-code responses. Classification does not establish a particular product's authorization or anatomical placement. |
| FDA PMA | [device/pma](https://open.fda.gov/apis/device/pma/) | Original canonical P-number APPR decisions with empty supplement, bounded to two 500-record pages; plus earlier specific original-application queries. Supplement identities are preserved. Curated original approvals require an empty supplement and APPR decision. An extra Guardian cardiac record acquired during source investigation is retained transparently; it is not a neural product family. |
| ClinicalTrials.gov | [v2 documentation](https://clinicaltrials.gov/data-api/api), `/api/v2/studies` | Bounded topic searches and FDA-linked NCT00264810. First-posted date is a registry event, not recruitment start or success. |
| PubMed | [E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/) | Search + ESummary metadata. No publisher full text or abstracts are redistributed. Some topic search results are irrelevant; they remain source records without automatic family links. |
| NIH RePORTER | [API v2](https://api.reporter.nih.gov/?urls.primaryName=V2.0), `/v2/projects/search` | Five title-query matches. Grants are searchable with organizations and investigators. No regional anatomy or specific product relationship is inferred. |

Live interfaces were checked before implementation, with actual requests recorded in the snapshots. No API key was required. Requests are sequential with a 0.4-second inter-request delay and at most three attempts for transient errors. Distributed or higher-volume NCBI use needs a registered contact/tool under [NCBI usage policy](https://www.ncbi.nlm.nih.gov/home/about/policies/); no contact email has been invented. Broader openFDA use must remain within its [authentication and service limits](https://open.fda.gov/apis/authentication/).

## Investigated, not integrated

- [De Novo](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/denovo.cfm): official database differs from PMA. Only De Novo records actually returned in the bounded submission response are indexed; this is not full De Novo ingestion.
- [Recall databases, registration/listing, and TPLC](https://www.fda.gov/medical-devices/device-advice-comprehensive-regulatory-assistance/medical-device-databases): separate semantics. openFDA device recall/enforcement and adverse-event endpoints must not be treated as approval or causality data. No systematic recall/MAUDE coverage is implemented.
- [AccessGUDID](https://www.fda.gov/medical-devices/global-unique-device-identification-database-gudid/accessgudid-public): NLM public search, bulk downloads, and its own API; identifiers do not by themselves establish marketing authorization. GMDN rights require separate review before reuse; GUDID is not downloaded here.
- [FDA bulk manifest](https://open.fda.gov/data/downloads/): appropriate future backfill source. No full historical backfill is implemented.
- [OpenAlex](https://help.openalex.org/) and [Crossref REST](https://www.crossref.org/documentation/retrieve-metadata/rest-api/): useful for scholarly identity/citation enrichment, but unnecessary for this first PubMed-linked slice. No API integration or additional license claim is made.
- Official patent sources are deferred; no patent-device linkage is inferred from names.

## Licenses and attribution

openFDA's [license](https://open.fda.gov/license/) generally dedicates its materials under CC0, subject to exceptions (including GMDN), terms, trademarks, and third-party rights. Do not imply FDA endorsement. Preserve source identifiers and disclaimer context.

NLM/PubMed policies distinguish public government metadata from potentially protected third-party content. This preview uses ESummary metadata and original source links; article full text is not included. ClinicalTrials.gov registry content is submitted by sponsors; it is displayed as registry evidence under its [terms](https://clinicaltrials.gov/about-site/terms-conditions), not independently verified clinical findings. RePORTER results are public grant metadata; they do not establish current affiliation, available jobs, or collaboration interest.

**Anatomical geometry:** Kristen Browne and Heidi Schlehlein, *3D Reference Organ for Brain, Male v1.3* (2023), [DOI 10.48539/HBM929.XKCL.339](https://doi.org/10.48539/HBM929.XKCL.339), HuBMAP/HRA, **CC BY 4.0**. [Official release metadata](https://github.com/hubmapconsortium/ccf-releases/blob/main/v2.0/markdown/ref-organs/3d-m-brain.md) is preserved at `public/anatomy/HRA-BRAIN-SOURCE.md`. The GLB is unmodified; only display centering, uniform scaling, color, opacity, and visibility change at runtime. Based on Allen Human Reference Atlas 3D 2020, mirrored and resized by the HRA creators. The brain-specific license was explicitly updated in HRA v2.0; older restrictive licensing was not assumed applicable.

**Ontology:** identifiers and preferred concept names reference [Uberon](https://obophenotype.github.io/uberon/), with local BODY IDs where a suitable identifier was not independently established. This is a bounded curated subset, not a redistributed complete ontology.

Original FDA PDFs were readable via web retrieval for representative source inspection. Direct downloads encountered an access barrier; no HTML error response is retained as a PDF. Evidence assertions link to original PDFs and page/section locators. Cached API records and web-inspected PDF evidence are explicitly different provenance paths.

## Full-body reference surface

Kristen Browne and Heidi Schlehlein, *3D Reference Organ Set for United, Male v1.5* (2023), [DOI 10.48539/HBM646.RKKC.257](https://doi.org/10.48539/HBM646.RKKC.257), HRA, **CC BY 4.0**. Official release metadata is preserved at `public/anatomy/HRA-BODY-SOURCE.md`. Original archive: <https://cdn.humanatlas.io/hra-releases/v2.0/models/3d-vh-m-united.glb.zip>.

`public/anatomy/body.glb` isolates the original ontology-tagged skin surface (UBERON:0002097). Original accessor values and node metadata are retained; shared buffer views are repacked without resampling. The extraction script checks for unsupported parent transforms. Runtime adaptations are centering, uniform scaling, contour shading, color and regional emphasis. This surface does not provide registered internal organ or device coordinates. `body-manifest.json` records source/output hashes, attribution and transformations. 5,931,648 bytes; 185,314 triangles. Reproduce from the downloaded/extracted official archive with `python3 scripts/extract-body.py /path/to/3d-vh-m-united.glb`.

### Registered internal anatomy

`public/anatomy/nervous.glb` extracts the brain and spinal-cord subtrees from the **same** HRA male united v1.5 assembly as the body surface. It preserves source hierarchy, node transforms, ontology metadata, attributes and indices. No geometry from unrelated reference frames is registered by guesswork. The shared display translation/scale comes from the body surface bounds. The output is 12,506,004 bytes, 313 meshes, 672,626 indexed triangles; source and output SHA-256 values are in `nervous-manifest.json`. The attribution and CC BY 4.0 license are the same as the united assembly above. Reproduce with `python3 scripts/extract-nervous.py /path/to/3d-vh-m-united.glb`. Vagus and cochlear geometry is not included. Additional organ geometry is described below.

## Whole-body acquisition, 2026-10-19

The official [PMA interface](https://open.fda.gov/apis/device/pma/) and [query parameters](https://open.fda.gov/apis/query-parameters/) were checked before acquisition. The snapshot contains 836 canonical original PMA approvals, 1,564 510(k) clearances, 37 De Novo authorizations returned by the submission endpoint, 10 classification records, 17 trials, 21 PubMed metadata records and 5 grants. These are historical source records, not unique products, active implants, effectiveness counts or a comprehensive FDA corpus.

Original-approval queries use `decision_code:APPR AND supplement_number:""`; the older page additionally uses `pma_number:P*`. The unfiltered source also contains legacy N-number records; these were rejected by strict PMA validation and are outside this snapshot. The reserved panel token OR required quotation. Failed query history remains visible; corrected replacement jobs succeeded. There are 52 complete and 3 historical failed jobs. No failing batch erased prior records. Acquisition stayed bounded and sequential; no full bulk download or high-volume scraping was attempted.

`data/catalogue.json` indexes exact anatomical phrases from original PMA indication statements or device names. It adds 650 application entries and 721 Provisional context relationships across 39 regions. 1,777 eligible records were excluded for no accepted phrase or specimen/IVD context. Rules exclude hand-held equipment, numeric feet/foot units, finger-stick comparators, naked-eye references, negated phrases and pulmonary-valve/brain-cortex confusions. This is a conservative research index with false-positive/false-negative risk, not a validated anatomical mapper.

### Registered organs and skeletal reference

`public/anatomy/organs.glb` derives from the same CC BY 4.0 united male v1.5 source cited above. Creators: Kristen Browne and Heidi Schlehlein. **30,562,436 bytes; 227 meshes; 1,061,132 triangles.** Original node hierarchy, metadata, attributes and indices are retained; buffers are repacked without resampling. Runtime color/transparency/visibility and shared display translation/scale are adaptations. `organs-manifest.json` preserves hashes, source URL, DOI, license and adaptation statement. `organ-regions.json` records source-group bounds; region navigation centers are not device coordinates. Reproduce with `python3 scripts/extract-organs.py /path/to/3d-vh-m-united.glb`. This male reference does not model female reproductive anatomy, and not every indexed region has a bundled mesh.

### Explained whole-body entries — October 22, 2026

Seventy-three additional PMA approval statements and original decision dates were compared against a single bounded official `/device/pma.json` request (`supplement_number:""`, the selected application numbers, `limit=100`). All 73 matched the cached source fields. Preserve the response and its digest/request in `validation/fda-originals-2026-10-22.json` and `validation/whole-body-source-check.json`; the per-entry ledger is `validation/whole-body-explanation-review.json`. This check does not establish complete current labeling, safety-notice coverage or independent anatomical accuracy.

Two added 510(k) explanations use the indications in the original FDA-hosted summaries: [Hudi vaginal suppositories, K260007, PDF page 5](https://www.accessdata.fda.gov/cdrh_docs/pdf26/K260007.pdf) and [Tornier Perform Advanced Glenoid, K260721, PDF page 4](https://www.accessdata.fda.gov/cdrh_docs/pdf26/K260721.pdf). The short review-ledger excerpts are attributed to these documents; full manufacturer summaries are linked rather than redistributed. Their decisions remain 510(k) clearances, not PMA approvals.


## Dossier milestone — 2026-10-22

Dossier sources add the official [openFDA PMA API](https://open.fda.gov/apis/device/pma/) and [device recall API](https://open.fda.gov/apis/device/recall/), plus FDA [safety communications](https://www.fda.gov/medical-devices/medical-device-safety/safety-communications) and [recall/early-alert indexes](https://www.fda.gov/medical-devices/medical-device-safety/medical-device-recalls-and-early-alerts). PMA API history begins in 1976; recall API coverage begins in 2002. FDA warns against using these data for medical decisions, public alerting or recall lifecycle tracking. Original API responses are preserved under their SHA-256. FDA website index HTML is served only as text. Original label PDFs remain linked at FDA, with no blanket redistribution claim over manufacturer material. Original label discovery metadata is preserved separately with access/caching limits; current revisions and full text review remain pending. See [DOSSIERS.md](DOSSIERS.md).

## Labeling and safety follow-up — 2026-10-22

Supersedes the earlier blanket pending status: all 91 entries have model-scoped source assessments; 349 recall source-field audits and 15 notice-scope decisions are recorded. Five original-label gaps were closed (105 links / 76 entries). Three product-specific label gaps remain, and historical or model-limited sources are not certified as complete current IFUs. Individual unit applicability remains undetermined. Full methodology, original links, exceptions and the 91-entry ledger: [LABELING_SAFETY_REVIEW.md](LABELING_SAFETY_REVIEW.md).


### Original-label trace and warning clarity — 2026-10-22

A deeper trace added Hudi’s exact condom restriction, Advanced Glenoid cemented/compatibility distinctions and archival Braun-Cutter/Avanta CMC manufacturer-insert excerpts with an explicit PMA identity crosswalk. No complete revision-controlled IFU was recovered; all three full-label gaps remain open. Historical excerpts are not certified as the original approved or current label. Review meanings, compared models, unknown revisions and the leading entry-specific limit are visible and included in briefs. See [LABELING_SAFETY_REVIEW.md](LABELING_SAFETY_REVIEW.md) and the linked source-trace ledger. Requests remain unsent.

## Body contour — 2026-10-23

`public/anatomy/contour.glb` is a photo-guided body-contour derivative of the attributed CC BY 4.0 HRA male v1.5 skin. Modifications concern shoulder, chest, upper-arm, waist and localized external pelvic shape. Neutral head and source topology remain. No personal facial appearance, photo files, textures or vertex colors are included. This contributes no biomedical evidence or measured personal anatomy. See [BODY_CONTOUR.md](BODY_CONTOUR.md).
