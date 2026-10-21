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
const dir=new URL('../assets/characters/taylor/',import.meta.url),meta=JSON.parse(fs.readFileSync(new URL('provenance.json',dir))),bytes=fs.readFileSync(new URL('taylor.glb',dir)),hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(hash(bytes),meta.sha256);for(const [name,sha] of Object.entries(meta.textures))assert.equal(hash(fs.readFileSync(new URL(name,dir))),sha);
for(const [name,sha] of Object.entries(meta.authoringScripts))assert.equal(hash(fs.readFileSync(new URL('../tools/'+name,import.meta.url))),sha,'baked asset must match its authoring scripts');
for(const [name,sha] of Object.entries(meta.sourceHashes).filter(([name])=>name.startsWith('tools/')))assert.equal(hash(fs.readFileSync(new URL('../'+name,import.meta.url))),sha,'checked-in authoring source must match the bake');
const asset=inspectCharacterAsset(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),[],meta);
assert.deepEqual(asset.primitives.map(p=>p.materialSlot),['skin','kit','skirt','shoes','eyes','hair']);const body=asset.primitives[0].geometry;for(const bone of [BONE.foreArmTwistL,BONE.foreArmTwistR])assert(body.boneIndices.filter((n,i)=>n===bone&&body.boneWeights[i]>.1).length>100,'authored forearm twist weights must reach the visible skin');assert(asset.primitives.reduce((n,p)=>n+p.geometry.positions.length/9,0)<40000);
for(const p of asset.primitives){assert(p.geometry.uvs?.every(Number.isFinite));assert(p.albedo);if(['eyes','hair','brows','lashes'].includes(p.materialSlot))assert.equal(p.alphaCutoff,.35);if(['skin','eyes','hair','skirt'].includes(p.materialSlot)){assert.equal(p.geometry.morphs.length,5);assert(p.geometry.morphs.every(d=>d.length===p.geometry.positions.length&&d.every(Number.isFinite)));assert.equal(p.geometry.morphNormals.length,5);assert(p.geometry.morphNormals.every(d=>d.length===p.geometry.positions.length&&d.every(n=>Number.isFinite(n)&&Math.abs(n)<=2.01)));}}
for(const slot of ['kit','skirt']){
 const g=asset.primitives.find(p=>p.materialSlot===slot).geometry,vertices=[];for(let i=0;i<g.positions.length/3;i++)if(slot==='skirt'||g.uvs[i*2+1]>.55)vertices.push(i);
 const hem=Math.min(...vertices.map(i=>g.positions[i*3+1])),seen=new Map();let pairs=0;
 for(const i of vertices){if(Math.abs(g.positions[i*3+1]-hem)>1e-5)continue;const key=[...g.positions.slice(i*3,i*3+3)].map(n=>n.toFixed(6)).join(','),previous=seen.get(key);if(previous===undefined){seen.set(key,i);continue;}for(const normals of [g.normals,...(g.morphNormals??[])])assert(Math.hypot(...normals.slice(i*3,i*3+3).map((n,j)=>n-normals[previous*3+j]))<1e-5,'trimmed cloth hem must shade continuously, including its corrective');pairs++;}
 assert(pairs>50,'inspect actual shared hem vertices');
}
const rest=Object.fromEntries(Object.entries(meta.bind).map(([key,p])=>[key,new Vec3(...p)]));rest.headUp=new Vec3(0,1,0);
// Measure the exported skin, so a later bake cannot silently restore the bulky arms.
for(const side of ['L','R'])for(const [start,end,bones,limit] of [['upperArm','foreArm',['upperArm'],.063],['foreArm','wrist',['foreArm','foreArmTwist'],.051]]){
 const a=rest[start+side],axis=Vec3.sub(rest[end+side],a),length=axis.len();axis.scale(1/length);const radii=[];
 for(let v=0;v<body.positions.length/3;v++){
  const p=Vec3.sub(new Vec3(...body.positions.slice(v*3,v*3+3)),a),along=Vec3.dot(p,axis)/length;let weight=0;
  for(let j=0;j<4;j++)if(bones.some(b=>BONE[b+side]===body.boneIndices[v*4+j]))weight+=body.boneWeights[v*4+j];
  if(weight>.95&&along>.2&&along<.7)radii.push(p.sub(axis.clone().scale(along*length)).len());
 }
 radii.sort((a,b)=>a-b);const radius95=radii[Math.floor(radii.length*.95)];assert(radii.length>60&&radius95>.03&&radius95<limit,'exported arm cross-section must retain the slimmer athletic silhouette');console.log(JSON.stringify({arm:start+side,radius95,samples:radii.length}));
}
const bind=skinMatrices(rest,rest);for(let bone=0;bone<Object.keys(BONE).length;bone++)for(let i=0;i<16;i++)assert(Math.abs(bind[bone*16+i]-(i%5===0?1:0))<1e-5,'rest pose changed');
assert(rest.handL.x<0&&rest.handR.x>0&&rest.thighL.x<0&&rest.thighR.x>0);
// Native QA checks image decoding. This mock exercises the real verified loader and capture/replay path.
const previousFetch=globalThis.fetch,previousImage=globalThis.Image;
try{
 globalThis.fetch=async url=>{const path=new URL(url);assert.equal(path.protocol,'file:');assert(path.href.startsWith(dir.href));return new Response(fs.readFileSync(path));};
 globalThis.Image=class{naturalWidth=1024;naturalHeight=1024;async decode(){}};
 const {loadAuthoredAthlete,authoredAthleteMeshes,advanceAuthoredHands}=await import('../dist/animation/AuthoredAthlete.js');await loadAuthoredAthlete();
 const verifiedFetch=globalThis.fetch;
 for(const invalid of [{neck:[0,meta.bind.head[1]+.1,0]},{neck:[0,meta.bind.neck[1],1]},{spine:[0,meta.bind.chest[1]+.1,0]},{foreArmL:meta.bind.upperArmL}]){globalThis.fetch=async url=>new URL(url).pathname.endsWith('/provenance.json')?new Response(JSON.stringify({...meta,bind:{...meta.bind,...invalid}})):verifiedFetch(url);await assert.rejects(()=>loadAuthoredAthlete(),/registration|arm lengths/);}
 globalThis.fetch=verifiedFetch;
 const restNeckPose={...new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{}).analysisPose(),pelvisCenter:rest.pelvis.clone(),head:rest.head.clone(),shoulderL:rest.upperArmL.clone(),shoulderR:rest.upperArmR.clone(),headYaw:0,torsoYaw:0,hipYaw:0};
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
  const observed=character.analysisPose();for(const side of ['L','R'])for(const [a,b,expected] of [[`shoulder${side}`,`elbow${side}`,Vec3.sub(rest[`upperArm${side}`],rest[`foreArm${side}`]).len()],[`elbow${side}`,`hand${side}`,Vec3.sub(rest[`foreArm${side}`],rest[`hand${side}`]).len()]]){const ratio=Vec3.sub(observed[a],observed[b]).len()/expected;assert(ratio>.999&&ratio<1.04,'the authored arm must retain its source length through poses');}
  const part=character.meshes().find(p=>'skin' in p&&p.rig),rig=part.rig.pose,matrices=part.boneMatrices;assert(matrices.every(Number.isFinite));
  for(const side of ['L','R'])for(let v=0;v<body.positions.length/3;v+=3){
   const joints=[0,1,2,3].map(j=>body.boneIndices[v*4+j]),weights=[0,1,2,3].map(j=>body.boneWeights[v*4+j]);
   if(!joints.some((b,j)=>b===BONE['foreArmTwist'+side]&&weights[j]>.1)||joints.some((b,j)=>weights[j]>.001&&![BONE['foreArm'+side],BONE['foreArmTwist'+side],BONE['hand'+side]].includes(b)))continue;
   const axes=[0,4,8].map(offset=>{const out=new Vec3();for(let j=0;j<4;j++){if(!weights[j])continue;out.add(new Vec3(...matrices.slice(joints[j]*16+offset,joints[j]*16+offset+3)).normalize().scale(weights[j]));}return out;});
   const volume=Vec3.dot(Vec3.cross(axes[0],axes[1]),axes[2]);minForearmVolume=Math.min(minForearmVolume,volume);assert(volume>.05,`${state}/${t}/${side}: forearm skin weights collapsed during a palm turn (${volume})`);
  }
  for(const side of ['L','R']){const expected=rig['hand'+side],actual=transformPoint(matrices.slice(BONE['hand'+side]*16,BONE['hand'+side]*16+16),rest['hand'+side]);const gap=Math.hypot(actual.x-expected.x,actual.y-expected.y,actual.z-expected.z);maxGripGap=Math.max(maxGripGap,gap);assert(gap<1e-5,'authored palm lost the authoritative grip');}
  const shoes=asset.primitives.find(p=>p.materialSlot==='shoes').geometry;let low=Infinity;
  for(let v=0;v<shoes.positions.length/3;v+=3){let y=0;for(let j=0;j<4;j++){const weight=shoes.boneWeights[v*4+j];if(!weight)continue;const bone=shoes.boneIndices[v*4+j],point=transformPoint(matrices.slice(bone*16,bone*16+16),new Vec3(...shoes.positions.slice(v*3,v*3+3)));y+=point.y*weight;}low=Math.min(low,y);}
  minSole=Math.min(minSole,low);assert(low>-.005,'shoe penetrated the floor');samples++;
 }
}
let maxAuthoredContactError=0;
for(const stroke of ['swingForehand','swingBackhand','volley','serve'])for(const height of [.66,1.02,1.38])for(const x of [-.76,.54,.88]){
 const actor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});actor.setAnimation('ready');actor.update(.3);if(stroke!=='serve')actor.setIncomingContact(new Vec3(x,height,.90));actor.triggerShot(stroke,new Vec3(0,.09,-5));
 const time=actor.shotContactTime(stroke);for(let i=0;i<60;i++)actor.update(time/60);const error=Vec3.sub(actor.analysisPose().racketCenter,actor.debugKinematics().contactTarget).len();maxAuthoredContactError=Math.max(maxAuthoredContactError,error);assert(error<1e-6,'authored arm proportions lost the world-space racket contact');
}
console.log(JSON.stringify({maxAuthoredContactError}));
console.log(JSON.stringify({assetTriangles:asset.primitives.reduce((n,p)=>n+p.geometry.positions.length/9,0),samples,maxGripGap,minSole,minForearmVolume}));
 const {captureFrame,interpolateFrame}=await import('../dist/analysis/MotionCapture.js');
 const c=new Character(playerSpec('taylor'),new Vec3(2,0,-1),new Navigation([]),{});c.trigger('swingForehand');c.update(.12);const a=captureFrame(c,0,null);c.update(1/30);const b=captureFrame(c,1/30,null),middle=interpolateFrame(a,b,1/60),parts=middle.body.filter(p=>'skin' in p&&p.poseRig);
 assert.equal(parts.find(p=>p.material==='groomedHair').color,'#65584f','replay must retain the strand tint that matches the brunette scalp');assert.equal(parts.find(p=>p.material==='humanSkin').color,'#ffffff','hair tint must not affect face or body');assert.equal(parts.length,6);assert(parts.every(p=>p.rig&&p.boneMatrices===parts[0].boneMatrices));assert.equal(parts.filter(p=>p.skirt).length,1,'replay must retain the garment clearance flag');
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
 // Check the actual fitted top, rather than assuming valid joints imply no overlap.
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
    for(let i=0;i<points.length;i+=3){const[a,b,c]=points.slice(i,i+3),det=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(det)<1e-12)continue;const u=((b.y-c.y)*(point.x-c.x)+(c.x-b.x)*(point.y-c.y))/det,v=((c.y-a.y)*(point.x-c.x)+(a.x-c.x)*(point.y-c.y))/det,w=1-u-v;if(u>=0&&v>=0&&w>=0)hits.push(u*a.z+v*b.z+w*c.z);}
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
 assert(crouched.meshes().find(m=>m.skirt).expression[1]>.99,'the lowered stroke pelvis must drive the crouch correction');const crouchA=captureFrame(crouched,0,null);crouched.update(1/60);const crouchB=captureFrame(crouched,1/60,null),crouchMiddle=interpolateFrame(crouchA,crouchB,1/120);assert.equal(crouchMiddle.body.find(m=>m.skirt).expression[1],(crouchA.body.find(m=>m.skirt).expression[1]+crouchB.body.find(m=>m.skirt).expression[1])/2,'capture/replay must retain the crouch correction');
 console.log(JSON.stringify({maxDrapeStep,seatedReplay:true,crouchReplay:true}));
 const fittedKit=asset.primitives.find(p=>p.materialSlot==='kit').geometry;let topWidth=0,topVertices=0;for(let i=0;i<fittedKit.positions.length;i+=3)if(fittedKit.positions[i+1]>1.7){assert(fittedKit.uvs[i/3*2+1]>.55&&fittedKit.uvs[i/3*2+1]<.95,'solid top sampled the neighbouring atlas tile');topWidth=Math.max(topWidth,Math.abs(fittedKit.positions[i]));topVertices++;}
 assert(topVertices>1000&&topWidth<Math.abs(rest.upperArmL.x)+.06,'fitted top must follow the torso rather than retaining the jersey sleeves');assert(meta.author.includes('punkduck')&&meta.license.includes('CC-BY-4.0'),'authored top must retain creator and license metadata');
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
 console.log('Authored athlete loader, actual Character meshes, shared replay palette and facial interpolation PASS.');
}finally{globalThis.fetch=previousFetch;if(previousImage)globalThis.Image=previousImage;else delete globalThis.Image;}
