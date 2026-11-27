import assert from 'node:assert/strict';
import {simulation,advance} from '../qa/sim-harness.mjs';
import {EverydayLife} from '../dist/simulation/EverydayLife.js';
import {characterContext,objectContext,canChallenge} from '../dist/ui/ClubContextPresenter.js';
import {destinations} from '../dist/content/content.js';

const g=simulation();g.observationStarted=true;g.history.nextSocial=1e12;g.history.nextObject=1e12;g.everyday.next=1e12;g.everyday.time=10;
const foreground=g.everyday.scenes(g.lifeContext()).find(s=>s.id==='grip');const a=g.startEveryday(foreground);assert(a);
const quiet=g.everyday.background(g.lifeContext(),g.sceneContext().available);assert(quiet);assert(quiet.beats.every(b=>!b.line&&!b.speaker));const b=g.startEveryday(quiet);assert(b);assert.equal(g.lifeRuns.size,2);
assert(!a.participants.some(id=>b.participants.includes(id)));assert.notEqual(a.resource,b.resource);assert.notEqual(b.resource,'court');
assert.equal(g.everyday.background(g.lifeContext(),g.sceneContext().available),null,'Do not start a second quiet routine immediately');
g.playLifeBeat(a,{seconds:3,poses:{leo:'watch'},speaker:'leo',line:'Checking the grip.'});assert.equal(g.speechOwner,a.id);g.playLifeBeat(b,quiet.beats[0]);g.interruptEveryday(b,'rally');assert.equal(g.speechOwner,a.id,'Quiet routines cannot replace foreground speech');
g.everyday.next=1e12;advance(g,65);assert(g.activities.history.some(h=>h.id===a.id&&h.phase==='completed'));assert(g.activities.history.some(h=>h.id===b.id&&h.phase==='completed'));assert.equal(g.everyday.next,1e12,'Background completion cannot rewrite foreground pacing');
const saved=new EverydayLife();saved.load(g.everyday.serialize());assert.equal(saved.counts[quiet.id],1);assert(saved.cooldowns['background-slot']>0);saved.next=0;saved.failed(quiet);assert.equal(saved.next,0,'A failed optional routine cannot delay a conversation');

// A direct invitation releases a quiet routine immediately without inventing a completion reward.
const q=simulation();q.everyday.time=10;q.everyday.next=1e12;q.observationStarted=true;q.history.nextSocial=1e12;q.history.nextObject=1e12;
const scene=q.everyday.background({...q.lifeContext(),free:new Set(['coach'])},q.sceneContext().available);assert(scene);const routine=q.startEveryday(scene);assert(routine);assert(canChallenge(q.activities,'coach'));const card=characterContext(q.actor('coach'),{mind:q.mind,relations:q.relations,activities:q.activities,history:q.history,affordances:q.affordances,placements:[],characters:q.characters,progress:0});assert(card.actions.some(a=>a.id==='talk'));assert(card.actions.some(a=>a.id==='challenge'));assert(objectContext(q.world.objects.find(o=>o.id==='machine'),q.activities,{frame:'',tension:50,string:''},[]).actions.some(a=>a.id==='drill'),'Optional notebook activity cannot hide a requested lesson');const lesson=q.startActivity('lesson',['coach','mika'],'court',[destinations.courtNorth,destinations.courtSouth],'Requested tennis');assert(lesson);assert(!q.lifeRuns.has(routine.id));assert.equal(q.everyday.counts[scene.id],undefined);assert.equal(q.telemetry.cancellations,0);
assert.equal(q.activities.history.find(h=>h.id===routine.id)?.result,'Quiet routine yielded to an invitation.');
q.lessonActive=true;
q.everyday.cooldowns['background-slot']=0;
const tea=q.everyday.background({...q.lifeContext(),free:new Set(['nia'])},q.sceneContext().available);assert(tea);const teaRun=q.startEveryday(tea);assert(teaRun);assert(q.activities.busy('nia'));assert(!q.activities.busy('nia',false));assert(q.activities.reserved('cafe-table'));assert(!q.activities.reserved('cafe-table',false));const cafe=q.world.objects.find(o=>o.id==='cafe');assert(objectContext(cafe,q.activities,{frame:'',tension:50,string:''},[]).actions.some(a=>a.id==='tea'),'Cafe invitations remain available during optional tea');assert.equal(q.startActivity('championship',['player','nia'],'court',[destinations.courtNorth,destinations.courtSouth]),null);assert(q.lifeRuns.has(teaRun.id),'An unavailable court cannot interrupt an unrelated tea break');q.activities.cancel(teaRun,'Test exit');q.releaseActivity(teaRun);assert(q.lessonActive,'Completing a parallel routine cannot clear an active lesson');
assert(!q.everyday.background({...q.lifeContext(),minute:1300},q.sceneContext().available),'No new quiet chores after closing');

const busy=simulation();let overlap=0,max=0;for(let i=0;i<60*240;i++){busy.updateFixed(1/60);max=Math.max(max,busy.lifeRuns.size);if(busy.lifeRuns.size===2)overlap++;}
assert(max<=2&&overlap>60,'Quiet routines must coexist in actual director execution');assert(busy.activities.history.some(h=>h.kind==='match'||h.kind==='observe'),'Tennis must remain active');
assert(!busy.activities.history.some(h=>h.phase==='interrupted'&&h.result!=='Quiet routine yielded to an invitation.'),'Unexpected activity cancellation');
console.log(JSON.stringify({overlapSeconds:overlap/60,maxConcurrentLifeScenes:max,history:busy.everyday.history.map(h=>h.scene)}));

// Every quiet routine uses the existing travel/pose/completion path, not a decorative timer.
for(const id of ['nia','coach','mika','leo']){
 const club=simulation();club.everyday.time=10;club.everyday.next=club.history.nextSocial=club.history.nextObject=1e12;club.observationStarted=true;club.schedule.update=()=>{};
 const scene=club.everyday.background({...club.lifeContext(),free:new Set([id])},club.sceneContext().available);assert(scene);const a=club.startEveryday(scene);assert(a);club.everyday.background=()=>null;advance(club,90);
 assert(club.activities.history.some(h=>h.id===a.id&&h.phase==='completed'),id+' completes a real routine');assert.equal(club.everyday.counts[scene.id],1);
}
console.log('All four quiet routines travel, perform and complete.');
