import { Vec3, identity, smoothstep } from '../rendering/Math3D.js';
export const TAYLOR_PALETTE = { indigo: '#2531a1', fur: '#ffe052', gold: '#e9bd46', ink: '#22245e', white: '#fffaf1' };
// Original geometry authored from the supplied visual reference. Each rigid
// piece uses a single identity skin bone, so it reuses the existing renderer
// without new shader branches, textures, or changes to contact-space joints.
const rigidBones = new Float32Array(15 * 16);
for (let i = 0; i < 15; i++)
    rigidBones.set(identity(), i * 16);
function geometry(id, emit, smooth = false) {
    const positions = [], normals = [], indices = [], weights = [];
    const tri = (a, b, c) => { const u = Vec3.sub(new Vec3(...b), new Vec3(...a)), v = Vec3.sub(new Vec3(...c), new Vec3(...a)), n = Vec3.cross(u, v); if (n.len() < 1e-8)
        return; n.normalize(); for (const p of [a, b, c]) {
        positions.push(...p);
        normals.push(n.x, n.y, n.z);
        indices.push(0, 0, 0, 0);
        weights.push(1, 0, 0, 0);
    } };
    emit(tri);
    if (smooth) {
        const sums = new Map();
        const key = (i) => positions.slice(i, i + 3).map(n => n.toFixed(6)).join(',');
        for (let i = 0; i < positions.length; i += 3) {
            const k = key(i), n = sums.get(k) ?? new Vec3();
            n.add(new Vec3(...normals.slice(i, i + 3)));
            sums.set(k, n);
        }
        for (let i = 0; i < positions.length; i += 3) {
            const n = sums.get(key(i)).clone().normalize();
            normals.splice(i, 3, n.x, n.y, n.z);
        }
    }
    return { id, positions: new Float32Array(positions), normals: new Float32Array(normals), boneIndices: new Float32Array(indices), boneWeights: new Float32Array(weights) };
}
const hood = geometry('taylor-sculpted-bob-v1', tri => {
    // Three shaped rings form a blunt bob with an open face, rather than balls
    // intersecting the cheeks. A separate crown closes the upper silhouette.
    const rings = [[-.31, .32, .21], [-.22, .365, .25], [.09, .365, .265], [.23, .31, .245]];
    const at = (r, i) => { const [y, rx, rz] = rings[r], a = .85 + i / 32 * (Math.PI * 2 - 1.70); return [Math.sin(a) * rx, y, Math.cos(a) * rz]; };
    for (let r = 0; r < rings.length - 1; r++)
        for (let i = 0; i < 32; i++) {
            const a = at(r, i), b = at(r, i + 1), c = at(r + 1, i + 1), d = at(r + 1, i);
            tri(a, b, c);
            tri(a, c, d);
        }
    for (let i = 0; i < 32; i++) {
        const a = at(0, i), b = at(0, i + 1);
        tri([0, -.31, -.04], b, a);
    }
    const crown = (r, i) => { const a = i / 40 * Math.PI * 2, t = r / 10 * 1.26; return [.365 * Math.sin(t) * Math.sin(a), .34 * Math.cos(t), .27 * Math.sin(t) * Math.cos(a)]; };
    for (let r = 0; r < 10; r++)
        for (let i = 0; i < 40; i++) {
            const a = crown(r, i), b = crown(r, i + 1), c = crown(r + 1, i + 1), d = crown(r + 1, i);
            tri(a, c, b);
            tri(a, d, c);
        }
}, true);
const ears = geometry('taylor-pointed-ears-v1', tri => {
    for (const side of [-1, 1]) {
        const a = [side * .34, .19, .10], b = [side * .105, .26, .10], c = [side * .25, .77, .04];
        const back = (p) => [p[0], p[1], p[2] - .17];
        const aa = back(a), bb = back(b), cc = back(c);
        if (side === 1) {
            tri(a, c, b);
            tri(aa, bb, cc);
        }
        else {
            tri(a, b, c);
            tri(aa, cc, bb);
        }
        for (const [u, v] of [[a, b], [b, c], [c, a]]) {
            const x = back(u), y = back(v);
            if (side === 1) {
                tri(u, y, x);
                tri(u, v, y);
            }
            else {
                tri(u, x, y);
                tri(u, y, v);
            }
        }
    }
});
const earInlays = geometry('taylor-ear-gold-inlays-v1', tri => {
    for (const side of [-1, 1]) {
        const a = [side * .294, .29, .108], b = [side * .15, .31, .108], c = [side * .247, .66, .066];
        if (side === 1)
            tri(a, c, b);
        else
            tri(a, b, c);
    }
});
const stripes = geometry('taylor-bob-gold-stripes-v1', tri => {
    for (const side of [-1, 1])
        for (const y of [-.20, -.07]) {
            const a = [side * .278, y + .063, .177], b = [side * .354, y + .020, .104], c = [side * .347, y - .035, .101], d = [side * .28, y + .006, .18];
            if (side === 1) {
                tri(a, c, b);
                tri(a, d, c);
            }
            else {
                tri(a, b, c);
                tri(a, c, d);
            }
        }
});
function almond(id, width, top, bottom) {
    return geometry(id, tri => { const center = [0, 0, .011]; const pt = (a) => { const x = Math.cos(a) * width / 2, s = Math.sin(a), y = s * (s > 0 ? top : bottom); return [x, y, .011 * (1 - (x / (width / 2)) ** 2)]; }; for (let i = 0; i < 32; i++)
        tri(center, pt(i / 32 * Math.PI * 2), pt((i + 1) / 32 * Math.PI * 2)); });
}
const eyeOutline = almond('taylor-almond-outline-v1', .249, .038, .059), eyeWhite = almond('taylor-almond-white-v1', .221, .025, .044), eyelid = almond('taylor-heavy-lid-v1', .239, .080, .002);
export const TAYLOR_GEOMETRY = { hood, ears, earInlays, stripes, eyeOutline, eyeWhite, eyelid };
export function taylorHeadMeshes(head, yaw, tilt, face, time) {
    const out = [], right = new Vec3(Math.cos(yaw), 0, -Math.sin(yaw)), forward = new Vec3(Math.sin(yaw), 0, Math.cos(yaw));
    const point = (x, y, z) => head.clone().add(right.clone().scale(x * Math.cos(tilt) - y * Math.sin(tilt))).add(new Vec3(0, x * Math.sin(tilt) + y * Math.cos(tilt), 0)).add(forward.clone().scale(z));
    const add = (kind, x, y, z, scale, color, material = 'matte', unlit = false) => out.push({ kind, position: point(x, y, z), rotation: new Vec3(0, yaw, tilt), scale: new Vec3(...scale), color, material, unlit });
    const piece = (skin, color, x = 0, y = 0, z = 0, scale = [1, 1, 1], unlit = false) => out.push({ skin, boneMatrices: rigidBones, position: point(x, y, z), rotation: new Vec3(0, yaw, tilt), scale: new Vec3(...scale), color, material: 'matte', unlit });
    add('sphere', 0, -.012, .025, [.665, .605, .475], TAYLOR_PALETTE.fur, 'skin');
    piece(hood, TAYLOR_PALETTE.indigo);
    piece(ears, TAYLOR_PALETTE.indigo);
    piece(earInlays, TAYLOR_PALETTE.fur);
    piece(stripes, TAYLOR_PALETTE.fur);
    // Forehead cobra jewel: gold crest, engraved indigo inset, and a small nose.
    add('sphere', 0, .30, .224, [.095, .135, .048], TAYLOR_PALETTE.gold, 'metal');
    add('cone', 0, .235, .244, [.049, .12, .027], TAYLOR_PALETTE.gold, 'metal');
    add('sphere', 0, .32, .252, [.035, .022, .015], TAYLOR_PALETTE.ink, 'matte', true);
    const phase = (time + .47) % 3.75, blink = phase < .10 ? 1 - smoothstep(0, .10, phase) : 0, open = Math.max(.07, 1 - blink - face.squint * .45);
    for (const side of [-1, 1]) {
        // Each eye has its own normal-aligned frame; it stays on the cheek as the
        // character turns, rather than floating on a world-facing plane.
        const eyeYaw = yaw + side * .20;
        const start = out.length;
        piece(eyeOutline, TAYLOR_PALETTE.ink, side * .152, .03, .224, [1, open, 1], true);
        piece(eyeWhite, TAYLOR_PALETTE.white, side * .152, .03, .231, [1, open, 1], true);
        add('sphere', side * .135, .018, .253, [.078, .074 * open, .020], TAYLOR_PALETTE.ink, 'matte', true);
        add('sphere', side * .128, .033, .266, [.015, .018 * open, .007], '#ffffff', 'matte', true);
        piece(eyelid, '#d5b84e', side * .152, .033 + face.browRaise * .010, .266, [1, 1, 1]);
        for (let i = start; i < out.length; i++)
            out[i].rotation.y = eyeYaw;
        add('roundBox', side * .25, .021, .218, [.035, .014, .011], TAYLOR_PALETTE.ink, 'matte', true);
    }
    // The tiny chevron mouth follows the existing emotions, without overriding
    // gesture or social systems. No sexual poses or gameplay timing changes.
    const lift = face.smile * .016;
    for (const side of [-1, 1]) {
        const a = point(side * .044, -.087 + lift, .252), b = point(0, -.069, .256), delta = Vec3.sub(b, a);
        out.push({ kind: 'cylinder', position: Vec3.lerp(a, b, .5), rotation: new Vec3(0, yaw, -Math.atan2(delta.x, delta.y)), scale: new Vec3(.009, delta.len(), .009), color: TAYLOR_PALETTE.ink, unlit: true });
    }
    if (face.mouthOpen > .18)
        add('sphere', 0, -.096, .26, [.043, .025 + face.mouthOpen * .018, .010], TAYLOR_PALETTE.ink, 'matte', true);
    return out;
}
export function taylorTailMeshes(pelvis, yaw, time, speed) {
    const out = [], right = new Vec3(Math.cos(yaw), 0, -Math.sin(yaw)), forward = new Vec3(Math.sin(yaw), 0, Math.cos(yaw));
    const sway = Math.sin(time * 2.1) * (.025 + Math.min(.04, speed * .015));
    const point = (t) => pelvis.clone().add(right.clone().scale(.50 * Math.sin(t * 1.3) + sway * t)).add(forward.clone().scale(-.16 - .27 * Math.sin(t * Math.PI / 2))).add(new Vec3(0, -.065 - .17 * Math.sin(t * Math.PI), 0));
    for (let i = 0; i < 10; i++) {
        const a = point(i / 10), b = point((i + 1) / 10), d = Vec3.sub(b, a), radius = .068 - i * .0016;
        const color = i % 4 < 2 ? TAYLOR_PALETTE.indigo : TAYLOR_PALETTE.fur;
        out.push({ kind: 'cylinder', position: Vec3.lerp(a, b, .5), rotation: new Vec3(Math.atan2(Math.hypot(d.x, d.z), d.y), Math.atan2(d.x, d.z), 0), scale: new Vec3(radius, d.len() + .009, radius), color, material: 'skin' });
    }
    out.push({ kind: 'sphere', position: point(1), scale: new Vec3(.053, .053, .053), color: TAYLOR_PALETTE.fur, material: 'skin' });
    return out;
}
