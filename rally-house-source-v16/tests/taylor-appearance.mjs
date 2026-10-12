import assert from 'node:assert/strict';
import {TAYLOR_GEOMETRY,TAYLOR_TAIL_GEOMETRY,taylorHeadMeshes,taylorTailMeshes} from '../dist/animation/TaylorAppearance.js';
import {CHARACTER_SKIN,BONE,rigFromPose,skinMatrices} from '../dist/animation/CharacterSkin.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,transformPoint,compose} from '../dist/rendering/Math3D.js';

for(const [name,g] of Object.entries({...TAYLOR_GEOMETRY,...TAYLOR_TAIL_GEOMETRY})){
 assert.equal(g.positions.length,g.normals.length);
 assert(g.positions.length/9<3400,`${name}: bounded cached geometry`);
 for(let i=0;i<g.positions.length;i+=3){
  assert([...g.positions.slice(i,i+3)].every(Number.isFinite));
  assert(Math.abs(Math.hypot(...g.normals.slice(i,i+3))-1)<1e-5,`${name}: unit normals`);
  const vi=i/3;assert.equal(g.boneWeights[vi*4],1);assert.equal(g.boneIndices[vi*4],0);
 }
 for(let i=0;i<g.positions.length;i+=9){
  const a=new Vec3(...g.positions.slice(i,i+3)),b=new Vec3(...g.positions.slice(i+3,i+6)),c=new Vec3(...g.positions.slice(i+6,i+9));
  const cross=Vec3.cross(Vec3.sub(b,a),Vec3.sub(c,a));assert(cross.len()>1e-8,`${name}: no degenerate triangles`);
  const n=new Vec3(...g.normals.slice(i,i+3));assert(Vec3.dot(cross,n)>0,`${name}: correct front-face winding`);
 }
}
assert(Object.values(TAYLOR_GEOMETRY).reduce((sum,g)=>sum+g.positions.length/9,0)<12500,'Full head stays within its explicit geometry budget');
for(const g of Object.values(TAYLOR_TAIL_GEOMETRY))for(let i=0;i<g.positions.length;i+=3)assert(Math.hypot(...g.positions.slice(i,i+3))<.75,'The actual tail vertices fit its authored envelope');
// Independently intersect the emitted face triangles at each eye-patch
// centroid. This catches graphic fans cutting through the convex gold face,
// including during the most compressed blink; it does not reuse the generator.
const fp=TAYLOR_GEOMETRY.face.positions;
function faceDepth(x,y){
 let depth=-Infinity;
 for(let i=0;i<fp.length;i+=9){
  const ax=fp[i],ay=fp[i+1],bx=fp[i+3],by=fp[i+4],cx=fp[i+6],cy=fp[i+7];
  if(x<Math.min(ax,bx,cx)||x>Math.max(ax,bx,cx)||y<Math.min(ay,by,cy)||y>Math.max(ay,by,cy))continue;
  const det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(det)<1e-10)continue;
  const a=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/det,b=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/det,c=1-a-b;
  if(a>=-1e-5&&b>=-1e-5&&c>=-1e-5)depth=Math.max(depth,a*fp[i+2]+b*fp[i+5]+c*fp[i+8]);
 }return depth;
}
const expressions=[{smile:.12,mouthOpen:0,squint:0,browRaise:.08},{smile:.72,mouthOpen:.14,squint:.16,browRaise:.22},{smile:-.3,mouthOpen:.06,squint:.24,browRaise:-.1},{smile:.06,mouthOpen:.28,squint:0,browRaise:.58}];
const graphics=['eyeOutline','eyeWhite','pupils','eyeGlints','eyeliner','lashes','frown','smirk','smile'].map(name=>TAYLOR_GEOMETRY[name]);
for(const expression of expressions)for(const time of [0,3.28])for(const m of taylorHeadMeshes(new Vec3(),0,0,expression,time).filter(m=>'skin' in m&&graphics.includes(m.skin))){
 for(let i=0;i<m.skin.positions.length;i+=9){
  const p=m.skin.positions,x=(p[i]+p[i+3]+p[i+6])/3,y=(p[i+1]+p[i+4]+p[i+7])/3*m.scale.y+m.position.y,z=(p[i+2]+p[i+5]+p[i+8])/3;
  assert(z>faceDepth(x,y)+.001,'Expression graphics stay above the actual face surface');
 }
}
// Ear inset triangles face the camera (+Z), catching the first inverted-ear prototype.
for(let i=2;i<TAYLOR_GEOMETRY.earInlays.normals.length;i+=3)assert(TAYLOR_GEOMETRY.earInlays.normals[i]>.9);
const sourceHead=new Vec3(2,1.78,-3);
for(const yaw of [0,.7,Math.PI,4.5])for(const time of [0,.47,3.29,1000]){
 const meshes=taylorHeadMeshes(sourceHead,yaw,.08,{smile:.3,mouthOpen:.2,squint:.15,browRaise:.2},time);
 assert(meshes.every(m=>[m.position.x,m.position.y,m.position.z,...Object.values(m.scale)].every(Number.isFinite)));
 assert.deepEqual(sourceHead,new Vec3(2,1.78,-3),'Appearance never mutates the rig head');
 for(const m of taylorTailMeshes(new Vec3(0,.79,0),yaw,time,4))assert(m.position.len()<1.2,'Tail stays inside its authored envelope');
}
// Adult retargeting changes the upper-body pose; navigation, planted feet,
// animation timing and the physical hand/racket attachment remain shared.
for(const hz of [30,60,120]){
 const spec=playerSpec('taylor'),baseline=new Character({...spec,avatar:undefined},new Vec3(),new Navigation([]),{}),taylor=new Character(spec,new Vec3(),new Navigation([]),{});
 for(const state of ['idle','walk','ready','shuffle','swingForehand','swingBackhand','serve','volley','sit','drink','celebrate']){
  for(const actor of [baseline,taylor]){actor.trigger(state);if(state==='walk')actor.goTo(new Vec3(3,0,1));}
  for(let i=0;i<30;i++){
   baseline.update(1/hz);taylor.update(1/hz);taylor.meshes();const a=taylor.debugKinematics(),b=baseline.debugKinematics();
   for(const key of ['leftFoot','rightFoot','leftFootPlanted','rightFootPlanted','state','transition','locomotion','courtPhase','development','racketVibration','motionBlend'])assert.deepEqual(a[key],b[key],`${state}/${hz}: shared ${key}`);
   assert.deepEqual(a.racketGrip,a.rightHand,'Retargeted hand owns the racket');assert(Vec3.sub(Vec3.sub(a.racketCenter,a.racketGrip),Vec3.sub(b.racketCenter,b.racketGrip)).len()<1e-9,'Racket geometry is preserved');
  }
 }
}
console.log('Taylor appearance PASS: geometry, front-facing ear inlays, bounded tail, planted feet, animation timing and hand/racket ownership at 3 rates.');

