# Architecture

## Implemented slice

Next.js 16 / TypeScript / React serve the observatory. React Three Fiber and Three.js render licensed HRA body-surface and brain GLBs. Python standard-library adapters acquire bounded authoritative records into local SQLite and content-addressed JSON storage. A versioned export (`data/atlas.json`) feeds deterministic search and application views. Refresh requires export and rebuild; runtime UI is deliberately labelled cached.

```text
fixed acquisition plan → durable SQLite jobs → verified TLS / size limits
 → whole-batch schema validation → SHA-256 source storage
 → transactional idempotent records + immutable versions
 → exported snapshot → Next.js search, evidence, comparison, brief APIs

raw record → provisional candidate extraction → review queue
 → original source inspection → explicit curated component relationship
 → ontology identity + regional display → evidence inspector
```

## Data boundaries

`ingestion/pipeline.py` creates jobs, artifacts, records, and record_versions. Record identities use FDA application + supplement, NCT, PMID, NIH application ID, or FDA product code. This is a normalized source-record store, not yet the full normalized biomedical graph specified in the master brief.

`lib/types.ts` separates records, product entries/families, anatomical structures, component relationships, and historical events. `lib/curation.ts` contains explicit, reversible source-backed assertions. Studies, publications, and regulatory applications are distinct IDs. A study's sponsor is not automatically its manufacturer; applicants are shown as retrieved, without historical name reconstruction. Investigators and organizations are metadata fields, not independently resolved identity graphs. Components are explicit on relationships; separate persisted component entities remain a future migration.

PostgreSQL, FastAPI, Redis, a graph database, vector search, and object-storage services are not needed for this bounded local collection. No distributed production architecture is claimed. Move to PostgreSQL when concurrent curation, multi-user ingestion, or measured query volume justifies it; retain source hashes and application identities in migration.

## Application APIs

- `GET /api/search?q=`: bounded deterministic retrieval, linked records, visible match criteria. No language-model call, execution tool, or external request.
- `GET /api/brief?ids=rns,activa&year=2026`: Markdown attachment, known IDs only, bounded selection and year validation.
- `GET /api/source/<sha>`: reads only a manifest-listed immutable JSON response, with strict 64-hex validation. It cannot read arbitrary paths.

Browser data is public-only. Python, its writable SQLite store, credentials, and private paths are never reachable through the API. Source documents are untrusted data, rendered as escaped text. Public rendering uses only allowlisted HTTPS source links.

## Anatomy and performance

The initial human view lazy-loads a 5.93 MB extracted HRA male v1.5 skin surface. Source geometry is preserved with repacked buffers; contour shading produces the reference display. Floating HTML region buttons support touch and keyboard selection. Whole-body surface clicks use broad navigation zones; organ clicks use tagged source mesh groups. These zones and labels are not scientific mappings or device coordinates. Selecting an intervention emphasizes its associated regions without drawing invented implants.

`AtlasExperience.tsx` owns the shared region, family, filter, history and comparison state. It replaces the earlier verbose Observatory layout. Anatomical relationships are buttons; evidence assertions are expandable. Source inspection, comparison, research and briefs use focus-trapped dialogs. Narrow screens put evidence below the diagram.

The 11.98 MB HRA male brain v1.3 is lazy-loaded after the useful text UI. It retains 286 source nodes and anatomical metadata. Display centering and uniform scale are derived from source bounds; these are not exported as biomedical coordinates. VIM assignments use thalamic regional highlighting; no precise VIM marker or simulated electrode is drawn. Unbundled structures use the text index.

Demand-based rendering, capped DPR, no automatic motion, and independent text discovery limit graphics cost. Source loading errors and missing WebGL have a text fallback. Physical-device performance, broad browser compatibility, and clinical geometry validation remain unverified.

## Operations and limitations

Jobs have durable state, bounded attempts, checkpoints (last committed hash), and expiring leases. Retries cover transient HTTP/provider failures; invalid schemas fail isolated jobs. Existing records are never deleted by refresh. The source batch commits atomically. The plan is a bounded snapshot plan, not a corpus-wide backfill, incremental watermark service, scheduler, or recall surveillance system. See RELIABILITY_REPORT.md before scaling.

