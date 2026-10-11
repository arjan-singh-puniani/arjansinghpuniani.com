import assert from 'node:assert/strict';
import {World} from '../dist/world/World.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {ObjectIdentity,rayBox} from '../dist/world/ObjectIdentity.js';
import {migrateGameSave,CURRENT_SAVE_VERSION} from '../dist/persistence/migrations.js';
import {courtSpectatorSpots} from '../dist/content/content.js';
import {simulation} from '../qa/sim-harness.mjs';
import {touchForDecor} from '../dist/simulation/ClubInteractions.js';
import {DECOR_CATALOG} from '../dist/content/DecorCatalog.js';

for(const item of DECOR_CATALOG)assert(touchForDecor(item.id).title);
assert.throws(()=>touchForDecor('unknown-mesh'),/Missing authored interaction/);

const world=new World(),tr=()=>world.authored.clockMeshes.map(m=>({p:{...m.position},r:{...m.rotation},s:{...m.scale}})),base=tr();
for(const p of Object.values(courtSpectatorSpots))assert(!world.nav.isBlocked(p.x,p.z));
for(const [id,p] of Object.entries(courtSpectatorSpots))for(const [other,q] of Object.entries(courtSpectatorSpots))if(id!==other)assert(Vec3.sub(p,q).len()>.9);
assert(world.canSee(new Vec3(6,0,4),new Vec3(1,0,-4)),'A low racket stand/net cannot hide an adult');
assert(!world.canSee(new Vec3(10.8,0,5.6),new Vec3(10.8,0,7.4)),'Tall bookcase blocks eye-level visibility');
for(let cycle=0;cycle<240;cycle++){
 assert(world.authored.clock.start());assert.equal(world.authored.clock.start(),false);
 const rate=[30,60,120][cycle%3];for(let i=0;i<rate*4;i++)world.authored.clock.update(1/rate);
 assert.equal(world.authored.clock.active,false);assert.deepEqual(tr(),base);
 world.authored.clock.start();world.authored.clock.update(.1);world.authored.clock.restore();assert.deepEqual(tr(),base);
 world.authored.clock.start();world.authored.clock.update(1/60,true);assert.deepEqual(tr(),base);
}
// Capture the live hand transforms at invocation, including time changes between uses.
for(const minute of [360,723,1001.5]){world.authored.meshes(minute,false);const live=tr();world.authored.clock.start();world.authored.clock.update(0);assert.deepEqual(tr(),live);for(let i=0;i<240;i++)world.authored.clock.update(1/60);assert.deepEqual(tr(),live);}
assert.equal(new Set(world.objects.map(o=>o.id)).size,world.objects.length);
for(const o of world.objects){assert(o.selection);assert(Object.values(o.selection.size).every(n=>Number.isFinite(n)&&n>0));if(o.kind!=='court')assert(world.identity.actions(o,2200).length,`${o.id} has an authored action`);}
const clock=world.objects.find(o=>o.id==='clubClock');assert.equal(rayBox(new Vec3(5.7,2.75,0),new Vec3(0,0,-1),clock.selection),8.895);assert.equal(rayBox(new Vec3(0,0,0),new Vec3(0,1,0),clock.selection),null);
const bonsai=world.objects.find(o=>o.id==='bonsai'),water=world.identity.actions(bonsai,2200).find(a=>a.id==='water');
world.identity.apply(bonsai.id,water,2200);world.identity.complete(bonsai.id,water.title);
assert(!world.identity.actions(bonsai,2201).some(a=>a.id==='water'));assert(world.identity.actions(bonsai,2230).some(a=>a.id==='water'));
const copied=new ObjectIdentity(world.objects);copied.load(world.identity.serialize());assert.deepEqual(copied.serialize(),world.identity.serialize());
const save={clock:{minutes:800,day:1,speed:1,paused:false},coins:17,mikaProgress:44,player:{x:0,z:0},weather:'clear',relationships:{},objectIdentity:copied.serialize()};
assert.equal(migrateGameSave(8,{...save,objectIdentity:undefined}).coins,17);assert.deepEqual(migrateGameSave(CURRENT_SAVE_VERSION,save).objectIdentity,save.objectIdentity);
for(const bad of [{uses:-1},{uses:10000},{lastWater:Infinity},{lastWater:3000},{lastAction:'x'.repeat(121)},{sketched:'yes'},{dimmed:'yes'}])assert.throws(()=>migrateGameSave(9,{...save,objectIdentity:{bonsai:{...save.objectIdentity.bonsai,...bad}}}));
for(const bad of [false,null,[]])assert.throws(()=>migrateGameSave(9,{...save,objectIdentity:bad}));