// New glove surfaces stay local to their hand joints, with finite normalized skinning.
const hands=CHARACTER_SKIN.taylorHands;
for(let i=0;i<hands.positions.length/3;i++){
 const pos=new Vec3(...hands.positions.slice(i*3,i*3+3)),bone=hands.boneIndices[i*4];
 assert([BONE.handL,BONE.handR].includes(bone));
 assert(Vec3.sub(pos,new Vec3(bone===BONE.handL?-.50:.50,.94,.01)).len()<.17,'Glove fingers fit the hand envelope');
 assert(Math.abs(Math.hypot(...hands.normals.slice(i*3,i*3+3))-1)<1e-5);
 assert.equal(hands.boneWeights.slice(i*4,i*4+4).reduce((a,b)=>a+b,0),1);
}
// After settling into the cosmetic idle, visible arms return to the contact
// skeleton immediately for matches, props, reaches and social gestures.
for(const mode of ['ready','swingForehand','swingBackhand','serve','match','prop','reach','gesture']){
 const spec=playerSpec('taylor'),a=new Character(spec,new Vec3(),new Navigation([]),{}),b=new Character({...spec,avatar:undefined},new Vec3(),new Navigation([]),{});
 for(let i=0;i<120;i++){a.update(1/60);b.update(1/60);}
 assert.notDeepEqual(a.meshes().find(m=>m.skin===CHARACTER_SKIN.taylorArms).boneMatrices,b.meshes().find(m=>m.skin===CHARACTER_SKIN.arms).boneMatrices,'Idle visibly relaxes the arms');
 for(const actor of [a,b]){
  if(mode==='match')actor.matchCompetitor=true;
  else if(mode==='prop')actor.socialProp='cup';
  else if(mode==='reach')actor.setInteractionTarget(new Vec3(.3,1.1,.3));
  else if(mode==='gesture')actor.socialGesture='inspect';
  else actor.trigger(mode);
 }
 assert.deepEqual(a.meshes().find(m=>m.skin===CHARACTER_SKIN.taylorArms).boneMatrices,skinMatrices(rigFromPose(a.analysisPose(),a.position,a.yaw)),mode+': visible hands use the authoritative adult rig immediately');
}
console.log('Taylor sculpt PASS: bounded finger geometry and immediate contact/prop/reach pose restoration.');

