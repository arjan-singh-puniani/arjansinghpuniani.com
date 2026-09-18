export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function vec3(x = 0, y = 0, z = 0) { return [x, y, z]; }
export function add3(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
export function sub3(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
export function scale3(v, s) { return [v[0] * s, v[1] * s, v[2] * s]; }
export function dot3(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
export function cross3(a, b) {
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}
export function length3(v) { return Math.hypot(v[0], v[1], v[2]); }
export function normalize3(v) {
  const len = length3(v) || 1;
  return [v[0]/len, v[1]/len, v[2]/len];
}

export function mat4Identity() {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
}

export function mat4Multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c*4+r] =
        a[0*4+r] * b[c*4+0] +
        a[1*4+r] * b[c*4+1] +
        a[2*4+r] * b[c*4+2] +
        a[3*4+r] * b[c*4+3];
    }
  }
  return out;
}

export function mat4Perspective(fovyRadians, aspect, near, far) {
  const f = 1 / Math.tan(fovyRadians / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f/aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far+near)*nf, -1,
    0, 0, (2*far*near)*nf, 0
  ]);
}

export function mat4LookAt(eye, target, up = [0,1,0]) {
  const z = normalize3(sub3(eye, target));
  let x = normalize3(cross3(up, z));
  if (length3(x) < 1e-6) x = [1,0,0];
  const y = cross3(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot3(x, eye), -dot3(y, eye), -dot3(z, eye), 1
  ]);
}

export function bboxEmpty() {
  return { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
}
export function bboxInclude(b, p) {
  for (let i=0; i<3; i++) { b.min[i] = Math.min(b.min[i], p[i]); b.max[i] = Math.max(b.max[i], p[i]); }
  return b;
}
export function bboxUnion(a, b) {
  if (!Number.isFinite(b.min[0])) return a;
  bboxInclude(a, b.min); bboxInclude(a, b.max); return a;
}
export function bboxCenter(b) { return [(b.min[0]+b.max[0])/2,(b.min[1]+b.max[1])/2,(b.min[2]+b.max[2])/2]; }
export function bboxSize(b) { return [b.max[0]-b.min[0],b.max[1]-b.min[1],b.max[2]-b.min[2]]; }
export function bboxRadius(b) { const s=bboxSize(b); return Math.hypot(...s)/2; }

export function hexToRgb01(hex) {
  const h = hex.replace('#','');
  const n = Number.parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
  return [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255];
}
