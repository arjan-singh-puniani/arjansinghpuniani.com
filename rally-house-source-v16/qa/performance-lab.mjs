import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';import {homedir} from 'node:os';
import {chromium,firefox,webkit,browserOptions} from './runtime.mjs';
const engine=process.env.QA_ENGINE??'chromium',out=process.env.QA_OUT??`evidence/performance-lab-20261011/${engine}`;fs.mkdirSync(out,{recursive:true});
const webkitPath=process.env.WEBKIT_EXECUTABLE??path.join(homedir(),'Library/Caches/ms-playwright/webkit-2359/pw_run.sh');
const b=await ({chromium,firefox,webkit}[engine]).launch(engine==='chromium'?{...browserOptions,args:['--use-angle=metal']}:{headless:true,...engine==='webkit'&&fs.existsSync(webkitPath)?{executablePath:webkitPath}: {}});
const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[],requests=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)requests.push(`${r.status()} ${r.url()}`);});
await p.goto(`${process.env.QA_URL??'http://127.0.0.1:8078/'}?debug`,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__rh?.ready);
await p.evaluate(()=>{const g=window.__rh.game;g.choosePlayerAvatar('arjan');g.ui.closeContext();g.clock.paused=true;g.camera.pin();});
const baseline=await p.evaluate(async()=>{const g=window.__rh.game,times=[];let last=performance.now();for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-last);last=now;}times.sort((a,b)=>a-b);const gl=g.renderer.gl,ext=gl.getExtension('WEBGL_debug_renderer_info');return {median:times[60],p95:times[114],p99:times[118],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'};});
// Discover the actual object through native controls and complete its embodied approach.
await p.locator('#labBtn').click();await p.locator('button[data-action=analyze]').click();
await p.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<5000&&!g.performanceLab.active;i++)g.updateFixed(1/60);});
assert(await p.evaluate(()=>window.__rh.lab().active),'Station action opens the native lab');
assert.equal(await p.evaluate(()=>window.__rh.game.world.identity.state('performanceLab').uses),1);
const views=[];
for(const [width,height] of [[1920,1080],[1728,1117],[1440,900],[1280,800],[1024,768],[844,390],[430,932],[390,844]]){
 await p.setViewportSize({width,height});
 for(const mode of ['combined','body','court']){
  await p.locator(`[data-mode=${mode}]`).click();
  await p.selectOption('#labSource',mode==='court'?'gait':'forehand');
  await p.evaluate(()=>{const g=window.__rh.game,t=g.performanceLab.timeline;t.playing=false;t.seek(t.clip.frames.find(f=>f.contact)?.time??3);g.performanceLab.update(0,g.settings.reducedMotion);g.camera.target=g.camera.desiredTarget.clone();g.camera.distance=g.camera.desiredDistance;g.camera.azimuth=g.camera.desiredAzimuth;g.camera.elevation=g.camera.desiredElevation;g.camera.pin();g.camera.update(0);});
  await p.waitForTimeout(80);
  const bounds=await p.evaluate(()=>{const layer=document.querySelector('.performance-lab'),buttons=[...layer.querySelectorAll('button,input,select')].map(n=>{const r=n.getBoundingClientRect();return {label:n.textContent||n.getAttribute('aria-label'),width:r.width,height:r.height};});return {overflow:document.documentElement.scrollWidth-innerWidth,buttons,report:window.__rh.lab()};});
  assert.equal(bounds.overflow,0);assert(bounds.buttons.every(n=>n.height>=43.9&&n.width>=43.9),`Touch targets at ${width}×${height}`);
  await p.screenshot({path:`${out}/${width}x${height}-${mode}.png`});views.push({width,height,mode,...bounds});
 }
}
await p.setViewportSize({width:1440,height:900});
// A visible joint has a geometry-aligned canvas hit target, not just a UI shortcut.
await p.locator('[data-mode=body]').click();await p.selectOption('#labSource','forehand');
const knee=await p.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab;g.settings.reducedMotion=false;l.timeline.playing=false;l.timeline.seek(l.timeline.clip.frames.find(f=>f.contact).time);l.focus('elbow');l.update(0,false);g.camera.target=g.camera.desiredTarget.clone();g.camera.distance=g.camera.desiredDistance;g.camera.azimuth=g.camera.desiredAzimuth;g.camera.elevation=g.camera.desiredElevation;g.camera.pin();g.camera.update(0);return g.camera.project(l.timeline.frame.pose.kneeR.clone().add(l.rigOffset(false)));});
await p.mouse.click(knee.x,knee.y);assert.equal(await p.evaluate(()=>window.__rh.lab().focus),'knee');
assert.equal(await p.evaluate(()=>window.__rh.game.performanceLab.rigOffset(false).len()),0,'The default contact overlay is registered');
await p.locator('[data-lab-action=separate]').click();
const separated=await p.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab;return g.camera.project(l.timeline.frame.pose.shoulderR.clone().add(l.rigOffset(false)));});
await p.mouse.click(separated.x,separated.y);assert.equal(await p.evaluate(()=>window.__rh.lab().focus),'shoulder');
await p.locator('[data-lab-action=separate]').click();assert.equal(await p.evaluate(()=>window.__rh.game.performanceLab.rigOffset(false).len()),0);
// Pointer and native keyboard controls are isolated from world and match input.
await p.locator('[data-mode=body]').click();await p.selectOption('#labSource','serve');
await p.locator('[data-joint=shoulder]').click();await p.locator('.lab-transport input').fill('420');
const synchronized=await p.evaluate(()=>{const g=window.__rh.game,t=g.performanceLab.timeline;return {time:t.time,frame:t.frame.time,root:{...g.player.position},clock:g.clock.minutes,speed:t.speed,angle:document.querySelector('.lab-readout').textContent};});
await p.locator('.lab-transport select').selectOption('0.25');
await p.selectOption('#labSource','gait');assert.equal(await p.evaluate(()=>window.__rh.game.performanceLab.timeline.speed),.25);
await p.locator('.lab-transport input').focus();await p.keyboard.press('ArrowRight');
assert.equal(await p.evaluate(()=>window.__rh.game.performanceLab.timeline.playing),false);
const freeze=await p.evaluate(()=>{const g=window.__rh.game,root={...g.player.position},minute=g.clock.minutes;for(let i=0;i<1000;i++)g.updateFixed(1/60);return {root,after:{...g.player.position},minute,afterMinute:g.clock.minutes};});assert.deepEqual(freeze.root,freeze.after);assert(freeze.afterMinute>freeze.minute);
// Bounded lifecycle soak: changing source/view/focus, seeking and exact camera return.
const soak=await p.evaluate(()=>{
 const g=window.__rh.game,l=g.performanceLab;l.close();const camera=g.camera.captureState(),minute=g.clock.minutes,player={...g.player.position},resources=g.activities.active.map(a=>a.resource);
 let maxMeshes=0;
 for(let i=0;i<100;i++){
  l.open(g.player.spec,g.motionRecorder.clip);l.load(['gait','forehand','serve'][i%3]);l.timeline.mode=['court','body','combined'][i%3];l.focus(['knee','hip','ankle','shoulder','elbow'][i%5]);l.timeline.seek((l.timeline.end+l.timeline.start)/2);l.update(0,!!(i%2));maxMeshes=Math.max(maxMeshes,l.meshes(!!(i%2)).length);l.close();
  if(JSON.stringify(g.camera.captureState())!==JSON.stringify(camera))throw Error(`Camera drift at cycle ${i}`);
 }
 if(JSON.stringify(player)!==JSON.stringify(g.player.position)||minute!==g.clock.minutes||JSON.stringify(resources)!==JSON.stringify(g.activities.active.map(a=>a.resource)))throw Error('Live state changed during replay');
 return {cycles:100,maxMeshes,labLayers:document.querySelectorAll('.performance-lab').length,samples:g.motionRecorder.clip.frames.length};
});assert.equal(soak.labLayers,1);
await p.evaluate(()=>window.__rh.openLab());await p.locator('[data-mode=combined]').click();await p.selectOption('#labSource','gait');
const profile=await p.evaluate(async()=>{const g=window.__rh.game;g.performanceLab.timeline.playing=true;g.performanceLab.timeline.speed=1;const times=[];let last=performance.now();for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-last);last=now;}times.sort((a,b)=>a-b);return {median:times[60],p95:times[114],p99:times[118],drawCalls:g.renderer.drawCalls,triangles:g.renderer.triangles,...g.performanceLab.report()};});
await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{const g=window.__rh.game;g.settings.reducedMotion=true;g.performanceLab.load('forehand');});await p.locator('[data-joint=knee]').click();await p.locator('header [data-lab-action=close]').click();assert.equal(await p.evaluate(()=>window.__rh.lab().active),false);
await p.evaluate(()=>{window.__rh.openLab();window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));});assert.equal(await p.evaluate(()=>window.__rh.lab().active),false);assert.equal(await p.locator('.performance-lab').count(),1);await p.locator('#labBtn').click();await p.locator('[data-action=analyze]').click();await p.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<5000&&!g.performanceLab.active;i++)g.updateFixed(1/60);});assert.equal(await p.evaluate(()=>window.__rh.lab().active),true);await p.keyboard.press('Escape');
assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
const report={engine,views:views.length,baseline,profile,synchronized,soak,jointCanvasPick:true,errors,requests,viewportMatrix:views};fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({engine,views:views.length,baseline,profile,soak,jointCanvasPick:true,errors,requests},null,2));await b.close();
