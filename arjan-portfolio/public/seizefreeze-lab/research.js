import { defaults, conditions } from './organoid-model.js';

const $ = id => document.getElementById(id), ns = 'http://www.w3.org/2000/svg';
const fields = { seed: ['Random seed', 0, 4294967295, 1, 'integer'], radiusMm: ['Sphere radius', .5, 3, .1, 'mm'],
  contactResistance: ['Medium → cold resistance', .5, 80, .5, 'K/W'], rejectionResistance: ['Hot rejection resistance', 1, 80, 1, 'K/W'],
  currentLimit: ['Current limit', 0, .4, .01, 'A'], conductivity: ['Tissue conductivity', .1, 1, .05, 'W/(m K)'] };
const descriptions = {
  baseline: 'The same synthetic network activity continues while actuation is disabled. The inert thermal system remains passive.',
  sham: 'A labeled zero-current computational control. Its passive physics equals baseline; real handling or recording artifacts are not reproduced by a sham label.',
  perturbation: 'An illustrative population detector gates current during the first synthetic episode. Medium-temperature feedback, finite storage and rejection determine the thermal response.',
  recovery: 'The command is interrupted at the authored simulation time. Stored heat, conduction and finite environmental exchange continue during recovery.',
  repeated: 'Repeated synthetic episodes can request actuation. Inspect residual storage and actual current; later peaks need not increase under feedback.',
  sensor: 'A simulated medium-temperature sensor fails and latches the command off. This is a software fault demonstration, not certified hardware protection.',
  rejection: 'Effective hot-side rejection resistance is four times the selected input. The reservoir temperature remains fixed; the module hot face is not held at a fixed temperature.',
  contact: 'Effective medium-to-cold resistance is four times the selected input. Geometry, medium mixing and tissue surface exchange remain assumed independently.' };
const components = {
  tissue: ['Spherical thermal article', 'MODELING ASSUMPTION', 'A nonperfused sphere exchanges heat across its entire surface with one well-mixed medium node. It is an organoid-inspired thermal domain, not a miniature adult brain or measured preparation.', 'Thermal energy / radial conduction', 'Size, conductivity, boundary coupling and missing heterogeneity require calibration.', 'A reduced spherical field cannot predict local planar contact or biological response.'],
  medium: ['Culture-environment abstraction', 'MODELING ASSUMPTION', 'One finite thermal store represents well-mixed surrounding medium. It exchanges heat with the spherical article, substrate, hot-side leakage and an ideal environmental reservoir.', 'Thermal energy / finite storage', 'No flow, evaporation, concentration gradients or measured culture geometry is resolved.', 'Unmodeled gradients could make the single medium sensor unrepresentative.'],
  recording: ['Extracellular recording interface', 'PROPOSED INSTRUMENTATION', 'A generic electrode substrate illustrates a possible research readout. The sphere is drawn with an illustrative gap; electrode coupling is unresolved. No signal is acquired from this rendered geometry.', 'Extracellular voltage / synthetic in this demonstration', 'Requires suitable acquisition bandwidth, reference, electrode coupling and qualified assay instrumentation.', 'Poor coupling, reference contamination or actuator artifacts can mimic changes.'],
  cooler: ['Thermoelectric module', 'USER-REPORTED HARDWARE / EXACT PART UNKNOWN', 'The builder reports a Peltier element. This generic drawing does not identify its part number, dimensions or performance. Virtual TEC coefficients are independent modeling assumptions.', 'Electric current and thermal energy', 'Heat extracted plus electrical input must reach the hot side. The actual module needs characterization.', 'Inadequate rejection or a failed command can accumulate heat.'],
  sensor: ['Independent thermometry', 'PROPOSED / CONFIGURATION UNVERIFIED', 'The numerical sensor observes well-mixed medium through an assumed lag. No physical sensor identity, calibration or recorded temperature has been supplied.', 'Temperature measurement / synthetic', 'Location, lag, uncertainty and independent verification must be established.', 'Lag, missing values and artifacts can corrupt feedback.'],
  rejection: ['External heat-rejection path', 'PROPOSED / MODELING ASSUMPTION', 'A finite resistance connects a heat-storing hot node to an ideal fixed-temperature environment. The drawing is an explanatory external sink, not documented prototype hardware.', 'Extracted heat plus electrical input', 'Real sink capacity, contact, ambient conditions and driver losses require measurements.', 'Finite rejection permits hot-side accumulation and feedback shutdown.'],
  controller: ['Arduino-based controller', 'USER-REPORTED / BOARD UNKNOWN', 'The builder reports Arduino-based control hardware. No identified board, firmware, timing record or working closed-loop experiment was found in the available project records.', 'Logic, timing and actuator commands', 'Board identity, firmware provenance, electrical isolation and power interfaces must be documented.', 'A stuck command, reset or shared-ground artifact could compromise the experiment.'],
  acquisition: ['Salvaged NeuroSky electronics', 'USER-REPORTED / MODULE UNKNOWN', 'The builder reports electronics salvaged from a NeuroSky headset. Consumer scalp EEG, ECoG and organoid MEA acquisition are distinct measurement systems. No organoid capability is assigned to this board.', 'Electrical signal acquisition / no measured data here', 'Exact module, reference, filters, scaling and acquisition quality need verification.', 'Motion, muscle, poor contact and electrical artifacts may confound the signal.'],
  driver: ['Current driver and power', 'PROPOSED / CONFIGURATION UNVERIFIED', 'A separate generic block represents the required actuator-power interface. No completed driver, supply or wiring configuration is claimed.', 'Electrical input and conversion losses', 'Module current/voltage requirements and control isolation need a documented circuit.', 'Saturation, uncontrolled current and conversion heat are unresolved hardware risks.'] };
