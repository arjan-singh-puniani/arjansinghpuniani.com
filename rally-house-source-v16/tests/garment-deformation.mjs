import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadAuthoredAthlete} from '../dist/animation/AuthoredAthlete.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {memberData} from '../dist/content/content.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,transformPoint} from '../dist/rendering/Math3D.js';
const fetchBefore=globalThis.fetch,imageBefore=globalThis.Image;
try{
 globalThis.fetch=async url=>new Response(fs.readFileSync(process.env.QA_ASSETS?new URL(url).pathname.replace(/^.*\/assets\/characters\/taylor/,process.env.QA_ASSETS):new URL(url)));
 globalThis.Image=class{naturalWidth=1024;naturalHeight=1024;async decode(){}};await loadAuthoredAthlete();
 let maxCrease95=0;
 for(const spec of [playerSpec('taylor'),...memberData.filter(c=>c.presentation==='feminine')])for(const [state,age] of [['idle',3],['swingBackhand',.2],['serve',.7]]){
  const c=new Character(spec,new Vec3(),new Navigation([]),{});c.racketStowed=state==='idle';c.matchCompetitor=!c.racketStowed;c.setAnimation('ready');c.update(.3);
  if(state==='swingBackhand')c.setIncomingContact(new Vec3(-.6,1.02,.9));if(state==='idle')c.setAnimation(state);else c.triggerShot(state,new Vec3(0,.09,5));for(let frame=0;frame<age*60;frame++)c.update(1/60);
  const mesh=c.meshes().find(m=>m.rig&&m.material==='performanceKnit'&&!m.skirt),g=mesh.skin,edges=new Map();
  const posed=v=>{const point=new Vec3(...g.positions.slice(v*3,v*3+3)),out=new Vec3();for(let j=0;j<4;j++){const w=g.boneWeights[v*4+j];if(w){const p=transformPoint(mesh.boneMatrices.slice(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),point);out.add(new Vec3(p.x,p.y,p.z).scale(w));}}return out;};
  // Compare adjacent rendered faces in the shoulder band, excluding collar/cuff boundaries.
  for(let v=0;v<g.positions.length/3;v+=3){
   const source=[0,1,2].map(k=>new Vec3(...g.positions.slice((v+k)*3,(v+k+1)*3)));if(!source.every(p=>p.y>1.66&&p.y<2.03)||!source.some(p=>Math.abs(p.x)>.14&&Math.abs(p.x)<.39))continue;
   const p=[0,1,2].map(k=>posed(v+k)),normal=Vec3.cross(Vec3.sub(p[1],p[0]),Vec3.sub(p[2],p[0]));if(normal.len()<1e-8)continue;normal.normalize();
   for(let k=0;k<3;k++){const key=[source[k],source[(k+1)%3]].map(p=>[p.x,p.y,p.z].map(n=>n.toFixed(6)).join(',')).sort().join(';');if(!edges.has(key))edges.set(key,[]);edges.get(key).push(normal);}
  }
  const angles=[...edges.values()].filter(n=>n.length===2).map(n=>Math.acos(Math.max(-1,Math.min(1,Vec3.dot(n[0],n[1]))))*180/Math.PI).sort((a,b)=>a-b);assert(angles.length>1000,'Inspect actual adjoining shoulder faces');
  const crease95=angles[Math.floor(angles.length*.95)];maxCrease95=Math.max(maxCrease95,crease95);assert(crease95<20,`${spec.id}/${state}: shoulder surface has coarse ${crease95.toFixed(1)}° hinges`);
 }
 console.log(JSON.stringify({maxCrease95}));
 console.log('Garment deformation PASS: rounded shoulder and sleeve transitions through rest and strokes across the adult women.');
}finally{globalThis.fetch=fetchBefore;globalThis.Image=imageBefore;}
