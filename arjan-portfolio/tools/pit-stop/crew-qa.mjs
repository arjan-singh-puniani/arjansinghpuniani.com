import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.PIT_STOP_URL||'http://127.0.0.1:4174',out=process.env.PIT_CREW_EVIDENCE||'/tmp/pit-contact-fix';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PIT_CHROME_METAL==='1'?{channel:'chrome',args:['--use-angle=metal','--enable-gpu']}:{})});
const report={checks:[],errors:[]};
try{
 // Expose existing matrices only in this test response; no diagnostic hook ships in the application.
 let source=await fs.readFile(new URL('../../public/pit-stop-lab/world.js',import.meta.url),'utf8');
 const poseAnchor='        const { upper, bones, skeleton, joints, feet, hands } = person.userData;';
 const returnAnchor='    return { update, render, setView, setCamera, resize,';
 assert.ok(source.includes(poseAnchor)&&source.includes(returnAnchor));
 source=source.replace(poseAnchor,"        person.userData.qaContacts=movement.contacts;\n"+poseAnchor);
 source=source.replace(returnAnchor,"    window.__PIT_CREW_QA__=()=>[...Object.values(stations).flatMap(s=>s.people),supplyOperator].map(p=>({contacts:p.userData.qaContacts,feet:p.userData.feet.map(f=>f.getWorldPosition(new THREE.Vector3()).toArray())}));\n"+returnAnchor);
 const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out+'/raw-video',size:{width:1440,height:1000}}});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/world.js',r=>r.fulfill({body:source,contentType:'text/javascript'}));
 await page.goto(`${base}/pit-stop-lab/index.html`);await page.waitForFunction(()=>window.__PIT_LAB_STATE__?.render?.heroLoaded);
 await page.locator('button[data-experience=engineer]').click();await page.locator('[data-car-camera=carHero]').evaluate(el=>el.click());
 report.contacts=await page.evaluate(()=>{
  const timeline=document.querySelector('#timeline');
  const seek=t=>{timeline.value=t;timeline.dispatchEvent(new Event('input',{bubbles:true}));return window.__PIT_CREW_QA__();};
  let previous=null,maxRenderError=0,maxPlantedDrift=0,samples=0;
  for(let t=.1;t<4.9;t+=1/120){
   const current=seek(t);
   current.forEach((p,i)=>p.feet.forEach((actual,j)=>{
    const requested=p.contacts[j];maxRenderError=Math.max(maxRenderError,Math.hypot(...actual.map((v,k)=>v-requested[k])));
    if(previous&&Math.abs(requested[1]-.06)<1e-8&&Math.abs(previous[i].contacts[j][1]-.06)<1e-8){maxPlantedDrift=Math.max(maxPlantedDrift,Math.hypot(...actual.map((v,k)=>v-previous[i].feet[j][k])));samples++;}
   }));previous=current;
  }
  const expected=seek(2.8);seek(1.2);const repeated=seek(2.8);
  return {maxRenderError,maxPlantedDrift,samples,seekExact:JSON.stringify(expected)===JSON.stringify(repeated)};
 });
 assert.ok(report.contacts.samples>10000);assert.ok(report.contacts.maxRenderError<1e-8,'Rendered foot differs from floor anchor');assert.ok(report.contacts.maxPlantedDrift<1e-8,'Support foot slides in world space');assert.ok(report.contacts.seekExact,'Seeking changes contact positions');
 report.checks.push('Rendered soles match requested world contacts','Planted support feet stay fixed across the full stop and supply-cart movement','Backward seeking restores identical body and foot poses');
 await page.locator('#hideBtn').click();await page.locator('#speed').evaluate(el=>{el.value='.25';el.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(850);
 const seek=async t=>{await page.locator('#timeline').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));},t);await page.waitForTimeout(180);};
 for(const [name,t] of [['approach',1.45],['service',2.15],['clear',4.6]]){await seek(t);await page.screenshot({path:`${out}/${name}.png`});}
 await seek(.9);await page.locator('#playBtn').evaluate(el=>el.click());await page.waitForTimeout(15500);
 assert.equal(report.errors.length,0);report.checks.push('Approach, service and retreat render without application errors');
 const video=page.video();await context.close();await video.saveAs(`${out}/crew-contacts.webm`);await video.delete();
}finally{await fs.writeFile(`${out}/crew-report.json`,JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2));}
