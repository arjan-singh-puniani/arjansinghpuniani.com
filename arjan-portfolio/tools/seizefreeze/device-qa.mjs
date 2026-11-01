import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.SEIZEFREEZE_BASE_URL||'http://127.0.0.1:3217';
const output=new URL('../../Documentation/Validation/SeizeFreeze/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chromium',args:['--use-angle=metal']});
const results=[];
try{
 for(const [width,height] of [[1440,1000],[768,1024],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
  await page.goto(`${base}/seizefreeze-lab/index.html`);
  await page.waitForFunction(()=>window.seizefreeze?.snapshot().stats?.frames>0,null,{timeout:90000});
  const snapshot=()=>page.evaluate(()=>window.seizefreeze.snapshot());
  const capture=async name=>{await page.locator('#scene').scrollIntoViewIfNeeded();await page.waitForTimeout(120);await page.screenshot({path:new URL(name,output).pathname});};
  const initial=await snapshot();
  assert.equal(initial.staticView,false);assert.deepEqual(initial.stats.device.scale,[1,1,1]);
  assert.ok(initial.stats.device.rigidClearanceMm>=.3-1e-8);
  await page.screenshot({path:new URL(`device-pass1-${width}-opening.png`,output).pathname});
  await page.locator('#device-lens').screenshot({path:new URL(`device-pass1-${width}-lens.png`,output).pathname});
  await page.locator('#assembly-tab').click();
  assert.equal(await page.locator('#device-section').getAttribute('aria-pressed'),'true');
  await page.locator('#parts button').nth(2).click();
  await page.locator('#device-circuit').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#device-circuit').getAttribute('aria-pressed'),'true');
  await page.locator('#device-dimensions').click();
  await page.waitForFunction(()=>document.querySelector('[data-sf-label]').textContent.includes('10 mm contact'));
  assert.match(await page.locator('[data-sf-label]').textContent(),/10 mm contact/);
  await capture(`device-pass2-${width}-exploded.png`);
  for(let i=0;i<7;i++){await page.locator('#parts button').nth(i).click();await page.locator('#seat').click();}
  assert.equal((await snapshot()).stats.exploded,false);
  await page.locator('#parts button').nth(2).click();
  await capture(`device-pass2-${width}-section.png`);
  await page.locator('#device-section').click();
  assert.equal(await page.locator('#device-section').getAttribute('aria-pressed'),'false');
  await page.locator('#parts button').nth(6).click();
  await capture(`device-pass2-${width}-closed.png`);
  await page.locator('.construction-notes summary').click();
  assert.match(await page.locator('#contact-fit-note').innerText(),/Sampled datum-to-cortex gap:.*mm/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:new URL(`device-pass3-${width}-notes.png`,output).pathname,fullPage:width<761});
  await page.locator('#placement-tab').click();
  await page.locator('#scene').scrollIntoViewIfNeeded();
  await page.locator('#device-lens').waitFor({state:'visible'});
  assert.equal(await page.locator('#device-lens').isVisible(),true);
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  results.push({width,height,physicalPhoneTest:false,stats:(await snapshot()).stats,errors,failed});
  await context.close();
 }
}finally{await browser.close();}
await writeFile(new URL('device-browser-results.json',output),JSON.stringify({base,passed:true,results},null,2));
console.log(JSON.stringify({passed:true,viewports:results.map(r=>r.width)}));
