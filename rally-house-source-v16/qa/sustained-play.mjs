import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit,browserOptions} from './runtime.mjs';

const [base,out,seconds='600',engine='chromium']=process.argv.slice(2),duration=Number(seconds);
assert(base&&out&&duration>=60&&['chromium','webkit'].includes(engine),'BASE_URL OUTPUT_DIR [SECONDS>=60] [chromium|webkit]');
fs.mkdirSync(out,{recursive:true});
const report={base,engine,duration,environment:'Desktop phone emulation; not physical iPhone thermal or battery testing.',errors:[],samples:[],rematches:0,reviews:0,swings:0};
const browser=await (engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{...browserOptions,args:['--use-angle=metal']}:{headless:true});
try{
 const context=await browser.newContext({viewport:{width:440,height:763},deviceScaleFactor:3,isMobile:true,hasTouch:true}),page=await context.newPage();
 page.on('pageerror',error=>report.errors.push(error.message));
 await page.goto(base+'?debug');await page.waitForFunction(()=>window.__rh?.ready,null,{timeout:60000});await page.locator('#loading').waitFor({state:'hidden'});
 await page.getByText('Arjan',{exact:true}).tap();await page.locator('.arrival-play').tap();await page.locator('.championshipHud[data-phase=serving]').waitFor({timeout:20000});
 const cdp=engine==='chromium'?await context.newCDPSession(page):null;
 if(cdp){await cdp.send('HeapProfiler.enable');await cdp.send('HeapProfiler.collectGarbage');await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
 await page.evaluate(()=>{
  const g=window.__rh.game;window.soak={frames:[],sim:[],render:[],textMutations:0,last:performance.now(),contextsLost:0};
  const original=g.perf.sample.bind(g.perf);
  g.perf.sample=(v,now)=>{original(v,now);const s=window.soak;s.frames.push(now-s.last);s.last=now;s.sim.push(v.simMs);s.render.push(v.renderMs);};
  new MutationObserver(records=>window.soak.textMutations+=records.length).observe(document.body,{subtree:true,childList:true,characterData:true});
  g.canvas.addEventListener('webglcontextlost',()=>window.soak.contextsLost++);
 });
 const start=Date.now();let lastSample=0,lastSwing=0,lastReview=0,profileDone=!cdp;
 const sample=async()=>{
  const row=await page.evaluate(()=>{
   const g=window.__rh.game,s=window.soak,stats=values=>{const a=values.sort((x,y)=>x-y);return {count:a.length,p50:a[Math.floor(a.length*.5)]??0,p95:a[Math.floor(a.length*.95)]??0,over50:a.filter(x=>x>50).length};};
   const row={frame:stats(s.frames),simulation:stats(s.sim),render:stats(s.render),textMutations:s.textMutations,phase:g.championship.phase,lab:g.performanceLab.active,scale:g.renderer.renderScale,geometries:g.renderer.skinGeos.size,recordedFrames:g.motionRecorder.clip.frames.length,dom:document.querySelectorAll('*').length,contextsLost:s.contextsLost,glError:g.renderer.gl.getError(),perf:g.perf.snapshot()};
   s.frames=[];s.sim=[];s.render=[];s.textMutations=0;return row;
  });
  row.seconds=(Date.now()-start)/1000;
  if(cdp){row.heap=await cdp.send('Runtime.getHeapUsage');row.domCounters=await cdp.send('Memory.getDOMCounters');}
  assert(row.recordedFrames<=360);assert.equal(row.contextsLost,0);assert.equal(row.glError,0);
  report.samples.push(row);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({seconds:Math.round(row.seconds),phase:row.phase,p95:row.frame.p95,render:row.render.p50,heapMB:row.heap?Math.round(row.heap.usedSize/1048576):null,geometries:row.geometries,rematches:report.rematches,reviews:report.reviews}));
 };
 while(Date.now()-start<duration*1000){
  const elapsed=Date.now()-start;
  if(!profileDone&&elapsed>=30000){const {profile}=await cdp.send('Profiler.stop');fs.writeFileSync(out+'/cpu-profile.json',JSON.stringify(profile));profileDone=true;}
  if(elapsed-lastSample>=30000){await sample();lastSample=elapsed;}
  const state=await page.evaluate(()=>{const g=window.__rh.game;return {phase:g.championship.phase,cue:g.interactiveMatch?.playerCue(),server:g.championship.snapshot().server};});
  if(elapsed-lastReview>90000&&['serving','rally','pointResult'].includes(state.phase)){
   await page.locator('.championshipPause').tap();
   await page.locator('.championshipPausePanel .championshipReview').tap();
   await page.waitForFunction(()=>window.__rh.game.performanceLab.active);
   for(const phase of ['load','contact','finish']){const button=page.locator('[data-serve-phase='+phase+']');if(await button.isVisible())await button.tap();await page.waitForTimeout(500);}
   await page.locator('[data-lab-action=close]').tap();report.reviews++;lastReview=elapsed;
   await page.locator('#tennisBtn').tap();
  }else if(state.phase==='matchResult'){
   await page.getByRole('button',{name:'Rematch',exact:true}).tap();report.rematches++;
  }else if(elapsed-lastSwing>800&&((state.phase==='serving'&&state.server==='player'&&state.cue!=='serving')||state.cue==='swing')){
   await page.getByRole('button',{name:'Swing racket'}).tap();report.swings++;lastSwing=elapsed;
  }
  await page.waitForTimeout(150);
 }
 if(!profileDone){const {profile}=await cdp.send('Profiler.stop');fs.writeFileSync(out+'/cpu-profile.json',JSON.stringify(profile));}
 await sample();
 if(cdp){await cdp.send('HeapProfiler.collectGarbage');report.retainedHeap=await cdp.send('Runtime.getHeapUsage');report.retainedDOM=await cdp.send('Memory.getDOMCounters');}
 assert(report.swings>=3,'Soak did not exercise play');assert(report.rematches+report.reviews>=2,'Soak did not exercise repeated sessions');assert.deepEqual(report.errors,[]);
 await page.screenshot({path:out+'/final.png'});report.passed=true;console.log('Sustained play passed');
}catch(error){report.failure=error.message;throw error;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
