import assert from 'node:assert/strict';
import {Character} from '../dist/entities/Character.js';import {memberData} from '../dist/content/content.js';import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Vec3} from '../dist/rendering/Math3D.js';import {Navigation} from '../dist/world/Navigation.js';
let plants=0,maxSlide=0,maxElbowOut=0,maxStopHandStep=0;const cadences=[];
for(const spec of [...memberData,playerSpec('taylor'),playerSpec('arjan')])for(const hz of [30,60,120]){
 const actor=()=>new Character({...spec},new Vec3(),new Navigation([]),{}),c=actor();c.racketStowed=true;c.goTo(new Vec3(0,0,8));let prev=null,steps=0,samples=0,elbow=0,peakLift=0;
 for(let i=0;i<hz*5;i++){
  c.update(1/hz);const p=c.analysisPose(),k=c.debugKinematics(),landed=c.consumeStepEvent();if(i<hz){prev=k;continue;}
  assert.equal(c.state,'walk');if(landed)steps++;samples++;
  const right=new Vec3(Math.cos(p.torsoYaw),0,-Math.sin(p.torsoYaw));
  assert(Vec3.dot(Vec3.sub(p.footR,p.footL),right)>.20,'Walking foot tracks do not cross');
  for(const side of ['L','R']){
   const outward=Math.abs(Vec3.dot(Vec3.sub(p[`elbow${side}`],p[`shoulder${side}`]),right));elbow+=outward;maxElbowOut=Math.max(maxElbowOut,outward);
   assert(p[`hand${side}`].y<p[`elbow${side}`].y,'Hands hang below relaxed walking elbows');
   peakLift=Math.max(peakLift,p[`foot${side}`].y-.11);assert(p[`foot${side}`].y>=.109999,'The ankle anchor stays above its ground plane');
   const key=side==='L'?'leftFoot':'rightFoot',flag=side==='L'?'leftFootPlanted':'rightFootPlanted';
   if(prev[flag]&&k[flag]){const slide=Vec3.sub(prev[key],k[key]).len();maxSlide=Math.max(maxSlide,slide);assert(slide<1e-6,'A support foot stays fixed in world space');plants++;}
  }prev=k;
 }
 const cadence=steps/4*60;assert(cadence>=100&&cadence<=160,'Calm stride cadence stays tied to actual travel');cadences.push(cadence);
 assert(elbow/(samples*2)<.065,'Walking elbows stay close to the sides');assert(peakLift>.02&&peakLift<=.045001,'Swing foot clears the floor without high stepping');
 // Real arrival blends out of authored source coordinates once, retaining
 // the same adult body and smoothly lowering the arms into idle.
 const stop=actor();stop.racketStowed=true;stop.goTo(new Vec3(0,0,2));let last=null,sawWalk=false,sawIdle=false;
 for(let i=0;i<hz*4;i++){
  stop.update(1/hz);const p=stop.analysisPose();sawWalk||=stop.state==='walk';sawIdle||=sawWalk&&stop.state==='idle';
  if(last){assert(Math.abs(p.head.y-last.head.y)<.09,'Stopping does not pop body height');for(const side of ['L','R']){const d=Vec3.sub(p[`hand${side}`],last[`hand${side}`]).len();maxStopHandStep=Math.max(maxStopHandStep,d);assert(d<.23,'Walking arms settle continuously into rest');}}
  last=p;
 }assert(sawWalk&&sawIdle);
}
assert(plants>3000);console.log(JSON.stringify({actors:6,rates:[30,60,120],plantedPairs:plants,maxSlide,maxElbowOut,maxStopHandStep,cadence:[Math.min(...cadences),Math.max(...cadences)]}));
console.log('Confident gait PASS: grounded support, lower foot clearance, travel-driven cadence, relaxed arms and continuous adult starts/stops.');
