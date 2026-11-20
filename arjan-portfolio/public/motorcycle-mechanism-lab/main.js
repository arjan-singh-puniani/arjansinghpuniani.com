import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { assemblies, classifyAssembly, clamp, dentWeight, releaseVelocity, stepMotion } from "./mechanics.js";

const $ = id => document.getElementById(id);
const host = $("scene");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const parts = new Map();
const actions = [];
const started = performance.now();
let renderer, scene, camera, orbit, bike, selected, drag, mode = "orbit", separation = 0;
let dirty = true, visible = true, previousFrame = 0, ready = false;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const worldBox = new THREE.Box3();
const vertex = new THREE.Vector3();
const own = part => part.meshes;

function announce(text) { $("interaction-status").textContent = text; }

function record(type, part, detail = {}) {
  actions.push({ elapsedMs: Math.round(performance.now() - started), type, assembly: part?.id ?? null, ...detail });
  if (actions.length > 100) actions.shift();
  $("record-count").textContent = String(actions.length);
  $("action-log").replaceChildren(...[...actions].reverse().map(action => {
    const li = document.createElement("li");
    li.textContent = `${(action.elapsedMs / 1000).toFixed(1)}s · ${action.type}${action.assembly ? ` · ${parts.get(action.assembly).name}` : ""}`;
    return li;
  }));
  $("export-record").disabled = false;
}

function setMode(value) {
  mode = value;
  host.dataset.mode = value;
  orbit.enabled = value === "orbit";
  for (const button of document.querySelectorAll("button[data-mode]")) button.setAttribute("aria-pressed", String(button.dataset.mode === value));
  $("scene-mode").textContent = { orbit: "01 / Orbit", pull: "02 / Pull apart", dent: "03 / Dent" }[value];
  $("gesture-help").textContent = {
    orbit: "Drag to orbit. Pinch or scroll to inspect.",
    pull: "Grab an assembly. Pull farther to release its connection.",
    dent: "Touch a surface and drag downward to deepen a local dent.",
  }[value];
}

function updateInspector() {
  if (!selected) return;
  const part = selected;
  $("part-select").value = part.id;
  $("part-description").textContent = part.description;
  const state = part.id === "frame" ? "Anchored" : part.released ? "Released" : part.offset.length() > .005 ? "Pulled" : "Attached";
  $("connection-state").textContent = state;
  $("connection-state").dataset.released = String(part.released);
  $("edited-count").textContent = String([...parts.values()].reduce((sum,item) => sum + item.editedSurfaces,0));
  $("pull").disabled = part.released || part.id === "frame";
  $("detach").disabled = part.released || part.id === "frame";
  $("pull").value = String(part.pullAmount);
  $("pull-value").textContent = `${part.pullAmount}%`;
  $("dent").value = String(part.dentAmount);
  $("dent-value").textContent = `${part.dentAmount}%`;
}

function selectPart(part) {
  selected = part;
  for (const item of parts.values()) for (const mesh of own(item)) {
    mesh.material.emissive.copy(mesh.userData.emissive);
    mesh.material.emissiveIntensity = mesh.userData.emissiveIntensity;
    if (item === part) { mesh.material.emissive.set(0x47bda9); mesh.material.emissiveIntensity = .12; }
  }
  updateInspector();
  dirty = true;
}

function ancestorNames(object) {
  const names = [];
  for (let parent = object.parent; parent; parent = parent.parent) names.push(parent.name);
  return names.join("/");
}

