import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,browserOptions} from './runtime.mjs';
import {enterClub} from './enter-club.mjs';
const out='evidence/avatar-lockout-20261106';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
let context;
try{
 context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:out+'/recording',size:{width:1280,height:800}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));
 await page.goto('http://127.0.0.1:18080/?debug');await page.waitForFunction(()=>window.__rh?.ready);await enterClub(page,'Arjan');
 await page.evaluate(()=>{
  const g=window.__rh.game;g.autosave=-1e6;
  // Isolate the conversation; ordinary NPC court ownership is covered by the matched idle capture.
  for(const a of [...g.activities.active])g.cancelActivity(a);
  g.observationStarted=true;g.everyday.next=g.history.nextSocial=g.history.nextObject=1e12;
  g.player.position.set(-6,0,4);g.player.path=[];
  const c=g.actor('nia');c.position.set(-6,0,2);c.path=[];g.visitMember(c,false);
 });
 assert(await page.evaluate(()=>window.__rh.game.activities.busy('player')));
 await page.locator('#settingsBtn').click();await page.locator('#contextActions button').filter({hasText:'Character:'}).click();await page.locator('#contextActions button').filter({hasText:'Taylor'}).click();
 assert.equal(await page.evaluate(()=>window.__rh.game.activities.busy('player')),false);
 const point=await page.evaluate(()=>{const g=window.__rh.game;for(const [x,z]of[[-6,5.8],[-6,4.8],[-4,8.5],[-7,4]]){const s=g.camera.project(g.player.position.clone().set(x,0,z));if(!g.pickWorld(s.x,s.y)&&!g.world.nav.isBlocked(x,z))return s;}throw Error('No clear floor fixture');});
 await page.mouse.click(point.x,point.y);
 await page.waitForFunction(()=>Math.hypot(window.__rh.game.player.position.x+6,window.__rh.game.player.position.z-4)>.3);
 await page.screenshot({path:out+'/after/walking.png'});
 // Escape must release a fresh conversation through the actual keyboard listener.
 await page.evaluate(()=>{const g=window.__rh.game;g.visitMember(g.actor('nia'),false);g.canvas.focus();});
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__rh.game.activities.busy('player')),false);
 await page.locator('#tennisBtn').click();
 await page.waitForFunction(()=>window.__rh.game.championship.phase==='serving',{},{timeout:65000});
 const start=await page.evaluate(()=>{
  const g=window.__rh.game;window.contactCount=0;window.frameDeltas=[];window.frameLast=performance.now();
  const hit=g.interactiveMatch.callbacks.onHit;g.interactiveMatch.callbacks.onHit=(...args)=>{window.contactCount++;hit?.(...args);};
  const sample=t=>{window.frameDeltas.push(t-window.frameLast);window.frameLast=t;if(window.frameDeltas.length<240)requestAnimationFrame(sample);};requestAnimationFrame(sample);
  g.canvas.focus();return {clock:g.clock.serialize(),avatar:g.player.spec.avatar};
 });
 const end=Date.now()+7000;while(Date.now()<end){
  if(await page.evaluate(()=>{const g=window.__rh.game;return g.championship.phase==='serving'||g.interactiveMatch.playerCue()==='swing';}))await page.keyboard.press('Space');
  await page.waitForTimeout(80);
 }
 const result=await page.evaluate(()=>({hits:window.contactCount,phase:window.__rh.game.championship.phase,deltas:window.frameDeltas}));
 assert(result.hits>0,'A served ball must make real racket contact after the switch');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/normal-play-result.json',JSON.stringify({start,...result,errors},null,2));console.log('Normal gameplay contact verified');
 await page.screenshot({path:out+'/after/normal-gameplay.png'});
 await page.keyboard.press('Escape');console.log('Requested court exit',await page.evaluate(()=>({phase:window.__rh.game.championship.phase,paused:window.__rh.game.clock.paused})));await page.waitForFunction(()=>!window.__rh.game.championship.active,{},{timeout:10000});console.log('Club controls restored');
 assert.equal(await page.locator('#settingsBtn').evaluate(el=>el.inert||!!el.closest('[inert]')),false,'Court exit restores club controls');
 const video=page.video();console.log('Closing recording');await context.close();context=null;console.log('Saving recording');await video.saveAs(out+'/after/normal-speed-gameplay.webm');
 const sorted=[...result.deltas].sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)],p95=sorted[Math.floor(sorted.length*.95)];
 const report={start,hits:result.hits,endPhase:result.phase,errors,frameSamples:sorted.length,medianFrameMs:median,p95FrameMs:p95,meanFPS:1000*result.deltas.length/result.deltas.reduce((a,b)=>a+b,0),physicalPhoneTested:false};
 fs.writeFileSync(out+'/browser-regression.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await context?.close();await browser.close();}
