import { openCircuitEditor } from "./open-circuit-editor.mjs";
import { chromium, webkit, firefox } from "playwright";
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
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/quantum-computer-lab/index.html#compute");
    await page.waitForFunction(
      () => window.quantumLab?.snapshot().cursor === 1,
    );
    await page
      .locator("#coherent-stage")
      .evaluate((e) => e.scrollIntoView({ block: "start" }));
    const scrub = async (value) => {
      await page.locator("#execution-scrub").evaluate((e, value) => {
        e.value = value;
        e.dispatchEvent(new Event("input", { bubbles: true }));
      }, value);
    };
    for (const gate of ["H", "CNOT"]) {
      if (gate === "CNOT") {
        await openCircuitEditor(page);
        await page.locator("#next-step").click();
      }
      for (const fraction of [0, 0.17, 0.5, 0.72, 1]) {
        await scrub(fraction);
        const checked = await page.evaluate(
          async ({ fraction, gate }) => {
            const sim = await import("./simulator.js");
            const snapshot = quantumLab.snapshot();
            const before =
              gate === "H"
                ? sim.initial(2)
                : sim.run(sim.initial(2), [{ name: "H", target: 0 }]).state;
            const op =
              gate === "H"
                ? { name: "H", target: 0 }
                : { name: "CNOT", control: 0, target: 1 };
            const expected = sim.interpolate(before, op, fraction);
            const error = Math.max(
              ...expected.flatMap((a, j) =>
                a.map((x, k) => Math.abs(x - snapshot.state[j][k])),
              ),
            );
            const blochError = Math.max(
              ...Array.from(
                document.querySelectorAll("#bloch-spheres svg"),
                (svg, q) => {
                  const actual = JSON.parse(svg.dataset.vector);
                  return Math.max(
                    ...sim
                      .reduced(expected, q)
                      .bloch.map((x, k) => Math.abs(x - actual[k])),
                  );
                },
              ),
            );
            const addition = document.querySelector("#coherent-addition"),
              selectedOutput = Number(addition.dataset.output),
              amplitudeSum = JSON.parse(addition.dataset.amplitude),
              addends = [...addition.querySelectorAll("[data-addend]")].reduce(
                (sum, el) => {
                  const value = JSON.parse(el.dataset.value);
                  return sum.map((x, k) => x + value[k]);
                },
                [0, 0],
              );
            const teaching = await import("./teaching.js");
            const zProjectionError = Math.max(
              ...[...document.querySelectorAll("#bloch-spheres svg")].flatMap(
                (svg, q) => {
                  const z = sim.reduced(expected, q).bloch[2],
                    point = teaching.projectBloch([0, 0, z]),
                    dot = svg.querySelector(".bloch-z-point");
                  return [
                    Math.abs(Number(dot.getAttribute("cx")) - point[0]),
                    Math.abs(Number(dot.getAttribute("cy")) - point[1]),
                  ];
                },
              ),
            );
            return {
              error,
              blochError,
              zProjectionError,
              selectedOutput,
              amplitudeSum,
              addends,
              additionProgress: Number(addition.dataset.progress),
              calculationCaption: document.querySelector(
                "#coherent-rule-caption",
              ).textContent,
              pulseAreas: document.querySelectorAll(".pulse-area").length,
              ketOverflow:
                document.querySelector("#coherent-current").scrollWidth -
                document.querySelector("#coherent-current").clientWidth,
              stage: Number(
                document.querySelector("#coherent-stage").dataset.progress,
              ),
              pulse: Number(
                document.querySelector(".waveform-head").dataset.progress,
              ),
              hardware: Number(
                document.querySelector("#processor-signal").dataset.progress,
              ),
              ribbonOutput: Array.from({ length: expected.length }, (_, row) =>
                [
                  ...document.querySelectorAll(
                    `#ket-ribbons [data-ribbon^="${row}-"]`,
                  ),
                ].reduce(
                  (sum, el) => {
                    const value = JSON.parse(el.dataset.value);
                    return [sum[0] + value[0], sum[1] + value[1]];
                  },
                  [0, 0],
                ),
              ),
              expectedState: expected,
              bars: [
                ...document.querySelectorAll(".coherent-population output"),
              ].map((e) => parseFloat(e.textContent)),
              expected: expected.map((a) => sim.abs2(a) * 100),
            };
          },
          { fraction, gate },
        );
        assert.ok(checked.error < 1e-12);
        assert.ok(checked.blochError < 1e-12);
        assert.ok(checked.zProjectionError < 1e-12);
        assert.equal(checked.additionProgress, fraction);
        assert.equal(checked.pulseAreas, 4);
        assert.match(
          checked.calculationCaption,
          fraction === 1 ? /EXACT ENDPOINT/ : /LIVE CALCULATION/,
        );
        for (let k = 0; k < 2; k++) {
          assert.ok(
            Math.abs(
              checked.amplitudeSum[k] -
                checked.expectedState[checked.selectedOutput][k],
            ) < 1e-12,
          );
          assert.ok(
            Math.abs(checked.addends[k] - checked.amplitudeSum[k]) < 1e-12,
          );
        }
        assert.ok(
          checked.ketOverflow <= 1,
          "The live ket must remain fully visible",
        );
        checked.ribbonOutput.forEach((a, j) =>
          a.forEach((x, k) =>
            assert.ok(Math.abs(x - checked.expectedState[j][k]) < 1e-12),
          ),
        );
        assert.equal(checked.stage, fraction);
        assert.equal(checked.pulse, fraction);
        assert.equal(checked.hardware, fraction);
        checked.bars.forEach((value, j) =>
          assert.ok(Math.abs(value - checked.expected[j]) < 0.051),
        );
      }
      await page
        .locator("#coherent-stage")
        .evaluate((e) => e.scrollIntoView({ block: "start" }));
      assert.match(
        await page.locator("#coherent-rule-caption").textContent(),
        gate === "H" ? /OUTPUT 10/ : /OUTPUT 11/,
      );
      await page.screenshot({
        path: output + `synchrony-${name}-${gate.toLowerCase()}.png`,
      });
    }
    assert.match(
      await page.locator("#coherent-correlation").textContent(),
      /ENTANGLED/,
    );
    await page.locator('#coherent-populations [data-output="0"]').click();
    assert.equal(
      await page.locator("#coherent-addition").getAttribute("data-output"),
      "0",
    );
    assert.match(
      await page.locator("#coherent-rule-caption").textContent(),
      /OUTPUT 00/,
    );
    assert.equal(
      await page
        .locator('#coherent-populations [data-output="0"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await page
        .locator('#ket-ribbons [data-ribbon="0-0"]')
        .getAttribute("data-focused"),
      "true",
    );
    assert.equal(
      await page.locator('[data-row-choice="0"]').getAttribute("aria-pressed"),
      "true",
    );
    const desktopAxe = (await new AxeBuilder({ page }).analyze()).violations;
    assert.deepEqual(
      desktopAxe.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
    // A virtual Z changes phase and geometry without fabricating a microwave burst.
    await openCircuitEditor(page);
    await page.locator("#qubits").selectOption("1");
    await openCircuitEditor(page);
    await page.locator(".builder-disclosure > summary").click();
    for (const gate of ["H", "Z"]) {
      await page.locator("#gate-select").selectOption(gate);
      await page.locator("#add-gate").click();
    }
    await scrub(0.5);
    assert.equal(
      await page.locator("#coherent-stage").getAttribute("data-kind"),
      "frame",
    );
    assert.equal(
      await page
        .locator("#processor-signal circle")
        .evaluate((e) => getComputedStyle(e).opacity),
      "0",
    );
    const virtual = await page.evaluate(() => quantumLab.snapshot());
    assert.ok(Math.abs(virtual.probabilities[0] - 0.5) < 1e-10);
    // A single-gate replay stays on its selected gate; all layers finish at the same endpoint.
    await openCircuitEditor(page);
    await page.locator("#bell-preset").click();
    await openCircuitEditor(page);
    await page.locator("#next-step").click();
    await page.locator("#motion").click();
    await page.locator("#replay-gate").click();
    await page.waitForFunction(() => {
      const s = quantumLab.snapshot();
      return s.playing && s.fraction > 0.25 && s.fraction < 0.8;
    });
    const moving = await page.evaluate(() => quantumLab.snapshot());
    assert.equal(moving.cursor, 1);
    assert.ok(moving.fraction > 0 && moving.fraction < 1);
    await page
      .locator("#coherent-stage")
      .evaluate((e) => e.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: output + `synchrony-${name}-moving.png` });
    await page.waitForFunction(() => !quantumLab.snapshot().playing);
    const endpoint = await page.evaluate(() => quantumLab.snapshot());
    assert.equal(endpoint.cursor, 1);
    assert.equal(endpoint.fraction, 1);
    assert.ok(Math.abs(endpoint.probabilities[0] - 0.5) < 1e-10);
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .locator("#coherent-stage")
      .evaluate((e) => e.scrollIntoView({ block: "start" }));
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.ok(
      (await page.locator("#coherent-mobile-ket").textContent()).trim().length >
        0,
      "The pinned ket refreshes after a desktop-to-phone resize",
    );
    await page.screenshot({ path: output + `synchrony-${name}-mobile.png` });
    await page
      .locator(".coherent-views .hardware-panel")
      .evaluate((e) => e.scrollIntoView({ block: "center" }));
    const mobileLive = await page
      .locator("#coherent-mobile-live")
      .boundingBox();
    assert.ok(
      mobileLive.y >= 40 && mobileLive.y < 150,
      "Mobile live ket remains visible beside the scrolled hardware",
    );
    await page.screenshot({
      path: output + `synchrony-${name}-mobile-hardware.png`,
    });
    await openCircuitEditor(page);
    await page.locator("#next-step").click();
    await page.locator("#circuit-tools > summary").click();
    await scrub(0.55);
    assert.ok(
      await page
        .locator("#coherent-current")
        .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      "The four-term CNOT ket wraps within its phone column",
    );
    await page
      .locator("#coherent-stage")
      .evaluate((e) => e.scrollIntoView({ block: "start" }));
    await page.screenshot({
      path: output + `synchrony-${name}-mobile-cnot.png`,
    });
    const mobileAxe = (await new AxeBuilder({ page }).analyze()).violations;
    assert.deepEqual(
      mobileAxe.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
    );
    assert.deepEqual(errors, []);
    results.push({
      browser: name,
      version: browser.version(),
      sharedClockChecks: 10,
      movingFraction: moving.fraction,
      desktopAxe,
      mobileAxe,
      errors,
    });
    console.log(
      `${name}: synchronized gate, ket, Bloch, waveform, hardware, mobile, and accessibility checks pass`,
    );
  } finally {
    await browser.close();
  }
}
await writeFile(
  output + "synchrony-results.json",
  JSON.stringify(results, null, 2),
);
