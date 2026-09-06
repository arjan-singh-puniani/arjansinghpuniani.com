import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const canvas = document.querySelector('#viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'default' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a0f);
scene.fog = new THREE.FogExp2(0x070a0f, 0.09);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.025, 50);
camera.position.set(2.45, 1.48, 2.55);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.35, 0.42, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 0.18;
controls.maxDistance = 9;
controls.maxPolarAngle = Math.PI * 0.98;
controls.zoomToCursor = true;

const clock = new THREE.Clock();
const TOTAL_SECONDS = 3.05;
const state = {
  t: 0,
  playing: false,
  speed: 1,
  cutaway: false,
  exploded: false,
  trails: true,
  follow: false,
  labels: true,
  selected: null,
  cameraTween: null,
};

const C = {
  carbon: 0x12161c,
  carbon2: 0x202630,
  rubber: 0x141414,
  rubberEdge: 0x252525,
  metal: 0xb4bcc5,
  darkMetal: 0x343a43,
  brake: 0x9b1b24,
  red: 0xe3172f,
  amber: 0xffa227,
  green: 0x30e59a,
  blue: 0x4ca5ff,
};

const mats = {
  carbon: new THREE.MeshPhysicalMaterial({ color: C.carbon, roughness: 0.34, metalness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
  carbon2: new THREE.MeshStandardMaterial({ color: C.carbon2, roughness: 0.48, metalness: 0.22 }),
  rubber: new THREE.MeshPhysicalMaterial({ color: C.rubber, roughness: 0.88, metalness: 0.0, clearcoat: 0.03 }),
  rubberEdge: new THREE.MeshStandardMaterial({ color: C.rubberEdge, roughness: 0.72 }),
  magnesium: new THREE.MeshPhysicalMaterial({ color: 0x4d535b, roughness: 0.28, metalness: 0.92, clearcoat: 0.22 }),
  magnesiumDark: new THREE.MeshStandardMaterial({ color: 0x242930, roughness: 0.34, metalness: 0.86 }),
  steel: new THREE.MeshStandardMaterial({ color: C.metal, roughness: 0.22, metalness: 0.95 }),
  darkSteel: new THREE.MeshStandardMaterial({ color: C.darkMetal, roughness: 0.3, metalness: 0.9 }),
  brake: new THREE.MeshPhysicalMaterial({ color: C.brake, roughness: 0.26, metalness: 0.5, clearcoat: 0.5 }),
  gun: new THREE.MeshPhysicalMaterial({ color: 0x1d232b, roughness: 0.28, metalness: 0.68, clearcoat: 0.2 }),
  gunAccent: new THREE.MeshStandardMaterial({ color: C.red, roughness: 0.3, metalness: 0.4 }),
  glove: new THREE.MeshStandardMaterial({ color: 0x171b22, roughness: 0.75, metalness: 0.05 }),
  suit: new THREE.MeshStandardMaterial({ color: 0x262d37, roughness: 0.72 }),
  white: new THREE.MeshStandardMaterial({ color: 0xe9edf1, roughness: 0.42 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x1b2027, roughness: 0.93, metalness: 0.03 }),
};

function mesh(geometry, material, name = '') {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function axisCylinder(radius, length, material, radialSegments = 32) {
  const m = mesh(new THREE.CylinderGeometry(radius, radius, length, radialSegments), material);
  m.rotation.z = Math.PI / 2;
  return m;
}

function alignBetween(object, a, b) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const dir = b.clone().sub(a);
  object.position.copy(mid);
  object.scale.set(1, dir.length(), 1);
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
}

function rodBetween(a, b, radius, material, segments = 18) {
  const rod = mesh(new THREE.CylinderGeometry(radius, radius, 1, segments), material);
  alignBetween(rod, a, b);
  return rod;
}

function roundedBox(w, h, d, radius, material) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + h - radius);
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  shape.lineTo(x + radius, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: radius * 0.32, bevelThickness: radius * 0.32 });
  g.center();
  return mesh(g, material);
}

function makeCanvasSidewall(color = '#ffd447', text = 'FORMULA RACE') {
  const cvs = document.createElement('canvas');
  cvs.width = 1024;
  cvs.height = 1024;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  ctx.translate(512, 512);
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(0, 0, 448, 0.20, Math.PI - 0.20);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 448, Math.PI + 0.20, Math.PI * 2 - 0.20);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 44px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, -420);
  ctx.fillText('18 IN  RACE', 0, 420);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function registerSelectable(root, title, description) {
  root.userData.inspectTitle = title;
  root.userData.inspectDescription = description;
  root.traverse((obj) => {
    if (obj.isMesh && !obj.userData.selectRoot) obj.userData.selectRoot = root;
  });
  return root;
}

const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.01);

