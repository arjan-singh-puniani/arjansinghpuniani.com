import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL, leadVoltages, vectorAt } from "../src/lib/reasonos/model";
import { CONDUCTOR, ELECTRODES, SOURCE_PHASES, dipolePotential, frontPolarity, leadReading, sourceDipole, sourcePhase, syntheticLeadPath } from "../src/lib/reasonos/signal-origin";

describe("ECG signal-origin forward model", () => {
  it("uses the analytic current-dipole field with correct units and distance scaling", () => {
    const p = [1e-5, 0] as const;
    expect(dipolePotential([0.2, 0], p)).toBeCloseTo(1e-5 / (4 * Math.PI * CONDUCTOR.conductivity * .2 ** 2), 12);
    expect(dipolePotential([0.4, 0], p)).toBeCloseTo(dipolePotential([0.2, 0], p) / 4, 12);
    expect(dipolePotential([0, .2], p)).toBe(0);
    expect(dipolePotential([-.2, 0], p)).toBeCloseTo(-dipolePotential([.2, 0], p), 12);
    expect(() => dipolePotential([0, 0], p)).toThrow();
    expect(() => sourceDipole(NaN)).toThrow();
    expect(() => dipolePotential([Infinity, 0], p)).toThrow();
  });
  it("retains the existing teaching waveform through explicit electrode geometry", () => {
    for (let time = 0; time <= 820; time += 2) {
      const existing = leadVoltages(vectorAt(time, DEFAULT_MODEL));
      for (const lead of ["I", "II", "III"] as const) {
        const result = leadReading(time, lead);
        expect(result.voltageMv).toBeCloseTo(existing[lead], 12);
        expect((result.p[0] * result.field[0] + result.p[1] * result.field[1]) * 1000).toBeCloseTo(result.voltageMv, 12);
        expect(result.voltageMv).toBeCloseTo(result.potentials[result.positive] - result.potentials[result.negative], 12);
      }
      expect(leadReading(time, "I").voltageMv + leadReading(time, "III").voltageMv).toBeCloseTo(leadReading(time, "II").voltageMv, 12);
    }
    for (const position of Object.values(ELECTRODES)) expect(Math.hypot(...position)).toBeCloseTo(CONDUCTOR.electrodeRadius, 12);
  });
  it("reverses only the measurement, with no change to the source or potential field", () => {
    const forward = leadReading(240, "II"), reverse = leadReading(240, "II", true);
    expect(reverse.p).toEqual(forward.p);
    expect(reverse.potentials).toEqual(forward.potentials);
    expect(reverse.voltageMv).toBe(-forward.voltageMv);
    expect(reverse.positive).toBe(forward.negative);
    expect(reverse.negative).toBe(forward.positive);
    expect((reverse.p[0] * reverse.field[0] + reverse.p[1] * reverse.field[1]) * 1000).toBeCloseTo(reverse.voltageMv, 12);
    expect(syntheticLeadPath("II", true)[120][1]).toBe(reverse.voltageMv);
  });
  it("keeps phase landmarks consistent and labels exactly-zero prescribed sources", () => {
    for (const phase of SOURCE_PHASES) {
      expect(sourcePhase(phase.time).id).toBe(phase.id);
      if (["PR", "ST", "rest"].includes(phase.id)) expect(sourceDipole(phase.time)).toEqual([0, 0]);
      else expect(Math.hypot(...sourceDipole(phase.time))).toBeGreaterThan(0);
    }
    expect(sourcePhase(820).id).toBe("rest");
    expect(() => sourcePhase(NaN)).toThrow();
  });
  it("represents all four local boundary-polarity cases without confusing process and direction", () => {
    expect(frontPolarity(false, true)).toBe(1);
    expect(frontPolarity(false, false)).toBe(-1);
    expect(frontPolarity(true, true)).toBe(-1);
    expect(frontPolarity(true, false)).toBe(1);
  });
});
