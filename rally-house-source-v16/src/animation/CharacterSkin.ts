import {Mat4, Vec3, identity, scaling, multiply, invertRigid, rigidFrame} from '../rendering/Math3D.js';
import type {SkinGeometry} from '../rendering/Renderer.js';
import type {CharacterPose} from '../entities/Character.js';

export const BONE={pelvis:0,spine:1,chest:2,neck:3,head:4,upperArmL:5,foreArmL:6,handL:7,upperArmR:8,foreArmR:9,handR:10,thighL:11,shinL:12,thighR:13,shinR:14} as const;
export const BONE_COUNT=15;
export type RigJointName=keyof typeof BONE;

export interface RigPoseLocal {
  pelvis:Vec3;spine:Vec3;chest:Vec3;neck:Vec3;head:Vec3;
  upperArmL:Vec3;foreArmL:Vec3;handL:Vec3;upperArmR:Vec3;foreArmR:Vec3;handR:Vec3;
  thighL:Vec3;shinL:Vec3;footL:Vec3;thighR:Vec3;shinR:Vec3;footR:Vec3;
  forward:Vec3;
}

/** The mesh and continuous replay use the same landmark-to-skin mapping. */
export function rigFromPose(p:CharacterPose,root:Vec3,yaw:number,relax=0):RigPoseLocal{
 const local=(v:Vec3)=>{const dx=v.x-root.x,dz=v.z-root.z,s=Math.sin(yaw),c=Math.cos(yaw);return new Vec3(c*dx-s*dz,v.y,s*dx+c*dz);};
 const arm=(v:Vec3,x:number,y:number)=>Vec3.lerp(local(v),new Vec3(x,y+p.baseY-p.knee,-.015),relax);
 const chest=Vec3.lerp(p.shoulderL,p.shoulderR,.5);
 return {pelvis:local(p.pelvisCenter),spine:local(Vec3.lerp(p.pelvisCenter,p.torsoCenter,.62)),chest:local(chest),neck:local(Vec3.lerp(chest,p.head,.58)),head:local(p.head),upperArmL:local(p.shoulderL),foreArmL:arm(p.elbowL,-.397,1.095),handL:arm(p.handL,-.36,.89),upperArmR:local(p.shoulderR),foreArmR:arm(p.elbowR,.397,1.095),handR:arm(p.handR,.36,.89),thighL:local(p.hipL),shinL:local(p.kneeL),footL:local(p.footL),thighR:local(p.hipR),shinR:local(p.kneeR),footR:local(p.footR),forward:new Vec3(Math.sin(p.torsoYaw-yaw),0,Math.cos(p.torsoYaw-yaw))};
}

const bind:RigPoseLocal={
  pelvis:new Vec3(0,.79,0),spine:new Vec3(0,1.05,.01),chest:new Vec3(0,1.34,.015),neck:new Vec3(0,1.56,.01),head:new Vec3(0,1.78,.01),
  upperArmL:new Vec3(-.37,1.34,.015),foreArmL:new Vec3(-.49,1.12,.01),handL:new Vec3(-.50,.94,.01),
  upperArmR:new Vec3(.37,1.34,.015),foreArmR:new Vec3(.49,1.12,.01),handR:new Vec3(.50,.94,.01),
  thighL:new Vec3(-.16,.76,0),shinL:new Vec3(-.17,.43,.04),footL:new Vec3(-.17,.11,.08),
  thighR:new Vec3(.16,.76,0),shinR:new Vec3(.17,.43,.04),footR:new Vec3(.17,.11,.08),forward:new Vec3(0,0,1)
};