function makeWheel({ compoundColor = '#ffd447', label = 'MEDIUM', name = 'Wheel' } = {}) {
  const wheel = new THREE.Group();
  wheel.name = name;

  const tireWidth = 0.305;
  const tireRadius = 0.355;
  const rimRadius = 0.229;

  const profile = [
    new THREE.Vector2(rimRadius + 0.006, -tireWidth * 0.5),
    new THREE.Vector2(0.285, -tireWidth * 0.5),
    new THREE.Vector2(0.335, -tireWidth * 0.42),
    new THREE.Vector2(tireRadius - 0.004, -tireWidth * 0.22),
    new THREE.Vector2(tireRadius, 0),
    new THREE.Vector2(tireRadius - 0.004, tireWidth * 0.22),
    new THREE.Vector2(0.335, tireWidth * 0.42),
    new THREE.Vector2(0.285, tireWidth * 0.5),
    new THREE.Vector2(rimRadius + 0.006, tireWidth * 0.5),
  ];
  const tireMaterial = mats.rubber.clone();
  const tire = mesh(new THREE.LatheGeometry(profile, 128), tireMaterial, `${name} tire`);
  tire.rotation.z = -Math.PI / 2;
  wheel.add(tire);

  const tread = new THREE.Group();
  tread.name = `${name} slick mold lines`;
  for (const x of [-0.085, 0, 0.085]) {
    const seam = mesh(new THREE.TorusGeometry(tireRadius + 0.0008, 0.0014, 6, 128), mats.rubberEdge, 'Slick mold line');
    seam.rotation.y = Math.PI / 2;
    seam.position.x = x;
    tread.add(seam);
  }
  wheel.add(tread);

  const barrel = axisCylinder(rimRadius, tireWidth * 0.9, mats.magnesium, 96);
  barrel.material = mats.magnesium.clone();
  barrel.geometry = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth * 0.9, 96, 1, true);
  barrel.rotation.z = Math.PI / 2;
  barrel.name = `${name} rim barrel`;
  wheel.add(barrel);

  const innerBarrel = axisCylinder(rimRadius - 0.025, tireWidth * 0.91, mats.magnesiumDark, 96);
  innerBarrel.name = `${name} inner barrel`;
  wheel.add(innerBarrel);

  const flangeIn = mesh(new THREE.TorusGeometry(rimRadius, 0.009, 10, 96), mats.magnesium, 'Inner rim flange');
  flangeIn.rotation.y = Math.PI / 2;
  flangeIn.position.x = -tireWidth * 0.46;
  wheel.add(flangeIn);
  const flangeOut = flangeIn.clone();
  flangeOut.position.x = tireWidth * 0.46;
  flangeOut.name = 'Outer rim flange';
  wheel.add(flangeOut);

  const spokeGroup = new THREE.Group();
  spokeGroup.name = `${name} spokes`;
  const spokeMat = mats.magnesium.clone();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r1 = 0.072;
    const r2 = 0.205;
    const p1 = new THREE.Vector3(tireWidth * 0.43, Math.sin(a) * r1, Math.cos(a) * r1);
    const p2 = new THREE.Vector3(tireWidth * 0.43, Math.sin(a + 0.035) * r2, Math.cos(a + 0.035) * r2);
    const spoke = rodBetween(p1, p2, 0.009, spokeMat, 10);
    spoke.scale.x = 0.75;
    spokeGroup.add(spoke);
  }
  wheel.add(spokeGroup);

  const centerBoss = axisCylinder(0.078, 0.054, mats.magnesium, 64);
  centerBoss.position.x = tireWidth * 0.42;
  centerBoss.name = `${name} center boss`;
  wheel.add(centerBoss);

  const splineHole = axisCylinder(0.047, 0.062, mats.darkSteel, 48);
  splineHole.position.x = tireWidth * 0.445;
  splineHole.name = `${name} center bore`;
  wheel.add(splineHole);

  const nut = axisCylinder(0.056, 0.042, mats.steel, 8);
  nut.position.x = tireWidth * 0.53;
  nut.rotation.x = Math.PI / 8;
  nut.name = `${name} retained center nut`;
  wheel.add(nut);

  const nutCap = axisCylinder(0.032, 0.046, mats.darkSteel, 32);
  nutCap.position.x = tireWidth * 0.56;
  nutCap.name = 'Nut drive face';
  wheel.add(nutCap);

  const retentionCollar = mesh(new THREE.TorusGeometry(0.064, 0.006, 10, 64), mats.gunAccent, 'Nut retention collar');
  retentionCollar.rotation.y = Math.PI / 2;
  retentionCollar.position.x = tireWidth * 0.505;
  wheel.add(retentionCollar);

  const sidewallMat = new THREE.MeshBasicMaterial({ map: makeCanvasSidewall(compoundColor, label), transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const sidewall = mesh(new THREE.RingGeometry(0.243, 0.35, 128), sidewallMat, `${name} sidewall markings`);
  sidewall.rotation.y = Math.PI / 2;
  sidewall.position.x = tireWidth * 0.505;
  sidewall.renderOrder = 3;
  wheel.add(sidewall);

  const valve = axisCylinder(0.005, 0.038, mats.darkSteel, 12);
  valve.position.set(tireWidth * 0.51, 0.185, 0.07);
  valve.rotation.z = Math.PI / 2;
  wheel.add(valve);

  tire.userData.basePosition = tire.position.clone();
  tread.userData.basePosition = tread.position.clone();
  barrel.userData.basePosition = barrel.position.clone();
  innerBarrel.userData.basePosition = innerBarrel.position.clone();
  flangeIn.userData.basePosition = flangeIn.position.clone();
  flangeOut.userData.basePosition = flangeOut.position.clone();
  spokeGroup.userData.basePosition = spokeGroup.position.clone();
  centerBoss.userData.basePosition = centerBoss.position.clone();
  splineHole.userData.basePosition = splineHole.position.clone();
  nut.userData.basePosition = nut.position.clone();
  nutCap.userData.basePosition = nutCap.position.clone();
  retentionCollar.userData.basePosition = retentionCollar.position.clone();
  sidewall.userData.basePosition = sidewall.position.clone();
  valve.userData.basePosition = valve.position.clone();

  wheel.userData.parts = { tire, tread, barrel, innerBarrel, flangeIn, flangeOut, spokeGroup, centerBoss, splineHole, nut, nutCap, retentionCollar, sidewall, valve };
  wheel.userData.tireWidth = tireWidth;

  registerSelectable(tire, 'Slick racing tire', 'A low-profile 18-inch slick. The rounded shoulders and broad contact surface support high lateral load.');
  registerSelectable(spokeGroup, 'Magnesium wheel', 'A lightweight center-lock wheel with a deep barrel and radial spokes.');
  registerSelectable(nut, 'Retained center nut', 'The center nut moves along the axle thread but remains captured by the wheel retention collar.');
  registerSelectable(sidewall, 'Compound markings', 'The colored ring identifies the tire compound. This simulator uses a generic race-tire marking.');
  registerSelectable(wheel, `${name}`, 'A complete wheel assembly with slick tire, magnesium rim, center bore, retained nut, valve and sidewall markings.');
  return wheel;
}

function makeHubAndBrake() {
  const group = new THREE.Group();
  group.name = 'Hub and brake system';

  const upright = roundedBox(0.13, 0.28, 0.18, 0.025, mats.darkSteel);
  upright.position.set(0.275, 0.43, 0);
  upright.rotation.y = Math.PI / 2;
  upright.name = 'Wheel upright';
  group.add(upright);

  const axle = axisCylinder(0.036, 0.46, mats.steel, 48);
  axle.position.set(0.48, 0.43, 0);
  axle.name = 'Threaded axle';
  group.add(axle);

  const threaded = new THREE.Group();
  threaded.name = 'Axle thread';
  for (let i = 0; i < 13; i++) {
    const ring = mesh(new THREE.TorusGeometry(0.039, 0.0022, 6, 32), mats.darkSteel, 'Thread ridge');
    ring.rotation.y = Math.PI / 2;
    ring.position.set(0.60 + i * 0.009, 0.43, 0);
    threaded.add(ring);
  }
  group.add(threaded);

  const hub = axisCylinder(0.095, 0.115, mats.darkSteel, 64);
  hub.position.set(0.43, 0.43, 0);
  hub.name = 'Center-lock hub';
  group.add(hub);

  const splines = new THREE.Group();
  splines.name = 'Drive splines';
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2;
    const tooth = mesh(new THREE.BoxGeometry(0.11, 0.009, 0.018), mats.steel, 'Drive spline');
    tooth.position.set(0.49, 0.43 + Math.sin(a) * 0.078, Math.cos(a) * 0.078);
    tooth.rotation.x = a;
    splines.add(tooth);
  }
  group.add(splines);

  const disc = axisCylinder(0.218, 0.026, mats.darkSteel, 96);
  disc.position.set(0.285, 0.43, 0);
  disc.name = 'Carbon brake disc';
  group.add(disc);

  const discFace = mesh(new THREE.TorusGeometry(0.163, 0.051, 16, 96), new THREE.MeshStandardMaterial({ color: 0x2e3339, roughness: 0.55, metalness: 0.52 }), 'Brake friction ring');
  discFace.rotation.y = Math.PI / 2;
  discFace.position.set(0.301, 0.43, 0);
  group.add(discFace);

  const holes = new THREE.Group();
  holes.name = 'Disc ventilation holes';
  for (let r = 0; r < 2; r++) {
    const rr = r ? 0.185 : 0.142;
    const count = r ? 30 : 22;
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2 + r * 0.08;
      const dot = axisCylinder(0.0035, 0.029, new THREE.MeshBasicMaterial({ color: 0x08090a }), 10);
      dot.position.set(0.304, 0.43 + Math.sin(a) * rr, Math.cos(a) * rr);
      holes.add(dot);
    }
  }
  group.add(holes);

  const bell = axisCylinder(0.105, 0.034, mats.magnesiumDark, 48);
  bell.position.set(0.304, 0.43, 0);
  bell.name = 'Brake bell';
  group.add(bell);

  const caliper = new THREE.Group();
  caliper.name = 'Brake caliper';
  const caliperBody = roundedBox(0.09, 0.19, 0.08, 0.022, mats.brake);
  caliperBody.position.set(0.285, 0.43, 0.168);
  caliperBody.rotation.y = Math.PI / 2;
  caliper.add(caliperBody);
  const bridge = roundedBox(0.085, 0.055, 0.12, 0.016, mats.brake);
  bridge.position.set(0.285, 0.43, 0.15);
  bridge.rotation.y = Math.PI / 2;
  caliper.add(bridge);
  group.add(caliper);

  const lowerA = rodBetween(new THREE.Vector3(-0.48, 0.16, -0.32), new THREE.Vector3(0.25, 0.35, -0.08), 0.018, mats.carbon, 18);
  const lowerB = rodBetween(new THREE.Vector3(-0.48, 0.16, 0.32), new THREE.Vector3(0.25, 0.35, 0.08), 0.018, mats.carbon, 18);
  const upperA = rodBetween(new THREE.Vector3(-0.42, 0.72, -0.26), new THREE.Vector3(0.25, 0.52, -0.07), 0.015, mats.carbon, 18);
  const upperB = rodBetween(new THREE.Vector3(-0.42, 0.72, 0.26), new THREE.Vector3(0.25, 0.52, 0.07), 0.015, mats.carbon, 18);
  const steering = rodBetween(new THREE.Vector3(-0.38, 0.44, -0.34), new THREE.Vector3(0.25, 0.45, -0.10), 0.012, mats.steel, 16);
  group.add(lowerA, lowerB, upperA, upperB, steering);

  registerSelectable(axle, 'Threaded axle', 'The center-lock nut runs along this single axle thread. Splines transmit drive torque through the hub.');
  registerSelectable(hub, 'Hub and drive splines', 'The hub centers the wheel and transmits braking and drive loads through its splined interface.');
  registerSelectable(disc, 'Carbon brake disc', 'A ventilated carbon friction ring sits inboard of the wheel and rotates with the hub.');
  registerSelectable(caliper, 'Brake caliper', 'The fixed caliper clamps the rotating disc. Its position remains fixed while the wheel and disc rotate.');
  registerSelectable(group, 'Hub, brake and suspension', 'The corner assembly includes the axle, drive splines, carbon disc, fixed caliper, upright and suspension links.');

  group.userData.axle = axle;
  group.userData.hub = hub;
  group.userData.disc = disc;
  group.userData.caliper = caliper;
  return group;
}