let mode = 'organoid', scene = null, result = null, comparison = null, worker = null, requestId = 0, pending = false;
let index = 0, playing = false, timer = 0, startWall = 0, startTime = 0, staticView = false, sectioned = false, disposed = false, selected = 'tissue';
let requestedPlan = null, capturedPlan = null;
let selecting = false;
let sceneError = '', modelError = '', lastInputs = { ...defaults };
const fmt = (v, n = 3) => Number.isFinite(v) ? v.toFixed(n) : 'Unavailable';
function el(name, attrs = {}, text) { const node = document.createElementNS(ns, name); for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); if (text !== undefined) node.textContent = text; return node; }
function math() { if (window.katex) document.querySelectorAll('[data-research-latex]').forEach(node => window.katex.render(node.dataset.researchLatex, node, { displayMode: true, throwOnError: false, output: 'htmlAndMathml' })); }
window.addEventListener('load', math, { once: true }); math();
for (const [value, label] of Object.entries(conditions)) { const option = document.createElement('option'); option.value = value; option.textContent = label; $('research-condition').append(option); }
for (const [name, [label, min, max, step, unit]] of Object.entries(fields)) {
  const wrap = document.createElement('div'), lab = document.createElement('label'), input = document.createElement('input'), small = document.createElement('span');
  lab.htmlFor = 'research-' + name; lab.textContent = label; input.id = lab.htmlFor; input.type = 'number'; input.name = name; input.min = min; input.max = max; input.step = step; input.required = true; input.value = defaults[name];
  small.className = 'unit'; small.textContent = unit + ' · assumed'; wrap.append(lab, input, small); $('research-parameters').append(wrap);
}
for (let i = 0; i < 8; i++) { const option = document.createElement('option'); option.value = i; option.textContent = i + 1; $('signal-channel').append(option); }
$('research-condition').value = defaults.condition;
function inspect(id, fromScene = false) {
  if (!components[id]) return; selected = id;
  const [name, status, reading, quantity, constraint, failure] = components[id];
  $('research-component').innerHTML = `<p class="evidence-tag">${status}</p><h3>${name}</h3><p>${reading}</p><dl><dt>What passes through it</dt><dd>${quantity}</dd><dt>Constraint</dt><dd>${constraint}</dd><dt>What could fail</dt><dd>${failure}</dd></dl><a href="./${['controller', 'acquisition', 'driver', 'cooler'].includes(id) ? 'PROTOTYPE_EVIDENCE.md' : 'ORGANOID_MODEL.md'}">Inspect supporting record ↗</a>`;
  for (const button of $('research-components').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.component === id));
  if (!fromScene && scene) { selecting = true; scene.select?.(id); selecting = false; }
  if (fromScene) $('component-disclosure').open = true;
}
function componentButtons() {
  const ids = mode === 'prototype' ? ['controller', 'acquisition', 'cooler', 'driver', 'sensor', 'rejection'] : ['tissue', 'medium', 'recording', 'cooler', 'sensor', 'rejection'];
  const labels = { tissue: 'Sphere', medium: 'Medium', recording: 'Recording', cooler: 'TEC', sensor: 'Sensor', rejection: 'Heat rejection', controller: 'Controller', acquisition: 'Acquisition', driver: 'Driver + power' };
  $('research-components').replaceChildren(...ids.map(id => { const b = document.createElement('button'); b.textContent = labels[id]; b.dataset.component = id; b.addEventListener('click', () => inspect(id)); return b; })); inspect(mode === 'prototype' ? 'controller' : 'tissue');
}
function setMode(next) {
  if (!['prototype', 'organoid', 'summary'].includes(next)) return;
  pause(); mode = next; document.body.dataset.mode = mode;
  for (const button of document.querySelectorAll('.mode-nav button')) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  $('workbench').hidden = mode === 'summary'; $('summary-panel').hidden = mode !== 'summary';
  $('prototype-panel').hidden = mode !== 'prototype'; $('prototype-intro').hidden = mode !== 'prototype';
  $('experiment-panel').hidden = mode !== 'organoid'; $('experiment-output').hidden = mode !== 'organoid' || !result; $('section-view').hidden = mode !== 'organoid'; $('stage-transport').hidden = mode !== 'organoid';
  document.querySelector('.reference-tag').textContent = mode === 'prototype' ? 'PART IDENTITY UNVERIFIED' : 'MODEL / NOT MICROSCOPY';
  $('stage-title').textContent = mode === 'prototype' ? 'Prototype Workbench' : 'Organoid Research Workbench';
  $('stage-status').textContent = mode === 'prototype' ? 'GENERIC BENCH LAYOUT · REPORTED PARTS / PROPOSED CONNECTIONS' : 'ILLUSTRATIVE GEOMETRY · COMPUTED RADIAL TEMPERATURES';
  $('research-caption').textContent = mode === 'prototype' ? 'Diagrammatic bench-scale parts; exact dimensions, connections and operating behavior are unverified. Gray dashed outlines identify proposed instrumentation. No implant miniaturization or measured hardware response is implied.' : 'The sphere exchanges heat across its whole surface with well-mixed medium. Colors map computed radial shells. The drawn recording gap and one-sided apparatus are illustrative; no resolved planar cooling field or verified electrode contact is implied.';
  if (mode !== 'summary') { scene?.setMode(mode); if (result && mode === 'organoid') scene?.update(result.frames[index], result.params); componentButtons(); }
  staticDisplay(staticView);
}
function staticDisplay(value) {
  staticView = value; const canvas = $('research-scene').querySelector('canvas'), overlay = $('research-scene').querySelector('[data-research-overlay]');
  if (canvas) canvas.hidden = value; if (overlay) overlay.hidden = value;
  $('research-poster').hidden = !value || mode === 'prototype'; $('static-research').setAttribute('aria-pressed', String(value)); $('static-research').textContent = value ? 'Try interactive 3D' : 'Use static diagram';
  $('section-view').disabled = value || !scene; $('reset-view').disabled = value || !scene;
  $('scene-loading').hidden = true;
  if (value && mode === 'prototype') { $('scene-loading').textContent = '3D unavailable or paused. Use the component inspector and evidence inventory to explore the reported bench hardware.'; $('scene-loading').hidden = false; }
}
function inputs() { const config = { ...lastInputs, condition: $('research-condition').value }; for (const name of Object.keys(fields)) config[name] = Number($('research-' + name).value); return config; }
function timeIndex(time) {
  if (!result || !Number.isFinite(time)) return 0;
  if (time >= result.params.duration) return result.frames.length - 1;
  let low = 0, high = result.frames.length - 1;
  while (low < high) { const middle = Math.floor((low + high) / 2); if (result.frames[middle].t < time) low = middle + 1; else high = middle; }
  return low && Math.abs(result.frames[low - 1].t - time) < Math.abs(result.frames[low].t - time) ? low - 1 : low;
}
function pause() { playing = false; clearTimeout(timer); $('research-play').textContent = 'Play'; $('stage-play').textContent = 'Play'; }
function readyControls() { $('run-experiment').disabled = !worker; $('compare-sham').disabled = !worker; for (const id of ['stage-play', 'stage-timeline', 'research-play', 'research-replay', 'research-timeline', 'export-json', 'export-csv', 'export-summary']) $(id).disabled = !result || pending; }
function fail(message) { pause(); pending = false; modelError = message; result = comparison = null; $('experiment-output').hidden = true; staticDisplay(true); readyControls(); $('research-status').textContent = 'Experiment unavailable: ' + message; $('comparison-section').hidden = true; $('experiment-teaching').textContent = 'No current numerical result is available. The model/evidence documents and component inspector remain accessible.'; }
function run(compare = false, config = inputs(), controlCondition = $('comparison-control').value) {
  pause(); if (!worker) { fail('The research worker could not start.'); return; }
  requestedPlan = { hypothesis: $('hypothesis').value, analysis: $('analysis-plan').value, capturedBeforeComputation: true, externalPreregistration: false, status: 'Local computational plan captured at run start; not an external preregistration' };
  lastInputs = { ...config }; pending = true; modelError = ''; readyControls();
  $('condition-reading').textContent = descriptions[config.condition] || '';
  $('research-status').textContent = `Computing ${conditions[config.condition]}${result ? '; graphs retain the previous completed run until this calculation finishes' : ''}…`;
  try { worker.postMessage({ id: ++requestId, kind: compare ? 'compare' : 'run', inputs: config, controlCondition }); } catch (error) { fail(error.message); }
}
function endpoint(run) { return { min: Math.min(...run.frames.map(f => f.tissueMean)) - run.params.referenceTemperature, hot: run.summary.maxHot - run.params.referenceTemperature, energy: run.summary.electricalEnergy, residual: run.summary.maxResidual }; }
function axis(id, min, max, duration, unit) {
  const svg = $(id); svg.replaceChildren(); if (max - min < 1e-9) { min -= .5; max += .5; }
  const x = t => 48 + t / duration * 576, y = value => 192 - (value - min) / (max - min) * 162;
  for (let i = 0; i < 5; i++) { const value = min + (max - min) * i / 4, yy = y(value); svg.append(el('line', { x1: 48, x2: 624, y1: yy, y2: yy, stroke: '#344c5b', 'stroke-width': .5 }), el('text', { x: 40, y: yy + 4, fill: '#b9cbd3', 'font-size': 10, 'text-anchor': 'end' }, value.toFixed(Math.abs(max - min) < 3 ? 2 : 0))); }
  for (let i = 0; i < 5; i++) svg.append(el('text', { x: x(duration * i / 4), y: 213, fill: '#b9cbd3', 'font-size': 10, 'text-anchor': 'middle' }, (duration * i / 4).toFixed(0)));
  svg.append(el('text', { x: 48, y: 16, fill: '#b9cbd3', 'font-size': 10 }, unit), el('text', { x: 624, y: 229, fill: '#b9cbd3', 'font-size': 10, 'text-anchor': 'end' }, 'Time / s'));
  return { svg, x, y };
}
function line(plot, frames, value, color, dash = '') { plot.svg.append(el('path', { d: frames.filter((_, i) => i % 3 === 0 || i === frames.length - 1).map((f, i) => `${i ? 'L' : 'M'}${plot.x(f.t).toFixed(2)},${plot.y(value(f)).toFixed(2)}`).join(''), fill: 'none', stroke: color, 'stroke-width': 1.5, 'stroke-dasharray': dash })); }
function staticCharts() {
  const ref = result.params.referenceTemperature, frames = result.frames, temperatures = frames.flatMap(f => [f.tissueMean - ref, f.medium - ref, f.Th - ref]);
  if (comparison) temperatures.push(...comparison.frames.map(f => f.tissueMean - ref));
  const temp = axis('research-temperature', Math.floor(Math.min(...temperatures) * 2) / 2 - .1, Math.ceil(Math.max(...temperatures) * 2) / 2 + .1, result.params.duration, 'ΔT / K');
  line(temp, frames, f => f.tissueMean - ref, '#8ed5df'); line(temp, frames, f => f.medium - ref, '#d0d8d9', '3 3'); line(temp, frames, f => f.Th - ref, '#d8b482'); if (comparison) line(temp, comparison.frames, f => f.tissueMean - ref, '#bcb9d4', '2 5');
  const population = axis('research-population', 0, Math.max(100, ...frames.map(f => Math.max(f.feature, f.groundTruthCount * 4))) * 1.08, result.params.duration, 'Population / synthetic events per s');
  line(population, frames, f => f.feature, '#bdabe5'); line(population, frames, f => f.groundTruthCount * 4, '#cbd6d8', '3 4');
  const control = axis('research-control', 0, Math.max(.05, ...frames.map(f => Math.max(f.current, f.command))) * 1.2, result.params.duration, 'Actual current / A'); line(control, frames, f => f.command, '#a8cbeb', '4 4'); line(control, frames, f => f.current, '#83b8ec');
  const burstPath = frames.filter((f, i) => f.detected && i % 3 === 0).map(f => `M${control.x(f.t).toFixed(1)},28v7`).join(''); control.svg.append(el('path', { d: burstPath, stroke: '#bdabe5', 'stroke-width': 1.3 }));
  const raster = $('research-raster'); raster.replaceChildren(); const x = t => 48 + t / result.params.duration * 576;
  for (const artifact of result.signals.artifacts) raster.append(el('rect', { x: x(artifact.start), y: 25, width: Math.max(2, x(artifact.end) - x(artifact.start)), height: 168, fill: '#d8b482', opacity: .3 }));
  for (let channel = 0; channel < 8; channel++) raster.append(el('text', { x: 34, y: 42 + channel * 20, fill: '#b9cbd3', 'font-size': 10, 'text-anchor': 'end' }, channel + 1));
  for (const [events, color, offset] of [[result.signals.events, '#bdabe5', 0], [result.signals.detections, '#cad5d7', 6]]) {
    const bins = new Set(events.map(e => `${e.channel},${Math.floor(e.t * 10)}`));
    const d = [...bins].map(key => { const [c, bin] = key.split(',').map(Number); return `M${x(bin / 10).toFixed(1)},${35 + c * 20 + offset}v4`; }).join(''); raster.append(el('path', { d, stroke: color, 'stroke-width': 1, opacity: .85 }));
  }
  for (let i = 0; i < 5; i++) raster.append(el('text', { x: x(result.params.duration * i / 4), y: 213, fill: '#b9cbd3', 'font-size': 10, 'text-anchor': 'middle' }, result.params.duration * i / 4));
  raster.append(el('text', { x: 48, y: 16, fill: '#b9cbd3', 'font-size': 10 }, 'Channel / 100 ms event bins'), el('text', { x: 624, y: 229, fill: '#b9cbd3', 'font-size': 10, 'text-anchor': 'end' }, 'Time / s'));
  for (const svg of [temp.svg, control.svg, population.svg, raster]) svg.append(el('line', { 'data-clock': '', x1: 48, x2: 48, y1: 25, y2: 193, stroke: '#e1eeef', 'stroke-width': 1, 'stroke-dasharray': '3 4' }));
}
function voltage(frame) {
  const channel = Number($('signal-channel').value), signal = result.signals.channels[channel], rate = result.signals.sampleRateHz;
  const start = Math.max(0, Math.min(result.params.duration - Math.min(4, result.params.duration), frame.t - 2)), end = Math.min(result.params.duration, start + 4), first = Math.round(start * rate), last = Math.min(signal.length - 1, Math.round(end * rate));
  const values = signal.slice(first, last + 1), limit = Math.max(35, ...values.map(Math.abs)), svg = $('research-voltage'); svg.replaceChildren();
  const x = t => 48 + (t - start) / Math.max(.001, end - start) * 576, y = v => 110 - v / limit * 78;
  svg.append(el('line', { x1: 48, x2: 624, y1: 110, y2: 110, stroke: '#344c5b', 'stroke-width': .6 }));
  svg.append(el('path', { d: values.map((v, i) => `${i ? 'L' : 'M'}${x((first + i) / rate).toFixed(1)},${y(v).toFixed(1)}`).join(''), fill: 'none', stroke: '#bdabe5', 'stroke-width': 1.1 }));
  const marks = result.signals.detections.filter(event => event.channel === channel && event.t >= start && event.t <= end).map(event => `M${x(event.t).toFixed(1)},24v5`).join('');
  svg.append(el('path', { d: marks, stroke: '#e3ebeb', 'stroke-width': 1 }));
  for (let i = 0; i < 5; i++) svg.append(el('text', { x: x(start + (end - start) * i / 4), y: 213, fill: '#b9cbd3', 'font-size': 10, 'text-anchor': 'middle' }, (start + (end - start) * i / 4).toFixed(1)));
  svg.append(el('text', { x: 48, y: 16, fill: '#b9cbd3', 'font-size': 10 }, `Synthetic µV / ±${limit.toFixed(0)}`), el('text', { x: 624, y: 229, fill: '#b9cbd3', 'font-size': 10, 'text-anchor': 'end' }, 'Time / s'));
  svg.setAttribute('aria-label', `Synthetic channel ${channel + 1} voltage, ${rate} samples/s, inspection window ${start.toFixed(3)} to ${end.toFixed(3)} seconds.`);
  $('voltage-reading').textContent = `Channel ${channel + 1}: synthetic ${rate} samples/s, ${start.toFixed(1)}–${end.toFixed(1)} s. Broadened authored waveforms support teaching; this is not a validated MEA acquisition specification. Pale ticks are threshold estimates.`;
}
function draw() {
  if (!result) return; const f = result.frames[index], ref = result.params.referenceTemperature;
  $('research-clock').textContent = f.t.toFixed(2) + ' s'; $('research-timeline').value = f.t; $('stage-clock').textContent = f.t.toFixed(2) + ' s'; $('stage-timeline').value = f.t; $('stage-reading').textContent = `Tissue mean ΔT ${fmt(f.tissueMean - ref)} K · Hot side ΔT ${fmt(f.Th - ref)} K · Simulated`;
  $('tissue-reading').textContent = fmt(f.tissueMean - ref) + ' K'; $('sensor-reading').textContent = f.sensor === null ? 'Failed' : fmt(f.sensor - ref) + ' K'; $('hot-reading').textContent = fmt(f.Th - ref) + ' K'; $('actuation-reading').textContent = fmt(f.command) + ' → ' + fmt(f.current) + ' A'; $('research-voltage-value').textContent = fmt(result.params.alpha * (f.Th - f.Tc) + result.params.electricalResistance * f.current, 4) + ' V';
  for (const [id, value, unit] of [['research-contact', f.qContact, 'W'], ['research-qc', f.qc, 'W'], ['research-power', f.power, 'W'], ['research-qh', f.qh, 'W'], ['research-rejected', f.rejected, 'W'], ['research-total-energy', f.energy, 'J'], ['research-stored', f.ledger.storedChange, 'J'], ['research-external', f.ledger.externalEnergy, 'J'], ['research-residual', f.residual, 'J']]) $(id).textContent = (id === 'research-residual' ? value.toExponential(2) : fmt(value, 4)) + ' ' + unit;
  $('experiment-teaching').textContent = `${conditions[result.params.inputs.condition]} · ${f.state}. The whole-sphere thermal response and synthetic network events remain separate.`;
  $('detector-reading').textContent = `At this time: ${f.populationCount} estimated spikes across 8 channels in 0.25 s; ${fmt(f.feature, 1)} estimated spikes/s feature. ${f.burst ? 'Illustrative burst flag on' : 'Burst flag off'}. Estimated episodes so far: ${f.burstCount}; cumulative flag duration ${fmt(f.burstDuration, 2)} s. Injected artifacts and assumed events are separate source labels; neither is a clinically confirmed seizure.`;
  for (const cursor of document.querySelectorAll('[data-clock]')) { const x = 48 + f.t / result.params.duration * 576; cursor.setAttribute('x1', x); cursor.setAttribute('x2', x); }
  voltage(f); if (scene && !staticView && mode === 'organoid') scene.update(f, result.params);
}
function receive(data) {
  if (disposed || data.id !== requestId) return; pending = false;
  if (data.error) { fail(data.error); return; }
  result = data.result; comparison = data.comparison; capturedPlan = requestedPlan; index = 0; modelError = '';
  $('research-timeline').max = result.params.duration; $('stage-timeline').max = result.params.duration; $('experiment-output').hidden = mode !== 'organoid'; $('raster-duration').textContent = `${result.signals.channelCount} channels · ${result.params.duration} s`; const labels = document.querySelectorAll('.time-labels span'); labels[1].textContent = result.params.duration / 2 + ' s'; labels[2].textContent = result.params.duration + ' s';
  $('research-status').textContent = `Completed ${conditions[result.params.inputs.condition]} · seed ${result.params.seed} · ${result.summary.steps.toLocaleString()} integration steps · max. energy residual ${result.summary.maxResidual.toExponential(2)} J`;
  $('research-diagnostics').textContent = `Model ${result.modelId} v${result.version}. ${result.summary.cells} spherical shells; actual Δt ${result.summary.dt.toPrecision(4)} s; output ${result.summary.outputHz} Hz. A stability-limited substep is enforced. Maximum conservation residual ${result.summary.maxResidual.toExponential(3)} J. See the model record for analytical, time and space refinement checks.`;
  $('research-input-table').replaceChildren(...Object.entries(result.params.inputs).map(([name, value]) => { const tr = document.createElement('tr'); for (const text of [name, value, result.params.units[name] || 'condition label']) { const td = document.createElement('td'); td.textContent = text; tr.append(td); } return tr; }));
  $('comparison-section').hidden = !comparison;
  if (comparison) { $('comparison-heading').textContent = `Active condition versus ${comparison.params.inputs.condition === 'perturbation' ? 'reference perturbation' : comparison.params.inputs.condition}`; $('comparison-reading').textContent = 'Two complete calculations use the same input assumptions and random seed, with only the computational condition changed. Effective scenario resistances and feedback current may differ. This is sensitivity to assumptions, not a confidence interval or biological efficacy comparison.'; }
  if (comparison) $('comparison-table').replaceChildren(...[result, comparison].map(run => { const e = endpoint(run), tr = document.createElement('tr'); for (const value of [conditions[run.params.inputs.condition], fmt(e.min, 5), fmt(e.hot, 5), fmt(e.energy, 5), e.residual.toExponential(2)]) { const td = document.createElement('td'); td.textContent = value; tr.append(td); } return tr; }));
  staticCharts(); draw(); readyControls();
}
function tick() { if (!playing || !result) return; const t = Math.min(result.params.duration, startTime + (performance.now() - startWall) / 1000); index = timeIndex(t); draw(); if (t >= result.params.duration) pause(); else timer = setTimeout(tick, 100); }
function record() { return { recordType: 'SEIZEFREEZE_SYNTHETIC_COMPUTATIONAL_EXPERIMENT', schemaVersion: 1, dataStatus: 'No biological or device measurements', plan: { ...capturedPlan, control: comparison ? conditions[comparison.params.inputs.condition] : 'No comparison; no biological efficacy endpoint' }, model: result, comparison }; }
function download(name, body, type) { const url = URL.createObjectURL(new Blob([body], { type })), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
$('experiment-form').addEventListener('submit', e => { e.preventDefault(); run(); });
$('compare-sham').addEventListener('click', () => { if ($('experiment-form').reportValidity()) run(true); });
$('comparison-control').addEventListener('change', () => { $('compare-sham').textContent = $('comparison-control').value === 'perturbation' ? 'Compare with reference' : 'Compare with ' + $('comparison-control').value; });
$('research-condition').addEventListener('change', () => { if ($('experiment-form').reportValidity()) run(); });
$('reset-assumptions').addEventListener('click', () => { lastInputs = { ...defaults }; for (const name of Object.keys(fields)) $('research-' + name).value = defaults[name]; $('research-condition').value = defaults.condition; run(); });
function togglePlay() { if (playing) pause(); else if (result) { if (index >= result.frames.length - 1) index = 0; startTime = result.frames[index].t; startWall = performance.now(); playing = true; $('research-play').textContent = 'Pause'; $('stage-play').textContent = 'Pause'; tick(); } }
$('research-play').addEventListener('click', togglePlay); $('stage-play').addEventListener('click', togglePlay);
$('research-replay').addEventListener('click', () => { pause(); index = 0; draw(); });
$('research-timeline').addEventListener('input', () => { pause(); index = timeIndex(Number($('research-timeline').value)); draw(); });
$('stage-timeline').addEventListener('input', () => { pause(); if (result) { index = timeIndex(Number($('stage-timeline').value)); draw(); } });
$('signal-channel').addEventListener('change', draw);
$('clear-comparison').addEventListener('click', () => { comparison = null; $('comparison-section').hidden = true; staticCharts(); draw(); });
document.querySelectorAll('.mode-nav button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
$('prototype-to-experiment').addEventListener('click', () => setMode('organoid'));
$('section-view').addEventListener('click', () => { sectioned = !sectioned; scene?.section(sectioned); $('section-view').setAttribute('aria-pressed', String(sectioned)); });
$('reset-view').addEventListener('click', () => scene?.reset());
$('static-research').addEventListener('click', async () => { if (!scene || scene.stats().contextLost) { scene?.dispose(); scene = null; await startScene(); } else staticDisplay(!staticView); if (!staticView) { scene.reset(); if (result) scene.update(result.frames[index], result.params); } });
for (const id of ['hypothesis', 'analysis-plan']) $(id).addEventListener('input', () => { if (capturedPlan && ($(id).value !== capturedPlan[id === 'hypothesis' ? 'hypothesis' : 'analysis'])) $('export-status').textContent = 'Plan text changed after this run. Exports retain the captured plan. Run again to attach edited text to a new computation; this is not external preregistration.'; });
$('export-summary').addEventListener('click', () => {
  if (!result || pending) return;
  const e = endpoint(result), lines = ['SEIZEFREEZE / SYNTHETIC COMPUTATIONAL EXPERIMENT', 'No biological or device measurements.', `Model ${result.modelId} v${result.version}`, `Condition: ${conditions[result.params.inputs.condition]}`, `Seed: ${result.params.seed}`, `Reference: ${result.params.referenceTemperature} °C, arbitrary inert calculation boundary`, '', 'HYPOTHESIS / CAPTURED AT RUN START', capturedPlan.hypothesis, '', 'ANALYSIS / CAPTURED AT RUN START, NOT EXTERNALLY PREREGISTERED', capturedPlan.analysis, '', 'COMPUTED ENDPOINTS', `Minimum tissue-mean change: ${e.min} K`, `Peak hot-side change: ${e.hot} K`, `TEC electrical energy: ${e.energy} J`, `Maximum numerical energy residual: ${e.residual} J`, `Estimated synthetic burst flags: ${result.summary.burstCount}; no efficacy interpretation`, '', 'INPUTS / ALL MODELING ASSUMPTIONS', ...Object.entries(result.params.inputs).map(([key, value]) => `${key}: ${value} ${result.params.units[key] || ''}`), '', 'INITIAL CONDITIONS', JSON.stringify(result.params.initialConditions), 'BOUNDARY CONDITIONS', JSON.stringify(result.params.boundaryConditions), '', 'LIMITATIONS', ...result.assumptions, '', 'Source and parameter provenance: ORGANOID_MODEL.md and RESEARCH_SOURCES.md. Full numerical arrays are in the synthetic JSON export.'];
  if (comparison) lines.push('', `COMPARISON: ${conditions[comparison.params.inputs.condition]}`, JSON.stringify(endpoint(comparison)));
  download('seizefreeze-SYNTHETIC-run-summary.txt', lines.join('\n'), 'text/plain;charset=utf-8');
});
$('export-json').addEventListener('click', () => { if (result && !pending) { download(`seizefreeze-SYNTHETIC-${result.params.inputs.condition}-seed-${result.params.seed}.json`, JSON.stringify(record()), 'application/json'); $('export-status').textContent = 'Exported a synthetic computational record with full model inputs, outputs, source labels and random seed.'; } });
$('export-csv').addEventListener('click', () => { if (!result || pending) return; const rows = ['data_status,model_id,version,condition,seed,time_s,tissue_mean_C,medium_C,cold_C,hot_C,sensor_C,current_A,Qc_W,TEC_power_W,Qh_W,rejected_W,energy_J,residual_J,estimated_population_count_025s,burst_flag']; for (const f of result.frames) rows.push(['SYNTHETIC_COMPUTATIONAL', result.modelId, result.version, result.params.inputs.condition, result.params.seed, f.t, f.tissueMean, f.medium, f.Tc, f.Th, f.sensor === null ? '' : f.sensor, f.current, f.qc, f.power, f.qh, f.rejected, f.energy, f.residual, f.populationCount, Number(f.burst)].join(',')); download('seizefreeze-SYNTHETIC-thermal.csv', rows.join('\n'), 'text/csv;charset=utf-8'); $('export-status').textContent = 'Exported synthetic thermal frames. Full assumptions, units and recording arrays are in the JSON record.'; });
$('import-record').addEventListener('change', async () => {
  try { const file = $('import-record').files[0]; if (!file) return; if (file.size > 64 * 1024 * 1024) throw new RangeError('Record exceeds the 64 MB input limit.'); const parsed = JSON.parse(await file.text()); if (parsed.recordType !== 'SEIZEFREEZE_SYNTHETIC_COMPUTATIONAL_EXPERIMENT' || parsed.schemaVersion !== 1 || parsed.model?.modelId !== 'seizefreeze-nonperfused-radial-sphere' || parsed.model?.version !== '1.0.0' || !parsed.model.params?.inputs) throw new RangeError('This is not a supported synthetic experiment record.'); const config = parsed.model.params.inputs; for (const name of Object.keys(fields)) $('research-' + name).value = config[name]; $('research-condition').value = config.condition; $('hypothesis').value = String(parsed.plan?.hypothesis || '').slice(0, 800); $('analysis-plan').value = String(parsed.plan?.analysis || '').slice(0, 1200); $('export-status').textContent = 'Recalculating from recorded inputs and seed. Imported output arrays are not trusted as measurements or reused.'; const control = parsed.comparison?.params?.inputs?.condition || 'sham'; if (!['sham', 'baseline', 'perturbation'].includes(control)) throw new RangeError('Unsupported recorded comparison control.'); $('comparison-control').value = control; run(Boolean(parsed.comparison), config, control); }
  catch (error) { $('export-status').textContent = 'Record rejected: ' + error.message; }
  $('import-record').value = '';
});
async function startScene() { try { const { createResearchScene } = await import('./research-scene.js'); scene = await createResearchScene($('research-scene'), { mode: mode === 'prototype' ? mode : 'organoid', onSelect: id => { if (!selecting) inspect(id, true); } }); if (result) scene.update(result.frames[index], result.params); if (sectioned) scene.section(true); staticDisplay(scene.stats().softwareRenderer); sceneError = ''; } catch (error) { sceneError = error.message; staticDisplay(true); } }
$('research-scene').addEventListener('research-contextlost', () => { sceneError = 'WebGL context lost'; staticDisplay(true); });
componentButtons(); $('condition-reading').textContent = descriptions[defaults.condition];
try { worker = new Worker('./research-worker.js', { type: 'module' }); worker.addEventListener('message', e => receive(e.data)); worker.addEventListener('error', () => { worker?.terminate(); worker = null; fail('The research worker failed to load or execute. Reload to retry.'); }); run(); } catch (error) { fail(error.message); }
await startScene();
window.seizefreezeResearch = { snapshot: () => ({ mode, pending, playing, index, staticView, sceneError, modelError, selected, inputs: result?.params.inputs, frame: result?.frames[index], summary: result?.summary, comparison: comparison?.summary, scene: scene?.stats() }), result: () => result, record, goTo: t => { pause(); if (result) { index = timeIndex(t); draw(); } } };
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pagehide', event => { pause(); if (!event.persisted) { disposed = true; worker?.terminate(); scene?.dispose(); } });
