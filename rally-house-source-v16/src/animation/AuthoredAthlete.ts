import {Vec3,rigidFrame,invertRigid,interpolateRigidFrame,compose,transformPoint,smoothstep} from '../rendering/Math3D.js';
import type {SkinnedMesh,RenderItem,SkinGeometry} from '../rendering/Renderer.js';
import {inspectCharacterAsset,type AssetProvenance,type IntakeResult} from './CharacterAssetIntake.js';
import {BONE,rigFromPose,skinMatrices,type RigPoseLocal} from './CharacterSkin.js';
import type {CharacterPose} from '../entities/Character.js';
import {CAST_DESIGN} from '../content/CastDesign.js';
import {humanHairMeshes} from './TaylorHuman.js';

type CastLook={parts:IntakeResult['primitives'];eyeCenters:Float32Array;skin:string};
const castIds=['coach','mika','nia'] as const;
const castTextures=['cast-skin.webp',...castIds.flatMap(id=>[`${id}-kit.webp`,`${id}-skirt.webp`])];

let athlete:{looks:Map<string,CastLook>;parts:IntakeResult['primitives'];bind:RigPoseLocal;images:Map<string,HTMLImageElement>;gripSign:{L:number;R:number};eyeCenters:Float32Array;neckRatio:number;neckDepth:number;spineRatio:number;spineDepth:number;armLengths:{upperArm:number;forearm:number;wristForearm:number;wristOffsets:{L:Vec3;R:Vec3}}}|undefined;
const root=new URL('../../assets/characters/taylor/',import.meta.url);
const digest=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');

