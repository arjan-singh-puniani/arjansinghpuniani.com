import assert from 'node:assert/strict';import fs from 'node:fs';
export async function safety(page){
 const results=[];
 for(const kind of ['lesson','tea']){
  const before=await page.evaluate(async kind=>{const g=window.__rh.game;g.clock.paused=true;for(const a of [...g.activities.active])g.cancelActivity(a);const a=kind==='lesson'?(g.beginLesson('dropFeed'),g.activities.active.find(a=>a.kind==='lesson')):g.startBreak();if(!a)throw Error('Could not start '+kind);g.clock.paused=false;for(let i=0;i<60*30&&a.phase!=='active';i++)g.updateFixed(1/60);g.clock.paused=true;if(a.phase!=='active')throw Error('Did not arrive '+a.phase);await g.save();return {phase:a.phase,progress:g.mikaProgress,coins:g.coins,history:g.activities.history.length};},kind);
  await page.reload();await page.waitForFunction(()=>window.__rh?.ready);const after=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;return {active:g.activities.active.length,progress:g.mikaProgress,coins:g.coins,history:g.activities.history.length}});
  assert.equal(after.active,0);assert.equal(after.progress,before.progress);assert.equal(after.coins,before.coins);assert.equal(after.history,before.history);results.push({kind,before,after});
 }
 fs.writeFileSync('qa/reload-safety.json',JSON.stringify(results,null,2));console.log('RELOAD SAFETY PASSED');
}
