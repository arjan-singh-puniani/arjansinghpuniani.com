import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initial,tick,validate,blocked} from '../dist/simulation.mjs';
import {sampleRoute,interiorPath,sampleInterior} from '../dist/motion.mjs';
const check=s=>{for(const p of [...s.records,...s.patients]){const elapsed=p.total??s.seconds-p.arrival,classified=p.wait+p.walking+p.service+p.handoff+p.transfer;assert.equal(classified,elapsed+p.elapsedOffset,`visit ${p.id} time is classified exactly once`)} };
for(let seed=431;seed<441;seed++){const s=initial('neighborhood',seed);for(let i=0;i<480;i++){tick(s);check(s);for(const p of s.patients.filter(p=>p.moved))for(let a=0;a<=10;a++){const pose=sampleRoute(p.motion,a/10);assert(!blocked(pose.x,pose.y,s.rooms),'interpolated routes retain platform clearance')}}}
for(const [type,h]of[['scan',.63],['care',.25],['consult',.85]]){const path=interiorPath(type,h);assert.deepEqual(sampleInterior(path,0).position,[-.825,.25-h,2.475]);assert.deepEqual(sampleInterior(path,1).position.map(n=>+n.toFixed(6)),path.at(-1));for(let i=0;i<=30;i++)assert(sampleInterior(path,i/30).position.every(Number.isFinite))}
const old=JSON.parse(fs.readFileSync('tests/fixtures/v03-before-debrief.json'));const before=old.patients.map(p=>p.id);const s=validate(old);assert.deepEqual(s.patients.map(p=>p.id),before);check(s);tick(s);check(s);
console.log('PASS: every-tick visit timing conservation, interpolated-path platform clearance, interior endpoints, v0.3 save migration');
