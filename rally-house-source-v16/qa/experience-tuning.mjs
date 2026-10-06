import fs from 'node:fs';
import path from 'node:path';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {InteractiveMatchSystem} from '../dist/tennis/InteractiveMatchSystem.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';
import {CHAMPIONSHIP_TUNING as tuning} from '../dist/tennis/ChampionshipTuning.js';

// Node-only experiment: mutate the imported tuning object, never source or saves.
const baseline={...tuning};
const cueLead=process.env.QA_CUE_LEAD===undefined?baseline.returnCueLeadSeconds:Number(process.env.QA_CUE_LEAD);
if(!Number.isFinite(cueLead)||cueLead<.1||cueLead>1.5)throw Error('QA_CUE_LEAD must be between .1 and 1.5 seconds');
const movement={
  calm:{movementAcceleration:28,movementDeceleration:32,movementReverseSharpness:44,playerMaxCourtSpeedScale:2.05},
  current:{movementAcceleration:38,movementDeceleration:44,movementReverseSharpness:62,playerMaxCourtSpeedScale:2.45},
  fast:{movementAcceleration:50,movementDeceleration:54,movementReverseSharpness:78,playerMaxCourtSpeedScale:2.7},
};
const feed={
  generous:{swingBufferSeconds:1.3,assistOpponentFlightSeconds:1.28,assistOpponentServeFlightSeconds:1.35,playerReturnReach:3.05,assistOpponentSpread:.22},
  current:{swingBufferSeconds:1.1,assistOpponentFlightSeconds:1.14,assistOpponentServeFlightSeconds:1.24,playerReturnReach:2.85,assistOpponentSpread:.28},
  demanding:{swingBufferSeconds:.75,assistOpponentFlightSeconds:1.0,assistOpponentServeFlightSeconds:1.08,playerReturnReach:2.5,assistOpponentSpread:.45},
};
const actor=(id,z)=>new Character({id,name:id,role:'member',shirt:'#888888',skin:'#bb825b',hair:'#202226',playStyle:'test',goal:'test'},new Vec3(1,0,z),new Navigation(),{});
function setup(id){
  const player=actor('player',5),opponent=actor(id,-5),input=new MatchInput();let result=null;
  const match=new InteractiveMatchSystem(player,opponent,CHAMPIONSHIP_OPPONENTS[id],input,{onPoint:(winner,reason)=>result={winner,reason}});
  match.startPoint('player');input.setEnabled(true);
  return {player,opponent,input,match,result:()=>result,tick:dt=>{player.update(dt);opponent.update(dt);match.update(dt);}};
}
const report=[];
try{
  for(const [moveName,move] of Object.entries(movement))for(const [feedName,feeds] of Object.entries(feed)){
    Object.assign(tuning,baseline,move,feeds,{returnCueLeadSeconds:cueLead});
    const scenarios=[];
    for(const hz of [30,60,120])for(const opponent of Object.keys(CHAMPIONSHIP_OPPONENTS))for(const delay of [.08,.40]){
      const {player,input,match,tick,result}=setup(opponent);input.queueSwing();let cueAt=null,maxContactGap=0;
      for(let frame=0;frame<hz*18&&!result();frame++){
        const time=frame/hz;
        if(match.playerCue()==='swing'&&cueAt===null)cueAt=time;
        if(cueAt!==null&&time-cueAt>=delay){input.queueSwing();cueAt=null;}
        // A representative tracking bot steers toward the incoming shot's x.
        if(match.receiver==='player'&&match.ball.active){const gap=match.ball.position.x-player.position.x;input.setTouchMovement(Math.abs(gap)>.6?Math.sign(gap):0,0);}
        else input.setTouchMovement(0,0);
        tick(1/hz);
        if(match.pending?.impactStarted&&!match.pending.released)maxContactGap=Math.max(maxContactGap,Vec3.sub(match.stagedBall(match.pending),match.pending.hitter.racketContactFrame().center).len());
      }
      scenarios.push({hz,opponent,delay,contacts:match.rallyLength,result:result(),maxContactGap});match.stop();
    }
    const steering=[];
    for(const hz of [30,60,120]){
      const {player,input,match,tick}=setup('leo');input.setTouchMovement(1,0);
      for(let i=0;i<Math.round(hz*.35);i++)tick(1/hz);const distance=player.position.x-1;
      input.setTouchMovement(-1,0);let reversal=0;
      for(let i=0;i<hz;i++){tick(1/hz);if(match.movementX<-.9){reversal=(i+1)/hz;break;}}
      input.setTouchMovement(0,0);for(let i=0;i<Math.ceil(hz*.13);i++)tick(1/hz);
      const atRelease=player.position.x;for(let i=0;i<hz/2;i++)tick(1/hz);
      steering.push({hz,distance350ms:distance,reversal90Seconds:reversal,releaseDrift:Math.abs(player.position.x-atRelease)});match.stop();
    }
    const entry={movement:moveName,feed:feedName,values:{...move,...feeds},steering,scenarios,
      summary:{meanContacts:scenarios.reduce((n,s)=>n+s.contacts,0)/scenarios.length,accessibleFirstRallies:scenarios.filter(s=>s.contacts>=3).length,total:scenarios.length,maxContactGap:Math.max(...scenarios.map(s=>s.maxContactGap))}};
    report.push(entry);console.log(moveName,feedName,JSON.stringify(entry.summary));
  }
}finally{Object.assign(tuning,baseline);}
const output=process.argv[2]??'../takeover-evidence/experiments/tuning.json';fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({baseline,cueLead,method:'tracking bot, 18-second point, 80/400ms cue delays; no human feel score',profiles:report},null,2));
