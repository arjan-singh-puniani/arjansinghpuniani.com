import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const output='qa/world-interface';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const report={viewports:[],errors:[]};
async function ready(page){
 page.setDefaultTimeout(25000);
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:8078'}/?debug`);await page.waitForFunction(()=>window.__rh?.ready);
 if(await page.getByText('Arjan',{exact:true}).isVisible())await page.getByText('Arjan',{exact:true}).click();
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.camera.frameAcademy();g.settings.visuals='detail';});
 await page.waitForTimeout(800);
}
async function bounds(page){
 const b=await page.locator('#spatialCard').boundingBox(),v=page.viewportSize();
 assert(b,'Card visible');assert(b.x>=0&&b.y>=0&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height-65,'Card within safe viewport');return b;
}
try{
 for(const viewport of [{width:1280,height:800},{width:1024,height:768},{width:390,height:844},{width:844,height:390}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:2});const page=await context.newPage();await ready(page);
  await page.screenshot({path:`${output}/${viewport.width}-overview.png`});
  for(const id of ['leo','mika','coach','nia']){
   await page.evaluate(id=>{const g=window.__rh.game;g.openCharacter(g.characters.find(c=>c.id===id));},id);
   await page.waitForTimeout(850);await bounds(page);
   const actual=await page.evaluate(id=>{const g=window.__rh.game;return Math.round(g.mind.states[id].energy*100)},id);
   assert((await page.locator('.spatial-status').textContent()).includes(`Energy ${actual}%`));
  }
  await page.evaluate(()=>{const g=window.__rh.game;g.openCharacter(g.characters.find(c=>c.id==='leo'));});await page.waitForTimeout(850);
  await page.screenshot({path:`${output}/${viewport.width}-leo.png`});
  const before=await page.evaluate(()=>{const g=window.__rh.game;return {path:g.player.path.map(p=>[p.x,p.z]),target:[g.camera.desiredTarget.x,g.camera.desiredTarget.z]};});
  await page.locator('#spatialCard .close').click();assert.equal(await page.locator('#spatialCard').isVisible(),false);
  assert.deepEqual(await page.evaluate(()=>{const g=window.__rh.game;return {path:g.player.path.map(p=>[p.x,p.z]),target:[g.camera.desiredTarget.x,g.camera.desiredTarget.z]};}),before,'UI click must not move player/camera');
  await page.evaluate(()=>{const g=window.__rh.game;g.openObject(g.world.objects.find(o=>o.id==='reception'));});await page.waitForTimeout(850);await bounds(page);
  await page.screenshot({path:`${output}/${viewport.width}-desk.png`});
  await page.locator('#spatialCard .close').click();
  // Camera motion and resize must continue tracking a selected member.
  await page.evaluate(()=>{const g=window.__rh.game;g.openCharacter(g.characters.find(c=>c.id==='leo'));g.camera.pan(90,25);});await page.waitForTimeout(500);
  if(await page.locator('#spatialCard').isVisible())await bounds(page);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
  if(await page.locator('#spatialCard').isVisible())await bounds(page);
  await page.evaluate(()=>{const g=window.__rh.game;g.settings.reducedMotion=true;g.camera.frameAcademy();g.openCharacter(g.characters.find(c=>c.id==='leo'));});await page.waitForTimeout(100);await bounds(page);
  assert(await page.locator('.spatial-layer').evaluate(el=>el.classList.contains('reduced-motion')));
  // Selection disappears when the authoritative entity disappears.
  await page.evaluate(()=>{const g=window.__rh.game;g.characters=g.characters.filter(c=>c.id!=='leo');});await page.waitForTimeout(80);
  assert.equal(await page.locator('#spatialCard').isVisible(),false);assert.equal(await page.evaluate(()=>window.__rh.game.spatial.selectedId),null);
  console.log('Viewport PASS',viewport.width,viewport.height);report.viewports.push({...viewport,status:'PASS'});await context.close();
 }
 const context=await browser.newContext({viewport:{width:1280,height:800}});const page=await context.newPage();await ready(page);
 // Real pointer selection and keyboard routing use the canvas, not debug selection.
 const point=await page.evaluate(()=>{const g=window.__rh.game,c=g.characters.find(c=>c.id==='leo');return g.camera.project({x:c.position.x,y:1.25,z:c.position.z});});
 await page.mouse.click(point.x,point.y);await page.waitForTimeout(150);assert.equal(await page.locator('#spatialTitle').textContent(),'Leo');
 const route=await page.evaluate(()=>window.__rh.game.player.path.map(p=>[p.x,p.z]));
 await page.keyboard.press('ArrowRight');assert.deepEqual(await page.evaluate(()=>window.__rh.game.player.path.map(p=>[p.x,p.z])),route);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#spatialCard').isVisible(),false);
 await page.locator('#game').focus();await page.keyboard.press('1');assert.equal(await page.locator('#spatialTitle').textContent(),'Coach Contessa');await page.keyboard.press('Escape');
 // A reservation appearing after selection removes the stale action on refresh.
 await page.evaluate(()=>{const g=window.__rh.game;g.openCharacter(g.characters.find(c=>c.id==='leo'));g.activities.begin('qa-reservation',['leo'],'qa-place');});await page.waitForTimeout(450);
 assert.equal(await page.locator('#spatialCard [data-action="challenge"]').count(),0);
 await page.evaluate(()=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.ui.closeContext();});
 report.pointerAndLiveAvailability='PASS';
 // Actual tactile interaction completes and records its existing transaction.
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;g.openObject(g.world.objects.find(o=>o.id==='reception'));});
 await page.getByText('Ring the desk bell',{exact:true}).click();
 await page.waitForFunction(()=>window.__rh.game.activities.active.some(a=>a.kind==='touch'&&a.phase==='active'),null,{timeout:40000});
 await page.screenshot({path:`${output}/embodied-bell.png`});
 await page.waitForFunction(()=>window.__rh.game.activities.history.some(a=>a.kind==='touch'&&a.phase==='completed'));
 console.log('Bell PASS');report.embodiedBell='PASS';
 // Additional props invoke the existing travel/animation/effect transaction.
 for(const id of ['journal','proshop','cafe','bonsai']){
  await page.evaluate(id=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.clock.paused=true;g.openObject(g.world.objects.find(o=>o.id===id));},id);
  await page.locator('#spatialCard [data-action="touch"]').click();
  const receipt=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<2400;i++)g.updateFixed(1/60);g.clock.paused=true;return g.activities.history.find(a=>a.kind==='touch');});
  assert.equal(receipt.phase,'completed');
 }
 report.additionalProps=['journal','proshop','cafe','bonsai'];
 // Expose a real prop history through the same presentation language.
 await page.evaluate(()=>{const g=window.__rh.game;g.world.placements.push({id:'qa-bench',type:'bench',x:-6,z:5});g.affordances.sync(g.world.placements,g.clock.day);g.affordances.visit('qa-bench',['player'],g.clock.day);g.openFurniture(g.world.placements.at(-1));});
 assert((await page.locator('.spatial-facts').textContent()).includes('1 completed visit'));
 await page.evaluate(()=>{const g=window.__rh.game;g.world.placements=g.world.placements.filter(p=>p.id!=='qa-bench');});await page.waitForTimeout(100);assert.equal(await page.locator('#spatialCard').isVisible(),false);
 // Clear current autonomous reservations through the actual cancellation path.
 await page.evaluate(()=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.clock.paused=true;g.settings.reducedMotion=false;g.openCharacter(g.characters.find(c=>c.id==='leo'));});await page.waitForTimeout(300);
 await page.evaluate(()=>window.__rh.game.camera.pin());
 const camera=await page.evaluate(()=>window.__rh.game.camera.captureState());
 await page.getByText('Challenge to Match',{exact:true}).click();
 await page.waitForFunction(()=>window.__rh.game.championship.phase==='serving',null,{timeout:60000});
 assert.equal(await page.locator('.spatial-layer').isVisible(),false);assert.equal(await page.locator('#spatialCard').isVisible(),false);
 await page.screenshot({path:`${output}/championship.png`});
 await page.keyboard.press('Space');await page.waitForTimeout(1800);
 console.log('Championship serving');
 for(let i=0;i<12;i++){
  if(await page.evaluate(()=>window.__rh.game.championship.phase==='matchResult'))break;
  await page.waitForFunction(()=>['serving','rally'].includes(window.__rh.game.championship.phase));
  console.log('Point',i,await page.evaluate(()=>window.__rh.championshipPoint('player')));
 }
 await page.waitForFunction(()=>window.__rh.game.championship.phase==='matchResult');
 await page.locator('.championshipResults').getByRole('button',{name:'Return to Club',exact:true}).click();
 await page.waitForFunction(()=>!window.__rh.game.championship.active);
 assert.deepEqual(await page.evaluate(()=>window.__rh.game.camera.captureState()),camera);
 assert(await page.locator('.spatial-layer').isVisible());
 await page.evaluate(()=>{const g=window.__rh.game;g.openCharacter(g.characters.find(c=>c.id==='leo'));});assert(await page.locator('#spatialCard').isVisible());
 await page.getByText('Challenge to Match',{exact:true}).click();
 await page.waitForFunction(()=>window.__rh.game.championship.phase==='serving',null,{timeout:60000});
 await page.locator('.championshipExit').click();await page.waitForFunction(()=>!window.__rh.game.championship.active);
 report.championship='PASS';
 await page.reload();await page.waitForFunction(()=>window.__rh?.ready);assert.equal(await page.locator('.spatial-layer').count(),1);report.reload='PASS';
 await context.close();assert.deepEqual(report.errors,[]);
 fs.writeFileSync(`${output}/results.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}
