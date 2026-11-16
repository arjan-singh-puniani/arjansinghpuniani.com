import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webkit,chromium,browserOptions} from './runtime.mjs';
const [base,out,engine='webkit']=process.argv.slice(2);assert(base&&out);
fs.mkdirSync(out,{recursive:true});
const report={base,engine,environment:'Desktop browser; simulated audio interruption, not physical iPhone speaker testing.',errors:[]};
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:browserOptions);
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(base);
 await page.evaluate(async()=>{
  const {AudioManager}=await import(new URL('./dist/core/AudioManager.js',location.href).href);
  const a=window.audioProbe=new AudioManager(),button=document.createElement('button');
  button.id='audio-probe';button.textContent='Test impact';button.style.cssText='position:fixed;top:0;left:0;z-index:999999';
  button.onclick=()=>a.tennisImpact('clean',11);document.body.append(button);
 });
 await page.locator('#audio-probe').click();await page.waitForFunction(()=>window.audioProbe.ctx?.state==='running');await page.waitForTimeout(350);
 report.blocked=await page.evaluate(async()=>{
  const a=window.audioProbe,c=a.ctx,s=window.audioProbeStats={created:0,started:0,ended:0};
  for(const kind of ['createBufferSource','createOscillator','createStereoPanner']){
   const create=c[kind].bind(c);c[kind]=()=>{s.created++;const node=create();
    if(kind==='createBufferSource'){const start=node.start.bind(node);node.start=(...args)=>{s.started++;node.addEventListener('ended',()=>s.ended++,{once:true});return start(...args);};}
    return node;
   };
  }
  await c.suspend();window.audioResume=c.resume.bind(c);
  // Hold the browser clock suspended, as when the OS refuses an immediate resume.
  c.resume=async()=>{};
  for(let i=0;i<120;i++){
   a.tennisImpact('perfect',18);a.bounce();a.shoe('court');a.objectNote('bell',0);a.updateClubAmbience(1/60,720,'clear',true);
  }
  return {...s,state:c.state};
 });
 assert.equal(report.blocked.state,'suspended');assert.equal(report.blocked.created,0,'Blocked effects must allocate no playback nodes');
 await page.evaluate(()=>{window.audioProbe.ctx.resume=window.audioResume;});
 await page.locator('#audio-probe').click();await page.waitForFunction(()=>window.audioProbe.ctx.state==='running');
 await page.waitForTimeout(300);const before=await page.evaluate(()=>window.audioProbeStats.started);
 await page.locator('#audio-probe').click();await page.waitForTimeout(350);
 report.resumed=await page.evaluate(()=>({...window.audioProbeStats,state:window.audioProbe.ctx.state}));
 assert.equal(report.resumed.started,before+1,'Exactly one fresh hit follows a new press');assert.equal(report.resumed.started,report.resumed.ended,'Every fresh hit finishes');
 await page.evaluate(()=>window.audioProbe.dispose());assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify(report));
}catch(error){report.failure=error.message;throw error;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
