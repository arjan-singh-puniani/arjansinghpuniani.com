import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {chromium,browserOptions} from './runtime.mjs';
import {enterClub} from './enter-club.mjs';
const sharp=createRequire(path.resolve('../arjan-portfolio/package.json'))('sharp');
const media=path.resolve('../arjan-portfolio/public/rally-house/media'),out=path.resolve('evidence/landing-walkthrough-20261101');fs.mkdirSync(out,{recursive:true});
const viewport={width:1440,height:960},report={viewport,seed:451071,screens:{},errors:[]},browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{
 const context=await browser.newContext({viewport,deviceScaleFactor:1});await context.addInitScript(()=>{let s=451071;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:18080/?debug');await page.waitForFunction(()=>window.__rh?.ready);await enterClub(page,'Arjan');
 await page.evaluate(()=>{const g=window.__rh.game;g.autosave=-1e6;for(const a of [...g.activities.active])g.cancelActivity(a);g.clock.minutes=1040;g.clock.paused=true;for(const c of g.characters)c.yieldUntil=Infinity;g.ui.closeContext();});
 async function capture(name,target){
  let callout=null;
  if(target){await target.waitFor({state:'visible'});const b=await target.boundingBox();assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=viewport.width&&b.y+b.height<=viewport.height);callout={left:(b.x-5)/viewport.width*100,top:(b.y-5)/viewport.height*100,width:(b.width+10)/viewport.width*100,height:(b.height+10)/viewport.height*100};}
  const raw=await page.screenshot({path:path.join(out,name+'.png')});const image='guide-'+name+'.webp';await sharp(raw).webp({quality:91}).toFile(path.join(media,image));report.screens[name]={image,...viewport,callout};
 }
 await page.waitForTimeout(500);await capture('club');
 await page.locator('#game').focus();await page.keyboard.press('3');
 const challenge=page.getByRole('button',{name:/Challenge to Match/});await challenge.waitFor({state:'visible'});await page.waitForTimeout(200);await capture('challenge',challenge);
 await challenge.click();await page.waitForFunction(()=>window.__rh.game.championship.phase==='serving',null,{timeout:40000});await page.waitForTimeout(650);await capture('championship',page.locator('.championshipControlsHint'));
 await page.evaluate(()=>{const g=window.__rh.game;window.guideContacts=[];const hit=g.interactiveMatch.callbacks.onHit;g.interactiveMatch.callbacks.onHit=(...args)=>{window.guideContacts.push(args);hit?.(...args);};});
 await page.locator('#game').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>window.__rh.game.motionRecorder.clip.frames.some(f=>f.contact),null,{timeout:10000});
 await page.waitForFunction(()=>window.__rh.game.championship.phase==='pointResult',null,{timeout:20000});
 const analyze=page.locator('.championshipQuickReview');await capture('analyze',analyze);
 await analyze.click();await page.waitForFunction(()=>window.__rh.game.performanceLab.active,null,{timeout:30000});
 await page.locator('[data-mode=body]').click();await page.locator('[data-joint=elbow]').click();
 report.replay=await page.evaluate(()=>{const g=window.__rh.game,l=g.performanceLab,t=l.timeline,contact=t.clip.frames.find(f=>f.contact);if(!contact)throw Error('No recorded contact');t.playing=false;t.seek(contact.time);l.update(0,g.settings.reducedMotion);g.camera.target=g.camera.desiredTarget.clone();g.camera.distance=g.camera.desiredDistance;g.camera.azimuth=g.camera.desiredAzimuth;g.camera.elevation=g.camera.desiredElevation;g.camera.pin();g.camera.update(0);return {source:t.clip.source,kind:t.clip.kind,contacts:window.guideContacts,samples:t.clip.frames.length,overlayOffset:l.rigOffset(false).len(),time:t.time};});
 assert.equal(report.replay.source,'game-recording');assert(report.replay.contacts.length>0);assert.equal(report.replay.overlayOffset,0);await page.waitForTimeout(850);await capture('lab');assert.deepEqual(report.errors,[]);
 report.reviewIsolation=await page.evaluate(()=>{const g=window.__rh.game,positions=g.characters.map(c=>({...c.position})),player={...g.player.position},originals=g.characters.map(c=>c.meshes);let calls=0;g.characters.forEach(c=>{const original=c.meshes;c.meshes=(...args)=>{calls++;return original.apply(c,args);};});g.render(1000);const during=calls;g.performanceLab.close();calls=0;g.render(1000);const after=calls;g.characters.forEach((c,i)=>c.meshes=originals[i]);return {during,after,actors:g.characters.length,positions,afterPositions:g.characters.map(c=>({...c.position})),player,afterPlayer:{...g.player.position}};});
 assert.equal(report.reviewIsolation.during,0);assert.equal(report.reviewIsolation.after,report.reviewIsolation.actors);assert.deepEqual(report.reviewIsolation.positions,report.reviewIsolation.afterPositions);assert.deepEqual(report.reviewIsolation.player,report.reviewIsolation.afterPlayer);
 fs.writeFileSync('../arjan-portfolio/src/app/playground/rally-house/guide-screens.json',JSON.stringify(report.screens,null,2)+'\n');
 await context.close();console.log(JSON.stringify({screens:Object.keys(report.screens),replay:report.replay,errors:report.errors}));
}finally{fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,2));await browser.close();}
