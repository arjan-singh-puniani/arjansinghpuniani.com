import {cornerSnapshot,progress} from './simulation.js';
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const easeMotion=t=>t*t*t*(10+t*(-15+6*t));
/** Two fixed-length links, with the bend directed toward a pole rather than splayed sideways. */
export function jointBetween(start,end,upper,lower,pole){
 const delta=end.map((v,i)=>v-start[i]),distance=Math.hypot(...delta),direction=delta.map(v=>v/Math.max(distance,1e-6));
 const d=clamp(distance,Math.abs(upper-lower)+1e-6,upper+lower-1e-6),along=(upper*upper-lower*lower+d*d)/(2*d);
 const projection=pole.reduce((sum,v,i)=>sum+v*direction[i],0),bend=pole.map((v,i)=>v-projection*direction[i]),length=Math.hypot(...bend);
 const height=Math.sqrt(Math.max(0,upper*upper-along*along));
 return start.map((v,i)=>v+direction[i]*along+bend[i]/Math.max(length,1e-6)*height);
}
// A fixed hinge plane avoids pole flips as the wrist passes beneath the shoulder.
export function armElbow(start,end,side){
 const delta=end.map((v,i)=>v-start[i]),length=Math.hypot(...delta),d=delta.map(v=>v/Math.max(length,1e-6));
 const yz=Math.hypot(d[1],d[2]),bend=yz>1e-5?[0,d[2]/yz,-d[1]/yz]:[0,-1,0],angle=-side*.35,c=Math.cos(angle),s=Math.sin(angle);
 const cross=[d[1]*bend[2]-d[2]*bend[1],d[2]*bend[0]-d[0]*bend[2],d[0]*bend[1]-d[1]*bend[0]];
 return jointBetween(start,end,.31,.30,bend.map((v,i)=>v*c+cross[i]*s));
}

export function crewPosture({kneel=0,feet=null,lean=0}={}){
 kneel=clamp(kneel,0,1);const pelvis=[0,mix(.90,.51,kneel),.025*kneel];
 const soles=feet||[-1,1].map((side,i)=>[side*.105,.06,mix(side*.035,i===0?.33:-.33,kneel)-.055]);
 if(feet){pelvis[0]=clamp((soles[0][0]+soles[1][0])*.5,-.14,.14);pelvis[2]+=clamp((soles[0][2]+soles[1][2])*.5+.055,-.14,.14);}
 const standing=1-easeMotion(progress(kneel,0,.25)),lift=soles.map(f=>clamp((f[1]-.06)/.075,0,1));
 pelvis[0]+=(lift[0]-lift[1])*.026*standing;pelvis[1]-=.008*Math.max(...lift)*standing;
 // Lower the pelvis slightly when a planted trailing foot needs more reach; never stretch the leg.
 for(let i=0;i<2;i++){const f=soles[i],horizontal=Math.hypot(f[0]-(pelvis[0]+(i===0?-.105:.105)),f[2]+.055-pelvis[2]);pelvis[1]=Math.min(pelvis[1],f[1]+.025+Math.sqrt(Math.max(.01,.85**2-horizontal**2)));}
 const legs=[-1,1].map((side,i)=>{
  const foot=soles[i],hip=[pelvis[0]+side*.105,pelvis[1],pelvis[2]],ankle=[foot[0],foot[1]+.025,foot[2]+.055];
  return {hip,knee:jointBetween(hip,ankle,.43,.43,[0,0,-1]),ankle,foot,pitch:0};
 });
 return {pelvis,lean:.08+.48*kneel+lean,roll:-pelvis[0]*.2*standing,legs};
}