function splitSurface(geometry, object) {
  const sourcePosition = object.geometry.attributes.position;
  const skinIndex = object.geometry.attributes.skinIndex;
  const skinWeight = object.geometry.attributes.skinWeight;
  const vertexParts = Array.from({ length: sourcePosition.count },(_,index) => {
    let ancestry = ancestorNames(object);
    if (object.isSkinnedMesh && skinIndex && skinWeight) {
      const weights = [skinWeight.getX(index),skinWeight.getY(index),skinWeight.getZ(index),skinWeight.getW(index)];
      const joint = weights.indexOf(Math.max(...weights));
      const boneIndex = [skinIndex.getX(index),skinIndex.getY(index),skinIndex.getZ(index),skinIndex.getW(index)][joint];
      const bone = object.skeleton.bones[boneIndex];
      if (bone) ancestry = `${ancestorNames(bone)}/${bone.name}`;
    }
    return classifyAssembly(object.name,ancestry,object.material.name);
  });
  const faces = new Map();
  const count = geometry.index?.count ?? sourcePosition.count;
  for (let index = 0; index < count; index += 3) {
    const triangle = [0,1,2].map(offset => geometry.index ? geometry.index.getX(index + offset) : index + offset);
    const ids = triangle.map(vertex => vertexParts[vertex]);
    const id = ids[1] === ids[2] ? ids[1] : ids[0];
    if (!faces.has(id)) faces.set(id,[]);
    faces.get(id).push(...triangle);
  }
  return [...faces].map(([id,indices]) => {
    const unique = [...new Set(indices)];
    const remap = new Map(unique.map((index,offset) => [index,offset]));
    const result = new THREE.BufferGeometry();
    const getters = ["getX","getY","getZ","getW"];
    for (const [name,attribute] of Object.entries(geometry.attributes)) {
      const array = new Float32Array(unique.length * attribute.itemSize);
      unique.forEach((index,offset) => { for (let component = 0; component < attribute.itemSize; component++) array[offset * attribute.itemSize + component] = attribute[getters[component]](index); });
      result.setAttribute(name,new THREE.BufferAttribute(array,attribute.itemSize));
    }
    result.setIndex(indices.map(index => remap.get(index)));
    result.computeBoundingBox(); result.computeBoundingSphere();
    return { id,geometry: result };
  });
}

function assembleModel(source) {
  source.updateMatrixWorld(true);
  source.traverse(object => { if (object.isSkinnedMesh) object.skeleton.update(); });
  const sourceBox = new THREE.Box3().setFromObject(source);
  const sourceCenter = sourceBox.getCenter(new THREE.Vector3());
  const meshes = [];
  let triangles = 0;
  source.traverse(object => {
    if (!object.isMesh) return;
    const geometry = object.geometry.clone();
    const position = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
    for (let index = 0; index < position.count; index++) {
      object.getVertexPosition(index,vertex).applyMatrix4(object.matrixWorld);
      position.setXYZ(index,vertex.x - sourceCenter.x,vertex.y - sourceBox.min.y,vertex.z - sourceCenter.z);
      if (normal) {
        vertex.fromBufferAttribute(normal,index).applyNormalMatrix(normalMatrix);
        normal.setXYZ(index,vertex.x,vertex.y,vertex.z);
      }
    }
    geometry.deleteAttribute("skinIndex");
    geometry.deleteAttribute("skinWeight");
    if (!normal) geometry.computeVertexNormals();
    geometry.deleteAttribute("tangent");
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    for (const piece of splitSurface(geometry,object)) {
      const material = object.material.clone();
      material.fog = false;
      const mesh = new THREE.Mesh(piece.geometry,material);
      mesh.name = object.name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const definition = assemblies.find(item => item.id === piece.id);
      if (!parts.has(piece.id)) parts.set(piece.id,{ ...definition, group: new THREE.Group(), meshes: [], home: new THREE.Vector3(), base: new THREE.Vector3(), offset: new THREE.Vector3(), velocity: new THREE.Vector3(), restRotation: new THREE.Quaternion(), released: false, moving: false, pullAmount: 0, dentAmount: 0, dentEdit: null, editedSurfaces: 0 });
      const part = parts.get(piece.id);
      mesh.userData.assembly = piece.id;
      mesh.userData.emissive = material.emissive.clone();
      mesh.userData.emissiveIntensity = material.emissiveIntensity;
      part.meshes.push(mesh);
      meshes.push(mesh);
    }
    geometry.dispose();
    triangles += (geometry.index?.count ?? position.count) / 3;
  });
  bike = new THREE.Group();
  scene.add(bike);
  for (const part of parts.values()) {
    const box = new THREE.Box3();
    for (const mesh of own(part)) box.union(mesh.geometry.boundingBox);
    box.getCenter(part.home);
    part.group.name = part.id;
    for (const mesh of own(part)) {
      mesh.geometry.translate(-part.home.x,-part.home.y,-part.home.z);
      mesh.userData.original = new Float32Array(mesh.geometry.attributes.position.array);
      mesh.userData.originalNormals = new Float32Array(mesh.geometry.attributes.normal.array);
      part.group.add(mesh);
    }
  }
  for (const part of parts.values()) {
    const parent = parts.get(part.parent);
    (parent?.group ?? bike).add(part.group);
    part.base.copy(part.home).sub(parent?.home ?? new THREE.Vector3());
    part.group.position.copy(part.base);
  }
  bike.updateMatrixWorld(true);
  worldBox.setFromObject(bike);
  bike.position.y -= worldBox.min.y;
  bike.updateMatrixWorld(true);
  return { surfaces: meshes.length, triangles: Math.round(triangles) };
}

