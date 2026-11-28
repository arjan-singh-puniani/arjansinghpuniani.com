import fs from 'node:fs';import assert from 'node:assert/strict';
import {chromium,webkit,browserOptions} from './runtime.mjs';
const [label='after',base='http://127.0.0.1:18132/',out='evidence/living-club-20261126']=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const mobile=!!process.env.QA_MOBILE,viewport=mobile?{width:402,height:874}:{width:1440,height:960};
const browser=await(process.env.QA_ENGINE==='webkit'?webkit.launch({headless:true}):chromium.launch({...browserOptions,args:['--use-angle=metal']}));
const context=await browser.newContext({viewport,recordVideo:{dir:out+'/raw',size:viewport}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 if(process.env.QA_RUNTIME)await page.route('**/dist/**',r=>r.fulfill({body:fs.readFileSync(process.env.QA_RUNTIME+new URL(r.request().url()).pathname),contentType:'text/javascript'}));
 await page.goto(base+'?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Arjan',{exact:true}).click();await page.locator('[data-arrival-action="explore"]').click();await page.waitForTimeout(18000);
 const report=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;return {meshes:g.world.meshes.length,activities:g.activities.active.map(a=>({kind:a.kind,detail:a.detail,people:a.participants,phase:a.phase})),life:[...g.lifeRuns.values()].map(r=>({family:r.scene.family,title:r.scene.title})),render:g.perf.snapshot()};});
 await page.screenshot({path:out+'/'+label+'-overview.png'});
 if(!mobile)for(const [name,x,y,z,distance] of [['board',3.4,2.4,-8.8,5.5],['cafe',-9.3,1,-5.6,6],['kit',6.5,.7,4.8,4],['worktop',9.2,1.5,-3.4,3.5]]){
  await page.evaluate(({x,y,z,distance,name})=>{const c=window.__rh.game.camera;c.target.set(x,y,z);c.desiredTarget.set(x,y,z);c.distance=c.desiredDistance=distance;c.azimuth=c.desiredAzimuth=name==='kit'?2.9:.22;c.elevation=c.desiredElevation=name==='kit'?.7:.4;c.pin();},{x,y,z,distance,name});await page.waitForTimeout(350);await page.screenshot({path:out+'/'+label+'-'+name+'.png'});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/'+label+'.json',JSON.stringify({...report,viewport,errors},null,2));console.log(JSON.stringify({label,...report,errors}));
}finally{const video=page.video();await context.close();await video.saveAs(out+'/'+label+'.webm');fs.unlinkSync(await video.path());await browser.close();}
