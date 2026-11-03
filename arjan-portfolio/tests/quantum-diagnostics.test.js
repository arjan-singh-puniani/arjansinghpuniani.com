import { describe, it, expect } from "vitest";
import {
  diagnostic,
  diagnostics,
} from "../public/quantum-computer-lab/diagnostics.js";
describe("subsystem teaching models", () => {
  it("has a finite, different, inspectable nominal and fault result for every module", () => {
    expect(diagnostics).toHaveLength(12);
    diagnostics.forEach((d, i) => {
      expect(Number.isFinite(diagnostic(i, d.good).y)).toBe(true);
      expect(Number.isFinite(diagnostic(i, d.bad).y)).toBe(true);
      expect(diagnostic(i, d.good).y).not.toBeCloseTo(
        diagnostic(i, d.bad).y,
        5,
      );
      expect(d.assumption).toBeTruthy();
      expect(d.symbols).toBeTruthy();
    });
  });
  it("uses the correct limiting behavior for phase, detuning, pulse area, and shot noise", () => {
    expect(diagnostic(0, 0).y).toBe(1);
    expect(diagnostic(7, 0).y).toBeCloseTo(1, 12);
    expect(diagnostic(8, 0).y).toBe(1);
    expect(diagnostic(9, 0).y).toBe(0);
    expect(diagnostic(9, Math.PI).y).toBeCloseTo(1, 12);
    expect(diagnostic(10, 1).y).toBe(1);
    expect(diagnostic(10, 0).y).toBe(0);
    expect(diagnostic(11, 100).y).toBeCloseTo(0.05, 12);
  });
  it("agrees with the Gaussian 1σ tail and equilibrium photon occupation", () => {
    expect(diagnostic(6, 1).y).toBeCloseTo(0.15865525, 5);
    expect(diagnostic(1, 15).y).toBeLessThan(0.000001);
    expect(diagnostic(1, 300).y).toBeCloseTo(0.81615, 3);
  });
  it("bounds inputs and rejects invalid stage indices and nonfinite values", () => {
    expect(diagnostic(10, -20).x).toBe(0);
    expect(diagnostic(10, 200).x).toBe(1.5);
    expect(() => diagnostic(-1, 0)).toThrow();
    expect(() => diagnostic(0, NaN)).toThrow();
  });
});
