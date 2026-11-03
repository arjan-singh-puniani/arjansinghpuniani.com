import {
  c,
  add,
  mul,
  conj,
  abs2,
  initial,
  run,
  distribution,
  reduced,
  shots,
  pure,
  compile,
  compileSequence,
  interpolate,
  pulseArea,
  ensembleDensity,
} from "./simulator.js";
import { stages, operations, concepts, sources, glossary } from "./content.js";
import { diagnostics, diagnostic } from "./diagnostics.js";
import {
  amplitudeContributions,
  projectBloch,
  blochDepth,
  bellEvidence,
} from "./teaching.js";
import {
  runExact,
  preparedExact,
  calculation,
  ket as exactKet,
  angleTex,
} from "./exact.js";
import { createCalculation } from "./calculation.js";

const $ = (id) => document.getElementById(id);
const gateCalculation = createCalculation($("gate-calculation"), math);
const labels = [
  "Frame",
  "Vacuum",
  "Precool",
  "Stages",
  "Shields",
  "Control",
  "Readout",
  "Package",
  "Transmon",
  "Classical",
  "Calibrate",
  "Experiment",
];
const state = {
  chapter: "machine",
  stage: 0,
  installed: [],
  status: "intro",
  n: 2,
  basis: 0,
  prepared: false,
  circuit: [
    { name: "H", target: 0 },
    { name: "CNOT", control: 0, target: 1 },
  ],
  cursor: 0,
  fraction: 1,
  concept: "basis",
  playing: false,
  reduced: matchMedia("(prefers-reduced-motion:reduce)").matches,
  html: false,
  sound: false,
  rotate: false,
  explode: false,
  cutaway: true,
  labels: true,
  heat: false,
  noise: false,
  acquired: false,
  shotProgress: 1,
};
let scene,
  animation = 0,
  startTime = 0,
  audio,
  lastRender = 0,
  loadingScene,
  activeCalculation,
  liveContributions = [],
  defaultFlowOutput = 0;
const f = (x, d = 3) =>
  Math.abs(x) < 0.0005 ? "0" : Number(x.toFixed(d)).toString();
const bits = (j, n = state.n) => j.toString(2).padStart(n, "0");
const complex = (a) =>
  Math.abs(a[1]) < 1e-8
    ? f(a[0])
    : Math.abs(a[0]) < 1e-8
      ? `${f(a[1])}i`
      : `${f(a[0])}${a[1] < 0 ? "-" : "+"}${f(Math.abs(a[1]))}i`;
const matTex = (m) =>
  String.raw`\begin{bmatrix}${m.map((row) => row.map(complex).join("&")).join("\\\\")}\end{bmatrix}`;
const announce = (text) => {
  $("announcement").textContent = text;
};
const seed = () =>
  Math.max(0, Math.min(4294967295, Math.trunc(Number($("seed").value) || 0)));
