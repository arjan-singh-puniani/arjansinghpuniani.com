import {captureFrame,interpolateFrame} from '../dist/analysis/MotionCapture.js';
import assert from 'node:assert/strict';
import {RACKET,supportRacketHand,RACKET_FRAME,RACKET_STRINGS,RACKET_STENCIL,RACKET_STRING_LINES,racketMeshes,displayRacketMeshes} from '../dist/animation/RacketGeometry.js';
import {Vec3,compose,transformPoint} from '../dist/rendering/Math3D.js';
import {Renderer} from '../dist/rendering/Renderer.js';
import {World} from '../dist/world/World.js';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {memberData} from '../dist/content/content.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
const parts=racketMeshes(new Vec3(),new Vec3(),RACKET.gripDistance);
assert.equal(RACKET_STRING_LINES.filter(([a,b])=>a[0]===b[0]).length,16);
assert.equal(RACKET_STRING_LINES.filter(([a,b])=>a[1]===b[1]).length,19);
for(const [a,b] of RACKET_STRING_LINES)for(const p of [a,b]){
 assert(Math.abs((p[0]/(RACKET.headHalfWidth-.009))**2+(p[1]/(RACKET.headHalfHeight-.009))**2-1)<1e-10,'String ends meet the inner grommet contour');
}
let triangles=0;
for(const {skin:g} of parts){
 assert(g.positions.length>0&&g.positions.length%9===0);assert.equal(g.positions.length,g.normals.length);
 assert.equal(g.boneWeights.length,g.positions.length/3*4);assert(g.positions.every(Number.isFinite));
 triangles+=g.positions.length/9;
 for(let i=0;i<g.positions.length;i+=9){
  const a=new Vec3(...g.positions.slice(i,i+3)),b=new Vec3(...g.positions.slice(i+3,i+6)),c=new Vec3(...g.positions.slice(i+6,i+9));
  const cross=Vec3.cross(Vec3.sub(b,a),Vec3.sub(c,a));assert(cross.len()>1e-12,`${g.id}: no degenerate triangles`);
  assert(Vec3.dot(cross,new Vec3(...g.normals.slice(i,i+3)))>0,`${g.id}: winding agrees with normals`);
 }
 for(let i=0;i<g.normals.length;i+=3)assert(Math.abs(Math.hypot(...g.normals.slice(i,i+3))-1)<1e-5);
}
assert(parts.length<=10&&triangles<10000,'Equipment detail has a bounded draw/triangle budget');
assert.equal(parts.filter(p=>p.skin===RACKET_STENCIL).length,1,'A single stencil cannot overlap a reversed second word');
assert.equal(parts.filter(p=>p.id==='racket-string').length,1,'All 35 yielding strings share one draw');
for(let i=0;i<RACKET_STENCIL.positions.length;i+=3){
 const x=RACKET_STENCIL.positions[i],y=RACKET_STENCIL.positions[i+1];
 assert(RACKET_STRING_LINES.some(([a,b])=>a[0]===b[0]?Math.abs(x-a[0])<.0012&&y>=a[1]-.0012&&y<=b[1]+.0012:Math.abs(y-a[1])<.0012&&x>=a[0]-.0012&&x<=b[0]+.0012),'Stencil ink sits on a physical string');
}
assert(RACKET_STRINGS.morphs[0].some(v=>v>0));
for(let i=0;i<RACKET_STRINGS.positions.length;i+=3){
 const x=RACKET_STRINGS.positions[i],y=RACKET_STRINGS.positions[i+1];
 if(Math.abs(x)>.163||Math.abs(y)>.230)assert.equal(RACKET_STRINGS.morphs[0][i+2],0,'Grommet-end vertices stay fixed at impact');
}
// Calibrate the frame against the established adult figure scale and the 27-inch reference.
const metresPerUnit=1.70/2.40,total=(RACKET.gripDistance+RACKET.headHalfHeight+.065)*metresPerUnit;
assert(Math.abs(total-.685)<.01,'The longer frame retains a real adult racket length');
const headArea=Math.PI*(RACKET.headHalfWidth-.009)*(RACKET.headHalfHeight-.009)*metresPerUnit**2;
assert(Math.abs(headArea/.0645-1)<.05,'The usable head stays close to the 100-square-inch reference');
assert(RACKET.gripDistance-RACKET.supportFromGrip>RACKET.headHalfHeight&&RACKET.gripDistance-RACKET.supportFromGrip<-RACKET.handleTopY,'The support palm has a real throat attachment');
// Shop and rotated Build placements use exactly the same authored surfaces and transforms.
const center=new Vec3(2,1,-3),rot=new Vec3(0,1.2,0),shown=displayRacketMeshes(center,rot,1.3);
for(let i=0;i<parts.length;i++){
 assert.equal(shown[i].geometry,parts[i].skin);
 const local=new Vec3(...parts[i].skin.positions.slice(0,3)),p=transformPoint(compose(parts[i].position,parts[i].rotation,parts[i].scale??new Vec3(1,1,1)),local);
 const expected=transformPoint(compose(center,rot,new Vec3(1.3,1.3,1.3)),new Vec3(p.x,p.y,p.z)),actual=transformPoint(compose(shown[i].position,shown[i].rotation,shown[i].scale),local);
 assert(Math.hypot(expected.x-actual.x,expected.y-actual.y,expected.z-actual.z)<1e-6);
}
const world=new World();assert.equal(world.meshes.filter(m=>m.geometry===RACKET_FRAME).length,13);
const selection=world.objects.find(o=>o.id==='shopRack').selection;assert(selection.centre.y-selection.size.y/2<2.43-(RACKET.gripDistance+.065)*1.55,'Shop selection includes the complete longer grip');
world.placements=[{type:'racketRack',x:0,z:0,rotation:1.2}];assert.equal(world.placementMeshes().filter(m=>m.geometry===RACKET_FRAME).length,3);
assert(world.previewPlacement('racketRack',0,0,1.2,false).filter(m=>m.geometry).every(m=>m.color==='#c6796c'&&m.alpha===.68),'Invalid Build preview retains its tint and transparency');
assert(world.dynamicMeshes(0,600).some(m=>m.geometry===RACKET_FRAME),'The stringing bench has the branded racket');
const actor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});actor.matchCompetitor=true;actor.racketStowed=false;actor.setAnimation('ready');actor.update(.3);
for(const state of ['ready','swingForehand','swingBackhand','serve']){
 actor.trigger(state);actor.update(.1);const items=actor.meshes(),pose=actor.analysisPose();assert(items.some(m=>m.skin===RACKET_FRAME));
 assert(Vec3.sub(items.find(m=>m.skin===RACKET_STRINGS).position,pose.racketCenter).len()<1e-8,'Live strings keep the authoritative contact centre');
}
let gripSamples=0,maxGripError=0;
for(const spec of [playerSpec('taylor'),...memberData])for(const state of ['ready','shuffle','swingForehand','swingBackhand','serve','volley','reactMiss']){
 const c=new Character(spec,new Vec3(),new Navigation([]),{});c.matchCompetitor=true;c.racketStowed=false;c.trigger('ready');c.update(.3);if(state==='reactMiss')c.trigger('swingForehand');c.trigger(state);
 let previous;
 for(let i=0;i<30;i++){
  c.update(1/120);if(i===15)c.notifyRacketImpact('perfect');const pose=c.analysisPose(),distance=Vec3.sub(pose.racketCenter,pose.racketGrip).len();
  assert(Math.abs(distance-RACKET.gripDistance)<1e-5,`${spec.id}/${state}/${i}: length ${distance}`);
  const hand=transformPoint(compose(pose.racketCenter,pose.racketRot),new Vec3(0,-distance,0)),error=Math.hypot(hand.x-pose.racketGrip.x,hand.y-pose.racketGrip.y,hand.z-pose.racketGrip.z);maxGripError=Math.max(maxGripError,error);
  assert(error<1e-5,'The actual rigid grip must remain in the palm, including impact recoil');gripSamples++;
  const observed=captureFrame(c,i/120,null);
  if(previous){
   const middle=interpolateFrame(previous,observed,(previous.time+observed.time)/2),pose=middle.pose,axis=Vec3.sub(pose.racketCenter,pose.racketGrip);
   assert(Math.abs(axis.len()-RACKET.gripDistance)<1e-5,'Observed replay cannot shrink the frame');
   const expected=racketMeshes(pose.racketCenter,pose.racketRot,axis.len());
   for(const part of expected){const actual=middle.body.find(m=>'skin' in m&&m.skin.id===part.skin.id);assert(actual&&Vec3.sub(actual.position,part.position).len()<1e-6,'Replay keeps every racket part on the shared frame');}
  }
  previous=observed;
 }
}
// Both rigid render passes must draw the custom mesh rather than its primitive fallback.
const calls=[],culls=[],gl=new Proxy({TRIANGLES:4,CULL_FACE:2884},{get:(o,k)=>k in o?o[k]:(...a)=>{if(k==='drawArrays')calls.push(a);if(k==='enable'||k==='disable')culls.push([k,...a]);}}),renderer=Object.create(Renderer.prototype);
Object.assign(renderer,{gl,skinGeos:new Map([[RACKET_FRAME.id,{vao:'racket-vao',count:RACKET_FRAME.positions.length/3}]]),geos:new Map(),staticData:new WeakMap(),u:{},du:{},dsu:{},drawCalls:0,triangles:0,shadowCasters:0});
const item={...shown[0],position:new Vec3(0,1,0),scale:new Vec3(1,1,1)};
renderer.drawMesh({...item,doubleSided:true});renderer.drawMesh(item);assert(culls.some(a=>a[0]==='disable')&&culls.at(-1)[0]==='enable','A two-sided wordmark cannot leak disabled culling into later meshes');renderer.shadowPass([item],[],new Float32Array(16),null,64);
assert.equal(calls.length,3);assert(calls.every(a=>a[2]===RACKET_FRAME.positions.length/3),'Custom geometry is shared by colour and shadow passes');
console.log(JSON.stringify({mains:RACKET.mains,crosses:RACKET.crosses,draws:parts.length,triangles,staticRackets:13,placedRackets:3,gripSamples,maxGripError}));
console.log('Racket equipment PASS: shared frame/livery, anchored 16×19 bed, impact flex, both render passes, Build previews and live contact ownership.');
