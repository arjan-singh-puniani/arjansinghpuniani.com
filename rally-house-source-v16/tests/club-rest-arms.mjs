import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {memberData} from '../dist/content/content.js';
import {Vec3,transformPoint,rigidFrame} from '../dist/rendering/Math3D.js';
import {BONE} from '../dist/animation/CharacterSkin.js';
import {Navigation} from '../dist/world/Navigation.js';
import {loadAuthoredAthlete,authoredArmLengths,ATHLETE_REST_HAND} from '../dist/animation/AuthoredAthlete.js';
globalThis.fetch=async u=>new Response(fs.readFileSync(new URL(u)));globalThis.Image=class{async decode(){}};await loadAuthoredAthlete();
const lengths=authoredArmLengths(),baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/club-rest-baseline.json',import.meta.url),'utf8'));
function vertices(mesh,indices){
 const g=mesh.skin,pose=mesh.rig.pose,right=Vec3.sub(pose.thighR,pose.thighL);right.y=0;right.normalize();const forward=Vec3.cross(right,new Vec3(0,1,0));
 return (indices??Array.from({length:g.positions.length/3},(_,v)=>v)).map(v=>{
  const point=new Vec3(...g.positions.subarray(v*3,v*3+3)),out=new Vec3();for(let channel=0;channel<(g.morphs?.length??0);channel++){const weight=channel===4?(mesh.handGrip?.[point.x<0?0:1]??0):(mesh.expression?.[channel]??0);if(weight)point.add(new Vec3(...g.morphs[channel].subarray(v*3,v*3+3)).scale(weight));}
  for(let j=0;j<4;j++){const w=g.boneWeights[v*4+j];if(w){const p=transformPoint(mesh.boneMatrices.subarray(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),point);out.add(new Vec3(p.x,p.y,p.z).scale(w));}}
  if(mesh.skirt){
   assert.equal(mesh.expression[0]+mesh.expression[1],0,'This fixture checks standing cloth');
   // Same standing capsule/ellipsoid safety bounds as the rendered garment.
   for(let pass=0;pass<20;pass++){
    for(const side of ['L','R']){const hip=pose['thigh'+side],axis=Vec3.sub(pose['shin'+side],hip),t=Math.max(0,Math.min(1,Vec3.dot(Vec3.sub(out,hip),axis)/axis.len()**2)),centre=hip.clone().add(axis.scale(t)),d=Vec3.sub(out,centre),radius=.18+(.145-.18)*t;if(d.len()<radius){const p=centre.add(d.normalize().scale(radius));out.set(p.x,p.y,p.z);}}
    const d=Vec3.sub(out,pose.pelvis),x=Vec3.dot(d,right),z=Vec3.dot(d,forward),rz=z<0?.235:.27,radial=new Vec3(x/.29,d.y/.32,z/rz),distance=radial.len();if(distance<1){radial.scale(1/distance);const p=pose.pelvis.clone().add(right.clone().scale(radial.x*.29)).add(new Vec3(0,radial.y*.32,0)).add(forward.clone().scale(radial.z*rz));out.set(p.x,p.y,p.z);}
   }
  }return out;
 });
}
function bodySurface(meshes){
 const triangles=[],armBones=[5,6,7,8,9,10,17,18];
 for(const mesh of meshes.filter(m=>m.rig&&['humanSkin','performanceKnit'].includes(m.material))){const surface=vertices(mesh),g=mesh.skin;
  for(let i=0;i<surface.length;i+=3){if(!mesh.skirt&&[0,1,2].some(k=>[0,1,2,3].reduce((sum,j)=>sum+(armBones.includes(g.boneIndices[(i+k)*4+j])?g.boneWeights[(i+k)*4+j]:0),0)>.05))continue;const p=surface.slice(i,i+3);triangles.push({p,minY:Math.min(...p.map(v=>v.y)),maxY:Math.max(...p.map(v=>v.y)),minZ:Math.min(...p.map(v=>v.z)),maxZ:Math.max(...p.map(v=>v.z))});}
 }
 const bins=new Map();
 for(const face of triangles)for(let y=Math.floor(face.minY/.02);y<=Math.floor(face.maxY/.02);y++)for(let z=Math.floor(face.minZ/.02);z<=Math.floor(face.maxZ/.02);z++){const key=y+':'+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(face);}
 return bins;
}
function boundsAt(field,point){
 const hits=[];
 for(const {p:[a,b,c],minY,maxY,minZ,maxZ} of field.get(Math.floor(point.y/.02)+':'+Math.floor(point.z/.02))??[]){if(point.y<minY||point.y>maxY||point.z<minZ||point.z>maxZ)continue;const det=(b.z-c.z)*(a.y-c.y)+(c.y-b.y)*(a.z-c.z);if(Math.abs(det)<1e-12)continue;const u=((b.z-c.z)*(point.y-c.y)+(c.y-b.y)*(point.z-c.z))/det,w=((c.z-a.z)*(point.y-c.y)+(a.y-c.y)*(point.z-c.z))/det,t=1-u-w;if(u>=0&&w>=0&&t>=0)hits.push(u*a.x+w*b.x+t*c.x);}
 return hits;
}
function handSkirtDepth(meshes,field=bodySurface(meshes)){
 const skin=meshes.find(m=>m.material==='humanSkin'&&m.rig),g=skin.skin,indices=[],sides=[];
 for(let v=0;v<g.positions.length/3;v+=3)for(const side of ['L','R'])if([0,1,2,3].some(j=>g.boneIndices[v*4+j]===BONE['hand'+side]&&g.boneWeights[v*4+j]>.95)){indices.push(v);sides.push(side);}
 const points=vertices(skin,indices);let maxDepth=0,samples=0,worst=null;
 for(let i=0;i<points.length;i++){
  const point=points[i],side=sides[i],hits=boundsAt(field,point);
  if(hits.length>1){const depth=side==='R'?Math.max(...hits)-point.x:point.x-Math.min(...hits);if(depth>maxDepth){maxDepth=depth;worst={side,point,range:[Math.min(...hits),Math.max(...hits)]};}samples++;}
 }return {maxDepth,samples,worst};
}
let checks=0,maxForearmError=0,minElbowDrop=Infinity,maxHandSkirtDepth=0,handSkirtSamples=0;
for(const spec of [playerSpec('taylor'),...memberData].filter(s=>s.presentation==='feminine'))for(const hz of [30,60,120]){
 const c=new Character(spec,new Vec3(1,0,5),new Navigation([]),{});c.racketStowed=true;c.yaw=c.targetYaw=Math.PI;
 for(let i=0;i<hz*2;i++)c.update(1/hz);
 const p=c.analysisPose();
 for(const side of ['L','R']){
  const error=Math.abs(Vec3.sub(p['wrist'+side],p['elbow'+side]).len()-lengths.wristForearm),drop=p['shoulder'+side].y-p['elbow'+side].y;
  maxForearmError=Math.max(maxForearmError,error);minElbowDrop=Math.min(minElbowDrop,drop);
  assert(error<.003,'Rest must solve the native forearm to the wrist, not to the palm');
  assert(drop>.12,`${spec.id}/${hz}/${side}: resting elbow drop ${drop} must descend below the shoulder`);
 }
 const meshes=c.meshes();assert(meshes.filter(m=>m.skin).every(m=>m.boneMatrices.every(Number.isFinite)));
 const cloth=handSkirtDepth(meshes);maxHandSkirtDepth=Math.max(maxHandSkirtDepth,cloth.maxDepth);handSkirtSamples+=cloth.samples;assert(cloth.maxDepth<.004,`${spec.id}/${hz}: hand penetrates the rendered body/garments by ${JSON.stringify(cloth)} m`);checks++;
}
for(const state of ['idle','walk']){
 const c=new Character(playerSpec('taylor'),new Vec3(1,0,5),new Navigation([]),{});c.racketStowed=true;c.yaw=c.targetYaw=Math.PI;
 if(state==='walk')c.goTo(new Vec3(1.5,0,2));for(let i=0;i<(state==='walk'?78:180);i++)c.update(1/120);
 const p=c.analysisPose(),prior=baseline[state==='walk'?'walk':'rest'];
 if(state==='walk')assert.deepEqual(JSON.parse(JSON.stringify(p)),prior,'The accepted walking cycle is unchanged');
 else{
  for(const key of ['pelvisCenter','footL','footR'])assert.deepEqual(JSON.parse(JSON.stringify(p[key])),prior[key],'Hands-on-hips weight shift and stance stay unchanged: '+key);
  const waist=Vec3.lerp(p.pelvisCenter,Vec3.lerp(p.shoulderL,p.shoulderR,.5),.3);waist.y=p.pelvisCenter.y;
  for(const side of ['L','R']){
   const offset=transformPoint(rigidFrame(new Vec3(),p['handDirection'+side],p['handForward'+side]),lengths.palmOffsets[side]),palm=p['hand'+side].clone().add(new Vec3(-offset.x,offset.y,-offset.z)),right=new Vec3(Math.cos(p.torsoYaw),0,-Math.sin(p.torsoYaw)),forward=new Vec3(Math.sin(p.torsoYaw),0,Math.cos(p.torsoYaw)),goal=waist.clone().add(right.scale((side==='L'?-1:1)*ATHLETE_REST_HAND.palm.x)).add(forward.scale(ATHLETE_REST_HAND.palm.z)).add(new Vec3(0,ATHLETE_REST_HAND.palm.y,0));
   assert(Vec3.sub(palm,goal).len()<.001,'The measured palm surface, rather than the racket-grip marker, rests on the hip');
   assert(p['handDirection'+side].y<0&&p['handDirection'+side].z>.8,'Resting fingers follow the front of the hip');
  }
 }
}
assert(handSkirtSamples>100,'Inspect the real hand surfaces against standing rendered cloth');
console.log(JSON.stringify({checks,maxForearmError,minElbowDrop,maxHandSkirtDepth,handSkirtSamples}));
console.log('Club rest PASS: native wrist lengths, lowered elbows, hip contact, original weight shift and identical walking pose.');
