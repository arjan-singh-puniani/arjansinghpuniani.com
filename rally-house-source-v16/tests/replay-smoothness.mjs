import assert from 'node:assert/strict';
import {Vec3,compose,transformPoint} from '../dist/rendering/Math3D.js';
import {demonstration} from '../dist/analysis/LabDemonstrations.js';
import {ReplayTimeline,JOINT_KEYS,detachedBody,value} from '../dist/analysis/MotionCapture.js';
import {PerformanceLab} from '../dist/analysis/PerformanceLab.js';
const spec={id:'player',name:'Player',role:'member',shirt:'#888',skin:'#c99',hair:'#333',playStyle:'',goal:''};
const anchors=[['shoulderL',5,[-.37,1.34,.015]],['elbowL',6,[-.49,1.12,.01]],['handL',7,[-.50,.94,.01]],['shoulderR',8,[.37,1.34,.015]],['elbowR',9,[.49,1.12,.01]],['handR',10,[.50,.94,.01]],['hipL',11,[-.16,.76,0]],['kneeL',12,[-.17,.43,.04]],['footL',12,[-.17,.11,.08]],['hipR',13,[.16,.76,0]],['kneeR',14,[.17,.43,.04]],['footR',14,[.17,.11,.08]]];
let samples=0,maxError=0;
for(const avatar of ['arjan','taylor'])for(const kind of ['gait','forehand','serve']){
 const clip=demonstration(kind,{...spec,avatar}),timeline=new ReplayTimeline(clip);
 const saved=clip.frames.map(f=>({pose:JSON.stringify(f.pose),position:JSON.stringify(f.body.map(m=>m.position)),bones:f.body.filter(m=>m.poseRig).map(m=>m.boneMatrices.slice())}));
 for(let i=0;i<clip.frames.length;i++){
  const a=clip.frames[i];timeline.seek(a.time);assert.strictEqual(timeline.frame,a,'Every observed sample and contact remains exact');
  if(i===clip.frames.length-1)continue;
  const b=clip.frames[i+1];
  for(const fraction of [.125,.25,.5,.75,.875]){
   const time=a.time+(b.time-a.time)*fraction;timeline.seek(time);const f=timeline.frame;samples++;
   assert(f.interpolated,'Stable authored topology must move between observations');assert.equal(f.time,time);assert.strictEqual(timeline.frame,f,'All owners consume the same cached pose');
   assert.equal(f.contact,false);assert.equal(f.bounce,false);assert.equal(timeline.historyIndex(),i,'Future contact/footstep markers cannot appear early');
   for(const key of JOINT_KEYS)assert(Vec3.sub(f.pose[key],Vec3.lerp(a.pose[key],b.pose[key],fraction)).len()<1e-9);
   if(a.ball&&b.ball)assert(Vec3.sub(f.ball,Vec3.lerp(a.ball,b.ball,fraction)).len()<1e-9);else assert.equal(f.ball,null);
   for(const part of f.body.filter(m=>m.poseRig)){
    const world=compose(part.position,part.rotation,part.scale);
    for(const [key,bone,rest] of anchors){const local=transformPoint(part.boneMatrices.slice(bone*16,bone*16+16),new Vec3(...rest)),p=transformPoint(world,new Vec3(local.x,local.y,local.z)),error=Math.hypot(p.x-f.pose[key].x,p.y-f.pose[key].y,p.z-f.pose[key].z);maxError=Math.max(maxError,error);assert(error<2e-6,`GPU ${avatar}/${kind}/${key} at fractional time: ${error}`);}
   }
   for(const joint of ['knee','hip','elbow','shoulder','ankle'])assert(Number.isFinite(value(f,joint)));
   const lab={active:true,timeline,contactLens:true,separateRig:false,renderKey:'',cached:[],rigOffset:PerformanceLab.prototype.rigOffset};
   const before=PerformanceLab.prototype.meshes.call(lab,false);assert.strictEqual(PerformanceLab.prototype.meshes.call(lab,false),before,'A stationary pose reuses its mesh list');
   timeline.seek(time+(b.time-time)*.25);const after=PerformanceLab.prototype.meshes.call(lab,false);assert.notStrictEqual(after,before,'Mesh cache must advance within a single recorded interval');
  }
 }
 for(let i=0;i<clip.frames.length;i++){assert.equal(JSON.stringify(clip.frames[i].pose),saved[i].pose);assert.equal(JSON.stringify(clip.frames[i].body.map(m=>m.position)),saved[i].position);assert.deepEqual(clip.frames[i].body.filter(m=>m.poseRig).map(m=>m.boneMatrices),saved[i].bones,'Reconstruction never mutates captured skin');}
}
const clip=demonstration('forehand',spec),a=clip.frames[20],b=clip.frames[21],timeline=new ReplayTimeline(clip);
const contact=clip.frames.find(f=>f.contact);timeline.seek(contact.time-.001);assert(!timeline.frame.contact);assert(timeline.historyIndex()<clip.frames.indexOf(contact));timeline.seek(contact.time);assert.strictEqual(timeline.frame,contact);timeline.seek(contact.time+.001);assert(!timeline.frame.contact);
const gap=new ReplayTimeline({...clip,frames:[a,{...b,time:a.time+1}]});gap.seek(a.time+.5);assert.equal(gap.frame,null);
const changed={...b,body:b.body.slice(1)},switching=new ReplayTimeline({...clip,frames:[a,changed]});switching.seek((a.time+b.time)/2);assert(!switching.frame.interpolated,'Topology changes preserve actual observed geometry');
const turnA={...a,body:detachedBody(a.body),pose:{...a.pose,torsoYaw:Math.PI-.02}},turnB={...b,body:detachedBody(b.body),pose:{...b.pose,torsoYaw:-Math.PI+.02}};
for(const part of turnA.body)if(part.poseRig)part.rotation.y=Math.PI-.02;
for(const part of turnB.body)if(part.poseRig)part.rotation.y=-Math.PI+.02;
const turning=new ReplayTimeline({...clip,frames:[turnA,turnB]});turning.seek((a.time+b.time)/2);assert(Math.abs(turning.frame.pose.torsoYaw-Math.PI)<1e-9,'Yaw takes the short route across ±π');assert(Math.abs(turning.frame.body.find(m=>m.poseRig).rotation.y-Math.PI)<1e-9);
const old=timeline.frame;timeline.load({...clip,frames:[{...a,time:0},{...b,time:.033}]});assert.notStrictEqual(timeline.frame,old,'New sources invalidate reconstruction');
console.log(JSON.stringify({interpolatedSamples:samples,maxGPUJointRegistrationError:maxError}));
console.log('Smooth replay PASS: continuous shared pose, exact observed events, GPU registration for both avatars, source isolation, fractional mesh-cache refresh, shortest rotations, truthful gaps and event history.');
