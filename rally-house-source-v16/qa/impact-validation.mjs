import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium,browserOptions} from './runtime.mjs';
const output=path.resolve('../takeover-evidence/impact-20261009'),report={viewports:[],cycles:[],errors:[]};
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const widths=[[844,390],[1920,1080],[1728,1117],[1440,900],[1280,800],[1024,768],[430,932],[390,844],[720,900]];
try{
 for(const [width,height] of widths.filter(([width])=>!process.env.QA_WIDTH||width===Number(process.env.QA_WIDTH))){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1100,reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:3096/playground/rally-house');
  assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const {default:AxeBuilder}=await import('../../arjan-portfolio/node_modules/@axe-core/playwright/dist/index.js');
  const axe=await new AxeBuilder({page}).analyze();assert.deepEqual(axe.violations,[]);
  await page.getByRole('button',{name:'Play Rally House ↗'}).click();await page.frameLocator('iframe').getByText('Arjan',{exact:true}).click();
  const frame=page.frames().find(f=>f.url().includes('/rally-house/index.html'));
  // Production deliberately has no debug hooks; inspect the shipped controls
  // through the real character card and challenge button.
  assert.equal(await frame.evaluate(()=>typeof window.__rh),'undefined');
  await frame.locator('canvas').press('3');
  await page.waitForTimeout(250);
  const find=frame.getByRole('button',{name:'Find Leo ↗'});
  if(await find.isVisible())await find.click();
  await page.waitForTimeout(250);
  await page.screenshot({path:path.join(output,`selection-${width}.png`)});
  const challenge=frame.locator('#spatialCard button[data-action="challenge"]');
  await challenge.waitFor({state:'visible'});await challenge.focus();await challenge.press('Enter');
  await frame.locator('.championshipHud[data-phase="serving"]').waitFor({timeout:60000});
  const shipped=await frame.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,score:document.querySelector('.championshipScore').textContent,motion:document.querySelector('.championshipHud').dataset.motion,styles:[...document.styleSheets].map(s=>s.href)}));
  assert(!shipped.overflow);assert.equal(shipped.motion,'reduced');assert(shipped.styles.some(s=>s.endsWith('/championship.css')));
  await page.screenshot({path:path.join(output,`shipped-${width}.png`)});
  await frame.locator('.championshipExit').click();await frame.locator('.championshipHud').waitFor({state:'hidden'});
  report.viewports.push({width,height,axe:axe.violations.length,...shipped});await context.close();console.log('Shipped viewport PASS',width,height);
 }
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:8078/?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Arjan',{exact:true}).click();
 report.cycles=await page.evaluate(()=>{
  const g=window.__rh.game,rows=[];g.autosave=-10000;g.clock.paused=true;
  for(let cycle=0;cycle<16;cycle++){
   const opponent=['leo','coach','mika','nia'][cycle%4];g.settings.reducedMotion=cycle>=8;
   for(const a of [...g.activities.active])g.cancelActivity(a);const saved=g.camera.captureState();g.startChampionship(g.actor(opponent));
   for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);
   if(g.championship.phase!=='serving')throw Error('Entry '+cycle);
   const m=g.interactiveMatch;m.prepareShot('player','serve','perfect');
   for(let i=0;i<120&&!m.pending.impactStarted;i++)g.updateFixed(1/120);
   if(!m.pending?.impactStarted||!g.player.contactHoldRemaining)throw Error('No held contact '+cycle);
   const heldAtExit=g.player.contactHoldRemaining;g.requestChampionshipExit();for(let i=0;i<200;i++)g.updateFixed(1/60);
   rows.push({cycle,opponent,heldAtExit,holdAfter:g.player.contactHoldRemaining,active:g.championship.active,reserved:g.activities.reserved('court'),input:g.matchInput.enabled,match:!!g.interactiveMatch,impulse:!!g.championshipCamera.renderImpulse(),cameraRestored:JSON.stringify(saved)===JSON.stringify(g.camera.captureState()),dom:document.querySelectorAll('*').length});
  }return rows;
 });
 for(const row of report.cycles)assert(!row.active&&!row.reserved&&!row.input&&!row.match&&!row.impulse&&row.holdAfter===0&&row.cameraRestored);
 assert.equal(new Set(report.cycles.map(r=>r.dom)).size,1);assert.deepEqual(report.errors,[]);
 console.log('16 exits during held contact with all opponents and motion modes PASS');
 report.audio=await page.evaluate(async()=>{
  const {AudioManager}=await import('./dist/core/AudioManager.js');const a=new AudioManager();a.volume=0;a.tennisImpact();const mutedContextAbsent=!a.ctx;a.volume=.65;
  for(let i=0;i<120;i++)a.tennisImpact(['perfect','clean','defensive','frame'][i%4]);
  const buffers=[...a.tennisMaterialBuffers.values()].flat(),peaks=buffers.map(b=>Math.max(...b.getChannelData(0).map(Math.abs)));await new Promise(r=>setTimeout(r,180));a.dispose();
  return {mutedContextAbsent,cached:buffers.length,peaks,disposed:!a.ctx&&a.tennisMaterialBuffers.size===0};
 });assert(report.audio.mutedContextAbsent&&report.audio.disposed);assert.equal(report.audio.cached,12);assert(report.audio.peaks.every(p=>p<=.921));
 report.packageReloads=0;
 for(let i=0;i<5;i++){
  await page.goto('http://127.0.0.1:8079/?debug');await page.waitForFunction(()=>window.__rh?.ready);if(await page.getByText('Arjan',{exact:true}).isVisible())await page.getByText('Arjan',{exact:true}).click();
  assert(await page.evaluate(async()=>{const {tennisImpactSignal}=await import('./dist/core/TennisImpactSound.js');return tennisImpactSignal('perfect',0,48000).length>0&&[...document.styleSheets].some(s=>s.href?.endsWith('/championship.css'));}));report.packageReloads++;
 }
 assert.deepEqual(report.errors,[]);console.log('12 bounded audio buffers, disposal, and five extracted-package reloads PASS');
}finally{fs.writeFileSync(path.join(output,'validation.json'),JSON.stringify(report,null,2));await browser.close();}
