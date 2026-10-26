import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadAuthoredAthlete} from '../dist/animation/AuthoredAthlete.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {memberData} from '../dist/content/content.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,transformPoint} from '../dist/rendering/Math3D.js';
const previousFetch=globalThis.fetch,previousImage=globalThis.Image;
const sub=(a,b)=>a.map((n,i)=>n-b[i]),dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const crosses=([a,b,c],p,q)=>{const d=sub(q,p),e=sub(b,a),f=sub(c,a),h=cross(d,f),det=dot(e,h);if(Math.abs(det)<1e-10)return false;const o=sub(p,a),u=dot(o,h)/det;if(u<1e-5||u>1-1e-5)return false;const cr=cross(o,e),v=dot(d,cr)/det;if(v<1e-5||u+v>1-1e-5)return false;const t=dot(f,cr)/det;return t>1e-5&&t<1-1e-5;};
const intersects=(a,b)=>![0,1,2].some(k=>a.min[k]>b.max[k]||b.min[k]>a.max[k])&&[a,b].some((t,i)=>[0,1,2].some(j=>crosses((i?a:b).points,t.points[j],t.points[(j+1)%3])));
// Closest surface distance stays meaningful as the shoulders turn away from torsoYaw.
function nearest(p,[a,b,c]){
 const ab=sub(b,a),ac=sub(c,a),n=cross(ab,ac),nn=dot(n,n),ap=sub(p,a),d00=dot(ab,ab),d01=dot(ab,ac),d11=dot(ac,ac),denom=d00*d11-d01*d01;
 if(nn>1e-16&&denom>1e-16){const q=p.map((v,i)=>v-n[i]*dot(ap,n)/nn),aq=sub(q,a),u=(d11*dot(aq,ab)-d01*dot(aq,ac))/denom,v=(d00*dot(aq,ac)-d01*dot(aq,ab))/denom;if(u>=0&&v>=0&&u+v<=1)return {q,n};}
 let q=a,d=Infinity;for(const [start,end] of [[a,b],[b,c],[c,a]]){const edge=sub(end,start),t=Math.max(0,Math.min(1,dot(sub(p,start),edge)/Math.max(1e-16,dot(edge,edge)))),candidate=start.map((v,i)=>v+edge[i]*t),delta=sub(p,candidate),distance=dot(delta,delta);if(distance<d){d=distance;q=candidate;}}
 return {q,n};
}
assert.deepEqual(nearest([.25,.25,.2],[[0,0,0],[1,0,0],[0,1,0]]).q,[.25,.25,0]);
assert.deepEqual(nearest([2,0,.2],[[0,0,0],[1,0,0],[0,1,0]]).q,[1,0,0]);
try{
 globalThis.fetch=async url=>new Response(fs.readFileSync(new URL(url)));globalThis.Image=class{naturalWidth=1024;naturalHeight=1024;async decode(){}};await loadAuthoredAthlete();
 let checked=0,maxResidualDepth=0;
 for(const spec of [playerSpec('taylor'),...memberData.filter(c=>c.presentation==='feminine')])for(const hz of [30,60,120])for(const [state,age,depthLimit] of [['ready',1,0],['swingForehand',.35,0],['swingBackhand',.1,.005],['swingBackhand',.2,.012],['swingBackhand',.5,.010],['serve',.7,.015]]){
  const c=new Character(spec,new Vec3(),new Navigation([]),{});c.matchCompetitor=true;c.setAnimation('ready');for(let i=0;i<hz;i++)c.update(1/hz);
  if(state!=='ready'){if(state!=='serve')c.setIncomingContact(new Vec3(state==='swingBackhand'?-.6:.6,1.02,.9));c.triggerShot(state,new Vec3(0,.09,5));for(let i=0;i<Math.round(age*hz);i++)c.update(1/hz);}
  const mesh=c.meshes().find(m=>m.rig&&m.material==='performanceKnit'&&!m.skirt),g=mesh.skin,vertices=[],body=[],arms=[];assert(g.id.startsWith('asset-'),'Inspect the loaded jersey');
  const bones=Array.from({length:19},(_,i)=>mesh.boneMatrices.subarray(i*16,(i+1)*16));
  for(let v=0;v<g.positions.length/3;v++){const p=new Vec3(...g.positions.slice(v*3,v*3+3)),out=new Vec3();for(let j=0;j<4;j++){const w=g.boneWeights[v*4+j];if(w){const q=transformPoint(bones[g.boneIndices[v*4+j]],p);out.add(new Vec3(q.x,q.y,q.z).scale(w));}}vertices.push([out.x,out.y,out.z]);}
  for(let v=0;v<vertices.length;v+=3){
   if(![0,1,2].every(k=>g.uvs[(v+k)*2+1]>.5))continue;let left=0,right=0;
   for(let k=0;k<3;k++)for(let j=0;j<4;j++){const b=g.boneIndices[(v+k)*4+j],w=g.boneWeights[(v+k)*4+j]/3;if([5,6,7,17].includes(b))left+=w;if([8,9,10,18].includes(b))right+=w;}
   const points=vertices.slice(v,v+3),face={points,source:[0,1,2].map(k=>(g.positions[v*3+k]+g.positions[(v+1)*3+k]+g.positions[(v+2)*3+k])/3),min:[0,1,2].map(k=>Math.min(...points.map(p=>p[k]))),max:[0,1,2].map(k=>Math.max(...points.map(p=>p[k])))};
   (Math.max(left,right)>.25?arms:body).push(face);
  }
  const rows=new Map();for(let i=0;i<body.length;i++)for(let row=Math.floor(body[i].min[1]/.05);row<=Math.floor(body[i].max[1]/.05);row++){if(!rows.has(row))rows.set(row,[]);rows.get(row).push(i);}
  let crossings=0;const crossed=new Set();for(const arm of arms){const seen=new Set();for(let row=Math.floor(arm.min[1]/.05);row<=Math.floor(arm.max[1]/.05);row++)for(const i of rows.get(row)??[]){if(seen.has(i))continue;seen.add(i);const face=body[i];
    // Adjacent shoulder folds are separate from distant sleeve panels entering the torso.
    if(Math.hypot(...sub(arm.source,face.source))>.10&&intersects(arm,face)){crossings++;crossed.add(arm);}
  }}
  assert(body.length>100&&arms.length>100,'Inspect real torso and sleeve surfaces');
  if(!depthLimit)assert.equal(crossings,0,`${spec.id}/${state}/${age}/${hz}: sleeve crosses the jersey`);
  else{
   // Bound the actual local sleeve fold; projecting along torsoYaw inflated depth during the unit turn.
   let maxDepth=0;
   for(const face of crossed)for(const p of [...face.points,[0,1,2].map(k=>face.points.reduce((sum,v)=>sum+v[k],0)/3)]){
    let best=Infinity,signed=0;for(const torso of body){let bound=0;for(let k=0;k<3;k++){const d=Math.max(torso.min[k]-p[k],0,p[k]-torso.max[k]);bound+=d*d;}if(bound>best)continue;const {q,n}=nearest(p,torso.points),delta=sub(p,q),distance=dot(delta,delta);if(distance<best){best=distance;signed=dot(delta,n);}}
    if(signed<0)maxDepth=Math.max(maxDepth,Math.sqrt(best));
   }
   assert(maxDepth<depthLimit,`${spec.id}/${state}/${age}/${hz}: sleeve depth ${maxDepth} exceeds ${depthLimit}`);maxResidualDepth=Math.max(maxResidualDepth,maxDepth);
  }checked++;
 }
 console.log(JSON.stringify({jerseyPoses:checked,maxResidualDepth}));
}finally{globalThis.fetch=previousFetch;globalThis.Image=previousImage;}
