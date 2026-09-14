import assert from 'node:assert/strict';import fs from 'node:fs';
export async function frames(page){
 const data=await page.evaluate(()=>{
  const g=window.__rh.game;g.clock.paused=false;const raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
  try{
   const before=g.everyday.time;g.last=performance.now()-1500;g.loop(performance.now());const catchup=g.everyday.time-before;
   const hiddenBefore=g.everyday.time;Object.defineProperty(document,'hidden',{configurable:true,value:true});g.last=performance.now()-5000;g.loop(performance.now());const hiddenAdvance=g.everyday.time-hiddenBefore;delete document.hidden;
   g.settings.visuals='auto';g.renderer.renderScale=1;g.frameSamples=Array(11).fill(.2);g.last=performance.now()-200;g.loop(performance.now());const adaptive=g.renderer.renderScale;
   g.settings.visuals='detail';g.last=performance.now();g.loop(performance.now());g.clock.paused=true;return {catchup,hiddenAdvance,adaptive,detail:g.renderer.renderScale};
  }finally{window.requestAnimationFrame=raf;delete document.hidden;}
 });
 assert(data.catchup>=1.45&&data.catchup<1.75);assert.equal(data.hiddenAdvance,0);assert(data.adaptive<1&&data.adaptive>=.64);assert.equal(data.detail,1);fs.writeFileSync('qa/v14-frame-check.json',JSON.stringify(data,null,2));console.log('FRAME CATCHUP, BACKGROUND PAUSE AND QUALITY PASSED',data);
}
