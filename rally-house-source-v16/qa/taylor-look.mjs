import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium,firefox,webkit,browserOptions} from './runtime.mjs';
const engine=process.argv[2]??'chromium';
const out=path.resolve('evidence/taylor-refined-20261011',engine);fs.mkdirSync(out,{recursive:true});
const {homedir}=await import('node:os');
const browser=engine==='chromium'?await chromium.launch({...browserOptions,args:['--use-angle=metal']}):await ({firefox,webkit}[engine]).launch({headless:true,executablePath:path.join(homedir(),'Library/Caches/ms-playwright',engine==='firefox'?'firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox':'webkit-2359/pw_run.sh')});
const report={errors:[],shots:[]};
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:8078/?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Taylor',{exact:true}).click();
  await page.evaluate(()=>{const g=window.__rh.game;g.autosave=-10000;g.clock.minutes=720;g.clock.paused=true;g.settings.visuals='detail';g.world.weather='clear';g.ui.hideSpeech();g.activeSpeechId=null;g.speechUntil=0;const a=g.player;window.qaOriginalPlayer=a.position.clone();a.path=[];a.setAnimation('idle');a.setLook(undefined);a.position.set(0,0,0);a.yaw=a.targetYaw=0;a.update(.5);g.camera.autoFrame=false;g.camera.locked=true;g.camera.target.set(0,1.25,0);g.camera.desiredTarget=g.camera.target.clone();g.camera.distance=g.camera.desiredDistance=8;g.camera.azimuth=g.camera.desiredAzimuth=0;g.camera.elevation=g.camera.desiredElevation=.06;g.camera.update(0);});
  const inspectionStyles=await page.addStyleTag({content:'.toast,.world-notice{visibility:hidden!important}'});
  for(const [name,angle] of [['front',0],['three-quarter',.65],['back',Math.PI]]){
   await page.evaluate(angle=>{const g=window.__rh.game;g.camera.azimuth=g.camera.desiredAzimuth=angle;g.camera.update(0);},angle);await page.waitForTimeout(1000);await page.evaluate(()=>window.__rh.game.ui.hideSpeech());await page.locator('canvas').screenshot({path:path.join(out,`${viewport.width}-${name}.png`)});
   report.shots.push(await page.evaluate(name=>({name,viewport:innerWidth,gl:window.__rh.game.renderer.gl.getError(),draws:window.__rh.game.renderer.drawCalls,triangles:window.__rh.game.renderer.triangles}),name));
  }
  await inspectionStyles.evaluate(el=>el.remove());
  await page.evaluate(()=>{const g=window.__rh.game;g.camera.locked=false;g.player.position.set(window.qaOriginalPlayer.x,window.qaOriginalPlayer.y,window.qaOriginalPlayer.z);for(const a of [...g.activities.active])g.cancelActivity(a);g.settings.reducedMotion=true;g.startChampionship(g.actor('leo'));for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);if(g.championship.phase!=='serving')throw Error('Entry failed');g.settings.reducedMotion=false;});await page.waitForTimeout(1200);await page.screenshot({path:path.join(out,`${viewport.width}-championship.png`)});
  report.shots.push(await page.evaluate(()=>({name:'championship',viewport:innerWidth,gl:window.__rh.game.renderer.gl.getError()})));await page.close();
 }
 assert.deepEqual(report.errors,[]);assert(report.shots.every(s=>s.gl===0));console.log('Taylor visual capture PASS',report.shots);
}finally{fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify(report,null,2));await browser.close();}
