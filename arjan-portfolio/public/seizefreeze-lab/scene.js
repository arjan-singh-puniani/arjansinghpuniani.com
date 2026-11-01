import * as T from "/pit-stop-lab/vendor/three.module.js";
import { OrbitControls } from "/pit-stop-lab/vendor/OrbitControls.js";
import { createAnatomy } from "./anatomy.js";
import { createDevice } from "./device.js";
import { fitDevice } from "./device-fit.js";
import { deviceSpec, componentIds, anchors, explodedOffsets } from "./device-spec.js";

// Original concept device on attributed reference anatomy; device dimensions and layer gaps are schematic.
export async function createScene(host, onSelect = () => {}, onLayer = () => {}) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0b1117, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  const canvas = renderer.domElement;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Human Reference Atlas brain and head with an illustrative left superior temporal target, compact proposed device and peelable access layers. Use the layer slider and camera buttons for keyboard alternatives.");
  Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block", touchAction: "pan-y", cursor: "grab" });
  host.append(canvas);
  const gl = renderer.getContext(), ext = gl.getExtension("WEBGL_debug_renderer_info");
  const adapter = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unavailable";
  const softwareRenderer = /SwiftShader|llvmpipe|Software Rasterizer/i.test(adapter);
  if (softwareRenderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.75));
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(34, 1, 0.2, 3000);
  const lensCamera = new T.PerspectiveCamera(32, 1, 0.1, 2000);
  renderer.info.autoReset = false;
  renderer.shadowMap.enabled = !softwareRenderer;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
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
  controls.touches.TWO = T.TOUCH.DOLLY_ROTATE;
  // OrbitControls normally disables document touch scrolling. Restore vertical pan.
  canvas.style.touchAction = "pan-y";
  scene.add(new T.HemisphereLight(0xb9cfde, 0x111820, 0.64));
  const key = new T.DirectionalLight(0xffeddb, 2.55);
  key.position.set(-190, 240, 150);
  key.castShadow = !softwareRenderer;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -150, right: 150, top: 160, bottom: -140, near: 30, far: 650 });
  key.shadow.normalBias = 0.65;
  key.shadow.bias = -0.0003;
  key.shadow.radius = 3;
  scene.add(key);
  const rim = new T.DirectionalLight(0x9fc9e3, 2.1);
  rim.position.set(135, 95, -170);
  scene.add(rim);
  const warm = new T.DirectionalLight(0xe4ddd0, 0.5);
  warm.position.set(-130, -70, 120);
  scene.add(warm);
  const studio = new T.Scene();
  studio.background = new T.Color(0x111821);
  for (const [position, size, color] of [
    [[-5, 2, 0], [0.1, 9, 12], 0xf1eee8], [[4, 2, -1], [0.1, 5, 1], 0xb7d2e0],
    [[0, 7, 1], [7, 0.1, 4], 0xffffff], [[0, 1, -6], [6, 2, 0.1], 0xa9b9c8],
    [[1, -3, 4], [4, 0.1, 2], 0x748da0],
  ]) {
    const light = new T.Mesh(new T.BoxGeometry(...size), new T.MeshBasicMaterial({ color }));
    light.position.set(...position); studio.add(light);
  }
  const pmrem = softwareRenderer ? null : new T.PMREMGenerator(renderer), environment = pmrem?.fromScene(studio, 0.04);
  scene.environment = environment?.texture ?? null;
  scene.environmentIntensity = 0.78;
  studio.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); pmrem?.dispose();
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
    titanium: material(0xc5ccd0, 0.93, 0.25, { roughnessMap: grain, bumpMap: softwareRenderer ? null : grain, bumpScale: 0.0015, envMapIntensity: 1.35 }),
    darkmetal: material(0x97a8b1, 0.84, 0.27, { envMapIntensity: 1.45 }), ceramic: material(0xd2dad2, 0.04, 0.43),
    insulation: material(0x182831, 0.06, 0.8), gold: material(0xd0ac76, 0.85, 0.31),
    cold: material(0x91c4c9, 0.76, 0.28), hot: material(0xc1a075, 0.84, 0.3),
    blue: material(0x478abb, 0.3, 0.4), violet: material(0xa693c6, 0.4, 0.4),
    board: material(0x254c52, 0.25, 0.57), chip: material(0x111e27, 0.1, 0.4),
    tissue: material(0x9b7f85, 0, 0.86, { vertexColors: true, side: T.DoubleSide }),
    contact: material(0xc3d4d3, 0.1, 0.52, { transparent: true, opacity: 0.85 }),
  };
  const anatomy = await createAnatomy(T, { simplifySurroundings: softwareRenderer, onProgress: fraction => {
    const loading = host.querySelector('#scene-loading');
    if (loading) loading.textContent = `Loading reference anatomy… ${Math.round(fraction * 100)}%`;
  }});
  scene.add(anatomy.group);
  const fit = fitDevice(anatomy.cortexMeshes.map(mesh => ({ positions: mesh.geometry.attributes.position.array, indices: mesh.geometry.index?.array })), {
    target: anatomy.target.toArray(), normal: anatomy.normal.toArray(), u: anatomy.u.toArray(), v: anatomy.v.toArray(),
    span: deviceSpec.fit.span, minRigidY: deviceSpec.body.bottom, clearance: deviceSpec.fit.minimumRigidClearance,
  });
  const device = createDevice(T, mats, fit), { root, groups } = device;
  scene.add(root);
  const ids = componentIds, allPickable = device.pickable, highlights = [];
  const seated = Object.fromEntries(ids.map(id => [id, 0])), offsets = explodedOffsets;
  const mount = anatomy.target.clone().addScaledVector(anatomy.normal, fit.datum);
  root.position.copy(mount);
  root.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(anatomy.u, anatomy.normal, anatomy.v.clone().negate()));
  let peelValue = 0.86;
  anatomy.peel(peelValue);
  anatomy.setContext?.("region");
  const labelLayer = document.createElement("div");
  labelLayer.dataset.sfLabel = "true";
  labelLayer.dataset.sfOverlay = "true";
  Object.assign(labelLayer.style, { position: "absolute", inset: "0", pointerEvents: "none", overflow: "hidden", zIndex: "2" }); labelLayer.setAttribute("aria-hidden", "true"); host.append(labelLayer);
  const ns = "http://www.w3.org/2000/svg", labelSvg = document.createElementNS(ns, "svg");
  Object.assign(labelSvg.style, { width: "100%", height: "100%", overflow: "hidden" }); labelLayer.append(labelSvg);
  const title = document.createElement("div");
  title.className = "sf-scene-note";
  title.dataset.sfOverlay = "true";
  Object.assign(title.style, { position: "absolute", left: "24px", bottom: "16px", maxWidth: "calc(100% - 48px)", color: "#a5b9c6", font: "11px/1.6 monospace", letterSpacing: ".04em", pointerEvents: "none" });
  title.textContent = "PROPOSED STACK · LAYER GAPS EXAGGERATED · ILLUSTRATIVE ANATOMY"; host.append(title);
  const labelInfo = { ...anchors, ...device.anchors };
  const connections = new T.Group(); root.add(connections);
  let selected = null, exploded = false, currentView = "region", disposed = false, visible = true, active = true, frames = 0, raf = 0, renderMilliseconds = [];
  let transition = null, lensRect = null, lensOuterRect = null, showDimensions = false, lastRenderTime = 0, slowFrames = 0;
  const projectionOffset = new T.Vector2(), reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const clearColor = new T.Color(), lensCoverings = ["scalp", "skull", "dura", "arachnoid", "csf"];
  function lensElement() { return host.querySelector("#device-lens"); }
  function openingOverview() { return currentView === "region" && document.body.dataset.anatomyGuide === "false"; }
  function updateLens() {
    const element = lensElement();
    const placementTab = document.querySelector("#placement-tab");
    const placement = placementTab ? placementTab.getAttribute("aria-pressed") === "true" : currentView === "region" || currentView === "head";
    const shown = Boolean(element && placement && peelValue >= .72 && active);
    if (element) element.hidden = !shown;
    lensRect = lensOuterRect = null;
    if (!shown) return;
    const bounds = element.getBoundingClientRect(), hostBounds = host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    lensOuterRect = { x: bounds.left - hostBounds.left, y: bounds.top - hostBounds.top, width: bounds.width, height: bounds.height };
    lensRect = { x: lensOuterRect.x + 1, y: lensOuterRect.y + 32, width: lensOuterRect.width - 2, height: Math.max(40, lensOuterRect.height - 61) };
    lensCamera.aspect = lensRect.width / lensRect.height; lensCamera.updateProjectionMatrix();
    scene.updateMatrixWorld(true);
    const bounds3D = new T.Box3().setFromObject(root), focus = bounds3D.getCenter(new T.Vector3());
    const direction = new T.Vector3(.35, 1, .74).normalize().applyQuaternion(root.quaternion);
    lensCamera.up.set(0, 0, -1).applyQuaternion(root.quaternion).normalize();
    const right = new T.Vector3().crossVectors(lensCamera.up, direction).normalize();
    const up = new T.Vector3().crossVectors(direction, right).normalize();
    const halfFov = Math.tan(T.MathUtils.degToRad(lensCamera.fov / 2));
    let distance = 12;
    root.traverse(object => {
      if (!object.isMesh) return;
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      const b = object.geometry.boundingBox;
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
        const relative = new T.Vector3(x, y, z).applyMatrix4(object.matrixWorld).sub(focus), depth = relative.dot(direction);
        distance = Math.max(distance, depth + Math.abs(relative.dot(up)) / halfFov, depth + Math.abs(relative.dot(right)) / (halfFov * lensCamera.aspect));
      }
    });
    lensCamera.position.copy(focus).addScaledVector(direction, distance * 1.13); lensCamera.lookAt(focus); lensCamera.updateMatrixWorld();
  }
  function lensPackagePixel() {
    if (!lensRect) return null;
    const point = groups.package.localToWorld(new T.Vector3(...labelInfo.package.point)).project(lensCamera);
    return { x: lensRect.x + (point.x * .5 + .5) * lensRect.width, y: lensRect.y + (-point.y * .5 + .5) * lensRect.height, coordinates: "host-local CSS pixels" };
  }
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
    ] : shown.map(id => {
      const info = labelInfo[id], point = new T.Vector3(...info.point);
      groups[id].localToWorld(point);
      return { ...info, point };
    })).map(info => {
      const v = info.point.clone().project(camera);
      return { ...info, x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, z: v.z };
    }).filter(p => p.z > -1 && p.z < 1 && p.x > -20 && p.x < w + 20 && p.y > -20 && p.y < h + 20);
    labelSvg.replaceChildren();
    if (lensRect) {
      const p = mount.clone().addScaledVector(anatomy.normal, 2).project(camera);
      const x = (p.x * .5 + .5) * w, y = (-p.y * .5 + .5) * h;
      const connector = document.createElementNS(ns, "path");
      connector.setAttribute("d", `M ${x} ${y} L ${lensOuterRect.x - 20} ${lensRect.y + lensRect.height * .72} L ${lensOuterRect.x} ${lensRect.y + lensRect.height * .72}`);
      connector.setAttribute("fill", "none"); connector.setAttribute("stroke", "#8b9da8"); connector.setAttribute("stroke-width", ".8"); connector.setAttribute("stroke-dasharray", "4 5"); connector.setAttribute("opacity", ".55");
      labelSvg.append(connector);
    }
    entries.forEach((p, i) => {
      const mobile = w < 560;
      const label = mobile && p.label === "LEFT SUPERIOR TEMPORAL GYRUS" ? "LEFT STG · EXAMPLE TARGET" : mobile && p.label.startsWith("SEIZEFREEZE") ? "10 MM CONTACT" : p.label;
      const textWidth = Math.max(110, label.length * 6.8);
      const tx = p.side < 0 ? (mobile ? 18 : 32) : w - textWidth - (mobile ? 18 : 32);
      let ty = Math.max(mobile ? 250 : 180, Math.min(h - (mobile ? 190 : 145), p.y - 32));
      if (entries.length > 1 && mobile) ty = [Math.max(270, p.y - 30), h * .57][i];
      const edgeX = p.side < 0 ? tx + textWidth : tx;
      const path = document.createElementNS(ns, "path"); path.setAttribute("d", `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${edgeX} ${ty + 8} L ${tx} ${ty + 8}`);
      path.setAttribute("fill", "none"); path.setAttribute("stroke", p.color); path.setAttribute("stroke-width", ".7"); path.setAttribute("opacity", ".6");
      const dot = document.createElementNS(ns, "circle"); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.setAttribute("r", "2.2"); dot.setAttribute("fill", p.color);
      const text = document.createElementNS(ns, "text"); text.setAttribute("x", tx); text.setAttribute("y", ty); text.setAttribute("fill", p.color); text.setAttribute("font-family", "monospace"); text.setAttribute("font-size", "11"); text.setAttribute("letter-spacing", ".6");
      text.setAttribute("stroke", "#0b1117"); text.setAttribute("stroke-width", "3"); text.setAttribute("paint-order", "stroke"); text.textContent = label;
      labelSvg.append(path, dot, text);
    });
  }
  function dimensions() {
    if (!showDimensions || !["system", "interface"].includes(currentView)) return;
    const w = host.clientWidth, h = host.clientHeight;
    const guides = [
      { id: "interface", a: [-5, 0, 5.4], b: [5, 0, 5.4], text: "10 mm contact · assumed" },
      { id: "package", a: [-6, 3.25, -6.4], b: [6, 3.25, -6.4], text: "12 mm housing · assumed" },
    ];
    for (const guide of guides) {
      const project = p => { const v = groups[guide.id].localToWorld(new T.Vector3(...p)).project(camera); return { x: (v.x * .5 + .5) * w, y: (-v.y * .5 + .5) * h, z: v.z }; };
      const a = project(guide.a), b = project(guide.b);
      if ([a,b].some(p => p.z < -1 || p.z > 1)) continue;
      const line = document.createElementNS(ns, "path");
      line.setAttribute("d", `M ${a.x} ${a.y} L ${b.x} ${b.y} M ${a.x} ${a.y-4} v 8 M ${b.x} ${b.y-4} v 8`);
      line.setAttribute("fill", "none"); line.setAttribute("stroke", "#c4d1d8"); line.setAttribute("stroke-width", ".8");
      const text = document.createElementNS(ns, "text"); text.setAttribute("x", Math.max(100, Math.min(w-100,(a.x+b.x)/2))); text.setAttribute("y", Math.max(20,Math.min(h-20,(a.y+b.y)/2-10)));
      text.setAttribute("text-anchor", "middle"); text.setAttribute("font-family", "monospace"); text.setAttribute("font-size", "10"); text.setAttribute("fill", "#d0dbe1"); text.setAttribute("stroke", "#0b1117"); text.setAttribute("stroke-width", "3"); text.setAttribute("paint-order", "stroke"); text.textContent=guide.text;
      labelSvg.append(line,text);
    }
  }
  function applyProjection() {
    camera.setViewOffset(host.clientWidth, Math.max(1, host.clientHeight), projectionOffset.x * host.clientWidth, projectionOffset.y * host.clientHeight, host.clientWidth, Math.max(1, host.clientHeight));
    camera.updateProjectionMatrix();
  }
  function renderNow(time) {
    raf = 0; if (disposed || !visible || !active || document.hidden || !host.clientWidth || !host.clientHeight) return;
    const start = performance.now(), interval = time - lastRenderTime;
    lastRenderTime = time;
    // Adapt only during repeated interaction; isolated on-demand frames do not lower detail.
    slowFrames = interval > 28 && interval < 200 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (!softwareRenderer && slowFrames >= 5 && renderer.getPixelRatio() > 1) {
      renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() * .8)); slowFrames = 0;
    }
    if (transition) {
      const progress = T.MathUtils.clamp((time - transition.start) / 650, 0, 1), t = progress * progress * (3 - 2 * progress);
      camera.position.lerpVectors(transition.fromPosition, transition.toPosition, t); controls.target.lerpVectors(transition.fromTarget, transition.toTarget, t); projectionOffset.lerpVectors(transition.fromOffset, transition.toOffset, t);
      applyProjection(); camera.lookAt(controls.target); controls.update();
      if (progress >= 1) transition = null;
    }
    highlights.forEach(edge => { edge.visible = edge.userData.source.visible; });
    updateLens();
    renderer.info.reset(); renderer.setScissorTest(false); renderer.setViewport(0, 0, host.clientWidth, host.clientHeight);
    renderer.autoClear = true; camera.updateMatrixWorld();
    const coverVisibility = lensCoverings.map(id => anatomy.layers[id].visible);
    if (openingOverview()) lensCoverings.forEach(id => anatomy.layers[id].visible = false);
    try { renderer.render(scene, camera); } finally { lensCoverings.forEach((id, i) => anatomy.layers[id].visible = coverVisibility[i]); }
    if (lensRect) {
      const alpha = renderer.getClearAlpha(); renderer.getClearColor(clearColor);
      const layerVisibility = lensCoverings.map(id => anatomy.layers[id].visible), cortexVisibility = anatomy.layers.cortex.visible;
      lensCoverings.forEach(id => anatomy.layers[id].visible = false); anatomy.layers.cortex.visible = false; anatomy.detail.visible = true;
      renderer.setScissorTest(true);
      renderer.setScissor(lensOuterRect.x, host.clientHeight - lensOuterRect.y - lensOuterRect.height, lensOuterRect.width, lensOuterRect.height);
      renderer.setClearColor(0x08121b, 1); renderer.clear(true, true, true);
      renderer.setViewport(lensRect.x, host.clientHeight - lensRect.y - lensRect.height, lensRect.width, lensRect.height);
      renderer.setScissor(lensRect.x, host.clientHeight - lensRect.y - lensRect.height, lensRect.width, lensRect.height);
      renderer.autoClear = false;
      try { renderer.render(scene, lensCamera); } finally {
        lensCoverings.forEach((id, i) => anatomy.layers[id].visible = layerVisibility[i]); anatomy.layers.cortex.visible = cortexVisibility; anatomy.detail.visible = false;
        renderer.setScissorTest(false); renderer.setViewport(0, 0, host.clientWidth, host.clientHeight); renderer.setClearColor(clearColor, alpha); renderer.autoClear = true;
      }
    }
    labels(); dimensions(); frames++;
    renderMilliseconds.push(performance.now() - start); if (renderMilliseconds.length > 180) renderMilliseconds.shift();
    if (transition) render();
  }
  function render() { if (!raf && !disposed && visible && active) raf = requestAnimationFrame(renderNow); }
  function frameCamera(animate = frames > 0) {
    const aspect = Math.max(0.45, host.clientWidth / Math.max(1, host.clientHeight));
    const narrow = aspect < 1.1;
    const goalTarget = new T.Vector3(), goalPosition = new T.Vector3(), goalOffset = new T.Vector2();
    if (currentView === "head") {
      goalTarget.set(-3, -10, 3);
      goalPosition.copy(goalTarget).add(new T.Vector3(-.84, .19, .5).normalize().multiplyScalar(narrow ? 760 : 415));
      goalOffset.set(narrow ? .12 : .15, narrow ? -.03 : .04);
    } else if (currentView === "region") {
      goalTarget.set(-8, 0, 0);
      goalPosition.copy(goalTarget).add(new T.Vector3(-.87, .19, .46).normalize().multiplyScalar(narrow ? 585 : 325));
      goalOffset.set(narrow ? .12 : .15, narrow ? -.03 : .05);
    } else {
      goalTarget.copy(mount).addScaledVector(anatomy.normal, exploded ? 8 : 1);
      const direction = anatomy.normal.clone().multiplyScalar(currentView === "system" ? .52 : .85).addScaledVector(anatomy.v, currentView === "system" ? .82 : .45).addScaledVector(anatomy.u, .36).normalize();
      goalPosition.copy(goalTarget).addScaledVector(direction, (exploded ? 76 : 43) * (narrow ? 1.45 : 1));
      goalOffset.set(narrow ? .02 : .12, narrow ? .05 : .09);
    }
    if (animate && !reducedMotion.matches && active) transition = { start: performance.now(), fromPosition: camera.position.clone(), fromTarget: controls.target.clone(), fromOffset: projectionOffset.clone(), toPosition: goalPosition, toTarget: goalTarget, toOffset: goalOffset };
    else { transition = null; camera.position.copy(goalPosition); controls.target.copy(goalTarget); projectionOffset.copy(goalOffset); applyProjection(); camera.lookAt(controls.target); controls.update(); }
    render();
  }
  function resize() {
    camera.aspect = host.clientWidth / Math.max(1, host.clientHeight); camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, Math.max(1, host.clientHeight), false); frameCamera(false);
  }
  function explode(value) {
    exploded = Boolean(value); ids.forEach(id => { groups[id].position.y = exploded ? offsets[id] : seated[id]; });
    renderer.shadowMap.needsUpdate = true; rebuildConnections(); frameCamera();
  }
  function select(id) {
    selected = ids.includes(id) ? id : null;
    highlights.splice(0).forEach(h => { h.geometry.dispose(); h.material.dispose(); h.parent.remove(h); });
    if (selected) {
      groups[selected].traverse(o => {
        if (!o.isMesh || o.isInstancedMesh || !o.visible || o.parent !== groups[selected]) return;
        const edge = new T.LineSegments(new T.EdgesGeometry(o.geometry, 35), new T.LineBasicMaterial({ color: labelInfo[selected].color, transparent: true, opacity: 0.6 }));
        edge.position.copy(o.position); edge.rotation.copy(o.rotation); edge.scale.copy(o.scale); edge.userData.source=o; highlights.push(edge);
      });
      highlights.forEach(h => groups[selected].add(h));
    }
    rebuildConnections(); render();
  }
  const hotColor = new T.Color(0xc1a075), amber = new T.Color(0xd39c63);
  function update(frame = {}) {
    const temperature = Array.isArray(frame.tissue) ? frame.tissue[0] : 37;
    anatomy.setTemperature?.(Number.isFinite(temperature) ? temperature : 37);
    const Tc = Number(frame.Tc ?? 37), Th = Number(frame.Th ?? 37);
    mats.cold.color.set(0x91c4c9).lerp(new T.Color(0x54c6df), Number.isFinite(Tc) ? T.MathUtils.clamp((37 - Tc) / 16, 0, 1) : 0);
    mats.hot.color.copy(hotColor).lerp(amber, Number.isFinite(Th) ? T.MathUtils.clamp((Th - 37) / 12, 0, 1) : 0);
    render();
  }
  const raycaster = new T.Raycaster(), pointer = new T.Vector2(); let press = null;
  const insideLens = (x, y) => lensRect && x >= lensRect.x && y >= lensRect.y && x <= lensRect.x + lensRect.width && y <= lensRect.y + lensRect.height;
  const pointerDown = e => {
    if (e.button !== 0) return;
    transition = null;
    const bounds = canvas.getBoundingClientRect(), lens = Boolean(insideLens(e.clientX - bounds.left, e.clientY - bounds.top));
    press = { x: e.clientX, y: e.clientY, lens };
    if (lens) { controls.enabled = false; canvas.setPointerCapture(e.pointerId); }
  };
  const pointerUp = e => {
    controls.enabled = true;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (!press || Math.hypot(press.x - e.clientX, press.y - e.clientY) > 7) { press = null; return; }
    const isLens = press.lens && lensRect; press = null;
    const rect = canvas.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
    pointer.set(isLens ? (x - lensRect.x) / lensRect.width * 2 - 1 : x / rect.width * 2 - 1, isLens ? -(y - lensRect.y) / lensRect.height * 2 + 1 : -y / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, isLens ? lensCamera : camera);
    const hits = raycaster.intersectObjects(isLens ? allPickable : [...allPickable, ...anatomy.group.children], true);
    const hit = hits.find(h => {
      if (!(h.object.material?.opacity > 0.15)) return false;
      if (!isLens && openingOverview() && lensCoverings.includes(h.object.userData.anatomyLayer)) return false;
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
      anatomy.peel(peelValue); renderer.shadowMap.needsUpdate = true; onLayer(peelValue); render();
    }
  };
  const pointerCancel = () => { press = null; controls.enabled = true; };
  canvas.tabIndex = 0;
  const keyboardView = event => {
    if (["ArrowLeft", "ArrowRight", "+", "=", "-", "_"].includes(event.key)) {
      event.preventDefault();
      transition = null;
      const offset = camera.position.clone().sub(controls.target);
      if (event.key.startsWith("Arrow")) offset.applyAxisAngle(new T.Vector3(0, 1, 0), event.key === "ArrowLeft" ? -0.16 : 0.16);
      else offset.multiplyScalar(event.key === "+" || event.key === "=" ? 0.9 : 1.1);
      offset.clampLength(16, 650); camera.position.copy(controls.target).add(offset); controls.update(); render();
    }
  };
  canvas.addEventListener("keydown", keyboardView);
  canvas.addEventListener("pointerdown", pointerDown, true); canvas.addEventListener("pointerup", pointerUp); canvas.addEventListener("pointercancel", pointerCancel);
  const contextLost = event => { event.preventDefault(); host.dispatchEvent(new CustomEvent("seizefreeze-context-lost", { bubbles: true })); };
  canvas.addEventListener("webglcontextlost", contextLost);
  controls.addEventListener("change", render);
  const cancelTransition = () => { transition = null; };
  controls.addEventListener("start", cancelTransition);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) render(); }, { threshold: 0.01 }); intersectionObserver.observe(host);
  update(); explode(false); resize();
  return {
    select, explode, render,
    cutaway(value) { device.cutaway(value); renderer.shadowMap.needsUpdate = true; render(); },
    circuit(value) { device.circuit(value); render(); },
    dimensions(value) { showDimensions = Boolean(value); render(); },
    setActive(value) { active = Boolean(value); if (active) render(); else { transition = null; cancelAnimationFrame(raf); raf = 0; if (lensElement()) lensElement().hidden = true; } },
    seat(id) { if (!ids.includes(id)) return; groups[id].position.y = 0; renderer.shadowMap.needsUpdate = true; rebuildConnections(); render(); },
    rotate(delta) { transition = null; const offset = camera.position.clone().sub(controls.target); offset.applyAxisAngle(new T.Vector3(0, 1, 0), delta); camera.position.copy(controls.target).add(offset); camera.lookAt(controls.target); controls.update(); render(); },
    peel(value) { peelValue = T.MathUtils.clamp(value, 0, 1); anatomy.peel(peelValue); renderer.shadowMap.needsUpdate = true; render(); },
    reset() { currentView = "region"; anatomy.setContext?.("region"); select(null); explode(false); peelValue = 0.86; anatomy.peel(peelValue); frameCamera(); },
    overview() { currentView = "region"; anatomy.setContext?.("region"); select(null); explode(false); frameCamera(); },
    view(name) {
      currentView = ["head", "region", "interface", "system"].includes(name) ? name : "region";
      select(null);
      anatomy.setContext?.(currentView);
      title.textContent = currentView === "head" || currentView === "region"
        ? "REFERENCE ANATOMY · ILLUSTRATIVE TARGET · NOT PATIENT LOCALIZATION"
        : "EXPLANATORY CONSTRUCTION · DIMENSIONS ASSUMED · EXPLODED SPACING EXAGGERATED";
      frameCamera();
    },
    update,
    stats() { return { adapter, softwareRenderer, frames, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, pixelRatio: renderer.getPixelRatio(), quality: "Native DPR adapts from capped 1.6 toward 1 during sustained slow frame scheduling; software capped .75", renderCpuMsMean: renderMilliseconds.length ? renderMilliseconds.reduce((a, b) => a + b, 0) / renderMilliseconds.length : 0, rendering: "on demand; no idle animation", active, openingOverview: openingOverview(), cameraTransition: Boolean(transition), shadowMap: renderer.shadowMap.enabled ? "2048px cached directional PCF" : "disabled on software renderer", selected, exploded, componentOffsets: Object.fromEntries(ids.map(id => [id, groups[id].position.y])), cameraPosition: camera.position.toArray(), view: currentView, peel: peelValue, target: anatomy.target.toArray(), mountPoint: root.position.toArray(), contactSpanMm: [10, 10], device: { units: "mm", scale: root.scale.toArray(), datum: fit.datum, rigidClearanceMm: fit.minimumRigidClearance, contactThicknessRangeMm: fit.contactThicknessRange, geometry: device.info, status: deviceSpec.status, reservoir: "Finite resistance to assumed 37 °C reservoir; chronic route unresolved" }, normal: anatomy.normal.toArray(), anatomy: anatomy.info, lens: { visible: Boolean(lensRect && active), rect: lensRect, outerRect: lensOuterRect, cameraPosition: lensCamera.position.toArray(), packagePixel: lensPackagePixel(), coordinates: "host-local CSS pixels; viewport = host bounding rect + these coordinates", geometry: "same device state; exact local atlas triangles; no screen capture or enlarged physical implant" } }; },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); resizeObserver.disconnect(); intersectionObserver.disconnect(); controls.dispose();
      canvas.removeEventListener("keydown", keyboardView); canvas.removeEventListener("pointerdown", pointerDown, true); canvas.removeEventListener("pointerup", pointerUp); canvas.removeEventListener("pointercancel", pointerCancel); canvas.removeEventListener("webglcontextlost", contextLost);
      anatomy.dispose();
      const geometries = new Set(), materials = new Set(); scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); grain.dispose(); device.dispose?.(); environment?.dispose(); key.shadow.map?.dispose(); renderer.dispose(); canvas.remove(); labelLayer.remove(); title.remove();
    },
  };
}
