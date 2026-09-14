export class Vec3 {
    x;
    y;
    z;
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    clone() { return new Vec3(this.x, this.y, this.z); }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    scale(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    len() { return Math.hypot(this.x, this.y, this.z); }
    normalize() { const l = this.len() || 1; return this.scale(1 / l); }
    static add(a, b) { return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z); }
    static sub(a, b) { return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z); }
    static cross(a, b) { return new Vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }
    static dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
    static lerp(a, b, t) { return new Vec3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t); }
}
export function identity() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
export function multiply(a, b) {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c++)
        for (let r = 0; r < 4; r++) {
            out[c * 4 + r] = a[0 * 4 + r] * b[c * 4 + 0] + a[1 * 4 + r] * b[c * 4 + 1] + a[2 * 4 + r] * b[c * 4 + 2] + a[3 * 4 + r] * b[c * 4 + 3];
        }
    return out;
}
export function translation(v) { const m = identity(); m[12] = v.x; m[13] = v.y; m[14] = v.z; return m; }
export function scaling(v) { const m = identity(); m[0] = v.x; m[5] = v.y; m[10] = v.z; return m; }
export function rotationX(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }
export function rotationY(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); }
export function rotationZ(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
export function compose(pos, rot = new Vec3(), scale = new Vec3(1, 1, 1)) {
    const r = multiply(rotationY(rot.y), multiply(rotationX(rot.x), rotationZ(rot.z)));
    return multiply(translation(pos), multiply(r, scaling(scale)));
}
export function perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2), nf = 1 / (near - far);
    const m = new Float32Array(16);
    m[0] = f / aspect;
    m[5] = f;
    m[10] = (far + near) * nf;
    m[11] = -1;
    m[14] = 2 * far * near * nf;
    return m;
}
export function lookAt(eye, target, up = new Vec3(0, 1, 0)) {
    const z = Vec3.sub(eye, target).normalize();
    const x = Vec3.cross(up, z).normalize();
    const y = Vec3.cross(z, x).normalize();
    const m = identity();
    m[0] = x.x;
    m[1] = y.x;
    m[2] = z.x;
    m[4] = x.y;
    m[5] = y.y;
    m[6] = z.y;
    m[8] = x.z;
    m[9] = y.z;
    m[10] = z.z;
    m[12] = -Vec3.dot(x, eye);
    m[13] = -Vec3.dot(y, eye);
    m[14] = -Vec3.dot(z, eye);
    return m;
}
export function transformPoint(m, v) {
    const x = v.x, y = v.y, z = v.z;
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
    return { x: (m[0] * x + m[4] * y + m[8] * z + m[12]) / w, y: (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, z: (m[2] * x + m[6] * y + m[10] * z + m[14]) / w, w };
}
export function hexToRgb(hex) {
    let s = hex.replace('#', '');
    if (s.length === 3)
        s = s.split('').map(c => c + c).join('');
    const n = parseInt(s, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function smoothstep(a, b, v) { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
// Rigid transform helpers used by the lightweight skeletal skinning path.
export function rigidFrame(origin, target, hintForward = new Vec3(0, 0, 1)) {
    const y = Vec3.sub(target, origin).normalize();
    let z = hintForward.clone().sub(y.clone().scale(Vec3.dot(hintForward, y)));
    if (z.len() < 1e-4) {
        z = new Vec3(1, 0, 0).sub(y.clone().scale(y.x));
    }
    z.normalize();
    const x = Vec3.cross(y, z).normalize();
    const zz = Vec3.cross(x, y).normalize();
    return new Float32Array([x.x, x.y, x.z, 0, y.x, y.y, y.z, 0, zz.x, zz.y, zz.z, 0, origin.x, origin.y, origin.z, 1]);
}
export function invertRigid(m) {
    // Inverse of [R t; 0 1] with orthonormal R: [R^T -R^Tt; 0 1].
    const tx = m[12], ty = m[13], tz = m[14];
    const r00 = m[0], r01 = m[4], r02 = m[8], r10 = m[1], r11 = m[5], r12 = m[9], r20 = m[2], r21 = m[6], r22 = m[10];
    const out = identity();
    out[0] = r00;
    out[4] = r10;
    out[8] = r20;
    out[1] = r01;
    out[5] = r11;
    out[9] = r21;
    out[2] = r02;
    out[6] = r12;
    out[10] = r22;
    out[12] = -(r00 * tx + r10 * ty + r20 * tz);
    out[13] = -(r01 * tx + r11 * ty + r21 * tz);
    out[14] = -(r02 * tx + r12 * ty + r22 * tz);
    return out;
}
export function orthographic(l, r, b, t, n, f) {
    const m = identity();
    m[0] = 2 / (r - l);
    m[5] = 2 / (t - b);
    m[10] = -2 / (f - n);
    m[12] = -(r + l) / (r - l);
    m[13] = -(t + b) / (t - b);
    m[14] = -(f + n) / (f - n);
    return m;
}
/** Stable ortho light matrix fitted to a fixed world sphere, so shadow texels do not shimmer as the sun moves. */
export function sunViewProjection(sunDir, center, radius, resolution) {
    const d = sunDir.clone().normalize();
    const eye = new Vec3(center.x - d.x * radius * 2, center.y - d.y * radius * 2, center.z - d.z * radius * 2);
    const up = Math.abs(d.y) > .985 ? new Vec3(0, 0, 1) : new Vec3(0, 1, 0);
    const view = lookAt(eye, center, up);
    // Snap the centre to whole shadow texels to stop crawling edges.
    const texel = (radius * 2) / resolution;
    const cx = transformPoint(view, center);
    const sx = Math.round(cx.x / texel) * texel - cx.x, sy = Math.round(cx.y / texel) * texel - cx.y;
    const proj = orthographic(-radius + sx, radius + sx, -radius + sy, radius + sy, .1, radius * 4.5);
    return multiply(proj, view);
}
//# sourceMappingURL=Math3D.js.map