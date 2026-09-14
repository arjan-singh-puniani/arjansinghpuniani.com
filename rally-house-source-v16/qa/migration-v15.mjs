import assert from 'node:assert/strict';import fs from 'node:fs';
export async function verifyMigration(page,switchBuild){
 // The initial page is the compiled build extracted from the supplied canonical ZIP.
 const before=await page.evaluate(async()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<600*60;i++)g.updateFixed(1/60);g.clock.paused=true;g.place('bench',-5,2);await g.save();const envelope=await g.saveSystem.load();return {version:envelope.version,state:g.snapshot()};});
 assert.equal(before.version,6);assert(before.state.activities.history.length>0);
 await page.addInitScript(()=>{Object.defineProperty(window,'__rh',{configurable:true,set(value){Object.defineProperty(window,'__rh',{value,writable:true,configurable:true});value.game.clock.paused=true;}});});
 switchBuild();await page.reload();await page.waitForFunction(()=>window.__rh?.ready);
 const after=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;return g.snapshot();});
 for(const key of ['coins','mikaProgress','equipment','placements','relationships','activities','history','development','everyday'])assert.deepEqual(after[key],before.state[key],`${key} changed in migration`);
 assert(after.mind&&after.mind.possessions.length===5);assert.equal(after.mind.events.length,0,'Legacy migration invented a witness');
 const version=await page.evaluate(async()=>{const g=window.__rh.game;await g.save();return (await g.saveSystem.load()).version;});assert.equal(version,7);
 fs.writeFileSync('qa/v15-actual-legacy-migration.json',JSON.stringify({from:before.version,to:version,before:before.state,after},null,2));console.log('ACTUAL CANONICAL V14.1 BROWSER SAVE MIGRATED TO V15 WITHOUT LOST CONSEQUENCES');
}
