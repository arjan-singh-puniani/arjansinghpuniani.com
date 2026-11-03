import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/build/three.module.js';
import {characterReaction} from '../dist/reactions.mjs';
import {landingGesture,restoreBones} from '../dist/animation.mjs';

const history=new Map(),mira={id:1,name:'Mira',role:'doctor'},snapshot=structuredClone(mira);
const first=characterReaction(mira,'staff','lift',history,0);
assert.equal(first.line,'I prefer the stairs.');
assert.equal(characterReaction(mira,'staff','lift',history,100),null,'rapid repeated pickup stays quiet');
assert(characterReaction(mira,'staff','land',history,101),'a quick safe landing has its own reaction');
assert.notEqual(characterReaction(mira,'staff','lift',history,1500).line,first.line,'repeat pickups rotate the writing');
assert.deepEqual(mira,snapshot,'presentation never changes the simulation person');
for(const [i,name]of ['Mira','Jules','Remy','Ash','Sage','Kit','Quinn','Tess','Ellis'].entries())for(const cue of ['lift','land','cancel']){
 const seen=new Set();for(let n=0;n<3;n++){const r=characterReaction({id:i+20,name},'staff',cue,history,n*1500);assert.equal(r.name,name);assert(r.line.length>5&&r.line.length<70);seen.add(r.line)}assert(seen.size>=2);
}
for(const caseId of ['welcome','binder','fitness','questions','unknown'])for(const cue of ['lift','land','cancel'])assert(characterReaction({id:caseId,name:'Rowan',caseId},'patient',cue,history,0));
assert.equal(characterReaction({...mira,name:'New recruit'},'staff','lift',new Map(),0).line,first.line,'new staff inherit role voice');
for(const args of [[null,'staff','lift'],[mira,'room','lift'],[mira,'staff','oops']])assert.equal(characterReaction(...args,history,0),null);
assert.equal(characterReaction(mira,'staff','lift',history,NaN),null);
for(const name of ['constructor','toString','__proto__']){assert(characterReaction({id:name,name,role:'doctor'},'staff','lift',history,0));assert(characterReaction({id:name,name,caseId:name},'patient','lift',history,0))}
for(let id=0;id<200;id++)characterReaction({id,name:'Rowan'},'patient','lift',history,2000);
assert.equal(history.size,128,'session-only reaction memory stays bounded');

const bones=['head','forearm.R','hand.R','thigh.L'].map(name=>{const bone=new THREE.Bone();bone.name=name;bone.rotation.set(.02,.03,.04);return bone});
const restBones=bones.map(bone=>({bone,position:bone.position.clone(),quaternion:bone.quaternion.clone(),scale:bone.scale.clone()})),person={restBones};
const atPeak=landingGesture(person,.45);assert.equal(atPeak.length,3);assert(bones[0].quaternion.angleTo(restBones[0].quaternion)>.1);assert(bones[3].quaternion.angleTo(restBones[3].quaternion)<1e-7,'feet and legs stay planted');restoreBones(atPeak);
for(let i=0;i<180;i++){const pose=landingGesture(person,(i%54)/60);assert(bones.every(b=>b.quaternion.toArray().every(Number.isFinite)));assert(bones[1].quaternion.angleTo(restBones[1].quaternion)<=.281);restoreBones(pose)}
assert(bones.every((b,i)=>b.quaternion.angleTo(restBones[i].quaternion)<1e-7),'each gesture restores without accumulating offsets');
assert.deepEqual(landingGesture(person,.45,true),[],'reduced motion has no gesture');assert.deepEqual(landingGesture(person,.9),[]);assert.deepEqual(landingGesture(person,-1),[]);
const cancelled=landingGesture(person,.45,false,true);assert(bones[0].quaternion.angleTo(restBones[0].quaternion)<.09);restoreBones(cancelled);
console.log('PASS: distinct rotating voices, rapid-input cooldown, separate pickup/landing cues, patient and recruit voices, no person mutation, bounded memory, planted feet, finite additive gestures, exact restoration and reduced motion');
