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
let poses=0,maxStretch=1,maxContactError=0;
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
}
assert.equal(signatures.size,specs.length,'Every named adult has a distinct rendered identity');
assert(new Set(memberData.map(s=>JSON.stringify(locomotionStyleFor(s.id)))).size===memberData.length,'Individual footwork styles remain distinct');
console.log(JSON.stringify({actors:specs.length,poses,maxStretch,maxContactError,identities:signatures.size}));
console.log('Athletic cast PASS: adult proportions, distinct identities, bounded geometry, shared skin rig, anatomical motion and exact tennis contact.');
