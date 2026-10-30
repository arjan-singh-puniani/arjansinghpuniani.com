import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),repo=path.dirname(root),reference='5cab0ad46ccf5be80fa94f047b6957122df65f10';
const url=m=>pathToFileURL(path.join(root,'dist',m+'.js')).href;
function historical(module,overrides=new Map()){
 const base=url(module),code=execFileSync('git',['show',reference+':rally-house-source-v16/dist/'+module+'.js'],{cwd:repo,encoding:'utf8'}).replace(/from\s*['"](\.[^'"]+)['"]/g,(_,relative)=>{const full=new URL(relative,base).href;return "from '"+(overrides.get(full)??full)+"'";});
 return 'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
}
const oldGeometry=historical('animation/RacketGeometry'),oldBody=historical('animation/TaylorBody',new Map([[url('animation/RacketGeometry'),oldGeometry]]));
const {Character:Before}=await import(historical('entities/Character',new Map([[url('animation/RacketGeometry'),oldGeometry],[url('animation/TaylorBody'),oldBody]])));
const [{Character:After},{playerSpec},{memberData},{Navigation},{Vec3},{loadAuthoredAthlete}]=await Promise.all(['entities/Character','content/PlayerAvatars','content/content','world/Navigation','rendering/Math3D','animation/AuthoredAthlete'].map(m=>import(url(m))));
globalThis.fetch=async u=>new Response(fs.readFileSync(new URL(u)));globalThis.Image=class{async decode(){}};await loadAuthoredAthlete();
function samples(Character){
 const out=[];for(const spec of [playerSpec('taylor'),...memberData])for(const state of ['idle','walk']){
  const c=new Character(spec,new Vec3(),new Navigation([]),{});c.racketStowed=true;if(state==='walk')c.goTo(new Vec3(5,0,3));
  for(let i=0;i<180;i++){c.update(1/60);if(i%6===0)out.push({id:spec.id,state,i,pose:c.analysisPose()});}
 }return out;
}
const before=samples(Before),after=samples(After),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.equal(hash(before),'e6d03aaad90596eda58d7a78a7bd7889d4fb69c311660ef33c387977b06abba9','Recreate the previously approved baseline');
// Stowed equipment has a different attachment point; body and hand motion must stay identical.
for(const rows of [before,after])for(const row of rows)for(const key of ['racketGrip','racketCenter','racketHandleTop','racketRot'])delete row.pose[key];
assert.deepEqual(after,before);
console.log(JSON.stringify({reference,samples:after.length,bodyPoseHash:hash(after),bodyAndHandsUnchanged:true}));
