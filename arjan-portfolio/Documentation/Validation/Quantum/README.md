# Production release verification · November 2, 2026

The isolated release is based on production commit `5ecee04971cd1ed913bda6358c1c5320b1ab6682`. It retains the current production dependencies and all unrelated projects. Only the quantum runtime, case-study integration, tests, tools, and validation records are changed.

All 209 tests in 24 files pass with coverage enabled; TypeScript and the Next.js 15.5.28 production build pass. Repository-wide lint initially encountered 32 errors in existing hospitalSIM third-party vendor files. Lint passes with `--ignore-pattern 'public/hospitalsim/vendor/**'`; the vendor files and lint configuration are unchanged. The built release serves 38 byte-matched quantum assets and passes the case-study embed, loaded processor, live amplitude sum, complete Bell readout, phone-width overflow, and page-error smoke checks.

---

# Linked visual calculation · r9 · November 2, 2026

The selected output amplitude now connects the main ket paths, probability display, matrix-row working, and a complex-plane addition diagram. Contributions add head to tail at a fixed unit scale; the magenta resultant is their calculated complex sum. Selecting a basis outcome also selects its row in the detailed exact calculation, and manual row selection updates the main graphics.

During a native pulse, the main row uses the actual intermediate evolution matrix and input vector. Its rounded arithmetic is labeled LIVE CALCULATION. At the gate endpoint it returns to exact fractions, radicals, or symbolic expressions. The diagram retains full numerical precision. Measurement hides the unitary addition diagram and displays the Born rule.

The Bloch spheres add a cyan projection onto the z axis. The waveform shades only the played portion of each actual envelope. Processor annotations use small corner marks in place of expanding rings, with a highlighted drive path. The signal overlay now follows the XY and readout sides of the locally generated GLB: Blender y becomes negative glTF z, placing the XY input at positive z and the meandered resonator at negative z. The procedural fallback retains its original path convention. This remains a generic circuit illustration.

Validation:

- 32 focused tests pass across six files.
- `synchrony-results.json`: H and CNOT at ten clock positions per browser verify state, Bloch vector, z projection, live addition terms and result, waveform, hardware cursor, and displayed probabilities. Main-to-exact output selection, phone layout, and axe checks pass in Chromium, WebKit, and Firefox.
- `exact-results.json`: exact arithmetic, head-to-tail cancellation with positive and negative contributions, exact-to-main selection, symbolic rotations, and moving ket/factor elements pass in all three browsers.
- `coherence-results.json`: phase-sensitive Bell readout, mixed ensembles, virtual frames, and responsive accessibility pass in all three browsers. All eleven integration groups pass, including assembly, custom circuits, projective measurement, and both graphics fallbacks.
- `performance-synchrony-results.json`: native Chromium on Apple M2 measured 60.02 updates/s for H and 59.54 for CNOT at 1440 × 900; both measured 60.01 at the emulated 390 × 844 viewport. These measure the shared UI clock during each gate, with no CPU or network throttling. Physical-phone performance was not measured.
- Formatting, scoped whitespace checks, and local asset validation pass. Combined JavaScript gzip size is 610,198 bytes.

`synchronized-bell-experiment.webm` records the revised interface. The `synchrony-` screenshots show the current stage. No new dependencies, experiments, or public deployment were added. Earlier records follow.

---

# Plain headings · r8 · November 2, 2026

Removed promotional headings, slogan captions, italic title fragments, and the closing promotional section. Assembly headings name components; computation headings name gates or measurements. Heading sizes are reduced and use the existing sans-serif typeface. Mathematical notation is unchanged.

Native Chromium checks pass for initial and dynamic headings, absence of italic heading elements, heading sizes, desktop/phone overflow, and page errors. Screenshots: `plain-headings-desktop.png` and `plain-headings-mobile.png`. Formatting, scoped whitespace checks, and local asset validation pass. No public deployment or physical-phone test was performed. Earlier validation records follow.

---

# Visual explanation stage · r7 · November 2, 2026

The main computation scene now leads with the input ket, complex-amplitude paths, and a larger transformed ket. Path widths show contribution magnitude; arrow direction shows complex phase. The resultant at each output is their actual sum, including destructive cancellation. These graphics use the existing native-evolution matrix and state vector, rather than a separate animation model.