/** Decode and verify the complete character before opening the club. Failed assets use startup recovery. */
export async function loadAuthoredAthlete(){
 const get=async(name:string)=>{const r=await fetch(new URL(name,root));if(!r.ok)throw Error(`Character asset unavailable: ${name}`);const bytes=await r.arrayBuffer();if(bytes.byteLength>8*1024*1024)throw Error('Character asset exceeds its runtime budget');return bytes;};
 const [metadata,bytes]=await Promise.all([get('provenance.json'),get('taylor.glb')]);
 const meta=JSON.parse(new TextDecoder().decode(metadata)) as AssetProvenance&{bind:Record<string,number[]>;textures:Record<string,string>;gripSign:{L:number;R:number}};
 if(await digest(bytes)!==meta.sha256)throw Error('Character geometry checksum failed');
 const result=inspectCharacterAsset(bytes,[],meta),bind:Record<string,Vec3>={};
 for(const key of [...Object.keys(BONE),'forward','handDirectionL','handDirectionR','handForwardL','handForwardR','foreArmForwardL','foreArmForwardR','wristL','wristR']){const value=meta.bind[key];if(!Array.isArray(value)||value.length!==3||!value.every(n=>Number.isFinite(n)&&Math.abs(n)<4))throw Error('Invalid character bind pose');bind[key]=new Vec3(...value);}
 const spineRatio=(bind.spine.y-bind.pelvis.y)/(bind.chest.y-bind.pelvis.y),spineDepth=bind.spine.z-(bind.pelvis.z+(bind.chest.z-bind.pelvis.z)*spineRatio);
 if(!Number.isFinite(spineRatio)||spineRatio<=0||spineRatio>=1||!Number.isFinite(spineDepth)||Math.abs(spineDepth)>.15)throw Error('Invalid character spine registration');
 const neckRatio=(bind.neck.y-bind.chest.y)/(bind.head.y-bind.chest.y),neckDepth=bind.neck.z-(bind.chest.z+(bind.head.z-bind.chest.z)*neckRatio);
 if(!Number.isFinite(neckRatio)||neckRatio<=0||neckRatio>=1||!Number.isFinite(neckDepth)||Math.abs(neckDepth)>.15)throw Error('Invalid character neck registration');
 const armLengths={upperArm:Vec3.sub(bind.upperArmL,bind.foreArmL).len(),forearm:Vec3.sub(bind.foreArmL,bind.handL).len(),wristForearm:Vec3.sub(bind.foreArmL,bind.wristL).len()};
 if(!Object.values(armLengths).every(n=>Number.isFinite(n)&&n>.2&&n<.6))throw Error('Invalid character arm lengths');
 const wristOffsets={} as {L:Vec3;R:Vec3};
 for(const side of ['L','R'] as const){const hand=bind[`hand${side}`],frame=rigidFrame(hand,Vec3.add(hand,bind[`handDirection${side}`]),bind[`handForward${side}`]),offset=transformPoint(invertRigid(frame),bind[`wrist${side}`]);wristOffsets[side]=new Vec3(offset.x,offset.y,offset.z);if(!Number.isFinite(wristOffsets[side].len())||wristOffsets[side].len()>.25)throw Error('Invalid character wrist registration');}
 const images=new Map<string,HTMLImageElement>();
 await Promise.all([...new Set([...result.primitives.map(p=>p.albedo).filter((s):s is string=>!!s),...castTextures])].map(async name=>{
  const data=await get(name);if(await digest(data)!==meta.textures[name])throw Error(`Character texture checksum failed: ${name}`);
  const url=URL.createObjectURL(new Blob([data],{type:'image/webp'}));try{const image=new Image();image.src=url;await image.decode();if(image.naturalWidth>2048||image.naturalHeight>2048)throw Error('Character texture exceeds its resolution budget');images.set(name,image);}finally{URL.revokeObjectURL(url);}
 }));
 if(!meta.gripSign||!['L','R'].every(s=>Math.abs(meta.gripSign[s as 'L'|'R'])===1))throw Error('Invalid character grip frame');
 const eyePart=result.primitives.find(p=>p.materialSlot==='eyes');if(!eyePart)throw Error('Missing character eyes');
 // Rotate each authored eyeball around its own centre before applying the head transform.
 const eyes=eyePart.geometry.positions,eyeCenters=new Float32Array(6);
 for(const side of [0,1]){const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<eyes.length;i+=3){if((eyes[i]<0?0:1)!==side)continue;for(let axis=0;axis<3;axis++){lo[axis]=Math.min(lo[axis],eyes[i+axis]);hi[axis]=Math.max(hi[axis],eyes[i+axis]);}}for(let axis=0;axis<3;axis++)eyeCenters[side*3+axis]=(lo[axis]+hi[axis])/2;}
 if(!eyeCenters.every(Number.isFinite))throw Error('Invalid character eye geometry');
 const looks=new Map<string,CastLook>();
 for(const id of castIds){const {width=1,height=1,jaw=1}=CAST_DESIGN[id].head,center=bind.head;
  const parts=result.primitives.filter(p=>p.materialSlot!=='hair').map(part=>{
   if(part.materialSlot==='shoes')return part;
   let g=part.geometry;
   if(part.materialSlot==='skin'){
    // shortcut: source tail UV islands; re-author this mask if the verified head mesh changes.
    const keep:number[]=[];for(let v=0;v<g.positions.length/3;v+=3){if([v,v+1,v+2].every(i=>g.uvs![i*2]>.5&&g.uvs![i*2+1]>.8&&g.positions[i*3+2]<-.075))continue;keep.push(v,v+1,v+2);}
    if(g.positions.length/3-keep.length!==960)throw Error('Cast hair mask no longer matches the authored head');
    const take=(data:Float32Array,size:number)=>{const out=new Float32Array(keep.length*size);for(let i=0;i<keep.length;i++)out.set(data.subarray(keep[i]*size,(keep[i]+1)*size),i*size);return out;};
    g={...g,positions:take(g.positions,3),normals:take(g.normals,3),boneIndices:take(g.boneIndices,4),boneWeights:take(g.boneWeights,4),uvs:take(g.uvs!,2),morphs:g.morphs?.map(d=>take(d,3)),morphNormals:g.morphNormals?.map(d=>take(d,3))};
   }
   const positions=g.positions.slice(),normals=g.normals.slice(),morphs=g.morphs?.map(d=>d.slice()),morphNormals=g.morphNormals?.map(d=>d.slice());
   for(let v=0;v<positions.length/3;v++){
    const head=[0,1,2,3].some(j=>g.boneIndices[v*4+j]===BONE.head&&g.boneWeights[v*4+j]>.99);
    let core=0;for(let j=0;j<4;j++)if([0,1,2,11,13].includes(g.boneIndices[v*4+j]))core+=g.boneWeights[v*4+j];
    if(!head&&core<.001)continue;
    // shortcut: fitted to this verified body; refit the shaping when replacing the source mesh.
    const fit=(p:Vec3,n:Vec3)=>{
     const gauss=(at:number,spread:number)=>{const d=(p.y-at)/spread,value=Math.exp(-d*d);return [value,-2*d/spread*value];};
     const [cheek,cheekSlope]=gauss(center.y-.10,.09),[waist,waistSlope]=gauss(1.52,.16),[hip,hipSlope]=gauss(1.20,.17);
     const sx=head?width*(1-(1-jaw)*cheek):1-core*(.045*waist+.025*hip),dx=head?-width*(1-jaw)*cheekSlope:-core*(.045*waistSlope+.025*hipSlope),sy=head?height:1;
     const sz=!head&&p.z<0?1-core*.05*hip:1,dz=!head&&p.z<0?-core*.05*hipSlope:0;
     return {p:new Vec3(p.x*sx,head?center.y+(p.y-center.y)*height:p.y,p.z*sz),n:new Vec3(n.x/sx,(n.y-p.x*dx*n.x/sx-p.z*dz*n.z/sz)/sy,n.z/sz).normalize()};
    };
    const i=v*3,p=new Vec3(...g.positions.subarray(i,i+3)),normal=new Vec3(...g.normals.subarray(i,i+3)),base=fit(p,normal);positions.set([base.p.x,base.p.y,base.p.z],i);normals.set([base.n.x,base.n.y,base.n.z],i);
    for(let channel=0;channel<(morphs?.length??0);channel++){
     const delta=g.morphs![channel],dn=g.morphNormals?.[channel];if([0,1,2].every(k=>delta[i+k]===0&&(!dn||dn[i+k]===0)))continue;
     const target=fit(p.clone().add(new Vec3(...delta.subarray(i,i+3))),normal.clone().add(dn?new Vec3(...dn.subarray(i,i+3)):new Vec3()));
     morphs![channel].set([target.p.x-base.p.x,target.p.y-base.p.y,target.p.z-base.p.z],i);
     morphNormals?.[channel].set([target.n.x-base.n.x,target.n.y-base.n.y,target.n.z-base.n.z],i);
    }
   }
   return {...part,geometry:{...g,id:g.id+':'+id,positions,normals,morphs,morphNormals}};
  });
  const centers=eyeCenters.slice(),eyes=parts.find(p=>p.materialSlot==='eyes')!.geometry.positions;
  for(const side of [0,1])for(let axis=0;axis<3;axis++){let lo=Infinity,hi=-Infinity;for(let i=0;i<eyes.length;i+=3)if((eyes[i]<0?0:1)===side){lo=Math.min(lo,eyes[i+axis]);hi=Math.max(hi,eyes[i+axis]);}centers[side*3+axis]=(lo+hi)/2;}
  looks.set(id,{parts,eyeCenters:centers,skin:id==='coach'?'#fff8ed':id==='mika'?'#f5dfcf':'#d7b6a2'});
 }
 bind.headUp=new Vec3(0,1,0);athlete={looks,parts:result.primitives,bind:bind as unknown as RigPoseLocal,images,gripSign:meta.gripSign,eyeCenters,neckRatio,neckDepth,spineRatio,spineDepth,armLengths:{...armLengths,wristOffsets}};
}

