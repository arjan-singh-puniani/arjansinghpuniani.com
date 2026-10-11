import { Vec3, scaling, multiply, invertRigid, rigidFrame } from '../rendering/Math3D.js';
export const BONE = { pelvis: 0, spine: 1, chest: 2, neck: 3, head: 4, upperArmL: 5, foreArmL: 6, handL: 7, upperArmR: 8, foreArmR: 9, handR: 10, thighL: 11, shinL: 12, thighR: 13, shinR: 14 };
export const BONE_COUNT = 15;
const bind = {
    pelvis: new Vec3(0, .79, 0), spine: new Vec3(0, 1.05, .01), chest: new Vec3(0, 1.34, .015), neck: new Vec3(0, 1.56, .01), head: new Vec3(0, 1.78, .01),
    upperArmL: new Vec3(-.37, 1.34, .015), foreArmL: new Vec3(-.49, 1.12, .01), handL: new Vec3(-.50, .94, .01),
    upperArmR: new Vec3(.37, 1.34, .015), foreArmR: new Vec3(.49, 1.12, .01), handR: new Vec3(.50, .94, .01),
    thighL: new Vec3(-.16, .76, 0), shinL: new Vec3(-.17, .43, .04), footL: new Vec3(-.17, .11, .08),
    thighR: new Vec3(.16, .76, 0), shinR: new Vec3(.17, .43, .04), footR: new Vec3(.17, .11, .08), forward: new Vec3(0, 0, 1)
};
const defs = [
    { joint: 'pelvis', child: 'spine' }, { joint: 'spine', child: 'chest' }, { joint: 'chest', child: 'neck' }, { joint: 'neck', child: 'head' }, { joint: 'head', child: 'neck' },
    { joint: 'upperArmL', child: 'foreArmL' }, { joint: 'foreArmL', child: 'handL' }, { joint: 'handL', child: 'foreArmL' },
    { joint: 'upperArmR', child: 'foreArmR' }, { joint: 'foreArmR', child: 'handR' }, { joint: 'handR', child: 'foreArmR' },
    { joint: 'thighL', child: 'shinL' }, { joint: 'shinL', child: 'footL' }, { joint: 'thighR', child: 'shinR' }, { joint: 'shinR', child: 'footR' }
];
function frameFor(p, def) { const a = p[def.joint], b = p[def.child]; let target = b; if (def.joint === 'head' || def.joint === 'handL' || def.joint === 'handR')
    target = Vec3.add(a, Vec3.sub(a, b)); return rigidFrame(a, target, p.forward); }
