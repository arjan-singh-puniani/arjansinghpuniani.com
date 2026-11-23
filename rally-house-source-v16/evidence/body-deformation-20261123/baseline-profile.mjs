import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webkit} from '../../qa/runtime.mjs';
const [base,out,mode='driver',seconds='60']=process.argv.slice(2);
assert(base&&out&&['driver','browser'].includes(mode));
const browser=await webkit.launch({headless:true});
const report={mode,seconds:Number(seconds),runtime:'Original animation modules from 7788b9ef',environment:'Desktop WebKit, mobile viewport and touch emulation; not physical iPhone.',errors:[]};
try{
 const page=await browser.newPage({viewport:{width:440,height:763},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 for(const file of ['dist/analysis/MotionCapture.js','dist/animation/TaylorBody.js']){const body=execFileSync('/Users/arjan/.local/bin/rtk',['proxy','git','show','7788b9ef:rally-house-source-v16/'+file],{encoding:'utf8',maxBuffer:2e6});await page.route('**/'+file,route=>route.fulfill({body,contentType:'text/javascript'}));}
 if(process.env.QA_BASELINE_GAME)await page.route('**/dist/Game.js',route=>route.fulfill({path:process.env.QA_BASELINE_GAME,contentType:'text/javascript'}));
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto(base+'?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.locator('#loading').waitFor({state:'hidden'});
 await page.getByText('Arjan',{exact:true}).tap();await page.locator('.arrival-play').tap();await page.locator('.championshipHud[data-phase=serving]').waitFor({timeout:20000});
 await page.evaluate(mode=>{
  const g=window.__rh.game,p=window.frameProfile={frames:[],cost:{},events:[],slowCalls:[],last:0,inputs:0,lastInput:0};
  for(const [obj,key,label] of [[g,'render','render'],[g.renderer,'render','gpuSubmit'],[g,'updateFixed','simulation'],[g.ui,'update','hud'],[g,'updateObjective','objective'],[g,'save','save'],[g.audio,'updateClubAmbience','ambience'],[g,'quietLife','quietLife'],[g,'updateChampionshipActivity','championship'],[g,'updateSpectatorAttention','spectators'],[g.schedule,'update','schedule'],[g.world.nav.constructor.prototype,'path','navPath'],[g.world.nav.constructor.prototype,'clubPath','clubPath'],...g.characters.map(c=>[c,'update','actor-'+c.id])]){
   const original=obj[key];obj[key]=function(...args){const start=performance.now();const result=original.apply(this,args),ms=performance.now()-start;p.cost[label]=(p.cost[label]??0)+ms;if(ms>8)p.slowCalls.push({time:start,label,ms,...label==='navPath'?{start:args[0],end:args[1]}:{}});return result;};
  }
  for(const type of ['pointerdown','pointerup'])document.addEventListener(type,e=>p.events.push({time:performance.now(),type,target:e.target.className}));
  const sample=g.perf.sample.bind(g.perf);g.perf.sample=(v,now)=>{sample(v,now);if(p.last)p.frames.push({time:now,dt:now-p.last,finished:performance.now()-now,...p.cost});p.last=now;p.cost={};};
  // Browser-owned input isolates protocol overhead; normal driver mode uses actual touch events.
  if(mode==='browser')p.timer=setInterval(()=>{const s=g.championship.snapshot(),cue=g.interactiveMatch.playerCue(),now=performance.now();if(now-p.lastInput>800&&((s.phase==='serving'&&s.server==='player'&&cue!=='serving')||cue==='swing')){g.matchInput.queueSwing(s.phase==='rally'&&p.inputs%2===1?'lob':'drive');p.inputs++;p.lastInput=now;}},150);
 },mode);
 const start=Date.now();let last=0,inputs=0;
 while(Date.now()-start<Number(seconds)*1000){
  if(mode==='driver'){
   const s=await page.evaluate(()=>{const g=window.__rh.game;return{phase:g.championship.phase,server:g.championship.snapshot().server,cue:g.interactiveMatch.playerCue()};});
   if(Date.now()-last>800&&((s.phase==='serving'&&s.server==='player'&&s.cue!=='serving')||s.cue==='swing')){await page.getByRole('button',{name:s.phase==='rally'&&inputs%2===1?'Lob — high shot for recovery':'Swing racket',exact:true}).tap();inputs++;last=Date.now();}
  }
  await page.waitForTimeout(150);
 }
 Object.assign(report,await page.evaluate(()=>{const p=window.frameProfile;clearInterval(p.timer);const g=window.__rh.game;return{frames:p.frames,events:p.events,slowCalls:p.slowCalls,browserInputs:p.inputs,lesson:g.interactiveMatch.shotLesson(),scale:g.renderer.renderScale};}),{driverInputs:inputs});
 const percentile=(values,q)=>values.sort((a,b)=>a-b)[Math.floor(values.length*q)];
 report.summary={frames:report.frames.length,p50:percentile(report.frames.map(f=>f.dt),.5),p95:percentile(report.frames.map(f=>f.dt),.95),over50:report.frames.filter(f=>f.dt>50).length,workP95:percentile(report.frames.map(f=>['render','simulation','hud','objective','ambience','save'].reduce((n,k)=>n+(f[k]??0),0)),.95)};
 assert(report.frames.length>1000);assert.deepEqual(report.errors,[]);report.passed=true;
}finally{fs.writeFileSync(out,JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({...report,frames:undefined,events:undefined,slowCalls:undefined}));
