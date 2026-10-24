import {memberData} from '../dist/content/content.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectCharacterAsset} from '../dist/animation/CharacterAssetIntake.js';
import {RACKET} from '../dist/animation/RacketGeometry.js';
import {skinMatrices,BONE} from '../dist/animation/CharacterSkin.js';
import {Vec3,transformPoint,compose} from '../dist/rendering/Math3D.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {World} from '../dist/world/World.js';
import {COURT} from '../dist/tennis/CourtGeometry.js';
const dir=new URL('../assets/characters/taylor/',import.meta.url),meta=JSON.parse(fs.readFileSync(new URL('provenance.json',dir))),bytes=fs.readFileSync(new URL('taylor.glb',dir)),hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(hash(bytes),meta.sha256);for(const [name,sha] of Object.entries(meta.textures))assert.equal(hash(fs.readFileSync(new URL(name,dir))),sha);
for(const [name,sha] of Object.entries(meta.authoringScripts))assert.equal(hash(fs.readFileSync(new URL('../tools/'+name,import.meta.url))),sha,'baked asset must match its authoring scripts');
for(const [name,sha] of Object.entries(meta.sourceHashes).filter(([name])=>name.startsWith('tools/')))assert.equal(hash(fs.readFileSync(new URL('../'+name,import.meta.url))),sha,'checked-in authoring source must match the bake');
const asset=inspectCharacterAsset(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),[],meta);
// Inspect the emitted jersey, including UV-split vertices: only collar, hem and two cuffs stay open.
{
 const jersey=asset.primitives.find(p=>p.materialSlot==='kit');assert(jersey.doubleSided,'thin jersey must render inside the collar and cuffs');
 const g=jersey.geometry,edges=new Map(),surface=new Map(),boundary=new Map();
 const connect=(graph,a,b)=>{if(!graph.has(a))graph.set(a,new Set());if(!graph.has(b))graph.set(b,new Set());graph.get(a).add(b);graph.get(b).add(a);};
 for(let i=0;i<g.positions.length/3;i+=3){
  if(![i,i+1,i+2].every(v=>g.uvs[v*2+1]>.5))continue;
  const vertices=[i,i+1,i+2].map(v=>[...g.positions.slice(v*3,v*3+3)].join(','));
  for(let j=0;j<3;j++){const a=vertices[j],b=vertices[(j+1)%3],edge=[a,b].sort().join(';');edges.set(edge,(edges.get(edge)??0)+1);connect(surface,a,b);}
 }
 for(const [edge,count] of edges){assert(count<=2,'jersey seam must remain manifold');if(count===1)connect(boundary,...edge.split(';'));}
 const components=graph=>{const seen=new Set();let count=0;for(const key of graph.keys()){if(seen.has(key))continue;count++;const pending=[key];while(pending.length){const v=pending.pop();if(seen.has(v))continue;seen.add(v);pending.push(...graph.get(v));}}return count;};
 assert.equal(components(surface),1,'torso and sleeves must form one continuous garment');assert.equal(components(boundary),4,'jersey must only open at the neck, hem and cuffs');assert([...boundary.values()].every(neighbors=>neighbors.size===2),'garment boundaries must close into loops');
 console.log('Continuous jersey PASS: one surface, four closed boundary loops, manifold seams.');
}
assert.deepEqual(asset.primitives.map(p=>p.materialSlot),['skin','kit','skirt','shoes','eyes','hair']);const body=asset.primitives[0].geometry;assert(asset.primitives.reduce((n,p)=>n+p.geometry.positions.length/9,0)<40000);
for(const p of asset.primitives){assert(p.geometry.uvs?.every(Number.isFinite));assert(p.albedo);if(['eyes','hair','brows','lashes'].includes(p.materialSlot))assert.equal(p.alphaCutoff,.35);if(['skin','eyes','hair','skirt'].includes(p.materialSlot)){assert.equal(p.geometry.morphs.length,5);assert(p.geometry.morphs.every(d=>d.length===p.geometry.positions.length&&d.every(Number.isFinite)));assert.equal(p.geometry.morphNormals.length,5);assert(p.geometry.morphNormals.every(d=>d.length===p.geometry.positions.length&&d.every(n=>Number.isFinite(n)&&Math.abs(n)<=2.01)));}}
// The refined jersey hem curves; its duplicated vertices must still share normals.
for(const slot of ['kit','skirt']){
 const g=asset.primitives.find(p=>p.materialSlot===slot).geometry,vertices=[];for(let i=0;i<g.positions.length/3;i++)if(slot==='skirt'||(g.uvs[i*2+1]>.55&&[0,1,2,3].reduce((sum,j)=>sum+([BONE.pelvis,BONE.spine,BONE.chest,BONE.neck].includes(g.boneIndices[i*4+j])?g.boneWeights[i*4+j]:0),0)>.95))vertices.push(i);
 const hem=Math.min(...vertices.map(i=>g.positions[i*3+1])),seen=new Map();let pairs=0;
 for(const i of vertices){if(Math.abs(g.positions[i*3+1]-hem)>(slot==='kit'?.035:1e-5))continue;const key=[...g.positions.slice(i*3,i*3+3)].map(n=>n.toFixed(6)).join(','),previous=seen.get(key);if(previous===undefined){seen.set(key,i);continue;}for(const normals of [g.normals,...(g.morphNormals??[])])assert(Math.hypot(...normals.slice(i*3,i*3+3).map((n,j)=>n-normals[previous*3+j]))<1e-5,'trimmed cloth hem must shade continuously, including its corrective');pairs++;}
 assert(pairs>50,'inspect actual shared hem vertices');
}
const rest=Object.fromEntries(Object.entries(meta.bind).map(([key,p])=>[key,new Vec3(...p)]));rest.headUp=new Vec3(0,1,0);
{
 let neckSamples=0;
 for(let v=0;v<body.positions.length/3;v+=3){
  const ids=[v,v+1,v+2];if(!ids.every(i=>body.uvs[i*2+1]>.5)||ids.some(i=>body.uvs[i*2]>.5&&body.uvs[i*2+1]>.8&&body.positions[i*3+2]<-.075))continue;
  assert(Math.max(...ids.map(i=>body.positions[i*3+1]))>=rest.neck.y+.03-1e-6,'covered head-neck triangles must not protrude through the jersey');neckSamples++;
 }
 assert(neckSamples>1000,'inspect the actual authored head surface');console.log(JSON.stringify({neckSamples}));
}
// Covered arms must not break through the sleeves; the visible sleeve retains the fitted silhouette.
const sleeves=asset.primitives.find(p=>p.materialSlot==='kit').geometry;
for(const bone of [BONE.foreArmTwistL,BONE.foreArmTwistR])assert(sleeves.boneIndices.filter((n,i)=>n===bone&&sleeves.boneWeights[i]>.1).length>100,'authored forearm twist weights must reach the visible sleeves');
for(const side of ['L','R']){
 const axis=Vec3.sub(rest['wrist'+side],rest['foreArm'+side]).normalize(),bones=['upperArm','foreArm','foreArmTwist','hand'].map(n=>BONE[n+side]);
 // Quads straddling the cuff retain skin at the wrist; inspect the fully covered sleeve interior.
 for(let v=0;v<body.positions.length/3;v+=3)assert(![v,v+1,v+2].every(i=>[0,1,2,3].reduce((sum,j)=>sum+(bones.includes(body.boneIndices[i*4+j])?body.boneWeights[i*4+j]:0),0)>.5&&Vec3.dot(Vec3.sub(new Vec3(...body.positions.slice(i*3,i*3+3)),rest['wrist'+side]),axis)<-.025),'covered arm triangles must not protrude through the jersey');
}
for(const [surface,armGeometry,padding] of [['sleeves',sleeves,.005]])for(const side of ['L','R'])for(const [start,end,bones,limit] of [['upperArm','foreArm',['upperArm'],.063],['foreArm','wrist',['foreArm','foreArmTwist'],.051]]){
 const a=rest[start+side],axis=Vec3.sub(rest[end+side],a),length=axis.len();axis.scale(1/length);const radii=[];
 for(let v=0;v<armGeometry.positions.length/3;v++){
  const p=Vec3.sub(new Vec3(...armGeometry.positions.slice(v*3,v*3+3)),a),along=Vec3.dot(p,axis)/length;let weight=0;
  for(let j=0;j<4;j++)if(bones.some(b=>BONE[b+side]===armGeometry.boneIndices[v*4+j]))weight+=armGeometry.boneWeights[v*4+j];
  if(weight>.95&&along>.2&&along<.7)radii.push(p.sub(axis.clone().scale(along*length)).len());
 }
 radii.sort((a,b)=>a-b);const radius95=radii[Math.floor(radii.length*.95)];assert(radii.length>60&&radius95>.03&&radius95<limit+padding,'exported arm cross-section must retain the slimmer athletic silhouette');console.log(JSON.stringify({surface,arm:start+side,radius95,samples:radii.length}));
}
const bind=skinMatrices(rest,rest);for(let bone=0;bone<Object.keys(BONE).length;bone++)for(let i=0;i<16;i++)assert(Math.abs(bind[bone*16+i]-(i%5===0?1:0))<1e-5,'rest pose changed');
{
 let maxShoulderRollStep=0,shoulderRollSamples=0;
 for(const side of ['L','R']){
  const bone=BONE['upperArm'+side],origin=rest['upperArm'+side],length=Vec3.sub(rest['foreArm'+side],origin).len(),point=Vec3.lerp(origin,rest['foreArm'+side],.4).add(new Vec3(0,0,.05));let previous;
  for(let y=-.008;y<=.008001;y+=.0005){
   const pose={...rest,['foreArm'+side]:origin.clone().add(new Vec3(0,y,Math.sqrt(length*length-y*y)))},palette=skinMatrices(pose,rest),p=transformPoint(palette.slice(bone*16,bone*16+16),point);
   if(previous)maxShoulderRollStep=Math.max(maxShoulderRollStep,Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z));previous=p;shoulderRollSamples++;
  }
  const opposite={...rest,['foreArm'+side]:origin.clone().sub(Vec3.sub(rest['foreArm'+side],origin))},palette=skinMatrices(opposite,rest);assert(palette.every(Number.isFinite),'opposite shoulder direction must remain finite');
  const end=transformPoint(palette.slice(bone*16,bone*16+16),rest['foreArm'+side]);assert(Math.hypot(end.x-opposite['foreArm'+side].x,end.y-opposite['foreArm'+side].y,end.z-opposite['foreArm'+side].z)<1e-6,'shoulder roll must retain the elbow endpoint');
 }
 assert(maxShoulderRollStep<.004,'the shoulder must not roll over when its elbow crosses the torso forward axis');console.log(JSON.stringify({shoulderRollSamples,maxShoulderRollStep}));
}
assert(rest.handL.x<0&&rest.handR.x>0&&rest.thighL.x<0&&rest.thighR.x>0);
// Native QA checks image decoding. This mock exercises the real verified loader and capture/replay path.
const previousFetch=globalThis.fetch,previousImage=globalThis.Image;
try{
 globalThis.fetch=async url=>{const path=new URL(url);assert.equal(path.protocol,'file:');assert(path.href.startsWith(dir.href));return new Response(fs.readFileSync(path));};
 globalThis.Image=class{naturalWidth=1024;naturalHeight=1024;async decode(){}};
 const {loadAuthoredAthlete,authoredAthleteMeshes,advanceAuthoredHands}=await import('../dist/animation/AuthoredAthlete.js');await loadAuthoredAthlete();
 const verifiedFetch=globalThis.fetch;
 for(const invalid of [{neck:[0,meta.bind.head[1]+.1,0]},{neck:[0,meta.bind.neck[1],1]},{spine:[0,meta.bind.chest[1]+.1,0]},{foreArmL:meta.bind.upperArmL},{wristL:meta.bind.foreArmL},{wristR:meta.bind.handR.map((n,i)=>n+(i===0?.4:0))}]){globalThis.fetch=async url=>new URL(url).pathname.endsWith('/provenance.json')?new Response(JSON.stringify({...meta,bind:{...meta.bind,...invalid}})):verifiedFetch(url);await assert.rejects(()=>loadAuthoredAthlete(),/registration|arm lengths/);}
 globalThis.fetch=verifiedFetch;
 const restNeckPose={...new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{}).analysisPose(),pelvisCenter:rest.pelvis.clone(),chest:rest.chest.clone(),head:rest.head.clone(),shoulderL:rest.upperArmL.clone(),shoulderR:rest.upperArmR.clone(),headYaw:0,torsoYaw:0,hipYaw:0};
 const restTorso=authoredAthleteMeshes(restNeckPose,new Vec3(),0,[{pitch:0,yaw:0},{pitch:0,yaw:0}],0)[0];let maxRestTorsoError=0;
 for(const bone of [BONE.pelvis,BONE.spine,BONE.chest,BONE.neck])for(let i=0;i<16;i++)maxRestTorsoError=Math.max(maxRestTorsoError,Math.abs(restTorso.boneMatrices[bone*16+i]-(i%5===0?1:0)));
 assert(maxRestTorsoError<1e-5,'matching authored chest/head landmarks must preserve the source torso');console.log(JSON.stringify({maxRestTorsoError,registeredNeck:restTorso.rig.pose.neck}));
