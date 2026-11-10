import {COURT} from '../dist/tennis/CourtGeometry.js';
import assert from 'node:assert/strict';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,transformPoint} from '../dist/rendering/Math3D.js';
import {InteractiveMatchSystem} from '../dist/tennis/InteractiveMatchSystem.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';
import {CHAMPIONSHIP_CONTACT_FEEL} from '../dist/tennis/ChampionshipTuning.js';
import {ChampionshipCameraRig} from '../dist/tennis/ChampionshipCameraRig.js';
import {CameraController} from '../dist/rendering/CameraController.js';
import {tennisImpactSignal} from '../dist/core/TennisImpactSound.js';
import {BallPhysics} from '../dist/tennis/BallPhysics.js';
import {RallySystem} from '../dist/tennis/RallySystem.js';
import {Game} from '../dist/Game.js';
const actor=(id,z)=>new Character({id,name:id,role:'member',shirt:'#888888',skin:'#c99977',hair:'#333333',playStyle:'test',goal:'test'},new Vec3(1,0,z),new Navigation(),{});

for(const hz of [30,60,120])for(const quality of Object.keys(CHAMPIONSHIP_CONTACT_FEEL)){
 const player=actor('player',5),opponent=actor('leo',-5),input=new MatchInput();let hits=0;
 const match=new InteractiveMatchSystem(player,opponent,CHAMPIONSHIP_OPPONENTS.leo,input,{onHit:(q,side,direction,speed)=>{
  hits++;const p=match.pending,forecast=new BallPhysics();forecast.launch(p.hitter.racketContactFrame().center,p.target,p.flightTime);
  assert.equal(speed,forecast.velocity.len(),'Impact audio receives the actual planned launch speed at contact');
 }});
 match.startPoint('player');input.setEnabled(true);match.prepareShot('player','swingForehand',quality);
 for(let i=0;i<hz&&!hits;i++){player.update(1/hz);opponent.update(1/hz);match.update(1/hz);}
 assert.equal(hits,1);const feel=CHAMPIONSHIP_CONTACT_FEEL[quality],contactTime=player.animTime;
 // Groundstroke feet continue to respond even during the actual pose hold. The racket and
 // compressed ball stay attached to the same live frame while the body moves.
 player.steerOnCourt(new Vec3(3,0,5),opponent.position);
 const x=player.position.x,part=feel.hold/2;
 player.update(part);opponent.update(part);match.update(part);
 assert.equal(player.animTime,contactTime,'Stroke holds at the real contact pose');
 assert(player.position.x>x,'Contact resistance never freezes steering');
 assert(Vec3.sub(match.stagedBall(match.pending),player.racketContactFrame().center).len()<.12);
 assert.deepEqual(match.visibleBallPosition(),match.stagedBall(match.pending),'Replay captures the held ball that rendering displays');
 const captured=match.visibleBallPosition();captured.x+=100;assert(Vec3.sub(match.visibleBallPosition(),player.racketContactFrame().center).len()<.12,'Replay snapshots cannot mutate the live staged ball');
 let elapsed=part,release=null;
 while(elapsed<.16){player.update(1/hz);opponent.update(1/hz);match.update(1/hz);elapsed+=1/hz;if(match.pending.released&&release===null)release=elapsed;}
 assert(Math.abs(player.animTime-contactTime-(elapsed-feel.hold))<1e-7,'Only the authored hold is removed from the animation clock');
 assert(release>=feel.dwell-1e-8&&release<=feel.dwell+1/hz+1e-8,'Ball releases once immediately after compression');
 assert.equal(hits,1,'Hold cannot emit duplicate impacts');assert(match.ball.active);
 match.stop();assert.equal(match.impactBurst,0);player.setAnimation('idle');player.update(.1);assert.equal(player.animTime,.1,'Stop clears all transient resistance');
}

for(const outcome of ['clean','frame','net']){
 const north=actor('coach',-5),south=actor('mika',5);let hits=0;
 const rally=new RallySystem(north,south,{onHit:(quality,speed)=>{
  hits++;const p=rally.pending,forecast=new BallPhysics();forecast.launch(p.hitter.racketContactFrame().center,p.target,p.flight);
  assert.equal(speed,forecast.velocity.len());assert.equal(quality,outcome==='frame'?'frame':'clean','A net-bound shot still strikes strings before the net');
 }});
 rally.outcomeFor=()=>outcome;rally.prepareHit();
 for(let i=0;i<180&&!hits;i++){north.update(1/60);south.update(1/60);rally.update(1/60);}
 assert.equal(hits,1,'Club tennis shares the strength-aware impact event');rally.stop();
}
{
 const g=Object.create(Game.prototype),heard=[];Object.assign(g,{settings:{reducedMotion:true},characters:[],audio:{tennisImpact:(...args)=>heard.push(args)}});
 g.playChampionshipHit('clean','player',0,14.5);assert.deepEqual(heard,[['clean',14.5]],'Game preserves measured strength at the audio boundary');
}

