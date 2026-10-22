"use client";
import { atlasPath } from "@/lib/deployment";
import {useGLTF} from '@react-three/drei';
import {useThree,ThreeEvent} from '@react-three/fiber';
import {Box3,Group,Mesh,MeshStandardMaterial,Vector3,Color} from 'three';
import {useEffect,useMemo} from 'react';

const regionByName:Record<string,string>={VH_M_heart:'BODY:heart',VH_M_heart_valve:'BODY:heart-valves',VH_M_lungs:'BODY:lung',VH_M_liver:'BODY:liver',VH_M_kidney_capsule_L:'BODY:kidney',VH_M_kidney_capsule_R:'BODY:kidney',VH_M_pancreas:'BODY:pancreas',VH_M_small_intestine:'BODY:intestine',VH_M_colon:'BODY:colon',VH_M_urinary_bladder:'BODY:bladder',VH_M_prostate_gland:'BODY:prostate',VH_M_eyes:'BODY:eye',VH_M_lower_limb:'BODY:knee',VH_M_pelvis:'BODY:hip',VH_M_vertebrae:'BODY:vertebral',VH_M_aorta:'BODY:aorta',VH_M_urethra:'BODY:urethra',VH_M_larynx:'BODY:airway'};
export default function WholeBodyOrgans({region,activeRegions,onSelect,onHover,onReady}:{region:string;activeRegions:string[];onSelect:(id:string)=>void;onHover:(name:string)=>void;onReady:()=>void}){
 const gltf=useGLTF(atlasPath("/anatomy/organs.glb")),body=useGLTF(atlasPath("/anatomy/body.glb"));
 const invalidate=useThree(s=>s.invalidate);
 const model=useMemo(()=>{
  const root=gltf.scene.clone(true),box=new Box3().setFromObject(body.scene),group=new Group();
  root.position.sub(box.getCenter(new Vector3()));group.add(root);group.scale.setScalar(6/box.getSize(new Vector3()).y);
  root.traverse(o=>{if(o instanceof Mesh){let parent=o as typeof o|null;while(parent){if(regionByName[parent.name]){o.userData={...o.userData,atlasRegion:regionByName[parent.name]};break;}parent=parent.parent as typeof o|null;}o.material=new MeshStandardMaterial({color:'#78aab7',transparent:true,opacity:.22,depthWrite:false,roughness:.8,metalness:0});}});return group;
 },[gltf.scene,body.scene]);
 useEffect(()=>{model.traverse(o=>{if(o instanceof Mesh){const id=o.userData.atlasRegion;const active=[region,...activeRegions].some(r=>r===id||(id==='BODY:heart'&&['BODY:coronary','BODY:heart-valves'].includes(r))||(id==='BODY:eye'&&['BODY:cornea','BODY:retina','BODY:lens'].includes(r)));const m=o.material as MeshStandardMaterial;m.color=new Color(active?'#e5b17c':'#78aab7');m.opacity=active?.7:.20;m.needsUpdate=true;}});invalidate();onReady();},[model,region,activeRegions,onReady,invalidate]);
 useEffect(()=>()=>model.traverse(o=>{if(o instanceof Mesh)(o.material as MeshStandardMaterial).dispose();}),[model]);
 return <primitive object={model} onClick={(e:ThreeEvent<MouseEvent>)=>{if(e.delta>4)return;if(e.object.userData.atlasRegion){e.stopPropagation();onSelect(e.object.userData.atlasRegion);}}} onPointerMove={(e:ThreeEvent<PointerEvent>)=>{e.stopPropagation();onHover(e.object.name.replace(/^VH_M_/,'').replace(/_/g,' '));}} onPointerOut={()=>onHover('')}/>;
}
