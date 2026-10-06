import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,browserOptions} from './runtime.mjs';
const out=path.resolve('../takeover-evidence/after');
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto('http://127.0.0.1:8078/?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Arjan',{exact:true}).click();
 await page.evaluate(()=>{const g=window.__rh.game;g.autosave=-10000;g.clock.minutes=1040;g.clock.paused=false;for(const a of [...g.activities.active])g.cancelActivity(a);g.openObject(g.world.objects.find(o=>o.id==='reception'));});
 await page.getByText('Ring the desk bell',{exact:true}).click();
 await page.waitForFunction(()=>window.__rh.game.activities.active.some(a=>a.kind==='touch'&&a.phase==='active'),null,{timeout:35000});
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.camera.focus(-8.35,5.22,8.5);g.camera.desiredAzimuth=1.2;g.camera.desiredElevation=.45;for(let i=0;i<150;i++){g.player.update(1/60);g.camera.update(1/60);}g.ui.closeContext();});
 await page.locator('canvas').screenshot({path:path.join(out,'bell-detail.png')});
 const poses=[];
 for(const state of ['idle','ready','swingForehand','swingBackhand','serve','sit','watch']){
  await page.evaluate(state=>{const g=window.__rh.game,c=g.player;for(const a of [...g.activities.active])g.cancelActivity(a);g.clock.paused=true;for(const other of g.characters){other.position.set(-11,0,-8);other.path=[];}c.position.set(1,0,2);c.path=[];c.racketStowed=state==='sit';c.seatDepth=state==='sit'?.8:0;c.yaw=c.targetYaw=0;c.setAnimation('idle');c.update(.3);if(['serve','swingForehand','swingBackhand'].includes(state))c.triggerShot(state,new c.position.constructor(1,.1,-5));else c.setAnimation(state);for(let i=0;i<30;i++)c.update(1/60);g.camera.focus(1,2,7);g.camera.desiredAzimuth=.7;g.camera.desiredElevation=.17;for(let i=0;i<150;i++)g.camera.update(1/60);},state);
  await page.screenshot({path:path.join(out,`pose-${state}.png`)});poses.push(state);
 }
 console.log('Close bell and seven representative pose captures:',poses.join(', '));
 await page.close();
 const matrix=[];
 for(const [width,height] of [[1920,1080],[1728,1117],[1440,900],[1280,800],[1024,768],[844,390],[430,932],[390,844],[720,900]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:width<1100}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8078/?debug');await p.waitForFunction(()=>window.__rh?.ready);await p.getByText('Arjan',{exact:true}).click();
  await p.evaluate(()=>{const g=window.__rh.game;g.autosave=-10000;g.clock.paused=true;g.startChampionship(g.actor('leo'));for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);});
  await p.waitForFunction(()=>window.__rh.championship().phase==='serving');await p.waitForTimeout(500);
  const data=await p.evaluate(()=>{const g=window.__rh.game,V=g.player.position.constructor;return {corners:[[-3.25,-6],[5.25,-6],[-3.25,6],[5.25,6]].map(([x,z])=>g.camera.project(new V(x,.1,z))),overflow:document.documentElement.scrollWidth>innerWidth};});
  assert(!data.overflow);for(const c of data.corners)assert(c.x>=0&&c.x<=width&&c.y>=0&&c.y<=height);
  await p.screenshot({path:path.join(out,`match-${width}.png`)});matrix.push({width,height,...data,errors});assert.deepEqual(errors,[]);await p.close();
 }
 fs.writeFileSync(path.join(out,'game-viewports.json'),JSON.stringify(matrix,null,2));console.log('Nine game viewport projections PASS');
}finally{await browser.close();}
