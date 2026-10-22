import assert from 'node:assert/strict';
import {RACKET} from '../dist/animation/RacketGeometry.js';
import {Character} from '../dist/entities/Character.js';import {memberData} from '../dist/content/content.js';import {playerSpec} from '../dist/content/PlayerAvatars.js';import {Navigation} from '../dist/world/Navigation.js';import {Vec3} from '../dist/rendering/Math3D.js';
const actor=()=>new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});
let restChecks=0,frames=0,maxElbowTravel=0,maxFlex=0;
for(const hz of [30,60,120])for(const yaw of [0,.7,Math.PI,4.9]){
 const c=actor();c.racketStowed=true;for(let i=0;i<hz*3;i++)c.update(1/hz);c.yaw=yaw;const p=c.analysisPose(),right=new Vec3(Math.cos(yaw),0,-Math.sin(yaw));
 for(const side of ['L','R']){const sign=side==='L'?-1:1,hand=p[`hand${side}`],elbow=p[`elbow${side}`],shoulder=p[`shoulder${side}`];assert(Vec3.dot(Vec3.sub(hand,p.pelvisCenter),right)*sign>.20,'Resting human hands remain on their own side, outside the torso');assert(hand.y<elbow.y&&elbow.y<shoulder.y,'Waist-height hands remain below elbows and shoulders');assert(Vec3.dot(Vec3.sub(elbow,hand),right)*sign>.12,'Resting elbows open outside the waist');restChecks++;}
}
for(const hz of [30,60,120])for(const state of ['walk','jog','ready','shuffle','serve','swingForehand','swingBackhand','volley','sit','drink']){
 const c=actor();c.yaw=Math.PI;c.targetYaw=Math.PI;if(['serve','swingForehand','swingBackhand','volley'].includes(state))c.triggerShot(state,new Vec3(0,.1,-5));else c.trigger(state);if(state==='walk'||state==='jog')c.goTo(new Vec3(3,0,2));let prior=null;
 for(let i=0;i<hz*2;i++){c.update(1/hz);const p=c.analysisPose();for(const side of ['L','R']){const a=p[`shoulder${side}`],b=p[`elbow${side}`],d=p[`hand${side}`];assert([a,b,d].every(v=>[v.x,v.y,v.z].every(Number.isFinite)));const u=Vec3.sub(b,a).normalize(),v=Vec3.sub(d,b).normalize(),flex=Math.acos(Math.max(-1,Math.min(1,Vec3.dot(u,v))));maxFlex=Math.max(maxFlex,flex*180/Math.PI);assert(flex<160*Math.PI/180,`${state}/${hz}/${i}/${side}: elbow flex ${flex*180/Math.PI}, reach ${Vec3.sub(d,a).len()}`);if(prior&&i>hz*.35){const step=Vec3.sub(b,prior[`elbow${side}`]).len();maxElbowTravel=Math.max(maxElbowTravel,step);assert(step<.42,`${state}/${hz}/${i}/${side}: elbow step ${step}`);}}prior=p;frames++;}
}
console.log(JSON.stringify({restChecks,frames,maxElbowTravel,maxFlexDegrees:maxFlex}));console.log('Human arm anatomy PASS: same-side relaxed wrists, descending arm chains, bounded flexion and continuous elbow motion at three rates.');

for(const spec of [...memberData,playerSpec('arjan'),playerSpec('taylor')])for(const hz of [30,60,120])for(const stroke of ['serve','swingForehand','swingBackhand']){
 const c=new Character(spec,new Vec3(),new Navigation([]),{});c.matchCompetitor=true;c.trigger('ready');for(let i=0;i<hz;i++)c.update(1/hz);c.triggerShot(stroke,new Vec3(0,.1,5));
 let tossHeight=0,lastShaft;
 while(c.animTime<c.shotDuration(stroke)*.98){
  const dt=Math.min(1/hz,c.shotDuration(stroke)*.98-c.animTime);c.update(dt);const p=c.analysisPose(),shaft=Vec3.sub(p.racketCenter,p.racketGrip).normalize();tossHeight=Math.max(tossHeight,p.handL.y-p.head.y);
  if(stroke!=='serve'&&lastShaft&&dt>1e-6&&c.animTime>c.shotContactTime(stroke)+.02)assert(Math.acos(Math.max(-1,Math.min(1,Vec3.dot(lastShaft,shaft))))/dt<26,'Follow-through must rotate without a snapping shaft reversal');
  lastShaft=shaft;
 }
 const p=c.analysisPose();
 if(stroke==='serve'){assert(tossHeight>.25,'Serve shows an extended tossing arm');assert(p.handL.y<p.shoulderL.y-.15&&p.handR.y<p.shoulderR.y-.15,'Serve lowers both arms into the finish');}
 else{const right=new Vec3(Math.cos(p.torsoYaw),0,-Math.sin(p.torsoYaw)),across=Vec3.dot(Vec3.sub(p.handR,p.torsoCenter),right);assert(p.handR.y>p.shoulderR.y-.05,'Groundstroke releases at shoulder height');assert(stroke==='swingForehand'?across<-.1:across>.1,'Forehand and backhand finish across opposite shoulders');assert(Vec3.dot(Vec3.sub(p.racketCenter,p.racketGrip).normalize(),c.racketContactFrame().vertical)>.995,'Follow-through racket head and handle share their actual axis');if(stroke==='swingBackhand')assert(Vec3.sub(p.handL,p.handR.clone().add(Vec3.sub(p.racketHandleTop,p.racketGrip).normalize().scale(RACKET.handSpacing))).len()<1e-6,'Backhand keeps the second palm on the physical handle');}
}
console.log('Stroke release PASS: toss to lowered-arm recovery, opposite shoulder finishes, two-hand backhand and registered racket axes across the cast.');
