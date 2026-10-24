import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createHash} from 'node:crypto';

const base=process.argv[2] || 'http://127.0.0.1:3210';
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)||base==='https://arjansinghpuniani.com','Use the portfolio or a loopback preview URL');
const out='test-results/body-atlas';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const results=[];
const expanded=JSON.parse(await readFile('../body-atlas-source/lib/whole-body-explanations.json','utf8'));
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
    assert.equal(await card.getByRole('link',{name:'Launch BODY//ATLAS'}).getAttribute('href'),'/atlas');
    await card.getByRole('link',{name:'BODY//ATLAS',exact:true}).click();
    await page.waitForURL('**/work/body-atlas');
    assert.equal(await page.getByRole('heading',{level:1}).innerText(),'BODY//ATLAS');
    assert.match(await page.locator('main').innerText(),/Provisional source-text contexts/);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://arjansinghpuniani.com/work/body-atlas');
    assert.equal(await page.getByRole('link',{name:'Read the recorded scope and validation'}).getAttribute('href'),'/documents/body-atlas-validation.json');
    const report=await page.request.get(base+'/documents/body-atlas-validation.json');
    assert.equal(report.status(),200);assert.equal((await report.json()).sourceContextEntries,652);
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
    await page.locator('.page-hero').getByRole('link',{name:'Launch interactive atlas'}).click();
    await page.waitForURL('**/atlas');
    await page.waitForSelector('[data-organs-status="loaded"]',{timeout:90000});
    assert.match(await page.getByTestId('scene-status').innerText(),/Reference loaded/);
    assert.equal(await page.getByText('Research preview',{exact:true}).isVisible(),true);
    await page.getByRole('button',{name:'Focus brain'}).click();
    await page.locator('.brain-shortcuts').getByRole('button',{name:/Thalamus/}).click();
    await page.getByRole('button',{name:'Inspect Activa Tremor Control System'}).click();
    const panel=page.getByRole('complementary',{name:'Interventions and evidence'});
    assert.equal(await panel.getByText('Model 7424 pulse generator',{exact:true}).isVisible(),true);
    assert.match(await panel.getByRole('link',{name:'FDA P960009',exact:true}).getAttribute('href'),/P960009/);
    await page.getByRole('button',{name:'Brief',exact:true}).click();
    const download=page.waitForEvent('download');
    await page.getByRole('link',{name:'Export Markdown',exact:true}).click();
    const file=await download;assert.equal(file.suggestedFilename(),'body-atlas-brief.md');
    const markdown=await readFile(await file.path(),'utf8');
    assert.match(markdown,/P960009/);assert.match(markdown,/Physical implantation/);assert.match(markdown,/SHA-256/);
    await page.getByRole('button',{name:'Close dialog'}).click();
    await page.getByRole('tab',{name:'Sources',exact:true}).click();
    await panel.getByText('Provenance and cached source',{exact:true}).first().click();
    const href=await panel.getByRole('link',{name:'Open authentic cached response'}).first().getAttribute('href');
    assert.match(href,/^\/atlas\/sources\/[a-f0-9]{64}\.json$/);
    const original=await page.request.get(base+href);assert.equal(original.status(),200);
    assert.equal(createHash('sha256').update(await original.body()).digest('hex'),href.split('/').pop().replace('.json',''));
    await page.getByRole('button',{name:'Questions',exact:true}).click();
    await page.getByRole('textbox',{name:'Search the indexed evidence'}).fill('Which authorized devices interface with the vagus nerve?');
    await page.getByRole('button',{name:'Search',exact:true}).click();
    assert.match(await page.getByRole('dialog').getByRole('status').innerText(),/VNS/);
    await page.getByRole('button',{name:'Close dialog'}).click();
    await page.getByRole('button',{name:'Atlas',exact:true}).click();
    await page.getByRole('combobox',{name:'Explore anatomical region',exact:true}).selectOption('BODY:airway');
    assert.equal(await page.locator('.intervention-choice').count(),2);
    await page.getByRole('button',{name:/Inspect Shiley/}).click();
    assert.equal(await panel.getByRole('heading',{name:'Airway management during surgery',exact:true}).isVisible(),true);
    assert.match(await panel.getByLabel('What this intervention does').innerText(),/breathing tubes.*airway access/);
    assert.match(await panel.getByRole('region',{name:'Why this region'}).innerText(),/does not establish an ocular application/);
    assert.equal(await panel.getByRole('link',{name:'Read the supporting FDA source'}).getAttribute('href'),'https://www.accessdata.fda.gov/cdrh_docs/pdf25/K250173.pdf');
    assert.ok((await panel.locator('.device-intro').innerText()).length<1600,'Summary must stay concise');
    await page.waitForSelector('[data-organs-status="loaded"]',{timeout:90000});
    assert.equal(await page.getByText('1 dated event',{exact:true}).isVisible(),true);
    await page.screenshot({path:`${out}/airway-${name}.png`});
    await page.getByRole('button',{name:'Interventions',exact:true}).last().click();
    await page.getByRole('combobox',{name:'Explore anatomical region',exact:true}).selectOption('BODY:eye');
    assert.ok(await page.locator('.intervention-choice').count()>0);
    assert.equal(await page.getByRole('button',{name:/Inspect Shiley/}).count(),0);
    await page.getByRole('combobox',{name:'Explore anatomical region',exact:true}).selectOption('BODY:elbow');
    assert.equal(await page.getByText('No source-backed intervention explanation has been prepared for this region yet.',{exact:true}).isVisible(),true);
    await page.getByRole('button',{name:'Browse unreviewed FDA text matches for this region'}).click();
    assert.equal(await page.getByRole('button',{name:/Inspect Shiley/}).count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    // Exercise every newly explained entry through region selection and its real inspector.
    const byRegion=new Map();
    for(const [id,entry] of Object.entries(expanded)) byRegion.set(entry.regions[0],[...(byRegion.get(entry.regions[0])||[]),[id,entry]]);
    let explainedChecked=0;
    await page.getByRole('button',{name:'Atlas',exact:true}).click();
    await page.getByRole('combobox',{name:name==='mobile'?'Map evidence layer':'Evidence layer',exact:true}).selectOption('explained');
    for(const [region,entries] of byRegion){
      await page.getByRole('button',{name:'Atlas',exact:true}).click();
      await page.getByRole('combobox',{name:'Explore anatomical region',exact:true}).selectOption(region);
      for(const [i,[id,entry]] of entries.entries()){
        if(i===0) await page.locator(`.intervention-choice[data-family="${id}"] .choose-intervention`).click();
        else await page.getByRole('combobox',{name:'Choose another intervention in this region',exact:true}).selectOption(id);
        assert.equal(await panel.getByRole('heading',{name:entry.title,exact:true}).isVisible(),true,id);
        assert.equal(await panel.getByLabel('What this intervention does').innerText(),entry.purpose,id);
        assert.ok((await panel.getByRole('region',{name:'Why this region'}).innerText()).includes(entry.relevance),id);
        const original=entry.sourceUrl || `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=${entry.recordId.split(':')[1]}`;
        assert.equal(await panel.getByRole('link',{name:'Read the supporting FDA source'}).getAttribute('href'),original,id);
        if(['BODY:uterus','BODY:vagina'].includes(region)) {
          assert.equal(await page.getByText('Text-only region: this male reference has no corresponding anatomy. No device position is shown.',{exact:true}).isVisible(),true);
          assert.equal(await page.locator(`.intervention-annotation[data-family="${id}"]`).count(),0);
        }
        explainedChecked++;
      }
    }
    assert.equal(explainedChecked,75);
    await page.getByRole('button',{name:'Atlas',exact:true}).click();
    await page.waitForSelector('[data-organs-status="loaded"]',{timeout:90000});
    const atlasAccessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(atlasAccessibility.violations,[]);
    await page.screenshot({path:`${out}/atlas-${name}.png`});
    assert.ok(geometry.some(url=>url.includes('/atlas/anatomy/body.glb')));
    assert.ok(geometry.every(url=>url.includes('/atlas/anatomy/')));
    assert.deepEqual(errors,[]);
    results.push({viewport:name,homeCard:true,caseStudy:true,workFilter:true,sources:true,canonical:true,horizontalOverflow:false,axeViolations:0,atlasLoaded:true,originalSourceHashVerified:true,briefDownload:true,retrieval:true,airwayRelevance:true,falseOcularMatchExcluded:true,explainedEntriesChecked:explainedChecked,pageErrors:errors});
    await context.close();
  }
  const context=await browser.newContext();
  for(const route of ['/','/work','/research','/about','/cv','/contact','/work/seizefreeze','/work/bci-calibration','/work/vector-ekg-reasonos','/playground','/playground/replisome','/playground/rally-house']) {
    const response=await context.request.get(base+route);assert.equal(response.status(),200,route);
  }
  const sitemap=await context.request.get(base+'/sitemap.xml');assert.match(await sitemap.text(),/https:\/\/arjansinghpuniani.com\/work\/body-atlas/);
  await context.close();
  await writeFile(`${out}/results.json`,JSON.stringify({site:base,results,existingRoutesChecked:12,sitemap:true,environment:'Installed Chrome; mobile is viewport/touch emulation, not a physical device.'},null,2)+'\n');
  console.log(JSON.stringify({results,existingRoutesChecked:12,sitemap:true},null,2));
} finally { await browser.close(); }
