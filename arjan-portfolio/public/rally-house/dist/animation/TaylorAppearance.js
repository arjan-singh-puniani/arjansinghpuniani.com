import { Vec3, identity, smoothstep } from '../rendering/Math3D.js';
export const TAYLOR_PALETTE = { indigo: '#202d91', fur: '#ffe000', gold: '#e8b947', ink: '#202050', white: '#fffdf2' };
const rigidBones = new Float32Array(15 * 16);
for (let i = 0; i < 15; i++)
    rigidBones.set(identity(), i * 16);
function geometry(id, emit, smooth = false) {
    const positions = [], normals = [], indices = [], weights = [];
    emit((a, b, c) => { const n = Vec3.cross(Vec3.sub(new Vec3(...b), new Vec3(...a)), Vec3.sub(new Vec3(...c), new Vec3(...a))); if (n.len() < 1e-8)
        return; n.normalize(); for (const p of [a, b, c]) {
        positions.push(...p);
        normals.push(n.x, n.y, n.z);
        indices.push(0, 0, 0, 0);
        weights.push(1, 0, 0, 0);
    } });
    if (smooth) {
        const sums = new Map(), key = (i) => positions.slice(i, i + 3).map(n => n.toFixed(6)).join(',');
        for (let i = 0; i < positions.length; i += 3) {
            const k = key(i), n = sums.get(k) ?? new Vec3();
            n.add(new Vec3(...normals.slice(i, i + 3)));
            sums.set(k, n);
        }
        for (let i = 0; i < positions.length; i += 3) {
            const n = sums.get(key(i)).clone().normalize();
            normals[i] = n.x;
            normals[i + 1] = n.y;
            normals[i + 2] = n.z;
        }
    }
    return { id, positions: new Float32Array(positions), normals: new Float32Array(normals), boneIndices: new Float32Array(indices), boneWeights: new Float32Array(weights) };
}
function footwear(sole) {
    return geometry(`taylor-contoured-${sole ? 'sole' : 'trainer'}-v1`, tri => {
        const point = (t, angle) => { const wave = t === 0 || t === 1 ? 0 : Math.max(0, Math.sin(Math.PI * t)), width = .098 * Math.pow(wave, .52) * (.9 + .1 * t), height = sole ? .012 * Math.pow(wave, .3) : Math.pow(wave, .5) * (.047 + .036 * Math.exp(-(((t - .30) / .23) ** 2))), bottom = sole ? -.105 : -.095, c = Math.abs(Math.cos(angle)) < 1e-12 ? 0 : Math.cos(angle), s = Math.abs(Math.sin(angle)) < 1e-12 ? 0 : Math.sin(angle); return [c * width, bottom + height * (1 + s), -.18 + .39 * t]; };
        for (let row = 0; row < 24; row++)
            for (let i = 0; i < 24; i++) {
                const a = point(row / 24, i / 24 * Math.PI * 2), b = point(row / 24, (i + 1) / 24 * Math.PI * 2), c = point((row + 1) / 24, (i + 1) / 24 * Math.PI * 2), d = point((row + 1) / 24, i / 24 * Math.PI * 2);
                tri(a, b, c);
                tri(a, c, d);
            }
    }, true);
}
export const TAYLOR_FOOTWEAR = { upper: footwear(false), sole: footwear(true) };
const trainerSurface = (t, x, lift = 0) => {
    const wave = Math.max(0, Math.sin(Math.PI * t)), width = .098 * Math.pow(wave, .52) * (.9 + .1 * t), height = Math.pow(wave, .5) * (.047 + .036 * Math.exp(-(((t - .30) / .23) ** 2)));
    return [x, -.095 + height * (1 + Math.sqrt(Math.max(0, 1 - (x / width) ** 2))) + lift, -.18 + .39 * t];
};
const laces = geometry('athlete-court-trainer-laces-v1', tri => {
    for (let row = 0; row < 6; row++) {
        const t = .33 + row * .055, width = .036 - row * .0018;
        for (let col = 0; col < 12; col++) {
            const at = (j, side) => trainerSurface(t + (j / 12 - .5) * .018 + side * .0035, (-1 + j / 6) * width, .002);
            const a = at(col, -1), b = at(col + 1, -1), c = at(col + 1, 1), d = at(col, 1);
            tri(a, c, b);
            tri(a, d, c);
        }
    }
}, true);
const heelPanel = geometry('athlete-court-trainer-heel-panel-v1', tri => {
    for (const sign of [-1, 1])
        for (let i = 0; i < 12; i++) {
            const at = (j, side) => { const t = .12 + j / 12 * .16, width = .098 * Math.pow(Math.sin(Math.PI * t), .52) * (.9 + .1 * t); return trainerSurface(t, sign * (.70 + side * .04) * width, .002); };
            const a = at(i, -1), b = at(i + 1, -1), c = at(i + 1, 1), d = at(i, 1);
            if (sign > 0) {
                tri(a, b, c);
                tri(a, c, d);
            }
            else {
                tri(a, c, b);
                tri(a, d, c);
            }
        }
}, true);
export const ATHLETE_TRAINER_DETAIL = { laces, heelPanel };
export function taylorFootMeshes(foot, pitch, yaw, upper = TAYLOR_PALETTE.indigo, sole = '#e4c67a', detailed = false) {
    return [
        { skin: TAYLOR_FOOTWEAR.upper, boneMatrices: rigidBones, position: foot.clone(), rotation: new Vec3(pitch, yaw, 0), color: upper, material: detailed ? 'performanceKnit' : 'fabric' },
        { skin: TAYLOR_FOOTWEAR.sole, boneMatrices: rigidBones, position: foot.clone(), rotation: new Vec3(pitch, yaw, 0), color: sole, material: 'fabric' },
        ...detailed ? [{ skin: laces, boneMatrices: rigidBones, position: foot.clone(), rotation: new Vec3(pitch, yaw, 0), color: '#ecebe4', material: 'fabric' }, { skin: heelPanel, boneMatrices: rigidBones, position: foot.clone(), rotation: new Vec3(pitch, yaw, 0), color: '#84949a', material: 'fabric' }] : [],
    ];
}
// Monotone cubic radius interpolation avoids pinched chins and bulges between
// authored cross sections. The same profile projects the face graphics onto
// the skin surface, giving them actual cheek curvature rather than flat cards.
function profile(points, y) {
    let i = 0;
    while (i < points.length - 2 && y > points[i + 1][0])
        i++;
    const a = points[i], b = points[i + 1], t = Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0])));
    return [1, 2].map(k => {
        const slope = (j) => { if (j === 0 || j === points.length - 1)
            return 0; const p = points[j - 1], q = points[j], r = points[j + 1], u = (q[k] - p[k]) / (q[0] - p[0]), v = (r[k] - q[k]) / (r[0] - q[0]); return u * v <= 0 ? 0 : 2 * u * v / (u + v); };
        const d = b[0] - a[0];
        return (2 * t ** 3 - 3 * t * t + 1) * a[k] + (t ** 3 - 2 * t * t + t) * d * slope(i) + (-2 * t ** 3 + 3 * t * t) * b[k] + (t ** 3 - t * t) * d * slope(i + 1);
    });
}
const faceProfile = [[-.277, 0, 0], [-.270, .15, .118], [-.248, .279, .197], [-.211, .365, .240], [-.12, .424, .269], [.015, .412, .276], [.115, .394, .266], [.22, .33, .233], [.292, .18, .135], [.315, 0, 0]];
const surfaceZ = (x, y, depth) => { const [rx, rz] = profile(faceProfile, y); return rz * Math.sqrt(Math.max(.001, 1 - (x / Math.max(.001, rx)) ** 2)) + depth; };
const face = geometry('taylor-reference-cheeks-v3', tri => {
    const at = (r, i) => { const y = -.277 + r / 36 * .592, [rx, rz] = profile(faceProfile, y), a = i / 48 * Math.PI * 2; return [Math.sin(a) * rx, y, Math.cos(a) * rz]; };
    for (let r = 0; r < 36; r++)
        for (let i = 0; i < 48; i++) {
            const a = at(r, i), b = at(r, i + 1), c = at(r + 1, i + 1), d = at(r + 1, i);
            tri(a, b, c);
            tri(a, c, d);
        }
}, true);
const bobProfile = [[-.35, .29, .205], [-.325, .365, .248], [-.245, .432, .292], [-.12, .449, .303], [.055, .445, .298], [.17, .414, .281], [.23, .353, .261]];
const hoodOpening = (y) => .71 + .40 * Math.sin((y + .35) / .58 * Math.PI);
const hoodBase = geometry('taylor-cheek-framed-headdress-v4', tri => {
    const at = (r, i) => { const y = -.35 + r / 15 * .58, [rx, rz] = profile(bobProfile, y), opening = hoodOpening(y), a = opening + i / 48 * (Math.PI * 2 - opening * 2); return [Math.sin(a) * rx, y, Math.cos(a) * rz]; };
    for (let r = 0; r < 15; r++)
        for (let i = 0; i < 48; i++) {
            const a = at(r, i), b = at(r, i + 1), c = at(r + 1, i + 1), d = at(r + 1, i);
            tri(a, b, c);
            tri(a, c, d);
        }
    // Continue the lower bob around the neck instead of leaving an open gap
    // beneath the shortened chin. Outer vertices share the hood's sampled edge.
    for (const side of [-1, 1]) {
        const front = (r, i) => { const edge = at(r, 0), t = i / 6, y = edge[1], innerX = .050 + r / 5 * .020, innerZ = .10 + r / 5 * .07; return [side * (innerX + (edge[0] - innerX) * t), y, innerZ + (edge[2] - innerZ) * t + .014 * Math.sin(t * Math.PI)]; };
        for (let r = 0; r < 5; r++)
            for (let i = 0; i < 6; i++) {
                const a = front(r, i), b = front(r, i + 1), c = front(r + 1, i + 1), d = front(r + 1, i);
                if (side === 1) {
                    tri(a, b, c);
                    tri(a, c, d);
                }
                else {
                    tri(a, c, b);
                    tri(a, d, c);
                }
            }
    }
    for (let i = 0; i < 48; i++)
        tri([0, -.35, -.04], at(0, i + 1), at(0, i));
    const bottom = Math.acos(.23 / .34), rad = Math.sin(bottom), angles = Array.from({ length: 65 }, (_, i) => i <= 48 ? .71 + i / 48 * (Math.PI * 2 - 1.42) : Math.PI * 2 - .71 + (i - 48) / 16 * 1.42);
    const atCrown = (r, i) => { const a = angles[i], t = r / 12 * bottom; return [.353 / rad * Math.sin(t) * Math.sin(a), .34 * Math.cos(t), .261 / rad * Math.sin(t) * Math.cos(a)]; };
    for (let r = 0; r < 12; r++)
        for (let i = 0; i < 64; i++) {
            const a = atCrown(r, i), b = atCrown(r, i + 1), c = atCrown(r + 1, i + 1), d = atCrown(r + 1, i);
            tri(a, c, b);
            tri(a, d, c);
        }
}, true);
const hairline = geometry('taylor-authored-hairline-v2', tri => {
    const xs = [-.35, -.29, -.21, -.12, -.035, 0, .035, .12, .21, .29, .35], ys = [.12, .18, .225, .237, .20, .235, .20, .237, .225, .18, .12];
    const pt = (i, upper) => { const x = xs[i], y = upper ? .285 + Math.sqrt(Math.max(0, 1 - (x / .37) ** 2)) * .022 : ys[i]; return [x, y, surfaceZ(x, Math.min(y, .284), .016)]; };
    for (let i = 0; i < xs.length - 1; i++) {
        const a = pt(i, false), b = pt(i + 1, false), c = pt(i + 1, true), d = pt(i, true);
        tri(a, b, c);
        tri(a, c, d);
    }
}, true);
const cheekOutline = [[-.30, .12], [-.245, .245], [-.205, .350], [-.15, .320], [-.08, .405], [-.015, .360], [.055, .405], [.14, .338], [.22, .290]];
const cheekInner = (y) => { let i = 0; while (i < cheekOutline.length - 2 && y > cheekOutline[i + 1][0])
    i++; const a = cheekOutline[i], b = cheekOutline[i + 1]; return a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]); };
