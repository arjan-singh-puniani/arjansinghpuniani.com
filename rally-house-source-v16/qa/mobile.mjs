import assert from 'node:assert/strict';import fs from 'node:fs';
export async function mobileTest(page){
 const browser=page.context().browser(),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),p=await context.newPage();
 await p.goto(page.url());await p.waitForFunction(()=>window.__rh?.ready,null,{timeout:90000});await p.evaluate(()=>{window.__rh.setPaused(true);window.__rh.game.audio.enabled=false});await p.waitForTimeout(1000);
 await p.locator('#coachBtn').tap();await p.waitForTimeout(1000);await p.screenshot({path:'qa/mobile-actions-final.png'});await p.getByText('Drop-feed timing',{exact:true}).waitFor({state:'visible'});await p.locator('#closeContext').tap();
 const cdp=await context.newCDPSession(p);const before=await p.evaluate(()=>window.__rh.game.camera.desiredDistance);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:140,y:350},{x:240,y:350}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:100,y:350},{x:280,y:350}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const after=await p.evaluate(()=>window.__rh.game.camera.desiredDistance);assert(after<before);
 await p.locator('#buildBtn').tap();await p.locator('[data-build=bench]').tap();
 const target=await p.evaluate(()=>{const g=window.__rh.game;g.camera.frameAcademy();for(let i=0;i<100;i++)g.camera.update(1/60);const v=g.player.position.clone().set(-5,0,2);return g.camera.project(v)});
 await p.touchscreen.tap(target.x,target.y);assert.equal(await p.evaluate(()=>window.__rh.game.world.placements.length),1);
 await p.locator('#settingsBtn').tap();await p.getByText('Motion: full',{exact:true}).tap();assert(await p.evaluate(()=>window.__rh.game.settings.reducedMotion));
 await p.screenshot({path:'qa/mobile-settings.png'});await p.locator('#closeContext').tap();await p.keyboard.press('Escape');await p.locator('canvas').focus();await p.keyboard.press('1');await p.waitForFunction(()=>document.getElementById('contextTitle').innerText==='Coach Contessa'&&document.getElementById('context').classList.contains('open'));assert.equal(await p.locator('#contextTitle').innerText(),'Coach Contessa');await p.keyboard.press('Escape');
 await p.setViewportSize({width:844,height:390});await p.locator('#bookBtn').tap();await p.waitForTimeout(1000);await p.screenshot({path:'qa/mobile-landscape.png'});
 fs.writeFileSync('qa/mobile-results.json',JSON.stringify({touchCoaching:true,pinch:{before,after},touchPlacement:true,settings:true,keyboardSelection:true,landscapeBook:true},null,2));await context.close();
}
