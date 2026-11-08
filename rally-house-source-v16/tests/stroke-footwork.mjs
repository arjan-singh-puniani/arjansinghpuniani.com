import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const root=process.env.QA_RUNTIME?pathToFileURL(process.env.QA_RUNTIME+'/'):new URL('../',import.meta.url);
const [{Character},{memberData},{playerSpec},{Navigation},{Vec3,transformPoint},{loadAuthoredAthlete}]=await Promise.all(['entities/Character','content/content','content/PlayerAvatars','world/Navigation','rendering/Math3D','animation/AuthoredAthlete'].map(p=>import(new URL('dist/'+p+'.js',root))));
globalThis.fetch=async url=>new Response(fs.readFileSync(new URL(url)));globalThis.Image=class{async decode(){}};await loadAuthoredAthlete();
let samples=0,maxLift=0,maxTurn=0,maxToeDrift=0,minShoeY=Infinity;
for(const [index,spec] of [...memberData,playerSpec('taylor'),playerSpec('arjan')].entries())for(const hz of [30,60,120])for(const stroke of ['swingForehand','swingBackhand']){
 const c=new Character(spec,new Vec3(),new Navigation([]),{});c.yaw=index%2?Math.PI/2:0;c.targetYaw=c.yaw;c.matchCompetitor=true;c.setAnimation('ready');for(let i=0;i<hz;i++)c.update(1/hz);
 const direction=new Vec3(Math.sin(c.yaw),0,Math.cos(c.yaw)),outside=stroke==='swingForehand'?'R':'L',inside=outside==='R'?'L':'R';
 c.triggerShot(stroke,direction.clone().scale(5));const duration=c.shotDuration(stroke),contact=c.shotContactTime(stroke);let toeAnchor=null,peakPitch=0,peakTurn=0,landings=0,last=null;
 const times=[...Array.from({length:Math.ceil(duration*hz)},(_,i)=>Math.min((i+1)/hz,duration)),contact,duration].sort((a,b)=>a-b);
 for(const time of [...new Set(times)]){
  c.update(time-c.animTime);const p=c.analysisPose(),progress=c.animTime/duration,pitch=p['footPitch'+outside]??0,yaw=p['footYaw'+outside]??c.yaw,foot=p['foot'+outside];
  peakPitch=Math.max(peakPitch,pitch);peakTurn=Math.max(peakTurn,Math.abs(yaw-c.yaw));maxLift=Math.max(maxLift,foot.y-.11);
  if(progress<=contact/duration)assert.equal(pitch,0,'Load and impact retain flat support before releasing the heel');
  if(pitch>.02&&progress<.78){
   const depth=.28*Math.cos(pitch)-.11*Math.sin(pitch),toe=new Vec3(foot.x+Math.sin(yaw)*depth,foot.y-.11*Math.cos(pitch)-.28*Math.sin(pitch),foot.z+Math.cos(yaw)*depth);
   if(toeAnchor){const drift=Vec3.sub(toe,toeAnchor).len();maxToeDrift=Math.max(maxToeDrift,drift);assert(drift<1e-6,'An unloaded heel pivots around the planted toe without skating');}else toeAnchor=toe;
   assert(Math.abs(toe.y)<1e-6,'The toe contact stays on the floor');
   assert(Math.abs(p['foot'+inside].y-.11)<1e-6&&(p['footPitch'+inside]??0)===0,'The opposite shoe stays flat and grounded through the transfer');
  }
  if(Math.abs(time-contact)<1e-8)assert(c.debugKinematics().contactError<1e-6,'Footwork cannot steal racket contact');
  if(last){assert(Vec3.sub(foot,last).len()<.12,'The pivot and recovery step have no ankle teleport');}last=foot;
  if(c.consumeStepEvent()){landings++;assert(foot.y<.111,'The recovery shoe sounds only once it lands');}
  if(time===duration){assert(Math.abs(foot.y-.11)<1e-6);assert.equal(pitch,0,'Recovery lands flat');}
  if(pitch>.18&&spec.presentation==='feminine'){
   const mesh=c.meshes().find(m=>m.skin?.id.includes('-3-0'));assert(mesh?.rig,'Inspect the emitted shoe rig');
   assert(Math.abs(mesh.rig.pose['footForward'+outside].y+Math.sin(pitch))<1e-6,'The visible shoe must use the anatomical heel lift');
   const g=mesh.skin;
   for(let v=0;v<g.positions.length/3;v+=3){let y=0;const pos=new Vec3(...g.positions.subarray(v*3,v*3+3));for(let j=0;j<4;j++){const w=g.boneWeights[v*4+j],bone=g.boneIndices[v*4+j];if(w)y+=transformPoint(mesh.boneMatrices.subarray(bone*16,(bone+1)*16),pos).y*w;}minShoeY=Math.min(minShoeY,y);assert(y>-.004,'Pivoted shoe geometry must clear the court');}
  }
  samples++;
 }
 assert(peakPitch>.24&&peakTurn>.38,'Both groundstrokes visibly release and turn the outside heel');maxTurn=Math.max(maxTurn,peakTurn);assert.equal(landings,1,'One recovery step produces one footfall');
 c.setAnimation('ready');for(let i=0;i<hz*.5;i++)c.update(1/hz);const rest=c.analysisPose();assert.equal(rest.footPitchL,0);assert.equal(rest.footPitchR,0);
}
assert(samples>500&&maxLift>.07&&Number.isFinite(minShoeY));console.log(JSON.stringify({samples,maxLift,maxTurn,maxToeDrift,minShoeY}));
console.log('Stroke footwork PASS: flat loading, toe pivots, heel release, grounded recovery audio, rendered shoes, exact racket contact and ready return across the cast at 30/60/120 Hz.');

