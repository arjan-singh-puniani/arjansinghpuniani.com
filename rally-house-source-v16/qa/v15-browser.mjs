import fs from 'node:fs';import assert from 'node:assert/strict';
export async function verifyLife(page){
 const data=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<600*60;i++)g.updateFixed(1/60);g.clock.paused=true;return {telemetry:g.telemetry.report(),mind:g.mind.serialize(),history:g.activities.serialize()};});
 assert(data.telemetry.uniquePairs>=3);assert(data.telemetry.uniqueLocations>=4);assert(data.telemetry.scenes['witness-followup']>=1);assert.equal(data.telemetry.cancellations,0);
 fs.writeFileSync('qa/v15-browser-simulation.json',JSON.stringify(data,null,2));
 // Stage real completed bench visits before checking the composed favorite scene.
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;g.clock.minutes=700;g.observationStarted=true;for(const a of [...g.activities.active])g.cancelActivity(a);g.routineNotices.clear();g.place('bench',-5,2);const p=g.world.placements.find(p=>p.type==='bench');if(!p)throw Error('Bench placement failed');
  for(let visit=0;visit<3;visit++){for(const a of [...g.activities.active])g.cancelActivity(a);g.history.nextSocial=1e12;g.everyday.next=1e12;const a=g.startBreak(p,'mika','nia');if(!a)throw Error('Bench visit failed');g.history.nextObject=1e12;for(let i=0;i<70*60;i++)g.updateFixed(1/60);if(a.phase!=='completed')throw Error('Bench visit incomplete');}
  for(const a of [...g.activities.active])g.cancelActivity(a);const scene=g.grammar.compose(g.mind,g.sceneContext()).find(s=>s.family==='shared-break'&&s.objectId===p.id&&s.people[0]==='nia'&&s.people[1]==='mika');if(!scene)throw Error('No familiar shared break');const a=g.startEveryday(scene);g.history.nextObject=1e12;g.everyday.next=1e12;for(let i=0;i<2400;i++){g.updateFixed(1/60);if(a.phase==='active'&&g.lifeRuns.get(a.id).beat===1)break;}if(a.phase!=='active')throw Error('Shared break not active');g.clock.paused=true;g.camera.focus(-5,2,22);for(let i=0;i<180;i++)g.camera.update(1/60);
 });
 await page.screenshot({path:'qa/v15-favorite-bench.png',timeout:60000});
 const posture=await page.evaluate(()=>{const g=window.__rh.game;return ['mika','nia'].map(id=>({id,state:g.actor(id).state,depth:g.actor(id).seatDepth,animTime:g.actor(id).animTime}));});assert(posture.every(c=>c.state==='sit'&&c.depth===.8&&c.animTime>1));
 await page.click('#bookBtn');await page.click('[data-tab="people"]');await page.screenshot({path:'qa/v15-member-book.png',timeout:60000});assert((await page.locator('#bookContent').innerText()).includes('Favorite place'));
 await page.keyboard.press('Escape');
 // Partial-activity reloads must not turn unfinished work into completed consequences.
 const reloads=[];
 for(const kind of ['social','lesson','walking','match','build']){
  const before=await page.evaluate(async kind=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.routineNotices.clear();g.clock.minutes=700;g.clock.paused=false;g.history.nextSocial=1e12;g.history.nextObject=1e12;g.everyday.next=1e12;g.queuedLesson=null;
   if(kind==='social')g.startEveryday(g.everyday.scenes(g.lifeContext()).find(s=>s.id==='notes'));
   if(kind==='lesson')g.beginLesson('dropFeed');
   if(kind==='match')g.startMatch();
   if(kind==='walking')g.player.goTo(g.actor('nia').position.clone(),'idle');
   if(kind==='build'){g.ui.toggleBuild(true);g.buildType='plant';}
   if(['social','lesson','match'].includes(kind)){const a=g.activities.active[0];if(!a)throw Error(`Cannot start ${kind}`);for(let i=0;i<2400&&a.phase!=='active';i++)g.updateFixed(1/60);if(a.phase!=='active')throw Error(`Cannot activate ${kind}`);}
   g.clock.paused=true;await g.save();return {progress:g.mikaProgress,receipts:g.mind.receipts.length,events:g.mind.events.length,objects:g.world.placements.length,coins:g.coins};
  },kind);
  await page.reload();await page.waitForFunction(()=>window.__rh?.ready);const after=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;return {progress:g.mikaProgress,receipts:g.mind.receipts.length,events:g.mind.events.length,objects:g.world.placements.length,coins:g.coins};});assert.deepEqual(after,before,`${kind} duplicated a consequence on reload`);reloads.push({kind,before,after});
 }
 // Persist an explicit queued request without letting the director consume it first.
 await page.evaluate(async()=>{const g=window.__rh.game;g.clock.paused=true;g.queuedLesson='movement';g.mind.states.mika.confidence=.37;await g.save();});
 await page.reload();await page.waitForFunction(()=>window.__rh?.ready);
 const queued=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;return {request:g.queuedLesson,confidence:g.mind.states.mika.confidence,lesson:g.activities.active.some(a=>a.kind==='lesson')};});
 assert(queued.request==='movement'||queued.lesson,'Queued request disappeared');assert(Math.abs(queued.confidence-.37)<.01,'Mood carry-over disappeared');
 await page.evaluate(async()=>{const g=window.__rh.game;const s=g.snapshot();s.mind.states.nia.comfort='invalid';await g.saveSystem.save(s);});
 await page.reload();await page.getByText('Rally House could not open',{exact:true}).waitFor();assert((await page.locator('#loading').innerText()).includes('Character-life save is invalid'));
 fs.writeFileSync('qa/v15-browser-reloads.json',JSON.stringify({posture,reloads,queued,corruptMind:'rejected visibly'},null,2));console.log('V15 BROWSER LIFE, FAVORITE POSES, BOOK, FIVE RELOAD CASES, QUEUED REQUEST AND INVALID MIND PASSED');
}
