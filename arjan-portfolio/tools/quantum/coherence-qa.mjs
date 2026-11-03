import { openCircuitEditor } from "./open-circuit-editor.mjs";
import { chromium, firefox, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile, access } from "node:fs/promises";
import { homedir } from "node:os";
const base = process.env.QUANTUM_BASE_URL || "http://127.0.0.1:8865";
const output = "Documentation/Validation/Quantum/";
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
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/quantum-computer-lab/index.html#compute");
    await page.waitForFunction(
      () => window.quantumLab?.snapshot().cursor === 1,
    );
    await page.locator("#inspect-coherence").click();
    await page.locator("#bell-phase-experiment").click();
    const correlations = () =>
      page
        .locator(
          '#coherence-metrics [data-correlation]:not([data-correlation="XY"])',
        )
        .allTextContents();
    const snapshot = () => page.evaluate(() => quantumLab.snapshot());
    const compare = async (expected) => {
      const values = (await correlations()).map((x) =>
        Number(x.replace("−", "-")),
      );
      values.forEach((x, j) => assert.ok(Math.abs(x - expected[j]) < 0.011));
    };
    await compare([1, -1, 1]);
    assert.match(await page.locator("#waveform").textContent(), /No XY burst/);
    assert.doesNotMatch(await page.locator("#waveform").textContent(), /40 ns/);
    await page.locator("#stage-bell-phase").evaluate((el) => {
      el.value = 0.83;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.ok(
      Math.abs(Number(await page.locator("#bell-phase").inputValue()) - 0.83) <
        1e-12,
    );
    await page.locator('[data-bell-phase="0"]').click();

    assert.ok(
      Math.abs(
        Number(
          await page
            .locator("#coherence-metrics")
            .getAttribute("data-fidelity"),
        ) - 1,
      ) < 1e-12,
    );
    const baseline = (await snapshot()).probabilities;
    await page.locator('[data-bell-phase="1.5707963267948966"]').click();
    await compare([0, 0, 1]);
    const phaseHalf = await snapshot();
    phaseHalf.probabilities.forEach((p, j) =>
      assert.ok(Math.abs(p - baseline[j]) < 1e-12),
    );
    const imagLabel = await page
      .locator('#joint-density [data-density-row="0"][data-density-col="3"]')
      .getAttribute("aria-label");
    assert.match(imagLabel, /imaginary -0.5/);
    const phaseArrow = await page
      .locator('[data-ribbon="0-0"] .ribbon-phase path')
      .getAttribute("transform");
    assert.ok(
      Math.abs(Number(phaseArrow.match(/rotate\(([^)]+)\)/)[1]) - 45) < 1e-10,
    );
    assert.equal(
      await page.locator('[data-correlation="XY"]').textContent(),
      "+1",
    );
    await page.locator("#readout-noise").evaluate((el) => {
      el.value = 0;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.locator('[data-coherence-basis="XY"]').click();
    assert.match(
      await page.locator("#correlations").textContent(),
      /⟨XY⟩: calculated 1; classified 1/,
    );
    await page.locator("#measurement-basis").selectOption("Z");

    await page.locator('[data-bell-phase="3.141592653589793"]').click();
    await compare([-1, 1, 1]);
    assert.ok(
      Math.abs(
        Number(
          await page
            .locator("#coherence-metrics")
            .getAttribute("data-fidelity"),
        ),
      ) < 1e-12,
    );
    assert.match(
      await page.locator("#bell-witness-reading").textContent(),
      /other entangled states/,
    );
    const spheres = await page
      .locator("#bloch-spheres svg")
      .evaluateAll((list) => list.map((el) => JSON.parse(el.dataset.vector)));
    spheres.flat().forEach((value) => assert.ok(Math.abs(value) < 1e-12));
    await page
      .locator("#coherence-inspector")
      .evaluate((el) =>
        el.scrollIntoView({ block: "start", behavior: "instant" }),
      );
    await page.screenshot({ path: output + `coherence-${name}-phase-pi.png` });
    const desktopAxe = (await new AxeBuilder({ page }).analyze()).violations;
    assert.deepEqual(
      desktopAxe.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
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
    await page
      .locator("#coherence-inspector")
      .evaluate((el) =>
        el.scrollIntoView({ block: "start", behavior: "instant" }),
      );
    await page.screenshot({ path: output + `coherence-${name}-mobile.png` });
    const mobileAxe = (await new AxeBuilder({ page }).analyze()).violations;
    assert.deepEqual(
      mobileAxe.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
    );
    await page.locator("#readout-noise").evaluate((el) => {
      el.value = 0;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.locator('[data-coherence-basis="X"]').click();
    const measured = await page
      .locator("#histogram .hist-row")
      .allTextContents();
    assert.match(measured[0], /0\.0% \/ 0/);
    assert.match(measured[3], /0\.0% \/ 0/);
    assert.match(
      await page.locator("#correlations").textContent(),
      /calculated -1; classified -1/,
    );
    assert.ok(
      Math.abs(
        Number(
          await page
            .locator("#coherence-metrics")
            .getAttribute("data-fidelity"),
        ),
      ) < 1e-12,
      "Analysis remains the pre-terminal-readout ensemble",
    );
    // An earlier projective measurement removes off-diagonal coherence across branches.
    await openCircuitEditor(page);
    const builder = page.locator(".builder-disclosure");
    if (!(await builder.evaluate((el) => el.open)))
      await builder.locator("summary").click();
    await page.locator("#gate-select").selectOption("M");
    await page.locator("#gate-target").selectOption("0");
    await page.locator("#add-gate").click();
    await compare([0, 0, 1]);
    assert.ok(
      Math.abs(
        Number(
          await page
            .locator("#coherence-metrics")
            .getAttribute("data-fidelity"),
        ) - 0.5,
      ) < 1e-12,
    );
    assert.match(
      await page
        .locator('#joint-density [data-density-row="0"][data-density-col="3"]')
        .getAttribute("aria-label"),
      /real 0, imaginary 0/,
    );
    await openCircuitEditor(page);
    await page.locator("#qubits").selectOption("3");
    assert.equal(await page.locator("#coherence-inspector").isVisible(), false);
    assert.deepEqual(errors, []);
    results.push({
      browser: name,
      version: browser.version(),
      phaseSettings: [0, Math.PI / 2, Math.PI],
      sameZPopulations: true,
      zeroLocalBlochVectors: true,
      midMeasurementEnsemble: true,
      desktopAxe,
      mobileAxe,
      errors,
    });
    console.log(
      `${name}: Bell phase, coherence, witness, measurement ensemble, mobile, and accessibility pass`,
    );
  } finally {
    await browser.close();
  }
}
await writeFile(
  output + "coherence-results.json",
  JSON.stringify(results, null, 2),
);