function math(
  element,
  tex,
  reading = "",
  symbols = "",
  kind = "State-vector calculation.",
  connection = "Selected processor qubits and their control frame.",
) {
  if (
    state.playing &&
    state.fraction > 0 &&
    state.fraction < 1 &&
    element.closest("details:not([open])")
  )
    return;
  const signature = JSON.stringify([tex, reading, symbols, kind, connection]);
  if (element.dataset.mathSignature === signature) return;
  element.dataset.mathSignature = signature;
  element.tabIndex = 0;
  element.setAttribute("role", "group");
  element.setAttribute("aria-label", reading || "Mathematical equation");
  element.replaceChildren();
  tex = tex.replace(
    /\\lvert([01]+)\\rangle/g,
    (_, digits) =>
      "\\lvert" +
      digits
        .split("")
        .map(
          (d) =>
            "\\textcolor{" +
            (d === "0" ? "#6ca6f8" : "#efb45b") +
            "}{" +
            d +
            "}",
        )
        .join("") +
      "\\rangle",
  );
  const visual = document.createElement("div");
  visual.className = "math-visual";
  element.append(visual);
  if (window.katex) {
    window.katex.render(tex, visual, {
      displayMode: true,
      throwOnError: true,
      strict: "error",
      output: "htmlAndMathml",
      trust: false,
    });
    for (const token of visual.querySelectorAll(".katex-html span")) {
      if (token.children.length) continue;
      const tokenText = token.textContent.trim();
      const calculationMeaning = element.closest(".calculation-theatre")
        ? {
            a: "An input complex amplitude: the coefficient of this basis ket before the active gate. Dimensionless; its squared magnitude is the input basis probability.",
            b: "An output complex amplitude: the sum of the products in this matrix row. Dimensionless; it becomes the coefficient of this basis ket after the gate.",
            j: "The basis-state index, in binary order with q0 first.",
            H: "The Hadamard gate acting on the labeled qubit. It maps basis kets to equal-amplitude superpositions with the indicated signs.",
            I: "The identity on an unchanged qubit in the tensor product.",
            U: "The unitary acting on the input state. Its row entries multiply the matching input amplitudes to calculate an output amplitude.",
          }[tokenText]
        : null;
      const contextual =
        calculationMeaning ||
        (tokenText === "I" &&
        (tex.includes("I(t)") || tex.includes("I=\\Omega"))
          ? "The in-phase control envelope. Together with Q it sets the physical microwave amplitude and phase; the plot uses normalized units."
          : tokenText === "σ" && tex.includes("\\sigma_{\\phi")
            ? "The Pauli operator cos(φ)X + sin(φ)Y along an equatorial rotation axis; dimensionless."
            : null);
      const meaning =
        (typeof symbols === "object" ? symbols[tokenText] : null) ||
        contextual ||
        symbolMeanings[tokenText];
      if (
        tokenText === "i" &&
        !(typeof symbols === "object" && symbols.i?.includes("index"))
      )
        token.style.color = "var(--imag)";
      if (token.textContent.trim() === "φ") token.style.color = "var(--phase)";
      if (meaning) {
        token.title = meaning;
        token.dataset.meaning = meaning;
        token.onclick = () => {
          if ($("symbol-meaning")) $("symbol-meaning").textContent = meaning;
          $("inspected-symbol").textContent = tokenText;
          $("inspected-meaning").textContent = meaning;
          $("symbol-inspector").hidden = false;
          announce(meaning);
        };
      }
    }
  } else {
    visual.textContent = reading;
    visual.setAttribute("role", "math");
  }
  element.dataset.model = `${kind} ${connection}`;
  for (const [cls, text] of [
    ["math-reading", reading],
    ["math-symbols", symbols],
  ])
    if (text) {
      const p = document.createElement("p");
      p.className = `caption ${cls}`;
      p.textContent =
        typeof text === "object"
          ? Object.entries(text)
              .map(([symbol, definition]) => `${symbol}: ${definition}`)
              .join("; ")
          : text;
      if (cls === "math-symbols" || cls === "math-status") {
        let detail = element.querySelector(".math-definitions");
        if (!detail) {
          detail = document.createElement("details");
          detail.className = "math-definitions";
          const summary = document.createElement("summary");
          summary.textContent = "Symbols";
          detail.append(summary);
          element.append(detail);
        }
        detail.append(p);
      } else element.append(p);
    }
}
function citations(ids) {
  return ids
    .map((id) => {
      const s = sources.find((x) => x.id === id);
      return `<a class="source-link" href="${s.url}" target="_blank" rel="noreferrer">${s.title.split(" · ")[0]} ↗</a>`;
    })
    .join(" · ");
}
function save() {
  try {
    localStorage.setItem(
      "quantum-assembly-v2",
      JSON.stringify({
        stage: state.stage,
        installed: state.installed,
        status: state.status === "intro" ? "intro" : "stepReady",
        reduced: state.reduced,
      }),
    );
  } catch {
    /* Storage is optional in private and sandboxed browsers. */
  }
}
try {
  const s = JSON.parse(localStorage.getItem("quantum-assembly-v2"));
  if (
    s &&
    Number.isInteger(s.stage) &&
    s.stage >= 0 &&
    s.stage < 12 &&
    Array.isArray(s.installed) &&
    s.installed.every((i) => Number.isInteger(i) && i >= 0 && i < 12)
  ) {
    state.stage = s.stage;
    state.installed = [...new Set(s.installed)];
    state.status = s.status === "intro" ? "intro" : "stepReady";
    state.reduced = state.reduced || s.reduced === true;
  }
} catch {
  /* A missing or invalid local snapshot starts a fresh build. */
}
function syncScene() {
  for (const id of ["rotate", "explode", "cutaway", "labels", "heat", "noise"])
    $(id).setAttribute("aria-pressed", state[id]);
  const close =
    state.focus === "processor" ||
    (state.chapter === "machine" &&
      state.status !== "intro" &&
      [7, 8].includes(state.stage));
  $("temperature-ruler").hidden = close;
  document.querySelector(".label-warm").hidden = close;
  if (close)
    $("scene-status").textContent =
      scene && !state.html
        ? "PROCESSOR CLOSE-UP · DIAGRAMMATIC CIRCUIT SCALE"
        : "HARDWARE OVERVIEW · PROCESSOR CONTROL";
  else if ($("scene-status").textContent.includes("PROCESSOR CLOSE-UP"))
    $("scene-status").textContent =
      "SUPERCONDUCTING QUANTUM COMPUTER · CUTAWAY";
  renderHardware();
  scene?.update({
    ...state,
    intro: state.status === "intro",
    compute: state.chapter === "compute",
    operation: activeOperation(),
    nativeSegment: nativeSegment(),
    pulseIntensity: pulseIntensity(),
  });
}
function renderHardware() {
  const op = activeOperation(),
    readout = op?.name === "M",
    frame = op && compile(op).every((p) => p.kind === "frame");
  const flux = nativeSegment()?.kind === "flux";
  const input = flux
    ? [
        "Controller",
        "Flux DAC",
        "Bias waveform",
        "Flux coax",
        "Thermal anchors",
        "Low-pass filters",
        "Flux tuning line",
        "Transmon + bus",
      ]
    : [
        "Controller",
        "DAC",
        "Microwave I/Q + LO",
        "Coaxial cable",
        "Thermal anchors",
        "Attenuation + filters",
        "XY control line",
        "Transmon",
      ];
  const output = [
    "Readout resonator",
    "Isolation",
    "Cryogenic gain",
    "Warm amplification",
    "ADC",
    "I/Q classifier",
  ];
  $("hardware-signal-path").innerHTML =
    `<p>05 / HARDWARE · ${frame ? "VIRTUAL FRAME UPDATE: SOFTWARE REGISTER, NO XY BURST" : readout ? "READOUT: STATE-DEPENDENT RESPONSE RETURNS TO THE CONTROLLER" : op?.name === "CZ" || op?.name === "CNOT" ? "XY DRIVE + FLUX-TUNING LINE + COUPLING BUS" : "CONTROL DESCENDS FROM 300 K TO THE MILLIKELVIN PROCESSOR"} · TEMPERATURE RULER IS LOGARITHMIC (300 K TO 15 mK: ≈4.3 ORDERS)</p><div class="signal-nodes" tabindex="0" role="region" aria-label="Scrollable input and readout component chain">${[...input, ...output].map((name, i) => `<span class="${i >= 8 ? "return" : ""} ${op && ((frame && i === 0) || (readout && i >= 8) || (!readout && !frame && i < 8)) ? "active" : ""}">${name}</span>${i === 13 ? "" : '<i aria-hidden="true">→</i>'}`).join("")}</div>`;
}
function activeNative() {
  const ops = state.acquired
    ? [
        ...state.circuit.slice(0, state.cursor),
        ...basisOperations(),
        { name: "M", target: 0 },
      ]
    : state.circuit.slice(0, state.cursor);
  const rows = compileSequence(ops).filter((p) => p.step === ops.length - 1);
  return rows.every((p) => p.kind === "frame")
    ? rows.map((p) => ({
        ...p,
        frame: p.frame - p.angle * (1 - state.fraction),
        angle: p.angle * state.fraction,
      }))
    : rows;
}
function nativeSegment(pulses = activeNative()) {
  const total = pulses.reduce((sum, p) => sum + p.duration, 0);
  let elapsed = state.fraction * total;
  for (const p of pulses) {
    if (!p.duration) continue;
    if (elapsed <= p.duration) return { ...p, fraction: elapsed / p.duration };
    elapsed -= p.duration;
  }
  return null;
}
let lastCarrierKey = "";
function renderCarrier() {
  const p = nativeSegment();
  const key = JSON.stringify([
    p?.kind,
    p?.angle,
    p?.phase,
    p?.frame,
    $("drive-frequency").value,
    $("pulse-scale").value,
  ]);
  if (key === lastCarrierKey) return;
  lastCarrierKey = key;
  if (!p || p.kind !== "drive") {
    $("carrier").innerHTML =
      '<p class="caption">Phase reference update. The next XY pulse uses the new controller frame.</p>';
    return;
  }
  const frequency = Number($("drive-frequency").value),
    amplitude = (Number($("pulse-scale").value) * p.angle) / Math.PI;
  const points = Array.from({ length: 500 }, (_, k) => {
    const t = (k / 499) * 0.8;
    return `${35 + (k / 499) * 430},${80 - Math.cos(-2 * Math.PI * frequency * t + p.phase) * amplitude * 35}`;
  }).join(" ");
  $("carrier").innerHTML =
    `<svg viewBox="0 0 500 130" role="img" aria-label="Physical microwave carrier at ${frequency} GHz, in a 0.8 nanosecond magnified window"><path d="M35 80H465" stroke="#4c5a47"/><polyline points="${points}" fill="none" stroke="#62b1ff" stroke-width="1.5"/><g fill="#b0b9ae" font-family="Arial" font-size="14"><text x="35" y="20">Physical carrier · magnified window</text><text x="35" y="121">0 ns</text><text x="425" y="121">0.8 ns</text></g></svg><p class="caption">At the envelope’s center. f = ${frequency.toFixed(3)} GHz; signed ωd = −2πf; hardware carrier phase ${f(p.phase)} rad; tracked frame ${f(p.frame)} rad; logical-axis phase ${f(p.logicalPhase)} rad. A device-specific calibration converts normalized amplitude to volts. Virtual Z updates change the reference for later pulses.</p>`;
}
async function loadScene() {
  if (loadingScene) return loadingScene;
  if (state.html || navigator.connection?.saveData) return;
  loadingScene = (async () => {
    try {
      const { createScene } = await import("./scene.js");
      scene = createScene($("webgl-host"), place);
      syncScene();
    } catch {
      $("render-mode").textContent = "HTML CUTAWAY · 3D UNAVAILABLE";
      $("scene-note").textContent =
        "All assembly steps and calculations remain available below.";
    }
  })();
  return loadingScene;
}
function clickSound() {
  if (!state.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(280, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(130, audio.currentTime + 0.08);
    gain.gain.setValueAtTime(0.045, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.1);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.11);
  } catch {
    state.sound = false;
    $("sound").textContent = "Sound unavailable";
  }
}
function renderAssembly() {
  const s = stages[state.stage],
    installed = state.installed.includes(state.stage),
    intro = state.status === "intro";
  $("assembly-panel").innerHTML =
    `<div class="step-meta"><span>${intro ? "ASSEMBLY OVERVIEW" : `MODULE ${String(state.stage + 1).padStart(2, "0")} / 12`}</span><span>${s.temperature}</span></div><span class="step-number">${intro ? "01" : String(state.stage + 1).padStart(2, "0")}</span><h2>${intro ? "Cryostat and control system" : s.title}</h2><p class="lede">${intro ? "Assemble the hardware used to control and measure superconducting qubits." : s.short}</p>${intro ? `<p>The twelve modules cover mechanical support, cooling, microwave control, and readout. Each includes a subsystem model.</p><div class="machine-facts"><div><strong>12</strong><span>CONNECTED SYSTEMS</span></div><div><strong>15<small> mK</small></strong><span>BASE TEMPERATURE</span></div><div><strong>01</strong><span>SHARED SIMULATION</span></div></div>` : s.why.map((p) => `<p>${p}</p>`).join("")}<button id="place-part" class="primary">${intro ? "Begin assembly" : installed ? "Part installed ✓" : state.stage >= 10 ? "Run subsystem test" : `Install ${s.part.toLowerCase()}`} <span>↘</span></button><div class="execution-controls"><button id="stage-back" ${state.stage === 0 ? "disabled" : ""}>← Back</button><button id="stage-next" ${!installed && !intro ? "disabled" : ""}>${state.stage === 11 ? "Open computation ↗" : "Next module →"}</button></div><details><summary>Why this part exists · technical detail</summary><p>${s.detail}</p><p>${citations(s.source)}</p></details><details><summary>What fails without it?</summary><p>${s.failure}</p><button id="failure-demo">${state.noise ? "Restore subsystem" : "Demonstrate failure"}</button></details><section class="subsystem-diagnostic" aria-label="Interactive subsystem diagnostic"><div class="diagnostic-heading"><span>SUBSYSTEM BENCH</span><span id="diagnostic-condition">NOMINAL</span></div><p id="diagnostic-cause"></p><div id="diagnostic-chart"></div><label id="diagnostic-label" for="diagnostic-input"></label><input id="diagnostic-input" type="range"><output id="diagnostic-input-value" for="diagnostic-input"></output><div class="diagnostic-result"><span id="diagnostic-metric"></span><strong id="diagnostic-value"></strong></div><details><summary>Equation & parameters</summary><div id="diagnostic-equation" class="equation"></div></details></section><p id="build-test" class="caption" role="status">${installed ? s.test : intro ? "Choose Begin assembly, or inspect the complete machine." : "The lifted part is ready to seat in its highlighted target."}</p>`;
  $("assembly-panel").classList.toggle("assembly-intro", intro);
  $("place-part").onclick = place;
  $("stage-back").onclick = () => stageTo(state.stage - 1);
  $("stage-next").onclick = () =>
    state.stage === 11 ? chapter("compute") : stageTo(state.stage + 1);
  $("failure-demo").onclick = () => {
    state.status = state.noise ? "stepReady" : "failed";
    state.noise = !state.noise;
    state.heat = state.noise && [1, 2, 3, 4, 5].includes(state.stage);
    const model = diagnostics[state.stage];
    $("diagnostic-input").value = state.noise ? model.bad : model.good;
    renderDiagnostic();
    syncScene();
    $("build-test").textContent = state.noise ? s.failure : s.test;
    $("failure-demo").textContent = state.noise
      ? "Restore subsystem"
      : "Demonstrate failure";
  };
  const model = diagnostics[state.stage];
  Object.assign($("diagnostic-input"), {
    min: model.min,
    max: model.max,
    step: state.stage === 11 ? 1 : (model.max - model.min) / 200,
    value: model.good,
  });
  $("diagnostic-input").oninput = () => {
    renderDiagnostic();
    syncScene();
  };
  renderDiagnostic();
  $("stage-rail").innerHTML = stages
    .map(
      (s, i) =>
        `<button data-stage="${i}" class="${i === state.stage ? "active " : ""}${state.installed.includes(i) ? "installed" : ""}" aria-label="Module ${i + 1}: ${s.part}${state.installed.includes(i) ? ", installed" : ""}" ${i === state.stage ? 'aria-current="step"' : ""}><b>${String(i + 1).padStart(2, "0")}${state.installed.includes(i) ? " ✓" : ""}</b><small>${labels[i]}</small></button>`,
    )
    .join("");
  $("stage-rail")
    .querySelectorAll("button")
    .forEach((b) => (b.onclick = () => stageTo(Number(b.dataset.stage))));
  $("progress-text").textContent = `${state.installed.length} / 12 INSTALLED`;
  $("begin").textContent = intro
    ? "Begin assembly ↗"
    : state.installed.length === 12
      ? "Open computation ↗"
      : "Continue assembly ↗";
  $("scene-note").textContent = intro
    ? "Five thermal stages. One protected quantum state."
    : `${s.part} · ${installed ? "installed" : "lifted above highlighted target"}`;
  syncScene();
}
function renderDiagnostic() {
  const { x, y, model } = diagnostic(
    state.stage,
    Number($("diagnostic-input").value),
  );
  state.diagnostic = {
    stage: state.stage,
    x,
    y,
    severity: Math.min(
      1,
      Math.abs(x - model.good) /
        Math.max(1e-9, Math.abs(model.bad - model.good)),
    ),
  };
  $("diagnostic-cause").textContent = model.cause;
  $("diagnostic-label").textContent = model.label;
  $("diagnostic-input-value").textContent = `${f(x, 2)} ${model.unit}`;
  $("diagnostic-metric").textContent = model.metric;
  $("diagnostic-value").textContent = model.format(y);
  $("diagnostic-condition").textContent =
    state.diagnostic.severity > 0.02 ? "IMPOSED SCENARIO" : "NOMINAL SCENARIO";
  const values = Array.from({ length: 101 }, (_, j) =>
    model.value(model.min + ((model.max - model.min) * j) / 100),
  );
  const max = Math.max(...values, 1e-8),
    px = 22 + (256 * (x - model.min)) / (model.max - model.min),
    py = 108 - (85 * y) / max;
  $("diagnostic-chart").innerHTML =
    `<svg viewBox="0 0 300 136" role="img" aria-label="${model.metric} as ${model.label} changes. Selected value ${model.format(y)}."><path d="M22 20V108H278" fill="none" stroke="#4d5d4c"/><polyline points="${values.map((v, j) => `${22 + (256 * j) / 100},${108 - (85 * v) / max}`).join(" ")}" fill="none" stroke="#71d1d9" stroke-width="2"/><path d="M${px} 20V108" stroke="#d08b85" stroke-dasharray="3 3"/><circle cx="${px}" cy="${py}" r="4" fill="#f0eee5"/><g fill="#b0b9ae" font-size="10" font-family="Arial"><text x="22" y="130">${model.min} ${model.unit}</text><text x="278" y="130" text-anchor="end">${f(model.max, 2)} ${model.unit}</text></g></svg>`;
  math(
    $("diagnostic-equation"),
    model.equation,
    model.reading,
    model.symbols,
    model.assumption,
    stages[state.stage].part +
      ". This bench is separate from the ideal circuit simulator.",
  );
}
function stageTo(i) {
  stop();
  state.focus = null;
  state.stage = Math.max(0, Math.min(11, i));
  state.status = "stepReady";
  state.noise = false;
  state.heat = false;
  save();
  renderAssembly();
  announce(`Module ${state.stage + 1}. ${stages[state.stage].short}`);
}
function place() {
  if (state.status === "intro") {
    state.status = "stepReady";
    renderAssembly();
    save();
    return;
  }
  if (state.installed.includes(state.stage)) return;
  state.status = "snapping";
  state.installed.push(state.stage);
  clickSound();
  state.status = state.installed.length === 12 ? "complete" : "assembled";
  save();
  renderAssembly();
  announce(
    `${stages[state.stage].part} installed. ${stages[state.stage].test}`,
  );
  if (state.stage >= 10)
    scene?.trigger(state.stage === 11 ? "readout" : "drive");
}
function chapter(name) {
  stop();
  state.chapter = name;
  state.focus = name === "compute" ? "processor" : null;
  document.body.classList.toggle("compute-mode", name === "compute");
  $("computation").hidden = name !== "compute";
  $("assembly-bottom").hidden = name === "compute";
  $("assembly-panel").hidden = name === "compute";
  $("operation-panel").hidden = name !== "compute";
  $("machine-tab").setAttribute("aria-pressed", name === "machine");
  $("compute-tab").setAttribute("aria-pressed", name === "compute");
  $("chapter-label").textContent =
    name === "machine" ? "HARDWARE ASSEMBLY" : "QUANTUM OPERATIONS";
  $("experience-title").textContent =
    name === "machine"
      ? "Superconducting quantum computer"
      : "From microwave pulse to quantum computation";
  $("opening").textContent =
    name === "machine"
      ? "Assemble the cryogenic stages, control lines, processor, and readout chain."
      : "Inspect gate matrices, state evolution, control pulses, and measurement statistics.";
  if (name === "compute") {
    if (state.cursor === 0 && state.circuit.length) {
      state.cursor = 1;
      state.fraction = 1;
    }
    $("hardware-dock").append($("viewport"));
    $("operation-dock").append($("operation-panel"));
    $("signal-chain-dock").append($("hardware-signal-path"));
    if (state.status === "failed") {
      state.noise = false;
      state.heat = false;
    }
    state.status = "freeExplore";
    renderQuantum();
  } else {
    gateCalculation.cancel();
    document.querySelector(".machine-layout").prepend($("viewport"));
    $("lesson").append($("operation-panel"));
    document.querySelector(".machine-layout").after($("hardware-signal-path"));
    renderAssembly();
  }
  syncScene();
  if (name === "compute")
    requestAnimationFrame(() =>
      $("coherent-stage").scrollIntoView({
        block: "start",
        behavior: state.reduced ? "auto" : "smooth",
      }),
    );
}
function activeOperation() {
  return state.acquired
    ? { name: "M", target: 0 }
    : state.cursor > 0
      ? state.circuit[state.cursor - 1]
      : null;
}
function startState() {
  return state.prepared
    ? pure(
        Number($("theta").value),
        Number($("phi").value),
        Number($("gamma").value),
      )
    : initial(state.n, state.basis);
}
function exactRegister(steps, tail = []) {
  const start = state.prepared
    ? preparedExact(
        Number($("theta").value),
        Number($("phi").value),
        Number($("gamma").value),
      )
    : undefined;
  return runExact(
    state.n,
    state.basis,
    [...state.circuit.slice(0, steps), ...tail],
    start,
  );
}
function fractional(before, op, t) {
  return interpolate(before, op, t);
}
function current() {
  if (state.acquired)
    return run(
      startState(),
      [
        ...state.circuit.slice(0, state.cursor),
        ...basisOperations(),
        ...Array.from({ length: state.n }, (_, q) => ({
          name: "M",
          target: q,
        })),
      ],
      undefined,
      seed(),
    );
  if (state.cursor === 0)
    return { state: startState(), history: [startState()], results: [] };
  const prefix = run(startState(), state.circuit, state.cursor - 1, seed());
  const full = run(startState(), state.circuit, state.cursor, seed());
  const s =
    state.fraction < 1
      ? fractional(prefix.state, activeOperation(), state.fraction)
      : full.state;
  return {
    ...full,
    state: s,
    results: state.fraction < 1 ? prefix.results : full.results,
    history: [...prefix.history, s],
  };
}
function rebuildSelectors() {
  const crossBasis = $("measurement-basis").querySelector('[value="XY"]');
  crossBasis.disabled = state.n !== 2;
  if (crossBasis.disabled && $("measurement-basis").value === "XY")
    $("measurement-basis").value = "Z";
  $("qubits").value = state.n;
  $("initial-basis").innerHTML = Array.from(
    { length: 2 ** state.n },
    (_, j) => `<option value="${j}">Basis ${bits(j)}</option>`,
  ).join("");
  $("initial-basis").value = state.basis;
  for (const id of ["gate-target", "gate-control"]) {
    $(id).innerHTML = Array.from(
      { length: state.n },
      (_, j) => `<option value="${j}">q${j}</option>`,
    ).join("");
  }
  $("gate-target").value = state.n > 1 ? 1 : 0;
  $("gate-control").value = 0;
  updateBuilder();
}
function updateBuilder() {
  const controlled = ["CNOT", "CZ"].includes($("gate-select").value);
  $("gate-control").disabled = !controlled;
  $("gate-angle").disabled = !["Rx", "Ry", "Rz"].includes(
    $("gate-select").value,
  );
  $("gate-angle-value").textContent =
    `${Number($("gate-angle").value).toFixed(3)} rad`;
}
let lastCircuitKey = "";
function renderCircuit() {
  $("execution-scrub").value = state.fraction;
  $("execution-scrub").disabled = state.cursor === 0 || state.acquired;
  $("execution-label").textContent =
    `${state.cursor} / ${state.circuit.length} · ${state.fraction === 1 ? "EXACT STEP" : `${Math.round(state.fraction * 100)}% EVOLUTION`}`;
  const circuitKey = JSON.stringify([
    state.circuit,
    state.n,
    state.basis,
    state.prepared,
    state.cursor,
    state.acquired,
    $("measurement-basis").value,
  ]);
  if (circuitKey === lastCircuitKey) return;
  lastCircuitKey = circuitKey;
  $("circuit").innerHTML = Array.from(
    { length: state.n },
    (_, q) =>
      `<div class="wire-row"><span class="wire-label">q${q} · ${state.prepared ? "ψ" : bits(state.basis)[q]}</span>${state.circuit
        .map((op, i) => {
          const involved =
            q === op.target ||
            (["CNOT", "CZ"].includes(op.name) && q === op.control);
          const connecting =
            ["CNOT", "CZ"].includes(op.name) &&
            q === Math.min(op.target, op.control);
          return `<div class="wire-gate ${i < state.cursor ? "executed" : ""} ${i === state.cursor - 1 ? "current" : ""}">${connecting ? `<i class="connector" style="height:${Math.abs(op.target - op.control) * 43}px" aria-hidden="true"></i>` : ""}${involved ? `<button data-step="${i + 1}" aria-label="Inspect step ${i + 1}: ${op.name} on q${op.target}${op.control !== undefined ? `, controlled by q${op.control}` : ""}" class="${q === op.control ? "control-dot" : ""} ${op.name === "M" ? "classical" : ""}" ${i === state.cursor - 1 ? 'aria-current="step"' : ""}>${q === op.control ? "●" : op.name === "CNOT" ? "⊕" : op.name}</button>` : ""}</div>`;
        })
        .join(
          "",
        )}<div class="wire-gate"><span class="caption">${measurementAxis(q) === "Z" ? "" : measurementAxis(q) === "X" ? "H" : "S† H"}</span></div><div class="wire-gate ${state.acquired ? "current" : ""}"><button class="acquire-icon" aria-label="Acquire terminal measurement on all qubits">M</button></div><span class="quiet" style="margin-left:20px">══ c${q}</span></div>`,
  ).join("");
  $("coherent-circuit").innerHTML =
    `<span>CIRCUIT</span>${state.circuit.map((op, i) => `<button data-step="${i + 1}" aria-label="Select step ${i + 1}: ${op.name}, target q${op.target}" aria-current="${i === state.cursor - 1 && !state.acquired ? "step" : "false"}">${op.name}<small>${op.control === undefined ? `q${op.target}` : `q${op.control} → q${op.target}`}</small></button>`).join('<i aria-hidden="true">→</i>')}<i aria-hidden="true">→</i><button class="acquire-icon" aria-current="${state.acquired ? "step" : "false"}" aria-label="Measure the register">M</button>`;
  const edit = document.createElement("button");
  edit.textContent = "Edit ↗";
  edit.onclick = () => {
    $("circuit-tools").open = true;
    $("circuit-tools").scrollIntoView({
      block: "start",
      behavior: state.reduced ? "auto" : "smooth",
    });
  };
  $("coherent-circuit").append(edit);
  document
    .querySelectorAll("#circuit [data-step], #coherent-circuit [data-step]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          stop();
          state.cursor = Number(b.dataset.step);
          state.fraction = 1;
          const selected = state.circuit[state.cursor - 1];
          if (["Rx", "Ry", "Rz"].includes(selected.name)) {
            $("gate-select").value = selected.name;
            $("gate-angle").value = selected.angle;
            updateBuilder();
          }
          state.acquired = false;
          renderQuantum();
          triggerActive();
        }),
    );
  document
    .querySelectorAll("#circuit .acquire-icon, #coherent-circuit .acquire-icon")
    .forEach((b) => (b.onclick = acquire));
  $("previous-step").disabled = state.cursor === 0;
  $("next-step").disabled = state.cursor === state.circuit.length;
  $("undo-gate").disabled = !state.circuit.length;
  let time = 0;
  const logical = [
    ...state.circuit,
    ...basisOperations(),
    ...Array.from({ length: state.n }, (_, q) => ({ name: "M", target: q })),
  ];
  $("compilation").innerHTML =
    compileSequence(logical)
      .map((p) => {
        const from = time;
        time += p.duration;
        const op = logical[p.step];
        return `<div class="compile-row ${p.step === state.cursor - 1 ? "current" : ""}"><strong>${from}–${time} ns</strong><span>${op.name} · q${p.target} · ${p.kind}${p.kind === "drive" ? ` ${p.axis} (${f(p.angle)} rad), hardware phase ${f(p.phase)} rad, frame ${f(p.frame)} rad` : p.kind === "frame" ? ` (${f(p.angle)} rad; zero-duration reference update)` : p.kind === "flux" ? " · conditional phase π" : ""}</span></div>`;
      })
      .join("") +
    '<p class="caption">Chronological order. Hardware pulse phase equals logical axis phase minus the accumulated software frame. Pauli and H compilations agree up to global phase. </p>';
}
let lastOperationKey = "";
function renderOperation() {
  const op = activeOperation(),
    key = JSON.stringify(op);
  if (key === lastOperationKey && $("operation-panel").children.length) return;
  lastOperationKey = key;
  const lesson = op ? operations[op.name] : null;
  $("operation-panel").innerHTML =
    `<div class="step-meta"><span>${op ? `ACTIVE / ${op.name}` : "INITIALIZATION"}</span><span>REGISTER STATE</span></div><h2>${op ? `${op.name} operation` : "Register initialization"}</h2><p class="lede">${lesson ? lesson.reading : "Advance the Bell experiment or select a gate in the circuit. The matrix, amplitudes, geometry, waveform, and physical signal path follow the same execution cursor."}</p><div id="active-operator" class="equation"></div>${lesson ? `<dl class="op-layers"><dt>Geometry</dt><dd>${lesson.geometry}</dd><dt>Pulse</dt><dd>${lesson.pulse}</dd><dt>Hardware</dt><dd>${lesson.hardware}</dd><dt>Measurement</dt><dd>${lesson.measurement}</dd></dl><details><summary>State transformation & generator</summary><div id="gate-state" class="equation"></div><div id="gate-generator" class="equation"></div><p>${citations(lesson.source)}</p></details>` : "<p>Initialize the selected computational energy levels.</p>"}`;
  if (lesson) {
    math(
      $("active-operator"),
      lesson.operator,
      `Circuit symbol ${op.name}; exact operator in the ordered local basis.`,
      op.name === "M"
        ? "Mₘ: projector for outcome m ∈ {0,1}."
        : `i² = −1; η = ${f(op.angle ?? Math.PI / 2)} radians for adjustable rotations. Matrix entries are dimensionless.`,
      "Exact ideal operator.",
      lesson.hardware,
    );
    math(
      $("gate-state"),
      lesson.state,
      lesson.reading,
      "α,β: amplitudes unless explicitly defined as Euler angles; c,s: cosine and sine of half the rotation angle.",
      "Exact ideal transformation.",
      lesson.hardware,
    );
    math(
      $("gate-generator"),
      lesson.hamiltonian,
      `Generator or decomposition of ${op.name}. Rightmost operators act first.`,
      "ℏ: reduced Planck constant (J·s); an indexed H is a Hamiltonian in joules, while unindexed H in a gate decomposition is Hadamard. Ω, Δ, ζ, χ, ωq, ωr: angular rates (rad/s); ωr is the resonator frequency and χ its dispersive shift. a removes a resonator photon; a†a counts photons. t: seconds; η: radians; X,Y,Z: Pauli operators; I: identity.",
      "Effective Hamiltonian is approximate; operator identities are exact.",
      lesson.hardware,
    );
  }
}
function renderState(result) {
  const s = result.state,
    norm = s.reduce((sum, a) => sum + abs2(a), 0);
  $("norm").textContent = `Σ |a|² = ${norm.toFixed(6)}`;
  math(
    $("state-ket"),
    String.raw`\lvert\psi\rangle=${!state.acquired && state.fraction === 1 && exactRegister(state.cursor) ? exactKet(exactRegister(state.cursor), state.n) : ketTex(s)}`,
    "Read each coefficient as the complex amplitude of its basis state.",
    "ψ: current trajectory; basis order is q0 first. Gate endpoints retain exact fractions and radicals; pulse evolution is evaluated numerically.",
    "Exact simulation, rounded display.",
    "Computational levels of the selected transmons.",
  );
  const reference = s.findIndex((a) => abs2(a) > 1e-10),
    referencePhase = Math.atan2(s[reference][1], s[reference][0]);
  $("amplitudes").innerHTML = s
    .map((a, j) => {
      const p = abs2(a),
        one = j === s.length - 1;
      const delta = Math.atan2(a[1], a[0]) - referencePhase,
        relative = Math.atan2(Math.sin(delta), Math.cos(delta));
      return `<div class="amp-row"><span class="basis ${one ? "one" : ""}">${bits(j)}</span><svg class="amplitude-plane" viewBox="0 0 44 44" role="img" aria-label="Complex amplitude for ${bits(j)}: real ${f(a[0])}, imaginary ${f(a[1])}. Global phase rotates all these arrows together."><circle cx="22" cy="22" r="17" fill="#111913" stroke="#3b4a3c"/><path d="M4 22H40" stroke="#71d1d9" stroke-width=".6"/><path d="M22 4V40" stroke="#ba9be9" stroke-width=".6"/><path d="M22 22L${22 + 17 * a[0]} ${22 - 17 * a[1]}" stroke="#e68ec9" stroke-width="1.5"/><circle cx="${22 + 17 * a[0]}" cy="${22 - 17 * a[1]}" r="1.8" fill="#f0eee5"/></svg><div><div class="amp-track"><i class="${one ? "one" : ""}" style="width:${p * 100}%"></i></div><span>${(p * 100).toFixed(2)}%</span></div><div class="amp-numbers"><span class="real">${f(a[0])}</span> <span class="imaginary">${a[1] < 0 ? "−" : "+"} ${f(Math.abs(a[1]))}i</span><br><span class="phase">Δφ ${p < 1e-10 ? "undefined" : `${f(relative)} rad`}</span></div></div>`;
    })
    .join("");
  math(
    $("state-vector"),
    String.raw`\lvert\psi\rangle=${matTex(s.map((a) => [a]))}`,
    "The same amplitudes, arranged as a complex column vector.",
    "Row j corresponds to the binary basis label j; amplitudes are dimensionless.",
    "Exact simulation, rounded display.",
    "Computational subspace.",
  );
  const rho = s.map((a) => s.map((b) => mul(a, conj(b))));
  math(
    $("density"),
    String.raw`\rho=\lvert\psi\rangle\langle\psi\rvert=${matTex(rho)}`,
    "The outer product of the ket with its conjugate transpose gives the density operator.",
    "ρ: density operator; diagonal entries are probabilities; off-diagonal entries encode coherence.",
    "Exact conditional pure state, rounded display.",
    "Selected transmon register.",
  );
  $("measurement-record").innerHTML = result.results.length
    ? `<p class="callout">Conditional projective record (seed ${seed()}): ${result.results.map((r) => `q${r.target} → ${r.outcome}`).join(", ")}. The histogram replays the ensemble, rather than treating this single trajectory as the whole experiment.</p>`
    : "";
}
const project = projectBloch;
function blochSVG(v, trajectory, q, axis) {
  const grids = [-0.6, 0, 0.6].map((z) =>
    Array.from({ length: 65 }, (_, j) => {
      const radius = Math.sqrt(1 - z * z),
        angle = (j * Math.PI) / 32;
      return [radius * Math.cos(angle), radius * Math.sin(angle), z];
    }),
  );
  for (const longitude of [0, Math.PI / 2])
    grids.push(
      Array.from({ length: 65 }, (_, j) => {
        const angle = (j * Math.PI) / 32;
        return [
          Math.sin(angle) * Math.cos(longitude),
          Math.sin(angle) * Math.sin(longitude),
          Math.cos(angle),
        ];
      }),
    );
  const segments = [];
  for (const points of grids) {
    let segment;
    for (let i = 1; i < points.length; i++) {
      const front =
        blochDepth(points[i].map((x, k) => (x + points[i - 1][k]) / 2)) >= 0;
      if (!segment || segment.front !== front) {
        segment = { front, points: [project(points[i - 1])] };
        segments.push(segment);
      }
      segment.points.push(project(points[i]));
    }
  }
  const path = trajectory
    .map((point) => project(point).map(f).join(","))
    .join(" ");
  return `<svg viewBox="0 0 260 286" role="img" aria-label="q${q} local Bloch sphere, orthographic projection"><defs><radialGradient id="sphere-${q}" cx="31%" cy="23%" r="83%"><stop stop-color="#627e9566"/><stop offset=".48" stop-color="#223b4e55"/><stop offset="1" stop-color="#080f19aa"/></radialGradient></defs><circle cx="130" cy="120" r="90" fill="url(#sphere-${q})" stroke="#8ca6bc" stroke-opacity=".5" stroke-width=".8"/><path d="M53 74A90 90 0 0 1 187 50" fill="none" stroke="#dbeaf5" stroke-opacity=".3" stroke-width="1.1"/>${segments.map((segment) => `<polyline class="bloch-grid ${segment.front ? "front" : "rear"}" points="${segment.points.map((p) => p.map(f).join(",")).join(" ")}"/>`).join("")}${[
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]
    .map(
      (p) =>
        `<path d="M130 120L${project(p).join(" ")}" stroke="#89a4ba" stroke-width=".6" opacity=".55"/>`,
    )
    .join(
      "",
    )}<polyline points="${path}" fill="none" stroke="#ba9be9" stroke-width="1.7" opacity=".85" class="bloch-trail"/><polyline class="bloch-phase" fill="none" stroke="#e68ec9" stroke-width="1.4"/><path class="bloch-axis" stroke="#62b1ff" stroke-dasharray="3 5" stroke-width="1.2"/><circle class="bloch-mixed-core" cx="130" cy="120" r="8" fill="#e68ec91a" stroke="#e68ec9" stroke-width=".8"/><path class="bloch-z-guide" fill="none" stroke="#71d1d9" stroke-width=".8" stroke-dasharray="2 4"/><circle class="bloch-z-point" r="2.5" fill="#71d1d9"/><text class="bloch-z-label" fill="#8ccbd5" font-family="Arial,sans-serif" font-size="10"></text><path class="bloch-vector" d="M0 0L1 0" stroke="#e68ec9" stroke-width="2.3" vector-effect="non-scaling-stroke"/><path class="bloch-arrowhead" d="M-9-4L0 0-9 4Z" fill="#e68ec9"/><circle class="bloch-tip" cx="0" cy="0" r="2.5" fill="#f5d8ed"/><circle cx="130" cy="${project([0, 0, 1])[1]}" r="3" fill="#6ca6f8"/><circle cx="130" cy="${project([0, 0, -1])[1]}" r="3" fill="#efb45b"/><foreignObject x="92" y="0" width="76" height="30"><div xmlns="http://www.w3.org/1999/xhtml" class="bloch-pole-label" data-pole="0"></div></foreignObject><foreignObject x="92" y="215" width="76" height="30"><div xmlns="http://www.w3.org/1999/xhtml" class="bloch-pole-label" data-pole="1"></div></foreignObject><foreignObject x="62" y="145" width="136" height="40" class="bloch-mixed-label"><div xmlns="http://www.w3.org/1999/xhtml"></div></foreignObject><g font-family="Arial,sans-serif" font-size="13" fill="#abc0d2"><text x="220" y="143">x</text><text x="65" y="163">y</text><text class="bloch-value" x="130" y="259" text-anchor="middle">q${q}</text><text class="bloch-turn" x="130" y="278" text-anchor="middle" font-size="11" fill="#79b8eb"></text></g></svg>`;
}
function renderGeometry(result) {
  if ($("reduced-matrices").children.length !== state.n) {
    $("reduced-matrices").replaceChildren(
      ...Array.from({ length: state.n }, () => {
        const el = document.createElement("div");
        el.className = "equation";
        return el;
      }),
    );
  }
  const active = activeOperation();
  const axes = {
    X: [1, 0, 0],
    Rx: [1, 0, 0],
    Y: [0, 1, 0],
    Ry: [0, 1, 0],
    Z: [0, 0, 1],
    Rz: [0, 0, 1],
    S: [0, 0, 1],
    T: [0, 0, 1],
    H: [Math.SQRT1_2, 0, Math.SQRT1_2],
  };
  const segment = nativeSegment(),
    total = active
      ? compile(active).reduce((sum, p) => sum + p.duration, 0)
      : 0;
  const activeAxis =
    segment?.kind === "drive"
      ? axes[segment.axis === "x" ? "X" : "Y"]
      : total === 0 && active
        ? axes[active.name]
        : null;
  let mixed = false;
  const geometries = Array.from({ length: state.n }, (_, q) => {
    const r = reduced(result.state, q);
    const el = $("reduced-matrices").children[q];
    math(
      el,
      String.raw`\rho_{${q}}=\operatorname{Tr}_{\mathrm{others}}(\rho)=${matTex(r.rho)}`,
      `Trace over the other qubits to obtain q${q}’s density matrix. Purity = ${f(r.purity)}.`,
      "Tr: sum over matching indices of the other subsystem; ρq: reduced density matrix. Values dimensionless.",
      "Exact reduced state, rounded display.",
      "Transmon q" +
        q +
        "; its local state is incomplete information about an entangled register.",
    );
    mixed ||= r.purity < 0.99999;
    let trajectory = result.history.map((s) => reduced(s, q).bloch);
    if (active && !state.acquired && active.name !== "M") {
      const before = run(
        startState(),
        state.circuit,
        state.cursor - 1,
        seed(),
      ).state;
      trajectory = Array.from(
        { length: 33 },
        (_, i) =>
          reduced(fractional(before, active, (i / 32) * state.fraction), q)
            .bloch,
      );
    }
    return {
      vector: r.bloch,
      trajectory,
      q,
      axis: active?.target === q ? activeAxis : null,
    };
  });
  const spheres = $("bloch-spheres");
  if (spheres.children.length !== state.n)
    spheres.innerHTML = geometries
      .map((g) => blochSVG(g.vector, g.trajectory, g.q, g.axis))
      .join("");
  geometries.forEach((g, q) => {
    const svg = spheres.children[q],
      end = project(g.vector),
      length = Math.hypot(end[0] - 130, end[1] - 120);
    svg.dataset.vector = JSON.stringify(g.vector);
    svg.dataset.progress = state.fraction;
    svg.querySelectorAll("[data-pole]").forEach((el) => {
      math(el, `\\lvert${el.dataset.pole}\\rangle`);
      el.removeAttribute("tabindex");
    });
    const localLength = Math.hypot(...g.vector);
    svg.querySelector(".bloch-mixed-core").style.opacity =
      localLength < 1e-6 ? 1 : 0;
    svg.querySelector(".bloch-mixed-label").style.opacity =
      localLength < 1e-6 ? 1 : 0;
    svg.querySelector(".bloch-mixed-label").style.visibility =
      localLength < 1e-6 ? "visible" : "hidden";
    const localLabel = svg.querySelector(".bloch-mixed-label div");
    math(localLabel, `\\rho_${q}=\\frac{I}{2}`);
    localLabel.removeAttribute("tabindex");
    svg.querySelector(".bloch-turn").textContent =
      active?.target === q && segment?.kind === "drive"
        ? `${segment.axis} axis · ${f(segment.angle * pulseArea("drive", segment.fraction))} rad`
        : "";
    const arrow = svg.querySelector(".bloch-vector");
    let angle = Math.atan2(end[1] - 120, end[0] - 130);
    const previous = Number(arrow.dataset.phase ?? angle);
    if (length < 1e-8) angle = previous;
    while (angle - previous > Math.PI) angle -= 2 * Math.PI;
    while (angle - previous < -Math.PI) angle += 2 * Math.PI;
    arrow.dataset.phase = angle;
    const rear = blochDepth(g.vector) < 0;
    const zPoint = project([0, 0, g.vector[2]]);
    svg
      .querySelector(".bloch-z-guide")
      .setAttribute("d", `M${end.join(" ")}L${zPoint.join(" ")}`);
    svg.querySelector(".bloch-z-point").setAttribute("cx", zPoint[0]);
    svg.querySelector(".bloch-z-point").setAttribute("cy", zPoint[1]);
    const zLabel = svg.querySelector(".bloch-z-label");
    zLabel.setAttribute("x", zPoint[0] + 7);
    zLabel.setAttribute("y", zPoint[1] - 5);
    zLabel.textContent = `z ${f(g.vector[2])}`;
    arrow.style.strokeDasharray = rear ? "3 3" : "none";
    arrow.style.opacity = rear ? 0.65 : 1;
    arrow.style.transform = `translate(130px,120px) rotate(${angle}rad) scaleX(${length})`;
    svg
      .querySelector(".bloch-arrowhead")
      .setAttribute(
        "transform",
        `translate(${end[0]} ${end[1]}) rotate(${(angle * 180) / Math.PI}) scale(${length > 8 ? 1 : 0})`,
      );
    svg.querySelector(".bloch-tip").style.transform =
      `translate(${end[0]}px,${end[1]}px)`;
    svg.querySelector(".bloch-value").textContent =
      `q${q} · length ${f(Math.hypot(...g.vector))}`;
    svg
      .querySelector(".bloch-trail")
      .setAttribute(
        "points",
        g.trajectory.map((p) => project(p).map(f).join(",")).join(" "),
      );
    const phase = Math.atan2(g.vector[1], g.vector[0]),
      phaseArc = svg.querySelector(".bloch-phase");
    phaseArc.setAttribute(
      "points",
      Array.from({ length: 25 }, (_, j) =>
        project([
          0.4 * Math.cos((phase * j) / 24),
          0.4 * Math.sin((phase * j) / 24),
          0,
        ])
          .map(f)
          .join(","),
      ).join(" "),
    );
    phaseArc.style.visibility =
      Math.hypot(g.vector[0], g.vector[1]) > 1e-8 ? "visible" : "hidden";
    const axis = svg.querySelector(".bloch-axis"),
      axisEnd = g.axis ? project(g.axis) : [130, 120];
    axis.setAttribute("d", `M130 120L${axisEnd[0]} ${axisEnd[1]}`);
    svg.setAttribute(
      "aria-label",
      `q${q} reduced Bloch vector: x ${f(g.vector[0])}, y ${f(g.vector[1])}, z ${f(g.vector[2])}; length ${f(Math.hypot(...g.vector))}. Orthographic projection; an entangled register needs its joint state as well.`,
    );
  });
  $("geometry-explanation").textContent = mixed
    ? "Local states are mixed. The joint ket carries correlations that separate spheres cannot encode."
    : "Magenta: state vector. Cyan: projection onto z. Dashed blue: logical drive axis. Violet: trajectory. Equatorial arc: relative phase.";
}
function pulseValue(p, channel, t) {
  if (p.kind === "drive" && (channel === "I" || channel === "Q"))
    return (
      (Math.exp(-0.5 * ((t - 0.5) / 0.16) ** 2) *
        (channel === "I" ? Math.cos(p.phase) : Math.sin(p.phase)) *
        p.angle) /
      Math.PI
    );
  if (p.kind === "flux" && channel === "flux")
    return Math.sin(Math.PI * t) ** 2 * 0.8;
  if (p.kind === "readout" && channel === "readout")
    return t > 0.06 && t < 0.94 ? 0.65 : 0;
  return 0;
}
function waveform(native) {
  if (!native.some((p) => p.duration > 0)) {
    const reference = native.at(-1)?.frame || 0;
    return `<svg viewBox="0 0 760 150" role="img" aria-label="${native.length ? `Virtual Z phase reference ${f(reference)} radians. No XY burst; zero nanoseconds of physical XY pulse.` : "Controller idle. No active pulse."}"><circle cx="79" cy="74" r="36" fill="#122334" stroke="#5d7890" stroke-width=".8"/><circle cx="79" cy="74" r="28" fill="none" stroke="#40566b" stroke-width=".6" stroke-dasharray="1 5"/><path d="M79 74H109" stroke="#e68ec9" stroke-width="2" transform="rotate(${(-reference * 180) / Math.PI} 79 74)"/><circle cx="79" cy="74" r="2.4" fill="#f1d6e9"/><g fill="#b6cbdc" font-family="Arial,sans-serif" font-size="14"><text x="18" y="17">${native.length ? "Phase register" : "Controller idle"}</text><text x="130" y="70">λ ${f(reference)} rad</text><text x="130" y="91" fill="#e68ec9">No XY burst</text><text x="304" y="51" fill="#71d1d9">I</text><text x="304" y="96" fill="#ba9be9">Q</text><text x="320" y="132">XY pulse duration: 0 ns</text></g><path d="M328 47H735" stroke="#71d1d9" stroke-width="1.5"/><path d="M328 92H735" stroke="#ba9be9" stroke-width="1.5"/><path class="waveform-head" data-progress="${state.fraction}" d=""/></svg>`;
  }
  const total = native.reduce((sum, p) => sum + p.duration, 0),
    gain = Math.max(
      1,
      ...native
        .filter((p) => p.kind === "drive")
        .map((p) => Math.abs(p.angle) / Math.PI),
    );
  const paths = { I: [], Q: [], flux: [], readout: [] };
  let begin = 0,
    windows = "";
  for (const p of native) {
    const width = (p.duration / total) * 675,
      x0 = 58 + (begin / total) * 675;
    if (p.kind === "frame") {
      windows += `<path d="M${x0} 12V100" stroke="#e68ec9" opacity=".55" stroke-dasharray="2 5"/><text x="${x0 + 4}" y="12" fill="#c69bbd" font-size="12">frame</text>`;
      continue;
    }
    for (let k = 0; k <= 80; k++)
      for (const channel of Object.keys(paths)) {
        const value = pulseValue(p, channel, k / 80),
          base = channel === "I" || channel === "Q" ? 40 : 90;
        paths[channel].push(
          `${x0 + (width * k) / 80},${base - value * (base === 40 ? 30 / gain : 18)}`,
        );
      }
    if (p.kind === "readout")
      windows += `<rect x="${x0 + width * 0.18}" y="75" width="${width * 0.64}" height="25" fill="#e7c775" opacity=".12"/>`;
    begin += p.duration;
  }
  const colors = {
    I: "#71d1d9",
    Q: "#ba9be9",
    flux: "#e68ec9",
    readout: "#e7c775",
  };
  const curves = Object.entries(paths)
    .map(
      ([channel, points]) =>
        `<path class="pulse-area" d="M58 ${channel === "I" || channel === "Q" ? 40 : 90}L${points.join("L")}L733 ${channel === "I" || channel === "Q" ? 40 : 90}Z" fill="${colors[channel]}" fill-opacity=".13" clip-path="url(#pulse-clip)"/><polyline points="${points.join(" ")}" fill="none" stroke="${colors[channel]}" stroke-width="1.5" opacity=".24"/><polyline class="pulse-played" points="${points.join(" ")}" fill="none" stroke="${colors[channel]}" stroke-width="2.3" clip-path="url(#pulse-clip)"/>`,
    )
    .join("");
  return `<svg viewBox="0 0 760 120" data-gain="${gain}" role="img" aria-label="Native I and Q envelopes share the upper axis; flux or readout is below. Time in nanoseconds. Normalized amplitude; I Q vertical scale ${gain}."><defs><clipPath id="pulse-clip"><rect class="pulse-reveal" x="58" y="0" width="${675 * state.fraction}" height="120"/></clipPath></defs><path d="M58 40H733M58 90H733" stroke="#3b5266" stroke-width=".7"/><g fill="#b0c6d8" font-family="Arial,sans-serif" font-size="13"><text x="6" y="37" fill="#71d1d9">I</text><text x="20" y="37" fill="#ba9be9">/ Q</text>${gain > 1 ? `<text x="5" y="59">×${f(gain)}</text>` : ""}<text x="4" y="93">${native.some((p) => p.kind === "readout") ? "RF" : "Flux"}</text><text x="58" y="116">0</text><text x="676" y="116">${total} ns</text></g>${windows}${curves}<path class="waveform-head" data-progress="${state.fraction}" d="M${58 + 675 * state.fraction} 12V100" stroke="#eaf0ed" stroke-width=".8" opacity=".7"/><circle class="waveform-tip" r="3" fill="#f5eee5"/></svg>`;
}
function updateWaveformCursor(native) {
  const svg = $("waveform").querySelector("svg"),
    head = svg.querySelector(".waveform-head");
  head.dataset.progress = state.fraction;
  if (!native.some((p) => p.duration > 0)) return;
  const x = 58 + 675 * state.fraction,
    p = nativeSegment(native),
    gain = Number(svg.dataset.gain || 1);
  head.setAttribute("d", `M${x} 12V100`);
  svg
    .querySelector(".pulse-reveal")
    .setAttribute("width", 675 * state.fraction);
  let y = 90;
  if (p?.kind === "drive") {
    const i = pulseValue(p, "I", p.fraction),
      q = pulseValue(p, "Q", p.fraction);
    y = 40 - ((Math.abs(i) > Math.abs(q) ? i : q) * 30) / gain;
  } else if (p)
    y =
      90 -
      pulseValue(p, p.kind === "flux" ? "flux" : "readout", p.fraction) * 18;
  svg.querySelector(".waveform-tip").setAttribute("cx", x);
  svg.querySelector(".waveform-tip").setAttribute("cy", y);
}
let lastWaveformKey = "";
function renderControl() {
  renderCarrier();
  const op = activeOperation(),
    native = op ? activeNative() : [];
  const waveformKey = JSON.stringify(
    native.map((p) => [
      p.kind,
      p.duration,
      p.angle,
      p.kind === "frame" ? p.frame : 0,
      p.phase,
    ]),
  );
  if (waveformKey !== lastWaveformKey) {
    $("waveform").innerHTML = waveform(native);
    lastWaveformKey = waveformKey;
  }
  updateWaveformCursor(native);
  const duration = native.reduce((sum, p) => sum + p.duration, 0),
    segment = nativeSegment(native);
  const drive = segment?.kind === "drive" ? segment : null;
  $("control-values").innerHTML =
    `<span>${op ? op.name : "Initialization"}</span><span>${duration} ns</span>${drive ? `<span>f = 5.000 GHz</span><span>Δ/2π = 0 MHz</span><span>φ hardware = ${f(drive.phase)} rad</span><span>frame λ = ${f(drive.frame)} rad</span>` : `<span>${segment?.kind === "flux" ? "Flux bias · no XY burst" : segment?.kind === "readout" ? "Resonator probe · device-specific RF frequency" : native.length ? `Frame angle ${f(native[0].angle)} rad; reference ${f(native[0].frame)} rad` : "No XY drive"}</span>`}`;
  renderCalibration();
}
let lastCalibrationKey = "";
function renderCalibration() {
  const p = nativeSegment();
  const key = JSON.stringify([
    p?.kind,
    p?.angle,
    p?.logicalPhase,
    $("drive-frequency").value,
    $("pulse-scale").value,
  ]);
  if (key === lastCalibrationKey) return;
  lastCalibrationKey = key;
  if (!p || p.kind !== "drive") {
    $("calibration-prediction").textContent =
      "Select an active XY segment to compare the ideal pulse with detuning and pulse-area errors.";
    return;
  }
  const detuning = 2 * Math.PI * (Number($("drive-frequency").value) - 5),
    area = p.angle * Number($("pulse-scale").value),
    steps = 160,
    dt = p.duration / steps;
  let s = initial(1),
    gs = 0;
  const envelopes = Array.from({ length: steps }, (_, j) =>
    Math.exp(-0.5 * (((j + 0.5) / steps - 0.5) / 0.16) ** 2),
  );
  gs = envelopes.reduce((a, b) => a + b, 0) * dt;
  for (const g of envelopes) {
    const om = (area * g) / gs,
      ox = om * Math.cos(p.logicalPhase),
      oy = om * Math.sin(p.logicalPhase),
      r = Math.hypot(ox, oy, detuning),
      co = Math.cos((r * dt) / 2),
      sn = r ? Math.sin((r * dt) / 2) / r : dt / 2;
    const u = [
      [c(co, -sn * detuning), c(-sn * oy, -sn * ox)],
      [c(sn * oy, -sn * ox), c(co, sn * detuning)],
    ];
    s = [
      add(mul(u[0][0], s[0]), mul(u[0][1], s[1])),
      add(mul(u[1][0], s[0]), mul(u[1][1], s[1])),
    ];
  }
  $("calibration-prediction").textContent =
    `Numerical RWA prediction for this pulse from the zero basis: P(1) = ${(abs2(s[1]) * 100).toFixed(2)}%. Same Gaussian envelope, with the selected frequency and area error. This compares one physical pulse, not the entire compiled gate.`;
}
function measurementAxis(q) {
  const setting = $("measurement-basis").value;
  return setting === "XY" && state.n === 2
    ? setting[q]
    : setting === "X" || setting === "Y"
      ? setting
      : "Z";
}
function basisOperations() {
  const ops = [];
  for (let q = 0; q < state.n; q++) {
    const basis = measurementAxis(q);
    if (basis === "Y") ops.push({ name: "Rz", target: q, angle: -Math.PI / 2 });
    if (basis !== "Z") ops.push({ name: "H", target: q });
  }
  return ops;
}
function measurementCircuit() {
  return state.circuit.slice(0, state.cursor);
}
function ensembleProbabilities() {
  return distribution(
    startState(),
    measurementCircuit(),
    state.fraction,
    basisOperations(),
  );
}
function renderReadout() {
  const probs = ensembleProbabilities(),
    count = Math.max(
      1,
      Math.round(
        Number($("shots").value) * (state.acquired ? state.shotProgress : 1),
      ),
    ),
    noise = Number($("readout-noise").value),
    threshold = Number($("threshold").value);
  const result = shots(probs, count, seed(), noise, threshold);
  $("histogram").innerHTML =
    `<p class="caption">Gold: exact probability. White: shot frequency.<br>Basis ${$("measurement-basis").value} · ${count} seeded shots · seed ${seed()}</p>` +
    probs
      .map(
        (p, j) =>
          `<div class="hist-row"><span>${bits(j)}</span><div class="hist-bars"><b style="width:${p * 100}%"></b><i style="width:${(result.counts[j] / count) * 100}%"></i></div><span>${(p * 100).toFixed(1)}% / ${result.counts[j]}</span></div>`,
      )
      .join("");
  const x = (v) => 150 + v * 34,
    y = (v) => 110 - v * 34;
  const circles = result.points
    .map(
      (p) =>
        `<circle cx="${x(p.i)}" cy="${y(p.q)}" r="1.7" fill="${p.bit ? "#efb45b" : "#6ca6f8"}" opacity=".55"/>`,
    )
    .join("");
  $("iq-plot").innerHTML =
    `<svg viewBox="0 0 300 225" role="img" aria-label="Noisy I Q scatterplot for q0, threshold ${threshold}; ${count} seeded samples, up to 320 displayed"><rect x="10" y="8" width="280" height="205" fill="#111913"/><path d="M15 110H285M150 10V205" stroke="#40513e"/>${circles}<path d="M${x(threshold)} 15v190" stroke="#f0eee5" stroke-dasharray="4 4"/><g fill="#b0b9ae" font-family="Arial,sans-serif" font-size="14"><text x="270" y="123">I</text><text x="157" y="20">Q</text><text x="${Math.max(20, Math.min(230, x(threshold) + 4))}" y="200">threshold</text><text x="65" y="220" fill="#6ca6f8">zero cluster</text><text x="180" y="220" fill="#efb45b">one cluster</text></g></svg>`;
  const parity = (arr) =>
      arr.reduce(
        (s, p, j) => s + ((bits(j).split("1").length - 1) % 2 ? -p : p),
        0,
      ),
    observed = result.counts.map((v) => v / count);
  if (state.acquired)
    $("mobile-operation").textContent =
      `Readout · ${count} / ${$("shots").value} shots`;
  $("readout-heading").textContent =
    state.acquired && state.shotProgress < 1
      ? `Acquiring · ${count} / ${$("shots").value} shots`
      : "Readout & statistics";
  $("correlations").textContent =
    `Parity correlation ⟨${Array.from({ length: state.n }, (_, q) => measurementAxis(q)).join("")}⟩: calculated ${f(parity(probs))}; classified ${f(parity(observed))}. Parity multiplies +1 for each zero and −1 for each one. Repeated shots estimate the outcome distribution.`;
  $("entanglement-note").textContent =
    state.n === 2 && jointEvidence
      ? `For this circuit ensemble, XX = ${f(jointEvidence.correlations.X)}, YY = ${f(jointEvidence.correlations.Y)}, ZZ = ${f(jointEvidence.correlations.Z)}. Bell-target fidelity = ${f(jointEvidence.fidelity)}. Compare X and Y settings as well as computational populations.`
      : "Computational-basis counts show populations. Phase-sensitive correlations require additional measurement bases.";
  $("mixture-comparison").replaceChildren();
}
function compareMixture() {
  if (state.n !== 2) {
    $("mixture-comparison").textContent =
      "Select the two-qubit Bell experiment for the 00/11 mixture comparison.";
    return;
  }
  const basis = $("measurement-basis").value,
    ops = basisOperations();
  const a = distribution(initial(2, 0), ops),
    b = distribution(initial(2, 3), ops),
    mix = a.map((v, j) => (v + b[j]) / 2);
  const actual = ensembleProbabilities();
  $("mixture-comparison").innerHTML =
    `<p>In basis ${basis}, a 50/50 incoherent mixture of 00 and 11 gives ${mix.map((p, j) => `${bits(j)}: ${(p * 100).toFixed(0)}%`).join(", ")}. ${basis === "Z" ? "The Bell state and mixture have identical computational populations." : "The mixture has no phase-sensitive parity correlation; compare the calculated circuit distribution."}</p><div class="comparison-table" role="region" tabindex="0" aria-label="Calculated circuit and classical mixture probabilities"><table><thead><tr><th scope="col">Outcome</th><th scope="col">Current circuit</th><th scope="col">Incoherent mixture</th></tr></thead><tbody>${mix.map((p, j) => `<tr><th scope="row">${bits(j)}</th><td><span class="comparison-bar" style="--probability:${actual[j] * 100}%"></span>${(actual[j] * 100).toFixed(1)}%</td><td><span class="comparison-bar mixture" style="--probability:${p * 100}%"></span>${(p * 100).toFixed(1)}%</td></tr>`).join("")}</tbody></table></div><p class="caption">The mixture averages density operators; it does not add amplitudes. The circuit column is calculated from the selected prefix and basis, including any earlier projective measurements. These ideal distributions are model evidence. Experimental entanglement evidence also needs calibrated measurements and statistical uncertainty.</p>`;
}
function renderConcept() {
  const lesson = concepts.find((l) => l.id === state.concept);
  $("concept-tabs").innerHTML = concepts
    .map(
      (l) =>
        `<button data-concept="${l.id}" aria-pressed="${state.concept === l.id}">${l.title.split(" · ")[0]} · ${l.id}</button>`,
    )
    .join("");
  $("concept-tabs")
    .querySelectorAll("button")
    .forEach(
      (b) =>
        (b.onclick = () => {
          state.concept = b.dataset.concept;
          renderConcept();
        }),
    );
  $("concept-content").innerHTML =
    `<h4>${lesson.title}</h4><p>${lesson.text}</p>${lesson.id === "basis" ? '<svg class="energy-diagram" viewBox="0 0 650 180" role="img" aria-label="Anharmonic transmon energy levels. The first gap is larger than the second; zero and one select two levels; the third can receive leakage."><path d="M20 150h120M20 82h120M20 31h120" stroke="#d9bc7d" stroke-width="2"/><g fill="#b0b9ae" font-family="Arial" font-size="20"><text x="155" y="155" fill="#6ca6f8">E₀ · zero · north</text><text x="155" y="87" fill="#efb45b">E₁ · one · south</text><text x="155" y="36" fill="#d08b85">E₂ · leakage level</text><text x="20" y="177">Unequal energy gaps · not to scale</text></g></svg>' : ""}${lesson.id === "tensor" ? '<div class="tensor-basis"><span>0 ⊗ {0,1} → {00,01}</span><span>1 ⊗ {0,1} → {10,11}</span></div>' : ""}<div id="concept-equation" class="equation"></div>${lesson.id === "basis" ? '<div class="execution-controls"><button id="basis-zero">Map E₀ → zero → north</button><button id="basis-one">Map E₁ → one → south</button></div>' : lesson.id === "tensor" ? '<button id="tensor-step">Build next tensor basis state →</button>' : lesson.id === "bell" ? '<div class="execution-controls"><button id="product-state">Prepare a product state</button><button id="entangle-state">Apply the entangler</button></div>' : ""}<p>${citations(lesson.source)}</p>`;
  math(
    $("concept-equation"),
    lesson.latex,
    lesson.reading,
    lesson.symbols,
    lesson.kind,
    "Computational levels, control line, and readout resonator shown above.",
  );
  if ($("basis-zero")) {
    $("basis-zero").onclick = () => basisMap(0);
    $("basis-one").onclick = () => basisMap(1);
  }
  if ($("tensor-step"))
    $("tensor-step").onclick = () => {
      stop();
      state.prepared = false;
      state.n = 2;
      state.basis = (state.basis + 1) % 4;
      state.circuit = [];
      state.cursor = 0;
      state.acquired = false;
      rebuildSelectors();
      renderQuantum();
      announce("Tensor basis " + bits(state.basis));
    };
  if ($("product-state")) {
    $("product-state").onclick = () => {
      bell();
      state.cursor = 1;
      renderQuantum();
    };
    $("entangle-state").onclick = () => {
      bell();
      state.cursor = 2;
      renderQuantum();
    };
  }
}
const symbolMeanings = {
  λ: "The accumulated virtual-Z reference for this qubit, in radians. Hardware microwave phase equals the logical axis phase minus λ; updating this register alone sends no XY burst.",
  η: "The active rotation angle, in radians. For a resonant fixed-axis pulse it is the integral of Ω(t) over the pulse duration.",
  t: "Elapsed time in seconds in Hamiltonian equations; native pulse timelines explicitly use nanoseconds.",
  τ: "Pulse or free-evolution duration. The equation’s definitions specify seconds or nanoseconds.",
  P: "An outcome probability. It is dimensionless and is estimated experimentally from many independently acquired results.",
  U: "A unitary operator acting on the register. Its columns show where each basis state goes.",
  H: "Unindexed H in a circuit denotes Hadamard. H with a physical subscript denotes an energy operator; see the equation’s model definitions.",
  S: "A phase gate adding π/2 relative phase to the one-state amplitude; a virtual frame update is one representative realization.",
  T: "In a circuit, a π/4 phase gate. In the thermal diagnostic, T is temperature in kelvin; the local definitions specify the context.",
  N: "Number of independent experimental shots. Shot noise decreases as one over the square root of N.",
  σ: "Standard deviation. In readout it measures voltage-cluster spread; in the Ramsey bench σf measures detuning spread.",
  f: "Physical frequency in hertz. Multiplication by 2π gives the magnitude of angular frequency.",
  h: "Planck constant, joule-seconds; photon energy is hf.",
  k: "In kB, Boltzmann constant converts absolute temperature to an energy scale, joules per kelvin.",
  ψ: "The current state: the complex amplitudes used by every view. It is not a physical voltage.",
  α: "In the state lesson, the complex amplitude of the zero basis state. Squared magnitude gives its probability. In Z–Y–Z, α is explicitly an Euler angle.",
  β: "The one-state amplitude in the state lesson; an Euler angle in the separately labeled Z–Y–Z convention.",
  θ: "Polar angle on a pure-state Bloch sphere. Pulse area can control this rotation angle; radians.",
  φ: "Relative phase between the two basis amplitudes. Drive phase selects an axis; carrier and relative phases are distinct, related concepts.",
  γ: "Global phase multiplying every amplitude. It affects no isolated-register measurement probability.",
  I: "Identity operator; it leaves a subsystem unchanged.",
  i: "The imaginary unit, i² = −1. Quadrature control gives access to phase-sensitive rotations.",
  ℏ: "Reduced Planck constant, in joule-seconds, converting angular rate to energy.",
  Ω: "The effective control angular rate in rad/s, proportional to the voltage envelope only after calibration.",
  ωq: "Signed qubit angular frequency in the displayed +Z Hamiltonian. For ground-state zero, ωq is negative; its magnitude over 2π is 5 GHz in the example.",
  ωd: "Signed drive angular frequency using the same convention as ωq. The physical carrier frequency is its magnitude over 2π.",
  Δ: "Detuning ωq − ωd, rad/s. It adds a z component to the rotating-frame axis.",
  Z: "The diagonal Pauli operator, +1 on zero and −1 on one. It generates relative phase.",
  X: "Pauli X exchanges basis amplitudes. A calibrated x pulse realizes Rx, equivalent to X at π up to global phase.",
  Y: "Pauli Y exchanges amplitudes with imaginary phases. Drive quadrature determines its distinct rotation axis.",
  "⊗": "Tensor product: combine subsystem bases into the joint basis, q0 first.",
  ρ: "Density operator. A partial trace removes unobserved subsystem indices; an entangled pure state can have mixed reduced states.",
  χ: "Dispersive angular-frequency shift, rad/s. The qubit changes the resonator response measured in readout.",
  ζ: "Effective conditional angular-frequency shift, rad/s; its integrated phase realizes CZ after compensating local phases.",
  M: "A measurement operator. The ideal model projects; physical readout obtains a noisy resonator voltage.",
  a: "Resonator photon annihilation operator; a†a is photon number, not a qubit amplitude.",
  "†": "Complex conjugate transpose: turn a ket into a bra, or reverse a unitary via its adjoint.",
  Tr: "Trace sums diagonal elements. A partial trace sums over the other qubits to give a reduced density operator.",
};
function renderHamiltonian() {
  const block = $("hamiltonian");
  block.replaceChildren();
  const items = [
    [
      String.raw`H_0=\frac{\hbar\omega_q}{2}Z,\qquad H_d(t)=\hbar\Omega(t)\cos(\omega_dt+\phi)X`,
      "A two-level qubit has a free energy splitting and a transverse classical drive.",
      "ℏ in J·s; H in J; ωq,ωd,Ω in rad/s; t in s; φ in rad. With ground-state zero and Z = diag(1,−1), ωq = −2π × 5 GHz here. ωd uses the same signed convention; the physical frequency is |ωd|/2π.",
      "Approximate two-level, classical-drive model.",
    ],
    [
      String.raw`\lvert\psi_r\rangle=e^{+i\omega_dtZ/2}\lvert\psi_{\rm lab}\rangle,\qquad\Delta=\omega_q-\omega_d`,
      "Move to a frame rotating with the drive; subtract its free z evolution.",
      "ψr: rotating-frame state; ψlab: laboratory state; Δ: signed detuning (rad/s).",
      "Exact frame transformation within the assumed two-level model.",
    ],
    [
      String.raw`H_{\rm eff}(t)\approx\frac\hbar2\left[\Delta Z+\Omega(t)(\cos\phi\,X+\sin\phi\,Y)\right]`,
      "Drop terms oscillating at twice the carrier rate. The phase chooses the transverse rotation axis.",
      "X,Y,Z: Pauli matrices. For this cosine convention, phase +π/2 gives +y. Envelope changes slowly relative to the carrier and |Ω|,|Δ| ≪ |ωd|.",
      "Rotating-wave approximation (RWA); not valid for arbitrarily strong or fast drives.",
    ],
    [
      String.raw`\eta=\int_0^\tau\Omega(t)\,dt,\quad v(t)\propto I(t)\cos(\omega_dt)-Q(t)\sin(\omega_dt),\quad I=\Omega\cos\phi,\ Q=\Omega\sin\phi`,
      "On resonance with a fixed axis, pulse area gives rotation angle; I and Q synthesize a phase-controlled microwave carrier.",
      "η: radians; τ: pulse duration (s); I,Q are plotted as normalized angular-rate envelopes. DAC voltages require a device-specific calibration factor. For negative signed ωd, rewrite the physical positive-frequency carrier with opposite phase.",
      "Pulse-area identity exact on resonance for the effective model; physical waveform mapping is representative.",
    ],
  ];
  items.push([
    String.raw`\phi_{\rm logical}=\phi_{\rm hw}+\lambda,\qquad R_z(\lambda)\,\sigma_{\phi_{\rm hw}}\,R_z(\lambda)^\dagger=\sigma_{\phi_{\rm logical}}`,
    "A virtual-Z reference changes which physical carrier phase realizes a logical rotation axis.",
    "λ: accumulated software reference angle (rad); φhw: phase written to hardware I/Q (rad); σφ = cos(φ)X + sin(φ)Y. Each qubit has its own tracked reference.",
    "Exact change-of-frame identity in the ideal two-level model. Updating the reference itself sends no XY microwave pulse.",
  ]);
  items.forEach(([tex, reading, defs, kind]) => {
    const el = document.createElement("div");
    el.className = "equation";
    block.append(el);
    math(
      el,
      tex,
      reading,
      defs,
      kind,
      "Controller → DAC → mixer → XY line → transmon.",
    );
  });
  const note = document.createElement("p");
  note.className = "caption";
  note.textContent =
    "Explicit approximations: two levels only; classical prescribed field; rotating reference frame; rotating-wave approximation; no leakage, decoherence, line distortion, or multilevel AC Stark corrections. The state-vector circuit uses ideal unitaries; the calibration prediction numerically integrates this effective model.";
  block.append(note);
}
function scalarTex(x) {
  const sign = x < 0 ? "-" : "",
    v = Math.abs(x);
  if (v < 1e-10) return "0";
  if (Math.abs(v - 1) < 1e-10) return sign + "1";
  if (Math.abs(v - Math.SQRT1_2) < 1e-10)
    return sign + String.raw`\frac1{\sqrt2}`;
  if (Math.abs(v - 0.5) < 1e-10) return sign + String.raw`\frac12`;
  return f(x);
}
function ketTex(s) {
  return (
    s
      .map((a, j) => {
        if (abs2(a) < 1e-10) return "";
        let coefficient;
        if (Math.abs(a[1]) < 1e-10)
          coefficient =
            Math.abs(a[0] - 1) < 1e-10
              ? ""
              : Math.abs(a[0] + 1) < 1e-10
                ? "-"
                : scalarTex(a[0]);
        else if (Math.abs(a[0]) < 1e-10) coefficient = scalarTex(a[1]) + "i";
        else
          coefficient = `\\mathord{(${scalarTex(a[0])}${a[1] < 0 ? "-" : "+"}${scalarTex(Math.abs(a[1]))}i)}`;
        return String.raw`${coefficient}\lvert${bits(j)}\rangle`;
      })
      .filter(Boolean)
      .join("+")
      .replaceAll("+-", "-") || "0"
  );
}
function renderStory(result) {
  const op = activeOperation(),
    bellCircuit =
      state.n === 2 &&
      state.basis === 0 &&
      !state.prepared &&
      state.circuit.length === 2 &&
      state.circuit[0].name === "H" &&
      state.circuit[0].target === 0 &&
      state.circuit[1].name === "CNOT" &&
      state.circuit[1].control === 0 &&
      state.circuit[1].target === 1;
  const beat = state.playing
    ? state.fraction < 0.02
      ? "operator"
      : state.fraction < 0.999
        ? "evolve"
        : "inspect"
    : "inspect";
  document
    .querySelectorAll("[data-beat]")
    .forEach((el) => el.classList.toggle("active", el.dataset.beat === beat));
  document.querySelector(".workspace").dataset.beat = beat;
  const title = state.acquired
    ? "Readout classification"
    : !op
      ? "Register initialization"
      : bellCircuit && state.cursor === 1
        ? "Hadamard gate"
        : bellCircuit && state.cursor === 2
          ? "CNOT gate"
          : `${op.name} operation`;
  $("story-title").textContent = title;
  const native = op ? compile(op) : [],
    duration = native.reduce((sum, p) => sum + p.duration, 0);
  const reading = state.acquired
    ? `Readout samples accumulate in the selected ${$("measurement-basis").value} basis. A single conditional trajectory is shown above the ensemble statistics. Change to X or Y to inspect phase-sensitive correlations.`
    : !op
      ? "Two selected energy eigenstates define each transmon’s computational basis. The joint register is normalized; no control pulse has been applied."
      : bellCircuit && state.cursor === 1
        ? "Hadamard splits the zero-state amplitude equally between zero and one on q0. Follow the matrix entries into the two terms of the new ket."
        : bellCircuit && state.cursor === 2
          ? "CNOT keeps the zero-zero term and transforms one-zero into one-one. The amplitudes stay equal; the two-qubit state becomes entangled."
          : `${operations[op.name].reading} Follow the same cursor through the state, geometry, native waveform, and signal path. ${duration ? `${f(duration * state.fraction, 1)} / ${duration} ns of native control.` : "The controller updates the phase reference for subsequent pulses."}`;
  $("story-reading").textContent = reading;
  const moment =
    !state.acquired &&
    operations[op?.name]?.moments?.find((item) => state.fraction <= item.end);
  $("native-moment").hidden = !moment;
  if (moment) {
    $("native-moment").replaceChildren();
    const label = document.createElement("strong");
    label.textContent = moment.label;
    $("native-moment").append(label, document.createTextNode(moment.reading));
  }
  $("story-steps").innerHTML = bellCircuit
    ? ["Prepare", "Rotate", "Entangle", "Read"]
        .map(
          (label, i) =>
            `<button data-moment="${i}" aria-pressed="${i === (state.acquired ? 3 : state.cursor)}"><span>0${i + 1}</span>${label}</button>`,
        )
        .join("")
    : `<span class="quiet">${state.n} QUBIT${state.n === 1 ? "" : "S"} / STATE-VECTOR SIMULATION</span>`;
  $("story-steps")
    .querySelectorAll("button")
    .forEach(
      (b) =>
        (b.onclick = () => {
          stop();
          const i = Number(b.dataset.moment);
          if (i === 3) {
            state.cursor = 2;
            acquire();
            return;
          }
          state.cursor = i;
          state.fraction = 1;
          state.acquired = false;
          renderQuantum();
          triggerActive();
        }),
    );
  if (state.playing && !$("calculation-detail").open) return;
  const before = state.cursor
    ? run(startState(), state.circuit, state.cursor - 1, seed()).state
    : startState();
  const trace = $("story-equation");
  if (!$("trace-input"))
    trace.innerHTML =
      '<div class="trace-equivalence"><div id="trace-input" class="equation"></div><div id="trace-operator" class="equation"></div><div id="trace-output" class="equation"></div></div><p class="caption trace-reading">One calculated state, followed continuously through its active operation. Select a mathematical symbol to inspect its meaning.</p>';
  const defs =
    "Basis order is q0 first. Recognized simple coefficients are written as fractions; other amplitudes are rounded to three decimals. All amplitudes are dimensionless.";
  const model =
    "Exact ideal endpoints. Intermediate states use representative native compilation and explicit software frame updates. A zero-duration virtual rotation is scrubbed by frame angle, not elapsed pulse time.";
  const connection = "The active transmon register and its control frame.";
  math(
    $("trace-input"),
    String.raw`\lvert\psi_{\rm in}\rangle=${ketTex(before)}`,
    "Input to the active operation.",
    defs,
    model,
    connection,
  );
  const symbol = state.acquired
    ? "\\mathrm{readout}"
    : op
      ? `\\mathrm{${op.name}}${state.fraction < 1 ? "(t)" : ""}`
      : "\\mathrm{prepare}";
  math(
    $("trace-operator"),
    String.raw`\xrightarrow{${symbol}}`,
    state.acquired
      ? "Project and classify."
      : op
        ? `Apply ${op.name}.`
        : "Initialize.",
    "t: native elapsed time; nanoseconds on the waveform timeline.",
    state.acquired
      ? "Ideal conditional projection; voltage classification is a separate noisy model."
      : model,
    connection,
  );
  math(
    $("trace-output"),
    String.raw`\lvert\psi${state.acquired ? "_{\rm conditional}" : ""}\rangle=${ketTex(result.state)}`,
    "Current output at the execution cursor.",
    defs,
    model,
    connection,
  );
  const opKey = JSON.stringify([op, state.acquired]);
  if (trace.dataset.operation !== opKey && !state.reduced) {
    $("trace-operator")
      .querySelector(".math-visual")
      .animate(
        [
          { opacity: 0.25, transform: "translateY(5px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 280, easing: "ease-out" },
      );
  }
  trace.dataset.operation = opKey;
  const calculation = $("calculation-matrix");
  if (op && op.name !== "M") {
    const columns = Array.from({ length: 2 ** state.n }, (_, j) =>
      fractional(initial(state.n, j), op, state.fraction),
    );
    const u = columns.map((_, r) => columns.map((col) => col[r]));
    math(
      calculation,
      String.raw`${matTex(u)}${matTex(before.map((a) => [a]))}=${matTex(result.state.map((a) => [a]))}`,
      "Multiply each matrix row by the input column to obtain one output amplitude.",
      "Basis order: ascending binary, q0 first. Matrix and amplitudes are dimensionless; t is native elapsed time.",
      "Calculated from the same complex arithmetic as every other view. Values rounded.",
      "Native effective evolution at the execution cursor; endpoint equals the logical gate.",
    );
  } else
    calculation.textContent = op
      ? "Measurement is conditional projection followed by renormalization, not unitary matrix evolution. See the measurement lesson."
      : "Select a unitary gate to inspect its matrix multiplication.";
}
function focusedOutput() {
  return Math.min(state.flowOutput ?? defaultFlowOutput, 2 ** state.n - 1);
}
function renderAmplitudeAddition(row) {
  const host = $("coherent-addition");
  if (host.dataset.size !== String(row.terms.length)) {
    host.dataset.size = row.terms.length;
    host.innerHTML = `<svg viewBox="0 0 152 122" role="img" aria-label="Complex contributions add head to tail. The magenta vector is their sum; the circle has radius one."><circle cx="76" cy="60" r="42" fill="none" stroke="#5d7890" stroke-opacity=".3" stroke-width=".6"/><path d="M24 60H132M76 108V8" stroke="#5d7890" stroke-width=".6"/><g fill="#8ea6b9" font-family="Arial,sans-serif" font-size="10"><text x="134" y="63">Re</text><text x="80" y="11">Im</text><text x="114" y="73">1</text><text x="71" y="74">0</text><text x="76" y="120" text-anchor="middle">Amplitude sum</text></g><g class="addition-total"><path class="addition-vector" d="M0 0H1"/><path class="addition-head" d="M-4-2L0 0-4 2"/></g>${row.terms.map((_, j) => `<g data-addend="${j}"><path class="addition-vector" d="M0 0H1"/><path class="addition-head" d="M-4-2L0 0-4 2"/></g>`).join("")}<circle class="addition-tip" r="2.5" fill="#e68ec9"/></svg>`;
  }
  const vector = (group, start, end) => {
    const dx = (end[0] - start[0]) * 42,
      dy = -(end[1] - start[1]) * 42,
      length = Math.hypot(dx, dy),
      angle = (Math.atan2(dy, dx) * 180) / Math.PI,
      x = 76 + start[0] * 42,
      y = 60 - start[1] * 42;
    group
      .querySelector(".addition-vector")
      .setAttribute(
        "transform",
        `translate(${x} ${y}) rotate(${angle}) scale(${length} 1)`,
      );
    group
      .querySelector(".addition-head")
      .setAttribute(
        "transform",
        `translate(${76 + end[0] * 42} ${60 - end[1] * 42}) rotate(${angle}) scale(${length > 3 ? 1 : 0})`,
      );
  };
  let sum = c(0);
  row.terms.forEach((term, j) => {
    const group = host.querySelector(`[data-addend="${j}"]`),
      next = add(sum, term.value);
    group.dataset.value = JSON.stringify(term.value);
    group.style.stroke =
      Math.abs(term.value[1]) > Math.abs(term.value[0])
        ? "var(--imag)"
        : "var(--real)";
    group.style.opacity = abs2(term.value) > 1e-12 ? 1 : 0;
    vector(group, sum, next);
    sum = next;
  });
  vector(host.querySelector(".addition-total"), c(0), sum);
  host.querySelector(".addition-tip").setAttribute("cx", 76 + sum[0] * 42);
  host.querySelector(".addition-tip").setAttribute("cy", 60 - sum[1] * 42);
  host.dataset.output = row.output;
  host.dataset.amplitude = JSON.stringify(sum);
  host.dataset.progress = state.fraction;
}
function renderKetRibbons(outputs) {
  const host = $("ket-ribbons"),
    size = outputs.length,
    height = Math.max(142, size * 20);
  const y = (j) => 18 + j * ((height - 36) / Math.max(1, size - 1));
  if (host.dataset.size !== String(size)) {
    host.dataset.size = size;
    host.innerHTML = `<svg viewBox="0 0 240 ${height}" role="img" aria-label="Each curve carries a complex contribution: a matrix entry times an input amplitude. Width shows magnitude; the small arrow shows phase."><g class="ket-ribbon-links">${outputs.flatMap((row, j) => row.terms.map((term, i) => `<g data-ribbon="${j}-${i}"><path d="M39 ${y(i)}C103 ${y(i)},137 ${y(j)},185 ${y(j)}"/><g class="ribbon-phase" transform="translate(120 ${(y(i) + y(j)) / 2})"><circle r="6"/><path d="M0 0H5M3-2L5 0 3 2"/></g></g>`)).join("")}</g>${outputs.map((_, j) => `<g data-ribbon-result="${j}" transform="translate(193 ${y(j)})"><circle r="6"/><path d="M0 0H5M3-2L5 0 3 2"/></g>`).join("")}${outputs.map((_, j) => `<foreignObject x="0" y="${y(j) - 12}" width="37" height="28"><div xmlns="http://www.w3.org/1999/xhtml" data-ribbon-label="${j}"></div></foreignObject><foreignObject x="204" y="${y(j) - 12}" width="37" height="28"><div xmlns="http://www.w3.org/1999/xhtml" data-ribbon-label="${j}"></div></foreignObject>`).join("")}</svg>`;
    host.querySelectorAll("[data-ribbon-label]").forEach((el) => {
      math(el, `\\lvert${bits(Number(el.dataset.ribbonLabel))}\\rangle`);
      el.removeAttribute("tabindex");
    });
  }
  for (const row of outputs)
    for (const term of row.terms) {
      const link = host.querySelector(
          `[data-ribbon="${row.output}-${term.source}"]`,
        ),
        magnitude = Math.sqrt(abs2(term.value));
      link.dataset.value = JSON.stringify(term.value);
      link.dataset.focused = row.output === focusedOutput();
      link.style.opacity =
        magnitude < 1e-8
          ? "0"
          : String(
              (row.output === focusedOutput() ? 1 : 0.26) *
                Math.min(1, 0.4 + magnitude),
            );
      const path = link.querySelector("path");
      path.style.strokeWidth = 0.7 + magnitude * 4;
      path.style.stroke =
        Math.abs(term.value[1]) > Math.abs(term.value[0])
          ? "var(--imag)"
          : "var(--real)";
      link
        .querySelector(".ribbon-phase path")
        .setAttribute(
          "transform",
          `rotate(${(-Math.atan2(term.value[1], term.value[0]) * 180) / Math.PI})`,
        );
    }
  let cancellation = false;
  for (const row of outputs) {
    const result = host.querySelector(`[data-ribbon-result="${row.output}"]`);
    const magnitude = Math.sqrt(abs2(row.amplitude));
    const incoming = row.terms.filter(
      (term) => abs2(term.value) > 1e-10,
    ).length;
    const cancelled = magnitude < 1e-7 && incoming > 1;
    cancellation ||= cancelled;
    result.dataset.amplitude = JSON.stringify(row.amplitude);
    result.dataset.cancelled = cancelled;
    result.dataset.focused = row.output === focusedOutput();
    result.style.opacity = magnitude > 1e-7 || cancelled ? 1 : 0.2;
    result
      .querySelector("path")
      .setAttribute(
        "transform",
        `rotate(${(-Math.atan2(row.amplitude[1], row.amplitude[0]) * 180) / Math.PI}) scale(${magnitude})`,
      );
  }
  host.dataset.cancellation = cancellation;
  host.dataset.progress = state.fraction;
}
function renderAmplitudeFlow(compactOnly = false) {
  const op = activeOperation();
  const theatre = document.querySelector(".amplitude-theatre");
  theatre.hidden = state.acquired || op?.name === "M";
  $("ket-ribbons").hidden = theatre.hidden;
  if (theatre.hidden) return;
  const before = state.cursor
    ? run(startState(), state.circuit, state.cursor - 1, seed()).state
    : startState();
  const size = before.length;
  const columns = Array.from({ length: size }, (_, j) =>
    op
      ? fractional(initial(state.n, j), op, state.fraction)
      : initial(state.n, j),
  );
  const matrix = columns.map((_, row) => columns.map((column) => column[row]));
  const outputs = amplitudeContributions(before, matrix);
  liveContributions = outputs;
  renderKetRibbons(outputs);
  if (compactOnly || (state.playing && !theatre.closest("details").open))
    return;
  const focus = focusedOutput();
  const interference =
    state.prepared &&
    state.n === 1 &&
    Math.abs(Number($("theta").value) - Math.PI / 2) < 1e-6 &&
    state.cursor === 1 &&
    state.circuit.length === 1 &&
    op?.name === "H";
  $("flow-phase-controls").hidden = !interference;
  for (const [control, original] of [
    ["relative", "phi"],
    ["global", "gamma"],
  ]) {
    $(`flow-${control}`).value = $(original).value;
    $(`flow-${control}-value`).textContent =
      `${f(Number($(original).value), 2)} rad`;
  }
  $("flow-operation").textContent = op
    ? `${op.name} · ${Math.round(state.fraction * 100)}%`
    : "IDENTITY · PREPARED REGISTER";
  $("flow-reading").textContent = interference
    ? "The input always has equal basis probabilities. Relative phase turns one input arrow; H recombines the contributions so they can reinforce or cancel. Global phase turns both arrows together and leaves every output probability unchanged."
    : !op
      ? "Each position belongs to a joint basis state. Begin the experiment to see one complex amplitude contribute to several outputs."
      : op.name === "H"
        ? "A unitary distributes complex amplitudes across basis states. Their signs and phases remain available for later interference; nothing has been randomly measured."
        : op.name === "CNOT"
          ? "At the logical endpoint, CNOT exchanges the target labels only where the control is one. During native compilation, local rotations and the entangling interaction create a more detailed path."
          : ["Z", "S", "T", "Rz"].includes(op.name)
            ? "The arrows rotate while the probability bars stay fixed. Relative phase changes future interference even when this measurement basis cannot see it."
            : "Follow each matrix contribution into an output. Complex arrows can reinforce or cancel. Only the squared magnitude of their sum is a probability.";
  math(
    $("flow-rule"),
    String.raw`\beta_j(s)=\sum_i U_{ji}(s)\alpha_i,\quad P_j=|\beta_j|^2`,
    "Multiply input amplitudes by matrix entries, add the complex contributions, then square the magnitude.",
    {
      α: "Input complex amplitude, dimensionless. One entry of the register before this operation.",
      β: "Output complex amplitude for basis index j, dimensionless. It is the sum of the incoming complex contributions.",
      U: "The unitary matrix at this execution fraction, including representative native rotations or software frame updates; dimensionless.",
      i: "Input basis index in the sum, not the imaginary unit in this equation. The order is ascending binary with q0 first.",
      j: "Output basis index. Every incoming contribution to this row is added before taking the squared magnitude.",
      s: "Dimensionless execution fraction, from zero to one. It indexes native time for physical pulses and frame angle for a virtual rotation.",
      P: "Output probability, dimensionless. It is the squared magnitude of the summed output amplitude.",
    },
    "Exact complex arithmetic in the ideal computational subspace; displayed values rounded.",
    "The same compiled drive or frame update evolves the selected transmon register.",
  );
  const host = $("amplitude-flow"),
    height = Math.max(250, size * 52),
    y = (j) => 32 + j * ((height - 64) / Math.max(1, size - 1));
  if (host.dataset.size !== String(size)) {
    host.dataset.size = size;
    host.innerHTML = `<svg viewBox="0 0 640 ${height}" role="img" aria-label="Complex amplitude contributions from input to output. Curves are amplitudes, not probabilities."><g class="flow-guides">${outputs.map((_, j) => `<path d="M98 ${y(j)}H530"/>`).join("")}</g><g class="flow-links">${outputs.flatMap((row) => row.terms.map((term) => `<g id="link-${row.output}-${term.source}"><path d="M104 ${y(term.source)}C260 ${y(term.source)},380 ${y(row.output)},536 ${y(row.output)}"/><g class="contribution-phase"><circle r="8"/><line x1="0" y1="0" x2="7" y2="0"/></g></g>`)).join("")}</g>${outputs.map((_, j) => `<g transform="translate(78 ${y(j)})" id="input-amplitude-${j}" class="flow-node"><circle class="flow-node-ring" r="16"/><line x1="0" y1="0"/><circle class="flow-node-core" r="3"/></g><g transform="translate(562 ${y(j)})" id="output-amplitude-${j}" class="flow-node"><circle class="flow-node-ring" r="16"/><line x1="0" y1="0"/><circle class="flow-node-core" r="3"/></g><rect class="flow-probability-track" x="588" y="${y(j) - 15}" width="5" height="30" rx="2"/><rect id="flow-probability-${j}" class="flow-probability" x="588" y="${y(j) + 15}" width="5" height="0" rx="2"/>`).join("")}</svg><div class="flow-basis-labels input-labels">${outputs.map((_, j) => `<div style="top:${(100 * y(j)) / height}%" id="flow-input-label-${j}"></div>`).join("")}</div><div class="flow-basis-labels output-labels">${outputs.map((_, j) => `<div style="top:${(100 * y(j)) / height}%" id="flow-output-label-${j}"></div>`).join("")}</div>`;
    for (let j = 0; j < size; j++)
      for (const side of ["input", "output"])
        math(
          $(`flow-${side}-label-${j}`),
          String.raw`\lvert${bits(j)}\rangle`,
          `${side} basis state ${bits(j)}.`,
          "Basis labels follow q0 first; they denote selected energy levels, not literal classical digits inside the transmon.",
          "Ideal joint basis.",
          "Selected processor register.",
        );
    $("flow-select").innerHTML = outputs
      .map(
        (_, j) =>
          `<button data-output="${j}" aria-pressed="false">${bits(j)}</button>`,
      )
      .join("");
    $("flow-select")
      .querySelectorAll("button")
      .forEach((button) => {
        button.onclick = () => {
          state.flowOutput = Number(button.dataset.output);
          renderQuantum();
        };
      });
  }
  for (const row of outputs) {
    const j = row.output;
    for (const [side, amplitude] of [
      ["input", before[j]],
      ["output", row.amplitude],
    ]) {
      const node = $(`${side}-amplitude-${j}`),
        line = node.querySelector("line");
      let angle = -Math.atan2(amplitude[1], amplitude[0]);
      const previous = Number(line.dataset.phase ?? angle);
      while (angle - previous > Math.PI) angle -= 2 * Math.PI;
      while (angle - previous < -Math.PI) angle += 2 * Math.PI;
      line.dataset.phase = angle;
      line.setAttribute("x2", 14);
      line.setAttribute("y2", 0);
      line.style.transform = `rotate(${angle}rad) scaleX(${Math.sqrt(abs2(amplitude))})`;
      node.style.opacity = abs2(amplitude) > 1e-10 ? "1" : ".22";
    }
    const probability = $(`flow-probability-${j}`);
    probability.setAttribute("height", 30 * row.probability);
    probability.setAttribute("y", y(j) + 15 - 30 * row.probability);
    for (const term of row.terms) {
      const link = $(`link-${j}-${term.source}`),
        magnitude = Math.sqrt(abs2(term.value));
      link.style.opacity = magnitude < 1e-7 ? "0" : j === focus ? "1" : ".28";
      const path = link.querySelector("path");
      path.style.stroke =
        Math.abs(term.value[1]) > Math.abs(term.value[0])
          ? "var(--imag)"
          : "var(--real)";
      path.style.strokeWidth = 1 + magnitude * 5;
      const phase = link.querySelector(".contribution-phase");
      phase.setAttribute(
        "transform",
        `translate(${300 + (j - term.source) * 12} ${(y(j) + y(term.source)) / 2}) rotate(${(-Math.atan2(term.value[1], term.value[0]) * 180) / Math.PI})`,
      );
    }
  }
  $("flow-select")
    .querySelectorAll("button")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        Number(button.dataset.output) === focus,
      ),
    );
  const nonzero = outputs[focus].terms.filter(
    (term) => abs2(term.value) > 1e-10,
  );
  const terms =
    nonzero
      .map(
        (term) =>
          String.raw`(${complex(term.coefficient)})(${complex(term.amplitude)})`,
      )
      .join("+") || "0";
  math(
    $("flow-calculation"),
    String.raw`\beta_{${bits(focus)}}=${terms}=${complex(outputs[focus].amplitude)},\quad P(${bits(focus)})=${f(outputs[focus].probability)}`,
    `Selected output ${bits(focus)}: add ${nonzero.length} nonzero complex contributions. Probability ${f(outputs[focus].probability)}.`,
    "Each product is a matrix entry times one input amplitude. β: the resulting complex amplitude; P: its squared magnitude. All dimensionless.",
    "Ideal simulated state. Display rounded to three decimals; probability is computed before rounding.",
    "The active native control timeline; no collapse or classical random branching occurs here.",
  );
}
function renderGateCalculation() {
  const op = activeOperation();
  if (!op || op.name === "M" || state.acquired) {
    activeCalculation = null;
    gateCalculation.render(null);
    return;
  }
  const prefix = state.circuit.slice(0, state.cursor - 1);
  const before = run(startState(), prefix, prefix.length, seed()).state;
  const exactBefore = exactRegister(state.cursor - 1);
  const data = calculation(state.n, op, before, exactBefore);
  activeCalculation = data;
  defaultFlowOutput = data.rows.reduce(
    (best, row) => {
      if (row.tex === "0") return best;
      const amplitude = row.terms.reduce(
        (sum, term) => add(sum, mul(term.entry.value, term.input.value)),
        c(0),
      );
      const change = abs2(
        add(amplitude, c(-before[row.row][0], -before[row.row][1])),
      );
      return change > best.change ? { row: row.row, change } : best;
    },
    { row: 0, change: -1 },
  ).row;
  gateCalculation.render(data, {
    reduced: state.reduced,
    selected: focusedOutput(),
    auto: false,
    onReplay: () => play({ single: true }),
    onInspect: (output) => {
      stop();
      state.flowOutput = output;
      state.fraction = 1;
      renderQuantum();
    },
    onPhase: (name) => {
      stop();
      state.fraction = name === "basis" ? 0 : 1;
      renderQuantum();
    },
  });
  if (state.playing && $("exact-working").open)
    gateCalculation.sync(state.fraction);
}
function pulseIntensity() {
  const p = nativeSegment();
  if (!p || state.fraction >= 1 || state.fraction <= 0) return 0;
  return p.kind === "drive"
    ? Math.exp(-0.5 * ((p.fraction - 0.5) / 0.16) ** 2) *
        Math.min(1, Math.abs(p.angle) / Math.PI)
    : p.kind === "flux"
      ? Math.sin(Math.PI * p.fraction) ** 2
      : 0;
}
function renderCoherent(result) {
  const conditional = state.acquired || result.results.length > 0;
  const op = activeOperation(),
    p = nativeSegment(),
    pulses = activeNative();
  const total = pulses.reduce((sum, part) => sum + part.duration, 0);
  const inputStep = Math.max(0, state.cursor - (state.acquired ? 0 : 1));
  const inputOperations = [
    ...state.circuit.slice(0, inputStep),
    ...(state.acquired ? basisOperations() : []),
  ];
  const before = run(
    startState(),
    inputOperations,
    inputOperations.length,
    seed(),
  ).state;
  const inputExact = exactRegister(
    inputStep,
    state.acquired ? basisOperations() : [],
  );
  const outputExact =
    !state.acquired && state.fraction === 1
      ? exactRegister(state.cursor)
      : state.fraction === 0
        ? inputExact
        : null;
  const stage = $("coherent-stage");
  const kind =
    state.acquired || op?.name === "M" ? "readout" : p?.kind || "frame";
  stage.dataset.kind = kind;
  stage.dataset.progress = state.fraction;
  stage.style.setProperty("--progress", state.fraction);
  stage.style.setProperty("--pulse-power", pulseIntensity());
  $("coherent-title").textContent = state.acquired
    ? "Readout and state discrimination"
    : !op
      ? "Register initialization"
      : phaseExperimentActive()
        ? "Bell-state relative phase"
        : op.name === "H"
          ? "Hadamard gate"
          : ["CZ", "CNOT"].includes(op.name)
            ? `${op.name} gate`
            : `${op.name} operation`;
  math(
    $("coherent-input"),
    inputExact ? exactKet(inputExact, state.n) : ketTex(before),
    "State before the active operation.",
  );
  const currentKet = outputExact
    ? exactKet(outputExact, state.n)
    : ketTex(result.state);
  math(
    $("coherent-current"),
    `${outputExact || state.acquired ? "" : String.raw`\lvert\psi(s)\rangle\approx`}${currentKet}`,
    "Current state, shared by the Bloch vectors and probabilities.",
    {
      s: "The shared execution fraction: elapsed native pulse time divided by total gate duration, or phase angle fraction for a software frame update. Dimensionless.",
    },
  );
  $("coherent-state-label").textContent = conditional
    ? "CONDITIONAL TRAJECTORY"
    : state.fraction === 1
      ? "THE TRANSFORMED KET"
      : state.fraction === 0
        ? "READY TO EVOLVE"
        : "LIVE KET · NATIVE EVOLUTION";
  document.querySelector(".geometry-panel .panel-heading > span").textContent =
    conditional ? "CONDITIONAL LOCAL STATES" : "REDUCED STATE";
  $("coherent-gate").textContent = op?.name || "I";
  $("coherent-percent").textContent = $("ket-ribbons").hidden
    ? `${Math.round(state.fraction * 100)}%`
    : $("ket-ribbons").dataset.cancellation === "true"
      ? "Opposite phases cancel"
      : "Complex amplitudes combine";
  $("ket-clock").setAttribute("cx", 145 * state.fraction);
  $("coherent-time").textContent = state.acquired
    ? `${Math.max(1, Math.round(Number($("shots").value) * state.shotProgress))} / ${$("shots").value} shots`
    : total
      ? `${f(total * state.fraction, 1)} / ${total} ns`
      : "software frame";
  $("coherent-moment").textContent = state.acquired
    ? "RESONATOR → ADC → CLASSIFIER"
    : !op
      ? "INITIALIZED"
      : state.fraction === 1
        ? `${op.name} · COMPLETE`
        : kind === "frame"
          ? "CONTROLLER · PHASE REFERENCE"
          : kind === "flux"
            ? "FLUX BIAS · COUPLING INTERACTION"
            : `${p?.axis?.toUpperCase() || "XY"} DRIVE · q${p?.target ?? op.target}`;
  $("replay-gate").disabled = !op || op.name === "M";
  $("replay-gate").textContent = state.playing ? "Pause" : "Replay this gate ↻";
  $("coherent-play").textContent = state.playing
    ? "Pause experiment"
    : "Run full circuit →";
  const purity = Math.min(
    ...Array.from(
      { length: state.n },
      (_, q) => reduced(result.state, q).purity,
    ),
  );
  $("coherent-correlation").textContent =
    state.n > 1 && purity < 0.99999
      ? `ENTANGLED REGISTER · MIN LOCAL PURITY ${f(purity)}`
      : conditional
        ? "CONDITIONAL PURE STATE · NORMALIZED"
        : "PURE REGISTER · NORMALIZED";
  let reading;
  if (state.acquired)
    reading =
      "The probe field carries the resonator response back to the digitizer. The shared readout cursor accumulates shots below.";
  else if (op?.name === "M")
    reading = result.results.length
      ? "The ket shows one seeded projective outcome. The joint-state inspector averages every measurement branch to retain the circuit ensemble."
      : "The state is awaiting projection. The joint-state inspector retains the ensemble across possible outcomes.";
  else if (!op)
    reading =
      "Choose a gate, then replay it. The ket, pulse readhead, state vectors, and processor follow the same time coordinate.";
  else if (phaseExperimentActive())
    reading =
      "Turn φ: the joint phase and correlations change. Each local Bloch vector stays at zero; Z probabilities stay 50/50.";
  else if (state.fraction === 1)
    reading =
      op.name === "H"
        ? "Hadamard adds and subtracts the input amplitudes with equal weights. The ket and Bloch vectors have reached the same gate endpoint."
        : op.name === "CNOT"
          ? purity < 0.99999
            ? "The control-one branch flips the target. Joint amplitudes remain coherent as the local Bloch vectors shrink: their reduced states are mixed."
            : "The target flips only in the control-one branch. The joint ket shows the resulting amplitudes and phases."
          : op.name === "CZ"
            ? "Only the joint one-one amplitude acquires the controlled phase. The coupling path carries the entangling interaction."
            : `${op.name} has reached its gate endpoint. Replay or scrub to follow the complex amplitudes through its native control sequence.`;
  else if (kind === "frame")
    reading =
      "A frame update changes how later XY pulses are phased. Follow its logical action in the ket and geometry; the XY line carries no microwave burst.";
  else if (kind === "flux")
    reading = `The flux excursion accumulates ${f((p?.angle || 0) * pulseArea("flux", p?.fraction || 0))} rad of controlled phase. The one-one amplitude turns in the complex plane.`;
  else
    reading = `Pulse area has accumulated ${f((p?.angle || 0) * pulseArea("drive", p?.fraction || 0))} rad about the logical ${p?.axis || "XY"} axis. The same integrated envelope sets the evolution shown in the ket and Bloch view.`;
  $("coherent-reading").textContent = reading;
  $("coherent-addition").hidden = !op || op.name === "M" || state.acquired;
  if (op && op.name !== "M" && !state.acquired) {
    const endpoint = activeCalculation;
    const output = endpoint.rows[focusedOutput()],
      live = liveContributions[focusedOutput()],
      atEndpoint = state.fraction === 1;
    const factors = atEndpoint
      ? output.terms
          .filter((term) => !term.zero)
          .map(
            (term) =>
              `\\mathord{\\left(${term.entry.tex}\\right)\\left(${term.input.tex}\\right)}`,
          )
      : live.terms
          .filter((term) => abs2(term.value) > 1e-12)
          .map(
            (term) =>
              `\\mathord{(${complex(term.coefficient)})(${complex(term.amplitude)})}`,
          );
    math(
      $("coherent-rule"),
      `b_{${bits(output.row)}}${atEndpoint ? "=" : "(s)\\approx"}${factors.join("+") || "0"}${atEndpoint ? "=" : "\\approx"}${atEndpoint ? output.tex : `\\mathord{${complex(live.amplitude)}}`}`,
      atEndpoint
        ? "Selected output at the gate endpoint: multiply matrix entries by input amplitudes, then add."
        : "Selected output at the current native pulse time: multiply matrix entries by input amplitudes, then add. Display rounded to three decimals.",
      {
        b: "The output complex amplitude for this binary basis index, calculated from one matrix row. Dimensionless; its squared magnitude is the corresponding probability.",
        s: "The shared execution fraction: elapsed native pulse time divided by gate duration, or phase fraction for a software frame update. Dimensionless.",
      },
    );
    $("coherent-rule-caption").textContent = atEndpoint
      ? `${endpoint.exact ? "EXACT" : "SYMBOLIC"} ENDPOINT · OUTPUT ${bits(output.row)}`
      : `LIVE CALCULATION · OUTPUT ${bits(output.row)}`;
    renderAmplitudeAddition(live);
  } else {
    math(
      $("coherent-rule"),
      String.raw`P(j)=|\langle j\vert\psi\rangle|^2`,
      "The squared magnitude of a basis amplitude gives its ideal measurement probability.",
    );
    $("coherent-rule-caption").textContent = "MEASUREMENT · BORN RULE";
  }
  if (innerWidth <= 720)
    math($("coherent-mobile-ket"), currentKet, "Current shared state.");
  $("coherent-mobile-time").textContent = total
    ? `${f(total * state.fraction, 1)} ns`
    : `${Math.round(state.fraction * 100)}% frame`;
  const populations = $("coherent-populations");
  if (populations.children.length !== result.state.length) {
    populations.innerHTML = result.state
      .map(
        (_, j) =>
          `<button type="button" class="coherent-population" data-output="${j}" aria-label="Inspect output amplitude ${bits(j)}"><span data-basis-ket="${j}"></span><i><b></b></i><output></output></button>`,
      )
      .join("");
    populations.querySelectorAll("[data-basis-ket]").forEach((el, j) => {
      math(el, `\\lvert${bits(j)}\\rangle`);
      el.removeAttribute("tabindex");
      el.removeAttribute("role");
    });
    populations.querySelectorAll("button").forEach((button) => {
      button.onclick = () => {
        state.flowOutput = Number(button.dataset.output);
        renderQuantum();
      };
    });
  }
  result.state.forEach((a, j) => {
    const row = populations.children[j],
      probability = abs2(a);
    row.querySelector("b").style.transform = `scaleX(${probability})`;
    row.querySelector("output").textContent = `${f(probability * 100, 1)}%`;
    row.dataset.occupied = probability > 1e-8;
    row.setAttribute("aria-pressed", j === focusedOutput());
    row.setAttribute(
      "aria-label",
      `Inspect output ${bits(j)}: probability ${f(probability * 100, 1)} percent`,
    );
  });
  const hardware = $("processor-signal");
  const progress = state.acquired ? state.shotProgress : state.fraction;
  hardware.dataset.progress = progress;
  hardware.querySelector("circle").setAttribute("cx", 24 + 312 * progress);
  hardware.querySelector("text").textContent =
    kind === "frame"
      ? "frame register → next drive phase"
      : kind === "flux"
        ? `flux line → q${op?.control}—bus—q${op?.target}`
        : kind === "readout"
          ? "resonator → gain → ADC"
          : `XY line → transmon q${p?.target ?? op?.target ?? 0}`;
  hardware.querySelector("circle").style.opacity = kind === "frame" ? 0 : 1;
}

