import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,browserOptions} from './runtime.mjs';
const out='evidence/rig-registration-20261011/avatars';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],captures=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);
for(const avatar of ['arjan','taylor'])for(const source of ['forehand','serve','gait']){
 await page.evaluate(({avatar,source})=>{
  const g=window.__rh.game,l=g.performanceLab;l.close();g.choosePlayerAvatar(avatar);g.ui.closeContext();l.open(g.player.spec,null);l.timeline.mode='body';l.load(source);l.timeline.playing=false;l.timeline.seek(l.timeline.clip.frames.find(f=>f.contact)?.time??3);l.focus(source==='gait'?'knee':source==='serve'?'shoulder':'elbow');l.update(0,false);
  g.camera.target=g.camera.desiredTarget.clone();g.camera.distance=g.camera.desiredDistance;g.camera.azimuth=g.camera.desiredAzimuth;g.camera.elevation=g.camera.desiredElevation;g.camera.pin();g.camera.update(0);
 },{avatar,source});
 await page.waitForTimeout(80);
 const report=await page.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab,f=l.timeline.frame;return {avatar:g.player.spec.avatar,source:l.timeline.clip.kind,offset:l.rigOffset(false).len(),preservedSurfaceAlpha:l.meshes(false).slice(0,f.body.length).every((m,i)=>m.alpha===f.body[i].alpha),contact:f.contact,selected:l.timeline.focus,time:f.time,annotationNodes:l.meshes(false).filter(m=>m.overlay&&m.kind==='sphere').length};});
 assert.equal(report.offset,0);assert.equal(report.avatar,avatar);assert.equal(report.source,source);assert.equal(report.annotationNodes,13);assert(report.preservedSurfaceAlpha);
 const file=`${out}/${avatar}-${source}.png`;await page.screenshot({path:file});captures.push({...report,file});
}
await page.setViewportSize({width:390,height:844});
await page.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab;l.load('forehand');l.timeline.mode='body';l.timeline.playing=false;l.timeline.seek(l.timeline.clip.frames.find(f=>f.contact).time);l.focus('elbow');l.update(0,false);g.camera.target=g.camera.desiredTarget.clone();g.camera.distance=g.camera.desiredDistance;g.camera.azimuth=g.camera.desiredAzimuth;g.camera.elevation=g.camera.desiredElevation;g.camera.pin();g.camera.update(0);});
await page.waitForTimeout(80);await page.screenshot({path:`${out}/taylor-phone.png`});
assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/report.json`,JSON.stringify({captures,errors},null,2));console.log(JSON.stringify({captures:captures.length+1,errors}));await browser.close();