export const authoredArmLengths=()=>athlete?.armLengths;

export interface AuthoredHandPose{handDirectionL:Vec3;handDirectionR:Vec3;handForwardL:Vec3;handForwardR:Vec3;}

/** Advance once with the actor; rendering and replay only consume the result. */
export function advanceAuthoredHands(p:CharacterPose,position:Vec3,yaw:number,previous:AuthoredHandPose|undefined,dt:number):AuthoredHandPose|undefined{
 if(!athlete)return;
 const rig=rigFromPose(p,position,yaw),result={} as AuthoredHandPose;
 const racketGrip=[p.handGripL,p.handRacketWeight],origin=new Vec3(),racket=compose(origin,p.racketRot),c=Math.cos(yaw),s=Math.sin(yaw);
 const local=(v:Vec3)=>new Vec3(c*v.x-s*v.z,v.y,s*v.x+c*v.z);
 for(const [i,side] of (['L','R'] as const).entries()){
  const direction=Vec3.sub(rig[`hand${side}`],rig[`foreArm${side}`]),pole=Vec3.cross(Vec3.sub(rig[`foreArm${side}`],rig[`upperArm${side}`]),direction).scale(side==='L'?1:-1);
  let frame=rigidFrame(origin,direction,pole.len()>.001?pole:rig.forward),weight=Math.max(0,1-p.handRestWeight-p.handLapWeight-racketGrip[i]);
  const add=(target:ReturnType<typeof rigidFrame>,amount:number)=>{if(amount>0){frame=interpolateRigidFrame(frame,target,amount/(weight+amount));weight+=amount;}};
  add(rigidFrame(origin,direction,new Vec3(side==='L'?1:-1,0,0)),p.handRestWeight);
  add(rigidFrame(origin,new Vec3(0,0,1),new Vec3(0,1,0)),p.handLapWeight);
  if(racketGrip[i]>.0001){
   // The grip can roll around its shaft to follow the forearm without moving contact.
   const axis=local(Vec3.sub(p.racketHandleTop,p.racketGrip)).normalize().scale(athlete.gripSign[side]),fingers=direction.clone();fingers.sub(axis.clone().scale(Vec3.dot(fingers,axis)));
   if(fingers.len()<.1){const width=transformPoint(racket,new Vec3((side==='L'?1:-1)*Math.cos(.8),0,Math.sin(.8)));const fallback=local(new Vec3(width.x,width.y,width.z));fingers.set(fallback.x,fallback.y,fallback.z);fingers.sub(axis.clone().scale(Vec3.dot(fingers,axis)));}
   fingers.normalize();
   add(rigidFrame(origin,fingers,Vec3.cross(axis,fingers).normalize()),racketGrip[i]);
  }
  if(previous)frame=interpolateRigidFrame(rigidFrame(origin,previous[`handDirection${side}`],previous[`handForward${side}`]),frame,1-Math.exp(-12*dt));
  // Smooth grip roll without letting the palm's width lag behind the moving shaft.
  if(p.shot&&racketGrip[i]>.0001){const axis=local(Vec3.sub(p.racketHandleTop,p.racketGrip)).normalize().scale(athlete.gripSign[side]),fingers=new Vec3(frame[4],frame[5],frame[6]);fingers.sub(axis.clone().scale(Vec3.dot(fingers,axis)));if(fingers.len()>.001)frame=interpolateRigidFrame(frame,rigidFrame(origin,fingers.normalize(),Vec3.cross(axis,fingers).normalize()),racketGrip[i]);}
  result[`handDirection${side}`]=new Vec3(frame[4],frame[5],frame[6]);result[`handForward${side}`]=new Vec3(frame[8],frame[9],frame[10]);
 }
 return result;
}

