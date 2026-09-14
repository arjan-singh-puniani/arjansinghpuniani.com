from pathlib import Path
p=Path('src/simulation/CharacterMind.ts');s=p.read_text()
s=s.replace('detail:string;}\nexport interface Possession','detail:string;memoryClass?:\'foundational\'|\'major\'|\'ordinary\';count?:number;}\nexport interface Possession')
s=s.replace('this.time+=dt;','this.time+=dt;\n  for(const key of Object.keys(this.culture) as (keyof MindSave[\'culture\'])[])this.culture[key]=.15+(this.culture[key]-.15)*Math.exp(-dt/2400);')
a=s.index(' remember(m:PersonalMemory)');b=s.index(' recall(',a)
s=s[:a]+''' reinforceCulture(key:keyof MindSave['culture'],weight:number){this.culture[key]=clamp(this.culture[key]+(1-this.culture[key])*clamp(weight,0,1),0,1);}
 remember(m:PersonalMemory){
  if(this.memories.some(e=>e.id===m.id))return;
  const foundation=m.importance>=.95&&['match','lesson','witness'].includes(m.topic)&&!this.memories.some(e=>e.person===m.person&&e.topic===m.topic&&e.memoryClass==='foundational');
  m={...m,memoryClass:foundation?'foundational':m.importance>=.95?'major':'ordinary',count:m.count??1};
  if(m.importance<.7){const same=this.memories.filter(e=>e.importance<.7&&e.person===m.person&&e.topic===m.topic&&e.place===m.place&&[...e.people].sort().join('|')===[...m.people].sort().join('|'));
   if(same.length>=2||same.some(e=>(e.count??1)>=3)){m.count+=same.reduce((n,e)=>n+(e.count??1),0);m.detail=m.topic==='company'?'Often made time for company here.':m.topic==='rest'?'Often took a quiet break here.':m.topic==='practice'?'Returned here to rehearse the small things.':m.detail;this.memories=this.memories.filter(e=>!same.includes(e));}
  }
  this.memories.unshift(m);this.retain();
 }
 private retain(){
  const foundations=this.memories.filter(m=>m.memoryClass==='foundational').slice(0,12);
  const major=this.memories.filter(m=>m.memoryClass!=='foundational'&&m.importance>=.95).sort((a,b)=>b.day-a.day).slice(0,24);
  const ordinary=this.memories.filter(m=>m.importance<.95).sort((a,b)=>b.day-a.day).slice(0,48);
  this.memories=[...foundations,...major,...ordinary].sort((a,b)=>b.day-a.day);
  this.events=this.events.slice(0,48);
 }
''' +s[b:]
s=s.replace('this.culture[culture]=clamp(this.culture[culture]+.025,0,1);','this.reinforceCulture(culture,.025);')
s=s.replace('this.events=this.events.filter((e,i)=>i<40||e.importance>=.95);','this.events=this.events.slice(0,48);')
s=s.replace('this.culture.competition=clamp(this.culture.competition+.045,0,1);',"this.reinforceCulture('competition',.045);")
s=s.replace('this.culture.training=clamp(this.culture.training+.045,0,1);',"this.reinforceCulture('training',.045);")
s=s.replace("for(const r of s.recent)","for(const m of s.memories)if((m.memoryClass!==undefined&&!['foundational','major','ordinary'].includes(m.memoryClass))||(m.count!==undefined&&(!Number.isSafeInteger(m.count)||m.count<1)))fail();\n  for(const r of s.recent)")
s=s.replace('this.recent=this.recent.slice(0,32);\n }',"this.recent=this.recent.slice(0,32);\n  const old=[...this.memories].sort((a,b)=>a.day-b.day);this.memories=[];for(const m of old)this.remember(m);this.retain();\n }")
p.write_text(s)
p=Path('src/entities/Character.ts');s=p.read_text();s="import {ActingState,type ReactionName} from '../animation/ActingState.js';\n"+s
s=s.replace('  position:Vec3; yaw=0;',"  acting:ActingState;crowd:Character[]=[];majorActivity=false;private crowdCooldown=0;private gazeYaw=0;private gazeStarted=false;private gazeClock=0;\n  seatHeight=.54;\n  react(name:ReactionName,target?:Vec3,duration=18){this.acting.react(name,duration);if(target)this.setLook(target);}\n  position:Vec3; yaw=0;")
s=s.replace('this.position=start.clone();','this.acting=new ActingState(spec.id);this.position=start.clone();',1)
s=s.replace('const dest=this.destinations[id];if(!dest)return;', 'const original=this.destinations[id];if(!original)return;const dest=this.freeDestination(original);')
s=s.replace('  goTo(dest:Vec3', '''  freeDestination(dest:Vec3){
    const clear=(p:Vec3)=>!this.nav.isBlocked(p.x,p.z)&&this.crowd.every(c=>c===this||Math.hypot(p.x-c.position.x,p.z-c.position.z)>.92);
    if(clear(dest))return dest;
    for(const radius of [1.05,1.55,2.05])for(let i=0;i<8;i++){const p=new Vec3(dest.x+Math.cos(i*Math.PI/4)*radius,0,dest.z+Math.sin(i*Math.PI/4)*radius);if(clear(p)&&this.nav.clubPath(this.position,p).length)return p;}
    return this.position.clone();
  }
  private crowdStep(target:Vec3,step:number){
    if(this.majorActivity||!this.crowd.length)return step;
    const delta=Vec3.sub(target,this.position),length=Math.hypot(delta.x,delta.z);if(!length)return step;
    const dx=delta.x/length,dz=delta.z/length;
    const blockers=this.crowd.filter(c=>c!==this&&Math.hypot(c.position.x-this.position.x,c.position.z-this.position.z)<1.5);
    const blocked=blockers.some(c=>{const before=Math.hypot(c.position.x-this.position.x,c.position.z-this.position.z),after=Math.hypot(c.position.x-this.position.x-dx*step,c.position.z-this.position.z-dz*step);return after<.82&&after<before-1e-6;});
    if(!blocked)return step;
    if(this.crowdCooldown<=0){
      this.crowdCooldown=.7;const goal=this.path[this.path.length-1];
      const detour=new Vec3(this.position.x+dx*.3+dz*1.05,0,this.position.z+dz*.3-dx*1.05);
      const dynamic=new Navigation([...this.nav.obstacles,...blockers.map(c=>({x:c.position.x,z:c.position.z,w:.72,d:.72}))]);
      const first=dynamic.clubPath(this.position,detour),last=goal?dynamic.clubPath(detour,goal):[];
      const path=first.length&&last.length?[...first,...last]:goal?dynamic.clubPath(this.position,goal):[];
      if(path.length){this.path=path;this.pathIndex=0;}
    }
    return 0;
  }
  goTo(dest:Vec3''')
