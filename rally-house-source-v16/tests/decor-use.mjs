import assert from 'node:assert/strict';
import {simulation,advance} from '../qa/sim-harness.mjs';
import {ObjectAffordances} from '../dist/simulation/ObjectAffordances.js';
import {rayBox} from '../dist/world/ObjectIdentity.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {migrateGameSave,CURRENT_SAVE_VERSION} from '../dist/persistence/migrations.js';
import {furnitureContext} from '../dist/ui/ClubContextPresenter.js';
function club(type){const g=simulation();Object.assign(g,{touchRuns:new Map(),witnessTimes:new Map(),observationStarted:true});g.schedule.update=()=>{};g.quietLife=()=>{};g.everyday.next=g.history.nextObject=g.history.nextSocial=1e12;for(const c of g.characters){c.path=[];c.yieldUntil=1e12;}const p={id:'test-decor',type,x:-5,z:3.5,rotation:0};g.world.placements=[p];g.affordances.sync([p],g.clock.day);g.rebuildFurnitureObstacles();return {g,p};}
function touch(g,p,id){const action=g.affordances.actions(p,g.absoluteMinute).find(a=>a.id===id);assert(action);g.startClubTouch(p.id,'Test decor',new Vec3(p.x,0,p.z),action);const a=g.activities.active.find(a=>a.resource===p.id);assert(a);return a;}
function finish(g,a){for(let i=0;i<6000&&g.activities.active.includes(a);i++)g.updateFixed(1/60);assert.equal(a.phase,'completed',JSON.stringify({a,player:g.player.position,path:g.player.path}));}
{
 const {g,p}=club('plant'),a=touch(g,p,'water');finish(g,a);const state=g.affordances.objects[p.id];assert(Number.isFinite(state.lastWater));assert(!g.affordances.actions(p,g.absoluteMinute).some(a=>a.water));assert(g.world.placementMeshes().some(m=>m.color==='#303c2c'),'Completed watering darkens the actual soil');assert(g.affordances.actions(p,g.absoluteMinute+30).some(a=>a.water),'Watering returns after the soil rests');
 const copy=new ObjectAffordances();copy.load(g.affordances.serialize());assert.equal(copy.objects[p.id].lastWater,state.lastWater);
 const snapshot={clock:g.clock.serialize(),coins:10,mikaProgress:28,player:{x:0,z:0},affordances:g.affordances.serialize()};assert.equal(migrateGameSave(CURRENT_SAVE_VERSION,snapshot).affordances.objects[p.id].lastWater,state.lastWater);snapshot.affordances.objects[p.id].lastWater=g.absoluteMinute+1;assert.throws(()=>migrateGameSave(CURRENT_SAVE_VERSION,snapshot),'Future water timestamps are rejected');
}
{
 const {g,p}=club('lamp'),on=g.world.lighting(1250,0,new Vec3(p.x,0,p.z));assert(on.pointLights.length<=8);assert(on.pointLights.some(l=>l.position.x===p.x&&l.position.z===p.z),'A placed lamp really lights its surroundings');
 const cancelled=touch(g,p,'light');advance(g,.3);g.cancelActivity(cancelled);assert.equal(g.affordances.objects[p.id].dimmed,undefined,'Interrupted touches do not change saved light state');
 finish(g,touch(g,p,'light'));assert.equal(g.affordances.objects[p.id].dimmed,true);assert(!g.world.lighting(1250,0,new Vec3(p.x,0,p.z)).pointLights.some(l=>l.position.x===p.x&&l.position.z===p.z));
 assert.equal(furnitureContext(p,g.affordances,g.activities,id=>id,g.absoluteMinute).actions[0].title,'Switch the light on');finish(g,touch(g,p,'light'));assert.equal(g.affordances.objects[p.id].dimmed,false);
 const bounds=g.world.placementBounds(p);for(const x of [p.x-.28,p.x,p.x+.28])assert(rayBox(new Vec3(x,2.05,p.z+4),new Vec3(0,0,-1),bounds)!==null,'Clicking the visible shade selects the lamp');
}
{
 const {g,p}=club('cafeTable');g.actor('leo').position.set(-6.5,0,5.5);let invites=[];g.ui=new Proxy(g.ui,{get:(target,key)=>key==='showContext'?(_e,_t,_d,_m,actions)=>invites=actions:target[key]});
 for(let visit=0;visit<3;visit++){g.inviteToFurniture(p);const invite=invites.find(a=>a.title.includes('Leo'));assert(invite);invite.run();const a=g.activities.active.find(a=>a.resource===p.id);assert(a);finish(g,a);}
 assert.equal(g.affordances.objects[p.id].visits.player,3);assert.equal(g.affordances.objects[p.id].visits.leo,3);assert(g.affordances.objects[p.id].favoriteOf.includes('leo'));assert(g.relations.get('leo').warmth>12,'The placed table develops a real relationship and favorite-place history');
 assert.equal(g.player.socialProp,null);assert(!g.activities.reserved(p.id));
}
{
 const {g,p}=club('bench');const action={...g.affordances.actions(p,g.absoluteMinute)[0],seconds:10,watchCourt:true};g.startClubTouch(p.id,'Your bench',new Vec3(p.x,0,p.z),action);const a=g.activities.active.find(a=>a.resource===p.id);let watched=0;for(let i=0;i<7000&&g.activities.active.includes(a);i++){g.updateFixed(1/60);if(a.phase==='active'&&g.player.state==='sit'&&g.rally.ball.active)watched++;}assert(watched>120,'A placed bench shows the actual rally from that seat');assert.equal(a.phase,'completed');
}
{
 const {g,p}=club('basket'),a=touch(g,p,'touch');let samples=0,low=Infinity;
 for(let i=0;i<6000&&g.activities.active.includes(a);i++){g.updateFixed(1/60);if(a.phase==='active'){const ball=g.world.authored.demonstrationBall;assert(Math.hypot(ball.position.x-p.x,ball.position.z-p.z)<1.5,'The basket ball moves at the placed basket');samples++;low=Math.min(low,ball.position.y);}}
 assert(samples>90&&low<.16,'The placed basket produces a real landing and rebound');assert.equal(a.phase,'completed');
}
// Rotated furniture keeps its real footprint, including clearance for both guests.
for(const type of ['cafeTable','bench'])for(const rotation of [0,Math.PI/8,Math.PI/4,Math.PI/2]){
 const {g,p}=club(type);p.rotation=rotation;g.rebuildFurnitureObstacles();g.actor('leo').position.set(-6.5,0,5.5);let invites=[];
 g.ui=new Proxy(g.ui,{get:(target,key)=>key==='showContext'?(_e,_t,_d,_m,actions)=>invites=actions:target[key]});g.inviteToFurniture(p);invites.find(a=>a.title.includes('Leo')).run();
 const a=g.activities.active.find(a=>a.resource===p.id);assert(a,`${type} invitation at ${rotation}`);finish(g,a);
 const n=g.world.nav,centre=new Vec3(p.x,0,p.z),outside=new Vec3(p.x+3,0,p.z+3);assert(n.isBlocked(p.x,p.z));assert(!n.clearSegment(centre,outside),'Routes cannot cut through the rotated object');
 const start=new Vec3(p.x-2,0,p.z),end=new Vec3(p.x+2,0,p.z),path=n.path(start,end);assert(path.length>1);let prior=start;for(const next of path){for(let t=0;t<=1;t+=.02){const point=prior.clone().scale(1-t).add(next.clone().scale(t));assert(!n.isBlocked(point.x,point.z),'Every simplified path segment clears the turned furniture');}prior=next;}
}
for(const field of [{dimmed:'yes'},{lastWater:-1},{lastWater:NaN}]){const state=new ObjectAffordances();assert.throws(()=>state.load({sequence:1,objects:{test:{placedDay:1,visits:{},memories:[],favoriteOf:[],...field}}}));}
console.log('Decor use PASS: real placed lighting, full-shade picking, persistent watering/cooldown, safe cancellation, table invitations/favorites, bench spectating and invalid-state rejection.');
