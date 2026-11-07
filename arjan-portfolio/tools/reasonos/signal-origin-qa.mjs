import { chromium, firefox, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { access, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";

const base = process.env.REASONOS_BASE_URL || "http://127.0.0.1:3237";
const out = process.env.REASONOS_QA_OUT || "/tmp/reasonos-signal-review";
await mkdir(out, { recursive: true });
const results = [];
for (const [name, engine] of [["chromium", chromium], ["firefox", firefox], ["webkit", webkit]]) {
  const options = name === "chromium" ? { channel: "chromium" } : {};
  if (name === "firefox") {
    try { await access(engine.executablePath()); }
    catch { options.executablePath = `${homedir()}/Library/Caches/ms-playwright/firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox`; }
  }
  const browser = await engine.launch(options);
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base + "/work/vector-ekg-reasonos/signal", { timeout: 120000 });
    const root = page.locator("[data-signal-origin]");
    await root.getByRole("heading", { name: "From cardiac cells to the ECG" }).waitFor();
    const value = () => root.locator("[data-voltage-mv]").getAttribute("data-voltage-mv").then(Number);
    await root.getByRole("button", { name: "QRS", exact: true }).click();
    const forward = await value(); assert.ok(forward > 0);
    const arrows = () => root.locator('path[marker-end*="source"]').evaluateAll(nodes => nodes.map(n => n.getAttribute("d")));
    const source = await arrows();
    await root.getByRole("button", { name: "Reverse recorder inputs" }).click();
    assert.ok(Math.abs(await value() + forward) < 1e-12);
    assert.deepEqual(await arrows(), source);
    await root.getByRole("button", { name: "Reverse recorder inputs" }).click();
    await root.getByLabel("Explanation lead").selectOption("I"); assert.notEqual(await value(), forward);
    await root.getByLabel("Explanation lead").selectOption("II");
    await root.getByRole("button", { name: "ST", exact: true }).click(); assert.equal(await value(), 0);
    assert.equal((await arrows()).length, 0);
    await root.getByRole("button", { name: "T", exact: true }).click(); assert.ok(await value() > 0);
    await root.getByLabel("Cardiac cycle time").focus(); await page.keyboard.press("ArrowRight");
    assert.equal(await root.getByLabel("Cardiac cycle time").inputValue(), "531");
    await root.getByRole("button", { name: "QRS", exact: true }).click();
    await root.getByRole("button", { name: "Repolarization", exact: true }).click();
    await root.getByRole("heading", { name: "Downward deflection", exact: true }).waitFor();
    await root.getByRole("button", { name: "Away from + input ←", exact: true }).click();
    await root.getByRole("heading", { name: "Upward deflection", exact: true }).waitFor();
    await root.getByRole("button", { name: "Depolarization", exact: true }).click();
    await root.getByRole("heading", { name: "Downward deflection", exact: true }).waitFor();
    await root.getByRole("button", { name: "Toward + input →", exact: true }).click();
    await root.getByRole("heading", { name: "Upward deflection", exact: true }).waitFor();
    const checks = [];
    for (const [label, width, height] of [["desktop", 1440, 1100], ["tablet", 820, 1180], ["phone", 390, 844]]) {
      await page.setViewportSize({ width, height });
      await root.scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label + " page overflow");
      if (label === "phone") assert.ok(await root.getByRole("region", { name: "Tissue boundary diagram; scroll horizontally on a small screen", exact: true }).evaluate(el => el.scrollLeft > 0), "phone tissue view must start centered on the boundary");
      const axe = await new AxeBuilder({ page }).include("[data-signal-origin]").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      checks.push({ viewport: label, violations: axe.violations });
      assert.deepEqual(axe.violations, [], `${name} ${label} accessibility`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${out}/${name}-${label}.png`, fullPage: true });
      if (label === "desktop") await page.locator('[data-signal-origin] > div').nth(2).screenshot({ path: `${out}/${name}-diagrams.png` });
    }
    const equation = root.locator("details").filter({ hasText: "Inspect the equations, units, assumptions" }).first();
    await equation.locator("summary").click();
    await equation.locator(".katex").first().waitFor();
    assert.equal(await equation.locator(".katex-error").count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const tissue = root.locator("details").filter({ hasText: "What crosses the membrane?" }).first();
    await tissue.locator("summary").click();
    await page.locator("summary").last().blur();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${out}/${name}-deep-dive.png`, fullPage: true });
    const deep = await new AxeBuilder({ page }).include("[data-signal-origin]").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    assert.deepEqual(deep.violations, []); checks.push({ viewport: "phone-disclosures", violations: deep.violations });
    await page.goto(base + "/work/vector-ekg-reasonos/workspace");
    await page.getByText("PTB-XL · 00010", { exact: true }).waitFor();
    await page.getByLabel("Endpoint A seconds", { exact: true }).fill("1");
    await page.locator("summary").filter({ hasText: "How does an ECG form?" }).click();
    await page.locator("[data-signal-origin]").waitFor();
    await page.locator("summary").filter({ hasText: "How does an ECG form?" }).click();
    assert.equal(await page.getByLabel("Endpoint A seconds", { exact: true }).inputValue(), "1");
    assert.deepEqual(errors, []);
    results.push({ engine: name, version: browser.version(), linkedModel: "pass", inputReversal: "source unchanged", fourBoundaryCases: "pass", keyboardScrub: "pass", workspaceEvidencePreserved: "pass", checks });
  } finally { await browser.close(); }
}
await writeFile(`${out}/browser-results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
