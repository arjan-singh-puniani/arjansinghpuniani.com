import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {InteractiveMatchSystem} from '../dist/tennis/InteractiveMatchSystem.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';
import {BallPhysics} from '../dist/tennis/BallPhysics.js';
import {COURT} from '../dist/tennis/CourtGeometry.js';
const actor=(id,z)=>new Character({id,name:id,role:'member',shirt:'#888888',skin:'#c99977',hair:'#333333',playStyle:'test',goal:'test'},new Vec3(1,0,z),new Navigation(),{});
function setup(id='leo'){
 const p=actor('player',COURT.baselineDepth),o=actor(id,-COURT.baselineDepth),input=new MatchInput(),hits=[];
 const m=new InteractiveMatchSystem(p,o,CHAMPIONSHIP_OPPONENTS[id],input,{onRallyContact:(side,quality)=>hits.push({side,quality,shot:m.pending.shot,gap:Vec3.sub(m.stagedBall(m.pending),m.pending.hitter.racketContactFrame().center).len()})});
 m.startPoint('player');input.setEnabled(true);return {p,o,input,m,hits,tick:dt=>{p.update(dt);o.update(dt);m.update(dt);}};
}
{
 const i=new MatchInput();i.setEnabled(true);i.setTouchMovement(-1,0);i.queueSwing('lob');i.setTouchMovement(1,0);
 assert.equal(i.bufferedSwingShot(),'lob');assert.equal(i.bufferedSwingAim(),-1);
 i.update(1.1);assert(i.hasBufferedSwing());i.update(.001);assert(!i.hasBufferedSwing());assert.equal(i.bufferedSwingShot(),'drive');
 i.handleKeyDown({key:'q',repeat:false,preventDefault(){}});assert.equal(i.bufferedSwingShot(),'lob');
 i.setEnabled(false);assert(!i.hasBufferedSwing());i.queueSwing('lob');assert(!i.hasBufferedSwing());
}
const flights=[];
for(const hz of [30,60,120])for(const quality of ['perfect','clean','defensive'])for(const aim of [-1,0,1]){
 const {m}=setup();m.rallyLength=8;const row={hz,quality,aim};
 for(const shot of ['drive','lob']){
  const target=m.targetFor('player',quality,aim,shot),ball=new BallPhysics();ball.restitution=m.ball.restitution;
  ball.launch(new Vec3(1,1.15,5.9),target,m.flightTimeFor('player',quality,shot));let peak=0,time=0,land=null;
  for(let n=0;n<hz*3;n++){const e=ball.update(1/hz);time+=1/hz;peak=Math.max(peak,ball.position.y);assert(!e.net,`${shot} must clear net`);if(e.bounced){land=ball.position.clone();break;}}
  assert(land&&m.inSinglesCourt(land),'First bounce stays in bounds');row[shot]={peak,time,x:land.x,z:land.z};
 }
 assert(row.lob.peak>row.drive.peak+.8);assert(row.lob.time>row.drive.time+.2);assert(row.lob.z<row.drive.z-.5);flights.push(row);
}
for(const hz of [30,60,120]){
 const {m,input,hits,tick}=setup();m.receiver='player';m.flightHitter='opponent';m.rallyLength=8;m.firstBounceSeen=true;
 m.ball.active=true;m.ball.bounces=1;m.ball.position.set(1.3,1.1,4.9);m.ball.velocity.set(0,2,6);
 input.setTouchMovement(-.8,0);input.queueSwing('lob');input.setTouchMovement(0,0);
 for(let n=0;n<hz*2&&!hits.length;n++)tick(1/hz);
 assert.equal(hits.length,1);assert.equal(hits[0].shot,'lob');assert(hits[0].gap<=.12);assert(m.pending.target.x<1);
 assert.equal(m.playerLobs,1);m.stop();assert(!m.ball.active);
}
// Full points use normal movement and buffered swings; trace the AI's real court positions.
const traces=[];
for(const id of ['leo','mika'])for(const shot of ['drive','lob']){
 const {p,o,m,input,tick}=setup(id);let result=null,cueAt=null;const samples=[];
 m.callbacks.onPoint=(winner,reason)=>result={winner,reason};input.queueSwing();
 for(let frame=0;frame<60*45&&!result;frame++){
  const time=frame/60,gap=m.receiver==='player'&&m.ball.active?m.ball.position.x-p.position.x:0;
  input.setTouchMovement(Math.abs(gap)>.35?Math.sign(gap):0,0);
  if(m.playerCue()==='swing'&&cueAt===null)cueAt=time;
  if(cueAt!==null&&time-cueAt>=.2){input.queueSwing(shot);cueAt=null;}
  tick(1/60);
  if(m.rallyLength>=5&&frame%6===0)samples.push({time,z:o.position.z,x:o.position.x,contacts:m.rallyLength});
 }
 assert(m.rallyLength>=5,`${id}/${shot}: teachable opening survives`);
 assert(samples.length>0);traces.push({id,shot,contacts:m.rallyLength,result,minDepth:Math.min(...samples.map(s=>-s.z)),samples});m.stop();
}
const pressure=traces.find(t=>t.id==='leo'&&t.shot==='drive'),retriever=traces.find(t=>t.id==='mika'&&t.shot==='drive');
assert(pressure.minDepth<retriever.minDepth-.5,'Styles visibly differ in actual point trajectories');
fs.mkdirSync('evidence/gameplay-slice-20261122',{recursive:true});fs.writeFileSync('evidence/gameplay-slice-20261122/tactics.json',JSON.stringify({flights,traces},null,2));
console.log('Tactical slice PASS: buffer lifecycle, 54 flights, three live lob contacts, four real point traces',traces.map(({samples,...t})=>t));
