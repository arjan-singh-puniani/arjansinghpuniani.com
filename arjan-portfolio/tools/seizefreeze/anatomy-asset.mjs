import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

// Derive a display-only asset from the already attributed, registered HRA models.
// Vertex clustering changes geometry; this asset is not suitable for morphometry.
const root = process.cwd();
function readGlb(file) {
  const bytes = fs.readFileSync(path.join(root, file));
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  const jsonSize = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonSize).toString());
  const bin = bytes.subarray(28 + jsonSize);
  function accessor(index) {
    const a = json.accessors[index], view = json.bufferViews[a.bufferView];
    const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type];
    const Type = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[a.componentType];
    assert(Type && size && (!view.byteStride || view.byteStride === size * Type.BYTES_PER_ELEMENT), 'Expected tightly packed uncompressed HRA geometry.');
    const offset = (view.byteOffset || 0) + (a.byteOffset || 0);
    return new Type(bin.buffer, bin.byteOffset + offset, a.count * size);
  }
  return { json, accessor, hash: crypto.createHash('sha256').update(bytes).digest('hex') };
}
const brain = readGlb('public/atlas/anatomy/brain.glb');
const body = readGlb('public/atlas/anatomy/body.glb');
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (const mesh of brain.json.meshes) for (const p of mesh.primitives) {
  const a = brain.json.accessors[p.attributes.POSITION];
  a.min.forEach((v, i) => min[i] = Math.min(min[i], v));
  a.max.forEach((v, i) => max[i] = Math.max(max[i], v));
}
const center = min.map((v, i) => (v + max[i]) / 2);
function simplify(source, primitive, spacing, keepTriangle = () => true) {
  const raw = source.accessor(primitive.attributes.POSITION), originalIndices = source.accessor(primitive.indices);
  const clusters = new Map(), remap = new Uint32Array(raw.length / 3), sums = [];
  for (let i = 0; i < raw.length / 3; i++) {
    const p = [0, 1, 2].map(k => (raw[i * 3 + k] - center[k]) * 1000);
    const key = spacing ? p.map(v => Math.floor(v / spacing)).join(',') : String(i);
    let index = clusters.get(key);
    if (index === undefined) { index = sums.length; clusters.set(key, index); sums.push([0, 0, 0, 0]); }
    remap[i] = index;
    p.forEach((v, k) => sums[index][k] += v); sums[index][3]++;
  }
  const positions = sums.flatMap(s => s.slice(0, 3).map(v => v / s[3]));
  const indices = [], seen = new Set();
  for (let i = 0; i < originalIndices.length; i += 3) {
    const original = Array.from(originalIndices.subarray(i, i + 3));
    if (!keepTriangle(original.map(j => [raw[j * 3], raw[j * 3 + 1], raw[j * 3 + 2]]))) continue;
    const triangle = original.map(j => remap[j]);
    if (new Set(triangle).size < 3) continue;
    const key = [...triangle].sort((a, b) => a - b).join(',');
    if (seen.has(key)) continue; seen.add(key); indices.push(...triangle);
  }
  // Remove vertices outside the retained head region and unused cluster points.
  const compact = new Map(), usedPositions = [], usedIndices = [];
  for (const i of indices) {
    if (!compact.has(i)) { compact.set(i, compact.size); usedPositions.push(...positions.slice(i * 3, i * 3 + 3)); }
    usedIndices.push(compact.get(i));
  }
  return { positions: usedPositions, indices: usedIndices };
}
// Atlas mesh order is not anatomy: the frontal poles and insula occur outside the main cortical block.
const corticalRegions = new Set([
  'piriform_region',
  'frontal_agranular_insular_cortex_area_Fl',
  'temporal_agranular_insular_cortex_area_Tl',
  'precentral_gyrus',
  'superior_frontal_gyrus',
  'middle_frontal_gyrus',
  'inferior_frontal_gyrus_triangular_part',
  'inferior_frontal_gyrus_opercular_part',
  'gyrus_rectus_straight_gyrus',
  'medial_orbital_gyrus',
  'anterior_intermediate_orbital_gyrus',
  'posterior_intermediate_orbital_gyrus',
  'lateral_orbital_gyrus',
  'paracentral_lobule_rostral_part',
  'frontal_operculum',
  'postcentral_gyrus',
  'supraparietal_lobule',
  'supramarginal_gyrus',
  'angular_gyrus',
  'precuneus',
  'paracentral_lobule_caudal_part',
  'superior_temporal_gyrus',
  'middle_temporal_gyrus',
  'inferior_temporal_gyrus',
  'occipitotemporal_fusiform_gyrus_temporal_part',
  'transverse_temporal_gyrus_Heschls_gyrus',
  'planum_temporale',
  'temporal_pole',
  'planum_polare',
  'occipital_pole',
  'cuneus',
  'lingual_gyrus_medial_occipitotemporal_gyrus',
  'lateral_occipitotemporal_fusiform_gyrus_occipital_part',
  'inferior_occipital_gyrus',
  'superior_occipital_gyrus',
  'cingulate_gyrus_rostral_anterior_part',
  'cingulate_gyrus_caudal_posterior_part',
  'ingulo_parahippocampal_isthmus',
  'subcallosal_gyrus_parolfactory_gyrus',
  'anterior_parahippocampal_gyrus',
  'posterior_parahippocampal_gyrus',
  'gyrus_ambiens',
  'long_insular_gyri',
  'short_insular_gyri',
  'limen_insula',
  'lateral_olfactory_gyrus',
  'parietal_operculum',
  'paracingulate_gyrus',
  'rostral_gyrus',
  'frontomarginal_gyrus',
  'frontal_pole',
  'perirhinal_gyrus_rostral_part_of_FuGt',
].flatMap(name => ['L', 'R'].map(side => `Allen_${name}_${side}`)));
const hindbrainRegions = new Set(['cerebellar_vermis', 'paravermis_of_cerebellum', 'lateral_hemisphere_of_cerebellum',
  'basilar_part_of_pons', 'pyramidal_part_of_medulla_oblongata', 'tegmentum_of_medulla_oblongata']
  .flatMap(name => ['L', 'R'].map(side => `Allen_${name}_${side}`)));
