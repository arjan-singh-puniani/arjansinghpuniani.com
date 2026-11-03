export const STANDARD_LEADS = [
  "I",
  "II",
  "III",
  "AVR",
  "AVL",
  "AVF",
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
] as const;
export type StandardLead = (typeof STANDARD_LEADS)[number];
export type ReferencePattern = "sinus" | "afib" | "rbbb" | "lbbb";
export const REFERENCE_CASES = [
  {
    id: "00010",
    label: "Case 1",
    displayGain: 10,
    pattern: "sinus" as const,
    annotation: "NORM, SR",
    title: "Sinus pattern without the listed bundle-branch blocks",
    reason:
      "Look for a repeating P before each QRS, a consistent PR, and a narrow QRS. Compare atrial polarity in II and aVR. The source annotates NORM and SR. Sinus rhythm describes impulse origin; it does not exclude every other ECG abnormality.",
    url: "https://ecg.utah.edu/lesson/3",
  },
  {
    id: "08215",
    label: "Case 2",
    displayGain: 10,
    pattern: "afib" as const,
    annotation: "AFIB",
    title: "Atrial fibrillation pattern",
    reason:
      "Compare successive RR intervals across the ten-second strip and inspect II and V1 for atrial activity. Irregularly irregular ventricular timing without a consistent sinus P–QRS sequence supports this pattern. Irregularity alone also occurs with ectopy, multifocal atrial rhythms, and flutter with variable conduction.",
    url: "https://ecg.utah.edu/lesson/5-2",
  },
  {
    id: "03155",
    label: "Case 3",
    displayGain: 10,
    pattern: "rbbb" as const,
    annotation: "CRBBB, SR",
    title: "Complete right bundle-branch block pattern",
    reason:
      "For the adult complete pattern, check QRS ≥120 ms together with a terminal R′ in V1 and terminal S forces in I and V6. Delayed right-ventricular activation explains the late rightward/anterior forces. Measure several representative beats; QRS width alone does not distinguish this from left bundle-branch block or another wide-complex origin.",
    url: "https://ecg.utah.edu/lesson/6",
  },
  {
    id: "00618",
    label: "Case 4",
    displayGain: 5,
    pattern: "lbbb" as const,
    annotation: "CLBBB, SR",
    title: "Complete left bundle-branch block pattern",
    reason:
      "For the adult complete pattern, check QRS ≥120 ms, predominantly negative terminal forces in V1, and broad lateral R waves in I, aVL, and V6. Delayed left-ventricular activation produces late leftward/posterior forces. Assess ST–T direction relative to the altered QRS; a wide complex is not sufficient by itself.",
    url: "https://ecg.utah.edu/lesson/6",
  },
] as const;
export interface ReferenceSignal {
  sampleRate: number;
  sampleCount: number;
  leads: readonly StandardLead[];
  gains: readonly number[];
  baselines: readonly number[];
  adc: readonly Int16Array[];
}
export function decodeReferenceECG(
  header: string,
  buffer: ArrayBuffer,
): ReferenceSignal {
  const lines = header.trim().split(/\r?\n/);
  const record = lines[0].trim().split(/\s+/);
  const channels = Number(record[1]),
    sampleRate = Number(record[2]),
    sampleCount = Number(record[3]);
  if (
    channels !== 12 ||
    sampleRate !== 500 ||
    sampleCount !== 5000 ||
    buffer.byteLength !== channels * sampleCount * 2
  )
    throw new RangeError("Unsupported or incomplete reference ECG");
  const gains: number[] = [],
    baselines: number[] = [],
    leads: StandardLead[] = [],
    checksums: number[] = [];
  for (let i = 0; i < channels; i++) {
    const fields = lines[i + 1]?.trim().split(/\s+/);
    const scale = fields?.[2]?.match(/^([\d.]+)\((-?\d+)\)\/mV$/);
    if (
      !fields ||
      fields[1] !== "16" ||
      !scale ||
      !Number.isFinite(Number(scale[1])) ||
      !Number.isFinite(Number(scale[2])) ||
      Number(scale[1]) <= 0 ||
      !/^-?\d+$/.test(fields[6] ?? "") ||
      !Number.isInteger(Number(fields[6])) ||
      fields.at(-1) !== STANDARD_LEADS[i]
    )
      throw new RangeError("Unexpected WFDB channel calibration");
    gains.push(Number(scale[1]));
    baselines.push(Number(scale[2]));
    leads.push(STANDARD_LEADS[i]);
    checksums.push(Number(fields[6]));
  }
  const adc = Array.from(
    { length: channels },
    () => new Int16Array(sampleCount),
  );
  const data = new DataView(buffer);
  for (let i = 0; i < sampleCount; i++)
    for (let lead = 0; lead < channels; lead++)
      adc[lead][i] = data.getInt16((i * channels + lead) * 2, true);
  for (let lead = 0; lead < channels; lead++) {
    let sum = 0;
    for (const value of adc[lead]) sum = (sum + value) & 65535;
    if (sum !== (checksums[lead] & 65535))
      throw new RangeError("Reference ECG channel checksum failed");
  }
  return { sampleRate, sampleCount, leads, gains, baselines, adc };
}
export function referenceVoltage(
  signal: ReferenceSignal,
  lead: StandardLead,
  index: number,
) {
  if (!Number.isInteger(index) || index < 0 || index >= signal.sampleCount)
    throw new RangeError("Sample index outside the recording");
  const channel = signal.leads.indexOf(lead);
  if (channel < 0) throw new RangeError("Unknown ECG lead");
  return (
    (signal.adc[channel][index] - signal.baselines[channel]) /
    signal.gains[channel]
  );
}
export function referenceInterval(
  signal: ReferenceSignal,
  a: number,
  b: number,
) {
  if (
    ![a, b].every(
      (i) => Number.isInteger(i) && i >= 0 && i < signal.sampleCount,
    )
  )
    throw new RangeError("Calipers must select native sample indices");
  return (Math.abs(b - a) / signal.sampleRate) * 1000;
}