// Independently intersect pupil sample points with the actual eye-white mesh.
// This catches graphic spill without repeating the eye generator's bounds.
function whiteAt(x,y){const p=TAYLOR_GEOMETRY.eyeWhite.positions;let z=-Infinity;for(let i=0;i<p.length;i+=9){const ax=p[i],ay=p[i+1],bx=p[i+3],by=p[i+4],cx=p[i+6],cy=p[i+7],det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(det)<1e-10)continue;const a=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/det,b=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/det,c=1-a-b;if(a>=-1e-5&&b>=-1e-5&&c>=-1e-5)z=Math.max(z,a*p[i+2]+b*p[i+5]+c*p[i+8]);}return z;}
const pupils=TAYLOR_GEOMETRY.pupils.positions;
for(let i=0;i<pupils.length;i+=9){const x=(pupils[i]+pupils[i+3]+pupils[i+6])/3,y=(pupils[i+1]+pupils[i+4]+pupils[i+7])/3,z=(pupils[i+2]+pupils[i+5]+pupils[i+8])/3,white=whiteAt(x,y);assert(Number.isFinite(white),'Every pupil triangle sits within the authored white aperture');assert(z>white+.001,'Pupils sit above the eye white');}
for(const [expression,mouth] of [[{smile:.08,mouthOpen:0,squint:0,browRaise:0},'frown'],[{smile:.72,mouthOpen:0,squint:0,browRaise:.2},'smile']])assert(taylorHeadMeshes(new Vec3(),0,0,expression,0).some(m=>m.skin===TAYLOR_GEOMETRY[mouth]),'Resting and friendly expressions retain distinct mouths');
console.log('Taylor likeness PASS: clipped pupil apertures and distinct resting/social expressions.');

