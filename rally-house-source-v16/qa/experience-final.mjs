import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,browserOptions} from './runtime.mjs';

const report={errors:[],performance:[]};
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try {
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:8078/?debug');
  await page.waitForFunction(()=>window.__rh?.ready);
  await page.getByText('Arjan',{exact:true}).click();
  report.saved=await page.evaluate(async()=>{
    const g=window.__rh.game;
    g.autosave=-10000;g.clock.paused=true;g.settings.reducedMotion=true;
    for(const a of [...g.activities.active])g.cancelActivity(a);
    g.startChampionship(g.actor('leo'));
    for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);
    if(g.championship.phase!=='serving')throw Error('Court entry failed');
    for(let p=0;p<7;p++){
      g.championship.markServeStarted();g.championship.resolvePoint({winner:'player',reason:'winner',rallyLength:4});
      for(let i=0;i<80;i++)g.updateFixed(1/60);
    }
    g.requestChampionshipExit();for(let i=0;i<180;i++)g.updateFixed(1/60);
    await g.save();
    return g.relations.get('leo').events.filter(e=>e.type==='championship_result');
  });
  assert.equal(report.saved.length,1);
  console.log('Completed score saved');
  await page.reload();await page.waitForFunction(()=>window.__rh?.ready);
  report.restored=await page.evaluate(()=>{
    const g=window.__rh.game;g.openCharacter(g.actor('leo'));
    return {events:g.relations.get('leo').events.filter(e=>e.type==='championship_result'),context:document.body.innerText,reserved:g.activities.reserved('court'),active:g.championship.active};
  });
  assert.deepEqual(report.restored.events,report.saved);
  assert(report.restored.context.includes('Last Championship with you'));
  assert(!report.restored.reserved&&!report.restored.active);
  console.log('Saved score restored');
  report.audio=await page.evaluate(async()=>{
    const {AudioManager}=await import('./dist/core/AudioManager.js');
    const a=new AudioManager();a.volume=0;a.tennisImpact();
    const silentContextAbsent=!a.ctx;a.volume=.65;
    for(let i=0;i<120;i++)a.tennisImpact(['perfect','clean','defensive','frame'][i%4]);
    const buffers=[...a.tennisMaterialBuffers.values()].flat();
    const rows=buffers.map(b=>({duration:b.duration,peak:Math.max(...b.getChannelData(0).map(Math.abs))}));
    const cached=buffers.length;await new Promise(r=>setTimeout(r,180));
    const state=a.ctx.state;a.dispose();
    return {silentContextAbsent,cached,rows,state,disposed:a.tennisMaterialBuffers.size===0&&!a.ctx&&!a.ambienceSource};
  });
  assert(report.audio.silentContextAbsent&&report.audio.disposed);
  assert.equal(report.audio.cached,12);assert(report.audio.rows.every(r=>r.peak<.921));
  console.log('Audio cache bounded');
  for(const mode of ['club','match']){
    await page.evaluate(mode=>{
      const g=window.__rh.game;g.ui.closeContext();g.autosave=-10000;g.clock.paused=false;g.settings.reducedMotion=false;
      if(mode==='match'){
        g.startChampionship(g.actor('nia'));
        for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);
        if(g.championship.phase!=='serving')throw Error('Match benchmark entry failed');
        window.__rhOriginalUpdate=g.updateFixed.bind(g);
        g.updateFixed=dt=>{
          if(g.championship.phase==='serving')g.matchInput.queueSwing();
          if(g.interactiveMatch?.playerCue()==='swing')g.matchInput.queueSwing();
          window.__rhOriginalUpdate(dt);
        };
      }
    },mode);
    console.log('Benchmark started',mode);
    await page.bringToFront();
    const sample=await page.evaluate(async()=>{
      const frames=[],start=performance.now();let previous=start;
      await new Promise(resolve=>{function tick(now){frames.push(now-previous);previous=now;if(frames.length>=600)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});
      frames.sort((a,b)=>a-b);const g=window.__rh.game;
      return {frames:frames.length,median:frames[300],p95:frames[570],p99:frames[594],heap:performance.memory?.usedJSHeapSize,perf:g.perf.snapshot(),matchActive:!!g.interactiveMatch,rallyLength:g.interactiveMatch?.rallyLength};
    });report.performance.push({mode,...sample});console.log('Benchmark complete',mode,sample.median);
  }
  await page.goto('http://127.0.0.1:8079/?debug');await page.waitForFunction(()=>window.__rh?.ready);
  report.package=await page.evaluate(()=>({styles:[...document.styleSheets].map(s=>s.href),ready:window.__rh.ready}));
  assert(report.package.ready);assert(report.package.styles.some(s=>s?.endsWith('/championship.css')));assert(report.package.styles.some(s=>s?.endsWith('/spatial.css')));
  assert.deepEqual(report.errors,[]);
  console.log('Reloaded Championship memory, bounded audio cache, isolated frame pacing, and extracted package boot PASS');
}finally{
  fs.writeFileSync('../takeover-evidence/after/final.json',JSON.stringify(report,null,2));
  await browser.close();
}
