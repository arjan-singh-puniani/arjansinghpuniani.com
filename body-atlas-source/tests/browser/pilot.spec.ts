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

test("exact application lookup preserves original and later decision boundaries", async ({ page }) => {
  const basePath = process.env.ATLAS_BROWSER_BASE_PATH || "";
  await page.goto(basePath + "/pilot#build");
  const builder = page.getByRole("region", { name: "Build a cited brief" });
  const lookup = builder.getByRole("textbox", { name: "Find an FDA application by ID" });
  const find = builder.getByRole("button", { name: "Find application" });
  await lookup.fill("P960009/S007");
  await find.click();
  await expect(builder.getByText(/Enter an original FDA application ID/)).toBeVisible();
  await lookup.fill("den160019");
  const index = basePath + "/pilot/records.json";
  await page.route("**" + index, route => route.abort(), { times: 1 });
  await find.click();
  await expect(builder.getByText(/application index could not load/i)).toBeVisible();
  const loaded = page.waitForResponse(response => new URL(response.url()).pathname === index && response.ok());
  await find.click();
  expect(new URL((await loaded).url()).search).toBe("");
  await builder.getByRole("button", { name: "Use as first" }).click();
  await lookup.fill("P999999");
  await find.click();
  await expect(builder.getByText(/outside the snapshot/i)).toBeVisible();
  await lookup.fill("P960009");
  await find.click();
  await builder.getByRole("button", { name: "Use as second" }).click();
  await expect(builder.getByRole("link", { name: "Original FDA record DEN160019" })).toBeVisible();
  await expect(builder.getByRole("link", { name: "Original FDA record P960009" })).toBeVisible();
  await expect(builder.getByRole("link", { name: "P960009/S007" })).toHaveAttribute("href", /pma\.cfm\?id=P960009S007$/);
  await expect(builder.getByText("2002-01-14", { exact: true })).toBeVisible();
  await expect(builder.getByText(/bilateral GPi or STN stimulation/)).toBeVisible();
  await expect(builder.getByText(/No later decision has a reviewed summary/)).toBeVisible();
  const file = page.waitForEvent("download");
  await builder.getByRole("link", { name: "Download editable worksheet" }).click();
  const exported = await readFile((await (await file).path())!, "utf8");
  expect(exported).toContain("DEN160019");
  expect(exported).toContain("P960009/S007");
  expect(exported).toContain("2002-01-14");
  expect(exported).toContain("No later decision has a reviewed summary");
});

test("a buyer can add an exact cached supplement and a decision note to the worksheet", async ({ page }) => {
  const basePath = process.env.ATLAS_BROWSER_BASE_PATH || "";
  await page.goto(basePath + "/pilot#build");
  const builder = page.getByRole("region", { name: "Build a cited brief" });
  await page.getByLabel("First FDA application").selectOption("P100026");
  await page.getByLabel("Second FDA application").selectOption("P960009");
  const rns = builder.getByRole("article").filter({ has: page.getByRole("link", { name: "Original FDA record P100026" }) });
  const archivePath = basePath + "/dossiers/rns.json";
  await page.route("**" + archivePath, route => route.abort(), { times: 1 });
  await rns.getByRole("button", { name: "Browse cached supplement history" }).click();
  await expect(rns.getByRole("alert")).toBeVisible();
  const loaded = page.waitForResponse(response => new URL(response.url()).pathname === archivePath && response.ok());
  await rns.getByRole("button", { name: "Retry supplement history" }).click();
  expect(new URL((await loaded).url()).search).toBe("");
  const filter = rns.getByRole("textbox", { name: "Filter supplements for P100026" });
  await filter.fill("P960009/S007");
  await expect(rns.getByText("No matching supplements in this archive.")).toBeVisible();
  await filter.fill("P100026/S104");
  await expect(rns.getByRole("link", { name: "P100026/S104" })).toHaveAttribute("href", /P100026S104$/i);
  await rns.getByRole("button", { name: "Include S104 in worksheet" }).click();
  await expect(rns.getByText("Included in export: P100026/S104.")).toBeVisible();
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await builder.getByLabel("What do the sources support?").fill("S104 concerns a manufacturing process change.");
  await builder.getByLabel("What still needs checking?").fill("Confirm the scope of the current label & model.");
  const file = page.waitForEvent("download");
  await builder.getByRole("link", { name: "Download editable worksheet" }).click();
  const exported = await readFile((await (await file).path())!, "utf8");
  for (const expected of [
    "S104 concerns a manufacturing process change.",
    "Confirm the scope of the current label &amp; model.",
    "Selected cached supplement: [P100026/S104]",
    "FDA decision code OK30",
    "Archive source SHA-256:",
    "P960009/S007",
  ]) expect(exported).toContain(expected);
  expect(requests).toEqual([]);
  await rns.getByRole("button", { name: "Remove selected supplement" }).click();
  await expect(builder.getByRole("link", { name: "Download editable worksheet" })).not.toHaveAttribute("href", /Selected%20cached%20supplement/);
  await page.getByLabel("Second FDA application").selectOption("P970003");
  await expect(builder.getByLabel("What do the sources support?")).toHaveValue("");
  await expect(builder.getByLabel("What still needs checking?")).toHaveValue("");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});
