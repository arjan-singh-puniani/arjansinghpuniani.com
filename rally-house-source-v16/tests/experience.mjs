import assert from 'node:assert/strict';
import {World} from '../dist/world/World.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {Character} from '../dist/entities/Character.js';
import {InteractiveMatchSystem} from '../dist/tennis/InteractiveMatchSystem.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {BallPhysics} from '../dist/tennis/BallPhysics.js';
import {ChampionshipController} from '../dist/tennis/ChampionshipController.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';
import {RelationshipSystem} from '../dist/simulation/RelationshipSystem.js';
import {objectContext,characterContext} from '../dist/ui/ClubContextPresenter.js';
import {CLUB_TOUCHES} from '../dist/simulation/ClubInteractions.js';
import {simulation} from '../qa/sim-harness.mjs';

const world=new World();
let routes=0;
for(const x of [-2,1,4])for(const z of [-5,-2,2,5])for(const endX of [-2,1,4])for(const endZ of [-5,-2,2,5]){
  const start=new Vec3(x,0,z),end=new Vec3(endX,0,endZ),path=world.nav.clubPath(start,end);
  assert(path.length);let previous=start;
  for(const point of path){
    assert(world.nav.clearSegment(previous,point));
    for(let t=0;t<=1;t+=.005){const p=Vec3.lerp(previous,point,t);assert(!(p.x>-3.63&&p.x<5.63&&Math.abs(p.z)<.28),'Route enters expanded net');}
    previous=point;
  }
  routes++;
}
for(const hz of [30,60,120]){
  const c=new Character({id:'player',name:'Arjan',role:'player',shirt:'#888888',skin:'#bb825b',hair:'#202226',playStyle:'test',goal:'test'},new Vec3(1,0,5),world.nav,{});
  c.goTo(new Vec3(1,0,-5),'idle');
  for(let i=0;i<hz*24;i++){
    c.update(1/hz);
    assert(!(c.position.x>-3.63&&c.position.x<5.63&&Math.abs(c.position.z)<.28));
  }
  assert(Vec3.sub(c.position,new Vec3(1,0,-5)).len()<.01);
}
// A sub-cell obstacle between nodes must also block the A* edge itself.
const thin=new Navigation([{x:0,z:.25,w:8,d:.005}]);
const path=thin.path(new Vec3(0,0,-2),new Vec3(0,0,2));assert(path.length);
let previous=new Vec3(0,0,-2);for(const point of path){assert(thin.clearSegment(previous,point));previous=point;}

const g=simulation();Object.assign(g,{touchRuns:new Map(),witnessTimes:new Map(),observationStarted:true});
g.schedule.update=()=>{};g.everyday.next=g.history.nextSocial=g.history.nextObject=1e12;
for(const c of g.characters){c.path=[];c.yieldUntil=1e12;c.setAnimation('idle');}
g.player.position.set(-8,0,3.2);g.player.path=[];
const desk=g.world.objects.find(o=>o.id==='reception');
g.startClubTouch(desk.id,desk.label,desk.position,CLUB_TOUCHES.reception);
let nearestHand=Infinity,physicalEffect=false;
for(let i=0;i<1800&&g.activities.busy('player');i++){
  g.updateFixed(1/60);
  const a=g.activities.active.find(a=>a.kind==='touch');
  if(a?.phase==='active'){
    nearestHand=Math.min(nearestHand,Vec3.sub(g.player.debugKinematics().rightHand,desk.interactionPoint).len());
    const fx=g.world.interactionFx.get('bell');
    if(fx){assert.deepEqual(fx.position,desk.interactionPoint);physicalEffect=true;}
  }
}
assert(physicalEffect&&nearestHand<.12,`Bell hand gap ${nearestHand}`);
assert.equal(g.player.interactionTarget,undefined);
assert(objectContext(desk,g.activities,g.equipment??{},[]).facts.some(f=>f.label==='Your last completed visit'));
const cancelled=g.activities.begin('touch',['player'],desk.id,'Cancelled bell');g.activities.cancel(cancelled,'Cancelled');
assert(!objectContext(desk,g.activities,{},[]).facts.some(f=>f.text==='Cancelled bell'));