function placeAttached(part, snap = false) {
  if (part.released) return false;
  const target = part.base.clone().add(part.offset).addScaledVector(new THREE.Vector3(...part.spread),separation);
  const moving = part.group.position.distanceToSquared(target) > .0000001;
  if (moving) part.group.position.lerp(target,snap || reducedMotion.matches ? 1 : .2);
  return moving;
}

function fitView(view = "three-quarter") {
  bike.updateMatrixWorld(true);
  const inspected = view === "cockpit" ? parts.get("cockpit") : null;
  const visibleParts = inspected ? [inspected] : [...parts.values()];
  const box = new THREE.Box3();
  for (const part of visibleParts) for (const mesh of own(part)) box.expandByObject(mesh);
  const target = box.getCenter(new THREE.Vector3());
  const direction = inspected ? new THREE.Vector3(.08,.42,-1) : view === "side" ? new THREE.Vector3(1,.15,0) : view === "current" ? camera.position.clone().sub(orbit.target) : new THREE.Vector3(1,.28,.7);
  direction.normalize();
  camera.position.copy(target).add(direction);
  camera.lookAt(target);
  const inverseRotation = camera.quaternion.clone().invert();
  const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let distance = .5;
  for (const part of visibleParts) for (const mesh of own(part)) {
    const position = mesh.geometry.attributes.position;
    const step = Math.max(1,Math.floor(position.count / 300));
    for (let index = 0; index < position.count; index += step) {
      vertex.fromBufferAttribute(position,index).applyMatrix4(mesh.matrixWorld).sub(target).applyQuaternion(inverseRotation);
      distance = Math.max(distance,Math.abs(vertex.x) / (tangent * camera.aspect * .9) + vertex.z,Math.abs(vertex.y) / (tangent * .77) + vertex.z);
    }
  }
  camera.position.copy(target).addScaledVector(direction,distance);
  orbit.target.copy(target);
  orbit.update();
  dirty = true;
}

function releasePart(part, velocity = [.15,.4,.1], source = "button") {
  if (part.released || part.id === "frame") return;
  bike.attach(part.group);
  part.released = true;
  part.moving = true;
  part.velocity.fromArray(velocity);
  part.restRotation.setFromEuler(new THREE.Euler(.12,0,Math.PI/2));
  if (reducedMotion.matches) {
    part.group.quaternion.copy(part.restRotation);
    const box = new THREE.Box3().setFromObject(part.group);
    part.group.position.y -= box.min.y;
    part.velocity.set(0,0,0);
    part.moving = false;
  }
  record("connection released",part,{ source });
  announce(`${part.name} released. Attached child assemblies travel with it.`);
  updateInspector();
  dirty = true;
}

function restorePart(part) {
  const parent = parts.get(part.parent);
  (parent?.group ?? bike).add(part.group);
  part.group.position.copy(part.base);
  part.group.quaternion.identity();
  part.offset.set(0,0,0);
  part.velocity.set(0,0,0);
  part.released = false;
  part.moving = false;
  part.pullAmount = part.dentAmount = part.editedSurfaces = 0;
  part.dentEdit = null;
  for (const mesh of own(part)) {
    mesh.geometry.attributes.position.array.set(mesh.userData.original);
    refreshGeometry(mesh,true);
  }
  placeAttached(part,true);
}

function restoreTree(part) {
  restorePart(part);
  for (const child of parts.values()) if (child.parent === part.id) restoreTree(child);
}

function refreshGeometry(mesh, restoreNormals = false) {
  mesh.geometry.attributes.position.needsUpdate = true;
  if (restoreNormals) {
    mesh.geometry.attributes.normal.array.set(mesh.userData.originalNormals);
    mesh.geometry.attributes.normal.needsUpdate = true;
  } else mesh.geometry.computeVertexNormals();
  mesh.geometry.computeBoundingBox();
  mesh.geometry.computeBoundingSphere();
}

