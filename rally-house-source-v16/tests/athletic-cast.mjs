import {supportRacketHand} from '../dist/animation/RacketGeometry.js';
import assert from 'node:assert/strict';
import {memberData} from '../dist/content/content.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Character,locomotionStyleFor} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {ATHLETE_WARDROBE,skinMatrices,rigFromPose} from '../dist/animation/CharacterSkin.js';
import {HUMAN_TAYLOR_GEOMETRY,HUMAN_FACE_VARIANTS,CAST_HAIR_GEOMETRY} from '../dist/animation/TaylorHuman.js';
import {TAYLOR_BODY} from '../dist/animation/TaylorBody.js';
import {rayBox} from '../dist/world/ObjectIdentity.js';

for(const [name,g] of [...Object.entries(ATHLETE_WARDROBE),...Object.entries(CAST_HAIR_GEOMETRY)]){
 assert(g.positions.length/9<4500,`${name}: cached mesh budget`);
 for(let i=0;i<g.positions.length;i+=3){assert([...g.positions.slice(i,i+3)].every(Number.isFinite));assert(Math.abs(Math.hypot(...g.normals.slice(i,i+3))-1)<1e-5);const index=i/3;assert(Math.abs(g.boneWeights.slice(index*4,index*4+4).reduce((a,b)=>a+b,0)-1)<1e-6);}
 for(let i=0;i<g.positions.length;i+=9){const a=new Vec3(...g.positions.slice(i,i+3)),b=new Vec3(...g.positions.slice(i+3,i+6)),c=new Vec3(...g.positions.slice(i+6,i+9));assert(Vec3.cross(Vec3.sub(b,a),Vec3.sub(c,a)).len()>1e-8,`${name}: no collapsed faces`);}
}
const specs=[...memberData,playerSpec('arjan'),playerSpec('taylor')],signatures=new Set();
const headGeometries=new Set([...Object.values(HUMAN_TAYLOR_GEOMETRY),...Object.values(CAST_HAIR_GEOMETRY),...Object.values(HUMAN_FACE_VARIANTS)]);
let poses=0,maxStretch=1,maxContactError=0,minStrokePelvis=Infinity;
for(const spec of specs){
 assert.equal(spec.appearance,'human');const actor=()=>new Character({...spec},new Vec3(),new Navigation([]),{}),c=actor();c.racketStowed=true;for(let i=0;i<180;i++)c.update(1/60);
 const rest=c.analysisPose(),parts=c.meshes(),face=parts.find(m=>m.skin===(spec.presentation==='masculine'?HUMAN_FACE_VARIANTS.masculineFace:HUMAN_TAYLOR_GEOMETRY.face));assert(face);assert.deepEqual(face.position,rest.head);
 const origin=rest.head.clone().add(new Vec3(0,0,4)),direction=new Vec3(0,0,-1);
 assert.equal(rayBox(origin,direction,{centre:new Vec3(0,.95,0),size:new Vec3(.72,1.85,.72)}),null,'Original fixed box misses the taller visible head');
 assert.notEqual(rayBox(origin,direction,c.selectionBounds()),null,'Actual head can be selected with its pose-derived bounds');
 const height=rest.head.y+.175*face.scale.y-rest.footL.y,ratio=height/(.352*face.scale.y);assert(ratio>5.5&&ratio<8,'Adult rendered head/body proportion');
 const span=Vec3.sub(rest.shoulderL,rest.shoulderR).len()/(.228*face.scale.x);assert(span>1.8&&span<2.8,'Balanced adult shoulder girdle');
 assert(parts.some(m=>m.skin===ATHLETE_WARDROBE.freeHands),'Free hands relax outside contact actions');
 assert(parts.filter(m=>m.skin&&headGeometries.has(m.skin)).reduce((sum,m)=>sum+m.skin.positions.length/9,0)<20000,'Each actual head stays below the established budget');
 signatures.add(JSON.stringify({width:face.scale.x,height:face.scale.y,skin:face.color,hair:parts.filter(m=>m.material==='groomedHair').map(m=>m.skin?.id??m.kind),wardrobe:parts.filter(m=>m.poseRig&&m.material==='fabric').map(m=>[m.skin.id,m.color])}));
 for(const hz of [30,60,120])for(const state of ['idle','walk','jog','ready','serve','swingForehand','swingBackhand','volley','sit','drink','reach','coachFeed']){
  const c=actor();c.yaw=Math.PI;
  if(state==='reach')c.setInteractionTarget(new Vec3(.3,1.42,-.5));else if(['serve','swingForehand','swingBackhand','volley'].includes(state))c.triggerShot(state,new Vec3(0,.1,-5));else c.trigger(state);
  if(state==='walk'||state==='jog')c.goTo(new Vec3(2,0,1));
  for(let i=0;i<30;i++){
   c.update(1/hz);const p=c.analysisPose();assert([...Object.values(p).filter(v=>v instanceof Vec3)].every(v=>[v.x,v.y,v.z].every(Number.isFinite)));
   for(const side of ['L','R'])for(const [a,b,length] of [[`shoulder${side}`,`elbow${side}`,TAYLOR_BODY.upperArm],[`elbow${side}`,`hand${side}`,TAYLOR_BODY.forearm],[`hip${side}`,`knee${side}`,TAYLOR_BODY.thigh],[`knee${side}`,`foot${side}`,TAYLOR_BODY.shin]]){const stretch=Vec3.sub(p[a],p[b]).len()/length;maxStretch=Math.max(maxStretch,stretch);assert(stretch>.999&&stretch<1.04,`${spec.name}/${state}: stable ${a}/${b}`);}
   if(i===29){const expected=skinMatrices(rigFromPose(p,c.position,c.yaw));for(const m of c.meshes().filter(m=>m.poseRig))assert.deepEqual(m.boneMatrices,expected,'Every actual body/garment surface shares the authoritative pose');}
   poses++;
  }
 }
 for(const stroke of ['serve','swingForehand','swingBackhand','volley']){
  const c=actor();c.setAnimation('ready');c.update(.3);if(stroke!=='serve')c.setIncomingContact(new Vec3(.76,1.02,.90));c.triggerShot(stroke,new Vec3(0,.09,-5));
  for(let i=0;i<60;i++)c.update(c.shotContactTime(stroke)/60);
  const p=c.analysisPose(),error=Vec3.sub(p.racketCenter,c.debugKinematics().contactTarget).len();maxContactError=Math.max(maxContactError,error);assert(error<1e-6,'Adult retargeting preserves actual racket contact');
  assert(!c.meshes().some(m=>m.skin===ATHLETE_WARDROBE.freeHands),'Contact actions use the racket grip, not the relaxed fingers');
 }
 for(const stroke of ['swingForehand','swingBackhand'])for(const height of [.4,.7,1.02]){
  const c=actor();c.setAnimation('ready');c.update(.3);c.setIncomingContact(new Vec3(.76,height,.9));c.triggerShot(stroke,new Vec3(0,.09,-5));
  for(let i=0;i<60;i++)c.update(c.shotContactTime(stroke)/60);
  const p=c.analysisPose();minStrokePelvis=Math.min(minStrokePelvis,p.pelvisCenter.y);
  assert(p.pelvisCenter.y>.80,`${spec.name}/${stroke}/${height}: low-ball loading keeps the pelvis above a seated squat`);
  assert(Vec3.sub(p.racketCenter,c.debugKinematics().contactTarget).len()<1e-6,'Low-ball posture preserves actual racket contact');
  for(const side of ['L','R'])assert(p[`knee${side}`].y>.25,'A loaded tennis knee stays clear of the floor');
  for(const side of ['L','R'])for(const [a,b,length] of [[`shoulder${side}`,`elbow${side}`,TAYLOR_BODY.upperArm],[`elbow${side}`,`hand${side}`,TAYLOR_BODY.forearm],[`hip${side}`,`knee${side}`,TAYLOR_BODY.thigh],[`knee${side}`,`foot${side}`,TAYLOR_BODY.shin]])assert(Math.abs(Vec3.sub(p[a],p[b]).len()/length-1)<.04,'Low-ball loading preserves anatomical segment lengths');
  assert(Vec3.dot(Vec3.sub(p.racketCenter,p.racketGrip).normalize(),c.racketContactFrame().vertical)>.995,'Groundstroke frame and handle point along the actual grip-to-head axis');
 }
}
// Waiting is an athletic stance: quiet body motion above shoes that stay on court.
for(const spec of specs)for(const hz of [30,60,120])for(const yaw of [0,.7,Math.PI]){
 const c=new Character({...spec},new Vec3(),new Navigation([]),{});c.yaw=c.targetYaw=yaw;c.matchCompetitor=true;c.trigger('ready');
 for(let i=0;i<hz;i++)c.update(1/hz);
 const first=c.analysisPose(),right=new Vec3(Math.cos(yaw),0,-Math.sin(yaw));let low=Infinity,high=-Infinity,maxGripTurn=0;const initialOffset=Vec3.sub(first.racketCenter,first.racketGrip);
 for(let i=0;i<hz*2;i++){
  c.update(1/hz);const p=c.analysisPose(),weight=Vec3.dot(p.pelvisCenter,right);low=Math.min(low,weight);high=Math.max(high,weight);
  maxGripTurn=Math.max(maxGripTurn,Vec3.sub(Vec3.sub(p.racketCenter,p.racketGrip),initialOffset).len());
  assert(Vec3.dot(Vec3.sub(p.racketCenter,p.racketGrip).normalize(),c.racketContactFrame().vertical)>.999,'Ready adjustment keeps the visible racket registered to its grip');
  const centre=Vec3.lerp(p.shoulderL,p.shoulderR,.5),forward=new Vec3(Math.sin(yaw),0,Math.cos(yaw));assert(Vec3.dot(Vec3.sub(centre,p.pelvisCenter),forward)>.045,'Ready hip hinge reaches the actual torso landmarks');
  for(const side of ['L','R']){assert(Vec3.sub(p[`foot${side}`],first[`foot${side}`]).len()<1e-8,'Ready shoes stay planted while the body breathes');assert(Math.abs(p[`foot${side}`].y-.11)<1e-8,'Ready soles remain on the court');}
  assert(Vec3.dot(Vec3.sub(p.handR,c.position),right)>.05,'Racket wrist stays on its own side, without crossed forearms');
  assert(p.handL.y>p.handR.y+.08,'Free hand supports the throat above the grip');
  assert(Vec3.sub(p.handL,supportRacketHand(p.racketGrip,p.racketCenter)).len()<.001,'Free palm follows the physical racket throat after retargeting');
  assert(p.shoulderR.y-p.shoulderL.y>.015,'Racket shoulder breaks the horizontal shoulder bar');
 }
 assert(high-low>.025&&high-low<.08,'Ready weight transfer is visible and restrained');
 assert(maxGripTurn>.035&&maxGripTurn<.15,'Waiting grip adjusts quietly while the feet stay planted');
}
for(const spec of specs)for(const hz of [30,60,120])for(const netYaw of [0,Math.PI]){
 const c=new Character({...spec},new Vec3(),new Navigation([]),{});c.yaw=c.targetYaw=netYaw;c.matchCompetitor=true;c.trigger('ready');
 for(let i=0;i<hz;i++)c.update(1/hz);
 const first=c.analysisPose(),target=new Vec3(6,1.2,netYaw===0?4:-4);c.setLook(target);
 for(let i=0;i<hz*2;i++)c.update(1/hz);
 const p=c.analysisPose();assert.equal(c.yaw,netYaw,'Attention alone cannot steer the feet');
 for(const side of ['L','R'])assert(Vec3.sub(p[`foot${side}`],first[`foot${side}`]).len()<1e-8,'Looking sideways keeps ready feet planted');
 assert(Math.abs(p.headYaw-netYaw)>Math.abs(p.torsoYaw-netYaw)+.25,'Head carries more attention than the chest');
 assert(Math.abs(p.torsoYaw-netYaw)>Math.abs(p.hipYaw-netYaw)+.08,'Chest turns more than weight-bearing pelvis');
 c.steerOnCourt(new Vec3(.01,0,0),target);for(let i=0;i<hz*2;i++)c.update(1/hz);
 assert(Math.abs(c.yaw-netYaw)<.25,'Court adjustment keeps feet oriented through the net rather than magnetized to the opponent');
}
console.log('Ready stance PASS: grounded shoes, uncrossed grip, free-hand support, shoulder slope and restrained weight transfer across the cast.');
assert.equal(signatures.size,specs.length,'Every named adult has a distinct rendered identity');
assert(new Set(memberData.map(s=>JSON.stringify(locomotionStyleFor(s.id)))).size===memberData.length,'Individual footwork styles remain distinct');
console.log(JSON.stringify({actors:specs.length,poses,maxStretch,maxContactError,minStrokePelvis,identities:signatures.size}));
console.log('Athletic cast PASS: adult proportions, distinct identities, bounded geometry, shared skin rig, anatomical motion and exact tennis contact.');

