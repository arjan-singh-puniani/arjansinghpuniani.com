import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const base = (process.env.REPLISOME_QA_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const out =
  process.env.REPLISOME_STUDY_QA_OUT || "Documentation/replisome-study-qa";
mkdirSync(out, { recursive: true });
const results = [],
  errors = [],
  failures = [];
for (const [name, type] of [
  ["chromium", chromium],
  ["webkit", webkit],
]) {
  const browser = await type.launch(
    name === "chromium"
      ? { channel: "chrome", headless: true }
      : { headless: true },
  );
  try {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      const label = `${name}-${viewport.width}`;
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push({ label, error: e.message }));
      page.on("response", (r) => {
        if (r.status() >= 400)
          failures.push({ label, status: r.status(), url: r.url() });
      });
      await page.goto(`${base}/replisome/index.html`);
      await expect(
        page.getByText("Preparing molecular structures…"),
      ).toBeHidden({ timeout: 30000 });
      // Begin while running: the studio must freeze counters and preserve state on close.
      const launch = page.getByRole("button", {
        name: "MCAT lens",
        exact: true,
      });
      await launch.click();
      const studio = page.getByRole("dialog", {
        name: "See it. Predict it. Explain it.",
      });
      await expect(studio).toBeVisible();
      await expect(page.getByTestId("molecular-canvas")).toHaveAttribute(
        "data-render-state",
        "suspended",
      );
      const counter = await page.locator(".hud").innerText();
      await page.waitForTimeout(350);
      expect(await page.locator(".hud").innerText()).toBe(counter);
      await studio.getByRole("region", { name: "Visual lab content" }).focus();
      await page.keyboard.press("Space");
      await page.waitForTimeout(200);
      expect(await page.locator(".hud").innerText()).toBe(counter);
      const audit = await new AxeBuilder({ page })
        .include(".study-dialog")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      ).toEqual([]);
      expect(
        await studio.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      await page.screenshot({ path: `${out}/${label}-polarity-predict.png` });
      const reveal = () =>
        studio.getByRole("button", {
          name: "Reveal the mechanism",
          exact: true,
        });
      const option = (i) => studio.locator(".study-options button").nth(i);
      const answer = async (i) => {
        await option(i).click();
        await reveal().click();
      };
      const chapter = (title) =>
        studio
          .getByRole("navigation", { name: "Reasoning chapters" })
          .getByRole("button", { name: new RegExp(title) });
      await expect(reveal()).toBeDisabled();
      await expect(
        studio.getByRole("button", { name: "Left fork", exact: true }),
      ).toBeDisabled();
      await studio
        .getByRole("combobox", { name: "Confidence", exact: true })
        .selectOption("Very sure");
      await answer(0);
      await expect(studio.getByRole("status")).toContainText(
        "Revise the mechanism.",
      );
      await studio
        .getByRole("button", { name: "Left fork", exact: true })
        .click();
      await expect(studio.locator(".study-visual > svg")).toHaveAttribute(
        "aria-label",
        /upper daughter is leading/,
      );
      await page.screenshot({ path: `${out}/${label}-polarity-reveal.png` });
      await chapter("Find the reactive end").click();
      await answer(2);
      await studio
        .getByRole("button", { name: "3′ OH · reactive", exact: true })
        .click();
      await expect(studio.locator(".study-visual > svg")).toHaveAttribute(
        "aria-label",
        /release pyrophosphate/,
      );
      await chapter("Break one function").click();
      for (const [i, correct] of [0, 1, 2, 1, 2].entries()) {
        await studio.locator(".enzyme-controls button").nth(i).click();
        await answer(correct);
        await expect(studio.getByRole("status")).toContainText(
          "Prediction supported.",
        );
      }
      await chapter("Read the evidence").click();
      await answer(2);
      await studio.getByLabel("Replication round", { exact: true }).fill("3");
      await expect(studio.locator(".study-visual > svg")).toHaveAttribute(
        "aria-label",
        /2 hybrid and 6 light duplexes out of 8/,
      );
      await expect(studio.locator(".study-visual")).toContainText(
        "Heavy strands: 12.5%",
      );
      await page.screenshot({ path: `${out}/${label}-inheritance.png` });
      await chapter("Reach the chromosome end").click();
      await answer(0);
      await studio
        .getByRole("button", { name: "3. Extend template", exact: true })
        .click();
      await expect(studio.locator(".study-visual > svg")).toHaveAttribute(
        "aria-label",
        /using its RNA template/,
      );
      await studio
        .getByRole("button", { name: "4. Fill in DNA", exact: true })
        .click();
      await expect(studio.locator(".study-visual > svg")).toHaveAttribute(
        "aria-label",
        /normal 3 prime overhang/,
      );
      await page.screenshot({ path: `${out}/${label}-chromosome-end.png` });
      await chapter("Try a new problem").click();
      for (const [i, correct] of [1, 1, 2].entries()) {
        await studio
          .getByRole("button", {
            name: `Checkpoint question ${i + 1}`,
            exact: true,
          })
          .click();
        await answer(i === 0 ? 0 : correct); // Deliberately miss first question to check honest first-attempt reporting.
      }
      await expect(studio.locator(".checkpoint-result")).toContainText(
        "2/3 correct on the first attempt",
      );
      await studio
        .getByRole("button", { name: "Checkpoint question 1", exact: true })
        .click();
      await expect(option(1)).toBeDisabled();
      await expect(studio.locator(".checkpoint-result")).toContainText(
        "2/3 correct",
      );
      const headerBox = await studio.locator(".study-header").boundingBox();
      expect(headerBox.y).toBeGreaterThanOrEqual(0);
      expect(await studio.evaluate((el) => el.scrollTop)).toBe(0);
      await page.screenshot({ path: `${out}/${label}-checkpoint.png` });
      await studio
        .getByRole("button", { name: "Close reasoning studio", exact: true })
        .focus();
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(
          () => !!document.activeElement.closest(".study-dialog"),
        ),
      ).toBe(true);
      await page.keyboard.press("Escape");
      await expect(studio).toBeHidden();
      await expect(launch).toBeFocused();
      await expect(
        page.getByRole("button", { name: "Pause simulation", exact: true }),
      ).toBeVisible();
      // Opening from paused state must not restart the molecular simulation on dismissal.
      await page
        .getByRole("button", { name: "Pause simulation", exact: true })
        .click();
      await launch.click();
      await expect(reveal()).toBeDisabled();
      await studio
        .getByRole("button", { name: "Close reasoning studio", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Resume simulation", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      results.push({
        label,
        checks: [
          "no answer before commitment",
          "all five causal perturbations",
          "fork-relative polarity",
          "3-prime OH reaction",
          "conserved isotope counts",
          "telomerase and overhang",
          "first-attempt checkpoint feedback",
          "confidence capture",
          "keyboard focus and Escape",
          "running/paused state restored",
          "WCAG scan",
          "responsive screenshots",
        ],
      });
      await context.close();
    }
    const fallback = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return /webgl/.test(type) ? null : original.call(this, type, ...args);
      };
    });
    await fallback.goto(`${base}/replisome/index.html`);
    await fallback
      .getByRole("button", { name: "MCAT lens", exact: true })
      .click();
    await expect(fallback.getByRole("dialog")).toBeVisible();
    await fallback.locator(".study-options button").nth(1).click();
    await fallback
      .getByRole("button", { name: "Reveal the mechanism", exact: true })
      .click();
    await expect(
      fallback.getByRole("dialog").getByRole("status"),
    ).toContainText("Prediction supported.");
    results.push({
      label: `${name}-no-webgl`,
      checks: ["complete DOM/SVG reasoning without WebGL"],
    });
    await fallback.close();
  } finally {
    await browser.close();
  }
}
writeFileSync(
  `${out}/results.json`,
  JSON.stringify({ base, results, errors, failures }, null, 2) + "\n",
);
expect(errors).toEqual([]);
expect(failures).toEqual([]);
console.log(
  `${results.length} visual reasoning scenarios passed; no runtime or HTTP errors.`,
);
