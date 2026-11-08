import { Vec3, identity, clamp, smoothstep, compose, invertRigid, multiply, translation } from '../rendering/Math3D.js';
import { BONE } from './CharacterSkin.js';
import { inspectCharacterAsset } from './CharacterAssetIntake.js';
const collarBones = [BONE.neck, BONE.chest, BONE.upperArmL, BONE.upperArmR], headBones = new Set([BONE.head, ...collarBones]);
const root = new URL('../../assets/characters/arjan/', import.meta.url);
const bones = new Float32Array(19 * 16);
for (let i = 0; i < 19; i++)
    bones.set(identity(), i * 16);
let head;
/** Validate every downloaded byte before switching the normal character and replay to this head. */
export async function loadArjanAuthoredHead() {
    const get = async (name) => { const r = await fetch(new URL(name, root)); if (!r.ok)
        throw Error(`Arjan head unavailable: ${name}`); const b = await r.arrayBuffer(); if (b.byteLength > 2 * 1024 * 1024)
        throw Error('Arjan head exceeds its runtime budget'); return b; };
    const hash = async (b) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', b)), n => n.toString(16).padStart(2, '0')).join('');
    const [metaBytes, bytes, bodyBytes] = await Promise.all([get('head-provenance.json'), get('head.glb'), get('provenance.json')]);
    const meta = JSON.parse(new TextDecoder().decode(metaBytes));
    if (JSON.parse(new TextDecoder().decode(bodyBytes)).sha256 !== meta.bodySha256)
        throw Error('Arjan head/body registration mismatch');
    if (await hash(bytes) !== meta.sha256)
        throw Error('Arjan head checksum failed');
    const result = inspectCharacterAsset(bytes, [], meta), slots = ['face', 'scalp', 'eyes', 'hair', 'browCore', 'browStrands'];
    if (result.primitives.length !== slots.length || slots.some(s => result.primitives.filter(p => p.materialSlot === s).length !== 1) || result.primitives.some(p => !p.geometry.morphs || !p.geometry.morphNormals))
        throw Error('Unsupported Arjan head parts');
    const expectedAlbedo = { face: 'head-skin.webp', scalp: 'head-skin.webp', eyes: 'head-skin.webp', hair: 'head-hair.webp' };
    for (const p of result.primitives) {
        const g = p.geometry;
        if (p.albedo !== expectedAlbedo[p.materialSlot] || g.positions.some(n => Math.abs(n) > .4) || g.boneIndices.some((b, i) => g.boneWeights[i] > 0 && !headBones.has(b)))
            throw Error('Invalid Arjan head registration');
    }
    if (result.inverseBindMatrices.length !== 80 || result.inverseBindMatrices.some((v, i) => Math.abs(v - identity()[i % 16]) > 1e-6))
        throw Error('Invalid Arjan head bind matrix');
    if (!Array.isArray(meta.eyeCenters) || meta.eyeCenters.length !== 2 || meta.eyeCenters.some(v => !Array.isArray(v) || v.length !== 3 || v.some(n => !Number.isFinite(n) || Math.abs(n) > .2)))
        throw Error('Invalid Arjan eye registration');
    const images = {};
    await Promise.all(['head-skin.webp', 'head-hair.webp'].map(async (name) => {
        const b = await get(name);
        if (await hash(b) !== meta.textures?.[name])
            throw Error('Arjan head texture checksum failed');
        const url = URL.createObjectURL(new Blob([b], { type: 'image/webp' }));
        try {
            const image = new Image();
            image.src = url;
            await image.decode();
            if (!image.naturalWidth || image.naturalWidth > 2048 || !image.naturalHeight || image.naturalHeight > 2048)
                throw Error('Invalid Arjan head texture dimensions');
            images[name] = image;
        }
        finally {
            URL.revokeObjectURL(url);
        }
    }));
    if (result.primitives.some(p => p.albedo && !images[p.albedo]))
        throw Error('Unsupported Arjan head texture');
    // A failed reload keeps the previously verified head, including its decoded textures.
    head = { parts: result.primitives, images, eyeCenters: new Float32Array(meta.eyeCenters.flat()) };
}
/** The collar's native weights consume the same scaled body palette in live play and replay. */
export function arjanNeckMatrices(position, rotation, body) {
    if (!body?.rig)
        return bones;
    const root = multiply(invertRigid(compose(position, rotation)), compose(body.position, body.rotation)), offset = translation(body.rig.bind.head), palette = bones.slice();
    for (const bone of collarBones)
        palette.set(multiply(root, multiply(body.boneMatrices.subarray(bone * 16, bone * 16 + 16), offset)), bone * 16);
    return palette;
}
export function arjanAuthoredHead(position, yaw, tilt, face, time, options = {}) {
    if (!head)
        return;
    const phase = (time + .47) % 3.75, blink = phase < .10 ? 1 - smoothstep(0, .10, phase) : 0;
    // Keep the wider reference-fitted eyes open at rest while retaining full timed blink closure.
    const expression = [clamp(face.smile, 0, 1), clamp(face.mouthOpen, 0, 1), clamp(.08 + .92 * blink + face.squint * .35, 0, 1), clamp(face.browRaise, 0, 1)];
    const rotation = new Vec3(-(options.pitch ?? 0), yaw, tilt), body = options.neckBody, palette = arjanNeckMatrices(position, rotation, body);
    // Scale is baked into the inspected asset; applying the old procedural width again would distort the fit.
    return head.parts.map(part => {
        const slot = part.materialSlot, eyes = slot === 'eyes', brow = slot.startsWith('brow'), hair = slot === 'hair' || slot === 'scalp';
        return { skin: part.geometry, boneMatrices: palette, neckBlend: (slot === 'face' || slot === 'scalp') && !!body?.rig, rig: slot === 'face' || slot === 'scalp' ? body?.rig : undefined, position: position.clone(), rotation, expression,
            // A shared matte response keeps the scalp-following cards from reading as glossy plastic strips.
            color: brow ? '#211e1b' : hair ? '#858c93' : eyes ? '#ffffff' : '#e4d6cb', material: brow || hair ? 'hair' : eyes ? 'iris' : 'humanSkin',
            // Keep skin visible beneath the denser brow core so the dark strands retain texture.
            diffuse: part.albedo ? head.images[part.albedo] : undefined, alpha: slot === 'browCore' ? .7 : slot === 'browStrands' ? .9 : 1, alphaCutoff: part.alphaCutoff, doubleSided: part.doubleSided,
            ...(eyes ? { eyeCenters: head.eyeCenters, eyeYaw: clamp(options.eyeYaw ?? 0, -.16, .16), brownIris: true } : {}) };
    });
}
