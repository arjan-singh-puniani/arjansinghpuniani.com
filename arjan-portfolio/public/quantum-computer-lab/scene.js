import * as T from "/pit-stop-lab/vendor/three.module.js";
import { OrbitControls } from "/pit-stop-lab/vendor/OrbitControls.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { mergeGeometries } from "./vendor/BufferGeometryUtils.js";

export function createScene(host, onPlace) {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      matchMedia("(max-width:720px)").matches ? 1.25 : 1.6,
    ),
  );
  renderer.setClearColor(0x101612, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.domElement.setAttribute(
    "aria-label",
    "Representative cryostat cutaway. Install the highlighted component with the HTML button or drag it downward to seat it.",
  );
  renderer.domElement.setAttribute("role", "img");
  host.append(renderer.domElement);
  const gl = renderer.getContext(),
    debugAdapter = gl.getExtension("WEBGL_debug_renderer_info"),
    adapter = debugAdapter
      ? gl.getParameter(debugAdapter.UNMASKED_RENDERER_WEBGL)
      : "unavailable";
  const softwareRenderer = /SwiftShader|llvmpipe|Software Rasterizer/i.test(
    adapter,
  );
  renderer.shadowMap.enabled = !softwareRenderer;
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(32, 1, 0.05, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 2.2;
  scene.add(new T.HemisphereLight(0xdde9ff, 0x19212a, 0.85));
  const key = new T.DirectionalLight(0xffe8c0, 2.5);
  key.position.set(-3, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -5,
    right: 5,
    top: 5,
    bottom: -5,
    near: 0.5,
    far: 25,
  });
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.025;
  scene.add(key);
  const rim = new T.DirectionalLight(0xc1daff, 3);
  rim.position.set(4, 2, -4);
  scene.add(rim);
  const fill = new T.DirectionalLight(0xfffaf1, 0.6);
  fill.position.set(2, -1, 6);
  scene.add(fill);
  const env = new T.Scene();
  env.background = new T.Color(0x111922);
  for (const [x, y, z, sx, sy, sz] of [
    [-4, 3, 0, 0.1, 6, 4],
    [4, 2, 1, 0.1, 5, 3],
    [0, 7, 0, 6, 0.1, 4],
    [0, 2, -5, 5, 4, 0.1],
    [-1, -3, 3, 3, 0.2, 4],
  ]) {
    const m = new T.Mesh(
      new T.BoxGeometry(sx, sy, sz),
      new T.MeshBasicMaterial({ color: 0xf4f2ea }),
    );
    m.position.set(x, y, z);
    env.add(m);
  }
  const pmrem = new T.PMREMGenerator(renderer),
    envTarget = pmrem.fromScene(env, 0.025);
  scene.environment = envTarget.texture;
  env.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
  pmrem.dispose();
  const machining = document.createElement("canvas");
  machining.width = machining.height = 256;
  const brush = machining.getContext("2d"),
    image = brush.createImageData(256, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const radius = Math.hypot(x - 128, y - 128),
        grain = Math.sin(radius * 4.6) * 12 + Math.sin(x * 17.3 + y * 51.7) * 4;
      const j = 4 * (y * 256 + x),
        v = 155 + grain;
      image.data[j] = image.data[j + 1] = image.data[j + 2] = v;
      image.data[j + 3] = 255;
    }
  brush.putImageData(image, 0, 0);
  const brushedTexture = new T.CanvasTexture(machining);
  brushedTexture.wrapS = brushedTexture.wrapT = T.RepeatWrapping;
  const mats = {
    steel: new T.MeshStandardMaterial({
      color: 0x8796a8,
      metalness: 0.95,
      roughness: 0.28,
    }),
    copper: new T.MeshStandardMaterial({
      color: 0xd7a43d,
      metalness: 0.96,
      roughness: 0.42,
      roughnessMap: brushedTexture,
      bumpMap: softwareRenderer ? null : brushedTexture,
      bumpScale: 0.002,
    }),
    gold: new T.MeshStandardMaterial({
      color: 0xe9bb52,
      metalness: 0.94,
      roughness: 0.22,
    }),
    graphite: new T.MeshStandardMaterial({
      color: 0x343e49,
      metalness: 0.6,
      roughness: 0.38,
    }),
    ceramic: new T.MeshStandardMaterial({
      color: 0xe1ddcd,
      metalness: 0.05,
      roughness: 0.55,
    }),
    chip: new T.MeshStandardMaterial({
      color: 0x1d6072,
      metalness: 0.6,
      roughness: 0.3,
    }),
    blue: new T.MeshStandardMaterial({
      color: 0x5393cb,
      metalness: 0.6,
      roughness: 0.3,
    }),
    red: new T.MeshStandardMaterial({
      color: 0xce7772,
      emissive: 0x9c4540,
      emissiveIntensity: 0.7,
    }),
    flux: new T.MeshStandardMaterial({
      color: 0xb688b7,
      metalness: 0.65,
      roughness: 0.3,
    }),
    return: new T.MeshStandardMaterial({
      color: 0xc8a95c,
      metalness: 0.7,
      roughness: 0.3,
    }),
  };
  const root = new T.Group();
  scene.add(root);
  const groups = Array.from({ length: 12 }, () => new T.Group());
  groups.forEach((g, i) => {
    g.name = `stage-${i + 1}`;
    root.add(g);
  });
  const box = (g, size, pos, mat = mats.graphite) => {
    const bevel = Math.min(...size) * 0.12;
    let geometry;
    if (Math.max(...size) > 0.5 && Math.min(...size) > 0.04) {
      const shape = new T.Shape(),
        [w, h, d] = size;
      shape.moveTo(-w / 2 + bevel, -h / 2 + bevel);
      shape.lineTo(w / 2 - bevel, -h / 2 + bevel);
      shape.lineTo(w / 2 - bevel, h / 2 - bevel);
      shape.lineTo(-w / 2 + bevel, h / 2 - bevel);
      shape.closePath();
      geometry = new T.ExtrudeGeometry(shape, {
        depth: d - 2 * bevel,
        bevelEnabled: true,
        bevelSize: bevel,
        bevelThickness: bevel,
        bevelSegments: 1,
        steps: 1,
      });
      geometry.translate(0, 0, -d / 2 + bevel);
    } else geometry = new T.BoxGeometry(...size);
    const m = new T.Mesh(geometry, mat);
    m.position.set(...pos);
    g.add(m);
    return m;
  };
  const cyl = (g, r, h, pos, mat = mats.copper, segments = 64) => {
    const m = new T.Mesh(new T.CylinderGeometry(r, r, h, segments), mat);
    m.position.set(...pos);
    g.add(m);
    return m;
  };
  const tube = (g, points, mat, r = 0.018) => {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...p)),
    );
    const m = new T.Mesh(
      new T.TubeGeometry(
        curve,
        points.length < 4 ? 8 : points.length < 7 ? 16 : 40,
        r,
        r < 0.015 ? 4 : 6,
        false,
      ),
      mat,
    );
    g.add(m);
    return curve;
  };
  const screws = (g, r, y, count = 24) => {
    const mesh = new T.InstancedMesh(
        new T.CylinderGeometry(0.027, 0.027, 0.075, 6),
        mats.steel,
        count,
      ),
      dummy = new T.Object3D();
    for (let j = 0; j < count; j++) {
      const a = (j / count) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      dummy.updateMatrix();
      mesh.setMatrixAt(j, dummy.matrix);
    }
    g.add(mesh);
    if (count < 32) return;
    const washers = new T.InstancedMesh(
      new T.CylinderGeometry(0.041, 0.041, 0.012, 12),
      mats.graphite,
      count,
    );
    for (let j = 0; j < count; j++) {
      const a = (j / count) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * r, y - 0.033, Math.sin(a) * r);
      dummy.updateMatrix();
      washers.setMatrixAt(j, dummy.matrix);
    }
    g.add(washers);
  };
  // A pale metal support keeps the optical silhouette distinct from the cabling.
  for (const x of [-1.62, 1.62])
    for (const z of [-0.95, 0.95]) {
      box(groups[0], [0.085, 5.4, 0.085], [x, 0.05, z], mats.steel);
      cyl(groups[0], 0.15, 0.16, [x, -2.7, z], mats.graphite, 20);
    }
  for (const z of [-0.95, 0.95])
    box(groups[0], [3.4, 0.12, 0.11], [0, 2.66, z], mats.steel);
  for (const x of [-1.62, 1.62])
    box(groups[0], [0.11, 0.12, 2], [x, 2.66, 0], mats.steel);
  const contact = document.createElement("canvas");
  contact.width = contact.height = 128;
  const contactContext = contact.getContext("2d"),
    gradient = contactContext.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, "rgba(0,0,0,.85)");
  gradient.addColorStop(0.5, "rgba(0,0,0,.4)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  contactContext.fillStyle = gradient;
  contactContext.fillRect(0, 0, 128, 128);
  const contactTexture = new T.CanvasTexture(contact);
  const shadow = new T.Mesh(
    new T.PlaneGeometry(7, 7),
    new T.MeshBasicMaterial({
      map: contactTexture,
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -2.88, 0);
  scene.add(shadow);
  const shadowCatcher = new T.Mesh(
    new T.PlaneGeometry(20, 20),
    new T.ShadowMaterial({ opacity: 0.28 }),
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -2.875;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);
  const shellMaterial = new T.MeshStandardMaterial({
    color: 0x9daea7,
    metalness: 0.9,
    roughness: 0.2,
    side: T.DoubleSide,
    transparent: true,
  });
  const shell = new T.Mesh(
    new T.CylinderGeometry(1.45, 1.45, 4.5, 80, 1, true, 0, Math.PI * 2),
    shellMaterial,
  );
  shell.position.y = 0.05;
  groups[1].add(shell);
  cyl(groups[1], 1.6, 0.16, [0, 2.35, 0], mats.steel);
  screws(groups[1], 1.48, 2.47, 40);
  for (let j = 0; j < 24; j++) {
    const a = (j / 24) * Math.PI * 2,
      x = Math.cos(a) * 1.04,
      z = Math.sin(a) * 1.04;
    cyl(groups[1], 0.045, 0.13, [x, 2.5, z], mats.gold, 8);
    cyl(groups[1], 0.026, 0.07, [x, 2.59, z], mats.steel, 8);
  }
  cyl(groups[1], 1.46, 0.07, [0, -2.23, 0], mats.steel);
  const flange = new T.Mesh(
    new T.TorusGeometry(1.46, 0.055, 8, 80),
    mats.steel,
  );
  flange.rotation.x = Math.PI / 2;
  flange.position.y = -2.18;
  groups[1].add(flange);
  for (let ring = 0; ring < 3; ring++) {
    const seal = new T.Mesh(
      new T.TorusGeometry(1.5 - ring * 0.025, 0.009, 4, 64),
      mats.graphite,
    );
    seal.rotation.x = Math.PI / 2;
    seal.position.y = 2.445;
    groups[1].add(seal);
  }
  const vacuumPort = cyl(groups[1], 0.1, 0.38, [1.56, 1.9, 0], mats.steel, 24);
  vacuumPort.rotation.z = Math.PI / 2;
  const vacuumFlange = cyl(
    groups[1],
    0.16,
    0.035,
    [1.75, 1.9, 0],
    mats.steel,
    24,
  );
  vacuumFlange.rotation.z = Math.PI / 2;
  cyl(groups[2], 0.23, 0.9, [-0.62, 2.8, -0.35], mats.steel, 32);
  cyl(groups[2], 0.32, 0.14, [-0.62, 3.16, -0.35], mats.graphite, 32);
  for (let j = 0; j < 9; j++) {
    const bellows = new T.Mesh(
      new T.TorusGeometry(0.24, 0.018, 4, 24),
      mats.steel,
    );
    bellows.rotation.x = Math.PI / 2;
    bellows.position.set(-0.62, 2.48 + j * 0.055, -0.35);
    groups[2].add(bellows);
  }
  tube(
    groups[2],
    [
      [-0.62, 3.3, -0.35],
      [-0.8, 3.6, -0.5],
      [-1.8, 3.5, -0.7],
      [-2.9, 2.7, -0.5],
    ],
    mats.graphite,
    0.07,
  );
  const plateYs = [1.65, 0.75, -0.08, -0.88, -1.65],
    radii = [1.3, 1.18, 1.04, 0.91, 0.8];
  plateYs.forEach((y, i) => {
    const r = radii[i],
      shape = new T.Shape();
    shape.absarc(0, 0, r, 0, Math.PI * 2, false);
    for (let h = 0; h < 3; h++) {
      const a = (h * Math.PI * 2) / 3 + 0.35,
        hole = new T.Path();
      hole.absarc(
        Math.cos(a) * r * 0.55,
        Math.sin(a) * r * 0.55,
        r * 0.14,
        0,
        Math.PI * 2,
        true,
      );
      shape.holes.push(hole);
    }
    const plate = new T.Mesh(
      new T.ExtrudeGeometry(shape, {
        depth: 0.075,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.008,
        bevelThickness: 0.006,
        curveSegments: 32,
      }),
      mats.copper,
    );
    plate.rotation.x = -Math.PI / 2;
    plate.position.y = y;
    groups[3].add(plate);
    screws(groups[3], r - 0.1, y + 0.11, i < 2 ? 28 : 20);
    const rim = new T.Mesh(
      new T.TorusGeometry(r - 0.018, 0.018, 4, 48),
      mats.gold,
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y + 0.025;
    groups[3].add(rim);
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3 + 0.2,
        x = Math.cos(a) * (r - 0.21),
        z = Math.sin(a) * (r - 0.21);
      const anchor = box(
        groups[3],
        [0.14, 0.065, 0.075],
        [x, y + 0.12, z],
        mats.gold,
      );
      anchor.rotation.y = -a;
    }
    if (i < 4)
      for (let j = 0; j < 3; j++) {
        const a = (j / 3) * Math.PI * 2 + 0.6;
        cyl(
          groups[3],
          0.033,
          Math.abs(y - plateYs[i + 1]),
          [
            Math.cos(a) * (radii[i + 1] - 0.1),
            (y + plateYs[i + 1]) / 2,
            Math.sin(a) * (radii[i + 1] - 0.1),
          ],
          mats.steel,
          12,
        );
      }
  });
  // A visible dilution-unit return and mixing chamber; not a flow simulation.
  tube(
    groups[3],
    [
      [0.18, 1.5, -0.6],
      [0.18, 0.7, -0.6],
      [0.4, -0.1, -0.4],
      [0.35, -1, -0.3],
      [0, -1.7, -0.15],
    ],
    mats.copper,
    0.05,
  );
  cyl(groups[3], 0.23, 0.32, [0, -1.8, -0.15]);
  for (let j = 0; j < 5; j++)
    cyl(groups[3], 0.25, 0.022, [0, -1.68 - j * 0.055, -0.15], mats.gold, 24);
  const shields = [];
  for (const [r, h, y] of [
    [1.35, 3.65, -0.15],
    [1.22, 2.8, -0.64],
  ]) {
    const m = new T.Mesh(
      new T.CylinderGeometry(
        r,
        r,
        h,
        64,
        1,
        true,
        Math.PI * 0.7,
        Math.PI * 0.92,
      ),
      mats.copper,
    );
    m.position.y = y;
    groups[4].add(m);
    shields.push(m);
  }
  for (const y of plateYs)
    for (const x of [-0.87, 0.8])
      box(groups[4], [0.14, 0.07, 0.2], [x, y + 0.08, 0.38], mats.gold);
  for (let braid = 0; braid < 5; braid++)
    tube(
      groups[2],
      [
        [-0.62 + braid * 0.025, 2.65, -0.35],
        [-0.5 + braid * 0.025, 2.35, -0.38],
        [-0.85 + braid * 0.025, 2.1, -0.2],
        [-0.92 + braid * 0.025, 1.72, -0.18],
      ],
      mats.copper,
      0.012,
    );
  const controlPath = tube(
    groups[5],
    [
      [-2.9, 1.1, 0],
      [-2.4, 2.8, 0.3],
      [-1.3, 2.8, 0.55],
      [-0.9, 1.7, 0.55],
      [-0.83, 0.75, 0.5],
      [-0.7, -0.15, 0.5],
      [-0.62, -0.9, 0.4],
      [-0.4, -1.8, 0.25],
      [0, -2.15, 0.2],
    ],
    mats.blue,
    0.028,
  );
  const fluxPath = tube(
    groups[5],
    [
      [-2.9, 1.6, 0.05],
      [-2.2, 2.9, -0.4],
      [-1.1, 2.6, -0.5],
      [-0.8, 1.65, -0.55],
      [-0.73, 0.75, -0.5],
      [-0.6, -0.1, -0.45],
      [-0.48, -0.88, -0.4],
      [0.13, -2.15, -0.15],
    ],
    mats.flux,
    0.015,
  );
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 1.3 + 0.2;
    const r = 0.62 + (k % 3) * 0.15;
    tube(
      groups[5],
      [
        [Math.cos(a) * 1.1, 2.3, Math.sin(a) * 1.1],
        [Math.cos(a) * r, 1.6, Math.sin(a) * r],
        [Math.cos(a) * r, 0.7, Math.sin(a) * r],
        [Math.cos(a) * r, -0.1, Math.sin(a) * r],
        [Math.cos(a) * r * 0.8, -0.9, Math.sin(a) * r * 0.8],
        [Math.cos(a) * 0.35, -1.8, Math.sin(a) * 0.35],
      ],
      k < 6 ? mats.steel : mats.gold,
      0.012,
    );
    for (let stage = 0; stage < 5; stage++) {
      const radius = stage < 3 ? r : stage === 3 ? r * 0.8 : 0.35,
        y = plateYs[stage] + 0.14;
      cyl(
        groups[5],
        0.027,
        0.105,
        [Math.cos(a) * radius, y, Math.sin(a) * radius],
        mats.gold,
        8,
      );
      cyl(
        groups[5],
        0.022,
        0.14,
        [Math.cos(a) * radius, y + 0.01, Math.sin(a) * radius],
        mats.steel,
        8,
      );
    }
  }
  // Fine unselected coaxes show the fan-out; highlighted lines retain their own paths.
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 1.7 - 0.5,
      r = 0.52 + (k % 4) * 0.09;
    tube(
      groups[5],
      [
        [Math.cos(a) * 1.06, 2.3, Math.sin(a) * 1.06],
        [Math.cos(a) * r, 1.62, Math.sin(a) * r],
        [Math.cos(a) * r, 0.65, Math.sin(a) * r],
        [Math.cos(a) * r * 0.94, -0.15, Math.sin(a) * r * 0.94],
        [Math.cos(a) * r * 0.8, -0.98, Math.sin(a) * r * 0.8],
        [Math.cos(a) * 0.3, -1.84, Math.sin(a) * 0.3],
      ],
      k % 3 ? mats.gold : mats.steel,
      0.007,
    );
  }
  for (const [x, y, z] of [
    [-0.86, 0.8, 0.5],
    [-0.63, -0.8, 0.4],
    [-0.43, -1.55, 0.25],
  ]) {
    cyl(groups[5], 0.065, 0.19, [x, y, z], mats.gold, 12);
    cyl(groups[5], 0.04, 0.3, [x, y, z], mats.steel, 12);
  }
  const readoutPath = tube(
    groups[6],
    [
      [0.15, -2.15, 0.1],
      [0.48, -1.8, 0.5],
      [0.72, -1.2, 0.6],
      [0.85, -0.4, 0.65],
      [1, 0.75, 0.6],
      [1.2, 2.4, 0.65],
      [-0.3, 2.9, 0.9],
      [-2.45, 2.8, 0.7],
      [-2.9, 0.05, 0],
    ],
    mats.return,
    0.028,
  );
  for (const y of [-1.3, -0.95])
    cyl(groups[6], 0.13, 0.12, [0.7, y, 0.55], mats.graphite, 16);
  box(groups[6], [0.25, 0.44, 0.2], [0.93, 0.93, 0.6], mats.steel);
  const pkg = groups[7];
  cyl(pkg, 0.5, 0.13, [0, -2.13, 0], mats.copper, 48);
  screws(pkg, 0.42, -2.03, 16);
  box(pkg, [0.6, 0.045, 0.55], [0, -2.02, 0], mats.ceramic);
  box(pkg, [0.39, 0.035, 0.34], [0, -1.98, 0], mats.chip);
  for (let side = 0; side < 4; side++)
    for (let pin = 0; pin < 10; pin++) {
      const a = (side * Math.PI) / 2,
        offset = (pin - 4.5) * 0.029;
      const rotate = (x, z) => [
        x * Math.cos(a) - z * Math.sin(a),
        x * Math.sin(a) + z * Math.cos(a),
      ];
      const points = [
        [offset, 0.17, -1.96],
        [offset, 0.22, -1.91],
        [offset, 0.28, -1.99],
      ].map(([x, z, y]) => {
        const [rx, rz] = rotate(x, z);
        return [rx, y, rz];
      });
      tube(pkg, points, mats.gold, 0.0025);
    }
  const lid = box(pkg, [0.65, 0.1, 0.6], [0, -1.87, 0], mats.steel);
  lid.visible = false;
  const chipDetail = new T.Group();
  groups[8].add(chipDetail);
  chipDetail.position.set(0, -1.93, 0);
  chipDetail.scale.setScalar(0.8);
  for (const x of [-0.15, 0, 0.15]) {
    for (const dx of [-0.045, 0.045])
      box(chipDetail, [0.06, 0.018, 0.16], [x + dx, 0, 0], mats.gold);
    box(chipDetail, [0.036, 0.012, 0.02], [x, 0.009, 0], mats.steel);
  }
  tube(
    chipDetail,
    [
      [-0.17, 0, -0.08],
      [-0.17, 0, -0.18],
      [0.22, 0, -0.18],
      [0.22, 0, -0.12],
      [-0.08, 0, -0.12],
    ],
    mats.gold,
    0.006,
  );
  tube(
    chipDetail,
    [
      [-0.17, 0, 0.08],
      [-0.15, 0, 0.17],
      [0.15, 0, 0.17],
      [0.17, 0, 0.08],
    ],
    mats.gold,
    0.009,
  );
  const rack = groups[9];
  box(rack, [1.05, 3.8, 0.9], [-2.85, -0.6, -0.05]);
  box(rack, [0.94, 3.65, 0.025], [-2.85, -0.58, 0.42], mats.steel);
  for (let j = 0; j < 7; j++) {
    box(
      rack,
      [0.88, 0.36, 0.13],
      [-2.85, -2.06 + j * 0.49, 0.5],
      mats.graphite,
    );
    for (let k = 0; k < 3; k++) {
      const m = cyl(
        rack,
        0.035,
        0.04,
        [-3.13 + k * 0.25, -2.06 + j * 0.49, 0.58],
        k === 0 ? mats.blue : mats.gold,
        12,
      );
      m.rotation.x = Math.PI / 2;
    }
    box(rack, [0.34, 0.1, 0.025], [-2.62, -2.06 + j * 0.49, 0.58], mats.chip);
  }
  // Rack context appears as an unpowered silhouette before its installation.
  // Merge stationary parts within each assembly module; bolts remain instanced.
  for (const index of [0, 1, 2, 3, 5, 6, 7, 9]) {
    const group = groups[index],
      batches = new Map();
    for (const child of [...group.children]) {
      if (
        !child.isMesh ||
        child.isInstancedMesh ||
        child === lid ||
        child === shell
      )
        continue;
      child.updateMatrix();
      const geometry = child.geometry.index
        ? child.geometry.toNonIndexed()
        : child.geometry.clone();
      geometry.applyMatrix4(child.matrix);
      if (!batches.has(child.material)) batches.set(child.material, []);
      batches.get(child.material).push(geometry);
      group.remove(child);
      child.geometry.dispose();
    }
    for (const [material, geometries] of batches) {
      const merged = mergeGeometries(geometries);
      group.add(new T.Mesh(merged, material));
      geometries.forEach((g) => g.dispose());
    }
  }
  root.traverse((object) => {
    if (object.isMesh) object.receiveShadow = true;
  });
  // Large parts cast contact shadows; tiny fasteners and cables do not add a shadow pass.
  for (const index of [0, 3, 7])
    for (const object of groups[index].children)
      if (object.isMesh && !object.isInstancedMesh) object.castShadow = true;
  const signal = new T.Mesh(
    new T.SphereGeometry(0.057, 12, 8),
    new T.MeshBasicMaterial({ color: 0x87caff }),
  );
  scene.add(signal);
  signal.visible = false;
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 64;
  const glowContext = glowCanvas.getContext("2d"),
    glowGradient = glowContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  glowGradient.addColorStop(0, "rgba(255,255,255,0.8)");
  glowGradient.addColorStop(0.2, "rgba(255,255,255,0.35)");
  glowGradient.addColorStop(1, "rgba(255,255,255,0)");
  glowContext.fillStyle = glowGradient;
  glowContext.fillRect(0, 0, 64, 64);
  const glowTexture = new T.CanvasTexture(glowCanvas),
    pulseHalo = new T.Sprite(
      new T.SpriteMaterial({
        map: glowTexture,
        color: 0x62b1ff,
        depthWrite: false,
        transparent: true,
        blending: T.AdditiveBlending,
      }),
    );
  pulseHalo.scale.setScalar(0.32);
  signal.add(pulseHalo);
  const pulseTrail = new T.InstancedMesh(
    new T.SphereGeometry(0.026, 8, 5),
    new T.MeshBasicMaterial({ color: 0x62b1ff, transparent: true }),
    10,
  );
  pulseTrail.frustumCulled = false;
  const trailPose = new T.Object3D();
  scene.add(pulseTrail);
  pulseTrail.visible = false;
  const faultMaterial = mats.red.clone();
  faultMaterial.emissiveIntensity = 0.2;
  const noise = new T.Mesh(
    new T.SphereGeometry(1, 20, 12),
    new T.MeshBasicMaterial({
      color: 0xce7772,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    }),
  );
  noise.position.set(0, -1.5, 0);
  noise.scale.set(1.1, 0.8, 1.1);
  scene.add(noise);
  noise.visible = false;
  const processorShadow = new T.Mesh(
    new T.PlaneGeometry(0.65, 0.55),
    new T.MeshBasicMaterial({
      map: contactTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  processorShadow.rotation.x = -Math.PI / 2;
  processorShadow.position.set(0, -1.957, 0);
  groups[8].add(processorShadow);
  const qubitBracket = new T.BufferGeometry();
  const bracketVertices = [];
  for (const x of [-1, 1])
    for (const z of [-1, 1])
      bracketVertices.push(
        x * 0.047,
        0,
        z * 0.033,
        x * 0.047,
        0,
        z * 0.047,
        x * 0.047,
        0,
        z * 0.047,
        x * 0.033,
        0,
        z * 0.047,
      );
  qubitBracket.setAttribute(
    "position",
    new T.Float32BufferAttribute(bracketVertices, 3),
  );
  const qubitHighlights = [-0.125, 0, 0.125].map((x) => {
    const m = new T.LineSegments(
      qubitBracket,
      new T.LineBasicMaterial({ color: 0x62b1ff, transparent: true }),
    );
    m.position.set(x, -1.898, 0);
    m.renderOrder = 8;
    m.material.depthTest = false;
    m.material.depthWrite = false;
    groups[8].add(m);
    return m;
  });
  const couplingGeometry = new T.BufferGeometry();
  couplingGeometry.setAttribute(
    "position",
    new T.BufferAttribute(new Float32Array(12), 3),
  );
  const couplingHighlight = new T.Line(
    couplingGeometry,
    new T.LineBasicMaterial({
      color: 0xe68ec9,
      transparent: true,
      opacity: 0.7,
    }),
  );
  groups[8].add(couplingHighlight);
  couplingHighlight.visible = false;
  const driveGeometry = new T.BufferGeometry();
  driveGeometry.setAttribute(
    "position",
    new T.BufferAttribute(new Float32Array(6), 3),
  );
  const driveHighlight = new T.Line(
    driveGeometry,
    new T.LineBasicMaterial({
      color: 0x62b1ff,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  driveHighlight.renderOrder = 8;
  driveHighlight.visible = false;
  groups[8].add(driveHighlight);
  const highlight = new T.Mesh(
    new T.TorusGeometry(0.85, 0.013, 6, 64),
    new T.MeshBasicMaterial({ color: 0xd9bc7d, transparent: true }),
  );
  highlight.rotation.x = Math.PI / 2;
  root.add(highlight);
  const heatArrow = new T.ArrowHelper(
    new T.Vector3(0, -1, 0),
    new T.Vector3(1.55, 2, 0),
    3.8,
    0xeeb05e,
    0.2,
    0.1,
  );
  scene.add(heatArrow);
  heatArrow.visible = false;
  const ghostMaterial = new T.MeshStandardMaterial({
    color: 0x83b9ba,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    wireframe: true,
  });
  const gasGeometry = new T.BufferGeometry(),
    gasPositions = new Float32Array(45 * 3);
  for (let j = 0; j < 45; j++) {
    const a = j * 2.39996,
      r = 0.25 + (j % 7) / 7;
    gasPositions[j * 3] = Math.cos(a) * r;
    gasPositions[j * 3 + 1] = -1.9 + ((j % 13) / 13) * 4;
    gasPositions[j * 3 + 2] = Math.sin(a) * r;
  }
  gasGeometry.setAttribute("position", new T.BufferAttribute(gasPositions, 3));
  const gas = new T.Points(
    gasGeometry,
    new T.PointsMaterial({
      color: 0xd08b85,
      size: 0.045,
      transparent: true,
      opacity: 0.65,
    }),
  );
  root.add(gas);
  gas.visible = false;
  const labelVector = new T.Vector3();
  let frameCount = 0,
    lastLabelFrame = 0;
  let contextLost = false;
  let introStarted = performance.now();
  const frameTimes = [];
  let model = null,
    disposed = false;
  new GLTFLoader().load(
    "./processor.glb",
    (g) => {
      if (disposed) {
        g.scene.traverse((o) => {
          o.geometry?.dispose();
          o.material?.dispose();
        });
        return;
      }
      model = g.scene;
      model.traverse((object) => {
        if (!object.isMesh) return;
        const material = object.material;
        if (/Sapphire/.test(material.name)) {
          material.color.set(0x142c40);
          material.metalness = 0.28;
          material.roughness = 0.16;
        } else if (/Superconducting/.test(material.name)) {
          material.color.set(0xc5d3df);
          material.metalness = 1;
          material.roughness = 0.3;
          material.roughnessMap = brushedTexture;
        } else if (/Gold/.test(material.name)) {
          material.color.set(0xd8b777);
          material.metalness = 1;
          material.roughness = 0.22;
        }
        material.envMapIntensity = 0.8;
      });
      model.scale.setScalar(0.5);
      model.position.set(0, -1.925, 0);
      model.visible = false;
      groups[8].add(model);
      update(view);
    },
    undefined,
    () => {},
  );
  let view = {
      stage: 0,
      installed: [],
      intro: true,
      reduced: false,
      explode: false,
      cutaway: true,
      rotate: false,
      heat: false,
      noise: false,
      html: false,
      compute: false,
      operation: null,
    },
    lastView = "",
    installedCount = 0,
    seatedAt = -10000,
    seatingStage = -1,
    visible = true,
    raf = 0,
    lastTime = 0,
    signalStart = -10000,
    signalKind = "drive",
    snappingUntil = 0,
    ghost = null;
  const cameraTarget = new T.Vector3(),
    desiredCamera = new T.Vector3(),
    desiredTarget = new T.Vector3();
  function resetCamera() {
    const aspect = host.clientWidth / Math.max(1, host.clientHeight);
    const narrow = aspect < 0.9;
    desiredCamera.set(narrow ? 6.5 : 5.5, 3, narrow ? 13 : 11);
    desiredTarget.set(-0.5, 0.2, 0);
    camera.position.copy(desiredCamera);
    controls.target.copy(desiredTarget);
    camera.lookAt(controls.target);
  }
  resetCamera();
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    if (lastView) {
      lastView = "";
      update(view);
    } else resetCamera();
    wake();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  function update(next) {
    lastLabelFrame = 0;
    if (
      next.installed &&
      next.installed.length > installedCount &&
      next.status === "assembled"
    ) {
      seatedAt = performance.now();
      seatingStage = next.stage;
    }
    if (next.installed) installedCount = next.installed.length;
    view = { ...view, ...next };
    const placeable =
      !view.intro &&
      !view.compute &&
      view.stage < 10 &&
      !view.installed.includes(view.stage);
    renderer.domElement.style.touchAction = placeable ? "none" : "pan-y";
    renderer.domElement.style.cursor = placeable
      ? "grab"
      : view.rotate
        ? "grab"
        : "default";
    document.getElementById("assembly-guidance").hidden = !placeable;
    document.getElementById("assembly-guidance-text").textContent =
      "Pick up the lifted part. Align it with its outline, then release. Or use Install.";
    if (ghost) {
      root.remove(ghost);
      ghost = null;
    }
    groups.forEach((g, i) => {
      g.visible =
        view.intro ||
        view.compute ||
        i === view.stage ||
        view.installed.includes(i);
      g.traverse((o) => {
        if (o.isMesh && o.userData.normalMaterial) {
          o.material = o.userData.normalMaterial;
          delete o.userData.normalMaterial;
        }
      });
    });
    const chipOnly =
      view.focus === "processor" ||
      (!view.intro && !view.compute && view.stage === 8);
    processorShadow.visible = view.compute && chipOnly;
    const packageClose = !view.intro && !view.compute && view.stage === 7;
    if (chipOnly || packageClose)
      groups.forEach((g, i) => {
        g.visible = chipOnly ? i === 8 : [7, 8].includes(i);
      });
    // Stage 11 is a process, so no fictitious extra hardware is introduced.
    shell.visible = !view.cutaway;
    shields.forEach((s) => (s.visible = view.cutaway));
    lid.visible = !view.cutaway;
    heatArrow.visible = view.heat;
    noise.visible = view.noise && view.compute;
    gas.visible =
      !view.intro &&
      !view.compute &&
      view.stage === 1 &&
      view.diagnostic?.severity > 0.02;
    if (!view.intro && !view.compute && view.diagnostic?.severity > 0.02) {
      const affected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 6][view.stage];
      faultMaterial.emissiveIntensity = 0.1 + 0.4 * view.diagnostic.severity;
      groups[affected].traverse((o) => {
        if (o.isMesh) {
          o.userData.normalMaterial = o.material;
          o.material = faultMaterial;
        }
      });
    }
    highlight.visible =
      !view.intro &&
      !view.compute &&
      !view.installed.includes(view.stage) &&
      view.stage < 7;
    highlight.position.y = [
      -2.5, 2.4, 2.8, 0.75, 0.1, -0.8, -1.3, -2, -1.9, 0.5, 0.75, -1.9,
    ][view.stage];
    const detailed = view.stage === 8 || view.focus === "processor";
    model && (model.visible = detailed);
    chipDetail.children.forEach((o) => {
      if (o !== model) o.visible = !model || !detailed;
    });
    if (
      !view.intro &&
      !view.compute &&
      !view.installed.includes(view.stage) &&
      view.stage < 10
    ) {
      ghost = groups[view.stage].clone(true);
      ghost.position.set(0, 0, 0);
      ghost.traverse((o) => {
        if (o.isMesh) {
          o.material = ghostMaterial;
          o.castShadow = false;
        }
      });
      root.add(ghost);
      groups[view.stage].position.y = 0.45;
    }
    qubitHighlights.forEach((m, q) => {
      m.visible =
        view.compute &&
        (view.acquired
          ? q < view.n
          : view.operation?.target === q || view.operation?.control === q);
      m.material.color.set(
        view.operation?.name === "M"
          ? 0xe7c775
          : view.nativeSegment?.kind === "flux"
            ? 0xe68ec9
            : 0x62b1ff,
      );
      const active =
        view.acquired ||
        view.nativeSegment?.kind === "flux" ||
        view.nativeSegment?.target === q;
      m.material.opacity = active
        ? 0.45 + 0.55 * (view.pulseIntensity || 0)
        : 0.16;
    });
    driveHighlight.visible =
      view.compute && view.nativeSegment?.kind === "drive";
    if (driveHighlight.visible) {
      const x = (view.nativeSegment.target - 1) * 0.125;
      driveGeometry.attributes.position.array.set([
        x,
        -1.898,
        model ? 0.145 : -0.17,
        x,
        -1.898,
        0,
      ]);
      driveGeometry.attributes.position.needsUpdate = true;
      driveGeometry.computeBoundingSphere();
      driveHighlight.material.opacity = 0.15 + 0.7 * (view.pulseIntensity || 0);
    }
    couplingHighlight.visible =
      view.compute && ["CZ", "CNOT"].includes(view.operation?.name);
    if (couplingHighlight.visible) {
      const x0 = (view.operation.control - 1) * 0.125,
        x1 = (view.operation.target - 1) * 0.125,
        busZ = detailed && model ? 0.055 : 0.136;
      couplingGeometry.attributes.position.array.set([
        x0,
        -1.905,
        0,
        x0,
        -1.905,
        busZ,
        x1,
        -1.905,
        busZ,
        x1,
        -1.905,
        0,
      ]);
      couplingGeometry.attributes.position.needsUpdate = true;
      couplingGeometry.computeBoundingSphere();
      couplingHighlight.material.opacity =
        view.nativeSegment?.kind === "flux"
          ? 0.35 + 0.65 * (view.pulseIntensity || 0)
          : 0.2;
    }
    const key = `${view.stage}:${view.compute}:${view.intro}:${view.focus}:${view.installed.includes(view.stage)}`;
    if (key !== lastView) {
      lastView = key;
      if (view.intro) introStarted = performance.now();
      controls.enabled = false;
      snappingUntil = performance.now() + 700;
      if (chipOnly) {
        const k = view.compute
          ? 1.0625 * Math.max(1, 2.2 / camera.aspect)
          : Math.max(1, 0.95 / camera.aspect);
        const lifted =
          !view.compute &&
          !view.installed.includes(view.stage) &&
          view.focus !== "processor";
        desiredTarget.set(0, -1.92 + (lifted ? 0.225 : 0), 0);
        desiredCamera
          .copy(desiredTarget)
          .add(
            new T.Vector3(
              ...(view.compute ? [0.08, 0.19, 0.42] : [0.32, 0.42, 0.55]),
            ).multiplyScalar(k * (lifted ? 1.8 : 1)),
          );
      } else if (packageClose) {
        const lifted = !view.installed.includes(view.stage);
        desiredTarget.set(0, -1.9 + (lifted ? 0.225 : 0), 0);
        desiredCamera
          .copy(desiredTarget)
          .add(
            new T.Vector3(1.15, 1.25, 1.8).multiplyScalar(lifted ? 1.12 : 1),
          );
      } else if (!view.intro && !view.compute && view.stage === 9) {
        desiredTarget.set(-2.3, -0.4, 0);
        desiredCamera.set(1.1, 1.7, 5.8);
      } else {
        const narrow = camera.aspect < 0.9;
        desiredCamera.set(narrow ? 6.5 : 5.5, 3, narrow ? 13 : 11);
        desiredTarget.set(-0.5, 0.2, 0);
      }
    }
    if (view.reduced) {
      camera.position.copy(desiredCamera);
      controls.target.copy(desiredTarget);
    }
    wake();
  }
  function trigger(kind = "drive") {
    signalKind = kind;
    signalStart = performance.now();
    wake();
  }
  function frame(now) {
    raf = 0;
    if (disposed || !visible || document.hidden || view.html || contextLost)
      return;
    const elapsed = now - lastTime;
    if (lastTime && elapsed < 2000 && frameCount > 12) {
      frameTimes.push(elapsed);
      if (frameTimes.length === 8) {
        if (
          frameTimes.reduce((a, b) => a + b) / 8 > 45 &&
          renderer.shadowMap.enabled
        ) {
          renderer.shadowMap.enabled = false;
          shadowCatcher.visible = false;
        }
        if (
          frameTimes.reduce((a, b) => a + b) / 8 > 30 &&
          renderer.getPixelRatio() > 0.6
        )
          renderer.setPixelRatio(Math.max(0.6, renderer.getPixelRatio() * 0.8));
        frameTimes.length = 0;
      }
    } else frameTimes.length = 0;
    const dt = Math.min(elapsed / 1000, 0.05);
    lastTime = now;
    let moving = false;
    const reveal =
      view.intro && !view.reduced
        ? Math.max(0, 1 - (now - introStarted) / 1800)
        : 0;
    shell.visible = !view.cutaway || reveal > 0;
    shellMaterial.opacity = view.cutaway ? reveal : 1;
    shellMaterial.depthWrite = !view.cutaway;
    if (reveal > 0) {
      camera.position
        .copy(desiredCamera)
        .sub(desiredTarget)
        .multiplyScalar(1 + reveal * 0.08)
        .add(desiredTarget);
      moving = true;
    }
    if (
      camera.position.distanceTo(desiredCamera) > 0.006 &&
      !controls.enabled
    ) {
      camera.position.lerp(desiredCamera, view.reduced ? 1 : 0.085);
      controls.target.lerp(desiredTarget, view.reduced ? 1 : 0.085);
      moving = true;
    }
    if (now > snappingUntil) {
      controls.enabled = view.rotate;
      controls.enableRotate = view.rotate;
    }
    groups.forEach((g, i) => {
      let offset = view.explode ? (5 - i) * 0.18 : 0;
      if (
        !view.intro &&
        !view.compute &&
        i === view.stage &&
        !view.installed.includes(i) &&
        i < 10
      )
        offset += 0.45;
      if (drag?.stage === i) offset = g.position.y;
      if (Math.abs(g.position.y - offset) > 0.001) {
        g.position.y = T.MathUtils.lerp(
          g.position.y,
          offset,
          view.reduced ? 1 : 0.1,
        );
        moving = true;
      }
    });
    if (view.rotate && !view.reduced && now > snappingUntil) {
      root.rotation.y += dt * 0.12;
      moving = true;
    }
    const seatedProgress = (now - seatedAt) / 900;
    const seating =
      seatingStage === view.stage &&
      seatedProgress >= 0 &&
      seatedProgress < 1 &&
      !view.reduced &&
      !view.compute;
    if (seating) {
      highlight.visible = true;
      highlight.scale.setScalar(1 + 0.1 * seatedProgress);
      highlight.material.opacity = (1 - seatedProgress) * 0.8;
      moving = true;
    } else {
      highlight.scale.setScalar(1);
      highlight.material.opacity = 1;
      highlight.visible =
        !view.intro &&
        !view.compute &&
        !view.installed.includes(view.stage) &&
        view.stage < 7;
    }
    const t = (now - signalStart) / 3400;
    const virtual =
      view.operation && ["Z", "Rz", "S", "T"].includes(view.operation.name);
    signal.visible = view.compute
      ? Boolean(view.operation) &&
        !virtual &&
        (view.acquired
          ? view.shotProgress < 1
          : view.fraction > 0 && view.fraction < 1)
      : t >= 0 && t <= 1 && !view.reduced;
    pulseTrail.visible = signal.visible;
    if (signal.visible) {
      const returning = view.compute
        ? view.operation.name === "M"
        : signalKind === "readout" || t > 0.53;
      const p = view.compute
        ? returning
          ? view.shotProgress
          : (view.nativeSegment?.fraction ?? view.fraction)
        : signalKind === "readout"
          ? t
          : returning
            ? (t - 0.53) / 0.47
            : t / 0.53;
      const flux = view.compute && view.nativeSegment?.kind === "flux";
      const path = returning ? readoutPath : flux ? fluxPath : controlPath;
      const chipClose = view.compute && view.focus === "processor";
      const point = (progress) => {
        const t = Math.max(0, Math.min(1, progress));
        if (!chipClose)
          return (returning ? groups[6] : groups[5]).localToWorld(
            path.getPointAt(t),
          );
        const targetX = ((view.operation?.target ?? 0) - 1) * 0.125;
        const controlX = ((view.operation?.control ?? 0) - 1) * 0.125;
        return groups[8].localToWorld(
          new T.Vector3(
            flux ? controlX + (targetX - controlX) * t : targetX,
            -1.898,
            flux
              ? 0.055
              : returning
                ? (model ? -0.115 : 0.17) * t
                : (model ? 0.145 : -0.17) * (1 - t),
          ),
        );
      };
      signal.scale.setScalar(chipClose ? 0.16 : 1);
      pulseTrail.scale.setScalar(1);
      signal.position.copy(point(p));
      signal.material.color.set(
        returning ? 0xe7c775 : flux ? 0xe68ec9 : 0x62b1ff,
      );
      pulseHalo.material.color.copy(signal.material.color);
      pulseTrail.material.color.copy(signal.material.color);
      for (let j = 0; j < 10; j++) {
        const progress = p - (j + 1) * 0.012;
        trailPose.position.copy(point(progress));
        trailPose.scale.setScalar(
          (progress < 0 ? 0 : 1 - j / 11) * (chipClose ? 0.16 : 1),
        );
        trailPose.updateMatrix();
        pulseTrail.setMatrixAt(j, trailPose.matrix);
      }
      pulseTrail.instanceMatrix.needsUpdate = true;
      moving ||= !view.compute;
    }
    if (view.noise && !view.reduced) {
      noise.rotation.y += dt * 0.3;
      moving = true;
    }
    if (view.explode) {
      lid.visible = true;
      lid.position.y = -1.15;
    } else lid.position.y = -1.87;
    controls.update();
    if (gas.visible && !view.reduced) {
      gas.rotation.y += dt * 0.14;
      moving = true;
    }
    camera.updateMatrixWorld();
    const labels = document.getElementById("component-labels");
    labels.style.display =
      view.labels && (!view.compute || view.focus === "processor")
        ? "block"
        : "none";
    if (view.labels && now - lastLabelFrame > 100) {
      lastLabelFrame = now;
      const close =
        view.focus === "processor" ||
        (!view.intro && !view.compute && [7, 8].includes(view.stage));
      labels.style.display =
        view.labels && (!view.compute || view.focus === "processor")
          ? "block"
          : "none";
      const width = host.clientWidth,
        height = host.clientHeight;
      labels.setAttribute("viewBox", `0 0 ${width} ${height}`);
      const anchors =
        view.compute && close
          ? Array.from({ length: view.n }, (_, q) => ({
              group: 8,
              pos: [(q - 1) * 0.125, -1.898, 0],
              text: `q${q} · ${view.acquired ? "READOUT" : view.operation?.control === q ? "CONTROL" : view.operation?.target === q ? (view.nativeSegment?.kind === "flux" ? "FLUX" : ["Z", "Rz", "S", "T"].includes(view.operation.name) ? "FRAME" : "DRIVE") : "IDLE"}`,
              side: q === 0 ? -1 : 1,
              color: view.acquired
                ? "#e7c775"
                : view.operation?.control === q
                  ? "#e68ec9"
                  : view.operation?.target === q
                    ? "#71d1d9"
                    : "#8295a8",
            }))
          : close
            ? [
                {
                  group: 8,
                  pos: [-0.125, -1.92, 0],
                  text: "CAPACITIVE PADS",
                  side: -1,
                  color: "#6ca6f8",
                },
                {
                  group: 8,
                  pos: [0.02, -1.912, 0.055],
                  text: "COUPLING BUS",
                  side: 1,
                  color: "#e68ec9",
                },
                {
                  group: 8,
                  pos: [0.125, -1.912, -0.1],
                  text: "READOUT RESONATOR",
                  side: 1,
                  color: "#e7c775",
                },
              ]
            : [
                {
                  group: 3,
                  pos: [0.8, 0.75, 0],
                  text: "THERMAL INTERCEPT",
                  side: 1,
                  color: "#d9bc7d",
                },
                {
                  group: 5,
                  pos: [-0.63, -0.8, 0.4],
                  text: "STAGED ATTENUATION",
                  side: -1,
                  color: "#62b1ff",
                },
                {
                  group: 7,
                  pos: [0, -2.13, 0],
                  text: "PROCESSOR PACKAGE",
                  side: 1,
                  color: "#e7c775",
                },
              ];
      labels.innerHTML = anchors
        .filter(
          (a) =>
            groups[a.group].visible &&
            !(close && !view.compute && view.stage === 7 && a.group === 8),
        )
        .map((a, index) => {
          labelVector.set(...a.pos);
          groups[a.group].localToWorld(labelVector);
          labelVector.project(camera);
          const x = (labelVector.x * 0.5 + 0.5) * width,
            y = (-labelVector.y * 0.5 + 0.5) * height;
          const tx = close
              ? index === 0
                ? 20
                : width - (view.compute ? 86 : width < 520 ? 160 : 185)
              : Math.max(
                  12,
                  Math.min(
                    width - (width < 520 ? 200 : 145),
                    x + (a.side === 1 ? 45 : -180),
                  ),
                ),
            ty = close
              ? height *
                (view.compute
                  ? [0.28, 0.24, 0.57][index]
                  : [0.36, 0.2, 0.65][index])
              : Math.max(70, Math.min(height - 140, y - 22));
          const text =
            width < 520
              ? a.text
                  .replace("THERMAL INTERCEPT", "THERMAL STAGE")
                  .replace("STAGED ATTENUATION", "ATTENUATION")
                  .replace("PROCESSOR PACKAGE", "CHIP PACKAGE")
              : a.text;
          return `<g fill="${a.color}" font-family="Arial,sans-serif" font-size="10" letter-spacing=".7"><path d="M${x} ${y}L${a.side === 1 ? tx : tx + (view.compute ? 65 : width < 520 ? 90 : 137)} ${ty + 8}H${tx}" fill="none" stroke="${a.color}" stroke-width=".7" opacity=".65"/><circle cx="${x}" cy="${y}" r="2"/><text x="${tx}" y="${ty}">${text}</text></g>`;
        })
        .join("");
    }
    cameraTarget.copy(controls.target);
    renderer.render(scene, camera);
    if (!document.body.classList.contains("webgl"))
      document.body.classList.add("webgl");
    frameCount++;
    if (moving || view.rotate) wake();
    else {
      // Idle time between on-demand renders is not a slow animation frame.
      lastTime = 0;
      frameTimes.length = 0;
    }
  }
  function wake() {
    if (!raf && !disposed && visible && !document.hidden && !view.html)
      raf = requestAnimationFrame(frame);
  }
  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) wake();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
        lastTime = 0;
        frameTimes.length = 0;
      }
    },
    { threshold: 0.01 },
  );
  intersection.observe(host);
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      lastTime = 0;
      frameTimes.length = 0;
    } else wake();
  };
  document.addEventListener("visibilitychange", visibility);
  controls.addEventListener("change", wake);
  let drag = null;
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2(),
    dragPlane = new T.Plane(),
    dragPoint = new T.Vector3();
  function rayAt(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
  }
  const down = (e) => {
    if (
      view.rotate ||
      view.intro ||
      view.compute ||
      view.stage >= 10 ||
      view.installed.includes(view.stage) ||
      e.button !== 0
    )
      return;
    rayAt(e);
    const hit = raycaster
      .intersectObjects(
        groups.filter((g) => g.visible),
        true,
      )
      .find((intersection) => intersection.object.visible);
    if (!hit) return;
    let part = hit.object;
    while (part.parent !== root && part.parent) part = part.parent;
    if (part !== groups[view.stage]) return;
    camera.getWorldDirection(dragPoint);
    dragPlane.setFromNormalAndCoplanarPoint(dragPoint, hit.point);
    drag = {
      stage: view.stage,
      point: hit.point.clone(),
      offset: part.position.y,
      pointer: e.pointerId,
    };
    renderer.domElement.setPointerCapture(e.pointerId);
    renderer.domElement.style.cursor = "grabbing";
    document.getElementById("assembly-guidance-text").textContent =
      "Move downward to align the part with its seating outline.";
    wake();
  };
  const move = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    rayAt(e);
    if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
    const offset = T.MathUtils.clamp(
      drag.offset + dragPoint.y - drag.point.y,
      -0.15,
      1.5,
    );
    groups[drag.stage].position.y = offset;
    const aligned =
      Math.abs(offset - (view.explode ? (5 - drag.stage) * 0.18 : 0)) < 0.14;
    document
      .getElementById("assembly-guidance")
      .classList.toggle("aligned", aligned);
    document.getElementById("assembly-guidance-text").textContent = aligned
      ? "Aligned. Release to seat the part."
      : "Keep aligning the part with its outline.";
    wake();
  };
  const up = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const offset = groups[drag.stage].position.y,
      aligned =
        Math.abs(offset - (view.explode ? (5 - drag.stage) * 0.18 : 0)) < 0.14;
    drag = null;
    if (renderer.domElement.hasPointerCapture(e.pointerId))
      renderer.domElement.releasePointerCapture(e.pointerId);
    renderer.domElement.style.cursor = "grab";
    document.getElementById("assembly-guidance").classList.remove("aligned");
    if (aligned && e.type !== "pointercancel") onPlace();
    else
      document.getElementById("assembly-guidance-text").textContent =
        "Not seated yet. Try aligning again, or use Install.";
    wake();
  };
  renderer.domElement.addEventListener("pointerdown", down);
  renderer.domElement.addEventListener("pointermove", move);
  renderer.domElement.addEventListener("pointerup", up);
  renderer.domElement.addEventListener("pointercancel", up);
  renderer.domElement.addEventListener("lostpointercapture", () => {
    if (!drag) return;
    drag = null;
    renderer.domElement.style.cursor = "grab";
    document.getElementById("assembly-guidance").classList.remove("aligned");
    wake();
  });
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    document.body.classList.remove("webgl");
    document.getElementById("render-mode").textContent =
      "CONTEXT LOST · HTML CUTAWAY";
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    contextLost = false;
    wake();
  });
  resize();
  return {
    update,
    trigger,
    reset: () => {
      lastView = "";
      root.rotation.set(0, 0, 0);
      update(view);
      wake();
    },
    stats: () => ({
      frames: frameCount,
      adapter,
      processorModelLoaded: Boolean(model),
      cameraDistance: camera.position.distanceTo(controls.target),
      moduleOffsets: groups.map((g) => g.position.y),
      dragging: drag?.stage ?? null,
      pixelRatio: renderer.getPixelRatio(),
      contactShadows: renderer.shadowMap.enabled
        ? "real-time + soft baked"
        : "soft baked",
      environment: {
        width: envTarget.width,
        height: envTarget.height,
        estimatedBytes: envTarget.width * envTarget.height * 8,
      },
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
    }),
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      controls.dispose();
      brushedTexture.dispose();
      contactTexture.dispose();
      glowTexture.dispose();
      faultMaterial.dispose();
      const geometries = new Set(),
        materials = new Set();
      scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      ghostMaterial.dispose();
      shellMaterial.dispose();
      envTarget.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
