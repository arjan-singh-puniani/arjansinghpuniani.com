import {enterClub} from './enter-club.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'evidence/gait-20261016/vectorcourt';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:900}}),page=await context.newPage(),report={width,errors:[],http:[]};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.http.push([r.status(),r.url()]);});
 try{
  await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);await enterClub(page,'Taylor');await page.locator('#loading').waitFor({state:'hidden'});
  await page.evaluate(()=>{const g=window.__rh.game;window.entryWorld={world:g.world,cast:[...g.characters]};});
  const entry=page.getByRole('button',{name:'Analyze swing with VectorCourt',exact:true});assert.equal(await entry.locator('span').textContent(),'VectorCourt');assert(await entry.locator('span').isVisible());
  await page.waitForTimeout(700);await page.screenshot({path:`${out}/${width}-toolbar.png`});await entry.click();await page.waitForTimeout(1200);
  const find=page.getByRole('button',{name:'Find Performance Lab ↗',exact:true});if(!await page.locator('[data-action=analyze]').isVisible())await find.click();
  await page.locator('[data-action=analyze]').click();
  // Advance only the walk to the existing physical instrument; replay uses RAF.
  await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<6000&&!g.performanceLab.active;i++)g.updateFixed(1/60);});
  await page.locator('.performance-lab').waitFor({state:'visible'});assert.equal(await page.locator('#labTitle').textContent(),'Analyze your swing.');
  await page.getByRole('button',{name:'VectorCourt',exact:true}).click();
  report.court=await page.evaluate(()=>{const g=window.__rh.game;return {kind:g.performanceLab.timeline.clip.kind,mode:g.performanceLab.timeline.mode,sameWorld:g.world===window.entryWorld.world&&g.characters.every((c,i)=>c===window.entryWorld.cast[i])};});assert.equal(report.court.kind,'forehand');assert.equal(report.court.mode,'court');assert(report.court.sameWorld);
  await page.screenshot({path:`${out}/${width}-court.png`});
  await page.getByRole('button',{name:'AnatomyMotion',exact:true}).click();await page.locator('[data-joint=elbow]').click();await page.locator('.lab-transport input').fill('500');
  report.body=await page.evaluate(()=>{const l=window.__rh.game.performanceLab;return {mode:l.timeline.mode,focus:l.timeline.focus,readout:document.querySelector('.lab-readout').textContent,overflow:document.documentElement.scrollWidth>innerWidth};});assert.equal(report.body.mode,'body');assert.equal(report.body.focus,'elbow');assert.match(report.body.readout,/\d/);assert(!report.body.overflow);
  await page.screenshot({path:`${out}/${width}-body.png`});assert(await page.locator('.lab-record').isVisible());
  await page.locator('#labSource').selectOption('serve');assert.equal(await page.evaluate(()=>window.__rh.game.performanceLab.timeline.clip.kind),'serve');
  const {default:AxeBuilder}=await import('../../arjan-portfolio/node_modules/@axe-core/playwright/dist/index.js');report.axe=(await new AxeBuilder({page}).analyze()).violations.map(v=>v.id);assert.deepEqual(report.axe,[]);
  await page.locator('header [data-lab-action=close]').click();assert(await entry.isEnabled());assert.deepEqual(report.errors,[]);assert.deepEqual(report.http,[]);report.passed=true;
 }catch(error){report.failure=error.message;throw error;}finally{fs.writeFileSync(`${out}/${width}-report.json`,JSON.stringify(report,null,2)+'\n');await context.close();}
 console.log(JSON.stringify(report));
}}finally{await browser.close();}
