import { describe, expect, it } from "vitest";
import {
  bestCandidatePath,
  candidatePaths,
  correctedQt,
  frontalAxis,
  intervalMs,
  voltageMv,
  weightedJaccard,
} from "@/lib/reasonos/vector";

const calibration = {
  speedMmPerSecond: 25,
  gainMmPerMv: 10,
  pixelsPerMm: 4,
};

describe("ReasonOS vector measurements", () => {
  it("converts pixel deltas into interval and voltage measurements", () => {
    expect(intervalMs(100, calibration)).toBe(1000);
    expect(intervalMs(-100, calibration)).toBe(1000);
    expect(voltageMv(80, calibration)).toBe(2);
    expect(voltageMv(-80, calibration)).toBe(2);
  });

  it("computes QT correction formulas", () => {
    expect(correctedQt(400, 1000)).toEqual({ bazettMs: 400, fridericiaMs: 400 });
    expect(correctedQt(360, 800)).toEqual({
      bazettMs: Math.round(360 / Math.sqrt(0.8)),
      fridericiaMs: Math.round(360 / Math.cbrt(0.8)),
    });
  });

  it.each([
    [1, 1, "normal"],
    [1, -1, "left"],
    [-1, 1, "right"],
    [-1, -1, "extreme"],
  ] as const)("classifies every frontal-axis quadrant", (leadI, avf, quadrant) => {
    expect(frontalAxis(leadI, avf).quadrant).toBe(quadrant);
  });

  it("handles empty and partially overlapping weighted evidence", () => {
    expect(weightedJaccard({}, {})).toBe(0);
    expect(weightedJaccard({ a: 1, b: 0.5 }, { a: 0.5, c: 1 })).toBeCloseTo(0.2);
  });

  it("chooses the best matching candidate path", () => {
    const winner = bestCandidatePath({
      regularity: 1,
      pBeforeQrs: 1,
      narrowQrs: 0.8,
    });
    expect(winner.id).toBe("morphology-led");
    expect(winner.score).toBeCloseTo(1);
    expect(candidatePaths.every((path) => path.status === "candidate")).toBe(true);
  });
});
