import { openCircuitEditor } from "./open-circuit-editor.mjs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { chromium, webkit, firefox } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile, access } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.QUANTUM_BASE_URL || "http://127.0.0.1:8864";
const output = new URL(
  "../../Documentation/Validation/Quantum/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const results = [];
const browsers = process.argv.includes("--smoke")
  ? [["chromium", chromium]]
  : [
      ["chromium", chromium],
      ["webkit", webkit],
      ["firefox", firefox],
    ];
for (const [name, type] of browsers) {
  let launchOptions = { headless: true };
  if (name === "firefox") {
    try {
      await access(type.executablePath());
    } catch {
      // shortcut: use this host’s installed Firefox if the expected revision is absent; install matching browsers for CI.
      const existing = `${homedir()}/Library/Caches/ms-playwright/firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox`;
      await access(existing);
      launchOptions.executablePath = existing;
    }
  }
  const browser = await type.launch(launchOptions);
  const sizes =
    name === "chromium"
      ? [
          [390, 844],
          [430, 932],
          [768, 1024],
          [1024, 768],
          [1440, 900],
          [1920, 1080],
        ]
      : [
          [390, 844],
          [1440, 900],
        ];
  for (const [width, height] of sizes) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage(),
      errors = [],
      failed = [],
      responseErrors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("requestfailed", (r) => failed.push(r.url()));
    page.on("response", (r) => {
      if (r.status() >= 400) responseErrors.push(`${r.status()} ${r.url()}`);
    });
    const start = Date.now();
    await page.goto(`${base}/quantum-computer-lab/index.html`);
    await page.waitForFunction(() => window.quantumLab);
    const interactiveMs = Date.now() - start;
    await page.waitForTimeout(1300);
    const webgl = await page.evaluate(() =>
      document.body.classList.contains("webgl"),
    );
    assert.equal(
      webgl,
      true,
      "3D scene must render in the standard browser path",
    );
    await page.screenshot({
      path: fileURLToPath(
        new URL(`${name}-${width}x${height}-assembly.png`, output),
      ),
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      "horizontal overflow",
    );
    await page.locator("#begin").click();
    await page.locator("#place-part").click();
    assert.deepEqual(
      await page.evaluate(() => window.quantumLab.snapshot().installed),
      [0],
    );
    await page.reload();
    await page.waitForFunction(() => window.quantumLab);
    assert.deepEqual(
      await page.evaluate(() => window.quantumLab.snapshot().installed),
      [0],
    );
    await page.locator("#explore").click();
    assert.equal(
      await page.evaluate(() => window.quantumLab.snapshot().installed.length),
      12,
    );
    await page.locator("#compute-tab").click();
    await openCircuitEditor(page);
    await page.locator("#bell-preset").click();
    await openCircuitEditor(page);
    await page.locator("#next-step").click();
    await openCircuitEditor(page);
    await page.locator("#next-step").click();
    const snapshot = await page.evaluate(() => window.quantumLab.snapshot());
    assert.equal(
      await page.locator("#state-vector .katex-mathml mtr").count(),
      4,
      "Four state-vector rows",
    );
    assert.equal(
      await page.locator("#density .katex-mathml mtr").count(),
      4,
      "Four density-matrix rows",
    );
    assert.ok(Math.abs(snapshot.probabilities[0] - 0.5) < 1e-10);
    assert.ok(Math.abs(snapshot.probabilities[3] - 0.5) < 1e-10);
    await page.locator("#measurement-basis").selectOption("Y");
    assert.match(await page.locator("#correlations").innerText(), /ideal -1/);
    await page.locator("#measurement-basis").selectOption("X");
    assert.match(await page.locator("#correlations").innerText(), /ideal 1/);
    await page.locator("#compare-mixture").click();
    assert.match(
      await page.locator("#mixture-comparison").innerText(),
      /00: 25%/,
    );
    await page.locator("#measurement-basis").selectOption("Z");
    await page.locator("#sample").click();
    await page.screenshot({
      path: new URL(`${name}-${width}x${height}-computation.png`, output)
        .pathname,
      fullPage: true,
    });
    const axe = await new AxeBuilder({ page }).analyze();
    await page.locator("#accessibility").click();
    assert.equal(await page.locator("#poster").isVisible(), true);
    await page.locator("#accessibility").click();
    await page.locator("#sources-open").click();
    assert.equal(await page.locator("#source-drawer").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".katex-error").count(), 0, "KaTeX errors");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      "computation overflow",
    );
    results.push({
      browser: name,
      version: browser.version(),
      width,
      height,
      interactiveMs,
      webgl,
      stats: snapshot.stats,
      errors,
      failed,
      responseErrors,
      axe: axe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
    });
    console.log(JSON.stringify(results.at(-1)));
    await context.close();
  }
  await browser.close();
}
await writeFile(
  new URL("browser-results.json", output),
  JSON.stringify(results, null, 2),
);
assert.ok(
  results.every((r) => r.errors.length === 0 && r.responseErrors.length === 0),
  "browser errors",
);
assert.ok(
  results.every((r) => r.axe.length === 0),
  "accessibility violations",
);