function makeCarBody() {
  const car = new THREE.Group();
  car.name = 'Car chassis corner';

  const monocoque = roundedBox(1.45, 0.34, 0.64, 0.08, mats.carbon);
  monocoque.position.set(-0.82, 0.55, 0);
  monocoque.rotation.y = Math.PI / 2;
  car.add(monocoque);

  const nose = roundedBox(0.88, 0.16, 0.24, 0.05, mats.carbon2);
  nose.position.set(-0.82, 0.45, -0.62);
  car.add(nose);

  const bodyPanel = roundedBox(0.7, 0.23, 0.6, 0.06, mats.gunAccent);
  bodyPanel.position.set(-0.66, 0.65, 0);
  bodyPanel.rotation.y = Math.PI / 2;
  car.add(bodyPanel);

  const floor = mesh(new THREE.BoxGeometry(1.6, 0.035, 0.86), mats.carbon, 'Floor plank');
  floor.position.set(-0.62, 0.23, 0);
  car.add(floor);

  const wingMain = mesh(new THREE.BoxGeometry(1.2, 0.035, 0.18), mats.carbon2, 'Front wing plane');
  wingMain.position.set(-0.85, 0.25, -0.92);
  car.add(wingMain);
  const endplateL = mesh(new THREE.BoxGeometry(0.035, 0.25, 0.25), mats.carbon2, 'Wing endplate');
  endplateL.position.set(-0.25, 0.31, -0.92);
  car.add(endplateL);

  registerSelectable(car, 'Formula car corner', 'A generic carbon-fiber single-seater chassis corner provides spatial context for the suspension and wheel system.');
  return car;
}

function makeJack() {
  const jack = new THREE.Group();
  jack.name = 'Side lifting jack';
  const base = mesh(new THREE.BoxGeometry(0.55, 0.04, 0.34), mats.darkSteel, 'Jack base');
  base.position.set(-0.18, 0.045, 0);
  jack.add(base);
  const arm1 = rodBetween(new THREE.Vector3(-0.32, 0.08, -0.1), new THREE.Vector3(-0.08, 0.34, -0.1), 0.018, mats.steel, 16);
  const arm2 = rodBetween(new THREE.Vector3(-0.32, 0.08, 0.1), new THREE.Vector3(-0.08, 0.34, 0.1), 0.018, mats.steel, 16);
  jack.add(arm1, arm2);
  const pad = roundedBox(0.18, 0.035, 0.18, 0.012, mats.gunAccent);
  pad.position.set(-0.08, 0.36, 0);
  jack.add(pad);
  jack.userData.pad = pad;
  registerSelectable(jack, 'Lifting jack', 'The car remains raised while the nut is loose and either wheel is off the hub.');
  return jack;
}

