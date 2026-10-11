import assert from 'node:assert/strict';
import {TAYLOR_GEOMETRY,TAYLOR_TAIL_GEOMETRY,taylorHeadMeshes,taylorTailMeshes} from '../dist/animation/TaylorAppearance.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';

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
for(const time of [0,3.28])for(const m of taylorHeadMeshes(new Vec3(),0,0,{smile:.1,mouthOpen:0,squint:0,browRaise:0},time).filter(m=>'skin' in m&&[TAYLOR_GEOMETRY.eyeWhite,TAYLOR_GEOMETRY.pupils].includes(m.skin))){
 for(let i=0;i<m.skin.positions.length;i+=9){
  const p=m.skin.positions,x=(p[i]+p[i+3]+p[i+6])/3,y=(p[i+1]+p[i+4]+p[i+7])/3*m.scale.y+m.position.y,z=(p[i+2]+p[i+5]+p[i+8])/3;
  assert(z>faceDepth(x,y)+.001,'Eye graphics stay above the actual face surface');
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
// Appearance must not change movement, planted feet, hands, or racket contact.
for(const hz of [30,60,120]){
 const spec=playerSpec('taylor'),baseline=new Character({...spec,avatar:undefined},new Vec3(),new Navigation([]),{}),taylor=new Character(spec,new Vec3(),new Navigation([]),{});
 for(const state of ['idle','walk','ready','shuffle','swingForehand','swingBackhand','serve','volley','sit','drink','celebrate']){
  for(const actor of [baseline,taylor]){actor.trigger(state);if(state==='walk')actor.goTo(new Vec3(3,0,1));}
  for(let i=0;i<30;i++){baseline.update(1/hz);taylor.update(1/hz);taylor.meshes();assert.deepEqual(taylor.debugKinematics(),baseline.debugKinematics(),`${state}/${hz}: gameplay rig preserved`);}
 }
}
console.log('Taylor appearance PASS: geometry, front-facing ear inlays, bounded tail, and unchanged gameplay rig at 3 rates.');
