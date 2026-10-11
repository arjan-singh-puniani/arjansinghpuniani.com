import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { B_DNA, nucleotidePair } from "../src/experience/dna";
it("uses right-handed canonical B-DNA and antiparallel complementary backbones", () => {
  const a = nucleotidePair(0, "A"),
    b = nucleotidePair(1, "A");
  expect(a.daughter.base).toBe("T");
  expect(a.template.direction).not.toBe(a.daughter.direction);
  expect(b.template.position[1] - a.template.position[1]).toBe(0.34);
  expect(b.template.position[2]).toBeLessThan(0);
  expect(B_DNA.basePairsPerTurn).toBe(10.5);
  expect(Math.hypot(...a.template.position)).toBe(1);
});
for (const id of ["7pfo", "6tnz", "8qj7"])
  it(`validates finite ${id} biological assembly points, chain partitions and LODs`, () => {
    const a = JSON.parse(readFileSync(`public/molecules/${id}.json`, "utf8"));
    expect(a.units).toBe("angstrom");
    expect(a.source.assembly).toBe(1);
    for (const g of Object.values(a.groups) as {
      points: number[][];
      chains: { start: number; count: number }[];
      lod: { high: number[]; medium: number[]; low: number[] };
    }[]) {
      expect(
        g.points.every((p) => p.length === 3 && p.every(Number.isFinite)),
      ).toBe(true);
      expect(g.chains.reduce((n, c) => n + c.count, 0)).toBe(g.points.length);
      expect(g.lod.low.every((i) => g.lod.medium.includes(i))).toBe(true);
      expect(g.lod.medium.every((i) => g.lod.high.includes(i))).toBe(true);
    }
  });
