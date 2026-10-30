import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const root=process.env.QA_RUNTIME?pathToFileURL(process.env.QA_RUNTIME+'/'):new URL('../',import.meta.url);
const [{Character},{playerSpec},{Navigation},{Vec3,compose,transformPoint},{loadAuthoredAthlete},{BONE}]=await Promise.all(['entities/Character','content/PlayerAvatars','world/Navigation','rendering/Math3D','animation/AuthoredAthlete','animation/CharacterSkin'].map(p=>import(new URL('dist/'+p+'.js',root))));
globalThis.fetch=async u=>new Response(fs.readFileSync(new URL(u)));globalThis.Image=class{async decode(){}};await loadAuthoredAthlete();
function crosses(a,b,[p,q,r]){
 const d=Vec3.sub(b,a),e1=Vec3.sub(q,p),e2=Vec3.sub(r,p),h=Vec3.cross(d,e2),det=Vec3.dot(e1,h);
 if(Math.abs(det)<1e-10)return false;
 const s=Vec3.sub(a,p),u=Vec3.dot(s,h)/det;if(u<0||u>1)return false;
 const v=Vec3.dot(d,Vec3.cross(s,e1))/det;if(v<0||u+v>1)return false;
 const t=Vec3.dot(e2,Vec3.cross(s,e1))/det;return t>0&&t<1;
}
assert(crosses(new Vec3(.2,.2,-1),new Vec3(.2,.2,1),[new Vec3(),new Vec3(1,0,0),new Vec3(0,1,0)]));
assert(!crosses(new Vec3(2,2,-1),new Vec3(2,2,1),[new Vec3(),new Vec3(1,0,0),new Vec3(0,1,0)]));
let samples=0,headFaces=0,lineTests=0;
for(const hz of [30,60,120])for(const yaw of [0,Math.PI]){
 const c=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});c.yaw=c.targetYaw=yaw;c.matchCompetitor=true;c.setAnimation('ready');
 for(let i=0;i<120;i++)c.update(1/120);c.triggerShot('serve',new Vec3(0,.1,5*Math.cos(yaw)));
 for(let pre=.25;pre<=.80001;pre+=.05){
  const time=c.shotContactTime()*pre;while(c.animTime<time-1e-9)c.update(Math.min(1/hz,time-c.animTime));
  const p=c.analysisPose(),frame=compose(new Vec3(),p.racketRot),right=new Vec3(frame[0],frame[1],frame[2]),up=new Vec3(frame[4],frame[5],frame[6]);
  const lines=[[p.racketGrip,p.racketCenter]],ring=Array.from({length:33},(_,i)=>p.racketCenter.clone().add(right.clone().scale(.178*Math.cos(i*Math.PI/16))).add(up.clone().scale(.245*Math.sin(i*Math.PI/16))));
  for(let i=1;i<ring.length;i++)lines.push([ring[i-1],ring[i]]);
  for(const m of c.meshes().filter(m=>m.skin&&['humanSkin','groomedHair'].includes(m.material))){
   const g=m.skin,points=[],head=[],model=compose(m.position,m.rotation,m.scale);
   for(let v=0;v<g.positions.length/3;v++){
    const pos=new Vec3(...g.positions.subarray(v*3,v*3+3));
    for(let k=0;k<4;k++)if(g.morphs?.[k])pos.add(new Vec3(...g.morphs[k].subarray(v*3,v*3+3)).scale(m.expression?.[k]??0));
    const out=new Vec3();let hw=0;
    for(let j=0;j<4;j++){
     const w=g.boneWeights[v*4+j],bone=g.boneIndices[v*4+j];if(!w)continue;
     const q=transformPoint(m.boneMatrices.subarray(bone*16,bone*16+16),pos);out.add(new Vec3(q.x,q.y,q.z).scale(w));if(bone===BONE.head)hw+=w;
    }
    points.push(transformPoint(model,out));head.push(m.material==='groomedHair'||hw>.4);
   }
   for(let i=0;i<points.length;i+=3){
    if(!head[i]||!head[i+1]||!head[i+2])continue;headFaces++;const tri=points.slice(i,i+3);
    for(const [a,b] of lines){
     lineTests++;if(['x','y','z'].some(k=>Math.min(...tri.map(v=>v[k]))>Math.max(a[k],b[k])||Math.max(...tri.map(v=>v[k]))<Math.min(a[k],b[k])))continue;
     assert(!crosses(a,b,tri),`${hz}/${yaw}/${pre}: racket centreline crosses head/hair ${g.id}`);
    }
   }
  }
  samples++;
 }
}
assert(headFaces>1000&&lineTests>0);console.log(JSON.stringify({samples,headFaces,lineTests}));
console.log('Serve head clearance PASS: actual deformed face/hair surfaces clear the shaft and racket-rim centrelines through loading.');
