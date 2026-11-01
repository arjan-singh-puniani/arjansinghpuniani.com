import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initial,tick,build,validate} from '../dist/simulation.mjs';
import {drapePose} from '../dist/motion.mjs';
import {nextStep} from '../dist/guidance.mjs';
assert.equal(drapePose('service',1).visible,true);assert.equal(drapePose('uncovering',0).scaleZ,1);assert.equal(drapePose('uncovering',1).visible,false);
for(const state of ['transfer-in','transfer-out','entering-room','leaving-room'])for(let t=0;t<=3;t+=.1)assert.equal(drapePose(state,t).visible,false,'cloth is clear throughout body movement');
const s=initial();assert.equal(nextStep(s).kind,'build');s.operations.tutorial.skip=true;const added=build(s,'consult',7,3).room;assert.equal(nextStep(s).id,added.id);let firstUse=false,uncovered=false;
for(let t=0;t<480;t++){tick(s);if(s.patients.some(p=>p.history.some(h=>h.room===added.id)))firstUse=true;const p=s.patients.find(p=>p.state==='uncovering');if(p){uncovered=true;assert.equal(p.stage,'care');assert(p.target&&p.room===p.target);const loaded=validate(structuredClone(s));tick(loaded);assert.equal(loaded.patients.find(q=>q.id===p.id).state,'transfer-out');assert.equal(drapePose('transfer-out',0).visible,false)}if(s.served)assert(['room','team','recruit-care','event','build'].includes(nextStep(s).kind))}
assert(firstUse&&uncovered);assert.equal(s.arrivals,s.served+s.left+s.patients.length);
const manifest=JSON.parse(fs.readFileSync('dist/assets/patient-appearances.json'));assert.equal(manifest.appearances.length,11);assert.equal(new Set(manifest.appearances.map(a=>a.id)).size,11);const geometry=new Set();
for(const a of manifest.appearances){assert(a.visualOnly);assert(a.heightMetres>1.5&&a.heightMetres<2.1);for(const file of [a.lod,a.high]){const raw=fs.readFileSync('dist/assets/'+file),gltf=JSON.parse(raw.toString('utf8',20,20+raw.readUInt32LE(12)));assert.equal(gltf.skins[0].joints.length,39);assert.equal(gltf.animations.length,9);assert(!gltf.images?.some(i=>i.uri&&!i.uri.startsWith('data:')));const bounds=gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];assert(bounds.max[1]>1.5&&bounds.max[1]<2.1);if(file===a.lod)geometry.add(JSON.stringify(bounds))}}assert(geometry.size>=6,'variety includes differing physical silhouettes');
console.log('PASS: cloth clears before movement, uncovering reserves capacity and survives checkpoints, state-derived guidance,11 unique proportional rigged patient variants');
