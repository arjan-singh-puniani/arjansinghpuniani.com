import { openCircuitEditor } from "./open-circuit-editor.mjs";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8864/quantum-computer-lab/index.html");
await page.waitForFunction(() => window.quantumLab);
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/quantum-revision-machine.png" });
await page.screenshot({
  path: "Documentation/Validation/Quantum/revision-machine.png",
});
await page.locator("#begin").click();
await page.locator("#place-part").click();
const benches = [];
for (let stage = 0; stage < 12; stage++) {
  await page.locator(`[data-stage="${stage}"]`).click();
  const before = await page.locator("#diagnostic-value").innerText();
  await page
    .locator("summary")
    .filter({ hasText: "What fails without it?" })
    .click();
  await page.locator("#failure-demo").click();
  const after = await page.locator("#diagnostic-value").innerText();
  assert.notEqual(before, after, `stage ${stage} changes diagnostic`);
  benches.push({ stage, before, after });
  await page.locator("#failure-demo").click();
  assert.equal(await page.locator("#diagnostic-value").innerText(), before);
}
await page.locator("#compute-tab").click();
await openCircuitEditor(page);
await page.locator("#bell-preset").click();
await openCircuitEditor(page);
await page.locator("#next-step").click();
await openCircuitEditor(page);
await page.locator("#next-step").click();
assert.match(await page.locator("#story-title").innerText(), /CNOT/);
await page.screenshot({
  path: "/tmp/quantum-revision-compute.png",
  fullPage: true,
});
await page.screenshot({
  path: "Documentation/Validation/Quantum/revision-workspace.png",
});
await page.locator("#calculation-detail > summary").click();
const inputNode = await page
  .locator("#trace-input .math-visual")
  .elementHandle();
await page.locator("#execution-scrub").evaluate((e) => {
  e.value = "0.5";
  e.dispatchEvent(new Event("input", { bubbles: true }));
});
assert.equal(
  await inputNode.evaluate((e) => e.isConnected),
  true,
  "Input representation remains the same DOM node while output evolves",
);
assert.match(
  await page.locator("#hardware-signal-path").innerText(),
  /Flux DAC/,
);
assert.match(
  await page.locator("#geometry-explanation").innerText(),
  /entangling flux interaction/,
);
assert.equal(
  await page.locator("#carrier svg").count(),
  0,
  "No XY carrier during the flux segment",
);

await page.locator("#execution-scrub").evaluate((e) => {
  e.value = "1";
  e.dispatchEvent(new Event("input", { bubbles: true }));
});
assert.match(
  await page.locator("#control-values").innerText(),
  /hardware = -4.712/,
);
await page
  .locator("#state-ket .katex-html [data-meaning]")
  .filter({ hasText: "ψ" })
  .first()
  .click();
