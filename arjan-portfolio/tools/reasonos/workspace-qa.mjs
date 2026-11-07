import { chromium, firefox, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { homedir } from "node:os";

const base = process.env.REASONOS_BASE_URL || "http://127.0.0.1:3225";
const out = process.env.REASONOS_QA_OUT || "Documentation/Validation/ReasonOS/Workspace";
await mkdir(out, { recursive: true });
const results = [];
const rootPath = "/work/vector-ekg-reasonos/workspace";
const launch = async (name, engine) => {
  const options = name === "chromium" ? { channel: "chromium" } : {};
  if (name === "firefox") {
    try { await access(engine.executablePath()); }
    catch { options.executablePath = `${homedir()}/Library/Caches/ms-playwright/firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox`; }
  }
  return engine.launch(options);
};
const fixtureBrowser = await launch("chromium", chromium);
const fixturePage = await fixtureBrowser.newPage();
await fixturePage.goto(base + rootPath);
await fixturePage.getByText("PTB-XL · 00010", { exact: true }).waitFor();
const sheet = await fixturePage.locator('svg[aria-label^="Overview rendered"]').evaluate(el => el.outerHTML);
await fixturePage.setContent(`<html><body style="margin:0"><style>svg{width:300mm;height:155mm;display:block}</style>${sheet}<div style="break-before:page">Public reference fixture · second page</div></body></html>`);
const pdfBuffer = await fixturePage.pdf({ width: "300mm", height: "175mm", printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
await fixtureBrowser.close();

for (const [name, engine] of [["chromium", chromium], ["firefox", firefox], ["webkit", webkit]]) {
  const browser = await launch(name, engine);
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
    const page = await context.newPage(), errors = [], fileRequests = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("request", r => { if (r.postData()) fileRequests.push({ url: r.url(), method: r.method() }); });
    await page.goto(base + rootPath);
    const root = page.locator("[data-ecg-workspace]");
    await root.getByText("PTB-XL · 00010", { exact: true }).waitFor();
    await root.getByRole("button", { name: "Step 1: source", exact: true }).click();
    await root.getByRole("heading", { name: "Recorded digital signal", exact: true }).waitFor();
    await root.getByRole("button", { name: "Step 2: measure", exact: true }).click();
    assert.equal(await root.getByRole("button", { name: "Save measurement", exact: true }).isDisabled(), true);
    if (!(await root.getByRole("button", { name: "Focus lead V1", exact: true }).isVisible())) await root.locator("summary").filter({ hasText: "12-lead overview" }).click();
    await root.getByRole("button", { name: "Focus lead V1", exact: true }).press("Enter");
    await page.waitForFunction(() => document.querySelector('[aria-label="Focused lead"]')?.value === "V1");
    assert.equal(await root.getByLabel("Focused lead", { exact: true }).inputValue(), "V1");
    await root.getByLabel("Focused lead", { exact: true }).selectOption("II");
    await root.getByLabel("Endpoint A seconds", { exact: true }).fill("1");
    assert.equal(await root.getByRole("button", { name: "Save measurement", exact: true }).isDisabled(), true);
    await root.getByLabel("Endpoint B seconds", { exact: true }).fill("1.8");
    await root.getByLabel("Display gain", { exact: true }).selectOption("5");
    await root.getByRole("button", { name: "Save measurement", exact: true }).click();
    await root.getByRole("button", { name: "Attach reasoning →", exact: true }).click();
    await root.getByLabel("Observation and reasoning", { exact: true }).fill("The manually selected interval is 800 ms. I would check adjacent cycles before describing regularity.");
    await root.getByRole("button", { name: "Save proposed interpretation", exact: true }).click();
    await root.getByText("User-authored · not clinically validated", { exact: true }).waitFor();
    const exported = page.waitForEvent("download");
    await root.getByRole("button", { name: "Export full trace", exact: true }).click();
    const data = JSON.parse(await readFile(await (await exported).path(), "utf8"));
    assert.equal(data.rawRecordingIncluded, false);
    const tx = data.trace.entries.filter(e => e.event.type === "transformation.attempted");
    assert.equal(tx.length, 2); assert.equal(tx[0].event.outputState.payload.durationMs, 800);
    assert.equal(tx[0].event.outputState.provenance.domainVersion, "1.1.0");
    assert.equal(tx[0].event.outputState.payload.durationMs, (tx[0].event.outputState.payload.sampleIndices[1] - tx[0].event.outputState.payload.sampleIndices[0]) / 500 * 1000);
    assert.deepEqual(tx[1].event.transformation.inputStateIds, [tx[0].event.outputState.id]);
    await root.getByRole("button", { name: "Revise endpoints", exact: true }).click();
    await root.getByLabel("Endpoint B seconds", { exact: true }).fill("1.9");
    await root.getByRole("button", { name: "Save revision", exact: true }).click();
    assert.equal(await root.getByLabel("Focused time span", { exact: true }).inputValue(), "10", "restored view and time-span control must agree");
    await root.getByRole("button", { name: /^Review 3$/ }).click();
    await root.getByText("Needs review · supporting measurement revised", { exact: true }).waitFor();
    await root.getByRole("checkbox", { name: "Overlays", exact: true }).uncheck();
    assert.equal(await root.locator("[data-caliper]").count(), 0);
    await root.getByRole("checkbox", { name: "Overlays", exact: true }).check();
    const checks = [];
    for (const [width, height, label] of [[1440, 1100, "desktop"], [768, 1024, "tablet"], [390, 844, "phone"]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => { document.querySelector("[data-ecg-workspace]").scrollTop = 0; });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "page overflow");
      const axe = await new AxeBuilder({ page }).include("[data-ecg-workspace]").analyze();
      checks.push({ viewport: label, violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
      await page.screenshot({ path: `${out}/${name}-${label}.png` });
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await root.locator('input[type="file"]').setInputFiles({ name: "public-reference-fixture.pdf", mimeType: "application/pdf", buffer: pdfBuffer });
    await root.getByText("Local ECG PDF", { exact: true }).waitFor();
    const pages = root.getByLabel("PDF page", { exact: true });
    assert.ok(await pages.locator("option").count() >= 2);
    await pages.selectOption("2"); 
    await root.locator('svg[aria-label^="Imported original"]').waitFor();
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
    await pages.selectOption("1");
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
    await root.getByRole("button", { name: "Source", exact: true }).click();
    await root.getByLabel("Grid A x", { exact: true }).fill("100");
    await root.getByLabel("Grid A y", { exact: true }).fill("100");
    await root.getByLabel("Grid B x", { exact: true }).fill("283.33");
    await root.getByLabel("Grid B y", { exact: true }).fill("100");
    await root.getByLabel("I checked the grid span and printed paper speed.", { exact: true }).check();
    await root.getByRole("button", { name: "Measure", exact: true }).click();
    await root.getByLabel("Endpoint A x", { exact: true }).fill("150");
    await root.getByLabel("Endpoint A y", { exact: true }).fill("600");
    await root.getByLabel("Endpoint B x", { exact: true }).fill("333.33");
    await root.getByLabel("Endpoint B y", { exact: true }).fill("600");
    await root.getByLabel("Both endpoints use the stated lead and the same time scale.", { exact: true }).check();
    await root.getByRole("button", { name: "Save measurement", exact: true }).click();
    await root.getByRole("button", { name: /^Review 1$/ }).click();
    await root.getByText("1000 ms", { exact: true }).waitFor();
    await page.screenshot({ path: `${out}/${name}-pdf-overlay.png` });
    const pngFixture = await root.locator('svg[aria-label^="Imported original"]').screenshot();
    const pdfAxe = await new AxeBuilder({ page }).include("[data-ecg-workspace]").analyze();
    checks.push({ viewport: "pdf", violations: pdfAxe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
    await root.locator('input[type="file"]').setInputFiles({ name: "rejected.csv", mimeType: "text/csv", buffer: Buffer.from("invalid") });
    await root.getByRole("alert").waitFor();
    assert.ok(await pages.locator("option").count() >= 2, "failed import must retain PDF navigation");
    await pages.selectOption("2");
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
    await pages.selectOption("1");
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
    await root.locator('input[type="file"]').setInputFiles({ name: "public-reference.png", mimeType: "image/png", buffer: pngFixture });
    await root.getByText("Local ECG image", { exact: true }).waitFor();
    await root.locator('input[type="file"]').setInputFiles({ name: "broken.pdf", mimeType: "application/pdf", buffer: Buffer.from("invalid PDF bytes") });
    await root.getByRole("alert").waitFor();
    assert.equal(await root.getByText("Local ECG image", { exact: true }).isVisible(), true);
    await root.locator('input[type="file"]').setInputFiles({ name: "example.csv", mimeType: "text/csv", buffer: Buffer.from("time_ms,I_mV,II_mV\n0,0,1\n2,1,0\n4,0,-1\n6,-1,0\n8,0,1\n10,0,0") });
    await root.getByText("Local digital ECG", { exact: true }).waitFor();
    await root.locator('input[type="file"]').setInputFiles({ name: "broken.csv", mimeType: "text/csv", buffer: Buffer.from("bad data") });
    await root.getByRole("alert").waitFor();
    assert.equal(await root.getByText("Local digital ECG", { exact: true }).isVisible(), true, "failed import preserves prior recording");
    const text = "time_ms,I_mV,II_mV\n0,0,1\n2,1,0\n4,0,-1";
    for (const bom of [false, true]) {
      const buffer = Buffer.concat([bom ? Buffer.from([239, 187, 191]) : Buffer.alloc(0), Buffer.from(text)]);
      const digest = createHash("sha256").update(buffer).digest("hex");
      await root.locator('input[type="file"]').setInputFiles({ name: "identity.csv", mimeType: "text/csv", buffer });
      await root.getByRole("button", { name: "Source", exact: true }).click();
      await root.getByText(digest, { exact: true }).waitFor();
    }
    await root.locator('input[type="file"]').setInputFiles({ name: "amplitude.csv", mimeType: "text/csv", buffer: Buffer.from("time_ms,V6_mV\n0,0\n2,10\n4,0\n6,-10\n8,0") });
    await root.getByText(/^Some recorded peaks exceed/).waitFor();
    const leadBox = await root.getByRole("button", { name: "Focus lead V6", exact: true }).locator("rect").first().boundingBox();
    const sheetBox = await root.locator('svg[aria-label^="Overview rendered"]').boundingBox();
    assert.ok(leadBox && sheetBox && leadBox.y >= sheetBox.y && leadBox.y + leadBox.height <= sheetBox.y + sheetBox.height + 1, "subset lead must lie inside the overview");
    await root.getByRole("button", { name: "Lower display gain", exact: true }).click();
    await root.getByRole("button", { name: "Lower display gain", exact: true }).click();
    await root.getByText(/^Some recorded peaks exceed/).waitFor({ state: "hidden" });
    const raw = `${process.cwd()}/public/ecg-reference/ptb-xl-1.0.3`;
    await root.locator('input[type="file"]').setInputFiles([`${raw}/00010_hr.hea`, `${raw}/00010_hr.dat`]);
    await root.getByRole("alert").waitFor({ state: "hidden" });
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
    assert.equal(await root.getByLabel("Focused lead", { exact: true }).locator("option").count(), 12);
    assert.equal(fileRequests.length, 0, "recording bytes or notes sent in request bodies");
    assert.deepEqual(errors, []);
    results.push({ engine: name, version: browser.version(), workflow: "pass", imports: ["PDF", "PNG", "CSV", "WFDB"], malformedFile: "prior source retained", networkRequestBodies: fileRequests.length, checks });
    await page.goto(base + "/reasonos/review/index.html");
    await page.getByRole("heading", { name: "Independent review protocol", exact: true }).waitFor();
    assert.equal(await page.locator("form").count(), 0);
    const reviewAxe = await new AxeBuilder({ page }).include("main").analyze();
    checks.push({ viewport: "review-protocol", violations: reviewAxe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
    for (const file of ["reference-00010.pdf", "reference-00010.csv", "response.txt"]) {
      const response = await page.request.get(base + "/reasonos/review/" + file);
      assert.ok(response.ok(), "Public review fixture must load: " + file);
    }
    await page.screenshot({ path: `${out}/${name}-review-protocol.png` });
    await context.close();
  } finally { await browser.close(); }
}
await writeFile(`${out}/browser-results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
assert.ok(results.every(r => r.checks.every(c => c.violations.length === 0)), "Accessibility violations need review");
