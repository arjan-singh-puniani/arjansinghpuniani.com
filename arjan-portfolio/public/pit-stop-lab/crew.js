import {cornerSnapshot,progress} from './simulation.js';
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const easeMotion=t=>t*t*(3-2*t);
/** Two fixed-length links, with the bend directed toward a pole rather than splayed sideways. */
export function jointBetween(start,end,upper,lower,pole){
 const delta=end.map((v,i)=>v-start[i]),distance=Math.hypot(...delta),direction=delta.map(v=>v/Math.max(distance,1e-6));
 const d=clamp(distance,Math.abs(upper-lower)+1e-6,upper+lower-1e-6),along=(upper*upper-lower*lower+d*d)/(2*d);
 const projection=pole.reduce((sum,v,i)=>sum+v*direction[i],0),bend=pole.map((v,i)=>v-projection*direction[i]),length=Math.hypot(...bend);
 const height=Math.sqrt(Math.max(0,upper*upper-along*along));
 return start.map((v,i)=>v+direction[i]*along+bend[i]/Math.max(length,1e-6)*height);
}
export function crewPosture({kneel=0,feet=null,lean=0}={}){
 kneel=clamp(kneel,0,1);const pelvis=[0,mix(.90,.51,kneel),.025*kneel];
 const soles=feet||[-1,1].map((side,i)=>[side*.105,.06,mix(side*.035,i===0?.33:-.33,kneel)-.055]);
 if(feet){pelvis[0]=clamp((soles[0][0]+soles[1][0])*.5,-.14,.14);pelvis[2]+=clamp((soles[0][2]+soles[1][2])*.5+.055,-.14,.14);}
 const swing=soles.findIndex(f=>f[1]>.0605);if(kneel<.1&&swing>=0){const weight=Math.min(1,(soles[swing][1]-.06)/.035);pelvis[0]=clamp(soles[1-swing][0]*.25,-.035,.035)*weight;pelvis[1]-=.006*weight;}
 // Lower the pelvis slightly when a planted trailing foot needs more reach; never stretch the leg.
 for(let i=0;i<2;i++){const f=soles[i],horizontal=Math.hypot(f[0]-(pelvis[0]+(i===0?-.105:.105)),f[2]+.055-pelvis[2]);pelvis[1]=Math.min(pelvis[1],f[1]+.025+Math.sqrt(Math.max(.01,.85**2-horizontal**2)));}
 const legs=[-1,1].map((side,i)=>{
  const foot=soles[i],hip=[pelvis[0]+side*.105,pelvis[1],pelvis[2]],ankle=[foot[0],foot[1]+.025,foot[2]+.055];
  return {hip,knee:jointBetween(hip,ankle,.43,.43,[0,0,-1]),ankle,foot,pitch:0};
 });
 return {pelvis,lean:.08+.48*kneel+lean,legs};
}

/** Service positions belong to the bay, never to a wheel on the approaching car. */
export function stationHeading(corner,role){return role===1?Math.PI:role===2?0:corner.endsWith('L')?Math.PI/2:-Math.PI/2;}
export function stationCrewPose(stop,corner,role,time,track){
 const side=corner.endsWith('L')?1:-1,z=(corner.startsWith('F')?-1.65:1.65)-stop.error,c=cornerSnapshot(stop.corners[corner],time);
 const ready=easeMotion(progress(time,Math.max(0,stop.stopAt-.65),stop.ready.end)),clear=easeMotion(c.toolClear);
 const clearStart=stop.corners[corner].events.find(e=>e.state==='TOOL_CLEAR').start;
 const retreat=easeMotion(progress(time,clearStart+.38,clearStart+.88)),stand=easeMotion(progress(time,clearStart-.02,clearStart+.38));
 const axial=easeMotion(Math.min(1,c.removal/.35)),carried=easeMotion(progress(c.removal,.35,1)),inward=easeMotion(progress(c.alignment,0,.65)),across=easeMotion(progress(c.alignment,.15,1)),installation=easeMotion(c.installation),offset=role===1?-.68:role===2?.74:0;
 const staging=role===2?[side*(track+1.35),0,z+1.53]:role===1?[side*(track+.58),0,z-.62]:[side*1.85,0,z];
 const service=role===0?[side*1.8,0,z]:role===1?[side*(track+.58+.25*axial+.40*easeMotion(progress(carried,.6,1))),0,z-.62-.47*carried]:[side*Math.max(1.30,track+.45+.65*(1-inward)+.25*(1-installation)),0,z+.73+.80*(1-across)];
 const root=service.map((v,i)=>mix(staging[i],v,ready));
 const exit=[side*(role===1?2.05:1.95),0,z+(role===1?-1.01:role===2?1.1:offset)];
 for(let i=0;i<3;i++)root[i]=mix(root[i],exit[i],retreat);
 const servicePose=role===0?1:role===1?1-easeMotion(progress(time,stop.corners[corner].events.find(e=>e.state==='WHEEL_CLEAR').end,stop.corners[corner].events.find(e=>e.state==='WHEEL_CLEAR').end+.35)):.85+.15*easeMotion(progress(c.alignment,.35,.95));
 return {root,ready,clear,kneel:servicePose*(1-stand),lean:ready*(1-clear)*(role===0?.20:role===1?.08-.23*servicePose:.18)};
}

export function outgoingWheelPose(stop,corner,time,track,height){
 const c=cornerSnapshot(stop.corners[corner],time),side=corner.endsWith('L')?1:-1;
 const carry=easeMotion(progress(c.removal,.35,1)),handler=stationCrewPose(stop,corner,1,time,track);
 return [handler.root[0]-side*.58,mix(height,.75,carry),handler.root[2]+.62-.28*carry];
}

export function jackCrewPose(stop,index,time){
 const sign=index===0?-1:1,up=index===0?stop.front:stop.rear,down=index===0?stop.frontDown:stop.rearDown;
 const engagement=progress(time,up.start,up.end)*(1-(down?progress(time,down.start,down.end):0));
 const into=easeMotion(progress(time,stop.stopAt-.48,up.start)),away=down?easeMotion(progress(time,down.start,down.end+.40)):0,x=index===1?-1.30*(1-into+away):1.65*away;
 return {root:[x,0,sign*(3.85+(1-engagement)*.45)-stop.error],kneel:0,lean:engagement*.04};
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
   const u=clamp((time-step.start)/(step.end-step.start),0,1),ease=u*u*(3-2*u);
   return {position:step.from.map((v,i)=>mix(v,step.to[i],ease)+(i===1?Math.sin(Math.PI*u)**2*.075:0)),planted:false,pitch:-.28*Math.sin(2*Math.PI*ease)};
  }
  return {position:[...position],planted:true,pitch:0};
 });
}
