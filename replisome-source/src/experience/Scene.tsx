import { useEffect, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ReplicationEngine, STAGES } from "../simulation/engine";
import { molecules } from "../data/molecules";
import { B_DNA } from "./dna";

export type Representation = "surface" | "cartoon" | "structure";
export type CameraMode =
  | "cinematic"
  | "free"
  | "polymerase"
  | "okazaki"
  | "detail";
export type Quality = "Ultra" | "High" | "Balanced" | "Mobile";
type Point = [number, number, number];
interface MolecularGroup {
  points: Point[];
  lod: { low: number[]; medium: number[]; high: number[] };
  chains: { id: string; start: number; count: number; breaks: number[] }[];
  center: Point;
}
interface Asset {
  id: string;
  groups: Record<string, MolecularGroup>;
  dna: { points: Point[] }[];
}
interface SceneProps {
  engine: ReplicationEngine;
  representation: Representation;
  cameraMode: CameraMode;
  quality: Quality;
  reduceMotion: boolean;
  onSelect: (id: string) => void;
  onReady: (status: string) => void;
  resetKey: number;
  selected: string;
}
const positions: Record<string, Point> = {
  cmg: [0, 1.6, 0],
  epsilon: [-1.5, -0.4, 0.1],
  alpha: [2.4, 0.2, 0.45],
  delta: [2.6, -3.5, 0.4],
  pcna: [2.6, -4.6, 0.5],
  fen1: [3.5, -4.35, 0.65],
  rfc: [4, -1.3, -0.2],
  rpa: [3.5, 2, -0.5],
  ligase: [-0.2, -5.8, 0.15],
};
const sizes: Record<string, number> = {
  cmg: 3.5,
  epsilon: 2.9,
  alpha: 2.5,
  delta: 2.5,
  pcna: 1.7,
  fen1: 0.95,
  rfc: 1.3,
  rpa: 1.1,
  ligase: 2.45,
};
const sphere = new T.IcosahedronGeometry(1, 1);
const sphereLow = new T.IcosahedronGeometry(1, 0);
function seeded(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function procedural(id: string): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < 1100; i++) {
    const a = seeded(i + id.length) * Math.PI * 2,
      z = seeded(i * 3 + 4) * 2 - 1,
      r = Math.pow(seeded(i * 7 + 5), 0.34),
      s = Math.sqrt(1 - z * z);
    const lobe = i % 3;
    points.push([
      r * s * Math.cos(a) + (lobe - 1) * 0.7,
      r * z * 0.85 + Math.sin(lobe * 2) * 0.35,
      r * s * Math.sin(a) * 0.75,
    ]);
  }
  return points;
}
function makeProtein(
  id: string,
  points: Point[],
  representation: Representation,
  quality: Quality,
  chains?: MolecularGroup["chains"],
) {
  const g = new T.Group();
  g.userData.molecule = id;
  const color = molecules.find((m) => m.id === id)?.color ?? "#9aacbe";
  const box = new T.Box3().setFromPoints(
    points.map((p) => new T.Vector3(...p)),
  );
  const center = box.getCenter(new T.Vector3()),
    size = box.getSize(new T.Vector3());
  const scale = (sizes[id] ?? 2) / Math.max(size.x, size.y, size.z);
  const material = new T.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.04,
  });
  if (representation === "cartoon" && chains) {
    for (const c of chains) {
      const boundaries = [0, ...c.breaks, c.count];
      for (let segment = 0; segment < boundaries.length - 1; segment++) {
        const path = points
          .slice(
            c.start + boundaries[segment],
            c.start + boundaries[segment + 1],
          )
          .filter((_, i) => i % 3 === 0)
          .map((p) => new T.Vector3(...p).sub(center).multiplyScalar(scale));
        if (path.length < 2) continue;
        const curve = new T.CatmullRomCurve3(path);
        const mesh = new T.Mesh(
          new T.TubeGeometry(
            curve,
            Math.min(path.length * 3, 1500),
            0.046,
            5,
            false,
          ),
          material,
        );
        g.add(mesh);
      }
    }
    return g;
  }
  const stride = quality === "Mobile" ? 3 : quality === "Balanced" ? 2 : 1;
  const sampled = points.filter((_, i) => i % stride === 0);
  const detailed =
    representation === "surface" && (quality === "Ultra" || quality === "High");
  const count = sampled.length * (detailed ? 2 : 1);
  const mesh = new T.InstancedMesh(
    quality === "Mobile" ? sphereLow : sphere,
    material,
    count,
  );
  const obj = new T.Object3D();
  const base = representation === "structure" ? 1.25 : 2.45;
  let k = 0;
  for (let i = 0; i < sampled.length; i++) {
    const p = sampled[i];
    obj.position
      .set(...p)
      .sub(center)
      .multiplyScalar(scale);
    const radius =
      Math.min(0.095, Math.max(0.031, base * scale)) *
      (stride === 3 ? 1.15 : 1);
    obj.scale.setScalar(radius * (0.86 + seeded(i) * 0.24));
    obj.updateMatrix();
    mesh.setMatrixAt(k++, obj.matrix);
    mesh.setColorAt(
      k - 1,
      new T.Color(color).multiplyScalar(0.77 + seeded(i * 2 + 2) * 0.36),
    );
    if (detailed) {
      obj.position.x += Math.min(0.045, scale * 0.9);
      obj.position.y += Math.min(0.035, scale * 0.55);
      obj.scale.multiplyScalar(0.72);
      obj.updateMatrix();
      mesh.setMatrixAt(k++, obj.matrix);
      mesh.setColorAt(k - 1, new T.Color(color).multiplyScalar(0.9));
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  g.add(mesh);
  return g;
}
function dnaPath(points: Point[], single = false) {
  const group = new T.Group();
  const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)));
  const n = Math.floor(curve.getLength() / 0.095);
  const colors = ["#d6dbe0", "#d59698"];
  const beads: T.InstancedMesh[] = [];
  const matrices: T.Matrix4[][] = [];
  const basis = new T.Vector3(0, 0, 1);
  const obj = new T.Object3D();
  for (let strand = 0; strand < (single ? 1 : 2); strand++) {
    const mesh = new T.InstancedMesh(
      sphere,
      new T.MeshStandardMaterial({ color: colors[strand], roughness: 0.8 }),
      n,
    );
    const all: T.Matrix4[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1),
        p = curve.getPoint(t),
        tangent = curve.getTangent(t),
        normal = new T.Vector3().crossVectors(tangent, basis).normalize(),
        binormal = new T.Vector3().crossVectors(tangent, normal).normalize();
      const theta =
        (i * 2 * Math.PI) / B_DNA.basePairsPerTurn + (strand ? Math.PI : 0);
      if (!single)
        p.addScaledVector(normal, Math.cos(theta) * 0.28).addScaledVector(
          binormal,
          Math.sin(theta) * 0.28,
        );
      obj.position.copy(p);
      obj.scale.setScalar(0.085);
      obj.updateMatrix();
      mesh.setMatrixAt(i, obj.matrix);
      all.push(obj.matrix.clone());
    }
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    beads.push(mesh);
    matrices.push(all);
  }
  if (!single) {
    const links = new T.InstancedMesh(
      new T.CylinderGeometry(0.032, 0.032, 1, 5),
      new T.MeshStandardMaterial({ color: "#b3a5a3", roughness: 0.85 }),
      Math.floor(n / 2),
    );
    for (let i = 0; i < links.count; i++) {
      const a = new T.Vector3().setFromMatrixPosition(matrices[0][i * 2]),
        b = new T.Vector3().setFromMatrixPosition(matrices[1][i * 2]);
      obj.position.copy(a).lerp(b, 0.5);
      obj.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        b.clone().sub(a).normalize(),
      );
      obj.scale.set(1, a.distanceTo(b), 1);
      obj.updateMatrix();
      links.setMatrixAt(i, obj.matrix);
    }
    group.add(links);
  }
  const updateFlow = (offset: number) => {
    for (let strand = 0; strand < beads.length; strand++) {
      for (let i = 0; i < n; i++) {
        const t = (i + (offset % 1)) / n,
          p = curve.getPoint(t),
          tangent = curve.getTangent(t),
          normal = new T.Vector3().crossVectors(tangent, basis).normalize(),
          binormal = new T.Vector3().crossVectors(tangent, normal).normalize();
        const theta =
          ((i + offset) * 2 * Math.PI) / B_DNA.basePairsPerTurn +
          (strand ? Math.PI : 0);
        if (!single)
          p.addScaledVector(normal, Math.cos(theta) * 0.28).addScaledVector(
            binormal,
            Math.sin(theta) * 0.28,
          );
        obj.position.copy(p);
        obj.quaternion.identity();
        obj.scale.setScalar(0.085);
        obj.updateMatrix();
        beads[strand].setMatrixAt(i, obj.matrix);
        matrices[strand][i].copy(obj.matrix);
      }
      beads[strand].instanceMatrix.needsUpdate = true;
    }
    const links = group.children[2];
    if (links instanceof T.InstancedMesh) {
      for (let i = 0; i < links.count; i++) {
        const a = new T.Vector3().setFromMatrixPosition(matrices[0][i * 2]),
          b = new T.Vector3().setFromMatrixPosition(matrices[1][i * 2]);
        obj.position.copy(a).lerp(b, 0.5);
        obj.quaternion.setFromUnitVectors(
          new T.Vector3(0, 1, 0),
          b.clone().sub(a).normalize(),
        );
        obj.scale.set(1, a.distanceTo(b), 1);
        obj.updateMatrix();
        links.setMatrixAt(i, obj.matrix);
      }
      links.instanceMatrix.needsUpdate = true;
    }
  };
  return { group, beads, n, matrices, updateFlow };
}
function dispose(group: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>();
  group.traverse((o) => {
    if (o instanceof T.Mesh) {
      if (o.geometry !== sphere && o.geometry !== sphereLow)
        geometries.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        materials.add(m);
      if (o instanceof T.InstancedMesh) o.dispose();
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}

export function MolecularScene(props: SceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;
  useEffect(() => {
    const root = container.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      props.onReady("unavailable");
      return;
    }
    const gl = renderer.getContext();
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const rendererName = debug
      ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
      : "";
    let requestedQuality = props.quality;
    let effectiveQuality: Quality = /swiftshader|llvmpipe|software/i.test(
      rendererName,
    )
      ? "Mobile"
      : props.quality;
    let gone = false,
      raf = 0;
    const scene = new T.Scene();
    scene.fog = new T.FogExp2("#182537", 0.017);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    root.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive three-dimensional human DNA replication machinery",
    );
    renderer.domElement.setAttribute("role", "img");
    const camera = new T.PerspectiveCamera(36, 1, 0.1, 150);
    camera.position.set(0, 1, 23);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 5;
    controls.maxDistance = 38;
    controls.enablePan = true;
    scene.add(new T.HemisphereLight("#d9e9ff", "#283447", 2.4));
    const key = new T.DirectionalLight("#b6d7ff", 3.1);
    key.position.set(-7, 9, 12);
    scene.add(key);
    const fill = new T.DirectionalLight("#c4a5ef", 1.9);
    fill.position.set(7, 1, -6);
    scene.add(fill);
    const rim = new T.DirectionalLight("#bdfff5", 2);
    rim.position.set(-3, -8, 3);
    scene.add(rim);
    const world = new T.Group();
    scene.add(world);
    const proteins: Record<string, T.Group> = {};
    const structureData = new T.Group();
    world.add(structureData);
    let assets: Asset[] = [];
    let assetError = false;
    let version = "";
    let selected = "";
    const parent = dnaPath([
      [0.1, 1.8, 0],
      [0.4, 4.2, 0.25],
      [-0.5, 6.5, 0.5],
      [-1.4, 10, 0],
    ]);
    const leading = dnaPath([
      [-0.5, 1, 0],
      [-2.3, -0.4, 0.4],
      [-3, -3.5, -0.1],
      [-3.5, -7, 0.4],
      [-4.3, -10, 0],
    ]);
    const lagTemplate = dnaPath(
      [
        [0.4, 1.4, 0],
        [2.7, 3, -0.1],
        [4.2, 1.4, 0.2],
        [2.7, -0.6, 0.3],
        [2.6, -3.8, 0.2],
        [1.2, -5.6, 0.1],
        [0.2, -8.7, 0.2],
      ],
      true,
    );
    const lagDaughter = dnaPath([
      [2.6, -3.8, 0.2],
      [1.2, -5.6, 0.1],
      [0.2, -8.7, 0.2],
    ]);
    world.add(
      parent.group,
      leading.group,
      lagTemplate.group,
      lagDaughter.group,
    );
    const primer = dnaPath(
      [
        [2.9, 0.1, 0.25],
        [3.2, -0.3, 0.3],
        [3, -0.8, 0.2],
      ],
      true,
    );
    (primer.beads[0].material as T.MeshStandardMaterial).color.set("#89e1aa");
    world.add(primer.group);
    const flap = dnaPath(
      [
        [2.6, -4.4, 0.2],
        [3.1, -4.65, 0.5],
        [3.5, -4.3, 0.6],
      ],
      true,
    );
    (flap.beads[0].material as T.MeshStandardMaterial).color.set("#8ee7b8");
    world.add(flap.group);
    const nick = new T.Mesh(
      new T.TorusGeometry(0.22, 0.025, 6, 24),
      new T.MeshBasicMaterial({
        color: "#f1c07a",
        transparent: true,
        opacity: 0.8,
      }),
    );
    nick.position.set(0.35, -7.7, 0.7);
    world.add(nick);
    const particleCount = 44;
    const particles = new T.InstancedMesh(
      sphere,
      new T.MeshStandardMaterial({
        color: "#d6d889",
        roughness: 0.45,
        emissive: "#6b7628",
        emissiveIntensity: 0.2,
      }),
      particleCount,
    );
    world.add(particles);
    const obj = new T.Object3D();
    const trails = new Map<
      number,
      { dna: ReturnType<typeof dnaPath>; clamp: T.Group; polymerase: T.Group }
    >();
    const removeTrail = (id: number) => {
      const trail = trails.get(id)!;
      world.remove(trail.dna.group, trail.clamp, trail.polymerase);
      dispose(trail.dna.group);
      for (const group of [trail.clamp, trail.polymerase])
        group.traverse((o) => {
          if (o instanceof T.InstancedMesh) o.dispose();
        });
      trails.delete(id);
    };
    const rebuild = () => {
      for (const id of trails.keys()) removeTrail(id);
      dispose(structureData);
      structureData.clear();
      Object.values(proteins).forEach((p) => {
        world.remove(p);
        dispose(p);
      });
      Object.keys(proteins).forEach((k) => delete proteins[k]);
      const p = live.current;
      for (const molecule of molecules) {
        const asset = assets.find((a) => molecule.id in a.groups);
        const data = asset?.groups[molecule.id];
        const group = makeProtein(
          molecule.id,
          data?.points ?? procedural(molecule.id),
          p.representation,
          effectiveQuality,
          data?.chains,
        );
        group.position.set(...positions[molecule.id]);
        if (molecule.id === "cmg") group.rotation.set(0.18, 0.15, 0.12);
        if (molecule.id === "epsilon") group.rotation.z = -0.25;
        if (molecule.id === "alpha") group.rotation.z = 0.3;
        world.add(group);
        proteins[molecule.id] = group;
      }
      if (p.representation === "structure") {
        for (const id of ["rfc", "rpa", "ligase"]) proteins[id].visible = false;
        const accessory = assets.find((a) => a.groups.accessory)?.groups
          .accessory;
        if (accessory) {
          proteins.accessory = makeProtein(
            "accessory",
            accessory.points,
            "structure",
            effectiveQuality,
          );
          proteins.accessory.userData.molecule = "cmg";
          world.add(proteins.accessory);
        }
        for (const asset of assets) {
          const ids = Object.keys(asset.groups).filter((id) => proteins[id]);
          const pts = ids.flatMap((id) => asset.groups[id].points);
          const box = new T.Box3().setFromPoints(
            pts.map((pt) => new T.Vector3(...pt)),
          );
          const center = box.getCenter(new T.Vector3());
          const size = box.getSize(new T.Vector3());
          const scale = 5 / Math.max(size.x, size.y, size.z);
          const offset =
            asset.id.toLowerCase() === "7pfo"
              ? new T.Vector3(-1.4, 2, 0)
              : asset.id.toLowerCase() === "6tnz"
                ? new T.Vector3(1.1, -3, 0)
                : new T.Vector3(3, 1, 0);
          for (const id of ids) {
            dispose(proteins[id]);
            world.remove(proteins[id]);
            const group = makeProtein(
              id,
              asset.groups[id].points,
              "structure",
              effectiveQuality,
            );
            const pb = new T.Box3().setFromPoints(
              asset.groups[id].points.map((pt) => new T.Vector3(...pt)),
            );
            const ps = pb.getSize(new T.Vector3());
            group.scale.setScalar(
              scale / ((sizes[id] ?? 2) / Math.max(ps.x, ps.y, ps.z)),
            );
            group.position.copy(
              pb
                .getCenter(new T.Vector3())
                .sub(center)
                .multiplyScalar(scale)
                .add(offset),
            );
            if (id === "accessory") group.userData.molecule = "cmg";
            world.add(group);
            proteins[id] = group;
          }
          for (const chain of asset.dna) {
            const beads = new T.InstancedMesh(
              sphere,
              new T.MeshStandardMaterial({ color: "#d3c6c0", roughness: 0.8 }),
              chain.points.length,
            );
            for (let i = 0; i < chain.points.length; i++) {
              obj.position
                .set(...chain.points[i])
                .sub(center)
                .multiplyScalar(scale)
                .add(offset);
              obj.quaternion.identity();
              obj.scale.setScalar(0.057);
              obj.updateMatrix();
              beads.setMatrixAt(i, obj.matrix);
            }
            structureData.add(beads);
          }
        }
      }
    };
    const resize = () => {
      const w = root.clientWidth,
        h = root.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    resize();
    Promise.all(
      ["7pfo", "6tnz", "8qj7"].map(async (id) => {
        const r = await fetch(
          `${import.meta.env.BASE_URL}molecules/${id}.json`,
        );
        if (!r.ok) throw new Error(id);
        return (await r.json()) as Asset;
      }),
    )
      .then((a) => {
        if (gone) return;
        assets = a;
        version = "";
        props.onReady("ready");
      })
      .catch(() => {
        if (gone) return;
        assetError = true;
        props.onReady("degraded");
      });
    const ray = new T.Raycaster(),
      pointer = new T.Vector2();
    let down = [0, 0];
    const pointerDown = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
    };
    const select = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      const rect = root.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(Object.values(proteins), true)[0];
      if (hit) {
        let o: T.Object3D | null = hit.object;
        while (o && !o.userData.molecule) o = o.parent;
        if (o) {
          selected = o.userData.molecule;
          live.current.onSelect(selected);
        }
      }
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", select);
    const focus = () => {
      const id = selected || "cmg";
      live.current.onSelect(id);
      controls.target.copy(proteins[id].position);
      camera.position.copy(controls.target).add(new T.Vector3(0, 0, 9));
    };
    renderer.domElement.addEventListener("dblclick", focus);
    const cameraCommand = (e: Event) => {
      const cmd = (e as CustomEvent<string>).detail,
        offset = camera.position.clone().sub(controls.target);
      if (cmd === "in" || cmd === "out")
        offset.multiplyScalar(cmd === "in" ? 0.85 : 1.15);
      else
        offset.applyAxisAngle(
          new T.Vector3(0, 1, 0),
          cmd === "left" ? 0.18 : -0.18,
        );
      camera.position.copy(controls.target).add(offset);
    };
    window.addEventListener("replisome-camera", cameraCommand);
    controls.listenToKeyEvents(window);
    const lost = (e: Event) => {
      e.preventDefault();
      live.current.onReady("lost");
    };
    const restored = () => {
      live.current.onReady(assetError ? "degraded" : "ready");
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    renderer.domElement.addEventListener("webglcontextrestored", restored);
    let oldFlow = -1;
    let oldCamera = "",
      oldReset = -1,
      frames = 0,
      fpsStart = performance.now(),
      adaptive = 1;
    const target = new T.Vector3(),
      desired = new T.Vector3();
    function frame() {
      if (gone) return;
      raf = requestAnimationFrame(frame);
      const p = live.current;
      if (requestedQuality !== p.quality) {
        requestedQuality = p.quality;
        effectiveQuality = p.quality;
      }
      root.dataset.effectiveQuality = effectiveQuality;
      const v = `${p.representation}:${effectiveQuality}:${assets.length}`;
      if (version !== v) {
        version = v;
        rebuild();
        adaptive = 1;
        renderer.setPixelRatio(
          Math.min(
            window.devicePixelRatio,
            effectiveQuality === "Ultra"
              ? 2
              : effectiveQuality === "High"
                ? 1.65
                : effectiveQuality === "Balanced"
                  ? 1.3
                  : 1,
          ),
        );
      }
      parent.group.visible = p.representation !== "structure";
      leading.group.visible = p.representation !== "structure";
      lagTemplate.group.visible = p.representation !== "structure";
      lagDaughter.group.visible = p.representation !== "structure";
      const t = p.engine.time;
      const active = p.engine.active;
      const s = STAGES.indexOf(active.stage);
      const previous = p.engine.fragments
        .filter((f) => f.id !== active.id)
        .slice(-2);
      for (const id of trails.keys())
        if (!previous.some((f) => f.id === id)) removeTrail(id);
      for (const f of previous) {
        let trail = trails.get(f.id);
        if (!trail) {
          const dna = dnaPath([
            [1.3, 0, 0.3],
            [0.8, -1.8, 0.3],
            [0.2, -4.4, 0.2],
          ]);
          const clamp = proteins.pcna.clone(),
            polymerase = proteins.delta.clone();
          clamp.scale.setScalar(0.55);
          polymerase.scale.setScalar(0.62);
          world.add(dna.group, clamp, polymerase);
          trail = { dna, clamp, polymerase };
          trails.set(f.id, trail);
        }
        const y = -5.5 - ((p.engine.fork - f.start - 150) / 150) * 4;
        trail.dna.group.position.y = y;
        trail.dna.beads[1].count = Math.floor(
          (trail.dna.n * (f.rna + f.dna)) / 150,
        );
        trail.dna.group.visible = p.representation !== "structure";
        trail.clamp.position.set(1.3, y, 0.3);
        trail.polymerase.position.set(1.55, y - 0.65, 0.3);
        trail.clamp.visible =
          p.representation !== "structure" &&
          f.pcna &&
          f.stage !== "MATURE_FRAGMENT";
        trail.polymerase.visible =
          p.representation !== "structure" && f.polymerase === "delta";
      }
      controls.enabled = p.cameraMode === "free" || p.engine.mode === "explore";
      if (oldCamera !== p.cameraMode || oldReset !== p.resetKey) {
        oldCamera = p.cameraMode;
        oldReset = p.resetKey;
        controls.target.set(0, 0, 0);
        if (p.cameraMode === "free") camera.position.set(0, 1, 23);
      }
      if (!controls.enabled) {
        target.set(
          p.cameraMode === "polymerase"
            ? -1.7
            : p.cameraMode === "okazaki"
              ? 2
              : 0,
          p.cameraMode === "okazaki" ? -3 : 0,
          0,
        );
        if (p.cameraMode === "detail" && proteins[p.selected])
          target.copy(proteins[p.selected].position);
        const distance =
          p.cameraMode === "detail"
            ? 11
            : p.cameraMode === "okazaki" || p.cameraMode === "polymerase"
              ? 15
              : camera.aspect < 0.8
                ? 30
                : 23;
        desired.set(
          target.x + (p.reduceMotion ? 0 : Math.sin(t * 0.07) * 0.9),
          target.y + 1,
          distance,
        );
        camera.position.lerp(desired, 0.04);
        controls.target.lerp(target, 0.04);
      }
      controls.update();
      for (const [id, group] of Object.entries(proteins)) {
        if (p.representation !== "structure") {
          const origin = positions[id];
          let dx = 0,
            dy = 0;
          if (id === "alpha") {
            dx = s < 4 ? -0.15 : 0.5;
          }
          if (id === "rfc") {
            dx = s === 4 ? -1.15 : 0.3;
          }
          if (id === "delta") {
            dy = s === 5 ? -Math.min(1.3, active.dna / 150) : 0.25;
          }
          if (id === "fen1") {
            dx = s === 7 ? -0.55 : 0.15;
          }
          if (id === "ligase") {
            dx = s >= 8 && s <= 9 ? 0.4 : 0;
            dy = s === 9 ? -2.9 : 0;
          }
          group.position.set(origin[0] + dx, origin[1] + dy, origin[2]);
          if (!p.reduceMotion) {
            group.position.y += Math.sin(t * 0.65 + id.length) * 0.045;
            group.rotation.y = Math.sin(t * 0.22 + id.length) * 0.08;
          }
        }
      }
      primer.group.visible =
        p.representation !== "structure" && s >= 2 && s <= 7;
      primer.beads[0].count = Math.min(
        primer.n,
        Math.ceil((primer.n * active.rna) / 10),
      );
      flap.group.visible = p.representation !== "structure" && s === 7;
      nick.visible = p.representation !== "structure" && active.nick && s >= 6;
      lagDaughter.beads[1].count = Math.floor(
        (lagDaughter.n * (active.dna + active.rna)) / 150,
      );
      lagDaughter.group.children[2].visible = s >= 6;
      const endMatrix = lagDaughter.matrices[1][lagDaughter.n - 1].clone();
      if (active.nick) endMatrix.scale(new T.Vector3(0, 0, 0));
      lagDaughter.beads[1].setMatrixAt(lagDaughter.n - 1, endMatrix);
      lagDaughter.beads[1].instanceMatrix.needsUpdate = true;
      nick.position.set(0.2, -8.7, 0.6); // Only paired daughter has base bridges.
      if (oldFlow !== p.engine.fork && !p.reduceMotion) {
        oldFlow = p.engine.fork;
        parent.updateFlow(p.engine.fork * 0.2);
        leading.updateFlow(p.engine.fork * 0.2);
      }
      parent.group.rotation.y = 0;
      leading.group.rotation.y = 0;
      for (let i = 0; i < particleCount; i++) {
        const clock = p.reduceMotion ? 0 : t;
        const progress = (clock * 0.14 + seeded(i * 4)) % 1;
        const destination =
          s === 5 && i % 2 ? positions.delta : positions.epsilon;
        obj.position.set(
          (seeded(i * 9) - 0.5) * 16 * (1 - progress) +
            destination[0] * progress,
          (seeded(i * 3) - 0.5) * 20 * (1 - progress) +
            destination[1] * progress,
          (seeded(i * 7) - 0.5) * 7 * (1 - progress),
        );
        obj.scale.setScalar(0.04 + seeded(i * 2) * 0.045);
        obj.updateMatrix();
        particles.setMatrixAt(i, obj.matrix);
      }
      particles.instanceMatrix.needsUpdate = true;
      world.rotation.z = -0.13;
      renderer.render(scene, camera);
      root.dataset.camera = camera.position
        .toArray()
        .map((n) => n.toFixed(3))
        .join(",");
      frames++;
      const now = performance.now();
      if (now - fpsStart > 4000) {
        const fps = (frames * 1000) / (now - fpsStart);
        root.dataset.fps = fps.toFixed(1);
        root.dataset.drawCalls = String(renderer.info.render.calls);
        root.dataset.triangles = String(renderer.info.render.triangles);
        if (fps < 26 && effectiveQuality !== "Mobile") {
          effectiveQuality = "Mobile";
        }
        if (fps < 26 && adaptive > 0.6) {
          adaptive -= 0.15;
          renderer.setPixelRatio(
            Math.max(0.65, Math.min(window.devicePixelRatio, 1.5) * adaptive),
          );
        }
        frames = 0;
        fpsStart = now;
      }
    }
    frame();
    return () => {
      gone = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      window.removeEventListener("replisome-camera", cameraCommand);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", select);
      renderer.domElement.removeEventListener("dblclick", focus);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("webglcontextrestored", restored);
      dispose(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      ref={container}
      className="molecular-canvas"
      data-testid="molecular-canvas"
    />
  );
}