type BoneDef={joint:RigJointName;child:RigJointName|'footL'|'footR';};
const defs:BoneDef[]=[
  {joint:'pelvis',child:'spine'},{joint:'spine',child:'chest'},{joint:'chest',child:'neck'},{joint:'neck',child:'head'},{joint:'head',child:'neck'},
  {joint:'upperArmL',child:'foreArmL'},{joint:'foreArmL',child:'handL'},{joint:'handL',child:'foreArmL'},
  {joint:'upperArmR',child:'foreArmR'},{joint:'foreArmR',child:'handR'},{joint:'handR',child:'foreArmR'},
  {joint:'thighL',child:'shinL'},{joint:'shinL',child:'footL'},{joint:'thighR',child:'shinR'},{joint:'shinR',child:'footR'}
];

function frameFor(p:RigPoseLocal,def:BoneDef){const a=p[def.joint] as Vec3,b=p[def.child] as Vec3;let target=b;if(def.joint==='head'||def.joint==='handL'||def.joint==='handR')target=Vec3.add(a,Vec3.sub(a,b));return rigidFrame(a,target,p.forward);}
const bindInv:Mat4[]=defs.map(d=>invertRigid(frameFor(bind,d)));
export function skinMatrices(p:RigPoseLocal){const out=new Float32Array(BONE_COUNT*16);for(let i=0;i<BONE_COUNT;i++){const d=defs[i],length=Vec3.sub(p[d.child],p[d.joint]).len(),rest=Vec3.sub(bind[d.child],bind[d.joint]).len();const m=multiply(multiply(frameFor(p,d),scaling(new Vec3(1,d.joint==='handL'||d.joint==='handR'?1:length/Math.max(.001,rest),1))),bindInv[i]);out.set(m,i*16);}return out;}

interface Build {p:number[];n:number[];bi:number[];bw:number[]}
const build=():Build=>({p:[],n:[],bi:[],bw:[]});
function basis(dir:Vec3){const y=dir.clone().normalize();let z=new Vec3(0,0,1);z.sub(y.clone().scale(Vec3.dot(z,y)));if(z.len()<.1){z=new Vec3(1,0,0);z.sub(y.clone().scale(Vec3.dot(z,y)));}z.normalize();const x=Vec3.cross(y,z).normalize();return {x,y,z};}
function ring(out:Build,c:Vec3,dir:Vec3,rx:number,rz:number,bones:[number,number],weights:[number,number],seg=10){const b=basis(dir);for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,rad=b.x.clone().scale(Math.cos(a)*rx).add(b.z.clone().scale(Math.sin(a)*rz));const v=Vec3.add(c,rad);out.p.push(v.x,v.y,v.z);const nn=rad.clone().normalize();out.n.push(nn.x,nn.y,nn.z);out.bi.push(bones[0],bones[1],0,0);out.bw.push(weights[0],weights[1],0,0);}}
function connect(out:Build,startVertex:number,seg=10){const p:number[]=[],n:number[]=[],bi:number[]=[],bw:number[]=[];for(let i=0;i<seg;i++){const a=startVertex+i,b=startVertex+(i+1)%seg,c=startVertex+seg+(i+1)%seg,d=startVertex+seg+i;for(const idx of [a,c,b,a,d,c]){p.push(...out.p.slice(idx*3,idx*3+3));n.push(...out.n.slice(idx*3,idx*3+3));bi.push(...out.bi.slice(idx*4,idx*4+4));bw.push(...out.bw.slice(idx*4,idx*4+4));}}return {p,n,bi,bw};}
function addSegment(out:Build,a:Vec3,b:Vec3,ra:[number,number],rb:[number,number],boneA:number,boneB:number,seg=10){
  const temp=build();
  // Adjacent segments share the same joint ring plane. Using each segment's
  // own axis left hairline gaps at the waist, knees and elbows after skinning.
  const direction=Vec3.sub(b,a);
  const axis=(bone:number)=>{const d=defs[bone],v=Vec3.sub(bind[d.child],bind[d.joint]).normalize();return Vec3.dot(v,direction)<0?v.scale(-1):v;};
  const axisA=axis(boneA),axisB=axis(boneB),mid=Vec3.lerp(a,b,.5);
  ring(temp,a,axisA,ra[0],ra[1],[boneA,boneB],[1,0],seg);
  ring(temp,mid,Vec3.lerp(axisA,axisB,.5),(ra[0]+rb[0])*.5,(ra[1]+rb[1])*.5,[boneA,boneB],[.5,.5],seg);
  ring(temp,b,axisB,rb[0],rb[1],[boneA,boneB],[0,1],seg);
  const c1=connect(temp,0,seg),c2=connect(temp,seg,seg);out.p.push(...c1.p,...c2.p);out.n.push(...c1.n,...c2.n);out.bi.push(...c1.bi,...c2.bi);out.bw.push(...c1.bw,...c2.bw);
}
function finish(id:string,b:Build):SkinGeometry{return {id,positions:new Float32Array(b.p),normals:new Float32Array(b.n),boneIndices:new Float32Array(b.bi),boneWeights:new Float32Array(b.bw)};}

