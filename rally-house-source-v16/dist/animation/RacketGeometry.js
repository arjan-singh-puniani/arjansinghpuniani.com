import { Vec3, identity } from '../rendering/Math3D.js';
export const RACKET = { headHalfWidth: .178, headHalfHeight: .245, beamRadius: .010, stringHalfWidth: .163, stringHalfHeight: .230, handleTopY: -.375 };
export const RACKET_BONES = new Float32Array(15 * 16);
for (let i = 0; i < 15; i++)
    RACKET_BONES.set(identity(), i * 16);
const p = [], n = [], bi = [], bw = [];
const point = (u, v) => {
    const a = u / 64 * Math.PI * 2, b = v / 8 * Math.PI * 2, normal = new Vec3(Math.cos(a) / RACKET.headHalfWidth, Math.sin(a) / RACKET.headHalfHeight, 0).normalize(), z = Math.sin(b) * RACKET.beamRadius;
    return { p: [Math.cos(a) * RACKET.headHalfWidth + normal.x * Math.cos(b) * RACKET.beamRadius, Math.sin(a) * RACKET.headHalfHeight + normal.y * Math.cos(b) * RACKET.beamRadius, z], n: [normal.x * Math.cos(b), normal.y * Math.cos(b), Math.sin(b)] };
};
for (let u = 0; u < 64; u++)
    for (let v = 0; v < 8; v++)
        for (const q of [point(u, v), point(u + 1, v), point(u + 1, v + 1), point(u, v), point(u + 1, v + 1), point(u, v + 1)]) {
            p.push(...q.p);
            n.push(...q.n);
            bi.push(0, 0, 0, 0);
            bw.push(1, 0, 0, 0);
        }
export const RACKET_FRAME = { id: 'adult-tennis-racket-slim-frame-v1', positions: new Float32Array(p), normals: new Float32Array(n), boneIndices: new Float32Array(bi), boneWeights: new Float32Array(bw) };
