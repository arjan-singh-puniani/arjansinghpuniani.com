import { deviceSpec as spec, componentIds, tecLayout } from "./device-spec.js";
import { mergeGeometries } from "../pit-stop-lab/vendor/BufferGeometryUtils.js";

// All dimensions are explanatory millimetres, not a qualified implant construction.
export function createDevice(T, mats, fit) {
  if (typeof fit?.surfaceAt !== "function") throw new TypeError("Device geometry requires a registered reference surface.");
  const root = new T.Group(); root.name = "SeizeFreeze assumed millimetre architecture";
  const groups = Object.fromEntries(componentIds.map(id => { const g = new T.Group(); g.name = id; g.userData.component = id; root.add(g); return [id, g]; }));
  const pickable = [], ownedMaterials = new Set(), textures = new Set(), mergeExcluded = new Set(), sectionPairs = [], sectionRemoved = [], sensorRoutes = [];
  const surfaceClearance = .20;
  const cloneMaterial = (source, properties) => { const mat = source.clone(); Object.assign(mat, properties); ownedMaterials.add(mat); return mat; };
  const platinum = cloneMaterial(mats.darkmetal, { color: new T.Color(0xb8c5c7), metalness: .78, roughness: .38 });
  const nMaterial = cloneMaterial(mats.darkmetal, { color: new T.Color(0x627f8e), metalness: .2, roughness: .55 });
  const pMaterial = cloneMaterial(mats.darkmetal, { color: new T.Color(0x76818c), metalness: .2, roughness: .55 });
  const envelopeMaterial = cloneMaterial(mats.contact, { color: new T.Color(0xadc2c5), opacity: .18, transparent: true, depthWrite: false, side: T.DoubleSide });
  const insulationMaterial = cloneMaterial(mats.insulation, { color: new T.Color(0x334651), roughness: .8 });
  function add(group, geometry, material, name) {
    const mesh = new T.Mesh(geometry, material); mesh.name = name; mesh.userData.component = group.userData.component;
    mesh.castShadow = material !== envelopeMaterial; mesh.receiveShadow = true; group.add(mesh); pickable.push(mesh); return mesh;
  }
  function box(group, x0, x1, y0, y1, z0, z1, material, name) {
    const geometry = new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); geometry.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return add(group, geometry, material, name);
  }
  function rectangle(width, depth, radius) {
    const s = new T.Shape(), x = -width / 2, z = -depth / 2, r = Math.min(radius, width / 2, depth / 2);
    s.moveTo(x + r, z); s.lineTo(x + width - r, z); s.quadraticCurveTo(x + width, z, x + width, z + r);
    s.lineTo(x + width, z + depth - r); s.quadraticCurveTo(x + width, z + depth, x + width - r, z + depth);
    s.lineTo(x + r, z + depth); s.quadraticCurveTo(x, z + depth, x, z + depth - r);
    s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z); return s;
  }
  function extrude(shape, bottom, top, bevel = 0) {
    const b = Math.min(bevel, (top - bottom) / 4);
    const geometry = new T.ExtrudeGeometry(shape, { depth: top - bottom - 2 * b, bevelEnabled: b > 0, bevelSize: b, bevelThickness: b, bevelSegments: 2, steps: 1, curveSegments: 8 });
    geometry.rotateX(Math.PI / 2); geometry.translate(0, top - b, 0); return geometry;
  }
  function plate(group, width, depth, bottom, top, material, name, radius = .35) {
    const bevel = Math.min(.025, (top - bottom) * .15), shape = rectangle(width - 2 * bevel, depth - 2 * bevel, Math.max(.01, radius - bevel));
    return add(group, extrude(shape, bottom, top, bevel), material, name);
  }
  function sectionedPlate(group, width, depth, bottom, top, material, name, radius = .35) {
    const full = plate(group, width, depth, bottom, top, material, name, radius), half = new T.Shape(), x = width / 2, z = depth / 2;
    half.moveTo(-x, 0); half.lineTo(x, 0); half.lineTo(x, z - radius); half.quadraticCurveTo(x, z, x - radius, z);
    half.lineTo(-x + radius, z); half.quadraticCurveTo(-x, z, -x, z - radius); half.closePath();
    const section = add(group, extrude(half, bottom, top), material, `${name} · authored back-half section with solid cut face`); section.visible = false;
    sectionPairs.push({ full, section }); mergeExcluded.add(full); mergeExcluded.add(section); return full;
  }
  function annulus(group, width, opening, bottom, top, material, name, radius = .8) {
    const shape = rectangle(width, width, radius), hole = new T.Path(rectangle(opening, opening, Math.max(.05, radius - (width - opening) / 2)).getPoints());
    shape.holes.push(hole); return add(group, extrude(shape, bottom, top), material, name);
  }
  function surface(x, z, clearance = surfaceClearance) {
    const y = fit.surfaceAt(x, z);
    if (!Number.isFinite(y)) throw new Error(`Reference surface is absent at device-local ${x}, ${z} mm.`);
    return y + clearance;
  }
  function polylineTube(points, radius, segments = 7) {
    const path = new T.CurvePath();
    for (let i = 1; i < points.length; i++) path.add(new T.LineCurve3(new T.Vector3(...points[i - 1]), new T.Vector3(...points[i])));
    const geometry = new T.TubeGeometry(path, Math.max(12, points.length * 3), radius, segments, false);
    return geometry;
  }
  function wire(group, points, material, name, radius = .035) { return add(group, polylineTube(points, radius), material, name); }
  function insulatedWire(group, points, color, name, radius = .035) {
    wire(group, points, mats.gold, `${name} · conductor`, radius);
    if (points.length > 3) wire(group, points.slice(1, -1), color, `${name} · insulating jacket`, radius + .035);
  }
  function sampledPath(a, b, clearance = .12, spacing = .2) {
    const count = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / spacing)), points = [];
    for (let i = 0; i <= count; i++) { const x = a[0] + (b[0] - a[0]) * i / count, z = a[1] + (b[1] - a[1]) * i / count; points.push([x, surface(x, z, clearance), z]); }
    return points;
  }
  function surfaceRoute(waypoints, clearance = .12) {
    const points = [];
    for (let i = 1; i < waypoints.length; i++) points.push(...sampledPath(waypoints[i - 1], waypoints[i], clearance).slice(i === 1 ? 0 : 1));
    return points;
  }

  // A transparent contact envelope discloses curvature; it is not a selected pad material.
  const contactGrid = 24, contactPositions = [], contactIndices = [], contactBottom = [];
  let minimumThickness = Infinity, maximumThickness = -Infinity;
  for (let row = 0; row <= contactGrid; row++) for (let col = 0; col <= contactGrid; col++) {
    const x = col / contactGrid * spec.contact.width - spec.contact.width / 2, z = row / contactGrid * spec.contact.depth - spec.contact.depth / 2, y = surface(x, z);
    if (y >= 0) throw new Error("The fitted reference surface crosses the rigid cold-plate datum.");
    contactBottom.push(y); minimumThickness = Math.min(minimumThickness, -y); maximumThickness = Math.max(maximumThickness, -y);
    contactPositions.push(x, y, z, x, 0, z);
  }
  const stride = contactGrid + 1;
  for (let row = 0; row < contactGrid; row++) for (let col = 0; col < contactGrid; col++) {
    const a = (row * stride + col) * 2, b = a + 2, c = a + stride * 2, d = c + 2;
    contactIndices.push(a, c, b, b, c, d, a + 1, b + 1, c + 1, b + 1, d + 1, c + 1);
  }
  const boundary = [];
  for (let col = 0; col <= contactGrid; col++) boundary.push(col * 2);
  for (let row = 1; row <= contactGrid; row++) boundary.push((row * stride + contactGrid) * 2);
  for (let col = contactGrid - 1; col >= 0; col--) boundary.push((contactGrid * stride + col) * 2);
  for (let row = contactGrid - 1; row > 0; row--) boundary.push(row * stride * 2);
  for (let i = 0; i < boundary.length; i++) { const a = boundary[i], b = boundary[(i + 1) % boundary.length]; contactIndices.push(a, b, a + 1, a + 1, b, b + 1); }
  for (let i = 0; i < contactIndices.length; i += 3) [contactIndices[i + 1], contactIndices[i + 2]] = [contactIndices[i + 2], contactIndices[i + 1]];
  const contactGeometry = new T.BufferGeometry(); contactGeometry.setAttribute("position", new T.Float32BufferAttribute(contactPositions, 3)); contactGeometry.setIndex(contactIndices); contactGeometry.computeVertexNormals();
  add(groups.interface, contactGeometry, envelopeMaterial, "Unresolved contact envelope; sampled underside, flat top; not validated compliant material");

  plate(groups.coldplate, spec.coldplate.width, spec.coldplate.depth, spec.coldplate.bottom, spec.coldplate.top, mats.cold, "Assumed cold spreader");
  annulus(groups.coldplate, 11.3, 10.4, 0, .24, insulationMaterial, "Side insulation only; outside axial heat path", .45);
  const t = spec.tec, layout = tecLayout();
  const coldCeramic = plate(groups.tec, t.width, t.depth, t.bottom, t.lowerCopperBottom, mats.ceramic, "Cold ceramic face", .25);
  const hotCeramic = sectionedPlate(groups.tec, t.width, t.depth, t.upperCopperTop, t.top, mats.ceramic, "Hot ceramic face", .25);
  for (const leg of layout.legs) box(groups.tec, leg.x - t.legWidth / 2, leg.x + t.legWidth / 2, t.legBottom, t.legTop, leg.z - t.legWidth / 2, leg.z + t.legWidth / 2, leg.type === "N" ? nMaterial : pMaterial, `${leg.type} leg ${leg.index} · illustrative semiconductor`);
  for (const bridge of layout.bridges) {
    const y0 = bridge.face === "hot" ? t.legTop : t.lowerCopperBottom, y1 = bridge.face === "hot" ? t.upperCopperTop : t.legBottom;
    box(groups.tec, Math.min(bridge.a[0], bridge.b[0]) - t.legWidth / 2, Math.max(bridge.a[0], bridge.b[0]) + t.legWidth / 2, y0, y1, Math.min(bridge.a[1], bridge.b[1]) - t.legWidth / 2, Math.max(bridge.a[1], bridge.b[1]) + t.legWidth / 2, mats.gold, `${bridge.face} interconnect ${bridge.from} → ${bridge.to}`);
  }
  const terminalX = -4.65, hotCopperMid = (t.legTop + t.upperCopperTop) / 2;
  for (const terminal of layout.terminals) box(groups.tec, terminalX, terminal.leg.x + t.legWidth / 2, t.legTop, t.upperCopperTop, terminal.leg.z - t.legWidth / 2, terminal.leg.z + t.legWidth / 2, mats.gold, `${terminal.name} hot-face terminal extension`);
  sectionedPlate(groups.heatpath, spec.heatpath.width, spec.heatpath.depth, spec.heatpath.bottom, spec.heatpath.top, mats.hot, "Assumed hot spreader");
  for (const z of [-3, 3]) { const strap = box(groups.heatpath, 5.15, 5.65, 1.31, 1.55, z - .4, z + .4, mats.hot, "Hot-spreader strap reaches candidate shell; model boundary remains unresolved"); if (z < 0) sectionRemoved.push(strap); }

  const e = spec.electronics;
  sectionedPlate(groups.electronics, e.width, e.depth, e.boardBottom, e.boardTop, mats.board, "Controller board envelope", .25);
  sectionRemoved.push(box(groups.electronics, -3.65, -2.35, e.boardTop, e.componentTop, -.9, .9, mats.chip, "Schematic thermoelectric driver envelope"));
  sectionRemoved.push(box(groups.electronics, -.8, 1.1, e.boardTop, e.componentTop, -1.4, .3, mats.chip, "Schematic controller envelope"));
  sectionRemoved.push(box(groups.electronics, 2.2, 3.6, e.boardTop, e.componentTop, -1.2, .5, mats.chip, "Schematic sensing frontend envelope"));
  for (const x of [-4.85, 4.85]) for (const z of [-4.85, 4.85]) {
    const geometry = new T.CylinderGeometry(.16, .16, e.boardBottom - spec.heatpath.top, 12); geometry.translate(x, (e.boardBottom + spec.heatpath.top) / 2, z);
    const support = add(groups.electronics, geometry, mats.ceramic, "Illustrative board support; not selected hardware"); if (z < 0) sectionRemoved.push(support);
  }
  for (const terminal of layout.terminals) {
    const z = terminal.leg.z;
    box(groups.electronics, -4.9, -4.4, 2.04, 2.09, z - .25, z + .25, mats.gold, `${terminal.name} driver pad`);
    insulatedWire(groups.electronics, [[terminalX, hotCopperMid, z], [-5.35, hotCopperMid, z], [-5.35, 2.18, z], [-4.65, 2.18, z], [-4.65, 2.08, z]], mats.blue, `${terminal.name} TEC lead around spreader`);
    wire(groups.electronics, [[-4.65, 2.065, z], [-3.85, 2.065, z], [-3.85, 2.065, Math.sign(z) * .55], [-3.65, 2.065, Math.sign(z) * .55]], mats.gold, `${terminal.name} schematic board trace`, .025);
  }
  for (let i = 0; i < 6; i++) sectionRemoved.push(box(groups.electronics, -.2 + i * .52, .05 + i * .52, 2.04, 2.18, 2.1, 2.4, mats.ceramic, "Schematic passive envelope"));

  const body = spec.body, inner = body.width / 2 - body.wall, corner = .8, cornerCentre = body.width / 2 - corner;
  annulus(groups.package, body.width, 10.4, body.bottom, 0, mats.titanium, "Candidate base rim; thermal aperture remains open", corner);
  const frontWall = box(groups.package, -cornerCentre, cornerCentre, body.bottom, body.wallTop, -6, -inner, mats.titanium, "Front case wall · removable in section");
  box(groups.package, -cornerCentre, cornerCentre, body.bottom, body.wallTop, inner, 6, mats.titanium, "Back case wall");
  box(groups.package, -6, -inner, body.bottom, body.wallTop, -cornerCentre, cornerCentre, mats.titanium, "Left case wall");
  box(groups.package, inner, 6, body.bottom, 2, -cornerCentre, cornerCentre, mats.titanium, "Right wall below feedthrough");
  box(groups.package, inner, 6, 2.5, body.wallTop, -cornerCentre, cornerCentre, mats.titanium, "Right wall above feedthrough");
  for (const [z0, z1] of [[-cornerCentre, -1.2], [1.2, cornerCentre]]) box(groups.package, inner, 6, 2, 2.5, z0, z1, mats.titanium, "Right wall beside feedthrough");
  for (const [cx, cz, angle] of [[cornerCentre, cornerCentre, 0], [-cornerCentre, cornerCentre, Math.PI / 2], [-cornerCentre, -cornerCentre, Math.PI], [cornerCentre, -cornerCentre, Math.PI * 1.5]]) {
    const shape = new T.Shape(), steps = 16;
    for (let i = 0; i <= steps; i++) { const a = angle + i / steps * Math.PI / 2, x = cx + Math.cos(a) * corner, z = cz + Math.sin(a) * corner; if (!i) shape.moveTo(x, z); else shape.lineTo(x, z); }
    for (let i = steps; i >= 0; i--) { const a = angle + i / steps * Math.PI / 2; shape.lineTo(cx + Math.cos(a) * (corner - body.wall), cz + Math.sin(a) * (corner - body.wall)); }
    shape.closePath(); add(groups.package, extrude(shape, body.bottom, body.wallTop), mats.titanium, "Continuous rounded case corner");
  }
  const feedthroughShape = rectangle(2.4, .5, .04), pinZ = [-1, -.6, -.2, .2, .6, 1];
  for (const z of pinZ) { const hole = new T.Path(); hole.absarc(-z, 0, .11, 0, Math.PI * 2, true); feedthroughShape.holes.push(hole); }
  const feedthroughGeometry = new T.ExtrudeGeometry(feedthroughShape, { depth: body.wall, bevelEnabled: false, curveSegments: 16 });
  feedthroughGeometry.rotateY(Math.PI / 2); feedthroughGeometry.translate(inner, 2.25, 0);
  add(groups.package, feedthroughGeometry, mats.ceramic, "Candidate six-pin ceramic feedthrough; hermeticity not established");
  const channels = ["power +", "power −", "ECoG A", "ECoG B", "RTD +", "RTD −"];
  for (const [i, z] of pinZ.entries()) {
    const geometry = new T.CylinderGeometry(.11, .11, body.wall, 32); geometry.rotateZ(Math.PI / 2); geometry.translate((inner + 6) / 2, 2.25, z);
    add(groups.package, geometry, i < 2 ? mats.gold : platinum, `${channels[i]} · flush candidate feedthrough pin`);
    wire(groups.electronics, [[inner, 2.25, z], [5.4, 2.25, z], [5.05, 2.14, z], [4.8, 2.075, z]], i < 2 ? mats.gold : mats.violet, `${channels[i]} internal pin-to-board path`, .025);
    box(groups.electronics, 4.55, 5.05, 2.04, 2.09, z - .12, z + .12, mats.gold, `${channels[i]} board-edge pad`);
    wire(groups.electronics, [[4.8, 2.065, z], [4.2, 2.065, z], [3.6, 2.065, z]], i < 2 ? mats.gold : mats.violet, `${channels[i]} schematic PCB input trace`, .02);
  }
  const closedLid = plate(groups.package, body.width, body.depth, body.wallTop, body.lidTop, mats.titanium, "Full candidate lid; closure is unqualified", corner);
  const sectionShape = new T.Shape();
  sectionShape.moveTo(-6, 0); sectionShape.lineTo(6, 0); sectionShape.lineTo(6, 5.2); sectionShape.quadraticCurveTo(6, 6, 5.2, 6); sectionShape.lineTo(-5.2, 6); sectionShape.quadraticCurveTo(-6, 6, -6, 5.2); sectionShape.closePath();
  const sectionLid = add(groups.package, extrude(sectionShape, body.wallTop, body.lidTop), mats.titanium, "Back half lid with solid authored section face"); sectionLid.visible = false;
  let identification;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 128; const context = canvas.getContext("2d");
    context.font = "500 46px Arial,sans-serif"; context.fillStyle = "#304957"; context.fillText("SEIZEFREEZE", 26, 59); context.font = "20px monospace"; context.fillText("PROPOSED / CONCEPT", 28, 100);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; textures.add(texture);
    const material = new T.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: .1, depthWrite: false, metalness: .4, roughness: .5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); ownedMaterials.add(material);
    identification = add(groups.package, new T.PlaneGeometry(7, 1.75), material, "Surface identification graphic; no raised foil part"); identification.rotation.x = -Math.PI / 2; identification.position.y = body.lidTop; identification.castShadow = false;
  }

  function surfaceDisk(x, z, radius, name) {
    const positions = [], indices = [], rings = 5, segments = 32;
    for (let ring = 0; ring <= rings; ring++) for (let i = 0; i < segments; i++) { const a = i / segments * Math.PI * 2, px = x + Math.cos(a) * radius * ring / rings, pz = z + Math.sin(a) * radius * ring / rings; positions.push(px, surface(px, pz), pz, px, surface(px, pz) + .045, pz); }
    for (let ring = 0; ring < rings; ring++) for (let i = 0; i < segments; i++) { const a = (ring * segments + i) * 2, b = (ring * segments + (i + 1) % segments) * 2, c = a + segments * 2, d = b + segments * 2; indices.push(a, c, b, b, c, d, a + 1, b + 1, c + 1, b + 1, d + 1, c + 1); }
    for (let i = 0; i < segments; i++) { const a = (rings * segments + i) * 2, b = (rings * segments + (i + 1) % segments) * 2; indices.push(a, a + 1, b, a + 1, b + 1, b); }
    const geometry = new T.BufferGeometry(); geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    return add(groups.sensing, geometry, platinum, name);
  }
  const padCentres = [[-6.7, -2.7], [6.7, 2.7]], sampledPads = [];
  padCentres.forEach(([x, z], i) => {
    surfaceDisk(x, z, .4, `ECoG ${i ? "B" : "A"} · Pt-like candidate pad follows reference surface`);
    sampledPads.push([x, surface(x, z) + .045, z]);
    const pin = pinZ[i + 2], lane = 6.5 + .3 * i, clearance = .30 + .20 * i;
    const route = i === 0 ? [[x, z], [-6.7, 6.7], [lane, 6.7], [lane, pin]] : [[x, z], [lane, z], [lane, pin]];
    const points = surfaceRoute(route, clearance); points.unshift([x, surface(x, z) + .045, z]);
    points.push([lane, 2.25, pin], [6, 2.25, pin]);
    insulatedWire(groups.sensing, points, mats.violet, `ECoG ${i ? "B" : "A"} insulated surface-to-feedthrough lead`, .025);
    sensorRoutes.push({ name: `ECoG ${i ? "B" : "A"}`, points, conductorRadius: .025, outerRadius: .06, laneX: lane, surfaceClearance: clearance });
  });
  const rtdPoints = [];
  for (let row = 0; row < 7; row++) { const z = -2.5 + row * .35, x0 = row % 2 ? 4.9 : 4.35, x1 = row % 2 ? 4.35 : 4.9; rtdPoints.push(...sampledPath([x0, z], [x1, z], .22, .08).slice(row ? 1 : 0)); }
  wire(groups.sensing, rtdPoints, platinum, "Illustrative two-wire RTD meander at contact-envelope edge", .018);
  for (const [i, endpoint] of [rtdPoints[0], rtdPoints.at(-1)].entries()) {
    const channel = i + 2, pin = pinZ[i + 4], lane = 6.5 + .3 * channel, clearance = .30 + .20 * channel;
    const points = surfaceRoute([[endpoint[0], endpoint[2]], [5.05, endpoint[2]], [lane, endpoint[2]], [lane, pin]], clearance);
    points.unshift(endpoint); points.push([lane, 2.25, pin], [6, 2.25, pin]);
    insulatedWire(groups.sensing, points, mats.violet, `RTD ${i ? "−" : "+"} insulated return`, .025);
    sensorRoutes.push({ name: `RTD ${i ? "−" : "+"}`, points, conductorRadius: .025, outerRadius: .06, laneX: lane, surfaceClearance: clearance });
  }

  const circuitGuide = new T.Group(); circuitGuide.name = "Exact TEC series route · explanatory overlay"; circuitGuide.visible = false; groups.tec.add(circuitGuide);
  const route = [[terminalX, hotCopperMid, layout.legs[0].z]];
  layout.legs.forEach((leg, i) => { const first = i % 2 ? (t.lowerCopperBottom + t.legBottom) / 2 : hotCopperMid, second = i % 2 ? hotCopperMid : (t.lowerCopperBottom + t.legBottom) / 2; route.push([leg.x, first, leg.z], [leg.x, second, leg.z]); });
  route.push([terminalX, hotCopperMid, layout.legs.at(-1).z]);
  const circuitMaterial = new T.LineBasicMaterial({ color: 0x8dbaff, depthTest: false }); ownedMaterials.add(circuitMaterial);
  const line = new T.Line(new T.BufferGeometry().setFromPoints(route.map(p => new T.Vector3(...p))), circuitMaterial); line.renderOrder = 20; circuitGuide.add(line);
  const arrowMaterial = new T.MeshBasicMaterial({ color: 0x8dbaff, depthTest: false }); ownedMaterials.add(arrowMaterial);
  for (let i = 0; i < layout.legs.length; i += 3) { const leg = layout.legs[i], cone = new T.Mesh(new T.ConeGeometry(.065, .16, 8), arrowMaterial); cone.position.set(leg.x, (t.legBottom + t.legTop) / 2, leg.z); if (!(i % 2)) cone.rotation.x = Math.PI; cone.renderOrder = 21; circuitGuide.add(cone); }

  const info = {
    units: "mm", status: spec.status, rootScale: [1, 1, 1], couples: layout.couples, legs: layout.legs.length, bridges: layout.bridges.length,
    enclosure: { width: body.width, depth: body.depth, bottom: body.bottom, wallTop: body.wallTop, lidTop: body.lidTop, wall: body.wall, closure: "Illustrative continuous seam; no selected fastening or hermetic joining process", feedthroughPins: 6 },
    contactEnvelope: { gridCells: [contactGrid, contactGrid], clearanceMm: surfaceClearance, thicknessRangeMm: [minimumThickness, maximumThickness], status: "Hypothetical envelope, not a selected or validated compliant tissue interface" },
    sampledPads, referenceSurfaceOffsetMm: surfaceClearance, rtdSurfaceOffsetMm: .22, sensorRoutes, layerBounds: { coldplate: [0, .25], tec: [.25, 1.29], heatpath: [1.29, 1.57], electronics: [1.82, 2.34] },
    route: "36 alternating N/P legs, 35 alternating cold/hot copper bridges and two hot-face terminals. Geometry does not calibrate model coefficients.",
    section: "Authored front-half sections through lid, PCB, hot spreader and hot ceramic, plus removed front wall. Schematic IC/passive envelopes and front board supports are removed for inspection. Retained solids have actual cut faces; no opacity x-ray. Circuit guide is a labelled through-solid explanatory path, not visible measured current.",
  };
  root.userData.device = info;
  sectionRemoved.forEach(mesh => mergeExcluded.add(mesh));
  // Merge same-material device solids to keep the fine sensor routes inexpensive to draw.
  for (const id of ["tec", "electronics", "sensing"]) {
    const byMaterial = new Map();
    for (const mesh of [...groups[id].children]) if (mesh.isMesh && mesh !== coldCeramic && mesh !== hotCeramic && !mergeExcluded.has(mesh)) { if (!byMaterial.has(mesh.material)) byMaterial.set(mesh.material, []); byMaterial.get(mesh.material).push(mesh); }
    for (const [material, meshes] of byMaterial) if (meshes.length > 1) {
      const geometries = meshes.map(m => { m.updateMatrix(); const g = m.geometry.clone().applyMatrix4(m.matrix); if (!material.map && !material.roughnessMap && !material.bumpMap) g.deleteAttribute("uv"); return g; }), merged = mergeGeometries(geometries, false); geometries.forEach(g => g.dispose());
      if (!merged) continue;
      meshes.forEach(m => { groups[id].remove(m); const i = pickable.indexOf(m); if (i >= 0) pickable.splice(i, 1); m.geometry.dispose(); });
      add(groups[id], merged, material, `${id} · assumed same-material construction`);
    }
  }
  function cutaway(enabled) { frontWall.visible = !enabled; closedLid.visible = !enabled; sectionLid.visible = Boolean(enabled); if (identification) identification.visible = !enabled; sectionPairs.forEach(pair => { pair.full.visible = !enabled; pair.section.visible = Boolean(enabled); }); sectionRemoved.forEach(mesh => mesh.visible = !enabled); info.cutaway = Boolean(enabled); }
  function circuit(enabled) { circuitGuide.visible = Boolean(enabled); info.circuit = Boolean(enabled); }
  cutaway(false); circuit(false);
  return { root, groups, pickable, cutaway, circuit, circuitGuide, info, anchors: {
    sensing: { point: sampledPads[1], label: "SURFACE ECoG / RTD · ASSUMED", color: "#c4ace4", side: 1 },
    ecogA: sampledPads[0], ecogB: sampledPads[1], rtd: [4.6, surface(4.6, -1.45, .22), -1.45],
  }, dispose() {
    const geometries = new Set(); root.traverse(o => { if (o.geometry) geometries.add(o.geometry); }); geometries.forEach(g => g.dispose()); ownedMaterials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); root.removeFromParent();
  } };
}
