import { generateOrganoidSignals, organoidSignalFrame } from './organoid-signal.js';

export const defaults = Object.freeze({ condition: 'perturbation', seed: 20261102, radiusMm: 1,
  contactResistance: 6, rejectionResistance: 8, currentLimit: .2, conductivity: .5,
  initialTemperature: 20, duration: 120, dt: .01, cells: 12 });
export const conditions = Object.freeze({ baseline: 'Baseline · actuation disabled', sham: 'Sham · identical passive thermal model',
  perturbation: 'Illustrative thermal perturbation', recovery: 'Command interruption and recovery', repeated: 'Repeated synthetic events',
  sensor: 'Temperature sensor failure', rejection: 'Limited heat rejection', contact: 'Increased substrate contact resistance' });
const bounds = { seed: [0, 4294967295], radiusMm: [.5, 3], contactResistance: [.5, 80], rejectionResistance: [1, 80],
  currentLimit: [0, .4], conductivity: [.1, 1], initialTemperature: [15, 25], duration: [1, 120], dt: [.001, .05], cells: [6, 24] };
const version = '1.0.0', modelId = 'seizefreeze-nonperfused-radial-sphere';
const outputDt = .05;

// Radial resistance integrates Fourier conduction between volume-centroid radii.
export function createRadialGrid({ radiusM, cells, conductivity, density, specificHeat, filmCoefficient }) {
  const radii = Array.from({ length: cells + 1 }, (_, i) => radiusM * i / cells);
  const volumes = [], centers = [], capacities = [], conductances = [];
  for (let i = 0; i < cells; i++) {
    const a = radii[i], b = radii[i + 1];
    volumes.push(4 * Math.PI / 3 * (b ** 3 - a ** 3));
    centers.push(.75 * (b ** 4 - a ** 4) / (b ** 3 - a ** 3));
    capacities.push(volumes[i] * density * specificHeat);
    if (i) conductances.push(4 * Math.PI * conductivity / (1 / centers[i - 1] - 1 / centers[i]));
  }
  const surfaceResistance = (1 / centers.at(-1) - 1 / radiusM) / (4 * Math.PI * conductivity)
    + 1 / (filmCoefficient * 4 * Math.PI * radiusM ** 2);
  const surfaceConductance = 1 / surfaceResistance;
  const stabilityBound = Math.min(...capacities.map((capacity, i) => capacity
    / ((conductances[i - 1] || 0) + (conductances[i] || 0) + (i === cells - 1 ? surfaceConductance : 0))));
  return { radii, volumes, centers, capacities, conductances, surfaceConductance, stabilityBound };
}

export function radialHeatRates(tissue, medium, grid) {
  const rates = Array(tissue.length).fill(0);
  for (let i = 0; i < tissue.length - 1; i++) {
    const heat = grid.conductances[i] * (tissue[i] - tissue[i + 1]);
    rates[i] -= heat; rates[i + 1] += heat;
  }
  const qMedium = grid.surfaceConductance * (tissue.at(-1) - medium);
  rates[rates.length - 1] -= qMedium;
  return { rates, qMedium };
}

