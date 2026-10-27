import {chromium,webkit,devices,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.PORTFOLIO_URL||'http://127.0.0.1:4196',out=process.env.QA_OUT||'Documentation/shoulder-iphone/after';await mkdir(out,{recursive:true});
const results=[];
async function find(page,id){return page.evaluate(id=>{const s=shoulderStudio.scene,r=s.canvas.getBoundingClientRect(),c=s.project(id);for(let d=0;d<220;d+=7)for(let a=0;a<6.3;a+=.25){const x=r.left+c.x+Math.cos(a)*d,y=r.top+c.y+Math.sin(a)*d;if(x<r.left+28||x>r.right-55||y<r.top+150||y>r.bottom-150)continue;if(s.pick(x,y)===id)return{x,y};}},id);}
for(const [engine,name] of [[chromium,'chrome-touch'],[webkit,'webkit']]) {
 const browser=await engine.launch(name==='chrome-touch'?{channel:'chrome'}:{}),row={engine:name,version:browser.version(),errors:[]};results.push(row);
 try {
  const context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844}}),page=await context.newPage();page.on('pageerror',e=>row.errors.push(e.message));
  await page.goto(base+'/holoanatomy/shoulder/index.html');await page.waitForFunction(()=>window.shoulderStudio?.ready,{},{timeout:30000});await page.waitForTimeout(600);
  await expect(page.locator('#touch-help')).toContainText('Drag muscle');
  const dock=await page.locator('#tool-dock').boundingBox(),zoom=await page.locator('.zoom-controls').boundingBox();expect(zoom.y+zoom.height).toBeLessThan(dock.y);
  await page.screenshot({path:out+'/'+name+'-portrait.png'});
  const hit=await find(page,'ZA_infra');expect(hit).toBeTruthy();
  const rest=await page.evaluate(()=>Array.from(shoulderStudio.scene.meshes.get('ZA_infra').geometry.attributes.position.array));
  const cdp=name==='chrome-touch'?await context.newCDPSession(page):null;
  const point=(x,y,id=1)=>({x,y,id,radiusX:10,radiusY:10,force:.65});
  async function dragStart(){if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(hit.x,hit.y)]});else{await page.mouse.move(hit.x,hit.y);await page.mouse.down();}}
  async function dragMove(x,y){if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(x,y)]});else await page.mouse.move(x,y);}
  async function dragEnd(){if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();}
  await page.evaluate(()=>{shoulderStudio.scene.frameTimes.length=0;shoulderStudio.scene.inputSubmitTimes.length=0;});
  await dragStart();await expect(page.locator('#hover')).toContainText('Release to recover');
  if(cdp)await expect(page.locator('#touch-grip')).toBeVisible();
  for(let i=1;i<=24;i++){await dragMove(hit.x+50*i/24,hit.y-70*i/24);await page.waitForTimeout(17);}
  await page.waitForTimeout(200);
  const now=await page.evaluate(()=>Array.from(shoulderStudio.scene.meshes.get('ZA_infra').geometry.attributes.position.array));expect(now.some((v,i)=>Math.abs(v-rest[i])>.003)).toBe(true);
  row.grasp=await page.evaluate(()=>shoulderStudio.metrics());expect(row.grasp.mechanics.tissues.ZA_infra.pinError).toBe(0);
  const badge=await page.locator('#hover').boundingBox();expect(badge.x).toBeGreaterThanOrEqual(0);expect(badge.x+badge.width).toBeLessThanOrEqual(390);
  if(cdp)expect(badge.y+badge.height).toBeLessThan(hit.y-70-20);
  await page.screenshot({path:out+'/'+name+'-pull.png'});await dragEnd();await page.waitForTimeout(1100);
  expect(await page.evaluate(()=>shoulderStudio.scene.tissues.get('ZA_infra').diagnostics().maxDisplacement)).toBeLessThan(.002);
  await expect(page.locator('#touch-grip')).toBeHidden();
  // Retractor holds actual deformed tissue; restore returns the original mesh.
  await page.locator('[data-live-tool=retract]').tap();await dragStart();await dragMove(hit.x+50,hit.y-70);await page.waitForTimeout(200);await dragEnd();
  expect(await page.evaluate(()=>shoulderStudio.scene.tissues.get('ZA_infra').solver.held)).toBe(true);
  await page.locator('[data-live-restore]').tap();expect(await page.evaluate(()=>shoulderStudio.scene.tissues.get('ZA_infra').diagnostics().maxDisplacement)).toBe(0);
  await page.locator('[data-live-tool=lift]').tap();
  if(cdp){
   await dragStart();await dragMove(hit.x+20,hit.y-10);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(hit.x+20,hit.y-10),point(hit.x+65,hit.y+20,2)]});
   const before=await page.evaluate(()=>({d:shoulderStudio.scene.distance,t:shoulderStudio.scene.target.toArray(),yaw:shoulderStudio.scene.yaw}));
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(hit.x+10,hit.y-20),point(hit.x+85,hit.y+40,2)]});
   expect(await page.evaluate(()=>shoulderStudio.scene.pull)).toBeNull();
   await expect.poll(()=>page.evaluate(()=>shoulderStudio.scene.distance)).toBeLessThan(before.d);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[point(hit.x+10,hit.y-20)]});
   const remaining=await page.evaluate(()=>({d:shoulderStudio.scene.distance,t:shoulderStudio.scene.target.toArray(),yaw:shoulderStudio.scene.yaw}));
   await dragMove(hit.x+35,hit.y-35);
   expect(await page.evaluate(()=>({d:shoulderStudio.scene.distance,t:shoulderStudio.scene.target.toArray(),yaw:shoulderStudio.scene.yaw}))).toEqual(remaining);
   await dragEnd();expect(await page.evaluate(()=>shoulderStudio.inputState())).toBe('idle');
   await dragStart();await dragMove(hit.x+25,hit.y-20);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});expect(await page.evaluate(()=>shoulderStudio.inputState())).toBe('idle');
   row.nativeTouch='pull, release, hold, restore, pinch, remaining-finger lock, cancellation';
  }else row.touchCoverage='native taps; mouse-driven deformation in mobile WebKit; multitouch state covered in unit tests and Chromium native touch';
  await page.locator('#reset').tap();
  row.layouts=[];
  for(const [width,height] of [[375,667],[430,932],[844,390]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(250);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const controls=await page.locator('#tool-dock').boundingBox();expect(controls.y+controls.height).toBeLessThanOrEqual(height);
   if(width===844){await page.screenshot({path:out+'/'+name+'-landscape.png'});const canvas=await page.locator('canvas').boundingBox();expect(canvas.width).toBe(width);}
   row.layouts.push({width,height,toolsVisible:true});
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#details-toggle').tap();await expect(page.locator('.inspector')).toBeVisible();await page.locator('#details-toggle').tap();
  await page.locator('#information').tap();if(!await page.evaluate(()=>typeof navigator.vibrate==='function'))await expect(page.locator('#haptics-toggle')).toBeDisabled();await page.locator('#close-info').tap();
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.axe=axe.violations.map(v=>({id:v.id,impact:v.impact}));expect(row.axe).toEqual([]);
  await page.goto(base+'/playground/holoanatomy#anatomy');await page.locator('iframe').scrollIntoViewIfNeeded();await page.waitForTimeout(700);
  const iframe=await page.locator('iframe').boundingBox(),header=await page.locator('.site-header').boundingBox();expect(iframe.y).toBeGreaterThanOrEqual(header.y+header.height);
  expect(iframe.y+iframe.height).toBeLessThanOrEqual(844);
  await expect(page.frameLocator('iframe').locator('#tool-dock')).toBeVisible();await page.screenshot({path:out+'/'+name+'-embedded.png'});
  expect(row.errors).toEqual([]);row.status='PASS';
 }catch(e){row.status='FAIL';row.failure=String(e);console.error(name,e);}finally{await browser.close();}
}
await writeFile(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(r=>({engine:r.engine,status:r.status,failure:r.failure,meanFrame:r.grasp?.meanFrameMs,p95:r.grasp?.p95FrameMs}))));if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