function beginDent(part, worldPoint, worldNormal) {
  part.group.updateWorldMatrix(true,false);
  const inverse = part.group.matrixWorld.clone().invert();
  part.dentEdit = {
    center: worldPoint.clone().applyMatrix4(inverse),
    normal: worldNormal.clone().transformDirection(inverse),
    radius: .3,
    base: own(part).map(mesh => new Float32Array(mesh.geometry.attributes.position.array)),
  };
  part.dentAmount = 0;
}

function centeredDent(part) {
  part.group.updateWorldMatrix(true,true);
  const center = new THREE.Box3().setFromObject(part.group).getCenter(new THREE.Vector3());
  let best, bestDistance = Infinity;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (const mesh of own(part)) {
    const geometry = mesh.geometry, position = geometry.attributes.position;
    const count = geometry.index?.count ?? position.count;
    const step = Math.max(3,Math.floor(count / 900) * 3);
    for (let index = 0; index < count; index += step) {
      const indices = [0,1,2].map(offset => geometry.index ? geometry.index.getX(index + offset) : index + offset);
      a.fromBufferAttribute(position,indices[0]).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(position,indices[1]).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(position,indices[2]).applyMatrix4(mesh.matrixWorld);
      const point = a.clone().add(b).add(c).multiplyScalar(1/3);
      const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
      if (normal.dot(camera.position.clone().sub(point)) <= 0) continue;
      const distance = point.distanceToSquared(center);
      if (distance < bestDistance) { bestDistance = distance; best = { point,normal }; }
    }
  }
  if (!best) return false;
  beginDent(part,best.point,best.normal);
  return true;
}

function deform(part, amount) {
  if (!part.dentEdit && !centeredDent(part)) return;
  const edit = part.dentEdit;
  let changed = 0;
  own(part).forEach((mesh,meshIndex) => {
    const position = mesh.geometry.attributes.position;
    const original = edit.base[meshIndex];
    let affected = false;
    for (let index = 0; index < position.count; index++) {
      vertex.fromArray(original,index * 3);
      const weight = dentWeight(vertex.distanceTo(edit.center),edit.radius);
      const crease = 1 + .15 * Math.sin((vertex.x - edit.center.x) * 35) * amount / 100;
      vertex.addScaledVector(edit.normal,-.24 * amount / 100 * weight * crease);
      position.setXYZ(index,vertex.x,vertex.y,vertex.z);
      if (Math.abs(vertex.x - mesh.userData.original[index * 3]) + Math.abs(vertex.y - mesh.userData.original[index * 3 + 1]) + Math.abs(vertex.z - mesh.userData.original[index * 3 + 2]) > .000001) affected = true;
    }
    if (affected) changed++;
    refreshGeometry(mesh);
  });
  part.dentAmount = amount;
  part.editedSurfaces = changed;
  updateInspector();
  dirty = true;
}

function hitAt(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,-(event.clientY - rect.top) / rect.height * 2 + 1);
  raycaster.setFromCamera(pointer,camera);
  bike.updateMatrixWorld(true);
  return raycaster.intersectObject(bike,true).find(hit => hit.object.userData.assembly);
}

function pointerDown(event) {
  if (!ready || mode === "orbit" || !event.isPrimary || event.button !== 0) return;
  const hit = hitAt(event);
  if (!hit) return;
  const part = parts.get(hit.object.userData.assembly);
  selectPart(part);
  if (mode === "pull" && part.id === "frame") { announce("The main frame is anchored. Choose an attached assembly, or switch to Dent."); return; }
  if (part.moving) part.moving = false;
  const normal = camera.getWorldDirection(new THREE.Vector3());
  drag = { id: event.pointerId, pointerType: event.pointerType, part, point: hit.point.clone(), normal: hit.face.normal.clone().transformDirection(hit.object.matrixWorld), startY: event.clientY, time: performance.now(), plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal,hit.point), worldStart: part.group.getWorldPosition(new THREE.Vector3()), end: hit.point.clone(), offset: part.offset.clone() };
  if (mode === "dent") beginDent(part,hit.point,drag.normal);
  renderer.domElement.setPointerCapture(event.pointerId);
}

