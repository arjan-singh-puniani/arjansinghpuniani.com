import {enterClub} from './enter-club.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {homedir} from 'node:os';
import {chromium,firefox,webkit,browserOptions} from './runtime.mjs';
const engine=process.env.QA_ENGINE??'chromium',avatar=process.env.QA_AVATAR??'Taylor',width=Number(process.env.QA_WIDTH??1440),height=width===390?844:900,out=process.env.QA_OUT??`evidence/phone-anchor-20261011/${engine}-${avatar.toLowerCase()}-${width}`;
fs.mkdirSync(out,{recursive:true});const webkitPath=process.env.WEBKIT_EXECUTABLE??path.join(homedir(),'Library/Caches/ms-playwright/webkit-2359/pw_run.sh');
const browser=await ({chromium,firefox,webkit}[engine]).launch(engine==='chromium'?{...browserOptions,args:['--use-angle=metal']}:{headless:true,...engine==='webkit'&&fs.existsSync(webkitPath)?{executablePath:webkitPath}:{}}),context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),report={engine,avatar,width,errors:[],requests:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.requests.push([r.status(),r.url()]);});
try{
 if(process.env.QA_BASELINE_RUNTIME)await page.route('**/dist/**',route=>route.fulfill({path:path.join(process.env.QA_BASELINE_RUNTIME,new URL(route.request().url()).pathname.split('/dist/')[1]),contentType:'text/javascript'}));
 await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:8078'}/?debug`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);await enterClub(page,avatar);
 await page.locator('#labBtn').click();await page.waitForTimeout(250);const find=page.getByRole('button',{name:'Find Performance Lab ↗',exact:true});if(await find.isVisible())await find.click();
 await page.locator('[data-action=capture]').click();
 // Accelerate only navigation. Recording and its video use the real RAF loop.
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<6000&&!g.phoneCapture.active;i++)g.updateFixed(1/60);if(!g.phoneCapture.active)throw Error('Mount interaction never begins');});
 const mounting=await page.waitForFunction(()=>{const g=window.__rh.game;if(g.phoneCapture.phase!=='mounting'||g.player.interactionWeight<=.55)return false;const p=g.player.analysisPose().handR,m=g.phoneCapture.meshes()[0];window.qaPhoneWorld={world:g.world,cast:[...g.characters],minute:g.clock.minutes,mind:g.mind.time};return {phone:g.phoneCapture.report(),handError:Math.hypot(p.x-m.position.x,p.y-m.position.y,p.z-m.position.z)};});
 const hand=await mounting.jsonValue();report.hand=hand;assert.equal(hand.phone.phase,'mounting');assert(hand.handError<1e-6);
 await page.screenshot({path:`${out}/mount.png`});
 await page.waitForFunction(()=>window.__rh.phone().phase==='recording',{timeout:30000});await page.waitForTimeout(600);await page.screenshot({path:`${out}/record.png`});
 await page.waitForFunction(()=>window.__rh.lab().active&&window.__rh.lab().kind==='phone',{timeout:20000});
 if(width<850)await page.locator('.lab-video summary').click();
 const media=page.locator('.lab-video video');await media.waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelector('.lab-video video').readyState>=1);
 report.result=await page.evaluate(async()=>{const g=window.__rh.game,p=g.phoneCapture.last,l=g.performanceLab,video=document.querySelector('.lab-video video'),blob=await fetch(p.url).then(r=>r.blob());return {worldPreserved:g.world===window.qaPhoneWorld.world&&g.characters.every((c,i)=>c===window.qaPhoneWorld.cast[i]),worldAdvanced:g.clock.minutes>window.qaPhoneWorld.minute&&g.mind.time>window.qaPhoneWorld.mind,phone:g.phoneCapture.report(),source:l.timeline.clip.source,kind:l.timeline.clip.kind,samples:p.clip.frames.length,bytes:blob.size,mime:blob.type,duration:video.duration,width:video.videoWidth,height:video.videoHeight,owner:document.querySelector('.performance-lab header small').textContent,uses:g.world.identity.state('performanceLab').uses};});
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('.lab-video-download').click()]);await download.saveAs(`${out}/phone-recording.${report.result.mime.includes('mp4')?'mp4':'webm'}`);assert.equal(report.result.phone.liveTracks,0);
 assert(report.result.worldPreserved&&report.result.worldAdvanced);assert(report.result.bytes>1000);assert.equal(report.result.source,'phone-recording');assert.equal(report.result.kind,'phone');assert(report.result.samples>50&&report.result.samples<=360);assert.equal(report.result.uses,1);assert.match(report.result.owner,/Arjan Singh Puniani/);
 await page.locator('[data-mode=body]').click();await page.locator('.lab-transport [data-lab-action=play]').click();await page.waitForTimeout(650);
 report.sync=await page.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab,v=document.querySelector('.lab-video video'),f=l.timeline.frame;return {video:v.currentTime,time:l.timeline.time,frame:f?.time,error:Math.abs(v.currentTime-l.timeline.time),overflow:document.documentElement.scrollWidth>innerWidth};});assert(report.sync.error<.08);assert(report.sync.time>.2);assert(!report.sync.overflow);
 await page.locator('.lab-transport [data-lab-action=play]').click();await page.locator('.lab-transport input').fill('500');await page.waitForTimeout(150);await page.screenshot({path:`${out}/review.png`});
 report.seek=await page.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab,v=document.querySelector('.lab-video video');return {video:v.currentTime,time:l.timeline.time,readout:document.querySelector('.lab-readout').textContent,camera:{...g.camera.position},opaqueSurfaces:l.timeline.frame.body.filter(m=>(m.alpha??1)>.99).length};});assert(report.seek.camera.z>-9.5&&report.seek.camera.x<12.6,'Replay camera remains inside the real opaque club walls');assert(report.seek.opaqueSurfaces>10);assert(Math.abs(report.seek.video-report.seek.time)<.08);
 const {default:AxeBuilder}=await import('../../arjan-portfolio/node_modules/@axe-core/playwright/dist/index.js');const axe=await new AxeBuilder({page}).analyze();report.axe=axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));assert.deepEqual(report.axe,[]);
 if(width<850){await page.locator('.lab-video summary').click();await page.waitForTimeout(150);await page.screenshot({path:`${out}/review-body.png`});report.bodyView=await page.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab,f=l.timeline.frame,top=g.camera.project({x:f.pose.head.x,y:f.pose.head.y+.52,z:f.pose.head.z}),feet=g.camera.project(f.pose.footR);return {top:top.y,feet:feet.y,videoBottom:document.querySelector('.lab-video').getBoundingClientRect().bottom,panelTop:document.querySelector('.lab-panel').getBoundingClientRect().top};});assert(report.bodyView.top>report.bodyView.videoBottom-5);assert(report.bodyView.feet<report.bodyView.panelTop+5);}
 if(process.env.QA_LIFECYCLE==='1'){
  const oldURL=await page.evaluate(()=>window.__rh.game.phoneCapture.last.url);
  await page.locator('.lab-record').click();
  await page.evaluate(()=>{const g=window.__rh.game;for(let i=0;i<6000&&!g.phoneCapture.active;i++)g.updateFixed(1/60);});
  assert.equal(await page.evaluate(()=>window.__rh.phone().phase),'step-back');
  await page.waitForFunction(()=>window.__rh.phone().phase==='recording',{timeout:30000});
  await page.getByRole('button',{name:'Cancel capture',exact:true}).click();
  report.cancel=await page.evaluate(()=>{const g=window.__rh.game;return {phone:g.phoneCapture.report(),last:g.phoneCapture.last,uses:g.world.identity.state('performanceLab').uses,major:g.player.majorActivity,activity:g.activities.active.filter(a=>a.kind==='touch'&&a.participants.includes('player')).length};});
  assert.equal(report.cancel.phone.active,false);assert.equal(report.cancel.phone.liveTracks,0);assert.equal(report.cancel.last,null);assert.equal(report.cancel.uses,1);assert.equal(report.cancel.major,false);assert.equal(report.cancel.activity,0);
  await page.locator('#labBtn').click();await page.waitForTimeout(250);const findAgain=page.getByRole('button',{name:'Find Performance Lab ↗',exact:true});if(await findAgain.isVisible())await findAgain.click();await page.locator('[data-action=capture]').click();
  await page.evaluate(()=>{const g=window.__rh.game;for(let i=0;i<6000&&!g.phoneCapture.active;i++)g.updateFixed(1/60);});
  await page.waitForFunction(()=>window.__rh.lab().active&&window.__rh.lab().kind==='phone',{timeout:30000});
  report.rerecord=await page.evaluate(()=>{const g=window.__rh.game;return {phone:g.phoneCapture.report(),url:g.phoneCapture.last.url,uses:g.world.identity.state('performanceLab').uses};});assert(report.rerecord.url&&report.rerecord.url!==oldURL);assert.equal(report.rerecord.phone.liveTracks,0);assert.equal(report.rerecord.uses,2);
 }
 await page.locator('header [data-lab-action=close]').click();assert(await page.evaluate(()=>!window.__rh.game.phoneCapture.active&&!window.__rh.game.performanceLab.active&&window.__rh.game.phoneCapture.mounted));
 if(process.env.QA_LIFECYCLE==='1'){await page.evaluate(()=>window.__rh.game.phoneCapture.dispose());assert(await page.evaluate(()=>window.__rh.game.phoneCapture.last===null&&window.__rh.phone().liveTracks===0));report.disposed=true;}
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.requests,[]);
}finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report));
