import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit,browserOptions} from './runtime.mjs';
const [base,out,engine='chromium']=process.argv.slice(2);assert(base&&out&&['chromium','webkit'].includes(engine));fs.mkdirSync(out,{recursive:true});
const report={engine,environment:'Desktop browser and touch emulation; not physical iPhone validation.',views:[],errors:[]};
const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{...browserOptions,args:['--use-angle=metal']}:{headless:true});
try{
 for(const [name,width,height,mobile] of [['desktop',1440,900,false],['portrait',402,681,true],['landscape',756,352,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,recordVideo:{dir:out+'/video',size:{width,height}}}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});await page.goto(base+'?debug');await page.waitForFunction(()=>window.__rh?.ready,null,{timeout:60000});await page.locator('#loading').waitFor({state:'hidden'});
  await page.getByText('Arjan',{exact:true}).click();await page.locator('.arrival-play').click();await page.locator('.championshipHud[data-phase=serving]').waitFor({timeout:20000});
  await page.evaluate(()=>{
   const g=window.__rh.game,m=g.interactiveMatch,hit=m.callbacks.onRallyContact;
   window.sliceQA={contacts:[],lobVisible:true};m.callbacks.onRallyContact=(side,quality)=>{hit?.(side,quality);window.sliceQA.contacts.push({side,quality,shot:m.pending.shot,gap:Math.hypot(...['x','y','z'].map(k=>m.stagedBall(m.pending)[k]-m.pending.hitter.racketContactFrame().center[k])),time:performance.now()});};
   const update=g.updateFixed.bind(g);g.updateFixed=dt=>{update(dt);if(m.ball.active&&m.flightHitter==='player'&&m.shotLesson().lastShot==='lob'){const p=g.camera.project(m.visibleBallPosition());window.sliceQA.lobVisible&&=p.x>=0&&p.x<=innerWidth&&p.y>=0&&p.y<=innerHeight;}};
  });
  const row={name,width,height};await page.screenshot({path:out+'/'+name+'-serve.png'});
  if(mobile)await page.getByRole('button',{name:'Swing racket',exact:true}).tap();else await page.keyboard.press('Space');
  await page.locator('.championshipLob').waitFor({state:'visible'});
  const lob=await page.locator('.championshipLob').boundingBox(),swing=await page.locator('.championshipSwing').boundingBox();
  assert(lob.width>=44&&lob.height>=44&&lob.x>=0&&lob.x+lob.width<=width&&lob.y>=0&&lob.y+lob.height<=height);if(mobile)assert(lob.y+lob.height<=swing.y,'Lob and swing must not overlap');
  row.lobBounds=lob;
  // Exercise real key events / simultaneous touch pointers, including recovery after captured aim.
  if(mobile&&engine==='chromium'){
   const cdp=await context.newCDPSession(page),pad=await page.locator('.championshipTouchPad').boundingBox(),left={x:pad.x+pad.width*.35,y:pad.y+pad.height*.5,id:1};
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,{x:lob.x+lob.width/2,y:lob.y+lob.height/2,id:2}]});
   const queued=await page.evaluate(()=>({aim:window.__rh.game.matchInput.bufferedSwingAim(),shot:window.__rh.game.matchInput.bufferedSwingShot()}));assert.equal(queued.shot,'lob');assert(queued.aim<-.18);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await page.evaluate(()=>window.__rh.game.matchInput.movement().x),0);row.twoTouchCancel=true;
  }else if(!mobile){await page.keyboard.down('a');await page.keyboard.press('q');await page.keyboard.up('a');assert.equal(await page.evaluate(()=>window.__rh.game.matchInput.bufferedSwingShot()),'lob');}
  const started=Date.now();let last=0,captured=false,returned=false;
  while(Date.now()-started<90000){
   const state=await page.evaluate(()=>{const g=window.__rh.game,m=g.interactiveMatch;return {phase:g.championship.phase,server:g.championship.snapshot().server,cue:m.playerCue(),lesson:m.shotLesson(),ballY:m.ball.position.y,flight:m.flightHitter,released:m.pending?.released};});
   if(state.lesson.lobs&&state.ballY>2&&state.flight==='player'&&!captured){await page.screenshot({path:out+'/'+name+'-lob.png'});captured=true;}
   if(state.lesson.lobs&&state.lesson.returns>state.lesson.lobs){returned=true;if(captured)break;}
   if(state.phase==='matchResult')break;
   if(Date.now()-last>650&&((state.phase==='serving'&&state.server==='player'&&state.cue!=='serving')||state.cue==='swing')){
    const useLob=state.phase==='rally'&&!state.lesson.lobs;
    if(mobile)await page.getByRole('button',{name:useLob?'Lob — high shot for recovery':'Swing racket',exact:true}).tap();else await page.keyboard.press(useLob?'q':'Space');last=Date.now();
   }
   await page.waitForTimeout(65);
  }
  Object.assign(row,await page.evaluate(()=>({...window.sliceQA,lesson:window.__rh.game.interactiveMatch.shotLesson(),overflow:document.documentElement.scrollWidth>innerWidth})));
  assert(row.lesson.lobs>=1&&returned,'Both shot choices must reach real contact through browser input');assert(captured);assert(row.lobVisible,'High ball remains in the camera frame');assert(!row.overflow);assert(row.contacts.every(c=>c.gap<.13));
  await page.locator('.championshipPause').click();await page.locator('.championshipLob').waitFor({state:'hidden'});await page.getByRole('button',{name:'Resume match',exact:true}).click();
  await page.screenshot({path:out+'/'+name+'-play.png'});report.views.push(row);await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=e.message;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report));
