import { expect, test } from "@playwright/test";

test("personal portrait uses the photograph and opens the solid Atlas", async ({ page }) => {
  await page.goto("?view=portrait");
  const portrait = page.getByRole("img", { name: "Photograph of Arjan Singh Puniani smiling in a black quarter-zip" });
  await expect(portrait).toBeVisible();
  await expect(portrait).toHaveJSProperty("naturalWidth", 1059);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "Explore anatomy" }).click();
  await expect(page.getByTestId("human-reference")).toHaveAttribute("data-exterior", "adapted");
  await expect(page.getByTestId("human-reference")).toHaveAttribute("data-surface-mode", "solid");
});
