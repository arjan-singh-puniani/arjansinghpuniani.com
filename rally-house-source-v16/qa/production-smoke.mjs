import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium,browserOptions} from './runtime.mjs';
import {enterClub} from './enter-club.mjs';
const base=process.argv[2],out=process.argv[3];assert(base&&out);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const report={base,errors:[],assets:0,views:[]};
try{
 const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const root=path.resolve('../arjan-portfolio/public/rally-house');
 const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
 const expected=files(root).filter(p=>/\.(js|css|json|glb|webp|wav|html)$/.test(p));
 // Byte matching catches a deployment that serves an older module or character asset from cache.
 for(let i=0;i<expected.length;i+=8)await Promise.all(expected.slice(i,i+8).map(async file=>{
  const response=await context.request.get(base+'/rally-house/'+path.relative(root,file));assert(response.ok(),file+' HTTP '+response.status());
  const digest=b=>createHash('sha256').update(b).digest('hex');assert.equal(digest(await response.body()),digest(fs.readFileSync(file)),file);report.assets++;
 }));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:960});await page.goto(base+'/playground/rally-house');
  await page.getByRole('heading',{name:'The Sims meets Mario Tennis.'}).waitFor();assert.equal(await page.locator('#how-to-play ol > li').count(),4);
  assert.equal(await page.locator('iframe').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(out,'landing-'+width+'.png')});report.views.push({width,steps:4,overflow:false});
 }
 await page.setViewportSize({width:1440,height:960});await page.getByRole('button',{name:'Play Rally House ↗',exact:true}).click();
 const frame=await (await page.locator('iframe').elementHandle()).contentFrame();await frame.locator('#game').waitFor({state:'visible'});await frame.goto(base+'/rally-house/index.html?debug');await frame.waitForFunction(()=>window.__rh?.ready);await enterClub(frame,'Arjan');
 const headHash=JSON.parse(fs.readFileSync(path.join(root,'assets/characters/arjan/head-provenance.json'))).sha256;
 report.head=await frame.evaluate(hash=>{const g=window.__rh.game;g.autosave=-1e6;return {avatar:g.player.spec.avatar,parts:g.player.meshes().filter(m=>m.skin?.id.startsWith('asset-'+hash+'-')).length};},headHash);assert.equal(report.head.parts,6);assert.equal(report.head.avatar,'arjan');
 await page.screenshot({path:path.join(out,'club.png')});
 await frame.evaluate(()=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.settings.reducedMotion=true;g.startChampionship(g.actor('leo'));for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);if(g.championship.phase!=='serving')throw Error('Match did not start');g.settings.reducedMotion=false;g.canvas.focus();});
 await frame.locator('#game').press('Space');await frame.waitForFunction(()=>window.__rh.game.motionRecorder.clip.frames.some(f=>f.contact),null,{timeout:15000});
 await frame.waitForFunction(()=>window.__rh.game.championship.phase==='pointResult',null,{timeout:30000});await frame.locator('.championshipQuickReview').click();await frame.waitForFunction(()=>window.__rh.game.performanceLab.active);
 report.snapshots=[];
 for(const [phase,joint]of [['load','knee'],['contact','elbow'],['finish','shoulder']]){
  const button=frame.locator('[data-serve-phase='+phase+']');await button.click();
  const state=await frame.evaluate(()=>{const t=window.__rh.game.performanceLab.timeline;return {playing:t.playing,focus:t.focus,source:t.clip.source,kind:t.clip.kind,frames:t.clip.frames.length};});
  assert.equal(state.playing,false);assert.equal(state.focus,joint);assert.equal(state.source,'game-recording');assert.equal(await button.getAttribute('aria-pressed'),'true');report.snapshots.push({phase,...state});
 }
 await page.screenshot({path:path.join(out,'recorded-serve-analysis.png')});await frame.locator('[data-lab-action=close]').click();
 await frame.evaluate(()=>window.__rh.game.requestChampionshipExit());await frame.waitForFunction(()=>!window.__rh.game.championship.active);
 // Exercise the reported idle/conversation switch through the same settings buttons users click.
 await frame.evaluate(()=>{const g=window.__rh.game;for(const a of [...g.activities.active])g.cancelActivity(a);g.visitMember(g.actor('nia'),false);});
 await frame.locator('#settingsBtn').click();await frame.locator('#contextActions button').filter({hasText:'Character:'}).click();await frame.locator('#contextActions button').filter({hasText:'Taylor'}).click();
 report.switch=await frame.evaluate(()=>{const g=window.__rh.game;return {avatar:g.player.spec.avatar,busy:g.activities.busy('player')};});assert.equal(report.switch.avatar,'taylor');assert.equal(report.switch.busy,false);
 assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify(report));
}catch(error){report.failure=error.message;throw error;}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
