import { chromium, firefox, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
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
    await page.locator("#ecg-connections .katex").first().waitFor();
    await page.locator("#model-explanation > summary").click();
    const lab = page.locator("#reasonos-lab");
    await page.waitForSelector("#reasonos-lab .katex");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${out}/${name}-opening-desktop.png` });
    const scrollStage = async () => {
      await lab.evaluate((e) =>
        e.scrollIntoView({ block: "start", behavior: "instant" }),
      );
      await page.waitForTimeout(150);
    };
    const range = async (label, value) => {
      await page
        .getByRole("slider", { name: label, exact: true })
        .evaluate((el, value) => {
          Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value",
          ).set.call(el, value);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }, String(value));
    };
    const trace = () =>
      lab.locator("pre").evaluate((e) => JSON.parse(e.textContent));
    assert.equal(
      await lab.locator("#reasonos-measurement").getAttribute("open"),
      null,
      "The opening focuses on the signal, with measurement as the next step",
    );
    for (const [name, sign, direction] of [
      ["Toward the lead", 1, "toward"],
      ["Across the lead", 0, "across"],
      ["Away from the lead", -1, "away"],
    ]) {
      await lab.getByRole("button", { name, exact: true }).click();
      const voltage = Number(await lab.getAttribute("data-voltage"));
      const sampleY = Number(
        await lab.locator("[data-ecg-sample]").getAttribute("cy"),
      );
      assert.ok(
        sampleY >= 10 && sampleY <= 330,
        "Every direction example stays within the visible plot",
      );
      assert.ok(sign === 0 ? Math.abs(voltage) < 1e-10 : voltage * sign > 0.9);
      assert.equal(
        await lab.locator("[data-projection]").getAttribute("data-projection"),
        direction,
      );
    }
    const leadDetail = lab
      .locator("summary")
      .filter({ hasText: "Change lead or inspect the vector calculation" })
      .locator("..");
    await leadDetail.locator(":scope > summary").click();
    let synchronizedChecks = 0;
    for (const time of [0, 80, 235, 270, 530]) {
      await range("Shared ECG time", time);
      for (const lead of ["I", "II", "III", "aVR", "aVL", "aVF"]) {
        await lab.getByRole("button", { name: lead, exact: true }).click();
        const state = await lab.evaluate((root) => {
          const vector = JSON.parse(
            root.querySelector("[data-vector]").dataset.vector,
          );
          const dot = root.querySelector("[data-ecg-sample]");
          return {
            vector,
            lead: root.dataset.lead,
            volts: Number(root.dataset.voltage),
            time: Number(root.dataset.time),
            x: Number(dot.getAttribute("cx")),
            y: Number(dot.getAttribute("cy")),
            speed: Number(root.dataset.speed),
          };
        });
        const [x, y] = state.vector,
          r3 = Math.sqrt(3),
          ra = -x / 2 - y / (2 * r3),
          la = x / 2 - y / (2 * r3),
          ll = y / r3;
        const expected = {
          I: la - ra,
          II: ll - ra,
          III: ll - la,
          aVR: ra - (la + ll) / 2,
          aVL: la - (ra + ll) / 2,
          aVF: ll - (ra + la) / 2,
        }[lead];
        assert.equal(state.time, time);
        assert.ok(Math.abs(state.volts - expected) < 2e-12);
        assert.ok(
          Math.abs(state.x - (65 + (time * state.speed * 12) / 1000)) < 1e-6,
        );
        assert.ok(Math.abs(state.y - (180 - expected * 10 * 12)) < 1e-6);
        synchronizedChecks++;
      }
    }
    await lab.getByRole("button", { name: "II", exact: true }).click();
    await range("Shared ECG time", 235);
    await leadDetail.locator(":scope > summary").click();
    await scrollStage();
    await page.screenshot({ path: `${out}/${name}-synchronized-stage.png` });
    await lab.locator("#reasonos-measurement > summary").click();
    await lab
      .getByRole("button", { name: "Record QRS measurement", exact: true })
      .click();
    assert.equal(
      (await trace()).at(-1).accepted,
      false,
      "An uncalibrated measurement is rejected",
    );
    await lab
      .getByRole("button", { name: "Record calibration", exact: true })
      .click();
    await lab
      .getByRole("button", { name: "Record QRS measurement", exact: true })
      .click();
    assert.equal((await trace()).at(-1).accepted, true);
    await lab
      .getByRole("button", { name: "Evaluate claim", exact: true })
      .click();
    assert.equal((await trace()).at(-1).accepted, true);
    await lab
      .getByRole("button", { name: "Verify replay", exact: true })
      .click();
    assert.match(
      await lab.locator('p[role="status"]').textContent(),
      /Replay verified/,
    );
    const settings = lab
      .locator("summary")
      .filter({ hasText: "Source parameters, paper calibration" })
      .locator("..");
    await settings.locator(":scope > summary").click();
    await page
      .getByRole("combobox", { name: "Paper speed", exact: true })
      .selectOption("50");
    assert.equal(
      await lab.locator("[data-interval]").getAttribute("data-interval"),
      "90",
    );
    await lab
      .getByRole("button", { name: "Evaluate claim", exact: true })
      .click();
    assert.equal(
      (await trace()).at(-1).accepted,
      false,
      "Changing the source scale makes old evidence stale",
    );
    await range("QRS duration", 119);
    await lab
      .getByRole("button", { name: "Record calibration", exact: true })
      .click();
    await lab
      .getByRole("button", { name: "Record QRS measurement", exact: true })
      .click();
    await lab
      .getByRole("button", { name: "Evaluate claim", exact: true })
      .click();
    assert.equal(
      (await trace()).at(-1).accepted,
      false,
      "119 plus its bound crosses the cutoff",
    );
    await range("Uncertainty per endpoint", 0);
    await lab
      .getByRole("button", { name: "Record QRS measurement", exact: true })
      .click();
    await lab
      .getByRole("button", { name: "Evaluate claim", exact: true })
      .click();
    assert.equal((await trace()).at(-1).accepted, true);
    const integrity = lab
      .locator("summary")
      .filter({ hasText: "Structured trace and replay integrity" })
      .locator("..");
    await integrity.locator(":scope > summary").click();
    const before = (await trace()).length;
    await lab
      .getByRole("button", { name: "Verify an altered copy", exact: true })
      .click();
    assert.match(
      await lab.locator('p[role="status"]').textContent(),
      /Altered copy rejected/,
    );
    assert.equal((await trace()).length, before);
    await lab
      .getByRole("button", { name: "Record revision", exact: true })
      .click();
    assert.equal((await trace()).at(-1).accepted, true);
    const downloadPromise = page.waitForEvent("download");
    await lab.getByRole("button", { name: "Export JSON", exact: true }).click();
    const download = await downloadPromise;
    const file = `/tmp/reasonos-${name}-export.json`;
    await download.saveAs(file);
    const exported = JSON.parse(await readFile(file, "utf8"));
    assert.equal(exported.snapshot.trace.length, before + 1);
    assert.ok(
      exported.snapshot.journal.entries.every(
        (entry) => entry.eventHash.length === 64,
      ),
    );
    const derivation = lab
      .locator("summary")
      .filter({ hasText: "Full derivations: six leads" })
      .locator("..");
    await derivation.locator(":scope > summary").click();
    await page
      .getByRole("checkbox", { name: "Integrated axis angle", exact: true })
      .check();
    assert.equal(
      await lab
        .locator('[data-path-id="vector-angle-method"]')
        .getAttribute("data-score"),
      "1",
    );
    await page
      .getByRole("checkbox", { name: "Integrated axis angle", exact: true })
      .uncheck();
    await page
      .getByRole("checkbox", { name: "Lead I polarity", exact: true })
      .check();
    await page
      .getByRole("checkbox", { name: "aVF polarity", exact: true })
      .check();
    assert.equal(
      await lab
        .locator('[data-path-id="quadrant-method"]')
        .getAttribute("data-score"),
      "1",
    );
    const desktopAxe = (
      await new AxeBuilder({ page }).include("#reasonos-lab").analyze()
    ).violations;
    assert.deepEqual(
      desktopAxe.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
    for (const detail of [settings, integrity, derivation])
      await detail.locator(":scope > summary").click();
    await page.setViewportSize({ width: 390, height: 844 });
    await scrollStage();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({ path: `${out}/${name}-mobile-stage.png` });
    const mobileAxe = (
      await new AxeBuilder({ page }).include("#reasonos-lab").analyze()
    ).violations;
    assert.deepEqual(
      mobileAxe.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
    );
    await page
      .getByRole("spinbutton", { name: "Caliper 1 / ms", exact: true })
      .fill("200");
    await page
      .getByRole("spinbutton", { name: "Caliper 2 / ms", exact: true })
      .fill("319");
    const strip = lab.getByRole("img", { name: /^Synthetic lead/ });
    await strip.evaluate((svg) =>
      svg.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await page.waitForTimeout(150);
    // Wait for the caliper to settle after focus-driven scrolling.
    await strip.locator('[data-endpoint="1"]').hover();
    const drag = await strip.evaluate((svg) => {
      const matrix = svg.getScreenCTM();
      const point = svg.createSVGPoint();
      point.y = 170;
      point.x = 65 + 319 * 0.6;
      const start = point.matrixTransform(matrix);
      point.x = 65 + 349 * 0.6;
      const end = point.matrixTransform(matrix);
      return {
        x: start.x,
        y: start.y,
        end: end.x,
        onePixelMs: 1 / (matrix.a * 0.6),
      };
    });
    await page.mouse.down();
    await page.mouse.move(drag.end, drag.y, { steps: 4 });
    await page.mouse.up();
    const draggedTime = Number(
      await page
        .getByRole("spinbutton", { name: "Caliper 2 / ms", exact: true })
        .inputValue(),
    );
    assert.ok(
      Math.abs(draggedTime - 349) <= drag.onePixelMs + 0.1,
      `Dragged endpoint: ${draggedTime}; expected 349 within one screen pixel`,
    );
    const draggedInterval = await lab
      .locator("[data-interval]")
      .getAttribute("data-interval");
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(
      await lab.locator("[data-interval]").getAttribute("data-interval"),
      draggedInterval,
    );
    const previousTime = Number(await lab.getAttribute("data-time"));
    await lab.getByRole("button", { name: "Next phase", exact: true }).click();
    assert.notEqual(Number(await lab.getAttribute("data-time")), previousTime);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await range("Shared ECG time", 235);
    await lab.getByRole("button", { name: "Play cycle", exact: true }).click();
    await page.waitForTimeout(600);
    await lab.getByRole("button", { name: "Pause", exact: true }).click();
    const paused = Number(await lab.getAttribute("data-time"));
    assert.ok(paused > 235, "Playback advances the shared time");
    await page.waitForTimeout(100);
    assert.equal(Number(await lab.getAttribute("data-time")), paused);
    const phone = await context.newPage();
    await phone.setViewportSize({ width: 390, height: 844 });
    await phone.goto(`${base}/work/vector-ekg-reasonos`);
    if (await phone.locator(".rosx-study-details").getAttribute("open") === null) await phone.locator(".rosx-study-details > summary").click();
    await phone.locator("#model-explanation > summary").click();
    await phone.waitForSelector("#reasonos-lab .katex");
    await phone
      .locator("#reasonos-lab")
      .evaluate((el) =>
        el.scrollIntoView({ block: "start", behavior: "instant" }),
      );
    await phone.evaluate(() => document.fonts.ready);
    const firstPoint = await phone.locator("[data-ecg-sample]").boundingBox();
    assert.ok(
      firstPoint &&
        firstPoint.y >= 0 &&
        firstPoint.y + firstPoint.height <= 844,
      "The opening phone viewport includes the live ECG point",
    );
    await phone.screenshot({ path: `${out}/${name}-opening-mobile.png` });
    await phone.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(
      warnings.filter((message) => /hydrat|didn.t match/i.test(message)),
      [],
    );
    results.push({
      browser: name,
      synchronizedChecks,
      guidedProjectionCases: "passed",
      calibration: "passed",
      staleEvidence: "rejected",
      boundedClaim: "passed",
      replay: "passed",
      alteredCopy: "rejected",
      alternativePaths: "passed",
      export: "passed",
      mobileCaliperDragAndResize: "passed",
      playbackAndReducedMotion: "passed",
      desktopAxe,
      mobileAxe,
      errors,
    });
    console.log(
      `${name}: synchronized leads, calibrated measurement, source changes, uncertainty, trace replay, alternatives, export and accessibility passed`,
    );
  } finally {
    await browser.close();
  }
}
await writeFile(
  `${out}/browser-results.json`,
  JSON.stringify(results, null, 2),
);
