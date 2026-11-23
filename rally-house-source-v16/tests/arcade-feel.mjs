import {COURT,COURT_MIN_X,COURT_MAX_X} from '../dist/tennis/CourtGeometry.js';
import assert from 'node:assert/strict';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {InteractiveMatchSystem} from '../dist/tennis/InteractiveMatchSystem.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';
import {ChampionshipHUD} from '../dist/ui/ChampionshipHUD.js';
const actor=(id,z)=>new Character({id,name:id,role:'member',shirt:'#888888',skin:'#c99977',hair:'#333333',playStyle:'test',goal:'test'},new Vec3(1,0,z),new Navigation(),{});
function setup(id='leo',depth=5){
 const p=actor('player',depth),o=actor(id,-depth),input=new MatchInput(),hits=[];
 const match=new InteractiveMatchSystem(p,o,CHAMPIONSHIP_OPPONENTS[id],input,{onRallyContact:(side,quality)=>hits.push({side,quality,gap:Vec3.sub(match.stagedBall(match.pending),match.pending.hitter.racketContactFrame().center).len()})});
 match.startPoint('player');input.setEnabled(true);
 return {p,o,input,match,hits,tick:dt=>{p.update(dt);o.update(dt);match.update(dt);}};
}
const distances=[];
for(const hz of [30,60,120]){
 const {p,input,match,tick}=setup();input.setTouchMovement(1,0);const start=p.position.x;
 for(let i=0;i<Math.round(hz*.35);i++)tick(1/hz);
 distances.push(p.position.x-start);assert(p.position.x-start>2,'Arcade steering crosses useful court distance in 350 ms');
 input.setTouchMovement(-1,0);for(let i=0;i<Math.round(hz*.08);i++)tick(1/hz);assert(match.movementX<-.9,'Reversal is almost immediate');
 input.setTouchMovement(0,0);for(let i=0;i<Math.ceil(hz*.13);i++)tick(1/hz);const x=p.position.x;for(let i=0;i<hz/2;i++)tick(1/hz);assert(Math.abs(p.position.x-x)<.02,'Release does not leave drift');
 match.stop();assert.equal(p.getCourtSpeedScale(),1);assert.equal(p.matchCompetitor,false);
}
assert(Math.max(...distances)-Math.min(...distances)<.2,'Steering is frame-rate independent');
for(const hz of [30,60,120])for(const timing of [-.04,.08,.3,.68,.92]){
 const {p,input,match,hits,tick}=setup();match.receiver='player';match.flightHitter='opponent';match.rallyLength=1;match.firstBounceSeen=true;
 match.ball.active=true;match.ball.bounces=1;match.ball.position.set(1.7,1.1,4.35-timing*6);match.ball.velocity.set(0,2,6);
 input.queueSwing();assert.equal(match.playerCue(),'queued','Early press receives immediate visible acknowledgement');
 for(let i=0;i<hz*1.2&&!hits.length;i++)tick(1/hz);
 assert.equal(hits.length,1,`${hz} Hz, ${timing}s: early/late intention produces a contact`);assert.equal(hits[0].side,'player');assert.notEqual(hits[0].quality,'frame');assert(hits[0].gap<.12,'Contact remains at the real string bed');
}
{
 const {match,input}=setup();input.setTouchMovement(-1,0);const left=match.targetFor('player','clean');input.setTouchMovement(1,0);const right=match.targetFor('player','clean');assert(right.x-left.x>COURT.singlesHalfWidth*2*.65,'Movement direction aims across the playable court');assert(left.x>=COURT_MIN_X&&right.x<=COURT_MAX_X,'Aimed returns respect actual singles sidelines');
}
for(const hz of [30,60,120])for(const aim of [-1,1]){
 const {input,match,tick}=setup();match.receiver='player';match.flightHitter='opponent';match.rallyLength=1;match.firstBounceSeen=true;
 match.ball.active=true;match.ball.bounces=1;match.ball.position.set(1.7,1.1,.27);match.ball.velocity.set(0,2,6);
 input.setTouchMovement(aim,0);input.queueSwing();input.setTouchMovement(0,0);
 for(let i=0;i<hz&&!match.pending;i++)tick(1/hz);
 assert.equal(match.pending?.side,'player','released early input still prepares a return');
 assert((match.pending.target.x-COURT.centerX)*aim>1,'buffered placement must retain the direction chosen when swing was pressed');
}
{
 const input=new MatchInput();input.setEnabled(true);input.setTouchMovement(-1,0);input.queueSwing();input.setTouchMovement(1,0);assert.equal(input.bufferedSwingAim(),-1,'steering after a press cannot change the queued placement');
 input.queueSwing();assert.equal(input.bufferedSwingAim(),1,'a new press replaces the queued intent');input.update(2);assert.equal(input.bufferedSwingAim(),0,'expired input cannot leak aim into another stroke');
 input.queueSwing();input.reset();assert.equal(input.bufferedSwingAim(),0);input.setEnabled(false);input.queueSwing();assert.equal(input.hasBufferedSwing(),false);
}
{
 const {match,o}=setup();match.firstBounceSeen=true;match.ball.active=true;match.ball.position.set(2.6,1.1,-3.15);match.ball.velocity.set(0,2,-8);
 match.tryOpponentReturn(1/60);assert.equal(match.pending,null,'an opponent on the wrong side must chase before preparing a return');
 o.position.x=1.8;match.tryOpponentReturn(1/60);assert.equal(match.pending?.side,'opponent','a reachable return remains playable');
}
{
 const snapshot={phase:'pointResult',lastPoint:{winner:'player',reason:'miss'}};
 assert.equal(ChampionshipHUD.prototype.messageFor(snapshot,'none','Leo'),'Your point · Leo missed');
 snapshot.lastPoint={winner:'opponent',reason:'wide'};assert.equal(ChampionshipHUD.prototype.messageFor(snapshot,'none','Leo'),'Their point · You hit wide');
}
{
 const club=actor('player',5),{p,match}=setup();assert(p.shotDuration('swingForehand')<club.shotDuration('swingForehand')*.75);match.stop();assert.equal(p.shotDuration('swingForehand'),club.shotDuration('swingForehand'),'Club animation remains unchanged');
}
console.log('Arcade movement, reversal, release, early/late contact at 3 rates, shot aiming and club restoration PASS',distances);

