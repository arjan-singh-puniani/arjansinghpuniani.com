import assert from 'node:assert/strict';
import {Character} from '../dist/entities/Character.js';import {playerSpec} from '../dist/content/PlayerAvatars.js';import {Navigation} from '../dist/world/Navigation.js';import {Vec3} from '../dist/rendering/Math3D.js';
const actor=()=>new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});
let restChecks=0,frames=0,maxElbowTravel=0,maxFlex=0;
for(const hz of [30,60,120])for(const yaw of [0,.7,Math.PI,4.9]){
 const c=actor();c.racketStowed=true;for(let i=0;i<hz*3;i++)c.update(1/hz);c.yaw=yaw;const p=c.analysisPose(),right=new Vec3(Math.cos(yaw),0,-Math.sin(yaw));
 for(const side of ['L','R']){const sign=side==='L'?-1:1,hand=p[`hand${side}`],elbow=p[`elbow${side}`],shoulder=p[`shoulder${side}`];assert(Vec3.dot(hand,right)*sign>.20,'Resting human hands remain on their own side, outside the torso');assert(hand.y<elbow.y&&elbow.y<shoulder.y,'Hands hang below elbows, below shoulders');assert(elbow.y<p.torsoCenter.y,'Resting elbows remain beside the waist rather than a reversed inherited fold');restChecks++;}
}
for(const hz of [30,60,120])for(const state of ['walk','jog','ready','shuffle','serve','swingForehand','swingBackhand','volley','sit','drink']){
 const c=actor();c.yaw=Math.PI;c.targetYaw=Math.PI;if(['serve','swingForehand','swingBackhand','volley'].includes(state))c.triggerShot(state,new Vec3(0,.1,-5));else c.trigger(state);if(state==='walk'||state==='jog')c.goTo(new Vec3(3,0,2));let prior=null;
 for(let i=0;i<hz*2;i++){c.update(1/hz);const p=c.analysisPose();for(const side of ['L','R']){const a=p[`shoulder${side}`],b=p[`elbow${side}`],d=p[`hand${side}`];assert([a,b,d].every(v=>[v.x,v.y,v.z].every(Number.isFinite)));const u=Vec3.sub(b,a).normalize(),v=Vec3.sub(d,b).normalize(),flex=Math.acos(Math.max(-1,Math.min(1,Vec3.dot(u,v))));maxFlex=Math.max(maxFlex,flex*180/Math.PI);assert(flex<160*Math.PI/180,`${state}/${hz}/${i}/${side}: elbow flex ${flex*180/Math.PI}, reach ${Vec3.sub(d,a).len()}`);if(prior&&i>hz*.35){const step=Vec3.sub(b,prior[`elbow${side}`]).len();maxElbowTravel=Math.max(maxElbowTravel,step);assert(step<.42,`${state}/${hz}/${i}/${side}: elbow step ${step}`);}}prior=p;frames++;}
}
console.log(JSON.stringify({restChecks,frames,maxElbowTravel,maxFlexDegrees:maxFlex}));console.log('Human arm anatomy PASS: same-side relaxed wrists, descending arm chains, bounded flexion and continuous elbow motion at three rates.');
