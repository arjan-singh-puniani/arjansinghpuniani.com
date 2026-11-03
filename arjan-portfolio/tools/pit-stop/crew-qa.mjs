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
 source=source.replace(poseAnchor,"        person.userData.qaContacts=movement.contacts?.map(f=>f.position);person.userData.qaPlanted=movement.contacts?.map(f=>f.planted);\n"+poseAnchor);
 source=source.replace(returnAnchor,"    window.__PIT_CREW_QA__=()=>[...Object.values(stations).flatMap(s=>s.people),supplyOperator,...jacks.map(j=>j.operator)].map(p=>({role:p.userData.role,arms:p.userData.bones.slice(0,4).map(b=>b.scale.y),planted:p.userData.qaPlanted,contacts:p.userData.qaContacts,head:p.userData.head.rotation.toArray(),helmet:p.userData.head.getWorldPosition(new THREE.Vector3()).toArray(),segments:p.userData.bones.slice(4).map(b=>[-1,1].map(sign=>p.localToWorld(new THREE.Vector3(0,sign*b.scale.y/2,0).applyQuaternion(b.quaternion).add(b.position)).toArray())),feet:p.userData.feet.map(f=>f.getWorldPosition(new THREE.Vector3()).toArray())}));\n"+returnAnchor);
 source=source.replace(returnAnchor,"    window.__PIT_TIRE_QA__=()=>Object.values(stations).flatMap(s=>[s.old,s.incoming]).filter(w=>w.visible).map(w=>w.getWorldPosition(new THREE.Vector3()).toArray());window.__PIT_CARRY_QA__=()=>Object.values(stations).map(s=>({removed:lastSnapshot.cars[lastSnapshot.activeCar-1].corners[Object.keys(stations).find(k=>stations[k]===s)].removal,wheel:s.old.getWorldPosition(new THREE.Vector3()).toArray(),hands:s.people[1].userData.hands.map(h=>h.getWorldPosition(new THREE.Vector3()).toArray())}));\n"+returnAnchor);
 const context=await browser.newContext({viewport:{width:1440,height:1000},...(process.env.PIT_RECORD_VIDEO==='1'?{recordVideo:{dir:out+'/raw-video',size:{width:1440,height:1000}}}:{})});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/world.js',r=>r.fulfill({body:source,contentType:'text/javascript'}));
 await page.goto(`${base}/pit-stop-lab/index.html?experience=explore`);await page.waitForFunction(()=>window.__PIT_LAB_STATE__?.render?.heroLoaded);
 await page.locator('button[data-experience=engineer]').click();await page.locator('[data-car-camera=carHero]').evaluate(el=>el.click());
 report.contacts=await page.evaluate(()=>{
  const timeline=document.querySelector('#timeline');
  const seek=t=>{timeline.value=t;timeline.dispatchEvent(new Event('input',{bubbles:true}));return window.__PIT_CREW_QA__();};
  let previous=null,maxRenderError=0,maxPlantedDrift=0,samples=0;const armLengths={},armFrames={},legCollisions={};let maxLegPenetration=0,maxHelmetPenetration=0,helmetCollision=null,collision=null;
  for(let t=.1;t<4.9;t+=1/120){
   const current=seek(t),tires=window.__PIT_TIRE_QA__();
   for(const [person,p] of current.entries())for(const [segmentIndex,segment] of p.segments.entries())for(let u=0;u<=1;u+=.1){const point=segment[0].map((v,i)=>v+(segment[1][i]-v)*u);for(const tire of tires){const dx=Math.max(0,Math.abs(point[0]-tire[0])-.16),dr=Math.max(0,Math.hypot(point[1]-tire[1],point[2]-tire[2])-.355),penetration=(segmentIndex%2===0?.08:.066)-Math.hypot(dx,dr);if(penetration>(legCollisions[p.role]?.depth??0))legCollisions[p.role]={depth:penetration,person,t,point,tire};if(penetration>maxLegPenetration){maxLegPenetration=penetration;collision={person,role:p.role,t,point,tire};}}}
   for(let i=0;i<current.length;i++)for(let j=i+1;j<current.length;j++){const depth=.30-Math.hypot(...current[i].helmet.map((v,k)=>v-current[j].helmet[k]));if(depth>maxHelmetPenetration){maxHelmetPenetration=depth;helmetCollision={i,j,t,a:current[i].helmet,b:current[j].helmet};}}
   current.forEach((p,i)=>{const max=Math.max(...p.arms);if(max>(armLengths[p.role]??0)){armLengths[p.role]=max;armFrames[p.role]={t,person:i,arms:p.arms};}});
   current.forEach((p,i)=>p.feet.forEach((actual,j)=>{
    const requested=p.contacts[j];maxRenderError=Math.max(maxRenderError,Math.hypot(...actual.map((v,k)=>v-requested[k])));
    if(previous&&p.planted[j]&&previous[i].planted[j]){maxPlantedDrift=Math.max(maxPlantedDrift,Math.hypot(...actual.map((v,k)=>v-previous[i].feet[j][k])));samples++;}
   }));previous=current;
  }
  const expected=seek(2.8);seek(1.2);const repeated=seek(2.8);
  return {maxRenderError,maxPlantedDrift,samples,armLengths,armFrames,legCollisions,helmetCollision,maxHelmetPenetration,maxLegPenetration,collision,seekExact:JSON.stringify(expected)===JSON.stringify(repeated)};
 });
 report.carry=await page.evaluate(()=>{const el=document.querySelector('#timeline');let maxGripDistance=0,maxSurfaceDistance=0,samples=0;for(let t=2.8;t<5.5;t+=1/120){el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));for(const row of window.__PIT_CARRY_QA__())if(row.removed===1){for(const hand of row.hands){maxGripDistance=Math.max(maxGripDistance,Math.hypot(...hand.map((v,i)=>v-row.wheel[i])));const d=hand.map((v,i)=>v-row.wheel[i]);maxSurfaceDistance=Math.max(maxSurfaceDistance,Math.hypot(Math.max(0,Math.abs(d[0])-.16),Math.max(0,Math.hypot(d[1],d[2])-.355)));samples++;}}}return {maxGripDistance,maxSurfaceDistance,samples};});assert.ok(report.carry.samples>1000);assert.ok(report.carry.maxSurfaceDistance<.075,'Outgoing tire loses contact with its handler');report.checks.push('Outgoing tires remain in the handler grips through retreat');
 assert.ok(report.contacts.samples>10000);assert.ok(report.contacts.maxHelmetPenetration<.005,'Crew helmets overlap');assert.ok(report.contacts.maxLegPenetration<.005,'A crew leg crosses a tire surface');assert.ok(Object.values(report.contacts.armLengths).every(length=>length<.311),'An arm stretches beyond its fixed length');report.checks.push('Rendered legs clear tire surfaces within the 5 mm conservative capsule tolerance','All rendered upper arms and forearms keep their fixed lengths');assert.ok(report.contacts.maxRenderError<1e-8,'Rendered foot differs from floor anchor');assert.ok(report.contacts.maxPlantedDrift<1e-8,'Support foot slides in world space');assert.ok(report.contacts.seekExact,'Seeking changes contact positions');
 report.checks.push('Rendered soles match requested world contacts','Planted support feet stay fixed across the full stop and supply-cart movement','Backward seeking restores identical body and foot poses');
 await page.locator('#hideBtn').click();await page.locator('#speed').evaluate(el=>{el.value='.25';el.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(850);
 const seek=async t=>{await page.locator('#timeline').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));},t);await page.waitForTimeout(180);};
 for(const [name,t] of [['approach',1.45],['service',2.15],['clear',4.6]]){await seek(t);await page.screenshot({path:`${out}/${name}.png`});}
 await seek(.9);await page.locator('#playBtn').evaluate(el=>el.click());await page.waitForTimeout(process.env.PIT_RECORD_VIDEO==='1'?26000:500);
 assert.equal(report.errors.length,0);report.checks.push('Approach, service and retreat render without application errors');
 const video=page.video();await context.close();if(video){await video.saveAs(`${out}/crew-contacts.webm`);await video.delete();}
}finally{await fs.writeFile(`${out}/crew-report.json`,JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2));}
