import { type BufferGeometry, CubicInterpolant, MathUtils, Vector3 } from "three";

function bell(value: number, center: number, spread: number) {
  return Math.exp(-(((value - center) / spread) ** 2));
}

export function shapePersonalContour(x: number, y: number, z: number): [number, number] {
  if (y > .08 && y < .65) {
    const side = Math.abs(x);
    const fade = MathUtils.smoothstep(y, .08, .17) * (1 - MathUtils.smoothstep(y, .57, .65));
    const front = MathUtils.smoothstep(z, .025, .10);
    const pec = bell(side, .094, .069) * bell(y, .505, .058);
    const pecEdge = .446 + .19 * Math.max(0, side - .06);
    const lowerPec = bell(side, .095, .072) * bell(y, pecEdge, .023);
    const ribTransition = bell(side, .109, .045) * bell(y, .418, .034);
    const abs = bell(side, .043, .033) * (
      bell(y, .397, .028) + .96 * bell(y, .331, .027) + .78 * bell(y, .266, .027)
    );
    const midline = bell(x, 0, .014) * bell(y, .334, .095);
    const oblique = bell(side, .103 + .28 * (y - .28), .023) * bell(y, .299, .102);
    const sideChest = bell(side, .159, .064) * bell(y, .469, .095);
    const waist = bell(y, .231, .076) * (1 - MathUtils.smoothstep(side, .16, .22));
    return [
      x * (1 + fade * (.038 * sideChest - .058 * waist)),
      z + fade * front * (.020 * pec - .0025 * lowerPec - .010 * ribTransition + .009 * abs - .004 * midline + .004 * oblique),
    ];
  }
  if (y < -.034 && y >= -.149) {
    const distance = -.020 - y;
    const centerZ = .102 + .008 * Math.min(1, distance / .098);
    const radialDistance = Math.hypot(x - .004, z - centerZ);
    const baseFade = MathUtils.smoothstep(distance, .014, .051);
    const boundary = 1 - MathUtils.smoothstep(radialDistance, .026, .034);
    const gain = .22 * baseFade * boundary;
    return [x + gain * (x - .004), z + gain * (z - centerZ)];
  }
  return [x, z];
}

// Broad half-width and center depth at successive heights of the fitted profile.
// Interpolate a neutral surface inside those outlines instead of tracing facial features.
const faceProfile = new CubicInterpolant(
  new Float32Array([.675, .690, .710, .730, .750, .770, .785, .805, .825, .850, .875, .900]),
  new Float32Array([
    .048, .105, .056, .113, .064, .120, .074, .123,
    .081, .125, .083, .125, .083, .124, .084, .119,
    .084, .116, .083, .113, .081, .109, .074, .105,
  ]),
  2,
  new Float32Array(2),
);

function faceDepth(x: number, y: number) {
  const [halfWidth, centerDepth] = faceProfile.evaluate(y);
  const relativeWidth = Math.min(1, Math.abs(x) / halfWidth);
  const nose = .016 * bell(x, 0, .019) * bell(y, .776, .024);
  return centerDepth - .058 * relativeWidth ** 2 + nose;
}

function neutralWeight(x: number, y: number, z: number) {
  const [halfWidth] = faceProfile.evaluate(y);
  return (1 - MathUtils.smoothstep(Math.abs(x) / halfWidth, .67, .98))
    * MathUtils.smoothstep(z, .044, .085)
    * MathUtils.smoothstep(y, .684, .706)
    * (1 - MathUtils.smoothstep(y, .865, .905));
}

function shapeHeadContour(x: number, y: number, z: number): [number, number, number] {
  const side = Math.abs(x);
  const fade = MathUtils.smoothstep(y, .648, .666);
  const front = MathUtils.smoothstep(z, .022, .094);
  const jaw = bell(y, .719, .043) * MathUtils.smoothstep(z, -.016, .065);
  const chin = bell(x, 0, .036) * bell(y, .687, .016) * front;
  const underJaw = bell(side, .036, .037) * bell(y, .670, .016) * front;
  const crown = MathUtils.smoothstep(y, .843, .949);
  return [
    x * (1 + fade * (-.12 * jaw + .02 * crown)),
    y + fade * (.004 * chin + .010 * crown),
    z + (faceDepth(x, y) - z) * neutralWeight(x, y, z) - .013 * fade * underJaw,
  ];
}

export function sculptPersonalContour(source: BufferGeometry) {
  const geometry = source.clone();
  geometry.deleteAttribute("_surface_detail");
  const positions = geometry.getAttribute("position");
  const originalNormals = source.getAttribute("normal");
  const moved = new Uint8Array(positions.count);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const [bodyX, bodyZ] = shapePersonalContour(x, y, z);
    const [nextX, nextY, nextZ] = y > .648 ? shapeHeadContour(bodyX, y, bodyZ) : [bodyX, y, bodyZ];
    if (nextX === x && nextY === y && nextZ === z) continue;
    positions.setXYZ(i, nextX, nextY, nextZ);
    moved[i] = 1;
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute("normal");
  const sourcePositions = source.getAttribute("position");
  const neutral = new Vector3(), blended = new Vector3();
  const sample = .0005;
  for (let i = 0; i < normals.count; i++) {
    if (!moved[i] && originalNormals) {
      normals.setXYZ(i, originalNormals.getX(i), originalNormals.getY(i), originalNormals.getZ(i));
    }
    const y = sourcePositions.getY(i);
    if (y < .706 || y > .895) continue;
    const x = sourcePositions.getX(i), z = sourcePositions.getZ(i);
    const weight = neutralWeight(x, y, z);
    if (weight === 0) continue;
    // Recessed eyelid and lip triangles can still cast seams after flattening.
    neutral.set(
      (faceDepth(x - sample, y) - faceDepth(x + sample, y)) / (2 * sample),
      (faceDepth(x, y - sample) - faceDepth(x, y + sample)) / (2 * sample),
      1,
    ).normalize();
    blended.fromBufferAttribute(normals, i).lerp(neutral, weight).normalize();
    normals.setXYZ(i, blended.x, blended.y, blended.z);
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
