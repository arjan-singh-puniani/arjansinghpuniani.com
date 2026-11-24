import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit,browserOptions} from './runtime.mjs';
const [base,out,engine='chromium']=process.argv.slice(2);
assert(base&&out&&['chromium','webkit'].includes(engine));fs.mkdirSync(out,{recursive:true});
const report={engine,environment:'Desktop browser; mobile viewport/touch emulation only.',errors:[],layouts:[]};
const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{...browserOptions,args:['--use-angle=metal']}:{headless:true});
let page;
try{
 page=await browser.newPage({viewport:{width:1440,height:900},...(process.env.QA_VIDEO?{recordVideo:{dir:out+'/video',size:{width:1440,height:900}}}:{})});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto(base+'?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.locator('#loading').waitFor({state:'hidden'});
 assert.equal(await page.locator('.lab-video video').evaluate(v=>v.controls),false);
 await page.getByText('Arjan',{exact:true}).click();await page.locator('.arrival-play').click();await page.locator('.championshipHud[data-phase=serving]').waitFor({timeout:20000});
 await page.getByRole('button',{name:'Swing racket',exact:true}).click();
 await page.locator('.championshipLob').waitFor({state:'visible'});
 assert(await page.getByRole('button',{name:'Swing racket',exact:true}).isVisible());
 const start=Date.now();let last=0;
 while(Date.now()-start<70000){
  const s=await page.evaluate(()=>{const g=window.__rh.game;return {phase:g.championship.phase,server:g.championship.snapshot().server,cue:g.interactiveMatch.playerCue(),lesson:g.interactiveMatch.shotLesson()};});
  if(s.lesson.lobs&&s.lesson.returns>s.lesson.lobs){report.contacts=s.lesson;break;}
  if(Date.now()-last>750&&((s.phase==='serving'&&s.server==='player'&&s.cue!=='serving')||s.cue==='swing')){
   await page.getByRole('button',{name:s.phase==='rally'&&!s.lesson.lobs?'Lob — high shot for recovery':'Swing racket',exact:true}).click();last=Date.now();
  }
  await page.waitForTimeout(70);
 }
 assert(report.contacts,'Pointer input must produce a real drive and lob return');
 await page.screenshot({path:out+'/desktop-play.png'});
 await page.getByRole('button',{name:'Pause match',exact:true}).click();await page.getByRole('button',{name:'Resume match',exact:true}).waitFor();
 // A presentation fixture checks the brief contact-praise state without manufacturing a played shot.
 const paused=await page.evaluate(()=>{const g=window.__rh.game,h=g.championshipHud;h.render({...g.championship.snapshot(),phase:'rally'},'Arjan','Leo','nice',false,true,false,true,{returns:1,lobs:1,lastShot:'lob'});return {message:h.message.textContent,cue:h.root.dataset.cue};});
 assert.deepEqual(paused,{message:'',cue:'none'});
 await page.locator('.championshipPausePanel .championshipReview').click();await page.waitForFunction(()=>window.__rh.game.performanceLab.active);
 assert.equal(await page.locator('.lab-video video').evaluate(v=>v.controls),false);
 if(process.env.QA_VIDEO)await page.waitForTimeout(2500);
 await page.locator('#labSource').selectOption('serve');
 for(const phase of ['load','contact','finish']){await page.locator('[data-serve-phase='+phase+']').click();assert((await page.locator('.lab-readout').textContent()).length>0);}
 await page.screenshot({path:out+'/analysis-desktop.png'});
 await page.setViewportSize({width:402,height:681});await page.waitForTimeout(350);await page.screenshot({path:out+'/analysis-portrait.png'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('[data-lab-action=close]').click();await page.getByRole('button',{name:'Resume match',exact:true}).click();
 assert(await page.evaluate(()=>document.activeElement===window.__rh.game.canvas));
 await page.keyboard.down('a');assert(await page.evaluate(()=>window.__rh.game.matchInput.movement().x<0));await page.keyboard.up('a');
 await page.getByRole('button',{name:'Pause match',exact:true}).click();await page.locator('.championshipPausedExit').click();await page.waitForFunction(()=>!window.__rh.game.championship.active);
 report.returnedToClub=true;
 // Cloned panels exercise extreme viewport layout without changing score or saved game state.
 for(const [width,height] of [[640,240],[320,568]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>{const g=window.__rh.game,h=g.championshipHud;h.render({...g.championship.snapshot(),phase:'matchResult',score:{player:7,opponent:5}},'Arjan','Leo','none',false,false,false,true);const clone=h.root.cloneNode(true);clone.id='layout-fixture';document.body.append(clone);document.body.classList.add('championship-active');});
  const panel=page.locator('#layout-fixture .championshipResults'),rect=await panel.boundingBox();assert(rect.y>=0&&rect.y+rect.height<=height);
  if(height<=480)assert.equal(await page.locator('#layout-fixture .championshipScore').isVisible(),false);
  for(const button of await panel.locator('button').all()){await button.scrollIntoViewIfNeeded();const b=await button.boundingBox();assert(b.height>=44&&b.y>=rect.y&&b.y+b.height<=rect.y+rect.height,'Every result action stays reachable');}
  await panel.evaluate(el=>el.scrollTop=0);await page.screenshot({path:out+`/results-${width}.png`});report.layouts.push({width,height,rect});await page.locator('#layout-fixture').evaluate(el=>{el.remove();document.body.classList.remove('championship-active');});
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=e.message;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));try{if(page?.video()){const video=page.video();await page.close();await video.saveAs(out+'/play.webm');fs.unlinkSync(await video.path());}}finally{await browser.close();}}
console.log(JSON.stringify(report));