function makeWheelGun() {
  const gun = new THREE.Group();
  gun.name = 'Pneumatic wheel gun';

  const barrel = axisCylinder(0.052, 0.27, mats.gun, 48);
  barrel.position.x = -0.03;
  barrel.name = 'Impact barrel';
  gun.add(barrel);

  const motor = axisCylinder(0.085, 0.18, mats.gun, 48);
  motor.position.x = 0.17;
  motor.name = 'Pneumatic motor';
  gun.add(motor);

  const rotor = new THREE.Group();
  rotor.name = 'Gun rotor and socket';
  const socket = axisCylinder(0.061, 0.105, mats.darkSteel, 12);
  socket.position.x = -0.205;
  socket.name = 'Center-nut socket';
  rotor.add(socket);
  const collar = mesh(new THREE.TorusGeometry(0.067, 0.007, 8, 32), mats.gunAccent, 'Socket collar');
  collar.rotation.y = Math.PI / 2;
  collar.position.x = -0.255;
  rotor.add(collar);
  gun.add(rotor);

  const handle = roundedBox(0.08, 0.24, 0.09, 0.02, mats.gun);
  handle.position.set(0.15, -0.16, 0);
  handle.rotation.z = -0.12;
  handle.name = 'Wheel-gun handle';
  gun.add(handle);

  const trigger = roundedBox(0.025, 0.045, 0.05, 0.007, mats.gunAccent);
  trigger.position.set(0.105, -0.11, 0.045);
  gun.add(trigger);

  const controller = roundedBox(0.11, 0.075, 0.105, 0.016, mats.gun);
  controller.position.set(0.21, 0.095, 0);
  controller.name = 'Gun control module';
  gun.add(controller);
  const screen = mesh(new THREE.PlaneGeometry(0.064, 0.034), new THREE.MeshBasicMaterial({ color: 0x18d889, toneMapped: false }), 'Torque-status display');
  screen.position.set(0.21, 0.10, 0.054);
  screen.rotation.y = 0;
  gun.add(screen);
  const led = mesh(new THREE.SphereGeometry(0.008, 16, 10), new THREE.MeshBasicMaterial({ color: C.green, toneMapped: false }), 'Gun status LED');
  led.position.set(0.255, 0.13, 0.055);
  gun.add(led);

  const inlet = axisCylinder(0.02, 0.08, mats.darkSteel, 20);
  inlet.rotation.z = 0;
  inlet.position.set(0.17, -0.31, 0);
  gun.add(inlet);

  gun.userData.rotor = rotor;
  gun.userData.led = led;
  gun.userData.screen = screen;
  registerSelectable(gun, 'Pneumatic wheel gun', 'The socket engages the retained center nut. The gun reverses to loosen, then tightens until its controller confirms lock.');
  return gun;
}

function makePitEnvironment() {
  const env = new THREE.Group();
  const floor = mesh(new THREE.PlaneGeometry(30, 30), mats.floor, 'Pit-lane floor');
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  env.add(floor);

  const stripMat = new THREE.MeshStandardMaterial({ color: 0xe8e9ea, roughness: 0.75 });
  const redMat = new THREE.MeshStandardMaterial({ color: C.red, roughness: 0.7 });
  for (let i = -7; i <= 7; i++) {
    const tile = mesh(new THREE.PlaneGeometry(0.28, 0.12), i % 2 === 0 ? stripMat : redMat, 'Pit-box marking');
    tile.rotation.x = -Math.PI / 2;
    tile.position.set(i * 0.28, 0.003, -0.75);
    env.add(tile);
  }
  const centerMark = mesh(new THREE.PlaneGeometry(0.055, 4.5), new THREE.MeshStandardMaterial({ color: 0xf2cf28, roughness: 0.7 }), 'Pit center line');
  centerMark.rotation.x = -Math.PI / 2;
  centerMark.position.set(-1.3, 0.004, 0);
  env.add(centerMark);

  const backWall = mesh(new THREE.PlaneGeometry(12, 5), new THREE.MeshStandardMaterial({ color: 0x111720, roughness: 0.86 }), 'Garage wall');
  backWall.position.set(-3.2, 2.5, -4);
  env.add(backWall);

  const trussMat = new THREE.MeshStandardMaterial({ color: 0x3e4650, roughness: 0.45, metalness: 0.8 });
  for (let i = -3; i <= 3; i++) {
    const post = mesh(new THREE.BoxGeometry(0.06, 3.8, 0.06), trussMat, 'Garage truss');
    post.position.set(i * 1.4 - 1.5, 1.9, -3.85);
    env.add(post);
  }

  return env;
}

function makeSpareRack() {
  const rack = new THREE.Group();
  rack.name = 'Spare wheel rack';
  const railMat = mats.darkSteel;
  rack.add(rodBetween(new THREE.Vector3(-1.9, 0.1, 1.3), new THREE.Vector3(-1.9, 1.1, 1.3), 0.025, railMat));
  rack.add(rodBetween(new THREE.Vector3(-1.9, 0.1, 2.25), new THREE.Vector3(-1.9, 1.1, 2.25), 0.025, railMat));
  rack.add(rodBetween(new THREE.Vector3(-1.9, 0.45, 1.25), new THREE.Vector3(-1.9, 0.45, 2.3), 0.025, railMat));
  rack.add(rodBetween(new THREE.Vector3(-1.9, 0.92, 1.25), new THREE.Vector3(-1.9, 0.92, 2.3), 0.025, railMat));

  const spareA = makeWheel({ compoundColor: '#f44336', label: 'SOFT', name: 'Soft spare wheel' });
  spareA.scale.setScalar(0.7);
  spareA.position.set(-1.82, 0.39, 1.55);
  spareA.rotation.y = Math.PI / 2;
  rack.add(spareA);
  const spareB = makeWheel({ compoundColor: '#f1f1f1', label: 'HARD', name: 'Hard spare wheel' });
  spareB.scale.setScalar(0.7);
  spareB.position.set(-1.82, 0.86, 1.95);
  spareB.rotation.y = Math.PI / 2;
  rack.add(spareB);
  return rack;
}

const environment = makePitEnvironment();
scene.add(environment);

const rig = new THREE.Group();
rig.name = 'Pit wheel rig';
scene.add(rig);

