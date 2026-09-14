import assert from 'node:assert/strict';import fs from 'node:fs';
export async function verifyCoaching(page){
 const start=Date.now(),rows=[];
 const snapshot=()=>page.evaluate(()=>{const g=window.__rh.game;return {progress:g.mikaProgress,queued:g.queuedLesson,active:g.activities.active.map(a=>({id:a.id,kind:a.kind,phase:a.phase})),clock:g.clock.serialize(),characters:g.characters.map(c=>({id:c.id,state:c.state,position:c.position})),history:g.activities.history.filter(a=>a.kind==='lesson'),reps:g.evidence.reps.length,philosophy:g.mind.philosophy};});
 const before=await snapshot();await page.click('#coachBtn');await page.getByText('Drop-feed timing',{exact:true}).click();
 await page.waitForFunction(()=>window.__rh.game.queuedLesson||window.__rh.game.activities.active.some(a=>a.kind==='lesson'));
 const selected=await snapshot();assert.equal(selected.progress,before.progress,'Selection itself granted progress');
 await page.screenshot({path:'qa/v15-coaching-selected.png',timeout:60000});
 await page.waitForFunction(()=>window.__rh.game.activities.history.some(a=>a.kind==='lesson'&&a.phase==='completed'),null,{timeout:180000,polling:1000});
 const completed=await snapshot();assert(completed.progress>before.progress);rows.push({seconds:(Date.now()-start)/1000,kind:'timing',before,selected,completed});
 // Stage the boundary condition, but select the lesson through actual UI and let real time run.
 await page.evaluate(()=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.clock.minutes=1285;g.history.nextSocial=1e12;g.history.nextObject=1e12;g.everyday.next=1e12;g.startEveryday(g.everyday.scenes(g.lifeContext()).find(s=>s.id==='notes'));g.everyday.next=1e12;});
 await page.click('#coachBtn');await page.getByText('Movement + recovery',{exact:true}).click();
 const queued=await snapshot();assert.equal(queued.queued,'movement','Busy Contessa did not retain the request');
 for(let i=0;i<20;i++){const state=await snapshot();fs.writeFileSync('qa/v15-ui-coaching-progress.json',JSON.stringify({before,selected,completed,queued,state,seconds:(Date.now()-start)/1000},null,2));console.log('COACHING',Math.round((Date.now()-start)/1000),JSON.stringify(state));if(state.history.filter(a=>a.phase==='completed').length>=2)break;await page.waitForTimeout(10000);}
 const terminal=await snapshot();if(terminal.history.filter(a=>a.phase==='completed').length<2){await page.screenshot({path:'qa/v15-coaching-failure.png',timeout:60000});throw Error('Queued lesson did not complete; see progress snapshot');}
 const after=await snapshot();assert.equal(after.philosophy.recovery,1);rows.push({seconds:(Date.now()-start)/1000,kind:'after-hours queued movement',queued,after});
 await page.click('#bookBtn');await page.click('[data-tab="coaching"]');await page.screenshot({path:'qa/v15-coaching-evidence.png',timeout:60000});
 fs.writeFileSync('qa/v15-ui-coaching.json',JSON.stringify({kind:'real-time UI selection; second case stages closing time and a busy coach',elapsedSeconds:(Date.now()-start)/1000,rows},null,2));console.log('UI SELECTED TWO LESSONS, ACTUAL CONTACTS COMPLETED, AFTER-HOURS QUEUE RESOLVED');
}