s=s.replace("import type {Navigation}","import {Navigation}")
s=s.replace('    this.animTime+=dt;',"    this.acting.update(dt,this.majorActivity||isShot(this.state)||this.state==='shuffle');this.crowdCooldown-=dt;this.gazeClock+=dt;\n    const look=this.targetLook??this.conversationTarget;let aim=look?Math.atan2(look.x-this.position.x,look.z-this.position.z):this.yaw;\n    if(look&&!this.majorActivity&&this.acting.role!=='none'&&this.gazeClock%(this.acting.values.gazeHold+1)>this.acting.values.gazeHold)aim+=.24;\n    if(!this.gazeStarted){this.gazeYaw=this.yaw;this.gazeStarted=true;}this.gazeYaw=dampAngle(this.gazeYaw,aim,5,dt);\n    this.animTime+=dt;")
s=s.replace('Math.min(this.speed,Math.sqrt', 'Math.min(this.speed*this.acting.values.stepEnergy,Math.sqrt')
s=s.replace('const step=Math.min(dist,this.travelSpeed*dt);','const step=this.crowdStep(target,Math.min(dist,this.travelSpeed*dt));')
s=s.replace("isShot(this.state)?12:locomotionStyle.turnSharpness", "isShot(this.state)?12:this.acting.role==='speak'||this.acting.role==='listen'?2.8:locomotionStyle.turnSharpness")
s=s.replace('const desired=this.expressionFor(this.state);',"const desired=this.expressionFor(this.state),reaction=this.acting.reaction,w=this.acting.reactionWeight;\n    if(!isShot(this.state)){desired.smile=clamp(desired.smile+this.acting.values.smileBias+(reaction?.smile??0)*w,-.5,1);desired.browRaise=clamp(desired.browRaise+this.acting.values.browBias+(reaction?.brow??0)*w,-.25,1);}")
s=s.replace("MOVING.has(next)||MOVING.has(this.previousState)?.18:.22;", "MOVING.has(next)||MOVING.has(this.previousState)?.18:next==='sit'||this.previousState==='sit'?.65:.26;")
s=s.replace("(this.seatDepth?-.30:.13)","(this.seatHeight+.10-.79)")
s=s.replace('let targetHeadYaw=this.yaw;const lookTarget=this.targetLook??this.conversationTarget;if(lookTarget)targetHeadYaw=Math.atan2(lookTarget.x-this.position.x,lookTarget.z-this.position.z);', 'const targetHeadYaw=this.gazeYaw;')
s=s.replace('const feminine=this.spec.presentation',"const actingLift=shot?0:this.acting.values.postureLift+(this.acting.reaction?.lift??0)*this.acting.reactionWeight;torsoCenter.y+=actingLift;\n    const feminine=this.spec.presentation")
s=s.replace('const neutralL=this.worldLocal',"shoulderL.y+=actingLift;shoulderR.y+=actingLift;\n    if(!shot){shoulderL.add(this.localVector(-this.acting.values.shoulderOpenness,0,0));shoulderR.add(this.localVector(this.acting.values.shoulderOpenness,0,0));}\n    const neutralL=this.worldLocal")
s=s.replace("if(state==='talk'){handL=this.worldLocal(-.56,1.24+baseY,.22+.06*Math.sin(time*3));handR=this.worldLocal(.48,1.18+baseY,.28+.08*Math.cos(time*2.4));}","if(state==='talk'){const amp=this.acting.values.gestureAmplitude;handL=this.worldLocal(-.39,1.08+baseY,.14+.035*Math.sin(time*2.1));handR=this.worldLocal(.38,1.18+baseY,.26+.09*amp*Math.sin(time*2.4));}\n    if(sit){handL=this.worldLocal(-.20,.88+baseY,.28);handR=this.worldLocal(.20,.88+baseY,.28);}")
s=s.replace("// Racket constraint: the hand owns the grip.","""if(!shot&&!moving&&!shuffle){
      if(this.acting.role==='listen'&&this.socialGesture==='none'){handL=Vec3.lerp(handL,neutralL,.65);handR=Vec3.lerp(handR,neutralR,.65);}
      const micro=this.acting.micro,pulse=Math.sin(this.acting.clock*3)*.035;
      if(micro==='headband-adjust')handR=this.worldLocal(.26,1.99+baseY,.05);
      if(micro==='string-check'||micro==='note-tap'){handL=this.worldLocal(-.12,1.15+baseY,.33);handR=this.worldLocal(.12,1.18+baseY+pulse,.35);}
      if(micro==='leaf-inspect')handL=this.worldLocal(-.20,1.18+baseY,.43);
      if(micro==='cup-turn')handR=this.worldLocal(.23,1.25+baseY,.27+pulse);
    }
    // Racket constraint: the hand owns the grip.""")