const rows=[];
for(const object of world.objects.filter(o=>o.kind!=='court')){
 const g=simulation();Object.assign(g,{touchRuns:new Map(),witnessTimes:new Map(),observationStarted:true});g.schedule.update=()=>{};g.everyday.next=g.history.nextSocial=g.history.nextObject=1e12;
 for(const c of g.characters){c.position.set(1+c.id.length*.4,0,2);c.path=[];c.yieldUntil=1e12;c.setAnimation('idle');}
 const o=g.world.objects.find(o=>o.id===object.id),touch=g.world.identity.actions(o,g.absoluteMinute)[0];
 g.startClubTouch(o.id,o.label,o.position,touch);assert(g.activities.busy('player'),`Travel starts ${o.id}`);
 let active=false;
 for(let i=0;i<4000&&g.activities.busy('player');i++){g.updateFixed(1/60);const a=g.activities.active.find(a=>a.kind==='touch');if(a?.phase==='active'){active=true;assert(!g.world.nav.isBlocked(g.player.position.x,g.player.position.z),`No physical clipping ${o.id}`);}}
 if(!active)console.log(o.id,g.player.position,g.activities.history[0],g.routes);assert(active,`Arrives ${o.id}`);assert.equal(g.world.identity.state(o.id).uses,1,`Completes ${o.id}`);assert.equal(g.player.socialProp,null);assert.equal(g.player.interactionTarget,undefined);rows.push(o.id);
}
// Water’s reach and soil response, not just its card and receipt.
const g=simulation();Object.assign(g,{touchRuns:new Map(),witnessTimes:new Map(),observationStarted:true});g.schedule.update=()=>{};g.everyday.next=g.history.nextSocial=g.history.nextObject=1e12;
for(const c of g.characters){c.path=[];c.yieldUntil=1e12;}const tree=g.world.objects.find(o=>o.id==='bonsai'),pour=g.world.identity.actions(tree,g.absoluteMinute).find(a=>a.id==='water');g.startClubTouch(tree.id,tree.label,tree.position,pour);
let gap=Infinity;for(let i=0;i<4000&&g.activities.busy('player');i++){g.updateFixed(1/60);if(g.activities.active.some(a=>a.phase==='active'&&a.kind==='touch'))gap=Math.min(gap,Vec3.sub(g.player.debugKinematics().rightHand,tree.interactionPoint).len());}assert(gap<.12,`Water hand reaches soil: ${gap}`);
assert(g.world.authored.meshes(g.absoluteMinute,false).some(m=>m.color==='#302e28'));
// Read -> sketch -> erase changes actual geometry and history, through complete activities.
const paper=simulation();Object.assign(paper,{touchRuns:new Map(),witnessTimes:new Map(),observationStarted:true});paper.schedule.update=()=>{};paper.everyday.next=paper.history.nextSocial=paper.history.nextObject=1e12;for(const c of paper.characters){c.path=[];c.yieldUntil=1e12;}
for(const id of ['sketch','erase']){const board=paper.world.objects.find(o=>o.id==='clubBoard'),action=paper.world.identity.actions(board,paper.absoluteMinute).find(a=>a.id===id);assert(action);paper.startClubTouch(board.id,board.label,board.position,action);for(let i=0;i<4000&&paper.activities.busy('player');i++)paper.updateFixed(1/60);assert.equal(paper.world.identity.state(board.id).sketched,id==='sketch');const ink=paper.world.authored.meshes(paper.absoluteMinute,false).filter(m=>m.color==='#be775b');assert.equal(ink.length,id==='sketch'?3:0);}
assert.equal(paper.world.identity.state('clubBoard').uses,2);
// A long walk to the seat cannot consume the exhibition before the spectator arrives.
const seat=simulation();Object.assign(seat,{touchRuns:new Map(),witnessTimes:new Map(),observationStarted:true});seat.schedule.update=()=>{};seat.quietLife=()=>{};
seat.everyday.next=seat.history.nextSocial=seat.history.nextObject=1e12;
for(const c of seat.characters){c.path=[];c.yieldUntil=1e12;}
const bench=seat.world.objects.find(o=>o.id==='courtBench'),watch=seat.world.identity.actions(bench,seat.absoluteMinute).find(a=>a.id==='watchSeat');seat.startClubTouch(bench.id,bench.label,bench.position,watch);
assert(!seat.activities.reserved('court'),'Exhibition waits until the spectator reaches the seat');
let watched=0;
for(let i=0;i<7000&&seat.activities.busy('player');i++){seat.updateFixed(1/60);if(seat.rally.ball.active&&seat.player.state==='sit'&&seat.activities.active.some(a=>a.kind==='touch'&&a.phase==='active')){assert(Vec3.sub(seat.player.targetLook,seat.rally.ball.position).len()<.12);watched++;}}
if(watched<120)console.log('Seat regression diagnostic',watched,seat.activities.history,seat.activities.active,seat.player.position);
assert(watched>=120,'Seated player sees the actual moving ball for at least two seconds');assert.equal(seat.world.identity.state(bench.id).uses,1);assert.equal(seat.player.seatDepth,0);
// Navigation changes may change autonomous timing. Prove the observed-result path with a real free observer.
const seen=simulation();seen.observationStarted=true;seen.schedule.update=()=>{};seen.quietLife=()=>{};seen.everyday.next=seen.history.nextSocial=seen.history.nextObject=1e12;
for(const c of seen.characters){c.path=[];c.yieldUntil=1e12;c.setAnimation('idle');}seen.actor('nia').position.set(6.9,0,3.7);
const match=seen.startMatch();assert(match);for(let i=0;i<9000&&seen.activities.active.some(a=>a.id===match.id);i++)seen.updateFixed(1/60);
const event=seen.mind.events.find(e=>e.id===match.id);assert(event?.witnesses.includes('nia'),'A free nearby observer witnesses the actual completed match');
const followup=seen.grammar.compose(seen.mind,seen.sceneContext()).find(s=>s.family==='witness-followup'&&s.eventId===event.id);assert(followup);
const visit=seen.startEveryday(followup);assert(visit);for(let i=0;i<6000&&seen.activities.active.some(a=>a.id===visit.id);i++)seen.updateFixed(1/60);assert(seen.activities.history.some(a=>a.id===visit.id&&a.phase==='completed'));
// Interrupted clock interactions restore before releasing their reservation, with no completed use.
const h=simulation();Object.assign(h,{touchRuns:new Map(),witnessTimes:new Map(),observationStarted:true});const c=h.world.objects.find(o=>o.id==='clubClock'),a=h.world.identity.actions(c,h.absoluteMinute)[0];h.startClubTouch(c.id,c.label,c.position,a);const activity=h.activities.active.find(a=>a.kind==='touch');h.world.authored.start(c.id,a,h.absoluteMinute);h.world.authored.update(.1,false);h.cancelActivity(activity);assert.equal(h.world.authored.clock.active,false);assert.equal(h.world.identity.state(c.id).uses,0);
console.log(`Object identity PASS: ${rows.length} real travel/action/completion flows; 240 full, cancelled and reduced clock cycles; water reach ${gap.toFixed(3)}; stable reload and malformed-save rejection.`);
