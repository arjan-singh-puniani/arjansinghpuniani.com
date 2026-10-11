import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium,browserOptions} from './runtime.mjs';
const label=process.argv[2]??'after',out=path.resolve('../takeover-evidence/art-20261010',label);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const report={label,errors:[],shots:[]};
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const page=await browser.newPage({viewport});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:8078/?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Arjan',{exact:true}).click();
 await page.evaluate(()=>{const g=window.__rh.game;g.autosave=-10000;g.clock.minutes=1040;g.clock.paused=true;g.settings.visuals='detail';g.world.weather='clear';g.activeSpeechId=null;g.speechUntil=0;g.ui.hideSpeech();g.camera.frameAcademy();});
 await page.waitForTimeout(1600);await page.screenshot({path:path.join(out,`${viewport.width}-club.png`)});
 if(viewport.width===1440){
 await page.evaluate(()=>{const g=window.__rh.game;const a=g.player;g.camera.autoFrame=false;g.camera.locked=true;g.camera.target.set(a.position.x,1.05,a.position.z);g.camera.desiredTarget=g.camera.target.clone();g.camera.distance=g.camera.desiredDistance=6.0;g.camera.azimuth=g.camera.desiredAzimuth=a.yaw+.35;g.camera.elevation=g.camera.desiredElevation=.20;g.camera.update(0);});
 await page.waitForTimeout(450);await page.locator('canvas').screenshot({path:path.join(out,'portrait.png')});
 if(label==='final'){
 for(const id of ['coach','mika','leo','nia','taylor']){
 await page.evaluate(id=>{const g=window.__rh.game;if(id==='taylor')g.choosePlayerAvatar('taylor');g.clock.paused=true;const a=id==='taylor'?g.player:g.actor(id);g.ui.closeContext();g.ui.hideSpeech();a.path=[];a.setAnimation('idle');a.setLook(undefined);const az=a.position.x>5?-.65:.65;a.yaw=a.targetYaw=az;a.update(.5);g.camera.target.set(a.position.x,1.08,a.position.z);g.camera.desiredTarget=g.camera.target.clone();g.camera.distance=g.camera.desiredDistance=6;g.camera.azimuth=g.camera.desiredAzimuth=az;g.camera.update(0);},id);
 await page.waitForTimeout(450);await page.locator('canvas').screenshot({path:path.join(out,`portrait-${id}.png`)});
 report.shots.push(await page.evaluate(id=>{const g=window.__rh.game,a=id==='taylor'?g.player:g.actor(id);return {portrait:id,controlledIdle:true,position:{...a.position},gl:g.renderer.gl.getError()};},id));
 }await page.evaluate(()=>{const g=window.__rh.game;g.choosePlayerAvatar('arjan');g.camera.locked=false;g.camera.frameAcademy();g.camera.desiredAzimuth=Math.PI/4;g.camera.desiredElevation=.62;});
 }
 await page.evaluate(()=>window.__rh.game.camera.locked=false);
 }
 await page.evaluate(()=>{const g=window.__rh.game;g.settings.reducedMotion=true;for(const a of [...g.activities.active])g.cancelActivity(a);g.startChampionship(g.actor('leo'));for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);if(g.championship.phase!=='serving')throw Error('Entry failed');g.settings.reducedMotion=false;});
 await page.waitForTimeout(1400);await page.screenshot({path:path.join(out,`${viewport.width}-championship.png`)});
 report.shots.push(await page.evaluate(()=>({viewport:innerWidth,drawCalls:window.__rh.game.renderer.drawCalls,triangles:window.__rh.game.renderer.triangles,gl:window.__rh.game.renderer.gl.getError()})));
 if(label==='final')for(const [time,weather] of [[720,'clear'],[1250,'clear'],[1040,'rain']]){
 await page.evaluate(({time,weather})=>{const g=window.__rh.game;g.clock.minutes=time;g.world.weather=weather;},{time,weather});await page.waitForTimeout(2200);
 await page.screenshot({path:path.join(out,`${viewport.width}-${time}-${weather}.png`)});
 report.shots.push(await page.evaluate(()=>({viewport:innerWidth,gl:window.__rh.game.renderer.gl.getError(),time:window.__rh.game.clock.minutes,weather:window.__rh.game.world.weather})));
 }
 await page.close();
 }
 assert.deepEqual(report.errors,[]);assert(report.shots.every(s=>s.gl===0));console.log('Art captures PASS',report.shots);
}finally{fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify(report,null,2));await browser.close();}
