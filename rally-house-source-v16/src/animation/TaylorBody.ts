import {Vec3,clamp} from '../rendering/Math3D.js';
import type {CharacterPose} from '../entities/Character.js';

export const TAYLOR_BODY={pelvisHeight:1.245,strokePelvisFloor:.86,torsoScale:1.20,headScale:.62,upperArm:.425,forearm:.415,thigh:.56,shin:.55} as const;
interface Constraints {armLengths?:{upperArm:number;forearm:number};sitting:boolean;seatWeight?:number;folded:boolean;rightWorld:number;leftWorld:number;human?:boolean;affection?:{kind:'hug'|'kiss';target:Vec3;weight:number;upper:boolean};shoulderScale?:number;restWeight?:number;readyWeight?:number;walk?:{phase:number;weight:number;swing:number;stance:number;planted?:[boolean,boolean]};posture?:{weight:number;right:Vec3;left?:Vec3};}
const smooth=(t:number)=>{const u=clamp(t,0,1);return u*u*(3-2*u);};
function joint(a:Vec3,b:Vec3,first:number,second:number,pole:Vec3,fallback:Vec3){
 const delta=Vec3.sub(b,a),d=Math.max(.0001,delta.len()),axis=delta.scale(1/d),stretch=Math.max(1,d/(first+second-.001));
 const l=first*stretch,r=second*stretch,along=(l*l+d*d-r*r)/(2*d),height=Math.sqrt(Math.max(0,l*l-along*along));
 const bend=Vec3.sub(pole,a);bend.sub(axis.clone().scale(Vec3.dot(bend,axis)));
 if(bend.len()<.001){bend.set(fallback.x,fallback.y,fallback.z);bend.sub(axis.clone().scale(Vec3.dot(bend,axis)));}
 if(bend.len()<.001){bend.set(1,0,0);bend.sub(axis.clone().scale(Vec3.dot(bend,axis)));}
 return a.clone().add(axis.scale(along)).add(bend.normalize().scale(height));
}

/** Retarget the authoritative pose, including its world-space constraints.
 * The existing bind mesh is deformed by this same pose in live play and replay. */
