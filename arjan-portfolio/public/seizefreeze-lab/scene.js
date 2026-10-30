import * as T from "/pit-stop-lab/vendor/three.module.js";
import { OrbitControls } from "/pit-stop-lab/vendor/OrbitControls.js";

// Original procedural explanatory geometry. Dimensions and layer gaps are schematic.
export function createScene(host, onSelect = () => {}) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0b1117, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const canvas = renderer.domElement;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Interactive schematic of a proposed cortical cooling device. Choose components using the adjacent buttons. Drag horizontally to rotate the view.");
  Object.assign(canvas.style, { width: "100%", height: "100%", display: "block", touchAction: "pan-y", cursor: "grab" });
  host.append(canvas);
  const gl = renderer.getContext(), ext = gl.getExtension("WEBGL_debug_renderer_info");
  const adapter = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unavailable";
  const softwareRenderer = /SwiftShader|llvmpipe|Software Rasterizer/i.test(adapter);
  if (softwareRenderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(35, 1, 0.05, 200);
  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minPolarAngle = 0.45;
  controls.maxPolarAngle = 1.45;
  controls.touches.ONE = T.TOUCH.ROTATE;
  controls.touches.TWO = T.TOUCH.ROTATE;
  // OrbitControls normally disables document touch scrolling. Restore vertical pan.
  canvas.style.touchAction = "pan-y";
  scene.add(new T.HemisphereLight(0xd5e9ff, 0x17202a, 2));
  const key = new T.DirectionalLight(0xf2f3ee, 3.4);
  key.position.set(-4, 7, 6);
  scene.add(key);
  const rim = new T.DirectionalLight(0x86c8ea, 2.5);
  rim.position.set(4, 3, -4);
  scene.add(rim);
  const warm = new T.DirectionalLight(0xf0d1a6, 0.8);
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

  const tissueGroup = new T.Group(); root.add(tissueGroup);
  const cortexGeo = new T.PlaneGeometry(6.5, 4.8, softwareRenderer ? 60 : 100, softwareRenderer ? 46 : 76);
  cortexGeo.rotateX(-Math.PI / 2);
  const positions = cortexGeo.attributes.position, colors = new Float32Array(positions.count * 3), initialHeights = [];
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i), edge = Math.max(0, 1 - Math.pow(Math.abs(x) / 3.25, 8)) * Math.max(0, 1 - Math.pow(Math.abs(z) / 2.4, 8));
    const fold = Math.pow(Math.abs(Math.sin(x * 3.2 + 0.85 * Math.sin(z * 2.1) + 0.28 * Math.sin(x * 1.7 + z))), 0.65);
    const y = -0.43 + edge * (0.23 * fold + 0.025 * Math.sin(z * 3 + x * 0.4));
    positions.setY(i, y); initialHeights.push(y);
  }
  cortexGeo.setAttribute("color", new T.BufferAttribute(colors, 3)); cortexGeo.computeVertexNormals();
  add(tissueGroup, cortexGeo, mats.tissue);
  const depthMaterials = [];
  for (let i = 0; i < 8; i++) {
    const mat = material(0x8c777e, 0, 0.87); depthMaterials.push(mat);
    plate(tissueGroup, 6.48 - i * 0.018, 4.78 - i * 0.018, 0.19, -0.69 - i * 0.19, mat, 0.45);
  }
  // Close the slab edges without letting the volume obscure cortical sulci.
  const rimPositions = [], rimIndices = [];
  for (const [axis, fixed, length] of [["x", -3.25, 4.8], ["x", 3.25, 4.8], ["z", -2.4, 6.5], ["z", 2.4, 6.5]]) {
    const start = rimPositions.length / 3;
    for (let i = 0; i <= 32; i++) {
      const free = (i / 32 - 0.5) * length;
      const x = axis === "x" ? fixed : free, z = axis === "z" ? fixed : free;
      rimPositions.push(x, -0.43, z, x * 0.997, -0.51, z * 0.997);
      if (i < 32) { const j = start + i * 2; rimIndices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); }
    }
  }
  const tissueRim = new T.BufferGeometry(); tissueRim.setAttribute("position", new T.Float32BufferAttribute(rimPositions, 3)); tissueRim.setIndex(rimIndices); tissueRim.computeVertexNormals();
  add(tissueGroup, tissueRim, material(0x987b84, 0, 0.87, { side: T.DoubleSide }));
  const contourMat = new T.LineBasicMaterial({ color: 0x8092a1, transparent: true, opacity: 0.23 });
  for (const z of [-2.5, 2.5]) {
    const geometry = new T.BufferGeometry().setFromPoints([new T.Vector3(-3.3, -2.12, z), new T.Vector3(3.3, -2.12, z)]);
    root.add(new T.Line(geometry, contourMat));
  }
  // Optional head scale context: a schematic ellipsoid, not patient anatomy.
  const headGroup = new T.Group(); scene.add(headGroup); headGroup.visible = false;
  const headMat = material(0x71818c, 0, 0.85, { transparent: true, opacity: 0.12, side: T.DoubleSide, depthWrite: false });
  // Relative to the model's 10 mm contact span, use an assumed 147 mm head width.
  const head = add(headGroup, new T.SphereGeometry(1, 40, 28), headMat, [0, -28.8, 0]); head.scale.set(23.4, 28.2, 24.9);
  const headEdges = new T.LineSegments(new T.WireframeGeometry(new T.SphereGeometry(1, 16, 12)), new T.LineBasicMaterial({ color: 0x688393, transparent: true, opacity: 0.16 })); headEdges.scale.copy(head.scale); headEdges.position.copy(head.position); headGroup.add(headEdges);
  const nose = add(headGroup, new T.ConeGeometry(2.3, 6.8, 16), headMat, [0, -29, 23]); nose.rotation.x = Math.PI / 2;

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
  let selected = null, exploded = true, currentView = "system", disposed = false, visible = true, frames = 0, raf = 0, renderMilliseconds = [];
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
    const shown = currentView === "head" ? ["package"] : selected ? [selected] : exploded ? ["package", "heatpath", "sensing"] : ["package", "sensing"];
    const entries = shown.map(id => {
      const info = labelInfo[id], v = new T.Vector3(...info.point); groups[id].localToWorld(v); v.project(camera);
      return { id, ...info, x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, z: v.z };
    }).filter(p => p.z > -1 && p.z < 1 && p.x > -20 && p.x < w + 20 && p.y > -20 && p.y < h + 20);
    labelSvg.replaceChildren();
    entries.forEach((p, i) => {
      const mobile = w < 560, textWidth = mobile ? 126 : 166;
      const tx = p.side < 0 ? 18 : w - textWidth - 16;
      let ty = Math.max(33, Math.min(h - 53, p.y - 28));
      if (entries.length > 1 && mobile) ty = [40, h * 0.42, h - 72][i];
      const edgeX = p.side < 0 ? tx + textWidth : tx;
      const path = document.createElementNS(ns, "path"); path.setAttribute("d", `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${edgeX} ${ty + 8} L ${tx} ${ty + 8}`);
      path.setAttribute("fill", "none"); path.setAttribute("stroke", p.color); path.setAttribute("stroke-width", ".7"); path.setAttribute("opacity", ".6");
      const dot = document.createElementNS(ns, "circle"); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.setAttribute("r", "2.2"); dot.setAttribute("fill", p.color);
      const text = document.createElementNS(ns, "text"); text.setAttribute("x", tx); text.setAttribute("y", ty); text.setAttribute("fill", p.color); text.setAttribute("font-family", "monospace"); text.setAttribute("font-size", mobile ? "8" : "9"); text.setAttribute("letter-spacing", ".6");
      text.setAttribute("stroke", "#0b1117"); text.setAttribute("stroke-width", "3"); text.setAttribute("paint-order", "stroke"); text.textContent = p.label;
      labelSvg.append(path, dot, text);
    });
  }
  function renderNow() {
    raf = 0; if (disposed || !visible || document.hidden || !host.clientWidth || !host.clientHeight) return;
    const start = performance.now(); camera.updateMatrixWorld(); renderer.render(scene, camera); labels(); frames++;
    renderMilliseconds.push(performance.now() - start); if (renderMilliseconds.length > 180) renderMilliseconds.shift();
  }
  function render() { if (!raf && !disposed && visible) raf = requestAnimationFrame(renderNow); }
  function frameCamera() {
    const aspect = Math.max(0.5, host.clientWidth / Math.max(1, host.clientHeight));
    const narrow = aspect < 1.1;
    if (currentView === "head") { controls.target.set(0, -25, 0); camera.position.set(60, 22, 78); }
    else if (currentView === "interface") { controls.target.set(0, 0.15, 0); camera.position.set(6.8, 4.5, 8); }
    else {
      controls.target.set(0, exploded ? 1.15 : -0.1, 0);
      const scale = narrow ? 1.2 : 1; camera.position.set(8.8 * scale, (exploded ? 7.1 : 6.1) * scale, 10.8 * scale);
    }
    // Fit the complete lifted stack even on narrow screens and close-up presets.
    const bounds = new T.Box3().setFromObject(currentView === "head" ? scene : root), sphere = bounds.getBoundingSphere(new T.Sphere());
    const halfFov = Math.atan(Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * Math.min(1, aspect));
    const required = sphere.radius / Math.sin(halfFov) * 1.04;
    const direction = camera.position.clone().sub(controls.target);
    if (direction.length() < required) camera.position.copy(controls.target).add(direction.setLength(required));
    camera.lookAt(controls.target); controls.update(); render();
  }
  function resize() {
    camera.aspect = host.clientWidth / Math.max(1, host.clientHeight); camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, Math.max(1, host.clientHeight), false); frameCamera();
  }
  function explode(value) {
    exploded = Boolean(value); ids.forEach(id => { groups[id].position.y = exploded ? offsets[id] : seated[id]; });
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
  const baseTissue = new T.Color(0x987b84), cooledTissue = new T.Color(0x559aaf), hotColor = new T.Color(0xb19570), amber = new T.Color(0xd39c63), color = new T.Color();
  function tissueColor(target, value) {
    return target.copy(baseTissue).lerp(value <= 37 ? cooledTissue : amber, T.MathUtils.clamp(Math.abs(37 - value) / (value <= 37 ? 12 : 8), 0, 1));
  }
  function update(frame = {}) {
    const source = frame.tissue ?? frame.temperatures ?? frame.T ?? 37;
    const profile = Array.isArray(source) || ArrayBuffer.isView(source) ? Array.from(source) : [Number(source)];
    const valid = profile.filter(Number.isFinite);
    const temperature = valid.length ? valid : [37];
    for (let i = 0; i < positions.count; i++) {
      // The surface tint is an illustrative extension of the solver's top cell.
      tissueColor(color, temperature[0]);
      const foldShade = 0.86 + (initialHeights[i] + 0.46) * 0.55; color.multiplyScalar(foldShade);
      cortexGeo.attributes.color.setXYZ(i, color.r, color.g, color.b);
    }
    cortexGeo.attributes.color.needsUpdate = true;
    depthMaterials.forEach((m, i) => {
      const index = Math.min(temperature.length - 1, Math.floor(i / depthMaterials.length * temperature.length));
      tissueColor(m.color, temperature[index]).multiplyScalar(0.86);
    });
    const Tc = Number(frame.Tc ?? frame.cold ?? 37), Th = Number(frame.Th ?? frame.hot ?? 37);
    mats.cold.color.set(0x76b2c0).lerp(new T.Color(0x54c6df), Number.isFinite(Tc) ? T.MathUtils.clamp((37 - Tc) / 16, 0, 1) : 0);
    mats.hot.color.copy(hotColor).lerp(amber, Number.isFinite(Th) ? T.MathUtils.clamp((Th - 37) / 12, 0, 1) : 0);
    const current = Number(frame.current ?? frame.I ?? 0);
    mats.blue.emissive.set(0x196398); mats.blue.emissiveIntensity = Number.isFinite(current) ? Math.min(Math.abs(current) * 0.08, 0.15) : 0;
    render();
  }
  const raycaster = new T.Raycaster(), pointer = new T.Vector2(); let press = null;
  const pointerDown = e => { if (e.button === 0) press = { x: e.clientX, y: e.clientY }; };
  const pointerUp = e => {
    if (!press || Math.hypot(press.x - e.clientX, press.y - e.clientY) > 7) { press = null; return; } press = null;
    const rect = canvas.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(allPickable, false)[0]; if (hit) { select(hit.object.userData.component); onSelect(hit.object.userData.component); }
  };
  const pointerCancel = () => { press = null; };
  canvas.addEventListener("pointerdown", pointerDown); canvas.addEventListener("pointerup", pointerUp); canvas.addEventListener("pointercancel", pointerCancel);
  const contextLost = event => { event.preventDefault(); host.dispatchEvent(new CustomEvent("seizefreeze-context-lost", { bubbles: true })); };
  canvas.addEventListener("webglcontextlost", contextLost);
  controls.addEventListener("change", render);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) render(); }, { threshold: 0.01 }); intersectionObserver.observe(host);
  update(); explode(true); resize();
  return {
    select, explode, render,
    seat(id) { if (!ids.includes(id)) return; groups[id].position.y = 0; rebuildConnections(); render(); },
    rotate(delta) { const offset = camera.position.clone().sub(controls.target); offset.applyAxisAngle(new T.Vector3(0, 1, 0), delta); camera.position.copy(controls.target).add(offset); camera.lookAt(controls.target); controls.update(); render(); },
    reset() { currentView = "system"; headGroup.visible = false; select(null); explode(true); },
    overview() { currentView = "system"; headGroup.visible = false; select(null); title.textContent = "PROPOSED STACK · LAYER GAPS EXAGGERATED · ILLUSTRATIVE ANATOMY"; frameCamera(); },
    view(name) { currentView = ["system", "interface", "head"].includes(name) ? name : "system"; if (currentView === "interface") select(null); headGroup.visible = currentView === "head"; title.textContent = currentView === "head" ? "HEAD SCALE CONTEXT · ASSUMED HEAD WIDTH ≈147 MM · CONTACT SPAN 10 MM" : "PROPOSED STACK · LAYER GAPS EXAGGERATED · ILLUSTRATIVE ANATOMY"; frameCamera(); },
    update,
    stats() { return { adapter, softwareRenderer, frames, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, pixelRatio: renderer.getPixelRatio(), renderCpuMsMean: renderMilliseconds.length ? renderMilliseconds.reduce((a, b) => a + b, 0) / renderMilliseconds.length : 0, rendering: "on demand; no idle animation", selected, exploded, componentOffsets: Object.fromEntries(ids.map(id => [id, groups[id].position.y])), view: currentView }; },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); resizeObserver.disconnect(); intersectionObserver.disconnect(); controls.dispose();
      canvas.removeEventListener("pointerdown", pointerDown); canvas.removeEventListener("pointerup", pointerUp); canvas.removeEventListener("pointercancel", pointerCancel); canvas.removeEventListener("webglcontextlost", contextLost);
      const geometries = new Set(), materials = new Set(); scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); grain.dispose(); markTexture.dispose(); environment.dispose(); renderer.dispose(); canvas.remove(); labelLayer.remove(); title.remove();
    },
  };
}
