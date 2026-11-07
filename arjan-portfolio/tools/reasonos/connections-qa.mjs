import { chromium, webkit, firefox } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
    const page = await context.newPage(),
      errors = [],
      consoleErrors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    await page.goto(`${base}/work/vector-ekg-reasonos`);
    if (await page.locator(".rosx-study-details").getAttribute("open") === null) await page.locator(".rosx-study-details > summary").click();
    await page.locator("[data-digital-handle=vector]").waitFor();
    await page.locator("#source-provenance > summary").click();
    await page.locator("#photo-evidence > summary").click();
    const root = page.locator("#photo-ecg-connections");
    await root.locator(".katex").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.locator("#measurement-workbench").getAttribute("open"),
      null,
    );
    assert.equal(await root.getAttribute("data-recording"), "B");
    await page.screenshot({ path: `${out}/${name}-connected-opening.png` });
    await root.screenshot({
      path: `${out}/${name}-connected-scene.png`,
      style: ".site-header,.skip-link{visibility:hidden!important}",
    });
    for (const [id, axes] of [
      ["A", [-3, 39, 53]],
      ["B", [12, 40, 55]],
    ]) {
      await root
        .getByRole("button", { name: `Source ${id}`, exact: true })
        .click();
      const image = root.getByRole("img", { name: /^Unchanged recorded lead/ });
      const href = await image.locator("image").getAttribute("href");
      assert.equal(
        createHash("sha256")
          .update(await (await page.request.get(`${base}${href}`)).body())
          .digest("hex"),
        await root.getAttribute("data-source-sha"),
      );
      for (const [i, phase] of ["P wave", "QRS", "T wave"].entries()) {
        await root.getByRole("button", { name: phase, exact: true }).click();
        const x = Math.cos((axes[i] * Math.PI) / 180),
          y = Math.sin((axes[i] * Math.PI) / 180);
        const ra = -x / 2 - y / (2 * Math.sqrt(3)),
          la = x / 2 - y / (2 * Math.sqrt(3)),
          ll = y / Math.sqrt(3);
        const expected = {
          I: la - ra,
          II: ll - ra,
          III: ll - la,
          aVR: ra - (la + ll) / 2,
          aVL: la - (ra + ll) / 2,
          aVF: ll - (ra + la) / 2,
        };
        for (const [lead, value] of Object.entries(expected)) {
          await root.getByRole("button", { name: lead, exact: true }).click();
          assert.equal(await root.getAttribute("data-lead"), lead);
          assert.ok(
            Math.abs(
              Number(
                await root
                  .locator("[data-axis-projection]")
                  .getAttribute("data-axis-projection"),
              ) - value,
            ) < 0.00000051,
          );
          assert.equal(await image.locator("image").getAttribute("href"), href);
          assert.equal(await root.locator("polyline").count(), 0);
        }
      }
    }
    await root.getByRole("button", { name: "PR segment", exact: true }).click();
    assert.equal(await root.locator("[data-axis-projection]").count(), 0);
    await root.getByRole("button", { name: "QRS", exact: true }).click();
    for (const lead of ["V1", "V2", "V3", "V4", "V5", "V6"]) {
      await root.getByRole("button", { name: lead, exact: true }).click();
      assert.equal(await root.locator("[data-axis-projection]").count(), 0);
      await root
        .getByRole("img", {
          name: `Unchanged recorded lead ${lead} from recording B`,
        })
        .waitFor();
      assert.match(await root.textContent(), /Wilson central terminal/);
    }
    await root.getByRole("button", { name: "II", exact: true }).click();
    for (const kind of ["PR", "QT", "RR", "QRS"]) {
      await root
        .getByRole("button", { name: `Measure ${kind}`, exact: true })
        .click();
      const raw = await root.evaluate((el, kind) => {
        const get = (name) =>
          Number(el.querySelector(`[aria-label="${name}"]`).value);
        return {
          a: {
            x: get(`Connected ${kind} 1 x`),
            y: get(`Connected ${kind} 1 y`),
          },
          b: {
            x: get(`Connected ${kind} 2 x`),
            y: get(`Connected ${kind} 2 y`),
          },
          ga: { x: get("Connected grid 1 x"), y: get("Connected grid 1 y") },
          gb: { x: get("Connected grid 2 x"), y: get("Connected grid 2 y") },
          mm: get("Connected grid span"),
        };
      }, kind);
      const dx = raw.gb.x - raw.ga.x,
        dy = raw.gb.y - raw.ga.y;
      const duration =
        (((Math.abs((raw.b.x - raw.a.x) * dx + (raw.b.y - raw.a.y) * dy) /
          (dx * dx + dy * dy)) *
          raw.mm) /
          25) *
        1000;
      assert.ok(
        Math.abs(
          Number(
            await root
              .locator("[data-connected-duration]")
              .getAttribute("data-connected-duration"),
          ) - duration,
        ) < 1e-8,
      );
      if (kind === "RR")
        await root
          .getByRole("math", { name: /One measured RR interval/ })
          .waitFor();
    }
    await root
      .getByRole("button", { name: "Record source measurement", exact: true })
      .click();
    const trace = () =>
      root
        .locator("[data-connected-trace]")
        .evaluate((el) => JSON.parse(el.textContent));
    assert.equal((await trace()).trace.at(-1).accepted, false);
    await root
      .getByRole("checkbox", {
        name: "I checked the grid span and QRS boundaries.",
      })
      .check();
    await root
      .getByRole("button", { name: "Record source measurement", exact: true })
      .click();
    assert.equal((await trace()).trace.at(-1).accepted, true);
    await root
      .getByRole("button", { name: "Test QRS < 120 ms", exact: true })
      .click();
    assert.equal((await trace()).trace.at(-1).accepted, true);
    await root
      .getByRole("button", { name: "Test “ECG is normal”", exact: true })
      .click();
    assert.equal((await trace()).trace.at(-1).accepted, false);
    assert.match(
      await root.getByRole("status").textContent(),
      /QRS-duration rule/,
    );
    await root.getByText(/ReasonOS evidence ·/).click();
    await root
      .getByRole("button", { name: "Verify source trace", exact: true })
      .click();
    assert.match(
      await root.getByRole("status").textContent(),
      /Replay verified/,
    );
    const details = root
      .locator("summary")
      .filter({ hasText: "Source coordinates, ruler and placement bound" });
    await details.click();
    const fill = (label, value) =>
      root
        .getByRole("spinbutton", { name: label, exact: true })
        .fill(String(value));
    await fill("Connected QRS 2 x", 300);
    await root
      .getByRole("button", { name: "Test QRS < 120 ms", exact: true })
      .click();
    assert.equal((await trace()).trace.at(-1).accepted, false);
    await root
      .getByRole("checkbox", {
        name: "I checked the grid span and QRS boundaries.",
      })
      .check();
    await root
      .getByRole("button", { name: "Record source measurement", exact: true })
      .click();
    assert.equal((await trace()).trace.at(-1).accepted, true);
    await root
      .getByRole("button", { name: "Test QRS < 120 ms", exact: true })
      .click();
    assert.equal((await trace()).trace.at(-1).accepted, false);
    await root.getByRole("button", { name: "Source A", exact: true }).click();
    await root
      .getByRole("button", { name: "Test QRS < 120 ms", exact: true })
      .click();
    assert.equal((await trace()).trace.at(-1).accepted, false);
    const beat = root.getByRole("img", {
      name: /^Source beat from recording A/,
    });
    await beat.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      scrollTo({
        top: scrollY + rect.top - (innerHeight - rect.height) / 2,
        behavior: "instant",
      });
    });
    const before = Number(
      await root
        .getByRole("spinbutton", { name: "Connected QRS 1 x", exact: true })
        .inputValue(),
    );
    const beforeY = Number(
      await root
        .getByRole("spinbutton", { name: "Connected QRS 1 y", exact: true })
        .inputValue(),
    );
    const target = await beat.evaluate((svg) => {
      const c = svg.querySelector('[data-source-handle="0"] circle'),
        p = svg.createSVGPoint();
      p.x = Number(c.getAttribute("cx"));
      p.y = Number(c.getAttribute("cy"));
      const matrix = svg.getScreenCTM(),
        point = p.matrixTransform(matrix);
      return {
        x: point.x,
        y: point.y,
        endX: point.x + 3 * matrix.a,
        endY: point.y + 3 * matrix.b,
        tolerance: 1 / matrix.a + 0.2,
      };
    });
    assert.ok(target.y > 72 && target.y < 1000);
    await page.mouse.move(target.x, target.y);
    await page.mouse.down();
    await page.mouse.move(target.endX, target.endY, { steps: 5 });
    await page.mouse.up();
    const after = Number(
      await root
        .getByRole("spinbutton", { name: "Connected QRS 1 x", exact: true })
        .inputValue(),
    );
    assert.ok(Math.abs(after - before - 3) < target.tolerance);
    assert.ok(
      Math.abs(
        Number(
          await root
            .getByRole("spinbutton", { name: "Connected QRS 1 y", exact: true })
            .inputValue(),
        ) - beforeY,
      ) < target.tolerance,
    );
    const download = page.waitForEvent("download");
    await root
      .getByRole("button", { name: "Export connected evidence", exact: true })
      .click();
    const evidence = JSON.parse(
      await readFile(await (await download).path(), "utf8"),
    );
    assert.equal(evidence.recording.id, "A");
    assert.ok(evidence.trace.some((e) => !e.accepted));
    assert.ok(evidence.trace.every((e) => e.provenance.modelVersion === null));
    await root
      .getByRole("button", { name: "Scan source beat", exact: true })
      .click();
    await root
      .getByRole("button", { name: "Pause scan", exact: true })
      .waitFor();
    await page.waitForTimeout(180);
    await root.getByRole("button", { name: "Pause scan", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.equal(
      Number(
        await root
          .getByRole("spinbutton", { name: "Connected QRS 1 x", exact: true })
          .inputValue(),
      ),
      after,
    );
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: `${out}/${name}-connected-mobile.png` });
    const axe = (
      await new AxeBuilder({ page }).include("#photo-ecg-connections").analyze()
    ).violations;
    assert.deepEqual(
      axe.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(consoleErrors, []);
    results.push({
      browser: name,
      actualSourceDigests: "matched A+B",
      independentLeadCalculations: 36,
      chestVoltagesNotFabricated: true,
      unconfirmedCalibration: "rejected",
      durationClaim: "supported only with current measured evidence",
      normalEcgClaim: "rejected",
      changedAndWideMeasurements: "rejected",
      pointerAndResize: "verified",
      replayAndExport: "verified",
      mobileOverflow: false,
      axe,
      errors,
      consoleErrors,
    });
    console.log(
      `${name}: linked source/axes/leads, 36 independent calculations, actual-pixel calipers, bounded claims, replay, export and accessibility passed`,
    );
  } finally {
    await browser.close();
  }
}
await writeFile(
  `${out}/connections-browser-results.json`,
  JSON.stringify(results, null, 2) + "\n",
);
