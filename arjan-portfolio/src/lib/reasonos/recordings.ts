export interface ImagePoint {
  x: number;
  y: number;
}
export interface ImageCalibration {
  a: ImagePoint;
  b: ImagePoint;
  mm: number;
  speed: number;
  errorPx: number;
}
export interface Recording {
  id: "A" | "B";
  image: string;
  width: number;
  height: number;
  paperSpeed: number;
  gain: number;
  sha256: string;
  archiveImage: string;
  archiveSha256: string;
  report: {
    rate: number;
    pr: number;
    qrs: number;
    qt: number;
    qtc: number;
    axes: readonly number[];
  };
  rhythm: { x: number; y: number; width: number; height: number };
  initialMarkers: readonly [ImagePoint, ImagePoint];
  initialGrid: readonly [ImagePoint, ImagePoint];
}
// Public A/B labels predate the archive import. The original archive filenames are reversed.
export const RECORDINGS: readonly Recording[] = [
  {
    id: "A",
    image: "/images/reasonos/asp-001-recording-a.webp",
    width: 2200,
    height: 1180,
    paperSpeed: 25,
    gain: 10,
    sha256: "b867797c34d1ef502d46e07c9daacbd1b5836ecdc3d3774152f8f19a59dede2e",
    archiveImage: "public/cases/recording-b.png",
    archiveSha256:
      "f459641a934fb59587199b9d5891724f2d1dd00c6be294b583dc9310f812a048",
    report: {
      rate: 82,
      pr: 149,
      qrs: 83,
      qt: 357,
      qtc: 396,
      axes: [-3, 39, 53],
    },
    rhythm: { x: 100, y: 990, width: 760, height: 190 },
    initialMarkers: [
      { x: 294, y: 1060 },
      { x: 438, y: 1065 },
    ],
    initialGrid: [
      { x: 180, y: 1155 },
      { x: 380, y: 1157 },
    ],
  },
  {
    id: "B",
    image: "/images/reasonos/asp-001-recording-b.webp",
    width: 2110,
    height: 1220,
    paperSpeed: 25,
    gain: 10,
    sha256: "fe2569d277fa8c739c3c00347c7949c7937068bbceb15b8d62df95d51986cc23",
    archiveImage: "public/cases/recording-a.png",
    archiveSha256:
      "8370d3477d95641d35c6863a68333ded0218546763805fcdeafb5d005ecebf0b",
    report: {
      rate: 81,
      pr: 155,
      qrs: 80,
      qt: 357,
      qtc: 394,
      axes: [12, 40, 55],
    },
    rhythm: { x: 25, y: 975, width: 760, height: 245 },
    initialMarkers: [
      { x: 135, y: 1060 },
      { x: 278, y: 1075 },
    ],
    initialGrid: [
      { x: 80, y: 1145 },
      { x: 280, y: 1165 },
    ],
  },
];

export function validateImagePoint(
  point: ImagePoint,
  recording: Pick<Recording, "width" | "height">,
) {
  if (
    ![point.x, point.y].every(Number.isFinite) ||
    point.x < 0 ||
    point.x > recording.width ||
    point.y < 0 ||
    point.y > recording.height
  )
    throw new RangeError(
      "Markers must be finite coordinates inside the source image.",
    );
}

export function imageInterval(
  a: ImagePoint,
  b: ImagePoint,
  c: ImageCalibration,
) {
  if (
    ![
      a.x,
      a.y,
      b.x,
      b.y,
      c.a.x,
      c.a.y,
      c.b.x,
      c.b.y,
      c.mm,
      c.speed,
      c.errorPx,
    ].every(Number.isFinite) ||
    c.mm <= 0 ||
    c.speed <= 0 ||
    c.errorPx < 0 ||
    c.b.x <= c.a.x
  )
    throw new RangeError(
      "Calibration needs ordered grid points, a positive span and speed, and a nonnegative pixel bound.",
    );
  const dx = c.b.x - c.a.x,
    dy = c.b.y - c.a.y,
    referencePx = Math.hypot(dx, dy),
    e = 2 * c.errorPx;
  if (referencePx <= e)
    throw new RangeError("The grid span must exceed its endpoint uncertainty.");
  const deltaX = b.x - a.x,
    deltaY = b.y - a.y;
  const projectedPx = (deltaX * dx + deltaY * dy) / referencePx;
  const pixelsPerMm = referencePx / c.mm;
  const duration = (Math.abs(projectedPx) / pixelsPerMm / c.speed) * 1000;
  // Calibration endpoints can change both scale and paper-axis direction.
  const angleBound = Math.asin(e / referencePx);
  const projectionBound =
    e + Math.hypot(deltaX, deltaY) * 2 * Math.sin(angleBound / 2);
  const low =
    ((Math.max(0, Math.abs(projectedPx) - projectionBound) * c.mm) /
      (referencePx + e) /
      c.speed) *
    1000;
  const high =
    (((Math.abs(projectedPx) + projectionBound) * c.mm) /
      (referencePx - e) /
      c.speed) *
    1000;
  return {
    duration,
    projectedPx,
    pixelsPerMm,
    ordered: projectedPx > 0,
    low,
    high,
    uncertainty: Math.max(duration - low, high - duration),
  };
}

export function reportCalculations(recording: Recording) {
  const { rate, qt } = recording.report;
  const rrMs = 60000 / rate;
  return {
    rrMs,
    bazettMs: qt / Math.sqrt(rrMs / 1000),
    fridericiaMs: qt / Math.cbrt(rrMs / 1000),
  };
}

export function recordingLeadRegion(recording: Recording, lead: string) {
  if (lead === "II-rhythm") return recording.rhythm;
  const rows = [
    ["I", "aVR", "V1", "V4"],
    ["II", "aVL", "V2", "V5"],
    ["III", "aVF", "V3", "V6"],
  ];
  const row = rows.findIndex((values) => values.includes(lead));
  if (row < 0) throw new RangeError("Unknown recorded lead");
  const column = rows[row].indexOf(lead);
  const edges =
    recording.id === "A"
      ? [100, 630, 1140, 1630, 2140]
      : [25, 560, 1050, 1570, 2080];
  const y =
    recording.id === "A" ? 20 + row * 320 : 45 + row * 335 + column * 38;
  return {
    x: edges[column],
    y,
    width: edges[column + 1] - edges[column],
    height: Math.min(285, recording.height - y),
  };
}
