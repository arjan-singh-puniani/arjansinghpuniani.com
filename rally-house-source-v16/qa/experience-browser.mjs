import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,browserOptions} from './runtime.mjs';
const output=path.resolve('../takeover-evidence/after');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const report={viewports:[],errors:[],cycles:[],performance:[]};
const widths=[[1920,1080],[1728,1117],[1440,900],[1280,800],[1024,768],[844,390],[430,932],[390,844],[720,900]];
try {
  for(const [width,height] of widths){
    const context=await browser.newContext({viewport:{width,height},hasTouch:width<1100,reducedMotion:'reduce'});
    const page=await context.newPage();
    page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto('http://127.0.0.1:3096/playground/rally-house');await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('iframe').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(output,`portfolio-${width}.png`),fullPage:true});
    for(const scene of ['Challenge','Rally','Wander'])await page.getByLabel('Gameplay scenes').getByRole('button',{name:new RegExp(scene)}).click();
    const {default:AxeBuilder}=await import('../../arjan-portfolio/node_modules/@axe-core/playwright/dist/index.js');
    const axe=await new AxeBuilder({page}).analyze();assert.deepEqual(axe.violations,[],JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
    if(width===1440){
      await page.addStyleTag({content:'[class*="heroGrid"]{grid-template-columns:1fr!important;max-width:850px!important}[class*="heroCopy"]{text-align:center}[class*="deck"]{margin-left:auto;margin-right:auto}[class*="actions"]{justify-content:center}'});
      await page.screenshot({path:path.join(output,'portfolio-hero-B.png'),fullPage:true});
    }
    await page.getByRole('button',{name:'Play Rally House ↗'}).click();
    await page.locator('iframe').waitFor();await page.frameLocator('iframe').getByText('Arjan',{exact:true}).click();
    await page.screenshot({path:path.join(output,`portfolio-playing-${width}.png`)});
    report.viewports.push({width,height,overflow:false,axeViolations:axe.violations.length,iframeOnIntent:true});await context.close();
  }
  const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:8078/?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Arjan',{exact:true}).click();
  await page.evaluate(()=>{const g=window.__rh.game;g.autosave=-10000;g.clock.paused=true;g.settings.reducedMotion=true;g.camera.frameAcademy();});
  // Runtime soak: actual navigation and state updates, controller-injected scores.
  // Fixed steps accelerate waiting; this is lifecycle QA, not recorded human play.
  const cycles=await page.evaluate(()=>{
    const g=window.__rh.game,rows=[];
    const advance=(seconds)=>{for(let i=0;i<seconds*60;i++)g.updateFixed(1/60);};
    for(let cycle=0;cycle<32;cycle++){
      const opponent=['leo','coach','mika','nia'][cycle%4];
      for(const a of [...g.activities.active])g.cancelActivity(a);
      const camera=g.camera.captureState();g.startChampionship(g.actor(opponent));
      for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);
      if(g.championship.phase!=='serving')throw Error('Failed approach '+cycle+' '+g.championship.phase);
      for(let round=0;round<2;round++){
        for(let p=0;p<7;p++){g.championship.markServeStarted();g.championship.resolvePoint({winner:'player',reason:'winner',rallyLength:4});advance(1.3);}
        if(g.championship.phase!=='matchResult')throw Error('Failed score '+cycle);
        if(round===0){g.rematchChampionship();advance(2);}
      }
      g.requestChampionshipExit();advance(3);
      rows.push({cycle,opponent,reserved:g.activities.reserved('court'),active:g.championship.active,input:g.matchInput.enabled,match:!!g.interactiveMatch,touchRuns:g.touchRuns.size,dom:document.querySelectorAll('*').length,heap:performance.memory?.usedJSHeapSize,cameraRestored:JSON.stringify(camera)===JSON.stringify(g.camera.captureState()),paused:g.clock.paused});
    }return rows;
  });
  for(const row of cycles){assert(!row.reserved&&!row.active&&!row.input&&!row.match);assert(row.cameraRestored&&row.paused);}
  report.cycles=cycles;
  // Active club frame pacing (five minutes, 10-second batches). RAF is wall time,
  // renderer timing is CPU submission, not a GPU timer.
  await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;g.settings.reducedMotion=false;g.settings.visuals='detail';});
  for(let batch=0;batch<30;batch++){
    const perf=await page.evaluate(async()=>{const times=[],start=performance.now();let prev=start;await new Promise(resolve=>{function frame(now){times.push(now-prev);prev=now;if(now-start>=10000)resolve();else requestAnimationFrame(frame);}requestAnimationFrame(frame);});times.sort((a,b)=>a-b);return {frames:times.length,median:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],p99:times[Math.floor(times.length*.99)],heap:performance.memory?.usedJSHeapSize,dom:document.querySelectorAll('*').length,perf:window.__rh.game.perf.snapshot()};});
    report.performance.push(perf);fs.writeFileSync(path.join(output,'browser.json'),JSON.stringify(report,null,2));
  }
  await page.close();assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(output,'browser.json'),JSON.stringify(report,null,2));console.log('Experience browser matrix, 32 complete/rematch/return cycles and five-minute active soak PASS');
}finally{fs.writeFileSync(path.join(output,'browser.json'),JSON.stringify(report,null,2));await browser.close();}
