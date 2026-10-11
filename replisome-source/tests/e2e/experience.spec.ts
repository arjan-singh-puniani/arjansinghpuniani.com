import { test, expect } from "@playwright/test";
test("launches, inspects molecules, changes representations, pauses, and restores context", async ({
  page,
  browserName,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText("Preparing molecular structures…")).toBeHidden();
  await page
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  const counter = await page.locator(".hud-card").first().innerText();
  await page.waitForTimeout(250);
  expect(await page.locator(".hud-card").first().innerText()).toBe(counter);
  await page
    .getByRole("button", { name: "Inspect PCNA sliding clamp", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "PCNA sliding clamp" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "evidence", exact: true }).click();
  await expect(page.getByRole("link", { name: "PDB 6TNZ" })).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByLabel("Representation", { exact: true })
    .selectOption("cartoon");
  await page.waitForTimeout(250);
  await page
    .getByLabel("Representation", { exact: true })
    .selectOption("structure");
  await page.waitForTimeout(250);
  await page
    .getByLabel("Representation", { exact: true })
    .selectOption("surface");
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.getByRole("button", { name: "EXPLORE", exact: true }).click();
  const cameraBefore = await page
    .getByTestId("molecular-canvas")
    .getAttribute("data-camera");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect
    .poll(() =>
      page.getByTestId("molecular-canvas").getAttribute("data-camera"),
    )
    .not.toBe(cameraBefore);
  await page.getByRole("button", { name: "Rotate left", exact: true }).click();
  await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  await page.getByRole("button", { name: "WATCH", exact: true }).click();
  await page
    .getByRole("button", { name: "Restart simulation", exact: true })
    .click();
  await expect(page.locator(".current-reaction")).toContainText(
    "Template exposed",
  );
  if (browserName === "chromium") {
    await page.evaluate(() => {
      const canvas = document.querySelector("canvas")!;
      const gl = canvas.getContext("webgl2")!;
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
      setTimeout(() => ext?.restoreContext(), 500);
    });
    await expect(
      page.getByText("Graphics context interrupted · waiting for restoration"),
    ).toBeVisible();
    await expect(
      page.getByText("Graphics context interrupted · waiting for restoration"),
    ).toBeHidden();
  }
  expect(errors).toEqual([]);
});
test("completes the first fragment and recovers from wrong biological actions", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "PLAY", exact: true }).click();
  await page.getByRole("button", { name: /Ahead of the fork/ }).click();
  await expect(page.locator(".game-feedback")).toContainText(
    "exposed lagging template",
  );
  await page.getByRole("button", { name: /Just behind the fork/ }).click();
  await page.getByRole("button", { name: "Align & load PCNA" }).click();
  await page
    .getByRole("button", { name: "DNA polymerase ε", exact: true })
    .click();
  await expect(page.locator(".game-feedback")).toContainText("Pol δ");
  await page
    .getByRole("button", { name: "DNA polymerase δ", exact: true })
    .click();
  const pairs: Record<string, string> = { A: "T", T: "A", C: "G", G: "C" };
  const first = (
    await page.locator(".pairing-template strong").innerText()
  ).trim();
  await page
    .getByRole("button", { name: first === "A" ? "C" : "A", exact: true })
    .click();
  await page.getByRole("button", { name: "Proofread the mismatch" }).click();
  for (let i = 0; i < 4; i++) {
    const template = (
      await page.locator(".pairing-template strong").innerText()
    ).trim();
    await page
      .getByRole("button", { name: pairs[template], exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: /DNA ligase I Seal immediately/ })
    .click();
  await expect(page.locator(".game-feedback")).toContainText("clean nick");
  await page.getByRole("button", { name: /Pol δ \+ FEN1/ }).click();
  await page.getByRole("button", { name: "Seal with DNA ligase I" }).click();
  await expect(
    page.getByRole("heading", { name: "One fragment. One continuous strand." }),
  ).toBeVisible();
  await expect(page.locator(".hud-card").first()).toContainText("150");
  await expect(page.getByText(/150 nt matured/)).toBeVisible();
  await page.screenshot({
    path: `evidence/${test.info().project.name}-level-complete.png`,
  });
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(
    page.getByRole("heading", { name: "Find the starting point" }),
  ).toBeVisible();
});
for (const [width, height] of [
  [390, 844],
  [430, 932],
  [1440, 900],
  [1920, 1080],
])
  test(`opening layout ${width}×${height}`, async ({ page, browserName }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(
      page.getByText("Preparing molecular structures…"),
    ).toBeHidden();
    await page
      .getByRole("button", { name: "Pause simulation", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "PLAY", exact: true }),
    ).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `evidence/${browserName}-${width}x${height}.png`,
    });
    if(width>=1101){const intro=await page.locator(".intro").boundingBox(),hud=await page.locator(".hud").boundingBox();expect(intro!.y+intro!.height+5).toBeLessThan(hud!.y);}
    await page.getByRole("button", { name: "PLAY", exact: true }).click();
    const button = page.getByRole("button", { name: /Just behind the fork/ });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByLabel("Reduce motion").check();
    await expect(page.getByLabel("Reduce motion")).toBeChecked();
  });
test("keeps biology usable when structural assets fail", async ({ page }) => {
  await page.route("**/molecules/*.json", (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByText(
      "Structural assets unavailable · showing conceptual geometry",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "PLAY", exact: true }).click();
  await page.getByRole("button", { name: /Just behind the fork/ }).click();
  await expect(
    page.getByRole("heading", { name: "A small but essential beginning" }),
  ).toBeVisible();
});

test.describe("touch controls", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("touch mode switching, primer placement, and camera zoom", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "PLAY", exact: true }).tap();
    await page.getByRole("button", { name: /Just behind the fork/ }).tap();
    await expect(
      page.getByRole("heading", { name: "A small but essential beginning" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "EXPLORE", exact: true }).tap();
    const before = await page
      .getByTestId("molecular-canvas")
      .getAttribute("data-camera");
    await page.getByRole("button", { name: "Zoom in", exact: true }).tap();
    await expect
      .poll(() =>
        page.getByTestId("molecular-canvas").getAttribute("data-camera"),
      )
      .not.toBe(before);
  });
});

test("supports learning and gameplay without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/");
  await expect(
    page.getByText(
      "3D graphics unavailable. Explore molecule descriptions and play the challenge below.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "PLAY", exact: true }).click();
  await page.getByRole("button", { name: /Just behind the fork/ }).click();
  await expect(
    page.getByRole("heading", { name: "A small but essential beginning" }),
  ).toBeVisible();
});
