import {enterClub} from './enter-club.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,browserOptions} from './runtime.mjs';
const out='evidence/landing-walkthrough-20261101/page';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),report={views:[],errors:[],http:[]};
try{
 for(const profile of [{name:'desktop',width:1440,height:1000},{name:'phone',width:390,height:844},{name:'small-phone',width:320,height:800},{name:'landscape',width:844,height:390}]){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:1,hasTouch:profile.width<500}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.http.push([r.status(),r.url()]);});
  const response=await page.goto(process.env.QA_URL??'http://127.0.0.1:18086/playground/rally-house');assert.equal(response.status(),200);await page.getByRole('heading',{level:1}).waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('iframe').count(),0,'Game defers until intent');
  const guide=page.getByRole('region',{name:'How to play'});assert.deepEqual(await guide.locator('h3').allTextContents(),['Play tennis immediately.','Championship mode.','Replay your last shot.','Analyze your swing like a pro.']);
  for(const image of await page.locator('main img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode());}
  const boxes=await page.getByTestId('screen-callout').evaluateAll(nodes=>nodes.map(n=>{const a=n.getBoundingClientRect(),b=n.parentElement.getBoundingClientRect();return {width:a.width,height:a.height,inside:a.x>=b.x&&a.y>=b.y&&a.right<=b.right&&a.bottom<=b.bottom};}));assert.equal(boxes.length,3);assert(boxes.every(b=>b.inside&&b.width>0&&b.height>0),'Highlights remain registered to screenshots');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No horizontal overflow');await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,profile.name+'-hero.png')});await page.screenshot({path:path.join(out,profile.name+'-page.png'),fullPage:true});
  const row={...profile,boxes,deferredGame:true};
  if(profile.name==='desktop'){
   await page.getByRole('button',{name:'Play Rally House ↗',exact:true}).focus();await page.keyboard.press('Enter');await page.locator('iframe').waitFor();await enterClub(page.frameLocator('iframe'),'Arjan');row.keyboardEntry=true;
   await page.evaluate(()=>{document.querySelector('iframe').parentElement.requestFullscreen=()=>Promise.reject(Error('Controlled QA rejection'));});await page.getByRole('button',{name:'Enter fullscreen ↗',exact:true}).click();assert(await page.getByRole('status').filter({hasText:'Fullscreen is unavailable'}).isVisible());row.fullscreenFallback=true;
   await page.screenshot({path:path.join(out,'live-entry.png')});
  }
  report.views.push(row);await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.http,[]);console.log(JSON.stringify(report));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
