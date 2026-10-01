import { describe, expect, it } from "vitest";
import { generateStaticParams } from "@/app/work/[slug]/page";

describe("project route precedence", () => {
  it("leaves dedicated case studies to their static pages", () => {
    const generated = generateStaticParams().map(({ slug }) => slug);
    for (const slug of ["motorsport-neurotrauma-toolkit", "belmont-motorsport-systems", "vector-ekg-reasonos"]) {
      expect(generated).not.toContain(slug);
    }
    expect(generated).toContain("bci-calibration");
    expect(generated).toContain("seizefreeze");
    expect(generated).toContain("quantum-active-inference");
  });
});
