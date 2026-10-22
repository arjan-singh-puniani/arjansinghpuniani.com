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
function setup(){
 const p=actor('player',5),o=actor('leo',-5),input=new MatchInput(),hits=[];
 const match=new InteractiveMatchSystem(p,o,CHAMPIONSHIP_OPPONENTS.leo,input,{onRallyContact:(side,quality)=>hits.push({side,quality,gap:Vec3.sub(match.stagedBall(match.pending),match.pending.hitter.racketContactFrame().center).len()})});
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
