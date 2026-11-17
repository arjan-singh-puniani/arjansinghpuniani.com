import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webkit,chromium,browserOptions} from './runtime.mjs';
import {enterClub} from './enter-club.mjs';
const [base,out,engine='webkit']=process.argv.slice(2);assert(base&&out);
fs.mkdirSync(out,{recursive:true});
const report={engine,environment:'Desktop browser with synthetic cached-page lifecycle events; not a physical iPhone back/forward-cache test.',cycles:[],errors:[]};
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:browserOptions);
try{
 const page=await browser.newPage({viewport:{width:402,height:780},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(base+'?debug');await page.waitForFunction(()=>window.__rh?.ready);
 await page.locator('#loading').waitFor({state:'hidden'});await enterClub(page,'Arjan');
 await page.evaluate(()=>{
  const a=window.__rh.game.audio,b=document.createElement('button');
  b.id='audio-probe';b.textContent='Test impact';b.style.cssText='position:fixed;top:0;left:0;z-index:999999';
  b.onclick=()=>a.tennisImpact('clean',11);document.body.append(b);
 });
 await page.locator('#audio-probe').tap();await page.waitForFunction(()=>window.__rh.game.audio.ctx?.state==='running');
 await page.evaluate(()=>{
  window.__rh.game.clock.paused=true;
  const a=window.__rh.game.audio,c=window.originalAudioContext=a.ctx;a.ambienceTick=Infinity;
  const create=c.createBufferSource.bind(c);window.playedImpacts=0;
  c.createBufferSource=()=>{const n=create(),start=n.start.bind(n);n.start=(...args)=>{if(!n.loop)window.playedImpacts++;return start(...args);};return n;};
 });
 // Repeat to catch one-shot listeners and preserve both audible and muted preferences.
 for(const volume of [.65,0,.65]){
  const state=await page.evaluate(volume=>{
   const a=window.__rh.game.audio;a.volume=volume;a.updateClubAmbience(1/60,720,'clear',true);
   window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
   window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
   return {enabled:a.enabled,volume:a.volume,sameContext:a.ctx===window.originalAudioContext,state:a.ctx?.state};
  },volume);
  assert.equal(state.enabled,true,'Cached navigation must not permanently disable audio');
  assert.equal(state.sameContext,true,'Keep the reusable audio context');assert.notEqual(state.state,'closed');
  assert.equal(state.volume,volume,'Returning must preserve the volume preference');
  const before=await page.evaluate(()=>window.playedImpacts);
  await page.locator('#audio-probe').tap();await page.waitForTimeout(300);
  const sounds=await page.evaluate(()=>window.playedImpacts);
  assert.equal(sounds-before,volume===0?0:1,'Fresh impacts respect the retained mute preference');
  report.cycles.push({...state,freshImpacts:sounds-before});
 }
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));
 await page.waitForFunction(()=>window.originalAudioContext.state==='closed');
 report.finalDeparture=await page.evaluate(()=>({enabled:window.__rh.game.audio.enabled,contextReleased:!window.__rh.game.audio.ctx}));
 assert.deepEqual(report.finalDeparture,{enabled:false,contextReleased:true});
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=error.message;throw error;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report));
