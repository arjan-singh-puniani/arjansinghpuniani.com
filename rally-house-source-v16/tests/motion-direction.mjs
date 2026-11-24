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
