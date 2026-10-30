// Educational calculation; no coefficients here are measured SeizeFreeze hardware data.
export const defaults = Object.freeze({
  scenario: 'event', duration: 120, dt: 0.01, dz: 0.0005,
  currentLimit: 0.32, contactResistance: 4, rejectionResistance: 8,
  initialTemperature: 37,
});

export const scenarios = Object.freeze({
  baseline: 'Baseline', disabled: 'Event · control disabled', event: 'Event-triggered actuation',
  delay: 'Delayed detection', false: 'False detection', saturation: 'Current saturation',
  sensor: 'Sensor lag, noise, then failure', resistance: 'Increased contact resistance',
  rejection: 'Limited heat rejection', shutdown: 'Shutdown and recovery', repeated: 'Repeated events',
});

const bounds = {
  duration: [1, 180], dt: [0.001, 0.05], dz: [0.00025, 0.002],
  currentLimit: [0, 0.8], contactResistance: [0.1, 100],
  rejectionResistance: [0.5, 200], initialTemperature: [32, 39],
};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = x => { const v = clamp(x, 0, 1); return v * v * (3 - 2 * v); };

function eventEnvelope(t, scenario) {
  if (scenario === 'baseline' || scenario === 'false') return 0;
  const windows = scenario === 'repeated' ? [[18, 43], [58, 83], [98, 118]] : [[18, 53]];
  return windows.reduce((v, [start, end]) => Math.max(v, ease((t - start) / 2) * ease((end - t) / 3)), 0);
}

// A deliberately slow, synthetic teaching waveform, not sampled clinical ECoG.
export function syntheticSignal(t, scenario = 'event') {
  const amplitude = 15 + 85 * eventEnvelope(t, scenario);
  return amplitude * (Math.sin(2 * Math.PI * 2.2 * t) + 0.24 * Math.sin(2 * Math.PI * 3.7 * t));
}

