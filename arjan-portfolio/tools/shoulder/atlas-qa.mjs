import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { ATLAS_GROUPS, ATLAS_VIEWS, ATLAS_IDS, LEGACY_IDS } from "../../public/holoanatomy/shoulder/model.js";
const url = process.env.SHOULDER_URL || "http://127.0.0.1:4190/holoanatomy/shoulder/";
const out = "Documentation/shoulder-integration-qa";
await mkdir(out, {recursive:true});
const browser = await chromium.launch({channel:"chrome"});
const results = {errors:[], views:{}};
try {
  const context = await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:"reduce"});
  const page = await context.newPage();
  page.on("pageerror", e => results.errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.shoulderStudio?.ready);
  expect(await page.evaluate(() => shoulderStudio.scene.parts.size)).toBe(54);
  expect(await page.evaluate(() => shoulderStudio.scene.atlasError)).toBeUndefined();
  await page.screenshot({path:`${out}/default.png`});
  for (const [view, config] of Object.entries(ATLAS_VIEWS)) {
    await page.selectOption("#view-select", view);
    await page.waitForTimeout(200);
    await expect(page.locator("#context h2")).toHaveText(config.title);
    expect(await page.evaluate(ids => ids.every(id => !shoulderStudio.scene.meshes.get(id).visible), LEGACY_IDS)).toBe(true);
    await page.screenshot({path:`${out}/${view}.png`});
    results.views[view] = await page.evaluate(() => shoulderStudio.metrics());
    for (const id of ATLAS_GROUPS[config.group]) {
      await page.locator(`#context [data-select="${id}"]`).click();
      expect(await page.evaluate(() => shoulderStudio.state.selected)).toBe(id);
      await expect(page.locator("#context")).toContainText("Source identity and processing");
      await page.locator('[data-action="clear"]').click();
    }
  }
  await page.selectOption("#view-select", "atlas_capsule");
  const hit = await page.evaluate(() => {
    const scene = shoulderStudio.scene, rect = scene.canvas.getBoundingClientRect();
    for (let y=rect.top+80;y<rect.bottom-10;y+=8)
      for (let x=rect.left+10;x<rect.right-10;x+=8)
        if (scene.pick(x,y)==="ZA_capsule") return {x,y};
  });
  expect(hit).toBeTruthy();
  await page.mouse.click(hit.x,hit.y);
  expect(await page.evaluate(() => shoulderStudio.state.selected)).toBe("ZA_capsule");
  await page.locator('[data-action="focus"]').click();
  await page.locator('[data-action="isolate"]').click();
  await page.screenshot({path:`${out}/selected-capsule.png`});
  results.accessibility = (await new AxeBuilder({page}).analyze()).violations;
  expect(results.accessibility).toEqual([]);
  await page.locator("#information").click();
  await expect(page.locator("#info-dialog")).toContainText("CC BY-SA 4.0");
  await expect(page.locator("#info-dialog")).not.toContainText("labrum, capsule, bursae, cartilage, ligaments and shoulder nerves are not supplied");
  await page.locator("#close-info").click();
  await page.locator('[data-mode="learn"]').click();
  expect(await page.evaluate(ids=>ids.every(id=>!shoulderStudio.scene.meshes.get(id).visible),ATLAS_IDS)).toBe(true);
  await page.selectOption("#view-select","atlas_neurovascular");
  expect(await page.evaluate(()=>shoulderStudio.state.mode)).toBe("explore");
  await page.evaluate(async () => {
    const s=shoulderStudio.scene;
    s.frameTimes=[];
    for(let i=0;i<120;i++) { s.orient(s.yaw+.008,s.pitch); await new Promise(requestAnimationFrame); }
  });
  results.orbit = await page.evaluate(()=>shoulderStudio.metrics());
  await page.setViewportSize({width:390,height:844});
  for (const view of Object.keys(ATLAS_VIEWS)) {
    await page.selectOption("#view-select",view);
    await page.waitForTimeout(100);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`${out}/mobile-${view}.png`});
  }
  results.mobileAccessibility=(await new AxeBuilder({page}).analyze()).violations;
  expect(results.mobileAccessibility).toEqual([]);
  const fallback=await browser.newPage();
  await fallback.goto(url+"?format=obj");
  await fallback.waitForFunction(()=>window.shoulderStudio?.ready);
  expect(await fallback.evaluate(()=>shoulderStudio.scene.atlasTransport)).toBe("obj");
  expect(await fallback.evaluate(()=>shoulderStudio.scene.parts.size)).toBe(54);
  await fallback.close();
  const broken=await browser.newPage();
  await broken.route("**/assets/atlas/**",route=>route.fulfill({status:404,body:"intentional QA failure"}));
  await broken.goto(url);
  await broken.waitForFunction(()=>window.shoulderStudio?.ready);
  expect(await broken.evaluate(()=>shoulderStudio.scene.parts.size)).toBe(20);
  await expect(broken.locator("#context")).toContainText("cuff study remains available");
  await broken.close();
  expect(results.errors).toEqual([]);
  results.status="PASS";
} finally {
  await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));
  await browser.close();
}
console.log("PASS atlas integration: 34 parts, selection, source isolation, focus, mobile, accessibility, OBJ fallback and partial failure.");
