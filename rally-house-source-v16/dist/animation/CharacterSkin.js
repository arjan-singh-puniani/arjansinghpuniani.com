import { Vec3, scaling, multiply, invertRigid, rigidFrame, transformPoint, interpolateRigidFrame } from '../rendering/Math3D.js';
export const BONE = { pelvis: 0, spine: 1, chest: 2, neck: 3, head: 4, upperArmL: 5, foreArmL: 6, handL: 7, upperArmR: 8, foreArmR: 9, handR: 10, thighL: 11, shinL: 12, thighR: 13, shinR: 14, footL: 15, footR: 16, foreArmTwistL: 17, foreArmTwistR: 18 };
export const BONE_COUNT = 19;
/** The mesh and continuous replay use the same landmark-to-skin mapping. */
export function rigFromPose(p, root, yaw, relax = 0) {
    const local = (v) => { const dx = v.x - root.x, dz = v.z - root.z, s = Math.sin(yaw), c = Math.cos(yaw); return new Vec3(c * dx - s * dz, v.y, s * dx + c * dz); };
    const arm = (v, x, y) => Vec3.lerp(local(v), new Vec3(x, y + p.baseY - p.knee, -.015), relax);
    const chest = Vec3.lerp(p.shoulderL, p.shoulderR, .5);
    return { pelvis: local(p.pelvisCenter), spine: local(Vec3.lerp(p.pelvisCenter, p.torsoCenter, .62)), chest: local(chest), neck: local(Vec3.lerp(chest, p.head, .58)), head: local(p.head), upperArmL: local(p.shoulderL), foreArmL: arm(p.elbowL, -.397, 1.095), handL: arm(p.handL, -.36, .89), upperArmR: local(p.shoulderR), foreArmR: arm(p.elbowR, .397, 1.095), handR: arm(p.handR, .36, .89), thighL: local(p.hipL), shinL: local(p.kneeL), footL: local(p.footL), thighR: local(p.hipR), shinR: local(p.kneeR), footR: local(p.footR), forward: new Vec3(Math.sin(p.torsoYaw - yaw), 0, Math.cos(p.torsoYaw - yaw)) };
}
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
    { joint: 'thighL', child: 'shinL' }, { joint: 'shinL', child: 'footL' }, { joint: 'thighR', child: 'shinR' }, { joint: 'shinR', child: 'footR' },
    { joint: 'footL', child: 'footL' }, { joint: 'footR', child: 'footR' },
    { joint: 'foreArmTwistL', child: 'handL' }, { joint: 'foreArmTwistR', child: 'handR' }
];
const jointPoint = (p, j) => j === 'foreArmTwistL' ? p.foreArmTwistL ?? Vec3.lerp(p.foreArmL, p.wristL ?? p.handL, .5) : j === 'foreArmTwistR' ? p.foreArmTwistR ?? Vec3.lerp(p.foreArmR, p.wristR ?? p.handR, .5) : p[j];
const endpoint = (p, d) => (d.joint === 'foreArmL' || d.joint === 'foreArmTwistL') && p.wristL ? p.wristL : (d.joint === 'foreArmR' || d.joint === 'foreArmTwistR') && p.wristR ? p.wristR : jointPoint(p, d.child);
function frameFor(p, def) {
    if (def.joint === 'handL' || def.joint === 'handR') {
        const side = def.joint === 'handL' ? 'L' : 'R', direction = p[`handDirection${side}`];
        if (direction)
            return rigidFrame(p[def.joint], Vec3.add(p[def.joint], direction), p[`handForward${side}`] ?? p.forward);
    }
    if (def.joint === 'head' && p.headUp)
        return rigidFrame(p.head, Vec3.add(p.head, p.headUp), p.headForward ?? p.forward);
    if (def.joint === 'footL' || def.joint === 'footR') {
        const side = def.joint === 'footL' ? 'L' : 'R', a = p[def.joint];
        return rigidFrame(a, Vec3.add(a, p[`footUp${side}`] ?? new Vec3(0, 1, 0)), p[`footForward${side}`] ?? p.forward);
    }
    const a = jointPoint(p, def.joint), b = endpoint(p, def);
    let target = b;
    if (def.joint === 'head' || def.joint === 'handL' || def.joint === 'handR')
        target = Vec3.add(a, Vec3.sub(a, b));
    // A forward-pointing thigh must not roll over when its knee passes hip height.
    const leg = def.joint.startsWith('thigh') || def.joint.startsWith('shin'), forward = leg ? Vec3.cross(new Vec3(-p.forward.z, 0, p.forward.x), Vec3.sub(target, a)) : p.forward;
    return rigidFrame(a, target, def.joint === 'foreArmTwistL' && p.foreArmForwardL ? p.foreArmForwardL : def.joint === 'foreArmTwistR' && p.foreArmForwardR ? p.foreArmForwardR : def.joint === 'head' && p.headForward ? p.headForward : forward.len() > .001 ? forward : p.forward);
}
const bindInv = defs.map(d => invertRigid(frameFor(bind, d)));
const authoredBindInv = new WeakMap();
export function skinMatrices(p, restPose = bind) {
    let inverse = bindInv;
    if (restPose !== bind) {
        inverse = authoredBindInv.get(restPose) ?? defs.map(d => invertRigid(frameFor(restPose, d)));
        authoredBindInv.set(restPose, inverse);
    }
    // The game anchors the palm/grip; an anatomical forearm ends at the wrist.
    if (restPose.wristL && restPose.wristR) {
        p = { ...p };
        for (const side of ['L', 'R']) {
            const i = BONE[`hand${side}`], hand = multiply(frameFor(p, defs[i]), inverse[i]), wrist = transformPoint(hand, restPose[`wrist${side}`]);
            p[`wrist${side}`] = new Vec3(wrist.x, wrist.y, wrist.z);
        }
    }
    const out = new Float32Array(BONE_COUNT * 16);
    for (let i = 0; i < BONE_COUNT; i++) {
        const d = defs[i], length = Vec3.sub(endpoint(p, d), jointPoint(p, d.joint)).len(), rest = Vec3.sub(endpoint(restPose, d), jointPoint(restPose, d.joint)).len(), rigid = d.joint.startsWith('hand') || d.joint.startsWith('foot') || restPose !== bind && d.joint === 'head';
        let frame = frameFor(p, d);
        if (d.joint.startsWith('foreArmTwist') && restPose.wristL) {
            const side = d.joint.endsWith('L') ? 'L' : 'R', proximal = BONE[`foreArm${side}`], palm = BONE[`hand${side}`], source = frameFor(restPose, d), predicted = multiply(multiply(frameFor(p, defs[proximal]), inverse[proximal]), source), palmFrame = multiply(multiply(frameFor(p, defs[palm]), inverse[palm]), source);
            // Palm width defines roll even when a bent wrist aligns its normal with the forearm.
            const axis = Vec3.sub(endpoint(p, d), jointPoint(p, d.joint)).normalize(), forward = Vec3.cross(new Vec3(palmFrame[0], palmFrame[1], palmFrame[2]), axis), target = rigidFrame(jointPoint(p, d.joint), endpoint(p, d), forward.len() > .1 ? forward : new Vec3(palmFrame[8], palmFrame[9], palmFrame[10])), half = interpolateRigidFrame(predicted, target, .5);
            // Share palm roll across the forearm rather than concentrating it at one skin seam.
            frame = rigidFrame(jointPoint(p, d.joint), endpoint(p, d), new Vec3(half[8], half[9], half[10]));
        }
        const m = multiply(multiply(frame, scaling(new Vec3(1, rigid ? 1 : length / Math.max(.001, rest), 1))), inverse[i]);
        out.set(m, i * 16);
    }
    return out;
}
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
    const axis = (bone) => { const d = defs[bone], v = Vec3.sub(endpoint(bind, d), jointPoint(bind, d.joint)).normalize(); return Vec3.dot(v, direction) < 0 ? v.scale(-1) : v; };
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
function radiusAt(points, t) {
    let i = 0;
    while (i < points.length - 2 && t > points[i + 1][0])
        i++;
    const a = points[i], b = points[i + 1], d = b[0] - a[0], u = Math.max(0, Math.min(1, (t - a[0]) / d));
    return [1, 2].map(k => {
        const slope = (j) => { if (j === 0 || j === points.length - 1)
            return 0; const p = points[j - 1], q = points[j], r = points[j + 1], v = (q[k] - p[k]) / (q[0] - p[0]), w = (r[k] - q[k]) / (r[0] - q[0]); return v * w <= 0 ? 0 : 2 * v * w / (v + w); };
        return (2 * u ** 3 - 3 * u * u + 1) * a[k] + (u ** 3 - 2 * u * u + u) * d * slope(i) + (-2 * u ** 3 + 3 * u * u) * b[k] + (u ** 3 - u * u) * d * slope(i + 1);
    });
}
function appendSurface(out, rings, rows, seg) {
    for (let row = 0; row < rows; row++) {
        const mesh = connect(rings, row * seg, seg);
        for (let i = 0; i < mesh.p.length; i += 9) {
            const a = new Vec3(...mesh.p.slice(i, i + 3)), b = new Vec3(...mesh.p.slice(i + 3, i + 6)), c = new Vec3(...mesh.p.slice(i + 6, i + 9));
            if (Vec3.cross(Vec3.sub(b, a), Vec3.sub(c, a)).len() < 1e-8)
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
// Authored cross sections give limbs a continuous taper and softer joint
// transitions. Endpoint planes still match the authoritative bind joints.
function sculptSegment(out, a, b, radii, boneA, boneB, rows = 12, seg = 24, jointBlend = false, weightRange = [0, 1]) {
    const rings = build(), direction = Vec3.sub(b, a), length = direction.len();
    const axis = (bone) => { const d = defs[bone], v = Vec3.sub(endpoint(bind, d), jointPoint(bind, d.joint)).normalize(); return Vec3.dot(v, direction) < 0 ? v.scale(-1) : v; };
    const axisA = axis(boneA), axisB = axis(boneB);
    for (let row = 0; row <= rows; row++) {
        const t = row / rows, center = Vec3.lerp(a, b, t), frame = basis(Vec3.lerp(axisA, axisB, t)), [rx, rz] = radiusAt(radii, t), low = Math.max(0, t - .001), high = Math.min(1, t + .001), before = radiusAt(radii, low), after = radiusAt(radii, high), sx = (after[0] - before[0]) / ((high - low) * length), sz = (after[1] - before[1]) / ((high - low) * length);
        for (let i = 0; i < seg; i++) {
            const angle = i / seg * Math.PI * 2, c = Math.cos(angle), s = Math.sin(angle), p = center.clone().add(frame.x.clone().scale(c * rx)).add(frame.z.clone().scale(s * rz));
            const n = frame.x.clone().scale(c / rx).add(frame.z.clone().scale(s / rz)).add(frame.y.clone().scale(-sx * c * c / rx - sz * s * s / rz)).normalize();
            // Broad child-bone influence bows the whole limb away from its centreline.
            // Club human limbs keep their volume until the short joint transition.
            const skinT = weightRange[0] + t * (weightRange[1] - weightRange[0]), u = jointBlend ? Math.max(0, Math.min(1, (skinT - .75) / .25)) : skinT, w = jointBlend ? u * u * (3 - 2 * u) : u;
            rings.p.push(p.x, p.y, p.z);
            rings.n.push(n.x, n.y, n.z);
            rings.bi.push(boneA, boneB, 0, 0);
            rings.bw.push(1 - w, w, 0, 0);
        }
    }
    appendSurface(out, rings, rows, seg);
}
function handVolume(out, center, frame, radii, bone, rows = 8, seg = 16) {
    const rings = build();
    for (let row = 0; row <= rows; row++) {
        const phi = -Math.PI / 2 + row / rows * Math.PI;
        for (let i = 0; i < seg; i++) {
            const angle = i / seg * Math.PI * 2, x = Math.cos(phi) * Math.cos(angle), y = Math.sin(phi), z = Math.cos(phi) * Math.sin(angle);
            const p = center.clone().add(frame.x.clone().scale(x * radii.x)).add(frame.y.clone().scale(y * radii.y)).add(frame.z.clone().scale(z * radii.z)), n = frame.x.clone().scale(x / radii.x).add(frame.y.clone().scale(y / radii.y)).add(frame.z.clone().scale(z / radii.z)).normalize();
            rings.p.push(p.x, p.y, p.z);
            rings.n.push(n.x, n.y, n.z);
            rings.bi.push(bone, 0, 0, 0);
            rings.bw.push(1, 0, 0, 0);
        }
    }
    appendSurface(out, rings, rows, seg);
}
const top = build();
sculptSegment(top, bind.pelvis, bind.spine, [[0, .28, .20], [.5, .295, .206], [1, .31, .21]], BONE.pelvis, BONE.spine, 12, 20);
sculptSegment(top, bind.spine, bind.chest, [[0, .31, .21], [.55, .355, .220], [1, .37, .22]], BONE.spine, BONE.chest, 12, 20);
// Softer boutique-life-sim silhouette for the adult women: a modest waist taper and rounded upper torso.
// This is deliberately subtle; character appeal comes from face, hair, clothing and acting rather than exaggerated anatomy.
const feminineTop = build();
sculptSegment(feminineTop, bind.pelvis, bind.spine, [[0, .305, .215], [.6, .270, .189], [1, .265, .185]], BONE.pelvis, BONE.spine, 12, 20);
sculptSegment(feminineTop, bind.spine, bind.chest, [[0, .265, .185], [.55, .317, .209], [1, .355, .218]], BONE.spine, BONE.chest, 12, 20);
// Close the shirt over the shoulders and join sleeves to the moving upper arms.
for (const [garment, width] of [[top, .37], [feminineTop, .355]]) {
    sculptSegment(garment, bind.chest, new Vec3(0, 1.44, .015), [[0, width, .22], [.45, width * .74, .175], [1, .125, .115]], BONE.chest, BONE.chest, 8, 20);
    for (const side of ['L', 'R']) {
        const a = bind[`upperArm${side}`], b = Vec3.lerp(a, bind[`foreArm${side}`], .6), bone = BONE[`upperArm${side}`];
        sculptSegment(garment, a, b, [[0, .13, .125], [.25, .15, .138], [.75, .14, .126], [1, .127, .117]], bone, bone, 8, 20);
        shoulderCap(garment, a, Vec3.sub(b, a), bone, .13, .125, 20);
    }
}
const pants = build();
for (const side of ['L', 'R']) {
    sculptSegment(pants, bind[`thigh${side}`], bind[`shin${side}`], [[0, .120, .105], [.3, .125, .108], [.7, .108, .096], [1, .105, .095]], BONE[`thigh${side}`], BONE[`shin${side}`], 12, 20, true);
    sculptSegment(pants, bind[`shin${side}`], bind[`foot${side}`], [[0, .105, .095], [.3, .108, .094], [.7, .092, .082], [1, .085, .08]], BONE[`shin${side}`], BONE[`shin${side}`], 12, 20, true);
}
// Tennis separates reveal the moving calves, with a tailored short over the upper leg.
const shorts = build();
for (const side of ['L', 'R']) {
    const thigh = bind[`thigh${side}`], shin = bind[`shin${side}`];
    addSegment(shorts, thigh, Vec3.lerp(thigh, shin, .48), [.175, .155], [.16, .145], BONE[`thigh${side}`], BONE[`thigh${side}`], 12);
}
const skirt = build();
addSegment(skirt, new Vec3(0, .93, 0), new Vec3(0, .59, 0), [.295, .22], [.43, .34], BONE.pelvis, BONE.pelvis, 24);
const arms = build();
for (const side of ['L', 'R']) {
    sculptSegment(arms, bind[`upperArm${side}`], bind[`foreArm${side}`], [[0, .105, .095], [.3, .108, .096], [.7, .094, .083], [1, .09, .08]], BONE[`upperArm${side}`], BONE[`foreArm${side}`], 12, 20, true);
    sculptSegment(arms, bind[`foreArm${side}`], bind[`hand${side}`], [[0, .09, .08], [.3, .093, .079], [.7, .078, .069], [1, .070, .065]], BONE[`foreArm${side}`], BONE[`hand${side}`], 12, 20, true);
}
// A fitted athletic bodice and a short, lightly pleated skirt. The anatomical
// spine and limb landmarks remain the single source for animation and replay.
const taylorDress = build();
const dressProfile = [[.575, .365, .245], [.65, .349, .238], [.76, .324, .225], [.84, .310, .220], [.92, .273, .195], [1.055, .224, .163], [1.13, .232, .178], [1.22, .271, .220], [1.28, .294, .225], [1.34, .308, .198], [1.38, .269, .164], [1.415, .192, .125], [1.445, .13, .113]].map(([y, x, z]) => [y, x * .84, z * .90]);
const dressAt = (y) => radiusAt(dressProfile, y);
function clampUnit(t) { return Math.max(0, Math.min(1, t)); }
const eased = (t) => { const u = clampUnit(t); return u * u * (3 - 2 * u); };
function dressWeights(y) { return y < 1.055 ? [BONE.pelvis, BONE.spine, eased((y - .89) / .165)] : [BONE.spine, BONE.chest, eased((y - 1.055) / .285)]; }
function dressPoint(y, angle, offset = 0) {
    const [baseX, baseZ] = dressAt(y), pleat = .008 * (1 - eased((y - .575) / .22)) * Math.cos(angle * 12), rx = baseX + pleat + offset, rz = baseZ + pleat * .7 + offset;
    return new Vec3(Math.cos(angle) * rx, y, .015 * clampUnit((y - .79) / .55) + Math.sin(angle) * rz);
}
function dressNormal(y, angle) {
    const low = Math.max(.575, y - .001), high = Math.min(1.445, y + .001), a = dressPoint(y, angle - .001), b = dressPoint(y, angle + .001), c = dressPoint(low, angle), d = dressPoint(high, angle);
    return Vec3.cross(Vec3.sub(d, c), Vec3.sub(b, a)).normalize();
}
const dressRings = build();
for (let row = 0; row <= 40; row++) {
    const y = .575 + row / 40 * .870, [a, b, t] = dressWeights(y);
    for (let i = 0; i < 48; i++) {
        const angle = i / 48 * Math.PI * 2, p = dressPoint(y, angle), n = dressNormal(y, angle);
        dressRings.p.push(p.x, p.y, p.z);
        dressRings.n.push(n.x, n.y, n.z);
        dressRings.bi.push(a, b, 0, 0);
        dressRings.bw.push(1 - t, t, 0, 0);
    }
}
appendSurface(taylorDress, dressRings, 40, 48);
// Costume edging samples the same apparel profile and weights. It follows
// shoulder/spine motion instead of floating as a rigid world-space ring.
const taylorNeckline = build(), taylorDressEdging = build();
function dressBand(out, low, high, rows, offset) {
    const rings = build();
    for (let row = 0; row <= rows; row++) {
        const y = low + row / rows * (high - low), [a, b, t] = dressWeights(y);
        for (let i = 0; i < 48; i++) {
            const angle = i / 48 * Math.PI * 2, p = dressPoint(y, angle, offset), n = dressNormal(y, angle);
            rings.p.push(p.x, p.y, p.z);
            rings.n.push(n.x, n.y, n.z);
            rings.bi.push(a, b, 0, 0);
            rings.bw.push(1 - t, t, 0, 0);
        }
    }
    appendSurface(out, rings, rows, 48);
}
dressBand(taylorNeckline, 1.398, 1.438, 6, .004);
dressBand(taylorNeckline, 1.045, 1.066, 2, .004);
dressBand(taylorDressEdging, 1.395, 1.402, 2, .007);
dressBand(taylorDressEdging, 1.431, 1.440, 2, .007);
dressBand(taylorDressEdging, .580, .591, 2, .004);
// The human shoulder yoke and sportswear sample one contour and weight field.
// The scoop neckline stays sewn to the body in live motion and replay.
const humanProfile = [[.575, .360, .175], [.66, .342, .183], [.78, .312, .198], [.88, .259, .193], [1.02, .197, .153], [1.10, .202, .163], [1.20, .230, .189], [1.27, .254, .202], [1.34, .262, .180], [1.385, .224, .144], [1.42, .153, .104], [1.445, .104, .092]];
const humanNeckY = (angle) => 1.415 - .108 * Math.pow(Math.max(0, Math.sin(angle)), 2) - .028 * Math.pow(Math.max(0, -Math.sin(angle)), 2);
function humanContour(y, angle, offset = 0) {
    const [x, z] = radiusAt(humanProfile, y), pleat = .016 * (1 - eased((y - .575) / .31)) * Math.cos(angle * 12);
    const px = Math.cos(angle) * (x + pleat + offset), front = Math.max(0, Math.sin(angle));
    const clavicle = .004 * Math.exp(-(((y - (1.390 - .18 * Math.abs(px))) / .010) ** 2)) * Math.exp(-(((Math.abs(px) - .090) / .085) ** 2));
    const hollow = .0025 * Math.exp(-((px / .026) ** 2) - (((y - 1.411) / .017) ** 2));
    const chest = .024 * Math.exp(-(((Math.abs(px) - .105) / .090) ** 2) - (((y - 1.245) / .075) ** 2)) - .006 * Math.exp(-((px / .035) ** 2) - (((y - 1.255) / .070) ** 2));
    return new Vec3(px, y, .015 * clampUnit((y - .79) / .55) + Math.sin(angle) * (z + pleat * .65 + offset) + (clavicle - hollow + chest) * front ** 6 + .0022 * Math.exp(-(((y - 1.03) / .05) ** 2)) * Math.sin(angle * 8 + y * 106) * front ** 2);
}
function humanNormal(y, angle) {
    const lo = Math.max(.575, y - .001), hi = Math.min(1.445, y + .001);
    return Vec3.cross(Vec3.sub(humanContour(hi, angle), humanContour(lo, angle)), Vec3.sub(humanContour(y, angle + .001), humanContour(y, angle - .001))).normalize();
}
function humanSurface(out, low, high, rows, offset = 0) {
    const rings = build();
    for (let r = 0; r <= rows; r++)
        for (let i = 0; i < 64; i++) {
            const angle = i / 64 * Math.PI * 2, y = low(angle) + (high(angle) - low(angle)) * r / rows, p = humanContour(y, angle, offset), n = humanNormal(y, angle), [a, b, t] = dressWeights(y);
            // The hem follows the thighs; a pelvis-only skirt cuts through a seated leg.
            const leg = (1 - eased((y - .76) / .14)) * eased((Math.sin(angle) + 1) / 2), right = eased((p.x + .12) / .24);
            rings.p.push(p.x, p.y, p.z);
            rings.n.push(n.x, n.y, n.z);
            rings.bi.push(a, b, BONE.thighL, BONE.thighR);
            rings.bw.push((1 - t) * (1 - leg), t * (1 - leg), leg * (1 - right), leg * right);
        }
    appendSurface(out, rings, rows, 64);
}
const humanDress = build(), humanYoke = build(), humanTrim = build(), humanSeams = build();
humanSurface(humanDress, () => .575, humanNeckY, 32, .003);
humanSurface(humanYoke, a => humanNeckY(a) - .010, () => 1.445, 14, -.001);
humanSurface(humanTrim, a => humanNeckY(a) - .012, humanNeckY, 2, .006);
humanSurface(humanTrim, () => 1.015, () => 1.027, 2, .006);
humanSurface(humanTrim, () => .577, () => .586, 2, .006);
// Princess seams describe a tailored cut with the same deformation as fabric.
for (const side of [-1, 1]) {
    const strip = build();
    for (let r = 0; r <= 24; r++)
        for (let i = 0; i < 2; i++) {
            const y = .885 + r / 24 * .405, angle = Math.PI / 2 + side * (.72 - .12 * Math.sin(r / 24 * Math.PI)) + (i ? 1 : -1) * .012, p = humanContour(y, angle, .006), n = humanNormal(y, angle), [a, b, t] = dressWeights(y);
            strip.p.push(p.x, p.y, p.z);
            strip.n.push(n.x, n.y, n.z);
            strip.bi.push(a, b, 0, 0);
            strip.bw.push(1 - t, t, 0, 0);
        }
    for (let r = 0; r < 24; r++)
        for (const v of [r * 2, r * 2 + 3, r * 2 + 1, r * 2, r * 2 + 2, r * 2 + 3]) {
            humanSeams.p.push(...strip.p.slice(v * 3, v * 3 + 3));
            humanSeams.n.push(...strip.n.slice(v * 3, v * 3 + 3));
            humanSeams.bi.push(...strip.bi.slice(v * 4, v * 4 + 4));
            humanSeams.bw.push(...strip.bw.slice(v * 4, v * 4 + 4));
        }
}
export const HUMAN_TENNIS_SKIN = { dress: finish('taylor-human-tailored-dress-v2', humanDress), yoke: finish('taylor-human-shoulder-yoke-v2', humanYoke), trim: finish('taylor-human-scoop-piping-v2', humanTrim), seams: finish('taylor-human-princess-seams-v1', humanSeams) };
const athleteBodice = build(), athleteSkirt = build(), athleteTop = build(), athleteLegs = build(), athleteCalves = build(), athleteArms = build(), athleteFeminineArms = build(), athleteBand = build(), athleteSocks = build(), athleteFreeHands = build(), athleteShorts = { p: [...shorts.p], n: [...shorts.n], bi: [...shorts.bi], bw: [...shorts.bw] };
humanSurface(athleteBodice, () => .895, humanNeckY, 24, .003);
humanSurface(athleteSkirt, () => .575, () => .905, 16, .003);
sculptSegment(athleteTop, bind.pelvis, bind.spine, [[0, .265, .181], [.55, .244, .166], [1, .249, .172]], BONE.pelvis, BONE.spine, 12, 24);
sculptSegment(athleteTop, bind.spine, bind.chest, [[0, .249, .172], [.58, .300, .197], [1, .329, .204]], BONE.spine, BONE.chest, 12, 24);
sculptSegment(athleteTop, bind.chest, new Vec3(0, 1.445, .015), [[0, .329, .204], [.4, .253, .175], [1, .108, .098]], BONE.chest, BONE.chest, 10, 24);
for (const side of ['L', 'R']) {
    const a = bind[`upperArm${side}`], b = Vec3.lerp(a, bind[`foreArm${side}`], .32), bone = BONE[`upperArm${side}`];
    sculptSegment(athleteTop, a, b, [[0, .094, .088], [.45, .103, .094], [1, .098, .088]], bone, bone, 8, 24);
    shoulderCap(athleteTop, a, Vec3.sub(b, a), bone, .094, .088, 24, .040);
    for (const [out, scale] of [[athleteArms, 1], [athleteFeminineArms, .67]]) {
        const profile = (r) => r.map(([t, x, z]) => [t, x * scale, z * scale]);
        sculptSegment(out, a, bind[`foreArm${side}`], profile([[0, .090, .084], [.28, .101, .089], [.65, .087, .076], [1, .074, .067]]), bone, BONE[`foreArm${side}`], 12, 24, true);
        sculptSegment(out, bind[`foreArm${side}`], bind[`hand${side}`], profile([[0, .074, .067], [.30, .083, .070], [.7, .065, .056], [1, .051, .046]]), BONE[`foreArm${side}`], BONE[`hand${side}`], 12, 24, true);
        shoulderCap(out, a, Vec3.sub(b, a), bone, .090 * scale, .084 * scale, 24, .04);
    }
    sculptSegment(athleteLegs, bind[`thigh${side}`], bind[`shin${side}`], [[0, .131, .118], [.22, .142, .125], [.65, .113, .101], [1, .087, .078]], BONE[`thigh${side}`], BONE[`shin${side}`], 16, 24, true);
    sculptSegment(athleteCalves, bind[`shin${side}`], bind[`foot${side}`], [[0, .087, .078], [.28, .103, .088], [.5, .088, .075], [.78, .065, .057], [1, .052, .047]], BONE[`shin${side}`], BONE[`shin${side}`], 16, 24);
    const elbow = bind[`foreArm${side}`], hand = bind[`hand${side}`], shin = bind[`shin${side}`], foot = bind[`foot${side}`], handBone = BONE[`hand${side}`], frame = basis(Vec3.sub(hand, elbow)), sign = side === 'L' ? -1 : 1;
    sculptSegment(athleteBand, Vec3.lerp(elbow, hand, .82), Vec3.lerp(elbow, hand, .96), [[0, .063, .056], [1, .056, .050]], BONE[`foreArm${side}`], handBone, 4, 24, true, [.82, .96]);
    sculptSegment(athleteSocks, Vec3.lerp(shin, foot, .84), foot, [[0, .064, .057], [.5, .058, .052], [1, .055, .050]], BONE[`shin${side}`], BONE[`shin${side}`], 6, 24);
    const point = (x, y, z) => hand.clone().add(frame.x.clone().scale(x)).add(frame.y.clone().scale(y)).add(frame.z.clone().scale(z));
    handVolume(athleteFreeHands, point(0, .020, .002), frame, new Vec3(.058, .047, .030), handBone);
    for (const [i, x] of [-.036, -.012, .012, .035].entries()) {
        const length = [.043, .057, .052, .038][i], points = [point(x, .055, .004), point(x, .055 + length * .55, .011), point(x, .055 + length, .026)];
        for (let j = 0; j < 2; j++) {
            const p = points[j], q = points[j + 1];
            handVolume(athleteFreeHands, Vec3.lerp(p, q, .5), basis(Vec3.sub(q, p)), new Vec3(.012, Vec3.sub(q, p).len() * .5 + .005, .012), handBone, 6, 10);
        }
    }
    const thumbA = point(sign * .046, .002, .017), thumbB = point(sign * .069, .040, .031);
    handVolume(athleteFreeHands, Vec3.lerp(thumbA, thumbB, .5), basis(Vec3.sub(thumbB, thumbA)), new Vec3(.015, Vec3.sub(thumbB, thumbA).len() * .5 + .007, .015), handBone, 6, 12);
}
// Share the bend across both sides of a joint, rather than turning the thigh's
// last ring entirely onto the shin and folding an open cavity into the knee.
function balanceJoint(out, parent, joint) {
    const a = jointPoint(bind, defs[joint].joint), b = endpoint(bind, defs[joint]), axis = Vec3.sub(b, a), length = axis.len();
    axis.scale(1 / length);
    for (let i = 0; i < out.p.length / 3; i++) {
        const k = i * 4;
        if (out.bi[k] === parent && out.bi[k + 1] === joint) {
            const w = out.bw[k + 1] * .5;
            out.bw[k] = 1 - w;
            out.bw[k + 1] = w;
        }
        else if (out.bi[k] === joint) {
            const p = new Vec3(...out.p.slice(i * 3, i * 3 + 3)), t = Vec3.dot(Vec3.sub(p, a), axis) / length;
            if (t >= -.001 && t < .25) {
                const w = .5 * (1 - eased(t / .25));
                out.bi[k] = parent;
                out.bi[k + 1] = joint;
                out.bw[k] = w;
                out.bw[k + 1] = 1 - w;
            }
        }
    }
}
for (const side of ['L', 'R']) {
    balanceJoint(athleteFeminineArms, BONE[`upperArm${side}`], BONE[`foreArm${side}`]);
    balanceJoint(athleteArms, BONE[`upperArm${side}`], BONE[`foreArm${side}`]);
    balanceJoint(athleteLegs, BONE[`thigh${side}`], BONE[`shin${side}`]);
    balanceJoint(athleteCalves, BONE[`thigh${side}`], BONE[`shin${side}`]);
}
sculptSegment(athleteShorts, new Vec3(0, .74, 0), new Vec3(0, .825, 0), [[0, .323, .170], [.7, .287, .175], [1, .269, .177]], BONE.pelvis, BONE.pelvis, 8, 32);
export const ATHLETE_WARDROBE = { bodice: finish('athlete-fitted-bodice-v1', athleteBodice), skirt: finish('athlete-pleated-skirt-v1', athleteSkirt), top: finish('athlete-performance-shirt-v2', athleteTop), legs: finish('athlete-shaped-legs-v1', athleteLegs), calves: finish('athlete-shaped-calves-v1', athleteCalves), arms: finish('athlete-shaped-arms-v1', athleteArms), feminineArms: finish('athlete-feminine-arms-v1', athleteFeminineArms), shorts: finish('athlete-performance-shorts-v1', athleteShorts), wristband: finish('athlete-performance-wristband-v1', athleteBand), socks: finish('athlete-court-socks-v1', athleteSocks), freeHands: finish('athlete-relaxed-hands-v1', athleteFreeHands) };
// A small embroidered crescent recreates the reference's central gold detail.
// It samples the same surface and weights as the tunic, including in replay.
const taylorTunicMark = build();
const markPoint = (i, side) => { const t = i / 12, y = 1.115 - t * .050, x = .011 * Math.sin(t * Math.PI) - .004 + side * .003, [rx, rz] = dressAt(y), z = .015 * clampUnit((y - .79) / .55) + rz * Math.sqrt(1 - (x / rx) ** 2) + .003; return new Vec3(x, y, z); };
for (let i = 0; i < 12; i++)
    for (const index of [[i, -1], [i + 1, -1], [i + 1, 1], [i, -1], [i + 1, 1], [i, 1]]) {
        const p = markPoint(index[0], index[1]), [a, b, t] = dressWeights(p.y);
        taylorTunicMark.p.push(p.x, p.y, p.z);
        taylorTunicMark.n.push(0, 0, 1);
        taylorTunicMark.bi.push(a, b, 0, 0);
        taylorTunicMark.bw.push(1 - t, t, 0, 0);
    }
const taylorArms = build();
function shoulderCap(out, c, dir, bone, rx = .078, rz = .070, seg = 24, depth = rx) {
    const frame = basis(dir), rings = build();
    for (let row = 0; row <= 8; row++) {
        const a = row / 8 * Math.PI / 2;
        for (let i = 0; i < seg; i++) {
            const angle = i / seg * Math.PI * 2, x = Math.cos(angle) * Math.sin(a), y = -Math.cos(a), z = Math.sin(angle) * Math.sin(a), v = c.clone().add(frame.x.clone().scale(x * rx)).add(frame.y.clone().scale(y * depth)).add(frame.z.clone().scale(z * rz)), n = frame.x.clone().scale(x / rx).add(frame.y.clone().scale(y / depth)).add(frame.z.clone().scale(z / rz)).normalize();
            rings.p.push(v.x, v.y, v.z);
            rings.n.push(n.x, n.y, n.z);
            rings.bi.push(bone, 0, 0, 0);
            rings.bw.push(1, 0, 0, 0);
        }
    }
    appendSurface(out, rings, 8, seg);
}
const adultRadii = (profile, scale) => profile.map(([t, x, z]) => [t, x * scale, z * scale]);
for (const side of ['L', 'R']) {
    const shoulder = bind[`upperArm${side}`], elbow = bind[`foreArm${side}`], hand = bind[`hand${side}`];
    sculptSegment(taylorArms, shoulder, elbow, adultRadii([[0, .095, .088], [.22, .097, .086], [.55, .082, .073], [1, .066, .060]], .84), BONE[`upperArm${side}`], BONE[`foreArm${side}`], 12, 24, true);
    sculptSegment(taylorArms, elbow, hand, adultRadii([[0, .066, .060], [.3, .073, .061], [.7, .058, .050], [1, .048, .043]], .84), BONE[`foreArm${side}`], BONE[`hand${side}`], 12, 24, true);
    shoulderCap(taylorArms, shoulder, Vec3.sub(elbow, shoulder), BONE[`upperArm${side}`], .095 * .84, .088 * .84, 24, .046);
}
const taylorBoots = build(), taylorGloves = build(), taylorLegs = build(), taylorHands = build(), taylorSocks = build(), taylorWristband = build();
for (const side of ['L', 'R']) {
    const shin = bind[`shin${side}`], foot = bind[`foot${side}`], elbow = bind[`foreArm${side}`], hand = bind[`hand${side}`];
    sculptSegment(taylorLegs, bind[`thigh${side}`], shin, adultRadii([[0, .124, .112], [.22, .135, .118], [.65, .105, .092], [1, .082, .072]], .92), BONE[`thigh${side}`], BONE[`shin${side}`], 16, 24, true);
    sculptSegment(taylorBoots, shin, foot, [[0, .082 * .92, .072 * .92], [.28, .098 * .86, .082 * .86], [.5, .083 * .86, .070 * .86], [.78, .063 * .86, .054 * .86], [1, .052 * .86, .047 * .86]], BONE[`shin${side}`], BONE[`shin${side}`], 16);
    sculptSegment(taylorGloves, Vec3.lerp(elbow, hand, .32), hand, adultRadii([[0, .077, .066], [.4, .069, .060], [1, .052, .047]], .84), BONE[`foreArm${side}`], BONE[`hand${side}`], 8, 24, true, [.32, 1]);
    // Human ankle socks follow the actual calf radius and shin bone. The wrist
    // band retains the underlying forearm's global weight field at its edges.
    sculptSegment(taylorSocks, Vec3.lerp(shin, foot, .84), foot, [[0, .052, .046], [.5, .048, .043], [1, .046, .042]], BONE[`shin${side}`], BONE[`shin${side}`], 6, 24);
    sculptSegment(taylorWristband, Vec3.lerp(elbow, hand, .82), Vec3.lerp(elbow, hand, .96), [[0, .048, .042], [1, .044, .039]], BONE[`foreArm${side}`], BONE[`hand${side}`], 4, 24, true, [.82, .96]);
    const bone = BONE[`hand${side}`], frame = basis(Vec3.sub(hand, elbow)), sign = side === 'L' ? -1 : 1;
    const point = (x, y, z) => hand.clone().add(frame.x.clone().scale(x)).add(frame.y.clone().scale(y)).add(frame.z.clone().scale(z));
    handVolume(taylorHands, point(0, .017, .003), frame, new Vec3(.062, .073, .043), bone);
    for (const [i, x] of [-.036, -.012, .012, .036].entries()) {
        const length = [.027, .033, .032, .025][i], a = point(x, .046, .009), b = point(x, .046 + length, .018);
        handVolume(taylorHands, Vec3.lerp(a, b, .5), basis(Vec3.sub(b, a)), new Vec3(.017, Vec3.sub(b, a).len() * .5 + .008, .018), bone, 6, 12);
    }
    const thumbA = point(sign * .042, .006, .027), thumbB = point(sign * .065, .043, .040);
    handVolume(taylorHands, Vec3.lerp(thumbA, thumbB, .5), basis(Vec3.sub(thumbB, thumbA)), new Vec3(.019, Vec3.sub(thumbB, thumbA).len() * .5 + .014, .019), bone, 6, 12);
}
export const CHARACTER_SKIN = { taylorSocks: finish("taylor-human-ankle-socks-v1", taylorSocks), taylorWristband: finish("taylor-human-wristband-v1", taylorWristband), taylorTunicMark: finish('taylor-embroidered-crescent-v1', taylorTunicMark), taylorHands: finish('taylor-rounded-reference-hands-v2', taylorHands), taylorNeckline: finish('taylor-athletic-trim-v4', taylorNeckline), taylorDressEdging: finish('taylor-gold-dress-edging-v5', taylorDressEdging), taylorArms: finish('taylor-adult-arms-v5', taylorArms), taylorLegs: finish('taylor-adult-thighs-v4', taylorLegs), taylorDress: finish('taylor-adult-tennis-dress-v9', taylorDress), taylorBoots: finish('taylor-adult-continuous-calves-v5', taylorBoots), taylorGloves: finish('taylor-adult-registered-gloves-v4', taylorGloves), top: finish('char-top-v1', top), feminineTop: finish('char-top-feminine-v1', feminineTop), pants: finish('char-pants-v1', pants), arms: finish('char-arms-v1', arms), shorts: finish('char-shorts-v1', shorts), skirt: finish('char-skirt-v1', skirt) };
