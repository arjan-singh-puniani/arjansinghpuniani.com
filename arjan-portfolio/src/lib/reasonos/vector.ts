export type EvidenceState = "observed" | "inferred" | "contradicted" | "unresolved" | "excluded" | "confirmed";

export interface Calibration { speedMmPerSecond: number; gainMmPerMv: number; pixelsPerMm: number }
export interface AxisResult { degrees: number; quadrant: "normal" | "left" | "right" | "extreme" }
export interface PathDefinition { id: string; label: string; status: "candidate" | "validated"; expertTraces: number; evidence: Record<string, number> }

export const intervalMs = (pixelDelta: number, calibration: Calibration) =>
  Math.round((Math.abs(pixelDelta) / calibration.pixelsPerMm / calibration.speedMmPerSecond) * 1000);

export const voltageMv = (pixelDelta: number, calibration: Calibration) =>
  Number((Math.abs(pixelDelta) / calibration.pixelsPerMm / calibration.gainMmPerMv).toFixed(2));

export const correctedQt = (qtMs: number, rrMs: number) => ({
  bazettMs: Math.round(qtMs / Math.sqrt(rrMs / 1000)),
  fridericiaMs: Math.round(qtMs / Math.cbrt(rrMs / 1000)),
});

export function frontalAxis(leadI: number, avf: number): AxisResult {
  const degrees = Math.round(Math.atan2(avf, leadI) * 180 / Math.PI);
  const quadrant = leadI >= 0 && avf >= 0 ? "normal" : leadI >= 0 ? "left" : avf >= 0 ? "right" : "extreme";
  return { degrees, quadrant };
}

export function weightedJaccard(observed: Record<string, number>, reference: Record<string, number>) {
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
  { id: "morphology-led", label: "Morphology-led sinus assessment", status: "candidate", expertTraces: 0, evidence: { regularity: 1, pBeforeQrs: 1, narrowQrs: 0.8 } },
  { id: "timing-led", label: "Timing-led sinus assessment", status: "candidate", expertTraces: 0, evidence: { rrConsistency: 1, prConsistency: 0.9, rateRange: 0.7 } },
];

export function bestCandidatePath(observed: Record<string, number>) {
  return candidatePaths
    .map((path) => ({ ...path, score: weightedJaccard(observed, path.evidence) }))
    .sort((a, b) => b.score - a.score)[0];
}
