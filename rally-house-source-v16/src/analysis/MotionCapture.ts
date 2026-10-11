import {Vec3,clamp} from '../rendering/Math3D.js';
import type {RenderItem} from '../rendering/Renderer.js';
import type {Character,CharacterPose} from '../entities/Character.js';

export type Joint='knee'|'hip'|'ankle'|'shoulder'|'elbow';
export type LabMode='combined'|'court'|'body';
export type SampleKind='gait'|'forehand'|'serve'|'championship';
export interface MotionFrame {
  time:number;root:Vec3;pose:CharacterPose;body:RenderItem[];ball:Vec3|null;
  planted:[boolean,boolean];state:string;contact:boolean;bounce:boolean;
}
export interface MotionClip {name:string;kind:SampleKind;source:'authored-demo'|'game-recording';frames:MotionFrame[];}
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
/** Replay uses a nearest recorded sample, never bridges an unobserved gap. */
export class ReplayTimeline {
  time=0;playing=true;speed=1;focus:Joint='knee';mode:LabMode='combined';
  constructor(public clip:MotionClip){this.load(clip);}
  get start(){return this.clip.frames[0]?.time??0;}
  get end(){return this.clip.frames.at(-1)?.time??0;}
  load(clip:MotionClip){
    if(!clip.frames.length||clip.frames.some((f,i)=>!Number.isFinite(f.time)||(i>0&&f.time<=clip.frames[i-1].time)))throw Error('Replay requires finite, strictly increasing samples');
    this.clip=clip;this.time=this.start;this.playing=true;
  }
  seek(time:number){if(Number.isFinite(time))this.time=clamp(time,this.start,this.end);}
  update(dt:number,contactSlowdown:boolean){
    if(!this.playing||!Number.isFinite(dt)||dt<=0)return;
    const near=contactSlowdown&&this.clip.frames.some(f=>f.contact&&Math.abs(f.time-this.time)<.16);
    this.seek(this.time+Math.min(dt,.1)*this.speed*(near?.22:1));
    if(this.time>=this.end)this.playing=false;
  }
  index(){
    let low=0,high=this.clip.frames.length;
    while(low<high){const mid=(low+high)>>>1;if(this.clip.frames[mid].time<this.time)low=mid+1;else high=mid;}
    const a=Math.max(0,low-1),b=Math.min(low,this.clip.frames.length-1);
    return Math.abs(this.clip.frames[a].time-this.time)<=Math.abs(this.clip.frames[b].time-this.time)?a:b;
  }
  get frame():MotionFrame|null{const f=this.clip.frames[this.index()];return Math.abs(f.time-this.time)<=.075?f:null;}
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
