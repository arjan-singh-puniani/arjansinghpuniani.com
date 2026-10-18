import {enterClub} from './enter-club.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'evidence/realism-20261016',label=process.env.QA_LABEL??'after',baseline=process.env.QA_BASELINE_RUNTIME;fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1080,height:1000}}),report={label,baseline:baseline??null,capture:'Actual cast and production world renderer with controlled inspection cameras',errors:[],http:[],actors:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.http.push([r.status(),r.url()]);});
if(baseline)await page.route('**/dist/**',async route=>{const rel=new URL(route.request().url()).pathname.split('/dist/')[1],f=path.join(baseline,rel);assert(fs.existsSync(f));await route.fulfill({body:fs.readFileSync(f),contentType:'text/javascript'});});
try{
 await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);await enterClub(page,'Taylor');await page.locator('#loading').waitFor({state:'hidden'});
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.clock.minutes=780;g.world.weather='clear';g.settings.visuals='detail';for(const a of [...g.activities.active])g.cancelActivity(a);g.ui.hideSpeech();const style=document.createElement('style');style.textContent='#app>*:not(canvas){display:none!important}';document.head.append(style);window.inspectionWorld=g.world;});
 for(const id of ['taylor','arjan','coach','mika','nia','leo']){
  const data=await page.evaluate(id=>{
   const g=window.__rh.game;if(id==='taylor'||id==='arjan')g.choosePlayerAvatar(id);const c=id==='taylor'||id==='arjan'?g.player:g.characters.find(c=>c.id===id);window.inspectionActor=c;window.inspectionOriginal=c.position.clone();c.position.set(4.5,0,-2.5);c.path=[];c.yaw=c.targetYaw=0;c.gazeYaw=0;c.acting.setRole('none');c.racketStowed=true;c.setAnimation('idle');for(let i=0;i<240;i++)c.update(1/60);
   const camera=g.camera;camera.autoFrame=false;camera.aspect=g.renderer.resize();camera.target.set(c.position.x,c.analysisPose().head.y-.015,c.position.z);camera.distance=1.65;camera.azimuth=.25;camera.elevation=.025;camera.pin();camera.update(0);return {id,headHeight:c.analysisPose().head.y};
  },id);
  await page.waitForTimeout(150);await page.screenshot({path:`${out}/${label}-${id}-portrait.png`});
  await page.evaluate(()=>{const g=window.__rh.game,c=window.inspectionActor,camera=g.camera;camera.target.set(c.position.x,1.25,c.position.z);camera.distance=5.8;camera.azimuth=.45;camera.elevation=.035;camera.pin();camera.update(0);});
  await page.waitForTimeout(100);await page.screenshot({path:`${out}/${label}-${id}-body.png`});
  Object.assign(data,await page.evaluate(()=>{const g=window.__rh.game,c=window.inspectionActor,result={gl:g.renderer.gl.getError(),draws:g.renderer.drawCalls,triangles:g.renderer.triangles,sameWorld:g.world===window.inspectionWorld,members:g.characters.length};c.position.set(window.inspectionOriginal.x,window.inspectionOriginal.y,window.inspectionOriginal.z);return result;}));assert.equal(data.gl,0);assert(data.sameWorld&&data.members===4);report.actors.push(data);
 }
 await page.evaluate(()=>{const g=window.__rh.game;g.choosePlayerAvatar('taylor');g.camera.target.set(0,0,0);g.camera.distance=44;g.camera.azimuth=.78;g.camera.elevation=.70;g.camera.pin();g.camera.update(0);});await page.waitForTimeout(150);await page.screenshot({path:`${out}/${label}-club.png`});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.http,[]);report.passed=true;
}catch(error){report.failure=error.message;throw error;}finally{fs.writeFileSync(`${out}/${label}-render.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report));
