import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {homedir} from 'node:os';
import {chromium,firefox,webkit,browserOptions} from './runtime.mjs';
const engine=process.env.QA_ENGINE??'chromium',width=Number(process.env.QA_WIDTH??1440);
const out=process.env.QA_OUT??`evidence/portfolio-review-20261018/${engine}-${width}`;
fs.mkdirSync(out,{recursive:true});
const wk=path.join(homedir(),'Library/Caches/ms-playwright/webkit-2359/pw_run.sh');
const browser=await {chromium,firefox,webkit}[engine].launch(engine==='chromium'?{...browserOptions,args:['--use-angle=metal']}:{headless:true,...engine==='webkit'&&fs.existsSync(wk)?{executablePath:wk}:{}});
const page=await browser.newPage({viewport:{width,height:width===390?844:900}});
const report={engine,width,errors:[],http:[],returns:[],input:'Actual UI challenge, keyboard movement/serve/attempted returns and review button; controlled initial club availability'};
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.http.push([r.status(),r.url()]);});
try{
 await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);
 await page.getByText('Taylor',{exact:true}).click();await page.locator('#loading').waitFor({state:'hidden'});
 await page.evaluate(()=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.observationStarted=true;g.history.nextSocial=g.history.nextObject=g.everyday.next=1e12;g.clock.paused=true;g.clock.minutes=780;g.settings.visuals='detail';g.camera.frameAcademy();for(let i=0;i<240;i++)g.camera.update(1/60);g.camera.pin();window.reviewWorld={world:g.world,player:g.player,cast:[...g.characters],objects:[...g.world.objects],meshes:JSON.stringify(g.world.meshes)};g.openCharacter(g.actor('leo'));});
 await page.getByText('Challenge to Match',{exact:true}).click();
 await page.waitForFunction(()=>window.__rh.championship().phase==='serving',null,{timeout:60000});
 assert.equal(await page.locator('.championshipReview:visible').count(),0,'No replay invitation before an actual contact');
 await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');await page.keyboard.press('Space');
 await page.waitForFunction(()=>window.__rh.game.motionRecorder.clip.frames.some(f=>f.contact));
 for(let i=0;i<2;i++){
  await page.waitForFunction(()=>{const g=window.__rh.game,m=g.interactiveMatch;if(!m?.ball.active||m.receiver!=='player'||m.pending)return false;const t=m.timeToStrikePlane(g.player);return t>.68&&t<.95;},null,{timeout:15000});
  const last=await page.evaluate(()=>window.__rh.game.motionRecorder.clip.frames.filter(f=>f.contact).at(-1).time);
  await page.keyboard.press('Space');await page.waitForFunction(last=>{const g=window.__rh.game;return g.motionRecorder.clip.frames.some(f=>f.contact&&f.time>last)||!['rally','serving'].includes(g.championship.phase);},last);
  const returned=await page.evaluate(last=>window.__rh.game.motionRecorder.clip.frames.some(f=>f.contact&&f.time>last),last);report.returns.push(returned);if(!returned)break;
 }
 // Stop returning and let the real point finish; do not manufacture a score.
 await page.locator('.championshipQuickReview').waitFor({state:'visible',timeout:20000});
 await page.screenshot({path:`${out}/after-rally.png`});
 report.contact=await page.evaluate(()=>{const g=window.__rh.game;window.reviewClip=g.motionRecorder.clip;const frames=g.motionRecorder.clip.frames,contacts=frames.filter(f=>f.contact);return {count:contacts.length,time:contacts.at(-1).time,frames:frames.length};});
 await page.locator('.championshipQuickReview').click();await page.waitForFunction(()=>window.__rh.game.performanceLab.active);
 await page.waitForFunction(()=>{const c=window.__rh.game.camera;return Math.abs(c.distance-c.desiredDistance)<.03&&Math.hypot(c.target.x-c.desiredTarget.x,c.target.y-c.desiredTarget.y,c.target.z-c.desiredTarget.z)<.03;},null,{timeout:20000});
 report.review=await page.evaluate(()=>{const g=window.__rh.game,q=window.reviewWorld,t=g.performanceLab.timeline;return {sameWorld:g.world===q.world,samePlayer:g.player===q.player,sameCast:g.characters.every((c,i)=>c===q.cast[i]),sameObjects:g.world.objects.every((o,i)=>o===q.objects[i]),sameMeshes:JSON.stringify(g.world.meshes)===q.meshes,sameRecording:t.clip===window.reviewClip,source:t.clip.source,contact:t.frame.contact,time:t.time,playing:t.playing,speed:t.speed,input:g.matchInput.enabled,match:!!g.interactiveMatch,reserved:g.activities.reserved('court'),competitors:[g.player,...g.characters].some(c=>c.matchCompetitor),gl:g.renderer.gl.getError()};});
 for(const key of ['sameWorld','samePlayer','sameCast','sameObjects','sameMeshes','sameRecording','contact'])assert(report.review[key],key);
 assert.equal(report.review.time,report.contact.time);assert.equal(report.review.source,'game-recording');
 for(const key of ['playing','input','match','reserved','competitors'])assert.equal(report.review[key],false,key);
 assert.equal(report.review.speed,.25);assert.equal(report.review.gl,0);
 assert.equal(await page.locator('.lab-transport select').inputValue(),'0.25');
 report.framing=await page.evaluate(()=>{const g=window.__rh.game,f=g.performanceLab.timeline.frame,p=f.pose,racket=f.body.find(m=>m.skin?.id==='adult-tennis-racket-slim-frame-v1');return {head:g.camera.project(p.head),racketTop:racket?g.camera.project(racket.position.clone().add(new g.player.position.constructor(0,.35,0))):null,feet:[g.camera.project(p.footL),g.camera.project(p.footR)],panel:document.querySelector('.lab-panel').getBoundingClientRect().toJSON()};});
 assert(report.framing.head.y>72,'Head clears the analysis header');
 assert(report.framing.racketTop&&report.framing.racketTop.y>72,'Racket head clears the analysis header');
 for(const foot of report.framing.feet){assert(foot.x>8&&foot.x<width-8);assert(foot.y<(width===390?report.framing.panel.top:790)-8,'Body clears analysis controls');}
 await page.screenshot({path:`${out}/contact-review.png`});
 await page.locator('[data-lab-action=play]').click();await page.waitForTimeout(450);await page.locator('[data-lab-action=play]').click();
 assert(await page.evaluate(t=>window.__rh.game.performanceLab.timeline.time>t,report.contact.time),'Replay advances through the recorded motion');
 await page.locator('[data-mode=court]').click();await page.waitForTimeout(250);await page.screenshot({path:`${out}/vector-court.png`});
 await page.locator('[data-lab-action=close]').click();
 report.returned=await page.evaluate(()=>{const g=window.__rh.game;return {lab:g.performanceLab.active,match:g.championship.active,world:g.world===window.reviewWorld.world,court:g.activities.reserved('court')};});
 assert.deepEqual(report.returned,{lab:false,match:false,world:true,court:false});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.http,[]);report.passed=true;
}catch(error){report.failure=error.message;await page.screenshot({path:`${out}/failure.png`}).catch(()=>{});throw error;}
finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report));
