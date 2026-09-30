import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const root = "http://127.0.0.1:4192";
const results = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  let errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/about",
    "/cv",
    "/work",
    "/research",
    "/notes",
    "/contact",
    "/playground",
    "/playground/rally-house",
    "/playground/vector-tennis",
    "/playground/pit-stop",
    "/playground/hemodynamic-observatory",
    "/work/vector-ekg-reasonos",
  ]) {
    errors = [];
    const response = await page.goto(root + route, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("h1").first()).toBeVisible();
    results.push({
      route,
      status: response.status(),
      heading: await page.locator("h1").first().innerText(),
      errors: [...errors],
    });
    expect(response.status()).toBe(200);
  }
  await page.goto(root + "/playground/holoanatomy");
  await page.locator("iframe").scrollIntoViewIfNeeded();
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("#loading")).toBeHidden({ timeout: 30000 });
  await expect(frame.locator("h1")).toHaveText("Rotator cuff.");
  await frame.locator("[data-mode=learn]").click();
  await expect(frame.locator("#context")).toContainText("A mobile joint");
  await page.screenshot({
    path: "Documentation/shoulder-qa/portfolio-integration.png",
  });
  results.push({
    route: "/playground/holoanatomy",
    status: 200,
    embeddedStudio: "PASS",
    errors: [...errors],
  });
  expect(await page.locator('a[href="/holoanatomy/index.html"]').count()).toBe(
    1,
  );
  const legacy = await page.request.get(root + "/holoanatomy/index.html");
  expect(legacy.status()).toBe(200);
  const sitemap = await page.request.get(root + "/sitemap.xml");
  expect(await sitemap.text()).toContain("/playground/holoanatomy");
  console.log(
    "PASS: 14 portfolio routes, embedded studio, legacy viewer, sitemap.",
  );
} finally {
  await writeFile(
    "Documentation/shoulder-qa/portfolio-smoke.json",
    JSON.stringify(results, null, 2),
  );
  await browser.close();
}
