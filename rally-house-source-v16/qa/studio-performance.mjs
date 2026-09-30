import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});const results=[];
try{
 for(const [label,port] of [['before',8079],['after',8078]]){
  const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
  await page.goto(`http://127.0.0.1:${port}/?debug`);await page.waitForFunction(()=>window.__rh?.ready);
  await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;g.clock.minutes=1190;g.ui.closeContext();g.settings.visuals='detail';g.camera.frameAcademy();});await page.waitForTimeout(2200);
  const result=await page.evaluate(async()=>{
   const samples=[];let last=performance.now();await new Promise(resolve=>{const tick=now=>{samples.push(now-last);last=now;if(samples.length<180)requestAnimationFrame(tick);else resolve()};requestAnimationFrame(tick)});
   samples.shift();samples.sort((a,b)=>a-b);const g=window.__rh.game,gl=g.renderer.gl,e=gl.getExtension('WEBGL_debug_renderer_info');
   return {medianFrameMs:samples[Math.floor(samples.length*.5)],p95FrameMs:samples[Math.floor(samples.length*.95)],perf:g.perf.snapshot(),renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unavailable',renderScale:g.renderer.renderScale,items:g.renderItems};
  });results.push({label,...result});await page.screenshot({path:`qa/studio/active-${label}-evening.png`});
  if(label==='after'){await page.evaluate(()=>window.__rh.setTime(1040));await page.waitForTimeout(2200);await page.screenshot({path:'qa/studio/welcome-golden.png'});}
  await context.close();
 }
 fs.writeFileSync('qa/studio/performance-active.json',JSON.stringify(results,null,2));console.log(results);
}finally{await browser.close()}
