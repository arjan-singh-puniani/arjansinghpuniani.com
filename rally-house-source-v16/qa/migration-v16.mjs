import assert from 'node:assert/strict';import fs from 'node:fs';
export async function migrate(page,switchBuild){
 const before=await page.evaluate(async()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<600*60;i++)g.updateFixed(1/60);g.clock.paused=true;g.place('bench',-5,2);await g.save();return {version:(await g.saveSystem.load()).version,state:g.snapshot()};});assert.equal(before.version,7);
 await page.addInitScript(()=>{Object.defineProperty(window,'__rh',{configurable:true,set(value){Object.defineProperty(window,'__rh',{value,writable:true,configurable:true});value.game.clock.paused=true;}})});
 switchBuild();await page.reload();await page.waitForFunction(()=>window.__rh?.ready);const after=await page.evaluate(()=>window.__rh.game.snapshot());
 for(const key of ['coins','mikaProgress','equipment','placements','relationships','activities','history','development'])assert.deepEqual(after[key],before.state[key],key+' changed');
 assert.deepEqual(after.mind.events,before.state.mind.events);const count=memories=>memories.reduce((n,m)=>n+(m.count??1),0);assert.equal(count(after.mind.memories),count(before.state.mind.memories));for(const m of before.state.mind.memories.filter(m=>m.importance>=.7))assert(after.mind.memories.some(n=>n.id===m.id&&n.detail===m.detail));await page.evaluate(()=>window.__rh.game.save());
 fs.writeFileSync('qa/v16-migration.json',JSON.stringify({from:before.version,to:7,preserved:['progress','equipment','placements','relationships','activities','history','development','events','memory occurrence counts and important details'],before:before.state,after},null,2));console.log('Canonical v15 save adopted by v16 without lost consequences.');
}
