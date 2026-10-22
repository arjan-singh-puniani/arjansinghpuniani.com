import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base=process.argv[2]||'http://127.0.0.1:3210';
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)||base==='https://arjansinghpuniani.com');
const summaries=JSON.parse(await readFile('../body-atlas-source/data/dossier-summary.json','utf8'));
const out='test-results/body-atlas-dossiers';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});const results=[];
try{
 for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,isMobile:name==='mobile',hasTouch:name==='mobile',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/dossiers/'))requests.push(r.url());});
  await page.goto(base+'/atlas');await page.waitForSelector('[data-organs-status="loaded"]',{timeout:90000});
  assert.equal(requests.length,0,'Dossiers must not block the initial anatomy');
  await page.getByRole('combobox',{name:'Explore anatomical region',exact:true}).selectOption('all');
  await page.getByRole('button',{name:'Inspect Activa Tremor Control System',exact:true}).click();
  await page.getByRole('tab',{name:'Dossier',exact:true}).click();
  await page.getByRole('heading',{name:'Regulatory, labeling & safety',exact:true}).waitFor();
  await page.getByRole('checkbox',{name:/Only records mentioning labeling/}).check();
  assert.match(await page.locator('.dossier').innerText(),/Current labeling review: pending/);
  // Exercise each entry through the real selector, lazy request and rendered dossier.
  let checked=0;const loadTimes=[];
  for(const [id,s] of Object.entries(summaries)){
   const start=Date.now();
   await page.getByRole('combobox',{name:'Choose another intervention in this region',exact:true}).selectOption(id);
   await page.getByRole('article',{name:`${s.name} regulatory, labeling and safety dossier`,exact:true}).waitFor();
   const text=await page.locator('.dossier').innerText();assert.ok(text.includes(s.regulatory.detail),id);assert.ok(text.includes(s.labeling.detail),id);assert.ok(text.includes(s.safety.detail),id);
   assert.equal(await page.getByRole('link',{name:'Download dossier with source references (JSON)'}).getAttribute('href'),'/atlas'+s.path);
   loadTimes.push(Date.now()-start);checked++;
  }
  assert.equal(checked,91);
  await page.getByRole('combobox',{name:'Choose another intervention in this region',exact:true}).selectOption('source-fda-p040033');
  await page.getByRole('article',{name:'Birmingham Hip Resurfacing regulatory, labeling and safety dossier',exact:true}).waitFor();
  const recall=page.locator('.dossier-record').filter({hasText:'Z-0016-2008'});while(await recall.count()===0)await page.getByRole('button',{name:/Show more recalls/}).click();await recall.locator('summary').click();
  assert.match(await recall.innerText(),/64803/);assert.match(await recall.innerText(),/74120146/);assert.match(await recall.innerText(),/applicability.*unreviewed/);
  assert.match(await recall.getByRole('link',{name:'Original FDA recall record'}).getAttribute('href'),/id=55398$/);
  assert.match(await page.locator('.dossier').getByRole('link',{name:'P040033 · Original labeling',exact:true}).first().getAttribute('href'),/P040033C\.pdf$/);
  await page.screenshot({path:`${out}/dossier-${name}.png`});
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations,[]);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('tab',{name:'Dossier',exact:true}).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('tab',{name:'Sources',exact:true}).getAttribute('aria-selected'),'true');await page.keyboard.press('ArrowLeft');
  await page.getByRole('button',{name:'Brief',exact:true}).click();const downloaded=page.waitForEvent('download');await page.getByRole('link',{name:'Export Markdown',exact:true}).click();const file=await downloaded;const markdown=await readFile(await file.path(),'utf8');assert.match(markdown,/P040033C\.pdf/);assert.match(markdown,/model\/lot review: pending/);await page.getByRole('button',{name:'Close dialog'}).click();
  // A missing local artifact is an explicit error and retry, never zero safety findings.
  const failed=base+'/atlas/dossiers/source-fda-k260007.json';await page.route(failed,r=>r.fulfill({status:503,body:'Unavailable'}));
  await page.getByRole('combobox',{name:'Choose another intervention in this region',exact:true}).selectOption('source-fda-k260007');await page.getByRole('alert').filter({hasText:'Dossier could not be loaded'}).waitFor();assert.match(await page.getByRole('alert').filter({hasText:'Dossier could not be loaded'}).innerText(),/Coverage has not been reset/);await page.unroute(failed);await page.getByRole('button',{name:'Retry dossier'}).click();await page.getByRole('article',{name:'Hudi hyaluronic-acid vaginal suppositories regulatory, labeling and safety dossier',exact:true}).waitFor();
  assert.deepEqual(errors,[]);loadTimes.sort((a,b)=>a-b);results.push({viewport:name,dossiers:checked,initialDossierRequests:0,sourceAndModelLot:true,labelScope:true,briefCitations:true,keyboardTabs:true,retryRecovery:true,axeViolations:0,pageErrors:errors,p95SelectionToDossierMs:loadTimes[Math.floor(loadTimes.length*.95)]});await context.close();
 }
 await writeFile(`${out}/results.json`,JSON.stringify({site:base,results,environment:'Installed Chrome; mobile is touch/viewport emulation, not a physical phone.'},null,2)+'\n');console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
