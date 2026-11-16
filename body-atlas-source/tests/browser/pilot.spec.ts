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

test("a buyer can export a worksheet about their own FDA applications", async ({ page }) => {
  const basePath = process.env.ATLAS_BROWSER_BASE_PATH || "";
  await page.goto(basePath + "/pilot");
  await page.getByRole("link", { name: "Build a cited brief" }).click();
  const builder = page.getByRole("region", { name: "Build a cited brief" });
  const download = builder.getByRole("link", { name: "Download editable worksheet" });
  await expect(download).toHaveCount(0);
  await page.getByLabel("First FDA application").selectOption("P100026");
  await expect(page.getByLabel("Second FDA application").locator('option[value="P100026"]')).toHaveJSProperty("disabled", true);
  await expect(download).toHaveCount(0);
  await page.getByLabel("Second FDA application").selectOption("P970003");
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await builder.getByLabel("Decision or question (optional)").fill("Compare recording & stimulation for our review.");
  await expect(builder.getByRole("link", { name: "Original FDA record P100026" })).toHaveAttribute("href", /^https:\/\/www\.accessdata\.fda\.gov\//);
  await expect(builder.getByRole("link", { name: "Original FDA record P970003" })).toBeVisible();
  await expect(builder.getByText(/retrieved/i)).toHaveCount(2);
  await builder.getByText("FDA decision statement", { exact: true }).first().click();
  await expect(builder.locator("details[open] p")).toContainText(/RNS/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect((await new AxeBuilder({ page }).include("#build").analyze()).violations).toEqual([]);

  const file = page.waitForEvent("download");
  await download.click();
  const contents = await readFile((await (await file).path())!, "utf8");
  for (const expected of ["P100026", "P970003", "2013-11-14", "1997-07-16", "Compare recording &amp; stimulation", "## Decision notes", "relevant supplements", "Regional relationships"]) {
    expect(contents).toContain(expected);
  }
  expect(contents).not.toContain("P150038");
  expect(requests).toEqual([]);
  await page.getByLabel("Second FDA application").selectOption("");
  await expect(download).toHaveCount(0);
});
