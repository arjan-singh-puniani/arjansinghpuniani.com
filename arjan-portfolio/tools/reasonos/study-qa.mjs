import { chromium, webkit, firefox } from "playwright";
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
    const page = await context.newPage(),
      errors = [],
      hydration = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && /hydrat|didn.t match/i.test(m.text()))
        hydration.push(m.text());
    });
    await page.goto(`${base}/work/vector-ekg-reasonos`);
    if (await page.locator(".rosx-study-details").getAttribute("open") === null) await page.locator(".rosx-study-details > summary").click();
    await page.locator("#heart-leads > summary").click();
    await page.locator("#ecg-connections .katex:visible").first().waitFor();
    await page.locator("#measurement-workbench > summary").click();
    const root = page.locator("#recorded-ecg"),
      study = root.locator("#ecg-study");
    await study
      .getByRole("heading", { name: "Establish time before naming the rate" })
      .waitFor();
    assert.equal(
      await root
        .getByRole("tab", { name: "Guided interpretation" })
        .getAttribute("aria-selected"),
      "true",
    );
    assert.equal(
      await root.locator("#ecg-calculations-panel").isVisible(),
      false,
    );
    await root
      .getByRole("tab", { name: "Guided interpretation" })
      .press("ArrowRight");
    assert.equal(
      await root.locator("#ecg-calculations-panel").isVisible(),
      true,
    );
    await root
      .getByRole("tab", { name: "Calculations", exact: true })
      .press("ArrowLeft");
    assert.equal(
      await page.locator("#model-explanation").getAttribute("open"),
      null,
    );
    const commit = study.getByRole("button", {
      name: "Commit answer and compare",
      exact: true,
    });
    assert.equal(await commit.isDisabled(), true);
    await study.getByRole("radio", { name: "200 ms", exact: true }).check();
    await study
      .getByRole("textbox", { name: "ECG study observations" })
      .fill(
        "The printed speed is 25 mm/s. I would repeat RR over adjacent cycles.",
      );
    assert.equal(await commit.isDisabled(), true);
    await study.getByRole("button", { name: "Pin this source view" }).click();
    await study
      .getByRole("slider", { name: "Interpretation confidence" })
      .fill("75");
    await commit.click();
    await study
      .getByRole("status")
      .filter({ hasText: "Method check matched" })
      .waitFor();
    const trace = () =>
      root.locator("pre").evaluate((el) => JSON.parse(el.textContent));
    let state = await trace();
    assert.equal(state.trace.at(-1).accepted, true);
    assert.equal(state.trace.at(-1).operator, "AttachEvidence");
    assert.ok(
      state.trace
        .at(-1)
        .evidenceRefs.some((e) => e.includes('"confidence":75')),
    );
    await study.getByRole("button", { name: "Next step", exact: true }).click();
    await study.getByRole("button", { name: "Pin this source view" }).click();
    await study.getByRole("radio", { name: /^No; inspect P-wave/ }).check();
    await study
      .getByRole("textbox", { name: "ECG study observations" })
      .fill(
        "I need atrial activity and the P–QRS relationship, not RR regularity alone.",
      );
    assert.equal(await commit.isDisabled(), true);
    await study
      .getByRole("button", { name: "Inspect aVR", exact: true })
      .click();
    assert.equal(
      await root
        .getByRole("combobox", { name: "Recorded ECG lead", exact: true })
        .inputValue(),
      "aVR",
    );
    await study.getByRole("button", { name: "Pin this source view" }).click();
    await commit.click();
    await study
      .getByRole("status")
      .filter({ hasText: "Method check matched" })
      .waitFor();
    await study.getByRole("button", { name: /07 Compare/ }).click();
    await study.getByRole("button", { name: "Pin this source view" }).click();
    await root
      .getByRole("button", { name: "Recording B", exact: true })
      .click();
    await study.getByRole("button", { name: "Pin this source view" }).click();
    await study.getByRole("radio", { name: /^No; repeat comparable/ }).check();
    await study
      .getByRole("textbox", { name: "ECG study observations" })
      .fill(
        "A and B have similar repeating complexes. Small printed interval deltas require comparable boundaries.",
      );
    await commit.click();
    await study
      .getByRole("status")
      .filter({ hasText: "Method check matched" })
      .waitFor();
    state = await trace();
    assert.equal(state.trace.at(-1).accepted, true);
    assert.equal(state.trace.at(-1).inputStateIds.length, 2);
    const download = page.waitForEvent("download");
    await study.getByRole("button", { name: "Export worksheet" }).click();
    const worksheet = JSON.parse(
      await readFile(await (await download).path(), "utf8"),
    );
    assert.equal(worksheet.studyAttempts.length, 3);
    assert.deepEqual(
      worksheet.studyAttempts.at(-1).pins.map((p) => p.recordingId),
      ["A", "B"],
    );
    assert.ok(
      worksheet.studyAttempts.every((a) =>
        a.pins.every((p) => p.sha256.length === 64 && p.rect.width > 0),
      ),
    );
    await study.getByRole("button", { name: /01 Scale & rate/ }).click();
    assert.match(
      await study
        .getByRole("textbox", { name: "ECG study observations" })
        .inputValue(),
      /printed speed/,
    );
    await study
      .getByRole("status")
      .filter({ hasText: "Method check matched" })
      .waitFor();
    const reference = page.locator("#ecg-reference-practice");
    await reference
      .getByRole("button", { name: "Focus reference lead I", exact: true })
      .waitFor();
    await reference
      .getByRole("button", { name: "Case 1", exact: true })
      .click();
    assert.equal(
      await reference.locator('svg[role="group"] polyline').count(),
      13,
    );
    assert.equal(await reference.getByText(/Source annotation:/).count(), 0);
    const native1 = reference.getByRole("spinbutton", {
      name: "Native caliper 1",
      exact: true,
    });
    const native2 = reference.getByRole("spinbutton", {
      name: "Native caliper 2",
      exact: true,
    });
    await native1.fill("500");
    await native2.fill("1001");
    assert.match(
      await reference
        .getByRole("img", { name: /Focused recorded lead/ })
        .textContent(),
      /Δt 1002 ms/,
    );
    const focus = reference.getByRole("img", { name: /Focused recorded lead/ });
    await focus.evaluate((el) =>
      el.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await focus.locator('[data-native-caliper="0"]').hover();
    const drag = await focus.evaluate((svg) => {
      const p = svg.createSVGPoint();
      p.x = 157;
      p.y = 30;
      const matrix = svg.getScreenCTM(),
        target = p.matrixTransform(matrix);
      return { x: target.x, y: target.y, tolerance: Math.ceil(5 / matrix.a) };
    });
    await page.mouse.down();
    await page.mouse.move(drag.x, drag.y, { steps: 5 });
    await page.mouse.up();
    assert.ok(
      Math.abs(Number(await native1.inputValue()) - 560) <= drag.tolerance,
    );
    const patterns = [
      /^Sinus pattern/,
      /^Atrial fibrillation/,
      /^Complete right/,
      /^Complete left/,
    ];
    for (let i = 0; i < 4; i++) {
      if (i)
        await reference
          .getByRole("button", { name: `Case ${i + 1}`, exact: true })
          .click();
      await reference
        .getByRole("button", { name: "Focus reference lead I", exact: true })
        .waitFor();
      assert.equal(await reference.getByText(/Source annotation:/).count(), 0);
      await reference.getByRole("radio", { name: patterns[i] }).check();
      await reference
        .getByRole("textbox", { name: "Reference ECG reasoning" })
        .fill(
          "Compare rhythm over ten seconds, QRS width, and right-precordial with lateral morphology.",
        );
      const reveal = reference.getByRole("button", {
        name: "Commit interpretation and reveal annotation",
      });
      assert.equal(await reveal.isDisabled(), true);
      await reference
        .getByRole("button", { name: "Pin reference lead II", exact: true })
        .click();
      await reference
        .getByRole("button", { name: "Focus reference lead V1", exact: true })
        .click();
      await reference
        .getByRole("button", { name: "Pin reference lead V1", exact: true })
        .click();
      await reveal.click();
      await reference
        .getByRole("status")
        .filter({ hasText: "Reference annotation matched" })
        .waitFor();
      const recordPath = reference
        .locator('svg[role="group"] polyline')
        .first();
      assert.equal(
        (await recordPath.getAttribute("points")).split(" ").length,
        1250,
      );
    }
    const refDownload = page.waitForEvent("download");
    await reference
      .getByRole("button", { name: "Export practice attempts" })
      .click();
    const practice = JSON.parse(
      await readFile(await (await refDownload).path(), "utf8"),
    );
    assert.equal(practice.attempts.length, 4);
    assert.ok(
      practice.attempts.every(
        (a) =>
          a.annotationMatch &&
          a.pins.length === 2 &&
          a.pins.every((p) => p.sha256.length === 64),
      ),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    const sheet = reference.getByRole("region", {
      name: /^Twelve-lead reference ECG sheet/,
    });
    assert.ok(await sheet.evaluate((el) => el.scrollWidth > el.clientWidth));
    const axe = (
      await new AxeBuilder({ page })
        .include("#recorded-ecg")
        .include("#ecg-reference-practice")
        .analyze()
    ).violations;
    assert.deepEqual(
      axe.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(hydration, []);
    results.push({
      browser: name,
      guidedMethodAttempts: 3,
      pairedSourceEvidence: "A+B preserved",
      worksheetExport: "verified",
      digitalCases: 4,
      sampleInterval: "native 2 ms resolution",
      hiddenAnnotations: "verified",
      practiceExport: "verified",
      mobileOverflow: false,
      axe,
      errors,
      hydration,
    });
    console.log(
      `${name}: guided evidence, reference samples, annotations, exports and accessibility passed`,
    );
  } finally {
    await browser.close();
  }
}
await writeFile(
  `${out}/study-browser-results.json`,
  JSON.stringify(results, null, 2) + "\n",
);
