// These deliberately isolated teaching models do not predict refrigerator performance.
const occupation = (temperature) =>
  1 / Math.expm1((6.62607015e-34 * 5e9) / (1.380649e-23 * temperature));
const thermal = (label, cause, nominal = 15, maximum = 300, unit = "mK") => ({
  label,
  cause,
  min: nominal,
  max: maximum,
  good: nominal,
  bad: maximum,
  unit,
  metric: "Thermal photon occupation at 5 GHz",
  equation: String.raw`\bar n=(e^{hf/(k_BT)}-1)^{-1}`,
  symbols:
    "n̄: mean photons in one equilibrium mode; h: Planck constant (J·s); f = 5 GHz; kB: Boltzmann constant (J/K); T: imposed mode temperature (K).",
  reading: "A warmer equilibrium microwave mode carries more thermal photons.",
  assumption:
    "Exact Bose occupation for an equilibrium mode. The selected temperature is an imposed scenario, not a prediction of heat flow or of qubit population.",
  value: (x) => occupation(unit === "K" ? x : x / 1000),
  format: (y) => (y < 0.001 ? y.toExponential(2) : y.toFixed(3)),
});
export const diagnostics = [
  {
    label: "Quasi-static detuning spread",
    unit: "MHz",
    min: 0,
    max: 10,
    good: 0,
    bad: 8,
    cause:
      "Model environmental pickup as a Gaussian spread of detunings, then average a Ramsey experiment.",
    metric: "Ramsey contrast after 40 ns",
    equation: String.raw`C=e^{-\frac12(2\pi\sigma_f\tau)^2}`,
    symbols:
      "C: ensemble coherence contrast; σf: standard deviation of static detuning (Hz); τ = 40 ns free evolution.",
    reading:
      "Different detunings accumulate different phases; averaging reduces contrast.",
    assumption:
      "Exact for Gaussian quasi-static detuning in an ideal Ramsey sequence. Mechanical vibration does not determine σf in this model.",
    value: (x) => Math.exp(-0.5 * (2 * Math.PI * x * 0.04) ** 2),
    format: (y) => (100 * y).toFixed(1) + "%",
  },
  thermal(
    "Imposed mode temperature",
    "A vacuum leak adds a heat-transfer path. Inspect the consequence of an assumed warmer microwave environment.",
  ),
  thermal(
    "Precool stage temperature",
    "The pulse tube must remove heat before dilution cooling can run. Inspect the microwave occupation of a warm stage.",
    4,
    50,
    "K",
  ),
  thermal(
    "Imposed mixing-stage temperature",
    "Bypassing intermediate heat interception increases cold-stage load. Set a hypothetical final temperature to inspect its consequence.",
  ),
  thermal(
    "Imposed mode temperature",
    "Radiation and unanchored cables add thermal load. This control explores a warmer mode, without claiming a heat-flow calculation.",
  ),
  thermal(
    "Effective input-noise temperature",
    "Staged attenuation thermalizes an incident field. Compare an assumed cold mode with a warmer input-noise mode.",
  ),
  {
    label: "I/Q noise standard deviation",
    unit: "normalized V",
    min: 0.15,
    max: 1.5,
    good: 0.3,
    bad: 1.2,
    cause:
      "Loss of useful first-stage gain worsens signal-to-noise ratio. Two equal-prior Gaussian I clusters have centers −1 and +1, with threshold zero.",
    metric: "Expected assignment error",
    equation: String.raw`P_{\rm err}=\tfrac12\operatorname{erfc}(1/(\sqrt2\sigma))`,
    symbols:
      "σ: standard deviation in normalized voltage; erfc: complementary error function. Equal priors, means ±1, threshold 0.",
    reading:
      "Wider voltage distributions cross the classification threshold more often.",
    assumption:
      "Gaussian discriminator model; omits relaxation, resonator dynamics, and amplifier saturation. Numerical Gaussian tail integral.",
    value: (x) => {
      let sum = 0;
      const from = 1 / x,
        dx = (12 - from) / 600;
      if (dx <= 0) return 0;
      for (let j = 0; j < 600; j++) {
        const z = from + (j + 0.5) * dx;
        sum += (Math.exp((-z * z) / 2) * dx) / Math.sqrt(2 * Math.PI);
      }
      return sum;
    },
    format: (y) => (100 * y).toFixed(2) + "%",
  },
  {
    label: "Parasitic frequency shift",
    unit: "MHz",
    min: 0,
    max: 20,
    good: 0,
    bad: 14,
    cause:
      "A package-induced shift can detune a previously calibrated drive. Compare a square π pulse with increasing frequency mismatch.",
    metric: "Population transfer P(1)",
    equation: String.raw`P(1)=\frac{\Omega^2}{\Omega^2+\Delta^2}\sin^2\!\left(\tfrac\tau2\sqrt{\Omega^2+\Delta^2}\right)`,
    symbols: "Ω = π/τ; τ = 40 ns; Δ = 2πδf. Ω,Δ: rad/s. Initial state is zero.",
    reading:
      "Detuning tilts the rotation axis and changes the transfer probability.",
    assumption:
      "Exact constant-drive evolution in the two-level rotating-wave model. Square diagnostic pulse; the computation lab uses Gaussian envelopes.",
    value: (x) => {
      const d = 2 * Math.PI * x * 0.04,
        r = Math.hypot(Math.PI, d);
      return (Math.PI / r) ** 2 * Math.sin(r / 2) ** 2;
    },
    format: (y) => (100 * y).toFixed(1) + "%",
  },
  {
    label: "Anharmonicity magnitude",
    unit: "MHz",
    min: 0,
    max: 300,
    good: 250,
    bad: 0,
    cause:
      "When neighboring transitions coincide, frequency selection cannot isolate a pair of energy levels. Inspect the spectral weight of a 10 ns square pulse at the adjacent transition.",
    metric: "Relative spectral power at adjacent transition",
    equation: String.raw`W(\alpha)=\operatorname{sinc}^2(\alpha\tau/2),\quad\operatorname{sinc}x=\sin x/x`,
    symbols:
      "α: angular-frequency separation between adjacent transitions (rad/s); τ = 10 ns. W is normalized spectral power, not leakage probability.",
    reading:
      "A longer pulse has a narrower spectrum; coincident transitions cannot be spectrally separated.",
    assumption:
      "Fourier transform of a rectangular envelope. Leakage also depends on matrix elements and multilevel dynamics, which this curve does not simulate.",
    value: (x) => {
      const a = Math.PI * x * 0.01;
      return a === 0 ? 1 : (Math.sin(a) / a) ** 2;
    },
    format: (y) => (100 * y).toFixed(1) + "%",
  },
  {
    label: "Phase-reference error",
    unit: "rad",
    min: 0,
    max: Math.PI,
    good: 0,
    bad: Math.PI / 2,
    cause:
      "A reference error rotates the phase between preparation and interference. Run H, a phase error Rz(φ), then H.",
    metric: "Unexpected one-state probability",
    equation: String.raw`P(1)=\sin^2(\phi/2)`,
    symbols:
      "φ: uncontrolled relative phase (rad); initial state zero; sequence H Rz(φ) H.",
    reading:
      "The second Hadamard converts a relative phase error into a population error.",
    assumption:
      "Exact ideal one-qubit interferometer. The source of the phase error is imposed, not derived from electronics.",
    value: (x) => Math.sin(x / 2) ** 2,
    format: (y) => (100 * y).toFixed(1) + "%",
  },
  {
    label: "π-pulse area scale",
    unit: "× nominal",
    min: 0,
    max: 1.5,
    good: 1,
    bad: 0.6,
    cause:
      "Keep the drive on resonance and scale its calibrated area. A smaller area stops the rotation early; excessive area overshoots.",
    metric: "Population transfer P(1)",
    equation: String.raw`P(1)=\sin^2(s\pi/2)`,
    symbols:
      "s: dimensionless pulse-area scale; intended angle π rad. Initial state zero.",
    reading:
      "On resonance with a fixed axis, integrated angular rate sets the rotation angle.",
    assumption:
      "Exact within the resonant two-level effective model. Omits leakage, drift, and waveform distortion.",
    value: (x) => Math.sin((x * Math.PI) / 2) ** 2,
    format: (y) => (100 * y).toFixed(1) + "%",
  },
  {
    label: "Independent shots",
    unit: "shots",
    min: 1,
    max: 4096,
    good: 4096,
    bad: 16,
    cause:
      "A single result cannot reveal a probability. Repeat independent Bernoulli measurements of an ideal half-populated state.",
    metric: "Standard deviation of estimated probability",
    equation: String.raw`\sigma_{\hat p}=\sqrt{p(1-p)/N},\quad p=1/2`,
    symbols:
      "p: true outcome probability; N: independent shots; p̂: sample frequency. Dimensionless.",
    reading:
      "Increasing the shot count reduces sampling uncertainty as one over the square root of N.",
    assumption:
      "Exact binomial standard deviation for independent shots. This is not a confidence interval and excludes systematic readout error.",
    value: (x) => 0.5 / Math.sqrt(x),
    format: (y) => (100 * y).toFixed(2) + " percentage points",
  },
];
export function diagnostic(stage, value) {
  if (
    !Number.isInteger(stage) ||
    !diagnostics[stage] ||
    !Number.isFinite(value)
  )
    throw new Error("Invalid diagnostic input");
  const model = diagnostics[stage],
    x = Math.max(model.min, Math.min(model.max, value));
  return { x, y: model.value(x), model };
}
