import assert from 'node:assert/strict';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {RallySystem} from '../dist/tennis/RallySystem.js';
import {InteractiveMatchSystem} from '../dist/tennis/InteractiveMatchSystem.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';
import {Vec3} from '../dist/rendering/Math3D.js';
const actor=(id,z)=>new Character({id,name:id,role:'member',shirt:'#888888',skin:'#c99977',hair:'#333333',playStyle:'test',goal:'test'},new Vec3(1,0,z),new Navigation(),{});

// The swing plane follows the intended shot, even when locomotion left the
// body pointing sideways. Verify both baselines and forehand/backhand.
for(const z of [-5,5])for(const yaw of [-Math.PI/2,0,Math.PI/2,Math.PI])for(const stroke of ['swingForehand','swingBackhand']){
  const c=actor('player',z);c.yaw=yaw;
  c.setIncomingContact(new Vec3(1.5,1,z));
  c.triggerShot(stroke,new Vec3(1,.1,-z));
  const target=c.debugKinematics().contactTarget;
  assert((target.z-c.position.z)*-Math.sign(z)>.5,'Target stays on the net side while turning');
}

for(const hz of [30,60,120])for(const mode of ['club','match']){
  const north=actor('leo',-5),south=actor('player',5),input=new MatchInput();
  const rally=mode==='club'?new RallySystem(north,south):new InteractiveMatchSystem(south,north,CHAMPIONSHIP_OPPONENTS.leo,input);
  if(mode==='club')rally.start();else{input.setEnabled(true);rally.startPoint('player');input.queueSwing();}
  let frames=0,minFront=Infinity;
  for(let i=0;i<hz*45;i++){
    north.update(1/hz);south.update(1/hz);
    if(mode==='match'&&rally.playerCue()==='swing')input.queueSwing();
    rally.update(1/hz);
    const p=rally.pending;
    if(!p||p.released||(p.stroke??p.state)==='serve')continue;
    const ball=mode==='club'||p.captured?rally.stagedBall(p):rally.ball.position;
    const front=(ball.z-p.hitter.position.z)*-Math.sign(p.hitter.position.z);
    minFront=Math.min(minFront,front);frames++;
    assert(front>.1,`${mode}/${hz} Hz: ball crossed behind the striker (${front})`);
  }
  const contacts=mode==='club'?rally.sessionHits:rally.rallyLength;
  assert(contacts>=10&&frames>100,`${mode}/${hz} Hz: exercise sustained real returns`);
  console.log(`${mode}/${hz} Hz: ${contacts} contacts; nearest approach ${minFront.toFixed(3)} in front`);
}

// Forward movement through preparation must not carry the body past contact.
for(const direction of [-1,0,1]){
  const player=actor('player',5),opponent=actor('leo',-5),input=new MatchInput();
  const match=new InteractiveMatchSystem(player,opponent,CHAMPIONSHIP_OPPONENTS.leo,input);
  match.startPoint('player');input.setEnabled(true);input.setTouchMovement(0,direction);
  match.ball.active=true;match.ball.position.set(1.2,1,3.5);match.ball.velocity.set(0,1,6);
  match.prepareShot('player','swingForehand','clean');
  for(let i=0;i<35;i++){
    player.update(1/60);opponent.update(1/60);match.update(1/60);
    const p=match.pending;
    if(p&&!p.released){const ball=p.captured?match.stagedBall(p):match.ball.position;assert(player.position.z-ball.z>.1);}
  }
  assert.equal(match.rallyLength,1,'Moving strike must release exactly once');
}
console.log('Moving return stays in front and releases once.');
