import { Vec3 } from '../rendering/Math3D.js';
// Cached, authored surfaces. The head is attached to the same world landmark
// as the body; facial acting changes transforms, never the skeleton.
export function surface(id, emit, smooth = true) {
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
