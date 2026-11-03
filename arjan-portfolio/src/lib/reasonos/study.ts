import type { ImagePoint } from "./recordings";
export const RECORDED_LEADS = [
  "II-rhythm",
  "I",
  "II",
  "III",
  "aVR",
  "aVL",
  "aVF",
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
] as const;
export type RecordedLead = (typeof RECORDED_LEADS)[number];
export interface EvidencePin {
  recordingId: string;
  image: string;
  sha256: string;
  sourceKey: string;
  lead: string;
  rect: { x: number; y: number; width: number; height: number };
  markers: readonly ImagePoint[];
  measurementIds: string[];
}
export interface MethodStep {
  id: string;
  label: string;
  title: string;
  task: string;
  leads: RecordedLead[];
  measurements: string[];
  question: string;
  options: readonly { id: string; label: string }[];
  answer: string;
  explanation: string;
  source: { title: string; url: string };
}
const method = {
  title: "University of Utah · systematic ECG interpretation",
  url: "https://ecg.utah.edu/lesson/2",
};
export const METHOD_STEPS: readonly MethodStep[] = [
  {
    id: "rate",
    label: "Scale & rate",
    title: "Establish time before naming the rate",
    task: "Inspect the printed scale. Place the grid ruler near the beat, record its calibration, and measure one RR interval. Repeat with adjacent beats before deciding whether the rate is regular.",
    leads: ["II-rhythm"],
    measurements: ["RR"],
    question:
      "At the recorded speed of 25 mm/s, how much time does one 5 mm box represent?",
    options: [
      { id: "200", label: "200 ms" },
      { id: "40", label: "40 ms" },
      { id: "500", label: "500 ms" },
    ],
    answer: "200",
    explanation:
      "5 mm ÷ 25 mm/s = 0.2 s. Rate is 60,000 divided by RR in milliseconds. One interval estimates one cycle; several intervals are needed to assess variability.",
    source: {
      title: "AHA/ACCF/HRS · acquisition and calibration",
      url: "https://doi.org/10.1161/CIRCULATIONAHA.106.180200",
    },
  },
  {
    id: "rhythm",
    label: "Rhythm",
    title: "Find atrial activity and its ventricular relationship",
    task: "Compare lead II with aVR. Describe the visible P waves, RR regularity, and whether each P is followed by a QRS with a consistent PR. State which observations the image cannot resolve.",
    leads: ["II-rhythm", "aVR"],
    measurements: [],
    question: "Does a regular RR sequence alone establish sinus origin?",
    options: [
      {
        id: "no",
        label: "No; inspect P-wave morphology and the P–QRS relationship",
      },
      { id: "yes", label: "Yes; regular ventricular timing is sufficient" },
      { id: "rate", label: "Only when the displayed rate is below 100 bpm" },
    ],
    answer: "no",
    explanation:
      "Regular ventricular timing does not identify the pacemaker. Examine atrial activity and its relationship to QRS complexes. Do not substitute the machine’s rhythm statement for these observations.",
    source: {
      title: "University of Utah · rhythm analysis",
      url: "https://ecg.utah.edu/lesson/5-2",
    },
  },
  {
    id: "axis",
    label: "Axis",
    title: "Constrain the frontal axis from net QRS polarity",
    task: "Inspect I and aVF separately. Record whether each QRS is predominantly positive, negative, or indeterminate. Use the whole QRS deflection rather than the R peak alone.",
    leads: ["I", "aVF"],
    measurements: [],
    question:
      "If net QRS is positive in both I and aVF, which quadrant is supported?",
    options: [
      { id: "0-90", label: "0° to +90°" },
      { id: "90-180", label: "+90° to +180°" },
      { id: "negative", label: "−90° to 0°" },
    ],
    answer: "0-90",
    explanation:
      "Those signs place the mean vector in the intersection of the positive I and aVF hemispheres. They constrain a quadrant, not an exact angle or a complete diagnosis. If I is positive and aVF negative, inspect II to refine the leftward boundary.",
    source: {
      title: "University of Utah · axis determination",
      url: "https://ecg.utah.edu/lesson/2-1",
    },
  },
  {
    id: "intervals",
    label: "Intervals",
    title: "Choose physiological boundaries, then measure",
    task: "On lead II, mark and save PR, QRS, and QT separately. For QT, identify the end of T rather than the next P. Recheck ambiguous boundaries and retain the image-placement bound.",
    leads: ["II-rhythm"],
    measurements: ["PR", "QRS", "QT"],
    question: "Which boundaries define the PR interval?",
    options: [
      { id: "p-qrs", label: "Start of P to the first QRS deflection" },
      { id: "p-r", label: "Peak of P to peak of R" },
      { id: "qrs-t", label: "Start of QRS to end of T" },
    ],
    answer: "p-qrs",
    explanation:
      "PR includes atrial activation and the delay before ventricular activation. QRS duration starts at the first ventricular deflection. QT extends from that QRS onset to T-wave end. Boundary choice must precede arithmetic.",
    source: {
      title: "University of Utah · interval definitions",
      url: "https://ecg.utah.edu/lesson/4",
    },
  },
  {
    id: "morphology",
    label: "QRS morphology",
    title: "Inspect right and left precordial morphology together",
    task: "Compare V1 and V6. Describe terminal QRS forces, R/S balance, and the measured width before proposing a conduction pattern. A source-limited feature may remain indeterminate.",
    leads: ["V1", "V6"],
    measurements: ["QRS"],
    question: "What supports a bundle-branch interpretation?",
    options: [
      {
        id: "both",
        label:
          "QRS duration together with the expected lead-specific morphology",
      },
      {
        id: "width",
        label: "Any wide complex, regardless of its shape or origin",
      },
      { id: "one", label: "One unusual R wave in one lead" },
    ],
    answer: "both",
    explanation:
      "Width and morphology supply different evidence. Inspect the right precordial and lateral leads, and consider the rhythm and ventricular origin. A broad QRS is not by itself a named bundle-branch diagnosis.",
    source: {
      title: "AHA/ACCF/HRS · conduction interpretation",
      url: "https://doi.org/10.1161/CIRCULATIONAHA.108.191095",
    },
  },
  {
    id: "repolarization",
    label: "ST–T",
    title: "Anchor repolarization observations to a baseline and distribution",
    task: "Locate the QRS end and describe ST–T shape in II, aVF, and V4. Name the baseline, affected leads, and what the photograph permits you to assess. Reserve voltage claims for a defensible vertical calibration.",
    leads: ["II", "aVF", "V4"],
    measurements: [],
    question: "Which approach makes an ST-segment observation interpretable?",
    options: [
      {
        id: "context",
        label:
          "Identify baseline and J point, confirm scale, and inspect the lead distribution",
      },
      {
        id: "screen",
        label: "Measure screen height without the recording scale",
      },
      {
        id: "single",
        label: "Classify the whole ECG from one isolated segment",
      },
    ],
    answer: "context",
    explanation:
      "An ST observation needs a reference baseline, the QRS endpoint, calibrated voltage, and a distribution across leads. This photo workspace calibrates time; it does not automatically adjudicate ST voltage or ischemia.",
    source: {
      title: "AHA/ACCF/HRS · ST–T and QT definitions",
      url: "https://doi.org/10.1161/CIRCULATIONAHA.108.191096",
    },
  },
  {
    id: "compare",
    label: "Compare",
    title: "Compare corresponding leads before interpreting small deltas",
    task: "Pin lead II from both recordings. Describe similarities and differences before viewing the device values. Decide which boundary-dependent measurements deserve repetition.",
    leads: ["II-rhythm"],
    measurements: [],
    question:
      "Do two device QRS durations differing by 3 ms prove a physiological conduction change?",
    options: [
      {
        id: "no",
        label:
          "No; repeat comparable measurements and consider their uncertainty",
      },
      {
        id: "yes",
        label: "Yes; every printed numerical change is physiological",
      },
      {
        id: "average",
        label: "Averaging the reports establishes the explanation",
      },
    ],
    answer: "no",
    explanation:
      "The supplied reports list QRS durations of 83 and 80 ms. A difference alone does not establish its cause. Recheck corresponding beats, boundaries, calibration, acquisition, and image quality. The report comparison is not independent adjudication.",
    source: {
      title: "Paired source recordings and printed reports",
      url: "#source-case",
    },
  },
  {
    id: "synthesis",
    label: "Synthesis",
    title: "Write an interpretation someone else can audit",
    task: "Summarize rate, rhythm evidence, axis, intervals, QRS morphology, and ST–T observations. Separate what you observed from what you inferred. Name an alternative explanation and the clinical information you would need next.",
    leads: ["II-rhythm"],
    measurements: [],
    question: "Which summary is most useful for independent review?",
    options: [
      {
        id: "evidence",
        label:
          "Findings with lead locations, measurements, reasoning, and unresolved questions",
      },
      {
        id: "machine",
        label: "The machine says normal, so no further description is needed",
      },
      {
        id: "certainty",
        label: "A confident diagnosis without its supporting observations",
      },
    ],
    answer: "evidence",
    explanation:
      "A traceable interpretation preserves its evidence and uncertainty. These method checks do not validate a diagnosis of the contributed recording. The exported worksheet is intended for self-review or instructor review.",
    source: method,
  },
];
export interface StudyAttempt {
  stepId: string;
  answerId: string;
  confidence: number;
  observation: string;
  pins: EvidencePin[];
  methodMatch: boolean;
}
export function evaluateMethodAnswer(stepId: string, answerId: string) {
  const step = METHOD_STEPS.find((s) => s.id === stepId);
  if (!step || !step.options.some((o) => o.id === answerId))
    throw new RangeError("Unknown method question or answer");
  return step.answer === answerId;
}
export function studyEvidenceReady(
  step: MethodStep,
  pins: readonly EvidencePin[],
) {
  if (!step.leads.every((lead) => pins.some((p) => p.lead === lead)))
    return false;
  return (
    step.id !== "compare" ||
    ["A", "B"].every((id) =>
      pins.some((p) => p.recordingId === id && p.lead === "II-rhythm"),
    )
  );
}
