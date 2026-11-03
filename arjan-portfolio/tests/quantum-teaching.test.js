import { describe, it, expect } from "vitest";
import {
  amplitudeContributions,
  projectBloch,
  blochDepth,
} from "../public/quantum-computer-lab/teaching.js";
import {
  matrix,
  pure,
  initial,
  run,
  interpolate,
  abs2,
} from "../public/quantum-computer-lab/simulator.js";

describe("amplitude teaching view", () => {
  it("uses orthogonal screen axes with equal scale for the Bloch projection", () => {
    const axes = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ].map(projectBloch);
    const horizontal = axes.map((p) => p[0] - 130),
      vertical = axes.map((p) => p[1] - 120);
    expect(Math.hypot(...horizontal)).toBeCloseTo(90, 12);
    expect(Math.hypot(...vertical)).toBeCloseTo(90, 12);
    expect(
      horizontal.reduce((sum, x, j) => sum + x * vertical[j], 0),
    ).toBeCloseTo(0, 10);
  });
  it("adds complex contributions before squaring, including destructive interference", () => {
    const input = pure(Math.PI / 2, Math.PI / 2);
    const output = amplitudeContributions(input, matrix("H"));
    expect(output[0].terms[1].value[1]).toBeCloseTo(0.5, 12);
    expect(output[0].probability).toBeCloseTo(0.5, 12);
    const cancelled = amplitudeContributions(
      pure(Math.PI / 2, Math.PI),
      matrix("H"),
    );
    expect(cancelled[0].terms.map((term) => abs2(term.value))).toEqual(
      expect.arrayContaining([expect.closeTo(0.25, 12)]),
    );
    expect(cancelled[0].probability).toBeCloseTo(0, 12);
    expect(cancelled[1].probability).toBeCloseTo(1, 12);
  });
  it("reconstructs the same evolving state at native intermediate times and endpoints", () => {
    const before = run(initial(2), [{ name: "H", target: 0 }]).state;
    const op = { name: "CNOT", control: 0, target: 1 };
    for (const fraction of [0, 0.17, 0.5, 0.88, 1]) {
      const columns = Array.from({ length: 4 }, (_, j) =>
        interpolate(initial(2, j), op, fraction),
      );
      const u = columns.map((_, row) => columns.map((column) => column[row]));
      const outputs = amplitudeContributions(before, u);
      const expected = interpolate(before, op, fraction);
      outputs.forEach((row, j) => {
        expect(row.amplitude[0]).toBeCloseTo(expected[j][0], 12);
        expect(row.amplitude[1]).toBeCloseTo(expected[j][1], 12);
      });
      expect(
        outputs.reduce((sum, row) => sum + row.probability, 0),
      ).toBeCloseTo(1, 12);
    }
  });
});

it("uses the missing orthographic coordinate to distinguish front and rear hemispheres", () => {
  for (const point of [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [0.3, -0.4, 0.5],
    [-0.2, 0.7, -0.1],
  ]) {
    const screen = projectBloch(point),
      depth = blochDepth(point);
    const projected =
      ((screen[0] - 130) / 90) ** 2 + ((screen[1] - 120) / 90) ** 2;
    expect(projected + depth * depth).toBeCloseTo(
      point.reduce((sum, x) => sum + x * x, 0),
      12,
    );
    expect(blochDepth(point.map((x) => -x))).toBeCloseTo(-depth, 12);
  }
});
