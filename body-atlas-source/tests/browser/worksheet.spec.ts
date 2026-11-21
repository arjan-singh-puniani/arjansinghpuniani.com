import { readFile, mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { pilotDraftKey } from "../../lib/pilot-draft";

const pilot = (process.env.ATLAS_BROWSER_BASE_PATH || "") + "/pilot#build";
const question = "Which historical decisions support our review?";
const finding = "The original and supplemental decisions are separate sources.\nCheck each indication independently.";
const gap = "Confirm current labeling before the review.";

test("manufacturer search, reload recovery and a printable cited handoff preserve the research", async ({ page }, info) => {
  await page.goto(pilot);
  const builder = page.getByRole("region", { name: "Build a cited brief" });
  const reset = builder.getByText("Start a new worksheet", { exact: true });
  expect(await reset.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  expect((await reset.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const search = builder.getByRole("textbox", { name: "Find an FDA application by device name or ID" });
  await search.fill("NeuroPace");
  await builder.getByRole("button", { name: "Find application", exact: true }).click();
  const results = builder.getByRole("list", { name: "Matching FDA applications" });
  await expect(results).toContainText("FDA applicant");
  await results.getByRole("button", { name: /P100026/ }).click();
  await builder.getByRole("button", { name: "Use as first", exact: true }).click();
  await search.fill("P080025");
  await builder.getByRole("button", { name: "Find application", exact: true }).click();
  await builder.getByRole("button", { name: "Use as second", exact: true }).click();
  await builder.getByLabel("Decision or question (optional)").fill(question);
  await builder.getByLabel("What do the sources support?").fill(finding);
  await builder.getByLabel("What still needs checking?").fill(gap);
  const rns = builder.getByRole("article").filter({ has: page.getByRole("link", { name: "Original FDA record P100026", exact: true }) });
  const statement = rns.getByText("FDA decision statement", { exact: true });
  expect(await statement.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  expect((await statement.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await rns.getByRole("button", { name: "Verify original in cached FDA record" }).click();
  await expect(rns.getByText("Archived FDA record P100026", { exact: true })).toBeVisible();
  await rns.getByRole("button", { name: "Browse cached supplement history" }).click();
  await rns.getByLabel("Filter supplements for P100026").fill("S104");
  await rns.getByRole("button", { name: "Include S104 in worksheet" }).click();
  await rns.getByRole("button", { name: "Verify in cached FDA record", exact: true }).click();
  await expect(rns.getByText("Archived FDA record P100026/S104", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(key => JSON.parse(sessionStorage.getItem(key)!).supplements.P100026, pilotDraftKey)).toBe("S104");

  await page.reload();
  await expect(builder.getByText("Worksheet restored and saved in this tab.", { exact: true })).toBeVisible();
  await expect(builder.getByLabel("First FDA application")).toHaveValue("P100026");
  await expect(builder.getByLabel("Second FDA application")).toHaveValue("P080025");
  await expect(builder.getByLabel("Decision or question (optional)")).toHaveValue(question);
  await expect(builder.getByLabel("What do the sources support?")).toHaveValue(finding);
  await expect(builder.getByLabel("What still needs checking?")).toHaveValue(gap);
  await expect(rns.getByText("Included in export: P100026/S104.", { exact: true })).toBeVisible();
  await expect(rns.getByText("Archived FDA record P100026", { exact: true })).toHaveCount(0);
  await expect(rns.getByRole("button", { name: "Verify original in cached FDA record" })).toBeVisible();
  const download = page.waitForEvent("download");
  await builder.getByRole("link", { name: "Download editable worksheet" }).click();
  const markdown = await readFile((await (await download).path())!, "utf8");
  for (const text of ["FDA applicant:", "NeuroPace", "P100026/S104", "P080025", gap, "SHA-256", "has not been verified in this session"]) expect(markdown).toContain(text);
  expect(markdown).not.toContain("Exact cached decision verified in this session");

  await page.evaluate(() => { window.print = () => { document.documentElement.dataset.printed = "yes"; }; });
  await builder.getByRole("button", { name: "Print or save PDF" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-printed", "yes");
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "Compare devices. Trace the evidence." })).toBeHidden();
  await expect(builder.locator(".pilot-print-notes")).toContainText(finding);
  await expect(builder.locator(".pilot-print-provenance").first()).toContainText("SHA-256");
  if (info.project.name === "desktop" && process.env.ATLAS_WORKSHEET_PDF) {
    await mkdir("/private/tmp/atlas-workflow-review", { recursive: true });
    await page.pdf({ path: "/private/tmp/atlas-workflow-review/evidence-worksheet.pdf", printBackground: true, preferCSSPageSize: true });
  }
  await page.emulateMedia({ media: "screen" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  if (process.env.ATLAS_WORKSHEET_PDF) {
    await mkdir("/private/tmp/atlas-workflow-review", { recursive: true });
    await builder.screenshot({ path: `/private/tmp/atlas-workflow-review/worksheet-${info.project.name}.png` });
  }
  await builder.getByText("Start a new worksheet", { exact: true }).click();
  await builder.getByRole("button", { name: "Clear saved worksheet and notes" }).click();
  await expect(builder.getByLabel("First FDA application")).toHaveValue("");
  await page.reload();
  await expect(builder.getByLabel("Second FDA application")).toHaveValue("");
  await expect(builder.getByLabel("Decision or question (optional)")).toHaveValue("");
});

test("a failed restore preserves the saved copy, offers a backup and retries current sources", async ({ page }) => {
  const raw = JSON.stringify({ version: 1, first: "P100026", second: "P080025", question, applications: ["P080025"],
    notes: { "P080025/P100026": { finding, gap } }, supplements: {}, sourceUrl: "https://untrusted.invalid", verifications: { verified: true } });
  await page.addInitScript(({ key, raw }) => sessionStorage.setItem(key, raw), { key: pilotDraftKey, raw });
  await page.route("**/pilot/records.json", route => route.abort());
  await page.goto(pilot);
  const builder = page.getByRole("region", { name: "Build a cited brief" });
  await expect(builder.getByText(/saved copy has not been replaced/)).toBeVisible();
  expect(await page.evaluate(key => sessionStorage.getItem(key), pilotDraftKey)).toBe(raw);
  const backup = builder.getByRole("link", { name: "Download saved draft backup" });
  const saved = await backup.getAttribute("href");
  expect(decodeURIComponent(saved!.split(",").slice(1).join(","))).toBe(raw);
  await page.unroute("**/pilot/records.json");
  await builder.getByRole("button", { name: "Retry restoring worksheet" }).click();
  await expect(builder.getByLabel("Second FDA application")).toHaveValue("P080025");
  await expect(builder.getByLabel("What still needs checking?")).toHaveValue(gap);
  const sanitized = await page.evaluate(key => sessionStorage.getItem(key)!, pilotDraftKey);
  expect(sanitized).not.toContain("untrusted");
  expect(sanitized).not.toContain("verifications");
});

test("unreadable browser storage cannot be overwritten and leaves a usable worksheet", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Blocked", "SecurityError"); };
    Storage.prototype.setItem = () => { document.documentElement.dataset.storageWritten = "yes"; };
  });
  await page.goto(pilot);
  const builder = page.getByRole("region", { name: "Build a cited brief" });
  await expect(builder.getByText(/Draft saving is unavailable/)).toBeVisible();
  await builder.getByRole("button", { name: "Load Activa and ExAblate example" }).click();
  await builder.getByLabel("What still needs checking?").fill(gap);
  const download = page.waitForEvent("download");
  await builder.getByRole("link", { name: "Download editable worksheet" }).click();
  expect(await readFile((await (await download).path())!, "utf8")).toContain(gap);
  await expect(page.locator("html")).not.toHaveAttribute("data-storage-written", "yes");
  await expect(builder.getByRole("link", { name: "Download saved draft backup" })).toHaveCount(0);
});

test("a full browser store reports failed saving without blocking the current work", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
  });
  await page.goto(pilot);
  const builder = page.getByRole("region", { name: "Build a cited brief" });
  await expect(builder.getByText(/Draft saving is unavailable/)).toBeVisible();
  await builder.getByRole("button", { name: "Load Activa and ExAblate example" }).click();
  await builder.getByLabel("What still needs checking?").fill(gap);
  const download = page.waitForEvent("download");
  await builder.getByRole("link", { name: "Download editable worksheet" }).click();
  expect(await readFile((await (await download).path())!, "utf8")).toContain(gap);
});