const bindInv = defs.map(d => invertRigid(frameFor(bind, d)));
export function skinMatrices(p) { const out = new Float32Array(BONE_COUNT * 16); for (let i = 0; i < BONE_COUNT; i++) {
    const d = defs[i], length = Vec3.sub(p[d.child], p[d.joint]).len(), rest = Vec3.sub(bind[d.child], bind[d.joint]).len();
    const m = multiply(multiply(frameFor(p, d), scaling(new Vec3(1, length / Math.max(.001, rest), 1))), bindInv[i]);
    out.set(m, i * 16);
} return out; }
const build = () => ({ p: [], n: [], bi: [], bw: [] });
function basis(dir) { const y = dir.clone().normalize(); let z = new Vec3(0, 0, 1); z.sub(y.clone().scale(Vec3.dot(z, y))); if (z.len() < .1) {
    z = new Vec3(1, 0, 0);
    z.sub(y.clone().scale(Vec3.dot(z, y)));
} z.normalize(); const x = Vec3.cross(y, z).normalize(); return { x, y, z }; }
function ring(out, c, dir, rx, rz, bones, weights, seg = 10) { const b = basis(dir); for (let i = 0; i < seg; i++) {
    const a = i / seg * Math.PI * 2, rad = b.x.clone().scale(Math.cos(a) * rx).add(b.z.clone().scale(Math.sin(a) * rz));
    const v = Vec3.add(c, rad);
    out.p.push(v.x, v.y, v.z);
    const nn = rad.clone().normalize();
    out.n.push(nn.x, nn.y, nn.z);
    out.bi.push(bones[0], bones[1], 0, 0);
    out.bw.push(weights[0], weights[1], 0, 0);
} }
function connect(out, startVertex, seg = 10) { const p = [], n = [], bi = [], bw = []; for (let i = 0; i < seg; i++) {
    const a = startVertex + i, b = startVertex + (i + 1) % seg, c = startVertex + seg + (i + 1) % seg, d = startVertex + seg + i;
    for (const idx of [a, c, b, a, d, c]) {
        p.push(...out.p.slice(idx * 3, idx * 3 + 3));
        n.push(...out.n.slice(idx * 3, idx * 3 + 3));
        bi.push(...out.bi.slice(idx * 4, idx * 4 + 4));
        bw.push(...out.bw.slice(idx * 4, idx * 4 + 4));
    }
} return { p, n, bi, bw }; }
function addSegment(out, a, b, ra, rb, boneA, boneB, seg = 10) {
    const temp = build();
    // Adjacent segments share the same joint ring plane. Using each segment's
    // own axis left hairline gaps at the waist, knees and elbows after skinning.
    const direction = Vec3.sub(b, a);
    const axis = (bone) => { const d = defs[bone], v = Vec3.sub(bind[d.child], bind[d.joint]).normalize(); return Vec3.dot(v, direction) < 0 ? v.scale(-1) : v; };
    const axisA = axis(boneA), axisB = axis(boneB), mid = Vec3.lerp(a, b, .5);
    ring(temp, a, axisA, ra[0], ra[1], [boneA, boneB], [1, 0], seg);
    ring(temp, mid, Vec3.lerp(axisA, axisB, .5), (ra[0] + rb[0]) * .5, (ra[1] + rb[1]) * .5, [boneA, boneB], [.5, .5], seg);
    ring(temp, b, axisB, rb[0], rb[1], [boneA, boneB], [0, 1], seg);
    const c1 = connect(temp, 0, seg), c2 = connect(temp, seg, seg);
    out.p.push(...c1.p, ...c2.p);
    out.n.push(...c1.n, ...c2.n);
    out.bi.push(...c1.bi, ...c2.bi);
    out.bw.push(...c1.bw, ...c2.bw);
}
function finish(id, b) { return { id, positions: new Float32Array(b.p), normals: new Float32Array(b.n), boneIndices: new Float32Array(b.bi), boneWeights: new Float32Array(b.bw) }; }
const top = build();
addSegment(top, bind.pelvis, bind.spine, [.28, .20], [.31, .21], BONE.pelvis, BONE.spine, 12);
addSegment(top, bind.spine, bind.chest, [.31, .21], [.37, .22], BONE.spine, BONE.chest, 12);
// Softer boutique-life-sim silhouette for the adult women: a modest waist taper and rounded upper torso.
// This is deliberately subtle; character appeal comes from face, hair, clothing and acting rather than exaggerated anatomy.
const feminineTop = build();
addSegment(feminineTop, bind.pelvis, bind.spine, [.305, .215], [.265, .185], BONE.pelvis, BONE.spine, 12);
addSegment(feminineTop, bind.spine, bind.chest, [.265, .185], [.355, .218], BONE.spine, BONE.chest, 12);
// Close the shirt over the shoulders and join sleeves to the moving upper arms.
for (const [garment, width] of [[top, .37], [feminineTop, .355]]) {
    addSegment(garment, bind.chest, new Vec3(0, 1.44, .015), [width, .22], [.125, .115], BONE.chest, BONE.chest, 12);
    for (const side of ['L', 'R']) {
        const a = bind[`upperArm${side}`], b = Vec3.lerp(a, bind[`foreArm${side}`], .6), bone = BONE[`upperArm${side}`];
        addSegment(garment, a, b, [.155, .145], [.145, .13], bone, bone, 10);
    }
}
const pants = build();
addSegment(pants, bind.thighL, bind.shinL, [.120, .105], [.105, .095], BONE.thighL, BONE.shinL, 10);
addSegment(pants, bind.shinL, bind.footL, [.105, .095], [.085, .08], BONE.shinL, BONE.shinL, 10);
addSegment(pants, bind.thighR, bind.shinR, [.120, .105], [.105, .095], BONE.thighR, BONE.shinR, 10);
addSegment(pants, bind.shinR, bind.footR, [.105, .095], [.085, .08], BONE.shinR, BONE.shinR, 10);
// Tennis separates reveal the moving calves, with a tailored short over the upper leg.
const shorts = build();
for (const side of ['L', 'R']) {
    const thigh = bind[`thigh${side}`], shin = bind[`shin${side}`];
    addSegment(shorts, thigh, Vec3.lerp(thigh, shin, .48), [.175, .155], [.16, .145], BONE[`thigh${side}`], BONE[`thigh${side}`], 12);
}
const skirt = build();
addSegment(skirt, new Vec3(0, .93, 0), new Vec3(0, .59, 0), [.295, .22], [.43, .34], BONE.pelvis, BONE.pelvis, 24);
const arms = build();
addSegment(arms, bind.upperArmL, bind.foreArmL, [.105, .095], [.09, .08], BONE.upperArmL, BONE.foreArmL, 10);
addSegment(arms, bind.foreArmL, bind.handL, [.09, .08], [.070, .065], BONE.foreArmL, BONE.handL, 10);
addSegment(arms, bind.upperArmR, bind.foreArmR, [.105, .095], [.09, .08], BONE.upperArmR, BONE.foreArmR, 10);
addSegment(arms, bind.foreArmR, bind.handR, [.09, .08], [.070, .065], BONE.foreArmR, BONE.handR, 10);
// A continuous, densely sampled clothing surface follows the existing spine
// weights. Its profile is apparel, with no changes to the body or contact rig.
const taylorDress = build();
const dressProfile = [[.59, .402, .287], [.64, .399, .283], [.79, .305, .211], [1.05, .245, .175], [1.22, .303, .202], [1.34, .329, .211], [1.405, .205, .143], [1.445, .13, .113]];
const dressAt = (y) => { let i = 0; while (i < dressProfile.length - 2 && y > dressProfile[i + 1][0])
    i++; const a = dressProfile[i], b = dressProfile[i + 1], d = b[0] - a[0], t = clampUnit((y - a[0]) / d); const slope = (j, k) => { if (j === 0 || j === dressProfile.length - 1)
    return 0; const p = dressProfile[j - 1], q = dressProfile[j], r = dressProfile[j + 1], u = (q[k] - p[k]) / (q[0] - p[0]), v = (r[k] - q[k]) / (r[0] - q[0]); return u * v <= 0 ? 0 : 2 * u * v / (u + v); }; return [1, 2].map(k => (2 * t ** 3 - 3 * t * t + 1) * a[k] + (t ** 3 - 2 * t * t + t) * d * slope(i, k) + (-2 * t ** 3 + 3 * t * t) * b[k] + (t ** 3 - t * t) * d * slope(i + 1, k)); };
