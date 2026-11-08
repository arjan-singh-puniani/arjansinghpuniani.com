import assert from 'node:assert/strict';
import fs from 'node:fs';
import {simulation} from '../qa/sim-harness.mjs';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {memberData} from '../dist/content/content.js';
import {Vec3,rigidFrame,transformPoint} from '../dist/rendering/Math3D.js';
import {loadAuthoredAthlete,authoredArmLengths} from '../dist/animation/AuthoredAthlete.js';
import {loadArjanAuthoredHead} from '../dist/animation/ArjanAuthoredHead.js';
import {loadArjanUpperBody} from '../dist/animation/ArjanUpperBody.js';
import {hugBackContacts} from '../dist/animation/HugContact.js';
const originalFetch=globalThis.fetch,originalImage=globalThis.Image;
let checks=0,maxPalmGap=0,maxStep=0,minHeadGap=Infinity;
try{
 globalThis.fetch=async u=>new Response(fs.readFileSync(new URL(u)));globalThis.Image=class{naturalWidth=1024;naturalHeight=1024;async decode(){}};await Promise.all([loadAuthoredAthlete(),loadArjanUpperBody(),loadArjanAuthoredHead()]);
 for(const avatar of ['taylor','arjan'])for(const spec of memberData)for(const hz of [30,60,120]){
  const g=simulation();g.stopPlayerWatching=()=>{};g.player=new Character(playerSpec(avatar),new Vec3(1,0,5),g.world.nav,{});
  // Social contact must follow the shipped jersey rather than silently testing its legacy fallback.
  if(avatar==='arjan')assert.equal(g.player.meshes().filter(m=>m.skin?.id.startsWith('asset-')&&m.poseRig).length,2);
  const b=g.actor(spec.id);for(const [i,c] of g.characters.entries()){c.position.set(-9-i,0,-4);c.path=[];}b.position.set(1,0,3.8);
  Object.assign(g.relations.courtship(b.id),{flirted:true,won:true});const a=g.startConnection(b,'hug');assert(a);let previous,planted;
  for(let i=0;i<hz*9&&g.activities.active.includes(a);i++){
   g.activities.tick(1/hz);for(const c of [g.player,b])c.update(1/hz);g.updateConnection(a);
   if(a.phase!=='active')continue;
   const poses=[g.player.analysisPose(),b.analysisPose()];
   if(!planted)planted=poses.map(p=>[p.footL.clone(),p.footR.clone()]);
   for(const [index,c] of [g.player,b].entries()){
    const p=poses[index];for(const side of ['L','R']){
     const hand=p['hand'+side];assert(Vec3.sub(p['hip'+side],p['knee'+side]).len()<.566&&Vec3.sub(p['knee'+side],p['foot'+side]).len()<.556,'Weight transfer does not stretch the leg chains');assert(Object.values(p).filter(v=>v instanceof Vec3).every(v=>[v.x,v.y,v.z].every(Number.isFinite)));
     assert(Vec3.sub(p['foot'+side],planted[index][side==='L'?0:1]).len()<.001,`${avatar}/${spec.id}/${hz}/${side}/${a.phaseTime}: foot moved ${Vec3.sub(p['foot'+side],planted[index][side==='L'?0:1]).len()}`);
     if(previous){assert(Vec3.sub(p.head,previous[index].head).len()<.065,'Head settles without a positional snap');const step=Vec3.sub(hand,previous[index]['hand'+side]).len();maxStep=Math.max(maxStep,step);assert(step<.16,'Reach and release do not snap');}
     if(c.affection.weight>.999&&c.spec.presentation==='feminine'){
      const lengths=authoredArmLengths(),frame=rigidFrame(new Vec3(),p['handDirection'+side],p['handForward'+side]),offset=transformPoint(frame,lengths.palmOffsets[side]),yaw=c.yaw,palm=hand.clone().add(new Vec3(Math.cos(yaw)*offset.x+Math.sin(yaw)*offset.z,offset.y,-Math.sin(yaw)*offset.x+Math.cos(yaw)*offset.z)),back=hugBackContacts((index?g.player:b).meshes()),target=back[side==='L'?'R':'L'],gap=Vec3.sub(palm,target).len();
      maxPalmGap=Math.max(maxPalmGap,gap);assert(gap<.025,`${avatar}/${spec.id}/${hz}/${side}: palm misses shirt by ${gap}`);
      assert(Math.abs(Vec3.sub(p['wrist'+side],p['elbow'+side]).len()-lengths.wristForearm)<.003,'Native hug uses the wrist length');
     }
    }
   }
   if(g.player.affection.weight>.999){const gap=Vec3.sub(poses[0].head,poses[1].head).len();minHeadGap=Math.min(minHeadGap,gap);assert(gap>.30,'Heads have room to pass beside each other');}
   previous=poses;
  }
  assert.equal(a.phase,'completed');assert.equal(g.relations.courtship(b.id).hugs,1);assert.equal(g.player.affection,null);checks++;
 }
}finally{globalThis.fetch=originalFetch;globalThis.Image=originalImage;}
console.log(JSON.stringify({checks,maxPalmGap,maxStep,minHeadGap}));
console.log('Hug contact PASS: real shirt landmarks, native wrists, reciprocal arms, fixed feet, smooth release and completed social activity.');