const cheekFrame = geometry('taylor-zigzag-cheek-frame-v1', tri => {
    const outline = cheekOutline, inner = cheekInner;
    for (const side of [-1, 1])
        for (let row = 0; row < outline.length - 1; row++)
            for (let j = 0; j < 8; j++) {
                const at = (upper, k) => { const y = outline[row + (upper ? 1 : 0)][0], t = k / 8, [rx, rz] = profile(bobProfile, y), x = inner(y) + (rx * .993 - inner(y)) * t, z = Math.max(surfaceZ(x, Math.max(-.265, y), .030), rz * Math.sqrt(Math.max(.001, 1 - (x / rx) ** 2)) + .014); return [side * x, y, z]; };
                const a = at(false, j), b = at(false, j + 1), c = at(true, j + 1), d = at(true, j);
                if (side === 1) {
                    tri(a, b, c);
                    tri(a, c, d);
                }
                else {
                    tri(a, c, b);
                    tri(a, d, c);
                }
            }
});
const hood = { id: 'taylor-continuous-zigzag-nemes-v5', positions: new Float32Array([...hoodBase.positions, ...cheekFrame.positions]), normals: new Float32Array([...hoodBase.normals, ...cheekFrame.normals]), boneIndices: new Float32Array([...hoodBase.boneIndices, ...cheekFrame.boneIndices]), boneWeights: new Float32Array([...hoodBase.boneWeights, ...cheekFrame.boneWeights]) };
// Triangular prisms retain the reference's tall ears. The broad front
// planes, gold inlays and rear planes have their own normals and thickness.
const ears = geometry('taylor-inward-reference-ears-v3', tri => {
    for (const side of [-1, 1]) {
        const a = [side * .385, .205, .083], b = [side * .025, .285, .083], c = [side * .068, .805, .025];
        const back = (p) => [p[0], p[1], p[2] - .125], aa = back(a), bb = back(b), cc = back(c);
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
const earInlays = geometry('taylor-inward-gold-ear-insets-v3', tri => {
    for (const side of [-1, 1]) {
        const a = [side * .326, .294, .080], b = [side * .071, .322, .080], c = [side * .088, .686, .037];
        if (side === 1)
            tri(a, c, b);
        else
            tri(a, b, c);
    }
});
const stripes = geometry('taylor-clipped-surface-gold-nemes-bands-v6', tri => {
    // Clip every gold triangle against the actual cheek mesh. This prevents a
    // band bridging the concave sawtooth edge and floating over the gold face.
    const supported = (a, b, c) => {
        const p = cheekFrame.positions;
        for (let i = 0; i < p.length; i += 9) {
            const clip = [[p[i], p[i + 1], p[i + 2]], [p[i + 3], p[i + 4], p[i + 5]], [p[i + 6], p[i + 7], p[i + 8]]];
            if (Math.max(a[0], b[0], c[0]) < Math.min(...clip.map(v => v[0])) || Math.min(a[0], b[0], c[0]) > Math.max(...clip.map(v => v[0])) || Math.max(a[1], b[1], c[1]) < Math.min(...clip.map(v => v[1])) || Math.min(a[1], b[1], c[1]) > Math.max(...clip.map(v => v[1])))
                continue;
            const [u, v, w] = clip, det = (v[1] - w[1]) * (u[0] - w[0]) + (w[0] - v[0]) * (u[1] - w[1]);
            if (Math.abs(det) < 1e-9)
                continue;
            const orient = Math.sign((v[0] - u[0]) * (w[1] - u[1]) - (v[1] - u[1]) * (w[0] - u[0]));
            let poly = [a, b, c];
            for (let edge = 0; edge < 3 && poly.length; edge++) {
                const h = clip[edge], k = clip[(edge + 1) % 3], distance = (q) => orient * ((k[0] - h[0]) * (q[1] - h[1]) - (k[1] - h[1]) * (q[0] - h[0])), next = [];
                for (let j = 0; j < poly.length; j++) {
                    const q = poly[j], r = poly[(j + 1) % poly.length], dq = distance(q), dr = distance(r), inside = dq >= -1e-10;
                    if (inside)
                        next.push(q);
                    if (inside !== (dr >= -1e-10)) {
                        const t = dq / (dq - dr);
                        next.push([q[0] + (r[0] - q[0]) * t, q[1] + (r[1] - q[1]) * t, 0]);
                    }
                }
                poly = next;
            }
            const project = (q) => { const aa = ((v[1] - w[1]) * (q[0] - w[0]) + (w[0] - v[0]) * (q[1] - w[1])) / det, bb = ((w[1] - u[1]) * (q[0] - w[0]) + (u[0] - w[0]) * (q[1] - w[1])) / det; return [q[0], q[1], aa * u[2] + bb * v[2] + (1 - aa - bb) * w[2] + .005]; };
            for (let j = 1; j < poly.length - 1; j++)
                tri(project(poly[0]), project(poly[j]), project(poly[j + 1]));
        }
    };
    for (const side of [-1, 1])
        for (const base of [-.195, -.065, .095]) {
            const at = (row, col) => { const t = col / 8, y = base + row / 2 * .060 - t * .042, [rx] = profile(bobProfile, y), x = side * (cheekInner(y) + (rx * .993 - cheekInner(y)) * t); return [x, y, 0]; };
            for (let row = 0; row < 2; row++)
                for (let i = 0; i < 8; i++) {
                    const a = at(row, i), b = at(row, i + 1), c = at(row + 1, i + 1), d = at(row + 1, i);
                    if (side === 1) {
                        supported(a, b, c);
                        supported(a, c, d);
                    }
                    else {
                        supported(a, c, b);
                        supported(a, d, c);
                    }
                }
        }
});
// Subdivide graphic patches radially. A single triangle fan would cut below
// the convex face between its vertices and leave gold specks in the eye white.
function curvedPatch(tri, cx, cy, width, top, bottom, depth, rows = 6, sectors = 40) {
    const at = (r, i) => { const t = r / rows, a = i / sectors * Math.PI * 2, x = cx + Math.cos(a) * width / 2 * t, v = Math.sin(a), y = cy + v * (v > 0 ? top : bottom) * t; return [x, y, surfaceZ(x, y, depth)]; };
    for (let r = 0; r < rows; r++)
        for (let i = 0; i < sectors; i++) {
            const a = at(r, i), b = at(r, i + 1), c = at(r + 1, i + 1), d = at(r + 1, i);
            tri(a, d, c);
            tri(a, c, b);
        }
}
// Eye borders are authored as a nearly straight upper lid and an almond
// lower arc. Pupils are intersected with the white aperture, so their border
// stays clean under close inspection rather than painting over the eyeliner.
function eyeBounds(x, side, width, top, bottom) {
    const u = (x - side * .183) / (width / 2), arc = Math.sqrt(Math.max(0, 1 - u * u));
    return [.085 - bottom * arc, .085 + top * (1 - u * u)];
}
function eyes(id, width, top, bottom, depth, pupil = false) {
    return geometry(id, tri => {
        for (const side of [-1, 1]) {
            const at = (col, row) => {
                const u = -1 + col / 40 * 2, x = side * (pupil ? .128 : .183) + u * width / 2;
                let low, high;
                if (pupil) {
                    const arc = Math.sqrt(Math.max(0, 1 - u * u)), white = eyeBounds(x, side, .281, .014, .059);
                    low = Math.max(.085 - bottom * arc, white[0] + .001);
                    high = Math.min(.085 + top * arc, white[1] - .001);
                }
                else
                    [low, high] = eyeBounds(x, side, width, top, bottom);
                const y = low + (Math.max(low, high) - low) * row / 6;
                return [x, y, surfaceZ(x, y, depth)];
            };
            for (let col = 0; col < 40; col++)
                for (let row = 0; row < 6; row++) {
                    const a = at(col, row), b = at(col + 1, row), c = at(col + 1, row + 1), d = at(col, row + 1);
                    tri(a, b, c);
                    tri(a, c, d);
                }
        }
    }, true);
}
const eyeOutline = eyes('taylor-almond-eye-ink-v4', .305, .020, .071, .009), eyeWhite = eyes('taylor-almond-eye-white-v4', .281, .014, .059, .012), pupils = eyes('taylor-clipped-half-lidded-pupils-v4', .124, .024, .064, .015, true);
const eyelid = geometry('taylor-curved-upper-lids-v3', tri => { for (const side of [-1, 1])
    curvedPatch(tri, side * .183, .099, .306, .105, .008, .019); }, true);
const eyeGlints = geometry('taylor-small-eye-catchlights-v4', tri => {
    for (const side of [-1, 1]) {
        const x = side * .132, y = .074;
        curvedPatch(tri, x, y, .011, .005, .006, .027, 3, 16);
        curvedPatch(tri, side * .112, .039, .005, .002, .002, .027, 3, 16);
    }
});
const eyeliner = geometry('taylor-swept-eyeliner-v1', tri => {
    for (const side of [-1, 1]) {
        const at = (i, upper) => { const u = -1 + i / 24 * 2, x = side * .183 + u * .151, y = .099 - .008 * Math.sqrt(Math.max(0, 1 - u * u)) + (upper ? .004 : -.003); return [x, y, surfaceZ(x, y, .024)]; };
        for (let i = 0; i < 24; i++) {
            const a = at(i, false), b = at(i + 1, false), c = at(i + 1, true), d = at(i, true);
            tri(a, b, c);
            tri(a, c, d);
        }
    }
});
const lashes = geometry('taylor-swept-lash-corners-v3', tri => {
    for (const side of [-1, 1]) {
        const p = (x, y) => [side * x, y, surfaceZ(side * x, y, .024)];
        const a = p(.322, .091), b = p(.361, .119), c = p(.338, .086);
        if (side === 1)
            tri(a, c, b);
        else
            tri(a, b, c);
    }
});
function mouth(id, width, curve, asymmetry = 0) {
    return geometry(id, tri => {
        const pt = (i, upper) => { const x = -width + i / 16 * width * 2, t = x / width, y = -.024 + curve * (1 - t * t) + asymmetry * t + (upper ? .0045 : -.0045); return [x, y, surfaceZ(x, y, .010)]; };
        for (let i = 0; i < 16; i++) {
            const a = pt(i, false), b = pt(i + 1, false), c = pt(i + 1, true), d = pt(i, true);
            tri(a, b, c);
            tri(a, c, d);
        }
    });
}
const frown = mouth('taylor-reference-frown-v4', .078, .038), smirk = mouth('taylor-confident-smile-v2', .075, -.009, .008), smile = mouth('taylor-warm-smile-v4', .089, -.027);
const crest = geometry('taylor-cobra-crest-v2', tri => {
    const outline = [[-.037, .283, .276], [-.047, .337, .268], [-.039, .382, .255], [0, .402, .246], [.039, .382, .255], [.047, .337, .268], [.037, .283, .276], [0, .254, .282]];
    const center = [0, .335, .291];
    for (let i = 0; i < outline.length; i++)
        tri(center, outline[(i + 1) % outline.length], outline[i]);
}, true);
export const TAYLOR_GEOMETRY = { face, hood, hairline, ears, earInlays, stripes, eyeOutline, eyeWhite, pupils, eyelid, eyeGlints, eyeliner, lashes, frown, smirk, smile, crest };
export function taylorHeadMeshes(head, yaw, tilt, expression, time) {
    const out = [], right = new Vec3(Math.cos(yaw), 0, -Math.sin(yaw)), forward = new Vec3(Math.sin(yaw), 0, Math.cos(yaw));
    const point = (x, y, z) => head.clone().add(right.clone().scale(x * Math.cos(tilt) - y * Math.sin(tilt))).add(new Vec3(0, x * Math.sin(tilt) + y * Math.cos(tilt), 0)).add(forward.clone().scale(z));
    const piece = (skin, color, unlit = false, y = 0, scaleY = 1, material = 'toon') => out.push({ skin, boneMatrices: rigidBones, position: point(0, y, 0), rotation: new Vec3(0, yaw, tilt), scale: new Vec3(1, scaleY, 1), color, material, unlit });
    piece(face, TAYLOR_PALETTE.fur, false, 0, 1, 'toon');
    piece(hood, TAYLOR_PALETTE.indigo);
    piece(hairline, TAYLOR_PALETTE.indigo);
    piece(ears, TAYLOR_PALETTE.indigo);
    piece(earInlays, TAYLOR_PALETTE.fur);
    piece(stripes, TAYLOR_PALETTE.fur);
    const phase = (time + .47) % 3.75, blink = phase < .10 ? 1 - smoothstep(0, .10, phase) : 0, open = Math.max(.065, 1 - blink - expression.squint * .35);
    const lidLift = expression.browRaise * .008;
    piece(eyeOutline, TAYLOR_PALETTE.ink, true, .085 * (1 - open), open);
    piece(eyeWhite, TAYLOR_PALETTE.white, true, .085 * (1 - open), open);
    piece(pupils, TAYLOR_PALETTE.ink, true, .085 * (1 - open), open);
    piece(eyelid, '#bd9b3d', false, lidLift);
    piece(eyeliner, TAYLOR_PALETTE.ink, true, lidLift);
    piece(lashes, TAYLOR_PALETTE.ink, true);
    // The reference's skeptical resting mouth gives way to the real social
    // expression when warmth or celebration rises, rather than a permanent grin.
    piece(expression.smile > .35 ? smile : expression.smile > .24 ? smirk : frown, TAYLOR_PALETTE.ink, true);
    piece(crest, TAYLOR_PALETTE.gold, false, 0, 1, 'metal');
    out.push({ kind: 'sphere', position: point(0, .351, .294), rotation: new Vec3(0, yaw, tilt), scale: new Vec3(.049, .050, .021), color: TAYLOR_PALETTE.gold, material: 'metal' });
    for (const side of [-1, 1]) {
        out.push({ kind: 'sphere', position: point(side * .012, .353, .3065), rotation: new Vec3(0, yaw, tilt), scale: new Vec3(.010, .008, .004), color: TAYLOR_PALETTE.ink, unlit: true });
    }
    out.push({ kind: 'cone', position: point(0, .300, .294), rotation: new Vec3(0, yaw, tilt), scale: new Vec3(.022, .054, .014), color: TAYLOR_PALETTE.gold, material: 'metal' });
    if (expression.mouthOpen > .18)
        out.push({ kind: 'sphere', position: point(0, -.018, surfaceZ(0, -.018, .012)), rotation: new Vec3(0, yaw, tilt), scale: new Vec3(.050, .020 + expression.mouthOpen * .028, .009), color: TAYLOR_PALETTE.ink, unlit: true });
    return out;
}
// An upright curl places the alternating bands beside the torso, as in the reference.
const tailPoint = (t) => { const u = 1 - t; return new Vec3(u * u * u * .25 + 3 * u * u * t * .68 + 3 * u * t * t * .66 + t * t * t * .28, u * u * u * (-.065) + 3 * u * u * t * (-.18) + 3 * u * t * t * .48 + t * t * t * .56, -.18); };
const tailGeometry = (gold) => geometry(`taylor-smooth-tail-${gold ? 'gold' : 'indigo'}-v3`, tri => {
    const at = (r, i) => { const t = r / 60, c = tailPoint(t), d = Vec3.sub(tailPoint(Math.min(1, t + .001)), tailPoint(Math.max(0, t - .001))).normalize(), x = new Vec3(0, 0, 1), y = Vec3.cross(x, d).normalize(), a = i / 16 * Math.PI * 2, radius = .034 - t * .006; const p = c.add(x.scale(Math.cos(a) * radius)).add(y.scale(Math.sin(a) * radius)); return [p.x, p.y, p.z]; };
    for (let r = 0; r < 60; r++)
        if ((r >= 54 || Math.floor(r / 6) % 4 >= 2) === gold)
            for (let i = 0; i < 16; i++) {
                const a = at(r, i), b = at(r, i + 1), c = at(r + 1, i + 1), d = at(r + 1, i);
                tri(a, c, b);
                tri(a, d, c);
            }
    if (gold) {
        const end = tailPoint(1), axis = Vec3.sub(end, tailPoint(.999)).normalize(), x = new Vec3(0, 0, 1), y = Vec3.cross(x, axis).normalize();
        const cap = (r, i) => { const theta = r / 6 * Math.PI / 2, a = i / 16 * Math.PI * 2, p = end.clone().add(axis.clone().scale(Math.sin(theta) * .028)).add(x.clone().scale(Math.cos(theta) * Math.cos(a) * .028)).add(y.clone().scale(Math.cos(theta) * Math.sin(a) * .028)); return [p.x, p.y, p.z]; };
        for (let r = 0; r < 6; r++)
            for (let i = 0; i < 16; i++) {
                const a = cap(r, i), b = cap(r, i + 1), c = cap(r + 1, i + 1), d = cap(r + 1, i);
                tri(a, c, b);
                tri(a, d, c);
            }
    }
}, true);
const tailGold = tailGeometry(true), tailIndigo = tailGeometry(false);
export const TAYLOR_TAIL_GEOMETRY = { tailGold, tailIndigo };
export function taylorTailMeshes(pelvis, yaw, time, speed) {
    const rotation = new Vec3(0, yaw + Math.sin(time * 2.1) * (.025 + Math.min(.04, speed * .015)), 0);
    return [tailGold, tailIndigo].map(skin => ({ skin, boneMatrices: rigidBones, position: pelvis.clone(), rotation, scale: new Vec3(1, 1, 1), color: skin === tailGold ? TAYLOR_PALETTE.fur : TAYLOR_PALETTE.indigo, material: 'toon' }));
}