const visibleViews = new WeakSet();
const liveViewObserver = new IntersectionObserver((entries) => {
  let entered = false;
  for (const entry of entries) {
    if (entry.isIntersecting) {
      visibleViews.add(entry.target);
      entered = true;
    } else visibleViews.delete(entry.target);
  }
  if (entered && state.chapter === "compute") renderQuantum();
});

let jointEvidence,
  selectedCoherence = [0, 3];
const classicalBellMixture = Array.from({ length: 4 }, (_, r) =>
  Array.from({ length: 4 }, (_, col) =>
    c(r === col && (r === 0 || r === 3) ? 0.5 : 0),
  ),
);
function phaseExperimentActive() {
  const [h, cx, rz] = state.circuit;
  return (
    state.n === 2 &&
    state.basis === 0 &&
    !state.prepared &&
    state.circuit.length === 3 &&
    state.cursor === 3 &&
    h.name === "H" &&
    h.target === 0 &&
    cx.name === "CNOT" &&
    cx.control === 0 &&
    cx.target === 1 &&
    rz.name === "Rz" &&
    rz.target === 0
  );
}
function drawJointDensity(host, rho, interactive) {
  if (!host.children.length) {
    host.innerHTML =
      "<span></span>" +
      Array.from(
        { length: 4 },
        (_, col) => `<span data-density-label="${col}"></span>`,
      ).join("") +
      rho
        .map(
          (row, r) =>
            `<span data-density-label="${r}"></span>` +
            row
              .map(
                (_, col) =>
                  `<${interactive ? "button" : "div"} class="coherence-cell" data-density-row="${r}" data-density-col="${col}"><svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="11"/><path d="M15 15H25"/></svg></${interactive ? "button" : "div"}>`,
              )
              .join(""),
        )
        .join("");
    host
      .querySelectorAll("[data-density-label]")
      .forEach((el) =>
        math(el, `\\lvert${bits(Number(el.dataset.densityLabel), 2)}\\rangle`),
      );
    if (interactive)
      host.querySelectorAll("button").forEach(
        (button) =>
          (button.onclick = () => {
            selectedCoherence = [
              Number(button.dataset.densityRow),
              Number(button.dataset.densityCol),
            ];
            renderCoherence();
          }),
      );
  }
  host.querySelectorAll(".coherence-cell").forEach((cell) => {
    const r = Number(cell.dataset.densityRow),
      col = Number(cell.dataset.densityCol),
      a = rho[r][col],
      magnitude = Math.sqrt(abs2(a));
    cell.style.setProperty("--magnitude", Math.min(1, magnitude));
    cell.style.setProperty(
      "--entry-color",
      Math.abs(a[1]) > Math.abs(a[0]) ? "var(--imag)" : "var(--real)",
    );
    cell.querySelector("path").style.transform =
      `rotate(${-Math.atan2(a[1], a[0])}rad) scaleX(${magnitude > 1e-10 ? 1 : 0})`;
    cell.setAttribute(
      "aria-label",
      `Density entry row ${bits(r, 2)}, column ${bits(col, 2)}: real ${f(a[0], 6)}, imaginary ${f(a[1], 6)}; magnitude ${f(magnitude, 6)}.`,
    );
    if (!interactive) cell.setAttribute("role", "img");
    if (interactive)
      cell.setAttribute(
        "aria-pressed",
        String(r === selectedCoherence[0] && col === selectedCoherence[1]),
      );
  });
}
function renderCoherence() {
  $("coherence-peek").hidden = state.n !== 2;
  $("coherence-inspector").hidden = state.n !== 2;
  $("stage-phase-controls").hidden = !phaseExperimentActive();
  jointEvidence = null;
  if (state.n !== 2) return;
  const rho = ensembleDensity(
    startState(),
    measurementCircuit(),
    state.fraction,
  );
  const evidence = bellEvidence(rho);
  jointEvidence = evidence;
  const metrics = $("coherence-metrics");
  if (!metrics.children.length)
    metrics.innerHTML =
      ["X", "Y", "Z", "XY"]
        .map(
          (axis) =>
            `<span>${axis === "XY" ? "XY" : axis + axis}<output data-correlation="${axis}"></output></span>`,
        )
        .join("") +
      `<span>Bell overlap<output data-fidelity></output></span><span class="joint-phase-peek">00 ↔ 11<svg viewBox="0 0 28 22" role="img"><circle cx="14" cy="11" r="9"/><path d="M14 11H22"/></svg></span>`;
  metrics.querySelectorAll("[data-correlation]").forEach((el) => {
    const v =
      el.dataset.correlation === "XY"
        ? evidence.crossXY
        : evidence.correlations[el.dataset.correlation];
    const text = f(Math.abs(v), 2);
    el.textContent = text === "0" ? "0" : `${v < 0 ? "−" : "+"}${text}`;
  });
  metrics.querySelector("[data-fidelity]").textContent = f(
    evidence.fidelity,
    3,
  );
  const phasePeek = metrics.querySelector(".joint-phase-peek svg");
  const magnitude = Math.sqrt(abs2(evidence.coherence));
  phasePeek.querySelector("path").style.transform =
    `rotate(${-Math.atan2(evidence.coherence[1], evidence.coherence[0])}rad) scaleX(${magnitude > 1e-10 ? 1 : 0})`;
  phasePeek.setAttribute(
    "aria-label",
    `Joint coherence between zero-zero and one-one: real ${f(evidence.coherence[0])}, imaginary ${f(evidence.coherence[1])}.`,
  );
  if (phaseExperimentActive()) {
    $("stage-bell-phase").value = state.circuit[2].angle;
    $("stage-bell-phase-value").textContent =
      `${f(state.circuit[2].angle)} rad`;
  }
  metrics.dataset.fidelity = evidence.fidelity;
  if (!$("coherence-inspector").open) return;
  drawJointDensity($("joint-density"), rho, true);
  drawJointDensity($("mixture-density"), classicalBellMixture, false);
  const [row, col] = selectedCoherence;
  math(
    $("coherence-element"),
    `\\rho_{${bits(row, 2)},${bits(col, 2)}}=\\langle${bits(row, 2)}\\vert\\rho\\vert${bits(col, 2)}\\rangle\\approx${complex(rho[row][col])}`,
    `Joint density-matrix entry at row ${bits(row, 2)}, column ${bits(col, 2)}.`,
    {
      ρ: "The pre-readout joint density operator of the whole circuit ensemble, including all branches of any earlier projective measurement. Dimensionless. Diagonal entries are probabilities; off-diagonal entries encode coherence.",
    },
  );
  math(
    $("bell-witness-equation"),
    String.raw`F_{\Phi^+}=\langle\Phi^+\vert\rho\vert\Phi^+\rangle=\frac{1+\langle XX\rangle-\langle YY\rangle+\langle ZZ\rangle}{4}`,
    "Bell-target fidelity equals one plus XX minus YY plus ZZ, divided by four.",
    {
      F: "Overlap with the specified Bell target Φ+. Dimensionless, from zero to one. This is calculated from the circuit ensemble, not inferred from a single histogram.",
      Φ: "The target Bell state (zero-zero plus one-one), divided by square root of two.",
      X: "Pauli X; XX means X tensor X, measured with an X-basis change on both qubits.",
      Y: "Pauli Y; YY means Y tensor Y, measured with a Y-basis change on both qubits.",
      Z: "Pauli Z; ZZ is computational-basis parity on the two qubits.",
    },
  );
  $("bell-fidelity-marker").style.left =
    `${Math.max(0, Math.min(1, evidence.fidelity)) * 100}%`;
  $("bell-witness-reading").textContent =
    `Current Bell-target fidelity ${f(evidence.fidelity)}. ${evidence.fidelity > 0.5 + 1e-9 ? "It exceeds the ½ separable bound: the model state is entangled." : "This target witness does not exceed its ½ detection bound; other entangled states can fall below it."}`;
  $("coherence-reading").textContent = phaseExperimentActive()
    ? "Turn the relative phase. The Z populations and local Bloch vectors stay fixed; joint coherence rotates and the X/Y correlations change. The controller implements this Rz through its software phase reference."
    : "Follow the off-diagonal entries as the gates run. The classical 00/11 mixture has the same Z populations as the finished Bell state, but no coherence between its two branches.";
  const samePopulations = rho.every(
    (row, j) => Math.abs(row[j][0] - (j === 0 || j === 3 ? 0.5 : 0)) < 1e-10,
  );
  $("coherence-correlations").textContent =
    `Current circuit: XX ${f(evidence.correlations.X)}, YY ${f(evidence.correlations.Y)}, ZZ ${f(evidence.correlations.Z)}, XY ${f(evidence.crossXY)}. Mixture: XX 0, YY 0, ZZ 1, XY 0. ${samePopulations ? "Their Z populations agree; the additional settings probe coherence." : "Their Z populations differ for this circuit state."}`;
  $("bell-phase-controls").hidden = !phaseExperimentActive();
  if (phaseExperimentActive()) {
    const phase = state.circuit[2].angle;
    $("bell-phase").value = phase;
    $("bell-phase-value").textContent = `${f(phase)} rad`;
    math(
      $("bell-phase-equation"),
      String.raw`\vartheta=s\phi,\quad\lvert\psi(s)\rangle=e^{-i\vartheta/2}\frac{\lvert00\rangle+e^{i\vartheta}\lvert11\rangle}{\sqrt2},\quad\langle XX\rangle=\cos\vartheta,\quad\langle YY\rangle=-\cos\vartheta`,
      "A Z rotation on the Bell pair changes relative phase and interference while preserving computational populations.",
      {
        φ: "Target relative phase in radians, stored as the Rz angle in the shared circuit. The leading exponential is a global phase and does not affect probabilities.",
        ϑ: "Live relative phase in radians. The shared execution fraction s times the target Rz angle φ.",
        s: "The shared dimensionless execution fraction, from zero to one. Virtual-Z evolution is scrubbed by reference angle, with no fictitious pulse duration.",
      },
    );
  }
}
function setBellPhase(value) {
  stop();
  if (!phaseExperimentActive()) return;
  state.acquired = false;
  state.fraction = 1;
  state.circuit[2].angle = Number(value);
  renderQuantum();
}

