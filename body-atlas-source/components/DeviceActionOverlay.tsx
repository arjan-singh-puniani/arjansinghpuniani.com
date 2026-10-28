"use client";
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Group, Line as ThreeLine, LineBasicMaterial, Vector3 } from 'three';
import type { DeviceAction } from '@/lib/device-action';
import { humanRegionLocators } from '@/lib/annotations';

function Path({ points }: { points: [number, number, number][] }) {
  const line = useMemo(() => new ThreeLine(new BufferGeometry().setFromPoints(points.map(p => new Vector3(...p))), new LineBasicMaterial({color:'#9af5ed',transparent:true,opacity:.85})), [points]);
  useEffect(() => () => {line.geometry.dispose();(line.material as LineBasicMaterial).dispose();}, [line]);
  return <primitive object={line} raycast={() => null}/>;
}
export default function DeviceActionOverlay({action, focusRegion, playing}: {action:DeviceAction;focusRegion:string;playing:boolean}) {
  const motion = useRef<Group>(null), invalidate=useThree(s=>s.invalidate);
  const origin=humanRegionLocators[focusRegion];
  useFrame(({clock}) => {
    if (!motion.current || !playing) return;
    const t=(clock.elapsedTime*.65)%1;
    if(action.kind==='joint')motion.current.rotation.z=Math.sin(t*Math.PI*2)*.18;
    else {motion.current.position.set(-.36+t*.72, .08, .12);motion.current.scale.setScalar(.8+Math.sin(t*Math.PI)*.5);}
    invalidate();
  });
  useEffect(()=>{invalidate();},[playing,invalidate]);
  if(!origin)return null;
  const isEnergy=action.kind==='ultrasound'||action.kind==='coil';
  return <group position={[origin[0]+.66,origin[1],origin[2]+.45]} raycast={()=>null}>
    <Path points={[[-.64,0,-.44],[-.48,0,0]]}/>
    <mesh position={[0,0,-.08]}><boxGeometry args={[.96,.65,.025]}/><meshBasicMaterial color="#102c3b" transparent opacity={.86}/></mesh>
    {action.kind==='recording'||action.kind==='electrode' ? <>
      <mesh position={[-.3,.05,0]}><boxGeometry args={[.18,.25,.07]}/><meshStandardMaterial color="#e6b078" metalness={.5} roughness={.25}/></mesh>
      <Path points={[[-.2,.1,0],[-.06,.1,0],[.05,.18,0],[.24,.18,0],[.24,-.15,0]]}/>
      {[0,1,2,3].map(i=><mesh key={i} position={[.24,-.11+i*.065,0]}><sphereGeometry args={[.025,12,8]}/><meshBasicMaterial color="#9af5ed"/></mesh>)}
      {action.kind==='recording'&&<Path points={[[-.3,-.16,0],[-.2,-.16,0],[-.16,-.1,0],[-.12,-.22,0],[-.08,-.16,0],[.06,-.16,0]]}/>}
    </> : action.kind==='valve' ? <>
      <mesh rotation={[Math.PI/2,0,Math.PI/2]}><cylinderGeometry args={[.18,.18,.34,24,1,true]}/><meshStandardMaterial color="#e6b078" wireframe transparent opacity={.9}/></mesh>
      {[0,1,2].map(i=><mesh key={i} rotation={[0,0,i*Math.PI*2/3]}><coneGeometry args={[.10,.19,3]}/><meshStandardMaterial color="#9af5ed" transparent opacity={.6}/></mesh>)}
      <Path points={[[-.4,0,.1],[.4,0,.1]]}/>
    </> : action.kind==='pump' ? <>
      <mesh><cylinderGeometry args={[.15,.15,.38,20]}/><meshStandardMaterial color="#e6b078" metalness={.6} roughness={.3}/></mesh>
      <Path points={[[-.4,0,0],[-.15,0,0],[0,.2,0],[.25,.2,0],[.4,0,0]]}/>
    </> : action.kind==='joint' ? <>
      <mesh position={[0,.12,0]}><sphereGeometry args={[.19,24,16,0,Math.PI*2,0,Math.PI*.62]}/><meshStandardMaterial color="#e6b078" metalness={.6} side={2}/></mesh>
      <group ref={motion}><mesh position={[0,-.02,0]}><sphereGeometry args={[.14,24,16]}/><meshStandardMaterial color="#9af5ed" metalness={.4}/></mesh>
      <mesh position={[0,-.21,0]}><cylinderGeometry args={[.05,.06,.26,12]}/><meshStandardMaterial color="#9af5ed"/></mesh></group>
    </> : isEnergy ? <>
      <mesh position={[-.27,.04,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.18,.035,10,32]}/><meshStandardMaterial color="#e6b078" metalness={.5}/></mesh>
      {[-.16,0,.16].map(y=><Path key={y} points={[[-.23,y,0],[.27,0,0]]}/>)}
      <mesh position={[.27,0,0]}><sphereGeometry args={[.055,16,12]}/><meshBasicMaterial color="#9af5ed"/></mesh>
    </> : null}
    {action.kind!=='joint'&&<group ref={motion}><mesh><sphereGeometry args={[.035,12,8]}/><meshBasicMaterial color="#ffffff"/></mesh></group>}
  </group>;
}