const character=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});for(let i=0;i<240;i++)character.update(1/60);
const standing=character.analysisPose(),shoulderRatio=Vec3.sub(standing.shoulderL,standing.shoulderR).len()/Vec3.sub(rest.upperArmL,rest.upperArmR).len();
assert(shoulderRatio>.97&&shoulderRatio<.99,'the standing hero must retain the deliberately narrower shoulder span');console.log(JSON.stringify({shoulderRatio}));
const idleRig=character.meshes().find(m=>m.rig).rig.pose;
for(const side of ['L','R'])assert(Vec3.dot(Vec3.sub(idleRig['hand'+side],idleRig['foreArm'+side]).normalize(),idleRig['handDirection'+side])>.98,'resting hands must follow the forearms instead of folding down at the wrists');
let samples=0,maxGripGap=0,minSole=Infinity,minForearmVolume=Infinity;
for(const state of ['idle','sit','drink','ready','swingForehand','swingBackhand','serve']){
 character.trigger(state);for(let t=0;t<90;t++){character.update(1/120);if(t%15)continue;
  const observed=character.analysisPose();for(const side of ['L','R']){const ratio=Vec3.sub(observed[`shoulder${side}`],observed[`elbow${side}`]).len()/Vec3.sub(rest[`upperArm${side}`],rest[`foreArm${side}`]).len();assert(ratio>.999&&ratio<1.04,'the authored upper arm must retain its source length through poses');}
  if(!observed.shot)for(const side of ['L','R']){const ratio=Vec3.sub(observed[`hand${side}`],observed[`elbow${side}`]).len()/Vec3.sub(rest[`hand${side}`],rest[`foreArm${side}`]).len();assert(ratio>.999&&ratio<1.04,'non-stroke palm reach must retain its approved length');}
  const part=character.meshes().find(p=>'skin' in p&&p.rig),rig=part.rig.pose,matrices=part.boneMatrices;assert(matrices.every(Number.isFinite));
  for(const geometry of [body,sleeves])for(const side of ['L','R'])for(let v=0;v<geometry.positions.length/3;v+=3){
   const joints=[0,1,2,3].map(j=>geometry.boneIndices[v*4+j]),weights=[0,1,2,3].map(j=>geometry.boneWeights[v*4+j]);
   if(!joints.some((b,j)=>b===BONE['foreArmTwist'+side]&&weights[j]>.1)||joints.some((b,j)=>weights[j]>.001&&![BONE['foreArm'+side],BONE['foreArmTwist'+side],BONE['hand'+side]].includes(b)))continue;
   const axes=[0,4,8].map(offset=>{const out=new Vec3();for(let j=0;j<4;j++){if(!weights[j])continue;out.add(new Vec3(...matrices.slice(joints[j]*16+offset,joints[j]*16+offset+3)).normalize().scale(weights[j]));}return out;});
   const volume=Vec3.dot(Vec3.cross(axes[0],axes[1]),axes[2]);minForearmVolume=Math.min(minForearmVolume,volume);assert(volume>.15,`${state}/${t}/${side}: forearm skin weights collapsed during a palm turn (${volume})`);
  }
  for(const side of ['L','R']){const expected=rig['hand'+side],actual=transformPoint(matrices.slice(BONE['hand'+side]*16,BONE['hand'+side]*16+16),rest['hand'+side]);const gap=Math.hypot(actual.x-expected.x,actual.y-expected.y,actual.z-expected.z);maxGripGap=Math.max(maxGripGap,gap);assert(gap<1e-5,'authored palm lost the authoritative grip');}
  const shoes=asset.primitives.find(p=>p.materialSlot==='shoes').geometry;let low=Infinity;
  for(let v=0;v<shoes.positions.length/3;v+=3){let y=0;for(let j=0;j<4;j++){const weight=shoes.boneWeights[v*4+j];if(!weight)continue;const bone=shoes.boneIndices[v*4+j],point=transformPoint(matrices.slice(bone*16,bone*16+16),new Vec3(...shoes.positions.slice(v*3,v*3+3)));y+=point.y*weight;}low=Math.min(low,y);}
  minSole=Math.min(minSole,low);assert(low>-.005,'shoe penetrated the floor');samples++;
 }
}
// The grip is inside the palm; measuring the forearm to it hid a stretched sleeve.
{
 let checks=0,maxWristScale=0;
 for(const spec of [playerSpec('taylor'),...memberData.filter(s=>s.presentation==='feminine')])for(const hz of [30,60,120])for(const state of ['swingForehand','swingBackhand','serve','volley'])for(const height of (state==='serve'?[2.36]:[.64,1.02,1.50])){
  const actor=new Character(spec,new Vec3(),new Navigation([]),{});actor.matchCompetitor=true;actor.setAnimation('ready');for(let i=0;i<hz/2;i++)actor.update(1/hz);
  if(state!=='serve')actor.setIncomingContact(new Vec3(state==='swingBackhand'?-.6:.6,height,.9));actor.triggerShot(state,new Vec3(0,.09,5));
  for(let frame=0;frame<hz*.6;frame++){
   actor.update(1/hz);if(frame/hz<.20||actor.state!==state||frame%Math.max(1,Math.round(hz/30)))continue;
   const mesh=actor.meshes().find(m=>m.rig),rig=mesh.rig;
   for(const side of ['L','R']){
    const wrist=transformPoint(mesh.boneMatrices.subarray(BONE[`hand${side}`]*16,BONE[`hand${side}`]*16+16),rig.bind[`wrist${side}`]),length=Vec3.sub(new Vec3(wrist.x,wrist.y,wrist.z),rig.pose[`foreArm${side}`]).len(),expected=Vec3.sub(rig.bind[`wrist${side}`],rig.bind[`foreArm${side}`]).len(),scale=length/expected;
    const world=transformPoint(compose(mesh.position,mesh.rotation,mesh.scale),new Vec3(wrist.x,wrist.y,wrist.z));assert(Vec3.sub(new Vec3(world.x,world.y,world.z),actor.analysisPose()[`wrist${side}`]).len()<2e-6,'live wrist analysis must match the rendered hand');
    maxWristScale=Math.max(maxWristScale,scale);assert(scale>.99&&scale<1.04,`${spec.id}/${state}/${hz}/${height}/${side}: anatomical forearm stretches (${scale})`);checks++;
   }
  }
 }
 assert(checks>1000,'Inspect rendered anatomical wrists throughout loaded strokes');console.log(JSON.stringify({wristLengthChecks:checks,maxWristScale}));
}
for(const state of ['swingForehand','swingBackhand']){
 const actor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});actor.matchCompetitor=true;actor.setAnimation('ready');for(let i=0;i<60;i++)actor.update(1/120);
 actor.setIncomingContact(new Vec3(state==='swingBackhand'?-.6:.6,1.02,.9));actor.triggerShot(state,new Vec3(0,.09,5));for(let i=0;i<10;i++)actor.update(1/120);
 const p=actor.analysisPose();assert(state==='swingForehand'?p.shoulderR.z<p.shoulderL.z:p.shoulderR.z>p.shoulderL.z,'the hitting shoulder must load back on a forehand and forward on a backhand');
}
// Compare the emitted soles with the actual floor layers, including rug patterns and paint.
const floorWorld=new World(),floorParts=floorWorld.meshes.filter(m=>['box','roundBox'].includes(m.kind)&&m.position.y<.1&&m.position.y+m.scale.y/2<.15);
function floorAt(x,z){let top=0;for(const m of floorParts){const yaw=m.rotation?.y??0,dx=x-m.position.x,dz=z-m.position.z,lx=dx*Math.cos(yaw)-dz*Math.sin(yaw),lz=dx*Math.sin(yaw)+dz*Math.cos(yaw);if(Math.abs(lx)<=m.scale.x/2&&Math.abs(lz)<=m.scale.z/2)top=Math.max(top,m.position.y+m.scale.y/2);}return top;}
const floorSpots=[[COURT.centerX,5.5],[COURT.centerX,COURT.serviceDistance],[-8.8,-5],[-8.82,-3.35],[-9.05,2.7],[9.35,-1.05],[8.5,5.65],[-9.36,.8],[-9.6,6.9]];
const {memberData:floorMembers}=await import('../dist/content/content.js');let soleFloorChecks=0,maxFloorPenetration=0;
for(const spec of [playerSpec('taylor'),...floorMembers.filter(s=>s.presentation==='feminine')])for(const yaw of [0,Math.PI/2]){
 const actor=new Character(spec,new Vec3(),new Navigation([]),{});actor.racketStowed=true;actor.yaw=actor.targetYaw=yaw;for(let i=0;i<180;i++)actor.update(1/60);
 const shoe=actor.meshes().find(m=>m.skin?.id===asset.primitives.find(p=>p.materialSlot==='shoes').geometry.id);assert(shoe,'inspect the real rendered shoes');const g=shoe.skin,model=compose(shoe.position,shoe.rotation,new Vec3(1,1,1));
 for(let v=0;v<g.positions.length/3;v++){
  const p=new Vec3(...g.positions.slice(v*3,v*3+3)),deformed=new Vec3();for(let j=0;j<4;j++){const weight=g.boneWeights[v*4+j];if(weight){const bone=g.boneIndices[v*4+j],q=transformPoint(shoe.boneMatrices.slice(bone*16,bone*16+16),p);deformed.add(new Vec3(q.x,q.y,q.z).scale(weight));}}
  const q=transformPoint(model,deformed);for(const [x,z] of floorSpots){const depth=floorAt(x+q.x,z+q.z)-q.y;maxFloorPenetration=Math.max(maxFloorPenetration,depth);assert(depth<.005,`${spec.id} shoe buried in emitted floor at ${x},${z}: ${depth}`);soleFloorChecks++;}
 }
}
console.log(JSON.stringify({soleFloorChecks,maxFloorPenetration}));
let maxAuthoredContactError=0;
for(const stroke of ['swingForehand','swingBackhand','volley','serve'])for(const height of [.66,1.02,1.38])for(const x of [-.76,.54,.88]){
 const actor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});actor.setAnimation('ready');actor.update(.3);if(stroke!=='serve')actor.setIncomingContact(new Vec3(x,height,.90));actor.triggerShot(stroke,new Vec3(0,.09,-5));
 const time=actor.shotContactTime(stroke);for(let i=0;i<60;i++)actor.update(time/60);const error=Vec3.sub(actor.analysisPose().racketCenter,actor.debugKinematics().contactTarget).len();maxAuthoredContactError=Math.max(maxAuthoredContactError,error);assert(error<1e-6,'authored arm proportions lost the world-space racket contact');
}
console.log(JSON.stringify({maxAuthoredContactError}));
console.log(JSON.stringify({assetTriangles:asset.primitives.reduce((n,p)=>n+p.geometry.positions.length/9,0),samples,maxGripGap,minSole,minForearmVolume}));
 const {captureFrame,interpolateFrame,jointTriplet}=await import('../dist/analysis/MotionCapture.js');
 const c=new Character(playerSpec('taylor'),new Vec3(2,0,-1),new Navigation([]),{});c.trigger('swingForehand');c.update(.12);const a=captureFrame(c,0,null);c.update(1/30);const b=captureFrame(c,1/30,null),middle=interpolateFrame(a,b,1/60),parts=middle.body.filter(p=>'skin' in p&&p.poseRig);
 assert.equal(parts.find(p=>p.material==='groomedHair').color,'#65584f','replay must retain the strand tint that matches the brunette scalp');assert.equal(parts.find(p=>p.material==='humanSkin').color,'#ffffff','hair tint must not affect face or body');assert.equal(parts.length,6);assert(parts.every(p=>p.rig&&p.boneMatrices===parts[0].boneMatrices));assert.equal(parts.filter(p=>p.skirt).length,1,'replay must retain the garment clearance flag');
 for(const part of parts)for(const side of ['L','R']){const local=transformPoint(part.boneMatrices.subarray(BONE[`hand${side}`]*16,BONE[`hand${side}`]*16+16),part.rig.bind[`wrist${side}`]),world=transformPoint(compose(part.position,part.rotation,part.scale),new Vec3(local.x,local.y,local.z));assert(Vec3.sub(new Vec3(world.x,world.y,world.z),middle.pose[`wrist${side}`]).len()<2e-6,'replayed wrist analysis must match the rendered hand');}
 assert.strictEqual(jointTriplet(middle.pose,'elbow')[2],middle.pose.wristR,'elbow flexion must end at the anatomical wrist');
 for(const part of parts){const rig=part.rig.pose;const neckA=a.body.find(p=>p.skin?.id===part.skin.id).rig.pose.neck,neckB=b.body.find(p=>p.skin?.id===part.skin.id).rig.pose.neck;assert(Vec3.sub(rig.neck,Vec3.lerp(neckA,neckB,.5)).len()<1e-8,'replay lost the observed neck registration');const spineA=a.body.find(p=>p.skin?.id===part.skin.id).rig.pose.spine,spineB=b.body.find(p=>p.skin?.id===part.skin.id).rig.pose.spine;assert(Vec3.sub(rig.spine,Vec3.lerp(spineA,spineB,.5)).len()<1e-8,'replay lost the observed spine registration');for(const side of ['L','R']){const actual=transformPoint(part.boneMatrices.slice(BONE['hand'+side]*16,BONE['hand'+side]*16+16),part.rig.bind['hand'+side]),expected=rig['hand'+side];assert(Math.hypot(actual.x-expected.x,actual.y-expected.y,actual.z-expected.z)<1e-5,'replay used the wrong body bind');}assert.deepEqual(part.expression,a.body.find(p=>p.skin?.id===part.skin.id).expression.map((v,i)=>(v+b.body.find(p=>p.skin?.id===part.skin.id).expression[i])/2));}
 c.racketStowed=false;c.matchCompetitor=true;c.trigger('ready');for(let i=0;i<90;i++)c.update(1/120);
 const skin=c.meshes().find(p=>'skin' in p&&p.rig),palette=skin.boneMatrices;
 for(const side of ['L','R']){const wrist=rest['wrist'+side],forearm=transformPoint(palette.slice(BONE['foreArm'+side]*16,BONE['foreArm'+side]*16+16),wrist),hand=transformPoint(palette.slice(BONE['hand'+side]*16,BONE['hand'+side]*16+16),wrist);assert(Math.hypot(forearm.x-hand.x,forearm.y-hand.y,forearm.z-hand.z)<1e-5,'the forearm must end at the anatomical wrist');const twist=transformPoint(palette.slice(BONE['foreArmTwist'+side]*16,BONE['foreArmTwist'+side]*16+16),wrist);assert(Math.hypot(twist.x-hand.x,twist.y-hand.y,twist.z-hand.z)<1e-5,'distal twist and palm must share the wrist endpoint');}
 const gripPose=skin.rig.pose,axis=Vec3.sub(c.analysisPose().racketHandleTop,c.analysisPose().racketGrip).normalize(),g=skin.skin;let count=0,openRadius=0,closedRadius=0;
 for(let v=0;v<g.positions.length/3;v+=3){if(![0,1,2,3].some(j=>g.boneIndices[v*4+j]===BONE.handR&&g.boneWeights[v*4+j]>.95))continue;const position=new Vec3(...g.positions.slice(v*3,v*3+3));if(Vec3.sub(position,rest.handR).len()<.085)continue;
  const radius=closed=>{const point=position.clone();if(closed)point.add(new Vec3(...g.morphs[4].slice(v*3,v*3+3)));const transformed=new Vec3();for(let j=0;j<4;j++){const weight=g.boneWeights[v*4+j];if(!weight)continue;const p=transformPoint(palette.slice(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),point);transformed.add(new Vec3(p.x*weight,p.y*weight,p.z*weight));}const delta=Vec3.sub(transformed,gripPose.handR);return delta.sub(axis.clone().scale(Vec3.dot(delta,axis))).len();};
  openRadius+=radius(false);closedRadius+=radius(true);count++;
 }
 assert(count>20);openRadius/=count;closedRadius/=count;assert(closedRadius<openRadius*.75&&closedRadius<.065,'fingers must close around the handle');const wristDeflection=Math.acos(Math.max(-1,Math.min(1,Vec3.dot(Vec3.sub(gripPose.handR,gripPose.foreArmR).normalize(),gripPose.handDirectionR))));assert(wristDeflection<.8,'ready grip must not buckle the wrist');console.log(JSON.stringify({fingerSamples:count,openRadius,closedRadius,wristDeflection}));
 // Check torso surfaces by body weights; arm caps share the continuous jersey mapping.
 const garmentArmBones=[BONE.upperArmL,BONE.foreArmL,BONE.foreArmTwistL,BONE.handL,BONE.upperArmR,BONE.foreArmR,BONE.foreArmTwistR,BONE.handR];
 let readyArmChecks=0,strokeArmChecks=0;
 for(const hz of [30,60,120])for(const state of ['ready','shuffle','swingForehand','swingBackhand','serve']){
  const actor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{}),shot=['swingForehand','swingBackhand','serve'].includes(state);actor.racketStowed=false;actor.matchCompetitor=true;
  if(shot){actor.setAnimation('ready');for(let i=0;i<hz*.3;i++)actor.update(1/hz);if(state!=='serve')actor.setIncomingContact(new Vec3(state==='swingBackhand'?-.6:.6,1.02,.9));actor.triggerShot(state,new Vec3(0,.09,5));}else actor.trigger(state);
  const recover=shot?Math.ceil(actor.shotDuration(state)*hz):Infinity,end=shot?recover+Math.ceil(hz*.4):hz*1.5;
  for(let frame=0;frame<end;frame++){
   if(frame===recover){actor.clearShotIntent();actor.trigger('ready');}
   actor.update(1/hz);if(frame%Math.ceil(hz/(shot?20:10)))continue;
   const kit=actor.meshes().find(m=>m.rig&&m.material==='performanceKnit'&&!m.skirt),g=kit.skin,points=[],pose=kit.rig.pose;
   for(let v=0;v<g.positions.length/3;v++){const p=new Vec3(...g.positions.slice(v*3,v*3+3)),out=new Vec3();for(let j=0;j<4;j++){const w=g.boneWeights[v*4+j];if(!w)continue;const q=transformPoint(kit.boneMatrices.slice(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),p);out.add(new Vec3(q.x,q.y,q.z).scale(w));}points.push(out);}
   for(const side of ['L','R'])for(const [start,end] of [['upperArm','foreArm'],['foreArm','hand']])for(const t of [.4,.6,.8]){
    const point=Vec3.lerp(pose[start+side],pose[end+side],t),hits=[];
    for(let i=0;i<points.length;i+=3){if([i,i+1,i+2].some(v=>[0,1,2,3].reduce((sum,j)=>sum+(garmentArmBones.includes(g.boneIndices[v*4+j])?g.boneWeights[v*4+j]:0),0)>.05))continue;const[a,b,c]=points.slice(i,i+3),det=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(det)<1e-12)continue;const u=((b.y-c.y)*(point.x-c.x)+(c.x-b.x)*(point.y-c.y))/det,v=((c.y-a.y)*(point.x-c.x)+(a.x-c.x)*(point.y-c.y))/det,w=1-u-v;if(u>=0&&v>=0&&w>=0)hits.push(u*a.z+v*b.z+w*c.z);}
    assert(!(hits.length>1&&point.z>Math.min(...hits)+.015&&point.z<Math.max(...hits)-.015),`${state}/${hz}/${frame}/${side}: arm passes through the fitted top`);if(shot)strokeArmChecks++;else readyArmChecks++;
   }
  }
 }
 console.log(JSON.stringify({readyArmChecks,strokeArmChecks}));
 let palmChecks=0,maxPalmGripShift=0;
 for(const side of ['L','R'])for(let v=0;v<body.positions.length/3;v++){
  const d=Vec3.sub(new Vec3(...body.positions.slice(v*3,v*3+3)),rest['wrist'+side]),along=Vec3.dot(d,rest['handDirection'+side]),radial=d.sub(rest['handDirection'+side].clone().scale(along)).len();
  if(along<.01||along>.035||radial>.025)continue;
  const shift=Math.hypot(...body.morphs[4].slice(v*3,v*3+3));maxPalmGripShift=Math.max(maxPalmGripShift,shift);assert(shift<.005,'closing the fingers must not fold the palm through the wrist');palmChecks++;
 }
 assert(palmChecks>20);console.log(JSON.stringify({palmChecks,maxPalmGripShift}));
 const readyPose=c.analysisPose(),rotation=compose(new Vec3(),readyPose.racketRot),horizontal=transformPoint(rotation,new Vec3(RACKET.headHalfWidth,0,0)),vertical=transformPoint(rotation,new Vec3(0,RACKET.headHalfHeight,0));let minFaceClearance=Infinity;
 for(const azimuth of [-.6,-.35,0,.35,.6])for(const x of [-.09,0,.09])for(const y of [-.10,0,.10]){
  const screen=v=>v.x*Math.cos(azimuth)-v.z*Math.sin(azimuth),point=Vec3.sub(readyPose.head,readyPose.racketCenter).add(new Vec3(x,y,0)),a=screen(horizontal),b=screen(vertical),det=a*vertical.y-b*horizontal.y,u=(screen(point)*vertical.y-b*point.y)/det,v=(a*point.y-screen(point)*horizontal.y)/det,d=u*u+v*v;minFaceClearance=Math.min(minFaceClearance,d);assert(d>1.05,'ready racket obscures the face in a front or three-quarter view');
 }
 console.log(JSON.stringify({minFaceClearance}));
 const parallel={...readyPose,handRestWeight:0,handLapWeight:0,handRacketWeight:1,handGripR:1,racketHandleTop:readyPose.racketGrip.clone().add(Vec3.sub(readyPose.handR,readyPose.elbowR).normalize().scale(.4))},parallelHands=advanceAuthoredHands(parallel,new Vec3(),0,undefined,1/60);
 for(const axis of Object.values(parallelHands))assert([axis.x,axis.y,axis.z].every(Number.isFinite)&&Math.abs(axis.len()-1)<1e-6,'a forearm parallel to the handle must retain a valid grip frame');
 let fixedMouth=0,movingMouth=0;
 for(let v=0;v<body.positions.length/3;v++){const[x,y,z]=body.positions.slice(v*3,v*3+3);if(y<2.02||y>2.15||Math.abs(x)>.065||z<.16)continue;const delta=Math.hypot(...body.morphs[1].slice(v*3,v*3+3));if(delta<1e-4)fixedMouth++;if(delta>.002&&body.morphs[1][v*3+1]<0)movingMouth++;}
 assert(fixedMouth>20&&movingMouth>20,'authored mouth must retain a fixed upper region and a moving lower jaw');
 assert(meta.headSource.license==='MIT'&&meta.author.includes('Microsoft Rocketbox'));assert(fs.readFileSync(new URL('../ROCKETBOX-LICENSE.txt',dir),'utf8').includes('Copyright (c) 2020 Microsoft'));
 const origin=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{}),translated=new Character(playerSpec('taylor'),new Vec3(3,0,-2),new Navigation([]),{});
 for(const actor of [origin,translated]){actor.trigger('ready');for(let i=0;i<180;i++)actor.update(1/120);}
 const localBones=origin.meshes().find(p=>p.rig).boneMatrices,translatedBones=translated.meshes().find(p=>p.rig).boneMatrices;assert(localBones.every((n,i)=>Math.abs(n-translatedBones[i])<1e-5),'authored hand metadata must not overwrite root-local joints');
 const skirt=asset.primitives.find(p=>p.materialSlot==='skirt').geometry;assert(skirt.positions.length>1000&&skirt.boneIndices.every((b,i)=>skirt.boneWeights[i]<.001||[BONE.pelvis,BONE.spine,BONE.chest,BONE.thighL,BONE.thighR].includes(b)),'skirt must span the hips without shin weights');
 const skirtHem=Math.min(...skirt.positions.filter((_,i)=>i%3===1)),shortsHem=Math.min(...asset.primitives.find(p=>p.materialSlot==='kit').geometry.positions.filter((_,i)=>i%3===1));
 assert(skirtHem>rest.shinL.y+(rest.thighL.y-rest.shinL.y)*.70,'tennis skirt hem must stay above the lower thigh');assert(shortsHem>skirtHem+.02,'opaque sports shorts must finish inside the skirt');console.log(JSON.stringify({skirtHem,shortsHem}));
 let upperPanelSamples=0,upperPanelHipWeight=0;for(let v=0;v<skirt.positions.length/3;v++){const[x,y,z]=skirt.positions.slice(v*3,v*3+3);if(Math.abs(x)>.13||y<1.25||y>1.38||z<.12)continue;upperPanelSamples++;for(let j=0;j<4;j++)if(skirt.boneIndices[v*4+j]<=BONE.chest)upperPanelHipWeight+=skirt.boneWeights[v*4+j];}
 assert(upperPanelSamples>100&&upperPanelHipWeight/upperPanelSamples>.8,'upper skirt must follow the hips so the shorts cannot poke through during a ready stance');
 let maxSeatedGazeTranslation=0;
 for(const yaw of [0,Math.PI/2,Math.PI]){const actors=[-1,1].map(side=>{const actor=new Character(playerSpec('taylor'),new Vec3(3,0,-2),new Navigation([]),{});actor.seatDepth=1.35;actor.face(new Vec3(3+Math.sin(yaw),0,-2+Math.cos(yaw)));actor.setLook(new Vec3(3+Math.sin(yaw+side*.8)*4,1.8,-2+Math.cos(yaw+side*.8)*4));actor.trigger('sit');for(let i=0;i<240;i++)actor.update(1/120);return actor;});const gap=Vec3.sub(actors[0].analysisPose().head,actors[1].analysisPose().head).len();maxSeatedGazeTranslation=Math.max(maxSeatedGazeTranslation,gap);assert(gap<.025,'turning the seated head moved it away from the neck');}
 console.log(JSON.stringify({maxSeatedGazeTranslation}));
 let maxDrapeStep=0;
 for(const hz of [30,60,120])for(const yaw of [0,Math.PI/2,Math.PI]){
  const actor=new Character(playerSpec('taylor'),new Vec3(3,0,-2),new Navigation([]),{});actor.seatDepth=.8;actor.face(new Vec3(3+Math.sin(yaw),0,-2+Math.cos(yaw)));let previous=0;
  for(const state of ['idle','sit','idle']){actor.trigger(state);for(let i=0;i<hz*2;i++){actor.update(1/hz);const amount=actor.meshes().find(m=>m.skirt).expression[0];assert(amount>=0&&amount<=1);maxDrapeStep=Math.max(maxDrapeStep,Math.abs(amount-previous));previous=amount;}assert(Math.abs(previous-(state==='sit'?1:0))<1e-5,'garment corrective must follow the local seated pose at every heading');}
 }
 for(const state of ['idle','ready','swingForehand','swingBackhand','serve']){const actor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});actor.trigger(state);for(let i=0;i<180;i++){actor.update(1/120);assert.equal(actor.meshes().find(m=>m.skirt).expression[0],0,'seated drape changed a tennis or standing pose');}}
 assert(maxDrapeStep<.3,'seated garment corrective snapped during a transition');
 const seated=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});seated.seatDepth=.8;seated.trigger('sit');for(let i=0;i<18;i++)seated.update(1/120);const seatA=captureFrame(seated,0,null),frozenDrape=seatA.body.find(m=>m.skirt).expression[0];for(let i=0;i<6;i++)seated.update(1/120);const seatB=captureFrame(seated,.05,null),seatMiddle=interpolateFrame(seatA,seatB,.025);assert.equal(seatA.body.find(m=>m.skirt).expression[0],frozenDrape);assert(Math.abs(seatMiddle.pose.seatedWeight-(seatA.pose.seatedWeight+seatB.pose.seatedWeight)/2)<1e-12);assert(Math.abs(seatMiddle.body.find(m=>m.skirt).expression[0]-(frozenDrape+seatB.body.find(m=>m.skirt).expression[0])/2)<1e-12);
 assert(skirt.morphs.slice(0,2).every(d=>d.some(n=>Math.abs(n)>.1))&&skirt.morphs.slice(2).every(d=>d.every(n=>n===0)),'garment must retain its seated/crouched correctives and no facial channels');
 const crouched=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});crouched.matchCompetitor=true;crouched.setAnimation('ready');crouched.update(.3);crouched.setIncomingContact(new Vec3(-.6,1.02,.9));crouched.triggerShot('swingBackhand',new Vec3(0,.09,5));for(let i=0;i<10;i++)crouched.update(1/60);
 const lowBackhand=crouched.analysisPose();assert(lowBackhand.elbowL.y<lowBackhand.shoulderL.y+.04,'a low backhand must not fold the outside elbow above the shoulder');
 assert(crouched.meshes().find(m=>m.skirt).expression[1]>.99,'the lowered stroke pelvis must drive the crouch correction');const crouchA=captureFrame(crouched,0,null);crouched.update(1/60);const crouchB=captureFrame(crouched,1/60,null),crouchMiddle=interpolateFrame(crouchA,crouchB,1/120);assert.equal(crouchMiddle.body.find(m=>m.skirt).expression[1],(crouchA.body.find(m=>m.skirt).expression[1]+crouchB.body.find(m=>m.skirt).expression[1])/2,'capture/replay must retain the crouch correction');
 console.log(JSON.stringify({maxDrapeStep,seatedReplay:true,crouchReplay:true}));
 const fittedKit=asset.primitives.find(p=>p.materialSlot==='kit').geometry;let torsoWidth=0,topVertices=0,sleeveVertices=0;
 for(let i=0;i<fittedKit.positions.length/3;i++)if(fittedKit.uvs[i*2+1]>.55){
  const y=fittedKit.positions[i*3+1],joints=[0,1,2,3].map(j=>fittedKit.boneIndices[i*4+j]);topVertices++;assert(fittedKit.uvs[i*2+1]<1);
  if(joints.some((b,j)=>[BONE.foreArmL,BONE.foreArmTwistL,BONE.foreArmR,BONE.foreArmTwistR].includes(b)&&fittedKit.boneWeights[i*4+j]>.5))sleeveVertices++;
  if(y>1.7&&joints.every((b,j)=>fittedKit.boneWeights[i*4+j]<.01||[BONE.pelvis,BONE.spine,BONE.chest,BONE.neck].includes(b)))torsoWidth=Math.max(torsoWidth,Math.abs(fittedKit.positions[i*3]));
 }
 assert(topVertices>1000&&torsoWidth<Math.abs(rest.upperArmL.x)+.06,'fitted crop must retain the narrow torso');assert(sleeveVertices>100,'the reference kit must retain weighted long sleeves');
 assert(meta.author.includes('punkduck')&&meta.license.includes('CC-BY-4.0'),'authored top must retain creator and license metadata');
 const castFaces=new Set(),castKits=new Set();
 for(const spec of memberData.filter(s=>s.presentation==='feminine')){
  const actor=new Character({...spec},new Vec3(),new Navigation([]),{});actor.racketStowed=true;for(let i=0;i<180;i++)actor.update(1/60);
  const parts=actor.meshes(),skin=parts.find(m=>m.rig&&m.material==='humanSkin'),eyes=parts.find(m=>m.eyeCenters),kit=parts.find(m=>m.rig&&m.material==='performanceKnit'&&!m.skirt);
  assert(skin.skin.id.endsWith(':'+spec.id)&&skin.diffuse&&kit.diffuse,'each adult woman must use her authored look');castFaces.add(skin.skin);castKits.add(kit.diffuse);
  assert.equal(parts.filter(m=>m.rig).length,5,'authored body replaces the assembled fallback parts');
  assert(!Array.from({length:skin.skin.positions.length/9},(_,t)=>[0,1,2].every(j=>{const v=t*3+j;return skin.skin.uvs[v*2]>.5&&skin.skin.uvs[v*2+1]>.8&&skin.skin.positions[v*3+2]<-.075;})).some(Boolean),'alternate hairstyles must not retain the source ponytail core');
  for(let v=0;v<skin.skin.normals.length;v+=3*29)for(const delta of skin.skin.morphNormals){const n=skin.skin.normals;assert(Math.abs(Math.hypot(n[v]+delta[v],n[v+1]+delta[v+1],n[v+2]+delta[v+2])-1)<1e-5,'shaped expression normals must remain unit length');}
  const eg=eyes.skin;for(const side of [0,1])for(let axis=0;axis<3;axis++){const values=[];for(let v=0;v<eg.positions.length/3;v++)if((eg.positions[v*3]<0?0:1)===side)values.push(eg.positions[v*3+axis]);assert(Math.abs(eyes.eyeCenters[side*3+axis]-(Math.min(...values)+Math.max(...values))/2)<1e-6,'shaped eyes must retain their actual rotation centers');}
  for(let v=0;v<body.positions.length/3;v+=31)if(![0,1,2,3].some(j=>body.boneIndices[v*4+j]===BONE.head&&body.boneWeights[v*4+j]>.99))for(let axis=0;axis<3;axis++)assert.equal(skin.skin.positions[v*3+axis],body.positions[v*3+axis],'face shaping must preserve the fitted body');
  for(const state of ['sit','idle','ready']){actor.trigger(state);for(let i=0;i<90;i++)actor.update(1/60);assert(actor.meshes().filter(m=>m.rig).every(m=>m.boneMatrices.every(Number.isFinite)));}
  actor.matchCompetitor=true;actor.racketStowed=false;actor.setAnimation('ready');actor.update(.3);actor.setIncomingContact(new Vec3(-.6,1.02,.9));actor.triggerShot('swingBackhand',new Vec3(0,.09,5));const contactTime=actor.shotContactTime('swingBackhand');for(let i=0;i<60;i++)actor.update(contactTime/60);assert(Vec3.sub(actor.analysisPose().racketCenter,actor.debugKinematics().contactTarget).len()<1e-6,'cast appearance must preserve the world-owned racket contact');
  const frame=captureFrame(actor,0,null);assert(frame.body.some(m=>m.skin===skin.skin),'capture must retain the selected face geometry');
 }
 assert.equal(castFaces.size,3);assert.equal(castKits.size,3);console.log('Three distinct authored adult cast looks retain their body, eye centers, seated pose, contact and capture.');
 const blinkActor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});let previousBlink=0,maxBlink=0,maxBlinkStep=0;
 for(let frame=0;frame<960;frame++){blinkActor.update(1/240);const blink=blinkActor.meshes().find(m=>m.rig).expression[2];maxBlink=Math.max(maxBlink,blink);maxBlinkStep=Math.max(maxBlinkStep,Math.abs(blink-previousBlink));previousBlink=blink;}
 assert(maxBlink>.95&&maxBlinkStep<.15,'blink must close fully without snapping shut');console.log(JSON.stringify({maxBlink,maxBlinkStep}));
 const gazeActor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});gazeActor.update(1/60);gazeActor.setLook(new Vec3(3,1.8,4));
 for(let i=0;i<12;i++)gazeActor.update(1/120);
 const gazeA=captureFrame(gazeActor,0,null),eyeA=gazeA.body.find(m=>m.eyeCenters);assert(eyeA&&eyeA.eyeYaw>.1&&eyeA.eyeYaw<=.30,'eyes must lead a head turn within anatomical limits');assert.equal(eyeA.eyeCenters.length,6);assert(eyeA.eyeCenters.every(Number.isFinite));
 const frozen=gazeA.pose.eyeYaw;gazeActor.setLook(new Vec3(-3,1.8,4));for(let i=0;i<12;i++)gazeActor.update(1/120);
 const gazeB=captureFrame(gazeActor,1,null),eyeB=gazeB.body.find(m=>m.eyeCenters),replayEyes=interpolateFrame(gazeA,gazeB,.5).body.find(m=>m.eyeCenters);
 assert(eyeB.eyeYaw<-.1);assert.equal(gazeA.pose.eyeYaw,frozen,'recording mutated when the live actor looked away');assert(Math.abs(replayEyes.eyeYaw-(eyeA.eyeYaw+eyeB.eyeYaw)/2)<1e-12,'replay must interpolate captured eye movement');
 const repeated=gazeActor.meshes().find(m=>m.eyeCenters).eyeYaw;assert.equal(repeated,gazeActor.meshes().find(m=>m.eyeCenters).eyeYaw,'rendering must not advance gaze');
 for(let i=0;i<360;i++)gazeActor.update(1/120);assert(Math.abs(gazeActor.analysisPose().eyeYaw)<.25,'eyes must settle once the head has caught up');
 console.log(JSON.stringify({gazeLead:eyeA.eyeYaw,gazeReverse:eyeB.eyeYaw,replayedGaze:replayEyes.eyeYaw}));
 const observedHands=actor=>{const mesh=actor.meshes().find(m=>m.rig),g=mesh.skin,points=[];for(let v=0;v<g.positions.length/3;v+=9){if(![0,1,2,3].some(j=>[BONE.handL,BONE.handR].includes(g.boneIndices[v*4+j])&&g.boneWeights[v*4+j]>.8))continue;const p=new Vec3(...g.positions.slice(v*3,v*3+3));p.add(new Vec3(...g.morphs[4].slice(v*3,v*3+3)).scale(mesh.handGrip[p.x<0?0:1]));const point=new Vec3();for(let j=0;j<4;j++){const weight=g.boneWeights[v*4+j];if(!weight)continue;const q=transformPoint(mesh.boneMatrices.slice(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),p);point.add(new Vec3(q.x*weight,q.y*weight,q.z*weight));}const side=[0,1,2,3].some(j=>g.boneIndices[v*4+j]===BONE.handL&&g.boneWeights[v*4+j]>.8)?'L':'R';points.push(point.sub(mesh.rig.pose['hand'+side]));}return points;};
 // Remove legitimate hand travel to measure continuity of the retargeted surface.
 let transitionChecks=0,zeroTimeJump=0,maxHandRelativeStep=0;
 for(const [from,to] of [['idle','sit'],['sit','idle'],['idle','ready'],['ready','idle'],['idle','drink'],['drink','idle'],['ready','swingBackhand'],['swingForehand','ready'],['swingBackhand','ready'],['serve','ready']]){
  const actor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});actor.racketStowed=false;actor.matchCompetitor=true;actor.seatDepth=.8;actor.trigger(from);for(let i=0;i<180;i++)actor.update(1/120);let before=observedHands(actor);actor.trigger(to);let after=observedHands(actor),jump=Math.max(...after.map((p,i)=>Vec3.sub(p,before[i]).len()));zeroTimeJump=Math.max(zeroTimeJump,jump);assert(jump<1e-5,'state change snapped the visible hand without advancing time');
  for(let i=0;i<45;i++){before=after;actor.update(1/120);after=observedHands(actor);const step=Math.max(...after.map((p,j)=>Vec3.sub(p,before[j]).len()));maxHandRelativeStep=Math.max(maxHandRelativeStep,step);assert(step<.06,`hand motion jumped during ${from} → ${to} at frame ${i}: ${step}`);transitionChecks++;}
  assert.deepEqual(observedHands(actor),observedHands(actor),'rendering must not advance hand acting');
 }
 for(const key of ['handRestWeight','handLapWeight','handGripL','handGripR','handRacketWeight'])assert(Math.abs(middle.pose[key]-(a.pose[key]+b.pose[key])/2)<1e-12,'capture and replay share continuous hand controls');
 console.log(JSON.stringify({transitionChecks,zeroTimeJump,maxHandRelativeStep}));
 for(const spec of [playerSpec('taylor'),...floorMembers.filter(s=>s.presentation==='feminine')])for(const hz of [30,60,120]){
  const actor=new Character(spec,new Vec3(),new Navigation([]),{});actor.matchCompetitor=true;actor.trigger('ready');for(let i=0;i<hz;i++)actor.update(1/hz);
  const first=actor.analysisPose(),offset=Vec3.sub(first.racketCenter,first.racketGrip);let turn=0;
  for(let i=0;i<hz*3;i++){actor.update(1/hz);const p=actor.analysisPose();turn=Math.max(turn,Vec3.sub(Vec3.sub(p.racketCenter,p.racketGrip),offset).len());assert(Vec3.sub(p.handL,Vec3.lerp(p.racketHandleTop,p.racketCenter,.20)).len()<.001,'Authored free palm must follow the visible throat');for(const side of ['L','R'])assert(Vec3.sub(p['foot'+side],first['foot'+side]).len()<1e-8,'Grip adjustment must not move ready shoes');}
  assert(turn>.035&&turn<.15,'Authored waiting grip must move without exaggerated fidgeting');
  const a=captureFrame(actor,0,null);actor.update(1/hz);const b=captureFrame(actor,1/hz,null),replay=interpolateFrame(a,b,.5/hz).pose;assert(Vec3.sub(replay.handL,Vec3.lerp(replay.racketHandleTop,replay.racketCenter,.20)).len()<.001,'Replay must retain the throat support');
 }
 console.log('Authored athlete loader, actual Character meshes, shared replay palette and facial interpolation PASS.');
}finally{globalThis.fetch=previousFetch;if(previousImage)globalThis.Image=previousImage;else delete globalThis.Image;}

