import { describe, it, expect } from "vitest";
import {
  initial,
  ensembleDensity,
  distribution,
  pure,
  mul,
  phase,
} from "../public/quantum-computer-lab/simulator.js";
import { bellEvidence } from "../public/quantum-computer-lab/teaching.js";
const bell = [
  { name: "H", target: 0 },
  { name: "CNOT", control: 0, target: 1 },
];
describe("joint coherence and witnesses", () => {
  it("separates a coherent Bell pair from its projectively dephased ensemble with the same Z populations", () => {
    const rho = ensembleDensity(initial(2), bell);
    const mixture = ensembleDensity(initial(2), [
      ...bell,
      { name: "M", target: 0 },
    ]);
    expect(rho.map((row, j) => row[j][0])).toEqual(
      mixture.map((row, j) => row[j][0]),
    );
    expect(rho[0][3][0]).toBeCloseTo(0.5, 12);
    expect(mixture[0][3]).toEqual([0, 0]);
    expect(bellEvidence(rho).correlations).toEqual({
      X: expect.closeTo(1, 12),
      Y: expect.closeTo(-1, 12),
      Z: expect.closeTo(1, 12),
    });
    expect(bellEvidence(mixture).correlations).toEqual({
      X: 0,
      Y: 0,
      Z: expect.closeTo(1, 12),
    });
    expect(bellEvidence(rho).fidelity).toBeCloseTo(1, 12);
    expect(bellEvidence(mixture).fidelity).toBeCloseTo(0.5, 12);
    expect(bellEvidence(mixture).purity).toBeCloseTo(0.5, 12);
  });
  it("rotates joint phase while preserving Z probabilities and keeps the witness target-specific", () => {
    for (let k = 0; k <= 40; k++) {
      const angle = -Math.PI + (2 * Math.PI * k) / 40;
      const rho = ensembleDensity(initial(2), [
        ...bell,
        { name: "Rz", target: 0, angle },
      ]);
      const e = bellEvidence(rho);
      expect(e.correlations.X).toBeCloseTo(Math.cos(angle), 12);
      expect(e.correlations.Y).toBeCloseTo(-Math.cos(angle), 12);
      expect(e.correlations.Z).toBeCloseTo(1, 12);
      expect(e.crossXY).toBeCloseTo(Math.sin(angle), 12);
      expect(e.fidelity).toBeCloseTo(Math.cos(angle / 2) ** 2, 12);
      expect(e.coherence[0]).toBeCloseTo(Math.cos(angle) / 2, 12);
      expect(e.coherence[1]).toBeCloseTo(-Math.sin(angle) / 2, 12);
    }
  });
  it("agrees with branch probabilities through native evolution and preserves density-matrix identities", () => {
    for (const circuit of [
      bell,
      [...bell, { name: "M", target: 0 }, { name: "H", target: 1 }],
    ]) {
      for (const fraction of [0, 0.2, 0.5, 0.8, 1]) {
        const rho = ensembleDensity(initial(2), circuit, fraction);
        const probabilities = distribution(initial(2), circuit, fraction);
        rho.forEach((row, r) =>
          row.forEach((a, col) => {
            expect(a[0]).toBeCloseTo(rho[col][r][0], 12);
            expect(a[1]).toBeCloseTo(-rho[col][r][1], 12);
            if (r === col) expect(a[0]).toBeCloseTo(probabilities[r], 12);
          }),
        );
        expect(rho.reduce((sum, row, r) => sum + row[r][0], 0)).toBeCloseTo(
          1,
          12,
        );
      }
    }
  });
  it("never exceeds the separable fidelity bound for complex product-state samples", () => {
    for (let k = 0; k < 30; k++) {
      const a = pure(k * 0.21, k * 0.37),
        b = pure(k * 0.17, k * 0.43);
      const state = a.flatMap((x) => b.map((y) => mul(x, y)));
      expect(
        bellEvidence(ensembleDensity(state, [])).fidelity,
      ).toBeLessThanOrEqual(0.5 + 1e-12);
      const globallyRotated = state.map((x) => mul(x, phase(0.8)));
      expect(
        bellEvidence(ensembleDensity(globallyRotated, [])).fidelity,
      ).toBeCloseTo(bellEvidence(ensembleDensity(state, [])).fidelity, 12);
    }
  });
});