function renderQuantum(live = false) {
  document.body.classList.toggle("measuring", state.acquired);
  const result = current();
  if (!live || visibleViews.has(document.querySelector(".experiment-story")))
    renderStory(result);
  if (!live) renderGateCalculation();
  else if ($("exact-working").open && visibleViews.has($("gate-calculation")))
    gateCalculation.sync(state.fraction);
  renderAmplitudeFlow(
    live && !visibleViews.has(document.querySelector(".amplitude-theatre")),
  );
  const op = activeOperation();
  $("mobile-operation").textContent = op
    ? `${op.name} · q${op.target} · ${Math.round(state.fraction * 100)}%`
    : "Initialized register";
  $("mobile-play").textContent = state.playing ? "Pause" : "Play";
  renderCircuit();
  renderOperation();
  if (!live || visibleViews.has(document.querySelector(".state-panel")))
    renderState(result);
  if (!live || visibleViews.has(document.querySelector(".geometry-panel")))
    renderGeometry(result);
  renderCoherent(result);
  renderCoherence();
  if (!live || visibleViews.has(document.querySelector(".control-panel")))
    renderControl();
  if (!live || visibleViews.has(document.querySelector(".readout-panel")))
    renderReadout();
  if (!live || visibleViews.has($("viewport"))) syncScene();
  $("scene-note").textContent = activeOperation()
    ? `${activeOperation().name} · q${activeOperation().target} · matrix, state, and pulse linked`
    : "Initialization · chosen computational state";
}
function triggerActive() {
  const op = activeOperation();
  if (op) {
    const pulses = compile(op);
    if (pulses.some((p) => p.kind === "drive" || p.kind === "flux"))
      scene?.trigger("drive");
    else if (op.name === "M") scene?.trigger("readout");
    $("scene-status").textContent = pulses.every((p) => p.kind === "frame")
      ? "VIRTUAL Z · CONTROLLER FRAME UPDATE"
      : op.name === "M"
        ? "RESONATOR → ISOLATION → GAIN → ADC"
        : pulses.some((p) => p.kind === "flux")
          ? "COMPILED XY + FLUX INTERACTION"
          : "DAC → MICROWAVE → XY CONTROL LINE";
  }
}
function stop() {
  gateCalculation.cancel();
  state.playing = false;
  state.shotProgress = 1;
  cancelAnimationFrame(animation);
  animation = 0;
  $("play").textContent = "Play experiment";
  $("mobile-play").textContent = "Play";
  $("replay-gate").textContent = "Replay this gate ↻";
  $("coherent-play").textContent = "Run circuit →";
}
function advance() {
  stop();
  state.acquired = false;
  if (state.cursor < state.circuit.length) {
    state.cursor++;
    state.fraction = 1;
    state.acquired = false;
    renderQuantum();
    triggerActive();
    announce(
      `Step ${state.cursor}: ${activeOperation().name}. State normalization ${current()
        .state.reduce((s, a) => s + abs2(a), 0)
        .toFixed(6)}.`,
    );
  }
}
function play(options = {}) {
  const single = options.single === true;
  const resume = state.cursor > 0 && state.fraction < 1 && !state.acquired;
  state.acquired = false;
  if (state.playing) {
    stop();
    return;
  }
  if (!state.circuit.length) return;
  if (!resume && !single) state.cursor = 0;
  state.playing = true;
  $("play").textContent = "Pause";
  if (!resume) {
    state.cursor = single ? Math.max(1, state.cursor) : state.cursor + 1;
    state.fraction = 0;
  }
  renderQuantum();
  startTime = performance.now() - (resume ? 700 + 4400 * state.fraction : 0);
  triggerActive();
  const tick = (now) => {
    if (!state.playing) return;
    if (document.hidden) {
      stop();
      return;
    }
    const elapsed = now - startTime;
    const previousFraction = state.fraction;
    state.fraction = state.reduced
      ? 1
      : Math.max(0, Math.min(1, (elapsed - 700) / 4400));
    if (
      (state.fraction !== previousFraction && now - lastRender > 15) ||
      (state.fraction === 1 && previousFraction < 1)
    ) {
      renderQuantum(true);
      lastRender = now;
    }
    if (now - startTime >= (state.reduced ? 1400 : 6900)) {
      if (single || state.cursor === state.circuit.length) {
        stop();
        state.fraction = 1;
        renderQuantum();
        if (!single) acquire();
        return;
      }
      state.cursor++;
      state.fraction = 0;
      startTime = now;
      renderQuantum();
      triggerActive();
    }
    animation = requestAnimationFrame(tick);
  };
  animation = requestAnimationFrame(tick);
}
function acquire() {
  stop();
  state.acquired = true;
  state.shotProgress = state.reduced ? 1 : 1 / Number($("shots").value);
  state.fraction = 1;
  renderQuantum();
  if (!state.reduced) {
    const begun = performance.now();
    let drawn = 0;
    const collect = (now) => {
      if (!state.acquired) return;
      state.shotProgress = Math.min(
        1,
        Math.max(1 / Number($("shots").value), (now - begun) / 1800),
      );
      if (now - drawn > 90 || state.shotProgress === 1) {
        renderReadout();
        renderCoherent(current());
        scene?.update({ shotProgress: state.shotProgress });
        drawn = now;
      }
      if (state.shotProgress < 1) animation = requestAnimationFrame(collect);
    };
    animation = requestAnimationFrame(collect);
  }
  scene?.trigger("readout");
  $("scene-status").textContent =
    "READOUT PULSE → RESONATOR → ISOLATION → GAIN → ADC → CLASSIFIER";
  announce(
    `${$("shots").value} seeded readout shots acquired in basis ${$("measurement-basis").value}.`,
  );
}
function addGate() {
  state.acquired = false;
  if (state.circuit.length >= 20) {
    $("circuit-message").textContent =
      "This inspectable simulator is limited to 20 circuit operations.";
    return;
  }
  const op = {
    name: $("gate-select").value,
    target: Number($("gate-target").value),
  };
  if (["CNOT", "CZ"].includes(op.name)) {
    op.control = Number($("gate-control").value);
    if (state.n < 2 || op.target === op.control) {
      $("circuit-message").textContent =
        "Choose different control and target qubits.";
      return;
    }
  }
  if (["Rx", "Ry", "Rz"].includes(op.name))
    op.angle = Number($("gate-angle").value);
  stop();
  state.circuit.push(op);
  state.cursor = state.circuit.length;
  state.fraction = 1;
  renderQuantum();
  triggerActive();
  $("circuit-message").textContent = `Added ${op.name} on q${op.target}.`;
  if (["Rx", "Ry", "Rz"].includes(op.name)) $("gate-select").value = op.name;
}
function bell() {
  stop();
  Object.assign(state, {
    n: 2,
    basis: 0,
    prepared: false,
    circuit: [
      { name: "H", target: 0 },
      { name: "CNOT", control: 0, target: 1 },
    ],
    cursor: 0,
    fraction: 1,
    acquired: false,
    concept: "bell",
  });
  $("measurement-basis").value = "Z";
  rebuildSelectors();
  renderQuantum();
  renderConcept();
}
function basisMap(value) {
  prepare();
  $("theta").value = value ? Math.PI : 0;
  $("phi").value = 0;
  $("gamma").value = 0;
  for (const id of ["theta", "phi", "gamma"])
    $(`${id}-value`).textContent = `${Number($(id).value).toFixed(2)} rad`;
  state.concept = "basis";
  renderQuantum();
  renderConcept();
  announce(
    `Energy eigenstate ${value} maps to basis vector ${value} and the ${value ? "south" : "north"} Bloch pole.`,
  );
}
function prepare() {
  stop();
  state.acquired = false;
  state.prepared = true;
  state.n = 1;
  state.basis = 0;
  state.circuit = [];
  state.cursor = 0;
  state.fraction = 1;
  state.concept = "state";
  rebuildSelectors();
  renderQuantum();
  renderConcept();
}
function toggle(id, key) {
  $(id).onclick = () => {
    state[key] = !state[key];
    $(id).setAttribute("aria-pressed", state[key]);
    if (key === "labels") $("scene-labels").hidden = !state.labels;
    syncScene();
  };
}
$("source-list").innerHTML = sources
  .map(
    (s) =>
      `<article class="source-entry" id="source-${s.id}"><a href="${s.url}" target="_blank" rel="noreferrer">${s.title} ↗</a><p>${s.claim}</p></article>`,
  )
  .join("");
