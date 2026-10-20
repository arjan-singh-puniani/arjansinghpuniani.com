import {Vec3} from '../rendering/Math3D.js';
import type {SkinnedMesh} from '../rendering/Renderer.js';
import {inspectCharacterAsset,type AssetProvenance,type IntakeResult} from './CharacterAssetIntake.js';
import {BONE,rigFromPose,skinMatrices,type RigPoseLocal} from './CharacterSkin.js';
import type {CharacterPose} from '../entities/Character.js';

let athlete:{parts:IntakeResult['primitives'];bind:RigPoseLocal;images:Map<string,HTMLImageElement>;gripSign:{L:number;R:number}}|undefined;
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
 const images=new Map<string,HTMLImageElement>();
 await Promise.all([...new Set(result.primitives.map(p=>p.albedo).filter((s):s is string=>!!s))].map(async name=>{
  const data=await get(name);if(await digest(data)!==meta.textures[name])throw Error(`Character texture checksum failed: ${name}`);
  const url=URL.createObjectURL(new Blob([data],{type:'image/webp'}));try{const image=new Image();image.src=url;await image.decode();if(image.naturalWidth>2048||image.naturalHeight>2048)throw Error('Character texture exceeds its resolution budget');images.set(name,image);}finally{URL.revokeObjectURL(url);}
 }));
 if(!meta.gripSign||!['L','R'].every(s=>Math.abs(meta.gripSign[s as 'L'|'R'])===1))throw Error('Invalid character grip frame');
 bind.headUp=new Vec3(0,1,0);athlete={parts:result.primitives,bind:bind as unknown as RigPoseLocal,images,gripSign:meta.gripSign};
}

export function authoredAthleteMeshes(p:CharacterPose,position:Vec3,yaw:number,feet:{pitch:number;yaw:number}[],hands:'waist'|'lap'|'natural',time:number,handGrip:[number,number]):SkinnedMesh[]|undefined{
 if(!athlete)return;
 const rig=rigFromPose(p,position,yaw);rig.headUp=new Vec3(0,1,0);rig.headForward=new Vec3(Math.sin(p.headYaw-yaw),0,Math.cos(p.headYaw-yaw));
 for(const side of ['L','R'] as const){rig[`handDirection${side}`]=Vec3.sub(rig[`hand${side}`],rig[`foreArm${side}`]).normalize();rig[`handForward${side}`]=rig.forward;}
 if(hands==='waist'){rig.handDirectionL=new Vec3(0,-1,.1);rig.handDirectionR=new Vec3(0,-1,.1);rig.handForwardL=new Vec3(1,0,0);rig.handForwardR=new Vec3(-1,0,0);}
 if(hands==='lap'){for(const side of ['L','R'] as const){rig[`handDirection${side}`]=new Vec3(0,0,1);rig[`handForward${side}`]=new Vec3(0,1,0);}}
 for(const [i,side] of (['L','R'] as const).entries())if(handGrip[i]>.99){
  const delta=Vec3.sub(p.racketHandleTop,p.racketGrip),c=Math.cos(yaw),s=Math.sin(yaw),axis=new Vec3(c*delta.x-s*delta.z,delta.y,s*delta.x+c*delta.z).normalize().scale(athlete.gripSign[side]);
  let fingers=Vec3.sub(rig[`hand${side}`],rig[`foreArm${side}`]);fingers.sub(axis.clone().scale(Vec3.dot(fingers,axis)));if(fingers.len()<.001)fingers=Vec3.cross(axis,rig.forward);fingers.normalize();rig[`handDirection${side}`]=fingers;rig[`handForward${side}`]=Vec3.cross(axis,fingers).normalize();
 }
 for(const side of ['L','R'] as const)rig[`foreArmForward${side}`]=rig[`handForward${side}`];
 for(const [i,side] of (['L','R'] as const).entries()){const f=feet[i],angle=f.yaw-yaw;rig[`footForward${side}`]=new Vec3(Math.sin(angle)*Math.cos(f.pitch),-Math.sin(f.pitch),Math.cos(angle)*Math.cos(f.pitch));rig[`footUp${side}`]=new Vec3(Math.sin(angle)*Math.sin(f.pitch),Math.cos(f.pitch),Math.cos(angle)*Math.sin(f.pitch));}
 const bones=skinMatrices(rig,athlete.bind),phase=(time+.47)%3.75,blink=phase<.10?1-phase/.10:0;const expression:[number,number,number,number]=[p.face.smile,p.face.mouthOpen,Math.min(1,blink+p.face.squint*.35),p.face.browRaise];
 const sourceRig={bind:athlete.bind,pose:rig};
 return athlete.parts.map(part=>({poseRig:true,rig:sourceRig,expression,handGrip,skin:part.geometry,boneMatrices:bones,position:new Vec3(position.x,0,position.z),rotation:new Vec3(0,yaw,0),color:'#ffffff',material:part.materialSlot==='skin'?'humanSkin':part.materialSlot==='eyes'?'ceramic':['hair','brows','lashes'].includes(part.materialSlot)?'groomedHair':'performanceKnit',diffuse:part.albedo?athlete!.images.get(part.albedo):undefined,alphaCutoff:part.alphaCutoff,doubleSided:part.doubleSided}));
}
