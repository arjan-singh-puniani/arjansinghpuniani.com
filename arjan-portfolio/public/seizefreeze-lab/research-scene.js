import * as T from "/pit-stop-lab/vendor/three.module.js";
import { OrbitControls } from "/pit-stop-lab/vendor/OrbitControls.js";

// Original diagrammatic bench geometry. Units are millimeters, not selected hardware dimensions.
export async function createResearchScene(host, options = {}) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  const canvas = renderer.domElement;
  const gl = renderer.getContext(), ext = gl.getExtension("WEBGL_debug_renderer_info");
  const adapter = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unavailable";
  const softwareRenderer = /SwiftShader|llvmpipe|Software Rasterizer/i.test(adapter);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, softwareRenderer ? .8 : 1.6));
  renderer.setClearColor(0x0a1017, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  Object.assign(canvas.style, { width: "100%", height: "100%", position: "absolute", inset: "0", display: "block", touchAction: "pan-y" });
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Illustrative research apparatus. Drag to orbit, use arrow keys to rotate and plus or minus to zoom. Enter selects the central object. Section and component controls are provided beside this view.");
  host.append(canvas);
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(34, 1, .02, 2500);
  scene.add(new T.HemisphereLight(0xbdd8ed, 0x17212b, .8));
  for (const [color, intensity, position] of [[0xffedda, 2.1, [25, 45, 32]], [0x8bc9ec, 1.8, [-30, 10, -25]], [0xdce4f0, .7, [-15, 30, 40]]]) {
    const light = new T.DirectionalLight(color, intensity); light.position.set(...position); scene.add(light);
  }
  // Procedural studio reflection cards, with no external texture assets.
  const studio = new T.Scene(); studio.background = new T.Color(0x263443);
  const studioMaterials = [], studioGeometries = [];
  for (const [size, position, intensity] of [[[12, 22, .1], [10, 10, 9], 5], [[18, 7, .1], [-8, 14, -8], 3], [[.1, 18, 9], [-12, 4, 2], 2]]) {
    const geometry = new T.BoxGeometry(...size), material = new T.MeshBasicMaterial({ color: new T.Color().setScalar(intensity) });
    const card = new T.Mesh(geometry, material); card.position.set(...position); studio.add(card); studioMaterials.push(material); studioGeometries.push(geometry);
  }
  const pmrem = new T.PMREMGenerator(renderer), environment = pmrem.fromScene(studio, .05, .1, 100);
  scene.environment = environment.texture; scene.environmentIntensity = .42;
  pmrem.dispose(); studioMaterials.forEach(m => m.dispose()); studioGeometries.forEach(g => g.dispose());
  const materials = {}, geometries = new Set(), disposable = new Set();
  const mat = (name, color, extra = {}) => materials[name] ||= new T.MeshStandardMaterial({ color, roughness: .44, metalness: 0, ...extra });
  mat("titanium", 0xabb9c5, { metalness: .72, roughness: .32 });
  mat("dark", 0x27333f, { metalness: .45 }); mat("ceramic", 0xc8cbc4, { roughness: .48 });
  mat("gold", 0xc2a565, { metalness: .65 }); mat("board", 0x20363c, { roughness: .65 });
  mat("chip", 0x10191f, { roughness: .6 }); mat("violet", 0x9683c4, { metalness: .25 });
  mat("cold", 0x60b6cd, { metalness: .35 }); mat("hot", 0xc49b68, { metalness: .4 });
  mat("uncertain", 0x6f7c88, { roughness: .66 });
  mat("glass", 0xb4d2df, { transparent: true, opacity: .13, depthWrite: false, side: T.DoubleSide, roughness: .2, metalness: .1 });
  mat("medium", 0x7aadb7, { transparent: true, opacity: .09, depthWrite: false, side: T.DoubleSide, roughness: .3 });
  const organoid = new T.Group(), prototype = new T.Group(); scene.add(organoid, prototype);
  const pickable = [], labels = [], groups = new Map();
  const labelLayer = document.createElement("div");
  labelLayer.dataset.researchOverlay = "true";
  Object.assign(labelLayer.style, { position: "absolute", inset: "0", pointerEvents: "none", overflow: "hidden" });
  labelLayer.setAttribute("aria-hidden", "true"); host.append(labelLayer);
  const leaderLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  Object.assign(leaderLayer.style, { position: "absolute", inset: "0", width: "100%", height: "100%", overflow: "hidden" }); labelLayer.append(leaderLayer);
  const sectionBadge = document.createElement("span"); sectionBadge.textContent = "SECTION CLOSE-UP · GEOMETRY UNCHANGED";
  Object.assign(sectionBadge.style, { position: "absolute", top: "12px", left: "12px", color: "#c4d1da", font: "11px ui-monospace, monospace", padding: "5px 7px", background: "rgba(8,15,23,.84)" });
  sectionBadge.hidden = true; labelLayer.append(sectionBadge);
  function component(parent, id) { const g = new T.Group(); g.userData.component = id; parent.add(g); if (!groups.has(id)) groups.set(id, []); groups.get(id).push(g); return g; }
  function mesh(parent, geometry, material, position = [0, 0, 0]) {
    geometries.add(geometry); const m = new T.Mesh(geometry, material); m.position.set(...position); parent.add(m); pickable.push(m); return m;
  }
  function box(parent, material, size, position) { return mesh(parent, new T.BoxGeometry(...size), material, position); }
  function cylinder(parent, material, radius, height, position, inner = false) {
    return mesh(parent, new T.CylinderGeometry(radius, radius, height, 64, 1, inner), material, position);
  }
  function path(parent, points, color, dashed = false, width = .04) {
    const vectors = points.map(p => new T.Vector3(...p));
    if (dashed) {
      const geometry = new T.BufferGeometry().setFromPoints(vectors); geometries.add(geometry);
      const material = new T.LineDashedMaterial({ color, dashSize: width * 5, gapSize: width * 3, transparent: true, opacity: .8 }); disposable.add(material);
      const line = new T.Line(geometry, material); line.computeLineDistances(); parent.add(line); return line;
    }
    const curve = new T.CatmullRomCurve3(vectors, false, "centripetal");
    return mesh(parent, new T.TubeGeometry(curve, Math.max(8, points.length * 5), width, 6, false), mat("path" + color, color, { metalness: .25 }));
  }
  function label(parent, text, position, placement = "right") {
    const anchor = new T.Object3D(); anchor.position.set(...position); parent.add(anchor);
    const node = document.createElement("span"); node.textContent = text;
    Object.assign(node.style, { position: "absolute", color: "#d5dfe6", font: "11px ui-monospace, SFMono-Regular, monospace", lineHeight: "1.35", whiteSpace: "nowrap", padding: "3px 6px", borderLeft: "1px solid #69808f", background: "rgba(8,15,23,.84)", borderRadius: "2px", maxWidth: "210px" });
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("stroke", "#8297a6"); line.setAttribute("stroke-width", ".8"); line.setAttribute("opacity", ".75"); leaderLayer.append(line);
    labelLayer.append(node); labels.push({ node, line, anchor, root: parent, placement }); return anchor;
  }
  function finSink(parent, width, baseY, finHeight, depth, count = 11) {
    box(parent, materials.titanium, [width, .35 * finHeight, depth], [0, baseY, 0]);
    for (let i = 0; i < count; i++) box(parent, materials.dark, [width / (count * 2.5), finHeight, depth], [-width / 2 + (i + .5) * width / count, baseY - finHeight / 2, 0]);
  }
  // Organoid model: concentric radial cells; the surrounding medium is one lumped, well-mixed node.
  const tissue = component(organoid, "tissue"), medium = component(organoid, "medium"), recording = component(organoid, "recording");
  const cooler = component(organoid, "cooler"), sensor = component(organoid, "sensor"), rejection = component(organoid, "rejection");
  const sphereCenter = new T.Vector3(0, 2.1, 0), sphereRoot = new T.Group(); tissue.add(sphereRoot); sphereRoot.position.copy(sphereCenter);
  const fullSphere = mesh(sphereRoot, new T.SphereGeometry(1, 64, 40), mat("tissue", 0xc3b9ab, { roughness: .67 }));
  const radialGroup = new T.Group(); sphereRoot.add(radialGroup); radialGroup.visible = false;
  let shellMeshes = [], shellValues = [], shellCount = 0, radiusMm = 1.5, sectioned = false, inspectionView = false;
  const sectionGroups = [];
  const mediumWalls = [], wellWalls = [];
  function sectionCylinder(parent, material, radius, height, center, thickness = .1) {
    const full = cylinder(parent, material, radius, height, center, true);
    const half = mesh(parent, new T.CylinderGeometry(radius, radius, height, 64, 1, true, Math.PI / 2, Math.PI), material, center);
    half.visible = false;
    sectionGroups.push([full, half]);
    (material === materials.medium ? mediumWalls : wellWalls).push(full, half);
    if (thickness) {
      const ring = mesh(parent, new T.RingGeometry(radius - thickness, radius, 64), material, [center[0], center[1] - height / 2, center[2]]); ring.rotation.x = -Math.PI / 2;
    }
  }
  sectionCylinder(medium, materials.glass, 5.1, 5.3, [0, 2.25, 0]);
  sectionCylinder(medium, materials.medium, 4.85, 4.5, [0, 2, 0], 0);
  const meniscus = mesh(medium, new T.CircleGeometry(4.85, 64), materials.medium, [0, 4.25, 0]); meniscus.rotation.x = -Math.PI / 2;
  sectionGroups.push([meniscus, new T.Group()]);
  const mediumSection = mesh(medium, new T.PlaneGeometry(9.7, 4.5), materials.medium, [0, 2, -.01]); mediumSection.visible = false;
  box(recording, materials.ceramic, [11.7, .26, 11.7], [0, -.13, 0]);
  box(recording, materials.dark, [12.6, .22, 12.6], [0, -.37, 0]);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
    const x = (i - 2.5) * .66, z = (j - 2.5) * .66;
    cylinder(recording, materials.gold, .065, .014, [x, .012, z]);
    path(recording, [[x, .014, z], [x, .014, -4.8], [x + .05, .014, -6.5]], 0x8c7c59, false, .009);
  }
  box(cooler, materials.cold, [10.3, .5, 10.3], [0, -.74, 0]);
  box(cooler, materials.ceramic, [9.2, .24, 9.2], [0, -1.11, 0]);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) box(cooler, (i + j) % 2 ? materials.dark : materials.titanium, [.65, .7, .65], [(i - 2.5) * 1.25, -1.58, (j - 2.5) * 1.25]);
  box(cooler, materials.ceramic, [9.2, .24, 9.2], [0, -2.05, 0]);
  box(rejection, materials.hot, [11.7, .5, 11.7], [0, -2.42, 0]);
  finSink(rejection, 14, -2.82, 1.8, 14);
  // Sensors are proposed observation locations; no selected probe construction is implied.
  mesh(sensor, new T.SphereGeometry(.18, 16, 10), materials.violet, [2.2, 2.1, 0]);
  const mediumProbeLead = path(sensor, [[2.2, 2.1, 0], [3.3, 2.8, 0], [5.6, 3.1, 0]], 0x9483be, true, .035);
  const coldSensor = mesh(sensor, new T.SphereGeometry(.13, 16, 10), materials.cold, [5.2, -.7, 0]);
  const hotSensor = mesh(sensor, new T.SphereGeometry(.13, 16, 10), materials.hot, [5.9, -2.4, 0]);
  const flowGroup = new T.Group(); organoid.add(flowGroup);
  const flowSegments = [];
  function flowArrow(points, color) {
    const group = new T.Group(); flowGroup.add(group);
    const shaft = path(group, points, color, false, .055);
    const end = new T.Vector3(...points.at(-1)), prev = new T.Vector3(...points.at(-2));
    const cone = mesh(group, new T.ConeGeometry(.16, .4, 12), mat("flow" + color, color), end.toArray());
    cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), end.clone().sub(prev).normalize());
    flowSegments.push({ group, shaft, cone, direction: end.clone().sub(prev).normalize() });
    return group;
  }
  const contactFlow = flowArrow([[6.5, 2.5, 1], [7, 1, 1], [7, -.7, 1]], 0x6bb6c7);
  const hotFlow = flowArrow([[7, -2.4, 1], [8.2, -2.4, 1], [8.2, -4.4, 1]], 0xc29b69);
  const tissueLabel = label(tissue, "RADIAL THERMAL MODEL", [-.8, 3.9, 0], "left");
  const mediumLabel = label(medium, "WELL-MIXED MEDIUM", [4.8, 3.5, 0]);
  label(recording, "RECORDING SUBSTRATE", [-5, 0, 3], "left");
  label(cooler, "TEC STACK", [-5, -1.5, 2], "left");
  label(rejection, "FINITE HEAT REJECTION", [5.8, -3.4, 0]);
  // Independent bench scale. Board silhouettes represent classes, never identified PCB models.
  const controller = component(prototype, "controller"), acquisition = component(prototype, "acquisition");
  const benchCooler = component(prototype, "cooler"), driver = component(prototype, "driver"), benchSensor = component(prototype, "sensor"), benchRejection = component(prototype, "rejection");
  function board(parent, center, width, depth, proposed = false) {
    box(parent, proposed ? materials.uncertain : materials.board, [width, 1.6, depth], center);
    const [x, y, z] = center;
    box(parent, materials.chip, [width * .3, 1.8, depth * .25], [x, y + 1.7, z]);
    for (const side of [-1, 1]) {
      box(parent, materials.chip, [width - 6, 3, 3.2], [x, y + 2, z + side * (depth / 2 - 3)]);
      for (let i = 0; i < Math.floor(width / 3.5); i++) box(parent, materials.gold, [.65, .25, .65], [x - width / 2 + 4 + i * 3.5, y + 3.63, z + side * (depth / 2 - 3)]);
    }
    for (let i = 0; i < 5; i++) box(parent, materials.ceramic, [1.8, .7, 3], [x - width * .27 + i * 2.7, y + 1.2, z + depth * .23]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const ring = mesh(parent, new T.RingGeometry(1.1, 1.6, 20), materials.gold, [x + sx * (width / 2 - 3), y + .82, z + sz * (depth / 2 - 3)]); ring.rotation.x = -Math.PI / 2;
    }
  }
  board(controller, [-62, 4, 10], 53, 68);
  box(controller, materials.titanium, [11, 9, 14], [-77, 8, -24]);
  board(acquisition, [-3, 4, -24], 35, 28);
  board(driver, [-4, 4, 28], 30, 24, true);
  benchCooler.position.set(58, 0, -2); benchRejection.position.copy(benchCooler.position);
  box(benchCooler, materials.ceramic, [30, 1, 30], [0, 15, 0]);
  box(benchCooler, materials.dark, [27, 3, 27], [0, 13, 0]);
  box(benchCooler, materials.ceramic, [30, 1, 30], [0, 11, 0]);
  box(benchRejection, materials.hot, [40, 2, 40], [0, 9.5, 0]);
  finSink(benchRejection, 48, 6, 12, 48, 13);
  mesh(benchSensor, new T.SphereGeometry(1.6, 16, 10), materials.uncertain, [78, 16, 6]);
  path(benchSensor, [[78, 16, 6], [84, 21, 8], [90, 21, 8]], 0x7e8b98, true, .3);
  // Dashed envelopes distinguish supplemental instrumentation from the user-reported inventory.
  for (const [parent, size, center] of [[driver, [34, 8, 28], [-4, 6, 28]], [benchRejection, [50, 18, 50], [0, 1, 0]], [benchSensor, [10, 10, 10], [78, 16, 6]]]) {
    const source = new T.BoxGeometry(...size), geometry = new T.EdgesGeometry(source); source.dispose(); geometries.add(geometry);
    const material = new T.LineDashedMaterial({ color: 0x8c9aa6, dashSize: 1.8, gapSize: 1.3, transparent: true, opacity: .65 }); disposable.add(material);
    const envelope = new T.LineSegments(geometry, material); envelope.position.set(...center); envelope.computeLineDistances(); parent.add(envelope);
  }
  const conceptual = new T.Group(); prototype.add(conceptual);
  path(conceptual, [[-35, 7, -8], [-22, 7, -8], [-20, 7, -24]], 0x9b8ac3, true, .3);
  path(conceptual, [[-35, 7, 24], [-23, 7, 24], [-19, 7, 28]], 0x8ba5bb, true, .3);
  path(conceptual, [[11, 7, 28], [32, 7, 28], [43, 14, 10]], 0x8ba5bb, true, .3);
  path(conceptual, [[78, 16, 6], [91, 16, 6], [91, 3, 47], [-57, 3, 47], [-57, 7, 42]], 0x768491, true, .3);
  label(controller, "REPORTED CONTROLLER", [-62, 6.7, 10], "left");
  label(acquisition, "ACQUISITION / UNIDENTIFIED", [-3, 6.7, -24], "right");
  label(driver, "PROPOSED DRIVER", [-4, 6.7, 28], "left");
  label(benchCooler, "REPORTED PELTIER", [0, 15.5, 0]);
  label(benchRejection, "PROPOSED HEAT SINK", [24, 0, 12]);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false; controls.enablePan = false;
  controls.touches.ONE = T.TOUCH.ROTATE; controls.touches.TWO = T.TOUCH.DOLLY_ROTATE;
  controls.maxPolarAngle = Math.PI * .86; controls.minPolarAngle = .12;
  let mode = options.mode === "prototype" ? "prototype" : "organoid", disposed = false, contextLost = false, renderCount = 0, renderCPU = 0, selected = null;
  let lastFrame = {}, lastParams = {}, width = 1, height = 1;
  const vector = new T.Vector3(), raycaster = new T.Raycaster();
  const selectedHelper = new T.Box3Helper(new T.Box3(), 0x8caebd); selectedHelper.visible = false; scene.add(selectedHelper);
  geometries.add(selectedHelper.geometry); disposable.add(selectedHelper.material);
  function activeAncestor(object) { for (let p = object; p; p = p.parent) if (!p.visible) return false; return true; }
  function render() {
    if (disposed || contextLost || !width || !height) return;
    const start = performance.now(); renderer.render(scene, camera); renderCPU = performance.now() - start; renderCount++;
    for (const item of labels) {
      item.anchor.getWorldPosition(vector); vector.project(camera);
      const visible = (!inspectionView || ["tissue", "medium"].includes(item.root.userData.component)) && activeAncestor(item.anchor) && vector.z > -1 && vector.z < 1 && Math.abs(vector.x) < 1.05 && Math.abs(vector.y) < 1.05;
      item.node.style.display = visible ? "block" : "none"; item.line.style.display = visible ? "block" : "none";
      if (visible) {
        const x = (vector.x * .5 + .5) * width, y = (-vector.y * .5 + .5) * height;
        const compact = width < 620;
        item.node.style.fontSize = "11px";
        const labelWidth = item.node.offsetWidth;
        const left = item.placement === "left" ? x - labelWidth - 24 : x + 24;
        item.node.style.left = Math.max(8, Math.min(width - labelWidth - 8, left)) + "px";
        const labelTop = Math.max(6, Math.min(height - 26, y - 28));
        item.node.style.top = labelTop + "px";
        const labelLeft = parseFloat(item.node.style.left);
        const nearX = Math.max(labelLeft, Math.min(labelLeft + labelWidth, x));
        item.line.setAttribute("x1", x); item.line.setAttribute("y1", y);
        item.line.setAttribute("x2", nearX); item.line.setAttribute("y2", labelTop + 12);
        item.node.style.opacity = compact && item.root.userData.component !== "tissue" && item.root.userData.component !== "cooler" && item.root.userData.component !== "controller" ? "0" : "1";
        item.line.style.opacity = item.node.style.opacity;
      }
    }
  }
  function reset() {
    inspectionView = false; sectionBadge.hidden = true; mediumLabel.position.set(4.8, 2 * radiusMm + .8, 0);
    const bench = mode === "prototype", active = bench ? prototype : organoid;
    active.updateWorldMatrix(true, true);
    const bounds = new T.Box3().setFromObject(active), center = bounds.getCenter(new T.Vector3());
    const direction = new T.Vector3(.54, bench ? .48 : .34, .72).normalize();
    const right = new T.Vector3().crossVectors(new T.Vector3(0, 1, 0), direction).normalize();
    const up = new T.Vector3().crossVectors(direction, right).normalize();
    const tangentY = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    const tangentX = tangentY * Math.max(.2, camera.aspect);
    let distance = 0;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const p = new T.Vector3(x, y, z).sub(center), front = p.dot(direction);
      distance = Math.max(distance, front + Math.abs(p.dot(right)) / (tangentX * .84), front + Math.abs(p.dot(up)) / (tangentY * .84));
    }
    controls.target.copy(center); camera.position.copy(center).addScaledVector(direction, Math.max(bench ? 150 : 22, distance));
    controls.minDistance = bench ? 80 : 3; controls.maxDistance = Math.max(bench ? 650 : 90, distance * 2);
    camera.near = bench ? .5 : .02; camera.far = Math.max(bench ? 2000 : 400, distance * 4); camera.updateProjectionMatrix(); controls.update(); render();
  }
  function focusSection() {
    if (mode !== "organoid") return;
    inspectionView = true; sectionBadge.hidden = false;
    const tangent = Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * Math.min(1, camera.aspect);
    const distance = (radiusMm + .95) / (tangent * .84);
    controls.target.copy(sphereRoot.position);
    camera.position.copy(controls.target).addScaledVector(new T.Vector3(.24, .12, 1).normalize(), distance);
    controls.minDistance = Math.max(2.5, radiusMm * 1.5); controls.maxDistance = Math.max(90, distance * 3);
    mediumLabel.position.set(radiusMm + .8, radiusMm + .6, 0);
    controls.update(); render();
  }
  function resize() {
    const rect = host.getBoundingClientRect(); width = rect.width; height = rect.height;
    if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
  }
  function rebuildShells(count) {
    for (const child of [...radialGroup.children]) { child.geometry.dispose(); geometries.delete(child.geometry); child.material.dispose(); disposable.delete(child.material); radialGroup.remove(child); const n = pickable.indexOf(child); if (n >= 0) pickable.splice(n, 1); }
    shellMeshes = []; shellCount = count;
    for (let i = 0; i < count; i++) {
      const inner = i / count, outer = (i + 1) / count;
      const material = new T.MeshStandardMaterial({ color: 0xc3b9ab, roughness: .67, side: T.DoubleSide }); disposable.add(material);
      const shell = mesh(radialGroup, new T.SphereGeometry(outer, 48, 28, Math.PI, Math.PI), material);
      const face = mesh(radialGroup, new T.RingGeometry(inner, outer, 64), material, [0, 0, .002 + i * .00001]);
      const boundaryGeometry = new T.BufferGeometry().setFromPoints(Array.from({ length: 96 }, (_, j) => new T.Vector3(Math.cos(j / 96 * Math.PI * 2) * outer, Math.sin(j / 96 * Math.PI * 2) * outer, .004)));
      geometries.add(boundaryGeometry);
      const boundaryMaterial = new T.LineBasicMaterial({ color: 0x30444d, transparent: true, opacity: .22 }); disposable.add(boundaryMaterial);
      radialGroup.add(new T.LineLoop(boundaryGeometry, boundaryMaterial));
      shellMeshes.push({ shell, face, material });
    }
  }
  function temperatureColor(value, reference) {
    const base = new T.Color(0xc3b9ab), cool = new T.Color(0x4c9ebd), warm = new T.Color(0xc59358);
    const delta = value - reference;
    return base.lerp(delta < 0 ? cool : warm, Math.min(1, Math.abs(delta) / 8));
  }
  let fittedRadius = null;
  function update(frame = {}, params = {}) {
    const proposedRadius = Number(params.radiusMm ?? 1.5);
    if (!Number.isFinite(proposedRadius) || proposedRadius <= 0 || proposedRadius > 10) throw new RangeError("Research scene radiusMm must be finite, positive, and at most 10 mm.");
    radiusMm = proposedRadius;
    const values = Array.isArray(frame.tissue) || ArrayBuffer.isView(frame.tissue) ? Array.from(frame.tissue) : [];
    if (frame.tissue != null && (!values.length || values.length > 256 || !values.every(Number.isFinite))) throw new RangeError("Research scene tissue must contain 1–256 finite radial-cell temperatures.");
    lastFrame = frame; lastParams = params;
    if (values.length) {
      shellValues = values;
      if (shellCount !== values.length) rebuildShells(values.length);
      const reference = Number.isFinite(params.referenceTemperature) ? params.referenceTemperature : Number.isFinite(params.initialTemperature) ? params.initialTemperature : 20;
      shellMeshes.forEach((item, i) => item.material.color.copy(temperatureColor(values[i], reference)));
      fullSphere.material.color.copy(temperatureColor(Number.isFinite(frame.surface) ? frame.surface : values.at(-1), reference));
    }
    fullSphere.visible = !sectioned || !shellCount; radialGroup.visible = sectioned && shellCount > 0;
    sphereRoot.scale.setScalar(radiusMm); sphereRoot.position.y = radiusMm + .6;
    const radiusChanged = fittedRadius !== radiusMm;
    if (radiusChanged) {
      tissueLabel.position.set(0, 2 * radiusMm + .6, 0);
      mediumLabel.position.y = 2 * radiusMm + .8;
      const mediumHeight = 2 * radiusMm + 1.5, wellHeight = mediumHeight + .8;
      const radialScale = Math.max(1, (radiusMm + 1.2) / 4.85);
      for (const wall of mediumWalls) { wall.scale.set(radialScale, mediumHeight / 4.5, radialScale); wall.position.y = -.25 + mediumHeight / 2; }
      for (const wall of wellWalls) { wall.scale.set(radialScale, wellHeight / 5.3, radialScale); wall.position.y = -.4 + wellHeight / 2; }
      mediumSection.position.y = -.25 + mediumHeight / 2; mediumSection.scale.set(radialScale, mediumHeight / 4.5, 1);
      meniscus.position.y = -.25 + mediumHeight; meniscus.scale.set(radialScale, radialScale, 1);
      sensor.children[0].position.set(radiusMm + .7, radiusMm + .6, 0);
      const probePoints = [[radiusMm + .7, radiusMm + .6, 0], [radiusMm + 1.8, radiusMm + 1.3, 0], [radiusMm + 4.1, radiusMm + 1.6, 0]];
      mediumProbeLead.geometry.setFromPoints(probePoints.map(p => new T.Vector3(...p))); mediumProbeLead.computeLineDistances();
      mediumProbeLead.geometry.computeBoundingSphere();
      fittedRadius = radiusMm;
    }
    materials.medium.color.copy(temperatureColor(Number.isFinite(frame.medium) ? frame.medium : 20, Number.isFinite(params.referenceTemperature) ? params.referenceTemperature : Number.isFinite(params.initialTemperature) ? params.initialTemperature : 20));
    materials.cold.color.copy(temperatureColor(Number.isFinite(frame.Tc) ? frame.Tc : 20, Number.isFinite(params.referenceTemperature) ? params.referenceTemperature : Number.isFinite(params.initialTemperature) ? params.initialTemperature : 20));
    materials.hot.color.copy(temperatureColor(Number.isFinite(frame.Th) ? frame.Th : 20, Number.isFinite(params.referenceTemperature) ? params.referenceTemperature : Number.isFinite(params.initialTemperature) ? params.initialTemperature : 20));
    contactFlow.visible = Number.isFinite(frame.qContact) && Math.abs(frame.qContact) > 1e-6;
    hotFlow.visible = Number.isFinite(frame.rejected) && Math.abs(frame.rejected) > 1e-6;
    for (const [entry, value] of [[flowSegments[0], frame.qContact], [flowSegments[1], frame.rejected]]) {
      entry.cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), entry.direction.clone().multiplyScalar(value < 0 ? -1 : 1));
      entry.group.userData.watts = Number.isFinite(value) ? value : null;
    }
    coldSensor.visible = true; hotSensor.visible = true;
    sensor.children[0].material = frame.sensor === null ? mat("fault", 0x9b6c69, { roughness: .65 }) : materials.violet;
    if (radiusChanged && mode === "organoid") { if (inspectionView) focusSection(); else reset(); }
    if (selected) { const active = (groups.get(selected) || []).find(activeAncestor); if (active) selectedHelper.box.setFromObject(active); }
    render();
  }
  function setMode(next) { mode = next === "prototype" ? "prototype" : "organoid"; organoid.visible = mode === "organoid"; prototype.visible = !organoid.visible; selectedHelper.visible = false; selected = null; resize(); reset(); }
  function section(value) {
    sectioned = Boolean(value); fullSphere.visible = !sectioned || !shellCount; radialGroup.visible = sectioned && shellCount > 0; mediumSection.visible = sectioned;
    for (const [full, half] of sectionGroups) { full.visible = !sectioned; half.visible = sectioned; }
    if (sectioned && mode === "organoid") focusSection(); else reset();
  }
  function choose(id) {
    const active = (groups.get(id) || []).find(activeAncestor);
    if (!active) return;
    selected = id; selectedHelper.box.setFromObject(active); selectedHelper.visible = true; options.onSelect?.(id); render();
  }
  let pointerDown = null;
  function down(event) { pointerDown = { x: event.clientX, y: event.clientY }; }
  function up(event) {
    if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 6) { pointerDown = null; return; }
    pointerDown = null; const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new T.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    const hits = raycaster.intersectObjects(pickable, false).filter(h => activeAncestor(h.object));
    // Transparent culture walls should not intercept selection of the preparation inside.
    const hit = hits.find(h => !h.object.material.transparent) || hits[0];
    if (hit) for (let obj = hit.object; obj; obj = obj.parent) if (obj.userData.component) { choose(obj.userData.component); break; }
  }
  function key(event) {
    const offset = camera.position.clone().sub(controls.target), spherical = new T.Spherical().setFromVector3(offset);
    if (event.key === "ArrowLeft") spherical.theta -= .13;
    else if (event.key === "ArrowRight") spherical.theta += .13;
    else if (event.key === "ArrowUp") spherical.phi = Math.max(.12, spherical.phi - .13);
    else if (event.key === "ArrowDown") spherical.phi = Math.min(Math.PI * .86, spherical.phi + .13);
    else if (event.key === "+" || event.key === "=") spherical.radius = Math.max(controls.minDistance, spherical.radius * .87);
    else if (event.key === "-") spherical.radius = Math.min(controls.maxDistance, spherical.radius / .87);
    else if (event.key === "Home") { event.preventDefault(); reset(); return; }
    else if (event.key === "Enter") { event.preventDefault(); choose(mode === "organoid" ? "tissue" : "controller"); return; }
    else return;
    event.preventDefault(); camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(spherical)); controls.update(); render();
  }
  function lost(event) { event.preventDefault(); contextLost = true; labelLayer.hidden = true; host.dispatchEvent(new CustomEvent("research-contextlost", { bubbles: true, detail: { reason: "WebGL context lost" } })); options.onContextLoss?.(); }
  function restored() { contextLost = false; labelLayer.hidden = false; render(); }
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointerup", up); canvas.addEventListener("keydown", key);
  canvas.addEventListener("webglcontextlost", lost); canvas.addEventListener("webglcontextrestored", restored);
  controls.addEventListener("change", render);
  const observer = new ResizeObserver(resize); observer.observe(host);
  resize(); setMode(mode); update({}, {});
  return {
    update, setMode, section, reset, select: choose,
    stats() {
      const componentPixels = {};
      for (const [id, entries] of groups) {
        const active = entries.find(activeAncestor); if (!active) continue;
        const point = new T.Box3().setFromObject(active).getCenter(new T.Vector3()).project(camera);
        componentPixels[id] = { x: (point.x * .5 + .5) * width, y: (-point.y * .5 + .5) * height, coordinates: "host-local CSS pixels; projected bounds center, may be occluded" };
      }
      return { componentPixels, disposed, glContextLost: gl.isContextLost(), memory: { geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }, cameraPosition: camera.position.toArray(), cameraTarget: controls.target.toArray(), view: inspectionView ? "section-close-up" : "apparatus", adapter, softwareRenderer, mode, section: sectioned, selected, radiusMm, shellTemperatures: [...shellValues], mediumTemperature: Number.isFinite(lastFrame.medium) ? lastFrame.medium : null, radialCells: shellCount, geometry: "concentric finite-volume radial shell display; no azimuthal variation", units: "mm; all apparatus dimensions illustrative", mediumWellGeometry: "illustrative containment; not used to derive lumped medium heat capacity", heatFlowDisplay: "signed fixed-size arrows; no flux magnitude or spatial flux field inferred", boundary: "sphere uniformly coupled to one well-mixed medium node; medium to cold node through effective resistance", referenceTemperature: lastParams.referenceTemperature ?? lastParams.initialTemperature ?? 20, triangles: renderer.info.render.triangles, drawCalls: renderer.info.render.calls, renderCount, renderCPU, contextLost, componentIds: [...groups.keys()] }; },
    dispose() {
      if (disposed) return; disposed = true; observer.disconnect(); controls.removeEventListener("change", render); controls.dispose();
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointerup", up); canvas.removeEventListener("keydown", key); canvas.removeEventListener("webglcontextlost", lost); canvas.removeEventListener("webglcontextrestored", restored);
      for (const g of geometries) g.dispose(); for (const m of Object.values(materials)) m.dispose(); for (const m of disposable) m.dispose();
      environment.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); labelLayer.remove();
    }
  };
}
