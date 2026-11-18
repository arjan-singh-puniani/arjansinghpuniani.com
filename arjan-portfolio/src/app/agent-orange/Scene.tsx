"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const regions = ["Brain", "Substantia nigra", "Striatum", "Dopamine pathway", "Subcortical atlas", "2,4-D molecule", "2,4,5-T molecule", "TCDD molecule"] as const;
type Region = (typeof regions)[number];

export function Scene({ region, reducedMotion }: { region: Region; reducedMotion: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const selected = useRef<Region>(region);
  const motion = useRef(reducedMotion);

  useEffect(() => { selected.current = region; }, [region]);
  useEffect(() => { motion.current = reducedMotion; }, [reducedMotion]);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { root.dataset.webgl = "unavailable"; return; }
    root.dataset.webgl = "ready";
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    root.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, root.clientWidth / root.clientHeight, 0.1, 50);
    camera.position.set(0, 0, 8);
    const group = new THREE.Group();
    scene.add(group);
    const moleculeAssets: [Region, string][] = [["2,4-D molecule", "2-4-d"], ["2,4,5-T molecule", "2-4-5-t"], ["TCDD molecule", "tcdd"]];
    const molecules = new Map<Region, THREE.Group>();
    for (const [label, slug] of moleculeAssets) {
      const model = new THREE.Group();
      model.visible = false;
      molecules.set(label, model);
      scene.add(model);
      new GLTFLoader().load(`/agent-orange/${slug}-pubchem.glb`, gltf => { model.add(gltf.scene); }, undefined, () => { root.dataset.molecule = "unavailable"; });
    }
    const atlas = new THREE.Group();
    atlas.visible = false;
    scene.add(atlas);
    new GLTFLoader().load("/agent-orange/cit168-subcortical.glb", gltf => {
      const bounds = new THREE.Box3().setFromObject(gltf.scene);
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 4.5 / bounds.getSize(new THREE.Vector3()).length();
      gltf.scene.scale.setScalar(scale);
      gltf.scene.position.copy(center).multiplyScalar(-scale);
      gltf.scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        const name = object.name.toLowerCase();
        const color = name.includes("substantia nigra") ? 0xffbd62 : name.includes("putamen") ? 0x5eb7b3 : 0x8299c8;
        object.material = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02, transparent: true, opacity: 0.82 });
      });
      atlas.add(gltf.scene);
    }, undefined, () => { root.dataset.atlas = "unavailable"; });
    scene.add(new THREE.HemisphereLight(0xc8d8e7, 0x171419, 2));
    const key = new THREE.DirectionalLight(0xffd7a0, 3.2);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const material = (color: number, roughness = 0.48) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.04 });
    const brainMaterial = material(0x8d7376);
    const brainLeft = new THREE.Mesh(new THREE.SphereGeometry(1.45, 56, 40), brainMaterial);
    brainLeft.scale.set(0.82, 1, 0.72);
    brainLeft.position.x = -0.73;
    const brainRight = brainLeft.clone();
    brainRight.position.x = 0.73;
    group.add(brainLeft, brainRight);
    const midbrain = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 24), material(0x5e687b));
    midbrain.position.set(0, -1.02, 0.4);
    group.add(midbrain);
    const nigra = new THREE.Mesh(new THREE.SphereGeometry(0.16, 28, 20), material(0xd69a46, 0.3));
    nigra.scale.set(1.5, 0.6, 0.7);
    nigra.position.set(0, -0.99, 0.72);
    group.add(nigra);
    const striatum = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 24), material(0x62b7b1, 0.32));
    striatum.scale.set(1.2, 0.8, 0.7);
    striatum.position.set(0, -0.05, 0.84);
    group.add(striatum);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.91, 0.8), new THREE.Vector3(0.1, -0.54, 0.92), new THREE.Vector3(0, -0.15, 0.92)]);
    const pathway = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.025, 8, false), material(0xffc35e, 0.26));
    group.add(pathway);
    const sceneMeshes = { Brain: [brainLeft, brainRight], "Substantia nigra": [nigra], Striatum: [striatum], "Dopamine pathway": [pathway] };
    const base = new Map<THREE.Object3D, number>();
    for (const meshes of Object.values(sceneMeshes)) for (const mesh of meshes) base.set(mesh, (mesh.material as THREE.MeshStandardMaterial).color.getHex());
    let down = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (event: PointerEvent) => { down = true; lastX = event.clientX; lastY = event.clientY; renderer.domElement.setPointerCapture(event.pointerId); };
    const onMove = (event: PointerEvent) => { if (!down) return; group.rotation.y += (event.clientX - lastX) * 0.006; group.rotation.x += (event.clientY - lastY) * 0.004; lastX = event.clientX; lastY = event.clientY; };
    const onUp = () => { down = false; };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    const resize = new ResizeObserver(() => { if (!root.clientWidth) return; camera.aspect = root.clientWidth / root.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(root.clientWidth, root.clientHeight); });
    resize.observe(root);
    let raf = 0;
    const render = () => {
      for (const [name, meshes] of Object.entries(sceneMeshes)) for (const mesh of meshes) (mesh.material as THREE.MeshStandardMaterial).color.setHex(name === selected.current ? 0xffc35e : base.get(mesh)!);
      const showingMolecule = molecules.has(selected.current);
      for (const [label, model] of molecules) model.visible = selected.current === label;
      atlas.visible = ["Substantia nigra", "Striatum", "Subcortical atlas"].includes(selected.current);
      atlas.rotation.y = group.rotation.y;
      atlas.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        const name = object.name.toLowerCase();
        const matches = selected.current === "Subcortical atlas" || (selected.current === "Substantia nigra" ? name.includes("substantia nigra") : name.includes("putamen") || name.includes("caudate"));
        const material = object.material as THREE.MeshStandardMaterial;
        material.opacity = matches ? 0.92 : 0.16;
      });
      group.visible = !showingMolecule && !atlas.visible;
      if (!motion.current && !down && !showingMolecule) { group.rotation.y += 0.0008; atlas.rotation.y += 0.0008; }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();
    return () => { cancelAnimationFrame(raf); resize.disconnect(); renderer.domElement.removeEventListener("pointerdown", onDown); renderer.domElement.removeEventListener("pointermove", onMove); renderer.domElement.removeEventListener("pointerup", onUp); scene.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(item => item.dispose()); } }); renderer.dispose(); renderer.domElement.remove(); };
  }, []);

  return <div className="ao-scene" ref={host} role="img" aria-label={`Interactive 3D viewer. Selected: ${region}. Drag to rotate.`}><p className="ao-scene-note">{region.endsWith("molecule") ? "PUBCHEM 3D CONFORMER · DRAG TO ROTATE" : ["Substantia nigra", "Striatum", "Subcortical atlas"].includes(region) ? "CIT168 ATLAS · MNI TEMPLATE · DRAG TO ROTATE" : "SCHEMATIC OVERVIEW · DRAG TO ROTATE"}</p><p className="ao-webgl-fallback">3D rendering is unavailable in this browser. Continue with the evidence and anatomy notes below.</p><p className="ao-glb-fallback">A 3D asset could not load.</p></div>;
}

export { regions };
