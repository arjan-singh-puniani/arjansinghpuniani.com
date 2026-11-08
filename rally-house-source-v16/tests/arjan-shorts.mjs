import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadArjanUpperBody} from '../dist/animation/ArjanUpperBody.js';
import {ATHLETE_WARDROBE} from '../dist/animation/CharacterSkin.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,transformPoint,compose} from '../dist/rendering/Math3D.js';
import {captureFrame,interpolateFrame} from '../dist/analysis/MotionCapture.js';

const g=ATHLETE_WARDROBE.arjanShorts,vertices=new Map(),edges=new Map(),neighbors=new Map();
const key=v=>Array.from(g.positions.subarray(v*3,v*3+3),n=>Math.round(n*1e6)).join(',');
for(let v=0;v<g.positions.length/3;v++){
 const k=key(v),group=vertices.get(k)??[];group.push(v);vertices.set(k,group);
 const n=g.normals.subarray(v*3,v*3+3);assert(Math.abs(Math.hypot(...n)-1)<1e-5);
 const w=g.boneWeights.subarray(v*4,v*4+4);assert(w.every(n=>n>=0&&n<=1));assert(Math.abs(w.reduce((a,b)=>a+b)-1)<1e-6);
}
for(let v=0;v<g.positions.length/3;v+=3){
 const ids=[0,1,2].map(i=>key(v+i)),p=[0,1,2].map(i=>new Vec3(...g.positions.subarray((v+i)*3,(v+i+1)*3)));
 assert(Vec3.cross(Vec3.sub(p[1],p[0]),Vec3.sub(p[2],p[0])).len()>1e-8);
 for(let i=0;i<3;i++){
  const a=ids[i],b=ids[(i+1)%3],k=[a,b].sort().join(';'),list=edges.get(k)??[];list.push([a,b]);edges.set(k,list);
  if(!neighbors.has(a))neighbors.set(a,new Set());neighbors.get(a).add(b);
 }
}
const visit=(start,graph)=>{const seen=new Set([start]),pending=[start];while(pending.length)for(const next of graph.get(pending.pop())??[])if(!seen.has(next)){seen.add(next);pending.push(next);}return seen;};
assert.equal(visit(vertices.keys().next().value,neighbors).size,vertices.size,'Waist and both legs form one connected garment');
const boundary=new Map();
for(const list of edges.values()){
 assert(list.length===1||list.length===2,'No overlapping or nonmanifold panels');
 if(list.length===2){assert.equal(list[0][0],list[1][1]);assert.equal(list[0][1],list[1][0]);}
 else for(const [a,b] of [list[0],list[0].slice().reverse()]){if(!boundary.has(a))boundary.set(a,new Set());boundary.get(a).add(b);}
}
const hemLoops=[];
let openings=0;
const remaining=new Set(boundary.keys());
while(remaining.size){
 const loop=visit(remaining.values().next().value,boundary);
 assert.equal(loop.size,24);
 const ids=[...loop].map(k=>vertices.get(k)[0]);
 if(ids.every(v=>g.positions[v*3+1]<.70))hemLoops.push(ids);
 for(const k of loop){assert.equal(boundary.get(k).size,2);remaining.delete(k);}
 openings++;
}
assert.equal(openings,3,'Only the waist and two leg hems remain open');
assert.equal(hemLoops.length,2);
const groups=[...vertices.values()].filter(group=>group.length>1);
function skin(mesh,v){const g=mesh.skin,p=new Vec3(...g.positions.subarray(v*3,v*3+3)),out=new Vec3();for(let j=0;j<4;j++){const w=g.boneWeights[v*4+j];if(w){const q=transformPoint(mesh.boneMatrices.subarray(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),p);out.add(new Vec3(q.x,q.y,q.z).scale(w));}}return out;}
const triangleKey=(mesh,v)=>['positions','normals','boneIndices','boneWeights'].flatMap(k=>{const size=k.startsWith('bone')?4:3;return Array.from(mesh[k].subarray(v*size,(v+3)*size));}).join(',');
const source=new Set();for(let v=0;v<ATHLETE_WARDROBE.legs.positions.length/3;v+=3)source.add(triangleKey(ATHLETE_WARDROBE.legs,v));
for(let v=0;v<ATHLETE_WARDROBE.arjanLegs.positions.length/3;v+=3)assert(source.has(triangleKey(ATHLETE_WARDROBE.arjanLegs,v)),'Exposed leg triangles keep their original shape, normals and weights');
function triangles(mesh,maxY=Infinity){const out=[];for(let v=0;v<mesh.skin.positions.length/3;v+=3){if(![0,1,2].every(i=>mesh.skin.positions[(v+i)*3+1]<maxY))continue;const points=[0,1,2].map(i=>skin(mesh,v+i));out.push({points,min:['x','y','z'].map(k=>Math.min(...points.map(p=>p[k]))),max:['x','y','z'].map(k=>Math.max(...points.map(p=>p[k])))});}return out;}
function crosses([a,b,c],p,q){const d=Vec3.sub(q,p),e=Vec3.sub(b,a),f=Vec3.sub(c,a),h=Vec3.cross(d,f),det=Vec3.dot(e,h);if(Math.abs(det)<1e-10)return false;const o=Vec3.sub(p,a),u=Vec3.dot(o,h)/det;if(u<1e-5||u>1-1e-5)return false;const cross=Vec3.cross(o,e),v=Vec3.dot(d,cross)/det;if(v<1e-5||u+v>1-1e-5)return false;const t=Vec3.dot(f,cross)/det;return t>1e-5&&t<1-1e-5;}
function intersects(a,b){return ![0,1,2].some(k=>a.min[k]>b.max[k]||b.min[k]>a.max[k])&&[a,b].some((t,i)=>[0,1,2].some(j=>crosses((i?a:b).points,t.points[j],t.points[(j+1)%3])));}
let frames=0,maxGap=0,clearancePoses=0;
for(const hz of [30,60,120])for(const state of ['idle','walk','serve','swingForehand','swingBackhand','sit','drink']){
 const c=new Character(playerSpec('arjan'),new Vec3(),new Navigation([]),{});c.racketStowed=['idle','walk','sit','drink'].includes(state);c.matchCompetitor=!c.racketStowed;c.setAnimation(c.racketStowed?'idle':'ready');c.update(.5);
 if(state==='walk')c.goTo(new Vec3(2,0,3));else if(state==='sit'||state==='drink')c.trigger(state);else if(state!=='idle'){if(state!=='serve')c.setIncomingContact(new Vec3(state==='swingBackhand'?-.6:.6,1.1,.9));c.triggerShot(state,new Vec3(0,.09,5));}
 let previous;
 for(let i=0;i<hz*1.5;i++){
  c.update(1/hz);const frame=captureFrame(c,i/hz,null),samples=[frame];if(previous)samples.push(interpolateFrame(previous,frame,(previous.time+frame.time)/2));
  for(const f of samples){const mesh=f.body.find(m=>m.skin===g);assert(mesh);for(const group of groups){const a=skin(mesh,group[0]);assert([a.x,a.y,a.z].every(Number.isFinite));for(const v of group.slice(1)){const gap=Vec3.sub(a,skin(mesh,v)).len();maxGap=Math.max(maxGap,gap);assert(gap<1e-6,JSON.stringify({state,hz,i,gap,sourceKey:key(v)}));}}
   // The reference hem sits above the knee; evaluate the actual deformed openings in live and replay poses.
   for(const loop of hemLoops){
    const side=g.positions[loop[0]*3]<0?'L':'R',center=new Vec3();
    for(const v of loop)center.add(skin(mesh,v));center.scale(1/loop.length);
    const world=transformPoint(compose(mesh.position,mesh.rotation??new Vec3()),center),hip=f.pose[`hip${side}`],axis=Vec3.sub(f.pose[`knee${side}`],hip);
    const fraction=Vec3.dot(Vec3.sub(new Vec3(world.x,world.y,world.z),hip),axis)/axis.len()**2;
    assert(fraction>.72&&fraction<.88,`${state}/${hz}/${i}: hem must stay above the knee, got ${fraction}`);
   }
   frames++;}
  if([Math.round(hz*.6)-1,Math.round(hz*1.1)-1,Math.ceil(hz*1.5)-1].includes(i)){
   const cloth=triangles(frame.body.find(m=>m.skin===g)),legs=[...triangles(frame.body.find(m=>m.skin===ATHLETE_WARDROBE.arjanLegs)),...triangles(frame.body.find(m=>m.skin===ATHLETE_WARDROBE.calves))];assert(legs.length>40);
   for(const a of cloth)for(const b of legs)assert(!intersects(a,b),`${state}/${hz}/${i}: exposed leg enters the shorts`);clearancePoses++;
  }
  previous=frame;
 }
}
// Test the installed polo and top opening together. A rim below the hem can be visible,
// but it must stay inside the shirt wherever both garments occupy the same height.
const originalFetch=globalThis.fetch;
try{
 globalThis.fetch=async url=>new Response(fs.readFileSync(new URL(url)));
 await loadArjanUpperBody();
}finally{globalThis.fetch=originalFetch;}
const rimY=Math.max(...g.positions.filter((_,i)=>i%3===1));
const rim=[...vertices.values()].map(group=>group[0]).filter(v=>Math.abs(g.positions[v*3+1]-rimY)<1e-5);
assert.equal(rim.length,24);
let waistbandPoses=0;
for(const state of ['idle','walk','ready','serve','swingForehand','swingBackhand','sit']){
 const actor=new Character(playerSpec('arjan'),new Vec3(1,0,5),new Navigation([]),{});
 actor.yaw=actor.targetYaw=Math.PI;
 actor.racketStowed=true;
 for(let i=0;i<180;i++)actor.update(1/120);
 if(state==='walk')actor.goTo(new Vec3(1.5,0,2));
 else if(state==='sit')actor.trigger('sit');
 else if(state!=='idle'){
  actor.racketStowed=false;
  actor.matchCompetitor=true;
  actor.setAnimation('ready');
  for(let i=0;i<60;i++)actor.update(1/120);
  if(state!=='ready'){
   if(state!=='serve')actor.setIncomingContact(new Vec3(state==='swingBackhand'?.5:1.6,1.1,4));
   actor.triggerShot(state,new Vec3(0,.1,-5));
  }
 }
 for(let frame=0;frame<=144;frame++){
  if(frame%12===0){
   const meshes=actor.meshes(),shorts=meshes.find(mesh=>mesh.skin===g);
   const polo=meshes.find(mesh=>mesh.rig&&mesh.material==='performanceKnit'&&mesh.skin.id.startsWith('asset-'));
   assert(polo&&shorts,'Use the actual loaded garments');
   const hem=triangles(polo,polo.rig.bind.pelvis.y+.14),center=polo.rig.pose.pelvis;
   assert(hem.length>20);
   for(const vertex of rim){
    const point=skin(shorts,vertex),out=new Vec3(point.x-center.x,0,point.z-center.z).normalize();
    const covered=hem.some(t=>crosses(t.points,point,point.clone().add(out)));
    const penetrated=hem.some(t=>crosses(t.points,point,point.clone().sub(out.clone().scale(.14))));
    assert(covered||!penetrated,`${state}/${frame}: waistband protrudes through the polo`);
   }
   waistbandPoses++;
  }
  actor.update(1/120);
 }
}
console.log(JSON.stringify({triangles:g.positions.length/9,openings,frames,maxSeamGap:maxGap,clearancePoses,waistbandPoses}));
console.log('Connected shorts PASS: one manifold garment, three openings, above-knee hems, thigh/calf clearance and closed moving seams at 30/60/120 Hz and in interpolated replay.');
