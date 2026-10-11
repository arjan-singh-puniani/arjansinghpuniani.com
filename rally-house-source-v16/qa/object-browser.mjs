import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium,browserOptions} from './runtime.mjs';
import AxeBuilder from '../../arjan-portfolio/node_modules/@axe-core/playwright/dist/index.js';
const output=path.resolve('../takeover-evidence/objects-20261010');fs.mkdirSync(output,{recursive:true});
const report={errors:[],requests:[],flows:[],viewports:[],accessibility:[],touch:[]};
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{
 const context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:output,size:{width:1280,height:800}}});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.requests.push([r.status(),r.url()]);});
 await page.goto('http://127.0.0.1:8078/?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Arjan',{exact:true}).click();
 await page.waitForTimeout(700);await page.screenshot({path:path.join(output,'club.png')});
 await page.evaluate(()=>{const g=window.__rh.game;g.autosave=-10000;g.clock.paused=true;for(const a of [...g.activities.active])g.cancelActivity(a);g.schedule.update=()=>{};g.everyday.next=g.history.nextSocial=g.history.nextObject=1e12;for(const c of g.characters){c.path=[];c.yieldUntil=1e12;c.setAnimation('idle');}});
 async function select(id){
  await page.evaluate(id=>{const g=window.__rh.game,o=g.world.objects.find(o=>o.id===id);g.camera.focus(o.selection.centre.x,o.selection.centre.z,14);g.camera.desiredAzimuth=id==='courtBench'?-Math.PI/4:Math.PI/4;g.camera.update(1);},id);
  const point=await page.evaluate(id=>{const g=window.__rh.game,o=g.world.objects.find(o=>o.id===id);return g.camera.project(o.selection.centre);},id);
  await page.mouse.click(point.x,point.y);await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>window.__rh.game.spatial.selectedId),id,`Actual ray click ${id}`);
 }
 async function perform(id,action){
  await select(id);await page.locator(`#spatialCard button[data-action="${action}"]`).click();
  const first=await page.evaluate(()=>window.__rh.game.activities.active.find(a=>a.kind==='touch')?.phase);assert.equal(first,'traveling');
  await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<3000;i++){g.updateFixed(1/60);const a=g.activities.active.find(a=>a.kind==='touch');if(a?.phase==='active')break;}g.clock.paused=true;});
  const state=await page.evaluate(()=>{const g=window.__rh.game,a=g.activities.active.find(a=>a.kind==='touch');return {phase:a?.phase,position:{...g.player.position},gesture:g.player.socialGesture,prop:g.player.socialProp,hand:{...g.player.debugKinematics().rightHand}};});assert.equal(state.phase,'active',`${id}/${action} arrives`);
  await page.waitForTimeout(200);await page.screenshot({path:path.join(output,`${id}-${action}.png`)});
  if(id==='bonsai'&&action==='water'){
    await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<45;i++)g.updateFixed(1/60);g.clock.paused=true;g.camera.desiredAzimuth=-Math.PI/4;g.camera.update(2);});await page.waitForTimeout(250);await page.screenshot({path:path.join(output,'bonsai-pour.png')});
  }
  if(id==='clubClock'){
    await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<80;i++)g.updateFixed(1/60);g.clock.paused=true;});
    await page.waitForTimeout(200);await page.screenshot({path:path.join(output,'clock-exploded.png')});
  }
  if(action==='watchSeat'){
    const gaze=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;let samples=0,gap=0;for(let i=0;i<4500&&g.activities.active.some(a=>a.kind==='touch'&&a.phase==='active');i++){g.updateFixed(1/60);const ball=g.socialRally.enabled?g.socialRally.ball:g.rally.ball;if(ball.active){samples++;gap=Math.max(gap,g.player.targetLook?.clone().sub(ball.position).len()??Infinity);if(samples>=120)break;}}g.clock.paused=true;return {samples,seated:g.player.state==='sit',height:g.player.seatHeight,gap};});
    report.seatedWatch=gaze;
    if(gaze.samples<120)report.watchFailure=await page.evaluate(()=>{const g=window.__rh.game;return {active:g.activities.active,history:g.activities.history.slice(0,5),characters:g.characters.map(c=>({id:c.id,position:c.position,path:c.path,index:c.pathIndex,major:c.majorActivity})),routes:[...g.routes]};});
    assert(gaze.samples>=120&&gaze.seated&&gaze.gap<.12,`Seated spectator follows the real rally ball: ${JSON.stringify(gaze)}`);
    await page.waitForTimeout(200);await page.screenshot({path:path.join(output,'seated-rally.png')});
  }
  await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<5000&&g.activities.busy('player');i++)g.updateFixed(1/60);g.clock.paused=true;});
  assert.equal(await page.evaluate(()=>window.__rh.game.activities.busy('player')),false);
  report.flows.push({id,action,...state,history:await page.evaluate(id=>window.__rh.game.world.identity.state(id),id)});
 }
 await perform('bonsai','observe');await perform('bonsai','water');await select('bonsai');assert.equal(await page.locator('#spatialCard button[data-action="water"]').count(),0);assert.match(await page.locator('#spatialCard').innerText(),/Soil is still damp/);
 await perform('clubClock','inspect');await perform('clubBoard','sketch');await perform('clubBoard','erase');await perform('clubBoard','sketch');await perform('courtRack','pluck');await perform('deskBell','ring');await perform('machine','feed');await perform('courtBench','sit');await perform('loungeLamp','light');await perform('cafe','sip');
 await perform('courtBench','watchSeat');
 await page.evaluate(()=>window.__rh.game.save());await page.reload();await page.waitForFunction(()=>window.__rh?.ready);await page.evaluate(()=>window.__rh.game.clock.paused=true);
 const restored=await page.evaluate(()=>({bonsai:window.__rh.game.world.identity.state('bonsai'),board:window.__rh.game.world.identity.state('clubBoard'),lamp:window.__rh.game.world.identity.state('loungeLamp')}));assert.equal(restored.bonsai.uses,2);assert.equal(restored.board.sketched,true);assert.equal(restored.lamp.dimmed,true);report.restored=restored;
 for(const [width,height] of [[1920,1080],[1728,1117],[1440,900],[1280,800],[1024,768],[768,1024],[430,932],[390,844],[375,667],[844,390],[640,800],[390,280]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>{const g=window.__rh.game;g.camera.frameAcademy();g.camera.update(2);g.openBook();});await page.locator('button[data-tab="details"]').click();
  await page.getByRole('button',{name:'Club clock A brass-hearted',exact:false}).click();await page.waitForTimeout(350);
  const box=await page.locator('#spatialCard').boundingBox();assert(box&&box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,`Card fits ${width}x${height}`);
  await page.screenshot({path:path.join(output,`clock-card-${width}x${height}.png`)});report.viewports.push({width,height,box});
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.accessibility.push({width,height,violations:axe.violations});assert.deepEqual(axe.violations,[],`Axe ${width}x${height}`);
 }
 const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const touchPage=await mobile.newPage();await touchPage.goto('http://127.0.0.1:8078/?debug');await touchPage.waitForFunction(()=>window.__rh?.ready);await touchPage.getByText('Arjan',{exact:true}).tap();
 await touchPage.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;const o=g.world.objects.find(o=>o.id==='clubClock');g.camera.focus(o.selection.centre.x,o.selection.centre.z,14);g.camera.update(2);});
 const touchPoint=await touchPage.evaluate(()=>{const g=window.__rh.game;return g.camera.project(g.world.objects.find(o=>o.id==='clubClock').selection.centre);});await touchPage.touchscreen.tap(touchPoint.x,touchPoint.y);assert.equal(await touchPage.evaluate(()=>window.__rh.game.spatial.selectedId),'clubClock');
 await touchPage.locator('#spatialCard button[data-action="inspect"]').tap();assert.equal(await touchPage.evaluate(()=>window.__rh.game.activities.active.filter(a=>a.kind==='touch').length),1);report.touch.push({viewport:'390x844',id:'clubClock',nativeTap:true,activityCount:1});await mobile.close();
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.requests,[]);
 await context.close();console.log('Object browser PASS',report.flows.length,'physical UI flows,',report.viewports.length,'viewports, Axe and native touch, persisted state');
}finally{fs.writeFileSync(path.join(output,'objects.json'),JSON.stringify(report,null,2));await browser.close();}