function radiusAt(points:number[][],t:number){
 let i=0;while(i<points.length-2&&t>points[i+1][0])i++;
 const a=points[i],b=points[i+1],d=b[0]-a[0],u=Math.max(0,Math.min(1,(t-a[0])/d));
 return [1,2].map(k=>{
  const slope=(j:number)=>{if(j===0||j===points.length-1)return 0;const p=points[j-1],q=points[j],r=points[j+1],v=(q[k]-p[k])/(q[0]-p[0]),w=(r[k]-q[k])/(r[0]-q[0]);return v*w<=0?0:2*v*w/(v+w);};
  return (2*u**3-3*u*u+1)*a[k]+(u**3-2*u*u+u)*d*slope(i)+(-2*u**3+3*u*u)*b[k]+(u**3-u*u)*d*slope(i+1);
 });
}
function appendSurface(out:Build,rings:Build,rows:number,seg:number){
 for(let row=0;row<rows;row++){
  const mesh=connect(rings,row*seg,seg);
  for(let i=0;i<mesh.p.length;i+=9){
   const a=new Vec3(...mesh.p.slice(i,i+3)),b=new Vec3(...mesh.p.slice(i+3,i+6)),c=new Vec3(...mesh.p.slice(i+6,i+9));
   if(Vec3.cross(Vec3.sub(b,a),Vec3.sub(c,a)).len()<1e-8)continue;
   for(const offset of [0,3,6]){const vi=(i+offset)/3;out.p.push(...mesh.p.slice(i+offset,i+offset+3));out.n.push(...mesh.n.slice(i+offset,i+offset+3));out.bi.push(...mesh.bi.slice(vi*4,vi*4+4));out.bw.push(...mesh.bw.slice(vi*4,vi*4+4));}
  }
 }
}
// Authored cross sections give limbs a continuous taper and softer joint
// transitions. Endpoint planes still match the authoritative bind joints.
function sculptSegment(out:Build,a:Vec3,b:Vec3,radii:number[][],boneA:number,boneB:number,rows=12,seg=24,jointBlend=false){
 const rings=build(),direction=Vec3.sub(b,a),length=direction.len();
 const axis=(bone:number)=>{const d=defs[bone],v=Vec3.sub(bind[d.child],bind[d.joint]).normalize();return Vec3.dot(v,direction)<0?v.scale(-1):v;};
 const axisA=axis(boneA),axisB=axis(boneB);
 for(let row=0;row<=rows;row++){
  const t=row/rows,center=Vec3.lerp(a,b,t),frame=basis(Vec3.lerp(axisA,axisB,t)),[rx,rz]=radiusAt(radii,t),low=Math.max(0,t-.001),high=Math.min(1,t+.001),before=radiusAt(radii,low),after=radiusAt(radii,high),sx=(after[0]-before[0])/((high-low)*length),sz=(after[1]-before[1])/((high-low)*length);
  for(let i=0;i<seg;i++){
   const angle=i/seg*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle),p=center.clone().add(frame.x.clone().scale(c*rx)).add(frame.z.clone().scale(s*rz));
   const n=frame.x.clone().scale(c/rx).add(frame.z.clone().scale(s/rz)).add(frame.y.clone().scale(-sx*c*c/rx-sz*s*s/rz)).normalize();
   // Broad child-bone influence bows the whole limb away from its centreline.
   // Club human limbs keep their volume until the short joint transition.
   const u=jointBlend?Math.max(0,Math.min(1,(t-.75)/.25)):t,w=jointBlend?u*u*(3-2*u):u;
   rings.p.push(p.x,p.y,p.z);rings.n.push(n.x,n.y,n.z);rings.bi.push(boneA,boneB,0,0);rings.bw.push(1-w,w,0,0);
  }
 }
 appendSurface(out,rings,rows,seg);
}
function handVolume(out:Build,center:Vec3,frame:ReturnType<typeof basis>,radii:Vec3,bone:number,rows=8,seg=16){
 const rings=build();
 for(let row=0;row<=rows;row++){
  const phi=-Math.PI/2+row/rows*Math.PI;
  for(let i=0;i<seg;i++){
   const angle=i/seg*Math.PI*2,x=Math.cos(phi)*Math.cos(angle),y=Math.sin(phi),z=Math.cos(phi)*Math.sin(angle);
   const p=center.clone().add(frame.x.clone().scale(x*radii.x)).add(frame.y.clone().scale(y*radii.y)).add(frame.z.clone().scale(z*radii.z)),n=frame.x.clone().scale(x/radii.x).add(frame.y.clone().scale(y/radii.y)).add(frame.z.clone().scale(z/radii.z)).normalize();
   rings.p.push(p.x,p.y,p.z);rings.n.push(n.x,n.y,n.z);rings.bi.push(bone,0,0,0);rings.bw.push(1,0,0,0);
  }
 }
 appendSurface(out,rings,rows,seg);
}

