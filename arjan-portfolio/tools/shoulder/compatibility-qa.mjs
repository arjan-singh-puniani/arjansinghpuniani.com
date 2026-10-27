import { chromium, firefox, webkit, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const out='Documentation/shoulder-living/compatibility';await mkdir(out,{recursive:true});
const results=[];
for(const [name,engine,query] of [['chrome-obj',chromium,'?format=obj'],['firefox',firefox,''],['webkit',webkit,'']]) {
 let browser;
 const row={name,errors:[]};results.push(row);
 try {
  browser=await engine.launch(name==='chrome-obj'?{channel:'chrome'}:name==='firefox'&&process.env.QA_FIREFOX_EXECUTABLE?{executablePath:process.env.QA_FIREFOX_EXECUTABLE}:{});
  row.version=browser.version();
  const page=await browser.newPage({viewport:{width:1100,height:800}});
  page.on('pageerror',e=>row.errors.push(e.message));
  await page.goto('http://127.0.0.1:4195/holoanatomy/shoulder/index.html'+query);
  await page.waitForFunction(()=>window.shoulderStudio?.ready,{},{timeout:30000});
  await page.waitForTimeout(600);
  const hit=await page.evaluate(()=>{
   const s=shoulderStudio.scene,r=s.canvas.getBoundingClientRect(),c=s.project('ZA_infra');
   for(let d=0;d<200;d+=10)for(let a=0;a<6.3;a+=.3){const x=r.left+c.x+Math.cos(a)*d,y=r.top+c.y+Math.sin(a)*d;if(s.pick(x,y)==='ZA_infra')return{x,y};}
  });expect(hit).toBeTruthy();
  await page.mouse.move(hit.x,hit.y);await page.mouse.down();await page.mouse.move(hit.x+65,hit.y-40,{steps:12});await page.waitForTimeout(200);
  row.grasp=await page.evaluate(()=>shoulderStudio.scene.tissues.get('ZA_infra').diagnostics());
  expect(row.grasp.maxDisplacement).toBeGreaterThan(.003);expect(row.grasp.pinError).toBe(0);
  await page.screenshot({path:`${out}/${name}-grasp.png`});
  await page.mouse.up();await page.waitForTimeout(1000);
  row.recovered=await page.evaluate(()=>shoulderStudio.scene.tissues.get('ZA_infra').diagnostics());expect(row.recovered.maxDisplacement).toBeLessThan(.002);
  expect(row.errors).toEqual([]);row.status='PASS';
 } catch(e) {row.status='FAIL';row.failure=String(e);} finally {await browser?.close();}
}
await writeFile(out+'/results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results));if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
