"use client";
import { atlasPath } from "@/lib/deployment";
import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import {
  Box3,
  DoubleSide,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Color,
  ShaderMaterial,
  Vector3,
  Vector4,
} from "three";
import {
  Component,
  ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import WholeBodyOrgans from "./WholeBodyOrgans";
import AnnotationProjection from "./AnnotationProjection";
import { humanRegionLocators, type LabelProjection } from "@/lib/annotations";
import DeviceActionOverlay from './DeviceActionOverlay';
import type { DeviceAction } from '@/lib/device-action';

const vertex = `varying vec3 p; varying vec3 n; varying vec3 eye;
void main(){p=position;  n=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); eye=-mv.xyz; gl_Position=projectionMatrix*mv;}`;
const fragment = `varying vec3 p; varying vec3 n; varying vec3 eye;
uniform float surface; uniform float band; uniform float centerY; uniform float halfHeight;
uniform vec4 regions; uniform float portrait;
void main(){
 if(portrait>.5 && p.y<.14) discard;
 vec3 cell=p*vec3(35.,38.,28.); vec3 d=max(fwidth(cell),vec3(.001));
 vec3 line=abs(fract(cell-.5)-.5)/d;
 float grid=1.-min(min(line.x,line.y),line.z); grid=clamp(grid,0.,1.);
 float rim=pow(1.-abs(dot(normalize(n),normalize(eye))),2.);
 vec3 normal=gl_FrontFacing?normalize(n):-normalize(n);
 float light=.28+.72*max(dot(normal,normalize(vec3(-.8,.8,.65))),0.);
 float area=band*exp(-pow((p.y-centerY)/halfHeight,4.));
 area=max(area,regions.x*exp(-pow((p.y-.78)/.16,4.)));
 area=max(area,regions.y*exp(-pow((p.y-.60)/.10,4.)));
 area=max(area,regions.z*exp(-pow((p.y-.32)/.20,4.)));
 area=max(area,regions.w*exp(-pow((p.y-.08)/.40,4.)));
 vec3 ink=mix(vec3(.42,.68,.72),vec3(.93,.65,.38),area*.8);
 ink*=.35+.85*light;
 float alpha=.025+grid*.23+rim*.45+area*.12+light*.055;
 alpha=mix(alpha,min(.96,.40+light*.45+rim*.15+area*.07),surface);
 gl_FragColor=vec4(ink+portrait*grid*.025,portrait>.5?1.:alpha);
}`;
const pins = [
  {
    id: "UBERON:0000955",
    name: "Brain",
    position: [0.12, 2.58, 0.25],
    side: "right",
  },
  {
    id: "UBERON:0001844",
    name: "Cochlea",
    position: [-0.3, 2.46, 0.15],
    side: "left",
  },
  {
    id: "UBERON:0001759",
    name: "Vagus nerve",
    position: [-0.2, 1.94, 0.18],
    side: "left",
  },
  {
    id: "BODY:chest-wall",
    name: "Chest implants",
    position: [0.4, 1.17, 0.2],
    side: "right",
  },
  {
    id: "UBERON:0002240",
    name: "Spinal cord",
    position: [-0.1, 0.45, -0.2],
    side: "left",
  },
] as const;
class Boundary extends Component<
  { children: ReactNode; fail: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.fail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function Body({
  portrait,
  adapted,
  region,
  activeRegions,
  surface,
  onSelect,
  onHover,
  onReady,
}: {
  portrait: boolean;
  adapted: boolean;
  region: string;
  activeRegions: string[];
  surface: boolean;
  onSelect: (id: string) => void;
  onHover: (label: string) => void;
  onReady: () => void;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const gltf = useGLTF(atlasPath(adapted ? "/anatomy/contour.glb" : "/anatomy/body.glb"));
  const reference = useGLTF(atlasPath("/anatomy/body.glb"));
  const { model, material, bounds } = useMemo(() => {
    const model = new Group(),
      root = gltf.scene.clone(true),
      box = new Box3().setFromObject(reference.scene),
      size = box.getSize(new Vector3()),
      center = box.getCenter(new Vector3());
    root.position.sub(center);
    model.add(root);
    model.scale.setScalar(6 / size.y);
    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      side: portrait ? DoubleSide : FrontSide,
      transparent: !portrait,
      depthWrite: portrait,
      uniforms: {
        portrait: { value: portrait ? 1 : 0 },
        surface: { value: 0 },
        band: { value: 0 },
        centerY: { value: 0 },
        halfHeight: { value: 0.15 },
        regions: { value: new Vector4() },
      },
    });
    root.traverse((o) => {
      if (o instanceof Mesh) o.material = material;
    });
    return { model, material, bounds: box };
  }, [gltf.scene, reference.scene, adapted, portrait]);
  useEffect(() => {
    material.uniforms.surface.value = surface ? 1 : 0;
    const bandId=region==='all'?activeRegions.find(id=>humanRegionLocators[id]):region;
    const locator=bandId?humanRegionLocators[bandId]:undefined;
    material.uniforms.band.value=locator?1:0;
    material.uniforms.centerY.value=locator?locator[1]/model.scale.y+bounds.getCenter(new Vector3()).y:0;
    material.uniforms.halfHeight.value =
      region === "UBERON:0002240" ? 0.45 : 0.15;
    material.uniforms.regions.value.set(
      activeRegions.some((id) =>
        [
          "UBERON:0000955",
          "UBERON:0000956",
          "UBERON:0001897",
          "UBERON:0001906",
          "UBERON:0003129",
          "BODY:external-head",
        ].includes(id),
      )
        ? 1
        : 0,
      activeRegions.includes("UBERON:0001759") ? 1 : 0,
      activeRegions.includes("BODY:chest-wall") ? 1 : 0,
      activeRegions.some((id) =>
        ["UBERON:0002240", "BODY:spinal-epidural"].includes(id),
      )
        ? 1
        : 0,
    );
    invalidate();
    onReady();
  }, [region, activeRegions, surface, material, onReady, invalidate, model, bounds]);
  useEffect(() => () => material.dispose(), [material]);
  function zone(e: ThreeEvent<MouseEvent | PointerEvent>) {
    const local = model.worldToLocal(e.point.clone()).add(bounds.getCenter(new Vector3()));
    const fraction = (local.y - bounds.min.y) / (bounds.max.y - bounds.min.y);
    const world=e.point;
    if(Math.abs(world.x)>.65&&world.y<1.8&&world.y>-.8)return [world.y>1.25?'BODY:shoulder':world.y>.55?'BODY:elbow':world.y>0?'BODY:wrist':'BODY:hand','Limb region'];
    if(world.y<-1.1)return [world.y<-2.7?'BODY:foot':world.y<-2.3?'BODY:ankle':'BODY:knee','Lower limb region'];
    return fraction > 0.86
      ? ["UBERON:0000955", "Head → brain"]
      : fraction > 0.72
        ? ["UBERON:0001759", "Neck → vagus nerve"]
        : fraction > 0.62
          ? ["BODY:chest-wall", "Chest → implanted generators"]
          : fraction > 0.48
            ? ["UBERON:0002240", "Trunk → spinal cord"]
            : ["all", "No reviewed mappings for this body region"];
  }
  return (
    <primitive
      object={model}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 4 || portrait) return;
        e.stopPropagation();
        const hit=e.intersections.find(i=>i.object.userData.atlasRegion);
        onSelect(hit?.object.userData.atlasRegion||zone(e)[0]);
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(zone(e)[1]);
      }}
      onPointerOut={() => onHover("")}
    />
  );
}
function RegisteredAnatomy({
  region,
  activeRegions,
  onSelect,
  onHover,
  onReady,
}: {
  region: string;
  activeRegions: string[];
  onSelect: (id: string) => void;
  onHover: (label: string) => void;
  onReady: () => void;
}) {
  const gltf = useGLTF(atlasPath("/anatomy/nervous.glb"));
  const body = useGLTF(atlasPath("/anatomy/body.glb"));
  const invalidate = useThree((state) => state.invalidate);
  const model = useMemo(() => {
    const root = gltf.scene.clone(true),
      bounds = new Box3().setFromObject(body.scene),
      group = new Group();
    root.position.sub(bounds.getCenter(new Vector3()));
    group.add(root);
    group.scale.setScalar(6 / bounds.getSize(new Vector3()).y);
    root.traverse((o) => {
      if (o instanceof Mesh)
        o.material = new MeshStandardMaterial({
          color: "#79bbc5",
          roughness: 0.65,
          metalness: 0.04,
        });
    });
    return group;
  }, [gltf.scene, body.scene]);
  useEffect(() => {
    model.traverse((o) => {
      if (o instanceof Mesh) {
        const spinal = /spinal_cord/.test(o.name);
        const active = spinal
          ? [region, ...activeRegions].some((id) =>
              ["UBERON:0002240", "BODY:spinal-epidural"].includes(id),
            )
          : [region, ...activeRegions].some((id) =>
              [
                "UBERON:0000955",
                "UBERON:0000956",
                "UBERON:0001897",
                "UBERON:0001906",
              ].includes(id),
            );
        (o.material as MeshStandardMaterial).color = new Color(
          active ? "#e5b17c" : "#76bac5",
        );
      }
    });
    invalidate();
    onReady();
  }, [model, region, activeRegions, onReady, invalidate]);
  useEffect(
    () => () =>
      model.traverse((o) => {
        if (o instanceof Mesh) (o.material as MeshStandardMaterial).dispose();
      }),
    [model],
  );
  return (
    <primitive
      object={model}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 4) return;
        e.stopPropagation();
        onSelect(
          /spinal_cord/.test(e.object.name)
            ? "UBERON:0002240"
            : "UBERON:0000955",
        );
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(
          e.object.name.replace(/^(VH_M_|Allen_)/, "").replace(/_/g, " "),
        );
      }}
      onPointerOut={() => onHover("")}
    />
  );
}
function FocusRegion({region,portrait,focusKey}:{region:string;portrait:boolean;focusKey?:string}){
 const camera=useThree(s=>s.camera),controls=useThree(s=>s.controls) as unknown as {target:Vector3;update:()=>void}|undefined,invalidate=useThree(s=>s.invalidate);
 useEffect(()=>{if(!controls)return;const p=region==='all'?null:humanRegionLocators[region];if(portrait){camera.position.set(0,1.75,5.8);controls.target.set(0,1.75,0);}else if(region==='all'){camera.position.set(0,.1,10.8);controls.target.set(0,0,0);}else if(p){camera.position.set(p[0]+(focusKey ? .3 : 0),p[1],p[2]+3.4);controls.target.set(p[0]+(focusKey ? .3 : 0),p[1],p[2]);}else return;controls.update();invalidate();},[region,portrait,focusKey,camera,controls,invalidate]);return null;
}
export default function HumanScene({
  focusRegion,
  focusKey,
  action,
  actionPlaying = false,
  portrait = false,
  adapted = true,
  onProjection,
  showLabels = false,
  showOrgans = true,
  region,
  activeRegions,
  counts,
  surface,
  onSelect,
  onHover,
  onReady,
  onUnavailable,
}: {
  focusRegion?: string;
  focusKey?: string;
  action?: DeviceAction;
  actionPlaying?: boolean;
  portrait?: boolean;
  adapted?: boolean;
  onProjection?: (projection: LabelProjection) => void;
  showLabels?: boolean;
  showOrgans?: boolean;
  region: string;
  activeRegions: string[];
  counts: Record<string, number>;
  surface: boolean;
  onSelect: (id: string) => void;
  onHover: (label: string) => void;
  onReady: () => void;
  onUnavailable: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [avatarFailed,setAvatarFailed]=useState(false),[loadedExterior,setLoadedExterior]=useState('');
  const exterior=adapted&&!avatarFailed?'adapted':'reference';
  const exteriorReady=useCallback(()=>{setLoadedExterior(exterior);onReady();},[exterior,onReady]);
  const [organsReady,setOrgansReady]=useState(false),[organsFailed,setOrgansFailed]=useState(false);
  const organsLoaded=useCallback(()=>setOrgansReady(true),[]);
  const [internalReady, setInternalReady] = useState(false),
    [internalFailed, setInternalFailed] = useState(false);
  const internalLoaded = useCallback(() => setInternalReady(true), []);
  useEffect(() => {
    if (failed) onUnavailable();
  }, [failed, onUnavailable]);
  if (failed)
    return (
      <div className="human-fallback">
        <p>3D unavailable. Select a region:</p>
        {pins.map((p) => (
          <button key={p.id} onClick={() => onSelect(p.id)}>
            {p.name} <span>{counts[p.id] || 0}</span>
          </button>
        ))}
      </div>
    );
  return (
    <div
      className="human-reference"
      data-testid="human-reference"
      data-presentation={portrait?"portrait":"atlas"}
      data-exterior={exterior}
      data-focus-region={focusRegion || region}
      data-action-kind={action?.kind || 'none'}
      data-avatar-status={avatarFailed?'unavailable':loadedExterior===exterior?'loaded':'loading'}
      data-organs-status={!showOrgans?'hidden':organsFailed?'unavailable':organsReady?'loaded':'loading'}
      data-internal-status={
        !showOrgans ? "hidden" : internalFailed ? "unavailable" : internalReady ? "loaded" : "loading"
      }
    >
      {organsFailed && <span className="internal-unavailable">Organ geometry unavailable · region list remains available</span>}
      {avatarFailed && <span className="internal-unavailable">Body contour unavailable · reference exterior shown</span>}
      {internalFailed && (
        <span className="internal-unavailable">
          Brain / spinal geometry unavailable
        </span>
      )}
      {!portrait && action && <div className="mechanism-caption"><strong>Mechanism · schematic inset</strong><span>Enlarged drawing, not implant placement</span></div>}
      <Boundary fail={() => setFailed(true)}>
        <Canvas
          camera={{ position: [0, 0.1, 10.8], fov: 34 }}
          dpr={[1, 1.5]}
          frameloop="demand"
          gl={{ alpha: true, antialias: true }}
          role="group"
          aria-label="Interactive human atlas"
          onCreated={({ gl }) =>
            gl.domElement.addEventListener(
              "webglcontextlost",
              () => setFailed(true),
              { once: true },
            )
          }
        >
          {showOrgans&&<Boundary fail={()=>setOrgansFailed(true)}><Suspense fallback={null}><WholeBodyOrgans region={focusRegion || region} activeRegions={activeRegions} onSelect={onSelect} onHover={onHover} onReady={organsLoaded}/></Suspense></Boundary>}
          <FocusRegion region={focusRegion || region} portrait={portrait} focusKey={focusKey}/>
          {!portrait && action && focusRegion && <DeviceActionOverlay action={action} focusRegion={focusRegion} playing={actionPlaying}/>}
          <ambientLight intensity={1.7} />
          <directionalLight position={[3, 5, 6]} intensity={2.5} />
          <group visible={showOrgans}><Boundary fail={() => setInternalFailed(true)}>
            <Suspense fallback={null}>
              <RegisteredAnatomy
                region={region}
                activeRegions={activeRegions}
                onSelect={onSelect}
                onHover={onHover}
                onReady={internalLoaded}
              />
            </Suspense>
          </Boundary></group>
          <Boundary key={exterior} fail={()=>exterior==='adapted'?setAvatarFailed(true):setFailed(true)}><Suspense fallback={null}>
            <Body
              portrait={portrait}
              adapted={exterior==='adapted'}
              region={region}
              activeRegions={activeRegions}
              surface={surface}
              onSelect={onSelect}
              onHover={onHover}
              onReady={exteriorReady}
            />
            {!showLabels &&
              pins.map((pin) => (
                <Html
                  key={pin.id}
                  position={[...pin.position]}
                  center
                  zIndexRange={[15, 10]}
                >
                  <button
                    className={`body-pin pin-${pin.side} ${region === pin.id || activeRegions.includes(pin.id) || (pin.id === "UBERON:0000955" && activeRegions.some((id) => ["UBERON:0000956", "UBERON:0001897", "UBERON:0001906", "UBERON:0003129", "BODY:external-head"].includes(id))) ? "pin-active" : ""}`}
                    data-region={pin.id}
                    aria-label={`${pin.name} — ${counts[pin.id] || 0} approaches`}
                    onClick={() => onSelect(pin.id)}
                  >
                    <span className="pin-dot" />
                    <span className="pin-leader" />
                    <span className="pin-text">
                      {pin.name}
                      <small>
                        {counts[pin.id] || 0}{" "}
                        {counts[pin.id] === 1 ? "approach" : "approaches"}
                      </small>
                    </span>
                  </button>
                </Html>
              ))}
          </Suspense></Boundary>
          <AnnotationProjection
            anchors={humanRegionLocators}
            onProjection={onProjection}
          />
          <OrbitControls
            makeDefault
            enablePan={false}
            enableZoom
            minDistance={portrait?2.8:1.2}
            maxDistance={portrait?8:14}
            minPolarAngle={portrait?0.55:0.15}
            maxPolarAngle={portrait?1.95:3.0}
            enableDamping={false}
          />
        </Canvas>
      </Boundary>
    </div>
  );
}
