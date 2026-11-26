import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const root=process.env.QA_RUNTIME?pathToFileURL(process.env.QA_RUNTIME+'/'):new URL('../',import.meta.url);
const [{Character},{playerSpec},{memberData},{Navigation},{Vec3},{InteractiveMatchSystem},{MatchInput},{CHAMPIONSHIP_OPPONENTS},{loadAuthoredAthlete}]=await Promise.all(['entities/Character','content/PlayerAvatars','content/content','world/Navigation','rendering/Math3D','tennis/InteractiveMatchSystem','tennis/MatchInput','tennis/ChampionshipOpponents','animation/AuthoredAthlete'].map(p=>import(new URL('dist/'+p+'.js',root))));
globalThis.fetch=async url=>new Response(fs.readFileSync(new URL(url)));globalThis.Image=class{async decode(){}};await loadAuthoredAthlete();
const report=[];
for(const hz of [30,60,120])for(const id of ['leo','mika'])for(const shot of ['drive','lob']){
 const p=new Character(playerSpec('arjan'),new Vec3(1,0,5),new Navigation([]),{}),o=new Character(memberData.find(s=>s.id===id),new Vec3(1,0,-5),new Navigation([]),{}),input=new MatchInput();let result=null,cueAt=null,frame=0;
 const contacts=[],samples=[],m=new InteractiveMatchSystem(p,o,CHAMPIONSHIP_OPPONENTS[id],input,{onPoint:(winner,reason)=>result={winner,reason},onRallyContact:(side,quality)=>contacts.push({frame,side,quality,shot:m.pending.shot,center:m.pending.hitter.racketContactFrame().center})});
 m.startPoint('player');input.setEnabled(true);input.queueSwing();
 for(;frame<hz*25&&!result;frame++){
  const time=frame/hz,gap=m.receiver==='player'&&m.ball.active?m.ball.position.x-p.position.x:0;
  input.setTouchMovement(Math.abs(gap)>.35?Math.sign(gap):0,0);
  if(m.playerCue()==='swing'&&cueAt===null)cueAt=time;
  if(cueAt!==null&&time-cueAt>=.2){input.queueSwing(shot);cueAt=null;}
  p.update(1/hz);o.update(1/hz);m.update(1/hz);
  samples.push({frame,p:p.position.clone(),o:o.position.clone(),ball:m.ball.position.clone(),v:m.ball.velocity.clone(),active:m.ball.active,rally:m.rallyLength,cue:m.playerCue()});
 }
 report.push({hz,id,shot,result,contacts,samples});m.stop();
}
fs.writeFileSync(process.argv[2],JSON.stringify(report));console.log(report.map(({samples,contacts,...r})=>({...r,frames:samples.length,contacts:contacts.length})));
