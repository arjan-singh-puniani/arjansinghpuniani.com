import { webkit, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
let browser;
const result = {};
try {
  browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  result.errors = errors;
  result.failedResources = [];
  page.on("response", (r) => {
    if (r.status() >= 400)
      result.failedResources.push({ url: r.url(), status: r.status() });
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("http://127.0.0.1:4192/holoanatomy/shoulder/index.html");
  try {
    await page.waitForFunction(() => window.shoulderStudio?.ready, {
      timeout: 15000,
    });
  } catch (e) {
    result.pageText = await page.locator("body").innerText();
    await page.screenshot({
      path: "Documentation/shoulder-qa/webkit-diagnostic.png",
    });
    throw e;
  }
  await page.locator("[data-mode=learn]").click();
  await expect(page.locator("#context")).toContainText("A mobile joint");
  await page.locator("[data-action=next]").click();
  await expect(page.locator("#context")).toContainText("Above the spine");
  await page.locator("[data-mode=quiz]").click();
  await expect(page.locator("#context")).toContainText(
    "Identify supraspinatus",
  );
  await page.screenshot({
    path: "Documentation/shoulder-qa/webkit-mobile.png",
  });
  result.errors = errors;
  result.metrics = await page.evaluate(() => shoulderStudio.metrics());
  expect(errors).toEqual([]);
  result.status = "PASS";
  console.log("PASS WebKit mobile: GLB rendering, lesson and quiz UI.");
} catch (e) {
  process.exitCode = 1;
  result.status = "BLOCKED_OR_FAIL";
  result.error = String(e);
  console.log(result);
} finally {
  await writeFile(
    "Documentation/shoulder-qa/webkit-results.json",
    JSON.stringify(result, null, 2),
  );
  await browser?.close();
}
