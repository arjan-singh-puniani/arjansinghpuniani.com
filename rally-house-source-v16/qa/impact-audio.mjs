import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit,browserOptions} from './runtime.mjs';

const [base,out,mode='current',engine='chromium']=process.argv.slice(2);
assert(base&&out);fs.mkdirSync(out,{recursive:true});
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:browserOptions);
const report={base,engine,mode,rows:[],errors:[]};
function wav(data,rate){
 const b=Buffer.alloc(44+data.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(data.length*2,40);
 data.forEach((x,i)=>b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,x))*32767),44+i*2));return b;
}
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(base);
 report.rows=await page.evaluate(async()=>{
  const {AudioManager}=await import(new URL('./dist/core/AudioManager.js',location.href).href),rows=[];
  for(const quality of ['defensive','clean','perfect','frame'])for(const speed of [4,11,18]){
   const rate=48000,context=new OfflineAudioContext(1,rate/4,rate),a=new AudioManager();
   context.resume=()=>Promise.resolve();a.ctx=context;a.tennisImpact(quality,speed);
   const data=(await context.startRendering()).getChannelData(0);a.ctx=undefined;a.dispose();
   let peak=0,energy=0,attack=0,tail=0;
   for(let i=0;i<data.length;i++){peak=Math.max(peak,Math.abs(data[i]));energy+=data[i]**2;if(i<rate*.01)attack+=data[i]**2;if(i>rate*.09)tail+=data[i]**2;}
   rows.push({quality,speed,rate,peak,rms:Math.sqrt(energy/data.length),attack:attack/energy,tail:tail/energy,samples:[...data]});
  }return rows;
 });
 for(const row of report.rows){
  assert(row.peak>0&&row.peak<.2,'Impact has headroom');assert(row.attack>.4&&row.tail<.025,'Prompt attack and short tail');
  fs.writeFileSync(`${out}/${row.quality}-${row.speed}.wav`,wav(row.samples,row.rate));delete row.samples;
 }
 if(mode!=='baseline')for(const quality of ['defensive','clean','perfect','frame']){
  const rows=report.rows.filter(r=>r.quality===quality);
  assert(rows[0].rms<rows[1].rms&&rows[1].rms<rows[2].rms,'Increasing real shot speed increases audible energy');
  assert(rows[2].rms/rows[0].rms>2,'Soft and hard strikes must be clearly distinct');
 }
 assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify(report));
}catch(e){report.failure=e.message;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
