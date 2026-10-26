import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import { DISSECTION } from '../../public/holoanatomy/shoulder/model.js';
const browser = await chromium.launch({channel:'chrome'});
const out = 'Documentation/shoulder-dissection-qa';
await mkdir(out,{recursive:true});
try {
  const context = await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page = await context.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4195/holoanatomy/shoulder/index.html');
  await page.waitForFunction(()=>window.shoulderStudio?.ready);
  await page.click('[data-mode="peel"]');
  for (let i=0;i<DISSECTION.length;i++) {
    await page.click(`[data-station="${i}"]`);
    await page.click('[data-tool="probe"]');
    const controls = page.locator('details').filter({has:page.locator('summary', {hasText:'Accessible structure controls'})});
    await controls.locator('summary').click();
    await controls.locator(`[data-select="${DISSECTION[i].target}"]`).click();
    expect(await page.evaluate(i=>shoulderStudio.state.dissection.found.includes(i),i)).toBe(true);
    await page.click('[data-tool="lift"]');
    await controls.locator('summary').click();
    await controls.locator(`[data-select="${DISSECTION[i].target}"]`).click();
    expect(await page.evaluate(id=>shoulderStudio.scene.meshes.get(id).visible,DISSECTION[i].target)).toBe(false);
    await page.screenshot({path:`${out}/station-${i+1}.png`});
    await page.click('[data-action="lab-undo"]');
    expect(await page.evaluate(id=>shoulderStudio.scene.meshes.get(id).visible,DISSECTION[i].target)).toBe(true);
  }
  await page.click('[data-station="2"]');
  await page.click('[data-tool="lift"]');
  const hit = await page.evaluate(() => {
    const s = shoulderStudio.scene, r = s.canvas.getBoundingClientRect();
    for (let y=r.top+100;y<r.bottom-30;y+=12) for(let x=r.left+30;x<r.right-30;x+=12) {
      const id=s.pick(x,y);
      if (id && !['ZA_scapula','ZA_humerus','ZA_clavicle'].includes(id)) return {x,y,id};
    }
  });
  expect(hit).toBeTruthy(); await page.mouse.click(hit.x,hit.y);
  expect(await page.evaluate(id=>shoulderStudio.state.dissection.removed.includes(id),hit.id)).toBe(true);
  await page.click('[data-action="lab-undo"]');
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.setViewportSize({width:390,height:844});
  await page.click('[data-station="2"]');
  await page.screenshot({path:`${out}/mobile.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.click('[data-action="surface-lab"]');
  await expect(page.locator('#peel-range')).toBeVisible();
  await page.click('[data-action="deep-lab"]');
  await expect(page.locator('[data-tool="lift"]')).toBeVisible();
  await page.click('#reset');
  expect(await page.evaluate(()=>shoulderStudio.state.dissection.removed.length)).toBe(0);
  await page.click('[data-mode="learn"]');
  expect(await page.evaluate(()=>shoulderStudio.scene.meshes.get('ZA_capsule').visible)).toBe(false);
  expect(errors).toEqual([]);
  console.log('PASS five dissection stations, identification, lift/undo, source visibility, mobile, accessibility, reset, original specimen and lesson isolation');
} finally {await browser.close();}
