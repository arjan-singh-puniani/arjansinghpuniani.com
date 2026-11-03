# Research Lab 2.0: verified extension and review — 2 November 2026

## Result and scope

Adds `/seizefreeze-lab/research.html` with Prototype Workbench, Organoid Research Workbench, an Experiment Console, recording-method comparison, evidence roadmap and Research Summary. The existing cortical lab and case study link to it. Original cortical numerical/worker/device/anatomy/scene modules are unchanged; source-boundary checks and regression tests retain the prior guarantees. No dependencies, external raster assets, measured datasets, patient records or hardware specifications were added.

The prototype view labels Arduino/Peltier/NeuroSky as user-reported and exact parts/wiring/performance as unverified. Proposed driver, independent thermometry and rejection hardware use distinct generic/dashed geometry. A consumer scalp EEG board is never connected to a claimed organoid readout. No as-built circuit, miniature bench prototype or working hardware loop is invented.

The new model is a separate nonperfused radial sphere, uniform whole-surface coupling to finite well-mixed medium, medium-to-cold contact resistance and finite cold/hot TEC storage with finite rejection to an ideal inert20°C reservoir. It is not the adult perfused column under a new name. Apparatus dimensions and recording gap are illustrative; they do not determine coefficients or establish electrode coupling. No temperature→neural model is included. Synthetic signals are independently generated at500Hz with a recorded seed; broadened impulses and illustrative estimates are not an MEA acquisition specification, biological experiment or seizure diagnosis.

## Implementation and scientific refinement

The complete vertical slice uses an independent module worker: synthetic network→illustrative feature/detector→requested/limited current→thermal response→lagged medium sensor. Eight conditions cover passive baseline, sham, perturbation, recovery, repeated demand, sensor failure, contact and rejection resistance. Sham/baseline are deliberately equivalent passive physics. Visitors can compare with sham, baseline or active reference perturbation while retaining the same raw inputs and seed. Effective scenario multipliers and feedback current remain separate.

One20Hz output clock drives radial colors, temperature curves, current/command traces, heat/storage ledger and fault state. The voltage window uses actual500Hz synthetic samples; raster marks are explicitly100ms occupied-event bins, with source/estimated events distinguished. Population estimates and authored source-event rate share the clock. Neural traces do not improve when cooling activates.

JSON retains model version, all inputs/units, seed, ICs/BCs, numerical diagnostics, arrays, signal provenance, assumptions, comparison and editable hypothesis/predeclared analysis. Re-import discards supplied outputs and reruns validated inputs. Wrong record types/versions and oversized files are rejected. A fractional1.013s record verifies exact final-frame seeking and truthful duration labels. CSV labels every row synthetic; the readable run summary provides model endpoints without the full≈17MB generated JSON per run. The full comparison record contains two runs; it is generated locally, not a downloaded site asset or health-data upload.

## Actual rendered reviews and fixes

- Initial apparatus review: found sphere detail too small at honest scale, excessively white ceramic and an elevated view obscuring the TEC. Preserved all dimensions; adjusted material/light/view and made Section enter an explicitly labeled close-up. Reset returns apparatus overview.
- Multi-mode/radius review: found the radius3 label over the section, acquisition annotation associated ambiguously with the controller, and camera fitting based on the prior mode's aspect. Anchors now follow actual geometry with leaders, offscreen labels hide, and fitting measures the active viewport. Fixed scene height prevents expanded component text from changing projection. Phone section and apparatus renders were inspected again.
- Final access/interaction review: reduced oversized header space; added current-request versus actual-current traces and energy storage/external-input readings; tested all controls, comparison references, three exports, replay, bad import, fractional duration, reduced-motion idle, static reference, worker failure and actual WebGL loss/recreation. Recreated contexts retain numerical time and section state. An on-stage transport mirrors the same clock and frame selection, so thermal field changes can be inspected without scrolling away from the apparatus. Prototype static fallback uses the evidence inspector rather than pretending the organoid SVG depicts reported hardware.

Selected captures are in `research-2/`; equivalent complete captures and first/updated graphics review evidence are preserved in the recovery package. This agent/source review is not independent hardware, admissions or clinical expert validation.

## Verification evidence