// Measure closest distance to the actual 3D headdress triangles. A radial
// outer-envelope test assumes a convex cross-section and cannot validate the
// new concave cheek panels or stripe vertices at their clipped boundary.
const hood=TAYLOR_GEOMETRY.hood.positions,stripes=TAYLOR_GEOMETRY.stripes.positions,triangles=[];
for(let i=0;i<hood.length;i+=9){const a=new Vec3(...hood.slice(i,i+3)),b=new Vec3(...hood.slice(i+3,i+6)),c=new Vec3(...hood.slice(i+6,i+9)),ab=Vec3.sub(b,a),ac=Vec3.sub(c,a),n=Vec3.cross(ab,ac);triangles.push({a,b,c,ab,ac,n,nn:Vec3.dot(n,n),lo:[0,1,2].map(k=>Math.min(hood[i+k],hood[i+3+k],hood[i+6+k])-.012),hi:[0,1,2].map(k=>Math.max(hood[i+k],hood[i+3+k],hood[i+6+k])+.012)});}
function surfaceDistance(p){
 let best=Infinity;
 const segment=(a,b)=>{const d=Vec3.sub(b,a),t=Math.max(0,Math.min(1,Vec3.dot(Vec3.sub(p,a),d)/Vec3.dot(d,d)));return Vec3.sub(p,a.clone().add(d.scale(t))).len();};
 for(const t of triangles){
  if([p.x,p.y,p.z].some((v,k)=>v<t.lo[k]||v>t.hi[k]))continue;
  const h=Vec3.dot(Vec3.sub(p,t.a),t.n)/t.nn,q=p.clone().sub(t.n.clone().scale(h)),aq=Vec3.sub(q,t.a),aa=Vec3.dot(t.ab,t.ab),bb=Vec3.dot(t.ab,t.ac),cc=Vec3.dot(t.ac,t.ac),d=aa*cc-bb*bb,u=(cc*Vec3.dot(aq,t.ab)-bb*Vec3.dot(aq,t.ac))/d,v=(aa*Vec3.dot(aq,t.ac)-bb*Vec3.dot(aq,t.ab))/d;
  const distance=u>=-1e-6&&v>=-1e-6&&u+v<=1+1e-6?Vec3.sub(p,q).len():Math.min(segment(t.a,t.b),segment(t.b,t.c),segment(t.c,t.a));best=Math.min(best,distance);
 }return best;
}
let maximumStripeGap=0;
for(let i=0;i<stripes.length;i+=9){
 const points=[0,3,6].map(k=>new Vec3(...stripes.slice(i+k,i+k+3)));points.push(points.reduce((sum,p)=>sum.add(p),new Vec3()).scale(1/3));
 for(const p of points){const distance=surfaceDistance(p);maximumStripeGap=Math.max(maximumStripeGap,distance);assert(distance<.010,'Every gold band vertex and triangle centre is attached to actual headdress fabric');}
}
console.log(JSON.stringify({maximumStripeSurfaceGap:maximumStripeGap}));
console.log('Taylor attachment PASS: stripes follow actual fabric geometry.');

// The reference stance belongs to the authoritative pose, not a second render rig.
for(const hz of [30,60,120])for(const yaw of [0,.7,Math.PI]){
 const c=new Character(playerSpec('taylor'),new Vec3(2,0,-3),new Navigation([]),{});c.racketStowed=true;
 for(let i=0;i<hz*3;i++)c.update(1/hz);c.yaw=yaw;
 const p=c.analysisPose(),mesh=c.meshes().find(m=>m.skin===CHARACTER_SKIN.taylorHands),expected=skinMatrices(rigFromPose(p,c.position,yaw));
 assert.deepEqual(mesh.boneMatrices,expected,'Folded-arm skin and analysis use exactly the same landmarks');
 const localX=v=>Math.cos(yaw)*(v.x-c.position.x)-Math.sin(yaw)*(v.z-c.position.z);
 assert(localX(p.handL)>0&&localX(p.handR)<0,'Resting paws cross coherently in front of the torso');
 for(const side of ['L','R']){
  const bone=mesh.boneMatrices.slice(BONE['hand'+side]*16,BONE['hand'+side]*16+16),rest=new Vec3(side==='L'?-.50:.50,.94,.01),local=transformPoint(bone,rest),world=transformPoint(compose(mesh.position,mesh.rotation),new Vec3(local.x,local.y,local.z)),hand=p['hand'+side];
  assert(Math.hypot(world.x-hand.x,world.y-hand.y,world.z-hand.z)<1e-6,'Actual GPU hand anchors remain registered');
  for(const column of [0,4,8])assert(Math.abs(Math.hypot(...bone.slice(column,column+3))-1)<1e-6,'Paws never stretch when the forearm changes length');
 }
 c.matchCompetitor=true;const matchPose=c.analysisPose();assert(localX(matchPose.handL)<0&&localX(matchPose.handR)>0,'Match entry immediately releases the authored club fold');
}
console.log('Taylor reference stance PASS: shared GPU/analysis pose at three update rates and three rotations, rigid paw volumes, immediate match release.');
