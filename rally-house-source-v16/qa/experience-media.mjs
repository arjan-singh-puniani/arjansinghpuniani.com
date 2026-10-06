import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,browserOptions} from './runtime.mjs';

const report={errors:[],failedRequests:[],mediaRangeCancellations:[],packageReloads:0};
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('requestfailed',r=>{
    const row={url:r.url(),error:r.failure()};
    // Seeking/cancelling a loaded video cancels range requests in Chromium.
    const cancelledRange=r.url().endsWith('/club-to-court.webm')&&r.failure()?.errorText==='net::ERR_ABORTED';
    (cancelledRange?report.mediaRangeCancellations:report.failedRequests).push(row);
  });
  await page.goto('http://127.0.0.1:3096/playground/rally-house');
  await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('iframe').count(),0);
  await page.screenshot({path:'../takeover-evidence/after/portfolio-final.png',fullPage:true});
  await page.addStyleTag({content:'[class*="heroGrid"]{grid-template-columns:1fr!important;max-width:850px!important}[class*="heroCopy"]{text-align:center}[class*="deck"]{margin-left:auto;margin-right:auto}[class*="actions"]{justify-content:center}'});
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'../takeover-evidence/experiments/hero-stacked.png'});
  await page.reload();await page.waitForLoadState('networkidle');
  await page.getByText('Watch the continuous club-to-court capture',{exact:false}).click();
  report.video=await page.locator('video').evaluate(async v=>{
    v.load();await new Promise((resolve,reject)=>{v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',reject,{once:true});});
    const result={duration:v.duration,width:v.videoWidth,height:v.videoHeight,tracks:v.textTracks.length};
    v.currentTime=17;await new Promise(resolve=>v.addEventListener('seeked',resolve,{once:true}));return result;
  });
  assert(report.video.duration>25&&report.video.duration<40);assert.equal(report.video.tracks,1);
  await page.locator('video').screenshot({path:'../takeover-evidence/after/video-contact.png'});
  await page.getByRole('button',{name:'Play Rally House ↗'}).focus();
  await page.keyboard.press('Enter');await page.locator('iframe').waitFor();
  await page.frameLocator('iframe').getByText('Arjan',{exact:true}).click();
  report.keyboardLoadsGame=true;
  await page.evaluate(()=>{document.querySelector('[class*="frameShell"]').requestFullscreen=()=>Promise.reject(Error('Controlled QA rejection'));});
  await page.getByRole('button',{name:'Enter fullscreen ↗'}).click();
  assert(await page.getByRole('status').filter({hasText:'Fullscreen is unavailable'}).isVisible());
  report.fullscreenFallback=true;
  // Exercise the actual Python server code embedded in the standalone launcher.
  for(let i=0;i<5;i++){
    await page.goto('http://127.0.0.1:8082/?debug');
    await page.waitForFunction(()=>window.__rh?.ready,null,{timeout:20000});
    await page.getByText('Arjan',{exact:true}).click();report.packageReloads++;
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);
  console.log('Final footage, captions, keyboard entry, fullscreen fallback, and five standalone reloads PASS');
}finally{
  fs.writeFileSync('../takeover-evidence/after/media.json',JSON.stringify(report,null,2));await browser.close();
}
