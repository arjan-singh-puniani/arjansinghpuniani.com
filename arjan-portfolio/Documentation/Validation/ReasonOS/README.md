# Vector ECG / ReasonOS laboratory

This release connects one analytic frontal signal model to the electrode diagram,
six limb leads, calibrated strip, calipers, numerical derivations, and recorded
reasoning. The laboratory is independent of the paired source-recording images.

## Source carried forward

The supplied `EKG Vector.zip` contains the original ReasonOS kernel 0.3.0 and ECG
plugin 0.5.0. Their browser modules and alternative-path scorer are bundled in
`src/lib/reasonos/`. `source-provenance.json` records every original archive path,
original SHA-256 digest, bundled digest, and mechanical import adaptation. The
browser does not include the archive's corporate records, patient source files,
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
REASONOS_BASE_URL=http://127.0.0.1:8870 node tools/reasonos/browser-qa.mjs
```

The hospital simulator's existing third-party vendor ESLint failures are outside
this release; that directory is excluded from the lint command above. Existing
warnings elsewhere are unchanged.

The unit suite has 222 passing tests across 26 files. The four ReasonOS test files
contain 27 tests covering independent electrode/lead identities, axis scaling,
calibration, uncertainty, source changes, real-plugin admission, source SHA-256
compatibility with Node crypto, immutability, replay, tamper rejection, and
alternative evidence paths. The repository-wide coverage percentage includes
vendored engines and is not a measure of clinical validation.

`browser-results.json` and browser screenshots record Chromium, WebKit, and Firefox
checks. Each browser independently recomputes 30 lead/time projections, exercises
calibration, source changes, uncertainty, replay, altered records, revision,
export, alternative paths, pointer calipers, viewport resizing, playback, and
reduced motion. Axe checks cover the laboratory at desktop and 390px phone sizes.
Phone layouts are emulated, not physical-device tests. This release has no clinical
validation, patient ingestion, or diagnostic deployment.
