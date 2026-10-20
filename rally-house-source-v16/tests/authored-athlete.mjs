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
const asset=inspectCharacterAsset(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),[],meta);
assert.equal(asset.primitives.length,9);const body=asset.primitives[0].geometry;for(const bone of [BONE.foreArmTwistL,BONE.foreArmTwistR])assert(body.boneIndices.filter((n,i)=>n===bone&&body.boneWeights[i]>.1).length>100,'authored forearm twist weights must reach the visible skin');assert(asset.primitives.reduce((n,p)=>n+p.geometry.positions.length/9,0)<40000);
for(const p of asset.primitives){assert(p.geometry.uvs?.every(Number.isFinite));assert(p.albedo);if(['eyes','hair','brows','lashes'].includes(p.materialSlot))assert.equal(p.alphaCutoff,.35);if(['skin','brows','lashes','teeth'].includes(p.materialSlot)){assert.equal(p.geometry.morphs.length,5);assert(p.geometry.morphs.every(d=>d.length===p.geometry.positions.length&&d.every(Number.isFinite)));assert.equal(p.geometry.morphNormals.length,5);assert(p.geometry.morphNormals.every(d=>d.length===p.geometry.positions.length&&d.every(n=>Number.isFinite(n)&&Math.abs(n)<=2.01)));}}
const rest=Object.fromEntries(Object.entries(meta.bind).map(([key,p])=>[key,new Vec3(...p)]));rest.headUp=new Vec3(0,1,0);
const bind=skinMatrices(rest,rest);for(let bone=0;bone<Object.keys(BONE).length;bone++)for(let i=0;i<16;i++)assert(Math.abs(bind[bone*16+i]-(i%5===0?1:0))<1e-5,'rest pose changed');
assert(rest.handL.x<0&&rest.handR.x>0&&rest.thighL.x<0&&rest.thighR.x>0);
// Native QA checks image decoding. This mock exercises the real verified loader and capture/replay path.
const previousFetch=globalThis.fetch,previousImage=globalThis.Image;
try{
 globalThis.fetch=async url=>{const path=new URL(url);assert.equal(path.protocol,'file:');assert(path.href.startsWith(dir.href));return new Response(fs.readFileSync(path));};
 globalThis.Image=class{naturalWidth=1024;naturalHeight=1024;async decode(){}};
 const {loadAuthoredAthlete}=await import('../dist/animation/AuthoredAthlete.js');await loadAuthoredAthlete();
const character=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});let samples=0,maxGripGap=0,minSole=Infinity,minForearmVolume=Infinity;
for(const state of ['idle','sit','drink','ready','swingForehand','swingBackhand','serve']){
 character.trigger(state);for(let t=0;t<90;t++){character.update(1/120);if(t%15)continue;const part=character.meshes().find(p=>'skin' in p&&p.rig),rig=part.rig.pose,matrices=part.boneMatrices;assert(matrices.every(Number.isFinite));
  for(const side of ['L','R'])for(let v=0;v<body.positions.length/3;v+=3){
   const joints=[0,1,2,3].map(j=>body.boneIndices[v*4+j]),weights=[0,1,2,3].map(j=>body.boneWeights[v*4+j]);
   if(!joints.some((b,j)=>b===BONE['foreArmTwist'+side]&&weights[j]>.1)||joints.some((b,j)=>weights[j]>.001&&![BONE['foreArm'+side],BONE['foreArmTwist'+side],BONE['hand'+side]].includes(b)))continue;
   const axes=[0,4,8].map(offset=>{const out=new Vec3();for(let j=0;j<4;j++){if(!weights[j])continue;out.add(new Vec3(...matrices.slice(joints[j]*16+offset,joints[j]*16+offset+3)).normalize().scale(weights[j]));}return out;});
   const volume=Vec3.dot(Vec3.cross(axes[0],axes[1]),axes[2]);minForearmVolume=Math.min(minForearmVolume,volume);assert(volume>.05,'forearm skin weights collapsed during a palm turn');
  }
  for(const side of ['L','R']){const expected=rig['hand'+side],actual=transformPoint(matrices.slice(BONE['hand'+side]*16,BONE['hand'+side]*16+16),rest['hand'+side]);const gap=Math.hypot(actual.x-expected.x,actual.y-expected.y,actual.z-expected.z);maxGripGap=Math.max(maxGripGap,gap);assert(gap<1e-5,'authored palm lost the authoritative grip');}
  const shoes=asset.primitives.find(p=>p.materialSlot==='shoes').geometry;let low=Infinity;
  for(let v=0;v<shoes.positions.length/3;v+=3){let y=0;for(let j=0;j<4;j++){const weight=shoes.boneWeights[v*4+j];if(!weight)continue;const bone=shoes.boneIndices[v*4+j],point=transformPoint(matrices.slice(bone*16,bone*16+16),new Vec3(...shoes.positions.slice(v*3,v*3+3)));y+=point.y*weight;}low=Math.min(low,y);}
  minSole=Math.min(minSole,low);assert(low>-.005,'shoe penetrated the floor');samples++;
 }
}
console.log(JSON.stringify({assetTriangles:asset.primitives.reduce((n,p)=>n+p.geometry.positions.length/9,0),samples,maxGripGap,minSole,minForearmVolume}));
 const {captureFrame,interpolateFrame}=await import('../dist/analysis/MotionCapture.js');
 const c=new Character(playerSpec('taylor'),new Vec3(2,0,-1),new Navigation([]),{});c.trigger('swingForehand');c.update(.12);const a=captureFrame(c,0,null);c.update(1/30);const b=captureFrame(c,1/30,null),middle=interpolateFrame(a,b,1/60),parts=middle.body.filter(p=>'skin' in p&&p.poseRig);
 assert.equal(parts.length,9);assert(parts.every(p=>p.rig&&p.boneMatrices===parts[0].boneMatrices));assert.equal(parts.filter(p=>p.skirt).length,1,'replay must retain the garment clearance flag');
 for(const part of parts){const rig=part.rig.pose;for(const side of ['L','R']){const actual=transformPoint(part.boneMatrices.slice(BONE['hand'+side]*16,BONE['hand'+side]*16+16),part.rig.bind['hand'+side]),expected=rig['hand'+side];assert(Math.hypot(actual.x-expected.x,actual.y-expected.y,actual.z-expected.z)<1e-5,'replay used the wrong body bind');}assert.deepEqual(part.expression,a.body.find(p=>'skin' in p&&p.poseRig).expression.map((v,i)=>(v+b.body.find(p=>'skin' in p&&p.poseRig).expression[i])/2));}
 c.racketStowed=false;c.matchCompetitor=true;c.trigger('ready');for(let i=0;i<90;i++)c.update(1/120);
 const skin=c.meshes().find(p=>'skin' in p&&p.rig),palette=skin.boneMatrices;
 for(const side of ['L','R']){const wrist=rest['wrist'+side],forearm=transformPoint(palette.slice(BONE['foreArm'+side]*16,BONE['foreArm'+side]*16+16),wrist),hand=transformPoint(palette.slice(BONE['hand'+side]*16,BONE['hand'+side]*16+16),wrist);assert(Math.hypot(forearm.x-hand.x,forearm.y-hand.y,forearm.z-hand.z)<1e-5,'the forearm must end at the anatomical wrist');const twist=transformPoint(palette.slice(BONE['foreArmTwist'+side]*16,BONE['foreArmTwist'+side]*16+16),wrist);assert(Math.hypot(twist.x-hand.x,twist.y-hand.y,twist.z-hand.z)<1e-5,'distal twist and palm must share the wrist endpoint');}
 const gripPose=skin.rig.pose,axis=Vec3.sub(c.analysisPose().racketHandleTop,c.analysisPose().racketGrip).normalize(),g=skin.skin;let count=0,openRadius=0,closedRadius=0;
 for(let v=0;v<g.positions.length/3;v+=3){if(![0,1,2,3].some(j=>g.boneIndices[v*4+j]===BONE.handR&&g.boneWeights[v*4+j]>.95))continue;const position=new Vec3(...g.positions.slice(v*3,v*3+3));if(Vec3.sub(position,rest.handR).len()<.085)continue;
  const radius=closed=>{const point=position.clone();if(closed)point.add(new Vec3(...g.morphs[4].slice(v*3,v*3+3)));const transformed=new Vec3();for(let j=0;j<4;j++){const weight=g.boneWeights[v*4+j];if(!weight)continue;const p=transformPoint(palette.slice(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),point);transformed.add(new Vec3(p.x*weight,p.y*weight,p.z*weight));}const delta=Vec3.sub(transformed,gripPose.handR);return delta.sub(axis.clone().scale(Vec3.dot(delta,axis))).len();};
  openRadius+=radius(false);closedRadius+=radius(true);count++;
 }
 assert(count>20);openRadius/=count;closedRadius/=count;assert(closedRadius<openRadius*.75&&closedRadius<.065,'fingers must close around the handle');const wristDeflection=Math.acos(Math.max(-1,Math.min(1,Vec3.dot(Vec3.sub(gripPose.handR,gripPose.foreArmR).normalize(),gripPose.handDirectionR))));assert(wristDeflection<.8,'ready grip must not buckle the wrist');console.log(JSON.stringify({fingerSamples:count,openRadius,closedRadius,wristDeflection}));
 const readyPose=c.analysisPose(),rotation=compose(new Vec3(),readyPose.racketRot),horizontal=transformPoint(rotation,new Vec3(RACKET.headHalfWidth,0,0)),vertical=transformPoint(rotation,new Vec3(0,RACKET.headHalfHeight,0));let minFaceClearance=Infinity;
 for(const azimuth of [-.35,0,.35])for(const x of [-.09,0,.09])for(const y of [-.10,0,.10]){
  const screen=v=>v.x*Math.cos(azimuth)-v.z*Math.sin(azimuth),point=Vec3.sub(readyPose.head,readyPose.racketCenter).add(new Vec3(x,y,0)),a=screen(horizontal),b=screen(vertical),det=a*vertical.y-b*horizontal.y,u=(screen(point)*vertical.y-b*point.y)/det,v=(a*point.y-screen(point)*horizontal.y)/det,d=u*u+v*v;minFaceClearance=Math.min(minFaceClearance,d);assert(d>1.05,'ready racket obscures the face in a front or three-quarter view');
 }
 console.log(JSON.stringify({minFaceClearance}));
 const teeth=asset.primitives.find(p=>p.materialSlot==='teeth').geometry;let fixedTeeth=0,movingTeeth=0;
 for(let v=0;v<teeth.positions.length/3;v++){const delta=Math.hypot(...teeth.morphs[1].slice(v*3,v*3+3));if(delta<1e-5)fixedTeeth++;if(delta>.002&&teeth.morphs[1][v*3+1]<0)movingTeeth++;}
 assert(fixedTeeth>100&&movingTeeth>100,'upper teeth must stay fixed while the lower jaw opens');
 const origin=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{}),translated=new Character(playerSpec('taylor'),new Vec3(3,0,-2),new Navigation([]),{});
 for(const actor of [origin,translated]){actor.trigger('ready');for(let i=0;i<180;i++)actor.update(1/120);}
 const localBones=origin.meshes().find(p=>p.rig).boneMatrices,translatedBones=translated.meshes().find(p=>p.rig).boneMatrices;assert(localBones.every((n,i)=>Math.abs(n-translatedBones[i])<1e-5),'authored hand metadata must not overwrite root-local joints');
 const skirt=asset.primitives.find(p=>p.materialSlot==='skirt').geometry;assert(skirt.positions.length>1000&&skirt.boneIndices.every((b,i)=>skirt.boneWeights[i]<.001||[BONE.pelvis,BONE.spine,BONE.chest,BONE.thighL,BONE.thighR].includes(b)),'skirt must span the hips without shin weights');
 const blinkActor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});let previousBlink=0,maxBlink=0,maxBlinkStep=0;
 for(let frame=0;frame<960;frame++){blinkActor.update(1/240);const blink=blinkActor.meshes().find(m=>m.rig).expression[2];maxBlink=Math.max(maxBlink,blink);maxBlinkStep=Math.max(maxBlinkStep,Math.abs(blink-previousBlink));previousBlink=blink;}
 assert(maxBlink>.95&&maxBlinkStep<.15,'blink must close fully without snapping shut');console.log(JSON.stringify({maxBlink,maxBlinkStep}));
 const observedHands=actor=>{const mesh=actor.meshes().find(m=>m.rig),g=mesh.skin,points=[];for(let v=0;v<g.positions.length/3;v+=9){if(![0,1,2,3].some(j=>[BONE.handL,BONE.handR].includes(g.boneIndices[v*4+j])&&g.boneWeights[v*4+j]>.8))continue;const p=new Vec3(...g.positions.slice(v*3,v*3+3));p.add(new Vec3(...g.morphs[4].slice(v*3,v*3+3)).scale(mesh.handGrip[p.x<0?0:1]));const point=new Vec3();for(let j=0;j<4;j++){const weight=g.boneWeights[v*4+j];if(!weight)continue;const q=transformPoint(mesh.boneMatrices.slice(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),p);point.add(new Vec3(q.x*weight,q.y*weight,q.z*weight));}const side=[0,1,2,3].some(j=>g.boneIndices[v*4+j]===BONE.handL&&g.boneWeights[v*4+j]>.8)?'L':'R';points.push(point.sub(mesh.rig.pose['hand'+side]));}return points;};
 // Remove legitimate hand travel to measure continuity of the retargeted surface.
 let transitionChecks=0,zeroTimeJump=0,maxHandRelativeStep=0;
 for(const [from,to] of [['idle','sit'],['sit','idle'],['idle','ready'],['ready','idle'],['idle','drink'],['drink','idle'],['ready','swingBackhand']]){
  const actor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});actor.racketStowed=false;actor.matchCompetitor=true;actor.seatDepth=.8;actor.trigger(from);for(let i=0;i<180;i++)actor.update(1/120);let before=observedHands(actor);actor.trigger(to);let after=observedHands(actor),jump=Math.max(...after.map((p,i)=>Vec3.sub(p,before[i]).len()));zeroTimeJump=Math.max(zeroTimeJump,jump);assert(jump<1e-5,'state change snapped the visible hand without advancing time');
  for(let i=0;i<45;i++){before=after;actor.update(1/120);after=observedHands(actor);const step=Math.max(...after.map((p,j)=>Vec3.sub(p,before[j]).len()));maxHandRelativeStep=Math.max(maxHandRelativeStep,step);assert(step<.06,`hand motion jumped during ${from} → ${to} at frame ${i}: ${step}`);transitionChecks++;}
  assert.deepEqual(observedHands(actor),observedHands(actor),'rendering must not advance hand acting');
 }
 for(const key of ['handRestWeight','handLapWeight','handGripL','handGripR','handRacketWeight'])assert(Math.abs(middle.pose[key]-(a.pose[key]+b.pose[key])/2)<1e-12,'capture and replay share continuous hand controls');
 console.log(JSON.stringify({transitionChecks,zeroTimeJump,maxHandRelativeStep}));
 console.log('Authored athlete loader, actual Character meshes, shared replay palette and facial interpolation PASS.');
}finally{globalThis.fetch=previousFetch;if(previousImage)globalThis.Image=previousImage;else delete globalThis.Image;}
