import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'/tmp/rh-connections';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const report=[];
try{for(const profile of [{name:'desktop',width:1280,height:800},{name:'phone',width:390,height:844}]){
 const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:2,hasTouch:profile.name==='phone'}),page=await context.newPage(),row={profile:profile.name,errors:[],http:[]};report.push(row);
 page.on('pageerror',e=>row.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)row.http.push([r.status(),r.url()]);});
 await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:18080'}/?debug`);await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Arjan',{exact:true}).click();await page.locator('[data-arrival-action="explore"]').click();
 await page.evaluate(()=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.clock.minutes=1300;g.clock.paused=false;g.player.position.set(-7.3,0,3.5);g.player.path=[];const c=g.actor('leo');c.position.set(-6,0,3.5);c.path=[];for(const person of g.characters){person.yieldUntil=Infinity;person.currentScheduleIndex=-1;}});
 const select=async()=>{await page.locator('#game').focus();await page.keyboard.press('3');};
 const connect=async()=>{await select();await page.getByRole('button',{name:/Rizz & connect/}).click();};
 const click=async(name)=>{const button=page.getByRole('button',{name});if(profile.name==='phone')await button.tap();else await button.click();};
 const waitDone=async()=>page.waitForFunction(()=>!window.__rh.game.activities.active.some(a=>a.kind.startsWith('connection-')),null,{timeout:30000});
 await connect();assert.equal(await page.getByRole('button',{name:/Cozy together/}).count(),0);await click(/Rizz about tennis/);await waitDone();
 await connect();assert.equal(await page.getByRole('button',{name:/Cozy together/}).count(),0);await click(/Rizz about bonsai/);await waitDone();
 await select();await click(/Challenge to Match/);await page.waitForFunction(()=>window.__rh.championship().phase==='serving',null,{timeout:30000});
 // The input/gameplay path is covered by arrival-browser; use the real score/result path here.
 for(let n=0;n<7;n++){await page.waitForFunction(()=>['serving','rally'].includes(window.__rh.championship().phase));await page.evaluate(()=>window.__rh.championshipPoint('player'));}
 await page.waitForFunction(()=>window.__rh.championship().phase==='matchResult'&&window.__rh.game.relations.courtship('leo').won);
 await page.getByRole('button',{name:'Return to Club',exact:true}).first().click();await page.waitForFunction(()=>window.__rh.championship().phase==='inactive');
 await connect();await click(/Cozy together/);
 await page.waitForFunction(()=>window.__rh.game.activities.active.some(a=>a.kind==='connection-hug'&&a.phase==='active'&&a.phaseTime>.8),null,{timeout:30000});
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__rh.game.relations.courtship('leo').hugs),0);
 for(let n=1;n<=2;n++){
  await connect();assert.equal(await page.getByRole('button',{name:/💋 Mack/}).count(),0);await click(/Cozy together/);
  await page.waitForFunction(()=>window.__rh.game.activities.active.some(a=>a.kind==='connection-hug'&&a.phase==='active'&&a.phaseTime>.8),null,{timeout:30000});
  if(n===1)await page.screenshot({path:`${out}/hug-${profile.name}.png`});
  await waitDone();assert.equal(await page.evaluate(()=>window.__rh.game.relations.courtship('leo').hugs),n);
 }
 await connect();await page.waitForFunction(()=>getComputedStyle(document.getElementById('context')).opacity==='1');await page.screenshot({path:`${out}/unlocked-${profile.name}.png`});await click(/💋 Mack/);
 await page.waitForFunction(()=>window.__rh.game.activities.active.some(a=>a.kind==='connection-kiss'&&a.phase==='active'&&a.phaseTime>.8));await page.screenshot({path:`${out}/kiss-${profile.name}.png`});await waitDone();
 await page.evaluate(()=>window.__rh.game.save());await page.reload();await page.waitForFunction(()=>window.__rh?.ready);row.saved=await page.evaluate(()=>window.__rh.game.relations.courtship('leo'));assert.deepEqual(row.saved,{flirted:true,won:true,hugs:2});assert.equal(row.errors.length,0);assert.equal(row.http.length,0);
 await context.close();console.log(JSON.stringify(row));
}}finally{await browser.close();fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));}
