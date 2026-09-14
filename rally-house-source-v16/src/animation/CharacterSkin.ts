import {Mat4, Vec3, identity, scaling, multiply, invertRigid, rigidFrame} from '../rendering/Math3D.js';
import type {SkinGeometry} from '../rendering/Renderer.js';

export const BONE={pelvis:0,spine:1,chest:2,neck:3,head:4,upperArmL:5,foreArmL:6,handL:7,upperArmR:8,foreArmR:9,handR:10,thighL:11,shinL:12,thighR:13,shinR:14} as const;
export const BONE_COUNT=15;
export type RigJointName=keyof typeof BONE;

export interface RigPoseLocal {
  pelvis:Vec3;spine:Vec3;chest:Vec3;neck:Vec3;head:Vec3;
  upperArmL:Vec3;foreArmL:Vec3;handL:Vec3;upperArmR:Vec3;foreArmR:Vec3;handR:Vec3;
  thighL:Vec3;shinL:Vec3;footL:Vec3;thighR:Vec3;shinR:Vec3;footR:Vec3;
  forward:Vec3;
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
export function skinMatrices(p:RigPoseLocal){const out=new Float32Array(BONE_COUNT*16);for(let i=0;i<BONE_COUNT;i++){const d=defs[i],length=Vec3.sub(p[d.child],p[d.joint]).len(),rest=Vec3.sub(bind[d.child],bind[d.joint]).len();const m=multiply(multiply(frameFor(p,d),scaling(new Vec3(1,length/Math.max(.001,rest),1))),bindInv[i]);out.set(m,i*16);}return out;}

interface Build {p:number[];n:number[];bi:number[];bw:number[]}
const build=():Build=>({p:[],n:[],bi:[],bw:[]});
function basis(dir:Vec3){const y=dir.clone().normalize();let z=new Vec3(0,0,1);z.sub(y.clone().scale(Vec3.dot(z,y)));if(z.len()<.1){z=new Vec3(1,0,0);z.sub(y.clone().scale(Vec3.dot(z,y)));}z.normalize();const x=Vec3.cross(y,z).normalize();return {x,y,z};}
function ring(out:Build,c:Vec3,dir:Vec3,rx:number,rz:number,bones:[number,number],weights:[number,number],seg=10){const b=basis(dir);for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,rad=b.x.clone().scale(Math.cos(a)*rx).add(b.z.clone().scale(Math.sin(a)*rz));const v=Vec3.add(c,rad);out.p.push(v.x,v.y,v.z);const nn=rad.clone().normalize();out.n.push(nn.x,nn.y,nn.z);out.bi.push(bones[0],bones[1],0,0);out.bw.push(weights[0],weights[1],0,0);}}
function connect(out:Build,startVertex:number,seg=10){const p:number[]=[],n:number[]=[],bi:number[]=[],bw:number[]=[];for(let i=0;i<seg;i++){const a=startVertex+i,b=startVertex+(i+1)%seg,c=startVertex+seg+(i+1)%seg,d=startVertex+seg+i;for(const idx of [a,c,b,a,d,c]){p.push(...out.p.slice(idx*3,idx*3+3));n.push(...out.n.slice(idx*3,idx*3+3));bi.push(...out.bi.slice(idx*4,idx*4+4));bw.push(...out.bw.slice(idx*4,idx*4+4));}}return {p,n,bi,bw};}
function addSegment(out:Build,a:Vec3,b:Vec3,ra:[number,number],rb:[number,number],boneA:number,boneB:number,seg=10){const temp=build(),dir=Vec3.sub(b,a);ring(temp,a,dir,ra[0],ra[1],[boneA,boneB],[1,0],seg);const mid=Vec3.lerp(a,b,.5);ring(temp,mid,dir,(ra[0]+rb[0])*.5,(ra[1]+rb[1])*.5,[boneA,boneB],[.5,.5],seg);ring(temp,b,dir,rb[0],rb[1],[boneA,boneB],[0,1],seg);const c1=connect(temp,0,seg),c2=connect(temp,seg,seg);out.p.push(...c1.p,...c2.p);out.n.push(...c1.n,...c2.n);out.bi.push(...c1.bi,...c2.bi);out.bw.push(...c1.bw,...c2.bw);}
function finish(id:string,b:Build):SkinGeometry{return {id,positions:new Float32Array(b.p),normals:new Float32Array(b.n),boneIndices:new Float32Array(b.bi),boneWeights:new Float32Array(b.bw)};}

const top=build();
addSegment(top,bind.pelvis,bind.spine,[.28,.20],[.31,.21],BONE.pelvis,BONE.spine,12);
addSegment(top,bind.spine,bind.chest,[.31,.21],[.37,.22],BONE.spine,BONE.chest,12);
// Softer boutique-life-sim silhouette for the adult women: a modest waist taper and rounded upper torso.
// This is deliberately subtle; character appeal comes from face, hair, clothing and acting rather than exaggerated anatomy.
const feminineTop=build();
addSegment(feminineTop,bind.pelvis,bind.spine,[.305,.215],[.265,.185],BONE.pelvis,BONE.spine,12);
addSegment(feminineTop,bind.spine,bind.chest,[.265,.185],[.355,.218],BONE.spine,BONE.chest,12);
// Close the shirt over the shoulders and join sleeves to the moving upper arms.
for(const [garment,width] of [[top,.37],[feminineTop,.355]] as const){
  addSegment(garment,bind.chest,new Vec3(0,1.44,.015),[width,.22],[.125,.115],BONE.chest,BONE.chest,12);
  for(const side of ['L','R'] as const){const a=bind[`upperArm${side}`],b=Vec3.lerp(a,bind[`foreArm${side}`],.6),bone=BONE[`upperArm${side}`];addSegment(garment,a,b,[.155,.145],[.145,.13],bone,bone,10);}
}
const pants=build();
addSegment(pants,bind.thighL,bind.shinL,[.155,.14],[.13,.12],BONE.thighL,BONE.shinL,10);addSegment(pants,bind.shinL,bind.footL,[.13,.12],[.105,.10],BONE.shinL,BONE.shinL,10);
addSegment(pants,bind.thighR,bind.shinR,[.155,.14],[.13,.12],BONE.thighR,BONE.shinR,10);addSegment(pants,bind.shinR,bind.footR,[.13,.12],[.105,.10],BONE.shinR,BONE.shinR,10);
const arms=build();
addSegment(arms,bind.upperArmL,bind.foreArmL,[.14,.13],[.12,.105],BONE.upperArmL,BONE.foreArmL,10);addSegment(arms,bind.foreArmL,bind.handL,[.12,.105],[.095,.085],BONE.foreArmL,BONE.handL,10);
addSegment(arms,bind.upperArmR,bind.foreArmR,[.14,.13],[.12,.105],BONE.upperArmR,BONE.foreArmR,10);addSegment(arms,bind.foreArmR,bind.handR,[.12,.105],[.095,.085],BONE.foreArmR,BONE.handR,10);

export const CHARACTER_SKIN={top:finish('char-top-v1',top),feminineTop:finish('char-top-feminine-v1',feminineTop),pants:finish('char-pants-v1',pants),arms:finish('char-arms-v1',arms)};
