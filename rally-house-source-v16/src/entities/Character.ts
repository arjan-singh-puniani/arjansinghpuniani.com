import {RACKET,RACKET_FRAME,RACKET_BONES,secondRacketHand} from '../animation/RacketGeometry.js';
import {CHAMPIONSHIP_TUNING} from '../tennis/ChampionshipTuning.js';
import {ActingState,type ReactionName} from '../animation/ActingState.js';
import {WalkCycle} from '../animation/WalkCycle.js';
import {Vec3, clamp, smoothstep, rigidFrame, interpolateRigidFrame} from '../rendering/Math3D.js';
import type {Mesh,RenderItem,SkinnedMesh} from '../rendering/Renderer.js';
import {Navigation} from '../world/Navigation.js';
import {clipForState,sampleClip} from '../animation/ClipLibrary.js';
import {taylorHeadMeshes,taylorTailMeshes,taylorFootMeshes,TAYLOR_PALETTE} from '../animation/TaylorAppearance.js';
import {adultTaylorPose,TAYLOR_BODY} from '../animation/TaylorBody.js';
import {humanTaylorHead} from '../animation/TaylorHuman.js';
import {CHARACTER_SKIN,HUMAN_TENNIS_SKIN,ATHLETE_WARDROBE,skinMatrices,rigFromPose} from '../animation/CharacterSkin.js';
import {CAST_DESIGN} from '../content/CastDesign.js';
import {authoredAthleteMeshes,authoredArmLengths,advanceAuthoredHands,type AuthoredHandPose} from '../animation/AuthoredAthlete.js';

export type AnimState='idle'|'walk'|'jog'|'ready'|'shuffle'|'sit'|'talk'|'drink'|'stretch'|'watch'|'swingForehand'|'swingBackhand'|'serve'|'volley'|'celebrate'|'reactMiss'|'coachFeed'|'coachExplain';
export type EmotionState='neutral'|'attentive'|'friendly'|'focused'|'amused'|'pleased'|'disappointed'|'tired'|'surprised'|'proud'|'frustrated';
export type CourtPhase='neutral'|'split'|'adjust'|'load'|'stroke'|'recover';
export interface CharacterSpec {
  appearance?:'human'|'feline';
  id:string;name:string;role:string;shirt:string;skin:string;hair:string;playStyle:string;goal:string;
  accent?:string;eye?:string;avatar?:'taylor'|'arjan';hairStyle?:'cap'|'bun'|'crop'|'waves'|'ponytail'|'bob'|'long'|'swept';presentation?:'feminine'|'masculine'|'neutral';outfit?:'skirt'|'skort'|'shorts'|'host';shoe?:string;quirk?:string;likes?:string[];
}


export interface LocomotionStyle {cadence:number;bounce:number;armSwing:number;hipSwing:number;torsoCounter:number;stride:number;headStabilize:number;turnSharpness:number;}
export function locomotionStyleFor(id:string):LocomotionStyle{
  if(id==='coach')return {cadence:4.22,bounce:.018,armSwing:.155,hipSwing:.042,torsoCounter:.048,stride:.94,headStabilize:.72,turnSharpness:8.0};
  if(id==='mika')return {cadence:4.58,bounce:.030,armSwing:.235,hipSwing:.060,torsoCounter:.070,stride:.96,headStabilize:.60,turnSharpness:8.7};
  if(id==='nia')return {cadence:4.34,bounce:.022,armSwing:.185,hipSwing:.048,torsoCounter:.056,stride:.91,headStabilize:.68,turnSharpness:7.6};
  if(id==='leo')return {cadence:4.12,bounce:.024,armSwing:.250,hipSwing:.064,torsoCounter:.074,stride:1.04,headStabilize:.64,turnSharpness:8.4};
  return {cadence:4.38,bounce:.022,armSwing:.205,hipSwing:.052,torsoCounter:.060,stride:1,headStabilize:.66,turnSharpness:8.2};
}

type ShotState='swingForehand'|'swingBackhand'|'serve'|'volley';
const isShot=(s:AnimState):s is ShotState=>s==='swingForehand'||s==='swingBackhand'||s==='serve'||s==='volley';
const MOVING=new Set<AnimState>(['walk','jog','shuffle']);

interface FacePose {smile:number;mouthOpen:number;browRaise:number;squint:number;focus:number;}
export interface CharacterPose extends Partial<AuthoredHandPose> {
  baseY:number;breathe:number;walking:boolean;gait:number;torsoYaw:number;hipYaw:number;headYaw:number;eyeYaw?:number;seatedWeight?:number;right:Vec3;forward:Vec3;
  shoulderL:Vec3;shoulderR:Vec3;elbowL:Vec3;elbowR:Vec3;handL:Vec3;handR:Vec3;wristL?:Vec3;wristR?:Vec3;hipL:Vec3;hipR:Vec3;kneeL:Vec3;kneeR:Vec3;footL:Vec3;footR:Vec3;
  torsoCenter:Vec3;pelvisCenter:Vec3;chest?:Vec3;head:Vec3;racketGrip:Vec3;racketHandleTop:Vec3;racketCenter:Vec3;racketRot:Vec3;
  lean:number;knee:number;shot:boolean;sp:number;face:FacePose;weightShift:number;
  footPitchL?:number;footPitchR?:number;footYawL?:number;footYawR?:number;
  footRecoveryL?:number;footRecoveryR?:number;
  footPivotL?:Vec3;footPivotR?:Vec3;
  handRestWeight:number;handLapWeight:number;handGripL:number;handGripR:number;handRacketWeight:number;
}
type Pose=CharacterPose;

export interface CharacterKinematics {
  leftFoot:Vec3;rightFoot:Vec3;leftHand:Vec3;rightHand:Vec3;leftFootPlanted:boolean;rightFootPlanted:boolean;racketGrip:Vec3;racketCenter:Vec3;
  contactTarget:Vec3|null;contactError:number;state:AnimState;transition:number;locomotion:number;courtPhase:CourtPhase;development:number;racketVibration:number;
  strokePlant:{foot:'L'|'R';weight:number;anchor:Vec3}|null;
  motionBlend:{idle:number;walk:number;jog:number;lateral:number;forward:number;backward:number};
}

function expDamp(current:number,target:number,sharpness:number,dt:number){return current+(target-current)*(1-Math.exp(-sharpness*dt));}
function angleDelta(a:number,b:number){let d=(b-a+Math.PI)%(Math.PI*2)-Math.PI;if(d<-Math.PI)d+=Math.PI*2;return d;}
function dampAngle(current:number,target:number,sharpness:number,dt:number){return current+angleDelta(current,target)*(1-Math.exp(-sharpness*dt));}
function bell(x:number,width:number){const q=x/Math.max(.001,width);return Math.exp(-q*q*3.2);}
function blendVec(a:Vec3,b:Vec3,t:number){return Vec3.lerp(a,b,t);}
function blendFace(a:FacePose,b:FacePose,t:number):FacePose{return {smile:a.smile+(b.smile-a.smile)*t,mouthOpen:a.mouthOpen+(b.mouthOpen-a.mouthOpen)*t,browRaise:a.browRaise+(b.browRaise-a.browRaise)*t,squint:a.squint+(b.squint-a.squint)*t,focus:a.focus+(b.focus-a.focus)*t};}
function mixHex(a:string,b:string,t:number){const parse=(h:string)=>{const s=h.replace('#','');return [parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)]};const aa=parse(a),bb=parse(b),c=aa.map((v,i)=>Math.round(v+(bb[i]-v)*t));return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');}

/** Rotate a local racket-plane vector by the same Y * X * Z order used by Math3D.compose. */
function rotateEulerVector(v:Vec3,r:Vec3){
  const cz=Math.cos(r.z),sz=Math.sin(r.z),cx=Math.cos(r.x),sx=Math.sin(r.x),cy=Math.cos(r.y),sy=Math.sin(r.y);
  const zx=v.x*cz-v.y*sz,zy=v.x*sz+v.y*cz,zz=v.z;
  const xx=zx,xy=zy*cx-zz*sx,xz=zy*sx+zz*cx;
  return new Vec3(xx*cy+xz*sy,xy,-xx*sy+xz*cy);
}

export class Character {
  get id(){return this.spec.id;}
  acting:ActingState;crowd:Character[]=[];majorActivity=false;yieldUntil=0;private crowdCooldown=0;private gazeYaw=0;private eyeAim=0;private gazeStarted=false;private gazeClock=0;private transientLookRemaining=0;
  seatHeight=.54;
  react(name:ReactionName,target?:Vec3,duration=18){this.acting.react(name,duration);if(target)this.setLook(target);}
  position:Vec3; yaw=0; state:AnimState='idle'; activity=''; currentScheduleIndex=-1; path:Vec3[]=[]; pathIndex=0; speed=1.55; animTime=0; targetLook?:Vec3;
  private courtWasReserved=false;
  affection:{kind:'hug'|'kiss';target:Vec3;weight:number;upper:boolean}|null=null;
  private pendingState:AnimState='idle';
  private courtTarget?:Vec3;private courtFacing?:Vec3;private courtSpeed=3.15;private courtSpeedScale=1;matchCompetitor=false;spectating=false;
  private previousState:AnimState='idle';private previousAnimTime=0;private transitionAge=1;private transitionDuration=.20;
  private walkCycle=new WalkCycle();private exitWalkPose:Pose|null=null;
  private walkingStride(){return (this.spec.appearance==='human'?1.7+clamp((this.travelSpeed-2.2)/3.3,0,1)*.7:1.02)*locomotionStyleFor(this.spec.id).stride;}
  private walkingShape(){const jog=clamp((this.travelSpeed-2.2)/3.3,0,1);return this.spec.appearance==='human'?{halfWidth:.135,lift:.045+jog*.155,stance:.52-jog*.12}:undefined;}
  private targetYaw=0;private locomotion=0;private horizontalSpeed=0;private gaitPhase=0;private travelSpeed=0;
  private leftFootLock:Vec3|null=null;private rightFootLock:Vec3|null=null;private prevLeftStance=false;private prevRightStance=false;
  private incomingContact:Vec3|null=null;private contactTarget:Vec3|null=null;private outgoingTarget:Vec3|null=null;
  private facePose:FacePose={smile:.08,mouthOpen:0,browRaise:.05,squint:0,focus:.08};
  private authoredHands?:AuthoredHandPose;
  private handPose={handRestWeight:1,handLapWeight:0,handGripL:0,handGripR:0,handRacketWeight:0};
  private lastPose:Pose|null=null;private prevPosition:Vec3;private localVelocity=new Vec3();
  private courtPhase:CourtPhase='neutral';private courtPhaseAge=0;private courtMoveDelay=0;private development=50;
  private emotion:EmotionState='neutral';private emotionUntil=0;private conversationTarget?:Vec3;
  private racketImpactAge=1;
  private contactHoldRemaining=0;
  private stringImpactStrength=0;
  private stringImpactDirection=1;
  private racketVibration=0;private stepEvent=false;private lastStanceKey='';
  private clubIdleRelax=0;
  private strokeAnchor:{foot:'L'|'R';point:Vec3;root:Vec3}|null=null;
  private strokeSupport(){
    if(!this.strokeAnchor||!isShot(this.state))return null;
    const t=this.animTime/this.shotContactTime(),travel=Vec3.sub(this.position,this.strokeAnchor.root).len();
    const weight=smoothstep(.12,.70,t)*(1-smoothstep(1.30,1.90,t))*(1-smoothstep(.04,.14,travel));
    return {foot:this.strokeAnchor.foot,weight,anchor:this.strokeAnchor.point.clone()};
  }
  private canFoldReferenceIdle(){return this.spec.appearance!=='human'&&this.racketStowed&&this.canRelaxClubIdle()&&!this.acting.micro;}
  private canRelaxClubIdle(){return (this.spec.avatar==='taylor'||this.spec.appearance==='human')&&this.state==='idle'&&!this.majorActivity&&!this.matchCompetitor&&!this.spectating&&!this.propKind&&!this.interactionTarget&&this.interactionWeight<.001&&this.socialGesture==='none'&&(this.acting.role==='none'||this.acting.role==='exit');}
  private interactionTarget?:Vec3;
  private interactionWeight=0;
  private interactionRelease?:Vec3;

  /** A short reach toward a real surface, bounded by the stylized arm's length. */
  setInteractionTarget(target?:Vec3){
    if(target)this.interactionRelease=undefined;
    else this.interactionRelease=this.interactionTarget?.clone();
    this.interactionTarget=target?.clone();
  }

  constructor(public spec:CharacterSpec,start:Vec3,private nav:Navigation,private destinations:Record<string,Vec3>){this.speed=spec.appearance==='human'?2.2:1.55;this.acting=new ActingState(spec.id);this.position=start.clone();this.prevPosition=start.clone();this.targetYaw=this.yaw;}

