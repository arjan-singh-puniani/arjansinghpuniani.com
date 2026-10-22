import assert from 'node:assert/strict';
import {simulation} from '../qa/sim-harness.mjs';
import {World} from '../dist/world/World.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {COURT} from '../dist/tennis/CourtGeometry.js';
import {destinations} from '../dist/content/content.js';

const world=new World(),nav=world.nav;nav.courtReserved=()=>true;
for(const sign of [-1,1]){
 const baseline=new Vec3(COURT.centerX,0,sign*COURT.baselineDepth);
 assert(nav.onCourt(baseline),'A match baseline belongs to the reserved court');
 const entry=nav.clubPath(new Vec3(6.9,0,3.7),baseline);
 assert(entry.length,'The actual service position is reachable');
 let prior=new Vec3(6.9,0,3.7);
 for(const point of entry){assert(nav.clearSegment(prior,point),'Entry clips furniture or net');prior=point;}
 const exit=nav.clubPath(baseline,new Vec3(6.5,0,3.5));
 assert(exit.length,'A previous opponent can leave the baseline');
}
for(const [socialStart,socialEnd] of [[new Vec3(-6.5,0,3.5),new Vec3(6.5,0,3.5)],[destinations.spectatorBench,destinations.warmup],[destinations.warmup,destinations.spectatorBench]]){
const social=nav.clubPath(socialStart,socialEnd);
assert(social.length);
let prior=socialStart;
for(const point of social){
 assert(nav.clearSegment(prior,point));
 for(let t=0;t<=1;t+=.01)assert(!nav.onCourt(Vec3.lerp(prior,point,t)),'Social circulation cuts across a reserved playing area');
 prior=point;
}
}

// The same route may cross idle court floor, but changes as soon as a booking starts.
{
 const g=simulation(),nav=g.world.nav,start=new Vec3(-6.5,0,3.5),end=new Vec3(6.5,0,3.5),length=(path,from=start)=>path.reduce((n,p,i)=>n+Vec3.sub(p,i?path[i-1]:from).len(),0);
 const direct=nav.clubPath(start,end);assert.equal(direct.length,1,'Clear idle-court crossing is a direct route');
 const c=g.player;c.position=start.clone();c.goTo(end);c.update(1/60);
 const booking=g.activities.begin('lesson',['coach','mika'],'court');assert(booking);c.update(1/60);
 assert(length(c.path,c.position)>length(direct)*1.25,'An existing walker replans around a newly reserved court');
 let prior=c.position;for(const p of c.path){assert(nav.clearSegment(prior,p));for(let t=0;t<=1;t+=.01)assert(!nav.onCourt(Vec3.lerp(prior,p,t)));prior=p;}
 g.activities.cancel(booking,'Finished');c.update(1/60);assert.equal(c.path.length,1,'Releasing court immediately restores the shorter route');
 for(const [from,to] of [[new Vec3(1,0,-4),new Vec3(1,0,4)],[new Vec3(-5,0,-3),new Vec3(6,0,3)]]){let prior=from;for(const p of nav.clubPath(from,to)){assert(nav.clearSegment(prior,p),'Free-court routes still clear the physical net');prior=p;}}
}

// Reproduce consecutive opponents: the previous opponent occupies the exact
// far-baseline target. Use real Game reservations, crowd avoidance and walking;
// nobody is teleported once the entry starts and the 65-second timeout stays.
let scenarios=0;
for(const hz of [30,60,120])for(const previous of ['coach','mika','leo','nia'])for(const next of ['coach','mika','leo','nia'].filter(id=>id!==previous)){
 const g=simulation();g.clock.minutes=780;g.observationStarted=true;
 g.schedule.update=()=>{};g.quietLife=()=>{};g.everyday.next=g.history.nextSocial=g.history.nextObject=1e12;
 for(const [i,c] of g.characters.entries()){c.path=[];c.position.set(i%2?6.5:-6.5,0,i<2?3.5:-3.5);c.yieldUntil=1e12;}
 g.player.position.set(COURT.centerX,0,COURT.baselineDepth);
 const leaving=g.actor(previous);leaving.position.set(COURT.centerX,0,-COURT.baselineDepth);
 g.actor(next).position.set(6.9,0,3.7);
 const targets=[new Vec3(COURT.centerX,0,COURT.baselineDepth),new Vec3(COURT.centerX,0,-COURT.baselineDepth)];
 const activity=g.startActivity('observe',['player',next],'court',targets,'Consecutive opponent entry');
 assert(activity);
 for(let frame=0;frame<hz*65&&activity.phase==='traveling';frame++)g.updateFixed(1/hz);
 assert.equal(activity.phase,'starting',`${previous} → ${next} entry at ${hz} Hz`);
 assert(!nav.onCourt(leaving.position),'Previous opponent still occupies reserved court');
 assert(Vec3.sub(g.actor(next).position,targets[1]).len()<.55);
 scenarios++;
}
console.log(`Court access PASS: ${scenarios} consecutive-opponent entries at 30/60/120 Hz, both baseline routes, net/furniture clearance and outside social circulation.`);
