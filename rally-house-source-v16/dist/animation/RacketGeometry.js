import { RACKET_WORDMARK } from './RacketWordmark.js';
import { Vec3, identity, compose, transformPoint } from '../rendering/Math3D.js';
export const RACKET = { headHalfWidth: .178, headHalfHeight: .245, beamRadius: .0075, stringHalfWidth: .163, stringHalfHeight: .230, handleTopY: -.43, handSpacing: .18, mains: 16, crosses: 19, gripDistance: .66, supportFromGrip: .264 };
export const supportRacketHand = (grip, center) => grip.clone().add(Vec3.sub(center, grip).normalize().scale(RACKET.supportFromGrip));
export const secondRacketHand = (grip, shaft) => grip.clone().add(shaft.clone().normalize().scale(RACKET.handSpacing));
export const RACKET_BONES = new Float32Array(15 * 16);
for (let i = 0; i < 15; i++)
    RACKET_BONES.set(identity(), i * 16);
const build = (id) => ({ id, p: [], n: [] });
function triangle(g, a, b, c) {
    const normal = Vec3.cross(Vec3.sub(new Vec3(...b), new Vec3(...a)), Vec3.sub(new Vec3(...c), new Vec3(...a))).normalize();
    for (const v of [a, b, c]) {
        g.p.push(...v);
        g.n.push(normal.x, normal.y, normal.z);
    }
}
const quad = (g, a, b, c, d) => { triangle(g, a, b, c); triangle(g, a, c, d); };
function geometry(g) {
    const count = g.p.length / 3, weights = new Float32Array(count * 4);
    for (let i = 0; i < count; i++)
        weights[i * 4] = 1;
    return { id: g.id, positions: new Float32Array(g.p), normals: new Float32Array(g.n), boneIndices: new Float32Array(count * 4), boneWeights: weights };
}
function tube(g, points, radius, sides = 8, depth = radius) {
    for (let i = 0; i < points.length - 1; i++) {
        const a = new Vec3(...points[i]), b = new Vec3(...points[i + 1]), along = Vec3.sub(b, a).normalize(), right = Vec3.cross(along, Math.abs(along.z) < .9 ? new Vec3(0, 0, 1) : new Vec3(0, 1, 0)).normalize(), up = Vec3.cross(right, along).normalize();
        const at = (p, j) => { const t = j / sides * Math.PI * 2; return [p.x + right.x * Math.cos(t) * radius + up.x * Math.sin(t) * depth, p.y + right.y * Math.cos(t) * radius + up.y * Math.sin(t) * depth, p.z + right.z * Math.cos(t) * radius + up.z * Math.sin(t) * depth]; };
        for (let j = 0; j < sides; j++)
            quad(g, at(a, j), at(b, j), at(b, j + 1), at(a, j + 1));
    }
}
// Keep the existing sweet spot and head envelope; the throat and grip use the adult frame length.
const frame = build('arjan-aero-frame-v1'), paint = build('arjan-aero-fluo-panels-v1'), trim = build('arjan-aero-bumper-grommets-v1'), ink = build('arjan-aero-frame-wordmarks-v1');
export function racketHoop(a) { return [Math.cos(a) * RACKET.headHalfWidth, Math.sin(a) * RACKET.headHalfHeight, 0]; }
function hoopPoint(a, b, extra = 0) {
    const [x, y] = racketHoop(a), normal = new Vec3(Math.cos(a) / RACKET.headHalfWidth, Math.sin(a) / RACKET.headHalfHeight, 0).normalize(), beam = RACKET.beamRadius * (1 + .13 * Math.cos(a * 2));
    return [x + normal.x * Math.cos(b) * (beam + extra), y + normal.y * Math.cos(b) * (beam + extra), Math.sin(b) * (.0173 + .00105 * Math.cos(a * 2) + extra)];
}
for (let u = 0; u < 96; u++)
    for (let v = 0; v < 10; v++) {
        const a = u / 96 * Math.PI * 2, next = (u + 1) / 96 * Math.PI * 2, b = v / 10 * Math.PI * 2, bn = (v + 1) / 10 * Math.PI * 2;
        const yellow = (u >= 51 && u <= 56) || (u >= 58 && u <= 63) || (u >= 81 && u <= 86) || (u >= 88 && u <= 93);
        const surface = yellow ? paint : frame, start = surface.n.length;
        quad(surface, hoopPoint(a, b), hoopPoint(next, b), hoopPoint(next, bn), hoopPoint(a, bn));
        const normals = [];
        for (const [u, v] of [[a, b], [next, b], [next, bn], [a, b], [next, bn], [a, bn]]) {
            const r = RACKET.beamRadius * (1 + .13 * Math.cos(u * 2)), d = .0173 + .00105 * Math.cos(u * 2), radial = new Vec3(Math.cos(u) / RACKET.headHalfWidth, Math.sin(u) / RACKET.headHalfHeight, 0).normalize();
            const n = new Vec3(radial.x * Math.cos(v) / r, radial.y * Math.cos(v) / r, Math.sin(v) / d).normalize();
            normals.push(n.x, n.y, n.z);
        }
        surface.n.splice(start, 18, ...normals);
        // A recessed dark strip protects the outer crown, leaving the painted faces readable.
        if (u < 48 && (v === 0 || v === 9))
            quad(trim, hoopPoint(a, b, .0015), hoopPoint(next, b, .0015), hoopPoint(next, bn, .0015), hoopPoint(a, bn, .0015));
    }