  setDestination(id:string,activity:string,animation?:string){const original=this.destinations[id];if(!original)return;const arrivalSpots:Record<string,Vec3>={coach:new Vec3(-6.5,0,6.2),mika:new Vec3(-6.5,0,8.7),leo:new Vec3(-8,0,8.7),nia:new Vec3(-8,0,6.2)};const dest=this.freeDestination(id==='entrance'?(arrivalSpots[this.id]??original):original);this.clearCourtMove();this.activity=activity;this.path=this.nav.clubPath(this.position,dest);this.pathIndex=0;this.pendingState=(animation as AnimState)||'idle';this.changeState(this.path.length?'walk':this.pendingState,false);}
  freeDestination(dest:Vec3){
    const clear=(p:Vec3)=>!this.nav.isBlocked(p.x,p.z)&&this.crowd.every(c=>c===this||Math.hypot(p.x-c.position.x,p.z-c.position.z)>.92);
    if(clear(dest))return dest;
    for(const radius of [1.05,1.55,2.05])for(let i=0;i<8;i++){const p=new Vec3(dest.x+Math.cos(i*Math.PI/4)*radius,0,dest.z+Math.sin(i*Math.PI/4)*radius);if(clear(p)&&this.nav.clubPath(this.position,p).length)return p;}
    return this.position.clone();
  }
  private crowdStep(target:Vec3,step:number){
    if(this.majorActivity||!this.crowd.length)return step;
    const delta=Vec3.sub(target,this.position),length=Math.hypot(delta.x,delta.z);if(!length)return step;
    const dx=delta.x/length,dz=delta.z/length;
    const blockers=this.crowd.filter(c=>c!==this&&c.position!==this.affection?.target&&Math.hypot(c.position.x-this.position.x,c.position.z-this.position.z)<1.5);
    const blocked=blockers.some(c=>{const before=Math.hypot(c.position.x-this.position.x,c.position.z-this.position.z),after=Math.hypot(c.position.x-this.position.x-dx*step,c.position.z-this.position.z-dz*step);return after<.82&&after<before-1e-6;});
    if(!blocked)return step;
    if(this.crowdCooldown<=0){
      this.crowdCooldown=.7;const goal=this.path[this.path.length-1];
      const heading=Vec3.sub(goal??target,this.position).normalize();
      const detour=new Vec3(this.position.x+heading.x*.3+heading.z*1.05,0,this.position.z+heading.z*.3-heading.x*1.05);
      const dynamic=new Navigation([...this.nav.obstacles,...blockers.map(c=>({x:c.position.x,z:c.position.z,w:1.24,d:1.24}))]);
      const first=dynamic.clubPath(this.position,detour),last=goal?dynamic.clubPath(detour,goal):[];
      const path=first.length&&last.length?[...first,...last]:goal?dynamic.clubPath(this.position,goal):[];
      if(path.length){this.path=path;this.pathIndex=0;}
      else {const options=Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return new Vec3(this.position.x+Math.cos(a)*.5,0,this.position.z+Math.sin(a)*.5);}).filter(p=>this.nav.clearSegment(this.position,p)&&blockers.every(c=>Math.hypot(p.x-c.position.x,p.z-c.position.z)>Math.min(.84,Math.hypot(this.position.x-c.position.x,this.position.z-c.position.z))&&((p.x-this.position.x)*(c.position.x-this.position.x)+(p.z-this.position.z)*(c.position.z-this.position.z)<=0)));const cost=(p:Vec3)=>Vec3.sub(p,goal??target).len()+.4*(heading.x*(p.z-this.position.z)-heading.z*(p.x-this.position.x));options.sort((a,b)=>cost(a)-cost(b));for(const escape of options){let rest=dynamic.clubPath(escape,goal??target);if(!rest.length&&blockers.some(c=>c.pathIndex<c.path.length&&Math.hypot(c.position.x-(goal??target).x,c.position.z-(goal??target).z)<.9))rest=this.nav.clubPath(escape,goal??target);if(rest.length){this.path=[escape,...rest];this.pathIndex=0;break;}}}

    }
    return 0;
  }
  goTo(dest:Vec3,after:AnimState='idle'){if(this.state==='sit'){this.changeState('idle',false);this.departureDelay=.65;}this.clearCourtMove();this.path=this.nav.clubPath(this.position,dest);this.pathIndex=0;this.pendingState=after;if(this.departureDelay<=0)this.changeState(this.path.length?'walk':after,false);}
  moveOnCourt(dest:Vec3,faceTarget?:Vec3,split=true){this.path=[];this.pathIndex=0;this.courtTarget=dest.clone();this.courtFacing=faceTarget?.clone();this.courtPhase=split?'split':'recover';this.courtPhaseAge=0;this.courtMoveDelay=split?.09:0;this.changeState('shuffle',false);}
  /**
   * Continuous steering path used by interactive Championship movement.
   * Unlike moveOnCourt(), updating the target does not restart the court phase
   * every frame, so held input produces one continuous locomotion state.
   */
  steerOnCourt(dest:Vec3,faceTarget?:Vec3){
    this.path=[];this.pathIndex=0;
    const alreadySteering=!!this.courtTarget&&this.state==='shuffle';
    this.courtTarget=dest.clone();
    this.courtFacing=faceTarget?.clone();
    this.courtMoveDelay=0;
    if(!alreadySteering&&!isShot(this.state)){this.courtPhase='recover';this.courtPhaseAge=0;this.changeState('shuffle',false);}
  }
  /** Championship can scale court translation without bypassing the existing shuffle/foot solver. */
  setCourtSpeedScale(scale:number){this.courtSpeedScale=clamp(scale,.05,this.matchCompetitor?3:1.5);}
  getCourtSpeedScale(){return this.courtSpeedScale;}
  clearCourtMove(){this.courtTarget=undefined;this.courtFacing=undefined;if(!isShot(this.state)){this.courtPhase='neutral';this.courtPhaseAge=0;}}
  setLook(target?:Vec3){this.targetLook=target?.clone();this.transientLookRemaining=0;}
  glanceAt(target:Vec3,duration=1.6){this.targetLook=target.clone();this.transientLookRemaining=Math.max(.1,duration);}
  setConversationPartner(target?:Vec3){this.conversationTarget=target?.clone();if(target)this.setLook(target);}
  private gestureAge=1;private previousGesture:import('../simulation/EverydayLife.js').Gesture='none';private gesture:import('../simulation/EverydayLife.js').Gesture='none';
  get socialGesture(){return this.gesture;}set socialGesture(g:import('../simulation/EverydayLife.js').Gesture){if(g!==this.gesture){this.previousGesture=this.gesture;this.gesture=g;this.gestureAge=0;}}
  racketStowed=false;private propWanted:'cup'|'notebook'|'ball'|'wateringCan'|null=null;private propKind:Character['propWanted']=null;private propAge=0;private propAnchor:Vec3|null=null;private propRelease:Vec3|null=null;private departureDelay=0;
  get socialProp(){return this.propWanted;}
  set socialProp(kind:Character['propWanted']){if(kind===this.propWanted)return;const previous=this.propWanted;this.propWanted=kind;
    if(kind&&kind===this.propKind){if(previous===null)this.propAge=1;return;}
    this.propAge=0;if(kind){this.propKind=kind;this.propAnchor=this.worldLocal(kind==='notebook'?-.34:.34,.99,.13);this.propRelease=null;}else this.propRelease=(this.propKind==='notebook'?this.lastPose?.handL:this.lastPose?.handR)?.clone()??null;
  }
  get propPhase(){return !this.propKind?'none':!this.propWanted?'release':this.propAge<.4?'reach':this.propAge<.65?'grasp':'use';}
  practiceCue='';seatDepth=0;
  preparationBonus=0;recoveryBonus=0;
  setDevelopment(value:number){this.development=clamp(value,0,100);}
  getDevelopment(){return this.development;}
  tennisSkill(){if(this.spec.id==='coach')return .95;if(this.spec.id==='leo')return .72;if(this.spec.id==='nia')return .48;if(this.spec.id==='mika')return .44+this.development*.0048;return .62;}
  setEmotion(emotion:EmotionState,duration=.9){this.emotion=emotion;this.emotionUntil=duration;}
  notifyRacketImpact(quality:'perfect'|'clean'|'defensive'|'frame'|'net'='clean',normalDirection=1){
    this.racketImpactAge=0;
    this.stringImpactStrength=quality==='perfect'?1:quality==='clean'?.82:quality==='defensive'?.5:.3;
    this.stringImpactDirection=normalDirection;
    this.racketVibration=quality==='perfect'?1.42:quality==='clean'?1.05:quality==='defensive'?.72:quality==='frame'?1.5:.75;
    this.setEmotion(quality==='perfect'||quality==='clean'?'pleased':quality==='frame'?'surprised':quality==='defensive'?'focused':'disappointed',quality==='perfect'?.7:.55);
  }
  /** Hold only the stroke clock. Input, feet, gaze and string recoil stay live. */
  holdRacketContact(seconds:number){
    if(this.matchCompetitor&&isShot(this.state)&&Number.isFinite(seconds))
      this.contactHoldRemaining=Math.max(this.contactHoldRemaining,clamp(seconds,0,.075));
  }
  /** Signed local depth shared by the visible strings and the latched ball. */
  racketStringOffset(){
    const age=this.racketImpactAge;
    if(age>=.28)return 0;
    const compression=age<.055?1-age*.3:Math.cos((age-.055)*49)*Math.exp(-(age-.055)*18);
    return -this.stringImpactDirection*.085*this.stringImpactStrength*compression;
  }

  consumeStepEvent(){const v=this.stepEvent;this.stepEvent=false;return v;}
  face(target:Vec3){const d=Vec3.sub(target,this.position);this.targetYaw=Math.atan2(d.x,d.z);}
  private reactionRacket=false;
  trigger(state:AnimState){if(state==='celebrate'||state==='reactMiss')this.reactionRacket=this.holdsRacket();this.changeState(state,true);if(isShot(state))this.clearCourtMove();}
  setAnimation(state:AnimState){this.changeState(state,false);}
  setIncomingContact(point:Vec3){this.incomingContact=point.clone();}
  triggerShot(state:ShotState,outgoingTarget:Vec3){this.outgoingTarget=outgoingTarget.clone();this.contactTarget=this.solveContactTarget(state,this.incomingContact);this.incomingContact=null;this.courtPhase='stroke';this.courtPhaseAge=0;this.setEmotion('focused',this.shotDuration(state));this.trigger(state);const foot=state==='swingForehand'?'R':'L',stance=this.poseFor(state,this.shotContactTime(state)*.72),point=stance[`foot${foot}`].clone();point.y=.11;this.strokeAnchor={foot,point,root:this.position.clone()};}
  clearShotIntent(){this.strokeAnchor=null;this.contactHoldRemaining=0;this.contactTarget=null;this.outgoingTarget=null;this.incomingContact=null;this.courtPhase='recover';this.courtPhaseAge=0;}
  shotContactTime(state:ShotState=this.state as ShotState){const style=this.strokeStyle();const base=state==='serve'?.48:state==='volley'?.21:state==='swingBackhand'?.35:.33;const dev=this.spec.id==='mika'?(this.development-50)*.0007:0;const tempo=this.matchCompetitor?CHAMPIONSHIP_TUNING.arcadeContactTempo:1;return Math.max(.11,(base*style.timing+dev+this.preparationBonus+(this.practiceCue==='preparation'?.065:0))*tempo);}
  shotDuration(state:ShotState=this.state as ShotState){const style=this.strokeStyle();const base=state==='serve'?.96:state==='volley'?.50:state==='swingBackhand'?.78:.76;return base*style.tempo*(this.matchCompetitor?CHAMPIONSHIP_TUNING.arcadeStrokeTempo:1);}
  serveTossPoint(){const p=this.pose();return p.handL.clone();}

  private strokeStyle(){
    if(this.spec.id==='coach')return {timing:1.08,tempo:.92,coil:.88,follow:.92,reach:.96};
    if(this.spec.id==='leo')return {timing:.98,tempo:1.06,coil:1.18,follow:1.16,reach:1.06};
    if(this.spec.id==='nia')return {timing:1.02,tempo:1.12,coil:.78,follow:.78,reach:.90};
    if(this.spec.id==='mika'){const d=this.development/100;return {timing:.94+d*.10,tempo:1.06-d*.08,coil:.92+d*.10,follow:.90+d*.13,reach:.96+d*.04};}
    return {timing:1,tempo:1,coil:1,follow:1,reach:1};
  }

  update(dt:number){
    const reserved=this.nav.courtReserved();
    if(reserved!==this.courtWasReserved){
      this.courtWasReserved=reserved;const destination=this.path[this.path.length-1];
      if(destination&&this.pathIndex<this.path.length){this.path=this.nav.clubPath(this.position,destination);this.pathIndex=0;}
    }
    // Reach promptly; let the hand settle back more gently after completion.
    const reachSharpness=this.interactionTarget?10:4;
    this.interactionWeight=expDamp(this.interactionWeight,this.interactionTarget?1:0,reachSharpness,dt);
    if(this.interactionWeight<.001)this.interactionRelease=undefined;
    this.propAge+=dt;this.departureDelay=Math.max(0,this.departureDelay-dt);if(!this.propWanted&&this.propAge>=.65){this.propKind=null;this.propAnchor=null;this.propRelease=null;}
    this.acting.update(dt,this.majorActivity||isShot(this.state)||this.state==='shuffle');this.crowdCooldown-=dt;this.gazeClock+=dt;
    if(this.transientLookRemaining>0){this.transientLookRemaining=Math.max(0,this.transientLookRemaining-dt);if(this.transientLookRemaining===0)this.targetLook=undefined;}
    const look=this.targetLook??this.conversationTarget;let aim=look?Math.atan2(look.x-this.position.x,look.z-this.position.z):this.yaw;
    if(look&&!this.spectating&&this.state!=='watch'&&!this.majorActivity&&this.acting.role!=='none'&&this.gazeClock%(this.acting.values.gazeHold+1)>this.acting.values.gazeHold)aim+=.24;
    if(!this.gazeStarted){this.gazeYaw=this.eyeAim=this.yaw;this.gazeStarted=true;}this.gazeYaw=dampAngle(this.gazeYaw,aim,5,dt);this.eyeAim=dampAngle(this.eyeAim,aim,20,dt);
    const held=Math.min(dt,this.contactHoldRemaining);
    this.contactHoldRemaining=Math.max(0,this.contactHoldRemaining-dt);
    const strokeDt=dt-held;
    this.racketImpactAge+=dt;this.animTime+=strokeDt;this.gestureAge+=dt;this.transitionAge+=dt;this.courtPhaseAge+=strokeDt;this.racketVibration=expDamp(this.racketVibration,0,18,dt);
    if(this.spec.appearance==='human'&&(this.state==='swingForehand'||this.state==='swingBackhand')&&this.animTime-strokeDt<this.shotDuration()&&this.animTime>=this.shotDuration())this.stepEvent=true;
    if(this.emotionUntil>0){this.emotionUntil=Math.max(0,this.emotionUntil-dt);if(this.emotionUntil===0)this.emotion='neutral';}
    const before=this.position.clone();let moved=0;
    if(this.pathIndex<this.path.length&&this.departureDelay<=0){
      while(this.pathIndex<this.path.length&&Vec3.sub(this.path[this.pathIndex],this.position).len()<.0001)this.pathIndex++;
      if(this.pathIndex>=this.path.length){this.travelSpeed=0;this.trigger(this.pendingState);}
      else {
        const target=this.path[this.pathIndex],delta=Vec3.sub(target,this.position),dist=Math.hypot(delta.x,delta.z);
        this.targetYaw=Math.atan2(delta.x,delta.z);
        const next=this.path[this.pathIndex+1];
        if(next&&dist<.5){const outgoing=Vec3.sub(next,target);this.targetYaw+=angleDelta(this.targetYaw,Math.atan2(outgoing.x,outgoing.z))*(1-dist/.5)*.65;}
        const remaining=this.path.slice(this.pathIndex).reduce((n,p,i)=>n+Vec3.sub(p,i?this.path[this.pathIndex+i-1]:this.position).len(),0);
        const alignment=Math.max(.08,Math.cos(angleDelta(this.yaw,this.targetYaw)));
        const nominal=Math.min(this.speed*this.acting.values.stepEnergy,Math.sqrt(2*2.8*remaining))*alignment;
        this.travelSpeed=expDamp(this.travelSpeed,nominal,7,dt);
        const step=this.crowdStep(target,Math.min(dist,this.travelSpeed*dt));
        this.position.x+=delta.x/dist*step;this.position.z+=delta.z/dist*step;moved=step;
        this.changeState(this.spec.appearance==='human'&&this.travelSpeed>2.8?'jog':'walk',false);
        if(step>=dist){this.pathIndex++;if(this.pathIndex>=this.path.length){this.travelSpeed=0;this.trigger(this.pendingState);}}
      }
    }else if(this.courtTarget&&(!isShot(this.state)||this.matchCompetitor)){this.travelSpeed=expDamp(this.travelSpeed,0,8,dt);
      const d=Vec3.sub(this.courtTarget,this.position),dist=Math.hypot(d.x,d.z);
      const stroking=isShot(this.state);
      if(this.courtFacing&&!stroking){const fd=Vec3.sub(this.courtFacing,this.position);this.targetYaw=Math.atan2(fd.x,fd.z);if(this.matchCompetitor){const netYaw=fd.z<0?Math.PI:0;this.targetYaw=netYaw+angleDelta(netYaw,this.targetYaw)*.22;}}
      if(this.courtMoveDelay>0){this.courtMoveDelay=Math.max(0,this.courtMoveDelay-dt);this.courtPhase='split';}
      else if(dist<.055){this.position.x=this.courtTarget.x;this.position.z=this.courtTarget.z;this.courtTarget=undefined;if(!stroking){this.courtPhase='load';this.courtPhaseAge=0;this.changeState('ready',false);}}
      else{const plant=stroking&&!this.matchCompetitor&&Math.abs(this.animTime-this.shotContactTime())<.07;const strokeScale=plant?0:stroking?(this.matchCompetitor?.92:.6):1;const step=Math.min(dist,(this.courtSpeed+this.recoveryBonus+(this.practiceCue==='recovery'?.6:0))*this.courtSpeedScale*strokeScale*dt);this.position.x+=d.x/dist*step;this.position.z+=d.z/dist*step;moved=step;if(!stroking){this.courtPhase='adjust';this.changeState('shuffle',false);}}
    }else {this.travelSpeed=expDamp(this.travelSpeed,0,7.5,dt);if(this.courtPhase==='recover'&&this.courtPhaseAge>.28){this.courtPhase='neutral';this.courtPhaseAge=0;}}
    const locomotionStyle=locomotionStyleFor(this.spec.id);this.yaw=dampAngle(this.yaw,this.targetYaw,isShot(this.state)?12:this.acting.role==='speak'||this.acting.role==='listen'?2.8:locomotionStyle.turnSharpness,dt);
    const worldVel=Vec3.sub(this.position,before).scale(dt>0?1/dt:0);const s=Math.sin(this.yaw),c=Math.cos(this.yaw);this.localVelocity.set(c*worldVel.x-s*worldVel.z,0,s*worldVel.x+c*worldVel.z);
    const instantaneous=dt>0?moved/dt:0;this.horizontalSpeed=expDamp(this.horizontalSpeed,instantaneous,14,dt);const targetLoc=MOVING.has(this.state)?.98:0;this.locomotion=expDamp(this.locomotion,targetLoc,10,dt);
    if(this.state==='walk'||this.state==='jog'){const stride=this.walkingStride();this.stepEvent=this.walkCycle.update(this.position,this.yaw,moved,stride,this.walkingShape())||this.stepEvent;this.gaitPhase=this.walkCycle.phase*Math.PI*2;}
    else if(this.locomotion>.02){const cadence=this.state==='shuffle'?5.8:locomotionStyle.cadence;this.gaitPhase=(this.gaitPhase+Math.max(.25,this.horizontalSpeed)*cadence*dt)%(Math.PI*2);}
    this.updateFootPlanting();
    const desired=this.expressionFor(this.state),reaction=this.acting.reaction,w=this.acting.reactionWeight;
    if(!isShot(this.state)){desired.smile=clamp(desired.smile+this.acting.values.smileBias+(reaction?.smile??0)*w,-.5,1);desired.browRaise=clamp(desired.browRaise+this.acting.values.browBias+(reaction?.brow??0)*w,-.25,1);}this.facePose={smile:expDamp(this.facePose.smile,desired.smile,10,dt),mouthOpen:expDamp(this.facePose.mouthOpen,desired.mouthOpen,14,dt),browRaise:expDamp(this.facePose.browRaise,desired.browRaise,10,dt),squint:expDamp(this.facePose.squint,desired.squint,12,dt),focus:expDamp(this.facePose.focus,desired.focus,12,dt)};
    const racket=this.holdsRacket(),hands={handRestWeight:this.state==='idle'&&!this.propKind&&!this.interactionTarget&&!this.affection&&this.socialGesture==='none'&&this.interactionWeight<.001?1:0,handLapWeight:this.state==='sit'&&!this.propKind&&!this.affection&&!racket?1:0,handGripL:racket?(this.state==='swingBackhand'?1:this.state==='ready'||this.state==='shuffle'?.45:0):0,handGripR:racket?1:this.state==='drink'||this.propKind==='cup'?.45:0,handRacketWeight:racket?1:0};
    for(const key of Object.keys(hands) as (keyof typeof hands)[])this.handPose[key]=expDamp(this.handPose[key],hands[key],12,dt);
    this.clubIdleRelax=expDamp(this.clubIdleRelax,this.canRelaxClubIdle()?1:0,7,dt);
    if(this.spec.presentation==='feminine'&&this.spec.appearance==='human')this.authoredHands=advanceAuthoredHands(this.pose(),this.position,this.yaw,this.authoredHands,dt);
    this.prevPosition=this.position.clone();
  }

  racketContactPoint(){const pose=this.pose();return pose.racketCenter.clone();}
  racketContactFrame(){const pose=this.pose();return {center:pose.racketCenter.clone(),rotation:pose.racketRot.clone(),horizontal:rotateEulerVector(new Vec3(1,0,0),pose.racketRot).normalize(),vertical:rotateEulerVector(new Vec3(0,1,0),pose.racketRot).normalize(),normal:rotateEulerVector(new Vec3(0,0,1),pose.racketRot).normalize()};}
  debugKinematics():CharacterKinematics{const p=this.pose();const err=this.contactTarget?Vec3.sub(p.racketCenter,this.contactTarget).len():0;const lateral=Math.min(1,Math.abs(this.localVelocity.x)/Math.max(.01,this.courtSpeed)),forward=Math.min(1,Math.max(0,this.localVelocity.z)/Math.max(.01,this.courtSpeed)),backward=Math.min(1,Math.max(0,-this.localVelocity.z)/Math.max(.01,this.courtSpeed)),jog=Math.min(1,Math.max(0,(this.horizontalSpeed-1.45)/.8)),walk=Math.min(1,this.horizontalSpeed/1.55)*(1-jog);return {leftFoot:p.footL.clone(),rightFoot:p.footR.clone(),leftHand:p.handL.clone(),rightHand:p.handR.clone(),leftFootPlanted:this.leftFootLock!==null,rightFootPlanted:this.rightFootLock!==null,racketGrip:p.racketGrip.clone(),racketCenter:p.racketCenter.clone(),contactTarget:this.contactTarget?.clone()??null,contactError:err,state:this.state,transition:clamp(this.transitionAge/this.transitionDuration,0,1),locomotion:this.locomotion,courtPhase:this.courtPhase,development:this.development,racketVibration:this.racketVibration,strokePlant:this.strokeSupport(),motionBlend:{idle:1-this.locomotion,walk,jog,lateral,forward,backward}};}

  private changeState(next:AnimState,resetTime:boolean){
    if(next===this.state){if(resetTime){this.animTime=0;this.contactHoldRemaining=0;}return;}
    this.contactHoldRemaining=0;this.strokeAnchor=null;
    if((next==='walk'||next==='jog')&&this.state!=='walk'&&this.state!=='jog'){this.walkCycle.reset();this.walkCycle.update(this.position,this.yaw,0,this.walkingStride(),this.walkingShape());}
    if((this.state==='walk'||this.state==='jog')&&!MOVING.has(next)||this.state==='sit'){this.pose();this.exitWalkPose=this.lastPose;}else this.exitWalkPose=null;
    if(!MOVING.has(next))this.walkCycle.reset();
    this.previousState=this.state;this.previousAnimTime=this.animTime;this.state=next;this.animTime=resetTime?0:0;this.transitionAge=0;
    this.transitionDuration=isShot(next)||isShot(this.previousState)?.13:MOVING.has(next)||MOVING.has(this.previousState)?.18:next==='sit'||this.previousState==='sit'?.65:.26;
    if(!MOVING.has(next)){this.leftFootLock=null;this.rightFootLock=null;this.prevLeftStance=false;this.prevRightStance=false;}
  }

  private solveContactTarget(state:ShotState,incoming:Vec3|null){
    // Intercept toward the opponent, even while the body is still turning
    // out of lateral movement. The previous yaw could put this behind us.
    const aim=this.outgoingTarget;
    const shotYaw=aim?Math.atan2(aim.x-this.position.x,aim.z-this.position.z):this.yaw;
    if(state==='serve')return this.worldLocal(.14,this.spec.avatar==='taylor'||this.spec.appearance==='human'?3.04:2.36,.38,shotYaw);
    const local=incoming?this.localFromWorld(incoming,shotYaw):new Vec3(state==='swingForehand'?.54:state==='swingBackhand'?-.42:.30,1.02,.48);
    local.y=clamp(local.y,state==='volley'?.90:.66,state==='volley'?1.58:1.38);local.z=clamp(local.z,.55,.90);
    if(state==='swingForehand')local.x=clamp(Math.abs(local.x)+.18,.46,.88);
    if(state==='swingBackhand')local.x=-clamp(Math.abs(local.x)+.12,.30,.76);
    if(state==='volley')local.x=clamp(local.x,-.56,.56);
    return this.worldLocal(local.x,local.y,local.z,shotYaw);
  }

  private updateFootPlanting(){
    if(!(this.state==='walk'||this.state==='jog'||this.state==='shuffle')){this.leftFootLock=null;this.rightFootLock=null;this.prevLeftStance=false;this.prevRightStance=false;this.lastStanceKey='';return;}
    if(this.state==='walk'||this.state==='jog'){this.leftFootLock=this.walkCycle.planted[0]?this.walkCycle.feet[0].clone():null;this.rightFootLock=this.walkCycle.planted[1]?this.walkCycle.feet[1].clone():null;return;}
    const phase=this.gaitPhase,isShuffle=this.state==='shuffle',wave=Math.sin(phase);
    const leftStance=isShuffle?wave<.22:Math.cos(phase)>.08,rightStance=isShuffle?wave>-.22:Math.cos(phase+Math.PI)>.08;
    const speedRef=this.courtSpeed;const speed01=clamp(this.horizontalSpeed/Math.max(.01,speedRef),0,1);
    const style=locomotionStyleFor(this.spec.id);const stride=(.22)*speed01*style.stride;const side=clamp(this.localVelocity.x/Math.max(.01,this.courtSpeed),-1,1);const fore=clamp(this.localVelocity.z/Math.max(.01,this.courtSpeed),-1,1);
    const predict=Math.min(.12,this.horizontalSpeed*.035);const future=this.position.clone().add(new Vec3(Math.sin(this.yaw)*fore*predict+Math.cos(this.yaw)*side*predict,0,Math.cos(this.yaw)*fore*predict-Math.sin(this.yaw)*side*predict));
    const desired=(left:boolean)=>{const lateral=(left?-.29:.29)+(isShuffle?-side*.10:0);const z=isShuffle?(left?.12:-.03)+(left?wave:-wave)*.045:(.04+(left?Math.sin(phase):Math.sin(phase+Math.PI))*stride);const old=this.position;this.position=future;const v=this.worldLocal(lateral,.11,z);this.position=old;return v;};
    const leftDesired=desired(true),rightDesired=desired(false);
    if(leftStance&&!this.prevLeftStance){this.leftFootLock=leftDesired.clone();this.stepEvent=true;}if(!leftStance)this.leftFootLock=null;
    if(rightStance&&!this.prevRightStance){this.rightFootLock=rightDesired.clone();this.stepEvent=true;}if(!rightStance)this.rightFootLock=null;
    const key=`${leftStance?'L':''}${rightStance?'R':''}`;this.lastStanceKey=key;this.prevLeftStance=leftStance;this.prevRightStance=rightStance;
  }

  private expressionFor(state:AnimState):FacePose{
    const emotional:Record<EmotionState,FacePose>={
      neutral:{smile:.12,mouthOpen:0,browRaise:.08,squint:0,focus:.10},attentive:{smile:.08,mouthOpen:0,browRaise:.20,squint:.02,focus:.58},friendly:{smile:.52,mouthOpen:.05,browRaise:.16,squint:.04,focus:.16},focused:{smile:.01,mouthOpen:.03,browRaise:.08,squint:.18,focus:.90},amused:{smile:.72,mouthOpen:.14,browRaise:.22,squint:.16,focus:.18},pleased:{smile:.62,mouthOpen:.04,browRaise:.12,squint:.10,focus:.16},disappointed:{smile:-.22,mouthOpen:.04,browRaise:.26,squint:.08,focus:.28},tired:{smile:.02,mouthOpen:.05,browRaise:-.08,squint:.30,focus:.08},surprised:{smile:.06,mouthOpen:.28,browRaise:.58,squint:0,focus:.52},proud:{smile:.78,mouthOpen:.05,browRaise:.20,squint:.09,focus:.12},frustrated:{smile:-.30,mouthOpen:.06,browRaise:-.10,squint:.24,focus:.50}
    };
    if(this.emotion!=='neutral')return emotional[this.emotion];
    if(state==='celebrate')return emotional.proud;if(state==='reactMiss')return emotional.disappointed;
    if(state==='talk'||state==='coachExplain')return {smile:.46,mouthOpen:.38+.18*Math.sin(this.animTime*9),browRaise:.30,squint:.03,focus:.12};
    if(isShot(state)){const p=this.shotProgress(),contact=this.shotContactTime()/this.shotDuration(),near=bell(p-contact,.11);return {smile:.02,mouthOpen:.04,browRaise:.08+.10*near,squint:.06+.22*near,focus:.85};}
    if(state==='ready'||state==='shuffle'||state==='watch')return emotional.attentive;if(state==='drink')return emotional.pleased;return emotional.neutral;
  }

  // The chair offset is one root translation, independent of head or torso turning.
  private worldLocal(x:number,y:number,z:number,yaw=this.yaw){const s=Math.sin(yaw),c=Math.cos(yaw);const shift=this.state==='sit'?-this.seatDepth*smoothstep(0,.6,this.animTime):0;return new Vec3(this.position.x+c*x+s*z+Math.sin(this.yaw)*shift,y,this.position.z-s*x+c*z+Math.cos(this.yaw)*shift);}
  private localFromWorld(v:Vec3,yaw=this.yaw){const dx=v.x-this.position.x,dz=v.z-this.position.z,s=Math.sin(yaw),c=Math.cos(yaw);return new Vec3(c*dx-s*dz,v.y,s*dx+c*dz);}
  private limb(a:Vec3,b:Vec3,r:number,color:string):Mesh{const d=Vec3.sub(b,a),len=d.len()||.001;const h=Math.hypot(d.x,d.z);const pitch=Math.atan2(h,d.y);const yaw=Math.atan2(d.x,d.z);return {kind:'cylinder',position:Vec3.lerp(a,b,.5),rotation:new Vec3(pitch,yaw,0),scale:new Vec3(r,len,r),color};}
  private seed(){let n=0;for(const c of this.spec.id)n+=c.charCodeAt(0);return n;}
  private shotProgress(state=this.state,time=this.animTime){return isShot(state)?clamp(time/Math.max(.001,this.shotDuration(state)),0,1):0;}

  private clipPhase(state:AnimState,time:number){
    if(state==='walk'||state==='jog'||state==='shuffle')return ((this.gaitPhase/(Math.PI*2))%1+1)%1;
    if(isShot(state))return this.shotProgress(state,time);
    const durations:Partial<Record<AnimState,number>>={sit:2.4,talk:1.9,drink:1.35,stretch:2.8,watch:2.6,celebrate:1.2,reactMiss:1.0,coachFeed:1.8,coachExplain:2.1,ready:1.35};
    return (time/(durations[state]??3.6)+(state==='ready'?this.seed()*.013:0))%1;
  }

  private poseFor(state:AnimState,time:number):Pose{
    const sit=state==='sit';const clip=sampleClip(clipForState(state,this.seed()),this.clipPhase(state,time));let baseY=(sit?(this.seatHeight+.10-.79):0)+clip.pelvisY;const breathe=Math.sin(time*2.05+this.seed()*.01)*(state==='walk'||state==='jog'?.004:.014);
    const shot=isShot(state),sp=shot?this.shotProgress(state,time):0;const contact=shot?this.shotContactTime(state)/this.shotDuration(state):.45;const style=this.strokeStyle();
    let coil=clip.torsoTwist,hipCoil=clip.hipTwist,lean=clip.lean,knee=clip.knee,weightShift=0;
    if(state==='swingForehand'){const pre=clamp(sp/contact,0,1),post=clamp((sp-contact)/(1-contact),0,1);coil+=(-.62*(1-smoothstep(0,.82,pre))+.78*style.follow*smoothstep(0,1,post))*style.coil;hipCoil+=coil*.52;lean+=.035+.07*Math.sin(sp*Math.PI);knee+=.11*Math.sin(Math.min(1,sp/contact)*Math.PI);weightShift=smoothstep(.18,.75,sp);}
    if(state==='swingBackhand'){const pre=clamp(sp/contact,0,1),post=clamp((sp-contact)/(1-contact),0,1);coil+=(.58*(1-smoothstep(0,.82,pre))-.68*style.follow*smoothstep(0,1,post))*style.coil;hipCoil+=coil*.56;lean+=.04;knee+=.10*Math.sin(Math.min(1,sp/contact)*Math.PI);weightShift=smoothstep(.20,.78,sp);}
    if(state==='serve'){coil+=(-.36+sp*.72)*style.coil;hipCoil+=(-.18+sp*.34)*style.coil;lean+=-.045+sp*.12;knee+=.15*Math.sin(Math.min(1,sp/.57)*Math.PI);weightShift=smoothstep(.34,.82,sp);}
    if(state==='volley'){coil+=(sp<contact?-.14:.20);hipCoil+=coil*.35;knee+=.055;weightShift=smoothstep(.18,.66,sp);}
    // The hitting shoulder loads back for a forehand and forward for a backhand.
    if(this.spec.appearance==='human'&&(state==='swingForehand'||state==='swingBackhand')){coil=-coil;hipCoil=-hipCoil;}
    const moving=state==='walk'||state==='jog';const shuffle=state==='shuffle';const gait=moving?Math.cos(this.gaitPhase):0;const gaitStyle=locomotionStyleFor(this.spec.id);const stepLift=moving?Math.pow(Math.abs(Math.sin(this.gaitPhase)),1.7)*gaitStyle.bounce*(this.spec.appearance==='human'?.25:1):0;const gaitCounter=moving?Math.sin(this.gaitPhase)*gaitStyle.torsoCounter:0;const splitHop=this.courtPhase==='split'?Math.sin(Math.min(1,this.courtPhaseAge/.10)*Math.PI)*.055:0;
    if(!shot&&!moving&&this.socialGesture==='think'){lean+=.055;}
    if(state==='idle'){const phase=time*this.acting.values.idleFidgetRate*(this.spec.id==='mika'?.92:this.spec.id==='nia'?.68:.58)+this.seed()*.037;const amp=this.spec.id==='coach'?.010:this.spec.id==='mika'?.024:this.spec.id==='nia'?.018:.015;hipCoil+=Math.sin(phase)*amp;coil-=Math.sin(phase)*amp*.72;baseY+=Math.sin(phase*1.7)*amp*.13;}
    if(moving){coil=-gait*gaitStyle.torsoCounter*.45;hipCoil=gait*gaitStyle.hipSwing*.45;baseY=this.spec.appearance==='human'?-.025+Math.cos(this.gaitPhase*2)*.003:.008+Math.sin(this.gaitPhase*2)*.012;lean=0;knee=0;}const tracking=state==='watch'||this.spectating||state==='ready'||shuffle;const watchDelta=tracking?clamp(angleDelta(this.yaw,this.gazeYaw),-.78,.78):0;const torsoYaw=this.yaw+coil+watchDelta*.30,hipYaw=this.yaw+hipCoil+watchDelta*.07;
    // shortcut: horizontal gaze only; add pitch and convergence for close conversation staging.
    const targetHeadYaw=this.gazeYaw;const headLimit=tracking?.70:.42;const headYaw=this.yaw+clamp(angleDelta(this.yaw,targetHeadYaw),-headLimit,headLimit)+clip.headTurn;
    const sy=Math.sin(headYaw),cy=Math.cos(headYaw),right=new Vec3(cy,0,-sy),forward=new Vec3(sy,0,cy);

    const contactLocal=this.contactTarget?this.localFromWorld(this.contactTarget):new Vec3(state==='swingBackhand'?-.52:state==='serve'?.14:.56,state==='serve'?2.36:1.02,.5);
    const outside=clamp(contactLocal.x,-.85,.85);
    const readyPhase=time*2.1+this.seed()*.071,readyWeight=state==='ready'?Math.sin(readyPhase):0;
    const pelvisShiftX=shot?outside*.05*bell(sp-contact,.24):state==='ready'?readyWeight*.035:moving&&this.spec.appearance==='human'?-Math.sin(this.gaitPhase)*.018:0;const pelvisShiftZ=(shot?.08*weightShift:0)+clip.pelvisZ;
    const pelvisCenter=this.worldLocal(pelvisShiftX,.79+baseY-knee+splitHop,pelvisShiftZ,hipYaw);const torsoCenter=this.worldLocal(pelvisShiftX*.45,1.14+baseY+breathe-knee+splitHop,.025+pelvisShiftZ*.6,torsoYaw);
    const actingLift=shot?0:this.acting.values.postureLift+(this.acting.reaction?.lift??0)*this.acting.reactionWeight;torsoCenter.y+=actingLift;
    const feminine=this.spec.presentation==='feminine',shoulderHalf=feminine?.355:.38;
    const shoulderL=this.worldLocal(-shoulderHalf+pelvisShiftX*.3,1.34+baseY+breathe-knee+splitHop,.015+pelvisShiftZ*.55,torsoYaw),shoulderR=this.worldLocal(shoulderHalf+pelvisShiftX*.3,1.34+baseY+breathe-knee+splitHop,.015+pelvisShiftZ*.55,torsoYaw);
    shoulderL.y+=actingLift;shoulderR.y+=actingLift;
    if(state==='ready'||shuffle){shoulderL.y-=.014;shoulderR.y+=.010;}
    if(!shot){shoulderL.add(this.localVector(-this.acting.values.shoulderOpenness,0,0));shoulderR.add(this.localVector(this.acting.values.shoulderOpenness,0,0));}
    const neutralL=this.worldLocal(-.48,1.02+baseY-knee,-.02),neutralR=this.worldLocal(.48,1.02+baseY-knee,-.02);
    let handL=neutralL.clone(),handR=neutralR.clone();
    if(moving){const swing=gait*gaitStyle.armSwing*.65;const lift=Math.abs(gait)*.015;handL=this.worldLocal(-.43,1.06+baseY+lift,-swing);handR=this.worldLocal(.43,1.06+baseY+lift,swing);}
    if(state==='talk'){const amp=this.acting.values.gestureAmplitude;handL=this.worldLocal(-.39,1.08+baseY,.14+.035*Math.sin(time*2.1));handR=this.worldLocal(.38,1.18+baseY,.26+.09*amp*Math.sin(time*2.4));}
    if(sit){handL=this.worldLocal(-.20,.88+baseY,.28);handR=this.worldLocal(.20,.88+baseY,.28);}
    if(state==='drink'){const sip=(time%3.4)/3.4,raise=smoothstep(.18,.40,sip)*(1-smoothstep(.68,.88,sip)),hold=smoothstep(.40,.48,sip)*(1-smoothstep(.60,.68,sip));handR=this.worldLocal(.24,1.16+baseY+raise*.43,.25+raise*.11);handL=this.worldLocal(-.36,1.07+baseY,.04);lean-=hold*.018;coil+=Math.sin(sip*Math.PI)*.012;}
    if(state==='stretch'){handL=this.worldLocal(-.30,2.05+baseY,.02);handR=this.worldLocal(.30,2.05+baseY,.02);}
    if(state==='watch'){handL=this.worldLocal(.22,1.12+baseY,.25);handR=this.worldLocal(-.22,1.12+baseY,.27);}
    if(state==='ready'||shuffle){handL=this.worldLocal(.10,1.24+baseY,.56,torsoYaw);handR=this.worldLocal(.17,1.18+baseY,.40,torsoYaw);}
    const humanReady=this.spec.appearance==='human'&&(state==='ready'||shuffle),authoredReady=humanReady&&this.spec.presentation==='feminine'&&!!authoredArmLengths();
    if(humanReady){handR=this.worldLocal(.10,1.18+baseY,.36,torsoYaw);handL=this.worldLocal(.24,1.24+baseY,.375,torsoYaw);}
    if(authoredReady){handR=this.worldLocal(-.08,1.18+baseY,.48,torsoYaw);handL=this.worldLocal(.05,1.24+baseY,.50,torsoYaw);}
    if(humanReady){handL.y+=breathe;handR.y+=breathe;}

    if(state==='coachFeed'){handL=this.worldLocal(-.42,1.05+baseY,.12);handR=this.worldLocal(.55,1.12+baseY,.30+Math.sin(time*2.4)*.12);}
    if(state==='coachExplain'){handL=this.worldLocal(-.42,1.08+baseY,.1);handR=this.worldLocal(.58,1.38+baseY,.22+Math.sin(time*2.1)*.08);}

    if(state==='swingForehand'){
      const a=-1.45+smoothstep(0,.70,sp/contact)*1.98+smoothstep(contact,1,sp)*1.24;
      const pre=clamp(sp/contact,0,1),follow=smoothstep(contact+.02,.94,sp);
      handR=Vec3.lerp(this.worldLocal(.54*Math.cos(a),1.05+baseY-knee,.58*Math.sin(a)+.29,torsoYaw),this.worldLocal(-.32,1.42+baseY-knee,.34,torsoYaw),follow);
      handL=this.worldLocal(-.32-.18*Math.sin(pre*Math.PI),1.18+baseY-knee+.10*(1-pre),.42-.28*pre+.10*follow,torsoYaw);
    }
    if(state==='swingBackhand'){
      const a=1.30-smoothstep(0,.70,sp/contact)*1.72-smoothstep(contact,1,sp)*.98;
      const follow=smoothstep(contact+.02,.94,sp);
      handR=Vec3.lerp(this.worldLocal(-.42*Math.cos(a),1.13+baseY-knee,.54*Math.sin(a)+.25,torsoYaw),this.worldLocal(.34,1.40+baseY-knee,.36,torsoYaw),follow);
      handL=handR.clone().add(this.localVector(-.08,.04,.02));
    }
    if(state==='serve'){
      const pre=clamp(sp/contact,0,1),post=clamp((sp-contact)/(1-contact),0,1),toss=smoothstep(0,.70,pre)*(1-smoothstep(.78,1.55,sp/contact)),reach=smoothstep(.35,1,pre),finish=smoothstep(0,.80,post);
      handL=this.worldLocal(-.26-.20*Math.sin(post*Math.PI)+finish*.10,1.25+baseY+toss*.92-finish*.10,.23+finish*.08);
      if(this.spec.appearance==='human')handL=Vec3.lerp(handL,neutralL,finish);
      handR=this.worldLocal(.31+.28*Math.sin(finish*Math.PI)-smoothstep(.55,1,finish)*.62,1.20+baseY+reach*1.02-finish*1.18,-.12+reach*.14+finish*.46,torsoYaw);
    }
    if(state==='volley'){const punch=smoothstep(0,.64,sp);handR=this.worldLocal(.34,1.18+baseY,.15+punch*.39,torsoYaw);handL=this.worldLocal(-.22,1.20+baseY,.18,torsoYaw);}
    if(state==='celebrate'){handL=this.worldLocal(-.36,1.98+baseY,.04);handR=this.worldLocal(.36,1.98+baseY,.04);}
    if(state==='reactMiss'){handL=this.worldLocal(-.52,.98+baseY,.1);handR=this.worldLocal(.52,.98+baseY,.1);}
    // Authored clip underlay: broad human performance is data-driven; procedural constraints still win later.
    handL.add(this.localVector(clip.handL.x,clip.handL.y,clip.handL.z));handR.add(this.localVector(clip.handR.x,clip.handR.y,clip.handR.z));

    // Ease authored social hand targets through the existing skinned rig, outside tennis and locomotion.
    if(!shot&&!moving&&!shuffle){
      const hands=(g:import('../simulation/EverydayLife.js').Gesture)=>{
        let l=handL.clone(),r=handR.clone();const pulse=Math.sin(time*4)*.025;
        if(g==='shrug'){l=this.worldLocal(-.57,1.34+baseY,.18);r=this.worldLocal(.57,1.34+baseY,.18);}
        if(g==='point')r=this.worldLocal(.35,1.38+baseY,.59);
        if(g==='think'){r=this.worldLocal(.17,1.63+baseY+Math.sin(time*2.6)*.012,.22);l=this.worldLocal(-.22,1.09+baseY,.2);}
        if(g==='offer')r=this.worldLocal(.24,1.17+baseY,.52);
        if(g==='inspect'){r=this.worldLocal(.12,1.22+baseY,.38);l=this.worldLocal(-.12,1.18+baseY,.4);}
        if(g==='laugh'){l=this.worldLocal(-.28,1.2+baseY+pulse,.28);r=this.worldLocal(.28,1.2+baseY+pulse,.28);}
        return [l,r];
      };
      const from=hands(this.previousGesture),to=hands(this.socialGesture),t=smoothstep(0,.24,this.gestureAge);handL=Vec3.lerp(from[0],to[0],t);handR=Vec3.lerp(from[1],to[1],t);
    }
    if(!shot&&!moving&&!shuffle){
      if(this.acting.role==='listen'&&this.socialGesture==='none'){handL=Vec3.lerp(handL,neutralL,.65);handR=Vec3.lerp(handR,neutralR,.65);}
      const micro=this.acting.micro,pulse=Math.sin(this.acting.clock*3)*.035;
      if(micro==='headband-adjust')handR=this.worldLocal(.26,1.99+baseY,.05);
      if(micro==='string-check'||micro==='note-tap'){handL=this.worldLocal(-.12,1.15+baseY,.33);handR=this.worldLocal(.12,1.18+baseY+pulse,.35);}
      if(micro==='leaf-inspect')handL=this.worldLocal(-.20,1.18+baseY,.43);
      if(micro==='cup-turn')handR=this.worldLocal(.23,1.25+baseY,.27+pulse);
    }
    if(this.propKind&&this.propAnchor&&!shot&&!moving&&!shuffle){
      const left=this.propKind==='notebook',target=left?handL:handR,neutral=left?neutralL:neutralR;
      const contact=this.propWanted?(this.propAge<.4?Vec3.lerp(neutral,this.propAnchor,smoothstep(0,.4,this.propAge)):Vec3.lerp(this.propAnchor,target,smoothstep(.4,1,this.propAge))):Vec3.lerp(this.propRelease??target,this.propAnchor,smoothstep(0,.65,this.propAge));
      if(left)handL=contact;else handR=contact;
    }
    const surfaceTarget=this.interactionTarget??this.interactionRelease;
    if(surfaceTarget&&!shot&&!moving&&(!this.propKind||this.propKind==='wateringCan')){
      const reach=Vec3.sub(surfaceTarget,shoulderR);
      const maxReach=this.propKind==='wateringCan'?.98:.80;
      if(reach.len()>maxReach)reach.normalize().scale(maxReach);
      handR=Vec3.lerp(handR,Vec3.add(shoulderR,reach),this.interactionWeight);
    }
    // Racket constraint: the hand owns the grip. At contact, solve the hand backwards from the requested sweet spot.
    const racketForward=Vec3.sub(this.outgoingTarget??this.worldLocal(0,1,2),this.position);racketForward.y=0;if(racketForward.len()<.001)racketForward.set(Math.sin(this.yaw),0,Math.cos(this.yaw));racketForward.normalize();
    const racketRight=new Vec3(racketForward.z,0,-racketForward.x);let headOffset=Vec3.add(new Vec3(0,.425,0),racketForward.clone().scale(.225));
    const readyRotation=humanReady?new Vec3((authoredReady?.6:.12)+(state==='ready'?.06*Math.cos(readyPhase):0),torsoYaw,(authoredReady?-.70:.35)+.10*readyWeight):null;
    if(readyRotation)headOffset=rotateEulerVector(new Vec3(0,.48,0),readyRotation);
    if(state==='serve')headOffset=Vec3.add(new Vec3(0,.525,0),racketForward.clone().scale(.125));
    if(state==='volley')headOffset=Vec3.add(new Vec3(0,.3875,0),racketForward.clone().scale(.2625));
    const humanGroundstroke=this.spec.appearance==='human'&&(state==='swingForehand'||state==='swingBackhand');
    let groundRise=0,groundSide=0,groundDepth=.14;
    if(humanGroundstroke){
      // At a low ball the racket head drops beside the wrist. Keeping it
      // upright forced the grip toward the ankle and collapsed the body.
      groundRise=clamp(((this.contactTarget?.y??this.position.y+1.02)-this.position.y-1.02)*.5,-.20,.20);
      groundSide=Math.sqrt(.48**2-.14**2-groundRise**2)*(state==='swingForehand'?1:-1);
      headOffset=racketRight.clone().scale(groundSide).add(racketForward.clone().scale(.14)).add(new Vec3(0,groundRise,0));
      // Rotate into the opposite-shoulder finish; a normalized chord snaps near the half-turn.
      const finish=racketRight.clone().scale(state==='swingForehand'?-.38:.38).add(racketForward.clone().scale(-.14)).add(new Vec3(0,.25,0));
      const origin=new Vec3(),release=interpolateRigidFrame(rigidFrame(origin,headOffset,racketForward),rigidFrame(origin,finish,racketForward),smoothstep(contact+.08,.94,sp));
      headOffset=new Vec3(release[4],release[5],release[6]).scale(.48);
      groundRise=headOffset.y;groundSide=Vec3.dot(headOffset,racketRight);groundDepth=Vec3.dot(headOffset,racketForward);
    }
    if(shot&&this.contactTarget){const w=bell(sp-contact,.11);const desiredHand=Vec3.sub(this.contactTarget,headOffset);handR=blendVec(handR,desiredHand,w);if(state==='swingBackhand'&&!humanGroundstroke){const secondGrip=Vec3.add(handR,racketForward.clone().scale(-.08)).add(new Vec3(0,.04,0));handL=blendVec(handL,secondGrip,clamp(w*.90+.18,0,1));}}
    if(humanGroundstroke&&state==='swingBackhand')handL=secondRacketHand(handR,headOffset);
    const racketGrip=handR.clone();const racketCenter=Vec3.add(racketGrip,headOffset);
    let racketRot=new Vec3(.02,Math.atan2(racketForward.x,racketForward.z),0);if(state==='swingForehand')racketRot=new Vec3(.10,torsoYaw,-.32+sp*.68);else if(state==='swingBackhand')racketRot=new Vec3(-.09,torsoYaw,.34-sp*.58);else if(state==='serve')racketRot=new Vec3(.46-sp*.58,torsoYaw,.36-sp*.72);else if(state==='volley')racketRot=new Vec3(.04,torsoYaw,-.12);
    if(readyRotation)racketRot=readyRotation;
    if(humanGroundstroke)racketRot=new Vec3(Math.atan2(groundDepth,groundRise),Math.atan2(racketForward.x,racketForward.z),Math.atan2(-groundSide,Math.hypot(groundRise,groundDepth)));
    const vib=this.racketVibration*Math.sin(this.animTime*62)*.045;racketRot.z+=vib;racketRot.x+=vib*.35;const racketHandleTop=Vec3.add(racketCenter,rotateEulerVector(new Vec3(0,RACKET.handleTopY,0),racketRot));

    const hipHalf=this.spec.presentation==='feminine'?.175:.165;const hipL=this.worldLocal(-hipHalf+pelvisShiftX,.76+baseY-knee,pelvisShiftZ,hipYaw),hipR=this.worldLocal(hipHalf+pelvisShiftX,.76+baseY-knee,pelvisShiftZ,hipYaw);
    if((moving||state==='ready')&&this.spec.appearance==='human'){const roll=moving?Math.sin(this.gaitPhase)*.006:readyWeight*.004;hipL.y+=roll;hipR.y-=roll;}
    const walkReach=(state==='jog'?.40:.34)*gaitStyle.stride,footY=.11+(this.affection&&!moving||this.spec.appearance==='human'&&this.canRelaxClubIdle()?0:baseY);let footL=this.worldLocal(-.17,footY,.05+gait*walkReach),footR=this.worldLocal(.17,footY,.05-gait*walkReach);
    if(moving){footL=this.walkCycle.feet[0].clone();footR=this.walkCycle.feet[1].clone();}
    if(state==='ready'||shuffle){const sideMotion=clamp(this.localVelocity.x/Math.max(.01,this.courtSpeed),-1,1),foreMotion=clamp(this.localVelocity.z/Math.max(.01,this.courtSpeed),-1,1),lateral=shuffle?Math.sin(this.gaitPhase)*.055+sideMotion*.045:0,wide=this.courtPhase==='split'?.07:0;footL=this.leftFootLock&&shuffle?this.leftFootLock.clone():this.worldLocal(-.29-wide-lateral,.11+splitHop,.16+foreMotion*.07);footR=this.rightFootLock&&shuffle?this.rightFootLock.clone():this.worldLocal(.29+wide-lateral,.11+splitHop,-.05+foreMotion*.07);}
    if(shot){const stance=Math.min(.16,Math.abs(outside)*.13);if(state==='swingForehand'){footL=this.worldLocal(-.25,.11+baseY,.12+weightShift*.08);footR=this.worldLocal(.34+stance,.11+baseY,-.07+weightShift*.04);}else if(state==='swingBackhand'){footL=this.worldLocal(-.34-stance,.11+baseY,-.04+weightShift*.05);footR=this.worldLocal(.25,.11+baseY,.13+weightShift*.08);}else if(state==='serve'){footL=this.worldLocal(-.20,.11+baseY,.14+weightShift*.08);footR=this.worldLocal(.23,.11+baseY,-.14+weightShift*.12);}else{footL=this.worldLocal(-.26,.11+baseY,.12);footR=this.worldLocal(.27,.11+baseY,-.04);}}
    if(sit){footL=this.worldLocal(-.22,.11,.48);footR=this.worldLocal(.22,.11,.48);}
    if(!moving&&!this.leftFootLock)footL.add(this.localVector(-clip.stance+clip.footL.x,clip.footL.y,clip.footL.z));if(!moving&&!this.rightFootLock)footR.add(this.localVector(clip.stance+clip.footR.x,clip.footR.y,clip.footR.z));
    let footPitchL=0,footPitchR=0,footYawL=this.yaw,footYawR=this.yaw,footRecoveryL=0,footRecoveryR=0,footPivotL:Vec3|undefined,footPivotR:Vec3|undefined;
    if(humanGroundstroke){
      const forehand=state==='swingForehand',drive=smoothstep(contact*1.30,Math.min(contact+.28,.82),sp),recover=smoothstep(.78,1,sp),pitch=.32*drive*(1-recover),yaw=this.yaw+(forehand?-.50:.50)*drive*(1-recover*.5);
      if(forehand){footPitchR=pitch;footYawR=yaw;footRecoveryR=recover;footPivotR=footR.clone().sub(this.localVector(0,baseY,weightShift*.04));}else{footPitchL=pitch;footYawL=yaw;footRecoveryL=recover;footPivotL=footL.clone().sub(this.localVector(0,baseY,weightShift*.05));}
    }
    const kneePulse=moving?Math.max(0,-Math.cos(this.gaitPhase*2))*.018:0;const kneeL=Vec3.lerp(hipL,footL,.54).add(this.localVector(-.015,.04-kneePulse,.10)),kneeR=Vec3.lerp(hipR,footR,.54).add(this.localVector(.015,.04-kneePulse,.10));
    if(sit){const l=this.worldLocal(-.22,this.seatHeight+.08,.35),r=this.worldLocal(.22,this.seatHeight+.08,.35);kneeL.set(l.x,l.y,l.z);kneeR.set(r.x,r.y,r.z);}
    if(!shot&&!moving&&this.socialGesture==='think'){torsoCenter.add(this.localVector(0,0,.035));shoulderL.add(this.localVector(0,0,.045));shoulderR.add(this.localVector(0,0,.045));}
    const headStabilize=moving?stepLift*gaitStyle.headStabilize:0;const head=this.worldLocal(pelvisShiftX*.25,1.80+baseY+actingLift+breathe-knee+splitHop+clip.headNod-headStabilize+(!shot&&!moving&&(this.socialGesture==='nod'||this.socialGesture==='laugh')?Math.sin(time*6)*.022:0),.01+pelvisShiftZ*.45,headYaw);
    const elbowL=Vec3.lerp(shoulderL,handL,.50).add(forward.clone().scale(.055)).add(right.clone().scale(-.035));const elbowR=Vec3.lerp(shoulderR,handR,.50).add(forward.clone().scale(.055)).add(right.clone().scale(.035));
    return {baseY,breathe,walking:moving,gait,torsoYaw,hipYaw,headYaw,eyeYaw:clamp(angleDelta(headYaw,this.eyeAim),-.30,.30),right,forward,shoulderL,shoulderR,elbowL,elbowR,handL,handR,hipL,hipR,kneeL,kneeR,footL,footR,footPitchL,footPitchR,footYawL,footYawR,footRecoveryL,footRecoveryR,footPivotL,footPivotR,torsoCenter,pelvisCenter,head,racketGrip,racketHandleTop,racketCenter,racketRot,lean,knee,shot,sp,face:{...this.facePose},weightShift,...this.handPose,...this.authoredHands};
  }

  private localVector(x:number,y:number,z:number){const s=Math.sin(this.yaw),c=Math.cos(this.yaw);return new Vec3(c*x+s*z,y,-s*x+c*z);}

  private blendPose(a:Pose,b:Pose,t:number):Pose{
    const av=(k:keyof Pose)=>a[k] as Vec3,bv=(k:keyof Pose)=>b[k] as Vec3;const v=(k:keyof Pose)=>blendVec(av(k),bv(k),t);
    const feet:Pick<Pose,'footPitchL'|'footPitchR'|'footYawL'|'footYawR'|'footRecoveryL'|'footRecoveryR'|'footPivotL'|'footPivotR'>={};for(const side of ['L','R'] as const){for(const field of ['footPitch','footRecovery'] as const)feet[`${field}${side}`]=(a[`${field}${side}`]??0)*(1-t)+(b[`${field}${side}`]??0)*t;const start=a[`footYaw${side}`]??this.yaw;feet[`footYaw${side}`]=start+angleDelta(start,b[`footYaw${side}`]??this.yaw)*t;feet[`footPivot${side}`]=Vec3.lerp(a[`footPivot${side}`]??a[`foot${side}`],b[`footPivot${side}`]??b[`foot${side}`],t);}
    return {...b,...feet,baseY:a.baseY+(b.baseY-a.baseY)*t,breathe:a.breathe+(b.breathe-a.breathe)*t,gait:a.gait+(b.gait-a.gait)*t,torsoYaw:a.torsoYaw+angleDelta(a.torsoYaw,b.torsoYaw)*t,hipYaw:a.hipYaw+angleDelta(a.hipYaw,b.hipYaw)*t,headYaw:a.headYaw+angleDelta(a.headYaw,b.headYaw)*t,eyeYaw:(a.eyeYaw??0)+((b.eyeYaw??0)-(a.eyeYaw??0))*t,right:v('right'),forward:v('forward'),shoulderL:v('shoulderL'),shoulderR:v('shoulderR'),elbowL:v('elbowL'),elbowR:v('elbowR'),handL:v('handL'),handR:v('handR'),hipL:v('hipL'),hipR:v('hipR'),kneeL:v('kneeL'),kneeR:v('kneeR'),footL:v('footL'),footR:v('footR'),torsoCenter:v('torsoCenter'),pelvisCenter:v('pelvisCenter'),head:v('head'),racketGrip:v('racketGrip'),racketHandleTop:v('racketHandleTop'),racketCenter:v('racketCenter'),racketRot:v('racketRot'),lean:a.lean+(b.lean-a.lean)*t,knee:a.knee+(b.knee-a.knee)*t,sp:a.sp+(b.sp-a.sp)*t,face:blendFace(a.face,b.face,t),weightShift:a.weightShift+(b.weightShift-a.weightShift)*t};
  }

  private pose(){
    const target=this.poseFor(this.state,this.animTime);const t=smoothstep(0,this.transitionDuration,this.transitionAge);let result=target;
    if(t<.999){const prior=this.exitWalkPose??this.poseFor(this.previousState,this.previousAnimTime+this.transitionAge*.25);result=this.blendPose(prior,target,t);}
    // A planted foot is a world-space constraint, not merely another animation channel.
    // Re-apply it after state blending so transition smoothing cannot make the shoe skate.
    if(this.state==='walk'||this.state==='jog'||this.state==='shuffle'){
      if(this.leftFootLock){result.footL=this.leftFootLock.clone();result.kneeL=Vec3.lerp(result.hipL,result.footL,.54).add(this.localVector(-.015,.04,.10));}
      if(this.rightFootLock){result.footR=this.rightFootLock.clone();result.kneeR=Vec3.lerp(result.hipR,result.footR,.54).add(this.localVector(.015,.04,.10));}
    }
    // Load onto the outside support foot, then release into recovery. A running
    // stroke releases the pivot as the root travels; no shoe is dragged as planted.
    const support=this.strokeSupport();
    if(support&&support.weight>0){const key=`foot${support.foot}` as const;result[key]=Vec3.lerp(result[key],support.anchor,support.weight);}
    // The reference stance is a real pose: analysis, skin and replay all see
    // these landmarks. Tennis, props, reaches and gestures leave it immediately.
    if(this.canFoldReferenceIdle()){
      const w=this.clubIdleRelax,y=result.baseY+result.breathe-result.knee;
      const fold=(key:'shoulderL'|'shoulderR'|'elbowL'|'elbowR'|'handL'|'handR',x:number,height:number,z:number)=>{result[key]=Vec3.lerp(result[key],this.worldLocal(x,height+y,z,result.torsoYaw),w);};
      fold('shoulderL',-.225,1.34,.035);fold('shoulderR',.225,1.34,.035);
      fold('elbowL',-.235,1.20,.225);fold('elbowR',.235,1.17,.245);
      fold('handL',.105,1.315,.33);fold('handR',-.115,1.24,.38);
      const delta=Vec3.sub(result.handR,result.racketGrip);result.racketGrip=result.handR.clone();result.racketHandleTop.add(delta);result.racketCenter.add(delta);
    }
    // Keep the animation-blend snapshot in its authored source coordinates;
    // retarget once, after blending and planted-foot constraints have settled.
    this.lastPose=result;
    if(this.spec.avatar==='taylor'||this.spec.appearance==='human'){
      const contact=isShot(this.state)&&this.contactTarget?bell(result.sp-this.shotContactTime(this.state)/this.shotDuration(this.state),.11):0;
      let right=Math.max(contact,this.interactionWeight),left=this.state==='swingBackhand'?contact:0;
      if(this.propKind&&this.propAnchor){const weight=this.propWanted?1-smoothstep(.4,1,this.propAge):smoothstep(0,.65,this.propAge);if(this.propKind==='notebook')left=Math.max(left,weight);else right=Math.max(right,weight);}
      let posture:Parameters<typeof adultTaylorPose>[3]['posture'];
      if(isShot(this.state)&&this.contactTarget&&this.spec.appearance==='human'){
        const offset=Vec3.sub(result.racketCenter,result.racketGrip),grip=Vec3.sub(this.contactTarget,offset);
        posture={weight:bell(result.sp-this.shotContactTime(this.state)/this.shotDuration(this.state),.34),right:grip,left:this.state==='swingBackhand'?secondRacketHand(grip,offset):undefined};
      }
      if(this.spec.appearance==='human'&&this.canRelaxClubIdle()){
        result.face={...result.face,smile:Math.max(this.spec.avatar==='taylor'?.55:this.spec.presentation==='masculine'?.18:.32,result.face.smile),squint:Math.max(.08,result.face.squint)};
      }
      const design=CAST_DESIGN[this.spec.avatar??this.spec.id]??CAST_DESIGN.taylor;
      return adultTaylorPose(result,this.position,this.yaw,{armLengths:this.spec.presentation==='feminine'&&this.spec.appearance==='human'?authoredArmLengths():undefined,sitting:this.state==='sit',seatWeight:this.state==='sit'?t:this.previousState==='sit'?1-t:0,folded:this.canFoldReferenceIdle(),rightWorld:right,leftWorld:left,human:this.spec.appearance==='human',shoulderScale:design.shoulderScale,restWeight:this.clubIdleRelax,strokeWeight:isShot(this.state)?t:isShot(this.previousState)?1-t:0,backhandWeight:this.state==='swingBackhand'?t:this.previousState==='swingBackhand'?1-t:0,readyWeight:this.state==='ready'||this.state==='shuffle'?t:this.previousState==='ready'||this.previousState==='shuffle'?1-t:0,affection:this.affection??undefined,walk:result.walking&&this.spec.appearance==='human'&&!this.propKind&&this.interactionWeight<.001&&this.socialGesture==='none'?{phase:this.gaitPhase,weight:clamp(this.horizontalSpeed/1.2,0,1),stance:this.walkingShape()!.stance,planted:[!!this.leftFootLock,!!this.rightFootLock],swing:locomotionStyleFor(this.spec.id).armSwing*.75}:undefined,posture});
    }
    return result;
  }

  /** Read-only, detached world-space landmarks from the same solver that owns contact. */
  analysisPose():CharacterPose{
    const p=this.pose();
    return Object.fromEntries(Object.entries(p).map(([k,v])=>[k,v instanceof Vec3?v.clone():typeof v==='object'?{...v}:v])) as unknown as CharacterPose;
  }

  /** Selection follows the visible adult pose, including seated heads/reaches. */
  selectionBounds(){
    const p=this.pose(),points=[p.shoulderL,p.shoulderR,p.elbowL,p.elbowR,p.handL,p.handR,p.hipL,p.hipR,p.kneeL,p.kneeR,p.footL,p.footR,p.head],pad=.15;
    const minX=Math.min(...points.map(v=>v.x))-pad,maxX=Math.max(...points.map(v=>v.x))+pad,minZ=Math.min(...points.map(v=>v.z))-pad,maxZ=Math.max(...points.map(v=>v.z))+pad;
    const low=Math.max(0,Math.min(p.footL.y,p.footR.y)-.12),high=Math.max(p.head.y+(this.spec.appearance==='human'?.23:.42),p.handL.y+.1,p.handR.y+.1);
    return {centre:new Vec3((minX+maxX)/2,(low+high)/2,(minZ+maxZ)/2),size:new Vec3(maxX-minX,high-low,maxZ-minZ)};
  }

  private holdsRacket(){
    const retained=this.reactionRacket&&(this.state==='celebrate'||this.state==='reactMiss');
    return (retained||(this.matchCompetitor||this.spec.id!=='nia')&&(isShot(this.state)||this.state==='ready'||this.state==='shuffle'||this.socialGesture==='inspect'))&&!this.racketStowed&&this.state!=='drink'&&!this.propKind;
  }

  meshes(selected=false):RenderItem[]{
    const m:RenderItem[]=[];const p=this.position;const pose=this.pose();const {baseY,torsoYaw,hipYaw,headYaw,right,forward,shoulderL,shoulderR,elbowL,elbowR,handL,handR,racketGrip,racketHandleTop,racketCenter,racketRot,footL,footR,torsoCenter,pelvisCenter,head}=pose;
    const taylor=this.spec.avatar==='taylor',human=this.spec.appearance==='human',feline=taylor&&!human,athlete=taylor||human,feminine=this.spec.presentation!=='masculine',design=CAST_DESIGN[this.spec.avatar??this.spec.id]??CAST_DESIGN.taylor;
    const ready=this.state==='ready'||this.state==='shuffle';const seed=this.seed();
    m.push({kind:'sphere',position:new Vec3(p.x,.028,p.z),scale:new Vec3(.78,.045,.50),color:'#4f5d53',alpha:.16,unlit:true});
    if(selected)m.push({kind:'torus',position:new Vec3(p.x,.055,p.z),rotation:new Vec3(Math.PI/2,0,0),scale:new Vec3(1.35,1.35,.55),color:'#e4c967',alpha:.52,unlit:true});
    const leftShoePitch=pose.walking&&!this.leftFootLock?clamp(-pose.gait*.18,-.18,.18):pose.footPitchL??0,rightShoePitch=pose.walking&&!this.rightFootLock?clamp(pose.gait*.18,-.18,.18):pose.footPitchR??0;
    const leftShoeYaw=pose.walking?this.walkCycle.yaws[0]:pose.footYawL??this.yaw,rightShoeYaw=pose.walking?this.walkCycle.yaws[1]:pose.footYawR??this.yaw;
    const holdsRacket=this.holdsRacket();
    const authored=feminine&&human?authoredAthleteMeshes(pose,p,this.yaw,[{pitch:leftShoePitch,yaw:leftShoeYaw},{pitch:rightShoePitch,yaw:rightShoeYaw}],this.animTime,this.spec.avatar??this.spec.id):undefined;
    if(authored)m.push(...authored);
    else {
    // Idle may use the authored club stance. Props, reaches and every match pose retain the contact rig.
    const relax=0;
    const bones=skinMatrices(rigFromPose(pose,p,this.yaw,relax));const skinRoot={position:new Vec3(p.x,0,p.z),rotation:new Vec3(0,this.yaw,0),boneMatrices:bones,poseRig:true};
    const torsoSkin=athlete?(feline?CHARACTER_SKIN.taylorDress:taylor?HUMAN_TENNIS_SKIN.dress:feminine?ATHLETE_WARDROBE.bodice:ATHLETE_WARDROBE.top):this.spec.presentation==='feminine'?CHARACTER_SKIN.feminineTop:CHARACTER_SKIN.top;
    const skinMaterial=human?'humanSkin':'skin',garmentMaterial=human?'performanceKnit':'fabric';
    m.push({...skinRoot,skin:torsoSkin,color:this.spec.shirt,material:garmentMaterial} as SkinnedMesh,{...skinRoot,skin:athlete?(human?ATHLETE_WARDROBE.legs:CHARACTER_SKIN.taylorLegs):CHARACTER_SKIN.pants,color:this.spec.skin,material:skinMaterial} as SkinnedMesh,{...skinRoot,skin:athlete?(human?(feminine?ATHLETE_WARDROBE.feminineArms:ATHLETE_WARDROBE.arms):CHARACTER_SKIN.taylorArms):CHARACTER_SKIN.arms,color:this.spec.skin,material:skinMaterial} as SkinnedMesh);
    if(feline)m.push({...skinRoot,skin:CHARACTER_SKIN.taylorNeckline,color:TAYLOR_PALETTE.indigo,material:'fabric'} as SkinnedMesh,{...skinRoot,skin:CHARACTER_SKIN.taylorDressEdging,color:'#f6dc7d',material:'fabric'} as SkinnedMesh,{...skinRoot,skin:CHARACTER_SKIN.taylorTunicMark,color:'#b69a2a',material:'toon',unlit:true} as SkinnedMesh,{...skinRoot,skin:CHARACTER_SKIN.taylorBoots,color:TAYLOR_PALETTE.indigo,material:'fabric'} as SkinnedMesh,{...skinRoot,skin:CHARACTER_SKIN.taylorGloves,color:TAYLOR_PALETTE.indigo,material:'fabric'} as SkinnedMesh);
    else if(human){
      if(feminine){
        if(!taylor)m.push({...skinRoot,skin:ATHLETE_WARDROBE.skirt,color:design.bottom,material:garmentMaterial} as SkinnedMesh);
        m.push({...skinRoot,skin:HUMAN_TENNIS_SKIN.yoke,color:this.spec.skin,material:'humanSkin'} as SkinnedMesh,{...skinRoot,skin:HUMAN_TENNIS_SKIN.trim,color:this.spec.accent??'#cedb68',material:'fabric'} as SkinnedMesh,{...skinRoot,skin:HUMAN_TENNIS_SKIN.seams,color:mixHex(this.spec.shirt,'#b7cced',.15),material:'fabric'} as SkinnedMesh);
      }else m.push({...skinRoot,skin:ATHLETE_WARDROBE.shorts,color:design.bottom,material:garmentMaterial} as SkinnedMesh);
      m.push({...skinRoot,skin:ATHLETE_WARDROBE.calves,color:this.spec.skin,material:'humanSkin'} as SkinnedMesh,{...skinRoot,skin:ATHLETE_WARDROBE.socks,color:'#f3f1e8',material:'fabric'} as SkinnedMesh,{...skinRoot,skin:feminine?CHARACTER_SKIN.taylorWristband:ATHLETE_WARDROBE.wristband,color:this.spec.accent??'#cedb68',material:'fabric'} as SkinnedMesh);
    }else {
      m.push({kind:'sphere',position:torsoCenter.clone().add(new Vec3(0,.025,0)),rotation:new Vec3(0,torsoYaw,0),scale:new Vec3(this.spec.presentation==='feminine'?.53:.57,.68,.40),color:this.spec.shirt,material:'fabric'});
      if(this.spec.outfit==='shorts')m.push({...skinRoot,skin:CHARACTER_SKIN.shorts,color:mixHex(this.spec.shirt,'#192d37',.28),material:'fabric'} as SkinnedMesh);
      // Rounded sleeve caps belong to the upper-arm skin and its exact shoulder
      // pivot; separate inward-shifted spheres left gaps when the arm lifted.
    }
    if(!athlete)for(const elbow of [elbowL,elbowR])m.push({kind:'sphere',position:elbow,scale:new Vec3(.20,.20,.19),color:this.spec.skin,material:'skin'});
    const shoeColor=feline?this.spec.skin:this.spec.shoe??'#fff8ee',soleColor=mixHex(shoeColor,'#ffffff',.62);
    if(athlete){for(const [foot,pitch,yaw] of [[footL,leftShoePitch,leftShoeYaw],[footR,rightShoePitch,rightShoeYaw]] as const)m.push(...taylorFootMeshes(foot,pitch,yaw,feline?undefined:this.spec.shoe,feline?undefined:'#b5bcb6',human));}
    else {
    m.push({kind:'roundBox',position:footL,rotation:new Vec3(leftShoePitch,leftShoeYaw,0),scale:new Vec3(.29,.135,.43),color:shoeColor,material:'fabric'},{kind:'roundBox',position:footR,rotation:new Vec3(rightShoePitch,rightShoeYaw,0),scale:new Vec3(.29,.135,.43),color:shoeColor,material:'fabric'});
    m.push({kind:'roundBox',position:new Vec3(footL.x,footL.y-.055,footL.z),rotation:new Vec3(leftShoePitch,leftShoeYaw,0),scale:new Vec3(.30,.055,.445),color:soleColor,material:'fabric'},{kind:'roundBox',position:new Vec3(footR.x,footR.y-.055,footR.z),rotation:new Vec3(rightShoePitch,rightShoeYaw,0),scale:new Vec3(.30,.055,.445),color:soleColor,material:'fabric'});
    }

    const freeHands=human&&!this.propKind&&!this.interactionTarget&&this.interactionWeight<.001&&['idle','walk','jog','watch','talk','sit'].includes(this.state)&&this.socialGesture!=='inspect';
    if(athlete)m.push({...skinRoot,skin:freeHands?ATHLETE_WARDROBE.freeHands:CHARACTER_SKIN.taylorHands,color:feline?TAYLOR_PALETTE.indigo:this.spec.skin,material:feline?'toon':'humanSkin'} as SkinnedMesh);
    else {
      m.push({kind:'sphere',position:handL,scale:new Vec3(.16,.20,.15),color:this.spec.skin,material:'skin'},{kind:'sphere',position:handR,scale:new Vec3(.16,.20,.15),color:this.spec.skin,material:'skin'});
      for(const [hand,side] of [[handL,-1],[handR,1]] as const)m.push({kind:'sphere',position:Vec3.add(hand,this.localVector(-side*.075,.025,.045)),scale:new Vec3(.095,.12,.10),color:this.spec.skin,material:'skin'});
    }
    const tilt=this.majorActivity?0:this.acting.values.headTilt+(this.acting.reaction?.tilt??0)*this.acting.reactionWeight;
    if(feline){
      const headScale=TAYLOR_BODY.headScale;
      m.push(...taylorHeadMeshes(head,headYaw,tilt,pose.face,this.animTime).map(m=>({...m,position:head.clone().add(Vec3.sub(m.position,head).scale(headScale)),scale:(m.scale??new Vec3(1,1,1)).clone().scale(headScale)})));
      const neck=Vec3.lerp(Vec3.lerp(shoulderL,shoulderR,.5),head,.30);
      m.push({kind:'sphere',position:neck,scale:new Vec3(.23,.32,.23),color:this.spec.skin,material:'skin'});
      m.push(...taylorTailMeshes(pelvisCenter,hipYaw,this.animTime,this.horizontalSpeed));
    }else if(human){
      m.push(...humanTaylorHead(head,headYaw,tilt,pose.face,this.animTime,this.spec.skin,design.head));
      const shoulder=Vec3.lerp(shoulderL,shoulderR,.5),jaw=head.clone().add(new Vec3(0,-.143,0)),neck=Vec3.lerp(shoulder,jaw,.5);
      m.push({kind:'sphere',position:neck,rotation:new Vec3(0,headYaw,tilt),scale:new Vec3(.099,Math.max(.09,jaw.y-shoulder.y)+.065,.104),color:this.spec.skin,material:'humanSkin'});
    }else {
    const headStart=m.length;
    const faceShape=this.spec.id==='mika'?new Vec3(.565,.600,.530):this.spec.id==='coach'?new Vec3(.545,.590,.520):this.spec.id==='nia'?new Vec3(.570,.585,.535):new Vec3(.550,.595,.525);
    m.push({kind:'sphere',position:head,scale:faceShape,color:this.spec.skin,material:'skin'});
    // A tiny neck bridge and outfit silhouette make the skinned body read as one soft adult figure rather than stacked primitives.
    const neck=Vec3.lerp(Vec3.lerp(shoulderL,shoulderR,.5),head,.30);m.push({kind:'cylinder',position:neck,scale:new Vec3(.18,.25,.18),color:this.spec.skin,material:'skin'});
    if(this.spec.outfit==='skirt'||this.spec.outfit==='skort'||this.spec.outfit==='host')m.push({...skinRoot,skin:CHARACTER_SKIN.skirt,color:mixHex(this.spec.shirt,'#ffffff',.12),material:'fabric'} as SkinnedMesh);
    // Boutique outfit details: bright collar, socks and a tiny club badge improve readability without texture assets.
    const collar=Vec3.lerp(torsoCenter,Vec3.lerp(shoulderL,shoulderR,.5),.72);m.push({kind:'torus',position:collar,rotation:new Vec3(Math.PI/2,torsoYaw,0),scale:new Vec3(.42,.34,.08),color:this.spec.accent??'#fff0d7',material:'fabric',alpha:.86});
    const sockColor=mixHex(this.spec.shoe??'#fffaf0','#ffffff',.35);for(const f of [footL,footR])m.push({kind:'cylinder',position:new Vec3(f.x,f.y+.16,f.z-.035),rotation:new Vec3(0,this.yaw,0),scale:new Vec3(.145,.18,.145),color:sockColor,material:'fabric'});
    const badge=this.worldLocal(.18,1.42+baseY+pose.breathe-pose.knee,.195,torsoYaw);m.push({kind:'sphere',position:badge,scale:new Vec3(.055,.055,.025),color:this.spec.accent??'#fff0d7',material:'ceramic',unlit:true});
    const placket=torsoCenter.clone().add(forward.clone().scale(.215)).add(new Vec3(0,.12,0));m.push({kind:'roundBox',position:placket,rotation:new Vec3(0,torsoYaw,0),scale:new Vec3(.046,.16,.025),color:mixHex(this.spec.shirt,'#ffffff',.16),material:'fabric'});for(const dy of [-.025,.035])m.push({kind:'sphere',position:placket.clone().add(forward.clone().scale(.018)).add(new Vec3(0,dy,0)),scale:new Vec3(.018,.018,.010),color:'#eee9dc',material:'ceramic'});
    const faceDetailsStart=m.length;
    m.push({kind:'sphere',position:Vec3.add(head,right.clone().scale(-.255)),scale:new Vec3(.085,.125,.075),color:this.spec.skin,material:'skin'},{kind:'sphere',position:Vec3.add(head,right.clone().scale(.255)),scale:new Vec3(.085,.125,.075),color:this.spec.skin,material:'skin'});
    const hairStyle=this.spec.hairStyle??'cap';const hairSway=clamp(angleDelta(this.yaw,this.targetYaw),-.35,.35)*.12+Math.sin(this.animTime*7+seed)*Math.min(.025,this.horizontalSpeed*.008);
    const hair=(position:Vec3,scale:Vec3,alpha=1)=>m.push({kind:'sphere' as const,position,rotation:new Vec3(0,headYaw,0),scale,color:this.spec.hair,material:'hair' as const,alpha});
    if(hairStyle==='long'){
      hair(Vec3.add(head,new Vec3(0,.17,0)),new Vec3(.58,.34,.54));
      hair(Vec3.add(head,forward.clone().scale(-.20)).add(new Vec3(0,-.27,0)),new Vec3(.48,.62,.25));
      for(const side of [-1,1])hair(Vec3.add(head,right.clone().scale(side*.255)).add(forward.clone().scale(.015)).add(new Vec3(0,-.19,0)),new Vec3(.145,.55,.20));
      // Navy-and-gold cat-ear headband; the face remains human.
      for(const side of [-1,1]){const ear=Vec3.add(head,right.clone().scale(side*.22)).add(new Vec3(0,.34,0));m.push({kind:'cone',position:ear,rotation:new Vec3(0,headYaw,side*-.18),scale:new Vec3(.15,.18,.12),color:'#172a49',material:'fabric'},{kind:'cone',position:Vec3.add(ear,forward.clone().scale(.055)),rotation:new Vec3(0,headYaw,side*-.18),scale:new Vec3(.080,.105,.035),color:'#dfbb50',material:'metal'});}
    }else if(hairStyle==='swept'){
      hair(Vec3.add(head,new Vec3(0,.16,0)),new Vec3(.58,.35,.54));
      for(let i=0;i<4;i++){const tuft=Vec3.add(head,right.clone().scale(-.17+i*.10)).add(forward.clone().scale(.085)).add(new Vec3(0,.255-i*.012,0));hair(tuft,new Vec3(.18,.115,.32));}
      hair(Vec3.add(head,right.clone().scale(-.23)).add(forward.clone().scale(.14)).add(new Vec3(0,.14,0)),new Vec3(.15,.28,.15));
    }else if(hairStyle==='bun'){
      hair(new Vec3(head.x,head.y+.18,head.z-.035),new Vec3(.555,.33,.525));
      hair(Vec3.add(head,forward.clone().scale(-.21)).add(right.clone().scale(-hairSway)).add(new Vec3(0,.22,0)),new Vec3(.245,.245,.245));
      hair(Vec3.add(head,right.clone().scale(-.28)).add(forward.clone().scale(.02)).add(new Vec3(0,.07,0)),new Vec3(.12,.22,.12),.94);
    }else if(hairStyle==='ponytail'){
      hair(new Vec3(head.x,head.y+.16,head.z-.03),new Vec3(.555,.32,.525));
      const tie=Vec3.add(head,forward.clone().scale(-.21)).add(new Vec3(0,.10,0));m.push({kind:'torus',position:tie,rotation:new Vec3(Math.PI/2,this.yaw,0),scale:new Vec3(.18,.18,.10),color:this.spec.accent??'#ead2bd',material:'fabric'});
      const tailBase=Vec3.add(tie,forward.clone().scale(-.11)).add(right.clone().scale(-hairSway*.75));hair(tailBase.add(new Vec3(0,-.10,0)),new Vec3(.18,.34,.16));hair(Vec3.add(tailBase,new Vec3(0,-.34,0)).add(right.clone().scale(-hairSway)),new Vec3(.14,.28,.13),.95);
    }else if(hairStyle==='bob'){
      hair(new Vec3(head.x,head.y+.14,head.z-.03),new Vec3(.565,.36,.535));
      for(const side of [-1,1])hair(Vec3.add(head,right.clone().scale(side*.31)).add(new Vec3(0,-.08,0)),new Vec3(.17,.35,.15),.98);
      hair(Vec3.add(head,forward.clone().scale(-.19)).add(new Vec3(0,-.13,0)),new Vec3(.39,.30,.18),.96);
    }else if(hairStyle==='waves'){
      hair(new Vec3(head.x,head.y+.13,head.z-.03),new Vec3(.565,.37,.535));
      for(const side of [-1,1]){hair(Vec3.add(head,right.clone().scale(side*.28)).add(new Vec3(0,-.02,0)),new Vec3(.18,.33,.16),.96);hair(Vec3.add(head,right.clone().scale(side*.30)).add(new Vec3(0,-.30,0)),new Vec3(.14,.28,.13),.92);}
    }else if(hairStyle==='crop'){hair(new Vec3(head.x,head.y+.20,head.z-.02),new Vec3(.54,.26,.51));}
    else hair(new Vec3(head.x,head.y+.17,head.z-.015),new Vec3(.55,.31,.525));
    if(this.spec.presentation==='feminine'){
      for(const side of [-1,1]){const ear=Vec3.add(head,right.clone().scale(side*.27)).add(forward.clone().scale(.01)).add(new Vec3(0,-.075,0));m.push({kind:'torus',position:ear,rotation:new Vec3(0,headYaw,0),scale:new Vec3(.065,.09,.026),color:'#dcb76c',material:'metal'});}
      if(hairStyle==='bun'||hairStyle==='ponytail')hair(Vec3.add(head,right.clone().scale(-.14)).add(forward.clone().scale(.20)).add(new Vec3(0,.17,0)),new Vec3(.30,.17,.15));
    }
    // Small sheen patch gives hair a soft illustrated highlight rather than a plastic gloss.
    hair(Vec3.add(head,right.clone().scale(-.12)).add(forward.clone().scale(.11)).add(new Vec3(0,.24,0)),new Vec3(.16,.060,.11),.16);


    // Face: sclera + pupils + independently posed brows + cheeks + two-corner mouth give us cheap but readable deformation.
    const blinkPhase=(this.animTime+seed*.113)%3.75,blink=blinkPhase<.085?1-smoothstep(0,.085,blinkPhase):0;let gaze=0;if(this.targetLook){const aim=Math.atan2(this.targetLook.x-p.x,this.targetLook.z-p.z)-headYaw;gaze=clamp(aim,-.22,.22)*.12;}
    const eyeOpen=clamp(1-blink-pose.face.squint*.55,.08,1);
    const eyeSpacing=this.spec.id==='mika'?.112:this.spec.id==='nia'?.106:this.spec.id==='coach'?.102:.108;for(const sideEye of [-1,1]){const ep=Vec3.add(head,forward.clone().scale(.224)).add(right.clone().scale(sideEye*eyeSpacing));ep.y+=.032;m.push({kind:'sphere',position:ep,scale:new Vec3(.102,.066*eyeOpen,.038),color:'#fffdf7',material:'ceramic',unlit:true});const pupil=Vec3.add(ep,forward.clone().scale(.018)).add(right.clone().scale(gaze));m.push({kind:'sphere',position:pupil,scale:new Vec3(.055,.056*eyeOpen,.023),color:this.spec.eye??'#34483f',material:'hair',unlit:true});m.push({kind:'sphere',position:Vec3.add(pupil,forward.clone().scale(.009)),scale:new Vec3(.030,.045*eyeOpen,.015),color:'#182a2c',unlit:true});const sparkle=Vec3.add(pupil,forward.clone().scale(.021)).add(right.clone().scale(-sideEye*.011));sparkle.y+=.010;m.push({kind:'sphere',position:sparkle,scale:new Vec3(.016,.016,.008),color:'#ffffff',unlit:true});const brow=Vec3.add(ep,new Vec3(0,.102+pose.face.browRaise*.045,0)).add(right.clone().scale(sideEye*.005));m.push({kind:'roundBox',position:brow,rotation:new Vec3(0,headYaw,sideEye*(-.02-pose.face.smile*.09)),scale:new Vec3(this.spec.avatar==='arjan'?.115:.090,this.spec.avatar==='arjan'?.035:.018,.015),color:this.spec.hair,material:'hair',unlit:true});}
    const nose=Vec3.add(head,forward.clone().scale(.254));nose.y-=.040;m.push({kind:'sphere',position:nose,scale:new Vec3(.035,.050,.032),color:mixHex(this.spec.skin,'#86594f',.20),material:'skin'});
    const cheekY=head.y-.075;for(const s of [-1,1]){const cp=Vec3.add(head,forward.clone().scale(.215)).add(right.clone().scale(s*.15));cp.y=cheekY;m.push({kind:'sphere',position:cp,scale:new Vec3(.060,.034,.018),color:mixHex(this.spec.skin,'#dd8e91',.42),alpha:.32+.12*Math.max(0,pose.face.smile),unlit:true});}
    const mouthBase=Vec3.add(head,forward.clone().scale(.250));mouthBase.y-=.135;const width=.065+.025*Math.max(0,pose.face.smile),cornerLift=pose.face.smile*.045;
    for(const s of [-1,1]){const corner=Vec3.add(mouthBase,right.clone().scale(s*width*.72));corner.y+=cornerLift;m.push({kind:'sphere',position:corner,scale:new Vec3(.026,.020,.016),color:mixHex(this.spec.skin,'#6c3f46',.48),unlit:true});}
    m.push({kind:'sphere',position:new Vec3(mouthBase.x,mouthBase.y+cornerLift*.5,mouthBase.z),rotation:new Vec3(0,headYaw,0),scale:new Vec3(width*1.7,.018+.042*pose.face.mouthOpen,.020),color:pose.face.mouthOpen>.18?'#5b3d43':mixHex(this.spec.skin,'#6c3f46',.48),unlit:true});
    if(this.spec.presentation==='feminine'){for(const sideEye of [-1,1]){const lash=Vec3.add(head,forward.clone().scale(.229)).add(right.clone().scale(sideEye*.156));lash.y+=.066;m.push({kind:'roundBox',position:lash,rotation:new Vec3(0,headYaw,sideEye*-.08),scale:new Vec3(.038,.010,.008),color:this.spec.hair,unlit:true});}if(this.spec.id==='mika'){const band=Vec3.add(head,new Vec3(0,.245,0));m.push({kind:'torus',position:band,rotation:new Vec3(Math.PI/2,headYaw,0),scale:new Vec3(.64,.65,.09),color:this.spec.accent??'#efd7bb',material:'fabric',alpha:.86});}}

    // Scale the existing face/hair together, retaining identity and the skeletal contact rig.
    for(const item of [m[headStart],...m.slice(faceDetailsStart)]){if('skin' in item)continue;const offset=Vec3.sub(item.position,head),x=Vec3.dot(offset,right),y=offset.y;item.position.add(right.clone().scale((x*Math.cos(tilt)-y*Math.sin(tilt)-x))).add(new Vec3(0,x*Math.sin(tilt)+y*Math.cos(tilt)-y,0));item.position=Vec3.add(head,Vec3.sub(item.position,head).scale(.80));item.scale.scale(.80);}
    }
    if(this.spec.avatar&&!athlete){
      const charm=this.worldLocal(0,1.28+baseY+pose.breathe-pose.knee,.235,torsoYaw);
      m.push({kind:'torus',position:Vec3.add(charm,new Vec3(0,.07,0)),rotation:new Vec3(.3,torsoYaw,0),scale:new Vec3(.28,.20,.025),color:this.spec.avatar==='taylor'?'#dbb447':'#c6c6bd',material:'metal'});
      if(this.spec.avatar==='taylor')m.push({kind:'sphere',position:charm,scale:new Vec3(.10,.12,.035),color:'#50b8b4',material:'ceramic'});
    }
    }
    if(holdsRacket){
      m.push(this.limb(racketGrip,racketHandleTop,.035,'#4b514e'));
      // One readable frame, then an actual string bed. The old second torus read as a hollow ring.
      m.push({skin:RACKET_FRAME,boneMatrices:RACKET_BONES,position:racketCenter,rotation:racketRot,color:this.spec.accent??'#e0c474',material:'metal'});
      for(const side of [-1,1])m.push({...this.limb(racketHandleTop,Vec3.add(racketCenter,rotateEulerVector(new Vec3(side*.115,-.175,0),racketRot)),.017,this.spec.accent??'#e0c474'),material:'metal'});
      // Fixed ends and a yielding middle make impact read as a string bed,
      // rather than a solid paddle. Only a confirmed contact loads the strings.
      const depth=this.racketStringOffset();
      const stringColor=this.racketImpactAge<.10?'#fffbd6':'#d8e9dc';
      const worldPoint=(x:number,y:number,z:number)=>Vec3.add(racketCenter,rotateEulerVector(new Vec3(x,y,z),racketRot));
      const stringHalf=(a:Vec3,b:Vec3)=>{
        const segment=this.limb(a,b,.0045,stringColor);
        segment.id='racket-string';
        segment.unlit=true;
        segment.noShadow=true;
        m.push(segment);
      };
      for(const x of [-.12,-.08,-.04,0,.04,.08,.12]){
        const halfHeight=RACKET.stringHalfHeight*Math.sqrt(1-(x/RACKET.stringHalfWidth)**2);
        const middle=worldPoint(x,0,depth*(1-(x/RACKET.stringHalfWidth)**2));
        stringHalf(worldPoint(x,-halfHeight,0),middle);
        stringHalf(middle,worldPoint(x,halfHeight,0));
      }
      for(const y of [-.18,-.12,-.06,0,.06,.12,.18]){
        const halfWidth=RACKET.stringHalfWidth*Math.sqrt(1-(y/RACKET.stringHalfHeight)**2);
        const middle=worldPoint(0,y,depth*(1-(y/RACKET.stringHalfHeight)**2));
        stringHalf(worldPoint(-halfWidth,y,0),middle);
        stringHalf(middle,worldPoint(halfWidth,y,0));
      }
      // A tiny butt cap makes the hand-to-racket constraint visually obvious at close zoom.
      m.push({kind:'cylinder',position:racketGrip,rotation:new Vec3(Math.PI/2,this.yaw,0),scale:new Vec3(.045,.065,.045),color:'#44372f',material:'fabric'});
    }
    const propHandR=this.propKind&&this.propWanted&&this.propAge<.4&&this.propAnchor?this.propAnchor:handR,propHandL=this.propKind&&this.propWanted&&this.propAge<.4&&this.propAnchor?this.propAnchor:handL;
    if(this.propKind==='wateringCan'){const pour=smoothstep(.8,1.5,this.propAge),can=Vec3.add(propHandR,this.localVector(0,.055,-.13));m.push({kind:'cylinder',position:can,rotation:new Vec3(.28*pour,this.yaw,0),scale:new Vec3(.24,.25,.24),color:'#769c92',material:'metal'},{kind:'cone',position:Vec3.add(can,this.localVector(0,.02,.17)),rotation:new Vec3(.95+.25*pour,this.yaw,0),scale:new Vec3(.08,.27,.08),color:'#769c92',material:'metal'});}
    if(this.propKind==='notebook')m.push({kind:'roundBox',position:Vec3.add(propHandL,new Vec3(0,.035,.08)),rotation:new Vec3(.25,this.yaw,0),scale:new Vec3(.29,.045,.36),color:'#f2e4be',material:'fabric'});
    if(this.propKind==='ball')m.push({kind:'sphere',position:Vec3.add(propHandR,new Vec3(0,.08,0)),scale:new Vec3(.13,.13,.13),color:'#d7dc79'});
    if(this.state==='drink'||this.propKind==='cup'){const cup=Vec3.add(propHandR,new Vec3(0,.05,0));m.push({kind:'cylinder',position:cup,scale:new Vec3(.16,.28,.16),color:'#f0e8d8',material:'ceramic'});for(let i=0;i<2;i++){const ph=(this.animTime*.55+i*.43)%1;m.push({kind:'sphere',position:new Vec3(cup.x+Math.sin(this.animTime*2+i)*.025,cup.y+.19+ph*.24,cup.z),scale:new Vec3(.035,.07,.035),color:'#f6f1e8',alpha:.18*(1-ph),unlit:true});}}
    return m;
  }
}
