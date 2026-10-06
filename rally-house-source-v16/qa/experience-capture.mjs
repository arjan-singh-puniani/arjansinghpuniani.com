import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium,browserOptions} from './runtime.mjs';

const output=path.resolve('../takeover-evidence');
for(const dir of ['after','experiments','video'])fs.mkdirSync(path.join(output,dir),{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const report={errors:[],cameras:[],captures:[]};
async function ready(page){
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(process.env.QA_BASE_URL??'http://127.0.0.1:8078/?debug');
  await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Arjan',{exact:true}).click();
  await page.evaluate(()=>{const g=window.__rh.game;g.autosave=-10000;g.clock.minutes=1040;g.clock.paused=true;g.settings.visuals='detail';g.camera.frameAcademy();});
  await page.waitForTimeout(1400);
}
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});await ready(page);
  await page.locator('canvas').screenshot({path:path.join(output,'after/club.png')});
  await page.evaluate(()=>window.__rh.game.openCharacter(window.__rh.game.actor('leo')));await page.waitForTimeout(1500);
  await page.screenshot({path:path.join(output,'after/character.png')});
  await page.getByText('Challenge to Match',{exact:true}).click();
  await page.waitForFunction(()=>window.__rh.championship().phase==='intro',null,{timeout:40000});
  await page.waitForTimeout(700);await page.screenshot({path:path.join(output,'after/transition.png')});
  await page.waitForFunction(()=>window.__rh.championship().phase==='serving');await page.waitForTimeout(500);
  await page.locator('canvas').screenshot({path:path.join(output,'after/match.png')});
  // Freeze the actual authoritative contact/flight frames for reproducible captures.
  await page.evaluate(()=>{
    const g=window.__rh.game,m=g.interactiveMatch;window.qaTick=g.updateFixed.bind(g);window.qaFrozen=false;window.qaStage='contact';
    g.updateFixed=dt=>{if(window.qaFrozen)return;window.qaTick(dt);
      if(window.qaStage==='contact'&&m.pending?.impactStarted&&!m.pending.released)window.qaFrozen=true;
      if(window.qaStage==='incoming'&&m.receiver==='player'&&m.ball.active&&m.ball.position.z>1&&m.ball.position.z<2)window.qaFrozen=true;
    };
  });await page.keyboard.press('Space');
  await page.waitForFunction(()=>window.qaFrozen);await page.locator('canvas').screenshot({path:path.join(output,'after/contact.png')});
  await page.evaluate(()=>{window.qaStage='incoming';window.qaFrozen=false;});
  await page.waitForFunction(()=>window.qaFrozen,null,{timeout:8000});
  await page.screenshot({path:path.join(output,'after/incoming.png')});
  await page.locator('canvas').screenshot({path:path.join(output,'after/rally.png')});
  await page.evaluate(()=>{window.qaFrozen=false;window.qaStage='none';window.__rh.game.updateFixed=window.qaTick;window.__rh.game.requestChampionshipExit();});
  await page.waitForFunction(()=>!window.__rh.game.championship.active);await page.waitForTimeout(400);
  await page.screenshot({path:path.join(output,'after/return.png')});
  await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;g.openObject(g.world.objects.find(o=>o.id==='reception'));});
  await page.getByText('Ring the desk bell',{exact:true}).click();
  await page.waitForFunction(()=>window.__rh.game.activities.active.some(a=>a.kind==='touch'&&a.phase==='active'),null,{timeout:40000});
  await page.waitForTimeout(400);await page.screenshot({path:path.join(output,'after/bell.png')});
  await page.waitForFunction(()=>window.__rh.game.activities.history.some(a=>a.kind==='touch'&&a.phase==='completed'));
  await page.evaluate(()=>window.__rh.game.openObject(window.__rh.game.world.objects.find(o=>o.id==='reception')));
  await page.waitForTimeout(700);await page.screenshot({path:path.join(output,'after/bell-history.png')});await page.close();

  // Camera A/B/C: same paused match, same actors, only authored portrait framing changes.
  const phone=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await ready(phone);
  await phone.evaluate(()=>window.__rh.game.openCharacter(window.__rh.game.actor('leo')));await phone.waitForTimeout(1400);
  await phone.getByText('Challenge to Match',{exact:true}).click();await phone.waitForFunction(()=>window.__rh.championship().phase==='serving',null,{timeout:40000});
  await phone.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;window.qaPose=g.championshipCamera.gameplayPose.bind(g.championshipCamera);});
  for(const profile of [{id:'A',distance:32.6,elevation:.565,fov:45},{id:'B',distance:28.6,elevation:.60,fov:48},{id:'C',distance:26.6,elevation:.62,fov:51}]){
    await phone.evaluate(profile=>{const g=window.__rh.game;g.championshipCamera.gameplayPose=(...args)=>({...window.qaPose(...args),distance:profile.distance,elevation:profile.elevation,fov:profile.fov*Math.PI/180});},profile);
    await phone.waitForTimeout(1200);await phone.screenshot({path:path.join(output,`experiments/camera-${profile.id}.png`)});
    const bounds=await phone.evaluate(()=>{const g=window.__rh.game,V=g.player.position.constructor;return {corners:[[-3.25,-6],[5.25,-6],[-3.25,6],[5.25,6]].map(([x,z])=>g.camera.project(new V(x,.1,z))),player:g.camera.project(g.player.position),opponent:g.camera.project(g.actor('leo').position)};});
    report.cameras.push({...profile,bounds});
  }await phone.close();
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(output,'after/captures.json'),JSON.stringify(report,null,2));console.log('Experience captures and three portrait camera profiles PASS');
}finally{await browser.close();}
