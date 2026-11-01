import assert from 'node:assert/strict';
import { simulate } from '../../public/seizefreeze-lab/model.js';
import { simulateSensitivity } from '../../public/seizefreeze-lab/sensitivity.js';

const expected = { rejectionResistance: [2, 8, 32], contactResistance: [1, 4, 16] };
const direct = simulate();
const sweeps = {};
for (const [axis, values] of Object.entries(expected)) {
  const sweep = simulateSensitivity({}, axis);
  assert.equal(sweep.axis, axis); assert.equal(sweep.unit, 'K/W');
  assert.equal(sweep.runs.length, 3);
  assert.deepEqual(sweep.runs.map(run => run.multiplier), [.25, 1, 4]);
  assert.deepEqual(sweep.runs.map(run => run.inputValue), values);
  assert.deepEqual(sweep.runs[1].frames, direct.frames, 'The active-input run must reproduce the existing trajectory.');
  assert.deepEqual(sweep.runs[1].params, direct.params);
  assert.deepEqual(sweep.runs[1].summary, direct.summary);
  for (const run of sweep.runs) {
    assert.equal(run.parameter, run.params[axis]);
    assert.equal(run.endpoints.minimumSuperficialCell,Math.min(...run.frames.map(f=>f.tissue[0])));
    assert.equal(run.endpoints.peakHot,Math.max(...run.frames.map(f=>f.Th)));
    assert.ok(run.label.includes(`${run.parameter} K/W effective`), 'Label must expose the actual computed resistance.');
    assert.equal(run.clamped, false);
    assert.match(run.status, /modeling assumption/);
    assert.ok(run.summary.maxResidual < 1e-8);
    assert.deepEqual(run.frames.map(f => [f.t, f.signal, f.feature, f.detected]),
      direct.frames.map(f => [f.t, f.signal, f.feature, f.detected]), 'Thermal assumptions must not change synthetic electrical activity or its detector.');
  }
  assert.deepEqual(sweep, simulateSensitivity({}, axis), 'Sensitivity must replay deterministically.');
  sweeps[axis] = sweep;
}
const hot = sweeps.rejectionResistance.runs.map(run => run.summary.maxHot);
assert.ok(hot[0] < hot[1] && hot[1] < hot[2], 'Weaker heat rejection must raise the event scenario hot-side peak.');
for (const [axis, minimum, maximum] of [['rejectionResistance', .5, 200], ['contactResistance', .1, 100]]) {
  for (const edge of [minimum, maximum]) {
    const options = Object.freeze({ [axis]: edge, duration: 1 });
    const sweep = simulateSensitivity(options, axis);
    assert.equal(options[axis], edge, 'A sweep must not mutate active inputs.');
    for (const run of sweep.runs) {
      assert.ok(run.inputValue >= minimum && run.inputValue <= maximum);
      assert.equal(run.parameter, run.params[axis]);
      assert.equal(run.clamped, edge * run.multiplier < minimum || edge * run.multiplier > maximum);
      assert.equal(run.frames.at(-1).t, 1);
      assert.ok(run.summary.maxResidual < 1e-8);
    }
    assert.equal(sweep.runs[edge === minimum ? 0 : 2].inputValue, edge, 'A bounded run may coincide with the active input.');
  }
}
for (const [scenario, axis, factor] of [['rejection', 'rejectionResistance', 8], ['resistance', 'contactResistance', 4]]) {
  const sweep = simulateSensitivity({ scenario, duration: 1 }, axis);
  for (const run of sweep.runs) {
    assert.equal(run.parameter, run.inputValue * factor, 'Effective resistance must retain scenario multipliers.');
    assert.ok(run.label.includes(`${run.parameter} K/W effective`));
  }
}
const coolingFromWarm=simulateSensitivity({initialTemperature:39,scenario:'baseline',duration:10}).runs[1];
assert.ok(coolingFromWarm.endpoints.minimumSuperficialCell>Math.min(...coolingFromWarm.frames.flatMap(f=>f.tissue)), 'The superficial cell must not be mislabeled with the minimum across all depths.');
const baseline = simulateSensitivity({ scenario: 'baseline', duration: 1 });
assert.ok(baseline.runs.every(run => run.frames.every(f => f.tissue.every(t => Math.abs(t - 37) < 1e-10))));
const inherited = simulateSensitivity(Object.assign(Object.create({ rejectionResistance: 200 }), { duration: 1 }));
assert.deepEqual(inherited.runs.map(run => run.inputValue), [2, 8, 32], 'Ignore inherited options just as the solver does.');
for (const options of [null, [], { currentLimit: NaN }, { rejectionResistance: 201 }, { contactResistance: 0 }, { rejectionResistance: '8' }, { unexpected: 1 }]) {
  assert.throws(() => simulateSensitivity(options), 'Invalid active inputs must be rejected rather than repaired by clamping.');
}
for (const axis of ['unknown', '__proto__', 'toString']) assert.throws(() => simulateSensitivity({}, axis), /Sensitivity axis/);
console.log(JSON.stringify({ passed: true, runsPerSweep: 3, multipliers: [.25, 1, 4],
  rejectionResistance: { effectiveValues: sweeps.rejectionResistance.runs.map(r => r.parameter), peakHotC: hot },
  contactResistance: { effectiveValues: sweeps.contactResistance.runs.map(r => r.parameter) },
  maximumEnergyResidualJ: Math.max(...Object.values(sweeps).flatMap(sweep => sweep.runs.map(r => r.summary.maxResidual))),
  evidenceBoundary: 'Deterministic assumption sweep; no measured uncertainty distribution or clinical prediction' }, null, 2));
