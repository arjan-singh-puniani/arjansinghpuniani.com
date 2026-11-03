import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initial,build,staffModule,tick,report,validate} from '../dist/simulation.mjs';
const f=JSON.parse(fs.readFileSync('tests/fixtures/first-minute-rc4.json')),s=initial('first',f.seed);
assert.equal(f.model,s.version);assert.equal(f.recordStart,0);assert.equal(f.recordEnd,60);
for(const a of f.actions){
 while(s.seconds<a.at)tick(s);
 if(a.type==='build')assert(build(s,a.room.type,a.room.x,a.room.y,a.room.rotation).ok);
 else if(a.type==='policy'&&a.key==='hire')assert(staffModule(s,10).ok);
 else assert(['assign','open-clinic','opening-reward'].includes(a.type),'known atomic subaction or model-generated reward');
}
while(s.seconds<f.recordEnd)tick(s);validate(structuredClone(s));
assert.deepEqual(s.actions,f.actions,'all actual browser decisions replay in order');assert.deepEqual(report(s).counts,f.counts);assert.deepEqual(s.records.find(p=>p.id===f.tracked),f.visit);
assert(f.events.some(e=>e.startsWith('00:40 Completed')));
console.log('PASS: actual RC4 empty-start build/hire actions, all subactions, first completed visit, timings and 60-second arrival accounting replay exactly');
