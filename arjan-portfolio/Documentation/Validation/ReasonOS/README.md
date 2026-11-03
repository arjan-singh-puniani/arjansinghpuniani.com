# Vector ECG / ReasonOS laboratory

The primary workspace digitally traces the contributor’s already-public recording
B photograph. Twelve representative beats retain source-pixel coordinates and
estimated local paper-grid calibration. A shared cursor drives the digital trace,
lead voltage, compatible frontal vector and live arithmetic. Original pixels,
source overlays, image calipers and device-report transcriptions are under the
bottom provenance disclosure. The public A/B labels reverse the
original archive filenames; `src/lib/reasonos/recordings.ts` records that crosswalk
and both the original-image and public-image SHA-256 digests. Original header
images remain outside the public assets.

Image rulers and markers are SVG overlays. Calipers retain original image
coordinates through zoom and layout changes. A manually confirmed local grid span
sets the paper direction and scale. Paper speed and gain are pinned to the recorded
metadata, rather than freely changing the acquisition settings. The engine
recomputes elapsed time from raw pixels and the grid reference. An explicit pixel
bound includes uncertainty in interval placement, grid scale, and grid direction.
Changing the source or calibration makes older measurements stale for new work.

The optional measurement workbench opens with guided interpretation. Eight method steps cover scale/rate, rhythm, axis, intervals, morphology, ST–T, paired comparison, and synthesis. Learners pin source viewports, answer a method question, write an observation, and commit confidence before feedback. Step changes preserve drafts. The exported worksheet retains committed attempts, exact source digests, viewport bounds, visible marker coordinates, measurement dependencies, and kernel evidence events. Method-question matches are not diagnostic adjudication or a competency grade. The calculations panel remains independently accessible.

The QT panel starts with the recorded device rate and QT. RR is explicitly derived
from the reported rate, not presented as an image-measured RR. After both RR and QT
are saved from the image under the current calibration, the visitor can select
those admitted measurements instead. Printed report values remain separately typed
as machine-derived evidence. The photograph is a reference source; independent
manual calipers are learner-derived. All actual-recording events have no synthetic
model version, and source dependencies remain in the SHA-256 journal.

The vector lesson is a separate, collapsed explanation. Its generated P/QRS/T
source, geometric projection, and circuit-free calculation do not reprocess the
recorded image or supply the recording’s measurement values. The paired source
images remain independently viewable below.

## Digital explanation and connected source scene

The default `DigitalECGScene` uses no analytical PQRST waveform template. The
author-guided centreline extractor in `tools/reasonos/digitize-recording.py` reads
the released source pixels, verifies their digest and writes raw source coordinates
with every point in `public/ecg-digitized/recording-b.json`. Its fixed reciprocal
grid vectors are Fourier pitch/orientation estimates for each print column; this
is a local affine approximation, not perspective correction. The paired audit
image overlays every extracted point on the source. Faint ink is guide-assisted.
Run the script with Python, NumPy and Pillow to reproduce the released JSON.
The browser verifies that file's SHA-256 before parsing and validates all leads,
source bounds, times, landmarks and grid transforms. Five independent tests check
source-coordinate calibration, interpolation, invalid data and electrode algebra.

This is illustrative image-derived data, not native acquisition samples. Leads
are separately phase aligned, not asserted simultaneous. For a limb lead with
field l and voltage V, the displayed compatible vector is
`d = V*l/|l|² + q*n`, where n is perpendicular to l. Changing q leaves `l·d = V`.
This demonstrates the non-unique inverse of a single-lead projection; it does not
reconstruct the patient's instantaneous heart vector. Chest leads display their
own traced voltage and electrode definition without a fabricated frontal vector.
Digital interval fiducials are author annotations, not clinical evidence admitted
by ReasonOS. Interpolation adds no acquisition precision.

The original `ECGConnections` remains nested under provenance: a shared recording,
electrical event, lead, photo cursor, local ruler and interval selection. The previous worksheet and reference cases remain in a collapsed practice workbench. No extra quiz is required to inspect the visual explanation.

The anatomical drawing is schematic. P/QRS/T mean frontal axes come directly from the device report. Unit directions and the six limb-lead projections reuse the existing equilateral lead fields, including the augmented-lead scale. They are dimensionless geometric predictions, not reconstructed instantaneous heart vectors, measured millivolts, or an inferred waveform. Exact electrode definitions are separate from the idealized spatial model. Chest leads show their original trace, reference equation, and placement, without deriving a voltage from a frontal angle. Displayed decimals use approximation signs.

