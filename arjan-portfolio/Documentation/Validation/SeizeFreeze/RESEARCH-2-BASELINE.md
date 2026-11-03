# Research Lab 2.0: baseline, scope and design record — 2 November 2026

## Forensic baseline

Work started from clean isolated branch `codex/seizefreeze-research-lab-20261102`, base `3c99e5fe642e5fc641b702ec614a44c44a16dc57`. Main had advanced after the supplied release `7cfda8d7`, but `git diff 7cfda8d7 HEAD -- public/seizefreeze-lab tools/seizefreeze` was empty before this extension. The anatomical completeness correction, device inspection and 1D cortical solver are therefore retained. Unrelated dirty work in the user's original checkout was not used as a staging area.

Installed the committed package-lock with `npm ci`: 223 tests across 26 files and typecheck passed. Existing model, sensitivity, anatomy and independent device checks passed. Baseline node checks confirmed numerical residual ≤1.585e-12 J, temporal refinement difference0.006558 K, reconstructed-surface spatial refinement difference0.057462 K;104 cortical parcels and exact source target retained;0.3 mm display clearance unchanged. These are existing numerical/geometric guarantees, not physiological or hardware validation. npm reported33 inherited dependency advisories; this extension adds no dependencies and does not run broad unrelated dependency updates.

Captured actual desktop/tablet/phone studio renders, component picking, peel and keyboard behavior, reduced-motion idle, accessibility, a320px layout and separate native/software performance before new navigation was added. Raw baseline captures/report and SHA256 source manifest are retained in the recovery package. The current runtime still uses local Three.js/KaTeX, no remote font or patient dataset.

## Existing scientific inventory

| State / quantity | Equation or role | Units / evidence |
| --- | --- | --- |
|16 tissue-cell temperatures Ti | Ci dTi/dt=sum face conductances + perfusion/metabolism; boundary contact only once | °C; 8mm depth,100mm² area,0.5mm cells; authored assumptions |
|Cold temperature Tc | Cc dTc/dt=Qcontact+Qinsulation−Qc | °C; Cc0.8J/K assumed |
|Hot/package temperature Th | Ch dTh/dt=Qh−Qreject−Qparasitic | °C; Ch6J/K assumed; finite rejection8K/W |
|Sensor Ts | first-order lag of reconstructed surface | °C;0.8s assumed, changed for fault scenario |
|Detection feature | first-order lag of absolute synthetic amplitude | µV; threshold35µV,0.7s assumed; not validated detection |
|Detection hold and latched fault | event timing and demonstration interlock state | s / flag; no certified protection |
|Electrical energy; rejected/interface/external energy | integrate their own signed fluxes with solver step | J; separate bookkeeping quantities |
|Synthetic waveform | authored2.2/3.7Hz teaching waveform with scenario envelope | µV; independent of tissue temperature |

Pennes conduction/perfusion/metabolism uses assumedρ1060kg/m³,c3600J/(kgK),k0.5W/(mK),β40000W/(m³K),qmet6000W/m³. Baseline allnodes37°C; arterial36.85°C; deep/environment37°C; insulated lateral column faces. Contact resistance4K/W plus half-cell conduction; insulation80K/W; hot-to-tissue120K/W. Constant-property TECα0.012V/K,Re2Ω,K0.035W/K; Qh=Qc+P. Forward Euler0.01s with explicit stability bound;20Hz displayed outputs. Current cap0.32A, proportional gain0.12A/K, controller target34°C and28/42°C interlocks are demonstration assumptions, never clinical bounds. Complete parameter units/signs/BCs/ICs, all scenario interventions and provenance remain in MODEL.md.

The model predicts its depth-column/device thermal trajectories and signed energy flows. It cannot predict a lateral3D field, affected tissue volume, seizure suppression, chronic heat rejection, contact mechanics or clinical safety. Calibration needs identified module/electrical and thermal measurements, sensor dynamics, contact impedance, boundary characterization and separate biological evidence.

## Prioritized specification and architecture

1. Preserve anatomy/device/core solver unchanged; add one isolated research route linked from the cortical lab and case study. No framework or dependency replacement.
2. Separate reported physical prototype evidence from hypothetical implant construction and proposed research instrumentation. Generic rendering never establishes actual board/driver/sensor configuration.
3. Add one complete nonperfused spherical finite-volume thermal experiment coupled through well-mixed medium to finite TEC/storage/rejection. Keep neural signals independently seeded and label all outputs synthetic/computational.
4. Reproduce and compare controlled conditions through worker calculations, one clock, charts, radial section, current/sensor state, energy ledger, JSON replay and CSV provenance.
5. Provide accessible model equations, parameter/BC/IC/provenance records, measurement-modality comparison, evidence milestones and a concise Research Summary.

Ownership boundaries: new `organoid-model.js` and `organoid-signal.js` are renderer-independent; new `research-worker.js` computes bounded validated inputs; `research-scene.js` renders actual radial values and generic bench geometry; `research.js/research.html/research.css` coordinate one recorded state. Original app/model/worker/scene/anatomy/device modules are preserved. Only an existing masthead link and a case-study evidence-note link connect the new route.

## Six implementation passes and review rubric

| Pass | Intended gain / evidence requirement |
| --- | --- |
|1 Forensic baseline | Actual clean-base source inventory,223 tests, numerical/geometric checks, equivalent renders and baseline renderer measurements |
|2 Research specification | Separate nonperfused geometry, exact evidence classes, no NeuroSky→MEA equivalence, source-verified claims and five evidence milestones |
|3 Vertical slice | Seeded signals→illustrative detector→current→finite thermal response→sensor feedback→export, one worker/state clock |
|4 Scientific refinement | Whole-system energy identity; analytical sphere, time and mesh refinement; input/fault tests; exact seeded replay; default temperature-independent network |
|5 Rendered design refinement | Actual desktop/phone render critique: stable scene size when inspector opens, section close-up at unchanged scale, readable materials/labels, meaningful picking and no idle motion |
|6 Production verification | Original/new browser checks, exports, failure paths, keyboard/reduced motion, responsive/Axe, build and separate renderer measurements; exact asset hashes after any authorized release |

Rubric uses evidence gates rather than invented quality scores. Scientific integrity requires all named assumption/provenance/measurement distinctions and numerical checks. Engineering correctness requires conservation/refinement/input/fault/replay checks. Visual clarity requires inspected apparatus/section/prototype renders with defects fixed. Interactive usefulness requires every control to alter a result, view or reproducible record. Accessibility requires keyboard, reduced-motion, static/fault paths and automated scans in inspected states. Reliability requires build, regression and browser checks. Admissions relevance is a bounded contribution/evidence summary, not a predicted admissions result; no admissions review or independent clinical validation is claimed.

The unvalidated temperature→neural hypothesis mode is intentionally omitted: the default independent signal makes the unsupported biological proposition clearer. No measured hardware import, biological protocol, solved wiring, live serial control or clinical operating bounds are invented to fill missing evidence.
