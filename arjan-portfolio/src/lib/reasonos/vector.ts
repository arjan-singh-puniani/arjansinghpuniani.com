export type EvidenceState =
  | "observed"
  | "inferred"
  | "contradicted"
  | "unresolved"
  | "excluded"
  | "confirmed";

export interface Calibration {
  speedMmPerSecond: number;
  gainMmPerMv: number;
  pixelsPerMm: number;
}
export interface AxisResult {
  degrees: number | null;
  quadrant: "I+, aVF+" | "I+, aVF−" | "I−, aVF+" | "I−, aVF−" | "undefined";
}
export interface PathDefinition {
  id: string;
  label: string;
  status: "candidate" | "validated";
  expertTraces: number;
  evidence: Record<string, number>;
}

function validateCalibration(calibration: Calibration, delta: number) {
  if (
    !Number.isFinite(delta) ||
    !Object.values(calibration).every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    throw new RangeError(
      "Calibration requires finite positive speed, gain, and pixels per millimetre.",
    );
}
export const intervalMs = (pixelDelta: number, calibration: Calibration) => {
  validateCalibration(calibration, pixelDelta);
  return Math.round(
    (Math.abs(pixelDelta) /
      calibration.pixelsPerMm /
      calibration.speedMmPerSecond) *
      1000,
  );
};

export const voltageMv = (pixelDelta: number, calibration: Calibration) => {
  validateCalibration(calibration, pixelDelta);
  return Number(
    (
      Math.abs(pixelDelta) /
      calibration.pixelsPerMm /
      calibration.gainMmPerMv
    ).toFixed(2),
  );
};

export const correctedQt = (qtMs: number, rrMs: number) => {
  if (![qtMs, rrMs].every((value) => Number.isFinite(value) && value > 0))
    throw new RangeError(
      "QT and RR must be positive finite intervals in milliseconds.",
    );
  return {
    bazettMs: Math.round(qtMs / Math.sqrt(rrMs / 1000)),
    fridericiaMs: Math.round(qtMs / Math.cbrt(rrMs / 1000)),
  };
};

export function frontalAxis(leadI: number, avf: number): AxisResult {
  if (![leadI, avf].every(Number.isFinite))
    throw new RangeError("Lead values must be finite.");
  if (Math.hypot(leadI, avf) < 1e-12)
    return { degrees: null, quadrant: "undefined" };
  // Equal-sided Einthoven model: augmented aVF has sqrt(3)/2 of the bipolar lead-field scale.
  const degrees = Math.round(
    (Math.atan2((2 * avf) / Math.sqrt(3), leadI) * 180) / Math.PI,
  );
  const quadrant =
    leadI >= 0 && avf >= 0
      ? "I+, aVF+"
      : leadI >= 0
        ? "I+, aVF−"
        : avf >= 0
          ? "I−, aVF+"
          : "I−, aVF−";
  return { degrees, quadrant };
}

export function weightedJaccard(
  observed: Record<string, number>,
  reference: Record<string, number>,
) {
  if (
    ![...Object.values(observed), ...Object.values(reference)].every(
      (value) => Number.isFinite(value) && value >= 0,
    )
  )
    throw new RangeError("Evidence weights must be finite and nonnegative.");
  const keys = new Set([...Object.keys(observed), ...Object.keys(reference)]);
  let intersection = 0;
  let union = 0;
  for (const key of keys) {
    intersection += Math.min(observed[key] ?? 0, reference[key] ?? 0);
    union += Math.max(observed[key] ?? 0, reference[key] ?? 0);
  }
  return union === 0 ? 0 : intersection / union;
}

export const candidatePaths: PathDefinition[] = [
  {
    id: "morphology-led",
    label: "Morphology-led sinus assessment",
    status: "candidate",
    expertTraces: 0,
    evidence: { regularity: 1, pBeforeQrs: 1, narrowQrs: 0.8 },
  },
  {
    id: "timing-led",
    label: "Timing-led sinus assessment",
    status: "candidate",
    expertTraces: 0,
    evidence: { rrConsistency: 1, prConsistency: 0.9, rateRange: 0.7 },
  },
];

export function bestCandidatePath(observed: Record<string, number>) {
  return candidatePaths
    .map((path) => ({
      ...path,
      score: weightedJaccard(observed, path.evidence),
    }))
    .sort((a, b) => b.score - a.score)[0];
}
