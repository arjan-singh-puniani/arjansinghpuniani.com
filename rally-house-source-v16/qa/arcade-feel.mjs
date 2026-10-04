import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const b=await chromium.launch({...browserOptions,args:['--use-angle=metal']});const results=[];fs.mkdirSync('qa/arcade-feel',{recursive:true});
try{
 for(const touch of [false,true]){
  const context=await b.newContext({viewport:touch?{width:844,height:390}:{width:1280,height:800},hasTouch:touch}),page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:8078'}/?debug`);await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Arjan',{exact:true}).click();
  await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.camera.frameAcademy();g.settings.reducedMotion=true;for(const a of [...g.activities.active])g.cancelActivity(a);g.openCharacter(g.characters.find(c=>c.id==='leo'));});
  await page.waitForTimeout(200);await page.evaluate(()=>window.__rh.game.settings.reducedMotion=false);await page.getByText('Challenge to Match',{exact:true}).click();await page.waitForFunction(()=>window.__rh.game.championship.phase==='serving',null,{timeout:60000});
  await page.evaluate(()=>{
   const g=window.__rh.game,m=g.interactiveMatch,callback=m.callbacks.onRallyContact;
   window.arcadeContacts=[];m.callbacks.onRallyContact=(side,quality)=>{window.arcadeContacts.push({side,quality,frame:performance.now(),gap:m.lastContact?Math.hypot(m.lastContact.x-m.pending.hitter.racketContactFrame().center.x,m.lastContact.z-m.pending.hitter.racketContactFrame().center.z):0});callback?.(side,quality);};
  });
  const start=await page.evaluate(()=>window.__rh.game.player.position.x);
  if(touch){
   const box=await page.locator('.championshipTouchPad').boundingBox();const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:11,x:box.x+box.width*.95,y:box.y+box.height*.5}]});await page.waitForTimeout(250);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  }else{await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');}
  const movement=await page.evaluate(start=>window.__rh.game.player.position.x-start,start);assert(movement>1.1,'Real input is responsive');
  if(touch)await page.locator('.championshipSwing').tap();else await page.keyboard.press('Space');
  await page.waitForFunction(()=>window.arcadeContacts.length>=1);
  for(let i=0;i<3;i++){
   // Intentionally press well before the conventional animation contact lead.
   await page.waitForFunction(()=>{const m=window.__rh.game.interactiveMatch;if(!m?.ball.active||m.receiver!=='player'||m.pending)return false;const t=m.timeToStrikePlane(window.__rh.game.player);return t>.68&&t<.95;});
   const before=await page.evaluate(()=>window.arcadeContacts.filter(c=>c.side==='player').length);
   if(touch)await page.locator('.championshipSwing').tap();else await page.keyboard.press('Space');
   await page.waitForFunction(n=>window.arcadeContacts.filter(c=>c.side==='player').length>n,before);
  }
  await page.screenshot({path:`qa/arcade-feel/${touch?'touch':'desktop'}-rally.png`});
  const contacts=await page.evaluate(()=>window.arcadeContacts);assert(contacts.filter(c=>c.side==='player').every(c=>c.quality!=='frame'&&c.gap<.12));
  const active=await page.locator('.spatial-layer').isVisible();assert.equal(active,false);
  await page.locator('.championshipExit').click();await page.waitForFunction(()=>!window.__rh.game.championship.active);assert(await page.locator('.spatial-layer').isVisible());
  const restored=await page.evaluate(()=>({speed:window.__rh.game.player.getCourtSpeedScale(),competitor:window.__rh.game.player.matchCompetitor}));assert.equal(restored.speed,1);assert.equal(restored.competitor,false);assert.deepEqual(errors,[]);
  results.push({touch,movement,contacts,restored,errors});console.log(touch?'Touch rally PASS':'Keyboard rally PASS',movement,contacts.length);await context.close();
 }
 fs.writeFileSync('qa/arcade-feel/results.json',JSON.stringify(results,null,2));
}finally{await b.close()}
