import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';

const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const scrollY=()=>page.evaluate(()=>window.scrollY);
const steady=async(before)=>{await page.waitForTimeout(250);assert(Math.abs(await scrollY()-before)<2,'Game input must not scroll the page');};
try{
  await page.goto(process.env.VECTOR_URL??'http://127.0.0.1:3000/playground/vector-tennis');
  await page.getByRole('button',{name:/Racket Lab Advanced physics/}).click();
  const stage=page.locator('.arcade-stage');
  await stage.scrollIntoViewIfNeeded();await stage.focus();await page.waitForTimeout(300);
  const start=stage.getByRole('button',{name:/Start rally/});
  await expect(start).toBeVisible();
  assert(!/space/i.test(await page.locator('.racket-lab-mode').innerText()),'Instructions must advertise J, not Space');

  // Space is retired as a game action; old muscle memory cannot scroll either.
  let before=await scrollY();await page.keyboard.press('Space');await steady(before);await expect(start).toBeVisible();
  await page.keyboard.press('j');await expect(start).toBeHidden();await steady(before);
  for(const [key,shot] of [['k','topspin'],['l','slice'],['j','flat']]){
    await page.keyboard.press(key);await expect(page.locator(`.shot-${shot}`)).toHaveAttribute('aria-pressed','true');await steady(before);
  }
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(100);await page.keyboard.up('ArrowDown');await steady(before);

  // Calling focus from a control below the court must not recenter the page.
  const flat=page.locator('.shot-flat');await flat.scrollIntoViewIfNeeded();await page.waitForTimeout(300);
  before=await scrollY();await flat.click();await expect(stage).toBeFocused();await steady(before);

  // Native button activation still works, and shortcuts stay scoped to the court.
  await page.getByRole('button',{name:'New match',exact:true}).click();await expect(start).toBeVisible();
  await start.focus();await page.keyboard.press('Space');await expect(start).toBeHidden();
  await page.getByRole('button',{name:'New match',exact:true}).click();await expect(start).toBeVisible();
  await page.keyboard.press('j');await page.waitForTimeout(150);await expect(start).toBeVisible();
  await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.waitForTimeout(300);
  await page.keyboard.press('Space');await page.waitForTimeout(350);assert(await scrollY()>50,'Normal page scrolling must still work outside the court');
  assert.deepEqual(errors,[]);
  console.log('PASS: J/K/L, retired Space, arrow keys, no focus jump, native buttons, and normal page scrolling.');
}finally{await browser.close();}
