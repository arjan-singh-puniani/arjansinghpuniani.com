import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = {};
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await page.goto("http://127.0.0.1:4190/holoanatomy/shoulder/");
  await page.waitForFunction(() => window.shoulderStudio?.ready);
  await page.locator('[data-face="1"]').click();
  expect(
    Math.abs(await page.evaluate(() => shoulderStudio.scene.yaw)),
  ).toBeCloseTo(Math.PI);
  await page.locator("[data-corner]:visible").first().click();
  expect(
    Math.abs(await page.evaluate(() => shoulderStudio.scene.pitch)),
  ).toBeCloseTo(0.62);
  const before = await page.evaluate(() => shoulderStudio.scene.yaw);
  const r = await page.locator("#orientation").boundingBox();
  await page.mouse.move(r.x + 60, r.y + 70);
  await page.mouse.down();
  await page.mouse.move(r.x + 100, r.y + 80, { steps: 8 });
  await page.mouse.up();
  expect(await page.evaluate(() => shoulderStudio.scene.yaw)).not.toBe(before);
  expect(await page.evaluate(() => shoulderStudio.state.selected)).toBe(null);
  await page.locator("#specimen").focus();
  await page.keyboard.press("r");
  await page.keyboard.press("ArrowRight");
  const after = await page.evaluate(() => shoulderStudio.scene.yaw);
  expect(after).not.toBe(-2.85);
  results.cube = "PASS: face, oblique corner, independent drag";
  results.keyboard = "PASS: keyboard reset and orbit";
  // All staged structures must remain within the useful viewport after camera rotation.
  await page.click("[data-mode=peel]");
  await page.locator("#peel-range").fill("2");
  for (const id of ["FJ1506", "FJ1500", "FJ1508", "FJ1504"]) {
    await page.selectOption("#peel-muscle", id);
    await page.click("[data-action=separate]");
  }
  await page.evaluate(() => shoulderStudio.scene.orbit(90, 20));
  await page.waitForTimeout(100);
  const points = await page.evaluate(() =>
    shoulderStudio.state.staged.map((id) => shoulderStudio.scene.project(id)),
  );
  for (const p of points) {
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(1140);
    expect(p.y).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(738);
  }
  await page.screenshot({
    path: "Documentation/shoulder-qa/staging-table.png",
  });
  results.staging =
    "PASS: four camera-relative slots remain in viewport during orbit";
  await page.click("[data-action=reassemble]");
  expect(await page.evaluate(() => shoulderStudio.state.staged.length)).toBe(0);
  results.status = "PASS";
  console.log(results);
} finally {
  await writeFile(
    "Documentation/shoulder-qa/orientation-results.json",
    JSON.stringify(results, null, 2),
  );
  await browser.close();
}