$("glossary").innerHTML = Object.entries(glossary)
  .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
  .join("");
$("sources-open").onclick = () => $("source-drawer").showModal();
$("sources-close").onclick = () => $("source-drawer").close();
$("machine-tab").onclick = () => chapter("machine");
$("compute-tab").onclick = () => chapter("compute");
$("begin").onclick = () => {
  if (state.installed.length === 12) chapter("compute");
  else if (state.status === "intro") place();
  else if (state.installed.includes(state.stage))
    stageTo(Math.min(11, state.stage + 1));
  else place();
};
$("explore").onclick = () => {
  state.focus = null;
  state.stage = 11;
  state.noise = false;
  state.heat = false;
  state.installed = stages.map((_, i) => i);
  state.status = "freeExplore";
  save();
  renderAssembly();
};
$("restart").onclick = () => {
  state.focus = null;
  state.installed = [];
  state.stage = 0;
  state.status = "intro";
  state.noise = false;
  state.heat = false;
  state.explode = false;
  $("explode").setAttribute("aria-pressed", "false");
  save();
  renderAssembly();
};
for (const id of ["rotate", "explode", "cutaway", "labels", "heat", "noise"])
  toggle(id, id);
$("processor-view").onclick = () => {
  state.focus = "processor";
  syncScene();
};
$("reset-view").onclick = () => {
  state.focus = null;
  syncScene();
  scene?.reset();
};
$("signal").onclick = () => {
  scene?.trigger();
  $("scene-status").textContent =
    "CONTROL DESCENDS · READOUT RETURNS · CONCEPTUAL SIGNAL FLOW";
};
$("motion").onclick = () => {
  state.reduced = !state.reduced;
  document.body.classList.toggle("reduced-motion", state.reduced);
  $("motion").setAttribute("aria-pressed", state.reduced);
  save();
  syncScene();
  if (state.chapter === "compute") renderGateCalculation();
};
$("motion").setAttribute("aria-pressed", state.reduced);
document.body.classList.toggle("reduced-motion", state.reduced);
$("sound").onclick = () => {
  state.sound = !state.sound;
  $("sound").setAttribute("aria-pressed", state.sound);
  $("sound").textContent = state.sound ? "Sound on" : "Sound off";
  if (state.sound) clickSound();
};
$("accessibility").onclick = () => {
  state.html = !state.html;
  document.body.classList.toggle("html-mode", state.html);
  $("accessibility").setAttribute("aria-pressed", state.html);
  $("render-mode").textContent = state.html
    ? "HTML / ACCESSIBLE CUTAWAY"
    : "3D / EDUCATIONAL SCALE";
  syncScene();
  if (!state.html) loadScene();
};
$("gate-select").innerHTML = Object.keys(operations)
  .map((name) => `<option>${name}</option>`)
  .join("");