export function simulateOrganoid(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Organoid inputs must be an object.');
  for (const key of Object.keys(options)) if (!Object.hasOwn(defaults, key)) throw new RangeError(`Unknown organoid input: ${key}`);
  const inputs = { ...defaults, ...options };
  if (typeof inputs.condition !== 'string' || !Object.hasOwn(conditions, inputs.condition)) throw new RangeError('Unknown computational condition.');
  for (const [name, [minimum, maximum]] of Object.entries(bounds)) {
    if (typeof inputs[name] !== 'number' || !Number.isFinite(inputs[name]) || inputs[name] < minimum || inputs[name] > maximum)
      throw new RangeError(`${name} must be a finite number from ${minimum} to ${maximum}.`);
  }
  for (const name of ['seed', 'cells']) if (!Number.isInteger(inputs[name])) throw new RangeError(`${name} must be an integer.`);
  const params = { ...inputs, inputs, referenceTemperature: 20, environmentTemperature: 20,
    density: 1000, specificHeat: 4000, filmCoefficient: 150, mediumVolumeMl: .15,
    mediumDensity: 1000, mediumSpecificHeat: 4180, coldCapacity: .4, hotCapacity: 5,
    alpha: .008, electricalResistance: 2, tecConductance: .025,
    mediumEnvironmentResistance: 120, coldEnvironmentResistance: 150, hotMediumResistance: 200,
    targetDelta: -1.5, coldCutoffDelta: -4, hotCutoffDelta: 6, sensorLag: .6, controllerGain: .12,
    detectorHoldSeconds: 2, firstEpisodeEnd: 55, recoveryShutdownAt: 32, sensorFailureAt: 30 };
  if (inputs.condition === 'contact') params.contactResistance *= 4;
  if (inputs.condition === 'rejection') params.rejectionResistance *= 4;
  params.mediumCapacity = params.mediumVolumeMl * 1e-6 * params.mediumDensity * params.mediumSpecificHeat;
  const grid = createRadialGrid({ radiusM: inputs.radiusMm * .001, cells: inputs.cells, conductivity: inputs.conductivity,
    density: params.density, specificHeat: params.specificHeat, filmCoefficient: params.filmCoefficient });
  const contactG = 1 / params.contactResistance, rejectionG = 1 / params.rejectionResistance;
  const mediumEnvironmentG = 1 / params.mediumEnvironmentResistance, coldEnvironmentG = 1 / params.coldEnvironmentResistance;
  const hotMediumG = 1 / params.hotMediumResistance;
  const maximumStableDt = .4 * Math.min(grid.stabilityBound,
    params.mediumCapacity / (grid.surfaceConductance + contactG + mediumEnvironmentG + hotMediumG),
    params.coldCapacity / (contactG + coldEnvironmentG + params.tecConductance + params.alpha * inputs.currentLimit),
    params.hotCapacity / (rejectionG + hotMediumG + params.tecConductance + params.alpha * inputs.currentLimit), params.sensorLag);
  const substepsPerOutput = Math.ceil(outputDt / Math.min(inputs.dt, maximumStableDt));
  params.dt = outputDt / substepsPerOutput;
  const estimatedSteps = Math.ceil(inputs.duration / outputDt) * substepsPerOutput;
  if (estimatedSteps > 2000000) throw new RangeError('The requested radial resolution exceeds the bounded calculation budget.');
  params.units = { condition: 'Computational condition identifier', radiusMm: 'mm', conductivity: 'W/(m K)', contactResistance: 'K/W', rejectionResistance: 'K/W',
    currentLimit: 'A', initialTemperature: '°C', duration: 's', dt: 's', seed: 'unsigned 32-bit integer', cells: 'radial shells',
    density: 'kg/m³', specificHeat: 'J/(kg K)', filmCoefficient: 'W/(m² K)', mediumVolumeMl: 'mL',
    mediumDensity: 'kg/m³', mediumSpecificHeat: 'J/(kg K)', mediumCapacity: 'J/K', coldCapacity: 'J/K', hotCapacity: 'J/K',
    alpha: 'V/K', electricalResistance: 'Ω', tecConductance: 'W/K', mediumEnvironmentResistance: 'K/W',
    coldEnvironmentResistance: 'K/W', hotMediumResistance: 'K/W', referenceTemperature: '°C', environmentTemperature: '°C',
    targetDelta: 'K', coldCutoffDelta: 'K', hotCutoffDelta: 'K', sensorLag: 's', controllerGain: 'A/K',
    detectorHoldSeconds: 's', firstEpisodeEnd: 's', recoveryShutdownAt: 's', sensorFailureAt: 's' };
  params.geometry = { type: 'Spherical radial finite volumes; uniform whole-surface exchange', radiusM: inputs.radiusMm * .001,
    shellBoundariesM: grid.radii, shellCentersM: grid.centers, shellVolumesM3: grid.volumes,
    tissueVolumeM3: grid.volumes.reduce((a, b) => a + b, 0), surfaceAreaM2: 4 * Math.PI * (inputs.radiusMm * .001) ** 2 };
  params.initialConditions = { tissue: inputs.initialTemperature, medium: inputs.initialTemperature,
    coldPlate: inputs.initialTemperature, hotPackage: inputs.initialTemperature, unit: '°C' };
  params.boundaryConditions = { center: 'Symmetry, zero flux', outer: 'Uniform sphere-to-well-mixed medium through finite film resistance',
    medium: 'Finite heat capacity, separate resistance to cold substrate', environment: 'Fixed arbitrary 20 °C reference with finite exchange resistances',
    perfusion: 'Absent', metabolicHeating: 'Omitted; no measured organoid metabolic source assumed' };
  params.numerical = { method: 'Explicit energy-conservative finite volumes with bounded internal substeps',
    requestedDt: inputs.dt, maximumStableDt, nominalDt: params.dt, outputDt, substepsPerOutput, maximumSteps: 2000000,
    signalSampleRateHz: 500, energyToleranceJ: 1e-8 };
  const signals = generateOrganoidSignals({ seed: inputs.seed, duration: inputs.duration });
  let tissue = Array(inputs.cells).fill(inputs.initialTemperature), medium = inputs.initialTemperature;
  let Tc = inputs.initialTemperature, Th = inputs.initialTemperature, sensorValue = inputs.initialTemperature;
  let lastDetection = -Infinity, fault = '', energy = 0, externalEnergy = 0, rejectedEnergy = 0, environmentEnergy = 0, insulationEnergy = 0;
  let steps = 0, maxResidual = 0, minTissue = inputs.initialTemperature, maxHot = inputs.initialTemperature, minMedium = inputs.initialTemperature;
  const frames = [], totalVolume = params.geometry.tissueVolumeM3;
  const storedChange = () => tissue.reduce((sum, value, i) => sum + grid.capacities[i] * (value - inputs.initialTemperature), 0)
    + params.mediumCapacity * (medium - inputs.initialTemperature) + params.coldCapacity * (Tc - inputs.initialTemperature)
    + params.hotCapacity * (Th - inputs.initialTemperature);
  function evaluate(t) {
    const signalIndex = Math.min(signals.channels[0].length - 1, Math.round(t * signals.sampleRateHz));
    const detected = signals.population.burst[signalIndex];
    if (detected) lastDetection = t;
    const sensorFailed = inputs.condition === 'sensor' && t >= params.sensorFailureAt;
    if (sensorFailed) fault = 'Sensor failure · command off';
    if (Tc <= params.referenceTemperature + params.coldCutoffDelta) fault = 'Cold-node demonstration interlock';
    if (Th >= params.referenceTemperature + params.hotCutoffDelta) fault = 'Hot-node demonstration interlock';
    const enabled = !['baseline', 'sham'].includes(inputs.condition)
      && (inputs.condition === 'repeated' || t < params.firstEpisodeEnd)
      && (inputs.condition !== 'recovery' || t < params.recoveryShutdownAt);
    const command = enabled && !fault && t - lastDetection < params.detectorHoldSeconds
      ? Math.max(0, params.controllerGain * (sensorValue - (params.referenceTemperature + params.targetDelta))) : 0;
    const current = Math.min(command, inputs.currentLimit);
    const qc = params.alpha * current * (Tc + 273.15) - .5 * current ** 2 * params.electricalResistance - params.tecConductance * (Th - Tc);
    const power = params.alpha * current * (Th - Tc) + current ** 2 * params.electricalResistance, qh = qc + power;
    const qContact = contactG * (medium - Tc), rejected = rejectionG * (Th - params.environmentTemperature);
    const qEnvironment = mediumEnvironmentG * (params.environmentTemperature - medium);
    const qInsulation = coldEnvironmentG * (params.environmentTemperature - Tc), qHotMedium = hotMediumG * (Th - medium);
    const radial = radialHeatRates(tissue, medium, grid);
    const state = fault || (inputs.condition === 'sham' ? 'Sham · no current delivered' : !enabled ? 'Actuation disabled / passive recovery'
      : current > 0 ? command > current ? 'Current saturated' : 'Illustrative feedback perturbation' : 'Synthetic network monitoring');
    return { ...radial, qContact, qc, power, qh, rejected, qEnvironment, qInsulation, qHotMedium,
      sensor: sensorFailed ? null : sensorValue, command, current, state };
  }
  function audit() {
    maxResidual = Math.max(maxResidual, Math.abs(storedChange() - externalEnergy));
    minTissue = Math.min(minTissue, ...tissue); maxHot = Math.max(maxHot, Th); minMedium = Math.min(minMedium, medium);
  }
  function frame(t) {
    const f = evaluate(t);
    const surface = medium + f.qMedium / (params.filmCoefficient * params.geometry.surfaceAreaM2);
    frames.push({ t, tissue: [...tissue], tissueMean: tissue.reduce((sum, value, i) => sum + value * grid.volumes[i], 0) / totalVolume,
      surface, medium, Tc, Th, sensor: f.sensor, current: f.current, command: f.command, qMedium: f.qMedium, qContact: f.qContact,
      qc: f.qc, power: f.power, qh: f.qh, rejected: f.rejected, qEnvironment: f.qEnvironment, qInsulation: f.qInsulation,
      qHotMedium: f.qHotMedium, energy, residual: storedChange() - externalEnergy, state: f.state, ...organoidSignalFrame(signals, t),
      ledger: { storedChange: storedChange(), externalEnergy, rejectedEnergy, environmentEnergy, insulationEnergy } });
  }
  frame(0);
  for (let output = 1; output <= Math.ceil(inputs.duration / outputDt); output++) {
    const start = Math.min(inputs.duration, (output - 1) * outputDt), end = Math.min(inputs.duration, output * outputDt);
    const count = Math.ceil((end - start) / params.dt - 1e-10), dt = (end - start) / count;
    for (let substep = 0; substep < count; substep++) {
      const f = evaluate(start + substep * dt), oldMedium = medium;
      tissue = tissue.map((value, i) => value + dt * f.rates[i] / grid.capacities[i]);
      medium += dt * (f.qMedium - f.qContact + f.qEnvironment + f.qHotMedium) / params.mediumCapacity;
      Tc += dt * (f.qContact + f.qInsulation - f.qc) / params.coldCapacity;
      Th += dt * (f.qh - f.rejected - f.qHotMedium) / params.hotCapacity;
      sensorValue += dt * (oldMedium - sensorValue) / params.sensorLag;
      energy += dt * f.power; rejectedEnergy += dt * f.rejected;
      environmentEnergy += dt * f.qEnvironment; insulationEnergy += dt * f.qInsulation;
      externalEnergy += dt * (f.power + f.qEnvironment + f.qInsulation - f.rejected); steps++; audit();
    }
    frame(end);
  }
  const assumptions = [
    'Computational planning example, not a biological experiment, culture protocol, medical setting or clinical prediction.',
    'Nonperfused homogeneous spherical thermal surrogate. No blood perfusion, metabolic source, vessels, growth, viability or temperature-dependent biology.',
    'The whole spherical surface exchanges heat uniformly with a well-mixed finite-volume medium. A one-sided device drawing is not the resolved boundary geometry.',
    'The medium has a separate contact resistance to a cold substrate; no tissue volumetric cooling sink is added.',
    'Tissue, medium, cold substrate and hot package store heat. Extracted heat plus TEC electrical input reaches the finite hot node.',
    'The arbitrary fixed 20 °C external reference is an inert calculation boundary, not a culture or biological operating temperature.',
    'All coefficients, dimensions, resistances, sensor response and controller values are authored assumptions, uncalibrated to project hardware or organoids.',
    'Demonstration target/interlocks describe simulator logic, never safe tissue tolerances or recommended exposure settings.',
    'A lagged synthetic sensor observes the well-mixed medium. A failed sensor latches current off; passive heat transfer continues.',
    'Seeded multichannel signals, assumed spike events, estimated detections and injected artifacts are synthetic and independent of temperature.',
    'The TEC equations omit temperature-dependent properties and electronics/conversion overhead. The finite rejection resistance ends at an ideal fixed-temperature reservoir.',
    'Numerical conservation and convergence verify the calculation, not organoid biology, device performance or therapeutic benefit.',
  ];
  return { version, modelId, params, provenance: { recordType: 'SYNTHETIC_COMPUTATIONAL_EXPERIMENT',
    parameterSource: 'Every numerical parameter is an authored modeling assumption; no measured organoid or SeizeFreeze hardware coefficient is imported.',
    equationSources: [{ id: 'radial-fourier', status: 'Derived spherical Fourier balance with finite-volume storage', equation: 'rho*c*dT/dt = k/r^2*d/dr(r^2*dT/dr)' },
      { id: 'tec', status: 'Constant-property lumped approximation', url: 'https://thermal.ferrotec.com/technology/thermoelectric-reference-guide/thermalref11/' },
      { id: 'energy', status: 'Exact balance within the discrete model', equation: 'DeltaU = integral(P + Qenvironment + Qinsulation - Qrejected)dt' }],
    replay: 'simulateOrganoid(record.params.inputs); seed, condition and numerical inputs are all retained', signal: signals.provenance },
    assumptions, frames, signals, summary: { maxResidual, minTissue, minMedium, maxHot, electricalEnergy: energy, rejectedEnergy,
      dt: params.dt, cells: inputs.cells, steps, maximumStableDt, substepsPerOutput, outputHz: 20,
      syntheticEvents: signals.events.length, estimatedSpikes: signals.detections.length,
      burstCount: signals.population.burstCount.at(-1), burstDuration: signals.population.burstDuration.at(-1),
      finalStoredEnergyChange: storedChange(), externalEnergy, model: 'Nonperfused radial sphere with finite medium and thermoelectric stores; no biological-effect model' } };
}