function pointerMove(event) {
  if (!drag || event.pointerId !== drag.id) return;
  const part = drag.part;
  if (mode === "dent") {
    deform(part,Math.round(clamp((event.clientY - drag.startY) / 1.4,0,100)));
    return;
  }
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,-(event.clientY - rect.top) / rect.height * 2 + 1);
  raycaster.setFromCamera(pointer,camera);
  const point = raycaster.ray.intersectPlane(drag.plane,new THREE.Vector3());
  if (!point) return;
  drag.end.copy(point);
  const delta = point.clone().sub(drag.point).clampLength(0,1.5);
  if (!part.released && delta.length() > .48) releasePart(part,[0,0,0],"pointer travel");
  if (part.released) {
    part.moving = false;
    part.group.position.copy(drag.worldStart).add(delta);
    worldBox.setFromObject(part.group);
    if (worldBox.min.y < .01) part.group.position.y += .01 - worldBox.min.y;
  } else {
    const distance = delta.length();
    part.offset.copy(drag.offset).add(delta.transformDirection(part.group.parent.matrixWorld.clone().invert()).multiplyScalar(distance));
    placeAttached(part,true);
  }
  part.pullAmount = Math.round(clamp(point.distanceTo(drag.point) / .48 * 100,0,100));
  updateInspector();
  dirty = true;
}

function endDrag(event, cancelled = false) {
  if (!drag || event.pointerId !== drag.id) return;
  const gesture = drag;
  drag = null;
  const part = gesture.part;
  if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
  if (mode === "dent") {
    if (part.dentAmount > 0) record("local deformation",part,{ source: "pointer", pointerType: gesture.pointerType, amountPercent: part.dentAmount, point: gesture.point.toArray(), normal: gesture.normal.toArray(), pointFrame: "scene world", cancelled });
    announce(`${part.name}: local deformation ${part.dentAmount}%.`);
  } else if (part.released) {
    const delta = gesture.end.clone().sub(gesture.point);
    part.velocity.fromArray(cancelled ? [0,0,0] : releaseVelocity(delta.toArray(),(performance.now() - gesture.time) / 1000));
    part.moving = !reducedMotion.matches;
    if (reducedMotion.matches) { worldBox.setFromObject(part.group); part.group.position.y -= worldBox.min.y; }
    record("released assembly moved",part,{ source: "pointer", pointerType: gesture.pointerType, modelTravel: delta.length(), contactPoint: gesture.point.toArray(), pointFrame: "scene world", cancelled });
  } else {
    record("assembly pulled",part,{ source: "pointer", pointerType: gesture.pointerType, modelTravel: part.offset.length(), contactPoint: gesture.point.toArray(), pointFrame: "scene world", cancelled });
    part.offset.set(0,0,0);
    part.pullAmount = 0;
    announce(`${part.name} returned to its visual connection.`);
  }
  updateInspector();
  dirty = true;
}

