# ReasonOS ECG evidence workspace

The primary case-study experience and `/work/vector-ekg-reasonos/workspace` share one browser component. The earlier paired study, annotation practice and idealized vector laboratory remain available through disclosures.

## Run and verify

```sh
npm ci
npm run typecheck
npm test
npm run build
npm start -- --hostname 127.0.0.1 --port 3226
# In another terminal:
REASONOS_BASE_URL=http://127.0.0.1:3226 node tools/reasonos/workspace-qa.mjs
REASONOS_BASE_URL=http://127.0.0.1:3226 node tools/reasonos/study-qa.mjs
```

The workspace harness creates a temporary two-page PDF from the public PTB-XL reference renderer. It tests the PDF/image, CSV and WFDB paths without using a private recording. Screenshots contain that public reference material only. Automated browser viewports are emulation, not physical-device testing.

## Recordings and format contract

- Default: actual PTB-XL 1.0.3 samples from four existing repository records. Both source files are checked against the existing SHA-256 provenance manifest before decoding. Dataset annotation is not used to generate a diagnosis in this workspace.
- WFDB: one single-segment, multiplexed, little-endian signed format-16 file; 1–12 channels; explicit gain, baseline/ADC zero, mV or µV units, initial sample, checksum and lead name. Missing samples, skew, byte offsets, packed/compressed formats and multiple signal files are rejected. Checksums and first samples must match the header. This is a declared subset, not general hospital compatibility.
- CSV: `time_ms,I_mV,II_mV` (1–12 distinct lead columns). Numeric, finite values and a uniform positive interval are required. Timestamp offsets are normalized to recording-relative time. Gaps and absent values are rejected, not interpolated. Maximum total signal values: 2 million. Sample intervals: 0.1–1000 ms.
- PDF: at most 100 pages; PNG/JPEG/WebP images: at most 20 megapixels. Maximum file size 25 MB. PDF pages are rasterized locally at a bounded resolution (longest edge ≤2200 px; at most 8 million pixels). The pixels are the source for all image-based measurements. Text reports are not treated as ground-truth waveform measurements.
- DICOM, SCP-ECG, HL7 aECG and vendor XML import are **not implemented**.

## Measurements and uncertainty

Digital voltage is `(ADC − baseline) / gain`, converted to mV. No filtering, smoothing, beat synthesis, feature detection or rhythm classification is performed. Every visible sample within the displayed window is rendered; values outside the vertical view can extend beyond its clipping boundary. Display gain is adjustable and has no effect on numeric measurements. Numeric drawing coordinates are bounded to prevent overflow; underlying samples remain unchanged.

For digital time intervals, user endpoints are snapped to sample indices. Duration is `(indexB − indexA) / sampleRate`. The displayed ±1-sample interval bound covers endpoint quantization only. Manual boundary selection, uncertainty in sample-clock calibration and acquisition effects are additional; the bound is not a clinical confidence interval. Exports retain raw source-view endpoints, time-window origin/span, selected lead, sample indices and sampling calibration.

Image time intervals use the existing tested `imageInterval` function. The user selects grid points `gA,gB`, their separation `L` in mm, printed speed `v` in mm/s, and an endpoint-placement bound in pixels. With `u = (gB−gA)/|gB−gA|`, duration is `1000 × |(B−A)·u| × L / (|gB−gA| × v)` ms. Source rotation is accounted for. The existing bound includes grid endpoint placement, scale and axis-angle uncertainty. Perspective, paper deformation, rasterization and ambiguous physiological boundaries are not included. Grid span and speed must be explicitly confirmed; defaults are not asserted to be observed acquisition settings. Each PDF page has its own source identity and calibration.

The user supplies the interval category and image lead label. Their choices are annotations, not automatic identification.

