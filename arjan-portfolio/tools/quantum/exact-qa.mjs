import { openCircuitEditor } from "./open-circuit-editor.mjs";
import { chromium, webkit, firefox } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile, access } from "node:fs/promises";
import { homedir } from "node:os";
const base = process.env.QUANTUM_BASE_URL || "http://127.0.0.1:8865";
const out = "Documentation/Validation/Quantum/";
const results = [];
for (const [name, engine] of [
  ["chromium", chromium],
  ["webkit", webkit],
  ["firefox", firefox],
]) {
  const launch = name === "chromium" ? { channel: "chromium" } : {};
  if (name === "firefox") {
    try {
      await access(engine.executablePath());
    } catch {
      launch.executablePath = `${homedir()}/Library/Caches/ms-playwright/firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox`;
    }
  }
  const browser = await engine.launch(launch);
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1050 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/quantum-computer-lab/index.html#compute`);
    await page.waitForFunction(
      () => window.quantumLab?.snapshot().cursor === 1,
    );
    assert.equal(await page.locator("#gate-calculation").isVisible(), true);
    const tex = async (selector) =>
      (
        await page
          .locator(`${selector} annotation[encoding="application/x-tex"]`)
          .allTextContents()
      ).map((text) =>
        text.replace(/\\textcolor\{#[a-f0-9]+\}\{([01])\}/g, "$1"),
      );
    assert.match((await tex('[data-calc="input-ket"]')).join(""), /lvert00/);
    assert.match((await tex('[data-calc="result-ket"]')).join(""), /sqrt/);
    assert.doesNotMatch(
      (await tex('[data-calc="unitary"]')).join(""),
      /0\.707/,
    );
    await page
      .locator("#gate-calculation")
      .evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: out + `exact-${name}-hadamard.png` });
    await openCircuitEditor(page);
    await page.locator("#next-step").click();
    await page.locator('[data-row-choice="3"]').click();
    assert.equal(
      await page.locator("#coherent-addition").getAttribute("data-output"),
      "3",
    );
    assert.deepEqual(await tex('[data-calc="unitary"] [data-matrix-row="3"]'), [
      "0",
      "0",
      "1",
      "0",
    ]);
    assert.match((await tex('[data-calc="sum"]')).join(""), /b_\{11\}=/);
    assert.match((await tex('[data-calc="result-ket"]')).join(""), /lvert11/);
    assert.equal(
      await page.locator('[data-calc="output"] .selected-row').count(),
      1,
    );
    assert.equal(
      await page.locator('[data-calc="input"] .selected-row').count(),
      4,
    );
    await page.locator('[data-calculation-phase="result"]').click();
    await page
      .locator("#gate-calculation")
      .evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: out + `exact-${name}-cnot.png` });
    await page.locator('[data-calculation-phase="basis"]').click();
    assert.equal(
      await page.evaluate(() => quantumLab.snapshot().fraction),
      0,
      "Basis inspection seeks the shared clock to the input",
    );
    await page.locator('[data-row-choice="3"]').click();
    assert.equal(
      await page.evaluate(() => quantumLab.snapshot().fraction),
      1,
      "Exact row inspection seeks the shared clock to the gate endpoint",
    );
    const desktopAxe = (await new AxeBuilder({ page }).analyze()).violations;
    assert.deepEqual(
      desktopAxe.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      [],
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: out + `exact-${name}-mobile.png`,
      fullPage: true,
    });
    const mobileAxe = (await new AxeBuilder({ page }).analyze()).violations;
    assert.deepEqual(
      mobileAxe.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      [],
    );
    await openCircuitEditor(page);
    await page.locator("#qubits").selectOption("1");
    await openCircuitEditor(page);
    const builder = page.locator(".builder-disclosure");
    if (!(await builder.evaluate((element) => element.open)))
      await builder.locator("summary").click();
    const add = async (gate) => {
      await page.locator("#gate-select").selectOption(gate);
      await page.locator("#add-gate").click();
    };
    await add("Y");
    assert.match((await tex('[data-calc="result-ket"]')).join(""), /i\\lvert1/);
    await openCircuitEditor(page);
    await page.locator("#clear-circuit").click();
    await add("H");
    await add("Z");
    await add("H");
    await page.locator('[data-row-choice="0"]').click();
    const cancelled = (await tex('[data-calc="sum"]')).join("");
    assert.match(cancelled, /frac\{1\}\{2\}/);
    assert.match(cancelled, /-\\frac\{1\}\{2\}/);
    assert.match(cancelled, /=0$/);
    assert.equal(
      await page
        .locator('[data-ribbon-result="0"]')
        .getAttribute("data-cancelled"),
      "true",
    );
    assert.match(
      await page.locator("#coherent-percent").textContent(),
      /phases cancel/,
    );
    await page.locator('#coherent-populations [data-output="0"]').click();
    const addition = await page
      .locator("#coherent-addition")
      .evaluate((el) => ({
        sum: JSON.parse(el.dataset.amplitude),
        terms: [...el.querySelectorAll("[data-addend]")].map((term) =>
          JSON.parse(term.dataset.value),
        ),
      }));
    assert.ok(Math.hypot(...addition.sum) < 1e-12);
    assert.ok(addition.terms.some((term) => term[0] > 0.49));
    assert.ok(addition.terms.some((term) => term[0] < -0.49));
    assert.ok(
      (await page.evaluate(() => quantumLab.snapshot().probabilities))[1] >
        0.999999,
    );
    await openCircuitEditor(page);
    await page.locator("#clear-circuit").click();
    await page.locator("#gate-select").selectOption("Ry");
    await page.locator("#gate-angle").evaluate((element) => {
      element.value = 0.83;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.locator("#add-gate").click();
    assert.match(
      (await tex('[data-calc="unitary"]')).join(""),
      /cos\\frac\{\\eta\}/,
    );
    assert.match((await tex('[data-calc="parameter"]')).join(""), /0\.83/);
    await openCircuitEditor(page);
    await page.locator("#qubits").selectOption("3");
    await add("H");
    assert.equal(
      await page.locator('[data-calc="unitary"] [role="row"]').count(),
      8,
    );
    assert.equal(
      await page.locator('[data-calc="unitary"] [role="cell"]').count(),
      64,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual((await new AxeBuilder({ page }).analyze()).violations, []);
    await page.setViewportSize({ width: 1440, height: 1050 });
    await openCircuitEditor(page);
    await page.locator("#bell-preset").click();
    await openCircuitEditor(page);
    await page.locator("#next-step").click();
    await page.locator("#motion").click();
    const before = await page.evaluate(() => quantumLab.snapshot().state);
    await page.locator('[data-calc="replay"]').click();
    await page.waitForFunction(
      () => document.querySelectorAll(".calculation-ghost .katex").length >= 2,
    );
    const flyingKets = await page.locator(".calculation-ghost").count();
    await page.waitForFunction(
      () =>
        document.querySelector("#gate-calculation").dataset.phase ===
        "multiply",
    );
    await page.waitForTimeout(300);
    const flyingFactors = await page.locator(".calculation-ghost").count();
    await page.screenshot({
      path: out + `exact-${name}-multiplication-motion.png`,
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#gate-calculation").dataset.phase === "result",
      { timeout: 15000 },
    );
    await page.waitForFunction(() => !quantumLab.snapshot().playing);
    assert.deepEqual(
      await page.evaluate(() => quantumLab.snapshot().state),
      before,
      "Animating equivalent representations does not change the simulated state",
    );
    assert.equal(
      await page.locator(".math-status").count(),
      0,
      "Per-equation model disclaimers are consolidated in Sources & model",
    );
    assert.deepEqual(errors, []);
    results.push({
      browser: name,
      version: browser.version(),
      flyingKets,
      flyingFactors,
      exact: [
        "H",
        "CNOT",
        "Y",
        "H Z H cancellation",
        "symbolic Ry",
        "three-qubit matrix",
      ],
      desktopAxe,
      mobileAxe,
      errors,
    });
    await context.close();
  } finally {
    await browser.close();
  }
}
await writeFile(out + "exact-results.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