function bindControls() {
  for (const button of document.querySelectorAll("button[data-mode]")) button.addEventListener("click",() => setMode(button.dataset.mode));
  for (const button of document.querySelectorAll("[data-view]")) button.addEventListener("click",() => fitView(button.dataset.view));
  $("fit-view").addEventListener("click",() => fitView("current"));
  $("part-select").addEventListener("change",event => { selectPart(parts.get(event.target.value)); announce(`${selected.name} selected.`); });
  $("explode").addEventListener("input",event => {
    separation = clamp(Number(event.target.value) / 100,0,1);
    $("explode-value").textContent = `${Math.round(separation * 100)}%`;
    for (const part of parts.values()) placeAttached(part,true);
    fitView("current");
  });
  $("explode").addEventListener("change",() => { record("assembly separation",null,{ amountPercent: Math.round(separation * 100), source: "range" }); announce(`Assembly separation: ${Math.round(separation * 100)}%.`); });
  $("pull").addEventListener("input",event => {
    if (!selected || selected.released || selected.id === "frame") return;
    const amount = clamp(Number(event.target.value),0,100);
    selected.pullAmount = amount;
    selected.offset.fromArray(selected.spread).normalize().multiplyScalar(amount / 100 * .5);
    placeAttached(selected,true);
    if (amount === 100) releasePart(selected,[.1,.2,.1],"range");
    updateInspector();
    dirty = true;
  });
  $("pull").addEventListener("change",() => { record("assembly pulled",selected,{ source: "range", amountPercent: selected.pullAmount }); if (!selected.released) announce(`${selected.name}: pull travel ${selected.pullAmount}%.`); });
  $("dent").addEventListener("input",event => deform(selected,clamp(Number(event.target.value),0,100)));
  $("dent").addEventListener("change",() => {
    record("local deformation",selected,{ source: "range", amountPercent: selected.dentAmount, modelPoint: selected.dentEdit?.center.toArray(), pointFrame: "selected assembly local" });
    announce(`${selected.name}: local deformation ${selected.dentAmount}%.`);
  });
  $("detach").addEventListener("click",() => releasePart(selected));
  $("repair").addEventListener("click",() => { restoreTree(selected); record("assembly restored",selected); announce(`${selected.name} and its child assemblies restored.`); updateInspector(); dirty = true; });
  $("reset").addEventListener("click",() => {
    separation = 0;
    $("explode").value = "0";
    $("explode-value").textContent = "0%";
    restoreTree(parts.get("frame"));
    setMode("orbit");
    selectPart(parts.get("front-fender") ?? parts.get("fork"));
    fitView();
    record("all assemblies reset",null);
    announce("The motorcycle is reassembled. All surface edits have been cleared.");
  });
  $("export-record").addEventListener("click",() => {
    bike.updateMatrixWorld(true);
    const data = { schemaVersion: 1, project: "Motorcycle Mechanism Lab", recordedAt: new Date().toISOString(), clock: "elapsed milliseconds since page initialization", historyScope: "latest 100 actions in this tab", coordinateFrame: { name: "scene world", handedness: "right", up: "+Y", units: "source model units, not a measured distance" }, asset: { title: "(FREE) Honda CRF 450", author: "Jacobdesigns", source: "https://sketchfab.com/3d-models/free-honda-crf-450-c80f0e732e844580af412958c9d67315", license: "CC BY 4.0" }, scope: "Illustrative mesh and assembly edits in model coordinates. Not measured forces, material failure, a crash reconstruction or a clinical record.", assemblySeparation: separation, actions, assemblies: [...parts.values()].map(part => ({ id: part.id, released: part.released, modelPosition: part.group.getWorldPosition(new THREE.Vector3()).toArray(), deformationSettingPercent: part.dentAmount })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{ type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "motorcycle-scene-record.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown",pointerDown);
  canvas.addEventListener("pointermove",pointerMove);
  canvas.addEventListener("pointerup",event => endDrag(event));
  canvas.addEventListener("pointercancel",event => endDrag(event,true));
  canvas.addEventListener("lostpointercapture",event => endDrag(event,true));
  canvas.addEventListener("keydown",event => {
    if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","+","-","="].includes(event.key)) return;
    event.preventDefault();
    const offset = camera.position.clone().sub(orbit.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    if (event.key === "ArrowLeft") spherical.theta -= .1;
    if (event.key === "ArrowRight") spherical.theta += .1;
    if (event.key === "ArrowUp") spherical.phi = clamp(spherical.phi - .1,.1,Math.PI - .1);
    if (event.key === "ArrowDown") spherical.phi = clamp(spherical.phi + .1,.1,Math.PI - .1);
    if (event.key === "+" || event.key === "=") spherical.radius = Math.max(.2,spherical.radius * .9);
    if (event.key === "-") spherical.radius = Math.min(12,spherical.radius * 1.1);
    camera.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(spherical));
    orbit.update(); dirty = true;
  });
}

function tick(time) {
  const dt = Math.min((time - previousFrame) / 1000 || .016,1/30);
  previousFrame = time;
  if (!visible || document.hidden || !ready) return;
  let moving = false;
  for (const part of parts.values()) {
    if (part.released && part.moving && drag?.part !== part) {
      const next = stepMotion(part.group.position.toArray(),part.velocity.toArray(),dt);
      part.group.position.fromArray(next.position);
      part.velocity.fromArray(next.velocity);
      part.group.quaternion.slerp(part.restRotation,Math.min(1,dt * 2));
      worldBox.setFromObject(part.group);
      if (worldBox.min.y < .005) {
        part.group.position.y += .005 - worldBox.min.y;
        part.velocity.y *= -.2;
        part.velocity.x *= .85;
        part.velocity.z *= .85;
        if (part.velocity.length() < .12 && part.group.quaternion.angleTo(part.restRotation) < .02) part.moving = false;
      }
      moving = true;
    } else if (placeAttached(part)) moving = true;
  }
  if (orbit.update()) dirty = true;
  if (dirty || moving) { renderer.render(scene,camera); dirty = false; }
}

async function initialize() {
  $("load-status").hidden = false;
  $("asset-stat").textContent = "Loading local model…";
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute("role","img");
  canvas.setAttribute("aria-label","Editable Honda CRF450 assembly. Arrow keys orbit; plus and minus zoom. Use the assembly controls below for keyboard editing.");
  host.prepend(canvas);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08131b);
  scene.fog = new THREE.Fog(0x08131b,5,13);
  camera = new THREE.PerspectiveCamera(34,1,.025,50);
  orbit = new OrbitControls(camera,canvas);
  orbit.enableDamping = !reducedMotion.matches;
  orbit.minDistance = .2;
  orbit.maxDistance = 12;
  orbit.maxPolarAngle = Math.PI * .9;
  orbit.addEventListener("change",() => { dirty = true; });
  reducedMotion.addEventListener("change",() => {
    orbit.enableDamping = !reducedMotion.matches;
    if (reducedMotion.matches) for (const part of parts.values()) if (part.released) {
      part.group.quaternion.copy(part.restRotation); worldBox.setFromObject(part.group); part.group.position.y -= worldBox.min.y; part.moving = false;
    }
    dirty = true;
  });
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(environment,.04).texture;
  environment.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xd9edf4,0x183b40,1.2));
  const key = new THREE.DirectionalLight(0xfff0de,3.3);
  key.position.set(-3,5,3); key.castShadow = true;
  key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -4;
  key.shadow.camera.right = key.shadow.camera.top = 4;
  key.shadow.normalBias = .02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9bfff0,2.1);
  rim.position.set(3,2,-3); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.ShadowMaterial({ color: 0x000000, opacity: .35 }));
  floor.rotation.x = -Math.PI/2; floor.position.y = -.008; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(24,80,0x317f84,0x173a44);
  grid.position.y = -.004; grid.material.transparent = true; grid.material.opacity = .48; scene.add(grid);
  const source = await new GLTFLoader().loadAsync("./model/scene.gltf");
  const stats = assembleModel(source.scene);
  $("asset-stat").textContent = `${parts.size} assemblies / ${stats.surfaces} surfaces`;
  $("part-select").replaceChildren(...assemblies.filter(part => parts.has(part.id)).map(part => { const option = document.createElement("option"); option.value = part.id; option.textContent = part.name; return option; }));
  for (const control of document.querySelectorAll("button:disabled,input:disabled,select:disabled")) control.disabled = false;
  $("export-record").disabled = true;
  bindControls();
  setMode("orbit");
  selectPart(parts.get("front-fender") ?? parts.get("fork"));
  new ResizeObserver(() => {
    renderer.setSize(host.clientWidth,host.clientHeight);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    fitView(); dirty = true;
  }).observe(host);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) dirty = true; }).observe(host);
  canvas.addEventListener("webglcontextlost",event => { event.preventDefault(); host.dataset.ready = "false"; $("asset-stat").textContent = "3D paused"; $("load-status").hidden = false; $("load-status").textContent = "3D paused. Reload this page to restore the scene; source and methods remain available below."; ready = false; for (const control of document.querySelectorAll("button,input,select")) control.disabled = true; });
  ready = true;
  host.dataset.ready = "true";
  $("load-status").hidden = true;
  announce("Select an assembly, or choose Pull apart or Dent to edit directly.");
  renderer.setSize(host.clientWidth,host.clientHeight);
  camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix();
  fitView();
  renderer.setAnimationLoop(tick);
  // Expose scene state for real-renderer browser checks.
  window.motorcycleLab = { parts, camera, orbit, renderer, stats, actions, get selected() { return selected; } };
}

initialize().catch(error => {
  console.error("Motorcycle model could not load:",error);
  renderer?.dispose();
  renderer?.domElement.remove();
  host.dataset.ready = "false";
  $("asset-stat").textContent = "Static model preview";
  for (const control of document.querySelectorAll("button,input,select")) control.disabled = true;
  $("load-status").textContent = "Interactive 3D is unavailable. The model preview, sources and methods remain available. Reload to try again.";
  announce("3D is unavailable on this device. No model edits have been applied.");
});
