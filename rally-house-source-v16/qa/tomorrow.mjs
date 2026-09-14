import assert from 'node:assert/strict';import fs from 'node:fs';
export async function tomorrow(page){
 const snapshot=JSON.parse(fs.readFileSync('qa/verification.json','utf8')).snapshot;
 await page.evaluate(async snapshot=>{const g=window.__rh.game;g.clock.paused=true;await g.saveSystem.save(snapshot);},snapshot);
 await page.reload();await page.waitForFunction(()=>window.__rh?.ready);
 const data=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;for(const a of [...g.activities.active])g.cancelActivity(a);const before=g.history.matches.length;g.clock.day=2;g.clock.minutes=535;g.history.nextSocial=0;g.clock.paused=false;for(let i=0;i<240*60;i++)g.updateFixed(1/60);g.clock.paused=true;return {before,after:g.history.matches.length,matches:g.history.matches,activities:g.activities.serialize(),objects:g.affordances.serialize(),intentions:g.history.intentions};});
 assert(data.after>data.before);assert.equal(data.matches[0].day,2);fs.writeFileSync('qa/tomorrow.json',JSON.stringify(data,null,2));console.log('TOMORROW PASSED',data.matches[0]);
}
