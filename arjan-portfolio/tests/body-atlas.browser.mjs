import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base=process.argv[2] || 'http://127.0.0.1:3210';
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base),'Use an explicit loopback preview URL');
const out='test-results/body-atlas';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const results=[];
try {
  for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
    const context=await browser.newContext({viewport,isMobile:name==='mobile',hasTouch:name==='mobile',reducedMotion:'reduce'});
    const page=await context.newPage();
    const errors=[],geometry=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(/\.(glb|gltf)(?:\?|$)/.test(request.url()))geometry.push(request.url());});
    await page.goto(base);
    const card=page.getByRole('article',{name:'BODY//ATLAS',exact:true});
    await card.scrollIntoViewIfNeeded();
    assert.equal(await card.getByRole('img').getAttribute('alt'),'BODY//ATLAS prototype: anatomical intervention map and original-source evidence panel');
    await card.screenshot({path:`${out}/home-${name}.png`});
    await card.getByRole('link',{name:'Explore BODY//ATLAS'}).click();
    await page.waitForURL('**/work/body-atlas');
    assert.equal(await page.getByRole('heading',{level:1}).innerText(),'BODY//ATLAS');
    assert.match(await page.locator('main').innerText(),/Provisional source-text contexts/);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://arjansinghpuniani.com/work/body-atlas');
    assert.equal(await page.getByRole('link',{name:'Read the recorded scope and validation'}).getAttribute('href'),'/documents/body-atlas-validation.json');
    const report=await page.request.get(base+'/documents/body-atlas-validation.json');
    assert.equal(report.status(),200);assert.equal((await report.json()).sourceContextEntries,650);
    const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(accessibility.violations,[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:`${out}/case-${name}.png`,fullPage:true});
    await page.goto(base+'/work');
    await page.getByRole('button',{name:'Software and Simulation',exact:true}).click();
    await page.getByRole('link',{name:'BODY//ATLAS',exact:true}).click();
    await page.waitForURL('**/work/body-atlas');
    assert.deepEqual(geometry,[],'Portfolio pages must not download atlas geometry');
    assert.deepEqual(errors,[]);
    results.push({viewport:name,homeCard:true,caseStudy:true,workFilter:true,sources:true,canonical:true,horizontalOverflow:false,axeViolations:0,atlasGeometryRequests:0,pageErrors:errors});
    await context.close();
  }
  const context=await browser.newContext();
  for(const route of ['/','/work','/research','/about','/cv','/contact','/work/seizefreeze','/work/bci-calibration','/work/vector-ekg-reasonos','/playground','/playground/replisome','/playground/rally-house']) {
    const response=await context.request.get(base+route);assert.equal(response.status(),200,route);
  }
  const sitemap=await context.request.get(base+'/sitemap.xml');assert.match(await sitemap.text(),/https:\/\/arjansinghpuniani.com\/work\/body-atlas/);
  await context.close();
  await writeFile(`${out}/results.json`,JSON.stringify({results,existingRoutesChecked:12,sitemap:true,environment:'Installed Chrome; mobile is viewport/touch emulation, not a physical device.'},null,2)+'\n');
  console.log(JSON.stringify({results,existingRoutesChecked:12,sitemap:true},null,2));
} finally { await browser.close(); }
