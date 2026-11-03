import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { openCircuitEditor } from "./open-circuit-editor.mjs";
const native = process.argv.includes("--native");
const synchrony = process.argv.includes("--synchrony");
const browser = await chromium.launch({
  headless: true,
  ...(native ? { channel: "chromium" } : {}),
});
const results = [];
const cases = [
  [1440, 900],
  [390, 844],
].flatMap(([width, height]) =>
  (synchrony ? ["H", "CNOT"] : [null]).map((gate) => [width, height, gate]),
);
for (const [width, height, gate] of cases) {
  const context = await browser.newContext({ viewport: { width, height } }),
    page = await context.newPage();
  await page.goto(
    (process.env.QUANTUM_BASE_URL || "http://127.0.0.1:8865") +
      "/quantum-computer-lab/index.html",
  );
  await page.waitForFunction(() => window.quantumLab?.snapshot().stats);
  let start, end, intervals;
  if (synchrony) {
    await page.locator("#compute-tab").click();
    if (gate === "CNOT") {
      await openCircuitEditor(page);
      await page.locator("#next-step").click();
      await page.locator("#circuit-tools > summary").click();
    }
    await page
      .locator("#coherent-stage")
      .evaluate((e) => e.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      window.synchronyFrames = [];
      let previous;
      new MutationObserver(() => {
        const p = Number(
          document.querySelector("#coherent-stage").dataset.progress,
        );
        if (p !== previous && p > 0 && p < 1) {
          synchronyFrames.push(performance.now());
          previous = p;
        }
      }).observe(document.querySelector("#coherent-stage"), {
        attributes: true,
        attributeFilter: ["data-progress"],
      });
    });
    await page.locator("#replay-gate").click();
    await page.waitForFunction(() => !quantumLab.snapshot().playing);
    intervals = await page.evaluate(() => {
      const times = synchronyFrames,
        deltas = times.slice(1).map((t, j) => t - times[j]),
        sorted = [...deltas].sort((a, b) => a - b);
      return {
        updates: times.length,
        meanMs: deltas.reduce((a, b) => a + b, 0) / deltas.length,
        p95Ms: sorted[Math.floor(sorted.length * 0.95)],
        maxMs: Math.max(...deltas),
      };
    });
    assert.ok(intervals.updates > 60 && Number.isFinite(intervals.meanMs));
    end = await page.evaluate(() => ({ stats: quantumLab.snapshot().stats }));
  } else {
    await page.locator("#explore").click();
    await page.locator("#rotate").click();
    await page.locator("#viewport").scrollIntoViewIfNeeded();
    await page.waitForTimeout(5000);
    start = await page.evaluate(() => ({
      time: performance.now(),
      stats: quantumLab.snapshot().stats,
    }));
    await page.waitForTimeout(2500);
    end = await page.evaluate(() => ({
      time: performance.now(),
      stats: quantumLab.snapshot().stats,
    }));
  }
  results.push({
    browser: browser.version(),
    width,
    height,
    ...(synchrony ? { gate } : {}),
    emulation: "desktop host, no CPU or network throttle; not a physical phone",
    binary: native
      ? "regular Chromium, unified headless"
      : "Chromium headless shell",
    fps: synchrony
      ? 1000 / intervals.meanMs
      : (end.stats.frames - start.stats.frames) /
        ((end.time - start.time) / 1000),
    ...(synchrony
      ? {
          intervalMetrics: intervals,
          measured: "Shared state UI updates during native pulse evolution",
        }
      : {}),
    stats: end.stats,
  });
  await context.close();
}
await browser.close();
await writeFile(
  new URL(
    synchrony
      ? "../../Documentation/Validation/Quantum/performance-synchrony-results.json"
      : native
        ? "../../Documentation/Validation/Quantum/performance-native-results.json"
        : "../../Documentation/Validation/Quantum/performance-results.json",
    import.meta.url,
  ),
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