// A callback can resolve the final point inside match.update, after the phase
// was sampled by Game. Both that path and an immediate Return retain one result.
const c=new ChampionshipController();c.beginChallenge(CHAMPIONSHIP_OPPONENTS.leo);c.acceptChallenge();
for(let i=0;i<200;i++)c.update(1/60,true);
Object.assign(g,{championship:c,championshipOpponentId:'leo',championshipActivityId:'qa-championship',championshipRound:1,championshipCompletedRound:0,matchInput:{setEnabled(){}},interactiveMatch:{update(){c.resolvePoint({winner:'player',reason:'winner',rallyLength:5});},stop(){}},save:async()=>{}});
for(let point=0;point<6;point++){c.markServeStarted();c.resolvePoint({winner:'player',reason:'winner',rallyLength:3});for(let frame=0;frame<80;frame++)c.update(1/60,true);}
const a=g.activities.begin('championship',['player','leo'],'court','QA match');
for(const phase of ['starting','active'])g.activities.transition(a,phase);
g.routes.set(a.id,[new Vec3(1,0,5),new Vec3(1,0,-5)]);
g.updateChampionshipActivity(a,1/60);
assert.equal(c.phase,'matchResult');
for(let i=0;i<60;i++)g.updateChampionshipActivity(a,1/60);
assert.equal(g.relations.get('leo').events.filter(e=>e.type==='championship_result').length,1);
g.rematchChampionship();assert.equal(g.championshipRound,2);
for(let i=0;i<100;i++)c.update(1/60,true);
for(let point=0;point<6;point++){c.markServeStarted();c.resolvePoint({winner:'player',reason:'winner',rallyLength:3});for(let frame=0;frame<80;frame++)c.update(1/60,true);}c.resolvePoint({winner:'player',reason:'winner',rallyLength:8});g.rememberChampionshipResult();
assert.equal(g.relations.get('leo').events.filter(e=>e.type==='championship_result').length,2,'Same score on a rematch is a distinct completed event');
const reload=new RelationshipSystem();reload.load(JSON.parse(JSON.stringify(g.relations.serialize())));
assert(reload.recall('leo','championship').detail.includes('7–0'));
const state={mind:g.mind,relations:reload,activities:g.activities,history:g.history,affordances:g.affordances,placements:[],characters:g.characters,progress:28};
assert(characterContext(g.actor('leo'),state).facts.some(f=>f.label==='Last Championship with you'));

for(const hz of [30,60,120])for(const x of [-1,1,3]){
  const b=new BallPhysics();b.launch(new Vec3(x,1.3,-5),new Vec3(x+.7,.09,3),1.1);
  const predicted=b.firstLanding(1/hz);assert(predicted);
  for(let i=0;i<hz*3;i++)if(b.update(1/hz).bounced){assert(Vec3.sub(b.position,predicted).len()<.0001);break;}
  assert.equal(b.firstLanding(1/hz),null);
}
console.log(`Experience regressions PASS: ${routes} routes, net locomotion at 3 rates, thin obstacles, bell reach ${nearestHand.toFixed(3)}, real receipts, final-point/rematch/save causality and 9 exact landing forecasts.`);

// Preparation may precede the legal bounce; early intent cannot manufacture contact.
for (const hz of [30, 60, 120]) {
  const spec = id => ({id,name:id,role:'member',shirt:'#888888',skin:'#bb825b',hair:'#202226',playStyle:'test',goal:'test'});
  const player = new Character(spec('player'),new Vec3(1,0,5),new Navigation(),{});
  const opponent = new Character(spec('leo'),new Vec3(1,0,-5),new Navigation(),{});
  const input = new MatchInput();
  const match = new InteractiveMatchSystem(player,opponent,CHAMPIONSHIP_OPPONENTS.leo,input,{});
  input.setEnabled(true);match.startPoint('player');input.queueSwing();
  let earlyCue = false, preparedAt = null, maxContacts = 0;
  for (let frame=0; frame<hz*14; frame++) {
    const time=frame/hz;
    if (match.playerCue()==='swing' && preparedAt===null) {
      preparedAt=time;earlyCue ||= !match.firstBounceSeen;
    }
    if (preparedAt!==null && time-preparedAt>=.4) {input.queueSwing();preparedAt=null;}
    if (match.receiver==='player' && !match.firstBounceSeen) {
      assert(!(match.pending?.hitter===player),'A preparation cue cannot hit before the bounce');
    }
    player.update(1/hz);opponent.update(1/hz);match.update(1/hz);
    maxContacts=Math.max(maxContacts,match.rallyLength);
  }
  assert(earlyCue);assert(maxContacts>=3,`400ms preparation failed at ${hz} Hz`);match.stop();
}
console.log('Anticipatory swing cue and delayed input pass at three rates without pre-bounce contact.');

{
  const c=new Character({id:'player',name:'Arjan',role:'player',shirt:'#888888',skin:'#bb825b',hair:'#202226',playStyle:'test',goal:'test'},new Vec3(),new Navigation(),{});
  c.setInteractionTarget(new Vec3(.5,1.35,.5));
  for(let i=0;i<120;i++)c.update(1/60);
  let previous=c.debugKinematics().rightHand;
  c.setInteractionTarget(undefined);
  assert(Vec3.sub(c.debugKinematics().rightHand,previous).len()<.00001,'Releasing a touch cannot instantly drop the hand');
  for(let i=0;i<120;i++){
    c.update(1/60);const hand=c.debugKinematics().rightHand;
    assert(Vec3.sub(hand,previous).len()<.08,'Surface reach release popped');previous=hand;
  }
  assert.equal(c.interactionRelease,undefined);
}
console.log('Surface reach releases smoothly and clears its transient target.');
