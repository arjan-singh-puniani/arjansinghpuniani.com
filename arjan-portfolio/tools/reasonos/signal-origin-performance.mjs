import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.REASONOS_BASE_URL || "http://127.0.0.1:3238";
const out = process.env.REASONOS_QA_OUT || "/tmp/reasonos-signal-performance";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chromium" });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
  await page.goto(base + "/work/vector-ekg-reasonos/signal");
  await page.getByLabel("Cardiac cycle time").waitFor();
  await page.locator(".katex").first().waitFor({ state: "attached" });
  const measurement = await page.evaluate(async () => {
    const input = document.querySelector('input[aria-label="Cardiac cycle time"]');
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    const latencies = [], values = [];
    for (let i = 0; i < 30; i++) {
      const start = performance.now();
      setValue.call(input, String(220 + i));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      latencies.push(performance.now() - start);
      values.push(Number(document.querySelector("[data-voltage-mv]").dataset.voltageMv));
    }
    const resources = performance.getEntriesByType("resource");
    return { latencies, distinctVoltages: new Set(values).size, resources: resources.length, encodedResourceBytes: resources.reduce((n, r) => n + r.encodedBodySize, 0), firstContentfulPaintMs: performance.getEntriesByName("first-contentful-paint")[0]?.startTime, documentEncodedBytes: performance.getEntriesByType("navigation")[0]?.encodedBodySize };
  });
  assert.ok(measurement.distinctVoltages > 20, "the benchmark must actually update the linked model");
  const sorted = measurement.latencies.toSorted((a,b) => a-b);
  await writeFile(`${out}/performance.json`, JSON.stringify({ environment: "local macOS headless Chromium; reduced motion; GPU mode unprofiled; not a physical phone or internet measurement", browser: browser.version(), method: "30 native input events; event dispatch to two animation frames, including React model/render work; not GPU execution time", ...measurement, medianMs: sorted[15], p95Ms: sorted[28], maximumMs: sorted.at(-1) }, null, 2));
  await page.goto(base + "/work/vector-ekg-reasonos/signal");
  await page.screenshot({ path: `${out}/signal-opening-desktop.png`, fullPage: true });
  await page.locator('[data-signal-origin] > div').nth(2).screenshot({ path: `${out}/linked-diagrams.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0,0));
  await page.screenshot({ path: `${out}/signal-opening-phone.png`, fullPage: true });
  console.log(JSON.stringify({ medianMs: sorted[15], p95Ms: sorted[28], bytes: measurement.encodedResourceBytes + measurement.documentEncodedBytes }));
} finally { await browser.close(); }