for (const side of [-1, 1]) {
    const throat = Array.from({ length: 17 }, (_, i) => { const t = i / 16, u = 1 - t; return [side * (3 * u * u * t * .024 + 3 * u * t * t * .070 + t * t * t * .115), u * u * u * (-.438) + 3 * u * u * t * (-.365) + 3 * u * t * t * (-.245) + t * t * t * (-.175), 0]; });
    tube(frame, throat, .010, 10, .0163);
}
// The bottom hoop is the curved bridge; the space below it remains an open Y throat.
const mains = Array.from({ length: RACKET.mains }, (_, i) => (i - (RACKET.mains - 1) / 2) * .0191), crosses = Array.from({ length: RACKET.crosses }, (_, i) => (i - (RACKET.crosses - 1) / 2) * .0225);
export const RACKET_STRING_LINES = [
    ...mains.map(x => { const y = (RACKET.headHalfHeight - .009) * Math.sqrt(1 - (x / (RACKET.headHalfWidth - .009)) ** 2); return [[x, -y, 0], [x, y, 0]]; }),
    ...crosses.map(y => { const x = (RACKET.headHalfWidth - .009) * Math.sqrt(1 - (y / (RACKET.headHalfHeight - .009)) ** 2); return [[-x, y, 0], [x, y, 0]]; })
];
const strings = build('arjan-aero-16x19-strings-v1');
for (const [a, b] of RACKET_STRING_LINES) {
    const middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0];
    tube(strings, [a, middle, b], .00095, 4);
    for (const end of [a, b]) {
        const angle = Math.atan2(end[1] / RACKET.stringHalfHeight, end[0] / RACKET.stringHalfWidth), [x, y] = racketHoop(angle), out = new Vec3(x / RACKET.headHalfWidth ** 2, y / RACKET.headHalfHeight ** 2, 0).normalize();
        tube(Math.abs(end[1]) > .205 ? paint : trim, [[x - out.x * .009, y - out.y * .009, 0], [x + out.x * .004, y + out.y * .004, 0]], .003, 6);
    }
}
// Baked vector outlines stay crisp without a runtime font download.
function word(g, origin, height, map) {
    for (let i = 0; i < RACKET_WORDMARK.length; i += 6) {
        const v = [];
        for (let j = 0; j < 6; j += 2) {
            const p = map(RACKET_WORDMARK[i + j] * height, RACKET_WORDMARK[i + j + 1] * height);
            v.push([p[0] + origin[0], p[1] + origin[1], p[2] + origin[2]]);
        }
        triangle(g, v[0], v[1], v[2]);
    }
}
for (const face of [-1, 1]) {
    // Each side of the throat and both side rails carry ARJAN, never the source logo.
    for (const side of [-1, 1]) {
        word(side === 1 ? paint : ink, [face * side * .013, -.396, face * .0171], .014, (x, y) => [face * side * (x * .40 * 1.8 + (y - .007) * .92), x * .92 * 1.8 - (y - .007) * .40, 0]);
        word(ink, [0, 0, 0], .014, (x, y) => {
            const a = side === 1 ? -.20 + x / RACKET.headHalfHeight : Math.PI + .20 - x / RACKET.headHalfHeight, [px, py] = racketHoop(a), normal = new Vec3(Math.cos(a) / RACKET.headHalfWidth, Math.sin(a) / RACKET.headHalfHeight, 0).normalize(), offset = y - .007, d = .0173 + .00105 * Math.cos(a * 2);
            return [face * (px + normal.x * offset), py + normal.y * offset, face * (d + .0005)];
        });
    }
}
const stencil = build('arjan-aero-string-stencil-v1'), stencilFlex = [];
// Clip the word to the individual strings: ink cannot bridge the empty string-bed holes.
for (const [a, b] of RACKET_STRING_LINES) {
    const intervals = [], dx = b[0] - a[0], dy = b[1] - a[1];
    for (let i = 0; i < RACKET_WORDMARK.length; i += 6) {
        let lo = 0, hi = 1;
        for (let j = 0; j < 3; j++) {
            const k = i + j * 2, next = i + (j + 1) % 3 * 2, x = RACKET_WORDMARK[k] * .056 - .107, y = RACKET_WORDMARK[k + 1] * .056 - .028, ex = (RACKET_WORDMARK[next] - RACKET_WORDMARK[k]) * .056, ey = (RACKET_WORDMARK[next + 1] - RACKET_WORDMARK[k + 1]) * .056;
            const value = ex * (a[1] - y) - ey * (a[0] - x), slope = ex * dy - ey * dx;
            if (Math.abs(slope) < 1e-12) {
                if (value < 0) {
                    hi = -1;
                    break;
                }
            }
            else if (slope > 0)
                lo = Math.max(lo, -value / slope);
            else
                hi = Math.min(hi, -value / slope);
        }
        if (hi - lo > 1e-8)
            intervals.push([lo, hi]);
    }
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const interval of intervals) {
        const last = merged[merged.length - 1];
        if (last && interval[0] <= last[1] + 1e-8)
            last[1] = Math.max(last[1], interval[1]);
        else
            merged.push([...interval]);
    }
    for (const [lo, hi] of merged) {
        const at = (t) => [a[0] + dx * t, a[1] + dy * t, 0], start = stencil.p.length;
        const points = [at(lo), ...(lo < .5 && hi > .5 ? [at(.5)] : []), at(hi)];
        tube(stencil, points, .00115, 4);
        for (let i = start; i < stencil.p.length; i += 3) {
            const t = dx ? (stencil.p[i] - a[0]) / dx : (stencil.p[i + 1] - a[1]) / dy, middle = dx ? 1 - (a[1] / RACKET.stringHalfHeight) ** 2 : 1 - (a[0] / RACKET.stringHalfWidth) ** 2;
            stencilFlex.push(Math.max(0, 1 - Math.abs(t * 2 - 1)) * middle);
        }
    }
}
const grip = build('arjan-aero-octagonal-grip-v1'), wrap = build('arjan-aero-grip-wrap-v1'), capInk = build('arjan-aero-butt-wordmark-v1');
for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + Math.PI / 8, b = (i + 1) * Math.PI / 4 + Math.PI / 8, at = (t, y, r) => [Math.cos(t) * r, y, Math.sin(t) * r];
    quad(grip, at(b, 0, .024), at(b, -.25, .025), at(a, -.25, .025), at(a, 0, .024));
    quad(grip, at(b, 0, .024), at(a, 0, .024), at(a, 0, .010), at(b, 0, .010));
    quad(grip, at(b, -.25, .025), at(b, -.258, .029), at(a, -.258, .029), at(a, -.25, .025));
    quad(grip, at(b, -.258, .029), at(b, -.264, .029), at(a, -.264, .029), at(a, -.258, .029));
    triangle(grip, [0, -.264, 0], at(a, -.264, .029), at(b, -.264, .029));
}
const gripRadius = (t, a) => (.024 + t * .001) * Math.cos(Math.PI / 8) / Math.cos(a - Math.round(a / (Math.PI / 4)) * Math.PI / 4);
const helix = [];
for (let i = 0; i <= 160; i++) {
    const t = i / 160, a = t * Math.PI * 2 * 11, r = gripRadius(t, a) + .0004;
    helix.push([Math.cos(a) * r, -t * .247, Math.sin(a) * r]);
}
tube(wrap, helix, .00075, 4);
for (const y of [-.005, -.247]) {
    const ring = [];
    for (let i = 0; i <= 16; i++) {
        const a = i * Math.PI / 8, r = gripRadius(-y / .25, a) + .001;
        ring.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    tube(wrap, ring, .0015, 4);
}
word(capInk, [-.017, -.2645, -.005], .009, (x, y) => [x, 0, y]);
word(capInk, [0, -.240, 0], .008, (x, y) => { const a = -Math.PI / 2 + (x - .0152) / .025, r = gripRadius(.95, a) + .0005; return [Math.cos(a) * r, y, Math.sin(a) * r]; });
export const RACKET_FRAME = geometry(frame);
export const RACKET_STRINGS = geometry(strings);
export const RACKET_STENCIL = geometry(stencil);
for (const g of [RACKET_STRINGS, RACKET_STENCIL]) {
    const flex = new Float32Array(g.positions.length);
    if (g === RACKET_STENCIL) {
        for (let i = 0; i < stencilFlex.length; i++)
            flex[i * 3 + 2] = stencilFlex[i];
    }
    else
        for (let i = 0; i < flex.length; i += 3) {
            const x = g.positions[i] / RACKET.stringHalfWidth, y = g.positions[i + 1] / RACKET.stringHalfHeight;
            flex[i + 2] = Math.max(0, 1 - x * x - y * y);
        }
    g.morphs = [flex, ...Array.from({ length: 4 }, () => new Float32Array(flex.length))];
}
const parts = [
    { skin: RACKET_FRAME, color: '#4d5c6d', material: 'metal' },
    { skin: geometry(paint), color: '#d9f22a', material: 'ceramic' },
    { skin: geometry(trim), color: '#202622', material: 'matte' },
    { skin: geometry(ink), color: '#f3f3e9', material: 'matte', doubleSided: true, noShadow: true },
    { skin: RACKET_STRINGS, color: '#6d7774', material: 'fabric', noShadow: true },
    { skin: RACKET_STENCIL, color: '#f2f2e8', material: 'matte', doubleSided: true, noShadow: true }
];
const gripParts = [{ skin: geometry(grip), color: '#252724', material: 'fabric' }, { skin: geometry(wrap), color: '#43463e', material: 'fabric' }, { skin: geometry(capInk), color: '#d9f22a', material: 'matte', doubleSided: true, noShadow: true }];
export function racketMeshes(center, rotation, gripDistance, depth = 0) {
    const at = (y) => { const p = transformPoint(compose(center, rotation), new Vec3(0, y, 0)); return new Vec3(p.x, p.y, p.z); }, length = gripDistance + .065 + RACKET.handleTopY;
    return [...parts.map(part => ({ ...part, boneMatrices: RACKET_BONES, position: center, rotation, id: part.skin === RACKET_STRINGS ? 'racket-string' : undefined, expression: [part.skin === RACKET_STRINGS || part.skin === RACKET_STENCIL ? depth : 0, 0, 0, 0] })),
        ...gripParts.map(part => ({ ...part, boneMatrices: RACKET_BONES, position: at(RACKET.handleTopY), rotation, scale: new Vec3(1, length / .264, 1) }))];
}
export function displayRacketMeshes(center, rotation = new Vec3(), size = 1) {
    const model = compose(center, rotation, new Vec3(size, size, size));
    return racketMeshes(new Vec3(), new Vec3(), RACKET.gripDistance).map(m => { const p = transformPoint(model, m.position); return { kind: 'box', geometry: m.skin, position: new Vec3(p.x, p.y, p.z), rotation, scale: (m.scale ?? new Vec3(1, 1, 1)).clone().scale(size), color: m.color, material: m.material, noShadow: m.noShadow, doubleSided: m.doubleSided }; });
}