$("gate-select").onchange = updateBuilder;
$("gate-angle").oninput = () => {
  updateBuilder();
  const op = activeOperation();
  if (op && ["Rx", "Ry", "Rz"].includes(op.name)) {
    stop();
    op.angle = Number($("gate-angle").value);
    state.fraction = 1;
    renderQuantum();
  }
};
$("add-gate").onclick = addGate;
$("qubits").onchange = () => {
  stop();
  state.acquired = false;
  state.n = Number($("qubits").value);
  state.basis = 0;
  state.prepared = false;
  state.circuit = [];
  state.cursor = 0;
  state.fraction = 1;
  rebuildSelectors();
  renderQuantum();
};
$("initial-basis").onchange = () => {
  stop();
  state.acquired = false;
  state.basis = Number($("initial-basis").value);
  state.prepared = false;
  state.cursor = 0;
  state.fraction = 1;
  renderQuantum();
};
$("bell-preset").onclick = bell;
$("clear-circuit").onclick = () => {
  stop();
  state.acquired = false;
  state.circuit = [];
  state.cursor = 0;
  state.fraction = 1;
  renderQuantum();
};
$("undo-gate").onclick = () => {
  stop();
  state.acquired = false;
  state.circuit.pop();
  state.cursor = Math.min(state.cursor, state.circuit.length);
  state.fraction = 1;
  renderQuantum();
};
$("previous-step").onclick = () => {
  stop();
  state.acquired = false;
  state.cursor = Math.max(0, state.cursor - 1);
  state.fraction = 1;
  renderQuantum();
};
$("next-step").onclick = advance;
$("play").onclick = () => {
  const started = !state.playing;
  play();
  if (started && state.playing) {
    $("circuit-tools").open = false;
    $("coherent-stage").scrollIntoView({
      block: "start",
      behavior: state.reduced ? "auto" : "smooth",
    });
    $("coherent-play").focus({ preventScroll: true });
  }
};
$("mobile-play").onclick = play;
document.querySelectorAll("[data-view]").forEach(
  (button) =>
    (button.onclick = () => {
      document.querySelector(`.${button.dataset.view}-panel`).scrollIntoView({
        block: "start",
        behavior: state.reduced ? "auto" : "smooth",
      });
    }),
);
$("prepare-state").onclick = prepare;
$("try-interference").onclick = () => {
  $("theta").value = Math.PI / 2;
  $("phi").value = 0;
  $("gamma").value = 0;
  prepare();
  state.circuit = [{ name: "H", target: 0 }];
  state.cursor = 1;
  state.flowOutput = 1;
  renderQuantum();
  announce(
    "One-qubit interference experiment. Change relative or global phase to inspect cancellation.",
  );
};
for (const [control, original] of [
  ["relative", "phi"],
  ["global", "gamma"],
])
  $(`flow-${control}`).oninput = () => {
    $(original).value = $(`flow-${control}`).value;
    $(original).dispatchEvent(new Event("input", { bubbles: true }));
  };
