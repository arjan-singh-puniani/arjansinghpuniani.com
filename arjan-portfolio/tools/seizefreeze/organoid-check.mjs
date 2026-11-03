import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { conditions, simulateOrganoid, createRadialGrid, radialHeatRates } from '../../public/seizefreeze-lab/organoid-model.js';
import { generateOrganoidSignals } from '../../public/seizefreeze-lab/organoid-signal.js';

const start = performance.now();
const reference = simulateOrganoid();
const results = {};
for (const condition of Object.keys(conditions)) {
  const result = condition === 'perturbation' ? reference : simulateOrganoid({ condition });
  assert.equal(result.frames.length, 2401); assert.equal(result.frames[0].t, 0); assert.equal(result.frames.at(-1).t, 120);
  assert.ok(result.summary.maxResidual < 1e-8, `${condition}: whole-system energy must close.`);
  assert.ok(result.summary.dt <= result.params.inputs.dt && result.summary.dt <= result.summary.maximumStableDt);
  assert.equal(result.params.boundaryConditions.perfusion, 'Absent');
  assert.deepEqual(result.signals, reference.signals, 'Temperature/control conditions must not change synthetic signals or inferred network events.');
  for (const frame of result.frames) {
    assert.ok(frame.tissue.every(Number.isFinite));
    for (const key of ['medium', 'Tc', 'Th', 'current', 'qc', 'power', 'qh', 'residual', 'tissueMean']) assert.ok(Number.isFinite(frame[key]), `${condition}/${key}`);
    assert.ok(Math.abs(frame.qh - frame.qc - frame.power) < 1e-12);
    assert.ok(frame.current >= 0 && frame.current <= result.params.currentLimit);
    const volumes = result.params.geometry.shellVolumesM3;
    const mean = frame.tissue.reduce((sum, value, i) => sum + value * volumes[i], 0) / result.params.geometry.tissueVolumeM3;
    assert.ok(Math.abs(mean - frame.tissueMean) < 1e-12);
  }
  results[condition] = { frames: result.frames, summary: result.summary, params: result.params };
}
for (const condition of ['baseline', 'sham']) {
  assert.equal(results[condition].summary.electricalEnergy, 0);
  assert.ok(results[condition].frames.every(f => f.tissue.every(t => t === 20) && f.medium === 20 && f.Tc === 20 && f.Th === 20));
}
assert.ok(results.perturbation.summary.minTissue < 19.5);
assert.ok(results.rejection.summary.maxHot > results.perturbation.summary.maxHot);
assert.equal(results.rejection.params.rejectionResistance, 32);
assert.equal(results.contact.params.contactResistance, 24);
assert.ok(results.contact.frames.some((f, i) => Math.abs(f.qContact - results.perturbation.frames[i].qContact) > .001));
assert.ok(results.recovery.frames.filter(f => f.t >= 32).every(f => f.current === 0));
assert.ok(results.recovery.frames.at(-1).medium > results.recovery.summary.minMedium);
assert.ok(results.sensor.frames.filter(f => f.t >= 30).every(f => f.sensor === null && f.current === 0));
assert.ok(results.repeated.frames.some(f => f.t > 60 && f.current > 0));
assert.ok(results.perturbation.frames.filter(f => f.t >= 55).every(f => f.current === 0));

const warm = simulateOrganoid({ currentLimit: 0, initialTemperature: 18, duration: 20 });
const cool = simulateOrganoid({ currentLimit: 0, initialTemperature: 22, duration: 20 });
assert.equal(warm.summary.electricalEnergy, 0);
assert.ok(warm.frames.at(-1).medium > 18);
for (let i = 0; i < warm.frames.length; i++) {
  const a = warm.frames[i], b = cool.frames[i];
  for (const key of ['medium', 'Tc', 'Th', 'tissueMean']) assert.ok(Math.abs(a[key] + b[key] - 40) < 1e-10, 'Zero-current linear thermal symmetry');
  assert.ok(a.tissue.every((value, j) => Math.abs(value + b.tissue[j] - 40) < 1e-10));
  assert.ok(Math.abs(a.qc + warm.params.tecConductance * (a.Th - a.Tc)) < 1e-12, 'Zero-current TEC still conducts.');
}
// Fixed-boundary sphere eigenmode: j0(pi*r/R)*exp(-alpha*pi²*t/R²).
// Cell-average initial/final temperatures are integrated analytically over shell volume.
function eigenmodeError(cells, timeFraction = .05) {
  const radiusM = .001, conductivity = .5, density = 1000, specificHeat = 4000;
  const grid = createRadialGrid({ radiusM, cells, conductivity, density, specificHeat, filmCoefficient: Infinity });
  const lambda = Math.PI / radiusM, diffusivity = conductivity / (density * specificHeat);
  const end = timeFraction * radiusM ** 2 / diffusivity;
  const integral = r => -r * Math.cos(lambda * r) / lambda ** 2 + Math.sin(lambda * r) / lambda ** 3;
  const average = (a, b) => 3 * (integral(b) - integral(a)) / (b ** 3 - a ** 3);
  const initial = grid.capacities.map((_, i) => average(grid.radii[i], grid.radii[i + 1]));
  let tissue = [...initial], t = 0;
  while (t < end) {
    const dt = Math.min(grid.stabilityBound * .02, end - t), { rates, qMedium } = radialHeatRates(tissue, 0, grid);
    assert.ok(Math.abs(rates.reduce((sum, value) => sum + value, 0) + qMedium) < 1e-12, 'Internal radial faces must cancel.');
    tissue = tissue.map((value, i) => value + dt * rates[i] / grid.capacities[i]); t += dt;
  }
  const decay = Math.exp(-diffusivity * lambda ** 2 * end);
  return Math.sqrt(tissue.reduce((sum, value, i) => sum + grid.volumes[i] * (value - initial[i] * decay) ** 2, 0)
    / grid.volumes.reduce((sum, value) => sum + value, 0));
}
const analyticalErrors = [8, 16, 32].map(cells => ({ cells, volumeWeightedRmsErrorK: eigenmodeError(cells) }));
assert.ok(analyticalErrors[0].volumeWeightedRmsErrorK < .01);
assert.ok(analyticalErrors[2].volumeWeightedRmsErrorK < analyticalErrors[1].volumeWeightedRmsErrorK
  && analyticalErrors[1].volumeWeightedRmsErrorK < analyticalErrors[0].volumeWeightedRmsErrorK, 'Spherical solver must converge toward its analytic eigenmode.');

