import assert from 'node:assert/strict';
import fs from 'node:fs';

// Use Apple's existing, isolated iPhone Safari session; never clear the user's normal browser storage.
const [sessionFile,base,out,seconds='600']=process.argv.slice(2),duration=Number(seconds);
assert(sessionFile&&base&&out&&duration>=60);
const session=JSON.parse(fs.readFileSync(sessionFile)).value,id=session.sessionId;
assert(id&&session.capabilities.platformName==='iOS'&&!session.capabilities['safari:useSimulator'],'Physical iPhone session required');
const root='http://127.0.0.1:18114/session/'+id;
fs.mkdirSync(out,{recursive:true});
const report={base,duration,environment:'Physical iPhone Safari through Apple WebDriver; USB connected. Scripted DOM button activation, not a touch-latency measurement.',capabilities:session.capabilities,samples:[],reviews:0,rematches:0,swings:0};
async function command(path,body){const response=await fetch(root+path,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(60000)}),data=await response.json();if(data.value?.error)throw Error(data.value.message);return data.value;}
const evaluate=(script,args=[])=>command('/execute/sync',{script,args});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function wait(script,timeout=30000){const start=Date.now();while(Date.now()-start<timeout){if(await evaluate(script))return;await sleep(200);}throw Error('Timed out: '+script);}
// Native clicks on this Safari build leave held gestures; preserve normal button handlers for the rendering soak.
async function click(selector){assert(await evaluate('const e=document.querySelector(arguments[0]);if(!e||!e.getClientRects().length||e.disabled)return false;e.click();return true;',[selector]),'Unavailable button: '+selector);}
try{
 await command('/url',{url:base+'?debug'});await wait('return !!window.__rh?.ready',60000);await wait('return document.getElementById("loading").classList.contains("hide")');await sleep(700);
 if(await evaluate('return !!document.querySelector(".arrival-play")')){await click('.arrival-avatar[data-avatar=arjan]');await click('.arrival-play');}else await click('#tennisBtn');
 await wait('return window.__rh.game.championship.phase==="serving"',60000);
 await evaluate(`
 const g=window.__rh.game;window.soak={frames:[],sim:[],render:[],last:performance.now(),lost:0,errors:[],mutations:0};
 const original=g.perf.sample.bind(g.perf);g.perf.sample=(v,now)=>{original(v,now);const s=window.soak;s.frames.push(now-s.last);s.last=now;s.sim.push(v.simMs);s.render.push(v.renderMs);};
 window.addEventListener('error',e=>window.soak.errors.push(e.message));window.addEventListener('unhandledrejection',e=>window.soak.errors.push(String(e.reason)));
 g.canvas.addEventListener('webglcontextlost',()=>window.soak.lost++);
 new MutationObserver(records=>window.soak.mutations+=records.length).observe(document.body,{subtree:true,childList:true,characterData:true});
 `);
 // Run controls on-device so remote WebDriver round trips do not become measured frame stalls.
 await evaluate(`
 const s=window.soak;s.started=performance.now();s.reviews=0;s.rematches=0;s.swings=0;s.lastReview=0;s.lastSwing=0;s.reviewStep=-1;s.next=0;
 const click=selector=>{const e=document.querySelector(selector);if(!e||!e.getClientRects().length||e.disabled)return false;e.click();return true;};
 s.timer=setInterval(()=>{
  const g=window.__rh.game,elapsed=performance.now()-s.started,phase=g.championship.phase;
  if(elapsed<s.next)return;
  if(g.performanceLab.active){
   if(s.reviewStep<3){click('[data-serve-phase='+['load','contact','finish'][s.reviewStep]+']');s.reviewStep++;s.next=elapsed+500;}
   else{click('[data-lab-action=close]');s.reviews++;s.lastReview=elapsed;click('#tennisBtn');}
  }else if(elapsed-s.lastReview>90000&&['serving','rally','pointResult'].includes(phase)){
   click('.championshipPause');if(click('.championshipPausePanel .championshipReview'))s.reviewStep=0;
  }else if(phase==='matchResult'){if(click('.championshipResults .championshipPrimary'))s.rematches++;}
  else if(elapsed-s.lastSwing>800&&((phase==='serving'&&g.championship.snapshot().server==='player'&&g.interactiveMatch?.playerCue()!=='serving')||g.interactiveMatch?.playerCue()==='swing')){
   if(click('.championshipSwing')){s.swings++;s.lastSwing=elapsed;}
  }
 },150);`);
 const start=Date.now();
 async function sample(){
  const row=await evaluate(`const g=window.__rh.game,s=window.soak,stats=a=>{a.sort((x,y)=>x-y);return {count:a.length,p50:a[Math.floor(a.length*.5)]??0,p95:a[Math.floor(a.length*.95)]??0,over50:a.filter(x=>x>50).length};};
  const frames=g.motionRecorder.clip.frames,paletteBytes=frames.reduce((sum,f)=>sum+[...new Set(f.body.filter(m=>m.skin).map(m=>m.boneMatrices))].reduce((n,a)=>n+a.byteLength,0),0);
  const row={frame:stats(s.frames),simulation:stats(s.sim),render:stats(s.render),phase:g.championship.phase,scale:g.renderer.renderScale,recordedFrames:frames.length,paletteBytes,geometries:g.renderer.skinGeos.size,dom:document.querySelectorAll('*').length,textMutations:s.mutations,contextsLost:s.lost,glError:g.renderer.gl.getError(),errors:s.errors.slice(),perf:g.perf.snapshot(),reviews:s.reviews,rematches:s.rematches,swings:s.swings,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio}};
  s.frames=[];s.sim=[];s.render=[];s.mutations=0;return row;`);
  row.seconds=(Date.now()-start)/1000;report.reviews=row.reviews;report.rematches=row.rematches;report.swings=row.swings;report.samples.push(row);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
  assert.equal(row.contextsLost,0);assert.equal(row.glError,0);assert(row.recordedFrames<=360);assert.deepEqual(row.errors,[]);
  console.log(JSON.stringify({seconds:Math.round(row.seconds),phase:row.phase,p95:row.frame.p95,render:row.render.p50,scale:row.scale,paletteMB:row.paletteBytes/1048576,reviews:report.reviews}));
 }
 while(Date.now()-start<duration*1000){await sleep(Math.min(30000,duration*1000-(Date.now()-start)));await sample();}
 await evaluate('clearInterval(window.soak.timer)');assert(report.swings>=3);assert(report.reviews+report.rematches>=2);
 fs.writeFileSync(out+'/final.png',Buffer.from(await command('/screenshot'),'base64'));report.passed=true;console.log('Physical iPhone sustained play passed');
}catch(error){report.failure=error.message;throw error;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));}
