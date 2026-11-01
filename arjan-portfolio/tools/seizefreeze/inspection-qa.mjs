import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
import { access } from 'node:fs/promises';
import { homedir } from 'node:os';
import AxeBuilder from '@axe-core/playwright';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
const base=process.env.SEIZEFREEZE_BASE_URL||'http://127.0.0.1:3219';
const output=new URL('../../Documentation/Validation/SeizeFreeze/',import.meta.url);
await mkdir(output,{recursive:true});
const engine=process.env.SEIZEFREEZE_ENGINE||'chromium',type={chromium,firefox,webkit}[engine];assert.ok(type,'Supported browser engine required.');
const launch={headless:true,...(engine==='chromium'?{channel:'chromium',args:['--use-angle=metal']}:{})};
if(engine==='firefox'){try{await access(type.executablePath());}catch{launch.executablePath=homedir()+'/Library/Caches/ms-playwright/firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox';}}
const browser=await type.launch(launch);
const results=[];
try{for(const [width,height]of[[1440,1000],[768,1024],[390,844]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))failed.push(r.url());});
 await page.goto(base+'/seizefreeze-lab/index.html');await page.waitForFunction(()=>window.seizefreeze?.snapshot().stats?.frames>0,null,{timeout:60000});
 const snapshot=()=>page.evaluate(()=>window.seizefreeze.snapshot());
 const capture=async name=>{await page.locator('#scene').scrollIntoViewIfNeeded();await page.waitForTimeout(100);await page.screenshot({path:new URL(name,output).pathname});};
 assert.deepEqual((await snapshot()).stats.device.scale,[1,1,1]);assert.ok((await snapshot()).stats.device.rigidClearanceMm>=.3-1e-8);
 await capture(`inspection-${engine}-pass1-${width}-anatomy.png`);
 await page.locator('#assembly-tab').click();assert.equal((await snapshot()).stats.inspectionStage,true);
 await capture(`inspection-${engine}-pass1-${width}-assembly.png`);
 await page.locator('#focus-component').focus();await page.keyboard.press('Enter');
 await page.locator('#device-dimensions').click();
 const focuses=[];
 for(const[i,id]of['interface','coldplate','tec','heatpath','sensing','electronics','package'].entries()){
  await page.locator('#parts button').nth(i).click();const s=await snapshot();assert.equal(s.stats.focus,id);assert.ok(s.stats.cameraPosition.every(Number.isFinite));assert.deepEqual(s.stats.cameraUp,s.stats.normal);
  if(id==='tec'){await page.waitForFunction(()=>document.querySelector('[data-sf-label]').textContent.includes('8.8 mm'));assert.ok(!await page.locator('[data-sf-label]').textContent().then(t=>t.includes('12 mm housing')));}
  if(id==='package')assert.match(await page.locator('#scene-caption').innerText(),/Isolated component/);
  focuses.push({id,camera:s.stats.cameraPosition});
  if(['interface','tec','sensing','package'].includes(id))await capture(`inspection-${engine}-pass2-${width}-${id}.png`);
 }
 const beforeRotation=(await snapshot()).stats;await page.locator('#scene canvas').focus();await page.keyboard.press('ArrowRight');const afterRotation=(await snapshot()).stats;
 const axisProjection=s=>s.cameraPosition.reduce((value,p,i)=>value+(p-s.cameraTarget[i])*s.normal[i],0);
 assert.ok(Math.abs(axisProjection(beforeRotation)-axisProjection(afterRotation))<1e-6,'Keyboard rotation preserves elevation in the device frame.');
 await page.locator('#overview').click();assert.equal((await snapshot()).stats.focus,null);assert.equal(await page.locator('#focus-component').getAttribute('aria-pressed'),'false');
 for(let i=0;i<7;i++){await page.locator('#parts button').nth(i).click();await page.locator('#seat').click();}
 assert.equal((await snapshot()).stats.exploded,false);await capture(`inspection-${engine}-pass2-${width}-complete.png`);
 await page.locator('#lab-tab').click();await page.evaluate(()=>window.seizefreeze.goTo(45));const prior=await snapshot();assert.ok(prior.frame.current>0);
 await page.locator('[data-depth=model]').click();await page.locator('#sensitivity-study summary').click();
 await page.waitForFunction(()=>window.seizefreeze.sensitivity()?.axis==='rejectionResistance');
 let sensitivity=await page.evaluate(()=>window.seizefreeze.sensitivity());assert.deepEqual(sensitivity.runs.map(r=>r.parameter),[2,8,32]);
 assert.equal(await page.locator('#sensitivity-table tr').count(),3);
 for(const run of sensitivity.runs)assert.ok(run.summary.maxResidual<1e-8);
 await page.locator('#sensitivity-study').scrollIntoViewIfNeeded();await page.screenshot({path:new URL(`inspection-${engine}-pass3-${width}-rejection.png`,output).pathname,fullPage:width<761});
 await page.locator('[data-sensitivity=contactResistance]').click();await page.waitForFunction(()=>window.seizefreeze.sensitivity()?.axis==='contactResistance');
 sensitivity=await page.evaluate(()=>window.seizefreeze.sensitivity());assert.deepEqual(sensitivity.runs.map(r=>r.parameter),[1,4,16]);
 const downloadPromise=page.waitForEvent('download');await page.locator('#download-sensitivity').click();const download=await downloadPromise;
 const csv=await readFile(await download.path(),'utf8');assert.equal(csv.split('\n').length,7204);assert.match(csv,/^status,axis,effectiveResistance_K_per_W/);assert.ok(csv.includes('simulated_assumptions,contactResistance,16,'));const csvRows=csv.split('\n').map(row=>row.split(',')),header=csvRows[0];assert.equal(csvRows[1][header.indexOf('contactInput_K_per_W')],'1');assert.equal(csvRows[1][header.indexOf('scenario')],'event');assert.equal(csvRows[1][header.indexOf('currentLimit_A')],'0.32');
 const axes=sensitivity.runs.map(r=>({parameter:r.parameter,minTissue:r.endpoints.minimumSuperficialCell,maxHot:r.endpoints.peakHot,energy:r.summary.electricalEnergy}));
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(scan.violations,[]);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 if(width===1440){await page.locator('#parameter-details summary').click();await page.locator('#contactResistance').fill('8');await page.locator('#contactResistance').dispatchEvent('change');await page.locator('#contactResistance').fill('12');await page.locator('#contactResistance').dispatchEvent('change');await page.waitForFunction(()=>window.seizefreeze.sensitivity()?.runs[1].params.contactResistance===12);assert.deepEqual(await page.evaluate(()=>window.seizefreeze.sensitivity().runs.map(r=>r.parameter)),[3,12,48]);}
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 results.push({width,height,physicalPhoneTest:false,focuses,sensitivity:axes,csvRows:7204,axeViolations:0,errors,failed});await context.close();
}}finally{await browser.close();}
await writeFile(new URL(`inspection-${engine}-results.json`,output),JSON.stringify({base,engine,passed:true,results},null,2));console.log(JSON.stringify({passed:true,viewports:results.map(r=>r.width)}));
