export const FLUID = Object.freeze({
  densityKgM3: 1060,
  dynamicViscosityPaS: 3.5e-3,
});

export const DEFAULT_CASE = Object.freeze({
  id: 'synthetic-carotid-55',
  label: '55% diameter stenosis',
  severityDiameter: 0.55,
  nominalRadiusM: 3.2e-3,
  axialMinM: -22e-3,
  axialMaxM: 42e-3,
  stenosisCenterM: 0,
  stenosisWidthM: 7.8e-3,
  cyclePeriodS: 0.86,
  meanInletVelocityMps: 0.28,
  recirculationCenterM: 12e-3,
  recirculationWidthM: 8e-3,
  recirculationAmplitude: 2.75,
  swirlAmplitude: 0.34,
  pressureLossFraction: 0.085,
});

export const CASES = Object.freeze([
  { ...DEFAULT_CASE, id: 'synthetic-carotid-30', label: '30% diameter stenosis', severityDiameter: 0.30, recirculationAmplitude: 1.05, swirlAmplitude: 0.12, pressureLossFraction: 0.035 },
  { ...DEFAULT_CASE, id: 'synthetic-carotid-50', label: '50% diameter stenosis', severityDiameter: 0.50, recirculationAmplitude: 2.25, swirlAmplitude: 0.28, pressureLossFraction: 0.070 },
  DEFAULT_CASE,
  { ...DEFAULT_CASE, id: 'synthetic-carotid-65', label: '65% diameter stenosis', severityDiameter: 0.65, recirculationAmplitude: 3.35, swirlAmplitude: 0.46, pressureLossFraction: 0.12 },
]);

const RAW_PULSE = Object.freeze([
  0.66, 0.69, 0.78, 1.04, 1.47, 1.90, 1.72, 1.42,
  1.14, 0.94, 0.82, 0.76, 0.73, 0.71, 0.69, 0.67,
]);
const PULSE_MEAN = RAW_PULSE.reduce((a, b) => a + b, 0) / RAW_PULSE.length;
export const NORMALIZED_PULSE = Object.freeze(RAW_PULSE.map(v => v / PULSE_MEAN));

export function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

export function radiusAt(z, c = DEFAULT_CASE) {
  const q = (z - c.stenosisCenterM) / c.stenosisWidthM;
  const envelope = Math.exp(-Math.pow(q, 4));
  return c.nominalRadiusM * (1 - c.severityDiameter * envelope);
}

export function radiusDerivativeAt(z, c = DEFAULT_CASE) {
  const dz = z - c.stenosisCenterM;
  const w = c.stenosisWidthM;
  const q = dz / w;
  const envelope = Math.exp(-Math.pow(q, 4));
  return c.nominalRadiusM * c.severityDiameter * envelope * (4 * Math.pow(dz, 3) / Math.pow(w, 4));
}

export function pulseMultiplier(phase01) {
  const p = ((phase01 % 1) + 1) % 1;
  const x = p * NORMALIZED_PULSE.length;
  const i0 = Math.floor(x) % NORMALIZED_PULSE.length;
  const i1 = (i0 + 1) % NORMALIZED_PULSE.length;
  return lerp(NORMALIZED_PULSE[i0], NORMALIZED_PULSE[i1], x - Math.floor(x));
}

export function inletArea(c = DEFAULT_CASE) {
  return Math.PI * c.nominalRadiusM * c.nominalRadiusM;
}

export function flowRateM3s(phase01, c = DEFAULT_CASE) {
  return inletArea(c) * c.meanInletVelocityMps * pulseMultiplier(phase01);
}

export function meanVelocityAt(z, phase01, c = DEFAULT_CASE) {
  const r = radiusAt(z, c);
  return flowRateM3s(phase01, c) / (Math.PI * r * r);
}

function disturbanceEnvelope(z, phase01, c = DEFAULT_CASE) {
  const q = (z - c.recirculationCenterM) / c.recirculationWidthM;
  const e = Math.exp(-(q * q));
  const systolicScale = 0.78 + 0.22 * clamp(pulseMultiplier(phase01), 0.55, 1.65);
  return c.recirculationAmplitude * systolicScale * e;
}

function disturbanceDerivative(z, phase01, c = DEFAULT_CASE) {
  const A = disturbanceEnvelope(z, phase01, c);
  const dz = z - c.recirculationCenterM;
  return A * (-2 * dz / (c.recirculationWidthM * c.recirculationWidthM));
}

function radialShape(xi, A) {
  const x2 = xi * xi;
  const base = (8 / 6) * (1 - Math.pow(xi, 6));
  const zeroFluxRecirculation = (1 - x2) * (1 - 3 * x2);
  return base + A * zeroFluxRecirculation;
}

