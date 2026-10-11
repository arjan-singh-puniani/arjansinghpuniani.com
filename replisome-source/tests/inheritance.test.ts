import { describe, expect, it } from "vitest";
import { inheritance } from "../src/study/content";

describe("isotope inheritance model", () => {
  it("conserves exactly two original heavy strands as duplexes double", () => {
    for (let round = 0; round <= 3; round++) {
      const model = inheritance(round);
      expect(model.heavy * 2 + model.hybrid).toBe(2);
      expect(model.heavy + model.hybrid + model.light).toBe(model.duplexes);
      expect(model.heavyStrandFraction).toBe(2 / (model.duplexes * 2));
    }
  });
  it("distinguishes hybrid duplex frequency from heavy strand frequency", () => {
    const second = inheritance(2),
      third = inheritance(3);
    expect(second.hybrid / second.duplexes).toBe(0.5);
    expect(second.heavyStrandFraction).toBe(0.25);
    expect(third.hybrid / third.duplexes).toBe(0.25);
    expect(third.heavyStrandFraction).toBe(0.125);
  });
  it("rejects fractions and rounds beyond the illustrated domain", () => {
    for (const invalid of [-1, 0.5, 4, NaN])
      expect(() => inheritance(invalid)).toThrow(RangeError);
  });
});
