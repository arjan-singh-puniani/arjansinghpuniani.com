import assert from 'node:assert/strict';
import {simulation} from '../qa/sim-harness.mjs';
import {World} from '../dist/world/World.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {memberData} from '../dist/content/content.js';
const world=new World(),objects=[...world.objects],transforms=JSON.stringify(world.meshes),net=world.courtDetails;
for(const weather of ['clear','cloudy','rain'])for(const minute of [480,780,1250]){world.weather=weather;assert.deepEqual(world.lighting(minute,1),world.lighting(minute,0));}
for(let i=0;i<90;i++){
 const visible=world.presentationMeshes(new Vec3(1,8,18),new Vec3(1,.74,0),1/60);
 assert.equal(visible.length,world.meshes.length);for(let j=0;j<visible.length;j++){assert.strictEqual(visible[j].position,world.meshes[j].position);assert.strictEqual(visible[j].scale,world.meshes[j].scale);}
}
assert(world.presentationMeshes(new Vec3(1,8,18),new Vec3(1,.74,0),0).every((m,i)=>m.id!=='court-pendant'||m.alpha/(world.meshes[i].alpha??1)>.1&&m.alpha/(world.meshes[i].alpha??1)<.5));
for(let i=0;i<180;i++)world.presentationMeshes(new Vec3(20,22,20),new Vec3(),1/60);
assert(world.presentationMeshes(new Vec3(20,22,20),new Vec3(),0).every((m,i)=>m.id!=='court-pendant'||m.alpha/(world.meshes[i].alpha??1)>.99));
assert.equal(JSON.stringify(world.meshes),transforms);assert.deepEqual(world.objects,objects);assert.strictEqual(world.courtDetails,net);assert(!world.meshes.some(m=>m.id==='spectatorRow'));
const tape=net.find(m=>m.skin.id.includes('bound-net-tape'));let top=-Infinity;for(let i=1;i<tape.skin.positions.length;i+=3)top=Math.max(top,tape.skin.positions[i]);assert(Math.abs(top-.94)<1e-6);
let planted=0,maxDrift=0;
for(const spec of [...memberData,playerSpec('taylor'),playerSpec('arjan')])for(const hz of [30,60,120])for(const stroke of ['swingForehand','swingBackhand','serve','volley']){
 const c=new Character(spec,new Vec3(),world.nav,{});c.setAnimation('ready');c.update(.3);c.triggerShot(stroke,new Vec3(0,.1,-5));
 for(let i=0;i<hz;i++){c.update(1/hz);const k=c.debugKinematics(),s=k.strokePlant;if(s&&s.weight>.999999){const foot=s.foot==='L'?k.leftFoot:k.rightFoot,d=Vec3.sub(foot,s.anchor).len();maxDrift=Math.max(maxDrift,d);assert(d<1e-6);assert(Math.abs(foot.y-.11)<1e-6);planted++;}}
 c.clearShotIntent();assert.equal(c.debugKinematics().strokePlant,null);
}
assert(planted>100);console.log(JSON.stringify({actors:6,plantedSamples:planted,maxPivotDrift:maxDrift,netDraws:net.length}));
console.log('World continuity PASS: permanent court/net, unchanged identities/transforms and lighting, reversible camera-only fixture fade, and registered stroke support feet.');

const g=simulation(),learner=g.characters.find(c=>c.id==='mika');learner.practiceCue='preparation';g.evidence.practicing=true;g.lessonActive=true;g.cleanupChampionship=()=>{};const a=g.activities.begin('championship',['player','leo'],'court');g.releaseActivity(a);assert.equal(learner.practiceCue,'preparation');assert(g.evidence.practicing&&g.lessonActive,'Match cleanup cannot clear nonparticipant coaching state');
