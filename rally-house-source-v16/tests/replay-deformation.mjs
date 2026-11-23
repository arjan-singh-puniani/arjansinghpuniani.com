import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,transformPoint} from '../dist/rendering/Math3D.js';
import {adultTaylorPose} from '../dist/animation/TaylorBody.js';
import {loadArjanUpperBody} from '../dist/animation/ArjanUpperBody.js';
import {captureFrame,interpolateFrame} from '../dist/analysis/MotionCapture.js';
const originalFetch=globalThis.fetch;
try{globalThis.fetch=async url=>new Response(fs.readFileSync(new URL(url)));await loadArjanUpperBody();}finally{globalThis.fetch=originalFetch;}
function vertex(mesh,i){const g=mesh.skin,p=new Vec3(...g.positions.subarray(i*3,i*3+3)),out=new Vec3();for(let j=0;j<4;j++){const w=g.boneWeights[i*4+j];if(!w)continue;const b=g.boneIndices[i*4+j]*16,q=transformPoint(mesh.boneMatrices.subarray(b,b+16),p);out.add(new Vec3(q.x,q.y,q.z).scale(w));}return out;}
let samples=0,maxJump=0;
for(const state of ['serve','swingForehand','swingBackhand']){
 const c=new Character(playerSpec('arjan'),new Vec3(),new Navigation([]),{});c.matchCompetitor=true;c.setAnimation('ready');for(let i=0;i<60;i++)c.update(1/60);
 if(state!=='serve')c.setIncomingContact(new Vec3(state==='swingBackhand'?-.6:.6,1.02,.9));c.triggerShot(state,new Vec3(0,.1,5));
 let a=captureFrame(c,0,null);
 for(let n=1;n<=60;n++){c.update(1/30);const b=captureFrame(c,n/30,null);if(a.body.length===b.body.length){
  // Approaching a captured time must converge to the actual skin, not a differently twisted reconstruction.
  const near=interpolateFrame(a,b,b.time-1e-9);
  for(let part=0;part<b.body.length;part++){const expected=b.body[part];if(!expected.rig||expected.neckBlend)continue;for(let i=0;i<expected.skin.positions.length/3;i+=31){const error=Vec3.sub(vertex(near.body[part],i),vertex(expected,i)).len();maxJump=Math.max(maxJump,error);assert(error<.0001,`${state}/${n}: replay skin jumps ${error} at a recorded frame`);samples++;}}
 }a=b;}
}
console.log(JSON.stringify({samples,maxJump}));

// Contact loading may rotate or translate the torso, but cannot shear its internal segment lengths.
let hinges=0;
for(const state of ['swingForehand','swingBackhand'])for(const yaw of [0,.7,Math.PI])for(const height of [.66,1.02,1.38]){
 const c=new Character(playerSpec('arjan'),new Vec3(),new Navigation([]),{});c.yaw=yaw;c.matchCompetitor=true;c.triggerShot(state,new Vec3(0,.1,5));
 const source=c.poseFor(state,c.shotDuration(state)*.35),base={sitting:false,folded:false,rightWorld:0,leftWorld:0,human:true,rigidReach:true,strokeWeight:1,groundstrokeWeight:1,backhandWeight:state==='swingBackhand'?1:0};
 const neutral=adultTaylorPose(source,c.position,yaw,base),target=new Vec3(Math.sin(yaw)*.9, height,Math.cos(yaw)*.9);
 for(const weight of [.25,.5,1]){const loaded=adultTaylorPose(source,c.position,yaw,{...base,posture:{weight,right:target}});assert(Math.abs(Vec3.sub(neutral.torsoCenter,neutral.pelvisCenter).len()-Vec3.sub(loaded.torsoCenter,loaded.pelvisCenter).len())<1e-6,'Loading preserves the torso segment instead of shearing it');hinges++;}
}
console.log(JSON.stringify({rigidTorsoLoads:hinges}));