for(const [width,height] of [[1920,1080],[1728,1117],[1440,900],[1280,800],[1024,768],[844,390],[430,932],[390,844],[720,900]]){
 const camera=new CameraController({getBoundingClientRect:()=>({left:0,top:0,width,height})});camera.setAspect(width/height);
 const saved=camera.captureState(),rig=new ChampionshipCameraRig(camera);rig.begin();
 for(let i=0;i<240;i++){rig.update('behindPlayer',new Vec3(1,0,5),new Vec3(1,0,-5),null,width/height,1/60);camera.update(1/60);}
 const stable=camera.captureState();rig.pulseImpact(1.35,1);const impulse=rig.renderImpulse();assert(impulse);
 const matrix=camera.viewProjection(impulse);assert.deepEqual(camera.captureState(),stable,'Pulse does not perturb orbit springs');
 for(const [x,z] of [[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,z])=>[COURT.centerX+x*COURT.doublesHalfWidth,z*COURT.halfLength])){
  const point=transformPoint(matrix,new Vec3(x,.1,z));assert(Math.abs(point.x)<1&&Math.abs(point.y)<1,`${width}x${height}: court remains in frame at peak impact`);
 }
 rig.renderImpulse(true);assert.equal(rig.renderImpulse(),undefined,'Reduced motion cannot leave a stale kick');
 rig.pulseImpact();for(let i=0;i<30;i++)rig.update('behindPlayer',new Vec3(1,0,5),new Vec3(1,0,-5),null,width/height,1/60);
 assert.equal(rig.renderImpulse(),undefined,'Pulse settles fully');rig.pulseImpact();rig.beginReturn();assert.equal(rig.renderImpulse(),undefined);rig.restoreClubView(false);assert.deepEqual(camera.captureState(),saved);
}

const signatures=new Set();
for(const rate of [22050,44100,48000])for(const quality of Object.keys(CHAMPIONSHIP_CONTACT_FEEL))for(let variant=0;variant<3;variant++){
 const data=tennisImpactSignal(quality,variant,rate);let peak=0,energy=0,attack=0,tail=0;
 for(let i=0;i<data.length;i++){assert(Number.isFinite(data[i]));peak=Math.max(peak,Math.abs(data[i]));energy+=data[i]*data[i];if(i<rate*.01)attack+=data[i]*data[i];if(i>rate*.09)tail+=data[i]*data[i];}
 assert(Math.abs(peak-.92)<1e-6);assert(attack/energy>.50,'Material attack arrives in the first 10 ms');assert(tail/energy<.025,'No lingering tone masks the next bounce');
 assert.equal(Math.abs(data[0]),0);assert.equal(Math.abs(data.at(-1)),0,'Impact ends at silence without a cutoff click');
 signatures.add(data.slice(0,30).join(','));
}
assert.equal(signatures.size,36,'Quality and variation create distinct bounded material strikes');
console.log('Impact feel PASS: 12 physical contacts, live steering during pose hold, exact release and cleanup, 9 peak camera framings/restores, 36 audio envelopes');

// Browser audio may reject outstanding work as a page leaves. Teardown and
// autoplay-denied resumes must not become unhandled promise rejections.
const {AudioManager}=await import('../dist/core/AudioManager.js');
{
 const connected=new Set(),sources=[],gains=[];
 const node=()=>({connect(target){connected.add(this);return target;},disconnect(){connected.delete(this);},frequency:{value:0},Q:{value:0},gain:{value:0,setValueAtTime(v){this.value=v;}}});
 const context={state:'running',sampleRate:48000,currentTime:0,destination:{},close:async()=>{},
  createBuffer:(_channels,length)=>{const data=new Float32Array(length);return {getChannelData:()=>data};},
  createBufferSource:()=>{const n={...node(),start(){}};sources.push(n);return n;},
  createBiquadFilter:node,createGain:()=>{const n=node();gains.push(n);return n;}};
 const a=new AudioManager();a.ctx=context;
 for(let i=0;i<120;i++){
  a.tennisImpact(['clean','perfect','defensive','frame'][i%4],i%20);
  assert.equal(connected.size,4);sources.at(-1).onended();assert.equal(connected.size,0,'Finished strikes release every audio node');
 }
 assert.equal(a.tennisMaterialBuffers.size,12,'Continuous shot strength cannot create unbounded sample variants');
 a.tennisImpact('clean',NaN);assert(Number.isFinite(gains.at(-1).gain.value));sources.at(-1).onended();
 const count=sources.length;a.volume=0;a.tennisImpact('perfect',18);assert.equal(sources.length,count,'Mute allocates no impact nodes');
 a.dispose();assert.equal(a.tennisMaterialBuffers.size,0);
}
const priorAudioContext=globalThis.AudioContext,rejections=[],onRejection=e=>rejections.push(e);
process.on('unhandledRejection',onRejection);
try{
 globalThis.AudioContext=class {state='suspended';resume(){return Promise.reject(new Error('Autoplay denied'));}close(){return Promise.reject(new Error('Navigated away from page'));}};
 const audio=new AudioManager();audio.ensure();await new Promise(r=>setTimeout(r,0));audio.dispose();await new Promise(r=>setTimeout(r,0));
 assert.deepEqual(rejections,[],'Expected browser audio lifecycle rejection is handled');assert.equal(audio.ctx,undefined,'Audio context is released immediately');
}finally{process.off('unhandledRejection',onRejection);if(priorAudioContext)globalThis.AudioContext=priorAudioContext;else delete globalThis.AudioContext;}
console.log('Audio lifecycle PASS: rejected resume and page-exit shutdown are handled without retaining a context.');
