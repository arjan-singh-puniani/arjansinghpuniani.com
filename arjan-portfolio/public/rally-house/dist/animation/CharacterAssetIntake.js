import { BONE } from './CharacterSkin.js';
/** Strict, non-networking glTF 2 / GLB intake. Output is never automatically activated on a character. */
export function inspectCharacterAsset(input, buffers, provenance) {
    const fail = (message) => { throw Error(`Character asset rejected: ${message}`); };
    if (!provenance.author?.trim() || !provenance.source?.trim() || !provenance.license?.trim() || !/^[a-f0-9]{64}$/i.test(provenance.sha256))
        fail('author, source, license and SHA-256 are required');
    let doc = input;
    let data = [...buffers];
    if (input instanceof ArrayBuffer) {
        const v = new DataView(input);
        if (v.byteLength < 20 || v.getUint32(0, true) !== 0x46546c67 || v.getUint32(4, true) !== 2 || v.getUint32(8, true) !== v.byteLength)
            fail('invalid GLB header');
        let at = 12, json = false, bin = false;
        while (at < v.byteLength) {
            if (at + 8 > v.byteLength)
                fail('truncated chunk');
            const size = v.getUint32(at, true), type = v.getUint32(at + 4, true);
            at += 8;
            if (size % 4 || at + size > v.byteLength)
                fail('invalid chunk length');
            const chunk = input.slice(at, at + size);
            if (type === 0x4e4f534a) {
                if (json || at !== 20)
                    fail('JSON must be the first chunk');
                doc = JSON.parse(new TextDecoder().decode(chunk));
                json = true;
            }
            else if (type === 0x004e4942) {
                if (bin)
                    fail('duplicate binary chunk');
                bin = true;
                data[0] = chunk;
            }
            else
                fail('unsupported GLB chunk');
            at += size;
        }
        if (!json)
            fail('missing JSON');
    }
    if (doc?.asset?.version !== '2.0')
        fail('glTF 2.0 is required');
    if (doc.extensionsRequired?.length)
        fail('required extensions need an explicit decoder');
    if (!Array.isArray(doc.skins) || doc.skins.length !== 1 || !Array.isArray(doc.nodes) || !Array.isArray(doc.meshes))
        fail('one skin, nodes and meshes are required');
    if (doc.animations?.length)
        fail('animation retargeting is a separate review gate');
    const skin = doc.skins[0];
    if (!Array.isArray(skin.joints) || !skin.joints.length || skin.joints.length > 15 || new Set(skin.joints).size !== skin.joints.length)
        fail('invalid joint list');
    const mapping = skin.joints.map((index) => { const node = doc.nodes[index], name = node?.name, key = provenance.boneMap[name]; if (!name || !(key in BONE))
        fail(`unmapped joint ${name ?? index}`); return BONE[key]; });
    if (new Set(mapping).size !== mapping.length)
        fail('bone mappings must be unique');
    const read = (index, type, allowed, weights = false) => {
        const a = doc.accessors?.[index];
        if (!a || a.type !== type || !Number.isSafeInteger(a.count) || a.count < 1 || a.count > 120000 || a.sparse || !allowed.includes(a.componentType))
            fail('unsupported accessor');
        if (a.normalized && (!weights || a.componentType === 5126))
            fail('invalid normalized accessor');
        if (weights && a.componentType !== 5126 && !a.normalized)
            fail('integer weights require normalization');
        const b = doc.bufferViews?.[a.bufferView], buf = data[b?.buffer];
        if (!b || !buf)
            fail('missing buffer');
        const components = { SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16 }[type], bytes = a.componentType === 5126 || a.componentType === 5125 ? 4 : a.componentType === 5123 ? 2 : 1, packed = components * bytes, stride = b.byteStride ?? packed, offset = (b.byteOffset ?? 0) + (a.byteOffset ?? 0);
        if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(b.byteOffset ?? 0) || !Number.isSafeInteger(a.byteOffset ?? 0) || !Number.isSafeInteger(stride) || stride % bytes || stride < packed || stride > 252 || offset < 0 || offset % bytes || !Number.isSafeInteger(b.byteLength) || b.byteLength < 0 || offset + (a.count - 1) * stride + packed > (b.byteOffset ?? 0) + b.byteLength || offset + (a.count - 1) * stride + packed > buf.byteLength)
            fail('accessor outside buffer');
        const v = new DataView(buf), out = [];
        for (let i = 0; i < a.count; i++)
            for (let j = 0; j < components; j++) {
                const pos = offset + i * stride + j * bytes;
                let n = a.componentType === 5126 ? v.getFloat32(pos, true) : a.componentType === 5125 ? v.getUint32(pos, true) : a.componentType === 5123 ? v.getUint16(pos, true) : v.getUint8(pos);
                if (a.normalized && a.componentType !== 5126)
                    n /= a.componentType === 5123 ? 65535 : 255;
                if (!Number.isFinite(n))
                    fail('non-finite vertex data');
                out.push(n);
            }
        return out;
    };
    const inverse = read(skin.inverseBindMatrices, 'MAT4', [5126]);
    if (inverse.length !== skin.joints.length * 16)
        fail('inverse bind count mismatch');
    const primitives = [];
    for (const [mi, mesh] of doc.meshes.entries())
        for (const [pi, p] of (mesh.primitives ?? []).entries()) {
            if (p.mode !== undefined && p.mode !== 4)
                fail('triangle primitives only');
            if (p.targets)
                fail('morph targets require a reviewed channel adapter');
            const positions = read(p.attributes?.POSITION, 'VEC3', [5126]), normals = read(p.attributes?.NORMAL, 'VEC3', [5126]), joints = read(p.attributes?.JOINTS_0, 'VEC4', [5121, 5123]), weights = read(p.attributes?.WEIGHTS_0, 'VEC4', [5121, 5123, 5126], true), count = positions.length / 3;
            if (normals.length !== positions.length || joints.length !== count * 4 || weights.length !== count * 4)
                fail('attribute counts differ');
            for (let i = 0; i < count; i++) {
                let sum = 0;
                for (let j = 0; j < 4; j++) {
                    const n = i * 4 + j;
                    if (!Number.isSafeInteger(joints[n]) || joints[n] < 0 || joints[n] >= mapping.length || weights[n] < 0 || weights[n] > 1)
                        fail('invalid joint or weight');
                    sum += weights[n];
                    joints[n] = mapping[joints[n]];
                }
                if (Math.abs(sum - 1) > .015)
                    fail('weights are not normalized');
                const len = Math.hypot(...normals.slice(i * 3, i * 3 + 3));
                if (len < .5 || len > 1.5)
                    fail('invalid normals');
            }
            const material = doc.materials?.[p.material];
            if (!material?.name)
                fail('named material slots required');
            if (material.pbrMetallicRoughness?.baseColorTexture || material.pbrMetallicRoughness?.metallicRoughnessTexture || material.normalTexture || material.occlusionTexture || material.emissiveTexture)
                fail('textured materials need a renderer adapter');
            const indices = p.indices === undefined ? Array.from({ length: count }, (_, i) => i) : read(p.indices, 'SCALAR', [5121, 5123, 5125]);
            if (indices.length % 3 || indices.some((i) => !Number.isSafeInteger(i) || i < 0 || i >= count))
                fail('invalid triangle indices');
            const expand = (source, size) => new Float32Array(indices.flatMap((i) => source.slice(i * size, (i + 1) * size)));
            primitives.push({ geometry: { id: `asset-${provenance.sha256}-${mi}-${pi}`, positions: expand(positions, 3), normals: expand(normals, 3), boneIndices: expand(joints, 4), boneWeights: expand(weights, 4) }, materialSlot: material.name });
        }
    if (!primitives.length || primitives.reduce((n, p) => n + p.geometry.positions.length / 3, 0) > 120000)
        fail('empty or over-budget geometry');
    return { primitives, inverseBindMatrices: inverse, provenance: structuredClone(provenance), warnings: ['Intake only: compare bind pose, material mapping and motion before activation.', 'SHA-256 provenance must be verified by the file-loading caller.', 'No professional character or animation asset was supplied.'] };
}
//# sourceMappingURL=CharacterAssetIntake.js.map