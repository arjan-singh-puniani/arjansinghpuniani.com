import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { simulate, scenarios } from '../../public/seizefreeze-lab/model.js';

const start = performance.now();
const results = {};
for (const scenario of Object.keys(scenarios)) {
  const result = simulate({ scenario });
  assert.equal(result.frames[0].t, 0);
  assert.equal(result.frames.at(-1).t, 120);
  assert.ok(result.summary.maxResidual < 1e-8, `${scenario}: energy ledger does not close`);
  for (const frame of result.frames) {
    assert.ok(frame.tissue.every(Number.isFinite));
    assert.ok(Math.abs(frame.qh - frame.qc - frame.power) < 1e-12);
    assert.ok(frame.current >= 0 && frame.current <= result.params.currentLimit);
  }
  results[scenario] = result;
}
const baseline = results.baseline;
assert.ok(baseline.frames.every(frame => frame.tissue.every(value => Math.abs(value - 37) < 1e-10)));
assert.equal(baseline.summary.electricalEnergy, 0);
const passive = simulate({ currentLimit: 0, initialTemperature: 35 });
assert.equal(passive.summary.electricalEnergy, 0);
assert.ok(passive.frames.at(-1).tissue[0] > 35, 'Passive warmup must approach the reservoir.');
for (const frame of passive.frames) {
  assert.ok(Math.abs(frame.qc + passive.params.tecConductance * (frame.Th - frame.Tc)) < 1e-12,
    'Zero-current module must retain passive thermal conduction.');
}
const passiveHot = simulate({ currentLimit: 0, initialTemperature: 39 });
assert.ok(passive.frames.every((frame, index) => frame.tissue.every((value, cell) => Math.abs(value + passiveHot.frames[index].tissue[cell] - 74) < 1e-10)),
  'The passive linear system must preserve symmetric perturbations around equilibrium.');
assert.ok(results.event.summary.minTissue < results.disabled.summary.minTissue - 0.1);
assert.ok(results.rejection.summary.maxHot > results.event.summary.maxHot);
assert.ok(results.resistance.summary.minTissue > results.event.summary.minTissue);
assert.ok(results.sensor.frames.find(frame => frame.t >= 51).sensor === null);
assert.ok(results.sensor.frames.filter(frame => frame.t >= 51).every(frame => frame.current === 0));
assert.ok(results.shutdown.frames.filter(frame => frame.t >= 40.01).every(frame => frame.current === 0));
const interlock = simulate({ scenario: 'repeated', currentLimit: 0.8, contactResistance: 80,
  rejectionResistance: 200, initialTemperature: 39 });
const interlockIndex = interlock.frames.findIndex(frame => frame.state.includes('interlock'));
assert.ok(interlockIndex > 0, 'An extreme exploratory case must exercise the cold-plate interlock.');
assert.ok(interlock.frames.slice(interlockIndex).every(frame => frame.current === 0), 'An interlock must stay latched.');
const eventSignals = results.event.frames.map(frame => frame.signal);
assert.deepEqual(eventSignals, results.disabled.frames.map(frame => frame.signal), 'Cooling must not normalize the synthetic waveform.');
assert.deepEqual(results.event, simulate(), 'Replay must be deterministic.');
const medium = simulate({ dt: 0.005 });
const fine = simulate({ dt: 0.0025 });
const tempError = (a, b) => Math.max(...a.frames.map((f, i) => Math.abs(f.tissue[0] - b.frames[i].tissue[0])));
const timeCoarseError = tempError(results.event, fine);
const timeMediumError = tempError(medium, fine);
assert.ok(timeMediumError < timeCoarseError && timeCoarseError < 0.025, 'Temporal convergence failed.');
const spatialMedium = simulate({ dz: 0.0004, dt: 0.005 });
const spatialFine = simulate({ dz: 0.00025, dt: 0.005 });
const surfaceError = (a, b) => Math.max(...a.frames.map((f, i) => Math.abs(f.surface - b.frames[i].surface)));
const spatialCoarseError = surfaceError(medium, spatialFine);
const spatialMediumError = surfaceError(spatialMedium, spatialFine);
assert.ok(spatialMediumError < spatialCoarseError && spatialCoarseError < 0.25, 'Spatial convergence failed.');
for (const options of [{ currentLimit: NaN }, { dt: 1 }, { dz: 0 }, { scenario: 'unknown' }, { initialTemperature: '37' }, { surprise: 1 }, { toString: 1 }]) {
  assert.throws(() => simulate(options));
}
console.log(JSON.stringify({ passed: true, elapsedMs: Math.round(performance.now() - start),
  maximumEnergyResidualJ: Math.max(...Object.values(results).map(r => r.summary.maxResidual)),
  temporalErrorC: { dt001: timeCoarseError, dt0005: timeMediumError, referenceDt: 0.0025 },
  spatialSurfaceErrorC: { dz0005: spatialCoarseError, dz0004: spatialMediumError, referenceDz: 0.00025 },
  scenarios: Object.fromEntries(Object.entries(results).map(([key, value]) => [key, value.summary])),
}, null, 2));