// Check the actual deformed hands, not only the two palm targets.
{
 const {RACKET}=await import('../dist/animation/RacketGeometry.js'),{captureFrame,interpolateFrame}=await import('../dist/analysis/MotionCapture.js');
 const handGap=(p,m)=>{
   const g=m.skin,axis=Vec3.sub(p.racketHandleTop,p.racketGrip).normalize(),edges=[Infinity,-Infinity];
   for(let v=0;v<g.positions.length/3;v++)for(const [side,bone] of [[0,BONE.handL],[1,BONE.handR]]){
    if(![0,1,2,3].some(j=>g.boneIndices[v*4+j]===bone&&g.boneWeights[v*4+j]>.99))continue;
    const point=new Vec3(...g.positions.slice(v*3,v*3+3)).add(new Vec3(...g.morphs[4].slice(v*3,v*3+3)).scale(m.handGrip[side])),posed=new Vec3();
    for(let j=0;j<4;j++){const weight=g.boneWeights[v*4+j];if(weight){const q=transformPoint(m.boneMatrices.slice(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),point);posed.add(new Vec3(q.x,q.y,q.z).scale(weight));}}
    const along=Vec3.dot(Vec3.sub(posed,p.handR),axis);edges[side]=side===0?Math.min(edges[side],along):Math.max(edges[side],along);
   }
   return edges[0]-edges[1];
 };
 let checks=0,minGap=Infinity;
 for(const id of ['taylor','coach','mika','nia'])for(const hz of [30,60,120]){
  const spec=id==='taylor'?playerSpec(id):memberData.find(m=>m.id===id),actor=new Character(spec,new Vec3(),new Navigation([]),{});
  actor.matchCompetitor=true;actor.racketStowed=false;actor.setAnimation('ready');for(let i=0;i<hz*.3;i++)actor.update(1/hz);
  actor.setIncomingContact(new Vec3(-.6,1.02,.9));actor.triggerShot('swingBackhand',new Vec3(0,.09,5));
  let previous;
  for(let i=0;i<hz*.53;i++){
   actor.update(1/hz);if(i/hz<.14||i%Math.max(1,Math.round(hz/15)))continue;
   const p=actor.analysisPose(),axis=Vec3.sub(p.racketHandleTop,p.racketGrip).normalize();
   const m=actor.meshes().find(m=>m.rig&&m.material==='humanSkin');
   const gap=handGap(p,m);minGap=Math.min(minGap,gap);assert(gap>.003,'Closed backhand fingers must not penetrate the opposite palm');checks++;
   assert(Vec3.sub(p.handL,p.handR.clone().add(axis.clone().scale(RACKET.handSpacing))).len()<1e-6,'Both backhand palms must remain stacked on the visible shaft');
   const frame=captureFrame(actor,(i+1)/hz,null);
   if(previous){const replay=interpolateFrame(previous,frame,(previous.time+frame.time)/2);const gap=handGap(replay.pose,replay.body.find(m=>m.rig&&m.material==='humanSkin'));assert(gap>.003,`Recorded backhand fingers intersect: ${id}/${hz}/${replay.time}, gap ${gap}`);}
   previous=frame;
  }
 }
 console.log(JSON.stringify({backhandGripChecks:checks,minFingerGap:minGap}));
}

