export async function openCircuitEditor(page) {
  const editor = page.locator("#circuit-tools");
  if (!(await editor.evaluate((element) => element.open)))
    await editor.locator(":scope > summary").click();
}
