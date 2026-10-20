import assert from 'node:assert/strict';
import {simulation} from '../qa/sim-harness.mjs';
import {RelationshipSystem} from '../dist/simulation/RelationshipSystem.js';
import {migrateGameSave,CURRENT_SAVE_VERSION} from '../dist/persistence/migrations.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {memberData} from '../dist/content/content.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';

function club(){const g=simulation();g.stopPlayerWatching=()=>{};g.player.position.set(-7,0,3.5);const c=g.actor('leo');c.position.set(-5.5,0,3.5);return {g,c};}
function tick(g,a,seconds){for(let i=0;i<seconds*60&&g.activities.active.includes(a);i++){g.activities.tick(1/60);for(const id of a.participants){const c=g.actor(id);c.crowd=[g.player,...g.characters];c.update(1/60);}g.updateConnection(a);}}
{
 const {g,c}=club();assert.equal(g.startConnection(c,'hug'),null);assert.equal(g.startConnection(c,'kiss'),null);
 const a=g.startConnection(c,'tennis');assert(a);tick(g,a,15);assert.equal(a.phase,'completed');assert(g.relations.courtship(c.id).flirted);assert.equal(g.startConnection(c,'hug'),null,'Flirting alone does not unlock cozy time');
 g.relations.courtship(c.id).won=true;
 const cancelled=g.startConnection(c,'hug');assert(cancelled);tick(g,cancelled,1);g.cancelActivity(cancelled);assert.equal(g.relations.courtship(c.id).hugs,0);assert.equal(c.affection,null);assert.equal(g.player.affection,null);
 for(let n=1;n<=2;n++){const hug=g.startConnection(c,'hug');assert(hug);assert.equal(g.startConnection(c,'hug'),null,'Busy partners cannot be double-booked');tick(g,hug,15);assert.equal(hug.phase,'completed');assert.equal(g.relations.courtship(c.id).hugs,n);if(n===1)assert.equal(g.startConnection(c,'kiss'),null);}
 const kiss=g.startConnection(c,'kiss');assert(kiss);tick(g,kiss,15);assert.equal(kiss.phase,'completed');assert.equal(g.player.affection,null);assert.equal(c.affection,null);assert(!g.activities.busy('player'));assert(!g.activities.busy(c.id));
 assert.equal(g.relations.courtship('mika').hugs,0,'Each relationship has its own progression');
 const snapshot={clock:g.clock.serialize(),coins:10,mikaProgress:28,weather:'clear',placements:[],relationships:g.relations.serialize(),player:{x:0,z:0}},saved=migrateGameSave(CURRENT_SAVE_VERSION,snapshot),loaded=new RelationshipSystem();loaded.load(saved.relationships);assert.deepEqual(loaded.courtship(c.id),{flirted:true,won:true,hugs:2});
 for(const invalid of [-1,3,1.5]){const bad=structuredClone(snapshot);bad.relationships.leo.courtship.hugs=invalid;assert.throws(()=>migrateGameSave(CURRENT_SAVE_VERSION,bad));}
 for(const invalid of [false,null,{flirted:'yes',won:true,hugs:2}]){const bad=structuredClone(snapshot);bad.relationships.leo.courtship=invalid;assert.throws(()=>migrateGameSave(CURRENT_SAVE_VERSION,bad));}
}
{
 const {g,c}=club();const a=g.startConnection(c,'bonsai');tick(g,a,15);assert.equal(a.phase,'completed');assert(g.relations.courtship(c.id).flirted);
}
{
 const {g,c}=club();g.championship={phase:'pointResult',snapshot:()=>({score:{player:0,opponent:7}})};Object.assign(g,{championshipOpponentId:c.id,championshipActivityId:'lost',championshipRound:1,championshipCompletedRound:0});
 g.rememberChampionshipResult();assert(!g.relations.courtship(c.id).won,'Incomplete matches do not count');g.championship.phase='matchResult';g.rememberChampionshipResult();assert(!g.relations.courtship(c.id).won,'Losing does not unlock cozy time');
}
for(const spec of memberData)for(const avatar of ['taylor','arjan'])for(const hz of [30,60,120])for(const kind of ['hug','kiss']){
 const nav=new Navigation([]),a=new Character(playerSpec(avatar),new Vec3(0,0,.68),nav,{}),b=new Character({...spec},new Vec3(),nav,{});a.yaw=a.targetYaw=Math.PI;b.yaw=b.targetYaw=0;
 for(const c of [a,b]){c.trigger('watch');c.racketStowed=true;}let prior=null;
 for(let i=0;i<hz*4;i++){
  const time=i/hz,weight=Math.min(1,time/.7,Math.max(0,(4-time)/.7));a.affection={kind,target:b.position,weight,upper:true};b.affection={kind,target:a.position,weight,upper:false};
  a.update(1/hz);b.update(1/hz);const p=a.analysisPose(),q=b.analysisPose();
  for(const pose of [p,q]){for(const side of ['L','R']){assert(Vec3.sub(pose[`hand${side}`],pose[`elbow${side}`]).len()<.416);assert(Vec3.sub(pose[`shoulder${side}`],pose[`elbow${side}`]).len()<.426);assert(pose[`foot${side}`].y>=0);}}
  if(prior){assert(Vec3.sub(p.handL,prior.handL).len()<.15,'Affection blends without hand snaps');assert(Vec3.sub(p.footL,prior.footL).len()<1e-6,'Affection preserves the support shoe');}prior=p;
 }
}
console.log('Connections PASS: per-person unlocks, interrupted hugs, double-booking, two completed hugs, saved progress, validation, bounded arms and grounded feet.');