export function adultTaylorPose(source:CharacterPose,root:Vec3,yaw:number,constraints:Constraints):CharacterPose{
 const arms=constraints.armLengths??TAYLOR_BODY;
 const p={...source,face:{...source.face}};for(const [key,v] of Object.entries(source))if(v instanceof Vec3)(p as unknown as Record<string,unknown>)[key]=v.clone();
 const oldShoulder=Vec3.lerp(source.shoulderL,source.shoulderR,.5),seat=constraints.seatWeight??(constraints.sitting?1:0),standingY=TAYLOR_BODY.pelvisHeight+(source.pelvisCenter.y-.79)*1.5,pelvisY=standingY+(source.pelvisCenter.y-standingY)*seat;
 p.seatedWeight=seat;
 const horizontal=(v:Vec3,sx:number,sz=1)=>{const dx=v.x-root.x,dz=v.z-root.z,s=Math.sin(yaw),c=Math.cos(yaw),x=(c*dx-s*dz)*sx,z=(s*dx+c*dz)*sz;return new Vec3(root.x+c*x+s*z,v.y,root.z-s*x+c*z);};
 const torso=(v:Vec3)=>{const out=horizontal(v,.80);out.y=pelvisY+(v.y-source.pelvisCenter.y)*TAYLOR_BODY.torsoScale;return out;};
 p.pelvisCenter=torso(source.pelvisCenter);p.torsoCenter=torso(source.torsoCenter);p.shoulderL=torso(source.shoulderL);p.shoulderR=torso(source.shoulderR);
 // The compact bind's broad shoulders suit the original stylized avatar.
 // An adult human needs a narrower shoulder girdle; solve the arms from these
 // real landmarks so skin, contact and tracking agree on the new proportion.
 if(constraints.human){const center=Vec3.lerp(p.shoulderL,p.shoulderR,.5),scale=constraints.shoulderScale??.83;for(const side of ['L','R'] as const){const delta=Vec3.sub(p[`shoulder${side}`],center);delta.x*=scale;delta.z*=scale;p[`shoulder${side}`]=center.clone().add(delta);}}
 if(constraints.folded){const right=new Vec3(Math.cos(p.torsoYaw),0,-Math.sin(p.torsoYaw)),center=Vec3.lerp(p.shoulderL,p.shoulderR,.5);p.shoulderL=center.clone().add(right.clone().scale(-.284));p.shoulderR=center.clone().add(right.scale(.284));}
 const shoulder=Vec3.lerp(p.shoulderL,p.shoulderR,.5);
 p.head=horizontal(source.head,.80);p.head.y=shoulder.y+(source.head.y-oldShoulder.y)*.82-(constraints.human?.065:0);
 for(const side of ['L','R'] as const){const key=`hip${side}` as const;p[key]=horizontal(source[key],.90);p[key].y=pelvisY+(source[key].y-source.pelvisCenter.y)*1.20;}
 // A small weight-bearing rest stance replaces the symmetric mannequin pose.
 // Feet retain their anchors and the knees/arms are solved below. This same
 // stance is recorded and analysed, rather than being a visual-only offset.
 if(constraints.human&&constraints.restWeight){
  const w=clamp(constraints.restWeight,0,1),right=new Vec3(Math.cos(yaw),0,-Math.sin(yaw));
  for(const key of ['pelvisCenter','hipL','hipR'] as const)p[key].add(right.clone().scale(.060*w));
  p.torsoCenter.add(right.clone().scale(.006*w));
  for(const key of ['shoulderL','shoulderR','head'] as const)p[key].add(right.clone().scale(-.007*w));
  p.shoulderL.y+=.007*w;p.shoulderR.y-=.007*w;
 }
 const arm=(v:Vec3)=>{const out=horizontal(v,.78),dy=v.y-oldShoulder.y,down=constraints.human?2.55:2.30,scale=down-(down-1.20)*smooth((dy+.10)/.25);out.y=shoulder.y+dy*scale;return out;};
 p.handL=Vec3.lerp(arm(source.handL),source.handL,constraints.leftWorld);p.handR=Vec3.lerp(arm(source.handR),source.handR,constraints.rightWorld);

 const bodyKeys=['pelvisCenter','torsoCenter','shoulderL','shoulderR','head','hipL','hipR'] as const;
 // Loading and exact hand contact share one vertical budget. Applying each
 // solve's full drop independently could seat a standing player on the floor.
 const lower=(dy:number)=>{
  const available=constraints.human&&constraints.posture&&!constraints.sitting?Math.max(0,p.pelvisCenter.y-root.y-TAYLOR_BODY.strokePelvisFloor):Infinity;
  for(const key of bodyKeys)p[key].y-=Math.min(dy,available);
 };
 // A long step lowers the pelvis to respect leg length while a planted foot
 // remains a world-space anchor. Sitting uses the actual seat height.
 if(!constraints.sitting){
  let drop=0;for(const side of ['L','R'] as const){
   const walk=constraints.walk;let load=1;
   if(walk?.planted&&!walk.planted[side==='L'?0:1]){const phase=((walk.phase/(Math.PI*2)+(side==='R'?.5:0))%1+1)%1,swing=clamp((phase-walk.stance)/(1-walk.stance),0,1);load=1-smooth(swing/.20)+smooth((swing-.80)/.20);}
   const hip=p[`hip${side}`],foot=p[`foot${side}`],h=Math.hypot(hip.x-foot.x,hip.z-foot.z),vertical=Math.sqrt(Math.max(.01,(TAYLOR_BODY.thigh+TAYLOR_BODY.shin-.001)**2-h*h));drop=Math.max(drop,(hip.y-foot.y-vertical)*load);
  }lower(Math.max(0,drop));
 }
 // Load the adult body toward the known contact before the short hand-contact
 // window. Rebuilding the free hand goals from the loaded shoulders prevents
 // both a one-frame crouch and hands floating above the descending body.
 if(constraints.human&&constraints.posture&&constraints.posture.weight>0){
  const load=constraints.posture,weight=load.weight,originalL=p.shoulderL.clone(),originalR=p.shoulderR.clone(),offsetL=Vec3.sub(arm(source.handL),originalL),offsetR=Vec3.sub(arm(source.handR),originalR);
  const target=load.left?Vec3.lerp(load.right,load.left,.5):load.right,centre=Vec3.lerp(originalL,originalR,.5),toward=Vec3.sub(target,centre);toward.y=0;const distance=toward.len(),lean=distance>.34?toward.scale(Math.min(.24,distance-.34)/distance):new Vec3();
  let drop=0;for(const [start,end] of [[originalR,load.right],...(load.left?[[originalL,load.left]]:[])] as [Vec3,Vec3][]){const shifted=start.clone().add(lean),horizontal=Math.hypot(end.x-shifted.x,end.z-shifted.z),vertical=Math.sqrt(Math.max(.04,(arms.upperArm+arms.forearm-.003)**2-horizontal*horizontal));drop=Math.max(drop,shifted.y-end.y-vertical);}
  lower(clamp(drop,0,.65)*weight);
  for(const key of ['shoulderL','shoulderR','head'] as const)p[key].add(lean.clone().scale(weight));p.torsoCenter.add(lean.clone().scale(weight*.6));
  p.handL=Vec3.lerp(p.shoulderL.clone().add(offsetL),source.handL,constraints.leftWorld);p.handR=Vec3.lerp(p.shoulderR.clone().add(offsetR),source.handR,constraints.rightWorld);
 }
 const affection=constraints.affection;
 if(affection&&affection.weight>0){
  const w=affection.weight,toward=Vec3.sub(affection.target,root);toward.y=0;toward.normalize();
  const right=new Vec3(toward.z,0,-toward.x),lean=toward.clone().scale((affection.kind==='kiss'?.16:.10)*w);
  for(const key of ['shoulderL','shoulderR','head'] as const)p[key].add(lean);p.torsoCenter.add(lean.clone().scale(.5));
  p.headYaw=yaw+(affection.upper?.09:-.09)*w;
  for(const side of ['L','R'] as const){const goal=affection.target.clone().add(right.clone().scale(side==='L'?-.25:.25)).add(toward.clone().scale(.04));goal.y=shoulder.y-(affection.upper?.08:.30);p[`hand${side}`]=Vec3.lerp(p[`hand${side}`],goal,w);}
  p.face.smile=Math.max(p.face.smile,.45*w);
 }
 // A constrained low ball or prop is reached with the body, rather than by
 // stretching a forearm through the floor. The hand keeps ownership of contact.
 for(const [side,weight] of [['R',constraints.rightWorld],['L',constraints.leftWorld]] as const){
  if(weight<.001)continue;const hand=p[`hand${side}`],start=p[`shoulder${side}`],reach=arms.upperArm+arms.forearm-.003,delta=Vec3.sub(hand,start);
  if(delta.len()<=reach)continue;
  const horizontalLength=Math.hypot(delta.x,delta.z),vertical=Math.sqrt(Math.max(.04,reach*reach-horizontalLength*horizontalLength));
  const drop=clamp(start.y-hand.y-vertical,0,.76);lower(drop);
  const remaining=Vec3.sub(hand,p[`shoulder${side}`]),distance=remaining.len();
  if(distance>reach){const hinge=remaining.scale(Math.min(.65,(distance-reach+.008))/distance);p.shoulderL.add(hinge);p.shoulderR.add(hinge);p.head.add(hinge);p.torsoCenter.add(hinge.clone().scale(.6));}
 }
 const forward=new Vec3(Math.sin(yaw),0,Math.cos(yaw)),torsoForward=new Vec3(Math.sin(p.torsoYaw),0,Math.cos(p.torsoYaw)),torsoRight=new Vec3(Math.cos(p.torsoYaw),0,-Math.sin(p.torsoYaw));
 for(const side of ['L','R'] as const){
  const walk=constraints.human?constraints.walk:undefined;
  const hip=p[`hip${side}`];
  // An airborne leg recovers toward the body; it cannot drag the planted body down.
  if(walk?.planted&&!walk.planted[side==='L'?0:1]){const delta=Vec3.sub(p[`foot${side}`],hip),reach=TAYLOR_BODY.thigh+TAYLOR_BODY.shin-.001;if(delta.len()>reach)p[`foot${side}`]=hip.clone().add(delta.normalize().scale(reach));}
  const foot=p[`foot${side}`],kneePole=Vec3.lerp(hip,foot,.5).add(forward.clone().scale(.5));p[`knee${side}`]=joint(hip,foot,TAYLOR_BODY.thigh,TAYLOR_BODY.shin,kneePole,forward);
  if(walk){const sign=side==='L'?-1:1,swing=Math.cos(walk.phase)*walk.swing,goal=p[`shoulder${side}`].clone().add(torsoRight.clone().scale(sign*.015)).add(new Vec3(0,-(arms.upperArm+arms.forearm-.05)+Math.abs(swing)*.035,0)).add(torsoForward.clone().scale(sign*swing));p[`hand${side}`]=Vec3.lerp(p[`hand${side}`],goal,walk.weight);}
  const world=side==='L'?constraints.leftWorld:constraints.rightWorld;
  if(constraints.human&&seat>0&&!affection){const goal=Vec3.lerp(p[`hip${side}`],p[`knee${side}`],.60).add(new Vec3(0,.23,0));p[`hand${side}`]=Vec3.lerp(p[`hand${side}`],goal,seat*(1-world));}
  if(constraints.human&&constraints.restWeight){const goal=p.pelvisCenter.clone().add(torsoRight.clone().scale(side==='L'?-.278:.278)).add(torsoForward.clone().scale(.10)).add(new Vec3(0,.18,0));p[`hand${side}`]=Vec3.lerp(p[`hand${side}`],goal,constraints.restWeight*(1-world));}
  const shoulder=p[`shoulder${side}`],hand=p[`hand${side}`];
  if(constraints.human&&world<.999&&!affection&&!constraints.posture){
   const t=clamp((hand.y-p.pelvisCenter.y)/(shoulder.y-p.pelvisCenter.y),0,1),center=Vec3.lerp(p.pelvisCenter,Vec3.lerp(p.shoulderL,p.shoulderR,.5),t),d=Vec3.sub(hand,center),x=Vec3.dot(d,torsoRight),z=Vec3.dot(d,torsoForward),rx=t<.4?.27:.30,rz=.265,inside=x*x/(rx*rx)+z*z/(rz*rz);
   if(hand.y>p.pelvisCenter.y+.08&&hand.y<shoulder.y-.12&&inside<1)hand.add(torsoForward.clone().scale((Math.sqrt(Math.max(0,1-x*x/(rx*rx)))*rz-z)*(1-world)));
  }
  if(world<.999){const d=Vec3.sub(hand,shoulder),distance=d.len(),reach=arms.upperArm+arms.forearm-.003;
   if(distance>reach)p[`hand${side}`]=shoulder.clone().add(d.normalize().scale(reach));
   // The compact serve wind-up can place a hand almost on its shoulder,
   // folding a full-length adult forearm back through the upper arm.
   if(constraints.human&&distance<.19)p[`hand${side}`]=shoulder.clone().add((distance>.001?d.normalize():torsoForward.clone()).scale(.19));
  }
  // The old compact/feline elbow target can pass through the shoulder/wrist
  // axis after retargeting. A body-relative human pole keeps elbows down and
  // outside the ribcage, with posterior loading rather than a reversed fold.
  let pole=walk?shoulder.clone().add(torsoRight.clone().scale(side==='L'?-.035:.035)).add(new Vec3(0,-.18,0)).add(torsoForward.clone().scale(-.30)):constraints.human?shoulder.clone().add(torsoRight.clone().scale(side==='L'?-.24:.24)).add(new Vec3(0,-.28,0)).add(torsoForward.clone().scale(constraints.posture?-.16:-.16+.34*smooth((Vec3.dot(Vec3.sub(p[`hand${side}`],shoulder),torsoForward)-.04)/.16))):arm(source[`elbow${side}`]).add(forward.clone().scale(.04));
  if(constraints.human&&constraints.readyWeight){const readyPole=shoulder.clone().add(torsoRight.clone().scale(side==='L'?-.12:.12)).add(new Vec3(0,-.55,0)).add(torsoForward.clone().scale(-.24));pole=Vec3.lerp(pole,readyPole,constraints.readyWeight);}
  p[`elbow${side}`]=joint(shoulder,p[`hand${side}`],arms.upperArm,arms.forearm,pole,forward);

 }
 p.racketGrip=p.handR.clone();p.racketCenter=p.handR.clone().add(Vec3.sub(source.racketCenter,source.racketGrip));p.racketHandleTop=p.handR.clone().add(Vec3.sub(source.racketHandleTop,source.racketGrip));
 return p;
}
