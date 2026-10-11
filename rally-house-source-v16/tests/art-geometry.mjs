import assert from 'node:assert/strict';
import {foliageGeometry} from '../dist/rendering/FoliageGeometry.js';
import {CHARACTER_SKIN} from '../dist/animation/CharacterSkin.js';
import {World} from '../dist/world/World.js';
import {Vec3} from '../dist/rendering/Math3D.js';
const world=new World();
assert(world.nav.isBlocked(7.77,-7.23),'The observed shelf-clipping location is physically blocked');
for(const [from,to] of [[new Vec3(9,0,-6),new Vec3(-9,0,-4.5)],[new Vec3(9,0,-6),new Vec3(-8,0,8.7)]]){
 const route=world.nav.clubPath(from,to);assert(route.length,'Shop circulation still reaches tea and the entrance');
 for(let i=0;i<route.length;i++){
  const a=i?route[i-1]:from,b=route[i];
  for(let t=0;t<=1;t+=.02){const p=Vec3.lerp(a,b,t);assert(!(p.x>6.7&&p.x<11.7&&p.z>-8.125&&p.z<-6.575),'Route clears the display plus actor radius');}
 }
}
const foliage=foliageGeometry();
for(const [name,g] of Object.entries(CHARACTER_SKIN))for(let i=0;i<g.positions.length;i+=9){
 const a=g.positions.slice(i,i+3),u=g.positions.slice(i+3,i+6).map((n,j)=>n-a[j]),v=g.positions.slice(i+6,i+9).map((n,j)=>n-a[j]);
 const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 assert(cross.reduce((d,n,j)=>d+n*(g.normals[i+j]+g.normals[i+j+3]+g.normals[i+j+6]),0)>0,`${name}: outward winding, including descending hems`);
}
assert.deepEqual(foliage,foliageGeometry(),'Cached canopy generation is deterministic');
assert.equal(foliage.positions.length,foliage.normals.length);
assert(foliage.positions.length/9<=560,'Leaf silhouettes fit the previous sphere triangle budget');
for(let i=0;i<foliage.positions.length;i+=3){
 assert([...foliage.positions.slice(i,i+3)].every(n=>Number.isFinite(n)&&Math.abs(n)<.5),'Canopy fits its existing selection envelope');
 assert(Math.abs(Math.hypot(...foliage.normals.slice(i,i+3))-1)<1e-5,'Finite unit normals on both leaf faces');
}
for(let i=0;i<foliage.positions.length;i+=9){
 const p=foliage.positions,a=p.slice(i,i+3),u=p.slice(i+3,i+6).map((v,j)=>v-a[j]),v=p.slice(i+6,i+9).map((n,j)=>n-a[j]);
 assert(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-6,'No degenerate pointed-leaf triangles');
}
// Knee/elbow/waist joint rings must coincide in bind space. Matching positions
// and weights give exactly the same deformation for every runtime bone pose.
function jointRing(skin,segment,half,end,segments){
 const first=(segment*segments*12+half*segments*6)*3,vertices=[];
 for(let i=first;i<first+segments*18;i+=3){
  const vi=i/3,w=skin.boneWeights.slice(vi*4,vi*4+4);
  if(w[end]>.999){const key=[...skin.positions.slice(i,i+3),...skin.boneIndices.slice(vi*4,vi*4+4),...w].map(v=>v.toFixed(5)).join(',');vertices.push(key);}
 }return new Set(vertices);
}
for(const [name,seg,pairs] of [['pants',10,[[0,1],[2,3]]],['arms',10,[[0,1],[2,3]]],['top',12,[[0,1]]],['feminineTop',12,[[0,1]]]]){
 for(const [a,b] of pairs){
  const left=jointRing(CHARACTER_SKIN[name],a,1,1,seg),right=jointRing(CHARACTER_SKIN[name],b,0,0,seg);
  assert.equal(left.size,seg);assert.equal(right.size,seg);
  // The duplicate secondary bone has zero weight; compare the authoritative bone only.
  const normalize=set=>[...set].map(k=>{const n=k.split(',');return [...n.slice(0,3),n[Number(n[7])>.99?3:4]].join(',');}).sort();
  assert.deepEqual(normalize(left),normalize(right),`${name}: adjacent joint ring closes`);
 }
}
console.log('Art geometry PASS: bounded non-degenerate foliage and sealed skinned joint rings');

// Weld by position and effective weights: a boot may only have its top and ankle openings.
const boot=CHARACTER_SKIN.taylorBoots,edges=new Map(),adj=new Map();
function weldKey(i){const effective=new Map();for(let k=0;k<4;k++){const b=boot.boneIndices[i*4+k],w=boot.boneWeights[i*4+k];if(w>1e-6)effective.set(b,(effective.get(b)||0)+w);}return [...boot.positions.slice(i*3,i*3+3)].map(v=>v.toFixed(5)).join(',')+'|'+[...effective].sort((a,b)=>a[0]-b[0]).map(([b,w])=>b+':'+w.toFixed(5)).join(',');}
for(let i=0;i<boot.positions.length/3;i+=3){const tri=[0,1,2].map(j=>weldKey(i+j));for(let j=0;j<3;j++){const edge=[tri[j],tri[(j+1)%3]].sort().join(';');edges.set(edge,(edges.get(edge)||0)+1);}}
for(const [edge,count] of edges){assert(count<=2,'Boot surface is manifold');if(count===1){const [a,b]=edge.split(';');for(const [u,v] of [[a,b],[b,a]]){if(!adj.has(u))adj.set(u,new Set());adj.get(u).add(v);}}}
for(const neighbors of adj.values())assert.equal(neighbors.size,2,'Open boot boundaries are closed loops');
const visited=new Set();let loops=0;for(const start of adj.keys()){if(visited.has(start))continue;loops++;const todo=[start];while(todo.length){const v=todo.pop();if(visited.has(v))continue;visited.add(v);todo.push(...adj.get(v));}}
assert.equal(loops,4,'Two boots have only top and ankle rims; knee seams stay sealed');
