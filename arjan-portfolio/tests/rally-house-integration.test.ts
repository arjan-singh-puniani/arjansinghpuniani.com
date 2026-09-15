import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Rally House portfolio integration", () => {
  it("keeps every established Playground project discoverable", () => {
    const page = read("src/app/playground/page.tsx");
    for (const route of [
      "/playground/vector-tennis",
      "/playground/rally-house",
      "/playground/pit-stop",
      "/playground/hemodynamic-observatory",
    ]) expect(page).toContain(`href="${route}"`);
  });

  it("ships an accessible, full-screen-capable game frame", () => {
    const page = read("src/app/playground/rally-house/page.tsx");
    expect(page).toContain("allowFullScreen");
    expect(page).toContain("aria-describedby=\"rally-house-controls\"");
    expect(page).toContain("title=\"Play Rally House");
  });

  it("fails gracefully when WebGL 2 is unavailable", () => {
    const entry = read("public/rally-house/dist/main.js");
    expect(entry).toContain("Rally House needs WebGL 2");
    expect(entry).toContain("preview-cozy.webp");
    expect(entry).toContain("Try again");
  });

  it("does not expose mutable game diagnostics to ordinary visitors", () => {
    const game = read("public/rally-house/dist/Game.js");
    const guard = game.indexOf("has('debug')");
    const exposure = game.indexOf("window.__rh");
    expect(guard).toBeGreaterThan(-1);
    expect(exposure).toBeGreaterThan(guard);
  });

  it("keeps physical-device and human playtesting as open release gates", () => {
    const checklist = read("../rally-house-source-v16/RELEASE-CHECKLIST.md");
    expect(checklist).toContain("Status: development/playtest candidate. Not production-approved.");
    expect(checklist).toContain("[ ] Human attachment");
    expect(checklist).toContain("[ ] Physical-device performance");
  });
});
