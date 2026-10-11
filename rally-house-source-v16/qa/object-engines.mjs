import fs from 'node:fs';
import path from 'node:path';
import {homedir} from 'node:os';
import assert from 'node:assert/strict';
import {firefox,webkit} from './runtime.mjs';
const output=path.resolve('../takeover-evidence/objects-20261010');fs.mkdirSync(output,{recursive:true});
const report=[];
for(const [name,engine,executable] of [
 ['firefox',firefox,'firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox'],
 ['webkit',webkit,'webkit-2359/pw_run.sh'],
]){
 const row={engine:name,errors:[],requests:[],flows:[]};report.push(row);let browser;
 try{
  browser=await engine.launch({headless:true,executablePath:path.join(homedir(),'Library/Caches/ms-playwright',executable)});
  for(const [width,height] of [[1280,800],[390,844],[844,390]]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>row.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)row.requests.push([r.status(),r.url()]);});
   await page.goto('http://127.0.0.1:8078/?debug');await page.waitForFunction(()=>window.__rh?.ready,{},{timeout:15000});await page.getByText('Arjan',{exact:true}).click();
   await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.openBook();});await page.locator('button[data-tab="details"]').click();await page.getByRole('button',{name:'Club clock A brass-hearted',exact:false}).click();
   // Selection and camera travel are rendered on RAF; await that before deciding whether Find is needed.
   await page.waitForTimeout(350);const find=page.getByRole('button',{name:/Find Club clock/});if(await find.isVisible())await find.click();
   await page.waitForFunction(()=>{const c=document.querySelector('#spatialCard'),b=c.getBoundingClientRect();return !c.hidden&&b.x>=0&&b.y>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1;},{},{timeout:5000});
   const box=await page.locator('#spatialCard').boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);
   await page.locator('#spatialCard button[data-action="inspect"]').focus();await page.keyboard.press('Enter');assert(await page.evaluate(()=>window.__rh.game.activities.active.some(a=>a.kind==='touch')));
   const completed=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<4000&&g.activities.busy('player');i++)g.updateFixed(1/60);g.clock.paused=true;return {uses:g.world.identity.state('clubClock').uses,active:g.world.authored.clock.active};});assert.equal(completed.uses,1);assert.equal(completed.active,false);
   await page.screenshot({path:path.join(output,`${name}-${width}x${height}.png`)});row.flows.push({width,height,box,...completed});await context.close();
  }
  assert.deepEqual(row.errors,[]);assert.deepEqual(row.requests,[]);row.status='passed';console.log(name,'PASS',row.flows.length,'layouts and native keyboard object actions');
 }catch(error){row.status='failed';row.failure=String(error);console.error(name,row.failure);process.exitCode=1;}
 finally{await browser?.close();fs.writeFileSync(path.join(output,'engines.json'),JSON.stringify(report,null,2));}
}