$("interfere").onclick = () => {
  state.acquired = false;
  if (!state.prepared) prepare();
  if (state.circuit.length < 20) {
    state.circuit.push({ name: "H", target: 0 });
    state.cursor = state.circuit.length;
    renderQuantum();
  }
};
for (const id of ["theta", "phi", "gamma"]) {
  $(`${id}-value`).textContent = `${Number($(id).value).toFixed(2)} rad`;
  $(id).oninput = () => {
    $(`${id}-value`).textContent = `${Number($(id).value).toFixed(2)} rad`;
    if (state.prepared) {
      stop();
      state.acquired = false;
      state.fraction = 1;
      renderQuantum();
    }
  };
}
$("euler-controls").innerHTML = ["alpha", "beta", "delta"]
  .map(
    (id) =>
      `<label>Euler ${id}<input id="euler-${id}" type="range" min="-3.141593" max="3.141593" step="any" value="1.570796"><output id="euler-${id}-value">1.57 rad</output></label>`,
  )
  .join("");
for (const id of ["alpha", "beta", "delta"])
  $(`euler-${id}`).oninput = () => {
    $(`euler-${id}-value`).textContent =
      `${Number($(`euler-${id}`).value).toFixed(2)} rad`;
  };
$("apply-euler").onclick = () => {
  state.acquired = false;
  if (state.circuit.length > 17) {
    $("circuit-message").textContent =
      "Leave room for three Euler rotations (20-operation limit).";
    return;
  }
  stop();
  const target = Number($("gate-target").value);
  state.circuit.push(
    { name: "Rz", target, angle: Number($("euler-delta").value) },
    { name: "Ry", target, angle: Number($("euler-beta").value) },
    { name: "Rz", target, angle: Number($("euler-alpha").value) },
  );
  state.cursor = state.circuit.length;
  state.fraction = 1;
  renderQuantum();
};
for (const id of [
  "drive-frequency",
  "pulse-scale",
  "readout-noise",
  "threshold",
])
  $(id).oninput = () => {
    $(`${id}-value`).textContent = Number($(id).value).toFixed(
      id === "drive-frequency" ? 3 : 2,
    );
    if (id === "drive-frequency" || id === "pulse-scale") renderControl();
    else renderReadout();
  };
