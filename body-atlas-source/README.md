# BODY//ATLAS

Explore interventions across a rotatable human reference with internal organs, select an FDA application, inspect its original evidence, and export a cited brief. The cached collection contains **2,490 authentic source records**, **650 source-indexed FDA applications across 39 regions**, and **10 curated neurotechnology entries**. The two evidence layers are explicitly different: source-text context is Provisional, not verified device placement.

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

The HRA reference is male and incomplete. Uterus/vagina source entries are discoverable as text but are never placed on this male model. Coarse navigation locators do not establish anatomical/device coordinates. The 650 contextual entries are **not independently reviewed**. No automatic physical-placement acceptance is enabled.

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

The default layer now shows 16 explicitly explained interventions (10 existing neurotechnology entries and six record-specific FDA explanations). Device purpose, anatomical relevance and the supporting source are separate. Unexplained applications remain available through explicit source-context layers and Records; a raw product title is never used as a functional explanation. An empty explained region states the coverage gap instead of suggesting unrelated devices.

`anatomical-context-v2` excludes Murphy/needle-eye product features and aortic-valve wording from separate eye/aorta assignments. Regeneration yields 650 applications and 717 exact contextual spans before six editorial region restrictions. These remain Provisional; explanation review does not validate component placement. “Upper airway” was broadened to “Airway” to avoid calling the trachea an upper-airway structure. Timeline events, counts and model annotations now follow the selected evidence layer and filters. Earlier counts and the unadjudicated v1 review queue above describe the previous snapshot, not a precision measurement.

The Shiley explanation was checked against K250173, PDF pages 4, 7 and 8. Other additions use the original FDA approval statements for P130008, P010047, P130013, P140031 and P020023. These are historical indications; later supplements and current labeling have not been exhaustively reviewed. Regression checks cover source identity, region restrictions, missing-purpose abstention, exported explanation citations, and the actual airway/eye desktop/mobile workflow.
