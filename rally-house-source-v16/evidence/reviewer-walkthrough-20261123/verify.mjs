import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit,browserOptions} from '../../qa/runtime.mjs';
const out=new URL('./',import.meta.url), results=[];
for(const [engine,width,height,touch] of [['chromium',1440,900,false],['webkit',402,874,true],['webkit',320,740,true]]){
 const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:browserOptions);
 try{
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:18133/playground/rally-house');
  await page.getByRole('heading',{level:1}).waitFor();
  // Scroll every lazy image into view before checking its decoded capture.
  for(const image of await page.locator('img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode());}
  await page.waitForFunction(()=>[...document.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0));
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,images:document.images.length,callouts:[...document.querySelectorAll('[data-testid="screen-callout"]')].map(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom;})}));
  assert(layout.scroll<=layout.width);assert.equal(layout.callouts.length,3);assert(layout.callouts.every(Boolean));
  await page.evaluate(()=>{document.activeElement?.blur();scrollTo({top:0,behavior:'instant'});});await page.waitForFunction(()=>scrollY===0);await page.waitForTimeout(200);await page.screenshot({path:new URL(`after-${engine}-${width}.png`,out).pathname,fullPage:true});
  assert.equal(await page.locator('iframe').count(),0);
  await page.getByRole('link',{name:'Play Rally House ↗',exact:true}).click();
  if(touch){await page.waitForURL('**/rally-house/index.html');await page.locator('#game').waitFor();}
  else{await page.locator('iframe[title="Play Rally House"]').waitFor();await page.frameLocator('iframe[title="Play Rally House"]').locator('#game').waitFor();}
  assert.deepEqual(errors,[]);results.push({engine,width,height,touch,layout,entry:touch?'full-page':'iframe',errors,passed:true});
 }finally{await browser.close();}
}
fs.writeFileSync(new URL('verification.json',out),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