const top=build();
sculptSegment(top,bind.pelvis,bind.spine,[[0,.28,.20],[.5,.295,.206],[1,.31,.21]],BONE.pelvis,BONE.spine,12,20);
sculptSegment(top,bind.spine,bind.chest,[[0,.31,.21],[.55,.355,.220],[1,.37,.22]],BONE.spine,BONE.chest,12,20);
// Softer boutique-life-sim silhouette for the adult women: a modest waist taper and rounded upper torso.
// This is deliberately subtle; character appeal comes from face, hair, clothing and acting rather than exaggerated anatomy.
const feminineTop=build();
sculptSegment(feminineTop,bind.pelvis,bind.spine,[[0,.305,.215],[.6,.270,.189],[1,.265,.185]],BONE.pelvis,BONE.spine,12,20);
sculptSegment(feminineTop,bind.spine,bind.chest,[[0,.265,.185],[.55,.317,.209],[1,.355,.218]],BONE.spine,BONE.chest,12,20);
// Close the shirt over the shoulders and join sleeves to the moving upper arms.
for(const [garment,width] of [[top,.37],[feminineTop,.355]] as const){
  sculptSegment(garment,bind.chest,new Vec3(0,1.44,.015),[[0,width,.22],[.45,width*.74,.175],[1,.125,.115]],BONE.chest,BONE.chest,8,20);
  for(const side of ['L','R'] as const){const a=bind[`upperArm${side}`],b=Vec3.lerp(a,bind[`foreArm${side}`],.6),bone=BONE[`upperArm${side}`];sculptSegment(garment,a,b,[[0,.13,.125],[.25,.15,.138],[.75,.14,.126],[1,.127,.117]],bone,bone,8,20);shoulderCap(garment,a,Vec3.sub(b,a),bone,.13,.125,20);}
}
const pants=build();
for(const side of ['L','R'] as const){
 sculptSegment(pants,bind[`thigh${side}`],bind[`shin${side}`],[[0,.120,.105],[.3,.125,.108],[.7,.108,.096],[1,.105,.095]],BONE[`thigh${side}`],BONE[`shin${side}`],12,20,true);
 sculptSegment(pants,bind[`shin${side}`],bind[`foot${side}`],[[0,.105,.095],[.3,.108,.094],[.7,.092,.082],[1,.085,.08]],BONE[`shin${side}`],BONE[`shin${side}`],12,20,true);
}
// Tennis separates reveal the moving calves, with a tailored short over the upper leg.
const shorts=build();
for(const side of ['L','R'] as const){const thigh=bind[`thigh${side}`],shin=bind[`shin${side}`];addSegment(shorts,thigh,Vec3.lerp(thigh,shin,.48),[.175,.155],[.16,.145],BONE[`thigh${side}`],BONE[`thigh${side}`],12);}
const skirt=build();
addSegment(skirt,new Vec3(0,.93,0),new Vec3(0,.59,0),[.295,.22],[.43,.34],BONE.pelvis,BONE.pelvis,24);
const arms=build();
for(const side of ['L','R'] as const){
 sculptSegment(arms,bind[`upperArm${side}`],bind[`foreArm${side}`],[[0,.105,.095],[.3,.108,.096],[.7,.094,.083],[1,.09,.08]],BONE[`upperArm${side}`],BONE[`foreArm${side}`],12,20,true);
 sculptSegment(arms,bind[`foreArm${side}`],bind[`hand${side}`],[[0,.09,.08],[.3,.093,.079],[.7,.078,.069],[1,.070,.065]],BONE[`foreArm${side}`],BONE[`hand${side}`],12,20,true);
}

