import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:3211',out=process.argv[3]||'/tmp/atlas-neuralink-qa/local';
assert.ok(/^http:\/\/127\.0\.0\.1:\d+$/.test(base)||base==='https://arjansinghpuniani.com');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),results=[];
try{
 for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,isMobile:name==='mobile',hasTouch:name==='mobile'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base+'/atlas?entry=neuralink&panel=mechanism');assert.equal(response.status(),200);
  await page.waitForSelector('[data-avatar-status="loaded"]',{timeout:90000});
  const scene=page.getByTestId('human-reference'),facts=page.getByRole('region',{name:'Neuralink evidence at a glance'}),panel=page.getByRole('region',{name:'Anatomy and mechanism'});
  assert.equal(await scene.getAttribute('data-action-kind'),'bci');assert.equal(await scene.getAttribute('data-focus-region'),'UBERON:0000955');
  assert.match(await facts.innerText(),/Not FDA marketing approved/);assert.match(await facts.innerText(),/0\/6/);
  assert.equal(await page.getByRole('button',{name:'Check FDA updates',exact:true}).count(),0);
  await page.screenshot({path:out+'/'+name+'-overview.png'});
  await page.getByRole('list',{name:'Mechanism stages'}).getByRole('button').nth(1).click();assert.equal(await scene.getAttribute('data-action-step'),'1');
  await panel.getByRole('button',{name:'Play mechanism',exact:true}).click();
  const first=await scene.locator('canvas').screenshot();await page.waitForTimeout(400);const second=await scene.locator('canvas').screenshot();assert.notEqual(Buffer.compare(first,second),0,'Canvas playback must visibly change');
  await panel.getByRole('button',{name:'Pause mechanism',exact:true}).click();
  await facts.getByText('Hardware specifications differ across sources',{exact:true}).click();assert.match(await facts.innerText(),/64 threads/);assert.match(await facts.innerText(),/128 threads/);
  assert.equal(await facts.getByRole('link',{name:'Original brochure',exact:true}).getAttribute('href'),'https://neuralink.com/pdfs/PRIME-Study-Brochure.pdf');
  await facts.getByRole('button',{name:'Inspect all 6 studies'}).click();
  assert.equal(await page.getByRole('tab',{name:'Studies',exact:true}).getAttribute('aria-selected'),'true');
  const studies=page.getByRole('tabpanel');assert.equal(await studies.locator('.source-record').count(),7);assert.match(await studies.innerText(),/Study start: 2024-01-09 \(actual\)/);assert.match(await studies.innerText(),/estimated in registry/);
  const study=studies.locator('.source-record').filter({hasText:'NCT06429735'});await study.getByText('Provenance and cached source',{exact:true}).click();
  const cached=await study.getByRole('link',{name:'Open authentic cached response'}).getAttribute('href'),sha=(await study.locator('.hash').innerText()).trim();
  const raw=await page.request.get(base+cached);assert.equal(raw.status(),200);assert.equal(createHash('sha256').update(await raw.body()).digest('hex'),sha);
  await page.getByRole('tab',{name:'Dossier',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.dossier')?.textContent.includes('128 threads'));
  const dossier=page.getByRole('tabpanel');assert.match(await dossier.innerText(),/not an FDA recall/);
  const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:/^Export Neuralink .* brief$/}).click();const download=await downloadPromise;
  const markdown=await readFile(await download.path(),'utf8');for(const token of ['NCT06429735','NCT07224256','31642810','64 threads','128 threads','revision crosswalk','thread retraction'])assert.ok(markdown.includes(token),token);
  await page.getByRole('button',{name:'Open documented milestones'}).click();assert.match(await page.getByRole('dialog').innerText(),/2019-10-31/);assert.match(await page.getByRole('dialog').innerText(),/Study first posted/);await page.getByRole('button',{name:'Close dialog'}).click();
  await facts.getByRole('button',{name:'Compare recording interfaces'}).click();assert.match(await page.getByRole('table').innerText(),/BrainGate/);assert.match(await page.getByRole('table').innerText(),/Neuralink/);await page.getByRole('button',{name:'Close dialog'}).click();
  await page.emulateMedia({reducedMotion:'reduce'});await expect(panel.getByRole('button',{name:'Play mechanism',exact:true})).toBeDisabled();
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations,[]);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  results.push({viewport:name,recordingMechanism:true,animatedCanvas:true,studyRecords:6,earlierPublication:1,sourceShaVerified:sha,dossier:true,hardwareDifferenceVisible:true,citedBrief:true,datedHistory:true,comparison:true,reducedMotion:true,axeViolations:0,pageErrors:errors});await context.close();
 }
 await writeFile(out+'/results.json',JSON.stringify({base,checkedAt:new Date().toISOString(),results},null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
