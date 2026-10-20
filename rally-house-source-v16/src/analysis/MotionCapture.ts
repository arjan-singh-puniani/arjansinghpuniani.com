import {Vec3,clamp,rigidFrame,interpolateRigidFrame} from '../rendering/Math3D.js';
import type {RenderItem} from '../rendering/Renderer.js';
import type {Character,CharacterPose} from '../entities/Character.js';
import {rigFromPose,skinMatrices,type RigPoseLocal} from '../animation/CharacterSkin.js';

export type Joint='knee'|'hip'|'ankle'|'shoulder'|'elbow';
export type LabMode='combined'|'court'|'body';
export type SampleKind='gait'|'forehand'|'serve'|'championship'|'phone';
export interface MotionFrame {
  time:number;root:Vec3;pose:CharacterPose;body:RenderItem[];ball:Vec3|null;
  planted:[boolean,boolean];state:string;contact:boolean;bounce:boolean;
  interpolated?:boolean;
}
export interface MotionClip {name:string;kind:SampleKind;source:'authored-demo'|'game-recording'|'phone-recording';frames:MotionFrame[];}
export const LIMBS=[['shoulderL','elbowL'],['elbowL','handL'],['shoulderR','elbowR'],['elbowR','handR'],['shoulderL','shoulderR'],['shoulderL','hipL'],['shoulderR','hipR'],['hipL','hipR'],['hipL','kneeL'],['kneeL','footL'],['hipR','kneeR'],['kneeR','footR']] as const;
export const JOINT_KEYS=['shoulderL','shoulderR','elbowL','elbowR','handL','handR','hipL','hipR','kneeL','kneeR','footL','footR','pelvisCenter'] as const;
export const FOCUS_KEYS:Record<Joint,keyof CharacterPose>={knee:'kneeR',hip:'hipR',ankle:'footR',shoulder:'shoulderR',elbow:'elbowR'};

