import { openCircuitEditor } from "./open-circuit-editor.mjs";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { placeWithPointer } from "./place-with-pointer.mjs";
const browser = await chromium.launch({ channel: "chromium" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const output = "Documentation/Validation/Quantum/";
await page.goto(
  (process.env.QUANTUM_BASE_URL || "http://127.0.0.1:8864") +
    "/quantum-computer-lab/index.html",
);
await page.waitForFunction(() => window.quantumLab?.snapshot().stats);
await page.waitForTimeout(700);
const initialGraphics = await page.evaluate(() => quantumLab.snapshot().stats);
const rulerFractions = await page
  .locator("#temperature-ruler > span")
  .evaluateAll((elements) =>
    elements.map(
      (element) =>
        Number.parseFloat(getComputedStyle(element).top) /
        element.parentElement.clientHeight,
    ),
  );
[300, 50, 4, 0.8, 0.1, 0.015].forEach((temperature, index) =>
  assert.ok(
    Math.abs(
      rulerFractions[index] -
        Math.log(300 / temperature) / Math.log(300 / 0.015),
    ) < 0.001,
    "Temperature ruler positions use a logarithmic scale",
  ),
);
await page.screenshot({ path: output + "r3-machine.png" });
await page.locator("#begin").click();
await page.locator("#viewport").scrollIntoViewIfNeeded();
const rect = await page.locator("#webgl-host canvas").boundingBox();
await page.mouse.move(rect.x + 8, rect.y + 100);
await page.mouse.down();
await page.mouse.move(rect.x + 8, rect.y + 200);
await page.mouse.up();
assert.deepEqual(
  await page.evaluate(() => quantumLab.snapshot().installed),
  [],
  "An unrelated downward swipe must not install a part",
);
const placement = await placeWithPointer(page);
const closePlacements = [];
for (const stage of [7, 8]) {
  await page.locator(`[data-stage="${stage}"]`).click();
  await page.locator("#viewport").scrollIntoViewIfNeeded();
  await page.screenshot({ path: output + `r3-module-${stage + 1}.png` });
  closePlacements.push(await placeWithPointer(page));
  await page.screenshot({ path: output + `r3-module-${stage + 1}-seated.png` });
}
await page.locator("#compute-tab").click();
await openCircuitEditor(page);
await page.locator("#bell-preset").click();
await openCircuitEditor(page);
await page.locator("#next-step").click();
if (!(await page.locator(".amplitude-disclosure").evaluate((e) => e.open)))
  await page.locator(".amplitude-disclosure > summary").click();
await page.locator(".amplitude-theatre").scrollIntoViewIfNeeded();
await page.screenshot({ path: output + "r3-amplitude-flow.png" });
assert.equal(await page.locator("#amplitude-flow .flow-links > g").count(), 16);
await page
  .locator("#flow-rule .katex-html [data-meaning]")
  .filter({ hasText: /^i$/ })
  .first()
  .click();
assert.match(
  await page.locator("#inspected-meaning").innerText(),
  /Input basis index/,
);
await page.keyboard.press("Escape");
await page.locator("#try-interference").click();
const initial = await page.evaluate(() => ({
  state: quantumLab.snapshot().state,
  probabilities: quantumLab.snapshot().probabilities,
  phases: [
    document.getElementById("phi").value,
    document.getElementById("gamma").value,
  ],
}));
assert.deepEqual(initial.phases, ["0", "0"]);
assert.ok(
  initial.probabilities[1] < 1e-12,
  "Equal in-phase amplitudes cancel at output one after H",
);
const setPhase = async (id, value) =>
  page.locator(id).evaluate((element, value) => {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
await setPhase("#flow-global", 1.23);
const global = await page.evaluate(() => quantumLab.snapshot());
assert.ok(Math.abs(global.probabilities[0] - initial.probabilities[0]) < 1e-12);
assert.ok(
  Math.abs(global.state[0][1] - initial.state[0][1]) > 0.5,
  "Global phase actually rotates the state amplitudes",
);
await setPhase("#flow-relative", Math.PI);
const relative = await page.evaluate(() => quantumLab.snapshot());
assert.ok(
  relative.probabilities[1] > 1 - 1e-12,
  "A relative π phase exchanges the constructive and destructive outputs",
);
const persistent = await page
  .locator("#bloch-spheres .bloch-vector")
  .first()
  .elementHandle();
await setPhase("#flow-relative", 0.8);
assert.equal(
  await persistent.evaluate((element) => element.isConnected),
  true,
  "Bloch vectors retain the same element across state changes for continuous motion",
);
await setPhase("#flow-global", 0);
if (!(await page.locator(".amplitude-disclosure").evaluate((e) => e.open)))
  await page.locator(".amplitude-disclosure > summary").click();
await page.locator(".amplitude-theatre").scrollIntoViewIfNeeded();
await page.screenshot({ path: output + "r3-interference.png" });
const desktopAxe = await new AxeBuilder({ page }).analyze();
assert.deepEqual(desktopAxe.violations, []);
await page.setViewportSize({ width: 390, height: 844 });
await setPhase("#flow-relative", 1.33);
await setPhase("#flow-global", 2.22);
if (!(await page.locator(".amplitude-disclosure").evaluate((e) => e.open)))
  await page.locator(".amplitude-disclosure > summary").click();
await page.locator(".amplitude-theatre").scrollIntoViewIfNeeded();
await page.screenshot({ path: output + "r3-mobile-interference.png" });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth),
  390,
  "Complex interference calculations stay within the mobile viewport",
);
const mobileAxe = await new AxeBuilder({ page }).analyze();
assert.deepEqual(mobileAxe.violations, []);
await setPhase("#theta", 0.7);
assert.equal(
  await page.locator("#flow-phase-controls").isVisible(),
  false,
  "Equal-weight interference copy is shown only for the equatorial preparation",
);
assert.doesNotMatch(
  await page.locator("#flow-reading").innerText(),
  /input always has equal/,
);
await openCircuitEditor(page);
await page.locator("#bell-preset").click();
await openCircuitEditor(page);
await page.locator("#initial-basis").selectOption("1");
await openCircuitEditor(page);
await page.locator("#next-step").click();
assert.doesNotMatch(
  await page.locator("#story-reading").innerText(),
  /q1 remains at the north pole/,
);
await openCircuitEditor(page);
await page.locator("#bell-preset").click();
await openCircuitEditor(page);
await page.locator("#next-step").click();
await openCircuitEditor(page);
await page.locator("#next-step").click();
await page.locator("#execution-scrub").evaluate((element) => {
  element.value = 0.5;
  element.dispatchEvent(new Event("input", { bubbles: true }));
});
assert.equal(await page.locator("#amplitude-flow .flow-links > g").count(), 16);
assert.match(
  await page.locator("#geometry-explanation").innerText(),
  /entangling flux/,
);
assert.match(
  await page.locator("#native-moment").innerText(),
  /conditional phase/,
);
assert.match(await page.locator("#flow-operation").innerText(), /50%/);
await page.locator("#sample").click();
assert.equal(
  await page.locator(".amplitude-theatre").isVisible(),
  false,
  "Unitary contribution diagram is not used to imply a unitary measurement",
);
await page.setViewportSize({ width: 1440, height: 1000 });
await page.locator("#machine-tab").click();
await page.locator("#explore").click();
await page.locator("#viewport").scrollIntoViewIfNeeded();
await page.screenshot({ path: output + "r3-machine-complete.png" });
const stats = await page.evaluate(() => quantumLab.snapshot().stats);
assert.ok(stats.triangles < 60000);
assert.ok(stats.calls < 80);
assert.equal(
  stats.pixelRatio,
  initialGraphics.pixelRatio,
  "Idle intervals in an on-demand scene do not trigger a quality downgrade",
);
assert.ok(
  stats.triangles > 30000 && stats.cameraDistance > 10,
  "Explore complete system restores the whole-machine view after a chip close-up",
);
const result = {
  placement,
  closePlacements,
  idleQualityPreserved: stats.pixelRatio === initialGraphics.pixelRatio,
  phasePrecision: initial.phases,
  destructiveProbability: initial.probabilities[1],
  globalPhaseProbability: global.probabilities[0],
  relativePiProbability: relative.probabilities[1],
  graphics: stats,
  desktopAxe: desktopAxe.violations,
  mobileAxe: mobileAxe.violations,
  errors,
};
assert.deepEqual(errors, []);
await writeFile(
  output + "flourish-results.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
await browser.close();
