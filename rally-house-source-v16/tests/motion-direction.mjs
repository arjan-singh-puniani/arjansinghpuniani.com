import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const root=process.env.QA_RUNTIME?pathToFileURL(process.env.QA_RUNTIME+'/'):new URL('../',import.meta.url);
const [{Character},{playerSpec},{Navigation},{Vec3}]=await Promise.all(['entities/Character','content/PlayerAvatars','world/Navigation','rendering/Math3D'].map(p=>import(new URL('dist/'+p+'.js',root))));
const make=()=>{const c=new Character(playerSpec('arjan'),new Vec3(0,0,4),new Navigation([]),{});c.matchCompetitor=true;c.setAnimation('ready');for(let i=0;i<60;i++)c.update(1/60);return c;};
const facing=new Vec3(0,0,9),report={headSteps:{},anchored:0,airborne:0,maxLegScale:0};
// A rotating racket used to create a false loading target and a visible one-frame body rise.
for(const state of ['swingForehand','swingBackhand']){
 const c=make();c.setIncomingContact(new Vec3(state==='swingForehand'?.7:-.7,1.02,4.75));c.triggerShot(state,facing);
 let previous=c.analysisPose(),max=0;
 for(let i=0;i<60;i++){c.update(1/60);const p=c.analysisPose();max=Math.max(max,Math.abs(p.head.y-previous.head.y));previous=p;}
 assert(max<.075,`${state}: torso jumps ${max} units in one frame`);report.headSteps[state]=max;
}
// Split-step translation must preserve every solved joint and the racket relative to the hips.
{
 const c=make();c.moveOnCourt(new Vec3(2,0,4),facing,true);c.update(.05);const lifted=c.analysisPose();c.courtPhase='neutral';const grounded=c.analysisPose();
 for(const key of ['pelvisCenter','torsoCenter','head','hipL','hipR','kneeL','kneeR','footL','footR','handL','handR','racketCenter']){
  assert(Math.abs(lifted[key].y-grounded[key].y-.035)<1e-8,`${key} must share the hop`);
  assert(Math.hypot(lifted[key].x-grounded[key].x,lifted[key].z-grounded[key].z)<1e-8);
 }
}
for(const hz of [30,60,120])for(const direction of [-1,1]){
 const c=make();c.steerOnCourt(new Vec3(direction*10,0,4),facing);for(let i=0;i<hz/4;i++)c.update(1/hz);
 c.setIncomingContact(c.position.clone().add(new Vec3(direction*.8,.9,.75)));c.triggerShot(direction===1?'swingForehand':'swingBackhand',facing);
 let last=null;
 for(let i=0;i<hz*.65;i++){
  c.steerOnCourt(new Vec3(direction*10,0,4),facing);c.update(1/hz);const p=c.analysisPose(),k=c.debugKinematics();
  for(const side of ['L','R']){const planted=k[side==='L'?'leftFootPlanted':'rightFootPlanted'];if(last&&planted&&last[side]){assert(Vec3.sub(p['foot'+side],last.p['foot'+side]).len()<1e-6,'Running-stroke support shoe must stay anchored');report.anchored++;}if(!planted&&p['foot'+side].y>.12)report.airborne++;}
  for(const side of ['L','R']){report.maxLegScale=Math.max(report.maxLegScale,Vec3.sub(p['hip'+side],p['knee'+side]).len()/.56,Vec3.sub(p['knee'+side],p['foot'+side]).len()/.55);assert(p['foot'+side].y>=.109999,'Recovery shoes stay above court');}
  assert.equal(p.footPitchL,0);assert.equal(p.footPitchR,0);
  last={p,L:k.leftFootPlanted,R:k.rightFootPlanted};
 }
 const before=c.analysisPose();c.clearCourtMove();c.setAnimation('ready');c.update(0);const after=c.analysisPose();
 for(const side of ['L','R'])assert(Vec3.sub(before['foot'+side],after['foot'+side]).len()<1e-6,'Stopping a running stroke preserves the current shoe before blending');
}
assert(report.maxLegScale<1.08,'Recovery cannot create a rubbery leg');
assert(report.anchored>50&&report.airborne>50,'Running shots must actually step, not slide');console.log(JSON.stringify(report));

// Stop at different points in the step: land without horizontal drift, then accept an immediate restart.
const stops={cases:0,maxReleaseStep:0,maxRestartStep:0};
for(const hz of [30,60,120])for(const side of [-1,1])for(const travel of [.05,.13,.24,.4])for(const pause of [.05,.2]){
 const c=make(),dest=new Vec3(side*3,0,4);c.steerOnCourt(dest,facing);for(let i=0;i<Math.round(hz*.25);i++)c.update(1/hz);
 c.triggerShot(side>0?'swingForehand':'swingBackhand',facing);for(let i=0;i<Math.round(hz*travel);i++){c.steerOnCourt(dest,facing);c.update(1/hz);}
 const before=c.analysisPose(),root=c.position.clone();c.clearCourtMove();c.update(0);
 for(const leg of ['L','R'])assert(Vec3.sub(before['foot'+leg],c.analysisPose()['foot'+leg]).len()<1e-6,'Zero-time stop cannot pop a shoe');
 let previous=before;
 for(let i=0;i<Math.ceil(hz*pause);i++){
  c.update(1/hz);const p=c.analysisPose();assert(Vec3.sub(root,c.position).len()<1e-9,'Landing cannot move the player root');
  for(const leg of ['L','R']){
   const foot=p['foot'+leg],old=previous['foot'+leg],start=before['foot'+leg];
   assert(Math.hypot(foot.x-start.x,foot.z-start.z)<1e-6,'Stopping must preserve the horizontal shoe position');
   assert(foot.y<=old.y+1e-8&&foot.y>=.109999,'Receiving foot must descend without penetrating the court');
   stops.maxReleaseStep=Math.max(stops.maxReleaseStep,Vec3.sub(foot,old).len());
  }
  previous=p;
 }
 if(pause>=.2)for(const leg of ['L','R'])assert(Math.abs(previous['foot'+leg].y-.11)<1e-6,'Both shoes must land within 0.2 seconds of stopping');
 c.steerOnCourt(new Vec3(root.x-side*3,0,root.z),facing);c.update(1/hz);const resumed=c.analysisPose();
 assert(Vec3.sub(root,c.position).len()>0,'Restart must move on the first frame');
 for(const leg of ['L','R'])stops.maxRestartStep=Math.max(stops.maxRestartStep,Vec3.sub(resumed['foot'+leg],previous['foot'+leg]).len());
 stops.cases++;
}
assert(stops.maxReleaseStep<.035,'Landing must not snap vertically');
assert(stops.maxRestartStep<.08,'Restart must not snap back to the old airborne arc');
console.log(JSON.stringify(stops));
