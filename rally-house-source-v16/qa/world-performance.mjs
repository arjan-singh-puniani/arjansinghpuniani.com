fs.mkdirSync('qa/world-interface',{recursive:true});
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const b=await chromium.launch({...browserOptions,args:['--use-angle=metal']});const report={};
try{
 if(!process.env.QA_BEFORE_URL||!process.env.QA_AFTER_URL||process.env.QA_BEFORE_URL===process.env.QA_AFTER_URL)throw Error('Set distinct QA_BEFORE_URL and QA_AFTER_URL for a valid comparison.');
 for(const [name,url] of [['before',process.env.QA_BEFORE_URL],['after',process.env.QA_AFTER_URL]]){
  const context=await b.newContext({viewport:{width:1280,height:800}}),p=await context.newPage();
  await p.goto(`${url}/?debug`);await p.waitForFunction(()=>window.__rh?.ready);await p.getByText('Arjan',{exact:true}).click();
  await p.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.settings.visuals='detail';g.camera.frameAcademy();});await p.waitForTimeout(1200);
  report[name]=await p.evaluate(async()=>{
   const samples=[],ui=[],g=window.__rh.game;
   if(g.spatial){const update=g.spatial.update.bind(g.spatial);g.spatial.update=(...args)=>{const start=performance.now();update(...args);ui.push(performance.now()-start);};g.openCharacter(g.characters.find(c=>c.id==='leo'));}
   let last=performance.now();for(let i=0;i<100;i++){await new Promise(requestAnimationFrame);const now=performance.now();samples.push(now-last);last=now;}
   const sorted=samples.slice(10).sort((a,b)=>a-b),spatial=ui.slice(10).sort((a,b)=>a-b);
   return {medianFrameMs:sorted[Math.floor(sorted.length*.5)],p95FrameMs:sorted[Math.floor(sorted.length*.95)],medianSpatialMs:spatial.length?spatial[Math.floor(spatial.length*.5)]:0,p95SpatialMs:spatial.length?spatial[Math.floor(spatial.length*.95)]:0,drawCalls:g.renderer.drawCalls,renderItems:g.renderItems};
  });await context.close();
 }
 fs.writeFileSync('qa/world-interface/performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await b.close()}
