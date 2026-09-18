import { bboxEmpty, bboxInclude, cross3, normalize3, sub3 } from './math.js';

function indexFromToken(raw, count) {
  const i = Number.parseInt(raw, 10);
  if (!Number.isFinite(i) || i === 0) throw new Error(`Invalid OBJ index: ${raw}`);
  return i > 0 ? i - 1 : count + i;
}

export function parseOBJ(text) {
  const sourcePositions = [];
  const sourceNormals = [];
  const outputPositions = [];
  const outputNormals = [];
  const outputIndices = [];
  const cache = new Map();
  const bounds = bboxEmpty();

  const getVertex = (token, fallbackNormal) => {
    const [vp, , vn] = token.split('/');
    const pi = indexFromToken(vp, sourcePositions.length);
    const ni = vn ? indexFromToken(vn, sourceNormals.length) : -1;
    const key = `${pi}/${ni}/${fallbackNormal ? fallbackNormal.join(',') : ''}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    const p = sourcePositions[pi];
    if (!p) throw new Error(`OBJ position index out of range: ${vp}`);
    const n = ni >= 0 && sourceNormals[ni] ? sourceNormals[ni] : fallbackNormal || [0,0,1];
    const outIndex = outputPositions.length / 3;
    outputPositions.push(p[0],p[1],p[2]);
    outputNormals.push(n[0],n[1],n[2]);
    bboxInclude(bounds, p);
    cache.set(key, outIndex);
    return outIndex;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    if (parts[0] === 'v' && parts.length >= 4) {
      sourcePositions.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
    } else if (parts[0] === 'vn' && parts.length >= 4) {
      sourceNormals.push(normalize3([Number(parts[1]), Number(parts[2]), Number(parts[3])]));
    } else if (parts[0] === 'f' && parts.length >= 4) {
      const face = parts.slice(1);
      let fallback = null;
      if (!face[0].includes('//') && face.every(t => t.split('/').length < 3 || !t.split('/')[2])) {
        const p0 = sourcePositions[indexFromToken(face[0].split('/')[0], sourcePositions.length)];
        const p1 = sourcePositions[indexFromToken(face[1].split('/')[0], sourcePositions.length)];
        const p2 = sourcePositions[indexFromToken(face[2].split('/')[0], sourcePositions.length)];
        fallback = normalize3(cross3(sub3(p1,p0), sub3(p2,p0)));
      }
      for (let i = 1; i < face.length - 1; i++) {
        outputIndices.push(
          getVertex(face[0], fallback),
          getVertex(face[i], fallback),
          getVertex(face[i+1], fallback)
        );
      }
    }
  }

  if (outputIndices.length === 0) throw new Error('OBJ contained no renderable faces');
  const IndexArray = outputPositions.length / 3 > 65535 ? Uint32Array : Uint16Array;
  return {
    positions: new Float32Array(outputPositions),
    normals: new Float32Array(outputNormals),
    indices: new IndexArray(outputIndices),
    bounds,
    triangles: outputIndices.length / 3
  };
}