The Bloch spheres have front/rear grids, vector arrowheads, phase arcs, and a visible maximally mixed center for Bell-state reductions. The larger processor uses a lower camera angle, revised sapphire/silver/gold materials, and a contact shadow. Beneath it, the control ribbon reveals the played part of the actual I/Q or flux envelope with an instantaneous cursor. Virtual frame changes still show zero physical XY duration.

Circuit editing is consolidated into one disclosure with an Edit shortcut beside the active circuit. Fewer borders and a compact equation row give the linked graphics more space. Long live kets wrap between mathematical terms, including the four-term state during CNOT. Phone layouts retain the live ket and execution control while scrolling. No new experiments, dependencies, or scientific models were added.

Validation:

- 32 focused tests pass across six files, including a projection/depth identity for the revised Bloch geometry.
- `synchrony-results.json`: ten H/CNOT positions per browser verify the shared ket, Bloch, pulse, hardware, and complex-amplitude sums. Phone resizing preserves the pinned ket. Chromium, WebKit, and Firefox pass with no recorded page errors or axe violations.
- `exact-results.json`: exact gate calculations, H–Z–H cancellation and its visual zero resultant, symbolic rotations, three-qubit matrices, and moving ket/factor elements pass in all three browsers.
- `coherence-results.json` and all eleven groups in `integration-results.json` pass, including phase-sensitive readout, circuit editing/playback, assembly, and graphics fallbacks.
- Native Chromium on Apple M2 measured 60.01 shared-state updates/s at 1440 × 900 and 60.01 at the emulated 390 × 844 viewport during the H pulse. This measures the shared UI clock; it is not a physical-phone or arbitrary-circuit benchmark. See `performance-synchrony-results.json`.
- Local asset validation passes: 54 equation records, 38 assets, and three shared modules. Combined JavaScript gzip size is 608,998 bytes. Formatting and scoped whitespace checks pass.

`synchronized-bell-experiment.webm` records the revised UI from the H operation through entangling control and readout. Current screenshots use the `synchrony-` prefix. Physical-phone testing, independent scientist review, and public deployment were not performed. Earlier records follow.

---

# Bell coherence and phase experiment · r6 · November 1, 2026

The computation stage now derives XX, YY, ZZ, XY, Bell-target fidelity, and the complex 00↔11 coherence from the full circuit ensemble. The inspector contrasts the current joint density matrix with a classical 00/11 mixture. Matrix tiles expose magnitude, phase, basis indices, and accessible numeric values. Source: Tóth & Gühne, *Entanglement Detection in the Stabilizer Formalism* (2005), projector witness Eq. 19 and stabilizer-projector Eq. 20; https://arxiv.org/abs/quant-ph/0501020.

The Bell phase experiment appends a real Rz operation to H–CNOT. The two phase controls edit that same circuit operation. Kets, matrices, controller reference, correlations, and readout update together. An XY measurement setting reveals the imaginary coherence at relative phase π/2, where XX, YY, and ZZ alone agree with the classical mixture. The Φ+ fidelity witness remains explicitly target-specific; its failure to cross 1/2 does not classify every other state as separable.

Corrections made in this pass:

- Virtual-Z control now displays the actual phase register and zero XY pulse duration; the former 40 ns plotting placeholder is removed.
- Readout correlation copy uses the current circuit rather than a hardcoded Bell-state claim.
- Earlier projective measurements are averaged as weighted branches for joint-state analysis. The ket and local Bloch views label their conditional trajectory separately.
- Processor selection rings are finer, correlation labels are larger, and short desktop viewports use a more compact synchronized stage.
- `#phase` opens the Bell phase experiment directly.

Validation: 31 focused tests in six files; `coherence-results.json` covers both phase controls, π/2 and π correlations, XY and X readout, mixed measurement ensembles, responsive layout, and axe in Chromium, WebKit, and Firefox. Existing synchronized-view checks and all eleven integration groups pass. `bell-phase-experiment.webm` records the actual UI. The native-GPU playback benchmark remains in `performance-synchrony-results.json`; physical phones and independent researcher review have not been tested. The phase input handler averaged 11.35 ms over 30 native-Chromium input events in one desktop run.

