import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

async function glb(path) {
  const bytes = await readFile(path);
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  const length = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + length)), bin = bytes.subarray(28 + length);
  const values = index => {
    const a = json.accessors[index], view = json.bufferViews[a.bufferView];
    const Type = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[a.componentType];
    const size = { VEC3: 3, SCALAR: 1 }[a.type];
    assert.ok(Type && size && (!view.byteStride || view.byteStride === size * Type.BYTES_PER_ELEMENT) && !a.sparse);
    return new Type(bin.buffer, bin.byteOffset + (view.byteOffset || 0) + (a.byteOffset || 0), a.count * size);
  };
  return { json, values, hash: createHash('sha256').update(bytes).digest('hex') };
}
const source = await glb(new URL('../../public/atlas/anatomy/brain.glb', import.meta.url));
const derived = await glb(process.argv[2] || new URL('../../public/seizefreeze-lab/assets/brain-cortex.glb', import.meta.url));
assert.equal(derived.json.extras.sourceBrainSha256, source.hash);
const cortex = derived.json.nodes.find(n => n.name === 'HRA_cerebral_cortex_display');
const target = derived.json.nodes.find(n => n.name === 'Allen_superior_temporal_gyrus_L');
const white = derived.json.nodes.find(n => n.name === 'HRA_forebrain_white_matter_display');
assert.ok(cortex && target && white);
const retained = [...cortex.extras.sourceNodes, ...target.extras.sourceNodes];
assert.equal(retained.length, 104);
assert.equal(new Set(retained).size, retained.length);
assert.deepEqual(white.extras.sourceNodes, ['Allen_white_matter_of_forebrain_L', 'Allen_white_matter_of_forebrain_R']);
const restored = ['piriform_region', 'frontal_agranular_insular_cortex_area_Fl', 'temporal_agranular_insular_cortex_area_Tl',
  'long_insular_gyri', 'short_insular_gyri', 'limen_insula', 'lateral_olfactory_gyrus', 'parietal_operculum',
  'paracingulate_gyrus', 'rostral_gyrus', 'frontomarginal_gyrus', 'frontal_pole', 'perirhinal_gyrus_rostral_part_of_FuGt']
  .flatMap(name => ['L', 'R'].map(side => `Allen_${name}_${side}`));
for (const name of restored) assert.ok(retained.includes(name), `Missing cortical parcel ${name}`);
const center = derived.json.extras.sourceCenterMeters;
const primitive = node => derived.json.meshes[node.mesh].primitives[0];
const positions = derived.values(primitive(cortex).attributes.POSITION);
const grid = new Map(), key = p => p.map(x => Math.floor(x / 2)).join(',');
for (let i = 0; i < positions.length; i += 3) {
  const p = Array.from(positions.subarray(i, i + 3)), k = key(p);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(p);
}
let maximumRestoredVertexDistanceMm = 0, checkedVertices = 0;
for (const name of restored) {
  const node = source.json.nodes.find(n => n.name === name);
  assert.ok(node, `Missing original source parcel ${name}`);
  for (const p of source.json.meshes[node.mesh].primitives) {
    const raw = source.values(p.attributes.POSITION), indices = source.values(p.indices);
    assert.ok(indices.length > 0);
    for (const i of new Set(indices)) {
      const point = center.map((c, axis) => (raw[i * 3 + axis] - c) * 1000), cell = point.map(x => Math.floor(x / 2));
      let distance = Infinity;
      for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
        for (const q of grid.get([cell[0] + x, cell[1] + y, cell[2] + z].join(',')) || []) {
          distance = Math.min(distance, Math.hypot(...point.map((v, axis) => v - q[axis])));
        }
      }
      assert.ok(distance <= Math.sqrt(3) + 1e-4, `${name}: output geometry absent near source vertex ${i} (${distance} mm)`);
      maximumRestoredVertexDistanceMm = Math.max(maximumRestoredVertexDistanceMm, distance); checkedVertices++;
    }
  }
}
// The unclustered target's exact compacted source triangles must survive the repair.
const originalTarget = source.json.nodes.find(n => n.name === target.name), p = source.json.meshes[originalTarget.mesh].primitives[0];
const raw = source.values(p.attributes.POSITION), indices = source.values(p.indices), remap = new Map(), expectedPositions = [], expectedIndices = [];
const uniqueTriangles = new Set();
for (let offset = 0; offset < indices.length; offset += 3) {
  const triangle = Array.from(indices.subarray(offset, offset + 3)), key = [...triangle].sort((a, b) => a - b).join(',');
  if (new Set(triangle).size < 3 || uniqueTriangles.has(key)) continue;
  uniqueTriangles.add(key);
  for (const i of triangle) {
    if (!remap.has(i)) {
      remap.set(i, remap.size);
      center.forEach((c, axis) => expectedPositions.push((raw[i * 3 + axis] - c) * 1000));
    }
    expectedIndices.push(remap.get(i));
  }
}
assert.deepEqual(derived.values(primitive(target).attributes.POSITION), new Float32Array(expectedPositions));
assert.deepEqual(derived.values(primitive(target).indices), new Uint32Array(expectedIndices));
let triangles = 0;
for (const mesh of derived.json.meshes) for (const p of mesh.primitives) {
  const positions = derived.values(p.attributes.POSITION), indices = derived.values(p.indices);
  assert.ok(positions.every(Number.isFinite)); assert.equal(indices.length % 3, 0);
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = Array.from(indices.subarray(i, i + 3));
    assert.equal(new Set(triangle).size, 3); assert.ok(triangle.every(index => index < positions.length / 3));
  }
  triangles += indices.length / 3;
}
console.log(JSON.stringify({ passed: true, corticalParcels: retained.length, restoredParcels: restored.length,
  checkedSourceVertices: checkedVertices, maximumRestoredVertexDistanceMm, targetSourceTrianglesUnchanged: true,
  forebrainWhiteMatterSeparatelyGrouped: true, triangles, bytes: (await readFile(process.argv[2] || new URL('../../public/seizefreeze-lab/assets/brain-cortex.glb', import.meta.url))).length }, null, 2));
