import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const out = "Documentation/shoulder-qa";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.log("console", m.text());
  });
  await page.goto("http://127.0.0.1:4190/holoanatomy/shoulder/");
  await page.waitForFunction(() => window.shoulderStudio?.ready, {
    timeout: 60000,
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: out + "/initial.png" });
  console.log(await page.evaluate(() => shoulderStudio.metrics()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => shoulderStudio.reset());
  await page.waitForTimeout(700);
  await page.screenshot({ path: out + "/mobile-initial.png" });
  await writeFile(out + "/errors.json", JSON.stringify(errors));
  console.log("errors", errors);
} finally {
  await browser.close();
}