No dependencies, public deployment, or shared portfolio-page edits were added in this pass. Earlier records follow.

---

# Shared experiment stage · r5 · November 1, 2026

The primary computation experience now puts the circuit cursor, input and live output ket, exact endpoint row calculation, local Bloch vectors, native pulse envelopes, and processor close-up in one stage. One replay/scrub clock advances all representations. The full exact calculation remains expanded below the stage; its replay uses the same gate clock, and manual basis/row inspection seeks that clock.

The simulator's integrated Gaussian / flux-envelope area is shared with the live rotation-angle explanation. Visible views update on each animation frame; other views refresh when they enter view and at gate endpoints. Readout input includes the complete circuit prefix and any measurement-basis rotations. Pulse errors remain in the labeled calibration bench; the main native-control trace is the resonant ideal experiment.

Current validation:

- 27 focused quantum tests pass (five test files), including pulse-area / state-population comparisons and drive/flux area bounds, symmetry, and monotonicity.
- `synchrony-results.json`: Chromium, Firefox, and WebKit agree on ket, probabilities, reduced Bloch vectors, waveform, and hardware clock at ten H/CNOT scrub positions per browser. Virtual-Z, single-gate replay, phone overflow, pinned mobile ket, and axe checks pass.
- `exact-results.json`: exact radicals, complex phase, cancellation, symbolic rotations, three-qubit matrices, and spatial ket/factor animation remain covered across three engines.
- `integration-results.json`: existing assembly, GHZ builder, intermediate/terminal measurement, seeded readout, pointer placement, Bell playback, GLB fallback, and HTML fallback coverage.
- `performance-synchrony-results.json`: Apple M2 native Chromium measured 59.99 shared-state updates/s at 1440 × 900 and 60.02 at 390 × 844. These are actual UI updates during the H pulse, measured on this desktop host; the phone viewport is emulation. This does not measure physical-phone performance, arbitrary circuits, or the software renderer.
- `synchronized-bell-experiment.webm`: actual UI recording from H through the native entangling interaction and readout.

No dependency, public deployment, or shared portfolio-page changes in r5. Records below describe prior revisions.

---

**Current revision · exact gate calculations · November 1, 2026**

The computation chapter now opens on the Hadamard operation. Its main stage shows the input ket, each basis-ket transformation, the full matrix multiplying the input column, highlighted row products, their sum, and the collected output ket. Selecting an output inspects that row. Animate calculation moves the actual KaTeX ket and coefficient elements through these steps. Circuit playback holds each gate long enough to follow the working.

`exact.js` carries Clifford+T coefficients as integer combinations of 1, √2, i, and i√2 over powers of two. Canonical rotations and preparations use that arithmetic; arbitrary rotations retain trigonometric expressions and general input coefficients. Pulse scrubbing displays the numerical native evolution separately. The exact output also feeds the State-view ket. `calculation.js` renders the row working from this shared input/operator data. Metadata is consolidated in Sources & model; repeated per-equation model paragraphs have been removed.

Current checks: 25 quantum tests across four test files pass (`exact-tests.log`). The exact interaction passes Chromium, WebKit, and Firefox at desktop and phone widths with zero axe violations and zero page errors (`exact-results.json`). Checks include H and CNOT ket action, Y phase, H–Z–H cancellation, symbolic Ry, three-qubit matrices, two moving ket elements, and eight moving multiplication factors. The existing eleven-group integration suite also passes. Screenshots use the `exact-` prefix; `exact-ket-transformation.webm` records the working interface. Earlier r3 benchmark and screenshot records remain below as historical evidence.

Reproduce this revision with `npx vitest run tests/quantum-exact.test.js tests/quantum-simulator.test.js tests/quantum-teaching.test.js tests/quantum-diagnostics.test.js --pool=forks --maxWorkers=1` and `node tools/quantum/exact-qa.mjs` while the local preview is running. The r4 delivery is an incremental patch against the delivered r3 files; it excludes unrelated SeizeFreeze, Pit Stop, and Rally House work.

**Quantum machine + computation laboratory · delivery record**