const car = makeCarBody();
rig.add(car);
const hubAssembly = makeHubAndBrake();
rig.add(hubAssembly);
const jack = makeJack();
rig.add(jack);

const oldWheel = makeWheel({ compoundColor: '#ffd447', label: 'USED MEDIUM', name: 'Outgoing wheel' });
oldWheel.position.set(0.69, 0.43, 0);
rig.add(oldWheel);

const newWheel = makeWheel({ compoundColor: '#ffd447', label: 'NEW MEDIUM', name: 'Incoming wheel' });
newWheel.position.set(2.25, 0.43, 0.58);
newWheel.rotation.x = 0.18;
rig.add(newWheel);

const gun = makeWheelGun();
gun.position.set(1.48, 0.48, 0.18);
gun.rotation.z = 0.03;
rig.add(gun);

const spareRack = makeSpareRack();
scene.add(spareRack);

// Pit-crew arms follow the wheel gun.
const crew = new THREE.Group();
crew.name = 'Wheel-gun operator';
scene.add(crew);
const shoulderA = new THREE.Vector3(1.82, 1.22, 0.28);
const shoulderB = new THREE.Vector3(1.78, 1.13, -0.08);
const elbowA = new THREE.Vector3(1.54, 0.88, 0.28);
const elbowB = new THREE.Vector3(1.5, 0.78, -0.07);
const upperArmA = mesh(new THREE.CylinderGeometry(0.045, 0.052, 1, 18), mats.suit, 'Operator upper arm');
const lowerArmA = mesh(new THREE.CylinderGeometry(0.038, 0.045, 1, 18), mats.suit, 'Operator forearm');
const upperArmB = upperArmA.clone();
const lowerArmB = lowerArmA.clone();
const handA = mesh(new THREE.SphereGeometry(0.052, 20, 14), mats.glove, 'Operator glove');
const handB = handA.clone();
crew.add(upperArmA, lowerArmA, upperArmB, lowerArmB, handA, handB);
const head = mesh(new THREE.SphereGeometry(0.12, 28, 20), mats.suit, 'Operator helmet');
head.position.set(1.92, 1.45, 0.1);
crew.add(head);
const visor = mesh(new THREE.SphereGeometry(0.105, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.47), new THREE.MeshPhysicalMaterial({ color: 0x0a1119, roughness: 0.06, metalness: 0.5, transmission: 0.16, transparent: true, opacity: 0.85 }), 'Helmet visor');
visor.position.set(1.84, 1.44, 0.1);
visor.rotation.z = Math.PI / 2;
crew.add(visor);
registerSelectable(crew, 'Wheel-gun operator', 'Two articulated arms track the wheel gun while the operator braces against the tool reaction torque.');

// Pneumatic hose as a dynamic polyline.
const hoseSegments = 36;
const hosePositions = new Float32Array(hoseSegments * 3);
const hoseGeometry = new THREE.BufferGeometry();
hoseGeometry.setAttribute('position', new THREE.BufferAttribute(hosePositions, 3));
const hose = new THREE.Line(hoseGeometry, new THREE.LineBasicMaterial({ color: 0xe1c42e, linewidth: 2, transparent: true, opacity: 0.9 }));
hose.name = 'Pneumatic air hose';
scene.add(hose);
registerSelectable(hose, 'Pneumatic air hose', 'A flexible high-flow hose supplies the wheel gun. Its curve updates as the tool moves.');

// Motion-path visualizers.
const gunPathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: C.amber, dashSize: 0.05, gapSize: 0.035, transparent: true, opacity: 0.55 }));
const wheelPathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: C.blue, dashSize: 0.05, gapSize: 0.035, transparent: true, opacity: 0.4 }));
scene.add(gunPathLine, wheelPathLine);

function gunPath(u) {
  const p0 = new THREE.Vector3(1.68, 0.57, 0.43);
  const p1 = new THREE.Vector3(1.25, 0.49, 0.18);
  const p2 = new THREE.Vector3(0.93, 0.43, 0.015);
  const p3 = new THREE.Vector3(0.84, 0.43, 0);
  const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
  return curve.getPoint(THREE.MathUtils.clamp(u, 0, 1));
}
function newWheelPath(u) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.25, 0.43, 0.58),
    new THREE.Vector3(1.85, 0.49, 0.38),
    new THREE.Vector3(1.25, 0.45, 0.12),
    new THREE.Vector3(0.69, 0.43, 0),
  ]);
  return curve.getPoint(THREE.MathUtils.clamp(u, 0, 1));
}
const gunPathPoints = Array.from({ length: 80 }, (_, i) => gunPath(i / 79));
gunPathLine.geometry.setFromPoints(gunPathPoints);
gunPathLine.computeLineDistances();
const wheelPathPoints = Array.from({ length: 80 }, (_, i) => newWheelPath(i / 79));
wheelPathLine.geometry.setFromPoints(wheelPathPoints);
wheelPathLine.computeLineDistances();