- `organoid-check.mjs`: all8 conditions, bounded finite input contracts, exact seeded JSON replay, sensor/command interruptions, independent neural outcomes, passive TEC conduction, equilibrium, signed energy and numerical convergence pass. Maximum energy residual1.5508e-12J versus1e-8J tolerance.
- Analytical Dirichlet sphere eigenmode volume-weighted RMS error:8/16/32 shells →1.0423e-3/2.3513e-4/5.6256e-5K. Coupled time refinement errors decrease3.7335e-5→1.3117e-5K;6/12-shell versus24-shell mean differences decrease1.0986e-3→2.2441e-4K. These are verification differences, not physiological confidence intervals.
- `research-qa.mjs`:8 viewport cases across Chromium/Firefox/WebKit, including320px Chromium;24 automated WCAG scans report zero violations in inspected states. Two deliberate unavailable-WebGL/failed-worker cases pass. Actual context loss/recreation, keyboard, static restore, source-data/temperature agreement, all8conditions, active-reference comparison, exports, exact replay and fractional duration pass.
- Existing browser suite:8 engine/viewport cases and all original scenarios pass. Existing static restoration hash regression, case-study/portfolio integration, accessibility and failure checks pass. Original core source files are preserved byte-for-byte.
- Application tests:223 across26 files, typecheck, scoped lint and production build(35pages) pass on the baseline. After preserving upstream changes through rebase onto3e366553, all241 application tests, typecheck and production build pass; exact logs are in the recovery package.
- Native AppleM2Metal short probes: interaction RAF cadence60.08–60.47Hz across timeline scrubbing, section orbit and prototype orbit at desktop/phone-DPR profiles, with zero idle rendering. Multiple synchronous renderer submissions can occur per frame: these figures are interaction cadence, not presented GPU frames or GPU execution time. Explicit SwiftShader section orbit4.97–8.35Hz, timeline24.24–45.80Hz and prototype38.17–60.44Hz; software retains a static default. Viewport/DPR emulation is not physical-phone testing. Measurement scripts ran without concurrent browser/build workloads.
- Renderer lifecycle review: two create/section/dispose cycles remove all scene DOM, release geometry allocations and confirm lost GL contexts. One internal Three texture diagnostic remains after disposal; it is not described as zero texture count or a live retained context.

## Reproduce

    npm ci
    npm test
    npm run typecheck
    node tools/seizefreeze/organoid-check.mjs
    node tools/seizefreeze/model-check.mjs
    node tools/seizefreeze/sensitivity-check.mjs
    node tools/seizefreeze/anatomy-check.mjs
    node tools/seizefreeze/device-check.mjs
    npm run build
    npm run start -- --hostname 127.0.0.1 --port 3221
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 node tools/seizefreeze/research-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 SEIZEFREEZE_ENGINE=firefox node tools/seizefreeze/research-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 SEIZEFREEZE_ENGINE=webkit node tools/seizefreeze/research-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 node tools/seizefreeze/browser-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 node tools/seizefreeze/regression-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 node tools/seizefreeze/integration-qa.mjs
    SF_QA_URL=http://127.0.0.1:3221/seizefreeze-lab/index.html node tools/seizefreeze/accessibility-qa.mjs
    SEIZEFREEZE_BASE_URL=http://127.0.0.1:3221 node tools/seizefreeze/research-performance.mjs

Run performance alone. Inspect `MODEL.md`, `ORGANOID_MODEL.md`, `DEVICE.md`, `ANATOMY.md`, `PROTOTYPE_EVIDENCE.md`, `RESEARCH_SOURCES.md` and `VALIDATION_PLAN.md` for full parameter, source and evidence boundaries.

## Review rubric and remaining evidence

Scientific integrity, engineering, interaction, access and reliability are evaluated through the explicit tests/disclosures above; all recorded software gates passed. Visual clarity is supported by reviewed apparatus/section/prototype/phone captures and the listed fixes, not by a test count or perfect quality score. Admissions relevance is addressed through a contribution/evidence summary; admissions impact has not been assessed. Prototype identity/calibration, contact/medium characterization, suitable acquisition, biological feasibility, manual screen-reader certification, physical-phone performance and independent clinical review remain unverified. Existing dependency advisories are baseline issues; no new dependency is introduced.

Next evidence: identify hardware and record its assembly; independently characterize an inert thermal article against preregistered predictions with uncertainty; assess the recording chain; seek qualified collaborators to evaluate biological relevance and oversight. The software provides no culturing, seizure-induction, stimulation or living-tissue temperature protocol.
