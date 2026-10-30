import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir,writeFile } from 'node:fs/promises';
const base=process.env.SEIZEFREEZE_BASE_URL||'http://127.0.0.1:3213';
const output=new URL('../../Documentation/Validation/SeizeFreeze/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chromium',args:['--use-angle=metal']});
const results=[];
for(const [width,height] of [[1440,1000],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],httpErrors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))httpErrors.push(`${r.status()} ${r.url()}`);});
  await page.goto(`${base}/`);
  assert.equal(await page.locator('a[href="/seizefreeze-lab/index.html"]').count(),1,'homepage launch');
  await page.goto(`${base}/work/seizefreeze`);
  assert.equal(await page.locator('h1').innerText(),'SeizeFreeze');
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://arjansinghpuniani.com/work/seizefreeze');
  const iframe=page.frameLocator('iframe[title^="Explore the proposed SeizeFreeze"]');
  await iframe.locator('#lab-tab').click();
  await iframe.locator('#timeline').waitFor({state:'visible'});
  await iframe.locator('#play').waitFor({state:'visible'});
  const frame=page.frames().find(f=>f.url().includes('/seizefreeze-lab/index.html'));
  await frame.waitForFunction(()=>window.seizefreeze?.snapshot().summary);
  await frame.evaluate(()=>window.seizefreeze.goTo(45));
  assert.match(await iframe.locator('#surface-value').innerText(),/34\.8/);
  await iframe.locator('#assembly-tab').click();
  const a11y=await new AxeBuilder({page}).analyze();
  await page.screenshot({path:new URL(`after-case-${width}.png`,output).pathname});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('.sf-launch').click();
  await page.waitForFunction(()=>window.seizefreeze);
  assert.equal(new URL(page.url()).pathname,'/seizefreeze-lab/index.html');
  const routes=[];
  for(const path of ['/work','/about','/contact','/playground/hospitalsim','/hospitalsim/index.html','/work/rigetti-quantum-operations','/atlas/index.html','/rally-house/index.html','/seizefreeze-lab/EVIDENCE.md','/seizefreeze-lab/MODEL.md','/seizefreeze-lab/vendor/Three-LICENSE.txt']){
    const response=await page.request.get(`${base}${path}`);routes.push({path,status:response.status()});assert.ok(response.ok(),`${path}: ${response.status()}`);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);
  results.push({width,height,errors,httpErrors,routes,axeViolations:a11y.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});
  await context.close();
}
await writeFile(new URL('integration-results.json',output),JSON.stringify({base,results},null,2));
console.log(JSON.stringify({base,results}));
assert.ok(results.every(r=>r.axeViolations.length===0));
await browser.close();