const timeRuns = [.004, .002, .001].map(dt => simulateOrganoid({ condition: 'baseline', initialTemperature: 25, duration: 20, dt }));
const maxDifference = (a, b, key) => Math.max(...a.frames.map((frame, i) => Math.abs(frame[key] - b.frames[i][key])));
const timeErrors = [maxDifference(timeRuns[0], timeRuns[2], 'tissueMean'), maxDifference(timeRuns[1], timeRuns[2], 'tissueMean')];
assert.ok(timeErrors[1] < timeErrors[0] && timeErrors[0] < .01, 'Coupled passive timestep refinement');
const spaceRuns = [6, 12, 24].map(cells => simulateOrganoid({ duration: 55, cells, dt: .001 }));
const spaceErrors = [maxDifference(spaceRuns[0], spaceRuns[2], 'tissueMean'), maxDifference(spaceRuns[1], spaceRuns[2], 'tissueMean')];
assert.ok(spaceErrors[1] < spaceErrors[0] && spaceErrors[0] < .03, 'Coupled tissue spatial refinement');
const edge = simulateOrganoid({ radiusMm: .5, conductivity: 1, cells: 24, dt: .05, duration: 1 });
assert.ok(edge.params.dt < edge.params.inputs.dt && edge.summary.dt <= edge.summary.maximumStableDt && edge.summary.steps < 2000000);

const recording = reference.signals;
assert.equal(recording.sampleRateHz, 500); assert.equal(recording.channelCount, 8);
assert.ok(recording.channels.every(channel => channel.length === 60001 && channel.every(Number.isFinite)));
for (const events of [recording.events, recording.detections]) assert.ok(events.length > 100 && events.every(e => e.t >= 0 && e.t <= 120 && Number.isInteger(e.channel) && e.channel >= 0 && e.channel < 8));
assert.ok(recording.population.artifact.some(Boolean) && recording.population.artifactDetected.some(Boolean));
assert.notDeepEqual(recording.events, recording.detections, 'Assumed truth and estimated spikes must remain distinct.');
const changedSeed = generateOrganoidSignals({ seed: 13, duration: 1 });
assert.notDeepEqual(changedSeed.channels[0], recording.channels[0].slice(0, 501));
const fractional = simulateOrganoid({ duration: 1.235 });
assert.equal(fractional.frames.at(-1).t, 1.235);
assert.ok((fractional.signals.channels[0].length - 1) / fractional.signals.sampleRateHz <= 1.235);
const exported = JSON.parse(JSON.stringify(simulateOrganoid({ duration: 35, seed: 0 })));
assert.deepEqual(exported, simulateOrganoid(exported.params.inputs), 'Complete JSON record must replay bit-for-bit from exported inputs.');
for (const options of [null, [], { condition: 'unknown' }, { condition: ['baseline'] }, { radiusMm: NaN }, { conductivity: Infinity }, { currentLimit: -.1 },
  { duration: 121 }, { cells: 12.5 }, { cells: 25 }, { seed: -1 }, { seed: 4294967296 }, { seed: .5 }, { initialTemperature: '20' }, { unknown: 1 }]) assert.throws(() => simulateOrganoid(options));
assert.throws(() => generateOrganoidSignals({ seed: Infinity }));
console.log(JSON.stringify({ passed: true, elapsedMs: Math.round(performance.now() - start),
  maximumEnergyResidualJ: Math.max(...Object.values(results).map(r => r.summary.maxResidual)),
  analyticalSphereEigenmode: analyticalErrors, coupledTimeErrorsK: timeErrors, coupledSpaceErrorsK: spaceErrors,
  syntheticRecording: { channels: recording.channelCount, sampleRateHz: recording.sampleRateHz, assumedEvents: recording.events.length,
    estimatedSpikes: recording.detections.length, flaggedEpisodes: reference.summary.burstCount },
  defaultNumerical: reference.params.numerical, scenarios: Object.fromEntries(Object.entries(results).map(([condition, r]) => [condition, r.summary])),
}, null, 2));
