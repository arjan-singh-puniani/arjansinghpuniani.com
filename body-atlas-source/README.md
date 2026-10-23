# BODY//ATLAS

Explore interventions across a rotatable human reference with internal organs, select an FDA application, inspect its original evidence, and export a cited brief. The cached collection contains **2,490 authentic source records**, **652 source-indexed FDA applications**, and **91 explained entries across 44 anatomical structures/regions**. The two evidence layers are explicitly different: source-text context is Provisional, not verified device placement.

**Status: public research preview; scientific and clinical validation is not certified.** This is a bounded authentic snapshot, not a live feed, medical recommendation, complete device catalogue, or validated anatomical classifier. Read [RELEASE_READINESS.md](RELEASE_READINESS.md).

## Run locally

Requires Node.js 22.13+ and Python 3.10+. No API keys or database server are needed for the cached demonstration.

```sh
npm ci
npm run build
npm run start
```

Open <http://127.0.0.1:3100>. For editing, use `npm run dev`. Local servers bind to loopback. The checked-in snapshot works without contacting external data providers. External evidence links require internet access.

## Explore the map

1. Start with the dense **Map**. Each dot represents an indexed entry, arranged around a broad regional anchor. Dots are diagram glyphs, not implant coordinates. Hover/click a dot with a mouse, or choose a named region and an intervention from its list on touch/keyboard.
2. Select **Heart**, **Eyes**, **Knee**, or another region. The native **Region** selector reaches every indexed region, including labels hidden to avoid overlap. Selecting a region focuses the reference; drag to rotate and scroll/pinch to zoom. **Human** in the breadcrumb restores the whole body.
3. Choose an entry. Its source excerpt/device name, historical decision type/date and original FDA hyperlink open immediately. **Sources** exposes the cached original response and hash. An application is not necessarily a distinct product family or a currently marketed model.
4. Switch **Evidence layer** to **Reviewed relationships**, then **Labels** for named on-model neurotechnology callouts. Choose **Brain → Thalamus → Activa** to inspect separate thalamic interface/target and chest generator assertions. **Evidence** opens the original document and locator.
5. Scrub **History** to filter documented events. These are decision/publication/registration dates, not invention dates. Open **Compare** for Activa versus ExAblate and export the sourced comparison.
6. Select an entry and **Brief** for Markdown export. **Questions** searches indexed evidence; text-context matches cannot answer physical-interface questions as established placement. **Records** searches the full 2,490-record snapshot, including unassigned applications, studies, publications and grants.

**Organs** toggles registered internal geometry; **Surface** changes skin rendering. **Expand** gives the anatomy the workspace while keeping a selected source-linked summary available. Narrow screens split anatomy and a scrollable evidence panel. Source-record dots do not capture touch gestures; region buttons and the list provide touch/keyboard discovery. If WebGL or an asset fails, text selection and brief export remain usable.

The HRA reference is male and incomplete. Uterus/vagina source entries are discoverable as text but are never placed on this male model. Coarse navigation locators do not establish anatomical/device coordinates. The 652 contextual entries are **not independently reviewed**. No automatic physical-placement acceptance is enabled.

## Ingestion and verification

```sh
# Rebuild local SQLite from immutable checked-in responses, without network
python3 ingestion/pipeline.py restore
python3 ingestion/pipeline.py status

# Retrieve only pending bounded jobs; completed jobs are not fetched again
npm run ingest
# Bounded original PMA approvals + latest 100 submissions from 16 FDA panels
python3 ingestion/pipeline.py refresh --scope whole-body
# Explicitly rerun the bounded plan, retaining prior versions
python3 ingestion/pipeline.py refresh --force
# Export after an intentional database change; rebuild app to use new snapshot
npm run snapshot
python3 ingestion/build_catalogue.py
node --import tsx scripts/validate.ts
python3 ingestion/mapping_queue.py
python3 ingestion/mapping_queue.py --validate validation/anatomical-review-queue.csv

npm run typecheck
npm test
npm run test:ingestion
npm run build
npm run test:browser
```

Browser checks use installed Google Chrome through Playwright. On a clean machine, install Chrome or adjust `channel` in `playwright.config.ts` for an installed Playwright Chromium. No browser download is part of ordinary installation. `test-results/` contains generated screenshots, traces on failure, JSON results, and performance attachments.

The 3D asset and authoritative public API responses are included. There are no synthetic scientific records in the UI. Python unit fixtures are explicitly synthetic and isolated from application data. Some ingestion jobs may fail; coverage shows their state without deleting earlier data.

## Boundaries

This is a separate repository on `feat/neurotechnology-observatory`. The public snapshot is mounted at https://arjansinghpuniani.com/atlas with separate assets and native launch links from the portfolio. No DNS or credential changes are needed. Independent scientific validation, authenticated private workspaces, and production monitoring remain unverified.

Private notes must stay outside tracked/public source paths; `data/private/` is ignored and never routed. A private authenticated workspace is not implemented. Do not add owner academic, medical, legal, or application materials to the public dataset.

See [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_SOURCES.md](DATA_SOURCES.md), [ANATOMICAL_MAPPING.md](ANATOMICAL_MAPPING.md), [VALIDATION.md](VALIDATION.md), [COMPETITIVE_RESEARCH.md](COMPETITIVE_RESEARCH.md), and the audit reports.

## Website snapshot

Open **https://arjansinghpuniani.com/atlas** directly, or use **Launch interactive atlas** on the project page. The website serves a self-contained, read-only snapshot. Search/retrieval remains local; Markdown briefs download without a server API; original responses are available through content-addressed `/atlas/sources/` links. The website source tree retains this app under `body-atlas-source`, sharing its geometry and original evidence through relative symlinks to the hosted files.

