import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PonytailMotion} from '../dist/animation/PonytailMotion.js';
import {Vec3,transformPoint} from '../dist/rendering/Math3D.js';
import {BONE,BONE_COUNT,skinMatrices} from '../dist/animation/CharacterSkin.js';
import {loadAuthoredAthlete} from '../dist/animation/AuthoredAthlete.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {captureFrame,interpolateFrame} from '../dist/analysis/MotionCapture.js';

const endpoints=[];
for(const hz of [30,60,120]){
 const tail=new PonytailMotion();tail.update(1/hz,0,new Vec3(),0);
 for(let i=1;i<=hz;i++)tail.update(1/hz,.6*i/hz,new Vec3(),0);
 endpoints.push(tail.angle.clone());assert(tail.angle.y<-.03,'The tail lags an actual head turn');
 const paused=tail.angle.clone();tail.update(0,1,new Vec3(5,0,5),3);assert.deepEqual(tail.angle,paused,'Paused time cannot advance hair');
 for(let i=0;i<hz;i++)tail.update(1/hz,.6,new Vec3(),0);assert(tail.angle.len()<.0001,'The tail settles without a permanent sideways pose');
 const wrap=new PonytailMotion();wrap.update(1/hz,Math.PI-.01,new Vec3(),0);wrap.update(1/hz,-Math.PI+.01,new Vec3(),0);assert(wrap.angle.len()<.01,'Yaw wrap cannot whip the tail');
}
assert(Vec3.sub(endpoints[0],endpoints[2]).len()<1e-10,'The spring integration is independent of frame rate for the same turn');
for(const movement of [new Vec3(0,0,2),new Vec3(2,0,0)]){const tail=new PonytailMotion();for(let i=0;i<60;i++)tail.update(1/60,0,movement,0);assert(movement.z?tail.angle.x>0:tail.angle.z<0,'The tail trails translation instead of leaning into it');}

globalThis.fetch=async url=>new Response(fs.readFileSync(new URL(url)));globalThis.Image=class{async decode(){}};await loadAuthoredAthlete();
const c=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});c.racketStowed=true;for(let i=0;i<60;i++)c.update(1/60);
const skinPoint=(mesh,v,palette=mesh.boneMatrices)=>{const g=mesh.skin,p=new Vec3(...g.positions.subarray(v*3,v*3+3)),out=new Vec3();for(let j=0;j<4;j++){const w=g.boneWeights[v*4+j],b=g.boneIndices[v*4+j];if(w){const q=transformPoint(palette.subarray(b*16,(b+1)*16),p);out.add(new Vec3(q.x*w,q.y*w,q.z*w));}}return out;};
let core=0,strands=0,tipMovement=0,rootMovement=0;
const body=c.meshes().filter(m=>m.rig),head=body.find(m=>m.material==='humanSkin');
for(const mesh of body){
 assert.equal(mesh.boneMatrices.length,(BONE_COUNT+1)*16);assert.strictEqual(mesh.boneMatrices,head.boneMatrices,'Core and strands share one tail transform');
 const rig=mesh.rig,still=skinMatrices({...rig.pose,ponytail:new Vec3()},rig.bind),bent=skinMatrices({...rig.pose,ponytail:new Vec3(-.12,.2,.12)},rig.bind);
 assert.deepEqual(still.subarray(0,BONE_COUNT*16),bent.subarray(0,BONE_COUNT*16),'Tail motion cannot alter the existing body/head/hand/foot palette');
 for(let v=0;v<mesh.skin.positions.length/3;v+=3){
  const g=mesh.skin,weights=g.boneWeights.subarray(v*4,v*4+4);assert(Math.abs(weights.reduce((n,w)=>n+w,0)-1)<1e-6);
  const flexible=[0,1,2,3].some(j=>g.boneIndices[v*4+j]===BONE_COUNT&&weights[j]>0),movement=Vec3.sub(skinPoint(mesh,v,bent),skinPoint(mesh,v,still)).len();
  if(flexible){if(mesh.material==='humanSkin')core++;else strands++;tipMovement=Math.max(tipMovement,movement);}
  else{rootMovement=Math.max(rootMovement,movement);assert(movement<1e-6,'The face, scalp roots and body remain pinned to their original bones');}
 }
}
assert(core>100&&strands>100&&tipMovement>.03&&tipMovement<.16,'Both solid and textured tail surfaces bend within a small envelope');
let peak=0,peakActorTipMovement=0,maxReplayError=0,previous=null;
c.face(new Vec3(4,0,2));
for(let i=0;i<90;i++){
 c.update(1/60);const p=c.analysisPose();peak=Math.max(peak,p.ponytail.len());const saved=p.ponytail.clone();c.meshes();c.meshes();assert.deepEqual(c.analysisPose().ponytail,saved,'Rendering cannot integrate hair twice');
 const hair=c.meshes().find(m=>m.material==='groomedHair'),flat=skinMatrices({...hair.rig.pose,ponytail:new Vec3()},hair.rig.bind);let tip=0;for(let v=1;v<hair.skin.positions.length/3;v++)if(hair.skin.positions[v*3+1]<hair.skin.positions[tip*3+1])tip=v;peakActorTipMovement=Math.max(peakActorTipMovement,Vec3.sub(skinPoint(hair,tip),skinPoint(hair,tip,flat)).len());
 const frame=captureFrame(c,i/60,null);
 if(previous){const replay=interpolateFrame(previous,frame,(previous.time+frame.time)/2),part=replay.body.find(m=>m.material==='groomedHair'),angles=Vec3.lerp(previous.pose.ponytail,frame.pose.ponytail,.5);assert(Vec3.sub(replay.pose.ponytail,angles).len()<1e-10);const expected=skinMatrices({...part.rig.pose,ponytail:angles},part.rig.bind),error=Math.max(...part.boneMatrices.map((n,j)=>Math.abs(n-expected[j])));maxReplayError=Math.max(maxReplayError,error);assert(error<1e-6,'Replay reconstructs the captured tail, not a new simulation');}
 previous=frame;
}
assert(peak>.015,'The real Character update must drive the tail, not just the standalone spring');
assert(peakActorTipMovement>.01&&peakActorTipMovement<.12,'The actual actor turn produces visible but bounded tail travel');
console.log(JSON.stringify({coreSamples:core,strandSamples:strands,testAngleTipMovement:tipMovement,rootMovement,peakActorAngle:peak,peakActorTipMovement,maxReplayError}));
console.log('Ponytail PASS: time-owned lag/settling, pinned face and roots, shared core/strand weighting, unchanged body palette and continuous recorded replay.');
