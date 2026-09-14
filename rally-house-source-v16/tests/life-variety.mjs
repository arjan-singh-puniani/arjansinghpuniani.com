import assert from 'node:assert/strict';
import fs from 'node:fs';
import {simulation,advance} from '../qa/sim-harness.mjs';
const g=simulation();g.world.placements=[{type:'bench',x:-5,z:2},{type:'plant',x:7,z:1},{type:'basket',x:-5,z:-2}];g.affordances.sync(g.world.placements,1);g.rebuildFurnitureObstacles();
for(let block=0;block<6;block++){g.world.weather=block%3===1?'rain':'clear';advance(g,600);}
const t=g.telemetry.report(),social=Object.values(t.pairs).reduce((a,b)=>a+b,0),max=Math.max(...Object.values(t.pairs));
console.log('LONG VARIETY',JSON.stringify({day:g.clock.day,scenes:t.uniqueScenes,pairs:t.pairs,places:t.uniqueLocations,initiators:t.initiators,flags:t.flags,cancellations:t.cancellations,favorites:Object.values(g.affordances.objects).map(h=>h.favoriteOf)}));
assert(t.uniqueScenes>=10);assert(t.uniquePairs>=4);assert(t.uniqueLocations>=6);assert(Object.keys(t.initiators).length===4);assert(max/social<.7);assert(t.cancellations<3,'Repeated activity failures');
assert(Object.values(g.affordances.objects).some(h=>h.favoriteOf.length));
assert(g.affordances.objects[g.world.placements.find(p=>p.type==='plant').id].favoriteOf.includes('nia'),'Built plant never became part of Barbara’s routine');
fs.writeFileSync('qa/v15-long-variety.json',JSON.stringify({report:t,states:g.mind.states,objects:g.affordances.serialize(),events:g.mind.events},null,2));
console.log('One simulated hour across days preserves variety, all initiators and built favorites.');
