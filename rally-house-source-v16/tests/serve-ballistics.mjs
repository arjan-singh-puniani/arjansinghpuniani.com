import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Vec3} from '../dist/rendering/Math3D.js';
import {BALL_GRAVITY} from '../dist/tennis/BallPhysics.js';
import {releaseServeToss,serveToss,SERVE_RELEASE} from '../dist/tennis/ServeToss.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {memberData} from '../dist/content/content.js';
import {loadAuthoredAthlete} from '../dist/animation/AuthoredAthlete.js';
import {Navigation} from '../dist/world/Navigation.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {InteractiveMatchSystem} from '../dist/tennis/InteractiveMatchSystem.js';
import {RallySystem} from '../dist/tennis/RallySystem.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';
import {angle} from '../dist/analysis/MotionCapture.js';
globalThis.fetch=async u=>new Response(fs.readFileSync(new URL(u)));globalThis.Image=class{async decode(){}};await loadAuthoredAthlete();
const origin=new Vec3(.1,2.3,.2),target=new Vec3(.2,3.18,.5),duration=.7,toss=releaseServeToss(origin,target,duration);
assert.deepEqual(serveToss(toss,0),origin);assert(Vec3.sub(serveToss(toss,duration),target).len()<1e-9);
assert.equal(toss.gravity,BALL_GRAVITY);assert(toss.velocity.y+toss.gravity*duration<0,'Contact is on the descent');
origin.y=100;target.y=100;assert(serveToss(toss,.3).y<4,'Released toss owns detached launch conditions');
for(const dt of [1/30,1/60,1/120]){const a=serveToss(toss,.3-dt),b=serveToss(toss,.3),c=serveToss(toss,.3+dt);assert(Math.abs((c.y-2*b.y+a.y)/(dt*dt)-BALL_GRAVITY)<1e-9,'Toss has the same constant acceleration as live ball physics');}
for(const invalid of [0,-1,NaN,Infinity])assert.throws(()=>releaseServeToss(new Vec3(),new Vec3(),invalid),RangeError);
const actor=(spec,z)=>new Character({...spec},new Vec3(1,0,z),new Navigation([]),{});
let cases=0,maxContactGap=0,minSeparation=Infinity;
for(const spec of [playerSpec('taylor'),playerSpec('arjan'),...memberData])for(const hz of [30,60,120])for(const owner of ['interactive','autonomous']){
 const p=actor(spec,owner==='interactive'?5:-5),o=actor({...playerSpec('arjan'),id:'opponent'},owner==='interactive'?-5:5),input=new MatchInput(),events=[];
 let count=0,launches=0,afterRelease=null,afterReleaseTime=0;
 const onHit=()=>{
  const shot=system.pending;if((shot?.stroke??shot?.state)!=='serve')return;
  count++;events.push('contact');const gap=Vec3.sub(p.serveBallPoint(),p.racketContactPoint()).len();maxContactGap=Math.max(maxContactGap,gap);
  assert(gap<=.055,'The independent toss reaches the strings before the serve launches');
  if(spec.appearance==='human'){
   const pose=p.analysisPose();assert(pose.headPitch>.5&&pose.headPitch<.7,'Head follows the overhead serve');
   if(spec.avatar==='arjan')assert(180-angle(pose.shoulderR,pose.elbowR,pose.wristR??pose.handR)<40,'Arjan extends into the actual launch event, including early contact samples');
   for(const m of p.meshes().filter(m=>m.skin))assert(m.boneMatrices.every(Number.isFinite),'Serving rig remains finite');
  }
 };
 const system=owner==='interactive'?new InteractiveMatchSystem(p,o,CHAMPIONSHIP_OPPONENTS.leo,input,{onHit}):new RallySystem(p,o,{onHit});
 const launch=system.ball.launch.bind(system.ball);system.ball.launch=(...args)=>{if(count&&launches===0){events.push('launch');launches++;assert.equal(system.pending.impactStarted,true);}return launch(...args);};
 if(owner==='interactive'){input.setEnabled(true);system.startPoint('player');assert.deepEqual(system.visibleBallPosition(),p.serveTossPoint(),'Waiting server visibly holds the ball');input.queueSwing();}else system.start();
 for(let i=0;i<hz*5&&!launches;i++){
  p.update(1/hz);o.update(1/hz);system.update(1/hz);
  const shot=system.pending;
  if((shot?.stroke??shot?.state)==='serve'&&p.animTime>p.shotContactTime('serve')*SERVE_RELEASE+.08&&p.animTime<p.shotContactTime('serve')-.08){
   const ball=p.serveBallPoint();minSeparation=Math.min(minSeparation,Vec3.sub(ball,p.analysisPose().handL).len());
   if(afterRelease){const dt=p.animTime-afterReleaseTime,expected=afterRelease.position.clone().add(afterRelease.velocity.clone().scale(dt)).add(new Vec3(0,.5*BALL_GRAVITY*dt*dt,0));assert(Vec3.sub(ball,expected).len()<1e-8,'Released ball keeps its ballistic path independently of the moving arm');}
   afterRelease={position:ball,velocity:p.serveFlight.velocity.clone().add(new Vec3(0,BALL_GRAVITY*(p.animTime-p.shotContactTime('serve')*SERVE_RELEASE),0))};afterReleaseTime=p.animTime;
  }
 }
 assert.equal(count,1,`${owner}/${spec.name}/${hz}: one serve contact`);assert.equal(launches,1);assert.deepEqual(events,['contact','launch']);assert(system.pending.released,'Serve launches in the contact update, without a ball latch');
 assert.equal(p.contactHoldRemaining,0,'Serve follows through without freezing the stroke clock');
 for(let i=0;i<hz*2;i++){p.update(1/hz);o.update(1/hz);system.update(1/hz);}assert.notEqual(p.state,'serve','Server recovers');assert(p.analysisPose().handR.y<2.2);
 system.stop();cases++;
}
assert(minSeparation>.03,'Toss visibly separates from the hand');
for(const owner of ['interactive','autonomous'])for(const hz of [30,60,120]){
 const p=actor(playerSpec('taylor'),owner==='interactive'?5:-5),o=actor({...playerSpec('arjan'),id:'opponent'},-p.position.z),input=new MatchInput();let points=0,aborted=false;
 const system=owner==='interactive'?new InteractiveMatchSystem(p,o,CHAMPIONSHIP_OPPONENTS.leo,input,{onPoint:()=>points++}):new RallySystem(p,o,{onPoint:()=>points++});
 if(owner==='interactive'){system.startPoint('player');input.setEnabled(true);input.queueSwing();}else system.start();
 for(let i=0;i<hz*5&&!points;i++){p.update(1/hz);o.update(1/hz);const shot=system.pending;if(shot&&!aborted&&p.animTime>p.shotContactTime('serve')*.5){p.clearShotIntent();p.setAnimation('watch');aborted=true;}system.update(1/hz);}
 assert(aborted);assert.equal(points,1,`${owner}/${hz}: an interrupted serve resolves a real miss instead of freezing`);assert.equal(system.pending,null);system.stop();
}
console.log(JSON.stringify({cases,maxContactGap,minSeparation,interruptedServeCases:6}));
console.log('Serve ballistics PASS: constant gravity, detached release, exact event order, immediate launch, recovery and interruption safety in both tennis owners at 30/60/120 Hz.');