export function simulate(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object.');
  for (const name of Object.keys(options)) if (!Object.hasOwn(defaults, name)) throw new RangeError(`Unknown parameter: ${name}`);
  const params = { ...defaults, ...options };
  if (!Object.hasOwn(scenarios, params.scenario)) throw new RangeError('Unknown scenario.');
  for (const [name, [min, max]] of Object.entries(bounds)) {
    if (typeof params[name] !== 'number' || !Number.isFinite(params[name]) || params[name] < min || params[name] > max) {
      throw new RangeError(`${name} must be a finite number from ${min} to ${max}.`);
    }
  }
  const scenario = params.scenario;
  Object.assign(params, {
    area: 0.0001, depth: 0.008, conductivity: 0.5, density: 1060, specificHeat: 3600,
    perfusionCoefficient: 40000, metabolicHeat: 6000, arterialTemperature: 36.85,
    reservoirTemperature: 37, coldCapacity: 0.8, hotCapacity: 6,
    alpha: 0.012, electricalResistance: 2, tecConductance: 0.035,
    insulationResistance: 80, hotTissueResistance: 120,
    target: 34, hotCutoff: 42, coldCutoff: 28, sensorLag: scenario === 'sensor' ? 8 : 0.8,
    detectorThreshold: 35, detectorTau: 0.7, controllerGain: 0.12,
  });
  params.contactResistance *= scenario === 'resistance' ? 4 : 1;
  params.rejectionResistance *= scenario === 'rejection' ? 8 : 1;
  if (scenario === 'saturation') params.currentLimit = Math.min(params.currentLimit, 0.06);
  const cells = Math.round(params.depth / params.dz);
  params.dz = params.depth / cells;
  const { area, dz, conductivity: k, reservoirTemperature: reservoir } = params;
  const volume = area * dz;
  const capacity = volume * params.density * params.specificHeat;
  const conductance = k * area / dz;
  const contactG = 1 / (params.contactResistance + dz / (2 * k * area));
  const deepG = 2 * conductance;
  const perfusionG = params.perfusionCoefficient * volume;
  const hotTissueG = 1 / params.hotTissueResistance;
  const insulationG = 1 / params.insulationResistance;
  const rejectionG = 1 / params.rejectionResistance;
  // Positive-coefficient explicit diffusion bound, with a 20% margin.
  const tissueBound = capacity / Math.max(3 * conductance + perfusionG, conductance + contactG + hotTissueG + perfusionG);
  const coldBound = params.coldCapacity / (contactG + insulationG + params.tecConductance + params.alpha * params.currentLimit);
  const hotBound = params.hotCapacity / (rejectionG + hotTissueG + params.tecConductance + params.alpha * params.currentLimit);
  params.maximumStableDt = 0.8 * Math.min(tissueBound, coldBound, hotBound, params.sensorLag, params.detectorTau);
  if (params.dt > params.maximumStableDt) throw new RangeError(`dt exceeds the explicit stability bound (${params.maximumStableDt.toFixed(5)} s).`);
  let tissue = Array(cells).fill(params.initialTemperature);
  let Tc = params.initialTemperature;
  let Th = params.initialTemperature;
  let sensorValue = params.initialTemperature;
  let feature = 0;
  let lastDetection = -Infinity;
  let latchedFault = '';
  let energy = 0;
  let externalEnergy = 0;
  let rejectedEnergy = 0;
  let extractedEnergy = 0;
  let maxResidual = 0;
  let minTissue = params.initialTemperature;
  let maxHot = params.initialTemperature;
  let maxCurrent = 0;
  const frames = [];
  const initialStorage = (cells * capacity + params.coldCapacity + params.hotCapacity) * params.initialTemperature;
  let nextOutput = 0;
  let t = 0;
  const storage = () => tissue.reduce((sum, value) => sum + capacity * value, 0) + params.coldCapacity * Tc + params.hotCapacity * Th;
  while (true) {
    const signal = syntheticSignal(t, scenario);
    const delayedSignal = syntheticSignal(Math.max(0, t - (scenario === 'delay' ? 8 : 0)), scenario);
    const detected = scenario === 'false' ? t >= 24 && t < 36 : feature > params.detectorThreshold;
    if (detected) lastDetection = t;
    const sensorFailed = scenario === 'sensor' && t >= 50;
    const sensorNoise = scenario === 'sensor' ? 0.07 * Math.sin(t * 7.31) : 0;
    const sensor = sensorFailed ? null : sensorValue + sensorNoise;
    if (sensorFailed) latchedFault = 'Sensor failure · command off';
    if (Th >= params.hotCutoff) latchedFault = 'Hot-side interlock · command off';
    if (Tc <= params.coldCutoff) latchedFault = 'Cold-plate interlock · command off';
    const active = t - lastDetection < 4;
    const disabled = scenario === 'disabled' || scenario === 'baseline' || (scenario === 'shutdown' && t >= 40);
    const command = active && !disabled && !latchedFault ? Math.max(0, params.controllerGain * (sensor - params.target)) : 0;
    const current = Math.min(command, params.currentLimit);
    let state = latchedFault || (disabled ? (scenario === 'shutdown' && t >= 40 ? 'Shutdown · passive recovery' : 'Control disabled') : active ? (command > params.currentLimit ? 'Current saturated' : 'Feedback cooling') : t > 20 ? 'Passive recovery / monitoring' : 'Monitoring');
    if (scenario === 'baseline') state = 'Baseline monitoring';
    const qContact = contactG * (tissue[0] - Tc);
    const surface = tissue[0] - qContact * dz / (2 * k * area);
    const qc = params.alpha * current * (Tc + 273.15) - 0.5 * current ** 2 * params.electricalResistance - params.tecConductance * (Th - Tc);
    const power = params.alpha * current * (Th - Tc) + current ** 2 * params.electricalResistance;
    const qh = qc + power;
    const rejected = rejectionG * (Th - reservoir);
    const parasitic = hotTissueG * (Th - tissue[0]);
    const insulation = insulationG * (reservoir - Tc);
    const deep = deepG * (reservoir - tissue[cells - 1]);
    const residual = storage() - initialStorage - externalEnergy;
    maxResidual = Math.max(maxResidual, Math.abs(residual));
    if (t + 1e-8 >= nextOutput || t >= params.duration) {
      frames.push({ t, tissue: [...tissue], Tc, Th, sensor, signal, feature, detected, current, command,
        qContact, qc, power, qh, rejected, energy, residual, state, parasitic, insulation,
        surface,
        ledger: { storedChange: storage() - initialStorage, externalEnergy, rejectedEnergy, extractedEnergy },
      });
      nextOutput += 0.05;
    }
    minTissue = Math.min(minTissue, ...tissue);
    maxHot = Math.max(maxHot, Th);
    maxCurrent = Math.max(maxCurrent, current);
    if (t >= params.duration) break;
    const step = Math.min(params.dt, params.duration - t);
    const rates = new Array(cells);
    let sources = 0;
    for (let i = 0; i < cells; i++) {
      const source = perfusionG * (params.arterialTemperature - tissue[i]) + params.metabolicHeat * volume;
      sources += source;
      rates[i] = source + (i ? conductance * (tissue[i - 1] - tissue[i]) : -qContact + parasitic)
        + (i < cells - 1 ? conductance * (tissue[i + 1] - tissue[i]) : deep);
    }
    tissue = tissue.map((value, i) => value + step * rates[i] / capacity);
    Tc += step * (qContact + insulation - qc) / params.coldCapacity;
    Th += step * (qh - rejected - parasitic) / params.hotCapacity;
    sensorValue += step * (surface - sensorValue) / params.sensorLag;
    feature += step * (Math.abs(delayedSignal) - feature) / params.detectorTau;
    energy += power * step;
    rejectedEnergy += rejected * step;
    extractedEnergy += qContact * step;
    externalEnergy += (power + sources + deep + insulation - rejected) * step;
    t = Math.min(params.duration, t + step);
  }
  return { frames, params, summary: { minTissue, maxHot, maxCurrent, electricalEnergy: energy,
    rejectedEnergy, extractedEnergy, maxResidual, steps: Math.ceil(params.duration / params.dt),
    cells, outputHz: 20, model: '1D finite-volume depth column; illustrative coefficients, no biological-effect model' } };
}
