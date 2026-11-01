import { chromium } from 'playwright';
import { writeFile, readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const base=process.env.SEIZEFREEZE_BASE_URL||'http://127.0.0.1:3212';
const output=new URL('../../Documentation/Validation/SeizeFreeze/',import.meta.url);
const results=[];
for(const mode of ['software','native-requested']) {
  const launch=mode==='software'?{headless:true,args:['--use-angle=swiftshader']}:{headless:true,channel:'chromium',args:['--use-angle=metal']};
  let browser;
  try{browser=await chromium.launch(launch);}catch(e){results.push({mode,blocked:e.message});continue;}
  try {
  const sizes=mode==='software'?[[1440,1000,1],[390,844,1]]:[[1440,1000,1],[390,844,1],[1440,900,2],[390,844,3]];
  for(const [width,height,deviceScaleFactor] of sizes) {
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor,reducedMotion:'reduce'}),page=await context.newPage();
    const start=Date.now();await page.goto(`${base}/seizefreeze-lab/index.html`);
    await page.waitForFunction(()=>window.seizefreeze?.snapshot().summary);
    const modelReadyMs=Date.now()-start,staticByDefault=await page.evaluate(()=>window.seizefreeze.snapshot().staticView);
    if(staticByDefault){await page.waitForFunction(()=>document.getElementById('poster').complete);await page.locator('#static-view').click();}
    await page.waitForFunction(()=>window.seizefreeze.snapshot().stats.frames>0);
    const first3DReadyMs=Date.now()-start;
    for(const workload of ['placement-peel','lab-scrub']) {
      if(workload==='lab-scrub'){await page.locator('#lab-tab').click();await page.evaluate(()=>window.seizefreeze.goTo(30));}
      else await page.evaluate(()=>{const range=document.getElementById('peel');range.value=.86;range.dispatchEvent(new Event('input'));});
      await page.locator('#scene').scrollIntoViewIfNeeded();await page.waitForTimeout(500);
      const metrics=await page.evaluate(async workload=>{
        const prior=window.seizefreeze.snapshot().stats,intervals=[],start=performance.now();let last=start,n=0;
        await new Promise(resolve=>{const tick=t=>{
          intervals.push(t-last);last=t;
          if(workload==='lab-scrub')window.seizefreeze.goTo(20+(n++%100)*.5);
          else{const range=document.getElementById('peel');range.value=.86+.11*Math.sin(n++*.05);range.dispatchEvent(new Event('input'));}
          if(t-start<3000)requestAnimationFrame(tick);else resolve();
        };requestAnimationFrame(tick);});
        const after=window.seizefreeze.snapshot().stats,elapsed=performance.now()-start;
        intervals.sort((a,b)=>a-b);
        const idleBefore=after.frames;await new Promise(r=>setTimeout(r,600));const idleAfter=window.seizefreeze.snapshot().stats.frames;
        return {adapter:after.adapter,softwareRenderer:after.softwareRenderer,frames:after.frames-prior.frames,elapsedMs:elapsed,renderedFps:(after.frames-prior.frames)*1000/elapsed,frameIntervalP95Ms:intervals[Math.floor(intervals.length*.95)],idleFrames:idleAfter-idleBefore,stats:after};
      },workload);
      const entry={mode,workload,width,height,deviceScaleFactor,modelReadyMs,first3DReadyMs,staticByDefault,software3DExplicitlyRequested:mode==='software',...metrics,measurement:'Unthrottled desktop Chromium, reduced motion for steady-state camera; actual adapter and capped pixelRatio recorded. Viewport/DPR emulation is not physical-device testing. CPU submission timing is not GPU execution timing.'};
      results.push(entry);console.log(JSON.stringify({mode,workload,width,height,deviceScaleFactor,fps:entry.renderedFps,p95:entry.frameIntervalP95Ms,adapter:entry.adapter}));
    }
    await context.close();
  }
  } finally { await browser.close(); }
}
async function inventory(dir){const out=[];for(const file of await readdir(dir)){const url=new URL(file,dir),s=await stat(url);if(s.isDirectory())out.push(...await inventory(new URL(`${file}/`,dir)));else{const bytes=await readFile(url);out.push({path:url.pathname.split('/arjan-portfolio/')[1],bytes:bytes.length,gzipBytes:gzipSync(bytes).length});}}return out;}
const assets=await inventory(new URL('../../public/seizefreeze-lab/',import.meta.url));
for(const name of ['three.module.js','three.core.js','OrbitControls.js','GLTFLoader.js','BufferGeometryUtils.js']){const url=new URL(`../../public/pit-stop-lab/vendor/${name}`,import.meta.url),b=await readFile(url);assets.push({path:`shared/${name}`,bytes:b.length,gzipBytes:gzipSync(b).length});}
await writeFile(new URL('performance-results.json',output),JSON.stringify({base,results,assets,totalBytes:assets.reduce((s,x)=>s+x.bytes,0),totalGzipBytes:assets.reduce((s,x)=>s+x.gzipBytes,0)},null,2));
