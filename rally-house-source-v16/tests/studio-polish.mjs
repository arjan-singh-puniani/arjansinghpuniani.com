import assert from 'node:assert/strict';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {World} from '../dist/world/World.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {CameraController} from '../dist/rendering/CameraController.js';
import {ChampionshipCameraRig} from '../dist/tennis/ChampionshipCameraRig.js';
import {InteractiveMatchSystem} from '../dist/tennis/InteractiveMatchSystem.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';
import {CHAMPIONSHIP_TUNING as tuning} from '../dist/tennis/ChampionshipTuning.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {BallPhysics} from '../dist/tennis/BallPhysics.js';
import {interactionWitnesses,touchForDecor} from '../dist/simulation/ClubInteractions.js';
const actor=(id,x,z)=>new Character({id,name:id,role:'member',shirt:'#888888',skin:'#c99977',hair:'#333333',playStyle:'test',goal:'test'},new Vec3(x,0,z),new Navigation(),{});
function match(id='leo'){
 const p=actor('player',1,5),o=actor(id,1,-5),input=new MatchInput(),hits=[];
 const m=new InteractiveMatchSystem(p,o,CHAMPIONSHIP_OPPONENTS[id],input,{onHit:q=>hits.push(q)});
 const tick=(dt=1/60)=>{p.update(dt);o.update(dt);m.update(dt)};
 input.setEnabled(true);m.startPoint('player');return {p,o,input,m,hits,tick};
}
for(const reduced of [false,true]){
 const camera=new CameraController({getBoundingClientRect:()=>({width:1280,height:800,left:0,top:0})});
 camera.focus(-3,2,31);camera.rotate(-50);camera.update(.016);
 const before=camera.captureState(),rig=new ChampionshipCameraRig(camera);rig.begin();
 const p=new Vec3(1,0,5),o=new Vec3(1,0,-5);
 const angles=[];for(let i=0;i<120;i++){rig.update('matchIntro',p,o,null,1.6,1/60);camera.update(1/60);angles.push(camera.azimuth);}
 assert(Math.abs(angles[0]-angles.at(-1))>.35,'Camera must visibly orbit');
 rig.beginReturn();rig.update('club',p,o,null,1.6,.05);rig.restoreClubView(reduced);
 assert.deepEqual(camera.captureState(),before,'All camera springs and framing must restore exactly');
}
for(const hz of [30,60,120]){
 const {p,input,m,tick}=match();input.setTouchMovement(1,0);const steps=[];
 for(let i=0;i<hz*.8;i++){const before=p.position.x;tick(1/hz);steps.push(p.position.x-before);}
 assert(steps.slice(Math.ceil(hz*.25)).every(v=>v>0),'Held movement has no stop/start gaps');
 input.setTouchMovement(-1,0);for(let i=0;i<hz*.25;i++)tick(1/hz);assert(m.movementX<-.85,'Fast reversal');
 input.setTouchMovement(0,0);for(let i=0;i<hz;i++)tick(1/hz);const x=p.position.x;for(let i=0;i<hz/2;i++)tick(1/hz);assert(Math.abs(p.position.x-x)<.01,'Release must stop drift');
 m.stop();assert.equal(p.getCourtSpeedScale(),1);
}
for(const id of Object.keys(CHAMPIONSHIP_OPPONENTS)){
 const {m,p,o,input,hits,tick}=match(id);input.queueSwing();let released=false;
 for(let i=0;i<120;i++){
  tick();if(m.ball.active&&!released){released=true;assert(Vec3.sub(m.ball.position,p.racketContactFrame().center).len()<.4,'Launch comes from string bed');}
 }
 assert(released&&hits.length>=1,`${id}: animated serve releases`);
 assert(o.meshes().some(v=>v.kind==='torus'&&v.material==='metal'),'Every competitor has a racket');
 m.stop();assert.equal(p.matchCompetitor,false);assert.equal(o.matchCompetitor,false);assert.equal(o.getCourtSpeedScale(),1);
}
// A broken contact geometry cannot emit a fake strike or launch.
{
 const {m,p,input,hits,tick}=match();const live=p.racketContactFrame.bind(p);let count=0;
 p.racketContactFrame=()=>{const f=live();f.center.x+=(count++%2)*100;return f;};input.queueSwing();
 for(let i=0;i<100;i++)tick();assert.equal(hits.length,0);assert.equal(m.ball.active,false);
}
let flights=0;
for(const side of ['player','opponent'])for(const quality of ['perfect','clean','defensive'])for(let seed=0;seed<30;seed++){
 const {m}=match();m.shotSequence=seed;m.rallyLength=8;
 const target=m.targetFor(side,quality),b=new BallPhysics(),z=side==='player'?5:-5;
 b.launch(new Vec3(-1+seed%4,1.05,z),target,m.flightTimeFor(side,quality));
 let bounced=false;
 for(let i=0;i<180;i++){const e=b.update(1/120);assert(!e.net,`${quality}: good hit must clear net`);if(e.bounced){assert(Math.abs(b.position.z)<5.5);assert(b.position.x>-3.25&&b.position.x<5.25);bounced=true;break;}}
 assert(bounced);flights++;
}
const world=new World(),day=world.lighting(720),night=world.lighting(1250),sport=world.lighting(1250,1);
assert(night.sunColor[0]<day.sunColor[0]*.2,'Sun energy falls after dark');
assert(night.pointLights[2].intensity>day.pointLights[2].intensity*2,'Evening warms practicals');
assert(sport.ambient>night.ambient);assert(sport.pointLights[2].intensity<night.pointLights[2].intensity,'Club warmth suppressed for match');
world.triggerInteraction('bell',.1,new Vec3());world.dynamicMeshes(0,1250,undefined,1/60,0,performance.now()/1000+1);assert.equal(world.interactionFx.size,0,'Reduced-motion effects expire');
const a=actor('leo',0,0),b=actor('nia',1,0),c=actor('coach',2,0),times=new Map();a.setAnimation('idle');b.setAnimation('watch');c.setAnimation('watch');
assert.deepEqual(interactionWitnesses([a,b,c],new Vec3(),id=>id==='coach',times,0),[a,b]);
a.glanceAt(new Vec3(2,1,0),.5);for(let i=0;i<40;i++)a.update(1/60);assert.equal(a.targetLook,undefined);
times.set('leo',0);assert(!interactionWitnesses([a,b],new Vec3(),()=>false,times,3).includes(a));
for(const type of ['bench','plant','lamp','basket','racketRack','towelRack','scoreboard'])assert(touchForDecor(type).effect);
assert(tuning.ballVisualRadius>=.2&&tuning.ballHaloRadius>tuning.ballVisualRadius);
console.log(`Studio regressions pass: camera restoration, movement at 3 rates, 4 competitors, contact authority, ${flights} safe flights, lighting, gaze cleanup, decor.`);
// Real Game interaction transaction: approach, embodied action, persistence, release.
const {simulation}=await import('../qa/sim-harness.mjs');
{
 const g=simulation();g.touchRuns=new Map();g.witnessTimes=new Map();g.observationStarted=true;g.everyday.next=1e9;g.history.nextSocial=g.history.nextObject=1e9;
 g.player.position.set(-8,0,3.2);g.player.path=[];
 for(const c of g.characters){c.yieldUntil=1e9;c.path=[];c.setAnimation('idle');}
 const {CLUB_TOUCHES}=await import('../dist/simulation/ClubInteractions.js');
 g.startClubTouch('reception','Front desk',new Vec3(-9,0,4.8),CLUB_TOUCHES.reception);
 assert(g.activities.busy('player'));let active=false;
 for(let i=0;i<1500&&g.activities.busy('player');i++){g.updateFixed(1/60);active||=g.activities.active.some(a=>a.kind==='touch'&&a.phase==='active');}
 assert(active);assert(g.activities.history.some(a=>a.kind==='touch'&&a.phase==='completed'));
 assert.equal(g.touchRuns.size,0);assert.equal(g.player.socialProp,null);assert.equal(g.player.targetLook,undefined);
 const spectator=g.characters.find(c=>c.id==='leo');spectator.setAnimation('watch');g.waitingForPlace.set('leo','court-qa');
 g.rally.enabled=true;g.rally.ball.active=true;g.rally.ball.position.set(2,1,3);g.updateSpectatorAttention();
 assert.deepEqual(spectator.targetLook,g.rally.ball.position);
 g.rally.ball.active=false;g.updateSpectatorAttention();assert.deepEqual(spectator.targetLook,new Vec3(1,1,0));
}
// A legal first bounce owns the outcome, even when the unreturned ball leaves bounds.
{
 const {m}=match();let outcome;
 m.callbacks.onPoint=(winner,reason)=>outcome={winner,reason};
 m.flightHitter='player';m.receiver='opponent';m.firstBounceSeen=true;m.rallyLength=2;
 m.ball.active=true;m.ball.position.set(1,.10,-6.98);m.ball.velocity.set(0,-1,-4);m.ball.bounces=1;
 m.update(1/60);assert.equal(outcome.winner,'player');assert.notEqual(outcome.reason,'long');
}
// Input remains meaningful during a stroke, and cannot replace the stroke animation.
{
 const {m,p,input,tick}=match();input.setTouchMovement(1,0);input.queueSwing();
 for(let i=0;i<12;i++)tick();assert.equal(p.state,'serve');assert(p.position.x>1.05);
 for(let i=0;i<90;i++)tick();assert(p.position.x>2);m.stop();
}
console.log('Game-level tactile transaction, spectator tracking, legal-bounce scoring and movement-through-stroke pass.');
const {ClubAtmosphere}=await import('../dist/rendering/ClubAtmosphere.js');
{
 const atmosphere=new ClubAtmosphere(),world=new World();const initial=atmosphere.update(world.lighting(720),1/60).ambient;
 world.weather='rain';const target=world.lighting(720).ambient,one=atmosphere.update(world.lighting(720),1/60).ambient;
 assert(one<initial&&one>target,'Weather lighting eases instead of toggling');
 for(let i=0;i<300;i++)atmosphere.update(world.lighting(720),1/60);
 assert(Math.abs(atmosphere.current.ambient-target)<.0001);
}

