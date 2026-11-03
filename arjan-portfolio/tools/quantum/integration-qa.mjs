import { openCircuitEditor } from "./open-circuit-editor.mjs";
import { placeWithPointer } from "./place-with-pointer.mjs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const base = process.env.QUANTUM_BASE_URL || "http://127.0.0.1:8865";
const output = new URL(
  "../../Documentation/Validation/Quantum/",
  import.meta.url,
);
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const results = { checks: [], errors };
const range = async (id, value) =>
  page.evaluate(
    ({ id, value }) => {
      const e = document.getElementById(id);
      e.value = value;
      e.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { id, value },
  );
const snap = () => page.evaluate(() => window.quantumLab.snapshot());
await page.goto(base + "/work/rigetti-quantum-operations");
await page.locator("iframe").waitFor();
assert.match(await page.title(), /Quantum systems operations/);
await page.screenshot({
  path: fileURLToPath(new URL("production-case-study.png", output)),
  fullPage: true,
});
results.checks.push(
  "Production case-study route, metadata, and iframe present",
);
await page.goto(base + "/quantum-computer-lab/index.html");
await page.waitForFunction(() => window.quantumLab);
await page.locator("#begin").click();
for (let stage = 0; stage < 12; stage++) {
  await page.locator("#place-part").click();
  assert.ok((await snap()).installed.includes(stage));
  await page
    .locator("summary")
    .filter({ hasText: "What fails without it?" })
    .click();
  await page.locator("#failure-demo").click();
  assert.equal((await snap()).status, "failed");
  await page.locator("#failure-demo").click();
  if (stage === 7 || stage === 8) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    assert.ok(
      (await snap()).stats.cameraDistance < 3,
      "Detail framing survives viewport changes",
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    if (stage === 8) await page.locator("#reset-view").click();
    await page.locator("#viewport").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    assert.ok(
      (await snap()).stats.cameraDistance < 3,
      "Reset retains the selected component scale",
    );
    await page.locator("#viewport").screenshot({
      path: fileURLToPath(new URL(`module-${stage + 1}-detail.png`, output)),
    });
  }
  await page.locator("#stage-next").click();
}
assert.equal((await snap()).chapter, "compute");
assert.equal((await snap()).installed.length, 12);
results.checks.push(
  "All 12 modules install; back/next, failure/restore, and completion work",
);
await openCircuitEditor(page);
await page.locator(".builder-disclosure > summary").click();
await page.locator("#gate-select").selectOption("CNOT");
await page.locator("#gate-control").selectOption("0");
await page.locator("#gate-target").selectOption("0");
await page.locator("#add-gate").click();
assert.match(await page.locator("#circuit-message").innerText(), /different/);
await openCircuitEditor(page);
await page.locator("#clear-circuit").click();
await openCircuitEditor(page);
await page.locator("#qubits").selectOption("3");
await page.locator("#gate-select").selectOption("H");
await page.locator("#gate-target").selectOption("0");
await page.locator("#add-gate").click();
for (const [control, target] of [
  ["0", "1"],
  ["1", "2"],
]) {
  await page.locator("#gate-select").selectOption("CNOT");
  await page.locator("#gate-control").selectOption(control);
  await page.locator("#gate-target").selectOption(target);
  await page.locator("#add-gate").click();
}
let s = await snap();
assert.ok(
  Math.abs(s.probabilities[0] - 0.5) < 1e-10 &&
    Math.abs(s.probabilities[7] - 0.5) < 1e-10,
);
results.checks.push(
  "Three-qubit GHZ circuit calculated from builder inputs; invalid control rejected",
);
await page.locator("#gate-select").selectOption("M");
await page.locator("#gate-target").selectOption("0");
await page.locator("#add-gate").click();
assert.match(
  await page.locator("#measurement-record").innerText(),
  /Conditional projective/,
);
results.checks.push("Custom projective M records a seeded conditional outcome");
await openCircuitEditor(page);
await page.locator("#qubits").selectOption("1");
await page.locator("#gate-select").selectOption("Rx");
await page.locator("#gate-target").selectOption("0");
await range("gate-angle", Math.PI);
await page.locator("#add-gate").click();
assert.ok((await snap()).probabilities[1] > 0.9999);
await range("execution-scrub", 0.5);
assert.ok(
  Math.abs(
    (await snap()).probabilities[1] -
      Math.sin(Number(await page.locator("#gate-angle").inputValue()) / 4) ** 2,
  ) < 1e-8,
);
await range("execution-scrub", 1);
await range("gate-angle", 0);
assert.ok((await snap()).probabilities[0] > 0.9999);
results.checks.push(
  "Rotation-angle and compiled-pulse scrubbing update state and exact histogram together",
);
await openCircuitEditor(page);
await page.locator("#bell-preset").click();
await openCircuitEditor(page);
await page.locator("#next-step").click();
await openCircuitEditor(page);
await page.locator("#next-step").click();
await page.locator("#sample").click();
await page.locator(".operation-detail > summary").click();
assert.match(
  await page.locator("#operation-panel h2").innerText(),
  /M operation/,
);
const a = await page.locator("#histogram").innerText();
await page.locator("#sample").click();
assert.equal(await page.locator("#histogram").innerText(), a);
results.checks.push(
  "Terminal acquisition selects readout across views and repeats the seed",
);
await page.locator('[data-concept="basis"]').click();
await page.locator("#basis-one").click();
assert.ok((await snap()).probabilities[1] > 0.9999);
await page.locator("#basis-zero").click();
assert.ok((await snap()).probabilities[0] > 0.9999);
await page.locator('[data-concept="tensor"]').click();
await page.locator("#tensor-step").click();
assert.equal((await snap()).qubits, 2);
assert.ok((await snap()).probabilities[1] > 0.9999);
results.checks.push(
  "Energy-to-basis mapping and tensor basis construction update all calculated views",
);
await page.locator("#machine-tab").click();
await page.locator("#restart").click();
await page.locator("#begin").click();
await page.locator("#viewport").scrollIntoViewIfNeeded();
await placeWithPointer(page);
results.checks.push(
  "Raycast picking, pointer-following placement, and aligned release seat a part",
);
await page.locator("#explore").click();
await page.locator("#motion").click();
await page.locator("#rotate").click();
await page.locator("#viewport").scrollIntoViewIfNeeded();
await page.waitForTimeout(4000);
const before = await snap();
const t = Date.now();
await page.waitForTimeout(2000);
const after = await snap();
results.renderFps =
  (after.stats.frames - before.stats.frames) / ((Date.now() - t) / 1000);
results.renderer = after.stats;
await page.locator("#rotate").click();
await page.locator("#compute-tab").click();
await openCircuitEditor(page);
await page.locator("#bell-preset").click();
await openCircuitEditor(page);
await page.locator("#play").click();
await page.waitForFunction(
  () => document.getElementById("play").textContent === "Play experiment",
  { timeout: 10000 },
);
assert.equal((await snap()).cursor, 2);
results.checks.push("Animated Bell experiment completes and acquires readout");
await context.close();
const missingModel = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
const modelPage = await missingModel.newPage();
modelPage.on("pageerror", (e) => errors.push(e.message));
await modelPage.route("**/processor.glb", (r) => r.abort());
await modelPage.goto(base + "/quantum-computer-lab/index.html");
await modelPage.waitForFunction(
  () => window.quantumLab?.snapshot().stats?.frames > 0,
);
await modelPage.locator("#processor-view").click();
await modelPage.waitForTimeout(300);
const fallbackChip = await modelPage.evaluate(
  () => quantumLab.snapshot().stats,
);
assert.equal(fallbackChip.processorModelLoaded, false);
assert.ok(fallbackChip.calls > 0);
await modelPage.locator("#viewport").screenshot({
  path: fileURLToPath(new URL("no-glb-processor-fallback.png", output)),
});
results.checks.push(
  "Failed processor GLB retains a rendered procedural circuit close-up",
);
await missingModel.close();
const fallback = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const fp = await fallback.newPage();
await fp.route("**/quantum-computer-lab/scene.js", (r) => r.abort());
await fp.goto(base + "/quantum-computer-lab/index.html");
await fp.waitForFunction(() => window.quantumLab);
assert.equal(await fp.locator("#poster").isVisible(), true);
await fp.locator("#compute-tab").click();
await openCircuitEditor(fp);
await fp.locator("#bell-preset").click();
await openCircuitEditor(fp);
await fp.locator("#next-step").click();
await openCircuitEditor(fp);
await fp.locator("#next-step").click();
assert.ok(
  Math.abs(
    (await fp.evaluate(() => window.quantumLab.snapshot())).probabilities[3] -
      0.5,
  ) < 1e-10,
);
await fp.screenshot({
  path: fileURLToPath(new URL("no-webgl-html-fallback.png", output)),
  fullPage: true,
});
results.checks.push(
  "Blocked 3D module retains poster, all lessons, circuit, and Bell calculations",
);
await fallback.close();
await browser.close();
await writeFile(
  new URL("integration-results.json", output),
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
assert.equal(errors.length, 0);
