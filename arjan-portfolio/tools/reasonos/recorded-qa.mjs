import { chromium, webkit, firefox } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile, access } from "node:fs/promises";
import { homedir } from "node:os";
const base = process.env.REASONOS_BASE_URL || "http://127.0.0.1:8870";
const out = "Documentation/Validation/ReasonOS";
await mkdir(out, { recursive: true });
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
    const errors = [],
      warnings = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") warnings.push(m.text());
    });
    await page.goto(`${base}/work/vector-ekg-reasonos`);
    if (await page.locator(".rosx-study-details").getAttribute("open") === null) await page.locator(".rosx-study-details > summary").click();
    await page.locator("#heart-leads > summary").click();
    await page.locator("#ecg-connections .katex:visible").first().waitFor();
    await page.locator("#measurement-workbench > summary").click();
    const root = page.locator("#recorded-ecg");
    await root.getByRole("tab", { name: "Calculations", exact: true }).click();
    await root.locator("[data-calculation-basis] .katex").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.locator("#model-explanation").getAttribute("open"),
      null,
    );
    assert.equal(await root.getAttribute("data-recording"), "A");
    assert.equal(
      await root.locator("svg image").getAttribute("href"),
      "/images/reasonos/asp-001-recording-a.webp",
    );
    assert.equal(await root.locator("polyline").count(), 0);
    const image = await page.request.get(
      `${base}${await root.locator("svg image").getAttribute("href")}`,
    );
    assert.equal(
      createHash("sha256")
        .update(await image.body())
        .digest("hex"),
      await root.getAttribute("data-source-sha"),
    );
    await page.screenshot({ path: `${out}/${name}-recorded-desktop.png` });
    const trace = () =>
      root.locator("pre").evaluate((el) => JSON.parse(el.textContent));
    const fill = async (name, value) =>
      root.getByRole("spinbutton", { name, exact: true }).fill(String(value));
    await root
      .getByRole("button", { name: "Record this calculation", exact: true })
      .click();
    const reportTrace = await trace();
    assert.ok(reportTrace.trace.every((event) => event.accepted));
    assert.ok(
      reportTrace.journal.entries.some(
        (entry) =>
          entry.event.type === "transformation.attempted" &&
          entry.event.outputState.provenance.witnessType === "machine-derived",
      ),
    );
    const details = root
      .locator("summary")
      .filter({ hasText: "Calibrate the grid and record" })
      .locator("..");
    await details.locator(":scope > summary").click();
    await root
      .getByRole("button", { name: "Record image measurement", exact: true })
      .click();
    assert.equal((await trace()).trace.at(-1).accepted, false);
    for (const [name, value] of [
      ["Grid 1 x", 100],
      ["Grid 1 y", 100],
      ["Grid 2 x", 300],
      ["Grid 2 y", 100],
      ["Marker 1 x", 200],
      ["Marker 1 y", 1100],
      ["Marker 2 x", 360],
      ["Marker 2 y", 1100],
    ])
      await fill(name, value);
    await root
      .getByRole("button", {
        name: "Confirm grid span and record calibration",
        exact: true,
      })
      .click();
    assert.equal((await trace()).trace.at(-1).accepted, true);
    assert.equal(
      Number(
        await root
          .locator("[data-measured-duration]")
          .getAttribute("data-measured-duration"),
      ),
      800,
    );
    await root
      .getByRole("button", { name: "Record image measurement", exact: true })
      .click();
    assert.equal((await trace()).trace.at(-1).accepted, true);
    let events = (await trace()).journal.entries;
    const measurement = events.at(-1).event.outputState;
    assert.equal(measurement.payload.duration, 800);
    assert.equal(measurement.provenance.modelVersion, null);
    assert.deepEqual(measurement.payload.rawOperation, {
      a: { x: 200, y: 1100 },
      b: { x: 360, y: 1100 },
    });
    await fill("Marker 2 x", 280);
    await root
      .getByRole("combobox", { name: "Recorded interval kind", exact: true })
      .selectOption("QT");
    await root
      .getByRole("button", { name: "Record image measurement", exact: true })
      .click();
    await root
      .getByRole("checkbox", {
        name: "Use my saved RR and QT measurements",
        exact: true,
      })
      .check();
    assert.equal(
      await root
        .locator("[data-calculation-basis]")
        .getAttribute("data-calculation-basis"),
      "image-calipers",
    );
    assert.match(
      await root.locator("[data-calculation-basis]").textContent(),
      /447\.2/,
    );
    await root
      .getByRole("button", { name: "Record this calculation", exact: true })
      .click();
    assert.equal((await trace()).trace.at(-1).inputStateIds.length, 2);
    const history = root
      .locator("summary")
      .filter({ hasText: "Recorded evidence and calculation trace" })
      .locator("..");
    await history.locator(":scope > summary").click();
    await root
      .getByRole("button", { name: "Verify recorded trace", exact: true })
      .click();
    assert.match(
      await root.locator("p[role=status]").textContent(),
      /replay verified/,
    );
    await fill("Known grid span in millimetres", 50);
    assert.equal(await root.locator("[data-measured-duration]").count(), 0);
    assert.equal(
      await root
        .locator("[data-calculation-basis]")
        .getAttribute("data-calculation-basis"),
      "device-report",
    );
    await root
      .getByRole("button", { name: "Record image measurement", exact: true })
      .click();
    assert.equal((await trace()).trace.at(-1).accepted, false);
    await root
      .getByRole("button", { name: "Recording B", exact: true })
      .click();
    assert.equal(await root.getAttribute("data-recording"), "B");
    assert.match(
      await root.locator("[data-calculation-basis]").textContent(),
      /740\.7/,
    );
    await root
      .getByRole("slider", { name: "ECG image zoom", exact: true })
      .fill("3");
    const svg = root.getByRole("img", { name: /Actual recording B/ });
    await svg.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      scrollTo({
        top: scrollY + rect.top - (innerHeight - rect.height) / 2,
        behavior: "instant",
      });
    });
    const start = Number(
      await root
        .getByRole("spinbutton", { name: "Marker 1 x", exact: true })
        .inputValue(),
    );
    const drag = await svg.evaluate((svg) => {
      const p = svg.createSVGPoint();
      const c = svg.querySelector("[data-image-marker=m0] circle");
      p.x = Number(c.getAttribute("cx"));
      p.y = Number(c.getAttribute("cy"));
      const matrix = svg.getScreenCTM();
      const target = p.matrixTransform(matrix);
      return {
        x: target.x,
        y: target.y,
        endX: target.x + 12 * matrix.a,
        endY: target.y + 12 * matrix.b,
        tolerance: 1 / matrix.a + 0.2,
      };
    });
    assert.ok(drag.y > 72 && drag.y < 1000);
    await page.mouse.move(drag.x, drag.y);
    await page.mouse.down();
    await page.mouse.move(drag.endX, drag.endY, { steps: 5 });
    await page.mouse.up();
    const moved = Number(
      await root
        .getByRole("spinbutton", { name: "Marker 1 x", exact: true })
        .inputValue(),
    );
    assert.ok(Math.abs(moved - start - 12) < drag.tolerance);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      Number(
        await root
          .getByRole("spinbutton", { name: "Marker 1 x", exact: true })
          .inputValue(),
      ),
      moved,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    const axe = (
      await new AxeBuilder({ page }).include("#recorded-ecg").analyze()
    ).violations;
    assert.deepEqual(
      axe.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
    );
    await details.locator(":scope > summary").click();
    await history.locator(":scope > summary").click();
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${out}/${name}-recorded-mobile.png` });
    assert.deepEqual(errors, []);
    assert.deepEqual(
      warnings.filter((w) => /hydrat|didn.t match/i.test(w)),
      [],
    );
    results.push({
      browser: name,
      defaultSource: "actual ECG image",
      imageDigest: "matched",
      rawPixelMeasurement: "verified",
      gridCalibration: "verified",
      manualQTcInputs: "verified",
      staleCalibration: "rejected",
      sourceSwitch: "verified",
      dragAndResize: "verified",
      replay: "verified",
      axe,
      errors,
    });
    console.log(
      `${name}: actual image, image digest, pixel calibration, raw measurement, manual QTc inputs, source changes, replay and accessibility passed`,
    );
  } finally {
    await browser.close();
  }
}
await writeFile(
  `${out}/recorded-browser-results.json`,
  JSON.stringify(results, null, 2) + "\n",
);
