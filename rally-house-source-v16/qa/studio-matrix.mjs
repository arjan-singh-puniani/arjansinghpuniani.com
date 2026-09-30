import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const url=process.env.RH_URL??'http://127.0.0.1:8078/?debug';
const results=[];
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{
for(const [name,width,height,touch] of [['desktop',1280,800,false],['tablet',1024,768,true],['portrait',390,844,true],['landscape',844,390,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 try{
 await page.goto(url);await page.waitForFunction(()=>window.__rh?.ready);
 await page.getByText('Arjan',{exact:true}).click();
 await page.evaluate(()=>{const g=window.__rh.game;g.settings.visuals='detail';g.autosave=-10000;g.clock.minutes=1190;g.clock.paused=true;g.camera.frameAcademy();});
 await page.waitForTimeout(1000);await page.screenshot({path:`qa/studio/club-${name}.png`});
 // A visible UI action starts the reservation and natural travel. No teleporting actors.
 await page.evaluate(()=>{const g=window.__rh.game;g.openCharacter(g.characters.find(c=>c.id==='leo'));g.camera.pin();window.qaCamera=g.camera.captureState();});
 await page.getByText('Challenge to Match',{exact:true}).click();
 await page.waitForFunction(()=>window.__rh.championship().phase==='serving',null,{timeout:35000});
 await page.waitForTimeout(500);await page.screenshot({path:`qa/studio/match-${name}.png`});
 const frame=await page.evaluate(()=>{const g=window.__rh.game,V=g.player.position.constructor;return {corners:[[-3.25,-6],[5.25,-6],[-3.25,6],[5.25,6]].map(([x,z])=>g.camera.project(new V(x,.1,z))),overflow:document.documentElement.scrollWidth>innerWidth,perf:g.perf.snapshot()}});
 assert(!frame.overflow);for(const c of frame.corners){assert(c.x>=0&&c.x<=width&&c.y>=0&&c.y<=height,`${name}: court clipped ${JSON.stringify(c)}`);}
 if(touch){assert(await page.locator('.championshipTouchPad').isVisible());await page.locator('.championshipSwing').tap();}
 else await page.keyboard.press('Space');
 await page.waitForFunction(()=>window.__rh.championship().phase==='rally',null,{timeout:5000});
 const contact=await page.evaluate(()=>window.__rh.game.interactiveMatch.rallyLength);assert(contact>=1);
 // Observe actual flight and cue-based inputs for a short rally, with no point injection.
 const rally=await page.evaluate(async()=>{
  const g=window.__rh.game;let max=0;const end=performance.now()+6500;
  while(performance.now()<end&&g.championship.phase==='rally'){
   const m=g.interactiveMatch;max=Math.max(max,m.rallyLength);
   if(m.playerCue()==='swing')g.matchInput.queueSwing();
   await new Promise(r=>setTimeout(r,35));
  }return max;
 });assert(rally>=3,`${name}: first exchanges are playable (${rally})`);
 // Complete controller scoring to exercise rematch/return without pretending it is human play.
 for(let round=0;round<2;round++){
  for(let guard=0;guard<16;guard++){
   await page.waitForFunction(()=>['serving','rally','matchResult'].includes(window.__rh.championship().phase),null,{timeout:5000});
   if(await page.evaluate(()=>window.__rh.championship().phase==='matchResult'))break;
   await page.evaluate(()=>window.__rh.championshipPoint('player'));
  }
  assert.equal(await page.evaluate(()=>window.__rh.championship().phase),'matchResult');
  if(round===0){await page.getByText('Rematch',{exact:true}).click();await page.waitForFunction(()=>window.__rh.championship().phase==='serving');}
 }
 await page.getByText('Return to Club',{exact:true}).click();
 await page.waitForFunction(()=>!document.body.classList.contains('championship-active'));
 const restored=await page.evaluate(()=>{const g=window.__rh.game;return {camera:g.camera.captureState(),before:window.qaCamera,focus:g.sportFocus,active:g.activities.active.some(a=>a.kind==='championship'),input:g.matchInput.enabled,match:g.interactiveMatch,paused:g.clock.paused};});
 assert.deepEqual(restored.camera,restored.before);assert(!restored.active&&!restored.input&&!restored.match);assert(restored.paused);
 // Cancellation during approach must also release the court, even under reduced motion.
 await page.evaluate(()=>{const g=window.__rh.game;g.settings.reducedMotion=true;g.startChampionship(g.characters.find(c=>c.id==='leo'));g.requestChampionshipExit();});
 await page.waitForFunction(()=>!document.body.classList.contains('championship-active'));
 assert.equal(await page.evaluate(()=>window.__rh.game.activities.reserved('court')),false);
 assert.deepEqual(errors,[]);
 results.push({name,width,height,status:'PASS',rally,frame,errors});console.log(name,'PASS',rally,'contacts');
 }catch(e){results.push({name,status:'FAIL',error:e.message,errors});await page.screenshot({path:`qa/studio/failure-${name}.png`});throw e;}
 finally{fs.writeFileSync('qa/studio/matrix.json',JSON.stringify(results,null,2));await context.close();}
}
}finally{await browser.close()}
