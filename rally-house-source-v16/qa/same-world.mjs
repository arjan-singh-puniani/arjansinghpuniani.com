import {enterClub} from './enter-club.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {homedir} from 'node:os';
import {chromium,firefox,webkit,browserOptions} from './runtime.mjs';
const engine=process.env.QA_ENGINE??'chromium',out=process.env.QA_OUT??`evidence/same-world-20261016/${engine}`;
fs.mkdirSync(out,{recursive:true});
const wk=path.join(homedir(),'Library/Caches/ms-playwright/webkit-2359/pw_run.sh');
const browser=await {chromium,firefox,webkit}[engine].launch(engine==='chromium'?{...browserOptions,args:['--use-angle=metal']}:{headless:true,...engine==='webkit'&&fs.existsSync(wk)?{executablePath:wk}:{}});
const width=Number(process.env.QA_WIDTH??1440),height=width===390?844:900;
const page=await browser.newPage({viewport:{width,height}}),report={engine,errors:[],http:[],stages:[],cycles:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.http.push([r.status(),r.url()]);});
const audit=async label=>{
 const data=await page.evaluate(label=>{
  const g=window.__rh.game,q=window.qaContinuity,items=q.items??[],near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-5;
  return {label,world:g.world===q.world,objects:g.world.objects.length===q.objects.length&&g.world.objects.every((o,i)=>o===q.objects[i]),cast:g.characters.length===q.cast.length&&g.characters.every((c,i)=>c===q.cast[i])&&g.player===q.player,
   transforms:JSON.stringify(g.world.meshes)===q.transforms,placements:JSON.stringify(g.world.placements)===q.placements,net:g.world.courtDetails===q.net&&q.net.every(m=>items.includes(m)),
   staticVisible:g.world.meshes.every(m=>items.some(n=>n.position===m.position&&n.scale===m.scale)),npcBodies:g.characters.filter(c=>items.some(m=>['taylor-human-sculpted-face-v2','athlete-human-masculine-jaw-v1'].includes(m.skin?.id)&&near(m.position,c.analysisPose().head))).length,
   artificialCrowd:items.filter(m=>m.id==='spectatorRow'||m.skin?.id.includes('championship-gallery')).length,courtLayers:items.filter(m=>m.id==='court').length,expectedCourtLayers:g.world.meshes.filter(m=>m.id==='court').length+q.net.filter(m=>m.id==='court').length,
   minute:g.clock.minutes,weather:g.world.weather,lighting:JSON.stringify(g.world.lighting(g.clock.minutes,1))===JSON.stringify(g.world.lighting(g.clock.minutes,0)),
   labState:JSON.stringify(g.world.identity.state('performanceLab'))===q.labState,activity:q.activity?{same:g.activities.active.includes(q.activity)||g.activities.history.some(a=>a.id===q.activity.id),phase:q.activity.phase,elapsed:q.activity.elapsed}:null,
   phase:g.championship.phase,lab:g.performanceLab.active,framing:label.startsWith('C ')?{foot:g.camera.project(g.player.analysisPose().footL),head:g.camera.project(g.player.analysisPose().head),width:innerWidth,height:innerHeight}:null,gl:g.renderer.gl.getError()};
 },label);
 for(const key of ['world','objects','cast','transforms','placements','net','staticVisible','lighting','labState'])assert(data[key],`${label}: ${key}`);
 if(data.framing){const {foot,head,width,height}=data.framing;assert(foot.x>12&&foot.x<width-12&&foot.y<height-45&&head.y>45,'Full player body stays within match viewport');}
 assert.equal(data.npcBodies,4,`${label}: all real club members rendered`);assert.equal(data.artificialCrowd,0);assert.equal(data.courtLayers,data.expectedCourtLayers);assert.equal(data.gl,0);report.stages.push(data);return data;
};
try{
 await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:8078'}/?debug`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);await enterClub(page,'Taylor');
 // Establish a known club before A. No fixture preparation occurs between A-D.
 await page.evaluate(()=>{
  const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.observationStarted=true;g.history.nextSocial=g.history.nextObject=1e12;g.everyday.next=1e12;g.clock.minutes=780;g.clock.paused=true;g.clock.speed=1;g.settings.visuals='detail';
  const activity=g.startBreak(undefined,'mika','nia');
  g.camera.frameAcademy();for(let i=0;i<180;i++)g.camera.update(1/60);g.camera.pin();
  const q=window.qaContinuity={world:g.world,objects:[...g.world.objects],cast:[...g.characters],player:g.player,transforms:JSON.stringify(g.world.meshes),placements:JSON.stringify(g.world.placements),net:g.world.courtDetails,labState:JSON.stringify(g.world.identity.state('performanceLab')),activity,items:[]};
  const render=g.renderer.render.bind(g.renderer);g.renderer.render=(items,...args)=>{q.items=items;return render(items,...args);};
 });
 await page.waitForTimeout(100);await audit('A club');
 report.boneUploads=await page.evaluate(()=>{
  const g=window.__rh.game,r=g.renderer,gl=r.gl,items=window.qaContinuity.items,upload=gl.uniformMatrix4fv,rows=[];let uploads=0;
  gl.uniformMatrix4fv=function(...args){if(args[2].length===240)uploads++;return upload.apply(this,args);};
  const cache=enabled=>{for(const key of ['skinBones','shadowBones'])Object.defineProperty(r,key,enabled?{value:null,writable:true,configurable:true}:{get:()=>null,set:()=>{},configurable:true});};
  try{for(const minute of [780,1190]){
   const vp=g.camera.viewProjection(),light=g.world.lighting(minute),position=g.camera.position;
   const draw=enabled=>{cache(enabled);uploads=0;r.render(items,vp,light,position);const pixels=new Uint8Array(g.canvas.width*g.canvas.height*4);gl.readPixels(0,0,g.canvas.width,g.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return {pixels,uploads,triangles:r.triangles};};
   const cached=draw(true),repeated=draw(false);let changed=0;
   for(let i=0;i<cached.pixels.length;i++)if(cached.pixels[i]!==repeated.pixels[i])changed++;
   rows.push({minute,cached:cached.uploads,repeated:repeated.uploads,changedChannels:changed,trianglesMatch:cached.triangles===repeated.triangles,gl:gl.getError()});
  }}finally{cache(true);gl.uniformMatrix4fv=upload;}
  return rows;
 });
 for(const row of report.boneUploads){assert(row.cached<row.repeated*.2,'Shared poses avoid repeated GPU matrix uploads');assert.equal(row.changedChannels,0,'GPU pose reuse preserves the exact day/evening image');assert(row.trianglesMatch);assert.equal(row.gl,0);}
 await page.screenshot({path:`${out}/A-club.png`});
 for(let cycle=0;cycle<3;cycle++){
  await page.evaluate(()=>{const g=window.__rh.game;g.camera.pin();window.qaContinuity.camera=g.camera.captureState();g.startChampionship(g.actor('leo'));if(!g.championship.active)throw Error('Challenge rejected unexpectedly');});
  if(cycle===2){await page.evaluate(()=>window.__rh.game.requestChampionshipExit());}
  else{
   await page.evaluate(()=>{const g=window.__rh.game;for(let i=0;i<6000&&g.championship.phase==='challenge';i++)g.updateFixed(1/60);if(g.championship.phase!=='intro')throw Error('Participants did not reach the same court');});
   if(cycle===0){await page.waitForTimeout(180);await audit('B establish/orbit');await page.screenshot({path:`${out}/B-transition.png`});}
   await page.waitForFunction(()=>window.__rh.championship().phase==='serving',null,{timeout:15000});await page.waitForTimeout(400);
   await audit(`C gameplay ${cycle}`);if(cycle===0)await page.screenshot({path:`${out}/C-gameplay.png`});
   if(cycle===0){await page.keyboard.press('Space');await page.waitForFunction(()=>window.__rh.game.motionRecorder.clip.frames.some(f=>f.contact),null,{timeout:10000});}
   if(cycle===1){
    // Exercise result memory with controller events; this is not human-play evidence.
    for(let i=0;i<12;i++){if(await page.evaluate(()=>window.__rh.championship().phase==='matchResult'))break;await page.waitForFunction(()=>['serving','rally','matchResult'].includes(window.__rh.championship().phase));await page.evaluate(()=>window.__rh.championshipPoint('player'));}
    assert.equal(await page.evaluate(()=>window.__rh.championship().phase),'matchResult');
   }
   await page.evaluate(()=>window.__rh.game.requestChampionshipExit());
  }
  await page.waitForFunction(()=>!window.__rh.championship().phase||window.__rh.championship().phase==='inactive');
  const clean=await page.evaluate(()=>{const g=window.__rh.game;return {camera:JSON.stringify(g.camera.captureState())===JSON.stringify(window.qaContinuity.camera),court:g.activities.reserved('court'),input:g.matchInput.enabled,match:!!g.interactiveMatch,player:g.player.matchCompetitor,opponent:g.actor('leo').matchCompetitor};});
  assert(clean.camera);for(const k of ['court','input','match','player','opponent'])assert.equal(clean[k],false,`${cycle}: released ${k}`);report.cycles.push(clean);
  await page.waitForTimeout(120);await audit(`D returned ${cycle}`);if(cycle===0)await page.screenshot({path:`${out}/D-returned.png`});
 }
 // A busy pre-existing court cannot be cancelled to manufacture a match.
 report.busy=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<3600&&(g.activities.busy('coach')||g.activities.busy('mika'));i++)g.updateFixed(1/60);const a=g.startActivity('observe',['coach','mika'],'court',[new g.player.position.constructor(1,0,-4),new g.player.position.constructor(1,0,4)],'Existing practice');if(!a)throw Error('Busy court fixture failed');g.startChampionship(g.actor('leo'));const preserved=g.activities.active.includes(a)&&!g.championship.active;g.cancelActivity(a);return {preserved};});assert(report.busy.preserved);
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;g.camera.pin();window.qaContinuity.labCamera=g.camera.captureState();window.qaContinuity.labMinute=g.clock.minutes;window.qaContinuity.actorTimes=g.characters.map(c=>c.animTime);g.openPerformanceLab();});
 await page.waitForTimeout(1400);await audit('E lab in live club');await page.screenshot({path:`${out}/E-lab.png`});
 report.lab=await page.evaluate(()=>{const g=window.__rh.game,q=window.qaContinuity;return {minuteAdvanced:g.clock.minutes>q.labMinute,actorsAdvanced:g.characters.every((c,i)=>c.animTime!==q.actorTimes[i]),source:g.performanceLab.timeline.clip.source,recordedBody:g.performanceLab.timeline.frame.body.length};});assert(report.lab.minuteAdvanced&&report.lab.actorsAdvanced);assert(report.lab.recordedBody>10);
 await page.locator('[data-lab-action=close]').click();report.lab.cameraRestored=await page.evaluate(()=>JSON.stringify(window.__rh.game.camera.captureState())===JSON.stringify(window.qaContinuity.labCamera));assert(report.lab.cameraRestored);await audit('F lab returned');
 assert(report.stages.at(-1).minute>report.stages[0].minute);assert(report.stages.every(s=>s.weather===report.stages[0].weather));assert(report.stages.every(s=>!s.activity||s.activity.same));assert.deepEqual(report.errors,[]);assert.deepEqual(report.http,[]);report.passed=true;
}catch(error){report.failure=error.message;await page.screenshot({path:`${out}/failure.png`}).catch(()=>{});throw error;}
finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({engine,passed:report.passed,stages:report.stages.length,cycles:report.cycles,lab:report.lab}));
