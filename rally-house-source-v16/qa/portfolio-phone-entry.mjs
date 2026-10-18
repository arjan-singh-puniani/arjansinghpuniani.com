import {enterClub} from './enter-club.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs';import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'evidence/phone-anchor-20261011';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),context=await browser.newContext(),page=await context.newPage(),report={errors:[],http:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.http.push([r.status(),r.url()]);});
try{
 await page.goto('http://127.0.0.1:3096/playground/rally-house',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Play Rally House ↗',exact:true}).click();await page.locator('iframe[title="Play Rally House"]').waitFor();
 await enterClub(page.frameLocator('iframe[title="Play Rally House"]'),'Arjan');
 const frame=page.frames().find(f=>f.url().includes('/rally-house/index.html'));assert(frame);await frame.locator('#loading').waitFor({state:'hidden'});await frame.locator('#labBtn').click();await page.waitForTimeout(250);const find=frame.getByRole('button',{name:'Find Performance Lab ↗',exact:true});if(await find.isVisible())await find.click();await frame.locator('[data-action=capture]').waitFor({state:'visible'});
 report.owner=await page.getByText('Three apps by Arjan Singh Puniani',{exact:true}).textContent();report.ready=await frame.locator('[data-action=capture]').isVisible();
 assert(report.ready);assert.deepEqual(report.errors,[]);assert.deepEqual(report.http,[]);
}finally{fs.writeFileSync(`${out}/portfolio-entry.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(report);
