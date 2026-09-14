import fs from 'node:fs';import assert from 'node:assert/strict';
export async function verify(page,result){
 const data=await page.evaluate(()=>{
  const g=window.__rh.game;g.clock.paused=true;
  const advance=n=>{g.clock.paused=false;for(let i=0;i<n*60;i++)g.updateFixed(1/60);g.clock.paused=true;};
  advance(80);const observation=g.evidence.recent.length;
  for(const a of [...g.activities.active])g.cancelActivity(a);
  const before=g.mikaProgress;g.beginLesson('dropFeed');const immediate=g.mikaProgress;advance(110);
  const after=g.mikaProgress,lesson=g.activities.history.find(a=>a.kind==='lesson');
  for(const a of [...g.activities.active])g.cancelActivity(a);
  g.history.nextSocial=Infinity;g.startMatch();advance(130);const match=g.history.matches[0];
  for(const a of [...g.activities.active])g.cancelActivity(a);
  const pos=[[-5,2],[-5,0],[7,-1],[-6,3]].find(([x,z])=>g.world.canPlace(x,z));if(pos)g.place('bench',...pos);advance(65);
  return {observation,before,immediate,after,lesson,match,objects:g.affordances.serialize(),history:g.activities.serialize(),snapshot:g.snapshot()};
 });
 fs.writeFileSync('qa/verification.json',JSON.stringify(data,null,2));console.log('VERIFICATION',JSON.stringify({observation:data.observation,before:data.before,after:data.after,lesson:data.lesson,match:data.match,objects:data.objects}));
 assert.equal(data.before,data.immediate);assert.equal(data.lesson?.phase,'completed');assert.ok(data.after>data.before);assert.ok(data.match?.contacts>0);assert.ok(Object.values(data.objects.objects).some(o=>o.visits.nia>0));
 await page.evaluate(async()=>{await window.__rh.game.save();});await page.reload();await page.waitForFunction(()=>window.__rh?.ready);const restored=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;return g.snapshot()});assert.equal(restored.mikaProgress,data.after);assert.equal(restored.history.matches[0].id,data.match.id);
 for(const [name,time,weather] of [['morning',570,'clear'],['midday',720,'clear'],['golden',1040,'clear'],['rain',1050,'rain'],['evening',1190,'clear']]){await page.evaluate(({time,weather})=>{window.__rh.setTime(time);window.__rh.setWeather(weather);window.__rh.game.camera.frameAcademy();},{time,weather});await page.waitForTimeout(1200);await page.screenshot({path:`qa/${name}.png`});}
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1000);await page.click('#bookBtn');await page.screenshot({path:'qa/mobile-book.png'});await page.click('#closeBook');await page.click('#coachBtn');await page.waitForTimeout(1500);await page.screenshot({path:'qa/mobile-coaching.png'});console.log('GPU',await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unavailable'}));await import('./mobile.mjs').then(m=>m.mobileTest(page));console.log('VERIFY PASSED',await result());
}