const cortex = { positions: [], indices: [], names: [] }, hindbrain = { positions: [], indices: [], names: [] }, interior = { positions: [], indices: [], names: [] };
let target;
function append(to, geometry, name) {
  const offset = to.positions.length / 3;
  to.positions.push(...geometry.positions); to.indices.push(...geometry.indices.map(i => i + offset)); to.names.push(name);
}
for (const node of brain.json.nodes) {
  if (node.mesh === undefined) continue;
  const i = node.mesh;
  const cortical = corticalRegions.has(node.name), posterior = hindbrainRegions.has(node.name);
  const whiteMatter = /^Allen_white_matter_of_forebrain_[LR]$/.test(node.name);
  if (!cortical && !posterior && !whiteMatter) continue;
  for (const primitive of brain.json.meshes[i].primitives) {
    if (node.name === 'Allen_superior_temporal_gyrus_L') {
      target = { ...simplify(brain, primitive, 0), names: [node.name] };
    } else append(cortical ? cortex : whiteMatter ? interior : hindbrain, simplify(brain, primitive, 1), node.name);
  }
}
assert(target && target.positions.length > 3000);
assert.equal(new Set([...cortex.names, ...target.names]).size, corticalRegions.size, 'All named cortical regions must survive extraction.');
assert.equal(interior.names.length, 2, 'Retain registered left and right forebrain white matter as interior context.');
const scalp = simplify(body, body.json.meshes[0].primitives[0], 0.8, triangle => triangle.every(p => p[1] > 0.70));
scalp.names = ['VH_M_skin'];
const items = [
  ['HRA_cerebral_cortex_display', cortex], ['Allen_superior_temporal_gyrus_L', target],
  ['HRA_cerebellum_and_brainstem_display', hindbrain], ['HRA_forebrain_white_matter_display', interior],
  ['HRA_registered_head_skin_display', scalp],
];
const chunks = [], views = [], accessors = [], meshes = [], nodes = [];
let byteOffset = 0;
function store(array, componentType, type, count) {
  const buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  views.push({ buffer: 0, byteOffset, byteLength: buffer.length }); chunks.push(buffer); byteOffset += buffer.length;
  const a = { bufferView: views.length - 1, componentType, count, type };
  if (type === 'VEC3') {
    a.min = [Infinity, Infinity, Infinity]; a.max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < array.length; i++) { const k = i % 3; a.min[k] = Math.min(a.min[k], array[i]); a.max[k] = Math.max(a.max[k], array[i]); }
  }
  accessors.push(a); return accessors.length - 1;
}
for (const [name, geometry] of items) {
  const position = store(new Float32Array(geometry.positions), 5126, 'VEC3', geometry.positions.length / 3);
  const indices = store(new Uint32Array(geometry.indices), 5125, 'SCALAR', geometry.indices.length);
  meshes.push({ name, primitives: [{ attributes: { POSITION: position }, indices, material: 0 }] });
  nodes.push({ name, mesh: meshes.length - 1, extras: { sourceNodes: geometry.names } });
}
const metadata = {
  units: 'millimeters', axes: '+X anatomical right; +Y superior; +Z anterior', sourceCenterMeters: center,
  sourceBrainSha256: brain.hash, sourceBodySha256: body.hash,
  license: 'CC BY 4.0', creators: 'Kristen Browne; Heidi Schlehlein',
  sourceBrain: 'https://doi.org/10.48539/HBM929.XKCL.339', sourceBody: 'https://doi.org/10.48539/HBM646.RKKC.257',
  modifications: 'All 104 explicitly named cortical parcels, cerebellar/brainstem context and bilateral forebrain white matter retained. Frontal poles, frontomarginal/rostral/paracingulate gyri, insula, parietal opercula and basal cortical parcels included by name; mesh order is not used. Other internal structures omitted. Target parcel unmodified except centering and meters-to-mm conversion. Other brain parcels clustered at 1 mm; head skin cropped inferiorly at source Y=0.70 m and clustered at 0.8 mm. Material and illustrative coverings supplied at runtime. Not suitable for measurement or procedural planning.',
  counts: items.map(([name, g]) => ({ name, vertices: g.positions.length / 3, triangles: g.indices.length / 3 })),
};
const json = { asset: { version: '2.0', generator: 'SeizeFreeze HRA display extraction', copyright: 'Kristen Browne; Heidi Schlehlein / HuBMAP. CC BY 4.0. Modified display asset.' }, scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes, materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.7, 0.55, 0.52, 1], roughnessFactor: 0.7 } }], accessors, bufferViews: views, buffers: [{ byteLength: byteOffset }], extras: metadata };
let text = Buffer.from(JSON.stringify(json)); text = Buffer.concat([text, Buffer.alloc((4 - text.length % 4) % 4, 0x20)]);
const bin = Buffer.concat(chunks), total = 12 + 8 + text.length + 8 + bin.length;
const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(total, 8); header.writeUInt32LE(text.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(bin.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
const output = path.join(root, 'public/seizefreeze-lab/assets/brain-cortex.glb'); fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, Buffer.concat([header, text, binHeader, bin]));
assert.equal(fs.statSync(output).size, total);
assert(metadata.counts.every(c => c.triangles > 0 && Number.isInteger(c.triangles)));
console.log(JSON.stringify({ ...metadata, outputBytes: total }, null, 2));
