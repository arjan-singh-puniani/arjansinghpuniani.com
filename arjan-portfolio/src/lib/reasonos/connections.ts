import { LEAD_FIELDS, type Lead } from "./model";
import {
  imageInterval,
  type ImageCalibration,
  type ImagePoint,
  type Recording,
} from "./recordings";
import {
  attemptTransformation,
  type KernelSnapshot,
  type Provenance,
} from "./kernel";

export const ELECTRICAL_PHASES = [
  {
    id: "P",
    label: "P wave",
    color: "#efbd75",
    axis: 0,
    title: "Atrial depolarization",
    text: "The P wave records atrial activation. In the frontal view, the arrow shows the report’s mean P axis; it does not trace the moving activation front.",
  },
  {
    id: "PR",
    label: "PR segment",
    color: "#a5b8c9",
    axis: null,
    title: "Conduction between atria and ventricles",
    text: "The PR segment follows P-wave end. The PR interval starts earlier, at P-wave onset, and includes atrial activation as well as conduction delay.",
  },
  {
    id: "QRS",
    label: "QRS",
    color: "#75d3dc",
    axis: 1,
    title: "Ventricular depolarization",
    text: "The QRS records ventricular activation. Its changing deflections reflect changing electrical forces. In the frontal view, the arrow is the reported mean QRS axis, not the direction of every instant or every R peak.",
  },
  {
    id: "ST",
    label: "ST segment",
    color: "#a5b8c9",
    axis: null,
    title: "Ventricles are largely depolarized",
    text: "A near-baseline ST segment does not mean the heart is electrically inactive. Describe its level relative to a baseline, its shape, and its distribution across leads.",
  },
  {
    id: "T",
    label: "T wave",
    color: "#bca7ee",
    axis: 2,
    title: "Ventricular repolarization",
    text: "The T wave records ventricular recovery. Electrical-vector direction and recovery-front direction are different concepts; a positive T wave is not proof that recovery follows the same path as depolarization.",
  },
] as const;
export type ElectricalPhase = (typeof ELECTRICAL_PHASES)[number]["id"];
export const CHEST_LEADS = ["V1", "V2", "V3", "V4", "V5", "V6"] as const;
export type ConnectionLead = Lead | (typeof CHEST_LEADS)[number];
export const CONNECTED_INTERVALS = ["PR", "QRS", "QT", "RR"] as const;
export type ConnectedInterval = (typeof CONNECTED_INTERVALS)[number];
export const LEAD_DEFINITIONS: Record<
  ConnectionLead,
  { formula: string; reading: string }
> = {
  I: {
    formula: "V_{\\mathrm I}=\\Phi_{LA}-\\Phi_{RA}",
    reading: "Left arm potential minus right arm potential.",
  },
  II: {
    formula: "V_{\\mathrm {II}}=\\Phi_{LL}-\\Phi_{RA}",
    reading: "Left leg potential minus right arm potential.",
  },
  III: {
    formula: "V_{\\mathrm {III}}=\\Phi_{LL}-\\Phi_{LA}",
    reading: "Left leg potential minus left arm potential.",
  },
  aVR: {
    formula: "V_{aVR}=\\Phi_{RA}-\\frac{\\Phi_{LA}+\\Phi_{LL}}2",
    reading: "Right arm potential minus the average of left arm and left leg.",
  },
  aVL: {
    formula: "V_{aVL}=\\Phi_{LA}-\\frac{\\Phi_{RA}+\\Phi_{LL}}2",
    reading: "Left arm potential minus the average of right arm and left leg.",
  },
  aVF: {
    formula: "V_{aVF}=\\Phi_{LL}-\\frac{\\Phi_{RA}+\\Phi_{LA}}2",
    reading: "Left leg potential minus the average of both arm potentials.",
  },
  ...(Object.fromEntries(
    CHEST_LEADS.map((lead) => [
      lead,
      {
        formula: `V_{${lead}}=\\Phi_{${lead}}-\\underbrace{\\frac{\\Phi_{RA}+\\Phi_{LA}+\\Phi_{LL}}3}_{\\text{Wilson central terminal}}`,
        reading: `${lead} chest electrode potential minus the average of the three limb potentials.`,
      },
    ]),
  ) as Record<
    (typeof CHEST_LEADS)[number],
    { formula: string; reading: string }
  >),
};
export const CHEST_PLACEMENT = [
  "Fourth intercostal space, right sternal edge",
  "Fourth intercostal space, left sternal edge",
  "Between V2 and V4",
  "Fifth intercostal space, midclavicular line",
  "Level with V4, anterior axillary line",
  "Level with V4, midaxillary line",
] as const;
export function reportedAxisProjection(
  recording: Recording,
  phase: ElectricalPhase,
  lead: ConnectionLead,
) {
  const definition = ELECTRICAL_PHASES.find((item) => item.id === phase);
  if (!definition) throw new RangeError("Unknown electrical phase");
  if (!(lead in LEAD_DEFINITIONS)) throw new RangeError("Unknown ECG lead");
  if (definition.axis === null || !(lead in LEAD_FIELDS)) return null;
  const degrees = recording.report.axes[definition.axis],
    angle = (degrees * Math.PI) / 180;
  const vector = [Math.cos(angle), Math.sin(angle)] as const;
  const field = LEAD_FIELDS[lead as Lead];
  const norm = Math.hypot(...field),
    unit = [field[0] / norm, field[1] / norm] as const;
  const signedLength = vector[0] * unit[0] + vector[1] * unit[1];
  return {
    degrees,
    vector,
    field,
    unit,
    signedLength,
    value: signedLength * norm,
    norm,
  };
}