assert.equal(ChampionshipHUD.prototype.messageFor({phase:'serving',server:'player'},'serving','Leo'),'SERVING','A consumed serve press acknowledges the ongoing motion');

// Match outcomes use real ball/contact simulation; tracking only supplies normal stick/swing inputs.
let stationaryContacts=0,trackingContacts=0;
for(const hz of [30,60,120])for(const id of Object.keys(CHAMPIONSHIP_OPPONENTS)){
 const contacts=[],results=[];
 for(const tracking of [false,true]){
  const {p,input,match,tick}=setup(id,COURT.baselineDepth);let result=null,cueAt=null;
  match.callbacks.onPoint=(winner,reason)=>result={winner,reason};input.queueSwing();
  for(let frame=0;frame<hz*45&&!result;frame++){
   const time=frame/hz;
   if(match.playerCue()==='swing'&&cueAt===null)cueAt=time;
   if(cueAt!==null&&time-cueAt>=.25){input.queueSwing();cueAt=null;}
   const gap=tracking&&match.receiver==='player'&&match.ball.active?match.ball.position.x-p.position.x:0;
   input.setTouchMovement(Math.abs(gap)>.45?Math.sign(gap):0,0);tick(1/hz);
  }
  assert(match.rallyLength>=5,`${hz}Hz ${id}: opening exchange stays approachable`);
  if(!tracking)assert(result,`${hz}Hz ${id}: stationary tapping cannot sustain an endless point`);
  results.push(result);contacts.push(match.rallyLength);match.stop();
 }
 // A tracked winner can correctly end sooner than a stationary losing rally.
 assert(contacts[1]>=contacts[0]||results[1]?.winner==='player',`${hz}Hz ${id}: tracking must extend the rally or win the point`);
 stationaryContacts+=contacts[0];trackingContacts+=contacts[1];
}
assert(trackingContacts>stationaryContacts*1.5,'Court movement must materially extend playable rallies');
for(const id of Object.keys(CHAMPIONSHIP_OPPONENTS)){
 const {p,match}=setup(id);
 for(const x of [COURT.centerX-1,COURT.centerX+1]){
  p.position.x=x;match.rallyLength=8;
  for(let seed=0;seed<20;seed++){
   match.shotSequence=seed;const target=match.targetFor('opponent','clean');
   assert((target.x-COURT.centerX)*(x-COURT.centerX)<0,'Attack the open half');
   assert(target.x>COURT_MIN_X&&target.x<COURT_MAX_X,'Clean placement stays inside singles lines');
  }
 }
 match.stop();
}
console.log('Rally pressure PASS: 24 simulated points, forgiving openings, open-court placement, tracking reward.',{stationaryContacts,trackingContacts});

// Preview the exact chosen serve, including a buffered press released before the next tick.
for(const aim of [-1,0,1])for(const reduced of [false,true]){
 const {input,match,tick}=setup();input.setTouchMovement(aim,0);
 const cue=()=>match.meshes(reduced).find(m=>m.id==='serve-aim');
 const preview=cue();assert(preview,'A ready player serve shows its placement');
 const target=match.targetFor('player','clean');
 assert.equal(preview.position.x,target.x);assert.equal(preview.position.z,target.z);
 assert(preview.position.x>=COURT_MIN_X&&preview.position.x<=COURT_MAX_X);
 input.queueSwing();input.setTouchMovement(-aim,0);
 assert.equal(cue().position.x,target.x,'Preview keeps the aim captured by the press');
 tick(1/60);assert.equal(match.pending.target.x,target.x);
 assert.equal(cue().position.x,target.x,'Toss keeps the chosen placement');
 for(let i=0;i<300&&!match.pending?.released;i++)tick(1/120);
 assert(match.pending?.released,'Serve reaches string-bed release');assert.equal(cue(),undefined,'Placement cue leaves at contact');
 match.resolvePoint('player','winner');assert.equal(cue(),undefined,'No stale marker between points');
 match.startPoint('opponent');assert.equal(cue(),undefined,'Do not reveal the opponent serve');
 match.startPoint('player');input.setEnabled(false);assert.equal(cue(),undefined,'Paused input does not show a false neutral aim');
 input.setEnabled(true);match.stop();assert.equal(cue(),undefined,'Leaving the court clears placement');
}
console.log('Serve placement preview, buffered aim, toss lock, release and lifecycle cleanup PASS');
