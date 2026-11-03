export const sources = [
  {
    id: "toth",
    title:
      "Tóth & Gühne · Entanglement Detection in the Stabilizer Formalism (2005)",
    url: "https://arxiv.org/abs/quant-ph/0501020",
    claim:
      "Pauli-correlation witnesses and the Bell-projector fidelity bound. The joint-state inspector uses the exact two-qubit identity ΠΦ+ = (II + XX − YY + ZZ)/4; a separable state has Bell fidelity at most 1/2.",
  },
  {
    id: "krantz",
    title:
      "Krantz et al. · A Quantum Engineer’s Guide to Superconducting Qubits (2019)",
    url: "https://arxiv.org/abs/1904.06560",
    claim:
      "Control, thermal noise, attenuation, coherence, and readout. Review, especially sections II–V.",
  },
  {
    id: "koch",
    title: "Koch et al. · Charge-insensitive qubit design (2007)",
    url: "https://arxiv.org/abs/cond-mat/0703002",
    claim:
      "Transmon energy levels, Josephson nonlinearity, charge-noise tradeoff, and leakage.",
  },
  {
    id: "bluefors",
    title:
      "Bluefors · Components of the dilution refrigerator measurement system",
    url: "https://bluefors.com/stories/components-of-the-dilution-refrigerator-measurement-system/",
    claim:
      "Vacuum boundary, radiation shields, pulse-tube precooling, thermal stages, and dilution unit.",
  },
  {
    id: "blais",
    title: "Blais et al. · Circuit Quantum Electrodynamics (2021)",
    url: "https://arxiv.org/abs/2005.12667",
    claim:
      "Resonator coupling, dispersive measurement, microwave amplification, and quantum trajectories.",
  },
  {
    id: "dicarlo",
    title:
      "DiCarlo et al. · Two-qubit algorithms with a superconducting processor (2009)",
    url: "https://arxiv.org/abs/0903.2030",
    claim:
      "Representative flux-controlled conditional phase via the 11–02 avoided crossing; local phase compensation and tomography.",
  },
  {
    id: "mckay",
    title: "McKay et al. · Efficient Z Gates for Quantum Computing (2017)",
    url: "https://arxiv.org/abs/1612.00858",
    claim:
      "Virtual Z gates implemented as changes of the microwave reference phase.",
  },
  {
    id: "kjaergaard",
    title:
      "Kjaergaard et al. · Superconducting Qubits: Current State of Play (2020)",
    url: "https://arxiv.org/abs/1905.13641",
    claim:
      "Architecture dependence, native gates, calibration, noise, and scaling.",
  },
  {
    id: "aaronson",
    title:
      "Scott Aaronson · Introduction to Quantum Information Science (2018)",
    url: "https://www.scottaaronson.com/qclec.pdf",
    claim:
      "Supplied lecture notes: lectures 3–7, gates, tensor products, global phase, density operators, partial trace, and Bloch spheres.",
  },
];
// Approximate temperatures are educational waypoints, not a vendor specification.
export const stages = [
  {
    title: "Support frame",
    part: "Support frame",
    temperature: "300 K",
    short:
      "The frame supports the refrigerator and isolates mechanical vibration.",
    why: [
      "A rigid frame carries the refrigerator, while vibration isolation limits mechanical disturbances. The adjacent rack houses the warm electronics.",
      "Vibration, electromagnetic interference, and cable routing all become part of the experiment. The processor depends on these supporting systems.",
    ],
    failure:
      "Vibration and uncontrolled electromagnetic pickup disturb the environment. The red overlay marks a disturbance, not a calculated heating rate.",
    detail:
      "Representative room-temperature zone. Vibration can generate heat and disturb wiring. Dimensions and isolation mounts are illustrative.",
    source: ["bluefors", "krantz"],
    test: "The support frame is seated and the rack has a clear cable route.",
  },
  {
    title: "Vacuum vessel",
    part: "Vacuum vessel",
    temperature: "300 K",
    short: "Remove gas to suppress convection between warm and cold parts.",
    why: [
      "A sealed stainless enclosure surrounds the cold assembly. Evacuating it suppresses gas-mediated heat transfer.",
      "Vacuum is not a cooling mechanism. Supports and cables still conduct heat, and radiation still crosses the vacuum.",
    ],
    failure:
      "Residual gas increases heat transfer. The vessel glows red to illustrate the lost thermal isolation.",
    detail:
      "Cutaway omits part of the vessel so the interior stays visible. No operating pressure or pump procedure is prescribed.",
    source: ["bluefors"],
    test: "The educational vacuum boundary is closed. Actual leak checking is omitted.",
  },
  {
    title: "Pulse-tube precooling",
    part: "Pulse-tube precooler",
    temperature: "50 → 4 K",
    short: "A pulse-tube cryocooler precools the upper stages.",
    why: [
      "A compressor drives the cryocooler; flexible thermal links carry cooling to the warmer plates. A cold head is not the mixing chamber.",
      "Precooling prepares the dilution unit to run. A circulating helium-3/helium-4 mixture then provides refrigeration at the coldest stage.",
    ],
    failure:
      "Without precooling, the dilution cycle cannot begin from room temperature.",
    detail:
      "50 K and 4 K are representative stage names. Actual temperature depends on cooling power and attached thermal load.",
    source: ["bluefors"],
    test: "Precooling is available. The lowest stage still needs dilution refrigeration.",
  },
  {
    title: "Thermal stages",
    part: "Nested thermal plates",
    temperature: "50 K → 15 mK",
    short: "Intercept heat in stages, protecting the coldest region.",
    why: [
      "Install the 50 K, 4 K, still, cold plate, and mixing chamber from top to bottom. Each plate anchors components and intercepts thermal load.",
      "The mixing chamber cools as helium-3 crosses into the dilute phase. The still supports circulation; the pulse tube alone does not reach millikelvin temperatures.",
    ],
    failure:
      "Warm-stage heat reaches the mixing chamber when the thermal hierarchy is bypassed.",
    detail:
      "Illustrative waypoints: 50 K, 4 K, 0.8 K, 0.1 K, 0.015 K. Geometry and temperatures vary. The temperature ruler is logarithmic.",
    source: ["bluefors"],
    test: "Five representative cold plates are installed in decreasing temperature order.",
  },
  {
    title: "Radiation shields and thermal anchors",
    part: "Shields & thermal anchors",
    temperature: "50 K / 4 K",
    short: "Vacuum stops convection; reflective shields intercept radiation.",
    why: [
      "Nested shields reduce radiative heating of the inner stages. Each shield attaches thermally to a suitable cold plate.",
      "Thermalization means letting a component exchange heat with its stage. Clamping cables to intermediate plates prevents a direct warm-to-cold thermal path.",
    ],
    failure:
      "Bypassing a thermal anchor conducts extra heat down a cable. The mixing-chamber marker warms conceptually.",
    detail:
      "Shield openings and missing faces are a cutaway convention. Heat arrows indicate direction, not quantitative heat flow.",
    source: ["bluefors", "krantz"],
    test: "Radiation shields and representative cable anchors are seated.",
  },
  {
    title: "Microwave input lines",
    part: "Microwave input lines",
    temperature: "300 K → 15 mK",
    short:
      "A calibrated microwave field drives the transmon through its control line.",
    why: [
      "Coaxial cables carry signals through staged attenuators and filters. Attenuation reduces the warm noise reaching the chip.",
      "Cables add heat and can distort pulses. Thermal anchoring and filtering are engineered together with signal integrity.",
    ],
    failure:
      "Removing staged attenuation increases incident thermal noise. No universal attenuation budget is assumed.",
    detail:
      "Blue is the input control path. Gold connectors and filters are schematic. No component attenuation, frequency response, or performance is claimed.",
    source: ["krantz"],
    test: "A representative control path now reaches the processor location.",
  },
  {
    title: "Readout chain",
    part: "Readout chain",
    temperature: "15 mK → 300 K",
    short:
      "Isolation and amplification make a state-dependent resonator response measurable.",
    why: [
      "Readout travels from the resonator through isolation, cryogenic amplification, room-temperature gain, and digitization. Isolation limits noise returning toward the device.",
      "A noisy voltage is classified statistically. Even after calibration, the distributions for the two outcomes can overlap.",
    ],
    failure:
      "A missing first amplifier or reversed isolator degrades discrimination. Open the computation view to change the cluster overlap.",
    detail:
      "Gold is the return signal. Representative order: resonator → isolators → 4 K amplifier → warm amplifier → ADC → classifier. Some systems add a millikelvin parametric amplifier.",
    source: ["blais", "krantz"],
    test: "The readout return path and representative amplification chain are connected.",
  },
  {
    title: "Processor package",
    part: "Processor package",
    temperature: "≈15 mK",
    short:
      "The package provides thermal contact, shielding, and electrical connections.",
    why: [
      "The lid, substrate, interconnects, and magnetic enclosure form an interface between the chip and the refrigerator.",
      "Packaging changes electromagnetic modes, thermal contact, crosstalk, and reliability. The model uses original, generic geometry.",
    ],
    failure:
      "Poor thermal contact or an unwanted package mode can compromise operation.",
    detail:
      "Explode separates the lid, interposer, chip, and carrier. Bond wires are representative interconnects, not fabrication guidance.",
    source: ["krantz", "kjaergaard"],
    test: "The processor carrier is mounted below the mixing chamber.",
  },
  {
    title: "Transmon and resonator",
    part: "Transmon & resonator",
    temperature: "≈15 mK",
    short: "A Josephson junction makes the energy-level spacing unequal.",
    why: [
      "A transmon combines capacitance with Josephson nonlinearity. Its two lowest energy eigenstates encode the computational basis. Higher levels remain present.",
      "A resonator couples the qubit state to a microwave response. The close-up is a circuit diagram in three dimensions, not a lithographic replica.",
    ],
    failure:
      "An ideal harmonic oscillator has equally spaced transitions; driving one transition would not isolate a two-level computational subspace.",
    detail:
      "Superconductivity supports low-loss circuit operation. The Josephson junction is a nonlinear element. Leakage means population outside the selected two-level subspace.",
    source: ["koch", "blais"],
    test: "The junction, capacitive pads, resonator, and coupling bus are visible.",
  },
  {
    title: "Control electronics",
    part: "Control electronics",
    temperature: "300 K",
    short: "Software turns logical operations into timed analog signals.",
    why: [
      "The controller schedules pulses. A DAC creates envelopes, microwave electronics upconvert them, and synchronized triggers coordinate the experiment.",
      "The ADC digitizes the return signal. Calibration maps a desired rotation to a waveform and a measurement voltage to an outcome label.",
    ],
    failure:
      "A timing or phase-reference error produces the wrong rotation even if every cryogenic part is installed.",
    detail:
      "The rack is representative: controller → DAC → I/Q mixing and local oscillator → cryogenic input; return → warm gain → ADC → discrimination.",
    source: ["krantz", "kjaergaard"],
    test: "Warm electronics are linked to both the drive and readout paths.",
  },
  {
    title: "Cooldown and calibration",
    part: "Cooldown & calibration",
    temperature: "≈15 mK",
    short:
      "Find a transition, calibrate a pulse, and choose a readout threshold.",
    why: [
      "A real cooldown includes vacuum verification, precooling, and dilution circulation. This compressed sequence then checks lines and resonator responses before locating a qubit transition.",
      "Pulse calibration estimates rotation versus pulse area. Relaxation T₁ describes population decay; coherence T₂ describes loss of phase coherence. Neither is inferred by this toy model.",
    ],
    failure:
      "Detuning tilts the rotation axis; an incorrect pulse area misses the intended angle; a misplaced readout threshold misclassifies shots.",
    detail:
      "Use the computation laboratory’s frequency, amplitude, and threshold controls. All timings and voltages there are teaching values, not device calibrations.",
    source: ["krantz", "blais"],
    test: "Educational calibration controls are ready. No real refrigerator or processor is connected.",
  },
  {
    title: "System test",
    part: "System test",
    temperature: "Model · ideal state",
    short:
      "Control a state, read it out, and repeat to estimate probabilities.",
    why: [
      "A signal leaves the rack, descends the cold stages, and drives the selected qubit. A resonator response then returns through the readout chain.",
      "The installed components provide cooling, isolation, control, and measurement for the processor.",
    ],
    failure:
      "A single bit does not reveal a state. Repeated experiments estimate frequencies; additional bases reveal phase-sensitive correlations.",
    detail:
      "Continue into the linked mathematical workspace. It calculates complex amplitudes for one to three qubits and separately models a noisy discriminator.",
    source: ["aaronson", "krantz"],
    test: "The system is ready for the Bell-state experiment. Continue from microwave pulse to computation.",
  },
];
const common = {
  measurement:
    "Infer the effect from repeated preparations and measurements; use a basis change to detect relative phase.",
  limitation:
    "Ideal two-level unitary. Real control has distortion, decoherence, crosstalk, and leakage.",
  source: ["aaronson", "krantz"],
};
export const operations = {
  X: {
    ...common,
    symbol: "X",
    operator: String.raw`X=\begin{bmatrix}0&1\\1&0\end{bmatrix}`,
    state: String.raw`X(\alpha\lvert0\rangle+\beta\lvert1\rangle)=\beta\lvert0\rangle+\alpha\lvert1\rangle`,
    geometry:
      "Rotate π radians about x. X exchanges basis populations, with a phase convention beyond a classical NOT.",
    hamiltonian: String.raw`H_{\rm eff}=\frac{\hbar\Omega}{2}X,\quad R_x(\pi)=-iX`,
    pulse:
      "Resonant pulse, area π; phase 0 in the stated cosine-carrier convention.",
    hardware: "DAC → I/Q mixer → attenuated XY control line → transmon.",
    reading:
      "X exchanges the two amplitudes. A physical x rotation realizes X up to a global phase.",
  },
  Y: {
    ...common,
    symbol: "Y",
    operator: String.raw`Y=\begin{bmatrix}0&-i\\i&0\end{bmatrix}`,
    state: String.raw`Y\lvert\psi\rangle=-i\beta\lvert0\rangle+i\alpha\lvert1\rangle`,
    geometry:
      "Rotate π about y. X and Y can have identical basis counts but different relative phases for other input states.",
    hamiltonian: String.raw`H_{\rm eff}=\frac{\hbar\Omega}{2}Y,\quad R_y(\pi)=-iY`,
    pulse:
      "Resonant area-π envelope; carrier phase +π/2 gives the +y axis here.",
    hardware: "The same XY control line, with a different quadrature phase.",
    reading:
      "Y exchanges the amplitudes and multiplies them by opposite imaginary phases.",
  },
  Z: {
    ...common,
    symbol: "Z",
    operator: String.raw`Z=\begin{bmatrix}1&0\\0&-1\end{bmatrix}`,
    state: String.raw`Z\lvert\psi\rangle=\alpha\lvert0\rangle-\beta\lvert1\rangle`,
    geometry:
      "Rotate π about z; change relative phase without changing basis populations.",
    hamiltonian: String.raw`R_z(\pi)=e^{-i\pi Z/2}=-iZ`,
    pulse:
      "Representative implementation: virtual frame update; no standalone microwave burst.",
    hardware:
      "Controller phase register changes the reference of subsequent XY pulses.",
    reading:
      "Z changes the sign of the one-state amplitude. It is a relative phase operation.",
    source: ["aaronson", "mckay"],
  },
  H: {
    ...common,
    symbol: "H",
    operator: String.raw`H=\frac1{\sqrt2}\begin{bmatrix}1&1\\1&-1\end{bmatrix}`,
    state: String.raw`H\lvert0\rangle=\frac{\lvert0\rangle+\lvert1\rangle}{\sqrt2},\quad H\lvert1\rangle=\frac{\lvert0\rangle-\lvert1\rangle}{\sqrt2}`,
    geometry:
      "A π rotation about (x+z)/√2, up to global phase. It exchanges the x and z measurement axes.",
    hamiltonian: String.raw`H=iR_y(\pi/2)R_z(\pi)`,
    pulse:
      "One valid chronological compilation: virtual Z(π), then a +y π/2 pulse. The prefactor i is global.",
    hardware:
      "Controller frame update followed by a pulse on the XY line; there is no universal Hadamard pulse.",
    reading:
      "Hadamard maps the basis states to equal-weight states with different relative signs.",
  },
  S: {
    ...common,
    symbol: "S",
    operator: String.raw`S=\begin{bmatrix}1&0\\0&i\end{bmatrix}`,
    state: String.raw`S=e^{i\pi/4}R_z(\pi/2)`,
    geometry: "Rotate π/2 about z. Relative phase changes by π/2.",
    hamiltonian: String.raw`R_z(\eta)=e^{-i\eta Z/2}`,
    pulse: "Virtual Z frame update of π/2 in this representative controller.",
    hardware: "Phase register; subsequent microwave phases carry the change.",
    reading:
      "S multiplies the one-state amplitude by i. It equals a z rotation up to a global phase.",
    source: ["aaronson", "mckay"],
  },
  T: {
    ...common,
    symbol: "T",
    operator: String.raw`T=\begin{bmatrix}1&0\\0&e^{i\pi/4}\end{bmatrix}`,
    state: String.raw`T=e^{i\pi/8}R_z(\pi/4)`,
    geometry: "Rotate π/4 about z. Relative phase changes by π/4.",
    hamiltonian: String.raw`R_z(\eta)=e^{-i\eta Z/2}`,
    pulse: "Virtual Z frame update of π/4 in this representative controller.",
    hardware: "Phase register; no separate pulse is sent down the cryostat.",
    reading: "T adds π/4 to the relative phase of the one-state amplitude.",
    source: ["aaronson", "mckay"],
  },
  Rx: {
    ...common,
    symbol: "Rₓ",
    operator: String.raw`R_x(\eta)=e^{-i\eta X/2}=\begin{bmatrix}c&-is\\-is&c\end{bmatrix}`,
    state: String.raw`c=\cos(\eta/2),\quad s=\sin(\eta/2)`,
    geometry: "Rotate the Bloch vector through η radians about x.",
    hamiltonian: String.raw`H_{\rm eff}(t)=\frac{\hbar\Omega(t)}2 X,\quad \eta=\int\Omega(t)\,dt`,
    pulse:
      "A signed, normalized Gaussian envelope; rotation angle is its integrated angular rate.",
    hardware: "I envelope → DAC → mixer → XY line → qubit.",
    reading: "The matrix exponential of X gives a continuous x rotation.",
  },
  Ry: {
    ...common,
    symbol: "Rᵧ",
    operator: String.raw`R_y(\eta)=e^{-i\eta Y/2}=\begin{bmatrix}c&-s\\s&c\end{bmatrix}`,
    state: String.raw`c=\cos(\eta/2),\quad s=\sin(\eta/2)`,
    geometry: "Rotate the Bloch vector through η radians about y.",
    hamiltonian: String.raw`H_{\rm eff}(t)=\frac{\hbar\Omega(t)}2 Y,\quad \eta=\int\Omega(t)\,dt`,
    pulse:
      "The +y pulse uses carrier phase +π/2 under the cosine-carrier convention.",
    hardware: "Q envelope → DAC → mixer → XY line → qubit.",
    reading: "The matrix exponential of Y gives a continuous y rotation.",
  },
  Rz: {
    ...common,
    symbol: "R𝓏",
    operator: String.raw`R_z(\eta)=e^{-i\eta Z/2}=\begin{bmatrix}e^{-i\eta/2}&0\\0&e^{i\eta/2}\end{bmatrix}`,
    state: String.raw`\phi\longmapsto\phi+\eta`,
    geometry:
      "Rotate about z by η; equatorial phase changes while z populations stay fixed.",
    hamiltonian: String.raw`H_{\rm eff}=\frac{\hbar\Delta}2 Z,\quad\eta=\Delta t`,
    pulse:
      "Virtual frame update here. A real detuned evolution is a different physical implementation of the same ideal rotation.",
    hardware:
      "Controller phase reference; no microwave burst for this virtual gate.",
    reading:
      "The two basis amplitudes acquire opposite phases; their relative phase changes by η.",
    source: ["aaronson", "mckay"],
  },
  CNOT: {
    ...common,
    symbol: "CX",
    moments: [
      {
        end: 0.25,
        label: "01 · Change the target basis",
        reading:
          "A local Hadamard on the target creates a basis in which a conditional phase can act. Local operations alone cannot entangle an initially independent pair.",
      },
      {
        end: 0.75,
        label: "02 · Accumulate a conditional phase",
        reading:
          "The flux excursion changes the phase of the joint eleven amplitude relative to the other joint basis states. The joint probabilities can stay fixed while entanglement grows.",
      },
      {
        end: 1,
        label: "03 · Recombine the amplitudes",
        reading:
          "The final target Hadamard converts the conditional phase pattern into the logical controlled flip. For the Bell preparation, only the zero-zero and one-one amplitudes remain.",
      },
    ],
    operator: String.raw`\mathrm{CNOT}=\begin{bmatrix}1&0&0&0\\0&1&0&0\\0&0&0&1\\0&0&1&0\end{bmatrix}`,
    state: String.raw`\mathrm{CNOT}\lvert a,b\rangle=\lvert a,b\mathbin{\oplus}a\rangle`,
    geometry:
      "Conditional evolution can create entanglement; two separate Bloch spheres cannot encode the joint state.",
    hamiltonian: String.raw`\mathrm{CNOT}=(I\otimes H)\,\mathrm{CZ}\,(I\otimes H)`,
    pulse:
      "Target H, calibrated flux-CZ excursion, target H. Local phase compensation is assumed.",
    hardware:
      "XY target line plus a flux-tuning line and a fixed coupling bus. This is architecture dependent.",
    reading:
      "The first local bit controls whether the second local bit is flipped. The matrix uses order 00, 01, 10, 11.",
    limitation:
      "Assume tunable transmons coupled through a bus. The 11–02 avoided crossing generates conditional phase; higher-level dynamics, calibration, leakage, and crosstalk are not simulated.",
    source: ["aaronson", "dicarlo"],
  },
  CZ: {
    ...common,
    symbol: "CZ",
    operator: String.raw`\mathrm{CZ}=\begin{bmatrix}1&0&0&0\\0&1&0&0\\0&0&1&0\\0&0&0&-1\end{bmatrix}`,
    state: String.raw`\lvert11\rangle\longmapsto-\lvert11\rangle`,
    geometry:
      "Add a conditional π phase; joint amplitudes carry the information missing from local Bloch vectors.",
    hamiltonian: String.raw`H_{\rm int}(t)=\hbar\zeta(t)\lvert11\rangle\langle11\rvert,\quad\int\zeta(t)dt=\pi`,
    pulse:
      "Illustrative flux excursion changes the conditional energy; single-qubit dynamical phases are compensated.",
    hardware:
      "Flux line tunes a transmon near a coupled 11–02 avoided crossing. A bus mediates the interaction.",
    reading:
      "Only the joint one-one amplitude changes sign. This is an effective model after removing local phases.",
    limitation:
      "Representative DiCarlo-style mechanism, not a universal CZ pulse or a Rigetti specification. Nonadiabatic leakage and extra levels are omitted.",
    source: ["dicarlo", "kjaergaard"],
  },
  M: {
    ...common,
    symbol: "M",
    operator: String.raw`M_0=\lvert0\rangle\langle0\rvert,\quad M_1=\lvert1\rangle\langle1\rvert`,
    state: String.raw`\lvert\psi_m\rangle=\frac{M_m\lvert\psi\rangle}{\sqrt{\langle\psi\rvert M_m^\dagger M_m\lvert\psi\rangle}}`,
    geometry:
      "An ideal projective measurement yields an eigenstate on the measured axis. A conditional trajectory is different from an ensemble.",
    hamiltonian: String.raw`H_{\rm disp}/\hbar=(\omega_r+\chi Z)a^\dagger a+\frac{\omega_q}{2}Z`,
    pulse:
      "Readout pulse and acquisition window; the resonator response is amplified and digitized.",
    hardware:
      "Resonator → isolators → cryogenic gain → warm gain → ADC → I/Q classifier.",
    reading:
      "Project onto one basis state, divide by the square root of its probability, and record the result.",
    measurement:
      "Noisy Gaussian I/Q samples are classified at an adjustable threshold; repeated shots estimate outcome frequencies.",
    limitation:
      "Projective collapse is idealized. Dispersive Hamiltonian is approximate; classifier voltages are dimensionless and omit resonator dynamics and backaction.",
    source: ["blais", "aaronson"],
  },
};
export const concepts = [
  {
    id: "basis",
    title: "A · The computational basis",
    text: "A transmon’s lowest two energy eigenstates encode the basis. These labels are not literal classical values inside the circuit. Higher states exist and can receive leakage.",
    latex: String.raw`\lvert0\rangle=\begin{bmatrix}1\\0\end{bmatrix},\qquad\lvert1\rangle=\begin{bmatrix}0\\1\end{bmatrix}`,
    reading:
      "Zero and one are orthonormal column vectors. Entries are complex probability amplitudes.",
    symbols:
      "Basis kets are dimensionless; the energy diagram uses relative, schematic spacing.",
    kind: "Exact basis definition; physical encoding is approximate.",
    source: ["koch", "aaronson"],
  },
  {
    id: "state",
    title: "B · Amplitude, probability, phase",
    text: "Amplitude is complex; probability is its squared magnitude. Relative phase affects later interference. Multiplying every amplitude by the same phase changes no measurement probabilities in any basis.",
    latex: String.raw`\lvert\psi\rangle=\alpha\lvert0\rangle+\beta\lvert1\rangle=\cos\frac\theta2\lvert0\rangle+e^{i\phi}\sin\frac\theta2\lvert1\rangle,\quad |\alpha|^2+|\beta|^2=1`,
    reading:
      "A normalized pure qubit state has polar angle theta and relative phase phi, after choosing a global-phase convention.",
    symbols:
      "α, β: complex amplitudes; θ: polar angle; φ: relative phase; γ (control below): global phase. Angles in radians.",
    kind: "Exact for a pure two-level state. The controls show this state multiplied by exp(iγ).",
    source: ["aaronson"],
  },
  {
    id: "measurement",
    title: "C · Measurement and readout",
    text: "Readout sends a pulse to a resonator. Its state-dependent outgoing field is amplified, digitized into I/Q samples, and classified. No conscious observer is part of the mechanism.",
    latex: String.raw`P(0)=|\langle0\vert\psi\rangle|^2=|\alpha|^2,\qquad P(1)=|\langle1\vert\psi\rangle|^2=|\beta|^2`,
    reading:
      "The probability of a basis outcome is the squared magnitude of its overlap with the state.",
    symbols:
      "P: dimensionless probability; bra: conjugate-transpose of a ket; inner product: complex overlap. Physical I/Q values here use normalized voltage units.",
    kind: "Born rule exact in the model; readout clusters are an illustrative noise model.",
    source: ["aaronson", "blais"],
  },
  {
    id: "tensor",
    title: "D · Build the joint basis",
    text: "For each first-qubit basis state, append both second-qubit states. The ordered basis is 00, 01, 10, 11; q0 is always the leftmost, most significant bit.",
    latex: String.raw`\lvert00\rangle=\lvert0\rangle\otimes\lvert0\rangle=\begin{bmatrix}1\\0\\0\\0\end{bmatrix},\quad \lvert a\rangle\otimes\lvert b\rangle=\lvert ab\rangle`,
    reading:
      "The tensor product enumerates pairs of basis labels and multiplies their amplitudes.",
    symbols:
      "⊗: tensor product, not ordinary scalar multiplication; a,b ∈ {0,1}. All amplitudes are dimensionless.",
    kind: "Exact joint-basis definition.",
    source: ["aaronson"],
  },
  {
    id: "bell",
    title: "E · Correlations and entanglement",
    text: "The product state after H has amplitudes at 00 and 10. CNOT creates a Bell state with amplitudes at 00 and 11. Its coefficient matrix has nonzero determinant and cannot factor into two independent vectors.",
    latex: String.raw`\lvert00\rangle\xrightarrow{H\otimes I}\frac{\lvert00\rangle+\lvert10\rangle}{\sqrt2}\xrightarrow{\mathrm{CNOT}}\frac{\lvert00\rangle+\lvert11\rangle}{\sqrt2}`,
    reading:
      "Prepare the first qubit with Hadamard, then entangle it with a controlled-NOT.",
    symbols:
      "I: identity; Φ⁺: resulting Bell state; q0: control, q1: target. All operators and amplitudes dimensionless.",
    kind: "Exact ideal circuit; hardware decomposition is representative.",
    source: ["aaronson", "dicarlo"],
  },
  {
    id: "unitary",
    title: "F · Any one-qubit unitary",
    text: "Use the rightmost rotation first. The global phase is retained in the displayed amplitudes but never affects measurement statistics. This decomposition uses the Z–Y–Z convention.",
    latex: String.raw`U=e^{i\gamma}R_z(\alpha)R_y(\beta)R_z(\delta)`,
    reading:
      "Any two-by-two unitary is a global phase times three Euler rotations.",
    symbols:
      "α,β,δ: Euler rotation angles; γ: global phase, all in radians. α and β here are angles, unlike the amplitudes in lesson B.",
    kind: "Exact U(2) decomposition; virtual Z and calibrated XY pulses are representative.",
    source: ["aaronson", "mckay"],
  },
];
export const glossary = {
  superconductivity:
    "A low-temperature state supporting low-loss electrical currents; it does not eliminate every qubit loss mechanism.",
  transmon:
    "A Josephson-junction circuit with large capacitance and weakly unequal energy-level spacings.",
  resonator:
    "An electrical mode that responds strongly near a characteristic frequency and can carry state-dependent readout information.",
  coherence: "The persistence of phase relations required for interference.",
  relaxation:
    "Energy decay, often characterized by a population-decay time T₁.",
  attenuation:
    "Reduction of signal power, used in stages to reduce warm thermal noise.",
  thermalization:
    "Heat exchange that brings a component toward its anchoring stage’s temperature.",
  fidelity:
    "A specified measure of agreement with a target process or state; no device fidelity is estimated here.",
};
