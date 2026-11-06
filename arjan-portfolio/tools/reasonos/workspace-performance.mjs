import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.REASONOS_BASE_URL || "http://127.0.0.1:3230";
const out = process.env.REASONOS_QA_OUT || "Documentation/Validation/ReasonOS/Workspace";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chromium" });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
  await page.goto(base + "/work/vector-ekg-reasonos/workspace");
  const root = page.locator("[data-ecg-workspace]");
  await root.getByText("PTB-XL · 00010", { exact: true }).waitFor();
  const initial = await page.evaluate(() => ({
    resources: performance.getEntriesByType("resource").map(r => ({ path: new URL(r.name).pathname, encodedBytes: r.encodedBodySize, decodedBytes: r.decodedBodySize })),
    paint: performance.getEntriesByType("paint").map(p => ({ name: p.name, ms: p.startTime })),
  }));
  assert.ok(initial.resources.every(r => !r.path.includes("pdf.worker")), "PDF worker must remain on demand");
  const settle = await page.getByLabel("Endpoint A seconds", { exact: true }).evaluate(async el => {
    const times = [], setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    for (let i = 0; i < 30; i++) {
      const start = performance.now(); setter.call(el, String(1 + i * .002));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      times.push(performance.now() - start);
    }
    return times;
  });
  await page.screenshot({ path: `${out}/opening-desktop.png` });
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await phone.goto(base + "/work/vector-ekg-reasonos/workspace");
  await phone.getByText("PTB-XL · 00010", { exact: true }).waitFor();
  assert.equal(await phone.getByLabel("Focused time span", { exact: true }).inputValue(), "2.5");
  assert.equal(await phone.locator("details").first().getAttribute("open"), null);
  await phone.screenshot({ path: `${out}/opening-phone.png` });
  await page.goto(base + "/work/vector-ekg-reasonos");
  await page.getByRole("heading", { name: "ECG evidence workspace" }).waitFor();
  await page.screenshot({ path: `${out}/case-study-after.png` });
  const ordered = [...settle].sort((a, b) => a - b);
  const result = { browser: browser.version(), environment: "Local macOS browser; GPU mode not profiled", route: base,
    initial, inputToTwoAnimationFramesMs: { samples: 30, median: ordered[15], p95: ordered[28], maximum: ordered[29] },
    limitations: "Callbacks approximate interface settlement; not GPU execution timings, physical-phone performance or clinical validation." };
  await writeFile(`${out}/performance.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, initial: { resourceCount: initial.resources.length, encodedBytes: initial.resources.reduce((n, r) => n + r.encodedBytes, 0), paint: initial.paint } }, null, 2));
} finally { await browser.close(); }
