import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const out='Documentation/shoulder-baseline';
const browser=await chromium.launch({channel:'chrome', headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.setDefaultTimeout(20000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/holoanatomy/src/app.js',async route=>{
   const response=await route.fetch();const body=await response.text();
   await writeFile(`${out}/production-app.js`,body);
   await route.fulfill({response,body:body+'\nwindow.__baseline={state,renderer,controls};'});
 });
 await page.goto('https://arjansinghpuniani.com/holoanatomy/index.html?debug=1',{waitUntil:'networkidle',timeout:60000});
 await page.waitForFunction(()=>!!window.__baseline,{timeout:60000});
 await page.locator('#module-select').selectOption('shoulder');
 await page.waitForFunction(()=>window.__baseline.renderer.activeMeshes().length===20,{timeout:60000});
 await page.waitForTimeout(1200);
 const result={errors,productionUrl:page.url(),initial:await page.evaluate(()=>({state:__baseline.state,camera:__baseline.renderer.camera,stats:__baseline.renderer.stats}))};
 for(const [name,yaw,pitch] of [['default',null,null],['posterior',0,0],['anterior',Math.PI,0],['superior',0,1.3]]){
  if(yaw!==null)await page.evaluate(({yaw,pitch})=>Object.assign(__baseline.renderer.camera,{yaw,pitch}),{yaw,pitch});
  await page.waitForTimeout(200);await page.screenshot({path:`${out}/${name}.png`,timeout:15000});
 }
 await page.evaluate(()=>{__baseline.renderer.camera.reset();const mesh=__baseline.renderer.activeMeshes().find(m=>m.part.id==='FJ1506');__baseline.renderer.stageMesh(mesh);});
 await page.waitForTimeout(400);await page.screenshot({path:`${out}/dissection.png`,timeout:15000});
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{__baseline.renderer.reassembleAll();__baseline.renderer.camera.reset();});
 await page.waitForTimeout(300);await page.screenshot({path:`${out}/mobile.png`,timeout:15000});
 await writeFile(`${out}/production-state.json`,JSON.stringify(result,null,2));
 console.log('Production baseline captured',errors);
}finally{await browser.close();}