export function cylindricalVelocity(r, z, phase01, c = DEFAULT_CASE) {
  const R = radiusAt(z, c);
  if (!Number.isFinite(r) || !Number.isFinite(z) || r < 0 || R <= 0 || r > R) {
    return { ur: 0, utheta: 0, uz: 0, inside: false };
  }

  const xi = clamp(r / R, 0, 1);
  const U = meanVelocityAt(z, phase01, c);
  const q = radiusDerivativeAt(z, c) / R;
  const A = disturbanceEnvelope(z, phase01, c);
  const Ap = disturbanceDerivative(z, phase01, c);
  const F = radialShape(xi, A);

  // Exact continuity partner for u_z = U(z) F(r/R,z), with U ∝ R^-2
  // and zero-area-mean disturbance g=(1-xi^2)(1-3xi^2).
  const ur = R * U * (q * xi * F - 0.5 * Ap * xi * Math.pow(1 - xi * xi, 2));

  const swirlEnv = Math.exp(-Math.pow((z - c.recirculationCenterM) / (1.2 * c.recirculationWidthM), 2));
  const utheta = c.swirlAmplitude * U * swirlEnv * xi * (1 - xi * xi);
  const uz = U * F;

  return { ur, utheta, uz, inside: true };
}

export function velocityAt(x, y, z, phase01, c = DEFAULT_CASE) {
  const r = Math.hypot(x, y);
  const cv = cylindricalVelocity(r, z, phase01, c);
  if (!cv.inside) return { x: 0, y: 0, z: 0, inside: false, speed: 0 };
  let ex = 1, ey = 0;
  if (r > 1e-12) { ex = x / r; ey = y / r; }
  // e_theta = (-ey, ex)
  const vx = cv.ur * ex - cv.utheta * ey;
  const vy = cv.ur * ey + cv.utheta * ex;
  const vz = cv.uz;
  return { x: vx, y: vy, z: vz, inside: true, speed: Math.hypot(vx, vy, vz) };
}

export function axialPressurePa(z, phase01, c = DEFAULT_CASE) {
  const Uin = c.meanInletVelocityMps * pulseMultiplier(phase01);
  const U = meanVelocityAt(z, phase01, c);
  const dynamicThroat = 0.5 * FLUID.densityKgM3 * Math.pow(meanVelocityAt(c.stenosisCenterM, phase01, c), 2);
  const convective = 0.5 * FLUID.densityKgM3 * (Uin * Uin - U * U);
  const downstreamRamp = smoothstep(c.stenosisCenterM - 1e-3, c.recirculationCenterM + 1.5 * c.recirculationWidthM, z);
  const modeledLoss = c.pressureLossFraction * c.severityDiameter * dynamicThroat * downstreamRamp;
  return convective - modeledLoss; // gauge relative to inlet, reduced-order approximation
}

export function wallShearPa(z, phase01, c = DEFAULT_CASE) {
  const R = radiusAt(z, c);
  const U = meanVelocityAt(z, phase01, c);
  const A = disturbanceEnvelope(z, phase01, c);
  const swirlEnv = Math.exp(-Math.pow((z - c.recirculationCenterM) / (1.2 * c.recirculationWidthM), 2));
  const duzdrWall = U / R * (-8 + 4 * A);
  const dutdrWall = U / R * (-2 * c.swirlAmplitude * swirlEnv);
  return FLUID.dynamicViscosityPaS * Math.hypot(duzdrWall, dutdrWall);
}

export function reynoldsNumber(phase01, c = DEFAULT_CASE) {
  const U = c.meanInletVelocityMps * pulseMultiplier(phase01);
  return FLUID.densityKgM3 * U * (2 * c.nominalRadiusM) / FLUID.dynamicViscosityPaS;
}

export function womersleyNumber(c = DEFAULT_CASE) {
  const omega = 2 * Math.PI / c.cyclePeriodS;
  return c.nominalRadiusM * Math.sqrt(omega * FLUID.densityKgM3 / FLUID.dynamicViscosityPaS);
}

export function paToMmHg(pa) { return pa / 133.322; }
export function mmHgToPa(mmHg) { return mmHg * 133.322; }

export function vorticityAt(x, y, z, phase01, c = DEFAULT_CASE) {
  const R = radiusAt(z, c);
  const h = Math.min(7.5e-5, Math.max(2.5e-5, R * 0.025));
  const sample = (a,b,d) => velocityAt(a,b,d,phase01,c);

  const deriv = (axis, component) => {
    const p = [x, y, z];
    const m = [x, y, z];
    p[axis] += h; m[axis] -= h;
    const vp = sample(p[0], p[1], p[2]);
    const vm = sample(m[0], m[1], m[2]);
    const key = component === 0 ? 'x' : component === 1 ? 'y' : 'z';
    if (vp.inside && vm.inside) return (vp[key] - vm[key]) / (2*h);
    const v0 = sample(x,y,z);
    if (!v0.inside) return 0;
    if (vp.inside) return (vp[key] - v0[key]) / h;
    if (vm.inside) return (v0[key] - vm[key]) / h;
    return 0;
  };

  const dvy_dz = deriv(2,1), dvz_dy = deriv(1,2);
  const dvz_dx = deriv(0,2), dvx_dz = deriv(2,0);
  const dvx_dy = deriv(1,0), dvy_dx = deriv(0,1);
  const wx = dvz_dy - dvy_dz;
  const wy = dvx_dz - dvz_dx;
  const wz = dvy_dx - dvx_dy;
  return { x: wx, y: wy, z: wz, magnitude: Math.hypot(wx, wy, wz) };
}