/** Matches AnatomyMotion's segment-angle convention; zero-length data abstain. */
export function angle(a:Vec3,v:Vec3,b:Vec3):number|null{
  const x=Vec3.sub(a,v),y=Vec3.sub(b,v),d=x.len()*y.len();
  if(!Number.isFinite(d)||d<1e-9)return null;
  return Math.acos(clamp((x.x*y.x+x.y*y.y+x.z*y.z)/d,-1,1))*180/Math.PI;
}
export function jointTriplet(p:CharacterPose,j:Joint):[Vec3,Vec3,Vec3]|null{
  if(j==='knee')return [p.hipR,p.kneeR,p.footR];
  if(j==='elbow')return [p.shoulderR,p.elbowR,p.handR];
  if(j==='hip')return [p.shoulderR,p.hipR,p.kneeR];
  if(j==='shoulder')return [p.shoulderR.clone().add(Vec3.sub(Vec3.lerp(p.hipL,p.hipR,.5),Vec3.lerp(p.shoulderL,p.shoulderR,.5))),p.shoulderR,p.elbowR];
  // The stylized rig has no independent heel/toe landmark. Do not invent ankle angles.
  return null;
}
export function metric(f:MotionFrame,j:Joint):number|null{
  const t=jointTriplet(f.pose,j);if(!t)return null;
  const value=angle(...t);return value===null?null:j==='knee'||j==='elbow'?180-value:value;
}
export const METRIC_NAMES:Record<Joint,string>={knee:'Right knee flexion',elbow:'Right elbow flexion',hip:'Right trunk–thigh angle',shoulder:'Right upper-arm elevation',ankle:'Right ankle height'};
export function value(f:MotionFrame,j:Joint){return j==='ankle'?f.pose.footR.y:metric(f,j);}
export function detachedBody(items:RenderItem[]):RenderItem[]{
  return items.map(m=>'skin' in m
    ?{...m,position:m.position.clone(),rotation:m.rotation?.clone(),boneMatrices:m.boneMatrices.slice(),scale:m.scale?.clone()}
    :{...m,position:m.position.clone(),rotation:m.rotation?.clone(),scale:m.scale.clone()});
}
export function captureFrame(c:Character,time:number,ball:Vec3|null,contact=false,bounce=false):MotionFrame{
  const k=c.debugKinematics();
  return {time,root:c.position.clone(),pose:c.analysisPose(),body:detachedBody(c.meshes()),ball:ball?.clone()??null,planted:[k.leftFootPlanted,k.rightFootPlanted],state:c.state,contact,bounce};
}
/** Bounded transient capture, never saved or uploaded. Contact frames bypass sampling throttling. */
export class MotionRecorder {
  readonly capacity=360;
  clip:MotionClip={name:'Your recent Championship',kind:'championship',source:'game-recording',frames:[]};
  private time=0;private due=0;private contact=false;private bounce=false;
  reset(){this.clip={name:'Your recent Championship',kind:'championship',source:'game-recording',frames:[]};this.time=this.due=0;this.contact=this.bounce=false;}
  markContact(){this.contact=true;}
  markBounce(){this.bounce=true;}
  record(dt:number,c:Character,ball:Vec3|null){
    if(!Number.isFinite(dt)||dt<=0)return;
    this.time+=dt;this.due+=dt;
    if(this.due<1/30-1e-8&&!this.contact&&!this.bounce)return;
    this.due=0;
    this.clip.frames.push(captureFrame(c,this.time,ball,this.contact,this.bounce));
    this.contact=this.bounce=false;
    if(this.clip.frames.length>this.capacity)this.clip.frames.shift();
  }
}
const angleLerp=(a:number,b:number,t:number)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
const rotationLerp=(a:Vec3|undefined,b:Vec3|undefined,t:number)=>new Vec3(angleLerp(a?.x??0,b?.x??0,t),angleLerp(a?.y??0,b?.y??0,t),angleLerp(a?.z??0,b?.z??0,t));
// Facial expression variants keep their observed geometry until the next sample;
// they must not freeze the moving anatomical skin when the mouth changes.
function compatibleBody(a:MotionFrame,b:MotionFrame){return a.body.length===b.body.length&&a.body.every((part,i)=>{const other=b.body[i];return 'skin' in part?'skin' in other&&part.poseRig===other.poseRig&&(!part.poseRig||part.skin.id===other.skin.id):!('skin' in other)&&part.kind===other.kind&&part.id===other.id;});}
/** Continuous reconstruction between observed neighbours, exact at event/sample times. */
export function interpolateFrame(a:MotionFrame,b:MotionFrame,time:number):MotionFrame{
 const t=(time-a.time)/(b.time-a.time),root=Vec3.lerp(a.root,b.root,t),pose={...a.pose};
 for(const key of Object.keys(pose) as (keyof CharacterPose)[]){
  const x=a.pose[key],y=b.pose[key];
  if(x instanceof Vec3&&y instanceof Vec3)(pose as unknown as Record<string,unknown>)[key]=key==='racketRot'?rotationLerp(x,y,t):Vec3.lerp(x,y,t);
  else if(typeof x==='number'&&typeof y==='number')(pose as unknown as Record<string,unknown>)[key]=key.endsWith('Yaw')?angleLerp(x,y,t):x+(y-x)*t;
 }
 pose.right.normalize();pose.forward.normalize();
 pose.face={...a.pose.face};
 for(const key of Object.keys(pose.face) as (keyof CharacterPose['face'])[])pose.face[key]=a.pose.face[key]+(b.pose.face[key]-a.pose.face[key])*t;
 let bones:Float32Array|undefined;
 const authored=new Map<RigPoseLocal,{bind:RigPoseLocal;pose:RigPoseLocal;matrices:Float32Array}>();
 const body=a.body.map((part,i):RenderItem=>{
  const other=b.body[i],position=Vec3.lerp(part.position,other.position,t),rotation=rotationLerp(part.rotation,other.rotation,t);
  if('skin' in part&&'skin' in other){
   let rig=part.rig,palette=part.boneMatrices;
   if(part.poseRig&&part.rig&&other.rig){
    let source=authored.get(part.rig.bind);
    if(!source){const local=rigFromPose(pose,root,rotation.y);for(const key of ['headUp','headForward','handDirectionL','handDirectionR','handForwardL','handForwardR','foreArmForwardL','foreArmForwardR','footForwardL','footForwardR','footUpL','footUpR'] as const){const x=part.rig.pose[key],y=other.rig.pose[key];if(x&&y)local[key]=Vec3.lerp(x,y,t);}
     for(const side of ['L','R'] as const){const x=part.rig.pose,y=other.rig.pose,dx=x[`handDirection${side}`],dy=y[`handDirection${side}`],fx=x[`handForward${side}`],fy=y[`handForward${side}`];if(dx&&dy&&fx&&fy){const origin=new Vec3(),frame=interpolateRigidFrame(rigidFrame(origin,dx,fx),rigidFrame(origin,dy,fy),t);local[`handDirection${side}`]=new Vec3(frame[4],frame[5],frame[6]);local[`handForward${side}`]=new Vec3(frame[8],frame[9],frame[10]);local[`foreArmForward${side}`]=local[`handForward${side}`];}}
     source={bind:part.rig.bind,pose:local,matrices:skinMatrices(local,part.rig.bind)};authored.set(part.rig.bind,source);}
    rig={bind:source.bind,pose:source.pose};palette=source.matrices;
   }else if(part.poseRig){bones??=skinMatrices(rigFromPose(pose,root,rotation.y));palette=bones;}
   const expression=part.expression&&other.expression?part.expression.map((n,j)=>n+(other.expression![j]-n)*t) as [number,number,number,number]:part.expression;
   const handGrip=part.handGrip&&other.handGrip?part.handGrip.map((n,j)=>n+(other.handGrip![j]-n)*t) as [number,number]:part.handGrip;
   return {...part,position,rotation,rig,expression,handGrip,scale:part.scale&&other.scale?Vec3.lerp(part.scale,other.scale,t):part.scale,boneMatrices:palette};
  }
  if('skin' in part||'skin' in other)throw Error('Replay topology changed');
  return {...part,position,rotation,scale:Vec3.lerp(part.scale,other.scale,t),alpha:(part.alpha??1)+((other.alpha??1)-(part.alpha??1))*t};
 });
 return {time,root,pose,body,ball:a.ball&&b.ball?Vec3.lerp(a.ball,b.ball,t):null,planted:[...a.planted],state:a.state,contact:false,bounce:false,interpolated:true};
}

