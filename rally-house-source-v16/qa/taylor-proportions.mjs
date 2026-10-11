import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {chromium,browserOptions} from './runtime.mjs';
const root=process.env.QA_OUT??'evidence/taylor-reference-20261011',label=process.env.QA_LABEL??'after',reference=(process.env.QA_REFERENCE??'1')==='1';fs.mkdirSync(root,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),page=await browser.newPage({viewport:reference?{width:1319,height:526}:{width:864,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
if(process.env.QA_BASELINE_RUNTIME)await page.route('**/dist/**',async route=>{const rel=new URL(route.request().url()).pathname.split('/dist/')[1],file=path.join(process.env.QA_BASELINE_RUNTIME,rel);if(fs.existsSync(file))await route.fulfill({body:fs.readFileSync(file),contentType:'text/javascript'});else await route.continue();});
await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);
const baselineSource=process.env.QA_BASELINE?fs.readFileSync(process.env.QA_BASELINE,'utf8').replace("'../rendering/Math3D.js'","'http://127.0.0.1:8078/dist/rendering/Math3D.js'"):null;
await page.evaluate(async({baselineSource,reference})=>{
 const {Character}=await import('/dist/entities/Character.js'),{playerSpec}=await import('/dist/content/PlayerAvatars.js'),{Navigation}=await import('/dist/world/Navigation.js'),{Vec3}=await import('/dist/rendering/Math3D.js');
 const g=window.__rh.game,c=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});c.racketStowed=true;c.yaw=0;c.desiredYaw=0;for(let i=0;i<240;i++)c.update(1/60);
 if(baselineSource){const url=URL.createObjectURL(new Blob([baselineSource],{type:'text/javascript'}));const {CHARACTER_SKIN}=await import(url);const meshes=c.meshes.bind(c);c.meshes=()=>meshes().map(m=>(m.skin?.id.startsWith('taylor-dress-')||m.skin?.id.startsWith('taylor-reference-gold-tunic-'))?{...m,skin:CHARACTER_SKIN.taylorDress}:m.skin?.id.startsWith('taylor-gold-dress-edging-')?{...m,skin:CHARACTER_SKIN.taylorDressEdging}:m);URL.revokeObjectURL(url);}
 g.clock.paused=true;const camera=g.camera;camera.autoFrame=false;camera.target.set(reference?.065:0,reference?1.39:1.35,0);camera.distance=reference?3.83:7;camera.azimuth=0;camera.elevation=reference?0:.035;camera.pin();camera.update(0);
 g.render=()=>{const floor={kind:'roundBox',position:new Vec3(0,-.06,0),scale:new Vec3(8,.10,8),color:'#ded6bd',material:'stone'};g.renderer.render([floor,...c.meshes()],camera.viewProjection(),g.atmosphere.update(g.world.lighting(780,0),0),camera.position);};
 const style=document.createElement('style');style.textContent='#app *:not(canvas){display:none!important}';document.head.append(style);
 window.__appearanceActor=c;
},{baselineSource,reference});
await page.waitForTimeout(80);await page.screenshot({path:`${root}/${label}-front.png`});
await page.evaluate(()=>{const g=window.__rh.game;g.camera.azimuth=.65;g.camera.pin();g.camera.update(0);});await page.waitForTimeout(80);await page.screenshot({path:`${root}/${label}-three-quarter.png`});
assert.deepEqual(errors,[]);fs.writeFileSync(`${root}/${label}-report.json`,JSON.stringify({capture:'Isolated actual Character.meshes and production Renderer; authored inspection stage, not a gameplay screenshot',baseline:process.env.QA_BASELINE_RUNTIME??process.env.QA_BASELINE??null,referenceFraming:reference,errors},null,2));await browser.close();console.log(`Actual ${label} front and three-quarter geometry captured`);
