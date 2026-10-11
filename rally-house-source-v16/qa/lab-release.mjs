import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const out='evidence/performance-lab-20261011/release';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),context=await b.newContext({viewport:{width:1440,height:900}}),p=await context.newPage(),errors=[],requests=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)requests.push(`${r.status()} ${r.url()}`);});
try{
 await p.goto('http://127.0.0.1:8078/?debug');await p.waitForFunction(()=>window.__rh?.ready);
 await p.evaluate(()=>{
  const g=window.__rh.game;g.choosePlayerAvatar('arjan');g.ui.closeContext();g.settings.reducedMotion=true;
  for(const a of [...g.activities.active])g.cancelActivity(a);g.startChampionship(g.actor('leo'));
  for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);
  if(g.championship.phase!=='serving')throw Error('No Championship entry');g.clock.paused=false;
  g.interactiveMatch.prepareShot('player','serve','perfect');
 });
 // Real RAF/fixed-step game loop captures the actual stroke and ball events.
 await p.waitForFunction(()=>window.__rh.game.motionRecorder.clip.frames.some(f=>f.contact),{timeout:15000});await p.waitForTimeout(1700);
 const recording=await p.evaluate(()=>{
  const g=window.__rh.game,c=g.motionRecorder.clip,contact=c.frames.find(f=>f.contact);
  if(!contact?.ball)throw Error('Contact sample has no ball');
  const error=Math.hypot(contact.ball.x-contact.pose.racketCenter.x,contact.ball.y-contact.pose.racketCenter.y,contact.ball.z-contact.pose.racketCenter.z);
  return {samples:c.frames.length,source:c.source,contacts:c.frames.filter(f=>f.contact).length,bounces:c.frames.filter(f=>f.bounce).length,contactError:error};
 });assert(recording.samples>20);assert.equal(recording.source,'game-recording');assert(recording.contacts>=1);assert(recording.bounces>=1);assert(recording.contactError<.12);
 await p.evaluate(()=>{const g=window.__rh.game;g.requestChampionshipExit();for(let i=0;i<200;i++)g.updateFixed(1/60);});
 await p.locator('#labBtn').click();await p.waitForTimeout(300);const find=p.getByRole('button',{name:"Find Performance Lab ↗",exact:true});if(await find.isVisible())await find.click();await p.locator('[data-action=analyze]').click();
 await p.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;for(let i=0;i<5000&&!g.performanceLab.active;i++)g.updateFixed(1/60);});
 assert.equal(await p.locator('#labSource').inputValue(),'championship');assert.match(await p.locator('.lab-provenance').textContent(),/GAME RECORDING/);
 const replay=await p.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab,t=l.timeline,f=t.clip.frames.find(f=>f.contact);t.playing=false;t.seek(f.time);l.focus('elbow');l.update(0,true);g.camera.target=g.camera.desiredTarget.clone();g.camera.distance=g.camera.desiredDistance;g.camera.azimuth=g.camera.desiredAzimuth;g.camera.elevation=g.camera.desiredElevation;g.camera.pin();g.camera.update(0);return {...l.report(),angle:document.querySelector('.lab-readout').textContent,clock:g.clock.minutes,root:{...g.player.position}};});
 await p.waitForTimeout(100);await p.screenshot({path:`${out}/championship-recording.png`});assert.equal(replay.time,replay.frame);
 await p.locator('[data-mode=court]').click();await p.selectOption('#labSource','gait');
 await p.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab;l.timeline.playing=false;l.timeline.seek(4.7);l.update(0,true);g.camera.target=g.camera.desiredTarget.clone();g.camera.distance=g.camera.desiredDistance;g.camera.azimuth=g.camera.desiredAzimuth;g.camera.elevation=g.camera.desiredElevation;g.camera.pin();g.camera.update(0);window.__labVariantOriginal=l.meshes.bind(l);});
 // Controlled render-only comparisons; same captured gait, time and camera.
 for(const variant of ['A-tiles','B-soft-discs','C-high-contrast']){
  await p.evaluate(variant=>{const l=window.__rh.game.performanceLab;l.meshes=reduced=>window.__labVariantOriginal(reduced).map(m=>{
   if(Math.abs(m.position.y-.076)>.0001||m.kind!=='roundBox')return m;
   if(variant==='B-soft-discs')return {...m,kind:'sphere',scale:m.scale.clone().set(1.05,.01,1.05),alpha:(m.alpha??1)*.72};
   if(variant==='C-high-contrast')return {...m,alpha:Math.min(.75,(m.alpha??1)*2.4)};
   return m;
  });},variant);await p.waitForTimeout(100);await p.screenshot({path:`${out}/${variant}.png`});
 }
 await p.evaluate(()=>{window.__rh.game.performanceLab.meshes=window.__labVariantOriginal;delete window.__labVariantOriginal;});
 await p.locator('header [data-lab-action=close]').click();
 await p.close();
 const viewports=[];
 for(const [width,height] of [[1920,1080],[1728,1117],[1440,900],[1280,800],[1024,768],[844,390],[430,932],[390,844]].filter(([w])=>!process.env.QA_RECORDING_ONLY&&(!process.env.QA_WIDTH||w===Number(process.env.QA_WIDTH)))){
  const context=await b.newContext({viewport:{width,height}}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)requests.push(`${r.status()} ${r.url()}`);});
  await p.setViewportSize({width,height});await p.goto('http://127.0.0.1:3096/playground/rally-house');assert.equal(await p.locator('iframe').count(),0);
  await p.getByRole('button',{name:/Analyze/}).click();await p.waitForFunction(()=>[...document.images].some(i=>i.alt.includes('Actual Performance Lab')&&i.complete&&i.naturalWidth>0));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
  const {default:AxeBuilder}=await import('../../arjan-portfolio/node_modules/@axe-core/playwright/dist/index.js');const axe=await new AxeBuilder({page:p}).analyze();assert.deepEqual(axe.violations,[]);
  await p.screenshot({path:`${out}/portfolio-${width}x${height}.png`});
  await p.evaluate(()=>localStorage.clear());await p.getByRole('button',{name:'Play Rally House ↗'}).click();const frame=p.frameLocator('iframe');await frame.getByText('Arjan',{exact:true}).click();
  assert.equal(await frame.locator('body').evaluate(()=>typeof window.__rh),'undefined');
  await frame.locator('#labBtn').click();await p.waitForTimeout(300);const find=frame.getByRole('button',{name:"Find Performance Lab ↗",exact:true});if(await find.isVisible())await find.click();await p.waitForTimeout(1200);await p.screenshot({path:`${out}/station-entry-${width}x${height}.png`});await frame.locator('[data-action=analyze]').click();await frame.locator('.performance-lab').waitFor({state:'visible',timeout:60000});
  for(const mode of ['body','court','combined']){await frame.locator(`[data-mode=${mode}]`).click();await frame.locator('#labSource').selectOption(mode==='court'?'gait':'forehand');await frame.locator('.lab-transport input').fill('500');}
  assert.match(await frame.locator('.lab-provenance').textContent(),/AUTHORED DEMO/);await frame.locator('[data-joint=ankle]').click();assert.match(await frame.locator('.lab-plot-title').textContent(),/height/);
  await p.screenshot({path:`${out}/shipped-lab-${width}x${height}.png`});await frame.locator('header [data-lab-action=close]').click();await frame.locator('.performance-lab').waitFor({state:'hidden'});
  viewports.push({width,height,axe:0,shippedLab:true,debugHooks:false});await context.close();console.log('Portfolio + native Lab PASS',width,height);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 fs.writeFileSync(`${out}/${process.env.QA_RECORDING_ONLY?'recording':'report'}.json`,JSON.stringify({recording,replay,viewports,errors,requests},null,2));
}finally{await b.close();}
