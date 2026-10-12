import {Vec3,clamp} from '../rendering/Math3D.js';
import type {CharacterPose} from '../entities/Character.js';

export const TAYLOR_BODY={pelvisHeight:1.245,torsoScale:1.20,headScale:.62,upperArm:.425,forearm:.415,thigh:.56,shin:.55} as const;
interface Constraints {sitting:boolean;folded:boolean;rightWorld:number;leftWorld:number;human?:boolean;}
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
 const p={...source,face:{...source.face}};for(const [key,v] of Object.entries(source))if(v instanceof Vec3)(p as unknown as Record<string,unknown>)[key]=v.clone();
 const oldShoulder=Vec3.lerp(source.shoulderL,source.shoulderR,.5),pelvisY=constraints.sitting?source.pelvisCenter.y:TAYLOR_BODY.pelvisHeight+(source.pelvisCenter.y-.79)*1.5;
 const horizontal=(v:Vec3,sx:number,sz=1)=>{const dx=v.x-root.x,dz=v.z-root.z,s=Math.sin(yaw),c=Math.cos(yaw),x=(c*dx-s*dz)*sx,z=(s*dx+c*dz)*sz;return new Vec3(root.x+c*x+s*z,v.y,root.z-s*x+c*z);};
 const torso=(v:Vec3)=>{const out=horizontal(v,.80);out.y=pelvisY+(v.y-source.pelvisCenter.y)*TAYLOR_BODY.torsoScale;return out;};
 p.pelvisCenter=torso(source.pelvisCenter);p.torsoCenter=torso(source.torsoCenter);p.shoulderL=torso(source.shoulderL);p.shoulderR=torso(source.shoulderR);
 if(constraints.folded){const right=new Vec3(Math.cos(p.torsoYaw),0,-Math.sin(p.torsoYaw)),center=Vec3.lerp(p.shoulderL,p.shoulderR,.5);p.shoulderL=center.clone().add(right.clone().scale(-.284));p.shoulderR=center.clone().add(right.scale(.284));}
 const shoulder=Vec3.lerp(p.shoulderL,p.shoulderR,.5);
 p.head=horizontal(source.head,.80);p.head.y=shoulder.y+(source.head.y-oldShoulder.y)*.82-(constraints.human?.065:0);
 for(const side of ['L','R'] as const){const key=`hip${side}` as const;p[key]=horizontal(source[key],.90);p[key].y=pelvisY+(source[key].y-source.pelvisCenter.y)*1.20;}
 const arm=(v:Vec3)=>{const out=horizontal(v,.78),dy=v.y-oldShoulder.y,scale=2.30-1.10*smooth((dy+.10)/.25);out.y=shoulder.y+dy*scale;return out;};
 p.handL=Vec3.lerp(arm(source.handL),source.handL,constraints.leftWorld);p.handR=Vec3.lerp(arm(source.handR),source.handR,constraints.rightWorld);

 const bodyKeys=['pelvisCenter','torsoCenter','shoulderL','shoulderR','head','hipL','hipR'] as const;
 const lower=(dy:number)=>{for(const key of bodyKeys)p[key].y-=dy;};
 // A long step lowers the pelvis to respect leg length while a planted foot
 // remains a world-space anchor. Sitting uses the actual seat height.
 if(!constraints.sitting){
  let drop=0;for(const side of ['L','R'] as const){const hip=p[`hip${side}`],foot=p[`foot${side}`],h=Math.hypot(hip.x-foot.x,hip.z-foot.z),vertical=Math.sqrt(Math.max(.01,(TAYLOR_BODY.thigh+TAYLOR_BODY.shin-.001)**2-h*h));drop=Math.max(drop,hip.y-foot.y-vertical);}lower(Math.max(0,drop));
 }
 // A constrained low ball or prop is reached with the body, rather than by
 // stretching a forearm through the floor. The hand keeps ownership of contact.
 for(const [side,weight] of [['R',constraints.rightWorld],['L',constraints.leftWorld]] as const){
  if(weight<.001)continue;const hand=p[`hand${side}`],start=p[`shoulder${side}`],reach=TAYLOR_BODY.upperArm+TAYLOR_BODY.forearm-.003,delta=Vec3.sub(hand,start);
  if(delta.len()<=reach)continue;
  const horizontalLength=Math.hypot(delta.x,delta.z),vertical=Math.sqrt(Math.max(.04,reach*reach-horizontalLength*horizontalLength));
  const drop=clamp(start.y-hand.y-vertical,0,.76);lower(drop);
  const remaining=Vec3.sub(hand,p[`shoulder${side}`]),distance=remaining.len();
  if(distance>reach){const hinge=remaining.scale(Math.min(.65,(distance-reach+.008))/distance);p.shoulderL.add(hinge);p.shoulderR.add(hinge);p.head.add(hinge);p.torsoCenter.add(hinge.clone().scale(.6));}
 }
 const forward=new Vec3(Math.sin(yaw),0,Math.cos(yaw));
 for(const side of ['L','R'] as const){
  const shoulder=p[`shoulder${side}`],hand=p[`hand${side}`],world=side==='L'?constraints.leftWorld:constraints.rightWorld;
  if(world<.999){const d=Vec3.sub(hand,shoulder),reach=TAYLOR_BODY.upperArm+TAYLOR_BODY.forearm-.003;if(d.len()>reach)p[`hand${side}`]=shoulder.clone().add(d.normalize().scale(reach));}
  const pole=arm(source[`elbow${side}`]).add(forward.clone().scale(.04));p[`elbow${side}`]=joint(shoulder,p[`hand${side}`],TAYLOR_BODY.upperArm,TAYLOR_BODY.forearm,pole,forward);
  const hip=p[`hip${side}`],foot=p[`foot${side}`],kneePole=Vec3.lerp(hip,foot,.5).add(forward.clone().scale(.5));p[`knee${side}`]=joint(hip,foot,TAYLOR_BODY.thigh,TAYLOR_BODY.shin,kneePole,forward);
 }
 p.racketGrip=p.handR.clone();p.racketCenter=p.handR.clone().add(Vec3.sub(source.racketCenter,source.racketGrip));p.racketHandleTop=p.handR.clone().add(Vec3.sub(source.racketHandleTop,source.racketGrip));
 return p;
}
