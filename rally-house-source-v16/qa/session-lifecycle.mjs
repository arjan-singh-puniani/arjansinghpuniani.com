import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
// Run from rally-house-source-v16 so this harness works before/after QA curation.
const {chromium,browserOptions}=await import(pathToFileURL(path.resolve('qa/runtime.mjs')).href);
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const report={cycles:[],errors:[]};
try{
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:8078'}/?debug`);
 await page.waitForFunction(()=>window.__rh?.ready);
 await page.getByText('Arjan',{exact:true}).click();
 await page.waitForTimeout(800);
 await page.evaluate(()=>{
  const g=window.__rh.game;
  g.autosave=-10000;g.clock.paused=true;g.camera.pin();
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
 for(let i=0;i<32;i++){
  const before=await page.evaluate(i=>{
   const g=window.__rh.game;
   for(const a of [...g.activities.active])g.cancelActivity(a);
   g.clock.paused=true;g.clock.speed=2;g.settings.reducedMotion=i%2===0;
   const camera=JSON.stringify(g.camera.captureState());
   g.startChampionship(g.actor(['leo','coach','mika','nia'][i%4]));
   for(let n=0;n<6000&&g.championship.phase!=='serving';n++)g.updateFixed(1/60);
   if(g.championship.phase!=='serving')throw Error('Court entry failed '+i);
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
  await page.evaluate(()=>{
   const g=window.__rh.game;
   g.setChampionshipPaused(true);g.requestChampionshipExit();
   for(let n=0;n<180&&g.championship.active;n++)g.updateFixed(1/60);
  });
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
 report.summary={cycles:report.cycles.length,physicsAndCleanupPassed:true,domRange:[Math.min(...counts),Math.max(...counts)],firstDom:counts[0],lastDom:counts.at(-1),transientAudioNodesAfterSettle:Math.max(...report.cycles.map(c=>c.connectedNodes)),firstHeap:report.cycles[0].heap,lastHeap:report.cycles.at(-1).heap};
 console.log('32 lifecycle cycles PASS',JSON.stringify(report.summary));
 await context.close();
}finally{
 report.limits=['Manual fixed ticks accelerate approach/exit; paused freeze, Resume click and short flight use live RAF.','Total DOM can vary transiently by one node; bounded range and final return are checked.','AudioNode instrumentation starts after initial ambience and tracks later outgoing connections, not browser-internal allocation.','Heap is coarse, without forced garbage collection or long-duration leak proof.'];
 fs.mkdirSync('../takeover-evidence/session-20261009',{recursive:true});
 fs.writeFileSync('../takeover-evidence/session-20261009/optimizer-lifecycle.json',JSON.stringify(report,null,2));
 await browser.close();
}