// Lighting rig.
scene.add(new THREE.HemisphereLight(0x9ec8ff, 0x19120d, 1.35));
const key = new THREE.DirectionalLight(0xffffff, 4.1);
key.position.set(3.4, 5.5, 3.2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -4;
key.shadow.camera.right = 4;
key.shadow.camera.top = 4;
key.shadow.camera.bottom = -4;
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 14;
scene.add(key);
const rimLight = new THREE.SpotLight(0xff344e, 28, 8, 0.65, 0.65, 1.2);
rimLight.position.set(-1.8, 2.5, 2.6);
rimLight.target.position.set(0.3, 0.4, 0);
scene.add(rimLight, rimLight.target);
const coolLight = new THREE.SpotLight(0x55a7ff, 22, 7, 0.55, 0.7, 1.2);
coolLight.position.set(2.7, 2.2, -2.4);
coolLight.target.position.set(0.4, 0.4, 0);
scene.add(coolLight, coolLight.target);
const topLight = new THREE.RectAreaLight(0xffffff, 8, 3.5, 1.2);
topLight.position.set(0, 3.3, 0.6);
topLight.rotation.x = -Math.PI / 2;
scene.add(topLight);

// Component labels.
const labelLayer = document.querySelector('#labelsLayer');
const labelDefs = [
  { text: 'RETAINED NUT', object: oldWheel.userData.parts.nut },
  { text: 'PNEUMATIC GUN', object: gun },
  { text: 'CARBON DISC', object: hubAssembly.userData.disc },
  { text: 'FIXED CALIPER', object: hubAssembly.userData.caliper },
  { text: 'DRIVE SPLINES', object: hubAssembly.userData.hub },
  { text: 'INCOMING WHEEL', object: newWheel },
];
for (const def of labelDefs) {
  const el = document.createElement('div');
  el.className = 'part-label';
  el.textContent = def.text;
  labelLayer.appendChild(el);
  def.el = el;
}

// Selection helper.
const selectionBox = new THREE.Box3Helper(new THREE.Box3(), 0xff4354);
selectionBox.visible = false;
selectionBox.material.transparent = true;
selectionBox.material.opacity = 0.88;
scene.add(selectionBox);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const focusMap = {
  assembly: { object: rig, title: 'Complete wheel corner', description: 'A mechanically staged center-lock wheel change with hub, brake, nut, wheel gun, jack and crew motion.' },
  wheel: { object: oldWheel, title: 'Outgoing wheel assembly', description: 'The mounted wheel leaves the splined hub after its retained nut backs off.' },
  nut: { object: oldWheel.userData.parts.nut, title: 'Retained center nut', description: 'The nut translates only a short distance and remains captured inside the outgoing wheel.' },
  gun: { object: gun, title: 'Pneumatic wheel gun', description: 'The gun approaches coaxially, reverses for removal, then tightens the replacement wheel.' },
  brake: { object: hubAssembly.userData.disc, title: 'Brake system', description: 'The brake disc stays on the car. The caliper remains fixed while the disc rotates with the hub.' },
  hub: { object: hubAssembly.userData.hub, title: 'Hub and axle', description: 'The splines align the wheel rotationally while the axle thread accepts the center nut.' },
  newWheel: { object: newWheel, title: 'Incoming wheel', description: 'The replacement follows a curved carrier path before translating coaxially onto the hub.' },
};

const cameraPresets = {
  hero: { pos: new THREE.Vector3(2.45, 1.48, 2.55), target: new THREE.Vector3(0.36, 0.43, 0) },
  gun: { pos: new THREE.Vector3(1.70, 0.74, 0.72), target: new THREE.Vector3(0.78, 0.43, 0) },
  hub: { pos: new THREE.Vector3(1.12, 0.66, 0.42), target: new THREE.Vector3(0.43, 0.43, 0) },
  brake: { pos: new THREE.Vector3(0.92, 0.78, 0.88), target: new THREE.Vector3(0.29, 0.43, 0.08) },
  top: { pos: new THREE.Vector3(0.55, 3.25, 0.05), target: new THREE.Vector3(0.38, 0.38, 0) },
  wide: { pos: new THREE.Vector3(4.2, 2.15, 4.2), target: new THREE.Vector3(-0.2, 0.45, 0.25) },
};

function setCameraPreset(name, immediate = false) {
  const preset = cameraPresets[name];
  if (!preset) return;
  document.querySelectorAll('[data-camera]').forEach((b) => b.classList.toggle('active', b.dataset.camera === name));
  if (immediate) {
    camera.position.copy(preset.pos);
    controls.target.copy(preset.target);
    controls.update();
    state.cameraTween = null;
    return;
  }
  state.cameraTween = {
    start: performance.now(),
    duration: 650,
    fromPos: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPos: preset.pos.clone(),
    toTarget: preset.target.clone(),
  };
}

function frameObject(object) {
  if (!object) return;
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const dir = camera.position.clone().sub(controls.target).normalize();
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const dist = Math.max(0.22, sphere.radius / Math.sin(fov / 2) * 1.15);
  state.cameraTween = {
    start: performance.now(), duration: 550,
    fromPos: camera.position.clone(), fromTarget: controls.target.clone(),
    toPos: sphere.center.clone().add(dir.multiplyScalar(dist)), toTarget: sphere.center.clone(),
  };
}

function selectObject(object, frame = false) {
  if (!object) return;
  state.selected = object;
  const title = object.userData.inspectTitle || object.name || 'Component';
  const desc = object.userData.inspectDescription || 'Interactive mechanical component.';
  document.querySelector('#partName').textContent = title;
  document.querySelector('#partDesc').textContent = desc;
  selectionBox.visible = true;
  selectionBox.box.setFromObject(object);
  if (frame) frameObject(object);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function smoothRange(t, a, b) {
  return THREE.MathUtils.smoothstep(t, a, b);
}
function pingPongPulse(t, a, b) {
  const u = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return Math.sin(u * Math.PI);
}

function applyExploded(wheel, amount) {
  const p = wheel.userData.parts;
  const setX = (obj, offset) => obj.position.x = obj.userData.basePosition.x + offset * amount;
  setX(p.tire, 0.20);
  setX(p.tread, 0.20);
  setX(p.barrel, 0.03);
  setX(p.innerBarrel, 0.01);
  setX(p.flangeIn, -0.03);
  setX(p.flangeOut, 0.08);
  setX(p.spokeGroup, 0.10);
  setX(p.centerBoss, 0.15);
  setX(p.splineHole, 0.16);
  setX(p.nut, 0.28);
  setX(p.nutCap, 0.28);
  setX(p.retentionCollar, 0.23);
  setX(p.sidewall, 0.22);
  setX(p.valve, 0.22);
}

function applyCutaway(wheel, enabled) {
  const p = wheel.userData.parts;
  [p.tire, p.barrel, p.innerBarrel, p.flangeIn, p.flangeOut].forEach((obj) => {
    if (!obj.material) return;
    obj.material.clippingPlanes = enabled ? [cutPlane] : [];
    obj.material.needsUpdate = true;
  });
  p.tread.children.forEach((block) => { block.visible = !enabled || block.position.z <= 0.015; });
  p.sidewall.visible = !enabled;
}

function updateCrewAndHose() {
  const handTargetA = gun.localToWorld(new THREE.Vector3(0.12, -0.14, 0.04));
  const handTargetB = gun.localToWorld(new THREE.Vector3(0.12, -0.05, -0.055));
  const dynamicElbowA = elbowA.clone().lerp(handTargetA, 0.12);
  const dynamicElbowB = elbowB.clone().lerp(handTargetB, 0.12);
  alignBetween(upperArmA, shoulderA, dynamicElbowA);
  alignBetween(lowerArmA, dynamicElbowA, handTargetA);
  alignBetween(upperArmB, shoulderB, dynamicElbowB);
  alignBetween(lowerArmB, dynamicElbowB, handTargetB);
  handA.position.copy(handTargetA);
  handB.position.copy(handTargetB);

  const start = gun.localToWorld(new THREE.Vector3(0.17, -0.35, 0));
  const end = new THREE.Vector3(2.35, 2.75, -0.65);
  const pos = hose.geometry.attributes.position.array;
  for (let i = 0; i < hoseSegments; i++) {
    const u = i / (hoseSegments - 1);
    const p = new THREE.Vector3().lerpVectors(start, end, u);
    p.y += Math.sin(u * Math.PI) * (0.35 + 0.12 * Math.sin(state.t * Math.PI * 3));
    p.z += Math.sin(u * Math.PI * 2) * 0.10;
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
  }
  hose.geometry.attributes.position.needsUpdate = true;
  hose.geometry.computeBoundingSphere();
}

function getPhase(t) {
  if (t < 0.07) return ['CAR RAISED', C.green];
  if (t < 0.17) return ['GUN APPROACH', C.amber];
  if (t < 0.28) return ['NUT LOOSENING', C.amber];
  if (t < 0.43) return ['OUTGOING WHEEL OFF', C.red];
  if (t < 0.60) return ['WHEEL TRANSFER', C.red];
  if (t < 0.73) return ['NEW WHEEL ON', C.amber];
  if (t < 0.84) return ['NUT TIGHTENING', C.amber];
  if (t < 0.94) return ['GUN CLEAR', C.green];
  return ['CAR RELEASE', C.green];
}

function updateSimulation(t) {
  state.t = THREE.MathUtils.clamp(t, 0, 1);
  const explode = state.exploded ? 1 : 0;
  applyExploded(oldWheel, explode);
  applyExploded(newWheel, explode);
  applyCutaway(oldWheel, state.cutaway);
  applyCutaway(newWheel, state.cutaway);

  const oldNut = oldWheel.userData.parts.nut;
  const oldNutCap = oldWheel.userData.parts.nutCap;
  const newNut = newWheel.userData.parts.nut;
  const newNutCap = newWheel.userData.parts.nutCap;

  // Base wheel states.
  oldWheel.position.set(0.69, 0.43, 0);
  oldWheel.rotation.set(0, 0, 0);
  newWheel.position.set(2.25, 0.43, 0.58);
  newWheel.rotation.set(0.18, 0, 0);

  // Gun approach and retreat.
  let gunU = 0;
  if (state.t < 0.14) gunU = smoothRange(state.t, 0.04, 0.14);
  else if (state.t < 0.28) gunU = 1;
  else if (state.t < 0.36) gunU = 1 - smoothRange(state.t, 0.28, 0.36);
  else if (state.t < 0.66) gunU = 0;
  else if (state.t < 0.72) gunU = smoothRange(state.t, 0.66, 0.72);
  else if (state.t < 0.84) gunU = 1;
  else gunU = 1 - smoothRange(state.t, 0.84, 0.94);
  gun.position.copy(gunPath(gunU));
  gun.rotation.z = THREE.MathUtils.lerp(0.03, 0, gunU);
  gun.rotation.y = THREE.MathUtils.lerp(-0.10, 0, gunU);

  // Loosen old retained nut.
  const loosen = smoothRange(state.t, 0.15, 0.27);
  const oldBaseNutX = oldNut.userData.basePosition.x + 0.28 * explode;
  const oldBaseCapX = oldNutCap.userData.basePosition.x + 0.28 * explode;
  oldNut.position.x = oldBaseNutX + loosen * 0.035;
  oldNutCap.position.x = oldBaseCapX + loosen * 0.035;

  // Outgoing wheel translates coaxially, then carrier moves it away.
  const off = smoothRange(state.t, 0.27, 0.43);
  const clear = smoothRange(state.t, 0.43, 0.59);
  oldWheel.position.x = THREE.MathUtils.lerp(0.69, 1.34, easeInOutCubic(off));
  oldWheel.position.z = THREE.MathUtils.lerp(0, -0.62, easeInOutCubic(clear));
  oldWheel.position.y = 0.43 + 0.10 * Math.sin(clear * Math.PI);
  oldWheel.rotation.z = -clear * 0.18;

  // Incoming wheel follows a curved path, then slides the final distance onto the hub.
  const incoming = smoothRange(state.t, 0.42, 0.68);
  newWheel.position.copy(newWheelPath(easeInOutCubic(incoming)));
  newWheel.rotation.x = THREE.MathUtils.lerp(0.18, 0, incoming);
  newWheel.rotation.z = THREE.MathUtils.lerp(0.15, 0, incoming);
  if (state.t >= 0.68) newWheel.position.set(0.69, 0.43, 0);

  // New retained nut begins backed off, then advances during tightening.
  const tighten = smoothRange(state.t, 0.72, 0.84);
  const newBaseNutX = newNut.userData.basePosition.x + 0.28 * explode;
  const newBaseCapX = newNutCap.userData.basePosition.x + 0.28 * explode;
  newNut.position.x = newBaseNutX + (1 - tighten) * 0.035;
  newNutCap.position.x = newBaseCapX + (1 - tighten) * 0.035;

  // Wheel visibility and hub access.
  oldWheel.visible = state.t < 0.94;
  newWheel.visible = state.t > 0.39;

  // Gun rotor direction and tool-body torque pulse.
  const looseningPulse = pingPongPulse(state.t, 0.15, 0.27);
  const tighteningPulse = pingPongPulse(state.t, 0.72, 0.84);
  const activeGun = looseningPulse + tighteningPulse;
  const direction = state.t < 0.5 ? -1 : 1;
  gun.userData.rotor.rotation.x = direction * state.t * 220;
  gun.rotation.x = Math.sin(state.t * 430) * 0.005 * activeGun;
  gun.position.y += Math.sin(state.t * 500) * 0.003 * activeGun;
  gun.userData.led.material.color.setHex(activeGun > 0.05 ? C.amber : C.green);
  gun.userData.screen.material.color.setHex(activeGun > 0.05 ? 0xff9f28 : 0x18d889);

  // Axle/disc rotation settles as the car arrives and releases.
  const spin = (1 - smoothRange(state.t, 0.0, 0.06)) + smoothRange(state.t, 0.95, 1.0);
  hubAssembly.userData.disc.rotation.x = state.t * 8 * spin;
  oldWheel.rotation.x += state.t * 4 * spin;
  newWheel.rotation.x += state.t * 4 * spin;

  // Jack preserves clearance until tightening is confirmed.
  const jackDrop = smoothRange(state.t, 0.93, 1.0);
  jack.position.y = -jackDrop * 0.18;
  car.position.y = -jackDrop * 0.075;
  hubAssembly.position.y = -jackDrop * 0.075;
  oldWheel.position.y -= jackDrop * 0.075;
  newWheel.position.y -= jackDrop * 0.075;

  gunPathLine.visible = state.trails;
  wheelPathLine.visible = state.trails;

  const [phase, color] = getPhase(state.t);
  const phaseEl = document.querySelector('#phase');
  phaseEl.textContent = phase;
  phaseEl.style.color = `#${color.toString(16).padStart(6, '0')}`;
  document.querySelector('#clock').textContent = `${(state.t * TOTAL_SECONDS).toFixed(3)} s`;
  document.querySelector('#timeline').value = state.t;
  document.querySelector('#timelineOut').textContent = `${Math.round(state.t * 100)}%`;
  document.querySelector('#playBtn').textContent = state.playing ? 'PAUSE' : (state.t >= 1 ? 'REPLAY' : 'PLAY');

  updateCrewAndHose();
}

function updateLabels() {
  const w = window.innerWidth, h = window.innerHeight;
  labelLayer.style.display = state.labels ? '' : 'none';
  for (const def of labelDefs) {
    const p = new THREE.Vector3();
    def.object.getWorldPosition(p);
    p.project(camera);
    const visible = p.z > -1 && p.z < 1;
    def.el.style.opacity = visible ? '1' : '0';
    def.el.style.left = `${(p.x * 0.5 + 0.5) * w}px`;
    def.el.style.top = `${(-p.y * 0.5 + 0.5) * h}px`;
  }
}

function updateCameraTween(now) {
  const tw = state.cameraTween;
  if (!tw) return;
  const u = THREE.MathUtils.clamp((now - tw.start) / tw.duration, 0, 1);
  const e = easeInOutCubic(u);
  camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
  controls.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
  if (u >= 1) state.cameraTween = null;
}

function updateSelection() {
  if (state.selected && state.selected.visible !== false) {
    selectionBox.visible = true;
    selectionBox.box.setFromObject(state.selected);
  } else {
    selectionBox.visible = false;
  }
}

let frames = 0;
let fpsAccum = 0;
let fpsTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (state.playing) {
    state.t += dt * state.speed / TOTAL_SECONDS;
    if (state.t >= 1) {
      state.t = 1;
      state.playing = false;
    }
  }
  updateSimulation(state.t);
  updateCameraTween(now);
  if (state.follow) {
    const focus = state.t < 0.42 ? gun : (state.t < 0.73 ? newWheel : gun);
    const wp = new THREE.Vector3();
    focus.getWorldPosition(wp);
    controls.target.lerp(wp, 0.035);
  }
  controls.update();
  updateLabels();
  updateSelection();
  renderer.render(scene, camera);
  window.__SIM_READY__ = true;

  frames++;
  fpsAccum += dt;
  if (now - fpsTime > 650) {
    document.querySelector('#renderStats').textContent = `${Math.round(frames / fpsAccum)} fps`;
    frames = 0; fpsAccum = 0; fpsTime = now;
  }
}

// UI events.
document.querySelector('#playBtn').addEventListener('click', () => {
  if (state.t >= 1) state.t = 0;
  state.playing = !state.playing;
});
document.querySelector('#resetBtn').addEventListener('click', () => { state.playing = false; state.t = 0; });
document.querySelector('#stepBackBtn').addEventListener('click', () => { state.playing = false; state.t = Math.max(0, state.t - 0.05); });
document.querySelector('#stepFwdBtn').addEventListener('click', () => { state.playing = false; state.t = Math.min(1, state.t + 0.05); });
document.querySelector('#timeline').addEventListener('input', (e) => { state.playing = false; state.t = Number(e.target.value); });
document.querySelector('#speed').addEventListener('input', (e) => {
  state.speed = Number(e.target.value);
  document.querySelector('#speedOut').textContent = `${state.speed.toFixed(2)}×`;
});
document.querySelector('#cutaway').addEventListener('change', (e) => state.cutaway = e.target.checked);
document.querySelector('#exploded').addEventListener('change', (e) => state.exploded = e.target.checked);
document.querySelector('#trails').addEventListener('change', (e) => state.trails = e.target.checked);
document.querySelector('#follow').addEventListener('change', (e) => state.follow = e.target.checked);
document.querySelector('#labels').addEventListener('change', (e) => state.labels = e.target.checked);
document.querySelector('#fov').addEventListener('input', (e) => {
  camera.fov = Number(e.target.value);
  camera.updateProjectionMatrix();
  document.querySelector('#fovOut').textContent = `${camera.fov}°`;
});
document.querySelectorAll('[data-camera]').forEach((btn) => btn.addEventListener('click', () => setCameraPreset(btn.dataset.camera)));
document.querySelector('#focusSelect').addEventListener('change', (e) => {
  const entry = focusMap[e.target.value];
  selectObject(entry.object, true);
  document.querySelector('#partName').textContent = entry.title;
  document.querySelector('#partDesc').textContent = entry.description;
});

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([rig, crew, hose], true);
  const hit = hits.find((h) => h.object.visible && h.object.userData.selectRoot);
  if (hit) selectObject(hit.object.userData.selectRoot, false);
});

