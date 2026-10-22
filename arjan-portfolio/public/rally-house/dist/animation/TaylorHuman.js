import { Vec3, identity, clamp, smoothstep } from '../rendering/Math3D.js';
const bones = new Float32Array(15 * 16);
for (let i = 0; i < 15; i++)
    bones.set(identity(), i * 16);
// Cached, authored surfaces. The head is attached to the same world landmark
// as the body; facial acting changes transforms, never the skeleton.
function surface(id, emit, smooth = true) {
    const p = [], n = [], bi = [], bw = [];
    emit((a, b, c) => { const normal = Vec3.cross(Vec3.sub(new Vec3(...b), new Vec3(...a)), Vec3.sub(new Vec3(...c), new Vec3(...a))); if (normal.len() < 1e-10)
        return; normal.normalize(); for (const v of [a, b, c]) {
        p.push(...v);
        n.push(normal.x, normal.y, normal.z);
        bi.push(0, 0, 0, 0);
        bw.push(1, 0, 0, 0);
    } });
    if (smooth) {
        const sums = new Map(), key = (i) => p.slice(i, i + 3).map(v => v.toFixed(7)).join(',');
        for (let i = 0; i < p.length; i += 3) {
            const k = key(i), v = sums.get(k) ?? new Vec3();
            v.add(new Vec3(...n.slice(i, i + 3)));
            sums.set(k, v);
        }
        for (let i = 0; i < p.length; i += 3) {
            const v = sums.get(key(i)).clone().normalize();
            n[i] = v.x;
            n[i + 1] = v.y;
            n[i + 2] = v.z;
        }
    }
    return { id, positions: new Float32Array(p), normals: new Float32Array(n), boneIndices: new Float32Array(bi), boneWeights: new Float32Array(bw) };
}
const profile = [[-.177, 0, 0], [-.166, .032, .043], [-.142, .066, .067], [-.107, .087, .077], [-.062, .107, .088], [-.005, .114, .096], [.052, .113, .099], [.108, .096, .087], [.155, .052, .047], [.175, 0, 0]];
function radius(y) {
    let i = 0;
    while (i < profile.length - 2 && y > profile[i + 1][0])
        i++;
    const a = profile[i], b = profile[i + 1], t = clamp((y - a[0]) / (b[0] - a[0]), 0, 1), d = b[0] - a[0];
    return [1, 2].map(k => { const slope = (j) => { if (j === 0 || j === profile.length - 1)
        return 0; const p = profile[j - 1], q = profile[j], r = profile[j + 1], u = (q[k] - p[k]) / (q[0] - p[0]), v = (r[k] - q[k]) / (r[0] - q[0]); return u * v <= 0 ? 0 : 2 * u * v / (u + v); }; return (2 * t * t * t - 3 * t * t + 1) * a[k] + (t * t * t - 2 * t * t + t) * d * slope(i) + (-2 * t * t * t + 3 * t * t) * b[k] + (t * t * t - t * t) * d * slope(i + 1); });
}
const gaussian = (x, y, cx, cy, rx, ry) => Math.exp(-(((x - cx) / rx) ** 2) - ((y - cy) / ry) ** 2);
function relief(x, y) {
    return .012 * gaussian(x, y, 0, .005, .012, .055) + .020 * gaussian(x, y, 0, -.033, .017, .017)
        + .009 * gaussian(x, y, -.070, -.026, .027, .025) + .009 * gaussian(x, y, .070, -.026, .027, .025)
        - .006 * gaussian(x, y, -.048, .018, .030, .015) - .006 * gaussian(x, y, .048, .018, .030, .015)
        + .004 * gaussian(x, y, -.047, .049, .032, .013) + .004 * gaussian(x, y, .047, .049, .032, .013)
        - .003 * gaussian(x, y, 0, -.061, .008, .011) + .004 * gaussian(x, y, 0, -.086, .034, .022)
        + .006 * gaussian(x, y, 0, -.131, .030, .018) - .002 * gaussian(x, y, 0, -.111, .024, .008);
}
export function humanFaceDepth(x, y) { const [rx, rz] = radius(y); return rz * Math.sqrt(Math.max(0, 1 - (x / Math.max(.00001, rx)) ** 2)) + relief(x, y); }
function faceSurface(masculine = false) {
    return surface(masculine ? 'athlete-human-masculine-jaw-v1' : 'taylor-human-sculpted-face-v2', tri => {
        const at = (r, i) => { const y = -.177 + r / 48 * .352, [rx, rz] = radius(y), angle = i / 64 * Math.PI * 2, x = Math.sin(angle) * rx * (masculine ? 1 + .12 * (1 - smoothstep(-.17, -.04, y)) : 1), c = Math.cos(angle); return r === 0 || r === 48 ? [0, y, 0] : [x, y, c * rz + (c > 0 ? relief(x, y) * Math.pow(c, 6) : 0)]; };
        for (let r = 0; r < 48; r++)
            for (let i = 0; i < 64; i++) {
                const a = at(r, i), b = at(r, i + 1), c = at(r + 1, i + 1), d = at(r + 1, i);
                tri(a, b, c);
                tri(a, c, d);
            }
    });
}
const face = faceSurface(), masculineFace = faceSurface(true);
export const HUMAN_FACE_VARIANTS = { masculineFace };
const eyeY = .018, eyeX = .048, eyeWidth = .026, eyeHeight = .0080;
const aperture = (u) => Math.pow(Math.max(0, 1 - u * u), .72);
const eyePoint = (x, y, offset) => [x, y, humanFaceDepth(x, y) + offset];
function eyePatch(id, shape, offset) {
    return surface(id, tri => {
        for (const side of [-1, 1])
            for (let r = 0; r < 5; r++)
                for (let i = 0; i < 32; i++) {
                    const at = (row, col) => { const angle = col / 32 * Math.PI * 2, [x, y] = shape(Math.cos(angle) * row / 5, Math.sin(angle) * row / 5, side); return eyePoint(x, y, offset + .0012 * (1 - (row / 5) ** 2)); };
                    const a = at(r, i), b = at(r + 1, i), c = at(r + 1, i + 1), d = at(r, i + 1);
                    tri(a, b, c);
                    tri(a, c, d);
                }
    }, false);
}
const eyeWhite = eyePatch('taylor-human-convex-sclera-v2', (u, v, side) => [side * eyeX + u * eyeWidth, eyeY + v * eyeHeight * aperture(u) + u * side * .002], .0040);
const iris = eyePatch('taylor-human-iris-v3', (u, v, side) => [side * eyeX + u * .0073, eyeY + v * .0073], .0060);
const pupil = eyePatch('taylor-human-round-pupil-v3', (u, v, side) => [side * eyeX + u * .0034, eyeY + v * .0034], .0075);
function ribbon(id, path, width, offset) {
    return surface(id, tri => {
        for (let i = 0; i < 36; i++) {
            const at = (j, side) => { const [x, y] = path(j / 36), [x1, y1] = path(clamp(j / 36 + .001, 0, 1)), [x0, y0] = path(clamp(j / 36 - .001, 0, 1)), dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, w = typeof width === 'number' ? width : width(j / 36), px = x - side * dy / l * w, py = y + side * dx / l * w; return eyePoint(px, py, offset); };
            const a = at(i, -1), b = at(i + 1, -1), c = at(i + 1, 1), d = at(i, 1);
            tri(a, b, c);
            tri(a, c, d);
        }
    }, false);
}
const lids = [-1, 1].map(side => ribbon(`taylor-human-lid-${side}-v1`, t => { const u = t * 2 - 1; return [side * eyeX + u * eyeWidth, eyeY + eyeHeight * aperture(u) + u * side * .002]; }, .0009, .0052));
const lowerLids = [-1, 1].map(side => ribbon(`taylor-human-lower-lid-${side}-v1`, t => { const u = t * 2 - 1; return [side * eyeX + u * eyeWidth, eyeY - eyeHeight * aperture(u) + u * side * .002]; }, .00075, .0052));
const lidFolds = [-1, 1].map(side => ribbon(`taylor-human-orbital-fold-${side}-v1`, t => { const u = t * 2 - 1; return [side * eyeX + u * eyeWidth, eyeY + .0045 + eyeHeight * aperture(u) + u * side * .002]; }, t => .0006 * Math.sin(t * Math.PI), .0020));
const brows = [-1, 1].map(side => ribbon(`taylor-human-brow-${side}-v2`, t => [side * (.020 + t * .064), .045 + .009 * Math.sin(t * Math.PI) - t * .002], t => .0023 * (.35 + .65 * Math.sin(t * Math.PI)), .0035));
function lips(id, smile, upper) {
    return surface(id, tri => {
        const at = (i, j) => { const u = -1 + i / 40 * 2, t = j / 5, x = u * .030, envelope = Math.pow(Math.max(0, 1 - u * u), .65), seam = -.088 + smile * u * u * .007, height = upper ? (.005 + .003 * Math.exp(-(((Math.abs(u) - .3) / .2) ** 2))) : .009, y = seam + (upper ? 1 : -1) * height * envelope * t, z = humanFaceDepth(x, y) + .003 + .005 * envelope * Math.sin(Math.PI * t); return [x, y, z]; };
        for (let i = 0; i < 40; i++)
            for (let j = 0; j < 5; j++) {
                const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
                if (upper) {
                    tri(a, b, c);
                    tri(a, c, d);
                }
                else {
                    tri(a, c, b);
                    tri(a, d, c);
                }
            }
    });
}
const upperLip = lips('taylor-human-upper-lip-v1', 0, true), lowerLip = lips('taylor-human-lower-lip-v1', 0, false), smileUpper = lips('taylor-human-smiling-upper-lip-v1', 1, true), smileLower = lips('taylor-human-smiling-lower-lip-v1', 1, false);
const seam = ribbon('taylor-human-lip-seam-v1', t => [(t * 2 - 1) * .028, -.088], .0007, .0045);
const smileSeam = ribbon('taylor-human-smile-seam-v1', t => { const u = t * 2 - 1; return [u * .028, -.088 + u * u * .007]; }, .0006, .0046);
const nostrils = surface('taylor-human-nostril-contour-v1', tri => {
    for (const side of [-1, 1])
        for (let i = 0; i < 12; i++) {
            const at = (angle) => eyePoint(side * .0115 + Math.cos(angle) * .0034, -.043 + Math.sin(angle) * .0016, .0015);
            tri(eyePoint(side * .0115, -.043, .0015), at(i / 12 * Math.PI * 2), at((i + 1) / 12 * Math.PI * 2));
        }
}, false);
const mouthGap = surface('taylor-human-mouth-opening-v1', tri => {
    const point = (r, i) => { const a = i / 32 * Math.PI * 2, x = Math.cos(a) * r / 4 * .027, y = -.088 + Math.sin(a) * r / 4 * .008; return eyePoint(x, y, .0035); };
    for (let r = 0; r < 4; r++)
        for (let i = 0; i < 32; i++) {
            const a = point(r, i), b = point(r + 1, i), c = point(r + 1, i + 1), d = point(r, i + 1);
            tri(a, b, c);
            tri(a, c, d);
        }
}, false);
const cap = surface('taylor-human-groomed-hair-cap-v2', tri => {
    const at = (r, i) => { const angle = i / 64 * Math.PI * 2, front = (1 + Math.cos(angle)) * .5, edge = -.046 + .129 * Math.pow(front, 3) + .006 * Math.sin(angle * 2), y = edge + (.202 - edge) * r / 20, phi = clamp((y + .009) / .211, 0, 1), wave = r === 20 ? 0 : Math.sqrt(Math.max(0, 1 - phi * phi)), ridge = .00065 * Math.sin(angle * 16 + r / 20 * 5) * wave, [hx, hz] = radius(Math.min(.174, y)), rx = r === 20 ? 0 : Math.max(y < .174 ? hx + .009 : 0, .125 * wave) + ridge, rz = r === 20 ? 0 : Math.max(y < .174 ? hz + .009 : 0, .118 * wave) + ridge; return [Math.sin(angle) * rx, y, Math.cos(angle) * rz]; };
    for (let r = 0; r < 20; r++)
        for (let i = 0; i < 64; i++) {
            const a = at(r, i), b = at(r, i + 1), c = at(r + 1, i + 1), d = at(r + 1, i);
            tri(a, b, c);
            tri(a, c, d);
        }
});
function lock(id, points, radii, rows = 40, segments = 20) {
    return surface(id, tri => {
        const sample = (t) => { const u = t * (points.length - 1), i = Math.min(points.length - 2, Math.floor(u)), v = u - i, a = points[Math.max(0, i - 1)], b = points[i], c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)], p = new Vec3(...[0, 1, 2].map(k => .5 * ((2 * b[k]) + (-a[k] + c[k]) * v + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * v * v + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * v * v * v))); return { p, r: radii[i] + (radii[i + 1] - radii[i]) * v }; };
        const at = (r, i) => { const t = r / rows, { p, c, radius } = (() => { const s = sample(t); return { p: s.p, c: Vec3.sub(sample(Math.min(1, t + .002)).p, sample(Math.max(0, t - .002)).p).normalize(), radius: s.r }; })(), z = new Vec3(0, 0, 1); z.sub(c.clone().scale(Vec3.dot(z, c))).normalize(); const x = Vec3.cross(c, z).normalize(), a = i / segments * Math.PI * 2, groove = 1 + .042 * Math.sin(a * 8 + t * 6) * Math.sin(Math.PI * t), v = p.add(x.scale(Math.cos(a) * radius * groove)).add(z.scale(Math.sin(a) * radius * .72 * groove)); return [v.x, v.y, v.z]; };
        for (let r = 0; r < rows; r++)
            for (let i = 0; i < segments; i++) {
                const a = at(r, i), b = at(r, i + 1), c = at(r + 1, i + 1), d = at(r + 1, i);
                tri(a, c, b);
                tri(a, d, c);
            }
    }, true);
}
const ponytail = lock('taylor-human-athletic-ponytail-v2', [[0, .176, -.075], [.018, .125, -.168], [.038, .005, -.209], [.018, -.145, -.224], [.046, -.285, -.246], [.075, -.390, -.270]], [.040, .049, .044, .036, .024, 0]);
const sweep = lock('taylor-human-side-part-v3', [[-.009, .184, .025], [-.052, .138, .060], [-.095, .076, .050], [-.115, .002, .010], [-.111, -.068, .006]], [0, .023, .018, .010, 0]);
const fineSweep = lock('taylor-human-temple-strand-v2', [[.079, .095, .055], [.112, .025, .031], [.112, -.045, .018], [.103, -.096, .015]], [0, .006, .005, 0]);
const looseLocks = [-1, 1].map(side => lock(`taylor-human-face-framing-lock-${side}-v1`, [[side * .095, .074, .054], [side * .121, .006, .043], [side * .124, -.082, .031], [side * .112, -.155, .043], [side * .130, -.209, .020]], [0, .008, .007, .004, 0], 24, 12));
const bob = surface('athlete-sculpted-bob-v1', tri => {
    const at = (r, i, inside = false) => { const t = r / 12, a = .95 + i / 32 * (Math.PI * 2 - 1.9), rx = .086 + .050 * Math.sin(t * Math.PI / 2), rz = .077 + .029 * Math.sin(t * Math.PI / 2), wall = inside ? .008 : 0; return [Math.sin(a) * (rx - wall), .14 - t * .34, Math.cos(a) * (rz - wall) - .012]; };
    for (let r = 0; r < 12; r++)
        for (let i = 0; i < 32; i++)
            for (const inside of [false, true]) {
                const a = at(r, i, inside), b = at(r, i + 1, inside), c = at(r + 1, i + 1, inside), d = at(r + 1, i, inside);
                if (inside) {
                    tri(a, b, c);
                    tri(a, c, d);
                }
                else {
                    tri(a, c, b);
                    tri(a, d, c);
                }
            }
    for (let i = 0; i < 32; i++) {
        const a = at(12, i), b = at(12, i + 1), c = at(12, i + 1, true), d = at(12, i, true);
        tri(a, b, c);
        tri(a, c, d);
    }
    for (const i of [0, 32])
        for (let r = 0; r < 12; r++) {
            const a = at(r, i), b = at(r + 1, i), c = at(r + 1, i, true), d = at(r, i, true);
            if (i === 0) {
                tri(a, c, b);
                tri(a, d, c);
            }
            else {
                tri(a, b, c);
                tri(a, c, d);
            }
        }
});
export const CAST_HAIR_GEOMETRY = { bob };
export const HUMAN_TAYLOR_GEOMETRY = { face, eyeWhite, iris, pupil, upperLip, lowerLip, smileUpper, smileLower, seam, smileSeam, nostrils, mouthGap, cap, ponytail, sweep, fineSweep, ...Object.fromEntries(looseLocks.map((g, i) => [`looseLock${i}`, g])), ...Object.fromEntries(lids.map((g, i) => [`lid${i}`, g])), ...Object.fromEntries(lowerLids.map((g, i) => [`lowerLid${i}`, g])), ...Object.fromEntries(brows.map((g, i) => [`brow${i}`, g])), ...Object.fromEntries(lidFolds.map((g, i) => [`lidFold${i}`, g])) };
export function humanTaylorHead(head, yaw, tilt, expression, time, skin, options = {}) {
    const out = [], right = new Vec3(Math.cos(yaw), 0, -Math.sin(yaw)), forward = new Vec3(Math.sin(yaw), 0, Math.cos(yaw));
    const width = options.width ?? 1, height = options.height ?? 1, hair = options.hair ?? '#251e1d', style = options.hairStyle ?? 'ponytail';
    const point = (px, py, z) => { const x = px * width, y = py * height; return head.clone().add(right.clone().scale(x * Math.cos(tilt) - y * Math.sin(tilt))).add(new Vec3(0, x * Math.sin(tilt) + y * Math.cos(tilt), 0)).add(forward.clone().scale(z)); };
    const part = (geometry, color, material = 'humanSkin', y = 0, sy = 1, unlit = false) => out.push({ skin: geometry, boneMatrices: bones, position: point(0, y, 0), rotation: new Vec3(0, yaw, tilt), scale: new Vec3(width, sy * height, 1), color, material, unlit });
    part(options.masculine ? masculineFace : face, skin);
    part(cap, hair, 'groomedHair');
    if (style === 'ponytail')
        part(ponytail, hair, 'groomedHair');
    if (style === 'bob')
        part(bob, hair, 'groomedHair');
    if (style !== 'crop')
        for (const g of [sweep, fineSweep, ...(style === 'ponytail' || style === 'bob' ? looseLocks : [])])
            part(g, options.hair ?? '#382820', 'groomedHair');
    if (style === 'bun')
        out.push({ kind: 'sphere', position: point(.010, .163, -.119), rotation: new Vec3(0, yaw, tilt), scale: new Vec3(.104 * width, .096 * height, .102), color: hair, material: 'groomedHair' });
    const phase = (time + .47) % 3.75, blink = phase < .10 ? 1 - smoothstep(0, .10, phase) : 0, open = clamp(1 - blink - expression.squint * .35, .06, 1), offset = eyeY * (1 - open);
    part(eyeWhite, '#d8d2c8', 'ceramic', offset, open);
    part(iris, options.eye ?? '#876641', 'iris', offset, open);
    part(pupil, '#231d1c', 'hair', offset, open, true);
    for (const g of lids)
        part(g, '#34221f', 'hair', offset, open);
    for (const g of lowerLids)
        part(g, skin, 'humanSkin', offset, open);
    for (const g of lidFolds)
        part(g, skin, 'humanSkin');
    part(nostrils, '#8a5141', 'humanSkin');
    for (const g of brows)
        part(g, options.hair ?? '#332420', 'groomedHair', expression.browRaise * .003 - (options.masculine ? .009 : 0), options.masculine ? 1.15 : 1);
    const smiling = expression.smile > .3, mouth = clamp(expression.mouthOpen, 0, 1), gapScale = Math.max(.03, mouth);
    const lipHeight = options.masculine ? .72 : 1, lipOffset = -.088 * (1 - lipHeight);
    part(mouthGap, '#5a3835', 'skin', -.088 * (1 - gapScale), gapScale);
    part(smiling ? smileUpper : upperLip, options.lip ?? '#a95b62', 'lip', lipOffset + mouth * .002, lipHeight);
    part(smiling ? smileLower : lowerLip, options.lip ?? '#be7379', 'lip', lipOffset - mouth * .010, lipHeight);
    part(smiling ? smileSeam : seam, '#704943', 'skin', lipOffset - mouth * .004, lipHeight);
    for (const side of [-1, 1]) {
        const x = side * eyeX - .001, y = eyeY + .002;
        out.push({ kind: 'sphere', position: point(x, eyeY + (y - eyeY) * open, humanFaceDepth(x, y) + .0095), rotation: new Vec3(0, yaw, tilt), scale: new Vec3(.0018, .0018 * open, .0010), color: '#fff5dc', unlit: true, noShadow: true });
        out.push({ kind: 'sphere', position: point(side * .110, -.026, -.007), rotation: new Vec3(0, yaw, tilt), scale: new Vec3(.027, .058, .037), color: skin, material: 'humanSkin' });
    }
    if (style === 'ponytail' || style === 'bun')
        out.push({ kind: 'torus', position: point(.003, style === 'bun' ? .163 : .123, style === 'bun' ? -.119 : -.105), rotation: new Vec3(Math.PI / 2, yaw, tilt), scale: new Vec3(.066, .057, .012), color: '#cedb68', material: 'fabric' });
    return out;
}
