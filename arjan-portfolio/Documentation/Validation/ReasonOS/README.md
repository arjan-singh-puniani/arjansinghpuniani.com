# Vector ECG / ReasonOS laboratory

The primary workspace uses the contributor’s paired ECG photographs. It displays
the original waveform pixels, the device-report transcriptions, and live
calculations from explicitly selected inputs. The public A/B labels reverse the
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
REASONOS_BASE_URL=http://127.0.0.1:8870 node tools/reasonos/recorded-qa.mjs
REASONOS_BASE_URL=http://127.0.0.1:8870 node tools/reasonos/browser-qa.mjs
```

The hospital simulator's existing third-party vendor ESLint failures are outside
this release; that directory is excluded from the lint command above. Existing
warnings elsewhere are unchanged.

The unit suite has 230 passing tests across 27 files. The five ReasonOS test files
contain 35 tests covering independent electrode/lead identities, axis scaling,
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
