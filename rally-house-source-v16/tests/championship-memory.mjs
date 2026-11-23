import assert from 'node:assert/strict';
import {CharacterMind,MEMBERS} from '../dist/simulation/CharacterMind.js';
import {SceneGrammar} from '../dist/simulation/SceneGrammar.js';
import {RelationshipSystem} from '../dist/simulation/RelationshipSystem.js';
import {migrateGameSave,CURRENT_SAVE_VERSION} from '../dist/persistence/migrations.js';
import {EverydayLife} from '../dist/simulation/EverydayLife.js';
import {simulation} from '../qa/sim-harness.mjs';
const grammar=new SceneGrammar(),rel=new RelationshipSystem();
const context={day:2,minute:700,weather:'clear',free:new Set(MEMBERS),positions:{},schedule:{},intentions:[],relationship:(a,b)=>rel.getBetween(a,b),favorite:()=>false,available:()=>true,objects:[],usualKnown:false};
for(const id of ['leo','mika','nia']){
 const m=new CharacterMind(),before=structuredClone(m.states);
 assert(m.recordChampionship('result',id,false,2,'Player 7–5 opponent'));
 assert(m.states[id].practice>before[id].practice);assert(m.states[id].confidence<before[id].confidence);
 for(const other of MEMBERS.filter(v=>v!==id))assert.deepEqual(m.states[other],before[other],'Only the participant changes');
 const state=m.serialize();assert(!m.recordChampionship('result',id,false,2,'Duplicate'));assert.deepEqual(m.serialize(),state);
 const restored=new CharacterMind();restored.load(JSON.parse(JSON.stringify(state)));
 const scene=grammar.compose(restored,context).find(s=>s.family==='championship-followup');
 assert.equal(scene.place,'warmup');assert(scene.beats.some(b=>b.poses?.[id]==='shuffle'),'A loss produces actual recovery practice');
 assert(!grammar.compose(restored,{...context,free:new Set()}).some(s=>s.eventId),'Reservations remain authoritative');
 assert(restored.events[0].pending.includes(id),'An interrupted scene stays pending');
 assert(restored.complete(scene,'practice-completed',2));assert(!restored.complete(scene,'practice-completed',2));
 assert.equal(restored.events[0].pending.length,0);
 const again=new CharacterMind();again.load(restored.serialize());assert(!grammar.compose(again,context).some(s=>s.eventId==='result'));
 const malformed=restored.serialize();malformed.events[0].winner='invented';assert.throws(()=>new CharacterMind().load(malformed),/invalid/);
}
const old={clock:{minutes:600,day:2,speed:1,paused:false},coins:17,mikaProgress:44,player:{x:0,z:0},relationships:{},mind:new CharacterMind().serialize()};
assert.equal(CURRENT_SAVE_VERSION,12);assert.deepEqual(migrateGameSave(11,old).mind,old.mind);
assert.throws(()=>migrateGameSave(13,old),/newer version/);
// Follow the real director through travel, practice and completion; no manually completed scene.
const g=simulation();g.schedule.update=()=>{};g.everyday.next=0;g.history.nextSocial=g.history.nextObject=1e12;
for(const a of [...g.activities.active])g.cancelActivity(a);
for(const c of g.characters){c.path=[];c.setAnimation('idle');c.yieldUntil=1e12;}
g.mind.recordChampionship('real-followup','leo',false,g.clock.day,'Player 7–5 Leo');
let practiced=false,completed=false;
for(let n=0;n<60*180&&!completed;n++){
 g.updateFixed(1/60);
 const a=g.activities.active.find(a=>a.participants.includes('leo'));
 if(a?.kind==='everyday'&&g.actor('leo').state==='shuffle')practiced=true;
 completed=!g.mind.events.find(e=>e.id==='real-followup').pending.length;
}
assert(practiced&&completed,'The actual club director must schedule and finish recovery practice');
// Per-match scene IDs must expire from the director too, not just the bounded mind history.
const director=new EverydayLife();
for(let n=0;n<100;n++){const id=`championship-result-${n}`;director.cooldowns[id]=1;director.counts[id]=1;}
director.cooldowns['championship-new']=300;director.counts['championship-new']=1;director.counts.grip=4;
director.tick(60);assert.deepEqual(Object.keys(director.cooldowns),['championship-new']);assert.deepEqual(director.counts,{'championship-new':1,grip:4});
// A player can finish a match after autonomous court hours; its off-court consequence still belongs tonight.
for(const won of [true,false]){
 const night=simulation();night.clock.minutes=1260;night.mind.recordChampionship('late-result','leo',won,night.clock.day,'Late player match');
 let done=false;
 for(let n=0;n<60*180&&!done;n++){night.updateFixed(1/60);done=!night.mind.events.find(e=>e.id==='late-result').pending.length;}
 assert(done,`A late ${won?'win':'loss'} must not hide its follow-up until the next morning`);
}
console.log('Championship memory PASS: three opponents, idempotency, real practice, reservations, reload, migration and invalid-save rejection');
