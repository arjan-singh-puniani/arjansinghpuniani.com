import assert from 'node:assert/strict';
import {simulation} from '../qa/sim-harness.mjs';
import {destinations} from '../dist/content/content.js';
import {Vec3} from '../dist/rendering/Math3D.js';

const g=simulation();let routes=0,watchStops=0;
const path=g.world.nav.clubPath.bind(g.world.nav);
g.world.nav.clubPath=(...args)=>{routes++;return path(...args);};
g.stopPlayerWatching=()=>watchStops++;
const match=g.activities.begin('match',['coach','mika'],'court');assert(match);
const targets=[destinations.courtNorth,destinations.courtSouth];
// Repeated autonomous attempts must reject before pathfinding or changing player attention.
for(let i=0;i<30;i++){
 assert.equal(g.startActivity('tea',['player','mika'],'cafe-table',targets),null);
 assert.equal(g.startActivity('match',['leo','nia'],'court',targets),null);
}
assert.equal(routes,0,'Unavailable activities must not route actors every decision tick');
assert.equal(watchStops,0,'A rejected invitation must not interrupt watching');
assert.equal(g.activities.active.length,1);

g.activities.cancel(match,'test release');
const tea=g.startActivity('tea',['player','mika'],'cafe-table',[new Vec3(-6.5,0,6),new Vec3(-6.5,0,7)]);
assert(tea,'The same participants can start after their reservation is released');
assert(routes>0);assert.equal(watchStops,1);
assert.equal(g.routes.get(tea.id).length,2);
assert(g.activities.busy('player')&&g.activities.busy('mika'));

const blocked=simulation();
assert.equal(blocked.startActivity('tea',['nia','leo'],'cafe-table',[new Vec3(-9,0,-5.8),destinations.cafe]),null);
assert.equal(blocked.activities.active.length,0,'Unreachable destinations must not acquire reservations');
console.log('Unavailable activities skip navigation; release and unreachable-route behavior preserved.');
