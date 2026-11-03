import { z } from "zod";
import { LEAD_FIELDS, type Lead } from "./model";
import { RECORDINGS } from "./recordings";
import { CHEST_LEADS, type ConnectionLead } from "./connections";
export const DIGITIZED_ECG_SHA256 =
  "8d7f660f00fe8a05bbe7e8c1396059e1ca9c6c43fcb9fe6963085964aef1e4b2";

const finite = z.number().finite();
const sourcePoint = z.tuple([finite.min(0).max(2110), finite.min(0).max(1220)]);
const recordSchema = z.object({
  lead: z.enum(["I", "II", "III", "aVR", "aVL", "aVF", ...CHEST_LEADS]),
  column: z.number().int().min(1).max(4),
  sourceMatrixMmPerPixel: z.tuple([
    z.tuple([finite, finite]),
    z.tuple([finite, finite]),
  ]),
  guide: z.array(sourcePoint).min(8).max(100),
  baselineGuideIndices: z.tuple([
    z.number().int().nonnegative(),
    z.number().int().nonnegative(),
  ]),
  landmarkGuideIndices: z.array(z.number().int().nonnegative()).length(8),
  landmarksMs: z.object({
    pStart: finite,
    pEnd: finite,
    qrsStart: finite,
    qrsEnd: finite,
    tStart: finite,
    tEnd: finite,
    qrsPeak: finite,
    nextQrsPeak: finite,
  }),
  points: z
    .array(
      z.tuple([
        finite,
        finite.min(-5).max(5),
        finite.min(0).max(2110),
        finite.min(0).max(1220),
      ]),
    )
    .min(2)
    .max(5000),
  faintTimeSpans: z.array(z.tuple([finite, finite])),
  maximumGuideClockAdjustmentMs: finite.min(0).max(18),
  inkSupportFraction: finite.min(0).max(1),
});
const schema = z.object({
  version: z.literal("image-derived-1"),
  recordingId: z.literal("B"),
  sourceImage: z.literal("/images/reasonos/asp-001-recording-b.webp"),
  sourceSHA256: z.literal(RECORDINGS[1].sha256),
  paperSpeedMmPerSecond: z.literal(25),
  gainMmPerMv: z.literal(10),
  method: z.string(),
  status: z.string(),
  alignment: z.string(),
  gridMethod: z.string(),
  records: z.array(recordSchema).length(12),
});
export type DigitizedECG = z.infer<typeof schema>;
export type DigitizedLead = DigitizedECG["records"][number];
export function decodeDigitizedECG(input: unknown): DigitizedECG {
  const data = schema.parse(input);
  if (new Set(data.records.map((r) => r.lead)).size !== 12)
    throw new Error("Duplicated digitized lead");
  for (const r of data.records) {
    if (r.points.some((p, i) => i > 0 && p[0] <= r.points[i - 1][0]))
      throw new Error("Digitized time must increase strictly");
    if (
      [...r.baselineGuideIndices, ...r.landmarkGuideIndices].some(
        (i) => i >= r.guide.length,
      )
    )
      throw new Error("Unknown source guide index");
    const f = r.sourceMatrixMmPerPixel;
    if (f[0][0] * f[1][1] - f[0][1] * f[1][0] <= 0)
      throw new Error("Invalid source grid transformation");
    const m = r.landmarksMs;
    if (
      !(
        m.pStart < m.pEnd &&
        m.pEnd < m.qrsStart &&
        m.qrsStart < m.qrsEnd &&
        m.qrsEnd < m.tStart &&
        m.tStart < m.tEnd &&
        m.qrsPeak < m.nextQrsPeak
      )
    )
      throw new Error("Unordered source landmarks");
  }
  return data;
}
export function digitalValueAt(record: DigitizedLead, timeMs: number) {
  if (!Number.isFinite(timeMs)) throw new RangeError("Time must be finite");
  const points = record.points;
  const t = Math.max(points[0][0], Math.min(points.at(-1)![0], timeMs));
  let lo = 0,
    hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid][0] <= t) lo = mid;
    else hi = mid;
  }
  const a = points[lo],
    b = points[hi],
    fraction = (t - a[0]) / (b[0] - a[0]);
  return {
    timeMs: t,
    voltageMv: a[1] + fraction * (b[1] - a[1]),
    sourceX: a[2] + fraction * (b[2] - a[2]),
    sourceY: a[3] + fraction * (b[3] - a[3]),
    indices: [lo, hi] as const,
    fraction,
  };
}
export function compatibleVector(
  lead: ConnectionLead,
  voltageMv: number,
  sidewaysMv: number,
) {
  if (![voltageMv, sidewaysMv].every(Number.isFinite))
    throw new RangeError("Vector components must be finite");
  if (!(lead in LEAD_FIELDS)) return null;
  const field = LEAD_FIELDS[lead as Lead],
    norm = Math.hypot(...field);
  const unit = [field[0] / norm, field[1] / norm] as const,
    normal = [-unit[1], unit[0]] as const;
  const vector = [
    (voltageMv * field[0]) / norm ** 2 + sidewaysMv * normal[0],
    (voltageMv * field[1]) / norm ** 2 + sidewaysMv * normal[1],
  ] as const;
  const foot = [
    (voltageMv * field[0]) / norm ** 2,
    (voltageMv * field[1]) / norm ** 2,
  ] as const;
  return {
    field,
    norm,
    unit,
    normal,
    vector,
    foot,
    value: field[0] * vector[0] + field[1] * vector[1],
  };
}
export function digitalPhase(
  record: DigitizedLead,
  time: number,
): {
  id: "P" | "PR" | "QRS" | "ST" | "T" | "next" | "baseline";
  label: string;
  color: string;
} {
  const m = record.landmarksMs;
  if (time >= m.pStart && time <= m.pEnd)
    return { id: "P", label: "Atrial depolarization", color: "#efbd75" };
  if (time > m.pEnd && time < m.qrsStart)
    return { id: "PR", label: "PR segment", color: "#91a9bc" };
  if (time >= m.qrsStart && time <= m.qrsEnd)
    return { id: "QRS", label: "Ventricular depolarization", color: "#75d3dc" };
  if (time > m.qrsEnd && time < m.tStart)
    return { id: "ST", label: "ST segment", color: "#91a9bc" };
  if (time >= m.tStart && time <= m.tEnd)
    return { id: "T", label: "Ventricular repolarization", color: "#bca7ee" };
  if (Math.abs(time - m.nextQrsPeak) < m.qrsEnd - m.qrsStart)
    return { id: "next", label: "Next QRS complex", color: "#75d3dc" };
  return {
    id: "baseline",
    label: "Between the marked waves",
    color: "#91a9bc",
  };
}
export function digitalInterval(
  record: DigitizedLead,
  kind: "PR" | "QRS" | "QT" | "RR",
): readonly [number, number] {
  const m = record.landmarksMs;
  switch (kind) {
    case "PR":
      return [m.pStart, m.qrsStart];
    case "QRS":
      return [m.qrsStart, m.qrsEnd];
    case "QT":
      return [m.qrsStart, m.tEnd];
    case "RR":
      return [m.qrsPeak, m.nextQrsPeak];
    default:
      throw new RangeError("Unknown interval");
  }
}