assert.equal(await page.locator("#symbol-inspector").isVisible(), true);
await page.keyboard.press("Escape");
assert.equal(await page.locator("#symbol-inspector").isVisible(), false);
const panels = await page.locator(".workspace>.panel").evaluateAll((els) =>
  els.map((e) => ({
    name: e.className,
    rect: e.getBoundingClientRect().toJSON(),
  })),
);
const axe = await new AxeBuilder({ page }).analyze();
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
assert.equal(await page.locator("#calculation-matrix mtr").count(), 12);
await page.locator("#machine-tab").click();
assert.equal(await page.locator(".machine-layout #viewport").count(), 1);
await page.locator("#compute-tab").click();
assert.equal(await page.locator("#hardware-dock #viewport").count(), 1);
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "/tmp/quantum-revision-mobile.png",
  fullPage: true,
});
const mobileAxe = await new AxeBuilder({ page }).analyze();
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
await page.locator("#motion").click();
await openCircuitEditor(page);
await page.locator("#bell-preset").click();
await page.locator("#mobile-play").click();
await page.waitForTimeout(900);
await page.locator("#mobile-play").click();
const paused = await page.evaluate(() => quantumLab.snapshot());
await page.waitForTimeout(300);
assert.equal(
  (await page.evaluate(() => quantumLab.snapshot())).fraction,
  paused.fraction,
);
await page.locator("#mobile-play").click();
await page.waitForTimeout(400);
const resumed = await page.evaluate(() => quantumLab.snapshot());
assert.equal(resumed.cursor, paused.cursor);
assert.ok(resumed.fraction > paused.fraction);
await page.locator("#mobile-play").click();
await openCircuitEditor(page);
await page.locator("#bell-preset").click();
await openCircuitEditor(page);
await page.locator("#play").click();
const phases = [];
for (let i = 0; i < 4; i++) {
  await page.waitForTimeout(1400);
  phases.push(
    await page.evaluate(() => ({
      fraction: quantumLab.snapshot().fraction,
      phase: document.querySelector("[data-beat].active")?.dataset.beat,
    })),
  );
}
await page.waitForFunction(
  () =>
    document.getElementById("readout-heading").textContent ===
      "Readout & statistics" && window.quantumLab.snapshot().cursor === 2,
);
await page.locator("#sample").click();
const firstShots = await page.evaluate(
  () => quantumLab.snapshot().shotProgress,
);
await page.waitForTimeout(800);
const middleShots = await page.evaluate(
  () => quantumLab.snapshot().shotProgress,
);
await page.waitForTimeout(1300);
const finalShots = await page.evaluate(
  () => quantumLab.snapshot().shotProgress,
);
assert.ok(
  firstShots >= 0 &&
    firstShots < middleShots &&
    middleShots < 1 &&
    finalShots === 1,
  "Seeded acquisition accumulates before reaching its final count",
);
await page.setViewportSize({ width: 1440, height: 900 });
await page.locator("#machine-tab").click();
await page.locator("#restart").click();
await page.locator("#begin").click();
await page.locator("#viewport").scrollIntoViewIfNeeded();
const lifted = await page.evaluate(
  () => quantumLab.snapshot().stats.moduleOffsets[0],
);
await page.locator("#place-part").click();
await page.waitForTimeout(1500);
const seated = await page.evaluate(
  () => quantumLab.snapshot().stats.moduleOffsets[0],
);
assert.ok(
  lifted > 0.3 && seated < 0.12,
  `Part seats continuously: ${lifted} → ${seated}`,
);
await page.locator("#compute-tab").click();
await openCircuitEditor(page);
await page.locator("#qubits").selectOption("3");
await page.locator(".state-panel > details > summary").click();
await page
  .locator(".geometry-panel > details > summary")
  .filter({ hasText: "Reduced density" })
  .click();
const expanded = await new AxeBuilder({ page }).analyze();
const vectorRows = await page.locator("#state-vector mtr").count(),
  densityRows = await page.locator("#density mtr").count();
assert.equal(vectorRows, 8);
assert.equal(densityRows, 8);
assert.deepEqual(expanded.violations, []);
await writeFile(
  "Documentation/Validation/Quantum/expanded-matrix-accessibility.json",
  JSON.stringify(
    { vectorRows, densityRows, violations: expanded.violations, errors },
    null,
    2,
  ),
);
const result = {
  pauseResume: {
    paused: paused.fraction,
    resumed: resumed.fraction,
    cursor: resumed.cursor,
  },
  shotAccumulation: {
    first: firstShots,
    middle: middleShots,
    final: finalShots,
  },
  seating: { lifted, seated },
  benches,
  panels,
  phases,
  errors,
  axe: axe.violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.map((n) => n.target),
  })),
  mobileAxe: mobileAxe.violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.map((n) => n.target),
  })),
};
console.log(JSON.stringify(result, null, 2));
await writeFile(
  "Documentation/Validation/Quantum/revision-results.json",
  JSON.stringify(result, null, 2),
);
await browser.close();
assert.deepEqual(errors, []);
assert.deepEqual(result.axe, []);
assert.deepEqual(result.mobileAxe, []);
