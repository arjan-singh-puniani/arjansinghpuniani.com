export type Lead = "I" | "II" | "III" | "aVR" | "aVL" | "aVF";
export type Vec2 = readonly [number, number];
export interface EcgModel {
  rr: number;
  pr: number;
  qrs: number;
  qt: number;
  rotation: number;
}
export const DEFAULT_MODEL: EcgModel = {
  rr: 820,
  pr: 160,
  qrs: 90,
  qt: 380,
  rotation: 60,
};
export const LEADS: readonly Lead[] = ["I", "II", "III", "aVR", "aVL", "aVF"];
const r3 = Math.sqrt(3);
export const LEAD_FIELDS: Record<Lead, Vec2> = {
  I: [1, 0],
  II: [0.5, r3 / 2],
  III: [-0.5, r3 / 2],
  aVR: [-0.75, -r3 / 4],
  aVL: [0.75, -r3 / 4],
  aVF: [0, r3 / 2],
};

export function validateModel(model: EcgModel) {
  if (
    !Object.values(model).every(Number.isFinite) ||
    model.pr < 80 ||
    model.pr > 200 ||
    model.qrs <= 0 ||
    model.qt < model.qrs + 100 ||
    model.rr <= 200 + model.qt
  )
    throw new RangeError(
      "The synthetic intervals must be finite, ordered, and fit inside one cycle.",
    );
}

export function landmarks(model: EcgModel) {
  return {
    pStart: 200 - model.pr,
    pEnd: 280 - model.pr,
    qrsStart: 200,
    qrsEnd: 200 + model.qrs,
    tStart: 100 + model.qt,
    tEnd: 200 + model.qt,
  };
}

// Finite support gives this teaching source explicit fiducials, not detected clinical onsets.
export function bump(t: number, start: number, end: number) {
  if (t <= start || t >= end) return 0;
  return Math.sin((Math.PI * (t - start)) / (end - start)) ** 2;
}

export function componentsAt(time: number, model: EcgModel) {
  const t = ((time % model.rr) + model.rr) % model.rr,
    m = landmarks(model);
  const polar = (a: number, degrees: number): Vec2 => [
    a * Math.cos((degrees * Math.PI) / 180),
    a * Math.sin((degrees * Math.PI) / 180),
  ];
  const q = polar(
    -0.18 * bump(t, 200, 200 + 0.45 * model.qrs),
    model.rotation - 35,
  );
  const r = polar(
    1.1 * bump(t, 200 + 0.12 * model.qrs, 200 + 0.75 * model.qrs),
    model.rotation,
  );
  const s = polar(
    -0.3 * bump(t, 200 + 0.45 * model.qrs, m.qrsEnd),
    model.rotation + 35,
  );
  return {
    P: polar(0.12 * bump(t, m.pStart, m.pEnd), 60),
    QRS: [q[0] + r[0] + s[0], q[1] + r[1] + s[1]] as Vec2,
    T: polar(0.28 * bump(t, m.tStart, m.tEnd), 45),
  };
}

export function vectorAt(time: number, model: EcgModel): Vec2 {
  const { P, QRS, T } = componentsAt(time, model);
  return [P[0] + QRS[0] + T[0], P[1] + QRS[1] + T[1]];
}

export function alignQrsToLead(
  model: EcgModel,
  lead: Lead,
  direction: "toward" | "across" | "away",
) {
  const time = 200 + 0.44 * model.qrs;
  const base = componentsAt(time, { ...model, rotation: 0 }).QRS;
  const field = LEAD_FIELDS[lead];
  const offset =
    direction === "toward" ? 0 : direction === "across" ? Math.PI / 2 : Math.PI;
  const degrees =
    ((Math.atan2(field[1], field[0]) - Math.atan2(base[1], base[0]) + offset) *
      180) /
    Math.PI;
  return {
    time,
    model: {
      ...model,
      rotation: ((((degrees + 180) % 360) + 360) % 360) - 180,
    },
  };
}

export function electrodePotentials([x, y]: Vec2) {
  return { RA: -x / 2 - y / (2 * r3), LA: x / 2 - y / (2 * r3), LL: y / r3 };
}

export function leadVoltages(vector: Vec2): Record<Lead, number> {
  const { RA, LA, LL } = electrodePotentials(vector);
  return {
    I: LA - RA,
    II: LL - RA,
    III: LL - LA,
    aVR: RA - (LA + LL) / 2,
    aVL: LA - (RA + LL) / 2,
    aVF: LL - (RA + LA) / 2,
  };
}

export function qrsArea(model: EcgModel): Vec2 {
  let x = 0,
    y = 0;
  const steps = 240,
    dt = model.qrs / steps;
  for (let j = 0; j <= steps; j++) {
    const v = componentsAt(200 + j * dt, model).QRS,
      weight = j === 0 || j === steps ? 0.5 : 1;
    x += v[0] * dt * weight;
    y += v[1] * dt * weight;
  }
  return [x, y];
}

export function phaseAt(time: number, model: EcgModel) {
  const t = ((time % model.rr) + model.rr) % model.rr,
    m = landmarks(model);
  return t >= m.pStart && t <= m.pEnd
    ? "P"
    : t >= m.qrsStart && t <= m.qrsEnd
      ? "QRS"
      : t >= m.tStart && t <= m.tEnd
        ? "T"
        : "baseline";
}

export interface IntervalEvidence {
  duration: number;
  uncertainty: number;
  calibrated: boolean;
  currentSource: boolean;
}
export function narrowQrsRule(evidence: IntervalEvidence) {
  const checks = [
    { name: "Calibration recorded", passed: evidence.calibrated },
    {
      name: "Measurement belongs to current source",
      passed: evidence.currentSource,
    },
    {
      name: "Ordered, finite interval",
      passed:
        Number.isFinite(evidence.duration) &&
        evidence.duration > 0 &&
        Number.isFinite(evidence.uncertainty) &&
        evidence.uncertainty >= 0,
    },
    {
      name: "Entire uncertainty interval below 120 ms",
      passed: evidence.duration + evidence.uncertainty < 120,
    },
  ];
  return { accepted: checks.every((check) => check.passed), checks };
}
