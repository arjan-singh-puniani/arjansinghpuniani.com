import assert from 'node:assert/strict';
import {HUMAN_TAYLOR_GEOMETRY,humanTaylorHead} from '../dist/animation/TaylorHuman.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,compose,transformPoint} from '../dist/rendering/Math3D.js';
import {CHARACTER_SKIN,HUMAN_TENNIS_SKIN,skinMatrices,rigFromPose} from '../dist/animation/CharacterSkin.js';

let triangles=0;
for(const [name,g] of Object.entries(HUMAN_TAYLOR_GEOMETRY)){
 assert(g.positions.length===g.normals.length&&g.positions.length/9<6400,`${name}: finite bounded surface`);
 for(let i=0;i<g.positions.length;i+=3){assert([...g.positions.slice(i,i+3)].every(v=>Number.isFinite(v)&&Math.abs(v)<.4));assert(Math.abs(Math.hypot(...g.normals.slice(i,i+3))-1)<1e-5);}
 for(let i=0;i<g.positions.length;i+=9){const a=new Vec3(...g.positions.slice(i,i+3)),b=new Vec3(...g.positions.slice(i+3,i+6)),c=new Vec3(...g.positions.slice(i+6,i+9)),cross=Vec3.cross(Vec3.sub(b,a),Vec3.sub(c,a));assert(cross.len()>1e-10);assert(Vec3.dot(cross,new Vec3(...g.normals.slice(i,i+3)))>0,`${name}: emitted face winding`);triangles++;}
}
assert(triangles<20000,'Cached head geometry has an explicit total budget');
const edges=new Map(),faceVertices=HUMAN_TAYLOR_GEOMETRY.face.positions;
const vertexKey=i=>[...faceVertices.slice(i,i+3)].map(v=>Number(v.toFixed(6))).join(',');
for(let i=0;i<faceVertices.length;i+=9){const points=[0,3,6].map(k=>vertexKey(i+k));for(let j=0;j<3;j++){const key=[points[j],points[(j+1)%3]].sort().join(';');edges.set(key,(edges.get(key)||0)+1);}}
for(const count of edges.values())assert.equal(count,2,'The actual facial sculpt is a closed surface at crown and chin');
const expressionMeshes=expression=>humanTaylorHead(new Vec3(),0,0,{smile:0,mouthOpen:expression,squint:0,browRaise:0},0,'#ce9a7c');
const closed=expressionMeshes(0),open=expressionMeshes(.7);
assert(open.find(m=>m.skin===HUMAN_TAYLOR_GEOMETRY.lowerLip).position.y<closed.find(m=>m.skin===HUMAN_TAYLOR_GEOMETRY.lowerLip).position.y,'Speech opens the actual lips');
assert(open.find(m=>m.skin===HUMAN_TAYLOR_GEOMETRY.mouthGap).scale.y>closed.find(m=>m.skin===HUMAN_TAYLOR_GEOMETRY.mouthGap).scale.y,'Speech exposes the actual mouth opening');
// Independently intersect the emitted head, rather than trusting the relief
// function used to author facial features.
const fp=HUMAN_TAYLOR_GEOMETRY.face.positions;
function depth(x,y){let z=-Infinity;for(let i=0;i<fp.length;i+=9){const ax=fp[i],ay=fp[i+1],bx=fp[i+3],by=fp[i+4],cx=fp[i+6],cy=fp[i+7],det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(det)<1e-12)continue;const a=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/det,b=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/det,c=1-a-b;if(a>=-1e-6&&b>=-1e-6&&c>=-1e-6)z=Math.max(z,a*fp[i+2]+b*fp[i+5]+c*fp[i+8]);}return z;}
let featureChecks=0;
for(const time of [0,3.28,3.32])for(const expression of [{smile:0,mouthOpen:0,squint:0,browRaise:0},{smile:.7,mouthOpen:.3,squint:.4,browRaise:.7}]){
 const head=new Vec3(),meshes=humanTaylorHead(head,0,0,expression,time,'#ce9a7c');assert.deepEqual(head,new Vec3());
 for(const m of meshes.filter(m=>'skin' in m&&[HUMAN_TAYLOR_GEOMETRY.eyeWhite,HUMAN_TAYLOR_GEOMETRY.iris,HUMAN_TAYLOR_GEOMETRY.pupil].includes(m.skin))){const matrix=compose(m.position,m.rotation,m.scale);for(let i=0;i<m.skin.positions.length;i+=9){const points=[0,3,6].map(k=>transformPoint(matrix,new Vec3(...m.skin.positions.slice(i+k,i+k+3)))),x=points.reduce((s,v)=>s+v.x,0)/3,y=points.reduce((s,v)=>s+v.y,0)/3,z=points.reduce((s,v)=>s+v.z,0)/3;assert(z>depth(x,y)+.0001,'Eye graphics remain outside the actual sculpt, including blinks');featureChecks++;}}
}
assert.equal(playerSpec('taylor').appearance,'human');
for(const hz of [30,60,120])for(const state of ['idle','walk','serve','swingForehand','swingBackhand','sit','drink']){
 const c=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});c.racketStowed=true;c.trigger(state);if(state==='walk')c.goTo(new Vec3(1,0,1));
 for(let i=0;i<hz;i++){c.update(1/hz);const pose=c.analysisPose(),meshes=c.meshes(),face=meshes.find(m=>m.skin===HUMAN_TAYLOR_GEOMETRY.face);assert(face);assert.deepEqual(face.position,pose.head);assert(!meshes.some(m=>m.material==='toon'||m.skin?.id.includes('nemes')||m.skin?.id.includes('tail-gold')),'Shipped human appearance has no feline surfaces');const expected=skinMatrices(rigFromPose(pose,c.position,c.yaw));for(const g of [...Object.values(HUMAN_TENNIS_SKIN),CHARACTER_SKIN.taylorArms,CHARACTER_SKIN.taylorLegs,CHARACTER_SKIN.taylorBoots,CHARACTER_SKIN.taylorHands,CHARACTER_SKIN.taylorSocks,CHARACTER_SKIN.taylorWristband])assert.deepEqual(meshes.find(m=>m.skin===g).boneMatrices,expected,'Clothes and skin share the authoritative pose');}
}
console.log(JSON.stringify({headTriangles:triangles,featureChecks}));
console.log('Human Taylor PASS: bounded facial surfaces, actual eye/skin separation through blinking, human default, head attachment and registered clothing/skin across seven states and three rates.');