Implemented in `/work/rigetti-quantum-operations`, with the existing isolated application at `/quantum-computer-lab/index.html`. Date: October 30, 2026. Patch base: `5cab0ad46ccf5be80fa94f047b6957122df65f10`.

The replacement includes twelve guided assembly modules; a full refrigerator, staged input and output chains, thermal/noise overlays, exploded inspection, a processor close-up, and a linked computation workspace. The simulator supports one to three qubits, twenty circuit operations, every requested gate, initialization, projective measurement, intermediate states, complex amplitudes, density matrices, Bloch trajectories, exact ensemble probabilities, seeded shots, and a noisy I/Q discriminator. The Bell experiment includes X/Y/Z acquisition and comparison against an incoherent 00/11 mixture.

The documented Rigetti Chief of Staff role remains separate from this independent educational reconstruction. Dimensions, temperatures, pulse timings, voltages, calibration, and interaction details are explicitly representative or idealized.

**Revision after the quality review**

This revision addresses the earlier prototype’s most visible shortcomings. The computation chapter now brings the circuit, state, geometry, control, and hardware into one desktop workspace, with secondary material behind disclosures. On narrow screens, sticky view navigation and a shared play/pause control keep the execution cursor available while moving between representations. A paced Bell narrative identifies an operation, evolves it, and holds its result for inspection. Input, operator, and output equations remain separate elements; the input stays in place during scrubbing. Complex-amplitude disks make phase visible independently from probability bars. Acquisition accumulates seeded samples; the readout and hardware share the foreground during measurement. A calculated comparison table distinguishes coherent circuit probabilities from a classical mixture.

The cryostat adds machined surfaces, flange channels, a vacuum port, staged coax connectors, thermal braids, bond wires, and projected component labels. Installation now interpolates a lifted part into its target rather than resetting its position at the moment of completion. XY, flux-control, and readout signals have distinct paths, and the processor’s coupling bus highlights for controlled operations.

Each assembly module now has a quantitative subsystem bench. These cover Gaussian quasi-static Ramsey contrast, equilibrium microwave photon occupation, Gaussian assignment error, detuned population transfer, pulse spectral selectivity, phase-reference error, pulse area, and binomial sampling uncertainty. All expose equations, units, assumptions, and an imposed input. They are isolated teaching models, not a thermal-transport or engineering prediction. In particular, photon occupation is not presented as transmon excited-state population, and spectral weight is not presented as leakage probability.

The correspondence audit corrected two phase issues: zero-duration virtual gates are scrubbed by frame angle, and later hardware I/Q phases now include the accumulated virtual-Z reference. Native pulse axes, the Bloch display, and the signal path follow the active compiled segment. Regression tests compare the resulting physical pulse sequence, transformed back through its tracked frame, with the logical circuit up to global phase.

No numerical quality rating is asserted by these checks. They establish the recorded behavior and performance; visual judgment and independent scientific review remain distinct from automated correctness.

**Graphics and explanation pass · r3**

The optical-bench presentation replaces the floor grid with a restrained graphite-blue stage, reflected studio lighting, beveled support and rack parts, machined copper, a denser coax fan-out, bellows, and feedthroughs. Large parts cast contact shadows on native GPUs. Software rendering and sustained slow frames fall back to the original soft contact treatment; DPR remains adaptive. Small signal halos and an instanced trail identify the active XY, flux, or readout route. Their propagation is explicitly time-stretched independently of the gate duration.

The amplitude theatre derives every connection from the current complex matrix and input vector. Its curves encode complex contributions, not classical transition probabilities. Selecting an output exposes the actual products and sum. The interference experiment shares the existing preparation angles: relative phase changes cancellation after H, while global phase rotates all complex amplitudes without changing probabilities. Range controls preserve canonical values instead of shifting zero to a nearby step. Local symbol definitions distinguish the summation index i from the imaginary unit. Measurement hides this unitary diagram rather than suggesting readout is unitary evolution.

Bloch spheres now use a verified orthographic projection, persistent vector elements, relative-phase arcs, and continuous vector/phasor transforms. The native CNOT narrative follows target basis change, conditional phase, and recombination. Assembly requires a raycast hit on the physical part, pointer-following movement, and an aligned release. An unrelated swipe cannot install a module. Package and transmon close-ups frame both the lifted component and its seating outline; installation then reframes the seated detail. Explore complete system restores the whole-machine view. HTML Install controls remain available without dragging.