s=s.replace('const head=this.worldLocal(pelvisShiftX*.25,1.80+baseY+breathe', 'const head=this.worldLocal(pelvisShiftX*.25,1.80+baseY+actingLift+breathe')
s=s.replace("const elbowL=Vec3.lerp", "if(sit){kneeL.copy?.(kneeL);}\n    const elbowL=Vec3.lerp") if False else s
s=s.replace('const headStabilize=moving?',"if(sit){const l=this.worldLocal(-.22,this.seatHeight+.08,.35),r=this.worldLocal(.22,this.seatHeight+.08,.35);kneeL.set(l.x,l.y,l.z);kneeR.set(r.x,r.y,r.z);}\n    const headStabilize=moving?")
s=s.replace('this.seatDepth?.11:.18+baseY', '.11')
s=s.replace("new Vec3(.19,.19,.19)","new Vec3(.22,.24,.18)")
s=s.replace('    const faceShape=',"    for(const [hand,side] of [[handL,-1],[handR,1]] as const)m.push({kind:'sphere',position:Vec3.add(hand,this.localVector(-side*.075,.025,.045)),scale:new Vec3(.095,.12,.10),color:this.spec.skin,material:'skin'});\n    const headStart=m.length;\n    const faceShape=")
s=s.replace('new Vec3(.084,.069*eyeOpen,.038)','new Vec3(.108,.088*eyeOpen,.038)').replace('new Vec3(.034,.040*eyeOpen,.023)','new Vec3(.053,.063*eyeOpen,.023)')
s=s.replace("color:this.spec.eye??'#34483f'","color:mixHex(this.spec.eye??'#34483f','#17271f',.55)")
s=s.replace('new Vec3(.86,.88,.12)','new Vec3(.64,.65,.09)')
s=s.replace('    if(this.spec.avatar){',"""    // Scale the existing face/hair together, retaining identity and the skeletal contact rig.
    const tilt=this.majorActivity?0:this.acting.values.headTilt+(this.acting.reaction?.tilt??0)*this.acting.reactionWeight;
    for(const item of m.slice(headStart)){if('skin' in item)continue;const offset=Vec3.sub(item.position,head),x=Vec3.dot(offset,right),y=offset.y;item.position.add(right.clone().scale((x*Math.cos(tilt)-y*Math.sin(tilt)-x))).add(new Vec3(0,x*Math.sin(tilt)+y*Math.cos(tilt)-y,0));item.position=Vec3.add(head,Vec3.sub(item.position,head).scale(1.10));item.scale.scale(1.10);}
    if(this.spec.avatar){""")
s=s.replace("if(this.spec.id!=='nia'&&(!this.spec.avatar||pose.shot||this.state==='ready'||this.state==='shuffle')", "if(this.spec.id!=='nia'&&(pose.shot||this.state==='ready'||this.state==='shuffle'||this.socialGesture==='inspect'&&!this.racketStowed)")
p.write_text(s)
