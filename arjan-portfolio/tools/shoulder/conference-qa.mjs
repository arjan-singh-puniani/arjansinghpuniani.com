import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
const out = "Documentation/shoulder-conference-qa";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const results = { errors: [] };
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => results.errors.push(e.message));
  await page.goto(process.env.SHOULDER_URL || "http://127.0.0.1:4190/holoanatomy/shoulder/");
  await page.waitForFunction(() => window.shoulderStudio?.ready);
  await page.getByRole("button", { name: "Start guided presentation" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-presenting", "true");
  await page.screenshot({ path: `${out}/presentation.png` });
  await page.locator("#specimen").focus();
  await page.keyboard.press("PageDown");
  expect(await page.evaluate(() => shoulderStudio.state.lesson)).toBe(1);
  await page.keyboard.press("PageUp");
  expect(await page.evaluate(() => shoulderStudio.state.lesson)).toBe(0);
  await page.locator('[data-study="external"]').click();
  expect(await page.evaluate(() => shoulderStudio.state.study)).toBe(
    "external",
  );
  expect(
    await page.evaluate(
      () => shoulderStudio.scene.meshes.get("FJ1506").material.opacity,
    ),
  ).toBeLessThan(1);
  expect(
    await page.evaluate(
      () => shoulderStudio.scene.meshes.get("FJ1500").material.opacity,
    ),
  ).toBe(1);
  await page.screenshot({ path: `${out}/function-study.png` });
  results.desktopAccessibility = (
    await new AxeBuilder({ page }).analyze()
  ).violations;
  expect(results.desktopAccessibility).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).toHaveAttribute(
    "data-presenting",
    "false",
  );
  await page.locator('[data-mode="quiz"]').click();
  const order = await page.evaluate(() => shoulderStudio.state.quiz.order);
  for (let i = 0; i < 12; i++) {
    if (i >= 4)
      expect(await page.evaluate(() => shoulderStudio.state.view)).toBe("lateral");
    await page.getByText("Keyboard answer controls", { exact: true }).click();
    if (i === 0) await page.locator(`#context [data-select="${order[1]}"]`).click();
    // Rendering a response recreates the disclosure; reopen it after a retry.
    if (i === 0)
      await page.getByText("Keyboard answer controls", { exact: true }).click();
    await page.locator(`#context [data-select="${order[i]}"]`).click();
    await page.locator('[data-action="quiz-next"]').click();
  }
  await expect(
    page.getByText("What can you find now?", { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => shoulderStudio.state.quiz.score)).toBe(11);
  await page.screenshot({ path: `${out}/session-review.png` });
  await page.locator('[data-review="FJ1504"]').click();
  expect(await page.evaluate(() => shoulderStudio.state.view)).toBe("anterior");
  await page.locator('[data-mode="quiz"]').click();
  expect(
    await page.evaluate(() => shoulderStudio.state.quiz.history.length),
  ).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Start guided presentation" }).click();
  await page.locator('[data-study="internal"]').click();
  await page.screenshot({ path: `${out}/mobile-function.png` });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  results.mobileAccessibility = (
    await new AxeBuilder({ page }).analyze()
  ).violations;
  expect(results.mobileAccessibility).toEqual([]);
  await page.locator("#reset").click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-presenting",
    "false",
  );
  expect(await page.evaluate(() => shoulderStudio.state.study)).toBe(null);
  expect(results.errors).toEqual([]);
  expect(
    await page.evaluate(() =>
      shoulderStudio.scene.lightRig.quaternion.angleTo(
        shoulderStudio.scene.camera.quaternion,
      ),
    ),
  ).toBeLessThan(0.00001);
  results.status = "PASS";
} finally {
  await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(results);
