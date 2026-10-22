# Roadmap grounded in implementation

## Delivered local vertical slice

Bounded FDA clearance/classification/PMA data, separately identified De Novo rows, original regulatory citations, SQLite ingestion jobs and immutable artifacts, HRA brain selection, curated component anatomy, Intervention Stack, Time Machine, Evidence X-Ray, regional coverage layers, trials/PubMed/RePORTER records, source-grounded research questions, deterministic retrieval, and Markdown/print brief workflows.

## Highest priority before broad release

1. Independent adjudication: collect 100+ source-supported relationships across external, implanted, multi-component, software-only and ambiguous cases; separate training and evaluation; report precision/abstention with defensible intervals. Do not enable auto-acceptance first.
2. Complete regulatory histories for curated families: supplements, original De Novo orders, recalls and safety notices. Resolve original NeuroStar API coverage. Preserve historical applicant names separately from current ownership.
3. Expand curated evidence to 100–300 useful entries, rather than inflate the collection with unreviewed submission counts. Complete cochlear component review.
4. Add a genuinely normalized persisted biomedical graph, explicit component entities, investigator/organization identifiers, relationship evidence and curation history. Move to PostgreSQL when concurrency requires it.
5. Implement controlled bulk backfill, incremental source watermarks, resumable page checkpoints, scheduler/worker deployment, monitoring/alerts and retention. Current jobs are bounded single-response units.
6. Add licensed whole-body and peripheral anatomy with tested reference frames, geometry coverage and visual validation. Never invent nerve paths or implanted device coordinates.
7. Add authenticated optional private investigations with clear relevance criteria and user-owned notes; keep owner-specific materials out of public builds.
8. Run researcher task studies, physical mobile and Safari/Firefox QA, slow-network/low-GPU measurements, deployment rehearsal, and security assessment.

## Deferred pending a measured need

Vector/graph databases, language-model summarization, OpenAlex/Crossref enrichment, patent linking, automated collaboration recommendations, and full biomedical-specialty coverage. Each requires evidence of user value, rights review, and reliable provenance first.

The local preview now includes 2,490 source records, 650 provisional whole-body application entries across 39 regions, ten curated neurotechnology entries, dense regional record glyphs, native region selection, direct sources and cited exports. Licensed registered organ/skeletal geometry is included, with male-reference and coverage limitations. This expansion does not satisfy independent mapping validation or establish current product labeling.

Next curation work should adjudicate the 150-row region-balanced context queue, promote only original-source-supported relationships into typed physical roles, complete cochlear evidence, and add selected source-backed interventions outside neurology. Correctness and current safety histories remain more valuable than a larger unreviewed record count.