// Authored visual locators identify one example beat, not detected or adjudicated clinical boundaries.
export const SOURCE_BEATS = {
  A: {
    frame: { x: 225, y: 1030, width: 280, height: 140 },
    bands: [
      [250, 274],
      [274, 285],
      [285, 303],
      [303, 317],
      [317, 365],
    ],
    qrs: [
      { x: 285, y: 1115 },
      { x: 302, y: 1111 },
    ],
    pr: [
      { x: 250, y: 1110 },
      { x: 285, y: 1115 },
    ],
    qt: [
      { x: 285, y: 1115 },
      { x: 365, y: 1116 },
    ],
    rr: [
      { x: 294, y: 1068 },
      { x: 438, y: 1078 },
    ],
  },
  B: {
    frame: { x: 200, y: 1025, width: 280, height: 155 },
    bands: [
      [222, 246],
      [246, 256],
      [256, 274],
      [274, 291],
      [291, 336],
    ],
    qrs: [
      { x: 256, y: 1113 },
      { x: 273, y: 1114 },
    ],
    pr: [
      { x: 222, y: 1110 },
      { x: 256, y: 1113 },
    ],
    qt: [
      { x: 256, y: 1113 },
      { x: 336, y: 1120 },
    ],
    rr: [
      { x: 264, y: 1056 },
      { x: 400, y: 1065 },
    ],
  },
} as const;

export function recordedImageSource(
  recording: Recording,
  calibration: ImageCalibration,
) {
  const reference = imageInterval(calibration.a, calibration.b, calibration);
  return JSON.stringify({
    kind: "recording-image",
    lead: "II-rhythm",
    recording: {
      id: recording.id,
      sha256: recording.sha256,
      width: recording.width,
      height: recording.height,
    },
    calibration,
    speed: recording.paperSpeed,
    gain: recording.gain,
    pixelsPerMm: reference.pixelsPerMm,
  });
}
export function recordConnectedInterval(
  snapshot: KernelSnapshot,
  recording: Recording,
  calibration: ImageCalibration,
  points: readonly [ImagePoint, ImagePoint],
  confirmed: boolean,
  kind: ConnectedInterval = "QRS",
) {
  if (!CONNECTED_INTERVALS.includes(kind))
    throw new RangeError("Unknown ECG interval");
  const source = recordedImageSource(recording, calibration);
  const provenance: Provenance = {
    source: recording.image,
    method: `Source-pixel ${kind} calipers and explicitly confirmed paper ruler`,
    verification: confirmed ? "user-confirmed" : "unverified",
    witnessType: "learner-derived",
    modelVersion: null,
  };
  let next = attemptTransformation(snapshot, {
    operator: "Inspect",
    actor: "system",
    domain: "ecg",
    inputStateIds: [snapshot.states[0].id],
    summary: `Recording ${recording.id}: unchanged ECG photograph`,
    provenance: {
      ...provenance,
      witnessType: "reference-derived",
      verification: "unverified",
    },
    evidenceRefs: [`source=${source}`, `imageSha256=${recording.sha256}`],
  });
  next = attemptTransformation(next, {
    operator: "Calibrate",
    actor: "learner",
    domain: "ecg",
    inputStateIds: [next.states.at(-1)!.id],
    summary: "Local paper ruler",
    provenance,
    evidenceRefs: [`source=${source}`, `gridConfirmed=${confirmed}`],
  });
  if (!next.trace.at(-1)?.accepted) return next;
  return attemptTransformation(next, {
    operator: "Measure",
    actor: "learner",
    domain: "ecg",
    inputStateIds: [next.states.at(-1)!.id],
    summary: `${kind} duration from selected source pixels`,
    provenance,
    evidenceRefs: [
      `source=${source}`,
      `kind=${kind}`,
      `imageAX=${points[0].x}`,
      `imageAY=${points[0].y}`,
      `imageBX=${points[1].x}`,
      `imageBY=${points[1].y}`,
    ],
  });
}
export function testConnectedClaim(
  snapshot: KernelSnapshot,
  recording: Recording,
  calibration: ImageCalibration,
  measurementId: string | undefined,
  scope: "duration" | "normal",
) {
  return attemptTransformation(snapshot, {
    operator: "Hypothesize",
    actor: "learner",
    domain: "ecg",
    inputStateIds: [measurementId ?? snapshot.states[0].id],
    summary:
      scope === "duration"
        ? "Selected lead-II QRS interval is below 120 ms."
        : "The ECG is normal: unsupported by a duration-only rule.",
    domainAccepted: scope === "duration",
    provenance: {
      source: recording.image,
      method:
        scope === "duration"
          ? "Bounded duration rule; no rhythm or diagnosis adjudication"
          : "No implemented clinical rule supports the broader conclusion",
      verification: "user-confirmed",
      witnessType: "learner-derived",
      modelVersion: null,
    },
    evidenceRefs: [
      `source=${recordedImageSource(recording, calibration)}`,
      `claimScope=${scope === "duration" ? "QRS_DURATION_LT_120" : "ECG_NORMAL"}`,
    ],
  });
}
