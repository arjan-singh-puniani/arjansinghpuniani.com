import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webkit,chromium,browserOptions} from './runtime.mjs';
const [base,out,engine='webkit']=process.argv.slice(2);assert(base&&out);
fs.mkdirSync(out,{recursive:true});
const report={engine,environment:'Desktop phone emulation; not physical iPhone testing.',errors:[]};
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{...browserOptions,args:['--use-angle=metal']});
try{
 const context=await browser.newContext({viewport:{width:402,height:681},isMobile:true,hasTouch:true,deviceScaleFactor:2}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(base+'?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.locator('#loading').waitFor({state:'hidden'});
 await page.getByText('Arjan',{exact:true}).tap();await page.locator('.arrival-play').tap();
 await page.locator('.championshipHud[data-phase=serving]').waitFor({timeout:20000});
 const target=()=>page.evaluate(()=>window.__rh.game.interactiveMatch.meshes().find(m=>m.id==='serve-aim')?.position);
 const center=await target();assert(center);
 await page.keyboard.down('ArrowLeft');await page.waitForTimeout(80);
 const left=await target();assert(left.x<center.x);
 await page.screenshot({path:out+'/aim-left.png'});await page.keyboard.up('ArrowLeft');
 await page.setViewportSize({width:756,height:352});await page.waitForTimeout(200);
 await page.screenshot({path:out+'/landscape.png'});await page.setViewportSize({width:402,height:681});
 await page.locator('.championshipPause').tap();assert.equal(await target(),undefined);
 await page.getByRole('button',{name:'Resume match',exact:true}).tap();assert(await target());
 const cdp=engine==='chromium'?await context.newCDPSession(page):null;
 if(cdp){
  const pad=await page.locator('.championshipTouchPad').boundingBox(),swing=await page.locator('.championshipSwing').boundingBox();
  const thumb={x:pad.x+pad.width*.9,y:pad.y+pad.height*.5,id:1};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[thumb]});
  await page.waitForTimeout(80);report.selected=await target();
  await page.screenshot({path:out+'/aim-right.png'});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[thumb,{x:swing.x+swing.width/2,y:swing.y+swing.height/2,id:2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});report.multitouch=true;
 }else{
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(80);report.selected=await target();
  await page.screenshot({path:out+'/aim-right.png'});await page.getByRole('button',{name:'Swing racket'}).tap();await page.keyboard.up('ArrowRight');
 }
 assert(report.selected.x>center.x);
 await page.waitForFunction(()=>window.__rh.game.interactiveMatch.pending?.stroke==='serve');
 report.committed=await page.evaluate(()=>{
  const m=window.__rh.game.interactiveMatch,original=m.callbacks.onBounce;
  m.callbacks.onBounce=()=>{window.serveFirstBounce??={...m.ball.position};original?.();};
  return {target:{...m.pending.target},marker:m.meshes().find(v=>v.id==='serve-aim')?.position};
 });
 assert.equal(report.committed.target.x,report.selected.x);assert.equal(report.committed.marker.x,report.selected.x);
 await page.waitForFunction(()=>window.__rh.game.interactiveMatch.ball.active);
 assert.equal(await target(),undefined,'Marker leaves once the serve is struck');
 await page.waitForFunction(()=>window.serveFirstBounce);
 report.landing=await page.evaluate(()=>window.serveFirstBounce);
 assert(Math.hypot(report.landing.x-report.selected.x,report.landing.z-report.selected.z)<.3,'First bounce stays within the placement ring');
 await page.locator('.championshipExit').tap();await page.waitForFunction(()=>!window.__rh.game.championship.active);
 assert.equal(await page.evaluate(()=>window.__rh.game.interactiveMatch),null);
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=error.message;throw error;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report));
