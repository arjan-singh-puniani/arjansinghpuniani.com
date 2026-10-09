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
const actor=(id,z)=>new Character({id,name:id,role:'member',shirt:'#888888',skin:'#c99977',hair:'#333333',playStyle:'test',goal:'test'},new Vec3(1,0,z),new Navigation(),{});

for(const hz of [30,60,120])for(const quality of Object.keys(CHAMPIONSHIP_CONTACT_FEEL)){
 const player=actor('player',5),opponent=actor('leo',-5),input=new MatchInput();let hits=0;
 const match=new InteractiveMatchSystem(player,opponent,CHAMPIONSHIP_OPPONENTS.leo,input,{onHit:()=>hits++});
 match.startPoint('player');input.setEnabled(true);match.prepareShot('player','serve',quality);
 for(let i=0;i<hz&&!hits;i++){player.update(1/hz);opponent.update(1/hz);match.update(1/hz);}
 assert.equal(hits,1);const feel=CHAMPIONSHIP_CONTACT_FEEL[quality],contactTime=player.animTime;
 // Feet continue to respond even during the actual pose hold. The racket and
 // compressed ball stay attached to the same live frame while the body moves.
 player.steerOnCourt(new Vec3(3,0,5),opponent.position);
 const x=player.position.x,part=feel.hold/2;
 player.update(part);opponent.update(part);match.update(part);
 assert.equal(player.animTime,contactTime,'Stroke holds at the real contact pose');
 assert(player.position.x>x,'Contact resistance never freezes steering');
 assert(Vec3.sub(match.stagedBall(match.pending),player.racketContactFrame().center).len()<.12);
 let elapsed=part,release=null;
 while(elapsed<.16){player.update(1/hz);opponent.update(1/hz);match.update(1/hz);elapsed+=1/hz;if(match.pending.released&&release===null)release=elapsed;}
 assert(Math.abs(player.animTime-contactTime-(elapsed-feel.hold))<1e-7,'Only the authored hold is removed from the animation clock');
 assert(release>=feel.dwell-1e-8&&release<=feel.dwell+1/hz+1e-8,'Ball releases once immediately after compression');
 assert.equal(hits,1,'Hold cannot emit duplicate impacts');assert(match.ball.active);
 match.stop();assert.equal(match.impactBurst,0);player.setAnimation('idle');player.update(.1);assert.equal(player.animTime,.1,'Stop clears all transient resistance');
}

for(const [width,height] of [[1920,1080],[1728,1117],[1440,900],[1280,800],[1024,768],[844,390],[430,932],[390,844],[720,900]]){
 const camera=new CameraController({getBoundingClientRect:()=>({left:0,top:0,width,height})});camera.setAspect(width/height);
 const saved=camera.captureState(),rig=new ChampionshipCameraRig(camera);rig.begin();
 for(let i=0;i<240;i++){rig.update('behindPlayer',new Vec3(1,0,5),new Vec3(1,0,-5),null,width/height,1/60);camera.update(1/60);}
 const stable=camera.captureState();rig.pulseImpact(1.35,1);const impulse=rig.renderImpulse();assert(impulse);
 const matrix=camera.viewProjection(impulse);assert.deepEqual(camera.captureState(),stable,'Pulse does not perturb orbit springs');
 for(const [x,z] of [[-3.25,-6],[5.25,-6],[-3.25,6],[5.25,6]]){
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
 signatures.add(data.slice(0,30).join(','));
}
assert.equal(signatures.size,36,'Quality and variation create distinct bounded material strikes');
console.log('Impact feel PASS: 12 physical contacts, live steering during pose hold, exact release and cleanup, 9 peak camera framings/restores, 36 audio envelopes');
