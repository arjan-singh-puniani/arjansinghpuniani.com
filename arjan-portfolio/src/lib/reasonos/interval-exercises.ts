export type IntervalExercise = {
  title: string;
  lead: "II" | "V1";
  kind: "RR" | "PR" | "QRS";
  start: number;
  seconds: number;
  gain: number;
  pairs: readonly (readonly [number, number])[];
  tolerance: number;
  prompt: string;
  interpretation: string;
};

// Worked landmarks are manually selected in the original 500 Hz samples.
export const INTERVAL_EXERCISES: Readonly<Partial<Record<string, IntervalExercise>>> = {
  "00012": {
    title: "R–R · Estimate a beat rate",
    lead: "II", kind: "RR", start: 0.6, seconds: 2.5, gain: 20,
    pairs: [[592, 1214]], tolerance: 5,
    prompt: "Measure from the top of the first tall R peak to the top of the second. Save that interval to estimate the rate for this pair of beats.",
    interpretation: "This is a rate estimate from one pair of beats. Compare more R–R intervals to assess how steady the timing is.",
  },
  "08215": {
    title: "R–R · Compare consecutive beats",
    lead: "II", kind: "RR", start: 0, seconds: 2.5, gain: 20,
    pairs: [[99, 494], [494, 795]], tolerance: 5,
    prompt: "Save the interval from the first tall R peak to the second. Then save the interval from the second to the third. The middle peak is shared by both measurements.",
    interpretation: "These beats have different ventricular timing. Inspect atrial activity in II and V1 and compare more beats to investigate the rhythm.",
  },
  "00011": {
    title: "PR · Find where the P wave begins",
    lead: "II", kind: "PR", start: 0.25, seconds: 1, gain: 20,
    pairs: [[214, 301]], tolerance: 8,
    prompt: "Find the small rounded P wave just before the tall spike. Mark where the P wave starts to leave the baseline, then where the QRS begins. Save the interval.",
    interpretation: "This estimates the time from the start of atrial activation to the start of ventricular activation in this beat as seen in lead II. The gradual rise of the P wave makes its onset approximate.",
  },
  "03155": {
    title: "QRS · Measure the whole complex",
    lead: "V1", kind: "QRS", start: 0, seconds: 1, gain: 20,
    pairs: [[116, 179]], tolerance: 8,
    prompt: "Mark the first departure from baseline and the end of the last sharp deflection, just before the flatter segment. Include both positive peaks in the first complex. Save the interval.",
    interpretation: "This estimates QRS width in V1 for one beat. Compare synchronized leads for the earliest onset and latest offset. Conduction patterns also depend on the shape and direction of the deflections across leads.",
  },
};
