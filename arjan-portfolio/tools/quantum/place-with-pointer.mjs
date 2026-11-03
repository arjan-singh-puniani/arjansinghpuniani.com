import assert from "node:assert/strict";

export async function placeWithPointer(page) {
  await page.locator("#viewport").scrollIntoViewIfNeeded();
  const rect = await page.locator("#webgl-host canvas").boundingBox();
  const snapshot = () => page.evaluate(() => quantumLab.snapshot());
  const stage = (await snapshot()).stage;
  let pick;
  // Use real pointer events to locate a visible part, rather than bypassing raycasting.
  for (let y = rect.y + 45; y < rect.y + rect.height - 120 && !pick; y += 12) {
    for (
      let x = rect.x + rect.width * 0.25;
      x < rect.x + rect.width * 0.8;
      x += 18
    ) {
      await page.mouse.move(x, y);
      await page.mouse.down();
      if ((await snapshot()).stats.dragging === stage) {
        pick = { x, y };
        break;
      }
      await page.mouse.up();
    }
  }
  assert.ok(pick, "A visible part must be pickable");
  const start = (await snapshot()).stats.moduleOffsets[stage];
  await page.mouse.move(pick.x, pick.y + 30);
  const moved = (await snapshot()).stats.moduleOffsets[stage];
  assert.notEqual(moved, start, "The picked part follows the pointer");
  const delta = (-start * 30) / (moved - start);
  await page.mouse.move(pick.x, pick.y + delta);
  assert.match(
    await page.locator("#assembly-guidance-text").innerText(),
    /Aligned/,
  );
  await page.mouse.up();
  assert.ok(
    (await snapshot()).installed.includes(stage),
    "Aligned release seats the part",
  );
  return { stage, pick, start, moved, delta };
}