export function divergenceAt(x, y, z, phase01, c = DEFAULT_CASE) {
  const R = radiusAt(z, c);
  const h = Math.min(7.5e-5, Math.max(2.5e-5, R * 0.025));
  const component = (axis, key) => {
    const p = [x,y,z], m=[x,y,z];
    p[axis]+=h; m[axis]-=h;
    const vp=velocityAt(...p, phase01, c), vm=velocityAt(...m, phase01, c);
    if (!vp.inside || !vm.inside) return NaN;
    return (vp[key]-vm[key])/(2*h);
  };
  const a=component(0,'x'), b=component(1,'y'), d=component(2,'z');
  return Number.isFinite(a+b+d) ? a+b+d : NaN;
}

export function crossSectionFlux(z, phase01, c = DEFAULT_CASE, radialSamples = 800) {
  const R = radiusAt(z, c);
  let integral = 0;
  const dr = R / radialSamples;
  for (let i = 0; i < radialSamples; i++) {
    const r = (i + 0.5) * dr;
    integral += cylindricalVelocity(r, z, phase01, c).uz * 2 * Math.PI * r * dr;
  }
  return integral;
}

export function computeMetrics(phase01, c = DEFAULT_CASE) {
  const samples = 240;
  let peakVelocity = 0;
  let peakWss = 0;
  let pressureMin = Infinity;
  let pressureMax = -Infinity;
  let minNearWallUz = Infinity;
  let recirculationStart = null;
  let recirculationEnd = null;

  for (let i = 0; i <= samples; i++) {
    const z = lerp(c.axialMinM, c.axialMaxM, i / samples);
    const U = meanVelocityAt(z, phase01, c);
    const A = disturbanceEnvelope(z, phase01, c);
    peakVelocity = Math.max(peakVelocity, U * (8 / 6 + Math.max(0, A)));
    peakWss = Math.max(peakWss, wallShearPa(z, phase01, c));
    const p = axialPressurePa(z, phase01, c);
    pressureMin = Math.min(pressureMin, p); pressureMax = Math.max(pressureMax, p);
    const R = radiusAt(z, c);
    const nearWallUz = cylindricalVelocity(0.86 * R, z, phase01, c).uz;
    minNearWallUz = Math.min(minNearWallUz, nearWallUz);
    if (nearWallUz < 0) {
      if (recirculationStart === null) recirculationStart = z;
      recirculationEnd = z;
    }
  }

  return {
    flowRateMlS: flowRateM3s(phase01, c) * 1e6,
    inletVelocityMps: c.meanInletVelocityMps * pulseMultiplier(phase01),
    throatMeanVelocityMps: meanVelocityAt(c.stenosisCenterM, phase01, c),
    peakVelocityMps: peakVelocity,
    modeledPressureSpanPa: pressureMax - pressureMin,
    modeledPressureSpanMmHg: paToMmHg(pressureMax - pressureMin),
    reynoldsInlet: reynoldsNumber(phase01, c),
    womersley: womersleyNumber(c),
    peakWallShearPa: peakWss,
    recirculationLengthMm: recirculationStart === null ? 0 : (recirculationEnd - recirculationStart) * 1e3,
    minNearWallUzMps: minNearWallUz,
  };
}

export function provenanceForMetric(name) {
  const table = {
    density: ['INPUT', 'Configured demonstration fluid property'],
    viscosity: ['INPUT', 'Configured demonstration fluid property'],
    flowRate: ['SYNTHETIC', 'Normalized synthetic pulse × configured inlet mean velocity'],
    reynolds: ['DERIVED', 'Re = ρUD/μ at nominal inlet diameter'],
    womersley: ['DERIVED', 'α = R√(ωρ/μ) using configured cycle period'],
    pressure: ['APPROXIMATED', 'Reduced-order Bernoulli + explicit downstream loss term'],
    wallShear: ['DERIVED', 'Wall gradient of the reduced-order analytic velocity field'],
    vorticity: ['DERIVED', 'Numerical curl of the reduced-order velocity field'],
    velocity: ['SYNTHETIC', 'Analytic flux-conserving reduced-order velocity field'],
  };
  return table[name] ?? ['APPROXIMATED', 'No specific provenance entry'];
}

export function caseValidation(c = DEFAULT_CASE) {
  const zs = 400;
  let minR = Infinity;
  for (let i = 0; i <= zs; i++) {
    const z = lerp(c.axialMinM, c.axialMaxM, i / zs);
    minR = Math.min(minR, radiusAt(z, c));
  }
  const expectedThroat = c.nominalRadiusM * (1 - c.severityDiameter);
  return {
    positiveRadius: minR > 0,
    throatRadiusErrorM: Math.abs(radiusAt(c.stenosisCenterM, c) - expectedThroat),
    diameterReduction: 1 - radiusAt(c.stenosisCenterM, c) / c.nominalRadiusM,
    minRadiusM: minR,
  };
}