// Ready and shuffle share one loaded posture throughout their crossfade.
let readyTransitions=0,maxReadyJump=0,maxReadySkinJump=0;
for(const spec of [...memberData,playerSpec('taylor'),playerSpec('arjan')])for(const hz of [30,60,120])for(const [from,to] of [['ready','shuffle'],['shuffle','ready']]){
 const c=new Character(spec,new Vec3(),new Navigation([]),{});c.matchCompetitor=true;c.setAnimation(from);for(let i=0;i<hz;i++)c.update(1/hz);
 const before=c.analysisPose(),skin=c.meshes().filter(m=>m.rig).map(m=>m.boneMatrices.slice());if(to==='shuffle')c.steerOnCourt(new Vec3(1,0,0),new Vec3(0,0,5));else c.setAnimation(to);const after=c.analysisPose(),nextSkin=c.meshes().filter(m=>m.rig);
 for(const key of ['shoulderL','shoulderR','elbowL','elbowR','handL','handR','torsoCenter','head','racketCenter']){const jump=Vec3.sub(before[key],after[key]).len();maxReadyJump=Math.max(maxReadyJump,jump);assert(jump<1e-6,`${spec.id}/${hz}/${from} → ${to}: ${key} snaps by ${jump} before time advances`);}
 // Stopping may release shoe locks; the upper-body skin must remain continuous.
 for(let i=0;i<skin.length;i++)for(let j=0;j<skin[i].length;j++){if(Math.floor(j/16)>10&&Math.floor(j/16)<17)continue;const jump=Math.abs(skin[i][j]-nextSkin[i].boneMatrices[j]);maxReadySkinJump=Math.max(maxReadySkinJump,jump);assert(jump<1e-6,`${spec.id}/${hz}/${from} → ${to}: visible mesh ${i} bone ${Math.floor(j/16)} changes by ${jump}`);}
 readyTransitions++;
}
console.log(JSON.stringify({readyTransitions,maxReadyJump,maxReadySkinJump}));

let movingStops=0,maxStopJump=0,maxRestartJump=0;
for(const spec of [...memberData,playerSpec('taylor'),playerSpec('arjan')])for(const hz of [30,60,120])for(const age of [.1,.2,.35]){
 const c=new Character(spec,new Vec3(),new Navigation([]),{});c.matchCompetitor=true;c.setAnimation('ready');for(let i=0;i<hz;i++)c.update(1/hz);
 c.steerOnCourt(new Vec3(2,0,0),new Vec3(0,0,5));for(let i=0;i<Math.round(age*hz);i++)c.update(1/hz);
 const before=c.analysisPose();c.clearCourtMove();c.setAnimation('ready');const after=c.analysisPose();
 for(const key of ['shoulderL','shoulderR','elbowL','elbowR','handL','handR','torsoCenter','head','racketCenter']){const jump=Vec3.sub(before[key],after[key]).len();maxStopJump=Math.max(maxStopJump,jump);assert(jump<1e-6,`${spec.id}/${hz}/${age}: ${key} snaps when releasing court movement`);}
 c.update(1/hz);const stopped=c.analysisPose();c.steerOnCourt(new Vec3(2,0,0),new Vec3(0,0,5));const restarted=c.analysisPose();
 for(const key of ['shoulderL','shoulderR','elbowL','elbowR','handL','handR','torsoCenter','head','racketCenter']){const jump=Vec3.sub(stopped[key],restarted[key]).len();maxRestartJump=Math.max(maxRestartJump,jump);assert(jump<1e-6,`${spec.id}/${hz}/${age}: ${key} snaps when interrupting the stop transition`);}
 movingStops++;
}
console.log(JSON.stringify({movingStops,maxStopJump,maxRestartJump}));