// Ball feel: first landing stays fixed, rebound gains height, contact stays real.
{
 const original=new BallPhysics(),springier=new BallPhysics();springier.restitution=tuning.ballRestitution;
 for(const ball of [original,springier])ball.launch(new Vec3(1,1.1,5),new Vec3(1,.09,-2.95),1.06);
 let reboundBefore=0,reboundAfter=0;
 for(let i=0;i<240;i++){
  const a=original.update(1/120),b=springier.update(1/120);
  if(a.bounced){assert(b.bounced);assert.deepEqual(original.position,springier.position);reboundBefore=original.velocity.y;reboundAfter=springier.velocity.y;break;}
 }
 assert(reboundAfter>reboundBefore*1.1&&reboundAfter<reboundBefore*1.2,'Springier rebound without a new landing target');
 const {m,p,input,tick}=match();input.queueSwing();let compressed=false,released=false;
 for(let i=0;i<120;i++){
  tick();
  if(m.pending?.impactStarted&&!m.pending.released){
   const ball=m.meshes().find(mesh=>mesh.id==='match-ball');
   assert(ball&&ball.scale.z<ball.scale.x*.4);
   assert.deepEqual(ball.rotation,p.racketContactFrame().rotation,'Compression follows the live face');
   assert(Vec3.sub(ball.position,p.racketContactFrame().center).len()<.12);
   assert(Math.abs(p.racketStringOffset())>.015,'The string bed yields at real impact');
   assert.equal(p.meshes().filter(mesh=>mesh.id==='racket-string').length,28);
   compressed=true;
  }
  if(m.ball.active){released=true;break;}
 }
 assert(compressed&&released);
 for(let i=0;i<60;i++)p.update(1/60);
 assert.equal(p.racketStringOffset(),0,'Strings settle after contact');
 m.stop();assert.equal(m.meshes().filter(mesh=>mesh.id==='ball-comet').length,0);
}
{
 const {BallTrail}=await import('../dist/tennis/BallTrail.js');
 const lengths=[];
 for(const hz of [30,60,120]){
  const trail=new BallTrail();
  for(let i=0;i<=hz;i++)trail.update(new Vec3(i/hz*8,1,0),1/hz);
  const head=new Vec3(8,1,0),full=trail.meshes(head),reduced=trail.meshes(head,true);
  assert(full.length>8&&full.length<=18,'Trail is connected and bounded');
  assert(full[0].scale.x>full.at(-1).scale.x*2,'Comet tapers toward its tail');
  assert(reduced.length<full.length,'Reduced motion shortens the trail');
  lengths.push(8-full.at(-1).position.x);
  for(let i=0;i<hz;i++)trail.update(head,1/hz);
  assert.equal(trail.meshes(head).length,0,'A still ball cannot leave a permanent comet');
  trail.reset();assert.equal(trail.meshes(head).length,0);
 }
 assert(Math.max(...lengths)-Math.min(...lengths)<.12,'Trail length is frame-rate independent');
}
console.log('Ball feel passes: springier bounce, face-aligned compression, string recovery, bounded frame-rate-independent comet and reduced motion.');