for(const spec of specs)for(const hz of [30,60,120])for(const yaw of [0,.7,Math.PI]){
 const c=new Character({...spec},new Vec3(),new Navigation([]),{});c.yaw=c.targetYaw=yaw;c.acting.setRole('exit');
 for(let i=0;i<hz*2;i++)c.update(1/hz);
 const right=new Vec3(Math.cos(yaw),0,-Math.sin(yaw)),first=c.analysisPose(),feet=Vec3.lerp(first.footL,first.footR,.5);
 assert(Vec3.dot(Vec3.sub(first.pelvisCenter,feet),right)>.04,'Rest visibly loads one leg, including after an interaction');
 for(let i=0;i<hz;i++){
  c.update(1/hz);const p=c.analysisPose();
  for(const side of ['L','R']){
   const hand=p[`hand${side}`],elbow=p[`elbow${side}`],sign=side==='L'?-1:1,offset=Vec3.sub(hand,p.pelvisCenter);
   assert(sign*Vec3.dot(offset,right)>.21&&sign*Vec3.dot(offset,right)<.29,'Resting hands stay on their own side of the waist');
   assert(offset.y>.15&&offset.y<.21,'Hands rest at waist height');
   assert(sign*Vec3.dot(Vec3.sub(elbow,hand),right)>.12,'Elbows open away from the waist');
   assert(Vec3.sub(p[`foot${side}`],first[`foot${side}`]).len()<1e-8,'Breathing cannot lift a resting shoe');
  }
 }
 let prior=c.analysisPose();c.goTo(new Vec3(Math.sin(yaw)*4,0,Math.cos(yaw)*4));
 for(let i=0;i<hz;i++){c.update(1/hz);const p=c.analysisPose();assert(Vec3.sub(p.handL,prior.handL).len()<.20,'Hands leave the waist continuously when walking begins');prior=p;}
}
console.log('Rest stance PASS: hands at the waist, open elbows, visible one-leg loading, grounded shoes, return after interactions and continuous walking departure.');
for(const spec of specs)for(const hz of [30,60,120])for(const stroke of ['serve','swingForehand','swingBackhand']){
 const c=new Character({...spec},new Vec3(),new Navigation([]),{});for(let i=0;i<hz*2;i++)c.update(1/hz);
 c.triggerShot(stroke,new Vec3(0,.1,5));const contact=c.shotContactTime(stroke);for(let i=0;i<60;i++)c.update(contact/60);
 assert(Vec3.sub(c.analysisPose().racketCenter,c.debugKinematics().contactTarget).len()<1e-6,'Leaving hands-on-waist rest preserves exact racket contact');
}
