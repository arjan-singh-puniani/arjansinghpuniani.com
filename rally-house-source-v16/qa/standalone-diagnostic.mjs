import assert from 'node:assert/strict';import fs from 'node:fs';import {chromium,browserOptions} from './runtime.mjs';
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),events=[],starts=[];
try{
 for(let i=0;i<5;i++){
  const context=await browser.newContext(),page=await context.newPage();
  page.on('pageerror',e=>events.push(['pageerror',e.message]));page.on('console',m=>{if(m.type()==='error')events.push(['console',m.text()]);});page.on('requestfailed',r=>events.push(['failed',r.url(),r.failure()]));page.on('response',r=>{if(r.status()>=400)events.push(['http',r.status(),r.url()]);});
  await page.goto('http://127.0.0.1:8079/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);
  const state=await page.evaluate(()=>({ready:window.__rh?.ready,loading:document.getElementById('loading')?.textContent,urls:[...document.scripts].map(s=>s.src)}));starts.push(state);assert(state.ready,'Standalone initializes its runtime');await context.close();
 }
 assert.deepEqual(events,[],'No standalone console, HTTP or request failures');
}finally{fs.writeFileSync('evidence/replay-smoothness-20261011/standalone-diagnostic.json',JSON.stringify({starts,events},null,2));await browser.close();}
console.log(JSON.stringify({independentStartups:starts.length,events}));
