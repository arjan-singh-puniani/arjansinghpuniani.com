import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.PIT_STOP_URL||'http://127.0.0.1:4174',out=process.env.PIT_WHEEL_EVIDENCE||'/tmp/pit-wheel-fix';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PIT_CHROME_METAL==='1'?{channel:'chrome',args:['--use-angle=metal','--enable-gpu']}:{})}),report={checks:[],errors:[]};
try{
 let source=await fs.readFile(new URL('../../public/pit-stop-lab/world.js',import.meta.url),'utf8');
 const anchor='    return { update, render, setView, setCamera, resize,';assert.ok(source.includes(anchor));
 // Test-only access to the same live meshes and matrices used by the renderer.
 source=source.replace(anchor,`    window.__PIT_WHEEL_QA__=()=>{const active=lastSnapshot.cars[lastSnapshot.activeCar-1],object=active.number===1?car:second;return {time:lastSnapshot.time,stopAt:lastSim.stops[active.number-1].stopAt,wheels:Object.entries(stations).map(([key,s])=>{const c=active.corners[key],hub=object.userData.body.localToWorld(new THREE.Vector3(s.side*wheelTrack(key),.355,s.z)),axis=new THREE.Vector3(1,0,0).applyQuaternion(object.userData.body.getWorldQuaternion(new THREE.Quaternion()));return {key,alignment:c.alignment,oldMounted:c.removal===0,newMounted:c.incomingInstalled,hub:hub.toArray(),axis:axis.toArray(),old:read(s.old),incoming:read(s.incoming)};function read(w){let tire;w.traverse(o=>{if(o.isMesh&&o.name.startsWith('Tire_'))tire=o;});if(!tire)throw new Error('Missing runtime tire');tire.geometry.computeBoundingBox();return {center:w.getWorldPosition(new THREE.Vector3()).toArray(),tireCenter:tire.localToWorld(tire.geometry.boundingBox.getCenter(new THREE.Vector3())).toArray(),axis:new THREE.Vector3(1,0,0).applyQuaternion(w.getWorldQuaternion(new THREE.Quaternion())).toArray(),rotation:w.quaternion.toArray()};}})};};\n`+anchor);
 const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out+'/raw-video',size:{width:1440,height:1000}}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/world.js',r=>r.fulfill({body:source,contentType:'text/javascript'}));await page.goto(`${base}/pit-stop-lab/index.html`);await page.waitForFunction(()=>window.__PIT_LAB_STATE__?.render?.heroLoaded);
 await page.locator('button[data-experience=engineer]').click();
 report.measurements=await page.evaluate(()=>{
  const seek=t=>{const el=document.querySelector('#timeline');el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));return window.__PIT_WHEEL_QA__();},distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
  let maxHubError=0,maxPivotError=0,maxAxleError=0,maxRemovedSpin=0,maxStagedHeightError=0,mountedSamples=0;const removed={};
  for(let t=0;t<=7;t+=.025){const frame=seek(t);for(const w of frame.wheels){
   for(const [name,mounted] of [['old',w.oldMounted],['incoming',w.newMounted]]){const tire=w[name];maxPivotError=Math.max(maxPivotError,distance(tire.center,tire.tireCenter));if(mounted){maxHubError=Math.max(maxHubError,distance(tire.center,w.hub));maxAxleError=Math.max(maxAxleError,1-Math.abs(tire.axis.reduce((sum,v,i)=>sum+v*w.axis[i],0)));mountedSamples++;}}
   if(!w.oldMounted){removed[w.key]??=w.old.rotation;maxRemovedSpin=Math.max(maxRemovedSpin,distance(removed[w.key],w.old.rotation));}
   if(frame.time>=frame.stopAt&&w.alignment===0)maxStagedHeightError=Math.max(maxStagedHeightError,Math.abs(w.incoming.center[1]-.355));
  }}
  return {maxHubError,maxPivotError,maxAxleError,maxRemovedSpin,maxStagedHeightError,mountedSamples};
 });
 const m=report.measurements;assert.ok(m.mountedSamples>900);assert.ok(m.maxHubError<1e-8);assert.ok(m.maxPivotError<1e-6);assert.ok(m.maxAxleError<1e-10);assert.ok(m.maxRemovedSpin<1e-10);assert.ok(m.maxStagedHeightError<1e-8);
 report.checks.push('Loaded tire pivots stay concentric','Mounted wheels remain centered on their hubs','Wheel axles stay aligned through rolling turns','Discarded wheels stay still during departure','Staged replacements stay on the floor');
 await page.locator('#hideBtn').click();await page.locator('#camera').evaluate(el=>{el.value='follow';el.dispatchEvent(new Event('change',{bubbles:true}));});
 const seek=async t=>{await page.locator('#timeline').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));},t);await page.waitForTimeout(400);};
 await seek(6.15);await page.waitForTimeout(850);await page.screenshot({path:out+'/turning-wheels.png'});
 await page.locator('button[data-experience=explore]').click();await page.locator('[data-car-camera=wheel]').click();await page.waitForTimeout(850);await page.screenshot({path:out+'/wheel-detail.png'});await page.locator('button[data-experience=engineer]').click();
 await page.locator('#camera').evaluate(el=>{el.value='follow';el.dispatchEvent(new Event('change',{bubbles:true}));});await page.locator('#speed').evaluate(el=>{el.value='.25';el.dispatchEvent(new Event('change',{bubbles:true}));});await seek(4.1);await page.locator('#playBtn').evaluate(el=>el.click());await page.waitForTimeout(11500);
 assert.equal(report.errors.length,0);const video=page.video();await context.close();await video.saveAs(out+'/wheel-motion.webm');await video.delete();
}finally{await fs.writeFile(out+'/wheel-report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2));}