// These front-sleeve and chest panels crossed during the loaded backhand.
{
 const segmentHits=(tri,from,to)=>{
  const [a,b,c]=tri,d=Vec3.sub(to,from),e=Vec3.sub(b,a),f=Vec3.sub(c,a),h=Vec3.cross(d,f),det=Vec3.dot(e,h);
  if(Math.abs(det)<1e-10)return false;
  const o=Vec3.sub(from,a),u=Vec3.dot(o,h)/det;if(u<=0||u>=1)return false;
  const q=Vec3.cross(o,e),v=Vec3.dot(d,q)/det;if(v<=0||u+v>=1)return false;
  const t=Vec3.dot(f,q)/det;return t>0&&t<1;
 };
 for(const hz of [30,60,120]){
  const actor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});actor.matchCompetitor=true;actor.racketStowed=false;actor.setAnimation('ready');actor.update(.3);actor.setIncomingContact(new Vec3(-.6,1.02,.9));actor.triggerShot('swingBackhand',new Vec3(0,.09,5));for(let i=0;i<hz*.2;i++)actor.update(1/hz);
  const m=actor.meshes().find(m=>m.rig&&m.material==='performanceKnit'&&!m.skirt),g=m.skin;
  // Locate the same physical sleeve/chest panels after the jersey surface was refined.
  const centers=[new Vec3(.260604,1.823410,.086454),new Vec3(.180130,1.855895,.149114)];
  const patches=centers.map(center=>{const starts=[];for(let v=0;v<g.positions.length/3;v+=3){const midpoint=[0,1,2].reduce((p,k)=>p.add(new Vec3(...g.positions.slice((v+k)*3,(v+k+1)*3))),new Vec3()).scale(1/3);if(Vec3.sub(midpoint,center).len()<.018)starts.push(v);}assert(starts.length,'Inspect the emitted shoulder regression patch');return starts;});
  const panels=patches.map(starts=>starts.map(start=>[0,1,2].map(offset=>{
   const v=start+offset,point=new Vec3(...g.positions.slice(v*3,v*3+3)),out=new Vec3();
   for(let j=0;j<4;j++){const weight=g.boneWeights[v*4+j];if(weight){const q=transformPoint(m.boneMatrices.slice(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),point);out.add(new Vec3(q.x,q.y,q.z).scale(weight));}}
   return out;
  })));
  assert(!panels[0].some(a=>panels[1].some(b=>[a,b].some((tri,i)=>tri.some((from,j)=>segmentHits(i?a:b,from,tri[(j+1)%3]))))),'Loaded backhand sleeve must not pass through the front shoulder panel');
 }
 console.log('Loaded backhand: front sleeve and shoulder panels remain separated at 30/60/120 Hz.');
}

