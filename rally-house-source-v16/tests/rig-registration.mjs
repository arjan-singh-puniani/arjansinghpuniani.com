import assert from 'node:assert/strict';
import {Vec3,compose,transformPoint} from '../dist/rendering/Math3D.js';
import {demonstration} from '../dist/analysis/LabDemonstrations.js';
import {JOINT_KEYS,ReplayTimeline} from '../dist/analysis/MotionCapture.js';
import {PerformanceLab} from '../dist/analysis/PerformanceLab.js';

const point=(matrix,p)=>{const v=transformPoint(matrix,p);return new Vec3(v.x,v.y,v.z);};
const pairs={
 'char-arms-v1':[['shoulderL','elbowL'],['elbowL','handL'],['shoulderR','elbowR'],['elbowR','handR']],
 'char-pants-v1':[['hipL','kneeL'],['kneeL','footL'],['hipR','kneeR'],['kneeR','footR']]
};
// Inspect the real triangulated GPU surface, not a parallel test skeleton.
function ringCenter(part,segment,row){
 const {skin,boneMatrices}=part,half=row===12?11:row,indices=row===12?[1,4,5]:[0,2,3],seen=new Map();
 for(let j=0;j<20;j++)for(const k of indices){
  const i=segment*1440+half*120+j*6+k,rest=new Vec3(...skin.positions.slice(i*3,i*3+3)),key=[rest.x,rest.y,rest.z].join(',');
  if(seen.has(key))continue;
  const deformed=new Vec3();
  for(let n=0;n<4;n++){const w=skin.boneWeights[i*4+n];if(w)deformed.add(point(boneMatrices.slice(skin.boneIndices[i*4+n]*16,skin.boneIndices[i*4+n]*16+16),rest).scale(w));}
  seen.set(key,point(compose(part.position,part.rotation),deformed));
 }
 assert.equal(seen.size,20,'Complete evenly sampled closed cross-section');
 return [...seen.values()].reduce((sum,p)=>sum.add(p),new Vec3()).scale(1/seen.size);
}
let jointError=0,centreError=0,samples=0,overlaySamples=0;
for(const presentation of [undefined,'feminine'])for(const kind of ['gait','forehand','serve']){
 const clip=demonstration(kind,{id:'player',name:'Player',role:'member',shirt:'#888888',skin:'#c99977',hair:'#333333',playStyle:'test',goal:'test',presentation});
 for(const f of clip.frames){
  const t=new ReplayTimeline(clip);t.seek(f.time);
  const lab={active:true,timeline:t,contactLens:true,separateRig:false,renderKey:'',cached:[],rigOffset:PerformanceLab.prototype.rigOffset};
  const meshes=PerformanceLab.prototype.meshes.call(lab,false);
  assert.deepEqual(meshes.slice(0,f.body.length),f.body,'Analysis preserves every captured surface and its opacity');
  const nodes=meshes.filter(m=>m.overlay&&m.kind==='sphere');assert.equal(nodes.length,JOINT_KEYS.length);
  for(let j=0;j<nodes.length;j++)assert.deepEqual(nodes[j].position,f.pose[JOINT_KEYS[j]],'Annotation sits at the actual captured joint centre');
  overlaySamples++;
  if(clip.frames.indexOf(f)%10!==0&&!f.contact)continue;
  samples++;
  for(const part of f.body.filter(m=>pairs[m.skin?.id]))for(let s=0;s<4;s++)for(let row=0;row<=12;row++){
   const [a,b]=pairs[part.skin.id][s],error=Vec3.sub(ringCenter(part,s,row),Vec3.lerp(f.pose[a],f.pose[b],row/12)).len();
   if(row===0||row===12)jointError=Math.max(jointError,error);
   centreError=Math.max(centreError,error);
  }
 }
}
assert(jointError<1e-5,`Visible elbow/knee/ankle/shoulder rings align with their rig: ${jointError}`);
assert(centreError<.045,`Bounded limb-centre deformation throughout motion: ${centreError}`);
console.log(JSON.stringify({surfaceSamples:samples,overlaySamples,maxJointRegistrationError:jointError,maxLimbCentreError:centreError}));
console.log('Rig registration PASS: actual GPU joint-ring centres, bounded limb deformation and every default replay annotation registered to an unchanged opaque avatar.');
