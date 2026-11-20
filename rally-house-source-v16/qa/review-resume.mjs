import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit,browserOptions} from './runtime.mjs';

const [base,out,engine='chromium']=process.argv.slice(2);
assert(base&&out&&['chromium','webkit'].includes(engine));
fs.mkdirSync(out,{recursive:true});
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{...browserOptions,args:['--use-angle=metal']});
const report={engine,errors:[],cycles:[]};
try{
 const page=await browser.newPage({viewport:{width:440,height:763},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(base+'?debug');await page.waitForFunction(()=>window.__rh?.ready);
 await page.locator('#loading').waitFor({state:'hidden'});
 await page.getByText('Arjan',{exact:true}).tap();await page.locator('.arrival-play').tap();
 await page.locator('.championshipHud[data-phase=serving]').waitFor({timeout:20000});
 const rows=page.locator('.championshipScoreRow');
 assert.deepEqual(await rows.locator('.championshipPlayerName').allTextContents(),['Arjan','Leo']);
 assert.deepEqual(await rows.locator('strong').allTextContents(),['0','0']);
 assert.equal(await rows.nth(0).getByRole('img',{name:'Serving'}).count(),1);
 for(const [width,height] of [[320,568],[402,681],[756,352],[440,763],[838,390],[1440,900]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  const score=await page.locator('.championshipScore').boundingBox(),pause=await page.locator('.championshipPause').boundingBox();
  assert(score.x>=0&&score.y>=0&&score.x+score.width<=width&&score.y+score.height<=height);
  assert(score.x+score.width<pause.x,'Scorecard and pause do not overlap');
  const cue=await page.locator('.championshipMessage').boundingBox();
  assert(cue.y>=score.y+score.height||cue.x>=score.x+score.width,'Serve guidance clears the scorecard');
  await page.screenshot({path:out+'/scorecard-'+width+'.png'});
 }
 await page.setViewportSize({width:440,height:763});
 await page.getByRole('button',{name:'Swing racket'}).tap();
 await page.waitForFunction(()=>window.__rh.game.motionRecorder.clip.frames.some(f=>f.contact));
 await page.locator('.championshipPause').tap();
 // Record a real live serve; only the later score fixtures accelerate lifecycle coverage.
 for(let i=0;i<3;i++){
  const before=await page.evaluate(()=>{
   const g=window.__rh.game;window.reviewMatch=g.interactiveMatch;window.reviewRecording=g.motionRecorder.clip;
   return JSON.stringify({score:g.championship.score,phase:g.championship.phase,ball:g.interactiveMatch.ball.position,time:g.player.animTime,frames:g.motionRecorder.clip.frames.length});
  });
  await page.locator('.championshipPausePanel .championshipReview').tap();
  await page.waitForFunction(()=>window.__rh.game.performanceLab.active);
  await page.waitForTimeout(700);
  const state=await page.evaluate(()=>{
   const g=window.__rh.game;
   return {match:g.championship.active,sameMatch:g.interactiveMatch===window.reviewMatch,sameClip:g.performanceLab.timeline.clip===window.reviewRecording,reserved:g.activities.reserved('court'),input:g.matchInput.enabled,paused:g.clock.paused,hudHidden:document.querySelector('.championshipHud').hidden};
  });
  const speed=page.getByRole('combobox',{name:'Replay speed'});
  assert(await speed.evaluate(e=>{const s=getComputedStyle(e),text=document.createElement('canvas').getContext('2d');text.font=s.font;return e.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)>=text.measureText(e.selectedOptions[0].textContent).width;}),'Replay speed leaves room for its chevron');
  await page.screenshot({path:out+'/review-'+i+'.png'});
  assert.deepEqual(state,{match:true,sameMatch:true,sameClip:true,reserved:true,input:false,paused:true,hudHidden:true});
  assert.equal(await page.locator('.lab-record').isVisible(),false);
  const azimuth=await page.evaluate(()=>window.__rh.game.camera.desiredAzimuth);
  await page.mouse.move(180,180);await page.mouse.down();await page.mouse.move(230,180,{steps:5});await page.mouse.up();
  assert.notEqual(await page.evaluate(()=>window.__rh.game.camera.desiredAzimuth),azimuth,'Review camera still orbits while the match is reserved');
  for(const phase of ['load','contact','finish']){
   const b=page.locator('[data-serve-phase='+phase+']');if(await b.isVisible())await b.tap();
  }
  await page.getByRole('button',{name:'Back to match',exact:true}).tap();
  await page.getByRole('button',{name:'Resume match',exact:true}).waitFor();
  const after=await page.evaluate(()=>{
   const g=window.__rh.game;
   return JSON.stringify({score:g.championship.score,phase:g.championship.phase,ball:g.interactiveMatch.ball.position,time:g.player.animTime,frames:g.motionRecorder.clip.frames.length});
  });
  assert.equal(after,before,'Review must preserve the exact frozen match, including its recording');
  report.cycles.push(state);
  if(i===0)await page.evaluate(()=>window.__rh.game.championship.resolvePoint({winner:'player',reason:'winner',rallyLength:1}));
 }
 await page.getByRole('button',{name:'Resume match',exact:true}).tap();
 assert(await page.evaluate(()=>!window.__rh.game.clock.paused));
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Resume match',exact:true}).waitFor();
 assert(await page.evaluate(()=>window.__rh.game.championship.active),'Escape pauses without abandoning the match');
 await page.screenshot({path:out+'/back-to-match.png'});
 // Boundary score fixtures verify deuce and match point without manufacturing gameplay evidence.
 for(const [player,opponent,expected] of [[0,0,'First to 7 · Win by 2'],[6,5,'Your match point'],[6,6,'First to 7 · Win by 2'],[6,7,'Leo’s match point'],[9,8,'Your match point']]){
  await page.evaluate(({player,opponent})=>{window.__rh.game.championship.scoreValue={player,opponent};},{player,opponent});
  await page.waitForFunction(({expected,player,opponent})=>document.querySelector('.championshipScore small').textContent===expected&&[...document.querySelectorAll('.championshipScoreRow strong')].map(e=>e.textContent).join(',')===`${player},${opponent}`,{expected,player,opponent});
  assert.deepEqual(await rows.locator('strong').allTextContents(),[String(player),String(opponent)]);
 }
 for(const server of ['opponent','player']){
  await page.evaluate(server=>{window.__rh.game.championship.serverValue=server;},server);
  await page.waitForFunction(server=>[...document.querySelectorAll('.championshipServer')].findIndex(e=>!e.hidden)===(server==='player'?0:1),server);
  assert.equal(await page.getByRole('img',{name:'Serving'}).count(),1);
 }
 for(const [width,height] of [[440,763],[402,580],[756,352],[1440,900]]){
  await page.setViewportSize({width,height});
  const panel=await page.locator('.championshipPausePanel').boundingBox();
  assert(panel.x>=0&&panel.y>=0&&panel.x+panel.width<=width&&panel.y+panel.height<=height,'Pause panel fits '+width+'×'+height);
  await page.screenshot({path:out+'/pause-'+width+'.png'});
 }
 await page.evaluate(()=>{const g=window.__rh.game;g.championship.phaseValue='serving';g.championship.resolvePoint({winner:'player',reason:'winner',rallyLength:1});g.clock.paused=false;});
 await page.locator('.championshipResults').waitFor();
 assert.equal(await page.getByRole('button',{name:'Analyze last swing',exact:true}).count(),1,'Results offer one review action');
 assert.equal(await page.getByRole('img',{name:'Serving'}).count(),0,'A completed match has no server');
 await page.screenshot({path:out+'/results.png'});
 const funds=await page.evaluate(()=>window.__rh.game.coins);
 await page.locator('.championshipResults .championshipReview').click();
 await page.getByRole('button',{name:'Back to match',exact:true}).click();
 await page.locator('.championshipResults').waitFor();
 assert.equal(await page.evaluate(()=>window.__rh.game.coins),funds,'Review cannot award completion funds again');
 assert.equal(await page.locator('.championshipPausePanel').isVisible(),false);
 await page.getByRole('button',{name:'Rematch',exact:true}).click();
 await page.locator('.championshipHud[data-phase=serving]').waitFor();
 assert.deepEqual(await page.evaluate(()=>window.__rh.game.championship.score),{player:0,opponent:0});
 await page.locator('.championshipExit').click();await page.waitForFunction(()=>!window.__rh.game.championship.active);
 assert.equal(await page.evaluate(()=>window.__rh.game.reviewingChampionship),false);
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=e.message;throw e;}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report));
