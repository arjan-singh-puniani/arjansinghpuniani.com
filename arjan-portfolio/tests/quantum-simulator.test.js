import { describe, it, expect } from "vitest";
import {
  c,
  abs2,
  mul,
  add,
  conj,
  initial,
  matrix,
  apply,
  run,
  distribution,
  reduced,
  pure,
  shots,
  compile,
  compileSequence,
  measure,
  rng,
  interpolate,
} from "../public/quantum-computer-lab/simulator.js";

const near = (a, b) =>
  a.forEach((v, j) => {
    expect(v[0]).toBeCloseTo(b[j][0], 10);
    expect(v[1]).toBeCloseTo(b[j][1], 10);
  });
const probabilities = (s) => s.map(abs2);
const bellCircuit = [
  { name: "H", target: 0 },
  { name: "CNOT", control: 0, target: 1 },
];
describe("inspectable quantum simulator", () => {
  it("verifies every unitary matrix, including arbitrary rotation angles", () => {
    for (const name of [
      "I",
      "X",
      "Y",
      "Z",
      "H",
      "S",
      "T",
      "Rx",
      "Ry",
      "Rz",
      "CNOT",
      "CZ",
    ]) {
      const u = matrix(name, 1.237);
      for (let r = 0; r < u.length; r++)
        for (let k = 0; k < u.length; k++) {
          const inner = u.reduce(
            (sum, row) => add(sum, mul(conj(row[r]), row[k])),
            c(),
          );
          expect(inner[0]).toBeCloseTo(r === k ? 1 : 0, 12);
          expect(inner[1]).toBeCloseTo(0, 12);
        }
    }
  });
  it("uses q0 as the most significant bit and handles reversed control order", () => {
    near(apply(initial(3), { name: "X", target: 0 }), initial(3, 4));
    near(
      apply(initial(3, 1), { name: "CNOT", control: 2, target: 0 }),
      initial(3, 5),
    );
    near(apply(initial(2, 3), { name: "CZ", control: 1, target: 0 }), [
      c(),
      c(),
      c(),
      c(-1),
    ]);
  });
  it("preserves phases for Y, H, S, T, and all rotations", () => {
    near(apply(initial(1), { name: "Y", target: 0 }), [c(), c(0, 1)]);
    near(
      run(initial(1), [
        { name: "H", target: 0 },
        { name: "Z", target: 0 },
        { name: "H", target: 0 },
      ]).state,
      initial(1, 1),
    );
    near(
      run(initial(1), [
        { name: "H", target: 0 },
        ...Array.from({ length: 8 }, () => ({ name: "T", target: 0 })),
      ]).state,
      apply(initial(1), { name: "H", target: 0 }),
    );
    for (const name of ["Rx", "Ry", "Rz"])
      near(
        run(pure(1.3, 0.7), [
          { name, target: 0, angle: 2.7 },
          { name, target: 0, angle: -2.7 },
        ]).state,
        pure(1.3, 0.7),
      );
  });
  it("calculates Bell amplitudes, reduced density matrices, and phase-sensitive correlations", () => {
    const s = run(initial(2), bellCircuit).state;
    near(s, [c(Math.SQRT1_2), c(), c(), c(Math.SQRT1_2)]);
    for (const q of [0, 1]) {
      const r = reduced(s, q);
      expect(r.purity).toBeCloseTo(0.5, 12);
      r.bloch.forEach((v) => expect(v).toBeCloseTo(0, 12));
    }
    const x = run(s, [
      { name: "H", target: 0 },
      { name: "H", target: 1 },
    ]).state;
    expect(probabilities(x)).toEqual(
      expect.arrayContaining([expect.closeTo(0.5, 10), expect.closeTo(0, 10)]),
    );
    const y = run(s, [
      { name: "Rz", target: 0, angle: -Math.PI / 2 },
      { name: "H", target: 0 },
      { name: "Rz", target: 1, angle: -Math.PI / 2 },
      { name: "H", target: 1 },
    ]).state;
    expect(abs2(y[1]) + abs2(y[2])).toBeCloseTo(1, 12);
  });
  it("distinguishes a product state from entanglement and traces the right qubit", () => {
    const s = run(initial(2), [{ name: "H", target: 0 }]).state;
    near(s, [c(Math.SQRT1_2), c(), c(Math.SQRT1_2), c()]);
    expect(reduced(s, 0).bloch[0]).toBeCloseTo(1, 12);
    expect(reduced(s, 1).bloch[2]).toBeCloseTo(1, 12);
  });
  it("global phase leaves all measurement statistics unchanged; relative phase changes interference", () => {
    for (const gamma of [0, 0.8, Math.PI])
      expect(
        probabilities(apply(pure(1.7, 0.3, gamma), { name: "H", target: 0 })),
      ).toEqual(
        probabilities(apply(pure(1.7, 0.3), { name: "H", target: 0 })).map(
          (v) => expect.closeTo(v, 12),
        ),
      );
    expect(
      abs2(apply(pure(Math.PI / 2, 0), { name: "H", target: 0 })[0]),
    ).toBeCloseTo(1, 12);
    expect(
      abs2(apply(pure(Math.PI / 2, Math.PI), { name: "H", target: 0 })[1]),
    ).toBeCloseTo(1, 12);
  });
  it("collapses projective trajectories while preserving exact ensemble distributions", () => {
    const measured = [...bellCircuit, { name: "M", target: 0 }];
    expect(distribution(initial(2), measured)).toEqual([
      expect.closeTo(0.5, 12),
      0,
      0,
      expect.closeTo(0.5, 12),
    ]);
    const m = run(initial(2), measured, 3, 42);
    expect(m.state.reduce((s, a) => s + abs2(a), 0)).toBeCloseTo(1, 12);
    expect(m.results).toHaveLength(1);
    const seq = [
      { name: "H", target: 0 },
      { name: "M", target: 0 },
      { name: "H", target: 0 },
    ];
    expect(distribution(initial(1), seq)).toEqual([
      expect.closeTo(0.5, 12),
      expect.closeTo(0.5, 12),
    ]);
    expect(measure(initial(1), 0, rng(1)).outcome).toBe(0);
  });
  it("uses seeded shot sampling with configurable noisy discrimination", () => {
    const p = [0.5, 0, 0, 0.5],
      a = shots(p, 1024, 42, 0);
    expect(a).toEqual(shots(p, 1024, 42, 0));
    expect(a.counts[1] + a.counts[2]).toBe(0);
    expect(a.counts[0]).toBeGreaterThan(430);
    expect(a.counts.reduce((a, b) => a + b)).toBe(1024);
    const b = shots(p, 4096, 42, 1);
    expect(b.counts[1] + b.counts[2]).toBeGreaterThan(500);
    expect(shots([1, 0], 128, 1, 0, 1.5).counts).toEqual([128, 0]);
    const projected = run(
      initial(2),
      [...bellCircuit, { name: "M", target: 0 }, { name: "M", target: 1 }],
      4,
      42,
    );
    expect(projected.results[0].outcome).toBe(a.points[0].bit);
  });
  it("compiles native sequences equivalent up to global phase, on every basis vector", () => {
    for (const name of [
      "X",
      "Y",
      "Z",
      "H",
      "S",
      "T",
      "Rx",
      "Ry",
      "Rz",
      "CZ",
      "CNOT",
    ]) {
      const n = ["CZ", "CNOT"].includes(name) ? 2 : 1,
        op = { name, target: n - 1, control: 0, angle: 0.731 };
      for (let j = 0; j < 2 ** n; j++) {
        let s = initial(n, j);
        for (const p of compile(op)) {
          if (p.kind === "drive")
            s = apply(s, {
              name: p.axis === "x" ? "Rx" : "Ry",
              target: p.target,
              angle: p.angle,
            });
          if (p.kind === "frame")
            s = apply(s, { name: "Rz", target: p.target, angle: p.angle });
          if (p.kind === "flux")
            s = apply(s, { name: "CZ", control: p.control, target: p.target });
        }
        const ideal = apply(initial(n, j), op),
          index = ideal.findIndex((a) => abs2(a) > 1e-10),
          ratio = mul(s[index], conj(ideal[index]));
        const z = ratio.map((v) => v / abs2(ideal[index]));
        near(
          s,
          ideal.map((a) => mul(a, z)),
        );
      }
    }
  });
  it("tracks virtual references in physical microwave phases, while reproducing the logical circuit", () => {
    const sequence = [
      { name: "H", target: 0 },
      { name: "Z", target: 1 },
      { name: "X", target: 1 },
      { name: "CNOT", target: 1, control: 0 },
      { name: "T", target: 0 },
      { name: "Y", target: 0 },
    ];
    const compiled = compileSequence(sequence);
    expect(compiled.find((p) => p.kind === "drive").phase).toBeCloseTo(
      -Math.PI / 2,
      12,
    );
    expect(
      compiled.find((p) => p.step === 2 && p.kind === "drive").phase,
    ).toBeCloseTo(-Math.PI, 12);
    let physical = initial(2);
    const references = [0, 0];
    for (const p of compiled) {
      if (p.kind === "frame") references[p.target] += p.angle;
      if (p.kind === "drive")
        physical = run(physical, [
          { name: "Rz", target: p.target, angle: -p.phase },
          { name: "Rx", target: p.target, angle: p.angle },
          { name: "Rz", target: p.target, angle: p.phase },
        ]).state;
      if (p.kind === "flux")
        physical = apply(physical, {
          name: "CZ",
          target: p.target,
          control: p.control,
        });
    }
    const logical = run(initial(2), sequence).state;
    const transformed = run(
      physical,
      references.map((angle, target) => ({ name: "Rz", target, angle })),
    ).state;
    const index = logical.findIndex((a) => abs2(a) > 1e-10),
      ratio = mul(transformed[index], conj(logical[index])).map(
        (v) => v / abs2(logical[index]),
      );
    near(
      transformed,
      logical.map((a) => mul(a, ratio)),
    );
  });
  it("rejects invalid register sizes, control collisions, and invalid numerical values", () => {
    expect(() => initial(4)).toThrow();
    expect(() => initial(2, 4)).toThrow();
    expect(() =>
      apply(initial(2), { name: "CNOT", control: 0, target: 0 }),
    ).toThrow();
    expect(() =>
      apply(initial(1), { name: "Rx", target: 0, angle: NaN }),
    ).toThrow();
    expect(() => matrix("made-up")).toThrow();
    expect(() => shots([1, 0], -1, 1)).toThrow();
  });
  it("scrubs virtual gates by frame angle and approaches compiled gate endpoints without a global-phase jump", () => {
    const plus = pure(Math.PI / 2, 0);
    near(interpolate(plus, { name: "Z", target: 0 }, 0.5), [
      c(Math.SQRT1_2),
      c(0, Math.SQRT1_2),
    ]);
    near(
      interpolate(plus, { name: "Rz", target: 0, angle: Math.PI }, 0.5),
      apply(plus, { name: "Rz", target: 0, angle: Math.PI / 2 }),
    );
    for (const [start, op] of [
      [pure(1.2, 0.7), { name: "H", target: 0 }],
      [
        run(initial(2), [{ name: "H", target: 0 }]).state,
        { name: "CNOT", control: 0, target: 1 },
      ],
    ]) {
      const limit = interpolate(start, op, 1 - 1e-9),
        exact = apply(start, op);
      limit.forEach((a, j) =>
        a.forEach((v, k) => expect(v).toBeCloseTo(exact[j][k], 7)),
      );
    }
  });
  it("keeps native pulse scrubbing normalized and shares its probabilities with acquisition", () => {
    const start = pure(1.17, 0.43);
    for (const name of ["X", "Y", "H", "S", "T", "Rx", "Ry", "Rz"]) {
      const op = { name, target: 0, angle: 0.7 };
      near(interpolate(start, op, 0), start);
      near(interpolate(start, op, 1), apply(start, op));
      for (const t of [0.1, 0.5, 0.9]) {
        const s = interpolate(start, op, t);
        expect(s.reduce((sum, a) => sum + abs2(a), 0)).toBeCloseTo(1, 12);
        expect(distribution(start, [op], t)).toEqual(probabilities(s));
      }
    }
    expect(compile({ name: "Y", target: 0 })[0].phase).toBe(Math.PI / 2);
    const op = { name: "CNOT", control: 0, target: 1 };
    const s = run(initial(2), [{ name: "H", target: 0 }]).state;
    expect(
      probabilities(interpolate(s, op, 0.5)).reduce((a, b) => a + b),
    ).toBeCloseTo(1, 12);
    near(interpolate(s, op, 1), apply(s, op));
  });
});
