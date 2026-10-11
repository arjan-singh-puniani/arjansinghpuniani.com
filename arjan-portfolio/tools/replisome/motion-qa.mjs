import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const base = (process.env.REPLISOME_QA_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const out =
  process.env.REPLISOME_MOTION_QA_OUT || "Documentation/replisome-motion-qa";
mkdirSync(out, { recursive: true });
const results = [],
  errors = [],
  failed = [];
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
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
    ]) {
      const label = `${name}-${viewport.width}`;
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.on("pageerror", (e) =>
        errors.push({ case: label, message: e.message }),
      );
      page.on("response", (r) => {
        if (r.status() >= 400)
          failed.push({ case: label, url: r.url(), status: r.status() });
      });
      await page.goto(`${base}/playground/replisome`);
      await page
        .getByRole("button", { name: "Enter experience", exact: true })
        .click();
      const frame = await (
        await page.locator("iframe").elementHandle()
      ).contentFrame();
      await expect(
        frame.getByText("Preparing molecular structures…"),
      ).toBeHidden({ timeout: 30000 });
      await frame
        .getByRole("button", { name: "Take control", exact: true })
        .click();
      const scene = frame.getByTestId("molecular-canvas");
      const fork = await frame.locator(".current-reaction small").innerText();
      await expect
        .poll(() => frame.locator(".current-reaction small").innerText())
        .not.toBe(fork);
      await frame
        .getByRole("button", { name: "Pull off DNA", exact: true })
        .click();
      const frozen = await frame.locator(".current-reaction small").innerText();
      await page.waitForTimeout(350);
      expect(await frame.locator(".current-reaction small").innerText()).toBe(
        frozen,
      );
      await frame
        .getByRole("button", { name: "Return to DNA", exact: true })
        .click();
      await expect
        .poll(() => frame.locator(".current-reaction small").innerText())
        .not.toBe(frozen);
      if (viewport.width < 700)
        await frame.locator(".motion-extra summary").click();
      await frame.getByRole("button", { name: "Copy", exact: true }).click();
      await expect(
        frame.getByRole("button", { name: "Following", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      const pose = await scene.getAttribute("data-actor-position");
      await expect
        .poll(() => scene.getAttribute("data-actor-position"))
        .not.toBe(pose);
      await expect(frame.locator(".actor-pin")).toContainText("polymerase δ");
      await frame
        .getByRole("button", { name: "Pause simulation", exact: true })
        .click();
      await page.waitForTimeout(600);
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
      await page.screenshot({ path: `${out}/${label}-follow.png` });
      if (viewport.width >= 1280) {
        await frame.getByLabel("Molecule to manipulate").selectOption("cmg");
        await frame
          .getByRole("button", { name: "Handle enzymes", exact: true })
          .click();
        await page.waitForTimeout(350);
        const offset = await page.locator("iframe").boundingBox();
        const local = (await scene.getAttribute("data-actor-screen"))
          .split(",")
          .map(Number);
        const x = local[0] + offset.x,
          y = local[1] + offset.y;
        const camera = await scene.getAttribute("data-camera");
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x - 120, y - 40, { steps: 15 });
        await page.mouse.up();
        await expect(scene).toHaveAttribute("data-held", "cmg");
        expect(await scene.getAttribute("data-camera")).toBe(camera);
        await frame
          .getByRole("button", { name: "Return to DNA", exact: true })
          .click();
      }
      await frame.getByLabel("Molecule to manipulate").selectOption("ligase");
      await frame
        .getByRole("button", { name: "Pull off DNA", exact: true })
        .click();
      await frame.getByRole("button", { name: "Process", exact: true }).click();
      await frame.getByLabel("Molecule to manipulate").selectOption("ligase");
      await frame
        .getByRole("button", {
          name: "Simulation speed 1 times; change speed",
          exact: true,
        })
        .click();
      await frame
        .getByRole("button", {
          name: "Simulation speed 2 times; change speed",
          exact: true,
        })
        .click();
      await expect(frame.locator(".motion-readout")).toContainText(
        /[2-9] nicks/,
        { timeout: 15000 },
      );
      await frame
        .getByRole("button", { name: "Pause simulation", exact: true })
        .click();
      await expect(frame.locator(".motion-effect")).toContainText(
        "synthesis can continue",
      );
      await page.screenshot({ path: `${out}/${label}-unsealed.png` });
      expect(
        await frame
          .locator("body")
          .evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      await page
        .getByRole("button", { name: "Close experience", exact: true })
        .click();
      await expect(page.locator("iframe")).toHaveCount(0);
      results.push({
        case: label,
        checks: [
          "running exploration",
          "helicase removal/restoration",
          "moving polymerase follow",
          "pause",
          "WCAG scan",
          "ligase nick accumulation",
          "compact layout",
          "iframe teardown",
          ...(viewport.width >= 1280
            ? ["direct molecular drag without camera movement"]
            : []),
        ],
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
writeFileSync(
  `${out}/results.json`,
  JSON.stringify({ base, results, errors, failed }, null, 2),
);
expect(errors).toEqual([]);
expect(failed).toEqual([]);
console.log(
  JSON.stringify({
    cases: results.length,
    errors: errors.length,
    failedRequests: failed.length,
    out,
  }),
);
