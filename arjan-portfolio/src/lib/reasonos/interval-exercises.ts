export type IntervalExercise = {
  title: string;
  lead: "II" | "V1";
  kind: "RR" | "PR" | "QRS";
  start: number;
  seconds: number;
  gain: number;
  pairs: readonly (readonly [number, number])[];
  tolerance: number;
  landmarks: readonly [string, string];
  interpretation: string;
};

// Worked landmarks are manually selected in the original 500 Hz samples.
export const INTERVAL_EXERCISES: Readonly<Partial<Record<string, IntervalExercise>>> = {
  "00010": {
    title: "R–R · First measurement",
    lead: "II", kind: "RR", start: 0, seconds: 2.5, gain: 10,
    pairs: [[433, 852]], tolerance: 10,
    landmarks: ["Top of the first tall R peak.", "Top of the next tall R peak."],
    interpretation: "The R–R interval is the time between two ventricular beats. Compare several intervals to see whether that timing stays steady.",
  },
  "00012": {
    title: "R–R · Estimate a beat rate",
    lead: "II", kind: "RR", start: 0.6, seconds: 2.5, gain: 20,
    pairs: [[592, 1214]], tolerance: 10,
    landmarks: ["Top of the first tall R peak.", "Top of the next tall R peak."],
    interpretation: "This is a rate estimate from one pair of beats. Compare more R–R intervals to assess how steady the timing is.",
  },
  "08215": {
    title: "R–R · Compare consecutive beats",
    lead: "II", kind: "RR", start: 0, seconds: 2.5, gain: 20,
    pairs: [[99, 494], [494, 795]], tolerance: 10,
    landmarks: ["Top of the first tall R peak.", "Top of the next tall R peak."],
    interpretation: "The second gap is shorter than the first. This shows a change in ventricular beat spacing. Compare more beats and look for P waves in leads II and V1 to investigate the rhythm.",
  },
  "00011": {
    title: "PR · Find where the P wave begins",
    lead: "II", kind: "PR", start: 0.25, seconds: 1, gain: 20,
    pairs: [[214, 301]], tolerance: 8,
    landmarks: ["Where the small, rounded P wave starts to leave the baseline.", "Where the QRS first leaves the baseline, before the tall peak."],
    interpretation: "This estimates the time from the start of atrial activation to the start of ventricular activation in this beat in lead II. The gradual rise of the P wave makes its onset approximate.",
  },
  "03155": {
    title: "QRS · Measure the whole complex",
    lead: "V1", kind: "QRS", start: 0, seconds: 1, gain: 20,
    pairs: [[116, 179]], tolerance: 8,
    landmarks: ["Where the first sharp complex leaves the baseline.", "Where its last sharp deflection ends. Include both upward peaks."],
    interpretation: "This estimates how long ventricular activation is visible in V1 for one beat. Compare synchronized leads to find the earliest QRS start and latest QRS end for the overall duration.",
  },
};
