# Reliability report

## Implemented and checked

The source pipeline uses SQLite jobs and immutable SHA-256 JSON responses. Writes are idempotent by source record identity; changed versions remain in record_versions. The entire response validates before any record change. Sources cannot delete previous rows through an empty, partial, or failing update. Each committed job stores its artifact hash as checkpoint. Expired five-minute leases resume after an interrupted process. Transient errors receive at most three attempts with bounded backoff; schema errors fail without repeated retry.

Actual checks include: duplicate input, changed payload version, malformed identifier/date, missing required fields, partially valid batch, empty provider response, mocked 503 outage, retry exhaustion, isolated schema failure, source URL allowlist, and expired worker recovery. These are real executed unit checks using explicitly synthetic test fixtures, not invented source records in the UI.

The app serves its cached export without contacting providers. Evidence library and search remain available if a provider is offline. Source hash APIs return controlled 404/503 responses. A WebGL/asset failure retains text/index discovery. No user must wait for a corpus backfill to navigate the current data.

## Observed provider issues

- Python's local CA bundle was missing. Corrected to use the available OS trust store with certificate verification enabled; never disabled TLS verification.
- Original NeuroStar K061053 was unavailable through the openFDA query (HTTP 404). The failed job is visible in coverage; a separately identified K130233 labeling-change record is indexed. A successful record does not erase the failed source inquiry.
- FDA source PDF downloads encountered an access barrier; HTML was rejected rather than stored as a PDF. Representative originals were inspectable through web retrieval. No repeated high-volume scraping attempted.
- PubMed relevance searches included unrelated results. They are preserved as raw source results without automatic device-family associations.

## Performance and reproduction

Playwright's production-server checks capture navigation, first paint, GLB resource timing/size, and available Chrome heap measurements for desktop and emulated mobile. Metrics are local machine observations, not network-throttled or physical-phone benchmarks. See validation/browser-performance.json for measured final values. Anatomy is loaded lazily, rendered on demand, and capped to device pixel ratio 1.5. Rendering runs on demand. Optional history playback advances the dated filter; reduced-motion styling disables transitions. Record glyphs are diagrammed around regional anchors and explicitly distinguished from implant sites. The human surface is 5.93 MB; registered brain/spinal geometry loads separately (12.51 MB). The additional detailed brain asset loads only when selected. Each geometry is rendered on demand; internal-asset failure preserves body selection.

Setup uses npm ci, a pinned lockfile, Node 22, Python standard library, checked-in authentic snapshots, and a local source asset. `restore` reconstructs SQLite offline and validates hashes. A full clean OS/container deployment has not been executed. A clean isolated installation check is recorded separately when feasible; it does not imply platform-wide portability.

## Operational limitations

This is a bounded single-machine acquisition plan. It does not implement historical bulk backfill, paginated source watermarks, change/deletion reconciliation, distributed locks, operational alerting, durable hosted object storage, queue scheduler, or current recall surveillance. A checkpoint resumes a completed response unit, not an arbitrary page within a provider corpus. The UI uses a build-time export; refresh/export/rebuild is required for new data.

A public deployment needs workload limits, process supervision, backups, monitoring, auth for curation, source-specific retention/rights policy, and a production recovery exercise. Do not run --force as an automatic high-frequency job.

Intervention labels are DOM controls outside the WebGL renderer. A small camera-projection bridge updates rounded screen coordinates only when they change. Leader lines ignore pointer events so the central anatomy remains rotatable. The current label set is bounded by the same filtered curated collection; compact views page it. A missing WebGL/asset still preserves text discovery, and no anatomical label is invented for unknown placement. The dense source map renders hundreds of bounded cached application glyphs; named callouts page by viewport height.

## Whole-body expansion recovery and cost

The expanded snapshot has 52 completed jobs and three retained failures. One is the original NeuroStar inquiry; two are superseded whole-body queries: unquoted OR (HTTP 500), and a mixed legacy-N/canonical-P older PMA batch (schema rejection). Quoted OR and a canonical `pma_number:P*` replacement succeeded. This demonstrates failure isolation and explicit recovery, not current provider-wide health or removal of the failure history.

The 650-entry contextual catalogue is generated offline, idempotently, from versioned sources. It can be rebuilt without provider requests. Entries are not merged by name. The full source library and region lists paginate initial DOM output. Record, mapping, descendant, event and search-text caches reduce repeated scans. The separate organ asset adds 30.56 MB and about one million triangles; first text/surface interaction does not wait for it. Asset failure leaves the other scene layers and source workflow intact. Physical-device memory and slow-network performance remain unverified; local Chrome measurements are in validation artifacts.

Forced refresh now resets only jobs in the selected acquisition scope; a regression check confirms a whole-body refresh does not refetch unrelated completed inquiries.

The website snapshot is static: query/retrieval and brief generation run in the browser, and original evidence is served as immutable hash-named files. The parent site applies the atlas CSP only under `/atlas`; its other routes and security policy remain unchanged. Hosted background ingestion and operational monitoring are not enabled.
