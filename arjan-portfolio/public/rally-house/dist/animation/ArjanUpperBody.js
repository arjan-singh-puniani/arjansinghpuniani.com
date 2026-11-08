import { Vec3, smoothstep } from '../rendering/Math3D.js';
import { BONE, rigFromPose, skinMatrices } from './CharacterSkin.js';
import { advanceAuthoredHands } from './AuthoredAthlete.js';
import { inspectCharacterAsset } from './CharacterAssetIntake.js';
let body;
const root = new URL('../../assets/characters/arjan/', import.meta.url);
/** Verify the small, texture-free body before opening the club, using the existing startup recovery on failure. */
export async function loadArjanUpperBody() {
    const get = async (name) => { const r = await fetch(new URL(name, root)); if (!r.ok)
        throw Error(`Arjan body unavailable: ${name}`); const bytes = await r.arrayBuffer(); if (bytes.byteLength > 1024 * 1024)
        throw Error('Arjan body exceeds its runtime budget'); return bytes; };
    const [metadata, bytes] = await Promise.all([get('provenance.json'), get('upper-body.glb')]);
    const meta = JSON.parse(new TextDecoder().decode(metadata));
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
    if (hash !== meta.sha256)
        throw Error('Arjan body checksum failed');
    const result = inspectCharacterAsset(bytes, [], meta), slots = new Set(result.primitives.map(p => p.materialSlot));
    if (result.primitives.length !== 2 || !slots.has('skin') || !slots.has('kit') || result.primitives.some(p => p.albedo || p.alphaCutoff !== undefined || p.geometry.morphs && (p.materialSlot !== 'skin' || p.geometry.morphs.slice(0, 4).some(channel => channel.some(value => value !== 0)))))
        throw Error('Unsupported Arjan body parts');
    const hasGrip = result.primitives.some(part => part.geometry.morphs);
    if (hasGrip !== Boolean(meta.gripSign) || meta.gripSign && ![meta.gripSign.L, meta.gripSign.R].every(sign => sign === -1 || sign === 1))
        throw Error('Invalid Arjan grip registration');
    const values = {};
    for (const key of [...Object.keys(BONE), 'forward', 'wristL', 'wristR', 'handDirectionL', 'handDirectionR', 'handForwardL', 'handForwardR', 'foreArmForwardL', 'foreArmForwardR']) {
        const v = meta.bind?.[key];
        if (!Array.isArray(v) || v.length !== 3 || !v.every(n => Number.isFinite(n) && Math.abs(n) < 4))
            throw Error('Invalid Arjan body bind pose');
        values[key] = new Vec3(...v);
    }
    for (const side of ['L', 'R'])
        for (const [a, b] of [[`upperArm${side}`, `foreArm${side}`], [`foreArm${side}`, `wrist${side}`]]) {
            const length = Vec3.sub(values[a], values[b]).len();
            if (length < .1 || length > .8)
                throw Error('Invalid Arjan body arm length');
        }
    const spineRatio = (values.spine.y - values.pelvis.y) / (values.chest.y - values.pelvis.y), spineDepth = values.spine.z - (values.pelvis.z + (values.chest.z - values.pelvis.z) * spineRatio);
    const neckRatio = (values.neck.y - values.chest.y) / (values.head.y - values.chest.y), neckDepth = values.neck.z - (values.chest.z + (values.head.z - values.chest.z) * neckRatio);
    if (!(spineRatio > 0 && spineRatio < 1 && neckRatio > 0 && neckRatio < 1) || ![spineDepth, neckDepth].every(n => Number.isFinite(n) && Math.abs(n) < .15))
        throw Error('Invalid Arjan body registration');
    values.headUp = new Vec3(0, 1, 0);
    // Install atomically: a failed or incomplete download cannot replace an already verified body.
    body = { parts: result.primitives, bind: values, spineRatio, spineDepth, neckRatio, neckDepth, gripSign: meta.gripSign };
}
// Angle the longer fingers down the hip and turn the open toss palm up.
const handStyle = { restFingers: new Vec3(-.32, -.87, .38), tossFingers: new Vec3(-.42, .08, .90), tossNormal: new Vec3(0, 1, 0) };
export function advanceArjanHands(p, position, yaw, previous, dt, serving, hugWeight) {
    if (!body?.gripSign)
        return;
    let style = handStyle;
    if (serving) {
        const arm = Vec3.sub(p.handL, p.elbowL).normalize(), c = Math.cos(yaw), s = Math.sin(yaw);
        const localArm = new Vec3(c * arm.x - s * arm.z, arm.y, s * arm.x + c * arm.z);
        // Unfold the cupped toss hand as it rises, instead of bending the raised wrist at a right angle.
        const reach = smoothstep(-.1, .35, p.handL.y - p.shoulderL.y);
        style = { ...handStyle, tossFingers: Vec3.lerp(handStyle.tossFingers, localArm, reach), tossNormal: Vec3.lerp(handStyle.tossNormal, new Vec3(-1, 0, 0), reach) };
    }
    return advanceAuthoredHands(p, position, yaw, previous, dt, serving, hugWeight, body.gripSign, style);
}
export const hasArjanHands = () => Boolean(body?.gripSign);
export function arjanUpperBodyMeshes(p, position, yaw, look, serving = false) {
    if (!body)
        return;
    const rig = rigFromPose(p, position, yaw);
    // Preserve the source spine/neck registration while consuming the unchanged gameplay landmarks.
    rig.spine = Vec3.lerp(rig.pelvis, rig.chest, body.spineRatio).add(rig.forward.clone().scale(body.spineDepth));
    rig.neck = Vec3.lerp(rig.chest, rig.head, body.neckRatio).add(rig.forward.clone().scale(body.neckDepth));
    if (body.gripSign) {
        const hands = p.handDirectionL && p.handDirectionR && p.handForwardL && p.handForwardR ? p : advanceArjanHands(p, position, yaw, undefined, 0, serving, 0);
        for (const side of ['L', 'R']) {
            // The grip anchor sits outside the palm; bring the relaxed skin back to the waist.
            rig[`hand${side}`].x += (side === 'L' ? 1 : -1) * .072 * p.handRestWeight;
            rig[`handDirection${side}`] = hands[`handDirection${side}`];
            rig[`handForward${side}`] = hands[`handForward${side}`];
            rig[`foreArmForward${side}`] = hands[`handForward${side}`];
        }
    }
    const bones = skinMatrices(rig, body.bind, p.sp);
    // The tossing palm stays open while the dominant fingers close around the racket.
    const relaxed = .20 + .14 * p.handRestWeight;
    const handGrip = [serving ? .22 : Math.max(relaxed, p.handGripL), Math.max(relaxed, p.handGripR)];
    return body.parts.map(part => ({ handGrip: part.geometry.morphs ? handGrip : undefined, skin: part.geometry, boneMatrices: bones, rig: { bind: body.bind, pose: rig }, poseRig: true, position: new Vec3(position.x, 0, position.z), rotation: new Vec3(0, yaw, 0), material: part.materialSlot === 'kit' ? 'performanceKnit' : 'humanSkin', color: part.materialSlot === 'kit' ? look.shirt : look.skin, doubleSided: part.doubleSided }));
}