Rebuild from that source directory with `npm ci` then `node scripts/export-static.mjs ../arjan-portfolio/public/atlas`. The export excludes ingestion databases, private data and server API routes. It verifies original response hashes and only replaces a recognized generated destination after a successful build. The normal standalone app keeps its existing APIs.


### Relevance correction — 2026-10-21

The 2026-10-21 release introduced 16 explicitly explained interventions (10 existing neurotechnology entries and six record-specific FDA explanations). Device purpose, anatomical relevance and the supporting source are separate. Unexplained applications remain available through explicit source-context layers and Records; a raw product title is never used as a functional explanation. An empty explained region states the coverage gap instead of suggesting unrelated devices.

`anatomical-context-v2` excludes Murphy/needle-eye product features and aortic-valve wording from separate eye/aorta assignments. Regeneration yields 650 applications and 717 exact contextual spans before six editorial region restrictions. These remain Provisional; explanation review does not validate component placement. “Upper airway” was broadened to “Airway” to avoid calling the trachea an upper-airway structure. Timeline events, counts and model annotations now follow the selected evidence layer and filters. Earlier counts and the unadjudicated v1 review queue above describe the previous snapshot, not a precision measurement.

The Shiley explanation was checked against K250173, PDF pages 4, 7 and 8. Other additions use the original FDA approval statements for P130008, P010047, P130013, P140031 and P020023. These are historical indications; later supplements and current labeling have not been exhaustively reviewed. Regression checks cover source identity, region restrictions, missing-purpose abstention, exported explanation citations, and the actual airway/eye desktop/mobile workflow.


### Whole-body explanation expansion — 2026-10-22

The default collection now contains **91 explained entries**, up from 16, with direct associations to **44 anatomical structures/regions**. The 75 additions cover 36 regions, including cardiac/vascular, pulmonary, ophthalmic, hearing, dental, digestive, hepatobiliary, renal/urinary, reproductive, breast, skin, hand/shoulder/hip/knee/ankle/foot and spinal interventions. These are explained application entries, not a claim of 91 distinct invention categories or current marketed product families.

Every addition is keyed to one original FDA record and has a specific purpose, regional rationale, source and scope restrictions in `lib/whole-body-explanations.json`. The 73 PMA originals were checked in one bounded live FDA request on October 22: all original approval statements and decision dates matched the cached source records. The two 510(k) explanations were checked against K260007 (PDF page 5) and K260721 (PDF page 4). The original response, digest, request and review ledger are preserved in `validation/fda-originals-2026-10-22.json`, `validation/whole-body-source-check.json` and `validation/whole-body-explanation-review.json`.

Version 3 context extraction applies explicit editorial region scopes only where an exact anatomical phrase can be recovered from the source. It does not upgrade Provisional context to a physical placement. Regression cases exclude colorectal-primary liver treatment from the colon, above-knee vascular stents from the knee joint, glaucoma stents from lens replacement, and disc prostheses or hand neuroprostheses from spinal-cord implantation. Organ-perfusion systems are explained as extracorporeal; original product-name changes remain explicit. Female-only anatomy stays text-only on the male mesh and now has a visible notice.

The catalogue contains 652 applications and 712 contextual assertions after the restrictions; original raw records remain intact. Completeness, current labeling, recall status and independent expert mapping precision have not been exhaustively established. This editorial review is not a representative clinical validation study.


## Dossier milestone — 2026-10-22

All 91 explained entries now have a **Dossier** tab: regulatory history, original labeling, reported recalls, original-source links, source dates and explicit review status. See [DOSSIERS.md](DOSSIERS.md) for counts, reproducible commands and remaining review. The dossier snapshot is cached, not a live safety-alert feed.

## Labeling and safety follow-up — 2026-10-22

Supersedes the earlier blanket pending status: all 91 entries have model-scoped source assessments; 349 recall source-field audits and 15 notice-scope decisions are recorded. Five original-label gaps were closed (105 links / 76 entries). Three product-specific label gaps remain, and historical or model-limited sources are not certified as complete current IFUs. Individual unit applicability remains undetermined. Full methodology, original links, exceptions and the 91-entry ledger: [LABELING_SAFETY_REVIEW.md](LABELING_SAFETY_REVIEW.md).


### Original-label trace and warning clarity — 2026-10-22

A deeper trace added Hudi’s exact condom restriction, Advanced Glenoid cemented/compatibility distinctions and archival Braun-Cutter/Avanta CMC manufacturer-insert excerpts with an explicit PMA identity crosswalk. No complete revision-controlled IFU was recovered; all three full-label gaps remain open. Historical excerpts are not certified as the original approved or current label. Review meanings, compared models, unknown revisions and the leading entry-specific limit are visible and included in briefs. See [LABELING_SAFETY_REVIEW.md](LABELING_SAFETY_REVIEW.md) and the linked source-trace ledger. Requests remain unsent.

## Body contour

The **Contour** exterior uses an adapted shoulder, chest, upper-arm and waist silhouette in the neutral atlas style. **Contour / Reference** restores the unmodified HRA surface. Sculpted facial contours and muscle relief share the holographic material; no photographic textures or identifying subject labels are included. Organs and intervention anchors retain their original HRA frame. Proportions are artistic approximations. Original photos remain private. History playback begins at 1999 while earlier cited dates remain available in source records. See [BODY_CONTOUR.md](BODY_CONTOUR.md).
