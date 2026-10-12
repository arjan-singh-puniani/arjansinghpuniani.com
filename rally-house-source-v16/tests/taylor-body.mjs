import assert from 'node:assert/strict';
import {CHARACTER_SKIN} from '../dist/animation/CharacterSkin.js';
import {Character} from '../dist/entities/Character.js';import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';import {Vec3,compose,transformPoint} from '../dist/rendering/Math3D.js';

const dress=CHARACTER_SKIN.taylorDress,p=dress.positions,ys=[];for(let i=1;i<p.length;i+=3)ys.push(p[i]);
assert(Math.min(...ys)>.55,'The skirt must reveal the knees rather than engulf the lower body');
assert(Math.max(...p.filter((_,i)=>i%3===0))<.4,'Hem remains within the athletic body envelope');
const widthAt=y=>{const rows=[...new Set(ys)].sort((a,b)=>a-b),row=rows.reduce((best,v)=>Math.abs(v-y)<Math.abs(best-y)?v:best);let half=0;for(let i=0;i<p.length;i+=3)if(p[i+1]===row)half=Math.max(half,Math.abs(p[i]));return half;};
const waist=widthAt(1.055),hips=widthAt(.84),ribcage=widthAt(1.28);assert(waist>.17&&waist<.21);assert(hips>waist*1.25&&hips<waist*1.55);assert(ribcage>waist*1.2&&ribcage<waist*1.5);
for(const name of ['taylorDress','taylorNeckline','taylorDressEdging','taylorArms','taylorLegs','taylorBoots','taylorGloves']){
 const g=CHARACTER_SKIN[name];assert(g.positions.length/9<4500,'Bounded cached garment/limb mesh');
 for(let i=0;i<g.positions.length/3;i++){assert([...g.positions.slice(i*3,i*3+3)].every(Number.isFinite));assert(Math.abs(Math.hypot(...g.normals.slice(i*3,i*3+3))-1)<1e-5);assert(Math.abs(g.boneWeights.slice(i*4,i*4+4).reduce((a,b)=>a+b,0)-1)<1e-6);}
}
// Recover actual emitted joint rings by their plane and skin owner, rather
// than repeating the surface generator or checking a parallel test skeleton.
const rings=[
 ['taylorArms',5,'shoulderL',[-.37,1.34,.015],[-.49,1.12,.01]],['taylorArms',6,'elbowL',[-.49,1.12,.01],[-.50,.94,.01]],['taylorArms',7,'handL',[-.50,.94,.01],[-.49,1.12,.01]],
 ['taylorArms',8,'shoulderR',[.37,1.34,.015],[.49,1.12,.01]],['taylorArms',9,'elbowR',[.49,1.12,.01],[.50,.94,.01]],['taylorArms',10,'handR',[.50,.94,.01],[.49,1.12,.01]],
 ['taylorLegs',11,'hipL',[-.16,.76,0],[-.17,.43,.04]],['taylorLegs',12,'kneeL',[-.17,.43,.04],[-.17,.11,.08]],['taylorBoots',12,'footL',[-.17,.11,.08],[-.17,.43,.04]],
 ['taylorLegs',13,'hipR',[.16,.76,0],[.17,.43,.04]],['taylorLegs',14,'kneeR',[.17,.43,.04],[.17,.11,.08]],['taylorBoots',14,'footR',[.17,.11,.08],[.17,.43,.04]],
].map(([name,bone,joint,rest,next])=>{
 const g=CHARACTER_SKIN[name],center=new Vec3(...rest),axis=Vec3.sub(new Vec3(...next),center).normalize(),vertices=new Map();
 for(let i=0;i<g.positions.length/3;i++){
  const v=new Vec3(...g.positions.slice(i*3,i*3+3)),d=Vec3.sub(v,center);let weight=0;for(let n=0;n<4;n++)if(g.boneIndices[i*4+n]===bone)weight+=g.boneWeights[i*4+n];
  if(weight>.99999&&Math.abs(Vec3.dot(d,axis))<1e-5&&d.len()>.035&&d.len()<.16)vertices.set([...g.positions.slice(i*3,i*3+3)].join(','),i);
 }assert.equal(vertices.size,24,`${name}/${joint}: closed emitted joint ring`);return {name,joint,vertices:[...vertices.values()]};
});
let samples=0,maxError=0;
for(const hz of [30,60,120])for(const state of ['idle','walk','ready','swingForehand','swingBackhand','serve','reach']){
 const c=new Character(playerSpec('taylor'),new Vec3(2,0,-3),new Navigation([]),{});c.yaw=.65;c.racketStowed=true;
 if(state==='reach')c.setInteractionTarget(new Vec3(2.4,1.6,-2.6));else c.trigger(state);if(state==='walk')c.goTo(new Vec3(3,0,-2));
 for(let step=0;step<30;step++){
  c.update(1/hz);const pose=c.analysisPose(),meshes=c.meshes();
  for(const {name,joint,vertices} of rings){
   const m=meshes.find(m=>m.skin===CHARACTER_SKIN[name]),g=m.skin,world=compose(m.position,m.rotation),center=new Vec3();
   for(const i of vertices){let local=new Vec3();const rest=new Vec3(...g.positions.slice(i*3,i*3+3));for(let n=0;n<4;n++){const w=g.boneWeights[i*4+n];if(!w)continue;const v=transformPoint(m.boneMatrices.slice(g.boneIndices[i*4+n]*16,g.boneIndices[i*4+n]*16+16),rest);local.add(new Vec3(v.x,v.y,v.z).scale(w));}const v=transformPoint(world,local);center.add(new Vec3(v.x,v.y,v.z));}
   center.scale(1/vertices.length);const error=Vec3.sub(center,pose[joint]).len();maxError=Math.max(maxError,error);assert(error<2e-6,'Actual shaped surface stays registered to the authoritative moving joint');samples++;
  }
 }
}
console.log(JSON.stringify({jointSurfaceChecks:samples,maxJointSurfaceError:maxError,waistHalfWidth:waist,hipHalfWidth:hips,ribcageHalfWidth:ribcage}));
console.log('Taylor body PASS: bounded athletic silhouette, normalized surfaces and real GPU limb rings registered throughout locomotion, tennis and phone reach at three rates.');
