import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {Navigation} from '../dist/world/Navigation.js';
import {loadArjanUpperBody} from '../dist/animation/ArjanUpperBody.js';

globalThis.fetch=async url=>new Response(fs.readFileSync(new URL(url)));
await loadArjanUpperBody();
let frames=0,maxHandStep=0;
for(const hz of [30,60,120])for(const yaw of [0,Math.PI/2,Math.PI]){
 const c=new Character(playerSpec('arjan'),new Vec3(),new Navigation([]),{});
 c.racketStowed=true;c.yaw=c.targetYaw=yaw;
 const right=new Vec3(Math.cos(yaw),0,-Math.sin(yaw));
 let previous=null,hips=false,relaxed=false;
 for(let i=0;i<hz*20;i++){
  c.update(1/hz);const p=c.analysisPose();
  if(i<hz){previous=p;continue;}
  const shoulders=Vec3.lerp(p.shoulderL,p.shoulderR,.5),feet=Vec3.lerp(p.footL,p.footR,.5);
  assert(Math.abs(p.shoulderL.y-p.shoulderR.y)<.001,'Arjan rests with level shoulders');
  assert(Math.abs(p.hipL.y-p.hipR.y)<.001,'Arjan rests with level hips');
  assert(Math.abs(Vec3.dot(Vec3.sub(shoulders,p.pelvisCenter),right))<.005,'The torso stacks above the pelvis without a sideways hip lean');
  assert(Math.abs(Vec3.dot(Vec3.sub(p.pelvisCenter,feet),right))<.02,'Resting weight stays between both feet');
  assert(Math.abs(p.footL.y-.11)<1e-6&&Math.abs(p.footR.y-.11)<1e-6,'Both resting feet stay grounded');
  hips ||= p.handRestWeight>.99&&p.handL.y>p.pelvisCenter.y+.12&&p.handR.y>p.pelvisCenter.y+.12;
  relaxed ||= p.handRestWeight<.01&&p.handL.y<p.pelvisCenter.y&&p.handR.y<p.pelvisCenter.y;
  for(const side of ['L','R']){
   const step=Vec3.sub(p['hand'+side],previous['hand'+side]).len();maxHandStep=Math.max(maxHandStep,step);
   assert(step<.055,'The two rest poses blend without snapping the hands');
  }
  previous=p;frames++;
 }
 assert(hips&&relaxed,'Idle includes both hands-on-hips and relaxed arms-down poses');
 // A resting variation is animation only; it must never capture movement input.
 const start=c.position.clone();c.goTo(new Vec3(Math.sin(yaw)*3,0,Math.cos(yaw)*3));
 for(let i=0;i<hz;i++)c.update(1/hz);
 assert(Vec3.sub(c.position,start).len()>.5&&['walk','jog'].includes(c.state),'Movement interrupts either rest pose immediately');
}
const walks={};
for(const avatar of ['taylor','arjan']){
 const c=new Character(playerSpec(avatar),new Vec3(0,0,-8),new Navigation([]),{});
 c.racketStowed=true;c.goTo(new Vec3(0,0,8));
 let lift=0,width=0,samples=0;const steps=[];
 for(let i=0;i<60*5;i++){
  c.update(1/60);const landed=c.consumeStepEvent();if(i<60)continue;
  assert.equal(c.state,'walk','The comparison samples an actual navigable walking route');
  const p=c.analysisPose();
  lift=Math.max(lift,p.footL.y-.11,p.footR.y-.11);
  width+=Math.abs(p.footR.x-p.footL.x);if(landed)steps.push(i/60);samples++;
 }
 assert(steps.length>5);
 walks[avatar]={lift,width:width/samples,stepInterval:(steps.at(-1)-steps[0])/(steps.length-1),distance:c.position.z+8};
}
assert(walks.arjan.lift<walks.taylor.lift,'Arjan clears the floor with a lower step');
assert(walks.arjan.width>walks.taylor.width,'Arjan walks on wider, balanced foot tracks');
assert(walks.arjan.stepInterval>walks.taylor.stepInterval,'Longer steps give Arjan a more deliberate walking cadence');
assert(Math.abs(walks.arjan.distance-walks.taylor.distance)<1e-6,'The heavier walk preserves movement speed and responsiveness');
console.log(JSON.stringify({frames,maxHandStep,walks}));
console.log('Arjan stance PASS: level hips and shoulders, balanced feet, continuous rest variations and immediate movement.');
