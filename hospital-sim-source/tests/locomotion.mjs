import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/vendor/build/three.module.js';
import {playClip,advanceLocomotion,samplePose} from '../dist/animation.mjs';
import {WALK_SPEED,sampleRoute} from '../dist/motion.mjs';
import {nextStep} from '../dist/guidance.mjs';
import {initial,tick,build,validate,report} from '../dist/simulation.mjs';
const model=new THREE.Group(),mixer=new THREE.AnimationMixer(model),clips=['Idle','Walk','Rest'].map((name,i)=>new THREE.AnimationClip(name,.9,[new THREE.NumberKeyframeTrack('.position[y]',[0,.9],[i,i])])),p={group:new THREE.Group(),model,mixer,actions:new Map(clips.map(c=>[c.name,mixer.clipAction(c)]))};
playClip(p,'Idle');samplePose(p,'Idle',.2);playClip(p,'Rest');mixer.update(.3);assert.equal(model.position.y,2,'a sampled transfer must not leave the next clip at zero weight');
playClip(p,'Walk');p.lastWalkPosition=new THREE.Vector3();p.previousClip='Walk';p.walkDistance=0;
for(let i=1;i<=30;i++){p.group.position.x=WALK_SPEED*i/30;advanceLocomotion(p,'Walk',1/30)}
assert(Math.abs(p.actions.get('Walk').time-.1)<1e-6,'phase comes from actual metres, including variable frame times');
const uniformPhase=p.actions.get('Walk').time;p.lastWalkPosition.set(0,0,0);p.group.position.set(0,0,0);p.walkDistance=0;for(let i=1;i<=17;i++){p.group.position.x=WALK_SPEED*i/17;advanceLocomotion(p,'Walk',1/17)}assert(Math.abs(p.actions.get('Walk').time-uniformPhase)<1e-6,'frame rate does not change gait phase');
const phase=p.actions.get('Walk').time;advanceLocomotion(p,'Walk',1/30);assert.equal(p.actions.get('Walk').time,phase,'feet do not cycle without translation');
const q=sampleRoute([{x:0,y:0},{x:.25,y:0},{x:.25,y:.25}],.5,[]);assert(q.x<.25&&q.y>0,'a clear corner is rounded');
for(const profile of ['clinician','coat',...Array.from({length:11},(_,i)=>'patient-'+String(i+1).padStart(2,'0'))]){const b=fs.readFileSync('dist/assets/walk-'+profile+'.glb'),g=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));assert.equal(g.animations.length,1);assert.equal(g.animations[0].name,'Walk');assert.equal(g.skins[0].joints.length,39);assert(b.length<60000)}
const runs=[];for(const expand of [false,true]){const s=initial('neighborhood');assert.deepEqual(s.arrivalTape.slice(0,3).map(e=>e.at),[1,5,9]);if(expand)assert(build(s,'consult',7,3).ok);for(let i=0;i<60;i++){tick(s);validate(structuredClone(s))}runs.push(s);assert(s.served>=1);assert.equal(s.arrivals,s.served+s.left+s.patients.length)}
const wait=s=>[...s.records,...s.patients].filter(p=>p.id<1003).reduce((n,p)=>n+p.wait,0);assert(wait(runs[1])<wait(runs[0]));assert(runs[1].patients.some(p=>p.history.some(h=>h.room===10)));const saved=validate(structuredClone(runs[1]));for(let i=0;i<60;i++){tick(saved);tick(runs[1])}assert.deepEqual(report(saved),report(runs[1]));
console.log('PASS: clip-weight restoration, distance-locked gait, stationary feet, safe corner, all13originalrigclips, meaningful first-minute expansion and exact active save replay');

assert.match(nextStep(initial('neighborhood')).title,/Three arrivals/);assert(!nextStep(initial('surge')).title.includes('Three arrivals'),'other schedules are not described as the opening burst');