// Hip contact is checked against emitted skin, so skirt clearance cannot leave floating hands again.
for(const spec of [playerSpec('taylor'),...memberData.filter(c=>c.presentation==='feminine')]){
 const actor=new Character(spec,new Vec3(),new Navigation([]),{});actor.racketStowed=true;for(let i=0;i<180;i++)actor.update(1/60);
 const p=actor.analysisPose(),mesh=actor.meshes().find(m=>m.rig&&m.material==='humanSkin'),g=mesh.skin,waist=[],hands={L:[],R:[]};
 for(let v=0;v<g.positions.length/3;v++){
  let arm=0;const hand={L:0,R:0};for(let j=0;j<4;j++){const b=g.boneIndices[v*4+j],w=g.boneWeights[v*4+j];if([5,6,7,8,9,10,17,18].includes(b))arm+=w;for(const side of ['L','R'])if(b===BONE['hand'+side])hand[side]+=w;}
  if(arm>=.05&&hand.L<=.5&&hand.R<=.5)continue;const point=new Vec3(...g.positions.slice(v*3,v*3+3)),out=new Vec3();
  for(let j=0;j<4;j++){const w=g.boneWeights[v*4+j];if(w){const q=transformPoint(mesh.boneMatrices.slice(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),point);out.add(new Vec3(q.x,q.y,q.z).scale(w));}}
  if(arm<.05&&out.y>p.pelvisCenter.y+.10&&out.y<p.pelvisCenter.y+.36)waist.push(out);for(const side of ['L','R'])if(hand[side]>.5)hands[side].push(out);
 }
 assert(waist.length>100&&hands.L.length>100&&hands.R.length>100,'Hip contact must use actual authored surfaces');
 for(const side of ['L','R']){let distance=Infinity;for(const h of hands[side])for(const w of waist)distance=Math.min(distance,(h.x-w.x)**2+(h.y-w.y)**2+(h.z-w.z)**2);assert(Math.sqrt(distance)<.05,`${spec.id}/${side}: resting hand floats away from the hip`);}
}

