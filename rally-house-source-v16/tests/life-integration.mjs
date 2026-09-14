import assert from 'node:assert/strict';
import fs from 'node:fs';
import {simulation,advance} from '../qa/sim-harness.mjs';
const g=simulation();advance(g,600);const report=g.telemetry.report();
console.log('V15 SIMULATION',JSON.stringify({completed:g.activities.history.length,scenes:report.scenes,pairs:report.pairs,places:report.places,initiators:report.initiators,failures:g.activities.history.filter(a=>a.phase==='interrupted')}));
assert(report.uniqueScenes>=6,'Insufficient scene variety');assert(report.uniquePairs>=3,'Insufficient pair variety');assert(report.uniqueLocations>=4,'Insufficient location variety');assert(Object.keys(report.initiators).some(id=>id!=='nia'));assert.equal(g.activities.history.filter(a=>a.phase==='interrupted').length,0,'Activity interrupted unexpectedly');
assert(g.activities.history.some(a=>a.kind==='match'),'No real tennis match completed');
assert((report.scenes['witness-followup']??0)>0,'Observed result did not create a followup');
fs.writeFileSync('qa/v15-simulation.json',JSON.stringify({telemetry:report,history:g.activities.history,mind:g.mind.serialize()},null,2));
// User commitment must win; selecting a lesson itself never develops Lucresia.
for(const a of [...g.activities.active])g.cancelActivity(a);const before=g.mikaProgress;g.beginLesson('movement');assert.equal(g.mikaProgress,before);advance(g,90);assert(g.activities.history.some(a=>a.kind==='lesson'&&a.phase==='completed'));assert.equal(g.mind.philosophy.recovery,1);
// An unfinished post-court intention survives cancellation.
for(const a of [...g.activities.active])g.cancelActivity(a);g.history.addIntention({id:'after-court',person:'nia',kind:'cafe',notBefore:0,text:'A cup after court'});const tea=g.startBreak();assert(tea);g.cancelActivity(tea);assert(g.history.intentions.some(i=>i.id==='after-court'));
// Build a real destination and complete actual visits, without manufacturing history.
g.clock.minutes=700;g.place('bench',-5,2);const object=g.world.placements[0];assert(object);
for(let visit=0;visit<3;visit++){
 for(const a of [...g.activities.active])g.cancelActivity(a);g.history.nextSocial=1e12;g.history.nextObject=1e12;g.everyday.next=1e12;
 const a=g.startBreak(object,'mika','nia');assert(a);g.history.nextObject=1e12;advance(g,70);assert(g.activities.history.some(h=>h.id===a.id&&h.phase==='completed'));
}
assert(g.affordances.objects[object.id].favoriteOf.includes('mika'));
const candidate=g.grammar.compose(g.mind,g.sceneContext()).find(s=>s.objectId===object.id);assert(candidate,'Favorite not used by scene grammar');
const old={x:object.x,z:object.z};const person=g.actor('mika');g.moveFurniture(object.id,person.position.x,person.position.z);assert.deepEqual({x:object.x,z:object.z},old,'Moved furniture under a person');
console.log('Real Game director variety, tennis, lesson commitment, interrupted intention and built favorite passed.');

const late=simulation();late.clock.minutes=1285;late.observationStarted=true;late.queuedLesson='dropFeed';advance(late,2);assert(late.activities.active.some(a=>a.kind==='lesson'),'Player lesson stranded behind closing hours');
console.log('Queued player lesson can start after autonomous closing hours.');

const night=simulation();night.clock.minutes=1260;night.observationStarted=true;advance(night,300);const nightReport=night.telemetry.report();assert(nightReport.meaningful>=3,'After hours switched off all life');assert(!night.activities.history.some(a=>a.kind==='match'||a.kind==='lesson'),'Autonomous court play escaped opening hours');assert.equal(nightReport.cancellations,0);console.log('After-hours quiet life continues without unsolicited court bookings.');fs.writeFileSync('qa/v15-after-hours.json',JSON.stringify(nightReport,null,2));

// Vary UI timing around opening practice, lesson completion and the closing queue.
for(const delay of [0,.05,.2,.5,1,2,4,7,10,15]){
 const q=simulation();advance(q,delay);q.beginLesson('dropFeed');for(let i=0;i<9000&&!q.activities.history.some(a=>a.kind==='lesson'&&a.phase==='completed');i++)q.updateFixed(1/60);
 assert(q.activities.history.some(a=>a.kind==='lesson'&&a.phase==='completed'),`Initial lesson failed at ${delay}`);advance(q,delay/3);
 for(const a of [...q.activities.active])q.cancelActivity(a);q.clock.minutes=1285;q.history.nextSocial=1e12;q.history.nextObject=1e12;q.everyday.next=1e12;const notes=q.startEveryday(q.everyday.scenes(q.lifeContext()).find(s=>s.id==='notes'));assert(notes);q.everyday.next=1e12;advance(q,1+delay/10);q.beginLesson('movement');advance(q,180);
 assert.equal(q.activities.history.filter(a=>a.kind==='lesson'&&a.phase==='completed').length,2,`Closing queue failed at ${delay}`);
}
console.log('Ten varied input timings preserve completed after-hours queued lessons.');
