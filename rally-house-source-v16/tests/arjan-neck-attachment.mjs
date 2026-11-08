import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,compose,transformPoint} from '../dist/rendering/Math3D.js';
import {BONE} from '../dist/animation/CharacterSkin.js';
import {loadArjanUpperBody} from '../dist/animation/ArjanUpperBody.js';
import {loadArjanAuthoredHead} from '../dist/animation/ArjanAuthoredHead.js';
import {captureFrame,interpolateFrame} from '../dist/analysis/MotionCapture.js';

const originalFetch=globalThis.fetch,originalImage=globalThis.Image;
globalThis.fetch=async u=>new Response(fs.readFileSync(new URL(u)));
globalThis.Image=class{naturalWidth=1024;naturalHeight=1024;async decode(){}};
const metadata=JSON.parse(fs.readFileSync(new URL('../assets/characters/arjan/provenance.json',import.meta.url)));
const collar=metadata.neckContour,baseTriangles=metadata.parts.find(part=>part.material==='kit').baseTriangles;
const key=p=>[p.x,p.y,p.z].map(n=>n.toFixed(6)).join(',');
function posed(mesh,point,joints,weights){
 const p=new Vec3();for(let j=0;j<4;j++){if(!weights[j])continue;const q=transformPoint(mesh.boneMatrices.subarray(joints[j]*16,joints[j]*16+16),point);p.add(new Vec3(q.x,q.y,q.z).scale(weights[j]));}
 const q=transformPoint(compose(mesh.position,mesh.rotation,mesh.scale),p);return new Vec3(q.x,q.y,q.z);
}
function vertex(mesh,i){
 const g=mesh.skin,p=new Vec3(...g.positions.subarray(i*3,i*3+3));
 for(let c=0;c<4;c++)if(g.morphs?.[c])p.add(new Vec3(...g.morphs[c].subarray(i*3,i*3+3)).scale(mesh.expression?.[c]??0));
 return posed(mesh,p,g.boneIndices.subarray(i*4,i*4+4),g.boneWeights.subarray(i*4,i*4+4));
}
function closestPoint(p,a,b){const d=Vec3.sub(b,a),v=Vec3.sub(p,a),t=Math.max(0,Math.min(1,Vec3.dot(v,d)/Vec3.dot(d,d)));return a.clone().add(d.scale(t));}
function triangleDistance(p,[a,b,c]){
 const u=Vec3.sub(b,a),v=Vec3.sub(c,a),w=Vec3.sub(p,a),uu=Vec3.dot(u,u),uv=Vec3.dot(u,v),vv=Vec3.dot(v,v),wu=Vec3.dot(w,u),wv=Vec3.dot(w,v),det=uu*vv-uv*uv;
 if(det>1e-14){const s=(vv*wu-uv*wv)/det,t=(uu*wv-uv*wu)/det;if(s>=0&&t>=0&&s+t<=1)return Vec3.sub(p,a.clone().add(u.scale(s)).add(v.scale(t))).len();}
 return Math.min(...[[a,b],[b,c],[c,a]].map(([a,b])=>Vec3.sub(p,closestPoint(p,a,b)).len()));
}
const sampleTriangle=[new Vec3(),new Vec3(1,0,0),new Vec3(0,1,0)];
assert(Math.abs(triangleDistance(new Vec3(.2,.2,.1),sampleTriangle)-.1)<1e-9);
assert.equal(triangleDistance(new Vec3(2,0,0),sampleTriangle),1);
function boundary(g){
 const edges=new Map(),vertices=new Map();
 for(let i=0;i<g.positions.length/3;i++){const k=key(new Vec3(...g.positions.subarray(i*3,i*3+3)));vertices.set(k,i);}
 for(let i=0;i<g.positions.length/3;i+=3){const keys=[0,1,2].map(j=>key(new Vec3(...g.positions.subarray((i+j)*3,(i+j)*3+3))));for(const [a,b] of [[0,1],[1,2],[2,0]]){const pair=[keys[a],keys[b]].sort().join('|');edges.set(pair,(edges.get(pair)??0)+1);}}
 return [...new Set([...edges].filter(([,n])=>n===1).flatMap(([e])=>e.split('|')))].map(k=>vertices.get(k));
}

