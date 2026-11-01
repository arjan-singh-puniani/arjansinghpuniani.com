import * as T from "/pit-stop-lab/vendor/three.module.js";
import { OrbitControls } from "/pit-stop-lab/vendor/OrbitControls.js";
import { createAnatomy } from "./anatomy.js";

// Original concept device on attributed reference anatomy; device dimensions and layer gaps are schematic.
export async function createScene(host, onSelect = () => {}, onLayer = () => {}) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0b1117, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.93;
  const canvas = renderer.domElement;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Human Reference Atlas brain and head with an illustrative left superior temporal target, compact proposed device and peelable access layers. Use the layer slider and camera buttons for keyboard alternatives.");
  Object.assign(canvas.style, { width: "100%", height: "100%", display: "block", touchAction: "pan-y", cursor: "grab" });
  host.append(canvas);
  const gl = renderer.getContext(), ext = gl.getExtension("WEBGL_debug_renderer_info");
  const adapter = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unavailable";
  const softwareRenderer = /SwiftShader|llvmpipe|Software Rasterizer/i.test(adapter);
  if (softwareRenderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(34, 1, 0.2, 3000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = true;
  controls.minDistance = 16;
  controls.maxDistance = 650;
  controls.zoomSpeed = 0.55;
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = 2.8;
  controls.touches.ONE = T.TOUCH.ROTATE;
  controls.touches.TWO = T.TOUCH.ROTATE;
  // OrbitControls normally disables document touch scrolling. Restore vertical pan.
  canvas.style.touchAction = "pan-y";
  scene.add(new T.HemisphereLight(0xd5e9ff, 0x17202a, 0.9));
  const key = new T.DirectionalLight(0xf2f3ee, 2.3);
  key.position.set(-70, 130, -35);
  scene.add(key);
  const rim = new T.DirectionalLight(0x86c8ea, 1.5);
  rim.position.set(90, 35, 90);
  scene.add(rim);
  const warm = new T.DirectionalLight(0xf0d1a6, 0.55);
  warm.position.set(-5, 1, -3);
  scene.add(warm);
  const studio = new T.Scene();
  studio.background = new T.Color(0x18222e);
  for (const [position, size, color] of [
    [[-5, 2, 1], [0.1, 8, 5], 0xe3eafa], [[4, 3, 0], [0.1, 6, 3], 0x7f99ae],
    [[0, 7, 1], [8, 0.1, 5], 0xffffff], [[0, 1, -6], [7, 4, 0.1], 0xc9d5df],
  ]) {
    const light = new T.Mesh(new T.BoxGeometry(...size), new T.MeshBasicMaterial({ color }));
    light.position.set(...position); studio.add(light);
  }
  const pmrem = new T.PMREMGenerator(renderer), environment = pmrem.fromScene(studio, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.65;
  studio.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); pmrem.dispose();
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = grainCanvas.height = 128;
  const context = grainCanvas.getContext("2d"), pixels = context.createImageData(128, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const i = (y * 128 + x) * 4, v = 173 + Math.sin(x * 2.7) * 8 + Math.sin(y * 21 + x * 17) * 2;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v; pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const grain = new T.CanvasTexture(grainCanvas); grain.wrapS = grain.wrapT = T.RepeatWrapping;
  const material = (color, metalness = 0, roughness = 0.5, extra = {}) => new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const mats = {
    titanium: material(0x9aabb8, 0.94, 0.3, { roughnessMap: grain }),
    darkmetal: material(0x415260, 0.82, 0.34), ceramic: material(0xe0e6df, 0.08, 0.42),
    insulation: material(0x25303a, 0.06, 0.8), gold: material(0xc5a16a, 0.85, 0.33),
    cold: material(0x76b2c0, 0.8, 0.29), hot: material(0xb19570, 0.84, 0.3),
    blue: material(0x478abb, 0.3, 0.4), violet: material(0xa693c6, 0.4, 0.4),
    board: material(0x283d43, 0.25, 0.57), chip: material(0x162029, 0.1, 0.4),
    tissue: material(0x9b7f85, 0, 0.86, { vertexColors: true, side: T.DoubleSide }),
    contact: material(0xc3d4d3, 0.1, 0.52, { transparent: true, opacity: 0.85 }),
  };
  const root = new T.Group(); scene.add(root);
  const ids = ["interface", "coldplate", "tec", "heatpath", "sensing", "electronics", "package"];
  const groups = Object.fromEntries(ids.map(id => { const group = new T.Group(); group.userData.component = id; root.add(group); return [id, group]; }));
  const allPickable = [], highlights = [];
  const add = (group, geometry, mat, position = [0, 0, 0]) => {
    const mesh = new T.Mesh(geometry, mat); mesh.position.set(...position); group.add(mesh);
    if (group.userData.component) { mesh.userData.component = group.userData.component; allPickable.push(mesh); }
    return mesh;
  };
  function roundedShape(w, d, r) {
    const s = new T.Shape(), x = -w / 2, z = -d / 2;
    s.moveTo(x + r, z); s.lineTo(x + w - r, z); s.quadraticCurveTo(x + w, z, x + w, z + r);
    s.lineTo(x + w, z + d - r); s.quadraticCurveTo(x + w, z + d, x + w - r, z + d);
    s.lineTo(x + r, z + d); s.quadraticCurveTo(x, z + d, x, z + d - r);
    s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z); return s;
  }
  function plate(group, w, d, h, y, mat, r = 0.22) {
    const bevel = Math.min(0.025, h * 0.2);
    const geometry = new T.ExtrudeGeometry(roundedShape(w, d, r), { depth: h - bevel * 2, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, steps: 1, curveSegments: 6 });
    geometry.rotateX(-Math.PI / 2); geometry.translate(0, bevel, 0);
    return add(group, geometry, mat, [0, y, 0]);
  }
  const box = (g, size, pos, mat) => add(g, new T.BoxGeometry(...size), mat, pos);
  const cylinder = (g, radius, height, pos, mat, segments = 20) => add(g, new T.CylinderGeometry(radius, radius, height, segments), mat, pos);
  function tube(g, points, mat, radius = 0.018) {
    return add(g, new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))), 24, radius, 5, false), mat);
  }
  function instanced(g, geometry, mat, positions) {
    const mesh = new T.InstancedMesh(geometry, mat, positions.length), transform = new T.Object3D();
    positions.forEach((p, i) => { transform.position.set(...p); transform.updateMatrix(); mesh.setMatrixAt(i, transform.matrix); });
    mesh.userData.component = g.userData.component; g.add(mesh); allPickable.push(mesh); return mesh;
  }
  const seated = { interface: 0, coldplate: 0, tec: 0, heatpath: 0, sensing: 0, electronics: 0, package: 0 };
  const offsets = { interface: 0.12, coldplate: 0.65, tec: 1.28, heatpath: 1.96, sensing: 0.18, electronics: 2.65, package: 3.25 };
  plate(groups.interface, 3.18, 2.48, 0.10, 0.0, mats.contact);
  plate(groups.coldplate, 3.1, 2.4, 0.16, 0.13, mats.cold);
  plate(groups.tec, 2.62, 1.94, 0.075, 0.32, mats.ceramic, 0.12);
  plate(groups.tec, 2.62, 1.94, 0.075, 0.75, mats.ceramic, 0.12);
  const pillars = [];
  for (let x = -1; x <= 1.01; x += 0.28) for (let z = -0.65; z <= 0.66; z += 0.28) pillars.push([x, 0.57, z]);
  instanced(groups.tec, new T.BoxGeometry(0.15, 0.34, 0.15), mats.darkmetal, pillars.filter((_, i) => i % 2 === 0));
  instanced(groups.tec, new T.BoxGeometry(0.15, 0.34, 0.15), mats.blue, pillars.filter((_, i) => i % 2 === 1));
  const bridges = [];
  for (let x = -0.86; x < 1; x += 0.56) for (let z = -0.65; z <= 0.66; z += 0.28) bridges.push([x, 0.4, z]);
  instanced(groups.tec, new T.BoxGeometry(0.43, 0.025, 0.17), mats.gold, bridges);
  const ring = roundedShape(3.38, 2.68, 0.3), ringHole = new T.Path(roundedShape(2.8, 2.12, 0.18).getPoints());
  ring.holes.push(ringHole);
  const ringGeo = new T.ExtrudeGeometry(ring, { depth: 0.3, bevelEnabled: false, curveSegments: 8 }); ringGeo.rotateX(-Math.PI / 2);
  add(groups.coldplate, ringGeo, mats.insulation, [0, 0.31, 0]);
  plate(groups.heatpath, 3.13, 2.43, 0.17, 0.87, mats.hot);
  for (const x of [-1.42, 1.42]) box(groups.heatpath, [0.16, 0.48, 2.15], [x, 1.15, 0], mats.hot);
  // A route candidate, not a solved chronic heat sink.
  tube(groups.heatpath, [[1.45, 1.04, -0.45], [1.87, 1.03, -0.48], [2.13, 0.93, -0.53], [2.65, 0.92, -0.55]], mats.hot, 0.055);
  for (const z of [-0.77, 0.77]) {
    tube(groups.sensing, [[-2.08, -0.1, z], [-1.84, 0.02, z], [-1.65, 0.16, z], [-1.51, 0.28, z], [-1.42, 1.48, z]], mats.violet, 0.023);
    cylinder(groups.sensing, 0.12, 0.04, [-2.08, -0.1, z], mats.gold);
  }
  for (const x of [-1.18, 1.18]) {
    add(groups.sensing, new T.SphereGeometry(0.065, 12, 8), mats.violet, [x, 0.14, 0.8]);
    tube(groups.sensing, [[x, 0.14, 0.8], [x, 0.18, 1.14], [x, 1.48, 1.14]], mats.violet, 0.012);
  }
  plate(groups.electronics, 2.9, 2.15, 0.085, 1.43, mats.board);
  box(groups.electronics, [0.85, 0.13, 0.75], [-0.4, 1.57, 0.06], mats.chip);
  box(groups.electronics, [0.46, 0.1, 0.52], [0.62, 1.55, -0.42], mats.chip);
  const pins = [];
  for (let i = 0; i < 7; i++) for (const x of [-0.91, 0.1]) pins.push([x, 1.53, -0.27 + i * 0.1]);
  instanced(groups.electronics, new T.BoxGeometry(0.13, 0.035, 0.04), mats.gold, pins);
  const passives = [];
  for (let i = 0; i < 8; i++) passives.push([0.36 + (i % 4) * 0.23, 1.54, 0.22 + Math.floor(i / 4) * 0.26]);
  instanced(groups.electronics, new T.BoxGeometry(0.13, 0.08, 0.075), mats.ceramic, passives);
  for (let i = 0; i < 6; i++) {
    const z = -0.68 + i * 0.23;
    tube(groups.electronics, [[-1.25, 1.483, z], [-1.05, 1.483, z], [-1.02, 1.483, z + 0.07], [-0.94, 1.483, z + 0.07]], mats.gold, 0.008);
  }
  tube(groups.electronics, [[1.38, 1.5, 0.58], [1.69, 1.5, 0.65], [1.78, 0.69, 0.65], [1.25, 0.6, 0.67]], mats.blue, 0.021);
  tube(groups.electronics, [[-1.18, 1.51, -0.9], [-1.8, 1.6, -1.1], [-2.35, 1.65, -1.2]], mats.gold, 0.026);
  plate(groups.package, 3.6, 2.92, 0.17, 1.84, mats.titanium, 0.38);
  const lidInset = plate(groups.package, 3.23, 2.55, 0.015, 2.014, mats.darkmetal, 0.25);
  for (const x of [-1.68, 1.68]) box(groups.package, [0.11, 0.78, 2.3], [x, 1.45, 0], mats.titanium);
  const screws = [];
  for (const x of [-1.48, 1.48]) for (const z of [-1.14, 1.14]) {
    screws.push([x, 2.05, z]);
    box(groups.package, [0.09, 0.008, 0.015], [x, 2.091, z], mats.darkmetal);
    box(groups.package, [0.015, 0.008, 0.09], [x, 2.091, z], mats.darkmetal);
  }
  instanced(groups.package, new T.CylinderGeometry(0.07, 0.07, 0.055, 20), mats.titanium, screws);
  // A restrained engraved identification plate, rather than a luminous screen.
  const markCanvas = document.createElement("canvas"); markCanvas.width = 512; markCanvas.height = 128;
  const mark = markCanvas.getContext("2d"); mark.fillStyle = "#30404d"; mark.fillRect(0, 0, 512, 128);
  mark.font = "500 42px sans-serif"; mark.fillStyle = "#a6b9c6"; mark.fillText("SEIZE / FREEZE", 20, 56);
  mark.font = "19px monospace"; mark.fillStyle = "#7c929f"; mark.fillText("CYBERPUNK REALITY · CONCEPT", 22, 96);
  const markTexture = new T.CanvasTexture(markCanvas); markTexture.colorSpace = T.SRGBColorSpace;
  const emblem = add(groups.package, new T.PlaneGeometry(1.86, 0.46), new T.MeshBasicMaterial({ map: markTexture }), [0, 2.031, 0]); emblem.rotation.x = -Math.PI / 2;
  lidInset.userData.component = "package";

  const anatomy = await createAnatomy(T, { onProgress: fraction => {
    const loading = host.querySelector('#scene-loading');
    if (loading) loading.textContent = `Loading reference anatomy… ${Math.round(fraction * 100)}%`;
  }});
  scene.add(anatomy.group);
  const mount = anatomy.target.clone().addScaledVector(anatomy.normal, 0.65);
  root.position.copy(mount);
  root.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), anatomy.normal);
  root.scale.set(10 / 3.18, 1.1, 10 / 2.48);
  let peelValue = 0.86;
  anatomy.peel(peelValue);
  anatomy.setContext?.("region");
  const labelLayer = document.createElement("div");
  labelLayer.dataset.sfLabel = "true";
  labelLayer.dataset.sfOverlay = "true";
  Object.assign(labelLayer.style, { position: "absolute", inset: "0", pointerEvents: "none", overflow: "hidden" }); labelLayer.setAttribute("aria-hidden", "true"); host.append(labelLayer);
  const ns = "http://www.w3.org/2000/svg", labelSvg = document.createElementNS(ns, "svg");
  Object.assign(labelSvg.style, { width: "100%", height: "100%", overflow: "hidden" }); labelLayer.append(labelSvg);
  const title = document.createElement("div");
  title.className = "sf-scene-note";
  title.dataset.sfOverlay = "true";
  Object.assign(title.style, { position: "absolute", left: "20px", bottom: "16px", maxWidth: "calc(100% - 40px)", color: "#92a4b4", font: "10px/1.6 monospace", letterSpacing: ".06em", pointerEvents: "none" });
  title.textContent = "PROPOSED STACK · LAYER GAPS EXAGGERATED · ILLUSTRATIVE ANATOMY"; host.append(title);
  const labelInfo = {
    interface: { label: "CONTACT INTERFACE", point: [-1.45, 0.06, 0.95], color: "#a7c1c6", side: -1 },
    coldplate: { label: "COLD-SIDE SPREADER", point: [1.42, 0.24, 0.8], color: "#8bd4e3", side: 1 },
    tec: { label: "THERMOELECTRIC COUPLES", point: [-1.05, 0.58, 0.5], color: "#b8c7d4", side: -1 },
    heatpath: { label: "HOT-SIDE HEAT PATH", point: [2.62, 0.92, -0.55], color: "#dbb37d", side: 1 },
    sensing: { label: "ELECTRODES + SENSORS", point: [-2.08, -0.08, 0.77], color: "#c4ace4", side: -1 },
    electronics: { label: "CONTROL + POWER", point: [0.7, 1.56, 0.4], color: "#92b9e6", side: 1 },
    package: { label: "ENCAPSULATION CONCEPT", point: [-1.45, 2.06, -0.4], color: "#c9d4dd", side: -1 },
  };
  const connections = new T.Group(); root.add(connections);
  let selected = null, exploded = false, currentView = "region", disposed = false, visible = true, active = true, frames = 0, raf = 0, renderMilliseconds = [];
  function rebuildConnections() {
    connections.children.slice().forEach(line => { line.geometry.dispose(); line.material.dispose(); connections.remove(line); });
    if (!selected) return;
    const paths = { interface: ["coldplate", "sensing"], coldplate: ["interface", "tec"], tec: ["coldplate", "heatpath", "electronics"], heatpath: ["tec", "package"], sensing: ["interface", "electronics"], electronics: ["sensing", "tec"], package: ["electronics", "heatpath"] };
    const a = new T.Vector3(...labelInfo[selected].point); a.y += groups[selected].position.y;
    for (const id of paths[selected]) {
      const b = new T.Vector3(...labelInfo[id].point); b.y += groups[id].position.y;
      const mid = a.clone().lerp(b, 0.5); mid.x += selected === "sensing" ? -0.25 : 0.25;
      const geo = new T.BufferGeometry().setFromPoints([a, mid, b]);
      const line = new T.Line(geo, new T.LineDashedMaterial({ color: labelInfo[selected].color, dashSize: 0.065, gapSize: 0.055, transparent: true, opacity: 0.75 })); line.computeLineDistances(); connections.add(line);
    }
  }
  function labels() {
    const w = host.clientWidth, h = host.clientHeight;
    labelSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const placement = currentView === "head" || currentView === "region";
    const shown = selected ? [selected] : exploded ? ["package", "tec"] : ["package"];
    const entries = (placement ? [
      { label: "LEFT SUPERIOR TEMPORAL GYRUS", point: anatomy.target.clone(), color: "#c7b1e8", side: -1 },
      { label: "SEIZEFREEZE · 10 MM CONTACT", point: mount.clone().addScaledVector(anatomy.normal, 3), color: "#ade0e0", side: 1 },
    ] : shown.map(id => {
      const info = labelInfo[id], point = new T.Vector3(...info.point);
      groups[id].localToWorld(point);
      return { ...info, point };
    })).map(info => {
      const v = info.point.clone().project(camera);
      return { ...info, x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, z: v.z };
    }).filter(p => p.z > -1 && p.z < 1 && p.x > -20 && p.x < w + 20 && p.y > -20 && p.y < h + 20);
    labelSvg.replaceChildren();
    entries.forEach((p, i) => {
      const mobile = w < 560;
      const label = mobile && p.label === "LEFT SUPERIOR TEMPORAL GYRUS" ? "LEFT STG · EXAMPLE TARGET" : mobile && p.label.startsWith("SEIZEFREEZE") ? "10 MM CONTACT" : p.label;
      const textWidth = Math.max(100, label.length * (mobile ? 5.5 : 6.2));
      const tx = p.side < 0 ? 18 : w - textWidth - 16;
      let ty = Math.max(33, Math.min(h - 53, p.y - 28));
      if (entries.length > 1 && mobile) ty = [40, h * 0.42, h - 72][i];
      const edgeX = p.side < 0 ? tx + textWidth : tx;
      const path = document.createElementNS(ns, "path"); path.setAttribute("d", `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${edgeX} ${ty + 8} L ${tx} ${ty + 8}`);
      path.setAttribute("fill", "none"); path.setAttribute("stroke", p.color); path.setAttribute("stroke-width", ".7"); path.setAttribute("opacity", ".6");
      const dot = document.createElementNS(ns, "circle"); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.setAttribute("r", "2.2"); dot.setAttribute("fill", p.color);
      const text = document.createElementNS(ns, "text"); text.setAttribute("x", tx); text.setAttribute("y", ty); text.setAttribute("fill", p.color); text.setAttribute("font-family", "monospace"); text.setAttribute("font-size", mobile ? "8" : "9"); text.setAttribute("letter-spacing", ".6");
      text.setAttribute("stroke", "#0b1117"); text.setAttribute("stroke-width", "3"); text.setAttribute("paint-order", "stroke"); text.textContent = label;
      labelSvg.append(path, dot, text);
    });
  }
  function renderNow() {
    raf = 0; if (disposed || !visible || !active || document.hidden || !host.clientWidth || !host.clientHeight) return;
    const start = performance.now(); camera.updateMatrixWorld(); renderer.render(scene, camera); labels(); frames++;
    renderMilliseconds.push(performance.now() - start); if (renderMilliseconds.length > 180) renderMilliseconds.shift();
  }
  function render() { if (!raf && !disposed && visible && active) raf = requestAnimationFrame(renderNow); }
  function frameCamera() {
    const aspect = Math.max(0.45, host.clientWidth / Math.max(1, host.clientHeight));
    const narrow = aspect < 1.1;
    const target = anatomy.target;
    if (currentView === "head") {
      controls.target.set(-5, 2, 2);
      camera.position.set(-360, 115, 265);
      if (narrow) camera.position.multiplyScalar(1.35);
    } else if (currentView === "region") {
      controls.target.copy(target).lerp(new T.Vector3(0, 0, 0), 0.38);
      camera.position.copy(controls.target).add(new T.Vector3(-310, 70, 185).multiplyScalar(narrow ? 1.25 : 1));
    } else {
      controls.target.copy(target).addScaledVector(anatomy.normal, exploded ? 4 : 1);
      const direction = anatomy.normal.clone().multiplyScalar(currentView === "system" ? 0.5 : 0.85).add(new T.Vector3(0, currentView === "system" ? 0.68 : 0.38, 0.32)).normalize();
      camera.position.copy(controls.target).addScaledVector(direction, (exploded ? 72 : 43) * (narrow ? 1.18 : 1));
    }
    camera.lookAt(controls.target); controls.update(); render();
  }
  function resize() {
    camera.aspect = host.clientWidth / Math.max(1, host.clientHeight); camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, Math.max(1, host.clientHeight), false); frameCamera();
  }
  function explode(value) {
    exploded = Boolean(value); ids.forEach(id => { groups[id].position.y = exploded ? offsets[id] * 3 : seated[id]; });
    rebuildConnections(); frameCamera();
  }
  function select(id) {
    selected = ids.includes(id) ? id : null;
    highlights.splice(0).forEach(h => { h.geometry.dispose(); h.material.dispose(); h.parent.remove(h); });
    if (selected) {
      groups[selected].traverse(o => {
        if (!o.isMesh || o.isInstancedMesh) return;
        const edge = new T.LineSegments(new T.EdgesGeometry(o.geometry, 35), new T.LineBasicMaterial({ color: labelInfo[selected].color, transparent: true, opacity: 0.6 }));
        edge.position.copy(o.position); edge.rotation.copy(o.rotation); edge.scale.copy(o.scale); highlights.push(edge);
      });
      highlights.forEach(h => groups[selected].add(h));
    }
    rebuildConnections(); render();
  }
  const hotColor = new T.Color(0xb19570), amber = new T.Color(0xd39c63);
  function update(frame = {}) {
    const temperature = Array.isArray(frame.tissue) ? frame.tissue[0] : 37;
    anatomy.setTemperature?.(Number.isFinite(temperature) ? temperature : 37);
    const Tc = Number(frame.Tc ?? 37), Th = Number(frame.Th ?? 37);
    mats.cold.color.set(0x76b2c0).lerp(new T.Color(0x54c6df), Number.isFinite(Tc) ? T.MathUtils.clamp((37 - Tc) / 16, 0, 1) : 0);
    mats.hot.color.copy(hotColor).lerp(amber, Number.isFinite(Th) ? T.MathUtils.clamp((Th - 37) / 12, 0, 1) : 0);
    render();
  }
  const raycaster = new T.Raycaster(), pointer = new T.Vector2(); let press = null;
  const pointerDown = e => { if (e.button === 0) press = { x: e.clientX, y: e.clientY }; };
  const pointerUp = e => {
    if (!press || Math.hypot(press.x - e.clientX, press.y - e.clientY) > 7) { press = null; return; } press = null;
    const rect = canvas.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...allPickable, ...anatomy.group.children], true);
    const hit = hits.find(h => {
      if (!(h.object.material?.opacity > 0.15)) return false;
      for (let object = h.object; object; object = object.parent) if (!object.visible) return false;
      return true;
    });
    if (!hit) return;
    const component = hit.object.userData.component;
    if (component) { select(component); onSelect(component); return; }
    const id = hit.object.userData.anatomyLayer;
    if (id) {
      const stops = { scalp: 0.24, skull: 0.44, dura: 0.64, arachnoid: 0.84, pia: 1 };
      peelValue = Math.max(peelValue, stops[id] ?? 1);
      anatomy.peel(peelValue); onLayer(peelValue); render();
    }
  };
  const pointerCancel = () => { press = null; };
  canvas.tabIndex = 0;
  const keyboardView = event => {
    if (["ArrowLeft", "ArrowRight", "+", "=", "-", "_"].includes(event.key)) {
      event.preventDefault();
      const offset = camera.position.clone().sub(controls.target);
      if (event.key.startsWith("Arrow")) offset.applyAxisAngle(new T.Vector3(0, 1, 0), event.key === "ArrowLeft" ? -0.16 : 0.16);
      else offset.multiplyScalar(event.key === "+" || event.key === "=" ? 0.9 : 1.1);
      offset.clampLength(16, 650); camera.position.copy(controls.target).add(offset); controls.update(); render();
    }
  };
  canvas.addEventListener("keydown", keyboardView);
  canvas.addEventListener("pointerdown", pointerDown); canvas.addEventListener("pointerup", pointerUp); canvas.addEventListener("pointercancel", pointerCancel);
  const contextLost = event => { event.preventDefault(); host.dispatchEvent(new CustomEvent("seizefreeze-context-lost", { bubbles: true })); };
  canvas.addEventListener("webglcontextlost", contextLost);
  controls.addEventListener("change", render);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) render(); }, { threshold: 0.01 }); intersectionObserver.observe(host);
  update(); explode(false); resize();
  return {
    select, explode, render,
    setActive(value) { active = Boolean(value); if (active) render(); else { cancelAnimationFrame(raf); raf = 0; } },
    seat(id) { if (!ids.includes(id)) return; groups[id].position.y = 0; rebuildConnections(); render(); },
    rotate(delta) { const offset = camera.position.clone().sub(controls.target); offset.applyAxisAngle(new T.Vector3(0, 1, 0), delta); camera.position.copy(controls.target).add(offset); camera.lookAt(controls.target); controls.update(); render(); },
    peel(value) { peelValue = T.MathUtils.clamp(value, 0, 1); anatomy.peel(peelValue); render(); },
    reset() { currentView = "region"; anatomy.setContext?.("region"); select(null); explode(false); peelValue = 0.86; anatomy.peel(peelValue); frameCamera(); },
    overview() { currentView = "region"; anatomy.setContext?.("region"); select(null); explode(false); frameCamera(); },
    view(name) {
      currentView = ["head", "region", "interface", "system"].includes(name) ? name : "region";
      select(null);
      anatomy.setContext?.(currentView);
      title.textContent = currentView === "head" || currentView === "region"
        ? "REFERENCE ANATOMY · ILLUSTRATIVE TARGET · NOT PATIENT LOCALIZATION"
        : "PROPOSED DEVICE · ASSUMED 10 × 10 MM CONTACT · LAYERS EXAGGERATED";
      frameCamera();
    },
    update,
    stats() { return { adapter, softwareRenderer, frames, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, pixelRatio: renderer.getPixelRatio(), renderCpuMsMean: renderMilliseconds.length ? renderMilliseconds.reduce((a, b) => a + b, 0) / renderMilliseconds.length : 0, rendering: "on demand; no idle animation", active, selected, exploded, componentOffsets: Object.fromEntries(ids.map(id => [id, groups[id].position.y])), cameraPosition: camera.position.toArray(), view: currentView, peel: peelValue, target: anatomy.target.toArray(), mountPoint: root.position.toArray(), contactSpanMm: [10, 10], normal: anatomy.normal.toArray(), anatomy: anatomy.info }; },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); resizeObserver.disconnect(); intersectionObserver.disconnect(); controls.dispose();
      canvas.removeEventListener("keydown", keyboardView); canvas.removeEventListener("pointerdown", pointerDown); canvas.removeEventListener("pointerup", pointerUp); canvas.removeEventListener("pointercancel", pointerCancel); canvas.removeEventListener("webglcontextlost", contextLost);
      anatomy.dispose();
      const geometries = new Set(), materials = new Set(); scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); grain.dispose(); markTexture.dispose(); environment.dispose(); renderer.dispose(); canvas.remove(); labelLayer.remove(); title.remove();
    },
  };
}