// A continuous, densely sampled clothing surface follows the existing spine
// weights. Its profile is apparel, with no changes to the body or contact rig.
const taylorDress=build();
// The supplied front crop establishes the head-to-waist and upper-hip
// contrast. Keep the anatomical joints fixed and author the costume contour;
// the cropped lower body is not evidence for new limb lengths.
const dressProfile=[[.35,1.05,.35],[.50,.87,.335],[.64,.65,.305],[.79,.43,.257],[1.115,.185,.158],[1.17,.190,.164],[1.24,.225,.184],[1.30,.247,.194],[1.34,.257,.198],[1.38,.235,.176],[1.415,.190,.136],[1.445,.13,.113]];
const dressAt=(y:number)=>radiusAt(dressProfile,y);
function clampUnit(t:number){return Math.max(0,Math.min(1,t));}
const dressRings=build();
for(let row=0;row<=40;row++){
 const y=.35+row/40*1.095,[rx,rz]=dressAt(y),before=dressAt(Math.max(.35,y-.001)),after=dressAt(Math.min(1.445,y+.001)),dy=Math.min(1.445,y+.001)-Math.max(.35,y-.001),sx=(after[0]-before[0])/dy,sz=(after[1]-before[1])/dy;
 const a=y<1.05?BONE.pelvis:BONE.spine,b=y<1.05?BONE.spine:BONE.chest,t=y<1.05?clampUnit((y-.79)/.26):clampUnit((y-1.05)/.29);
 for(let i=0;i<32;i++){const angle=i/32*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle),n=new Vec3(c/rx,-sx*c*c/rx-sz*s*s/rz,s/rz).normalize();dressRings.p.push(c*rx,y,.015*clampUnit((y-.79)/.55)+s*rz);dressRings.n.push(n.x,n.y,n.z);dressRings.bi.push(a,b,0,0);dressRings.bw.push(1-t,t,0,0);}
}
for(let row=0;row<40;row++){const mesh=connect(dressRings,row*32,32);taylorDress.p.push(...mesh.p);taylorDress.n.push(...mesh.n);taylorDress.bi.push(...mesh.bi);taylorDress.bw.push(...mesh.bw);}
// Costume edging samples the same apparel profile and weights. It follows
// shoulder/spine motion instead of floating as a rigid world-space ring.
const taylorNeckline=build(),taylorDressEdging=build();
function dressBand(out:Build,low:number,high:number,rows:number,offset:number){
 const rings=build();
 for(let row=0;row<=rows;row++){
  const y=low+row/rows*(high-low),r=dressAt(y),rx=r[0]+offset,rz=r[1]+offset,before=dressAt(Math.max(.35,y-.001)),after=dressAt(Math.min(1.445,y+.001)),dy=Math.min(1.445,y+.001)-Math.max(.35,y-.001),sx=(after[0]-before[0])/dy,sz=(after[1]-before[1])/dy;
  const a=y<1.05?BONE.pelvis:BONE.spine,b=y<1.05?BONE.spine:BONE.chest,t=y<1.05?clampUnit((y-.79)/.26):clampUnit((y-1.05)/.29);
  for(let i=0;i<32;i++){const angle=i/32*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle),n=new Vec3(c/rx,-sx*c*c/rx-sz*s*s/rz,s/rz).normalize();rings.p.push(c*rx,y,.015*clampUnit((y-.79)/.55)+s*rz);rings.n.push(n.x,n.y,n.z);rings.bi.push(a,b,0,0);rings.bw.push(1-t,t,0,0);}
 }
 for(let row=0;row<rows;row++){const mesh=connect(rings,row*32,32);out.p.push(...mesh.p);out.n.push(...mesh.n);out.bi.push(...mesh.bi);out.bw.push(...mesh.bw);}
}
dressBand(taylorNeckline,1.36,1.435,8,.004);
dressBand(taylorDressEdging,1.36,1.370,2,.007);
dressBand(taylorDressEdging,1.424,1.437,2,.007);
dressBand(taylorDressEdging,.596,.609,1,.004);
// A small embroidered crescent recreates the reference's central gold detail.
// It samples the same surface and weights as the tunic, including in replay.
const taylorTunicMark=build();
const markPoint=(i:number,side:number)=>{const t=i/12,y=1.115-t*.050,x=.011*Math.sin(t*Math.PI)-.004+side*.003,[rx,rz]=dressAt(y),z=.015*clampUnit((y-.79)/.55)+rz*Math.sqrt(1-(x/rx)**2)+.003;return new Vec3(x,y,z);};
for(let i=0;i<12;i++)for(const index of [[i,-1],[i+1,-1],[i+1,1],[i,-1],[i+1,1],[i,1]]){
 const p=markPoint(index[0],index[1]),t=clampUnit((p.y-1.05)/.29);taylorTunicMark.p.push(p.x,p.y,p.z);taylorTunicMark.n.push(0,0,1);taylorTunicMark.bi.push(BONE.spine,BONE.chest,0,0);taylorTunicMark.bw.push(1-t,t,0,0);
}
const taylorArms=build();
function shoulderCap(out:Build,c:Vec3,dir:Vec3,bone:number,rx=.078,rz=.070,seg=24){
 const frame=basis(dir),rings=build();
 for(let row=0;row<=8;row++){const a=row/8*Math.PI/2;for(let i=0;i<seg;i++){const angle=i/seg*Math.PI*2,x=Math.cos(angle)*Math.sin(a),y=-Math.cos(a),z=Math.sin(angle)*Math.sin(a),v=c.clone().add(frame.x.clone().scale(x*rx)).add(frame.y.clone().scale(y*rx)).add(frame.z.clone().scale(z*rz)),n=frame.x.clone().scale(x/rx).add(frame.y.clone().scale(y/rx)).add(frame.z.clone().scale(z/rz)).normalize();rings.p.push(v.x,v.y,v.z);rings.n.push(n.x,n.y,n.z);rings.bi.push(bone,0,0,0);rings.bw.push(1,0,0,0);}}
 appendSurface(out,rings,8,seg);
}
for(const side of ['L','R'] as const){
 const shoulder=bind[`upperArm${side}`],elbow=bind[`foreArm${side}`],hand=bind[`hand${side}`];
 sculptSegment(taylorArms,shoulder,elbow,[[0,.078,.070],[.22,.077,.068],[.55,.067,.060],[1,.058,.054]],BONE[`upperArm${side}`],BONE[`foreArm${side}`]);
 sculptSegment(taylorArms,elbow,hand,[[0,.058,.054],[.3,.061,.054],[.7,.050,.045],[1,.043,.039]],BONE[`foreArm${side}`],BONE[`hand${side}`]);
 shoulderCap(taylorArms,shoulder,Vec3.sub(elbow,shoulder),BONE[`upperArm${side}`]);
}
const taylorBoots=build(),taylorGloves=build(),taylorLegs=build(),taylorHands=build();
for(const side of ['L','R'] as const){
 const shin=bind[`shin${side}`],foot=bind[`foot${side}`],elbow=bind[`foreArm${side}`],hand=bind[`hand${side}`];
 addSegment(taylorLegs,bind[`thigh${side}`],Vec3.lerp(shin,bind[`thigh${side}`],.20),[.088,.080],[.074,.068],BONE[`thigh${side}`],BONE[`shin${side}`],24);
 sculptSegment(taylorBoots,Vec3.lerp(shin,bind[`thigh${side}`],.20),shin,[[0,.082,.074],[.45,.094,.079],[1,.088,.074]],BONE[`shin${side}`],BONE[`shin${side}`],8);
 sculptSegment(taylorBoots,shin,foot,[[0,.088,.074],[.18,.092,.077],[.4,.084,.069],[.72,.065,.055],[1,.050,.045]],BONE[`shin${side}`],BONE[`shin${side}`],16);
 sculptSegment(taylorGloves,Vec3.lerp(elbow,hand,.32),hand,[[0,.067,.061],[.35,.064,.057],[1,.049,.044]],BONE[`foreArm${side}`],BONE[`hand${side}`],8);
 const bone=BONE[`hand${side}`],frame=basis(Vec3.sub(hand,elbow)),sign=side==='L'?-1:1;
 const point=(x:number,y:number,z:number)=>hand.clone().add(frame.x.clone().scale(x)).add(frame.y.clone().scale(y)).add(frame.z.clone().scale(z));
 handVolume(taylorHands,point(0,.017,.003),frame,new Vec3(.062,.073,.043),bone);
 for(const [i,x] of [-.036,-.012,.012,.036].entries()){
  const length=[.027,.033,.032,.025][i],a=point(x,.046,.009),b=point(x,.046+length,.018);
  handVolume(taylorHands,Vec3.lerp(a,b,.5),basis(Vec3.sub(b,a)),new Vec3(.017,Vec3.sub(b,a).len()*.5+.008,.018),bone,6,12);
 }
 const thumbA=point(sign*.042,.006,.027),thumbB=point(sign*.065,.043,.040);
 handVolume(taylorHands,Vec3.lerp(thumbA,thumbB,.5),basis(Vec3.sub(thumbB,thumbA)),new Vec3(.019,Vec3.sub(thumbB,thumbA).len()*.5+.014,.019),bone,6,12);
}
export const CHARACTER_SKIN={taylorTunicMark:finish('taylor-embroidered-crescent-v1',taylorTunicMark),taylorHands:finish('taylor-rounded-reference-hands-v2',taylorHands),taylorNeckline:finish('taylor-indigo-neckline-v3',taylorNeckline),taylorDressEdging:finish('taylor-gold-dress-edging-v4',taylorDressEdging),taylorArms:finish('taylor-sculpted-arms-v3',taylorArms),taylorLegs:finish('taylor-legs-v2',taylorLegs),taylorDress:finish('taylor-reference-gold-tunic-v7',taylorDress),taylorBoots:finish('taylor-sculpted-boots-v2',taylorBoots),taylorGloves:finish('taylor-tapered-gloves-v2',taylorGloves),top:finish('char-top-v1',top),feminineTop:finish('char-top-feminine-v1',feminineTop),pants:finish('char-pants-v1',pants),arms:finish('char-arms-v1',arms),shorts:finish('char-shorts-v1',shorts),skirt:finish('char-skirt-v1',skirt)};
