import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as T from '../../public/pit-stop-lab/vendor/three.module.js';
import { deviceSpec as s, tecLayout } from '../../public/seizefreeze-lab/device-spec.js';
import { fitDevice, clipFootprint } from '../../public/seizefreeze-lab/device-fit.js';
import { createDevice } from '../../public/seizefreeze-lab/device.js';

const { BufferGeometry, BufferAttribute, Vector3 } = T;

const near = (a, b, message, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${message}: ${a} != ${b}`);
function segmentDistance(a, b, c, d) {
  const u = b.map((x, i) => x - a[i]), v = d.map((x, i) => x - c[i]), w = a.map((x, i) => x - c[i]);
  const dot = (x, y) => x.reduce((sum, value, i) => sum + value * y[i], 0);
  const A = dot(u, u), B = dot(v, v), C = dot(u, v), D = dot(u, w), E = dot(v, w);
  const clamp = x => Math.max(0, Math.min(1, x));
  const squared = (s, t) => w.reduce((sum, value, i) => sum + (value + s * u[i] - t * v[i]) ** 2, 0);
  let minimum = Math.min(squared(0, B ? clamp(E / B) : 0), squared(1, B ? clamp((E + C) / B) : 0),
    squared(A ? clamp(-D / A) : 0, 0), squared(A ? clamp((C - D) / A) : 0, 1));
  const denominator = A * B - C * C;
  if (denominator > 1e-14 * Math.max(1, A * B)) {
    const s = (C * E - B * D) / denominator, t = (A * E - C * D) / denominator;
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) minimum = Math.min(minimum, squared(s, t));
  }
  return Math.sqrt(Math.max(0, minimum));
}
near(segmentDistance([0, 0, 0], [1, 0, 0], [0, 2, 0], [1, 2, 0]), 2, 'Parallel segment distance');
near(segmentDistance([-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0]), 0, 'Crossing segment distance');
near(segmentDistance([-1, 0, 0], [1, 0, 0], [0, -1, 2], [0, 1, 2]), 2, 'Skew segment distance');
near(segmentDistance([0, 0, 0], [0, 0, 0], [1, 0, 0], [2, 0, 0]), 1, 'Degenerate segment distance');
near(segmentDistance([0, 0, 0], [1, 0, 0], [2, 1, 0], [3, 1, 0]), Math.sqrt(2), 'Endpoint segment minimum');
const layout = tecLayout(), graph = new Map();
assert.equal(layout.legs.length, 36); assert.equal(layout.couples, 18);
assert.equal(layout.bridges.length, 35);
assert.equal(new Set(layout.legs.map(l => `${l.x},${l.z}`)).size, 36);
for (const edge of layout.edges) {
  for (const [a, b] of [[edge.from, edge.to], [edge.to, edge.from]]) {
    if (!graph.has(a)) graph.set(a, []);
    graph.get(a).push({ node: b, edge });
  }
}
for (const [node, neighbors] of graph) assert.equal(neighbors.length, ['plus', 'minus'].includes(node) ? 1 : 2, `Incorrect electrical degree at ${node}`);
let previous, current = 'plus';
const visited = new Set(), path = [], traversedLegs = [];
while (true) {
  assert.ok(!visited.has(current), 'Thermoelectric series path must not contain a loop.');
  visited.add(current); path.push(current);
  if (current === 'minus') break;
  const next = graph.get(current).find(n => n.node !== previous);
  assert.ok(next, 'The series path must reach the minus terminal.');
  if (next.edge.kind === 'leg') traversedLegs.push({ type: next.edge.type, from: current, to: next.node });
  previous = current; current = next.node;
}
assert.equal(visited.size, graph.size, 'No thermoelectric node may be disconnected.');
assert.equal(traversedLegs.length, 36);
for (const [i, leg] of traversedLegs.entries()) {
  assert.equal(leg.type, i % 2 ? 'P' : 'N');
  assert.ok(leg.from.startsWith(i % 2 ? 'c' : 'h'), 'Current must alternate down/up adjacent N/P legs.');
}
for (const [i, bridge] of layout.bridges.entries()) {
  assert.equal(bridge.face, i % 2 ? 'hot' : 'cold');
  near(Math.hypot(bridge.a[0] - bridge.b[0], bridge.a[1] - bridge.b[1]), s.tec.pitch, 'Bridge connects adjacent leg centers');
  assert.notEqual(layout.legs[bridge.from].type, layout.legs[bridge.to].type);
}
near(s.coldplate.top, s.tec.bottom, 'Cold ceramic contacts the cold spreader');
near(s.tec.bottom + s.tec.ceramic, s.tec.lowerCopperBottom, 'Lower ceramic/copper contact');
near(s.tec.lowerCopperBottom + s.tec.copper, s.tec.legBottom, 'Cold copper/leg contact');
near(s.tec.legTop - s.tec.legBottom, s.tec.legHeight, 'Leg height');
near(s.tec.legTop + s.tec.copper, s.tec.upperCopperTop, 'Leg/hot copper contact');
near(s.tec.upperCopperTop + s.tec.ceramic, s.tec.top, 'Hot copper/ceramic contact');
near(s.tec.top, s.heatpath.bottom, 'Hot ceramic/spreader contact');
assert.ok(s.electronics.boardBottom > s.heatpath.top);
assert.ok(s.electronics.componentTop < s.body.wallTop && s.body.wallTop < s.body.lidTop);
assert.ok(s.tec.pitch > s.tec.legWidth);
assert.ok((s.tec.columns - 1) * s.tec.pitch + s.tec.legWidth <= s.tec.width);
assert.ok((s.tec.rows - 1) * s.tec.pitch + s.tec.legWidth <= s.tec.depth);
assert.ok(s.heatpath.width < s.body.width - 2 * s.body.wall);
assert.ok(s.electronics.width < s.body.width - 2 * s.body.wall);

const basis = { target: [0, 0, 0], normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1],
  span: s.fit.span, minRigidY: s.body.bottom, clearance: s.fit.minimumRigidClearance };
const square = (height, span = 40) => ({ positions: [-span / 2, height(-span / 2, -span / 2), -span / 2,
  span / 2, height(span / 2, -span / 2), -span / 2, span / 2, height(span / 2, span / 2), span / 2,
  -span / 2, height(-span / 2, span / 2), span / 2], indices: [0, 1, 2, 0, 2, 3] });
const flat = fitDevice([square(() => 0)], basis);
near(flat.datum, -s.body.bottom+s.fit.minimumRigidClearance, 'Flat cortical datum'); near(flat.minimumRigidClearance, s.fit.minimumRigidClearance, 'Flat rigid clearance');
near(flat.surfaceAt(0, 0), -flat.datum, 'Contact surface relative to datum');
flat.contactThicknessRange.forEach(value => near(value, flat.datum, 'Flat contact thickness'));
const slope = (x, z) => 2 + .2 * x + .1 * z;
const sloped = fitDevice([square(slope)], basis);
near(sloped.maximum, 2 + .3 * s.fit.span / 2, 'Sloped maximum is the highest footprint corner');
near(sloped.surfaceAt(3, -2), slope(3, -2) - sloped.datum, 'Barycentric surface height');
near(sloped.contactThicknessRange[0], sloped.datum - slope(5, 5), 'Thinnest adapter');
near(sloped.contactThicknessRange[1], sloped.datum - slope(-5, -5), 'Thickest adapter');
const crossingTriangle = [[-30, slope(-30, -30), -30], [30, slope(30, -30), -30], [0, slope(0, 40), 40]];
assert.ok(crossingTriangle.every(p => Math.abs(p[0]) > s.fit.span / 2 || Math.abs(p[2]) > s.fit.span / 2));
const clipped = clipFootprint(crossingTriangle, s.fit.span);
assert.equal(clipped.length, 4, 'A triangle with no vertex in the footprint still covers the entire footprint.');
assert.ok(clipped.every(p => Math.abs(p[0]) <= s.fit.span / 2 + 1e-9 && Math.abs(p[2]) <= s.fit.span / 2 + 1e-9));
const crossing = fitDevice([{ positions: crossingTriangle.flat(), indices: [0, 1, 2] }], basis);
near(crossing.maximum, sloped.maximum, 'Crossing-only triangles must contribute to clearance');
for (const sheets of [[square(() => 0), square(() => 3)], [square(() => 3), square(() => 0)]]) {
  const fit = fitDevice(sheets, basis);
  near(fit.maximum, 3, 'Fit selects the upper sheet'); near(fit.surfaceAt(1, 2), 3-fit.datum, 'Contact selects upper surface independently of mesh order');
}
assert.throws(() => fitDevice([], basis), /No reference cortex intersects/);
assert.throws(() => fitDevice([square(() => 0, 8)], basis), /does not cover/);
assert.throws(() => fitDevice([{ positions: [0, 0, -10, 0, 5, 0, 0, 0, 10], indices: [0, 1, 2] }], basis), /does not cover/);

// Read only the existing uncompressed display GLB; do not regenerate or modify assets.
const bytes = await readFile(new URL('../../public/seizefreeze-lab/assets/brain-cortex.glb', import.meta.url));
assert.equal(bytes.readUInt32LE(0), 0x46546c67);
const jsonLength = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
const bin = bytes.subarray(28 + jsonLength);
function accessor(index) {
  const a = json.accessors[index], view = json.bufferViews[a.bufferView];
  const Type = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[a.componentType];
  const size = { VEC3: 3, SCALAR: 1 }[a.type];
  assert.ok(Type && size && !view.byteStride && !a.sparse);
  return new Type(bin.buffer, bin.byteOffset + (view.byteOffset || 0) + (a.byteOffset || 0), a.count * size);
}
const cortex = json.nodes.filter(n => n.mesh !== undefined && !/skin|cerebellum|white_matter/.test(n.name)).flatMap(node =>
  json.meshes[node.mesh].primitives.map(p => ({ name: node.name, positions: accessor(p.attributes.POSITION), indices: accessor(p.indices) })));
const parcel = cortex.find(m => m.name === 'Allen_superior_temporal_gyrus_L');
assert.ok(parcel, 'The source target parcel must be present.');
const geometry = new BufferGeometry(); geometry.setAttribute('position', new BufferAttribute(parcel.positions, 3));
geometry.setIndex(new BufferAttribute(parcel.indices, 1)); geometry.computeVertexNormals();
const desired = new Vector3(-64, -2, 11), target = new Vector3(), normal = new Vector3();
let nearest = Infinity;
for (let i = 0; i < geometry.attributes.position.count; i++) {
  const p = new Vector3().fromBufferAttribute(geometry.attributes.position, i), n = new Vector3().fromBufferAttribute(geometry.attributes.normal, i);
  if (n.x > -.92 || p.x > -61) continue;
  const distance = p.distanceToSquared(desired);
  if (distance < nearest) { nearest = distance; target.copy(p); normal.copy(n).normalize(); }
}
assert.ok(Number.isFinite(nearest));
const u = new Vector3(0, 0, 1).addScaledVector(normal, -normal.z).normalize(), v = new Vector3().crossVectors(normal, u).normalize();
const atlasBasis = { ...basis, target: target.toArray(), normal: normal.toArray(), u: u.toArray(), v: v.toArray() };
const atlas = fitDevice(cortex, atlasBasis);
// Independent intersection candidates: inside vertices, edge/rectangle intersections and enclosed corners.
let independentMaximum = -Infinity;
const half = s.fit.span / 2;
const inside = p => Math.abs(p[0]) <= half + 1e-8 && Math.abs(p[2]) <= half + 1e-8;
function consider(p) { if (inside(p)) independentMaximum = Math.max(independentMaximum, p[1]); }
for (const mesh of cortex) {
  const local = [];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const d = new Vector3(mesh.positions[i], mesh.positions[i + 1], mesh.positions[i + 2]).sub(target);
    local.push([d.dot(u), d.dot(normal), -d.dot(v)]);
  }
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const triangle = Array.from(mesh.indices.subarray(i, i + 3), index => local[index]);
    if ([0, 2].some(axis => Math.min(...triangle.map(p => p[axis])) > half || Math.max(...triangle.map(p => p[axis])) < -half)) continue;
    triangle.forEach(consider);
    for (let edge = 0; edge < 3; edge++) for (const axis of [0, 2]) for (const boundary of [-half, half]) {
      const a = triangle[edge], b = triangle[(edge + 1) % 3], delta = b[axis] - a[axis];
      if (Math.abs(delta) < 1e-12) continue;
      const t = (boundary - a[axis]) / delta;
      if (t >= 0 && t <= 1) consider(a.map((value, j) => value + t * (b[j] - value)));
    }
    const [a, b, c] = triangle;
    const denominator = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
    if (Math.abs(denominator) < 1e-12) continue;
    for (const x of [-half, half]) for (const z of [-half, half]) {
      const wa = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / denominator;
      const wb = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / denominator;
      if (wa >= 0 && wb >= 0 && wa + wb <= 1) consider([x, wa * a[1] + wb * b[1] + (1 - wa - wb) * c[1], z]);
    }
  }
}
near(atlas.maximum, independentMaximum, 'Clipped maximum agrees with independent source-triangle intersections', 1e-7);
const actualRigidClearance = atlas.datum + s.body.bottom - independentMaximum;
near(actualRigidClearance, s.fit.minimumRigidClearance, 'Actual source-triangle rigid clearance', 1e-7);
assert.ok(atlas.contactThicknessRange[0] > 0);
geometry.dispose();
const materials = Object.fromEntries(['darkmetal', 'contact', 'insulation', 'cold', 'ceramic', 'gold', 'hot', 'board', 'chip', 'blue', 'violet', 'titanium']
  .map(name => [name, new T.MeshStandardMaterial()]));
const device = createDevice(T, materials, atlas);
const routes = device.info.sensorRoutes;
assert.ok(Array.isArray(routes) && routes.length === 4, 'Expose all four actual ECoG/RTD lead routes for geometric verification.');
assert.equal(new Set(routes.map(r => r.name)).size, routes.length);
for (const route of routes) {
  assert.ok(route.points.length > 1 && route.points.every(p => p.length === 3 && p.every(Number.isFinite)));
  assert.ok(route.conductorRadius > 0 && route.outerRadius >= route.conductorRadius);
}
for (const endpoint of [0, -1]) for (let i = 0; i < routes.length; i++) for (let j = i + 1; j < routes.length; j++) {
  assert.ok(Math.hypot(...routes[i].points.at(endpoint).map((x, k) => x - routes[j].points.at(endpoint)[k])) > 1e-6,
    `${routes[i].name} and ${routes[j].name} must have distinct ${endpoint ? 'pin' : 'sensor'} endpoints.`);
}
const sensorSeparations = [];
for (let i = 0; i < routes.length; i++) for (let j = i + 1; j < routes.length; j++) {
  const a = routes[i], b = routes[j];
  let minimum = Infinity;
  for (let u = 1; u < a.points.length; u++) for (let v = 1; v < b.points.length; v++) {
    minimum = Math.min(minimum, segmentDistance(a.points[u - 1], a.points[u], b.points[v - 1], b.points[v]));
  }
  sensorSeparations.push({ a: a.name, b: b.name, minimumCenterDistanceMm: minimum,
    conductorGapMm: minimum - a.conductorRadius - b.conductorRadius, jacketGapMm: minimum - a.outerRadius - b.outerRadius });
}
device.dispose(); Object.values(materials).forEach(material => material.dispose());
assert.ok(sensorSeparations.every(pair => pair.conductorGapMm >= -1e-6 && pair.jacketGapMm >= -1e-6),
  `Actual reference-surface routes must not overlap: ${JSON.stringify(sensorSeparations.filter(pair => pair.conductorGapMm < -1e-6 || pair.jacketGapMm < -1e-6))}`);
console.log(JSON.stringify({ passed: true, topology: { legs: layout.legs.length, couples: layout.couples, nodes: graph.size,
  traversedEdges: path.length - 1, bridges: layout.bridges.length, terminals: ['plus', 'minus'] },
  fitCases: ['plane', 'sloped plane', 'all vertices outside but footprint crossed', 'multiple surfaces and reversed order', 'empty', 'incomplete coverage', 'vertical projection'],
  sensorSeparations, atlas: { target: target.toArray(), normal: normal.toArray(), datumMm: atlas.datum, independentMaximumMm: independentMaximum,
    actualMinimumRigidClearanceMm: actualRigidClearance, contactThicknessRangeMm: atlas.contactThicknessRange,
    sourceTriangles: atlas.sourceTriangleCount, candidateTriangles: atlas.candidateTriangleCount,
    evidenceBoundary: 'Clearance against displayed reference triangles; no tissue-contact mechanics or clinical validation' } }, null, 2));
