import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("research pilot gives a cited result and prepares an unsent inquiry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const basePath = process.env.ATLAS_BROWSER_BASE_PATH || "";
  await page.goto(basePath + "/pilot");
  await expect(page.getByRole("heading", { name: "Compare devices. Trace the evidence." })).toBeVisible();
  await expect(page.getByText("Historical labeling", { exact: false })).toBeVisible();
  await expect(page.locator("main")).not.toContainText(/\$1,500|10 business days/);
  await expect(page.getByRole("link", { name: /P960009.*1997-07-31/ })).toHaveAttribute("href", /^https:\/\/www\.accessdata\.fda\.gov\//);
  await expect(page.getByRole("link", { name: /P150038.*2016-07-11/ })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  await page.getByRole("link", { name: "Open the interactive comparison" }).click();
  const comparison = page.getByRole("dialog", { name: "Compare interventions" });
  await expect(comparison.getByRole("table")).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await comparison.getByRole("link", { name: "Export comparison" }).click();
  const brief = await readFile((await (await downloaded).path())!, "utf8");
  for (const id of ["P960009", "P150038"]) expect(brief).toContain(id);
  expect(brief).toContain("Limits: Original 2016 unilateral essential tremor indication.");
  expect(brief).toContain("does not establish absence of recalls or safety");
  await comparison.getByRole("link", { name: /request a sourced brief/i }).click();
  await expect(page).toHaveURL(/\/pilot#offer$/);

  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const prepare = page.getByRole("button", { name: "Prepare inquiry" });
  await prepare.click();
  await expect(page.getByRole("link", { name: "Open email draft" })).toHaveCount(0);
  await page.getByLabel("Organization", { exact: true }).fill("Example & Co");
  await page.getByLabel("Research question").fill("What does FDA record about stimulation vs ablation?");
  await page.getByLabel("When do you need it?").selectOption("Within one month");
  await prepare.click();
  await expect(page.getByRole("heading", { name: "Your draft is ready to send" })).toBeFocused();
  const destination = new URL((await page.getByRole("link", { name: "Open email draft" }).getAttribute("href"))!);
  expect(destination.pathname).toBe("arjan.singh.puniani.main@gmail.com");
  expect(destination.searchParams.get("body")).toContain("Example & Co");
  expect(destination.searchParams.get("body")).not.toContain("$1,500");
  expect(destination.searchParams.get("body")).toContain("Within one month");
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.getByLabel("Organization", { exact: true }).fill("Changed organization");
  await expect(page.getByRole("link", { name: "Open email draft" })).toHaveCount(0);
});

test("direct inquiry remains available without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto((process.env.ATLAS_BROWSER_BASE_PATH || "") + "/pilot");
    await expect(page.getByRole("button", { name: "Prepare inquiry" })).toBeDisabled();
    await expect(page.getByRole("link", { name: "arjan.singh.puniani.main@gmail.com" })).toHaveAttribute("href", /^mailto:/);
    await expect(page.getByRole("link", { name: "Download the cited example" })).toBeVisible();
  } finally {
    await context.close();
  }
});