The photo scan traverses authored feature locators in one actual lead-II beat. The locations are proposals, not automatic or adjudicated fiducials. PR, QRS, QT and RR calipers retain source pixels. Time is calculated by projecting the raw endpoint difference along the local ruler and applying the paper scale/speed. RR additionally produces a rate calculation. The tilted caliper lines and source-point dots visualize that projection; grabbing a handle preserves the endpoint offset rather than relocating it to the handle. Numeric inputs provide equivalent keyboard access. Source changes and point/ruler/kind changes prevent reuse of a mismatched saved measurement.

The new connected path uses the existing kernel and ECG extension unchanged. Confirmed source measurements are typed by interval kind. Only saved QRS evidence can support the selected-lead-II below-120-ms statement, and the full stated placement bound must pass. The explicit broader normal-ECG action is vetoed because this workflow has no supporting clinical rule. Both accepted and rejected events replay and export. This demonstrates a bounded workflow, not general semantic clinical validation. `public/reasonos/CLINICAL_EVALUATION.md` states the demonstrated capabilities and a concrete comparative-reader evaluation protocol; no clinical study or educator endorsement is claimed.

## Native reference practice

Four anonymous PTB-XL 1.0.3 recordings are bundled unchanged under CC BY 4.0: 00010 (NORM/SR), 08215 (AFIB), 03155 (CRBBB/SR), and 00618 (CLBBB/SR). Selected metadata records human validation, non-autogenerated initial reports, and folds 9/10. Zero-valued SCP likelihoods mean unspecified likelihood, not absence of the annotated statement. Demographic fields and original report text are not copied. The source files, annotations, calibration, licenses, citations, and SHA-256 digests are in `public/ecg-reference/ptb-xl-1.0.3/`. All eight original WFDB file digests were compared with the publisher checksum list.

The decoder checks 12-channel, 500 Hz, 5000-sample, little-endian format-16 records, each channel calibration and checksum, and the complete byte length. The browser also verifies SHA-256 for both header and signal before plotting. Native voltage is `(ADC - baseline) / gain` mV. Calipers select integer samples; elapsed time is the sample difference divided by 500 Hz, with 2 ms sample resolution. No interpolation, denoising, signal reconstruction, or automatic fiducial detection is applied.

All twelve lead panels show the same selectable 2.5-second window. The long lead-II strip shows all ten seconds and the selected window. Grid geometry uses 4 SVG units/mm and 100 units/s (25 mm/s). Case 4 deliberately uses 5 mm/mV; the others use 10 mm/mV. The displayed gain labels and voltage scaling agree, with no waveform clipping in these sources. Responsive scaling changes physical screen dimensions, not grid ratios or measured voltages.

Practice requires two distinct lead pins, a chosen pattern, written reasoning, and pre-feedback confidence before revealing the dataset annotation. Feedback links interpretation criteria to lead-specific morphology. Dataset-label agreement is the scoring scope; it is not an independently reviewed answer key for every finding. Attempts export as JSON and remain in memory during the session.

The newly supplied original PDF was inspected read-only. Its SHA-256 is `dcc8c289e42650218b44486c175cdd5b9474e43684723cbe3c7f4c29368c4b45`, identical to the original paired PDF in the supplied archive. It contains photographs rather than sampled ECG voltages. Paper speed and gain were visually confirmed. Original PDF headers and newly extracted private images are not published. Existing de-identified waveform assets are unchanged.

## Source carried forward

The supplied `EKG Vector.zip` contains the original ReasonOS kernel 0.3.0 and ECG
plugin 0.5.0. Their browser modules and alternative-path scorer are bundled in
`src/lib/reasonos/`. `source-provenance.json` records every original archive path,
original SHA-256 digest, bundled digest, and mechanical import adaptation. The
browser does not include the archive's corporate records, unredacted recording headers,
Node persistence, HMAC checkpoints, or third-party dependencies.

The adapter uses the original immutable store, typed actors, structural and
domain constraints, canonical SHA-256 journal, and projector. The laboratory adds
a source-bound calibration and duration rule. Replay checks the supplied journal,
reruns the actual kernel and plugin, and compares reconstructed events and states.
Changing a rejected event is also detected. Journal timestamps are deterministic
logical ticks, not acquisition times. A hash chain is not an authenticated signature.

The original path catalog labels its reference paths as candidates with zero
expert traces. The interface preserves that status. Path coverage measures selected
features against one coherent path; it is not a diagnostic probability.

## Model and units

