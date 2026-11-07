import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validate,tick,build,policy,assignStaff,openClinic,report} from '../dist/simulation.mjs';
const f=JSON.parse(fs.readFileSync('evidence/first-minute-rc9/desktop-loop.json'));
const s=validate(structuredClone(f.checkpoint)),start=s.actions.length;
for(const a of f.actions){
 while(s.seconds<a.at)tick(s);
 if(a.type==='build')assert(build(s,a.room.type,a.room.x,a.room.y,a.room.rotation).ok);
 else if(a.type==='policy')assert(policy(s,a.key,a.value));
 else if(a.type==='assign')assert(assignStaff(s,a.staffId,a.roomId).ok);
 else if(a.type==='open-clinic')assert(openClinic(s).ok);
 else assert.equal(a.type,'service-revenue');
}
while(s.seconds<f.recordEnd)tick(s);
validate(structuredClone(s));
assert.deepEqual(s.actions.slice(start),f.actions);
assert.deepEqual(report(s).counts,f.counts);
assert.deepEqual(s.records.find(p=>p.id===f.tracked)||s.patients.find(p=>p.id===f.tracked),f.visit);
assert.equal(f.visit.outcome,'completed');
assert.equal(f.visit.history.find(h=>h.stage==='gp').completedAt,49);
assert.equal(f.visit.wardrobe,'casual');
assert(f.events.some(e=>e.includes('Changing into a gown')));
assert(f.events.some(e=>e.includes('Walking through the exit')));
console.log('PASS: native RC9 90-second browser recording replays every action, consultation fee, complete visit, timing, wardrobe and arrival count exactly');
