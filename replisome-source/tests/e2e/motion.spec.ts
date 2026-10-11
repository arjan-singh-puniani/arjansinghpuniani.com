import { test, expect } from "@playwright/test";

for (const size of [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`manipulates enzymes in a running scene ${size.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(
      page.getByText("Preparing molecular structures…"),
    ).toBeHidden();
    await page
      .getByRole("button", { name: "Take control", exact: true })
      .click();
    const scene = page.getByTestId("molecular-canvas");
    const fork = await page.locator(".current-reaction small").innerText();
    await expect
      .poll(() => page.locator(".current-reaction small").innerText())
      .not.toBe(fork);
    await page.getByLabel("Molecule to manipulate").selectOption("cmg");
    await page
      .getByRole("button", { name: "Pull off DNA", exact: true })
      .click();
    await expect(scene).toHaveAttribute("data-held", "cmg");
    const stopped = await page.locator(".current-reaction small").innerText();
    await page.waitForTimeout(350);
    expect(await page.locator(".current-reaction small").innerText()).toBe(
      stopped,
    );
    await expect(page.locator(".motion-effect")).toContainText(
      "already opened",
    );
    await page
      .getByRole("button", { name: "Return to DNA", exact: true })
      .click();
    await expect
      .poll(() => page.locator(".current-reaction small").innerText())
      .not.toBe(stopped);
    if (size.width < 700) await page.locator(".motion-extra summary").click();
    await page.getByRole("button", { name: "Copy", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Following", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const position = await scene.getAttribute("data-actor-position");
    await expect
      .poll(() => scene.getAttribute("data-actor-position"))
      .not.toBe(position);
    await expect(page.locator(".actor-pin")).toContainText("polymerase δ");
    await page
      .getByRole("button", { name: "Pull off DNA", exact: true })
      .click();
    await expect(scene).toHaveAttribute("data-held", "delta");
    await expect(page.locator(".motion-blocked")).toBeVisible();
    await page
      .getByRole("button", { name: "Return to DNA", exact: true })
      .click();
    await page.getByLabel("Molecule to manipulate").selectOption("epsilon");
    await page
      .getByRole("button", { name: "Pull off DNA", exact: true })
      .click();
    await expect
      .poll(async () => Number(await scene.getAttribute("data-leading-gap")))
      .toBeGreaterThan(0);
    await expect(page.locator(".end-pin")).toContainText("leading end");
    await page
      .getByRole("button", { name: "Return to DNA", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Pause simulation", exact: true })
      .click();
    const frozen = await page
      .getByLabel("Replay simulation timeline")
      .inputValue();
    await page.waitForTimeout(350);
    expect(
      await page.getByLabel("Replay simulation timeline").inputValue(),
    ).toBe(frozen);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `evidence/${test.info().project.name}-motion-${size.width}.png`,
    });
  });
}

test("drags a molecular protein off DNA and docks it back without orbiting", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await expect(page.getByText("Preparing molecular structures…")).toBeHidden();
  await page.getByRole("button", { name: "Take control", exact: true }).click();
  await page
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Handle enzymes", exact: true })
    .click();
  const scene = page.getByTestId("molecular-canvas");
  await expect(scene).toHaveAttribute("data-tool", "grab");
  await page.waitForTimeout(350);
  const original = (await scene.getAttribute("data-actor-screen"))!
    .split(",")
    .map(Number);
  const camera = await scene.getAttribute("data-camera");
  await page.mouse.move(original[0], original[1]);
  await page.mouse.down();
  await page.mouse.move(original[0] - 120, original[1] - 40, { steps: 15 });
  await page.mouse.up();
  await expect(scene).toHaveAttribute("data-held", "cmg");
  expect(await scene.getAttribute("data-camera")).toBe(camera);
  await page.waitForTimeout(500);
  const parked = (await scene.getAttribute("data-actor-screen"))!
    .split(",")
    .map(Number);
  await page.mouse.move(parked[0], parked[1]);
  await page.mouse.down();
  await page.mouse.move(original[0], original[1], { steps: 15 });
  await page.mouse.up();
  await expect(scene).toHaveAttribute("data-held", "");
  await expect(
    page.getByRole("button", { name: "Pull off DNA", exact: true }),
  ).toBeVisible();
});