- `d(t) = [x(t), y(t)]` is a scaled frontal signal in mV, with patient-left and
  inferior positive axes. It is not a measured physical dipole moment.
- P/Q/R/S/T components are finite-support squared-sine pulses. Their endpoints
  are prescribed source parameters; the application does not detect fiducials
  from clinical waveforms. Plotting samples the analytic model every 2 ms.
- Electrode gauge: `RA + LA + LL = 0`. Limb voltages are calculated from these
  potentials. In the ideal equilateral geometry, the six lead fields are
  `[1,0]`, `[1/2,sqrt(3)/2]`, `[-1/2,sqrt(3)/2]`,
  `[-3/4,-sqrt(3)/4]`, `[3/4,-sqrt(3)/4]`, and `[0,sqrt(3)/2]`.
- Consequently, `I + III = II`, and the augmented leads sum to zero. These
  algebraic relations are distinct from the ideal spatial-field approximation.
  Six limb leads contain two independent signals. V1–V6 are not synthesized.
- SVG coordinates use 12 units/mm. At paper speed `s` mm/s, elapsed time is
  `1000 * deltaX / (12*s)` ms. Gain is mm/mV. Resizing uses the inverse SVG
  screen matrix and preserves the measurement. SVG display coordinates are
  rounded to six decimals for consistent server/browser rendering; model
  calculations retain full precision.
- Mean QRS axis integrates the signed model signal over the prescribed QRS
  window. Ideal augmented scaling is retained:
  `atan2(2*area(aVF)/sqrt(3), area(I))`. Zero signal has no defined axis.
- QT correction uses RR in seconds. Bazett and Fridericia are displayed as
  mathematical comparisons, without patient-specific normality classification.
- A per-endpoint bound of ±epsilon gives a worst-case duration bound of
  ±2epsilon, not a confidence interval. Admission requires current-source
  calibration, an admitted QRS measurement, ordered endpoints, and the entire
  duration bound strictly below 120 ms. Source or calibration changes retain
  old evidence while preventing its reuse for the new source.

Scientific references and their scope are linked in the page.

## Reproducible checks

From `arjan-portfolio`:

```sh
npm run typecheck
npm run lint -- --ignore-pattern 'public/hospitalsim/vendor/**'
npm run test:coverage
npm run build
REASONOS_BASE_URL=http://127.0.0.1:8870 node tools/reasonos/digital-qa.mjs
REASONOS_BASE_URL=http://127.0.0.1:8870 node tools/reasonos/connections-qa.mjs
REASONOS_BASE_URL=http://127.0.0.1:8870 node tools/reasonos/study-qa.mjs
REASONOS_BASE_URL=http://127.0.0.1:8870 node tools/reasonos/recorded-qa.mjs
REASONOS_BASE_URL=http://127.0.0.1:8870 node tools/reasonos/browser-qa.mjs
```

The hospital simulator's existing third-party vendor ESLint failures are outside
this release; that directory is excluded from the lint command above. Existing
warnings elsewhere are unchanged.

The unit suite has 260 passing tests across 32 files. The eight ReasonOS test files
contain 54 tests covering independent electrode/lead identities, axis scaling,
calibration, uncertainty, source changes, real-plugin admission, source SHA-256
compatibility with Node crypto, immutability, replay, tamper rejection, and
alternative evidence paths. The repository-wide coverage percentage includes
vendored engines and is not a measure of clinical validation.

`browser-results.json` and browser screenshots record Chromium, WebKit, and Firefox
checks. Each browser exercises all three direction examples and independently recomputes 30 lead/time projections, exercises
calibration, source changes, uncertainty, replay, altered records, revision,
export, alternative paths, pointer calipers, viewport resizing, playback, and
reduced motion. Axe checks cover the laboratory at desktop and 390px phone sizes.
Phone layouts are emulated, not physical-device tests. This release has no clinical
validation, patient ingestion, or diagnostic deployment.

`recorded-browser-results.json` verifies actual-image digests, source-coordinate
calipers, grid confirmation, source-bound admission, manual RR/QT dependencies,
report provenance, replay, responsive image transforms, and scoped accessibility.
The generated vector-model checks run only after opening the separate explanation.

`study-browser-results.json` records the guided method attempts, source pins across A/B, retained step drafts, keyboard tab switching, worksheet export, four native reference cases, annotation gating, sample-index calipers including pointer dragging, practice export, and scoped Axe checks in Chromium, WebKit, and Firefox. These are software and source-integrity checks. No medical educator has yet reviewed this curriculum or measured learning outcomes; this release is not a complete medical-school ECG course.
