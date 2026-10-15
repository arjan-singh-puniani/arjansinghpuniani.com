import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'evidence/arm-detail-20261013/match',baseline=process.env.QA_BASELINE_RUNTIME;fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:`${out}/raw-video`,size:{width:960,height:600}}}),page=await context.newPage(),report={errors:[],http:[],baseline:baseline??null};
if(baseline)await page.route('**/dist/**',async route=>{const relative=new URL(route.request().url()).pathname.split('/dist/')[1],file=path.join(baseline,relative);if(fs.existsSync(file))await route.fulfill({body:fs.readFileSync(file),contentType:'text/javascript'});else await route.continue();});
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.http.push([r.status(),r.url()]);});
try{
 await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Taylor',{exact:true}).click();
 await page.evaluate(()=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.settings.reducedMotion=false;g.startChampionship(g.actor('leo'));});
 await page.waitForFunction(()=>window.__rh.game.championship.phase==='serving',null,{timeout:30000});await page.waitForTimeout(600);
 await page.screenshot({path:`${out}/serving.png`});
 report.presentation=await page.evaluate(()=>{const g=window.__rh.game;return {phase:g.championship.phase,arenaDraws:g.championshipArena?.meshes(0,1,false).length??0,netDraws:g.world.courtDetails?.length??0,items:g.renderItems,drawCalls:g.renderer.drawCalls,triangles:g.renderer.triangles};});
 await page.keyboard.press('Space');
 await page.waitForFunction(()=>window.__rh.game.motionRecorder.clip.frames.some(f=>f.contact),null,{timeout:20000});
 report.contact=await page.evaluate(()=>{const f=window.__rh.game.motionRecorder.clip.frames.find(f=>f.contact);return {time:f.time,error:Math.hypot(f.ball.x-f.pose.racketCenter.x,f.ball.y-f.pose.racketCenter.y,f.ball.z-f.pose.racketCenter.z)};});assert(report.contact.error<.12);
 await page.waitForFunction(()=>window.__rh.game.championship.snapshot().lastPoint!==null,null,{timeout:30000});
 if(!baseline){
  const before=await page.evaluate(()=>({age:window.__rh.game.championshipArena.age,bones:[...window.__rh.game.championshipArena.armMeshes[0].boneMatrices],point:window.__rh.game.championship.snapshot().lastPoint}));
  await page.waitForTimeout(200);const after=await page.evaluate(()=>[...window.__rh.game.championshipArena.armMeshes[0].boneMatrices]);
  report.applause={point:before.point,ageAtObservation:before.age,changed:before.bones.some((v,i)=>Math.abs(v-after[i])>.001)};assert(report.applause.changed,'A real scored point animates gallery arms');
 }
 await page.screenshot({path:`${out}/point.png`});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(800);await page.screenshot({path:`${out}/portrait.png`});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.evaluate(()=>{const g=window.__rh.game;g.settings.reducedMotion=true;});await page.waitForTimeout(100);
 report.reduced=await page.evaluate(()=>{const g=window.__rh.game;return g.championshipArena?g.championshipArena.meshes(0,1,true).filter(m=>m.skin.id.includes('gallery-arms')).map(m=>[...m.boneMatrices]):[];});
 await page.evaluate(()=>window.__rh.game.requestChampionshipExit());await page.waitForFunction(()=>!window.__rh.game.championship.active,null,{timeout:20000});await page.waitForTimeout(1500);
 report.restored=await page.evaluate(()=>{const g=window.__rh.game;return {match:g.player.matchCompetitor,focus:g.sportFocus,gallery:g.championshipArena?.meshes(0,g.sportFocus,false).length??0};});assert(!report.restored.match&&report.restored.gallery===0);
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.http,[]);
}finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');const video=page.video();await context.close();if(video)fs.copyFileSync(await video.path(),`${out}/championship-live.webm`);await browser.close();}
console.log(JSON.stringify({...report,reduced:report.reduced?.length}));
