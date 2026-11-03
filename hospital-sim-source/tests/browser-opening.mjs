import assert from 'node:assert/strict';import fs from 'node:fs';
import{initial,tick,build,validate,report}from'../dist/simulation.mjs';
const f=JSON.parse(fs.readFileSync('tests/fixtures/first-minute-rc3.json')),s=initial('neighborhood',f.seed);
assert.equal(f.model,'1.0.0-rc3');for(const a of f.actions){while(s.seconds<a.at)tick(s);assert.equal(a.type,'build');assert(build(s,a.room.type,a.room.x,a.room.y,a.room.rotation).ok)}while(s.seconds<f.recordEnd)tick(s);
assert.deepEqual(report(s).counts,f.counts);assert.deepEqual(s.patients.find(p=>p.id===f.tracked),f.visit);assert.equal(f.recordStart,0);assert.equal(f.recordEnd,60);validate(structuredClone(s));console.log('PASS: actual RC3 first-minute browser actions, counts and tracked visit replay exactly');