// Use the loaded athlete: fallback arm lengths hid the locked-elbow walk.
{
 let minWalkFlex=Infinity,maxWalkFlex=0,maxHeadBob=0,walkSamples=0;
 for(const spec of [playerSpec('taylor'),...memberData.filter(c=>c.presentation==='feminine')])for(const hz of [30,60,120]){
  const actor=new Character({...spec},new Vec3(0,0,-8),new Navigation([]),{});actor.racketStowed=true;actor.goTo(new Vec3(0,0,8));const heads=[];
  for(let frame=0;frame<hz*4;frame++){
   actor.update(1/hz);if(frame<hz)continue;assert.equal(actor.state,'walk');const p=actor.analysisPose(),mesh=actor.meshes().find(m=>m.rig&&m.material==='humanSkin');
   assert(mesh.skin.id.startsWith(body.id),'Walking regression must exercise the authored athlete');heads.push(p.head.y);
   const forward=new Vec3(Math.sin(actor.yaw),0,Math.cos(actor.yaw)),depth=(a,b)=>Vec3.dot(Vec3.sub(a,b),forward);
   assert(depth(p.shoulderR,p.shoulderL)*depth(p.handR,p.handL)>-.0001,'Shoulders must follow the opposing arm swing');
   assert(depth(p.hipR,p.hipL)*depth(p.footR,p.footL)>-.0001,'Pelvis turn must follow the leading leg');
   for(const side of ['L','R']){
    const upper=Vec3.sub(p[`elbow${side}`],p[`shoulder${side}`]),lower=Vec3.sub(p[`hand${side}`],p[`elbow${side}`]),flex=Math.acos(Math.max(-1,Math.min(1,Vec3.dot(upper.clone().normalize(),lower.clone().normalize()))));
    minWalkFlex=Math.min(minWalkFlex,flex);maxWalkFlex=Math.max(maxWalkFlex,flex);
    assert(flex>.20&&flex<.65,`${spec.id}/${hz}/${frame}: walking elbow ${(flex*180/Math.PI).toFixed(2)}° in ${actor.state}`);
    assert(Math.abs(upper.len()-Vec3.sub(rest[`upperArm${side}`],rest[`foreArm${side}`]).len())<.001,'Walking must not stretch the authored upper arm');
    assert(Math.abs(lower.len()-Vec3.sub(rest[`foreArm${side}`],rest[`hand${side}`]).len())<.001,'Walking must not stretch the authored forearm');walkSamples++;
   }
  }
  const bob=Math.max(...heads)-Math.min(...heads);maxHeadBob=Math.max(maxHeadBob,bob);assert(bob<.075,'Walking support must avoid the deep repeated body dip');
 }
 assert(maxWalkFlex-minWalkFlex>.12,'Walking elbows flex through the stride instead of holding one fixed bend');
 console.log(JSON.stringify({walkSamples,minWalkFlex,maxWalkFlex,maxHeadBob}));
}
