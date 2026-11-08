import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,transformPoint} from '../dist/rendering/Math3D.js';
import {ATHLETE_WARDROBE,BONE,CHARACTER_SKIN} from '../dist/animation/CharacterSkin.js';
import {loadArjanUpperBody} from '../dist/animation/ArjanUpperBody.js';
import {captureFrame,interpolateFrame} from '../dist/analysis/MotionCapture.js';

// Compare the real consumer before/after loading, so this cannot pass by exercising only the legacy fallback.
const cases=[];
for(const hz of [30,60,120])for(const state of ['idle','walk','serve','swingForehand','swingBackhand','sit','drink']){
 const c=new Character(playerSpec('arjan'),new Vec3(),new Navigation([]),{});c.racketStowed=true;c.trigger(state);if(state==='walk')c.goTo(new Vec3(1,0,1));
 for(let i=0;i<hz;i++)c.update(1/hz);
 cases.push({c,hz,state,pose:JSON.parse(JSON.stringify(c.analysisPose())),meshes:c.meshes()});
}
function elbowFoldCount(mesh,side){
 const {skin,boneMatrices,rig}=mesh,elbow=rig.bind['foreArm'+side];
 const edges=new Map();
 let folds=0,adjacencies=0;
 for(let i=0;i<skin.positions.length;i+=9){
  const points=[0,3,6].map(k=>new Vec3(...skin.positions.subarray(i+k,i+k+3)));
  if(points.some(point=>Vec3.sub(point,elbow).len()>.145))continue;
  const posed=points.map((point,j)=>{
   const out=new Vec3();
   for(let k=0;k<4;k++){
    const offset=(i/3+j)*4+k,weight=skin.boneWeights[offset];
    if(!weight)continue;
    const bone=skin.boneIndices[offset]*16;
    const q=transformPoint(boneMatrices.subarray(bone,bone+16),point);
    out.add(new Vec3(q.x,q.y,q.z).scale(weight));
   }
   return out;
  });
  const normal=Vec3.cross(Vec3.sub(posed[1],posed[0]),Vec3.sub(posed[2],posed[0])).normalize();
  const keys=points.map(point=>[point.x,point.y,point.z].map(n=>n.toFixed(6)).join(','));
  for(let j=0;j<3;j++){
   const edge=[keys[j],keys[(j+1)%3]].sort().join('|'),neighbor=edges.get(edge);
   if(neighbor){adjacencies++;if(Vec3.dot(neighbor,normal)<Math.cos(85*Math.PI/180))folds++;}
   else edges.set(edge,normal);
  }
 }
 assert(adjacencies>100,'Check the rendered elbow surface on both sides of the bend');
 return folds;
}
let fault='';const originalFetch=globalThis.fetch;
globalThis.fetch=async url=>{
 let bytes=fs.readFileSync(fileURLToPath(url));
 if(String(url).endsWith('.glb')&&fault==='checksum'){bytes=Buffer.from(bytes);bytes[bytes.length-1]^=1;}
 if(String(url).endsWith('.json')&&fault==='bind'){const meta=JSON.parse(bytes);meta.bind.chest=[null,0,0];bytes=Buffer.from(JSON.stringify(meta));}
 return new Response(bytes);
};
try{
 await loadArjanUpperBody();
 const first=cases[0].c.meshes(),parts=first.filter(m=>m.skin?.id.startsWith('asset-'));assert.equal(parts.length,2);
 const shirt=parts.find(m=>m.material==='performanceKnit').skin,skin=parts.find(m=>m.material==='humanSkin').skin;
 assert(!first.some(m=>m.skin===ATHLETE_WARDROBE.arjanTop||m.skin===ATHLETE_WARDROBE.arjanArms),'The loaded body replaces both old upper-body pieces');
 for(let v=0;v<shirt.positions.length/3;v++)for(let j=0;j<4;j++)if(shirt.boneWeights[v*4+j]>1e-6)assert(![BONE.thighL,BONE.shinL,BONE.thighR,BONE.shinR,BONE.footL,BONE.footR].includes(shirt.boneIndices[v*4+j]),'The shirt hem does not inherit leg motion');
 // Disconnected sleeve caps were the visible defect: verify one connected garment, independent of vertex/UV splits.
 const adjacency=new Map(),key=i=>[...shirt.positions.subarray(i*3,i*3+3)].map(n=>n.toFixed(6)).join(',');
 for(let i=0;i<shirt.positions.length/3;i+=3){const ids=[0,1,2].map(k=>key(i+k));for(const a of ids){if(!adjacency.has(a))adjacency.set(a,new Set());for(const b of ids)adjacency.get(a).add(b);}}
 const seen=new Set(),queue=[adjacency.keys().next().value];while(queue.length){const a=queue.pop();if(seen.has(a))continue;seen.add(a);queue.push(...[...adjacency.get(a)].filter(b=>!seen.has(b)));}assert.equal(seen.size,adjacency.size,'Torso and sleeves form one surface');
 let samples=0;
 for(const {c,pose,meshes} of cases){
  const current=c.meshes();assert.deepEqual(JSON.parse(JSON.stringify(c.analysisPose())),pose,'Loading/rendering preserves the approved pose and controller');
  const oldUpper=[ATHLETE_WARDROBE.arjanTop,ATHLETE_WARDROBE.arjanArms,ATHLETE_WARDROBE.arjanBand,ATHLETE_WARDROBE.freeHands,CHARACTER_SKIN.taylorHands];
  assert(!current.some(m=>oldUpper.includes(m.skin)),'The continuous mesh replaces the fallback hands and cuffs');
  assert.deepEqual(current.filter(m=>m.skin!==shirt&&m.skin!==skin),meshes.filter(m=>!oldUpper.includes(m.skin)),'Head, neck, legs, shoes and racket remain registered');
  for(const mesh of current.filter(m=>m.skin===shirt||m.skin===skin)){
   assert([...mesh.boneMatrices].every(Number.isFinite));
   for(let i=0;i<mesh.skin.positions.length/3;i+=12){const p=new Vec3(...mesh.skin.positions.subarray(i*3,i*3+3)),q=new Vec3();for(let j=0;j<4;j++){const w=mesh.skin.boneWeights[i*4+j],bone=mesh.skin.boneIndices[i*4+j],point=transformPoint(mesh.boneMatrices.subarray(bone*16,bone*16+16),p);q.add(new Vec3(point.x,point.y,point.z).scale(w));}assert([q.x,q.y,q.z].every(Number.isFinite)&&q.len()<4,'Actual posed upper-body vertices stay finite and bounded');samples++;}
  }
 }
 assert(skin.morphs[4].some(delta=>Math.abs(delta)>.02),'The loaded mesh has an actual finger curl');
 let raisedHandChecks=0;
 for(const hz of [30,60,120])for(const yaw of [0,Math.PI]){
  const server=new Character(playerSpec('arjan'),new Vec3(),new Navigation([]),{});
  server.yaw=server.targetYaw=yaw;
  server.matchCompetitor=true;
  server.setAnimation('ready');
  for(let i=0;i<hz;i++)server.update(1/hz);
  server.triggerShot('serve',new Vec3(0,.1,-5));
  for(let i=0;i<Math.floor(hz*.75);i++){
   server.update(1/hz);
   const mesh=server.meshes().find(m=>m.skin===skin),pose=server.analysisPose();
   if(pose.handL.y-pose.shoulderL.y>.45){
    const arm=Vec3.sub(pose.handL,pose.elbowL).normalize(),c=Math.cos(yaw),s=Math.sin(yaw);
    const localArm=new Vec3(c*arm.x-s*arm.z,arm.y,s*arm.x+c*arm.z);
    assert(Vec3.dot(localArm,mesh.rig.pose.handDirectionL)>Math.cos(Math.PI/6),'The raised toss fingers follow the forearm without a right-angle wrist bend');
    raisedHandChecks++;
   }
   assert(mesh.handGrip[0]<.3&&mesh.handGrip[1]>.95,'The toss opens while the racket hand grips');
   assert(mesh.boneMatrices.every(Number.isFinite));
   const axis=Vec3.sub(pose.racketHandleTop,pose.racketGrip).normalize();
   const right=new Vec3(Math.cos(server.yaw),0,-Math.sin(server.yaw));
   const forward=new Vec3(Math.sin(server.yaw),0,Math.cos(server.yaw));
   const localAxis=new Vec3(Vec3.dot(axis,right),axis.y,Vec3.dot(axis,forward));
   assert(Math.abs(Vec3.dot(localAxis,mesh.rig.pose.handDirectionR))<.015,'The palm stays wrapped across the shaft through the serve');
  }
 }
 assert(raisedHandChecks>100,'Exercise the raised hand throughout the toss at all three frame rates and both court ends');
 // A near-right-angle change between adjacent triangles produced the visible elbow ridge.
 for(const state of ['idle','serve','swingBackhand']){
  const actor=new Character(playerSpec('arjan'),new Vec3(1,0,5),new Navigation([]),{});
  actor.yaw=actor.targetYaw=Math.PI;
  actor.racketStowed=true;
  for(let i=0;i<180;i++)actor.update(1/120);
  if(state!=='idle'){
   actor.racketStowed=false;
   actor.matchCompetitor=true;
   actor.setAnimation('ready');
   for(let i=0;i<60;i++)actor.update(1/120);
   if(state==='swingBackhand')actor.setIncomingContact(new Vec3(.5,1.1,4));
   actor.triggerShot(state,new Vec3(0,.1,-5));
   const time=state==='serve'?.6:actor.shotContactTime(state);
   for(let i=0;i<120;i++)actor.update(time/120);
  }
  const mesh=actor.meshes().find(item=>item.skin===skin);
  for(const side of ['L','R'])assert.equal(elbowFoldCount(mesh,side),0,`No near-right-angle skin fold at the ${side} elbow in ${state}`);
 }
 const c=cases[0].c,a=captureFrame(c,0,null);c.goTo(new Vec3(.5,0,.5));c.update(1/60);const b=captureFrame(c,1/60,null),mid=interpolateFrame(a,b,.5);
 assert.equal(mid.body.filter(m=>m.skin===shirt||m.skin===skin).length,2,'Replay retains the real authored surfaces');assert(mid.body.filter(m=>m.skin===shirt||m.skin===skin).every(m=>[...m.boneMatrices].every(Number.isFinite)),'Replay retargeting stays finite');
 for(const failure of ['checksum','bind']){fault=failure;await assert.rejects(loadArjanUpperBody(),failure==='checksum'?/checksum/:/bind/);assert(c.meshes().some(m=>m.skin===shirt),'Failed reload preserves the verified geometry');}fault='';
 const other=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});assert(!other.meshes().some(m=>m.skin===shirt||m.skin===skin),'The new body is exclusive to Arjan');
 console.log(JSON.stringify({poses:cases.length,sourceVertices:seen.size,deformedSamples:samples}));
 console.log('Arjan upper body PASS: connected jersey, stable hem weights, real loaded geometry and replay, unchanged approved poses/protected parts, atomic validation failures.');
}finally{globalThis.fetch=originalFetch;}
