# Rendered review and release checks

## Pass 1 — calculations and evidence behavior

The first actual desktop render exposed a disabled digital save button. Its bounds check was incorrectly applying an image-only grid to a digital strip. The check now validates only the active source's coordinates. Browser assertions exercise a manually chosen 800 ms interval, its source-linked claim, a 900 ms revision, retained original evidence and the resulting review flag.

A subsequent mobile render exposed a time-span selector that displayed 2.5 s while a restored full-recording view covered 9.998 s. The worksheet now retains the selected display-window setting separately from its duration clipped to the recording. The browser harness checks that restored view and selector agree. Sample indices are retained in digital exports.

Unit checks compare decoded values against original WFDB bytes for all four reference records, test checksum/initial-sample rejection, baseline and µV conversion, CSV timing and missing-data rejection, source identity, rejected claims, revision lineage and kernel hash-chain integrity.

## Pass 2 — presentation and interaction

Actual desktop, tablet and phone renders were inspected. The initial phone layout gave most of the viewport to a horizontally scrolling twelve-lead sheet. The overview now collapses on narrow screens, opening with a 2.5-second focused trace and keeping the larger sheet available. The default desktop view retains the full overview and ten-second strip. Lead panels support click and keyboard selection; caliper endpoints and calibration have numeric alternatives to pointer placement. Overlays can be hidden while the original source remains visible.

The newer production digital-heart/vector explanation and clinical-evaluation discussion were retained during integration. They, the paired interpretation study and reference exercises are accessible through purposeful disclosures under the main workspace. The standalone route provides a full-screen workspace.

## Pass 3 — accessibility, failures and production behavior

An automated review found nested interactive controls inside a figure exposed as a single image. The overview is now an accessible group containing its lead controls. Full-screen mode also removes the covered portfolio header/footer from keyboard navigation and restores them on exit.

The final production-build harness passes Chromium 153.0.8010.12, Firefox 153.0 and WebKit 26.6 at 1440×1100, 768×1024 and 390×844, plus a PDF-overlay state: 12 inspected Axe scans with no violations. It verifies measurement/reasoning/revision/export, overlay visibility, PDF page switching and calibration, PNG, CSV and WFDB import, malformed-file recovery, no page-level horizontal overflow and no runtime errors. No request bodies were emitted during the local file/notes workflow. Reduced motion is enabled in these checks; the workspace has no automatic signal playback.

The original guided study and all four reference exercises also pass in all three browsers, including their exports and accessibility assertions. The newer digital heart/vector scene's interaction checks pass in the same three engines. The equation locator in the preserved study harness was updated to wait for a visible equation after opening its new parent disclosure; diagnostic checks established that the scene contains both visible and intentionally hidden equation instances.

A timed-out PDF check was rerun against a fresh server started only after the production build finished. All supported imports passed. The supplied private PDF was also opened locally in Chromium without network upload or medical-content capture; the private file is excluded from the repository and evidence screenshots. All public PDF screenshots derive from a temporary rendering of the public PTB-XL reference case.

## Final measurements

- Full suite after integration: 282 tests across 33 files pass; TypeScript check and production build pass (36 generated pages).
- Next build first-load JavaScript estimate: workspace 129 kB; integrated case study 213 kB including its preserved teaching models.
- Local Chromium opening: 20 resource entries, 394,151 encoded resource bytes; first contentful paint 96 ms. These are local measurements, not internet or phone-load estimates.
- Thirty input-to-two-animation-frame observations: median 33.3 ms, p95/max 34 ms. This includes two refresh callbacks and is not GPU execution timing.
- PDF worker: 1,271,915 raw bytes / 379,556 gzip bytes, loaded on demand. Its bytes match pinned PDF.js 6.5.438. License retained.

See `browser-results.json`, `performance.json`, `asset-budget.json` and the adjacent actual browser screenshots. Performance results identify their environment and limitations.

No physical-phone, manual screen-reader, hospital integration, diagnostic validation or admissions-outcome testing was performed. Automated checks and this implementation review are not independent expert review.