export function authoredAthleteMeshes(p:CharacterPose,position:Vec3,yaw:number,feet:{pitch:number;yaw:number}[],time:number,identity='taylor'):RenderItem[]|undefined{
 if(!athlete)return;
 const rig=rigFromPose(p,position,yaw);
 // The compact rig's internal ratios distort this authored torso; retain its source landmarks.
 rig.spine=Vec3.lerp(rig.pelvis,rig.chest,athlete.spineRatio).add(rig.forward.clone().scale(athlete.spineDepth));
 rig.neck=Vec3.lerp(rig.chest,rig.head,athlete.neckRatio).add(rig.forward.clone().scale(athlete.neckDepth));rig.headUp=new Vec3(0,1,0);rig.headForward=new Vec3(Math.sin(p.headYaw-yaw),0,Math.cos(p.headYaw-yaw));
 const hands=p.handDirectionL&&p.handDirectionR&&p.handForwardL&&p.handForwardR?p as AuthoredHandPose:advanceAuthoredHands(p,position,yaw,undefined,0)!;for(const side of ['L','R'] as const){rig[`handDirection${side}`]=hands[`handDirection${side}`];rig[`handForward${side}`]=hands[`handForward${side}`];rig[`foreArmForward${side}`]=hands[`handForward${side}`];}
 const handGrip:[number,number]=[p.handGripL,p.handGripR];
 for(const [i,side] of (['L','R'] as const).entries()){const f=feet[i],angle=f.yaw-yaw;rig[`footForward${side}`]=new Vec3(Math.sin(angle)*Math.cos(f.pitch),-Math.sin(f.pitch),Math.cos(angle)*Math.cos(f.pitch));rig[`footUp${side}`]=new Vec3(Math.sin(angle)*Math.sin(f.pitch),Math.cos(f.pitch),Math.cos(angle)*Math.sin(f.pitch));}
 const bones=skinMatrices(rig,athlete.bind),phase=(time+.47)%3.75,blink=phase<.05?smoothstep(0,.05,phase):1-smoothstep(.05,.18,phase);const expression:[number,number,number,number]=[p.face.smile,p.face.mouthOpen,Math.min(1,blink+p.face.squint*.35),p.face.browRaise];
 // Thigh pitch alone also occurs during a serve; retain the seated transition gate.
 // shortcut: seated/crouched correctives; use cloth simulation for unrestricted contact folds.
 const thighPitch=(side:'L'|'R')=>{const axis=Vec3.sub(rig[`shin${side}`],rig[`thigh${side}`]);return axis.z/Math.max(axis.len(),.00001);};
 const seated=p.seatedWeight??0,crouch=(1-seated)*smoothstep(.08,.34,athlete.bind.pelvis.y-rig.pelvis.y);
 const drape:[number,number,number,number]=[seated*smoothstep(.5,.99,(thighPitch('L')+thighPitch('R'))/2),crouch,0,0];
 const sourceRig={bind:athlete.bind,pose:rig};
 const look=athlete.looks.get(identity),parts=look?.parts??athlete.parts;
 const meshes:SkinnedMesh[]=parts.map(part=>({poseRig:true,eyeCenters:part.materialSlot==='eyes'?(look?.eyeCenters??athlete!.eyeCenters):undefined,eyeYaw:part.materialSlot==='eyes'?p.eyeYaw??0:0,skirt:part.materialSlot==='skirt',rig:sourceRig,expression:part.materialSlot==='skirt'?drape:expression,handGrip,skin:part.geometry,boneMatrices:bones,position:new Vec3(position.x,0,position.z),rotation:new Vec3(0,yaw,0),color:part.materialSlot==='skin'&&look?look.skin:part.materialSlot==='hair'?'#65584f':'#ffffff',material:part.materialSlot==='skin'?'humanSkin':part.materialSlot==='eyes'?'iris':part.materialSlot==='teeth'?'ceramic':['hair','brows','lashes'].includes(part.materialSlot)?'groomedHair':'performanceKnit',diffuse:part.albedo?athlete!.images.get(look?(part.materialSlot==='skin'||part.materialSlot==='eyes'?'cast-skin.webp':part.materialSlot==='kit'?`${identity}-kit.webp`:part.materialSlot==='skirt'?`${identity}-skirt.webp`:part.albedo):part.albedo):undefined,alphaCutoff:part.alphaCutoff,doubleSided:part.doubleSided}));
 return look?[...meshes,...humanHairMeshes(p.head,p.headYaw,0,CAST_DESIGN[identity].head)]:meshes;
}
