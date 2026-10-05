fs.mkdirSync('qa/world-interface',{recursive:true});
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const b=await chromium.launch({...browserOptions,args:['--use-angle=metal']});const report={errors:[]};
try{
 const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage();p.setDefaultTimeout(15000);p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:8078'}/?debug`);await p.waitForFunction(()=>window.__rh?.ready);await p.getByText('Arjan',{exact:true}).click();
 await p.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.camera.frameAcademy();});await p.waitForTimeout(150);
 const point=await p.evaluate(()=>{const g=window.__rh.game,c=g.characters.find(c=>c.id==='coach');return g.camera.project({x:c.position.x,y:1.25,z:c.position.z});});
 await p.touchscreen.tap(point.x,point.y);await p.waitForTimeout(100);assert.equal(await p.locator('#spatialTitle').textContent(),'Coach Contessa');
 assert.equal(await p.locator('#spatialCard').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 const close=await p.locator('#spatialCard .close').boundingBox();assert(close.width>=44&&close.height>=44);await p.touchscreen.tap(close.x+22,close.y+22);assert.equal(await p.locator('#spatialCard').isVisible(),false);
 await p.locator('#scenePeek').click();assert(await p.locator('#spatialCard').isVisible());
 // Finite, safe placement after the card reports zero while hidden offscreen.
 await p.evaluate(()=>{const g=window.__rh.game;g.openCharacter(g.characters.find(c=>c.id==='leo'));g.camera.desiredTarget.set(-8,0,5);});await p.waitForTimeout(150);assert(await p.locator('.spatial-return').isVisible());
 await p.locator('.spatial-return').click();await p.waitForTimeout(150);const box=await p.locator('#spatialCard').boundingBox();assert(box&&box.x>=14&&box.x+box.width<=376&&box.y>=74&&box.y+box.height<=756);
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(180);const landscape=await p.locator('#spatialCard').boundingBox();console.log({landscape});assert(landscape&&landscape.y+landscape.height<=302.5);
 await p.screenshot({path:'qa/world-interface/final-touch-landscape.png'});
 // Markers release DOM nodes when authoritative characters disappear.
 await p.evaluate(()=>window.__rh.game.characters=[]);await p.waitForTimeout(650);assert.equal(await p.locator('.world-notice').count(),0);assert.equal(await p.evaluate(()=>window.__rh.game.spatial.selectedId),null);
 report.touch='PASS';report.osReducedMotion='PASS';report.eventFocus='PASS';report.offscreenReturnAndResize='PASS';report.markerCleanup='PASS';assert.deepEqual(report.errors,[]);
 fs.writeFileSync('qa/world-interface/final-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await c.close();
}finally{await b.close()}