## Intervention-first preview revision

The human view adds a separately loaded 12.51 MB registered HRA brain/spinal asset; its own failure boundary preserves the skin and region buttons if internal loading fails. All mesh/source hashes are checked. The full body can rotate through 360 degrees. `lib/intervention-view.ts` supplies concise display labels/action summaries derived from existing curated assertions and original evidence links; it adds no graph relationships or regulatory claims.

The intervention panel is always in the normal workspace viewport, including the compact 540×680 preview. On narrow screens, anatomy and evidence split the available height and the panel scrolls independently. Anatomy can expand, temporarily making the evidence panel inert; explicit controls restore it. Region/device/tab/year changes reset panel scroll. Selecting a region shows its interventions; clicking a component's anatomical link retains the selected device. Direct sources accompany list entries, device summaries and component relationships. Historical cutoffs appear in the intervention panel with a reset action.

## Intervention annotations

`lib/annotations.ts` selects one accepted, localized relationship per currently visible family, preferring intended target/action then interface roles within the current regional filter. `AnnotationProjection.tsx` is a read-only R3F bridge: it projects source-region display locators through the live camera and reports changed rounded screen coordinates. `InterventionLabels.tsx` renders accessible DOM buttons and source links plus a pointer-transparent SVG leader layer outside the WebGL renderer. Resizing and orbiting update the projected endpoints; label columns page by available height. The overlay uses the same filtered families/year as the intervention panel.

Selection updates the existing device state without changing the regional collection. Expanded anatomy retains its view and shows a compact source-linked summary. Region-label mode and text discovery remain available. No coordinates are added to biomedical graph records, briefs or mapping confidence. No outcome claims or device coordinates are generated by the display layer.

## Whole-body source catalogue and dense map

The bounded acquisition scope adds original PMA approvals and cross-panel submission samples. `ingestion/build_catalogue.py` generates `data/catalogue.json` deterministically from the exported snapshot and explicit phrase rules in `data/body-regions.json`. Each application entry retains its own identity, exact source-field span, matched text, source hash and rule version. It has only `indication_context` / Provisional relationships. No product-family deduplication, inferred modality, laterality, physical placement or trial/publication linkage is generated. The curated ten entries remain in a separate source file.

`InterventionConstellation.tsx` groups primary regional annotations and arranges one record glyph per entry on a diagram spiral around a reference-region anchor. Glyph offsets are UI layout, never anatomy. Region label columns declutter with viewport height; the native selector exposes all regions. Individual dots support mouse inspection; region/list controls provide keyboard/touch equivalents. Camera projection is shared with named callouts. Source context is amber, reviewed relationships cyan. Filtering, selection, sources, history and exports use the same IDs. Lists paginate in memory (60 interventions / 100 source records initially); ID/mapping/date/search indexes avoid repeated full graph scans.

`WholeBodyOrgans.tsx` independently loads 30.56 MB of registered organs and skeletal reference extracted from the same HRA united male source as skin and brain/spinal cord. The 227 original meshes include 1,061,132 indexed triangles. Shared centering/uniform scale preserve the source frame. Exact geometry is available only for a subset of regions; other endpoints are explicitly coarse navigation locators. Female-only regions have no locators in this male reference. Skin, nervous geometry and organs have independent failure boundaries. Rendering is demand-based with capped DPR; GPU/physical-phone performance remains an empirical limit.

## Static website delivery

`scripts/export-static.mjs` builds a separate `/atlas` export in an isolated temporary directory, excluding server API routes. Only explicit public snapshot files and manifest-listed, hash-verified source responses are copied. `lib/deployment.ts` prefixes geometry and source URLs. Hosted Markdown download uses the same deterministic brief generator through a data URL; standalone API behavior is preserved. The portfolio rewrites only `/atlas` to its static entry point, and uses native links between application runtimes. The homepage imports no atlas code or geometry.