`flourish-results.json` records exact-zero phase preparation, constructive/destructive interference, global-phase invariance, pointer placement in three scales, persistent Bloch elements, mobile overflow containment, and zero axe violations in the new views. It also checks that idle gaps between on-demand renders do not degrade graphic quality. The new teaching-math module has three tests and 100% statement/branch/function coverage. These improvements do not constitute an objective aesthetic rating or an independent science review.

**State architecture**

- `app.js` owns the assembly status, installed modules, selected chapter, circuit, execution cursor, intra-gate fraction, selected preparation, and acquisition state. Semantic controls supply the preparation angles and calibration parameters. Every view derives its data from these values.
- `simulator.js` uses complex pairs `[real, imaginary]`. q0 is the most significant bit. `apply` embeds gates in the register; `run` provides intermediate conditional trajectories; `distribution` enumerates measurement branches for exact ensemble probabilities; `reduced` takes the partial trace.
- `compileSequence` tracks each qubit’s accumulated software frame. With the stated convention, hardware carrier phase equals logical-axis phase minus that reference. This history controls I/Q and carrier plots and the full compilation timeline. The Bloch sphere uses the logical software frame; a virtual reference change is not depicted as a separate propagating microwave burst.
- `teaching.js` derives complex matrix contributions and an orthographic Bloch projection from the shared state. It contains no circuit answers or alternate simulation.
- `diagnostics.js` supplies structured quantitative subsystem models, each with its reading, symbol definitions, units, assumptions, and component context. The selected input drives its curve, metric, and affected hardware highlight.
- `compile` maps logical gates to a representative sequence of XY rotations, virtual frame updates, flux-CZ, and readout. `interpolate` follows that native timeline during scrubbing. Global-phase corrections retain the exact canonical logical matrices at the endpoints.
- `content.js` maps each gate to its symbol, matrix, state action, geometry, generator, pulse, hardware, measurement interpretation, limits, and citations. The UI does not store canned Bell or GHZ answers.
- KaTeX 0.16.22 renders local HTML + MathML using locally hosted mathematical fonts. Equations have readings, definitions, units where relevant, model status, and physical context. Basis colors and real/imaginary/phase mappings persist across the workspace. Symbol buttons and equation tooltips identify operational meaning. Selecting a symbol opens a persistent explanatory inspector; definitions and model status remain available beside each equation.
- A terminal acquisition displays one seeded ideal projective trajectory while replaying the full ensemble for the histogram. Gaussian discriminator noise affects classified samples, separately from the ideal state. Selecting a prior gate returns to its pre-readout calculation.
- The calibration preview numerically integrates a driven two-level RWA model with a Gaussian envelope, detuning, and pulse-area error. The ideal circuit remains explicitly labeled as the reference calculation.

**Conventions and scientific qualifications**

The Pauli matrices have their usual computational-basis signs. The free Hamiltonian is written in the requested +Z form. With zero as the lower transmon level, its signed angular frequency is negative; the physical transition frequency is its magnitude divided by 2π. The drive uses the same signed convention. The displayed rotating-frame transformation therefore gives transverse terms proportional to `cos(phase) X + sin(phase) Y`; phase +π/2 gives +y. Angular frequencies, ordinary frequencies, durations, and normalized waveform amplitudes are distinguished in the UI.

Hadamard is compiled chronologically as Rz(π), then Ry(π/2), up to a stated global phase. S and T are related to Rz by their explicit global factors. A representative CNOT is target H → CZ → target H. CZ assumes tunable transmons coupled through a bus, a flux excursion near the 11–02 avoided crossing, and compensation of local dynamical phases. This is architecture dependent and is not a Rigetti specification.

The temperature ruler is logarithmic: 300 K to 15 mK spans about 4.3 orders of magnitude. The brief’s suggested six-order description would be inaccurate for those endpoints. Listed stages are representative waypoints, not a universal thermal specification.

Noisy readout uses dimensionless normalized voltage with means −1 and +1. It is a statistical teaching model, not a calibrated resonator or amplifier simulation. Computational-basis Bell counts alone do not demonstrate entanglement; the interface explains basis changes, phase-sensitive correlations, and the additional experimental characterization required.