In workspace plugin 1.1.0, the kernel recomputes durations, bounds and sample indices from the saved endpoints and the registered source. Digital endpoints use the same recorded window-origin sample plus rounded offsets for readout, storage and export. Claims must list every actual measurement input. Starter guides cannot be saved until both endpoints are deliberately selected; image measurements also require confirmation of the lead and common time scale. SHA-256 identities for local CSV and WFDB headers cover original file bytes, including a UTF-8 BOM, rather than normalized text. Invalid UTF-8 and non-finite calibrated voltages are rejected.

## ReasonOS evidence behavior

The workspace uses the existing `InMemoryTraceStore`, kernel constraints, immutable states, provenance envelopes and SHA-256 hash chain. Its small `ecg-workspace` plugin checks source identity, measurement structure and evidence dependencies. It does not apply diagnostic rules or claim independent clinical review.

Saving a proposed interpretation requires a saved measurement. Selecting an entry restores its lead, source endpoints, time window or image calibration. A measurement revision creates another state and retains the original. Claims citing the revised state are flagged for review. Revising or reviewing an observation does not retroactively alter its previous provenance.

JSON exports contain the actual trace, including rejected attempts and input-state references. Text summaries expose retained evidence and review flags. Original files, rendered images and digital sample arrays are excluded. User-written notes are included and can themselves contain private information. This is an educational worksheet, not a clinical report or EHR integration.

## Privacy and resources

Local files are read with browser APIs. The implementation contains no file-upload endpoint, form submission, health-information collection, cloud OCR, model API or local-storage persistence. Files and written text are not added to URLs or analytics events. The surrounding portfolio can request its usual page assets/analytics; the local QA harness asserts zero network request bodies while exercising imported sources and notes. This check is not a general security or regulatory audit.

Worksheets are held in memory for the tab session, keyed by the complete digital source identity or PDF hash and page. Reopening the same source in that session restores its journal. Closing/reloading the tab loses that session unless exported. A failed import leaves the previous recording and journal available.

Mozilla PDF.js is dynamically imported for PDFs; its matching worker is served locally. Updating `pdfjs-dist` requires copying `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` to `public/ecg-workspace/pdf.worker.min.mjs` and retaining the license. PDF workers are destroyed on replacement/unmount and after failed loads. Reference imports and PDF rendering use generation checks so late results cannot replace newer requests.

## Primary sources and attribution

- [PTB-XL 1.0.3 dataset](https://physionet.org/content/ptb-xl/1.0.3/), CC BY 4.0; existing source files and provenance manifest preserved. Wagner et al., *Scientific Data* 7,154 (2020), [doi:10.1038/s41597-020-0495-6](https://doi.org/10.1038/s41597-020-0495-6).
- [WFDB header specification](https://wfdb.io/spec/header-files.html) and [signal representation](https://wfdb.io/spec/signal-files.html): file layout, gain, baseline and checksums.
- [Mozilla PDF.js rendering API examples](https://mozilla.github.io/pdf.js/examples/), Apache 2.0. License copied to `public/ecg-workspace/PDFjs-LICENSE.txt`.
- [DICOM 12-lead ECG specification](https://dicom.nema.org/medical/Dicom/2022a/output/chtml/part03/sect_A.34.3.3.html): documented future integration format only; not a supported importer.

## Remaining validation limits

No physical phone testing, manual screen-reader evaluation, hospital-system connection, clinical diagnostic validation or admissions-outcome validation. Automated accessibility tests cover inspected states and do not establish complete accessibility. User-provided medical files remain private and are excluded from source, screenshot evidence, commits and release artifacts.

## Independent review

`/reasonos/review/index.html` supplies a clinician protocol, two uncoached usability tasks, a physical-phone checklist and an anonymous response template. Public fixtures are generated by `tools/reasonos/create-review-fixtures.py` from digest-verified PTB-XL record 00010. The PDF is a new 300 × 185 mm rendering with an exact 1 mm grid, 25 mm/s horizontal scale and 5 mm/mV voltage scale; it is not an original hospital export. The CSV contains the matching recorded samples. Responses are not collected by the site. The public acceptance record must remain pending until actual human/device results are received; agent reviews do not satisfy that gate.
