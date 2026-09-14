import assert from 'node:assert/strict';import fs from 'node:fs';import {simulation} from './sim-harness.mjs';
const g=simulation();g.clock.minutes=0;const inputSeed=Number(process.argv[2]??160913),suffix=process.argv[2]?`-${inputSeed}`:"";let seed=inputSeed;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);const rows=[],interruptions=[];let requesting=false;const cancel=g.cancelActivity.bind(g);g.cancelActivity=(a,retry)=>{interruptions.push({day:g.clock.day,id:a.id,kind:a.kind,phase:a.phase,elapsed:a.elapsed,duringRequest:requesting,retry:!!retry});return cancel(a,retry)};let maxPath=0,minGap=Infinity,nearFrames=0,requests=0;
const layout=[{type:'bench',x:-5,z:2},{type:'plant',x:7,z:1},{type:'basket',x:-5,z:-2},{type:'lamp',x:7,z:-2}];g.world.placements=layout;g.affordances.sync(layout,1);g.rebuildFurnitureObstacles();
for(let day=1;day<=20;day++){
 for(let tick=0;tick<1440*30;tick++){
  if(tick%1800===0){g.world.weather=random()<.35?'rain':'clear';if(random()<.12){const before=g.mikaProgress;requesting=true;g.beginLesson(random()<.5?'dropFeed':'movement');requesting=false;assert.equal(g.mikaProgress,before,'Request granted unearned progress');requests++;}}
  g.updateFixed(1/30);
  if(tick%30===0){const people=[...g.characters,g.player];for(const c of people){assert([c.position.x,c.position.z].every(Number.isFinite));maxPath=Math.max(maxPath,c.path.length);assert(c.path.length<100);}for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){const a=people[i],b=people[j];if(a.majorActivity||b.majorActivity)continue;const d=Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z);minGap=Math.min(minGap,d);if(d<.78)nearFrames++;}}
 }
 assert.equal(new Set(g.activities.history.map(a=>a.id)).size,g.activities.history.length);assert.equal(new Set(g.mind.receipts).size,g.mind.receipts.length);rows.push({day,completed:g.telemetry.meaningful,cancellations:g.telemetry.cancellations,memories:g.mind.memories.length,events:g.mind.events.length,mindBytes:JSON.stringify(g.mind.serialize()).length,everydayBytes:JSON.stringify(g.everyday.serialize()).length});fs.writeFileSync(`qa/v16-randomized${suffix}.json`,JSON.stringify({seed:inputSeed,days:day,requests,maxPath,minGap,nearFrames,layout,interruptions,pairs:g.telemetry.pairs,rows},null,2));
}
console.log(JSON.stringify({days:20,requests,maxPath,minGap,nearFrames,final:rows.at(-1)}));
