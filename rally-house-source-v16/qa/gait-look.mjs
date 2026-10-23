import {enterClub} from './enter-club.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'evidence/gait-20261016',label=process.env.QA_LABEL??'after',baseline=process.env.QA_BASELINE_RUNTIME;fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),context=await browser.newContext({viewport:{width:1080,height:900},recordVideo:{dir:path.resolve(out,'raw-video'),size:{width:1080,height:900}}}),page=await context.newPage(),report={label,baseline:baseline??null,errors:[],http:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.http.push([r.status(),r.url()]);});
if(baseline)await page.route('**/dist/**',async route=>{const rel=new URL(route.request().url()).pathname.split('/dist/')[1],file=path.join(baseline,rel);assert(fs.existsSync(file));await route.fulfill({body:fs.readFileSync(file),contentType:'text/javascript'});});
try{
 await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:8078'}/?debug`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);await enterClub(page,'Taylor');
 await page.evaluate(angle=>{
  const g=window.__rh.game,c=g.player,V=c.position.constructor;for(const a of [...g.activities.active])g.cancelActivity(a);
  g.observationStarted=true;g.history.nextSocial=g.history.nextObject=1e12;g.everyday.next=1e12;g.settings.visuals='detail';g.clock.minutes=780;g.clock.paused=true;g.clock.speed=1;
  c.position.set(4.5,0,-2.5);c.path=[];c.yaw=c.targetYaw=-Math.PI/2;c.gazeYaw=-Math.PI/2;c.acting.setRole('none');c.racketStowed=true;c.setAnimation('idle');for(let i=0;i<180;i++)c.update(1/60);
  const style=document.createElement('style');style.textContent='#app>*:not(canvas){display:none!important}';document.head.append(style);
  const camera=g.camera;camera.autoFrame=false;camera.aspect=g.renderer.resize();camera.target.set(c.position.x,1.18,c.position.z);camera.distance=5.8;camera.azimuth=angle;camera.elevation=.08;camera.pin();camera.update(0);
  const render=g.render.bind(g);g.render=now=>{camera.desiredTarget.set(c.position.x,1.18,c.position.z);render(now);};
 },Number(process.env.QA_AZIMUTH??-Math.PI/2));
 await page.waitForTimeout(300);await page.screenshot({path:`${out}/${label}-standing.png`});
 await page.evaluate(()=>{const g=window.__rh.game;g.player.goTo(new g.player.position.constructor(-2.5,0,-2.5));g.clock.paused=false;});
 await page.waitForTimeout(1700);assert.equal(await page.evaluate(()=>window.__rh.game.player.state),'walk');await page.screenshot({path:`${out}/${label}-walking.png`});
 await page.waitForFunction(()=>window.__rh.game.player.state==='idle',null,{timeout:15000});await page.waitForTimeout(650);await page.screenshot({path:`${out}/${label}-stopped.png`});
 report.final=await page.evaluate(()=>{const g=window.__rh.game;return {position:{...g.player.position},state:g.player.state,gl:g.renderer.gl.getError(),members:g.characters.length};});assert.equal(report.final.gl,0);assert.equal(report.final.members,4);assert.deepEqual(report.errors,[]);assert.deepEqual(report.http,[]);report.passed=true;
}catch(error){report.failure=error.message;throw error;}
finally{await context.close();await page.video().saveAs(path.resolve(out,`${label}-walk.webm`));fs.writeFileSync(`${out}/${label}-render.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report));
