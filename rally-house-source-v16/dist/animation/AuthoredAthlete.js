import { Vec3, rigidFrame, interpolateRigidFrame, compose, transformPoint, smoothstep } from '../rendering/Math3D.js';
import { inspectCharacterAsset } from './CharacterAssetIntake.js';
import { BONE, rigFromPose, skinMatrices } from './CharacterSkin.js';
let athlete;
const root = new URL('../../assets/characters/taylor/', import.meta.url);
const digest = async (bytes) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
/** Decode and verify the complete character before opening the club. Failed assets use startup recovery. */
export async function loadAuthoredAthlete() {
    const get = async (name) => { const r = await fetch(new URL(name, root)); if (!r.ok)
        throw Error(`Character asset unavailable: ${name}`); const bytes = await r.arrayBuffer(); if (bytes.byteLength > 8 * 1024 * 1024)
        throw Error('Character asset exceeds its runtime budget'); return bytes; };
    const [metadata, bytes] = await Promise.all([get('provenance.json'), get('taylor.glb')]);
    const meta = JSON.parse(new TextDecoder().decode(metadata));
    if (await digest(bytes) !== meta.sha256)
        throw Error('Character geometry checksum failed');
    const result = inspectCharacterAsset(bytes, [], meta), bind = {};
    for (const key of [...Object.keys(BONE), 'forward', 'handDirectionL', 'handDirectionR', 'handForwardL', 'handForwardR', 'foreArmForwardL', 'foreArmForwardR', 'wristL', 'wristR']) {
        const value = meta.bind[key];
        if (!Array.isArray(value) || value.length !== 3 || !value.every(n => Number.isFinite(n) && Math.abs(n) < 4))
            throw Error('Invalid character bind pose');
        bind[key] = new Vec3(...value);
    }
    const spineRatio = (bind.spine.y - bind.pelvis.y) / (bind.chest.y - bind.pelvis.y), spineDepth = bind.spine.z - (bind.pelvis.z + (bind.chest.z - bind.pelvis.z) * spineRatio);
    if (!Number.isFinite(spineRatio) || spineRatio <= 0 || spineRatio >= 1 || !Number.isFinite(spineDepth) || Math.abs(spineDepth) > .15)
        throw Error('Invalid character spine registration');
    const neckRatio = (bind.neck.y - bind.chest.y) / (bind.head.y - bind.chest.y), neckDepth = bind.neck.z - (bind.chest.z + (bind.head.z - bind.chest.z) * neckRatio);
    if (!Number.isFinite(neckRatio) || neckRatio <= 0 || neckRatio >= 1 || !Number.isFinite(neckDepth) || Math.abs(neckDepth) > .15)
        throw Error('Invalid character neck registration');
    const armLengths = { upperArm: Vec3.sub(bind.upperArmL, bind.foreArmL).len(), forearm: Vec3.sub(bind.foreArmL, bind.handL).len() };
    if (!Object.values(armLengths).every(n => Number.isFinite(n) && n > .2 && n < .6))
        throw Error('Invalid character arm lengths');
    const images = new Map();
    await Promise.all([...new Set(result.primitives.map(p => p.albedo).filter((s) => !!s))].map(async (name) => {
        const data = await get(name);
        if (await digest(data) !== meta.textures[name])
            throw Error(`Character texture checksum failed: ${name}`);
        const url = URL.createObjectURL(new Blob([data], { type: 'image/webp' }));
        try {
            const image = new Image();
            image.src = url;
            await image.decode();
            if (image.naturalWidth > 2048 || image.naturalHeight > 2048)
                throw Error('Character texture exceeds its resolution budget');
            images.set(name, image);
        }
        finally {
            URL.revokeObjectURL(url);
        }
    }));
    if (!meta.gripSign || !['L', 'R'].every(s => Math.abs(meta.gripSign[s]) === 1))
        throw Error('Invalid character grip frame');
    const eyePart = result.primitives.find(p => p.materialSlot === 'eyes');
    if (!eyePart)
        throw Error('Missing character eyes');
    // Rotate each authored eyeball around its own centre before applying the head transform.
    const eyes = eyePart.geometry.positions, eyeCenters = new Float32Array(6);
    for (const side of [0, 1]) {
        const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < eyes.length; i += 3) {
            if ((eyes[i] < 0 ? 0 : 1) !== side)
                continue;
            for (let axis = 0; axis < 3; axis++) {
                lo[axis] = Math.min(lo[axis], eyes[i + axis]);
                hi[axis] = Math.max(hi[axis], eyes[i + axis]);
            }
        }
        for (let axis = 0; axis < 3; axis++)
            eyeCenters[side * 3 + axis] = (lo[axis] + hi[axis]) / 2;
    }
    if (!eyeCenters.every(Number.isFinite))
        throw Error('Invalid character eye geometry');
    bind.headUp = new Vec3(0, 1, 0);
    athlete = { parts: result.primitives, bind: bind, images, gripSign: meta.gripSign, eyeCenters, neckRatio, neckDepth, spineRatio, spineDepth, armLengths };
}
export const authoredArmLengths = () => athlete?.armLengths;
/** Advance once with the actor; rendering and replay only consume the result. */
export function advanceAuthoredHands(p, position, yaw, previous, dt) {
    if (!athlete)
        return;
    const rig = rigFromPose(p, position, yaw), result = {};
    const racketGrip = [p.handGripL, p.handRacketWeight], origin = new Vec3(), racket = compose(origin, p.racketRot), c = Math.cos(yaw), s = Math.sin(yaw);
    const local = (v) => new Vec3(c * v.x - s * v.z, v.y, s * v.x + c * v.z);
    for (const [i, side] of ['L', 'R'].entries()) {
        const direction = Vec3.sub(rig[`hand${side}`], rig[`foreArm${side}`]), pole = Vec3.cross(Vec3.sub(rig[`foreArm${side}`], rig[`upperArm${side}`]), direction).scale(side === 'L' ? 1 : -1);
        let frame = rigidFrame(origin, direction, pole.len() > .001 ? pole : rig.forward), weight = Math.max(0, 1 - p.handRestWeight - p.handLapWeight - racketGrip[i]);
        const add = (target, amount) => { if (amount > 0) {
            frame = interpolateRigidFrame(frame, target, amount / (weight + amount));
            weight += amount;
        } };
        add(rigidFrame(origin, new Vec3(0, -1, .1), new Vec3(side === 'L' ? 1 : -1, 0, 0)), p.handRestWeight);
        add(rigidFrame(origin, new Vec3(0, 0, 1), new Vec3(0, 1, 0)), p.handLapWeight);
        if (racketGrip[i] > .0001) {
            const axis = local(Vec3.sub(p.racketHandleTop, p.racketGrip)).normalize().scale(athlete.gripSign[side]), width = transformPoint(racket, new Vec3((side === 'L' ? 1 : -1) * Math.cos(.8), 0, Math.sin(.8))), fingers = local(new Vec3(width.x, width.y, width.z));
            fingers.sub(axis.clone().scale(Vec3.dot(fingers, axis))).normalize();
            add(rigidFrame(origin, fingers, Vec3.cross(axis, fingers).normalize()), racketGrip[i]);
        }
        if (previous)
            frame = interpolateRigidFrame(rigidFrame(origin, previous[`handDirection${side}`], previous[`handForward${side}`]), frame, 1 - Math.exp(-12 * dt));
        result[`handDirection${side}`] = new Vec3(frame[4], frame[5], frame[6]);
        result[`handForward${side}`] = new Vec3(frame[8], frame[9], frame[10]);
    }
    return result;
}
export function authoredAthleteMeshes(p, position, yaw, feet, time) {
    if (!athlete)
        return;
    const rig = rigFromPose(p, position, yaw);
    // The compact rig's internal ratios distort this authored torso; retain its source landmarks.
    rig.spine = Vec3.lerp(rig.pelvis, rig.chest, athlete.spineRatio).add(rig.forward.clone().scale(athlete.spineDepth));
    rig.neck = Vec3.lerp(rig.chest, rig.head, athlete.neckRatio).add(rig.forward.clone().scale(athlete.neckDepth));
    rig.headUp = new Vec3(0, 1, 0);
    rig.headForward = new Vec3(Math.sin(p.headYaw - yaw), 0, Math.cos(p.headYaw - yaw));
    const hands = p.handDirectionL && p.handDirectionR && p.handForwardL && p.handForwardR ? p : advanceAuthoredHands(p, position, yaw, undefined, 0);
    for (const side of ['L', 'R']) {
        rig[`handDirection${side}`] = hands[`handDirection${side}`];
        rig[`handForward${side}`] = hands[`handForward${side}`];
        rig[`foreArmForward${side}`] = hands[`handForward${side}`];
    }
    const handGrip = [p.handGripL, p.handGripR];
    for (const [i, side] of ['L', 'R'].entries()) {
        const f = feet[i], angle = f.yaw - yaw;
        rig[`footForward${side}`] = new Vec3(Math.sin(angle) * Math.cos(f.pitch), -Math.sin(f.pitch), Math.cos(angle) * Math.cos(f.pitch));
        rig[`footUp${side}`] = new Vec3(Math.sin(angle) * Math.sin(f.pitch), Math.cos(f.pitch), Math.cos(angle) * Math.sin(f.pitch));
    }
    const bones = skinMatrices(rig, athlete.bind), phase = (time + .47) % 3.75, blink = phase < .05 ? smoothstep(0, .05, phase) : 1 - smoothstep(.05, .18, phase);
    const expression = [p.face.smile, p.face.mouthOpen, Math.min(1, blink + p.face.squint * .35), p.face.browRaise];
    // Thigh pitch alone also occurs during a serve; retain the seated transition gate.
    // shortcut: one seated corrective; use authored cloth poses for twisting or contact folds.
    const thighPitch = (side) => { const axis = Vec3.sub(rig[`shin${side}`], rig[`thigh${side}`]); return axis.z / Math.max(axis.len(), .00001); };
    const drape = [(p.seatedWeight ?? 0) * smoothstep(.5, .99, (thighPitch('L') + thighPitch('R')) / 2), 0, 0, 0];
    const sourceRig = { bind: athlete.bind, pose: rig };
    return athlete.parts.map(part => ({ poseRig: true, eyeCenters: part.materialSlot === 'eyes' ? athlete.eyeCenters : undefined, eyeYaw: part.materialSlot === 'eyes' ? p.eyeYaw ?? 0 : 0, skirt: part.materialSlot === 'skirt', rig: sourceRig, expression: part.materialSlot === 'skirt' ? drape : expression, handGrip, skin: part.geometry, boneMatrices: bones, position: new Vec3(position.x, 0, position.z), rotation: new Vec3(0, yaw, 0), color: '#ffffff', material: part.materialSlot === 'skin' ? 'humanSkin' : part.materialSlot === 'eyes' ? 'iris' : part.materialSlot === 'teeth' ? 'ceramic' : ['hair', 'brows', 'lashes'].includes(part.materialSlot) ? 'groomedHair' : 'performanceKnit', diffuse: part.albedo ? athlete.images.get(part.albedo) : undefined, alphaCutoff: part.alphaCutoff, doubleSided: part.doubleSided }));
}
