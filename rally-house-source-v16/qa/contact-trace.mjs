import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {RallySystem} from '../dist/tennis/RallySystem.js';
import {InteractiveMatchSystem} from '../dist/tennis/InteractiveMatchSystem.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';
import {Vec3} from '../dist/rendering/Math3D.js';
const actor=(id,z)=>new Character({id,name:id,role:'member',shirt:'#888888',skin:'#c99977',hair:'#333333',playStyle:'test',goal:'test'},new Vec3(1,0,z),new Navigation(),{});
for(const mode of ['club','match']){
 const n=actor('leo',-5),s=actor('player',5),input=new MatchInput();
 const game=mode==='club'?new RallySystem(n,s):new InteractiveMatchSystem(s,n,CHAMPIONSHIP_OPPONENTS.leo,input);
 if(mode==='club')game.start();else{input.setEnabled(true);game.startPoint('player');input.queueSwing();}
 let min=100,behind=0,contacts=0,worst=null;
 for(let i=0;i<60*60;i++){
  n.update(1/60);s.update(1/60);
  if(mode==='match'&&game.playerCue()==='swing')input.queueSwing();
  game.update(1/60);
  const p=game.pending;
  if(p&&!(p.released)&& (p.stroke??p.state)!=='serve'){
   const q=mode==='club'||p.captured?game.stagedBall(p):game.ball.position;
   const front=(q.z-p.hitter.position.z)*-Math.sign(p.hitter.position.z);
   if(front<min){min=front;worst={frame:i,front,ball:q,player:p.hitter.position,anim:p.hitter.animTime,captured:p.captured,impact:p.impactStarted};}
   if(front<0)behind++;
  }
  contacts=mode==='club'?game.sessionHits:game.rallyLength;
 }
 console.log(mode,JSON.stringify({min,behind,contacts,worst}));
}
