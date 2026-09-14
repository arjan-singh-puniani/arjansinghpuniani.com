import assert from 'node:assert/strict';import fs from 'node:fs';
export async function presence(page){
 const results={twoTabs:[],errors:[]};await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.ui.closeContext()});
 const second=await page.context().newPage();second.on('pageerror',e=>results.errors.push(e.message));await second.goto(page.url());await second.waitForFunction(()=>window.__rh?.ready);await second.evaluate(()=>{window.__rh.game.clock.paused=true;window.__rh.game.ui.closeContext()});
 for(const fallback of [false,true]){const key='qa-tabs-'+Date.now();for(const p of [page,second])await p.evaluate(async({key,fallback})=>{const {SaveSystem}=await import('./dist/persistence/SaveSystem.js');window.testSave=new SaveSystem(key);await window.testSave.load();if(fallback)window.testSave.idbPut=async()=>{throw Error('Injected IDB write failure')};},{key,fallback});
 const outcomes=await Promise.all([page.evaluate(async()=>{try{await window.testSave.save({coins:111});return 'saved'}catch(e){return e.name}}),second.evaluate(async()=>{try{await window.testSave.save({coins:222});return 'saved'}catch(e){return e.name}})]);
 assert.equal(outcomes.filter(x=>x==='saved').length,1);assert.equal(outcomes.filter(x=>x==='SaveConflictError').length,1);
 const saved=await second.evaluate(async key=>{const {SaveSystem}=await import('./dist/persistence/SaveSystem.js');return (await new SaveSystem(key).load()).state.coins},key);assert.equal(saved,outcomes[0]==='saved'?111:222);results.twoTabs.push({fallback,outcomes,saved});}
 await second.close();await page.click('#bookBtn');await page.keyboard.press('Escape');results.focusReturned=await page.evaluate(()=>document.activeElement.id==='bookBtn');assert(results.focusReturned);
 await page.setViewportSize({width:390,height:844});await page.click('#bookBtn');results.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(results.overflow,false);await page.screenshot({path:'qa/v16-mobile-book.png'});await page.keyboard.press('Escape');
 results.liveCaption=await page.locator('[aria-live="polite"]').count();assert(results.liveCaption>0);assert.deepEqual(results.errors,[]);
 fs.writeFileSync('qa/v16-presence-browser.json',JSON.stringify(results,null,2));console.log('Two real tabs: primary and fallback reject stale writes; focus return and mobile layout passed.',results);
}
