"use client";
import { atlasPath } from "@/lib/deployment";
import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Color, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import {
  Component,
  ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AnnotationProjection from "./AnnotationProjection";
import type { LabelProjection } from "@/lib/annotations";

const BRAIN = "UBERON:0000955",
  CORTEX = "UBERON:0000956",
  THALAMUS = "UBERON:0001897",
  STN = "UBERON:0001906";
export function regionForMesh(
  name: string,
  userData: Record<string, unknown>,
): string {
  const oid = userData.ontologyid;
  if (oid === STN || /subthalamic_nucleus/.test(name)) return STN;
  if (oid === THALAMUS || /thalamus/.test(name)) return THALAMUS;
  if (oid === CORTEX || /gyrus|cortex|cortical/.test(name)) return CORTEX;
  return BRAIN;
}
function Brain({
  region,
  dissect,
  onSelect,
  onReady,
  onHover,
  onProjection,
}: {
  onProjection?: (projection: LabelProjection) => void;
  region: string;
  dissect: boolean;
  onSelect: (id: string) => void;
  onReady: () => void;
  onHover?: (label: string) => void;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const gltf = useGLTF(atlasPath("/anatomy/brain.glb"));
  const model = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(root),
      center = box.getCenter(new Vector3()),
      size = box.getSize(new Vector3());
    const scale = 3.6 / Math.max(size.x, size.y, size.z);
    const group = new Group();
    group.add(root);
    root.position.sub(center);
    group.scale.setScalar(scale);
    root.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.material = new MeshStandardMaterial({
          color: "#bcc5c4",
          roughness: 0.72,
          metalness: 0.08,
        });
      }
    });
    return group;
  }, [gltf.scene]);
  const anchors = useMemo(() => {
    model.updateMatrixWorld(true);
    const boxes: Record<string, Box3> = {};
    model.traverse((o) => {
      if (o instanceof Mesh) {
        const id = regionForMesh(o.name, o.userData);
        (boxes[id] ||= new Box3()).union(new Box3().setFromObject(o));
      }
    });
    boxes[BRAIN] = new Box3().setFromObject(model);
    return Object.fromEntries(
      Object.entries(boxes).map(([id, box]) => [
        id,
        box
          .getCenter(new Vector3())
          .applyAxisAngle(new Vector3(0, 1, 0), -0.45)
          .toArray() as [number, number, number],
      ]),
    );
  }, [model]);
  useEffect(() => {
    model.traverse((obj) => {
      if (obj instanceof Mesh) {
        const mapped = regionForMesh(obj.name, obj.userData),
          active = region === BRAIN || mapped === region;
        const material = obj.material as MeshStandardMaterial;
        material.color = new Color(active ? "#c77b56" : "#a6b8b7");
        material.transparent = !active;
        material.opacity = active ? 1 : 0.1;
        material.depthWrite = active;
        obj.visible = !dissect || active;
        material.needsUpdate = true;
      }
    });
    invalidate();
    onReady();
    return () => {};
  }, [model, region, dissect, onReady, invalidate]);
  useEffect(
    () => () => {
      model.traverse((obj) => {
        if (obj instanceof Mesh)
          (obj.material as MeshStandardMaterial).dispose();
      });
    },
    [model],
  );
  function click(e: ThreeEvent<MouseEvent>) {
    if (e.delta > 4) return;
    e.stopPropagation();
    onSelect(regionForMesh(e.object.name, e.object.userData));
  }
  return (
    <>
      <primitive
        object={model}
        rotation={[0, -0.45, 0]}
        onClick={click}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          const label =
            typeof e.object.userData.label === "string" &&
            e.object.userData.label !== "-"
              ? e.object.userData.label
              : e.object.name.replace(/^Allen_/, "").replace(/_/g, " ");
          onHover?.(label);
        }}
        onPointerOut={() => onHover?.("")}
      />
      <AnnotationProjection anchors={anchors} onProjection={onProjection} />
    </>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function AnatomyScene({
  onProjection,
  region,
  dissect,
  onSelect,
  onReady,
  onUnavailable,
  onHover,
}: {
  onProjection?: (projection: LabelProjection) => void;
  region: string;
  dissect: boolean;
  onSelect: (id: string) => void;
  onReady: () => void;
  onUnavailable: () => void;
  onHover?: (label: string) => void;
}) {
  const [failed, setFailed] = useState(false),
    [supported, setSupported] = useState(false);
  const ready = useRef(onReady);
  ready.current = onReady;
  const stableReady = useMemo(() => () => ready.current(), []);
  useEffect(() => {
    if (failed) onUnavailable();
  }, [failed, onUnavailable]);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2");
    setSupported(!!ctx);
    if (!ctx) setFailed(true);
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
  }, []);
  if (failed)
    return (
      <div className="scene-fallback">
        <span>3D reference unavailable</span>
        <p>
          Use the anatomical index to explore the same source-backed
          relationships.
        </p>
      </div>
    );
  if (!supported)
    return <div className="scene-fallback">Checking 3D support…</div>;
  return (
    <SceneBoundary onError={() => setFailed(true)}>
      <Canvas
        camera={{ position: [4, 1.4, 5], fov: 36 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        role="group"
        aria-label="Interactive HRA brain reference. Use the anatomical index for keyboard navigation."
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            () => setFailed(true),
            { once: true },
          );
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 7, 5]} intensity={3} />
        <directionalLight
          position={[-4, 0, -4]}
          intensity={1.5}
          color="#8fa9b0"
        />
        <Suspense fallback={null}>
          <Brain
            onProjection={onProjection}
            region={region}
            dissect={dissect}
            onSelect={onSelect}
            onReady={stableReady}
            onHover={onHover}
          />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          enableDamping={false}
        />
      </Canvas>
    </SceneBoundary>
  );
}