/** One continuous pose owns avatar, overlay, hit targets, ball and measurements. Gaps remain missing. */
export class ReplayTimeline {
  time=0;playing=true;speed=1;focus:Joint='knee';mode:LabMode='combined';
  private cachedTime=NaN;private cachedFrame:MotionFrame|null=null;
  constructor(public clip:MotionClip){this.load(clip);}
  get start(){return this.clip.frames[0]?.time??0;}
  get end(){return this.clip.frames.at(-1)?.time??0;}
  load(clip:MotionClip){
    if(!clip.frames.length||clip.frames.some((f,i)=>!Number.isFinite(f.time)||(i>0&&f.time<=clip.frames[i-1].time)))throw Error('Replay requires finite, strictly increasing samples');
    this.clip=clip;this.time=this.start;this.playing=true;this.cachedTime=NaN;this.cachedFrame=null;
  }
  seek(time:number){if(Number.isFinite(time))this.time=clamp(time,this.start,this.end);}
  update(dt:number,contactSlowdown:boolean){
    if(!this.playing||!Number.isFinite(dt)||dt<=0)return;
    const near=contactSlowdown&&this.clip.frames.some(f=>f.contact&&Math.abs(f.time-this.time)<.16);
    this.seek(this.time+Math.min(dt,.1)*this.speed*(near?.22:1));
    if(this.time>=this.end)this.playing=false;
  }
  private rightIndex(){
    let low=0,high=this.clip.frames.length;
    while(low<high){const mid=(low+high)>>>1;if(this.clip.frames[mid].time<this.time)low=mid+1;else high=mid;}
    return low;
  }
  index(){
    const low=this.rightIndex(),a=Math.max(0,low-1),b=Math.min(low,this.clip.frames.length-1);
    return Math.abs(this.clip.frames[a].time-this.time)<=Math.abs(this.clip.frames[b].time-this.time)?a:b;
  }
  historyIndex(){const low=this.rightIndex();return Math.min(this.clip.frames.length-1,Math.max(0,this.clip.frames[low]?.time===this.time?low:low-1));}
  get frame():MotionFrame|null{
    if(this.cachedTime===this.time)return this.cachedFrame;
    this.cachedTime=this.time;
    const low=this.rightIndex(),frames=this.clip.frames,a=frames[Math.max(0,low-1)],b=frames[Math.min(low,frames.length-1)];
    if(Math.abs(a.time-this.time)<1e-9)return this.cachedFrame=a;
    if(Math.abs(b.time-this.time)<1e-9)return this.cachedFrame=b;
    if(b.time-a.time<=.15&&compatibleBody(a,b))return this.cachedFrame=interpolateFrame(a,b,this.time);
    const nearest=frames[this.index()];return this.cachedFrame=Math.abs(nearest.time-this.time)<=.075?nearest:null;
  }
}
export function summary(clip:MotionClip){
  let distance=0,steps=0,observedDuration=0,hasGap=false;const times:number[]=[],stance=[0,0],lastPlant:[Vec3|null,Vec3|null]=[null,null],strides:number[]=[];
  for(let i=1;i<clip.frames.length;i++){
    const a=clip.frames[i-1],b=clip.frames[i];
    if(b.time-a.time>.15){hasGap=true;lastPlant[0]=lastPlant[1]=null;continue;}
    observedDuration+=b.time-a.time;
    distance+=Math.hypot(b.root.x-a.root.x,b.root.z-a.root.z);
    for(let foot=0;foot<2;foot++){
      if(a.planted[foot])stance[foot]+=b.time-a.time;
      if(!a.planted[foot]&&b.planted[foot]){
        steps++;times.push(b.time);const p=foot?b.pose.footR:b.pose.footL;
        if(lastPlant[foot])strides.push(Math.hypot(p.x-lastPlant[foot]!.x,p.z-lastPlant[foot]!.z));
        lastPlant[foot]=p;
      }
    }
  }
  const duration=(clip.frames.at(-1)?.time??0)-(clip.frames[0]?.time??0);
  // Cadence is only meaningful for repeated locomotion foot contacts, not static stroke poses.
  const cadence=clip.kind==='gait'&&!hasGap&&times.length>2?60*(times.length-1)/(times.at(-1)!-times[0]):null;
  return {distance,steps,duration,cadence,stance:stance.map(n=>observedDuration?100*n/observedDuration:0),stride:strides.length?strides.reduce((a,b)=>a+b,0)/strides.length:null,contacts:clip.frames.filter(f=>f.contact).length,bounces:clip.frames.filter(f=>f.bounce).length};
}
