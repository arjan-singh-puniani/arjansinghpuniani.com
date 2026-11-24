import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const [base,out]=process.argv.slice(2);assert(base&&out);fs.mkdirSync(out,{recursive:true});
const report={environment:'Chromium touch emulation; natural point resolution, no score injection.',errors:[]};
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:402,height:681},isMobile:true,hasTouch:true});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto(base+'?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.locator('#loading').waitFor({state:'hidden'});await page.getByText('Arjan',{exact:true}).tap();await page.locator('.arrival-play').tap();await page.locator('.championshipHud[data-phase=serving]').waitFor({timeout:20000});
 const start=Date.now();let last=0,hintCaptured=false;
 // Serve normally, then let each point resolve through the actual ball simulation.
 while(Date.now()-start<180000){
  const s=await page.evaluate(()=>{const g=window.__rh.game;return {phase:g.championship.phase,server:g.championship.snapshot().server,cue:g.interactiveMatch.playerCue(),score:g.championship.score};});
  if(s.phase==='pointResult'&&!hintCaptured&&await page.getByText('Try Lob to recover',{exact:true}).isVisible()){await page.screenshot({path:out+'/first-return-hint.png'});hintCaptured=true;}
  if(s.phase==='matchResult')break;
  if(((s.phase==='serving'&&s.server==='player'&&s.cue!=='serving')||(s.phase==='rally'&&s.cue==='swing'&&s.score.player+s.score.opponent===0))&&Date.now()-last>800){await page.getByRole('button',{name:'Swing racket',exact:true}).tap();last=Date.now();}
  await page.waitForTimeout(120);
 }
 await page.locator('.championshipHud[data-phase=matchResult]').waitFor({timeout:1000});await page.screenshot({path:out+'/result-portrait.png'});
 const result=await page.evaluate(()=>{const g=window.__rh.game,e=g.mind.events.find(e=>e.kind==='championship');return {score:g.championship.score,event:e,rivalry:g.relations.get(e.subject).rivalry};});assert(result.event&&result.rivalry>0);report.result=result;
 await page.setViewportSize({width:756,height:352});await page.waitForTimeout(500);
 const bounds=await page.locator('.championshipResults').boundingBox();assert(bounds.y>=0&&bounds.y+bounds.height<=352,'Complete result panel fits short landscape');await page.screenshot({path:out+'/result-landscape.png'});
 await page.getByRole('button',{name:'Return to Club',exact:true}).tap();await page.waitForFunction(()=>!window.__rh.game.championship.active);await page.setViewportSize({width:402,height:681});
 const returned=Date.now();let observed=false;report.followupSamples=[];
 while(Date.now()-returned<180000){
  const s=await page.evaluate(id=>{const g=window.__rh.game;return {clock:g.clock.minutes,paused:g.clock.paused,active:g.activities.active.map(a=>({kind:a.kind,people:a.participants,phase:a.phase})),pending:g.mind.events.find(e=>e.id===id)?.pending,scene:[...g.lifeRuns.values()].find(r=>r.scene.eventId===id)?.scene.title};},result.event.id);
  if(!report.followupSamples.length||(Date.now()-returned)/1000-report.followupSamples.at(-1).seconds>10)report.followupSamples.push({seconds:(Date.now()-returned)/1000,...s});
  if(s.scene&&!observed){await page.screenshot({path:out+'/followup.png'});report.scene=s.scene;observed=true;}
  if(s.pending?.length===0)break;await page.waitForTimeout(200);
 }
 assert(observed,'The real club must visibly execute the new follow-up');
 const event=await page.evaluate(id=>window.__rh.game.mind.events.find(e=>e.id===id),result.event.id);assert.equal(event.pending.length,0);report.followupSeconds=(Date.now()-returned)/1000;
 // Persist the actual completed scene, then reload through the normal loader.
 await page.evaluate(()=>window.__rh.game.save());await page.reload();await page.waitForFunction(()=>window.__rh?.ready);await page.locator('#loading').waitFor({state:'hidden'});
 const restored=await page.evaluate(({id,subject})=>{const g=window.__rh.game;return {events:g.mind.events.filter(e=>e.id===id),rivalry:g.relations.get(subject).rivalry};},result.event);assert.equal(restored.events.length,1);assert.equal(restored.events[0].pending.length,0);assert.equal(restored.rivalry,result.rivalry);report.restored=true;
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=e.message;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report));
