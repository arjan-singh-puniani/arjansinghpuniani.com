import {enterClub} from './enter-club.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {homedir} from 'node:os';
import {chromium,firefox,webkit,browserOptions} from './runtime.mjs';

const engine=process.env.QA_ENGINE??'chromium',out=process.env.QA_OUT??`evidence/taylor-human-20261012/${engine}`;
fs.mkdirSync(out,{recursive:true});
const webkitPath=process.env.WEBKIT_EXECUTABLE??path.join(homedir(),'Library/Caches/ms-playwright/webkit-2359/pw_run.sh');
const browser=await ({chromium,firefox,webkit}[engine]).launch(engine==='chromium'?{...browserOptions,args:['--use-angle=metal']}:{headless:true,...engine==='webkit'&&fs.existsSync(webkitPath)?{executablePath:webkitPath}:{}});
const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),report={engine,errors:[],requests:[],views:[]};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)report.requests.push([r.status(),r.url()]);});
try{
 await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);
 await enterClub(page,'Taylor');
 for(const [width,height] of [[1440,900],[390,844]]){
  await page.setViewportSize({width,height});
  const pose=await page.evaluate(async()=>{
   const {rigFromPose,skinMatrices,CHARACTER_SKIN,ATHLETE_WARDROBE}=await import('/dist/animation/CharacterSkin.js');
   const g=window.__rh.game,c=g.player;g.clock.paused=true;
   for(let i=0;i<180;i++)c.update(1/60);c.yaw=0;c.gazeYaw=0;
   const p=c.analysisPose(),m=c.meshes().find(m=>m.skin===CHARACTER_SKIN.taylorHands||m.skin===ATHLETE_WARDROBE.freeHands),expected=skinMatrices(rigFromPose(p,c.position,c.yaw));
   g.camera.autoFrame=false;g.camera.target.set(c.position.x,1.25,c.position.z);g.camera.distance=6.9;g.camera.azimuth=0;g.camera.elevation=.045;g.camera.pin();g.camera.update(0);
   return {avatar:c.spec.avatar,stowed:c.racketStowed,relaxed:p.handL.x<c.position.x&&p.handR.x>c.position.x&&p.handL.y<p.elbowL.y&&p.handR.y<p.elbowR.y,sharedRig:[...m.boneMatrices].every((v,i)=>v===expected[i]),humanFace:c.meshes().some(m=>m.skin?.id==='taylor-human-sculpted-face-v2'),felineParts:c.meshes().filter(m=>m.skin?.id.includes('nemes')||m.skin?.id.includes('tail-gold')||m.skin?.id.includes('inward-reference-ears')).length,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.equal(pose.avatar,'taylor');assert(pose.stowed&&pose.relaxed&&pose.sharedRig);assert(pose.humanFace);assert.equal(pose.felineParts,0);assert(!pose.overflow);
  await page.waitForTimeout(100);await page.screenshot({path:`${out}/${width}-club.png`});report.views.push({width,height,...pose});
 }
 await page.setViewportSize({width:1440,height:900});
 await page.evaluate(()=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.settings.reducedMotion=true;g.startChampionship(g.actor('leo'));for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);if(g.championship.phase!=='serving')throw Error('Championship entry failed');g.clock.paused=false;g.interactiveMatch.prepareShot('player','serve','perfect');});
 await page.waitForFunction(()=>window.__rh.game.motionRecorder.clip.frames.some(f=>f.contact),{timeout:20000});
 await page.waitForTimeout(1400);
 const contact=await page.evaluate(()=>{const g=window.__rh.game,f=g.motionRecorder.clip.frames.find(f=>f.contact);return {stowed:g.player.racketStowed,match:g.player.matchCompetitor,source:g.motionRecorder.clip.source,samples:g.motionRecorder.clip.frames.length,contactError:Math.hypot(f.ball.x-f.pose.racketCenter.x,f.ball.y-f.pose.racketCenter.y,f.ball.z-f.pose.racketCenter.z)};});
 assert(!contact.stowed&&contact.match);assert.equal(contact.source,'game-recording');assert(contact.samples>20&&contact.contactError<.12);report.contact=contact;
 await page.screenshot({path:`${out}/championship.png`});
 await page.evaluate(()=>{const g=window.__rh.game;g.requestChampionshipExit();for(let i=0;i<300;i++)g.updateFixed(1/60);});
 assert.equal(await page.evaluate(()=>window.__rh.game.player.matchCompetitor),false);
 await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);
 const restored=await page.evaluate(()=>({avatar:window.__rh.game.player.spec.avatar,stowed:window.__rh.game.player.racketStowed}));
 assert.equal(restored.avatar,'taylor');assert(restored.stowed);report.restored=restored;
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.requests,[]);
}finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report));
