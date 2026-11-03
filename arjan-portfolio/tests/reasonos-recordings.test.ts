import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  RECORDINGS,
  imageInterval,
  reportCalculations,
  validateImagePoint,
  type ImageCalibration,
} from "@/lib/reasonos/recordings";
import {
  attemptTransformation,
  initialSnapshot,
  replayTrace,
  type Provenance,
} from "@/lib/reasonos/kernel";
import type { StateId } from "@/lib/reasonos/core/types";
import { projectTrace } from "@/lib/reasonos/core/browser";

const recording = RECORDINGS[0];
const calibration: ImageCalibration = {
  a: { x: 100, y: 100 },
  b: { x: 300, y: 100 },
  mm: 25,
  speed: 25,
  errorPx: 1,
};
const config = {
  kind: "recording-image",
  recording: {
    id: recording.id,
    sha256: recording.sha256,
    width: recording.width,
    height: recording.height,
  },
  calibration,
  speed: 25,
  gain: 10,
  pixelsPerMm: 8,
};
const p: Provenance = {
  source: recording.image,
  method: "Selected source pixels",
  verification: "user-confirmed",
  witnessType: "learner-derived",
  modelVersion: null,
};
const key = JSON.stringify(config);
function calibrated() {
  const source = attemptTransformation(initialSnapshot(), {
    operator: "Inspect",
    actor: "system",
    domain: "ecg",
    inputStateIds: ["state-000-source"],
    summary: "Contributed ECG image",
    provenance: {
      ...p,
      witnessType: "reference-derived",
      verification: "unverified",
    },
    evidenceRefs: [`source=${key}`],
  });
  return attemptTransformation(source, {
    operator: "Calibrate",
    actor: "learner",
    domain: "ecg",
    inputStateIds: [source.states.at(-1)!.id],
    summary: "Confirmed local grid",
    provenance: p,
    evidenceRefs: [`source=${key}`, "gridConfirmed=true"],
  });
}
describe("recorded ECG calculations", () => {
  it("pins each unchanged public image to its actual digest and printed report values", () => {
    for (const recording of RECORDINGS)
      expect(
        createHash("sha256")
          .update(readFileSync(`public${recording.image}`))
          .digest("hex"),
      ).toBe(recording.sha256);
    expect(
      RECORDINGS.map((r) => [
        r.id,
        r.report.rate,
        r.report.qrs,
        r.report.qt,
        r.report.qtc,
      ]),
    ).toEqual([
      ["A", 82, 83, 357, 396],
      ["B", 81, 80, 357, 394],
    ]);
    expect(RECORDINGS[0].archiveImage).toBe("public/cases/recording-b.png");
  });
  it("calculates both QT corrections from recorded rate and QT without inventing a waveform", () => {
    for (const record of RECORDINGS) {
      const result = reportCalculations(record);
      expect(result.rrMs).toBeCloseTo(60000 / record.report.rate, 12);
      expect(result.bazettMs).toBeCloseTo(
        record.report.qt * Math.sqrt(record.report.rate / 60),
        12,
      );
      expect(result.fridericiaMs).toBeCloseTo(
        record.report.qt * Math.cbrt(record.report.rate / 60),
        12,
      );
    }
  });
  it("measures elapsed time along the photographed grid axis, invariant under rigid rotation and translation", () => {
    const a = { x: 150, y: 200 },
      b = { x: 310, y: 240 };
    const base = imageInterval(a, b, calibration);
    expect(base.duration).toBe(800);
    for (const angle of [-0.4, 0.1, 0.5]) {
      const f = ({ x, y }: { x: number; y: number }) => ({
        x: x * Math.cos(angle) - y * Math.sin(angle) + 300,
        y: x * Math.sin(angle) + y * Math.cos(angle) + 200,
      });
      const result = imageInterval(f(a), f(b), {
        ...calibration,
        a: f(calibration.a),
        b: f(calibration.b),
      });
      expect(result.duration).toBeCloseTo(base.duration, 10);
      expect(result.low).toBeCloseTo(base.low, 10);
      expect(result.high).toBeCloseTo(base.high, 10);
    }
  });
  it("bounds endpoint placement and uncertainty in grid direction and scale", () => {
    const a = { x: 150, y: 200 },
      b = { x: 310, y: 240 };
    const bound = imageInterval(a, b, calibration);
    let seed = 73;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    const perturb = (p: { x: number; y: number }) => {
      const t = random() * 2 * Math.PI,
        r = random();
      return { x: p.x + r * Math.cos(t), y: p.y + r * Math.sin(t) };
    };
    for (let i = 0; i < 400; i++) {
      const sample = imageInterval(perturb(a), perturb(b), {
        ...calibration,
        errorPx: 0,
        a: perturb(calibration.a),
        b: perturb(calibration.b),
      });
      expect(sample.duration).toBeGreaterThanOrEqual(bound.low);
      expect(sample.duration).toBeLessThanOrEqual(bound.high);
    }
  });
  it("rejects invalid image bounds and an undefined or reversed grid", () => {
    expect(() => validateImagePoint({ x: 2201, y: 50 }, recording)).toThrow();
    expect(() =>
      imageInterval({ x: 0, y: 0 }, { x: 2, y: 1 }, { ...calibration, mm: 0 }),
    ).toThrow();
    expect(() =>
      imageInterval(
        { x: 0, y: 0 },
        { x: 2, y: 1 },
        { ...calibration, a: calibration.b, b: calibration.a },
      ),
    ).toThrow();
    expect(() =>
      imageInterval(
        { x: 0, y: 0 },
        { x: 2, y: 1 },
        { ...calibration, errorPx: 101 },
      ),
    ).toThrow();
  });
  it("requires explicit grid confirmation and the registered image identity", () => {
    const attempt = {
      operator: "Calibrate" as const,
      actor: "learner" as const,
      domain: "ecg" as const,
      inputStateIds: ["state-000-source"],
      summary: "Calibration",
      provenance: p,
    };
    expect(
      attemptTransformation(initialSnapshot(), {
        ...attempt,
        evidenceRefs: [`source=${key}`],
      }).trace.at(-1)?.accepted,
    ).toBe(false);
    const forged = {
      ...config,
      recording: { ...config.recording, sha256: "0".repeat(64) },
    };
    expect(
      attemptTransformation(initialSnapshot(), {
        ...attempt,
        evidenceRefs: [
          `source=${JSON.stringify(forged)}`,
          "gridConfirmed=true",
        ],
      }).trace.at(-1)?.accepted,
    ).toBe(false);
    expect(calibrated().trace.at(-1)?.accepted).toBe(true);
    const wrongSpeed = {
      ...config,
      speed: 50,
      calibration: { ...calibration, speed: 50 },
    };
    expect(
      attemptTransformation(initialSnapshot(), {
        ...attempt,
        evidenceRefs: [
          `source=${JSON.stringify(wrongSpeed)}`,
          "gridConfirmed=true",
        ],
      }).trace.at(-1)?.accepted,
    ).toBe(false);
  });
  it("recomputes image measurements from raw pixels and preserves actual-image provenance through replay", () => {
    const c = calibrated();
    const result = attemptTransformation(c, {
      operator: "Measure",
      actor: "learner",
      domain: "ecg",
      inputStateIds: [c.states.at(-1)!.id],
      summary: "Image QRS",
      provenance: p,
      evidenceRefs: [
        `source=${key}`,
        "kind=QRS",
        "imageAX=200",
        "imageAY=1100",
        "imageBX=360",
        "imageBY=1100",
        "startMs=0",
        "endMs=80",
        "uncertaintyMs=0",
      ],
    });
    expect(result.trace.at(-1)?.accepted).toBe(true);
    const measurement = projectTrace(result.journal).states.get(
      result.states.at(-1)!.id as StateId,
    )!;
    expect(measurement.payload.duration).toBe(800);
    expect(measurement.payload.uncertainty).toBeGreaterThan(0);
    expect(measurement.payload.rawOperation).toEqual({
      a: { x: 200, y: 1100 },
      b: { x: 360, y: 1100 },
    });
    expect(measurement.provenance.modelVersion).toBeNull();
    expect(measurement.provenance.witnessType).toBe("learner-derived");
    expect(replayTrace(result.trace, result.journal).states).toEqual(
      result.states,
    );
  });
});
