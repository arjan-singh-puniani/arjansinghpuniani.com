import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='Documentation/shoulder-living/after';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),results={errors:[]};
async function find(page,id){return page.evaluate(id=>{const s=shoulderStudio.scene,r=s.canvas.getBoundingClientRect(),c=s.project(id);for(let radius=0;radius<240;radius+=8)for(let a=0;a<6.3;a+=.25){const x=r.left+c.x+Math.cos(a)*radius,y=r.top+c.y+Math.sin(a)*radius;if(x<r.left+30||x>r.right-30||y<r.top+130||y>r.bottom-100)continue;if(s.pick(x,y)===id)return{x,y};}},id);}
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
 page.on('pageerror',e=>results.errors.push(e.message));
 await page.goto('http://127.0.0.1:4195/holoanatomy/shoulder/index.html');await page.waitForFunction(()=>window.shoulderStudio?.ready);
 await expect(page.locator('#tool-dock')).toBeVisible();await expect(page.locator('.inspector')).toBeHidden();
 await page.waitForTimeout(300);await page.screenshot({path:out+'/opening.png'});
 const hit=await find(page,'ZA_infra');expect(hit).toBeTruthy();
 const rest=await page.evaluate(()=>Array.from(shoulderStudio.scene.meshes.get('ZA_infra').geometry.attributes.position.array));
 const pos=await page.evaluate(()=>shoulderStudio.scene.meshes.get('ZA_infra').position.toArray());
 await page.mouse.move(hit.x,hit.y);await page.mouse.down();await page.mouse.move(hit.x+90,hit.y-65,{steps:18});await page.waitForTimeout(350);
 results.deforming=await page.evaluate(()=>shoulderStudio.metrics());
 const now=await page.evaluate(()=>Array.from(shoulderStudio.scene.meshes.get('ZA_infra').geometry.attributes.position.array));
 expect(now.some((v,i)=>Math.abs(v-rest[i])>.003)).toBe(true);
 expect(await page.evaluate(()=>shoulderStudio.scene.meshes.get('ZA_infra').position.toArray())).toEqual(pos);
 expect(results.deforming.mechanics.tissues.ZA_infra.pinError).toBe(0);
 expect(await page.evaluate(()=>shoulderStudio.inputState())).toBe("pulling");
 await page.screenshot({path:out+'/infraspinatus-grasp.png'});
 await page.mouse.up();await page.waitForTimeout(1400);
 results.recovered=await page.evaluate(()=>shoulderStudio.scene.tissues.get('ZA_infra').diagnostics());
 expect(results.recovered.maxDisplacement).toBeLessThan(.002);
 await page.click('[data-live-tool="retract"]');
 const again=await find(page,'ZA_infra');await page.mouse.move(again.x,again.y);await page.mouse.down();await page.mouse.move(again.x+110,again.y-90,{steps:20});await page.waitForTimeout(150);await page.mouse.up();await page.waitForTimeout(250);
 expect(await page.evaluate(()=>shoulderStudio.scene.tissues.get('ZA_infra').solver.held)).toBe(true);
 await page.screenshot({path:out+'/retracted.png'});
 await page.click('[data-live-restore]');await page.waitForTimeout(100);
 expect(await page.evaluate(()=>shoulderStudio.scene.tissues.get('ZA_infra').diagnostics().maxDisplacement)).toBe(0);
 results.axe=(await new AxeBuilder({page}).analyze()).violations;expect(results.axe).toEqual([]);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await page.screenshot({path:out+'/mobile.png'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 results.mobileAxe=(await new AxeBuilder({page}).analyze()).violations;expect(results.mobileAxe).toEqual([]);

 await page.setViewportSize({width:1440,height:900});
 // Escape, tool switch and resize must terminate the active grasp without leaking pointer state.
 for(const action of ['escape','tool','resize']) {
   await page.click('[data-live-tool="lift"]');
   const point=await find(page,'ZA_infra');await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+60,point.y-35,{steps:5});
   if(action==='escape')await page.keyboard.press('Escape');
   if(action==='tool')await page.evaluate(()=>document.querySelector('[data-live-tool="probe"]').click());
   if(action==='resize')await page.setViewportSize({width:1400,height:880});
   await page.mouse.up();expect(await page.evaluate(()=>shoulderStudio.scene.pull)).toBeNull();expect(await page.evaluate(()=>shoulderStudio.inputState())).toBe("idle");
 }
 await page.click('[data-live-restore]');
 // A genuine two-finger touch sequence cancels a grasp and resumes camera manipulation.
 await page.setViewportSize({width:390,height:844});await page.click('[data-live-tool="lift"]');
 const touchPoint=await find(page,'ZA_infra'),cdp=await context.newCDPSession(page);
 const tp=(x,y,id)=>({x,y,id,radiusX:2,radiusY:2,force:1});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[tp(touchPoint.x,touchPoint.y,1)]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[tp(touchPoint.x+30,touchPoint.y-20,1)]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[tp(touchPoint.x+30,touchPoint.y-20,1),tp(touchPoint.x+70,touchPoint.y+40,2)]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[tp(touchPoint.x+20,touchPoint.y-30,1),tp(touchPoint.x+90,touchPoint.y+50,2)]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 expect(await page.evaluate(()=>shoulderStudio.scene.pull)).toBeNull();
 await page.setViewportSize({width:1440,height:900});await page.click('[data-live-tool="probe"]');
 const bone=await page.evaluate(()=>{const s=shoulderStudio.scene,r=s.canvas.getBoundingClientRect();for(let y=r.top+100;y<r.bottom-90;y+=10)for(let x=r.left+50;x<r.right-50;x+=10){const id=s.pick(x,y);if(['ZA_scapula','ZA_humerus','ZA_clavicle'].includes(id))return{x,y,id};}});
 expect(bone).toBeTruthy();await page.mouse.click(bone.x,bone.y);expect(await page.evaluate(()=>shoulderStudio.state.selected)).toBe(bone.id);
 await page.keyboard.press('Escape');await page.setViewportSize({width:390,height:844});
 // Keyboard alternatives operate the same source solver and retain curriculum access.
 await page.click('#details-toggle');await page.click('#context [data-tool="probe"]');
 await page.locator('#context summary').filter({hasText:'Accessible structure controls'}).click();
 await page.click('#context [data-select="ZA_infra"]');
 await expect(page.locator('#active-name')).toContainText('infraspinatus');
 await page.locator('.structure-inquiry summary').click();await expect(page.locator('#context')).toContainText('Suprascapular nerve');
 await page.screenshot({path:out+'/mobile-inquiry.png'});
 await page.click('#details-toggle');await page.locator('#specimen').focus();await page.keyboard.press('3');
 expect(await page.evaluate(()=>shoulderStudio.state.dissection.tool)).toBe('retract');
 await page.keyboard.press('2');expect(await page.evaluate(()=>shoulderStudio.state.dissection.tool)).toBe('lift');
 await page.click('#reset');await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(350);
 // Profile sustained solver work after warm-up, excluding preparation and screenshot costs.
 const sample=await find(page,'ZA_infra');await page.mouse.move(sample.x,sample.y);await page.mouse.down();
 await page.evaluate(async()=>{
   const s=shoulderStudio.scene;s.frameTimes=[];s.solverTimes=[];
   for(let i=0;i<90;i++){s.moveTissuePull(Math.sin(i*.12)*65,-40);await new Promise(requestAnimationFrame);}
 });
 results.sustained=await page.evaluate(()=>shoulderStudio.metrics());await page.mouse.up();
 await page.waitForTimeout(1300);
 const definitions=await page.evaluate(()=>shoulderStudio.anatomicalDefinitions());
 await writeFile(out+'/anatomical-definitions.json',JSON.stringify(definitions,null,2));
 const supports=await page.evaluate(()=>Object.fromEntries([...shoulderStudio.scene.tissues].map(([id,t])=>[id,{source:shoulderStudio.scene.parts.get(id).source,license:shoulderStudio.scene.parts.get(id).license,attribution:shoulderStudio.scene.parts.get(id).attribution,sourceVersion:shoulderStudio.scene.parts.get(id).sourceVersion,report:t.supports.report,axis:Array.from(t.supports.axis),regions:Array.from(t.supports.regions),sourcePositions:Array.from(t.surface.rest)}])));
 await writeFile(out+'/derived-support-regions.json',JSON.stringify(supports));
 results.finalAxe=(await new AxeBuilder({page}).analyze()).violations;expect(results.finalAxe).toEqual([]);
 results.allMuscles=await page.evaluate(()=>{
   const rows={};
   for(const [id,t] of shoulderStudio.scene.tissues){
     const s=t.solver;let index=0;while(s.pins[index])index++;
     s.grasp(Array.from(s.x.slice(index*3,index*3+3)));s.pull([.06,.08,-.1]);
     for(let i=0;i<18;i++)s.advance(1/60);
     rows[id]=t.diagnostics();t.restore();
   }return rows;
 });
 for(const d of Object.values(results.allMuscles)){expect(d.pinError).toBe(0);expect(d.failed).toBe(false);expect(d.maxContactPenetration).toBeLessThan(1e-6);expect(d.maxDisplacement).toBeLessThan(.201);}
 results.startup=await page.evaluate(()=>({interactiveMarkMs:performance.getEntriesByName('shoulder-interactive').at(-1)?.startTime||null,sourceResources:performance.getEntriesByType('resource').filter(r=>r.name.includes('/shoulder/assets/')).reduce((s,r)=>({decodedBytes:s.decodedBytes+r.decodedBodySize,transferBytes:s.transferBytes+r.transferSize}),{decodedBytes:0,transferBytes:0})}));
 results.final=await page.evaluate(()=>shoulderStudio.metrics());expect(results.errors).toEqual([]);
 console.log(JSON.stringify({deforming:results.deforming.mechanics,recovered:results.recovered,errors:results.errors}));
}finally{await writeFile(out+'/results.json',JSON.stringify(results,null,2));await browser.close();}
