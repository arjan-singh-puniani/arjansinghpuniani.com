import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'evidence/replay-smoothness-20261011/motion';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:`${out}/raw-video`,size:{width:1440,height:900}}}),page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);
for(const avatar of ['arjan','taylor'])for(const kind of ['forehand','serve','gait']){
 await page.evaluate(({avatar,kind})=>{const g=window.__rh.game,l=g.performanceLab;l.close();g.choosePlayerAvatar(avatar);g.ui.closeContext();l.open(g.player.spec,null);l.timeline.mode='body';l.load(kind);l.contactLens=false;l.timeline.speed=.5;l.timeline.seek(kind==='gait'?1:.85);l.timeline.playing=true;l.update(0,false);g.camera.target=g.camera.desiredTarget.clone();g.camera.distance=g.camera.desiredDistance;g.camera.azimuth=g.camera.desiredAzimuth;g.camera.elevation=g.camera.desiredElevation;g.camera.pin();g.camera.update(0);},{avatar,kind});
 await page.locator('.lab-transport select').selectOption('0.5');
 const result=await page.evaluate(async()=>{
  const {value,JOINT_KEYS}=await import('/dist/analysis/MotionCapture.js');const g=window.__rh.game,l=g.performanceLab,frames=[];let previous=null,moving=0,interpolated=0,maxSync=0,maxNodeError=0;
  for(let i=0;i<90;i++){
   await new Promise(requestAnimationFrame);const t=l.timeline,f=t.frame,meshes=l.meshes(false),nodes=meshes.filter(m=>m.overlay&&m.kind==='sphere');
   if(f.interpolated)interpolated++;maxSync=Math.max(maxSync,Math.abs(f.time-t.time));
   const current=value(f,t.focus),expected=`${current.toFixed(t.focus==='ankle'?2:0)}${t.focus==='ankle'?'u':'°'}`;
   if(document.querySelector('.lab-readout').textContent!==expected)throw Error('Readout is behind the rendered pose');
   const expectedCursor=4+292*(t.time-t.start)/(t.end-t.start),actual=Number(document.querySelector('.lab-panel svg line').getAttribute('x1'));if(Math.abs(expectedCursor-actual)>1e-6)throw Error('Plot cursor is behind the pose');
   for(let j=0;j<nodes.length;j++){const a=nodes[j].position,b=f.pose[JOINT_KEYS[j]];maxNodeError=Math.max(maxNodeError,Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z));}
   const hand=f.pose.handR;if(previous&&Math.hypot(hand.x-previous.x,hand.y-previous.y,hand.z-previous.z)>1e-8)moving++;previous={...hand};frames.push({time:t.time,frame:f.time,interpolated:!!f.interpolated,hand:{...hand}});
  }
  return {avatar:g.player.spec.avatar,kind:l.timeline.clip.kind,interpolated,moving,maxSync,maxNodeError,frames};
 });
 assert(result.maxSync<1e-9,'Shared clock agrees to floating-point tolerance');assert.equal(result.maxNodeError,0);assert(result.interpolated>70,`${avatar}/${kind} must reconstruct between samples`);assert(result.moving>70,`${avatar}/${kind} must move on consecutive render frames`);checks.push(result);
 if(avatar==='taylor'&&kind==='forehand')await page.screenshot({path:`${out}/taylor-continuous.png`});
}
// Hit testing must use the same fractional pose, including after the camera has moved.
const joint=await page.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab;l.load('forehand');l.timeline.playing=false;l.timeline.seek(1.017);l.focus('elbow');l.update(0,false);g.camera.target=g.camera.desiredTarget.clone();g.camera.distance=g.camera.desiredDistance;g.camera.azimuth=g.camera.desiredAzimuth;g.camera.elevation=g.camera.desiredElevation;g.camera.update(0);return g.camera.project(l.timeline.frame.pose.kneeR);});
await page.mouse.click(joint.x,joint.y);assert.equal(await page.evaluate(()=>window.__rh.lab().focus),'knee');
await page.screenshot({path:`${out}/fractional-joint-pick.png`});
assert.deepEqual(errors,[]);const video=page.video();await context.close();await video.saveAs(`${out}/registered-motion.webm`);await browser.close();fs.writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors,fractionalCanvasPick:true,video:`${out}/registered-motion.webm`},null,2));console.log(JSON.stringify({checks:checks.map(({frames,...r})=>r),errors,fractionalCanvasPick:true},null,2));
