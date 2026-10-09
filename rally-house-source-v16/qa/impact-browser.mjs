import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium,browserOptions} from './runtime.mjs';

const label=process.argv[2]??'final';
const output=path.resolve('../takeover-evidence/impact-20261009');
fs.mkdirSync(output,{recursive:true});
function wav(samples,rate){
 const b=Buffer.alloc(44+samples.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples.length*2,40);
 samples.forEach((s,i)=>b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,s))*32767),44+i*2));return b;
}
async function capture(){
const report={label,errors:[]};
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{
 const context=await browser.newContext({viewport:{width:1280,height:800},...(label==='final'?{recordVideo:{dir:output,size:{width:1280,height:800}}}:{})});
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:8078/?debug');await page.waitForFunction(()=>window.__rh?.ready);
 await page.getByText('Arjan',{exact:true}).click();await page.waitForTimeout(700);
 await page.screenshot({path:path.join(output,`${label}-club.png`)});
 report.audio=await page.evaluate(async()=>{
  const {AudioManager}=await import('./dist/core/AudioManager.js');const rows=[];
  for(const q of ['perfect','clean','defensive','frame']){
   const rate=48000,offline=new OfflineAudioContext(1,Math.floor(rate*.25),rate),audio=new AudioManager();
   // Exercise the production node graph and gain, with an offline destination.
   offline.resume=()=>Promise.resolve();audio.ctx=offline;audio.tennisImpact(q);
   const data=(await offline.startRendering()).getChannelData(0);audio.ctx=undefined;audio.dispose();
   let energy=0,attack=0,peak=0;for(let i=0;i<data.length;i++){energy+=data[i]*data[i];if(i<rate*.01)attack+=data[i]*data[i];peak=Math.max(peak,Math.abs(data[i]));}
   rows.push({q,rate,peak,attackFraction:attack/energy,rms:Math.sqrt(energy/data.length),samples:[...data]});
  }return rows;
 });
 for(const row of report.audio){fs.writeFileSync(path.join(output,`${label}-${row.q}.wav`),wav(row.samples,row.rate));delete row.samples;}
 assert(report.audio.every(r=>Number.isFinite(r.rms)&&r.rms>0&&r.peak<.1&&r.attackFraction>.4),'Audible, bounded, prompt production strikes');
 assert.deepEqual(report.errors,[]);
 if(label==='audio'){console.log('Production audio graph PASS',report.audio);return;}
 await page.evaluate(()=>{
  const g=window.__rh.game;g.autosave=-10000;g.clock.paused=true;g.settings.reducedMotion=true;for(const a of [...g.activities.active])g.cancelActivity(a);g.startChampionship(g.actor('leo'));
  for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);
  if(g.championship.phase!=='serving')throw Error('Court entry failed');g.settings.reducedMotion=false;
  window.qaContacts=[];window.qaFrames=[];window.qaPrevious=performance.now();
  const tick=g.updateFixed.bind(g),hit=g.interactiveMatch.callbacks.onHit;
  g.interactiveMatch.callbacks.onHit=(q,...rest)=>{const m=g.interactiveMatch;window.qaContacts.push({q,side:m.pending.side,time:performance.now(),pose:m.pending.hitter.animTime,gap:m.stagedBall(m.pending).clone().sub(m.pending.hitter.racketContactFrame().center).len(),rally:m.rallyLength});hit?.(q,...rest);};
  g.updateFixed=dt=>{if(g.championship.phase==='serving'||g.interactiveMatch?.playerCue()==='swing')g.matchInput.queueSwing();tick(dt);};
 });
 await page.waitForTimeout(1500);await page.screenshot({path:path.join(output,`${label}-match.png`)});
 report.rally=await page.evaluate(async()=>{
  const frames=[];let previous=performance.now();await new Promise(resolve=>{function sample(now){frames.push(now-previous);previous=now;if(frames.length>=1200)resolve();else requestAnimationFrame(sample);}requestAnimationFrame(sample);});frames.sort((a,b)=>a-b);
  return {contacts:window.qaContacts,frames:frames.length,median:frames[600],p95:frames[1140],p99:frames[1188],heap:performance.memory?.usedJSHeapSize,perf:window.__rh.game.perf.snapshot()};
 });
 assert(report.rally.contacts.length>=12,'A sustained real-frame rally');assert(report.rally.contacts.every(c=>c.gap<.12));assert.deepEqual(report.errors,[]);
 await page.screenshot({path:path.join(output,`${label}-rally.png`)});
 if(label==='final'){const video=page.video();await context.close();await video.saveAs(path.join(output,'heavy-championship.webm'));}
 console.log(label,'contacts',report.rally.contacts.length,'p95',report.rally.p95,'audio',report.audio.map(({q,attackFraction,peak})=>({q,attackFraction,peak})));
}finally{fs.writeFileSync(path.join(output,`${label}.json`),JSON.stringify(report,null,2));await browser.close();}

}
await capture();
