import { chromium, webkit, firefox } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
const base = process.env.REASONOS_BASE_URL || "http://127.0.0.1:8870";
const out = "Documentation/Validation/ReasonOS";
await mkdir(out, { recursive: true });
const results = [];
const close = (a, b, tolerance = 1e-8) =>
  assert.ok(Math.abs(a - b) < tolerance, a + " != " + b);
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
      launch.executablePath =
        homedir() +
        "/Library/Caches/ms-playwright/firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox";
    }
  }
  const browser = await engine.launch(launch);
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(base + "/work/vector-ekg-reasonos#ecg-connections");
    const root = page.locator("#ecg-connections");
    if (!(await root.isVisible())) await page.locator("#heart-leads > summary").click();
    await root.locator("[data-digital-handle=vector]").waitFor();
    await root.locator(".katex").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    close(Number(await root.getAttribute("data-sideways")), -0.45);
    assert.equal(
      await root.locator("[data-projection-right-angle]").count(),
      1,
    );
    assert.match(
      await root
        .getByRole("math", { name: /Lead coefficients/ })
        .getAttribute("data-tex"),
      /underbrace/,
    );
    assert.equal(await root.locator("image").first().isVisible(), false);
    const response = await page.request.get(
        base + "/ecg-digitized/recording-b.json",
      ),
      bytes = await response.body(),
      data = JSON.parse(bytes);
    const get = async (key) => Number(await root.getAttribute("data-" + key));
    const set = async (label, value) =>
      root
        .getByRole("slider", { name: label, exact: true })
        .fill(String(value));
    for (const record of data.records) {
      await root
        .getByRole("button", { name: record.lead, exact: true })
        .click();
      assert.equal(await root.getAttribute("data-digital-lead"), record.lead);
      for (const t of [10, 230, 500]) {
        await set("Digital ECG time", t);
        const i = record.points.findIndex((p) => p[0] >= t),
          a = record.points[i - 1],
          b = record.points[i];
        const expected = a[1] + ((t - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
        close(await get("digital-voltage"), expected);
        close(await get("digital-time"), t);
        if (!record.lead.startsWith("V")) {
          for (const q of [-0.65, 0.8]) {
            await set("Unobserved perpendicular vector component", q);
            const x = await get("vector-x"),
              y = await get("vector-y");
            const ra = -x / 2 - y / (2 * Math.sqrt(3)),
              la = x / 2 - y / (2 * Math.sqrt(3)),
              ll = y / Math.sqrt(3);
            const potentials = {
              I: la - ra,
              II: ll - ra,
              III: ll - la,
              aVR: ra - (la + ll) / 2,
              aVL: la - (ra + ll) / 2,
              aVF: ll - (ra + la) / 2,
            };
            close(potentials[record.lead], expected);
            close(await get("digital-voltage"), expected);
          }
        } else {
          assert.equal(
            await root.locator("[data-digital-handle=vector]").count(),
            0,
          );
          assert.match(await root.textContent(), /Wilson|WCT/);
        }
      }
    }
    await root.getByRole("button", { name: "II", exact: true }).click();
    const rec = data.records.find((r) => r.lead === "II");
    const expectedIntervals = {
      PR: [rec.landmarksMs.pStart, 0],
      QRS: [0, rec.landmarksMs.qrsEnd],
      QT: [0, rec.landmarksMs.tEnd],
      RR: [rec.landmarksMs.qrsPeak, rec.landmarksMs.nextQrsPeak],
    };
    for (const [kind, expected] of Object.entries(expectedIntervals)) {
      await root
        .getByRole("button", { name: kind, exact: true })
        .last()
        .click();
      for (let i = 0; i < 2; i++)
        close(
          Number(
            await root
              .getByRole("spinbutton", {
                name: "Digital time marker " + (i + 1),
              })
              .inputValue(),
          ),
          expected[i],
          0.051,
        );
    }
    await root.getByRole("button", { name: "QRS", exact: true }).last().click();
    await root
      .getByRole("button", { name: "QRS", exact: true })
      .first()
      .click();
    const svg = root.getByRole("img", { name: /^Digital lead/ });
    const drag = async (selector, dx, dy) => {
      await svg.evaluate((el) => {
        const r = el.getBoundingClientRect();
        scrollTo({
          top: scrollY + r.top - (innerHeight - r.height) / 2,
          behavior: "instant",
        });
      });
      const p = await root.locator(selector).evaluate((el) => {
        const circle = el.querySelector("circle"),
          point = circle.ownerSVGElement.createSVGPoint();
        point.x = Number(circle.getAttribute("cx"));
        point.y = Number(circle.getAttribute("cy"));
        const s = point.matrixTransform(circle.getScreenCTM());
        return { x: s.x + 2, y: s.y };
      });
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      await page.mouse.move(p.x + dx, p.y + dy, { steps: 6 });
      await page.mouse.up();
    };
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.waitForFunction(
        (w) =>
          document
            .querySelector("#ecg-connections svg[data-compact]")
            .getAttribute("data-compact") === String(w <= 850),
        width,
      );
      await root
        .getByRole("button", { name: "Align with lead", exact: true })
        .click();
      const voltage = await get("digital-voltage");
      await drag("[data-digital-handle=vector]", 25, -15);
      assert.ok(Math.abs(await get("sideways")) > 0.1);
      close(await get("digital-voltage"), voltage);
      const marker = root.getByRole("spinbutton", {
          name: "Digital time marker 2",
        }),
        before = Number(await marker.inputValue());
      await drag("[data-digital-handle='1']", 12, 0);
      assert.ok(Number(await marker.inputValue()) > before + 5);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
      await root.screenshot({
        path: out + "/" + name + "-digital-" + width + ".png",
        style:
          ".site-header,.skip-link,nextjs-portal{visibility:hidden!important}",
      });
    }
    await root
      .getByRole("spinbutton", { name: "Digital time marker 2" })
      .fill("120");
    assert.match(
      await root
        .getByRole("math", { name: /marked QRS interval/ })
        .getAttribute("data-tex"),
      /120/,
    );
    const violations = (
      await new AxeBuilder({ page }).include("#ecg-connections").analyze()
    ).violations;
    assert.deepEqual(violations, []);
    await root.getByRole("button", { name: "Play the beat" }).click();
    const start = await get("digital-time");
    await page.waitForTimeout(200);
    await root.getByRole("button", { name: "Pause", exact: true }).click();
    assert.notEqual(await get("digital-time"), start);
    await page.locator("#source-provenance > summary").click();
    const audit = root.getByRole("img", {
      name: /centreline over the original/,
    });
    const raw = await audit.locator("polyline").getAttribute("points");
    assert.equal(raw, rec.points.map((p) => p[2] + "," + p[3]).join(" "));
    const source = await page.request.get(base + data.sourceImage);
    assert.equal(
      createHash("sha256")
        .update(await source.body())
        .digest("hex"),
      data.sourceSHA256,
    );
    assert.deepEqual(errors, []);
    results.push({
      browser: name,
      leads: 12,
      independentlyInterpolatedValues: 36,
      independentElectrodeProjections: 36,
      pointerLayouts: [1440, 390],
      sourceOverlay: "exact source coordinates",
      accessibleScene: "no axe violations",
      runtimeErrors: errors,
      datasetSHA256: createHash("sha256").update(bytes).digest("hex"),
    });
    console.log(name + ": digital scene passed");
  } finally {
    await browser.close();
  }
}
await writeFile(
  out + "/digital-browser-results.json",
  JSON.stringify(results, null, 2) + "\n",
);