**Scientific source map**

| Source                                                                                                                        | Claims supported                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [Krantz et al., 2019](https://arxiv.org/abs/1904.06560)                                                                       | Circuit control, cryogenic noise, attenuation, calibration, readout                        |
| [Koch et al., 2007](https://arxiv.org/abs/cond-mat/0703002)                                                                   | Transmon encoding, Josephson nonlinearity, anharmonicity, leakage                          |
| [Bluefors, refrigerator components](https://bluefors.com/stories/components-of-the-dilution-refrigerator-measurement-system/) | Vacuum, pulse-tube precooling, shields, stages, dilution unit                              |
| [Blais et al., 2021](https://arxiv.org/abs/2005.12667)                                                                        | Dispersive resonator response, amplification, readout                                      |
| [DiCarlo et al., 2009](https://arxiv.org/abs/0903.2030)                                                                       | Representative flux-controlled conditional phase and bus coupling                          |
| [McKay et al., 2017](https://arxiv.org/abs/1612.00858)                                                                        | Virtual Z through microwave-reference frame updates                                        |
| [Kjaergaard et al., 2020](https://arxiv.org/abs/1905.13641)                                                                   | Architecture dependence, calibration limits, gate implementations                          |
| [Aaronson, 2018 lecture notes](https://www.scottaaronson.com/qclec.pdf)                                                       | Bra-ket notation, gates, tensor products, density operators, partial traces, Bloch spheres |

All eight source links returned HTTP 200 in the recorded link check. The supplied quantum-information notes and textbook material informed notation. The solution manual and QFT text were not used as hardware specifications. Supplied photographs were visual references; neither they nor textbook pages are redistributed. The project uses original geometry and a schematic processor layout.

**Assets and performance**

The complete per-file raw and gzip inventory is [asset-and-source-results.json](asset-and-source-results.json). Shared tracked Three.js and OrbitControls modules remain in `public/pit-stop-lab/vendor/`. The two matching loader/geometry utility modules are included in the new lab’s own vendor directory so the patch does not depend on unrelated untracked work.

| Budget                                                | Recorded result                                          | Scope                                                                                                                                                                               |
| ----------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript ≤700 KiB gzip                              | 590,432 bytes (576.6 KiB)                                | All lab JS plus shared Three/Orbit, conservative sum                                                                                                                                |
| Deployed 3D model ≤100 KiB gzip                       | 15,089 bytes                                             | Original processor GLB; raw 113,664 bytes                                                                                                                                           |
| Model triangles ≤10,000                               | 1,560                                                    | Four meshes, four materials, zero image textures                                                                                                                                    |
| Scene triangles ≤60,000                               | About 47,800–49,400                                      | Whole representative system                                                                                                                                                         |
| Draw calls ≤80                                        | About 60–66 main-view calls                              | Module-local geometry batching plus instanced fasteners                                                                                                                             |
| Environment texture estimate ≤16 MiB                  | 6 MiB for the main 768 × 1024 RGBA16F environment target | Renderer reports up to seven textures in the inspected native path, including generated machining/contact/glow maps and shadow resources; driver/framebuffer memory is not measured |
| Interactive controls ≤3 s on localhost                | Recorded per viewport in browser-results.json            | Navigation-to-controller-ready proxy, not a Core Web Vitals TTI claim                                                                                                               |
| Animated rendering ≥30 fps in isolated viewport check | 59.8–59.9 fps across 1440 × 900 and 390 × 844                | Regular Chromium, unified headless, ANGLE Metal on Apple M2; narrow size is emulation                                                                                               |

The isolated performance run waits five seconds, then measures rendered frames for 2.5 seconds. [performance-native-results.json](performance-native-results.json) records the Apple M2 Metal renderer at DPR 1.0 and about 60 fps in both viewport sizes. [performance-results.json](performance-results.json) separately records Chromium’s headless-shell SwiftShader software renderer: 15.3 fps desktop and 23.4 fps narrow at DPR 0.6. That software-only path does not meet the 30 fps target. The production integration run also uses SwiftShader and runs alongside other checks; it is not the native-GPU benchmark. None of these results establish physical-phone performance or production-network load times.

The cryostat is procedural geometry with no downloaded models or photographic textures. Three small original canvas maps provide machining roughness/bump, a soft contact shadow, and a signal halo. Real-time large-part shadows are enabled on native GPUs and disabled on software or sustained slow rendering. The original processor is generated by `tools/quantum/create-processor.py` in Blender 4.0.2 and exported as GLB. At 14.5 KiB gzip, Draco decoder overhead is unjustified; KTX2 is unnecessary because the model has no textures. Repeated fasteners are instanced; stationary parts are merged within assembly modules. DPR caps at 1.6 desktop / 1.25 narrow viewport, reduces under sustained slow frames, and bottoms at 0.6. WebGL pauses outside the viewport and in hidden tabs; materials, geometry, environment targets, listeners, and animation frames are cleaned up on navigation. The poster stays until the first successful frame and returns on context loss.

**Validation**

- Locked install: 756 packages installed in a temporary directory. The original lockfile’s private registry was unreachable; only the temporary copy’s resolved URL prefix was rewritten to public npm. Versions and integrity hashes were retained. Repository package.json and package-lock.json are unchanged.
- Formatting: Prettier 3.6.2 check passes for the authored lab application, tests, helpers, and case-study component. Existing formatting differences in the shared rigetti.css and projects.ts files were preserved. No formatter dependency was added to the project.
- Lint: passes with zero errors and 14 existing warnings outside this change; [lint.log](lint.log).
- Type checking: passes; [typecheck.log](typecheck.log).
- Tests and coverage: 167 tests across 18 files pass, including 13 simulator tests, four subsystem-model tests, and three teaching-math tests. Quantum simulator statement coverage is 97.83%, branch coverage 95.42%, and function coverage 100%; [tests.log](tests.log). Overall repository coverage is lower and is not represented as simulator coverage.
- Production build: passes; [build.log](build.log).
- Equation parsing: all 54 structured lesson and diagnostic equations pass strict KaTeX parsing. Runtime rendering also uses strict parsing. Browser assertions verify four rows for two-qubit vectors/matrices and eight for three-qubit vectors/matrices. Expanded three-qubit matrices are keyboard-scrollable and pass axe; see expanded-matrix-accessibility.json.
- Local imports, HTML assets, and all KaTeX font paths validate. All eight scientific source links return HTTP 200.
- Chromium: 390 × 844, 430 × 932, 768 × 1024, 1024 × 768, 1440 × 900, 1920 × 1080. WebKit and Firefox: 390 × 844 and 1440 × 900. See [browser-results.json](browser-results.json).
- Automated checks find no horizontal overflow, JavaScript exceptions, failed asset responses, or axe violations in checked computation views. Tests exercise resume, module placement, keyboard-accessible controls, reduced motion, source-dialog dismissal, HTML mode, and circuit selection.
- Production integration checks: all twelve module installs and failure/restore actions, GHZ construction, invalid control rejection, intermediate projective measurement, gate-angle and execution scrubbing, seeded acquisition, energy/basis and tensor mapping, pointer placement, completed animated Bell execution, detail framing after viewport changes and Reset view, and the blocked-3D HTML fallback; [integration-results.json](integration-results.json).
- Revision checks verify all twelve nominal/fault/restore metrics, persistent input equations during scrubbing, symbol-inspector dismissal, native flux-path selection, active carrier-phase selection, gradual acquisition, pause/resume continuity, actual assembly seating, and expanded three-qubit matrix accessibility; [revision-results.json](revision-results.json).
- A blocked processor GLB retains the procedural circuit close-up. A blocked scene module retains the written and mathematical experience.
- Git whitespace check passes. Unrelated Pit Stop and Rally House working-tree edits were preserved.

**Screenshots**

Each target viewport has an assembly and computation PNG in this directory, named `chromium-WIDTHxHEIGHT-assembly.png` and `chromium-WIDTHxHEIGHT-computation.png`. WebKit and Firefox equivalents are included for the two checked sizes. Additional images show the production case study, package, processor close-up, blocked-WebGL fallback, failed-GLB fallback, and focused revision views (`revision-machine.png`, `revision-workspace.png`). The r3 native-GPU images include the whole machine, amplitude theatre, interference, phone-width interference, and lifted/seated package and processor views (`r3-*.png`). The exact delivered file list is [changed-files.txt](changed-files.txt).

**Remaining limits**

The model omits full transmon/multilevel dynamics, leakage dynamics, decoherence, fabrication, calibrated device voltages, resonator transients, thermal transport, cable distortion, and real hardware control. Input calibration parameters are educational examples, not laboratory procedures. Package and chip dimensions are diagrammatic. Only three qubits and twenty operations are supported, with at most 4,096 seeded shots per acquisition.

No independent scientific review has been performed. WebKit automation is not a physical iOS Safari test. Desktop Safari, actual touch hardware, screen-reader speech output, production-network TTI, and sustained physical-phone FPS were not manually verified. Pointer event placement is tested; click and keyboard placement remain the primary robust alternatives. The desktop fallback uses an installed Firefox revision when the expected Playwright binary is absent; matching browser installation is preferred for CI. The compressed-byte budgets are gzip calculations, not proof of a particular production server’s compression configuration.

No commit, push, public deployment, proprietary hardware claim, or measured device-performance claim is included in this delivery.

**Reproduce checks**

From `arjan-portfolio/`, with the existing dependencies installed:

```sh
npm run lint
npm run typecheck
npm run test:coverage
npm run build
node tools/quantum/validate.mjs --links
python3 -m http.server 8864 --bind 127.0.0.1 --directory public
```

In a second terminal:

```sh
node tools/quantum/browser-qa.mjs
node tools/quantum/performance-qa.mjs
node tools/quantum/performance-qa.mjs --native
node tools/quantum/revision-qa.mjs
node tools/quantum/flourish-qa.mjs
npm run start -- --hostname 127.0.0.1 --port 8865
```

In a third terminal, while the production server is running:

```sh
node tools/quantum/integration-qa.mjs
```

Regenerate the original model, if desired:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python tools/quantum/create-processor.py
```

**Apply the delivered archive or patch**

This workspace already contains the implementation. Use the following commands on another checkout of the same base. The ZIP contains repository-relative final files, screenshot evidence, and an implementation patch. The patch includes implementation, tests, tools, and textual validation records; screenshot PNGs are provided separately inside the ZIP.

```sh
unzip -q "/Users/arjan/Desktop/arjansinghpuniani.com/quantum-delivery/quantum-machine-computation-2026-r3.zip" -d /tmp/quantum-machine-computation-r3-delivery
cd "/Users/arjan/Desktop/arjansinghpuniani.com"
git apply --check /tmp/quantum-machine-computation-r3-delivery/quantum-machine-computation.patch
git apply /tmp/quantum-machine-computation-r3-delivery/quantum-machine-computation.patch
mkdir -p arjan-portfolio/Documentation/Validation/Quantum
cp /tmp/quantum-machine-computation-r3-delivery/arjan-portfolio/Documentation/Validation/Quantum/*.png arjan-portfolio/Documentation/Validation/Quantum/
```

The implementation patch removes the two obsolete files under `public/quantum-computer-lab/assets/`. The new application retains the existing route, iframe boundary, portfolio navigation, metadata, and documented role. Its CSS remains inside the iframe, except for scoped `.rq-*` case-study rules.

**Exact review and commit commands**

After reviewing the result and rerunning the checks on the destination checkout:

```sh
cd "/Users/arjan/Desktop/arjansinghpuniani.com"
git switch -c codex/quantum-machine-computation
git add -- arjan-portfolio/public/quantum-computer-lab arjan-portfolio/src/components/RigettiQuantumCaseStudy.tsx arjan-portfolio/src/app/rigetti.css arjan-portfolio/src/content/projects.ts arjan-portfolio/tests/quantum-simulator.test.js arjan-portfolio/tests/quantum-diagnostics.test.js arjan-portfolio/tests/quantum-teaching.test.js arjan-portfolio/tools/quantum arjan-portfolio/Documentation/Validation/Quantum
git diff --cached --check
git diff --cached --stat
git commit -m "Build superconducting quantum assembly and computation laboratory"
git push -u origin codex/quantum-machine-computation
```