$("sample").onclick = acquire;
$("shots").onchange = renderReadout;
$("seed").onchange = () => {
  if (!Number.isFinite(Number($("seed").value))) $("seed").value = 42;
  renderQuantum();
};
$("measurement-basis").onchange = () => {
  renderQuantum();
  announce(
    `Independent terminal acquisition in basis ${$("measurement-basis").value}. These basis changes occur immediately before readout.`,
  );
};
$("compare-mixture").onclick = compareMixture;
$("symbol-inspector-close").onclick = () => {
  $("symbol-inspector").hidden = true;
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") $("symbol-inspector").hidden = true;
});
$("symbol-explorer").innerHTML =
  '<p class="eyebrow">SELECT A SYMBOL · IDENTIFY ITS OPERATIONAL MEANING</p><div class="symbols">' +
  Object.keys(symbolMeanings)
    .map(
      (s, i) =>
        `<button data-symbol="${i}" aria-label="Explain symbol ${s}">${s}</button>`,
    )
    .join("") +
  '</div><div id="symbol-meaning" role="status">Select a symbol to connect it to an amplitude, control parameter, or component.</div>';
$("symbol-explorer")
  .querySelectorAll("button")
  .forEach(
    (b) =>
      (b.onclick = () => {
        const key = Object.keys(symbolMeanings)[Number(b.dataset.symbol)],
          meaning = symbolMeanings[key];
        $("symbol-meaning").textContent = meaning;
        $("inspected-symbol").textContent = key;
        $("inspected-meaning").textContent = meaning;
        $("symbol-inspector").hidden = false;
        announce(meaning);
      }),
  );
$("inspect-coherence").onclick = () => {
  $("coherence-inspector").open = true;
  renderCoherence();
  $("coherence-inspector").scrollIntoView({
    block: "start",
    behavior: state.reduced ? "auto" : "smooth",
  });
};
$("bell-phase-experiment").onclick = () => {
  bell();
  state.circuit.push({ name: "Rz", target: 0, angle: 0 });
  state.cursor = 3;
  state.fraction = 1;
  renderQuantum();
  $("coherent-stage").scrollIntoView({
    block: "start",
    behavior: state.reduced ? "auto" : "smooth",
  });
};
$("bell-phase").oninput = (event) => setBellPhase(event.target.value);
$("stage-bell-phase").oninput = (event) => setBellPhase(event.target.value);
document
  .querySelectorAll("[data-bell-phase]")
  .forEach(
    (button) => (button.onclick = () => setBellPhase(button.dataset.bellPhase)),
  );
document.querySelectorAll("[data-coherence-basis]").forEach(
  (button) =>
    (button.onclick = () => {
      $("measurement-basis").value = button.dataset.coherenceBasis;
      acquire();
      document.querySelector(".readout-panel").scrollIntoView({
        block: "start",
        behavior: state.reduced ? "auto" : "smooth",
      });
    }),
);
$("show-exact").onclick = () => {
  $("exact-working").open = true;
};
document.addEventListener(
  "toggle",
  (event) => {
    if (
      state.chapter === "compute" &&
      event.target.tagName === "DETAILS" &&
      event.target.open
    )
      renderQuantum();
  },
  true,
);
$("replay-gate").onclick = () => play({ single: true });
$("coherent-play").onclick = () => play();
$("execution-scrub").oninput = () => {
  stop();
  state.acquired = false;
  state.fraction = Number($("execution-scrub").value);
  renderQuantum();
};
rebuildSelectors();
renderAssembly();
renderConcept();
renderHamiltonian();
const compactLayout = matchMedia("(max-width:720px)");
compactLayout.addEventListener("change", () => {
  if (state.chapter === "compute") renderQuantum();
});
const media = matchMedia("(prefers-reduced-motion:reduce)");
media.addEventListener("change", (e) => {
  state.reduced = e.matches;
  document.body.classList.toggle("reduced-motion", state.reduced);
  $("motion").setAttribute("aria-pressed", state.reduced);
  syncScene();
  if (state.chapter === "compute") renderGateCalculation();
});
window.addEventListener("pagehide", () => {
  stop();
  gateCalculation.cancel();
  scene?.dispose();
  scene = null;
  loadingScene = null;
  audio?.close();
  audio = null;
  document.body.classList.remove("webgl");
});
window.addEventListener("pageshow", (e) => {
  if (e.persisted) loadScene();
});
// Expose read-only diagnostics for browser QA; calculations use the same model as the UI.
window.quantumLab = {
  snapshot: () => ({
    chapter: state.chapter,
    status: state.status,
    fraction: state.fraction,
    playing: state.playing,
    native: nativeSegment(),
    pulseIntensity: pulseIntensity(),
    shotProgress: state.shotProgress,
    diagnostic: state.diagnostic,
    stage: state.stage,
    installed: [...state.installed],
    qubits: state.n,
    cursor: state.cursor,
    state: current().state,
    probabilities: ensembleProbabilities(),
    stats: scene?.stats() ?? null,
  }),
};
document
  .querySelectorAll(
    ".experiment-story, #gate-calculation, .amplitude-theatre, .state-panel, .geometry-panel, .control-panel, .readout-panel, #viewport",
  )
  .forEach((element) => liveViewObserver.observe(element));
loadScene();

if (location.hash === "#compute" || location.hash === "#phase") {
  chapter("compute");
  if (location.hash === "#phase") {
    $("coherence-inspector").open = true;
    $("bell-phase-experiment").click();
  }
}