let checks=0,maxGap=0,replayChecks=0,lapelChecks=0,maxLapelGap=0;
try{
 await loadArjanUpperBody();
 const cases=[];
 for(const hz of [30,60,120])for(const state of ['idle','walk','serve','serve-load','swingForehand','swingBackhand'])for(const yaw of [0,Math.PI]){
  const c=new Character(playerSpec('arjan'),new Vec3(1,0,5),new Navigation([]),{});c.yaw=c.targetYaw=yaw;c.racketStowed=true;for(let i=0;i<hz;i++)c.update(1/hz);
  if(state==='walk'){c.goTo(new Vec3(2,0,4));for(let i=0;i<hz/2;i++)c.update(1/hz);}
  if(state.startsWith('swing')||state.startsWith('serve')){c.racketStowed=false;c.matchCompetitor=true;c.setAnimation('ready');for(let i=0;i<hz/2;i++)c.update(1/hz);c.triggerShot(state==='serve-load'?'serve':state,new Vec3(1,.1,0));const t=state==='serve-load'?.6:c.shotContactTime();for(let i=0;i<hz;i++)c.update(t/hz);}
  cases.push({c,pose:JSON.parse(JSON.stringify(c.analysisPose()))});
 }
 await loadArjanAuthoredHead();
 // Material seams above the nape are closed by the adjacent scalp part; the collar loop remains untouched below them.
 const first=cases[0].c.meshes().find(m=>m.neckBlend),edge=boundary(first.skin).filter(i=>first.skin.positions[i*3+1]<-.18);assert.equal(edge.length,20,'The selected donor’s open neck loop is preserved');
 // The contour must describe the actual shipped shirt, not an unrelated measurement fixture.
 const shirt=cases[0].c.meshes().find(m=>m.poseRig&&m.material==='performanceKnit');
 assert(Number.isInteger(baseTriangles)&&baseTriangles>1000&&baseTriangles<shirt.skin.positions.length/9);
 const lapel=[],chestTriangles=[],lowestRim=Math.min(...collar.map(row=>row.position[1]));
 for(let i=baseTriangles*3;i<shirt.skin.positions.length/3;i++){
  const [x,y,z]=shirt.skin.positions.subarray(i*3,i*3+3);
  if(Math.abs(x)>.025&&y<lowestRim-.02&&z>0)lapel.push(i);
 }
 for(let i=0;i<baseTriangles*3;i+=3)if([0,1,2].every(j=>shirt.skin.positions[(i+j)*3+1]>lowestRim-.2))chestTriangles.push(i);
 assert(lapel.length>12&&chestTriangles.length>30,'Check both actual collar tips against the underlying garment');
 for(const row of collar){let closest=Infinity;const p=shirt.skin.positions;for(let i=0;i<p.length;i+=3)closest=Math.min(closest,Math.hypot(p[i]-row.position[0],p[i+1]-row.position[1],p[i+2]-row.position[2]));assert(closest<2e-6,'Every collar sample belongs to the float32 rendered garment');}
 const check=body=>{
  const head=body.find(m=>m.neckBlend),shirt=body.find(m=>m.poseRig&&m.material==='performanceKnit');assert(head&&shirt);
  // The outer lapels must remain close to the shirt as the neckline and chest deform differently.
  const chest=chestTriangles.map(i=>[0,1,2].map(j=>vertex(shirt,i+j)));
  for(const i of lapel){const point=vertex(shirt,i),gap=Math.min(...chest.map(triangle=>triangleDistance(point,triangle)));maxLapelGap=Math.max(maxLapelGap,gap);assert(gap<.015,`Collar tip lifts away from the shirt: ${gap}`);lapelChecks++;}
  const rim=collar.map(row=>posed(shirt,new Vec3(...row.position),row.joints,row.weights));
  const model=compose(shirt.position,shirt.rotation),neck=transformPoint(model,shirt.rig.pose.neck),chestCenter=transformPoint(model,shirt.rig.pose.chest),up=new Vec3(neck.x-chestCenter.x,neck.y-chestCenter.y,neck.z-chestCenter.z).normalize();
  for(const i of edge){const p=vertex(head,i),closest=rim.map((a,j)=>closestPoint(p,a,rim[(j+1)%rim.length])).sort((a,b)=>Vec3.sub(p,a).len()-Vec3.sub(p,b).len())[0],delta=Vec3.sub(p,closest),gap=delta.len();assert(Number.isFinite(gap));maxGap=Math.max(maxGap,gap);assert(gap<.04,`Neck boundary detached from the actual collar: ${gap}`);assert(Vec3.dot(delta,up)<-.001,'The open neck edge must stay beneath the collar');checks++;}
  assert(!body.some(m=>m.kind==='sphere'&&Math.abs(m.scale.x-.099)<1e-6),'The redundant primitive cannot show through the authored neck');
 };
 for(const {c,pose} of cases){assert.deepEqual(JSON.parse(JSON.stringify(c.analysisPose())),pose,'The asset join cannot change the accepted walking/stance/stroke pose');check(c.meshes());}
 // A head turn changes the attachment matrices even while the torso stays still; replay must interpolate that change.
 const c=cases[0].c;c.setLook(new Vec3(-3,2,4));for(let i=0;i<30;i++)c.update(1/120);const a=captureFrame(c,0,null);c.setLook(new Vec3(5,2,4));for(let i=0;i<4;i++)c.update(1/120);const b=captureFrame(c,1/30,null);
 for(const time of [1/120,1/60,1/40]){const mid=interpolateFrame(a,b,time);check(mid.body);const x=a.body.find(m=>m.neckBlend),m=mid.body.find(m=>m.neckBlend);assert(m.boneMatrices.some((v,i)=>Math.abs(v-x.boneMatrices[i])>1e-6),'Replay cannot freeze the neck at the previous sample');assert([...m.boneMatrices].every(Number.isFinite));replayChecks++;}
 assert(first.skin.boneIndices.some((b,i)=>b!==BONE.head&&first.skin.boneWeights[i]>.1),'The test exercises a real weighted neck');
 console.log(JSON.stringify({poses:cases.length,boundarySamples:checks,maxBoundaryToCollarDistance:maxGap,replayChecks,lapelChecks,maxLapelGap}));
 console.log('Arjan neck PASS: actual shirt contour, native moving attachment, preserved poses and continuous replay.');
}finally{globalThis.fetch=originalFetch;globalThis.Image=originalImage;}
