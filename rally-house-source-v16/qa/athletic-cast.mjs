import assert from 'node:assert/strict';import fs from 'node:fs';import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'evidence/athletic-cast-20261015/live';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1440,height:900}}),report={errors:[],http:[],actors:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.http.push([r.status(),r.url()]);});
try{
 await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Taylor',{exact:true}).click();
 for(const id of ['coach','mika','leo','nia']){
  const data=await page.evaluate(id=>{
   const g=window.__rh.game;g.clock.paused=true;g.settings.visuals='detail';for(const a of [...g.activities.active])g.cancelActivity(a);
   for(const c of g.characters){c.path=[];c.position.set(-11,0,8);c.setAnimation('idle');}
   const c=g.actor(id);c.position.set(0,0,1.8);c.yaw=0;c.racketStowed=true;c.majorActivity=false;for(let i=0;i<180;i++)c.update(1/60);
   g.camera.autoFrame=false;g.camera.target.set(0,1.4,1.8);g.camera.distance=7;g.camera.azimuth=.2;g.camera.elevation=.12;g.camera.pin();g.camera.update(0);g.ui.closeContext();
   const point=g.camera.project(c.analysisPose().head),picked=g.pickWorld(point.x,point.y);
   return {id,name:c.spec.name,point:{x:point.x,y:point.y},picked:picked?.character?.id??null};
  },id);
  assert.equal(data.picked,id,'Head hit testing owns the correct visible adult');await page.mouse.click(data.point.x,data.point.y);
  await page.waitForFunction(id=>window.__rh.game.spatial.selectedId===id,id);
  await page.screenshot({path:`${out}/selected-${id}.png`});report.actors.push(data);
 }
 // A normal Championship with the rebuilt opponent records a real contact.
 // Reload after the isolated hit-test fixtures moved actors; match navigation
 // must start from the actual saved club rather than the posed diagnostic.
 await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);
 const chooser=page.getByText('Taylor',{exact:true});if(await chooser.isVisible())await chooser.click();
 await page.evaluate(()=>{const g=window.__rh.game;g.ui.closeContext();g.settings.reducedMotion=true;g.startChampionship(g.actor('leo'));for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);if(g.championship.phase!=='serving')throw Error('Adult cast Championship entry failed');g.clock.paused=false;g.interactiveMatch.prepareShot('player','serve','perfect');});
 await page.waitForFunction(()=>window.__rh.game.motionRecorder.clip.frames.some(f=>f.contact)&&window.__rh.game.motionRecorder.clip.frames.length>20,null,{timeout:20000});
 report.contact=await page.evaluate(()=>{const g=window.__rh.game,f=g.motionRecorder.clip.frames.find(f=>f.contact);return {bodySamples:g.motionRecorder.clip.frames.length,contactGap:Math.hypot(f.ball.x-f.pose.racketCenter.x,f.ball.y-f.pose.racketCenter.y,f.ball.z-f.pose.racketCenter.z),gl:g.renderer.gl.getError()};});
 assert(report.contact.bodySamples>10&&report.contact.contactGap<.12);assert.equal(report.contact.gl,0);await page.screenshot({path:`${out}/championship.png`});
 await page.evaluate(()=>{const g=window.__rh.game;g.requestChampionshipExit();for(let i=0;i<300;i++)g.updateFixed(1/60);});assert.equal(await page.evaluate(()=>window.__rh.game.player.matchCompetitor),false);
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.http,[]);
}finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report));
