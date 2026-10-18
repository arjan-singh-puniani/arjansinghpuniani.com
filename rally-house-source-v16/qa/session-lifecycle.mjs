import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
// Run from rally-house-source-v16 so this harness works before/after QA curation.
const {chromium,browserOptions}=await import(pathToFileURL(path.resolve('qa/runtime.mjs')).href);
const cycles=Number(process.env.QA_CYCLES??32);
assert(Number.isInteger(cycles)&&cycles>=32,'Endurance requires at least 32 cycles');
const out=process.env.QA_OUT??'../takeover-evidence/session-20261009';
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const report={cycles:[],reviews:[],errors:[],http:[]};
try{
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)report.http.push([r.status(),r.url()]);});
 await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:8078'}/?debug`);
 await page.waitForFunction(()=>window.__rh?.ready);
 await page.getByText('Arjan',{exact:true}).click();
 await page.waitForTimeout(800);
  await page.evaluate(()=>{
   const g=window.__rh.game;
   g.autosave=-10000;g.clock.paused=true;g.camera.pin();
   // Isolate session ownership from legitimate new autonomous bookings after return.
   g.observationStarted=true;g.schedule.update=()=>{};g.quietLife=()=>{};g.everyday.next=g.history.nextSocial=g.history.nextObject=1e12;
  window.optimizerAudio={nodes:new Set(),connected:0,disconnected:0};
  const connect=AudioNode.prototype.connect,disconnect=AudioNode.prototype.disconnect;
  AudioNode.prototype.connect=function(...args){
   window.optimizerAudio.nodes.add(this);window.optimizerAudio.connected++;
   return connect.apply(this,args);
  };
  AudioNode.prototype.disconnect=function(...args){
   window.optimizerAudio.nodes.delete(this);window.optimizerAudio.disconnected++;
   return disconnect.apply(this,args);
  };
 });
 for(let i=0;i<cycles;i++){
  const before=await page.evaluate(i=>{
   const g=window.__rh.game;
   for(const a of [...g.activities.active])g.cancelActivity(a);
   g.clock.paused=true;g.clock.speed=2;g.settings.reducedMotion=i%2===0;
   const camera=JSON.stringify(g.camera.captureState());
   g.startChampionship(g.actor(['leo','coach','mika','nia'][i%4]));
   const trace=[];
   for(let n=0;n<6000&&g.championship.phase!=='serving';n++){
    if(n%600===0)trace.push({seconds:n/60,phase:g.championship.phase,actors:[g.player,...g.characters].map(c=>({id:c.id,position:c.position.clone(),path:c.path.map(p=>p.clone()),index:c.pathIndex})),activities:JSON.parse(JSON.stringify(g.activities.active)),routes:[...g.routes]});
    g.updateFixed(1/60);
   }
   if(g.championship.phase!=='serving')throw Error('Court entry failed '+i+' '+JSON.stringify({phase:g.championship.phase,trace}));
   g.interactiveMatch.prepareShot('player','serve','perfect');
   for(let n=0;n<200&&!g.interactiveMatch.pending?.impactStarted;n++)g.updateFixed(1/120);
   if(!g.interactiveMatch.pending?.impactStarted)throw Error('Contact entry failed '+i);
   g.setChampionshipPaused(true);
   return{camera,physics:JSON.stringify({position:g.interactiveMatch.ball.position,pose:g.player.animTime,hold:g.player.contactHoldRemaining,score:g.championship.score})};
  },i);
  await page.waitForTimeout(100);
  const frozen=await page.evaluate(()=>{
   const g=window.__rh.game;
   return JSON.stringify({position:g.interactiveMatch.ball.position,pose:g.player.animTime,hold:g.player.contactHoldRemaining,score:g.championship.score});
  });
  assert.equal(frozen,before.physics);
  await page.getByRole('button',{name:'Resume match',exact:true}).click();
  await page.waitForTimeout(150);
  if(process.env.QA_REVIEW==='1'&&i%8===7){
   await page.evaluate(()=>{const g=window.__rh.game;g.setChampionshipPaused(true);window.enduranceClip=g.motionRecorder.clip;});
   await page.locator('.championshipReview:visible').click();
   await page.waitForFunction(()=>window.__rh.game.performanceLab.active);
   const review=await page.evaluate(()=>{
    const g=window.__rh.game,t=g.performanceLab.timeline;
    return{sameRecording:t.clip===window.enduranceClip,contact:!!t.frame.contact,playing:t.playing,speed:t.speed,court:g.activities.reserved('court'),input:g.matchInput.enabled,match:!!g.interactiveMatch,gl:g.renderer.gl.getError()};
   });
   assert(review.sameRecording&&review.contact);assert.equal(review.speed,.25);
   for(const key of ['playing','court','input','match'])assert.equal(review[key],false,key);
   assert.equal(review.gl,0);
   await page.locator('[data-lab-action=close]').click();
   report.reviews.push({cycle:i+1,...review});
  }else{
   await page.evaluate(()=>{
    const g=window.__rh.game;
    g.setChampionshipPaused(true);g.requestChampionshipExit();
    for(let n=0;n<180&&g.championship.active;n++)g.updateFixed(1/60);
   });
  }
  await page.waitForTimeout(300);
  const row=await page.evaluate(()=>{
   const g=window.__rh.game,a=window.optimizerAudio;
   return{dom:document.querySelectorAll('*').length,paused:g.clock.paused,speed:g.clock.speed,reserved:g.activities.reserved('court'),owner:g.championshipHud.pointerId,input:g.matchInput.enabled,match:g.interactiveMatch,camera:JSON.stringify(g.camera.captureState()),connectedNodes:a.nodes.size,connects:a.connected,disconnects:a.disconnected,buffers:g.audio.tennisMaterialBuffers.size,competitor:g.player.matchCompetitor,impulse:!!g.championshipCamera.renderImpulse(),heap:performance.memory?.usedJSHeapSize};
  });
  assert.equal(row.camera,before.camera);delete row.camera;
  assert.equal(row.paused,true);assert.equal(row.speed,2);assert.equal(row.reserved,false);
  assert.equal(row.owner,null);assert.equal(row.input,false);assert.equal(row.match,null);
  assert.equal(row.competitor,false);assert.equal(row.impulse,false);assert.equal(row.connectedNodes,0);
  report.cycles.push({cycle:i+1,...row});
 }
 const counts=report.cycles.map(c=>c.dom);
 // A transient club UI node can vary the total count. Test bounded lifetime,
 // not an invariant that the ordinary club UI does not promise.
 assert(Math.max(...counts)-Math.min(...counts)<=1);
 assert.equal(counts.at(-1),counts[0]);
 assert.deepEqual(report.errors,[]);
 assert.deepEqual(report.http,[]);
 report.summary={cycles:report.cycles.length,reviewRoundTrips:report.reviews.length,physicsAndCleanupPassed:true,domRange:[Math.min(...counts),Math.max(...counts)],firstDom:counts[0],lastDom:counts.at(-1),transientAudioNodesAfterSettle:Math.max(...report.cycles.map(c=>c.connectedNodes)),firstHeap:report.cycles[0].heap,lastHeap:report.cycles.at(-1).heap};
 console.log(`${cycles} lifecycle cycles PASS`,JSON.stringify(report.summary));
 await context.close();
}catch(error){report.failure=error.message;throw error;}finally{
 report.limits=['Manual fixed ticks accelerate approach/exit; paused freeze, Resume click and short flight use live RAF. Autonomous scheduling is held during this lifecycle isolation test.','Total DOM can vary transiently by one node; bounded range and final return are checked.','AudioNode instrumentation starts after initial ambience and tracks later outgoing connections, not browser-internal allocation.','Heap is coarse, without forced garbage collection or long-duration leak proof.'];
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'optimizer-lifecycle.json'),JSON.stringify(report,null,2));
 await browser.close();
}
