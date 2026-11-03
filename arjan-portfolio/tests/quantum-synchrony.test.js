import { describe, it, expect } from "vitest";
import {
  initial,
  interpolate,
  abs2,
  pulseArea,
} from "../public/quantum-computer-lab/simulator.js";

describe("shared pulse clock", () => {
  it("uses the integrated plotted envelope for state rotation at every scrub position", () => {
    for (const name of ["X", "Y", "Rx", "Ry"]) {
      const angle = name.startsWith("R") ? 1.3 : Math.PI;
      for (let k = 0; k <= 100; k++) {
        const fraction = k / 100;
        const state = interpolate(
          initial(1),
          { name, target: 0, angle },
          fraction,
        );
        const theta = angle * pulseArea("drive", fraction);
        expect(abs2(state[1])).toBeCloseTo(Math.sin(theta / 2) ** 2, 11);
        expect(state.reduce((sum, a) => sum + abs2(a), 0)).toBeCloseTo(1, 11);
      }
    }
  });
  it("keeps envelope area continuous, monotone, normalized, and bounded for drive and flux", () => {
    for (const kind of ["drive", "flux"]) {
      expect(pulseArea(kind, -1)).toBe(0);
      expect(pulseArea(kind, 2)).toBeCloseTo(1, 13);
      expect(pulseArea(kind, 0.5)).toBeCloseTo(0.5, 13);
      let previous = 0;
      for (let k = 0; k <= 100; k++) {
        const value = pulseArea(kind, k / 100);
        expect(value).toBeGreaterThanOrEqual(previous - 1e-12);
        previous = value;
      }
      expect(pulseArea(kind, 0.4) - pulseArea(kind, 0.3)).toBeGreaterThan(
        pulseArea(kind, 0.1),
      );
    }
  });
});
