import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium,browserOptions} from './runtime.mjs';
import {enterClub} from './enter-club.mjs';

const label=process.argv[2]??'after',base=process.argv[3]??'http://127.0.0.1:18080',out=`evidence/serve-snapshots-20261103/${label}`;
assert(['before','after'].includes(label));fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000}});
 await context.addInitScript(()=>{let s=451071;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);});
 const page=await context.newPage(),report={width,label,errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
 // Route only the untouched analysis files to HEAD; every character, asset and other game module stays identical.
 if(label==='before')for(const file of ['dist/Game.js','dist/analysis/PerformanceLab.js','lab.css']){
  const body=execFileSync('/Users/arjan/.local/bin/rtk',['proxy','git','show',`HEAD:rally-house-source-v16/${file}`],{encoding:'utf8',maxBuffer:2e6});
  await page.route('**/'+file,route=>route.fulfill({body,contentType:file.endsWith('.css')?'text/css':'text/javascript'}));
 }
 await page.goto(base+'/?debug');await page.waitForFunction(()=>window.__rh?.ready);await enterClub(page,'Taylor');
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.minutes=1040;g.clock.paused=true;g.settings.visuals='detail';g.settings.reducedMotion=true;g.performanceLab.open(g.player.spec,null);});
 await page.locator('#labSource').selectOption('serve');await page.getByRole('button',{name:'AnatomyMotion',exact:true}).click();
 await page.evaluate(()=>{const t=window.__rh.game.performanceLab.timeline;t.playing=false;t.seek(t.clip.frames.find(f=>f.contact).time);});

 await page.waitForTimeout(100);
 if(label==='before'&&fs.existsSync(`evidence/serve-snapshots-20261103/after/${width}.json`)){
  const state=JSON.parse(fs.readFileSync(`evidence/serve-snapshots-20261103/after/${width}.json`)).contact.camera;
  // Use the new overhead-safe camera for both UI captures, so framing cannot flatter one side.
  await page.evaluate(state=>{const g=window.__rh.game,current=g.camera.captureState();for(const key of ['target','desiredTarget','targetVelocity'])state[key]=current[key].set(state[key].x,state[key].y,state[key].z);g.performanceLab.trackCamera=()=>{};g.camera.restoreState(state);},state);await page.waitForTimeout(60);
 }
 report.contact=await page.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab;g.camera.pin();g.camera.update(0);return {pose:l.timeline.frame.pose,camera:g.camera.captureState(),canvas:{width:g.canvas.width,height:g.canvas.height},player:{...g.player.position},bodyParts:l.timeline.frame.body.length};});
 await page.screenshot({path:`${out}/${width}-contact.png`});
 if(label==='after'){
  const before=JSON.parse(fs.readFileSync(`evidence/serve-snapshots-20261103/before/${width}.json`));
  assert.deepEqual(JSON.parse(JSON.stringify(report.contact.pose)),before.contact.pose);assert.deepEqual(report.contact.canvas,before.contact.canvas);
  report.matchedPoseAndCamera=JSON.stringify(report.contact.camera)===JSON.stringify(before.contact.camera);
  report.snapshots=[];
  for(const [phase,joint] of [['load','knee'],['contact','elbow'],['finish','shoulder']]){
   const button=page.locator(`[data-serve-phase=${phase}]`);await button.click();await page.waitForTimeout(60);
   const state=await page.evaluate(()=>{const g=window.__rh.game,t=g.performanceLab.timeline,f=t.frame,top=document.querySelector('.performance-lab header').getBoundingClientRect().bottom,bottom=document.querySelector('.lab-panel').getBoundingClientRect().top;const points=[f.pose.head,f.pose.footL,f.pose.footR,f.pose.racketCenter.clone().add({x:0,y:.65,z:0}),f.pose.handL];return {playing:t.playing,focus:t.focus,time:t.time,frameTime:f.time,state:f.state,player:{...g.player.position},framing:points.map(p=>g.camera.project(p)),top,bottom};});
   assert(!state.playing);assert.equal(state.focus,joint);assert.equal(state.time,state.frameTime);assert.deepEqual(state.player,report.contact.player);assert.equal(await button.getAttribute('aria-pressed'),'true');
   if(width===390)assert(state.framing.every(p=>p.visible&&p.y>state.top+4&&p.y<state.bottom-4),'The whole pose and overhead racket clear the phone header and controls');

   await page.screenshot({path:`${out}/${width}-${phase}.png`});report.snapshots.push({phase,...state});
  }
  await page.locator('#labSource').selectOption('gait');assert(await page.locator('.lab-snapshots').isHidden());
  await page.locator('#labSource').selectOption('serve');

  const {default:AxeBuilder}=await import('../../arjan-portfolio/node_modules/@axe-core/playwright/dist/index.js');report.axe=(await new AxeBuilder({page}).analyze()).violations.map(v=>v.id);assert.deepEqual(report.axe,[]);
 }
 report.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!report.overflow);assert.deepEqual(report.errors,[]);
 fs.writeFileSync(`${out}/${width}.json`,JSON.stringify(report,null,2));await context.close();console.log(JSON.stringify({label,width,matched:report.matchedPoseAndCamera,errors:report.errors}));
}}finally{await browser.close();}
