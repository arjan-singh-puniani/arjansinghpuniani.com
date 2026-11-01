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
export default function DeviceActionOverlay({action, focusRegion, playing, step=0}: {action:DeviceAction;focusRegion:string;playing:boolean;step?:number}) {
  const motion = useRef<Group>(null), invalidate=useThree(s=>s.invalidate);
  const origin=humanRegionLocators[focusRegion];
  useFrame(({clock}) => {
    if (!motion.current || !playing) return;
    const t=(clock.elapsedTime*.65)%1;
    if(action.kind==='joint')motion.current.rotation.z=Math.sin(t*Math.PI*2)*.18;
    else if(action.kind==='bci'){
      const segments=[[-.29,-.19,-.29,.16],[-.18,.17,.13,.12],[.16,.10,.34,-.01]];
      const [x,y,endX,endY]=segments[step];motion.current.position.set(x+(endX-x)*t,y+(endY-y)*t,.12);motion.current.scale.setScalar(.7);
    }else {motion.current.position.set(-.36+t*.72, .08, .12);motion.current.scale.setScalar(.8+Math.sin(t*Math.PI)*.5);}
    invalidate();
  });
  useEffect(()=>{if(motion.current&&action.kind==='bci'){const points=[[-.29,-.18],[-.03,.17],[.32,.01]];motion.current.position.set(points[step][0],points[step][1],.12);}invalidate();},[playing,step,action.kind,invalidate]);
  if(!origin)return null;
  const isEnergy=action.kind==='ultrasound'||action.kind==='coil';
  return <group position={[origin[0]+.66,origin[1],origin[2]+.45]} raycast={()=>null}>
    <Path points={[[-.64,0,-.44],[-.48,0,0]]}/>
    <mesh position={[0,0,-.08]}><boxGeometry args={[.96,.65,.025]}/><meshBasicMaterial color="#102c3b" transparent opacity={.86}/></mesh>
    {action.kind==='bci' ? <>
      <group position={[-.29,-.18,-.01]} scale={[1,.52,.75]}><mesh><sphereGeometry args={[.21,20,12]}/><meshStandardMaterial color="#69b6c3" transparent opacity={.35} wireframe/></mesh></group>
      <mesh position={[-.29,.16,0]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.105,.105,.065,32]}/><meshStandardMaterial color={step===0?'#f3c38a':'#92aab5'} metalness={.7} roughness={.3}/></mesh>
      <mesh position={[-.29,.16,.04]}><torusGeometry args={[.077,.008,8,32]}/><meshBasicMaterial color="#d9f3f4"/></mesh>
      {[-.13,-.08,-.025,.025,.08,.13].map((offset,i)=><group key={i}><Path points={[[-.29,.08,0],[-.29+offset*.45,-.02,.025],[-.29+offset,-.19,.04]]}/><mesh position={[-.29+offset,-.19,.04]}><sphereGeometry args={[.012,8,6]}/><meshBasicMaterial color={step===0?'#ffffff':'#70b7bf'}/></mesh></group>)}
      <Path points={[[-.15,.17,0],[-.06,.22,0],[.04,.22,0],[.13,.13,0]]}/>
      <mesh position={[.28,.03,0]}><boxGeometry args={[.32,.29,.035]}/><meshStandardMaterial color={step===1?'#f3c38a':'#80a9b5'} wireframe/></mesh>
      <mesh position={[.28,.03,.025]}><planeGeometry args={[.27,.23]}/><meshBasicMaterial color="#122d3c"/></mesh>
      <mesh position={[.35,-.01,.055]}><torusGeometry args={[.035,.006,6,24]}/><meshBasicMaterial color={step===2?'#f3c38a':'#70b7bf'}/></mesh>
      <mesh position={[.23,-.04,.06]} rotation={[0,0,.6]}><coneGeometry args={[.02,.065,3]}/><meshBasicMaterial color="#ffffff"/></mesh>
      <Path points={[[.18,-.18,0],[.38,-.18,0]]}/>
    </> : action.kind==='recording'||action.kind==='electrode' ? <>
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
