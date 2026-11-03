import { describe, it, expect } from "vitest";
import {
  run,
  initial,
  pure,
} from "../public/quantum-computer-lab/simulator.js";
import {
  runExact,
  value,
  scalar,
  calculation,
  preparedExact,
  exactMatrix,
  angleTex,
} from "../public/quantum-computer-lab/exact.js";
const close = (exact, numerical) =>
  exact.forEach((a, j) =>
    value(a).forEach((v, k) => expect(v).toBeCloseTo(numerical[j][k], 11)),
  );
describe("exact gate calculations", () => {
  it("keeps complex coefficients in readable exact form", () => {
    expect(scalar([1, 0, 1, 0, 1])).toBe("\\frac{1+i}{2}");
    expect(scalar([0, 0, 0, -1, 1])).toBe("-\\frac{i}{\\sqrt{2}}");
    expect(scalar([-1, 0, 0, 0, 1])).toBe("-\\frac{1}{2}");
  });
  it("calculates Bell amplitudes and ket changes with radicals instead of rounded decimals", () => {
    const h = { name: "H", target: 0 },
      cx = { name: "CNOT", control: 0, target: 1 };
    const middle = runExact(2, 0, [h]);
    expect(middle.map(scalar)).toEqual([
      "\\frac{1}{\\sqrt{2}}",
      "0",
      "\\frac{1}{\\sqrt{2}}",
      "0",
    ]);
    const result = calculation(2, cx, run(initial(2), [h]).state, middle);
    expect(result.outputKet).toContain("\\lvert11\\rangle");
    expect(result.rows[3].terms[2].tex).toBe("\\frac{1}{\\sqrt{2}}");
    close(
      result.rows.map((r) => r.exact),
      run(initial(2), [h, cx]).state,
    );
  });
  it("preserves phase and destructive interference through every named gate and both control directions", () => {
    for (const n of [1, 2, 3]) {
      const circuit = [];
      for (let j = 0; j < 20; j++) {
        const name = ["H", "T", "Y", "S", "X", "Z", "Rx", "Ry", "Rz", "H"][
          j % 10
        ];
        circuit.push({ name, target: j % n, angle: Math.PI / 2 });
        close(runExact(n, 0, circuit), run(initial(n), circuit).state);
      }
      if (n > 1)
        for (const [control, target] of [
          [0, n - 1],
          [n - 1, 0],
        ]) {
          circuit.splice(
            4,
            0,
            { name: "CNOT", control, target },
            { name: "CZ", control, target },
          );
          close(runExact(n, 0, circuit), run(initial(n), circuit).state);
        }
    }
    const cancelled = runExact(1, 0, [
      { name: "H", target: 0 },
      { name: "H", target: 0 },
    ]);
    expect(cancelled.map(scalar)).toEqual(["1", "0"]);
    expect(
      runExact(
        1,
        0,
        Array.from({ length: 8 }, () => ({ name: "T", target: 0 })),
      ).map(scalar),
    ).toEqual(["1", "0"]);
  });
  it("uses symbolic trigonometry for arbitrary rotations rather than inventing exact decimals", () => {
    expect(runExact(1, 0, [{ name: "Rx", target: 0, angle: 1e-13 }])).toBe(
      null,
    );
    expect(angleTex(1e-13)).toBe("1\\times 10^{-13}");
    for (const name of ["Rx", "Ry", "Rz"]) {
      const op = { name, target: 1, angle: 0.83 };
      const result = calculation(2, op, initial(2), runExact(2, 0, []));
      expect(result.exact).toBe(false);
      expect(JSON.stringify(result.u)).toContain("eta");
      expect(result.u[0][1].tex).toBe(
        name === "Rz"
          ? "0"
          : name === "Ry"
            ? "-\\sin\\frac{\\eta}{2}"
            : "-i\\sin\\frac{\\eta}{2}",
      );
      expect(runExact(2, 0, [op])).toBe(null);
    }
  });
  it("tracks canonical preparations exactly and uses input coefficients for general states", () => {
    close(
      preparedExact(Math.PI / 2, Math.PI / 4, Math.PI / 2),
      pure(Math.PI / 2, Math.PI / 4, Math.PI / 2),
    );
    expect(preparedExact(0.71, 0.41)).toBe(null);
    const result = calculation(
      1,
      { name: "H", target: 0 },
      pure(0.71, 0.41),
      null,
    );
    expect(result.rows[1].tex).toContain("a_{0}");
    expect(result.rows[1].tex).toContain("a_{1}");
    expect(runExact(1, 0, [{ name: "M", target: 0 }])).toBe(null);
    for (const angle of [
      -Math.PI * 2,
      -Math.PI,
      0,
      Math.PI / 2,
      Math.PI,
      Math.PI * 2,
    ])
      for (const name of ["Rx", "Ry", "Rz"])
        expect(
          exactMatrix(1, { name, target: 0, angle })
            .flat()
            .every((entry) => entry.exact),
        ).toBe(true);
  });
});
