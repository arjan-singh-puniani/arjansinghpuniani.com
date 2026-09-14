import assert from 'node:assert/strict';import fs from 'node:fs';
export async function verifyNight(page){
 await page.evaluate(()=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.clock.minutes=1260;g.observationStarted=true;g.clock.paused=false;g.everyday.next=g.everyday.time+1;});
 const start=Date.now(),rows=[];
 do{await page.waitForTimeout(10000);const data=await page.evaluate(()=>{const g=window.__rh.game;return {telemetry:g.telemetry.report(),activities:g.activities.serialize(),report:window.__rh.report()};});rows.push({seconds:(Date.now()-start)/1000,...data});fs.writeFileSync('qa/v15-night-browser.json',JSON.stringify({kind:'real-time after-hours observation; clock staged at 21:00',rows},null,2));}while(Date.now()-start<180000);
 const last=rows.at(-1);assert(last.telemetry.meaningful>=2);assert(!last.activities.history.some(a=>a.phase==='completed'&&['lesson','match'].includes(a.kind)));assert(!last.activities.history.some(a=>a.phase==='interrupted'&&a.kind==='everyday'));await page.screenshot({path:'qa/v15-night-life.png',timeout:60000});console.log('AFTER-HOURS REAL-TIME LIFE PASSED',last.telemetry.scenes);
}