window.addEventListener('keydown', (e) => {
  if (e.target.matches('input,select,button')) return;
  if (e.code === 'Space') { e.preventDefault(); if (state.t >= 1) state.t = 0; state.playing = !state.playing; }
  if (e.key.toLowerCase() === 'r') { state.playing = false; state.t = 0; }
  if (e.key.toLowerCase() === 'f') frameObject(state.selected || rig);
  if (e.key.toLowerCase() === 'c') { state.cutaway = !state.cutaway; document.querySelector('#cutaway').checked = state.cutaway; }
  if (e.key.toLowerCase() === 'e') { state.exploded = !state.exploded; document.querySelector('#exploded').checked = state.exploded; }
  const presets = ['hero', 'gun', 'hub', 'brake', 'top', 'wide'];
  const idx = Number(e.key) - 1;
  if (idx >= 0 && idx < presets.length) setCameraPreset(presets[idx]);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Screenshot and demo query parameters.
const params = new URLSearchParams(location.search);
if (params.get('ui') === '0') document.body.classList.add('hide-ui');
if (params.has('shot')) state.t = THREE.MathUtils.clamp(Number(params.get('shot')), 0, 1);
if (params.has('camera')) setCameraPreset(params.get('camera'), true);
else setCameraPreset('hero', true);
if (params.get('cutaway') === '1') { state.cutaway = true; document.querySelector('#cutaway').checked = true; }
if (params.get('explode') === '1') { state.exploded = true; document.querySelector('#exploded').checked = true; }
if (params.get('play') === '1') state.playing = true;

state.selected = null;
selectionBox.visible = false;
updateSimulation(state.t);
requestAnimationFrame(animate);
