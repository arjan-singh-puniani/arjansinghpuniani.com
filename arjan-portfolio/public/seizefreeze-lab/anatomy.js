import { GLTFLoader } from "/pit-stop-lab/vendor/GLTFLoader.js";

/** Registered HRA brain and head skin; all returned coordinates are millimeters. */
export async function createAnatomy(T, options = {}) {
  const loaded = await new GLTFLoader().loadAsync(new URL("./assets/brain-cortex.glb", import.meta.url).href, event => options.onProgress?.(event.total ? event.loaded / event.total : 0));
  const group = new T.Group(); group.name = "HRA reference anatomy with illustrative coverings";
  const sourceMeshes = [];
  loaded.scene.traverse(mesh => { if (mesh.isMesh) { mesh.geometry.computeVertexNormals(); sourceMeshes.push(mesh); } });
  const sourceHead = sourceMeshes.find(m => m.name === "HRA_registered_head_skin_display");
  const sourceTarget = sourceMeshes.find(m => m.name === "Allen_superior_temporal_gyrus_L");
  if (!sourceHead || !sourceTarget) throw new Error("The attributed head or left superior temporal parcel is missing.");
  const material = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: .68, metalness: 0, side: T.DoubleSide, ...extra });
  const brainMaterial = material(0xb9a0a0, { roughness: .64 });
  const hindbrainMaterial = material(0xa9949a);
  const brain = new T.Group(); brain.name = "Atlas cerebral cortex, cerebellum and brainstem";
  const cortical = [];
  for (const source of sourceMeshes.filter(m => m !== sourceHead)) {
    const mesh = new T.Mesh(source.geometry, source.name.includes("cerebellum") ? hindbrainMaterial : brainMaterial);
    mesh.name = source.name; mesh.userData.anatomyLayer = "cortex"; mesh.userData.sourceNodes = source.userData.sourceNodes;
    brain.add(mesh); if (!source.name.includes("cerebellum")) cortical.push(mesh);
  }
  group.add(brain); group.updateMatrixWorld(true);
  const targetMesh = cortical.find(m => m.name === sourceTarget.name), raycaster = new T.Raycaster();
  const targetPositions = targetMesh.geometry.attributes.position, targetNormals = targetMesh.geometry.attributes.normal;
  const desired = new T.Vector3(-64, -2, 11), target = new T.Vector3(), normal = new T.Vector3();
  let best = Infinity;
  for (let i = 0; i < targetPositions.count; i++) {
    const p = new T.Vector3().fromBufferAttribute(targetPositions, i), n = new T.Vector3().fromBufferAttribute(targetNormals, i);
    if (n.x > -.92 || p.x > -61) continue;
    const score = p.distanceToSquared(desired);
    if (score < best) { best = score; target.copy(p); normal.copy(n).normalize(); }
  }
  if (!Number.isFinite(best)) throw new Error("The illustrative lateral target is absent from the named cortical parcel.");
  const u = new T.Vector3(0, 0, 1).addScaledVector(normal, -normal.z).normalize();
  const v = new T.Vector3().crossVectors(normal, u).normalize();
  // Sample only nearby atlas triangles; raycasting the whole brain per point is wasteful.
  const localPositions = [], localNormals = [], triangleCenter = new T.Vector3(), vertex = new T.Vector3();
  for (const mesh of cortical) {
    const g = mesh.geometry, p = g.attributes.position, indices = g.index;
    for (let i = 0; i < indices.count; i += 3) {
      triangleCenter.set(0, 0, 0);
      for (let j = 0; j < 3; j++) triangleCenter.add(vertex.fromBufferAttribute(p, indices.getX(i + j)));
      triangleCenter.multiplyScalar(1 / 3).sub(target);
      if (Math.abs(triangleCenter.dot(u)) > 35 || Math.abs(triangleCenter.dot(v)) > 33 || triangleCenter.dot(normal) < -16) continue;
      for (let j = 0; j < 3; j++) {
        localPositions.push(...vertex.fromBufferAttribute(p, indices.getX(i + j)).toArray());
        localNormals.push(...vertex.fromBufferAttribute(g.attributes.normal, indices.getX(i + j)).toArray());
      }
    }
  }
  const localGeometry = new T.BufferGeometry(); localGeometry.setAttribute("position", new T.Float32BufferAttribute(localPositions, 3)); localGeometry.setAttribute("normal", new T.Float32BufferAttribute(localNormals, 3)); localGeometry.computeBoundingBox(); localGeometry.computeBoundingSphere();
  const localSampler = new T.Mesh(localGeometry, brainMaterial); localSampler.updateMatrixWorld(true);
  const windowRadius = { u: 25, v: 23 };
  const layers = Object.fromEntries(["scalp", "skull", "dura", "arachnoid", "csf", "pia", "cortex"].map(id => {
    const layer = id === "cortex" ? brain : new T.Group(); layer.name = id; layer.userData.anatomyLayer = id;
    if (id !== "cortex") group.add(layer); return [id, layer];
  }));
  const relative = new T.Vector3();
  function inWindow(point, margin = 1) {
    relative.copy(point).sub(target);
    return (relative.dot(u) / windowRadius.u) ** 2 + (relative.dot(v) / windowRadius.v) ** 2 < margin && relative.dot(normal) > -12;
  }
  function holeMaterial(color, extra) {
    const mat = material(color, extra);
    mat.onBeforeCompile = shader => {
      shader.uniforms.sfTarget = { value: target }; shader.uniforms.sfU = { value: u }; shader.uniforms.sfV = { value: v }; shader.uniforms.sfNormal = { value: normal };
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 sfPosition;").replace("#include <begin_vertex>", "#include <begin_vertex>\nsfPosition=position;");
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 sfPosition; uniform vec3 sfTarget,sfU,sfV,sfNormal;").replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>\nvec3 sfDelta=sfPosition-sfTarget; vec2 sfUV=vec2(dot(sfDelta,sfU)/${windowRadius.u.toFixed(1)},dot(sfDelta,sfV)/${windowRadius.v.toFixed(1)}); float sfEllipse=dot(sfUV,sfUV); if(sfEllipse<1.0 && dot(sfDelta,sfNormal)>-12.0)discard;`);
    };
    mat.customProgramCacheKey = () => "sf-reference-anatomy-window-v1"; return mat;
  }
  function offsetGeometry(geometry, distance, recomputeNormals = true) {
    const result = geometry.clone(), p = result.attributes.position, n = result.attributes.normal;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + distance * n.getX(i), p.getY(i) + distance * n.getY(i), p.getZ(i) + distance * n.getZ(i));
    p.needsUpdate = true; if (recomputeNormals) result.computeVertexNormals(); return result;
  }
  function add(layer, geometry, mat, name) {
    const mesh = new T.Mesh(geometry, mat); mesh.name = name; mesh.userData.anatomyLayer = layer.name; layer.add(mesh); return mesh;
  }
  const headForSampling = new T.Mesh(sourceHead.geometry, material(0xffffff)); headForSampling.updateMatrixWorld(true);
  const headSamples = new Map(), brainSamples = new Map();
  function sampleSurface(a, b, meshes, offset = 0) {
    const head = meshes[0] === headForSampling, cache = head ? headSamples : brainSamples, key = `${a}:${b}`;
    let sample = cache.get(key);
    if (!sample) {
      const origin = target.clone().addScaledVector(u, a).addScaledVector(v, b).addScaledVector(normal, 150);
      raycaster.set(origin, normal.clone().negate());
      const hit = raycaster.intersectObjects(meshes, false)[0];
      sample = {
        point: hit ? hit.point.clone() : target.clone().addScaledVector(u, a).addScaledVector(v, b),
        normal: hit && head ? (hit.normal ?? hit.face.normal).clone().normalize() : normal,
      };
      cache.set(key, sample);
    }
    return sample.point.clone().addScaledVector(sample.normal, offset);
  }
  function cap(meshes, offset, radiusU = windowRadius.u, radiusV = windowRadius.v, rings = 10) {
    const points = [], indices = [], segments = 64;
    const center = sampleSurface(0, 0, meshes, offset); points.push(...center.toArray());
    for (let ring = 1; ring <= rings; ring++) for (let i = 0; i < segments; i++) {
      const angle = i / segments * Math.PI * 2, radius = ring / rings;
      points.push(...sampleSurface(Math.cos(angle) * radiusU * radius, Math.sin(angle) * radiusV * radius, meshes, offset).toArray());
    }
    for (let i = 0; i < segments; i++) indices.push(0, 1 + i, 1 + (i + 1) % segments);
    for (let ring = 1; ring < rings; ring++) for (let i = 0; i < segments; i++) {
      const a = 1 + (ring - 1) * segments + i, b = 1 + (ring - 1) * segments + (i + 1) % segments, c = a + segments, d = b + segments;
      indices.push(a, c, b, b, c, d);
    }
    const geometry = new T.BufferGeometry(); geometry.setAttribute("position", new T.Float32BufferAttribute(points, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
  }
  function edgeWall(surface, outerOffset, innerOffset, mat, layer) {
    const points = [], indices = [], count = 96;
    for (let i = 0; i <= count; i++) {
      const angle = i / count * Math.PI * 2;
      const a = Math.cos(angle) * windowRadius.u, b = Math.sin(angle) * windowRadius.v;
      points.push(...sampleSurface(a, b, surface, outerOffset).toArray(), ...sampleSurface(a, b, surface, innerOffset).toArray());
      if (i < count) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.Float32BufferAttribute(points, 3)); geo.setIndex(indices); geo.computeVertexNormals();
    return add(layer, geo, mat, "Diagrammatic window edge");
  }
  const scalpMat = material(0xc4b8a5, { roughness: .86, emissive: 0x8c806a, emissiveIntensity: .22 });
  const boneMat = material(0xd4cfb7, { roughness: .9, emissive: 0x9a9479, emissiveIntensity: .22 });
  const duraMat = material(0xb5b4ba, { roughness: .8, emissive: 0x747a8b, emissiveIntensity: .20 });
  const arachnoidMat = material(0xc6d9d7, { transparent: true, opacity: .29, depthWrite: false, roughness: .3 });
  const piaMat = material(0xc6aab8, { transparent: true, opacity: .08, depthWrite: false, roughness: .45 });
  const surroundings = [
    [layers.scalp, 0, holeMaterial(0xc4b8a5, { roughness: .86 }), "Registered HRA skin with explanatory window"],
    [layers.skull, -4, holeMaterial(0xd4cfb7, { roughness: .9 }), "Illustrative outer skull envelope"],
    [layers.skull, -9, holeMaterial(0xb5ad94, { roughness: .9 }), "Illustrative inner skull envelope"],
    [layers.dura, -10.3, holeMaterial(0xb5b4ba, { roughness: .8 }), "Illustrative dura envelope"],
  ];
  for (const [layer, offset, mat, name] of surroundings) {
    const mesh = add(layer, offsetGeometry(sourceHead.geometry, offset), mat, name);
    mesh.raycast = function(ray, intersections) {
      const raw = []; T.Mesh.prototype.raycast.call(this, ray, raw);
      raw.forEach(h => { if (!inWindow(this.worldToLocal(h.point.clone()))) intersections.push(h); });
    };
  }
  edgeWall([headForSampling], -4, -9, boneMat, layers.skull);
  edgeWall([headForSampling], 0, -4, scalpMat, layers.scalp);
  const scalpCap = cap([headForSampling], .15), boneCap = cap([headForSampling], -4), innerBoneCap = cap([headForSampling], -9), duraCap = cap([headForSampling], -10.2);
  const flaps = [];
  function flap(layer, geometries, mat, start, end, angle, lift, fan = 0) {
    const pivot = new T.Group(), hinge = target.clone().addScaledVector(v, windowRadius.v + 1);
    pivot.position.copy(hinge); layer.add(pivot);
    geometries.forEach(geo => { const mesh = new T.Mesh(geo, mat); mesh.position.copy(hinge).negate(); mesh.userData.anatomyLayer = layer.name; mesh.name = `${layer.name} explanatory local flap`; pivot.add(mesh); });
    flaps.push({ pivot, hinge, start, end, angle, lift, fan, id: layer.name }); return pivot;
  }
  flap(layers.scalp, [scalpCap], scalpMat, 0, .32, -2.6, 7, -4);
  const boneFlap = flap(layers.skull, [boneCap, innerBoneCap], boneMat, .12, .53, -2.05, 4);
  const boneFlapEdge = edgeWall([headForSampling], -4, -9, boneMat, layers.skull);
  boneFlap.add(boneFlapEdge); boneFlapEdge.position.copy(boneFlap.position).negate();
  flap(layers.dura, [duraCap], duraMat, .31, .72, -1.6, 2, 4);
  // Arachnoid bridges the sulci; this smooth cap is not a second cortical mesh.
  const arachnoidGeo = cap([localSampler], 1.6, 24.7, 22.7, 8);
  const aPositions = arachnoidGeo.attributes.position;
  const depths = Array.from({ length: aPositions.count }, (_, i) => new T.Vector3().fromBufferAttribute(aPositions, i).sub(target).dot(normal));
  const smoothDepth = Math.min(3, Math.max(...depths.filter(Number.isFinite)) - .8);
  for (let i = 0; i < aPositions.count; i++) {
    const p = new T.Vector3().fromBufferAttribute(aPositions, i), d = p.clone().sub(target).dot(normal);
    p.addScaledVector(normal, smoothDepth - d); aPositions.setXYZ(i, ...p.toArray());
  }
  arachnoidGeo.computeVertexNormals();
  flap(layers.arachnoid, [arachnoidGeo], arachnoidMat, .6, 1, -1.6, 1);
  // Pia retains the real gyral/sulcal shape and remains attached throughout.
  add(layers.pia, offsetGeometry(localGeometry, .13, false), piaMat, "Pia follows atlas cortical folds; illustrative sheet");
  const contactMaterial = material(0x9698b7, { transparent: true, opacity: .32, depthWrite: false, roughness: .4 });
  const contactPositions = [], contactIndices = [], contactSegments = 12;
  for (let y = 0; y <= contactSegments; y++) for (let x = 0; x <= contactSegments; x++) contactPositions.push(...sampleSurface(x / contactSegments * 10 - 5, y / contactSegments * 10 - 5, [localSampler], .25).toArray());
  for (let y = 0; y < contactSegments; y++) for (let x = 0; x < contactSegments; x++) { const a = y * (contactSegments + 1) + x, b = a + contactSegments + 1; contactIndices.push(a, b, a + 1, a + 1, b, b + 1); }
  const contactGeometry = new T.BufferGeometry(); contactGeometry.setAttribute("position", new T.Float32BufferAttribute(contactPositions, 3)); contactGeometry.setIndex(contactIndices); contactGeometry.computeVertexNormals();
  const contact = add(layers.pia, contactGeometry, contactMaterial, "Illustrative 10 × 10 mm contact zone; no calculated lateral spread");
  const ringPoints = [];
  for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2; ringPoints.push(sampleSurface(Math.cos(a) * 7.4, Math.sin(a) * 7.4, [localSampler], .35)); }
  const ring = new T.Line(new T.BufferGeometry().setFromPoints(ringPoints), new T.LineBasicMaterial({ color: 0xb9a9d6, transparent: true, opacity: .8 }));
  ring.name = "Illustrative contact locator"; ring.userData.anatomyLayer = "pia"; layers.pia.add(ring);
  // CSF is a space, not an independent thick tissue slab or a cooling result.
  const csfPoints = [sampleSurface(-19, -15, [localSampler], .4), sampleSurface(-19, -15, [localSampler], 2.0)];
  const csf = new T.Line(new T.BufferGeometry().setFromPoints(csfPoints), new T.LineBasicMaterial({ color: 0x9ac4ca }));
  csf.userData.anatomyLayer = "csf"; csf.name = "Subarachnoid CSF space marker; exaggerated"; layers.csf.add(csf);
  const info = {
    targetName: "Left superior temporal gyrus", targetMesh: sourceTarget.name, targetDescription: "Illustrative lateral neocortical target on a reference atlas. Not a diagnosed seizure focus or proposed surgical location.",
    units: "mm", axes: "+X right; +Y superior; +Z anterior", attribution: "Kristen Browne; Heidi Schlehlein / HuBMAP, CC BY 4.0. HRA Brain Male v1.3 and United Male v1.5, derived display geometry.",
    sourceBrain: "https://doi.org/10.48539/HBM929.XKCL.339", sourceHead: "https://doi.org/10.48539/HBM646.RKKC.257",
    sourceRecord: "/atlas/anatomy/HRA-BRAIN-SOURCE.md", headSourceRecord: "/atlas/anatomy/HRA-BODY-SOURCE.md",
    limitations: "Reference atlas, mirrored cerebral structures; no patient anatomy. Skin is registered HRA geometry. Skull/dura are explanatory inward offsets from skin, not segmented bone or meninges. Arachnoid bridges; pia retains local atlas folds. Covering thicknesses, gaps, flaps, window and CSF marker are exaggerated schematic choices. Surrounding head transparency reveals context; this is not medical imaging. Placement above or below dura remains unresolved. Peeling is an educational reveal, not a surgical sequence. The 1D thermal model predicts no lateral field or affected volume.",
    stages: ["scalp", "skull", "dura", "arachnoid", "subarachnoid CSF space", "pia on cortex"], peel: 0, context: options.context ?? "region",
  };
  function updateContext() {
    const showCoverings = info.context === "region" || info.context === "head";
    for (const id of ["scalp", "skull", "dura", "arachnoid", "csf"]) layers[id].visible = showCoverings;
    const reveal = info.context === "head" ? 0 : T.MathUtils.smoothstep(info.peel, .12, .72);
    surroundings.forEach(([layer, , mat]) => {
      const endpoint = layer === layers.scalp ? .10 : layer === layers.skull ? .025 : .02;
      const opacity = 1 - (1 - endpoint) * reveal, transparent = opacity < .999;
      if (mat.transparent !== transparent) { mat.transparent = transparent; mat.needsUpdate = true; }
      mat.opacity = opacity; mat.depthWrite = !transparent; mat.forceSinglePass = true;
    });
  }
  function setContext(name) { info.context = ["region", "system", "interface", "head"].includes(name) ? name : "region"; updateContext(); }
  function peel(progress) {
    const p = T.MathUtils.clamp(Number.isFinite(Number(progress)) ? Number(progress) : 0, 0, 1); info.peel = p;
    flaps.forEach(f => { const t = T.MathUtils.smoothstep(p, f.start, f.end); f.pivot.quaternion.setFromAxisAngle(u, t * f.angle); f.pivot.position.copy(f.hinge).addScaledVector(normal, t * f.lift).addScaledVector(u, t * f.fan); f.pivot.userData.reveal = t; });
    updateContext(); group.updateMatrixWorld(true);
  }
  peel(options.peel ?? .86);
  const fullBounds = new T.Box3().setFromObject(group), focusPoint = target.clone().addScaledVector(normal, 7);
  function dispose() {
    const geometries = new Set(), materials = new Set();
    group.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); headForSampling.material.dispose(); localGeometry.dispose(); sourceHead.geometry.dispose();
    sourceMeshes.forEach(m => m.material?.dispose()); headSamples.clear(); brainSamples.clear(); group.removeFromParent();
  }
  return { group, target, normal, u, v, focusPoint, fullBounds, layers, peel, setContext, info, contact,
    setTemperature(value) { const t = Number(value); contactMaterial.color.set(0x9698b7); if (Number.isFinite(t)) contactMaterial.color.lerp(new T.Color(t <= 37 ? 0x76d5de : 0xd7ac7d), Math.min(Math.abs(t - 37) / 9, .85)); },
    dispose,
  };
}