function clampUnit(t) { return Math.max(0, Math.min(1, t)); }
const dressRings = build();
for (let row = 0; row <= 40; row++) {
    const y = .59 + row / 40 * .855, [rx, rz] = dressAt(y), before = dressAt(Math.max(.59, y - .001)), after = dressAt(Math.min(1.445, y + .001)), dy = Math.min(1.445, y + .001) - Math.max(.59, y - .001), sx = (after[0] - before[0]) / dy, sz = (after[1] - before[1]) / dy;
    const a = y < 1.05 ? BONE.pelvis : BONE.spine, b = y < 1.05 ? BONE.spine : BONE.chest, t = y < 1.05 ? clampUnit((y - .79) / .26) : clampUnit((y - 1.05) / .29);
    for (let i = 0; i < 32; i++) {
        const angle = i / 32 * Math.PI * 2, c = Math.cos(angle), s = Math.sin(angle), n = new Vec3(c / rx, -sx * c * c / rx - sz * s * s / rz, s / rz).normalize();
        dressRings.p.push(c * rx, y, .015 * clampUnit((y - .79) / .55) + s * rz);
        dressRings.n.push(n.x, n.y, n.z);
        dressRings.bi.push(a, b, 0, 0);
        dressRings.bw.push(1 - t, t, 0, 0);
    }
}
for (let row = 0; row < 40; row++) {
    const mesh = connect(dressRings, row * 32, 32);
    taylorDress.p.push(...mesh.p);
    taylorDress.n.push(...mesh.n);
    taylorDress.bi.push(...mesh.bi);
    taylorDress.bw.push(...mesh.bw);
}
// Costume edging samples the same apparel profile and weights. It follows
// shoulder/spine motion instead of floating as a rigid world-space ring.
const taylorNeckline = build(), taylorDressEdging = build();
function dressBand(out, low, high, rows, offset) {
    const rings = build();
    for (let row = 0; row <= rows; row++) {
        const y = low + row / rows * (high - low), r = dressAt(y), rx = r[0] + offset, rz = r[1] + offset, before = dressAt(Math.max(.59, y - .001)), after = dressAt(Math.min(1.445, y + .001)), dy = Math.min(1.445, y + .001) - Math.max(.59, y - .001), sx = (after[0] - before[0]) / dy, sz = (after[1] - before[1]) / dy;
        const a = y < 1.05 ? BONE.pelvis : BONE.spine, b = y < 1.05 ? BONE.spine : BONE.chest, t = y < 1.05 ? clampUnit((y - .79) / .26) : clampUnit((y - 1.05) / .29);
        for (let i = 0; i < 32; i++) {
            const angle = i / 32 * Math.PI * 2, c = Math.cos(angle), s = Math.sin(angle), n = new Vec3(c / rx, -sx * c * c / rx - sz * s * s / rz, s / rz).normalize();
            rings.p.push(c * rx, y, .015 * clampUnit((y - .79) / .55) + s * rz);
            rings.n.push(n.x, n.y, n.z);
            rings.bi.push(a, b, 0, 0);
            rings.bw.push(1 - t, t, 0, 0);
        }
    }
    for (let row = 0; row < rows; row++) {
        const mesh = connect(rings, row * 32, 32);
        out.p.push(...mesh.p);
        out.n.push(...mesh.n);
        out.bi.push(...mesh.bi);
        out.bw.push(...mesh.bw);
    }
}
dressBand(taylorNeckline, 1.36, 1.435, 8, .004);
dressBand(taylorDressEdging, 1.36, 1.370, 2, .007);
dressBand(taylorDressEdging, 1.424, 1.437, 2, .007);
dressBand(taylorDressEdging, .596, .609, 1, .004);
const taylorArms = build();
function shoulderCap(out, c, dir, bone) {
    const frame = basis(dir), rings = build();
    for (let row = 0; row <= 6; row++) {
        const a = row / 6 * Math.PI / 2;
        for (let i = 0; i < 24; i++) {
            const angle = i / 24 * Math.PI * 2, rad = frame.x.clone().scale(Math.cos(angle) * Math.sin(a)).add(frame.z.clone().scale(Math.sin(angle) * Math.sin(a))).sub(frame.y.clone().scale(Math.cos(a))), v = c.clone().add(rad.clone().scale(.106));
            rings.p.push(v.x, v.y, v.z);
            rings.n.push(rad.x, rad.y, rad.z);
            rings.bi.push(bone, 0, 0, 0);
            rings.bw.push(1, 0, 0, 0);
        }
    }
    for (let row = 0; row < 6; row++) {
        const mesh = connect(rings, row * 24, 24);
        for (let i = 0; i < mesh.p.length; i += 9) {
            const u = new Vec3(...mesh.p.slice(i, i + 3)), v = new Vec3(...mesh.p.slice(i + 3, i + 6)), w = new Vec3(...mesh.p.slice(i + 6, i + 9));
            if (Vec3.cross(Vec3.sub(v, u), Vec3.sub(w, u)).len() < 1e-8)
                continue;
            for (const offset of [0, 3, 6]) {
                const vi = (i + offset) / 3;
                out.p.push(...mesh.p.slice(i + offset, i + offset + 3));
                out.n.push(...mesh.n.slice(i + offset, i + offset + 3));
                out.bi.push(...mesh.bi.slice(vi * 4, vi * 4 + 4));
                out.bw.push(...mesh.bw.slice(vi * 4, vi * 4 + 4));
            }
        }
    }
}
for (const side of ['L', 'R']) {
    const shoulder = bind[`upperArm${side}`], elbow = bind[`foreArm${side}`], hand = bind[`hand${side}`];
    addSegment(taylorArms, shoulder, elbow, [.106, .106], [.090, .081], BONE[`upperArm${side}`], BONE[`foreArm${side}`], 24);
    addSegment(taylorArms, elbow, hand, [.090, .081], [.069, .064], BONE[`foreArm${side}`], BONE[`hand${side}`], 24);
    shoulderCap(taylorArms, shoulder, Vec3.sub(elbow, shoulder), BONE[`upperArm${side}`]);
}
const taylorBoots = build(), taylorGloves = build(), taylorLegs = build();
for (const side of ['L', 'R']) {
    const shin = bind[`shin${side}`], foot = bind[`foot${side}`], elbow = bind[`foreArm${side}`], hand = bind[`hand${side}`];
    addSegment(taylorLegs, bind[`thigh${side}`], Vec3.lerp(shin, bind[`thigh${side}`], .20), [.119, .104], [.092, .083], BONE[`thigh${side}`], BONE[`shin${side}`], 16);
    addSegment(taylorBoots, Vec3.lerp(shin, bind[`thigh${side}`], .20), shin, [.108, .102], [.108, .098], BONE[`shin${side}`], BONE[`shin${side}`], 16);
    addSegment(taylorBoots, shin, foot, [.108, .098], [.087, .082], BONE[`shin${side}`], BONE[`shin${side}`], 16);
    addSegment(taylorGloves, Vec3.lerp(elbow, hand, .32), hand, [.097, .087], [.079, .074], BONE[`foreArm${side}`], BONE[`hand${side}`], 16);
}
export const CHARACTER_SKIN = { taylorNeckline: finish('taylor-indigo-neckline-v1', taylorNeckline), taylorDressEdging: finish('taylor-gold-dress-edging-v1', taylorDressEdging), taylorArms: finish('taylor-arms-v2', taylorArms), taylorLegs: finish('taylor-legs-v1', taylorLegs), taylorDress: finish('taylor-dress-v2', taylorDress), taylorBoots: finish('taylor-boots-v1', taylorBoots), taylorGloves: finish('taylor-gloves-v1', taylorGloves), top: finish('char-top-v1', top), feminineTop: finish('char-top-feminine-v1', feminineTop), pants: finish('char-pants-v1', pants), arms: finish('char-arms-v1', arms), shorts: finish('char-shorts-v1', shorts), skirt: finish('char-skirt-v1', skirt) };