function cornerMotion(stop,corner,time){
 const c=cornerSnapshot(stop.corners[corner],time),events=stop.corners[corner].events,clearStart=events.find(e=>e.state==='TOOL_CLEAR').start;
 return {c,side:corner.endsWith('L')?1:-1,z:(corner.startsWith('F')?-1.65:1.65)-stop.error,
  ready:easeMotion(progress(time,Math.max(0,stop.stopAt-.65),stop.ready.end)),clear:easeMotion(c.toolClear),
  stand:easeMotion(progress(time,clearStart-.02,clearStart+.60)),retreat:easeMotion(progress(time,clearStart+.60,clearStart+1.20)),
  axial:easeMotion(progress(c.removal,0,.35)),carry:easeMotion(progress(c.removal,.35,1)),
  inward:easeMotion(progress(c.alignment,0,.65)),across:easeMotion(progress(c.alignment,.15,1)),install:easeMotion(c.installation),removalStart:events.find(e=>e.state==='WHEEL_REMOVAL').start,wheelClear:events.find(e=>e.state==='WHEEL_CLEAR').end};
}
export function stationHeading(corner,role){const side=corner.endsWith('L')?1:-1;return role===1?Math.PI-side*.62:role===2?0:side*Math.PI/2;}
/** The body follows the tire transfer with room for a planted knee and bent elbows. */
export function stationCrewPose(stop,corner,role,time,track){
 const m=cornerMotion(stop,corner,time),{c,side,z,ready,clear,stand,retreat,axial,carry}=m;
 const base=role===0?[side*(1.85-.05*ready),0,z]:role===1?[side*(track+.53+.25*axial+.15*carry+.20*retreat),0,z-.90-.46*carry-.23*retreat]:[side*(track+.40+.65*(1-easeMotion(c.alignment))),0,z+.85+.45*(1-easeMotion(c.alignment))];
 if(role===1){const settled=easeMotion(progress(time,stop.stopAt,stop.ready.end));base[0]=side*mix(Math.max(1.55,Math.abs(base[0])),Math.abs(base[0]),settled);}
 if(role!==1){const exit=[side*(role===2?1.75:1.95),0,z+(role===2?1.15:0)];for(let i=0;i<3;i++)base[i]=mix(base[i],exit[i],retreat);}
 const kneel=role===1?1-easeMotion(progress(time,m.removalStart-.10,m.wheelClear+.30)):role===2?.88+.12*easeMotion(c.alignment):1;
 return {root:base,ready,clear,kneel:kneel*(1-stand),lean:role===1?.08+.16*(1-kneel):ready*(1-clear)*(role===0?.20:.12)};
}
export function outgoingWheelPose(stop,corner,time,track,height){
 const {side,z,axial,carry,retreat,removalStart,wheelClear}=cornerMotion(stop,corner,time),standing=easeMotion(progress(time,removalStart-.10,wheelClear+.30));
 return [side*(track+.25*axial+.15*carry+.20*retreat),mix(height,.82,carry*standing),z-.66*carry-.23*retreat];
}
export function incomingWheelPose(stop,corner,time,track,height){
 const {side,z,c,inward,across,install}=cornerMotion(stop,corner,time);
 return [side*(track+.35*(1-inward)+.25*(1-install)),.355+(height-.355)*easeMotion(progress(c.alignment,.35,.9)),z+.75*(1-across)];
}

export function jackCrewPose(stop,index,time){
 const sign=index===0?-1:1,up=index===0?stop.front:stop.rear,down=index===0?stop.frontDown:stop.rearDown;
 const engagement=easeMotion(progress(time,up.start,up.end))*(1-(down?easeMotion(progress(time,down.start,down.end)):0));
 const into=easeMotion(progress(time,stop.stopAt-.66,up.start)),away=down?easeMotion(progress(time,down.start,down.end+.40)):0,x=index===1?-1.30*(1-into+away):1.65*away;
 return {root:[x,0,sign*(3.85+(1-engagement)*.45)-stop.error],kneel:0,lean:engagement*.04,engagement};
}

function desiredFeet(pose,heading){
 const cos=Math.cos(heading),sin=Math.sin(heading);
 return crewPosture({kneel:pose.kneel}).legs.map(({foot:[x,y,z]})=>[pose.root[0]+x*cos+z*sin,y,pose.root[2]-x*sin+z*cos]);
}
// Compile contact times once from the same body path used for rendering, so seeking needs no frame history.
export function planFootContacts(poseAt,start,end,heading){
 const initial=desiredFeet(poseAt(start),heading),anchors=initial.map(p=>[...p]),steps=[];
 let available=start,nextFoot=0;
 for(let time=start;time<end;time+=1/90){
  if(time<available)continue;
  const pose=poseAt(time),desired=desiredFeet(poseAt(Math.min(end,time+.10)),heading),error=desired.map((p,i)=>Math.hypot(p[0]-anchors[i][0],p[2]-anchors[i][2]));
  if(Math.max(...error)<.065)continue;
  const foot=Math.abs(error[0]-error[1])<.04?nextFoot:error[0]>error[1]?0:1,future=poseAt(time+.04);
  const speed=Math.hypot(future.root[0]-pose.root[0],future.root[2]-pose.root[2])/.04;
  const duration=clamp(.24/(1+speed),.10,.22),finish=Math.min(end,time+duration),to=desiredFeet(poseAt(Math.min(end,finish)),heading)[foot];
  steps.push({foot,start:time,end:finish,from:[...anchors[foot]],to});anchors[foot]=to;available=finish;nextFoot=1-foot;
 }
 return {initial,steps};
}
export function feetAt(plan,time){
 return plan.initial.map((initial,foot)=>{
  let position=initial;
  for(const step of plan.steps){
   if(step.foot!==foot)continue;
   if(time<step.start)break;
   if(time>=step.end){position=step.to;continue;}
   const u=clamp((time-step.start)/(step.end-step.start),0,1),ease=easeMotion(u),stride=Math.hypot(step.to[0]-step.from[0],step.to[2]-step.from[2]);
   return {position:step.from.map((v,i)=>mix(v,step.to[i],ease)+(i===1?Math.sin(Math.PI*u)**4*Math.min(.075,Math.max(.018,stride*.18)):0)),planted:false,pitch:-Math.min(.18,stride*.45)*Math.sin(2*Math.PI*ease)};
  }
  return {position:[...position],planted:true,pitch:0};
 });
}
