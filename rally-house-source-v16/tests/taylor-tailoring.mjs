import assert from 'node:assert/strict';
import {HUMAN_TENNIS_SKIN} from '../dist/animation/CharacterSkin.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,transformPoint} from '../dist/rendering/Math3D.js';

// Inspect the emitted boundary edges, independently of the contour generator.
function boundary(g){
 const vertices=new Map(),edges=new Map(),key=i=>[...g.positions.slice(i*3,i*3+3)].join(',');
 for(let i=0;i<g.positions.length/3;i+=3){const ids=[i,i+1,i+2];for(const v of ids)vertices.set(key(v),v);for(let j=0;j<3;j++){const pair=[key(ids[j]),key(ids[(j+1)%3])].sort().join(';');edges.set(pair,(edges.get(pair)||0)+1);}}
 const ids=new Set();for(const [edge,count] of edges)if(count===1)for(const k of edge.split(';'))ids.add(vertices.get(k));
 return [...ids];
}
let triangles=0;
for(const [name,g] of Object.entries(HUMAN_TENNIS_SKIN)){
 assert(g.positions.length/9<4500,`${name}: bounded cached garment surface`);
 for(let i=0;i<g.positions.length;i+=9){
  const a=new Vec3(...g.positions.slice(i,i+3)),b=new Vec3(...g.positions.slice(i+3,i+6)),c=new Vec3(...g.positions.slice(i+6,i+9)),cross=Vec3.cross(Vec3.sub(b,a),Vec3.sub(c,a));
  assert(cross.len()>1e-8&&Vec3.dot(cross,new Vec3(...g.normals.slice(i,i+3)))>0,`${name}: outward nondegenerate triangles`);triangles++;
 }
 for(let i=0;i<g.positions.length/3;i++){
  assert([...g.positions.slice(i*3,i*3+3)].every(Number.isFinite));assert(Math.abs(Math.hypot(...g.normals.slice(i*3,i*3+3))-1)<1e-5);
  assert(Math.abs(g.boneWeights.slice(i*4,i*4+4).reduce((a,b)=>a+b,0)-1)<1e-6);
 }
}
const dress=HUMAN_TENNIS_SKIN.dress,yoke=HUMAN_TENNIS_SKIN.yoke,dressEdge=boundary(dress).filter(i=>dress.positions[i*3+1]>1.25),yokeEdge=boundary(yoke).filter(i=>yoke.positions[i*3+1]<1.44);
assert.equal(dressEdge.length,64);assert.equal(yokeEdge.length,64);
const resting=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});resting.racketStowed=true;for(let i=0;i<180;i++)resting.update(1/60);
const rest=resting.analysisPose(),shoulderSpan=Vec3.sub(rest.shoulderL,rest.shoulderR).len();
assert(shoulderSpan>.45&&shoulderSpan<.54,'Human shoulder girdle stays within the adult garment envelope');
assert(rest.face.smile>=.55,'Relaxed club expression carries through the authoritative pose');
const pairs=dressEdge.map(i=>({i,j:yokeEdge.reduce((best,j)=>{const p=new Vec3(...dress.positions.slice(i*3,i*3+3));return Vec3.sub(p,new Vec3(...yoke.positions.slice(j*3,j*3+3))).len()<Vec3.sub(p,new Vec3(...yoke.positions.slice(best*3,best*3+3))).len()?j:best;})}));
function vertex(g,index,matrices){const p=new Vec3(...g.positions.slice(index*3,index*3+3)),out=new Vec3();for(let n=0;n<4;n++){const w=g.boneWeights[index*4+n];if(!w)continue;const b=g.boneIndices[index*4+n],v=transformPoint(matrices.slice(b*16,b*16+16),p);out.add(new Vec3(v.x,v.y,v.z).scale(w));}return out;}
let checks=0,maxNecklineGap=0;
for(const hz of [30,60,120])for(const state of ['idle','walk','serve','swingForehand','swingBackhand','reach']){
 const c=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});c.racketStowed=true;
 if(state==='reach')c.setInteractionTarget(new Vec3(.4,1.6,.4));else c.trigger(state);if(state==='walk')c.goTo(new Vec3(1,0,1));
 for(let frame=0;frame<30;frame++){
  c.update(1/hz);const meshes=c.meshes(),matrix=meshes.find(m=>m.skin===dress).boneMatrices;
  for(const {i,j} of pairs){const gap=Vec3.sub(vertex(dress,i,matrix),vertex(yoke,j,matrix)).len();maxNecklineGap=Math.max(maxNecklineGap,gap);assert(gap<.035,'Actual dress and shoulder edges remain joined during deformation');checks++;}
 }
}
console.log(JSON.stringify({garmentTriangles:triangles,necklineChecks:checks,maxNecklineGap}));
console.log('Human tailoring PASS: actual emitted surfaces, normals, weights and moving shoulder/neckline registration.');
