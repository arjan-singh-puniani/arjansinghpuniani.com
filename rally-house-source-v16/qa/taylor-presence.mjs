import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,browserOptions} from './runtime.mjs';

const out=process.env.QA_OUT??'evidence/taylor-presence-20261015',baseline=process.env.QA_BASELINE_RUNTIME;
assert(baseline,'Provide the complete previous compiled runtime for shader regression comparison');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),report={errors:[],legacy:[],lighting:[]};
async function pageFor(root){
 const page=await browser.newPage({viewport:{width:480,height:360}});page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 if(root)await page.route('**/dist/**',async route=>{const rel=new URL(route.request().url()).pathname.split('/dist/')[1],file=path.join(root,rel);assert(fs.existsSync(file),`Complete baseline: ${rel}`);await route.fulfill({body:fs.readFileSync(file),contentType:'text/javascript'});});
 await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.settings.visuals='detail';g.renderer.renderScale=1;g.render=()=>{};});return page;
}
async function legacy(page,minutes){return page.evaluate(async minutes=>{
 const {Vec3}=await import('/dist/rendering/Math3D.js'),g=window.__rh.game,c=g.camera;
 c.autoFrame=false;c.aspect=g.renderer.resize();c.target.set(0,1.35,0);c.distance=6.5;c.azimuth=.15;c.elevation=.10;c.pin();c.update(0);
 const materials=['matte','wood','fabric','ceramic','metal','glass','court','skin','hair','leaf','stone','toon'];
 const items=materials.map((material,i)=>({kind:'sphere',position:new Vec3((i%4-1.5)*.85,2.15-Math.floor(i/4)*.8,0),scale:new Vec3(.65,.65,.65),color:'#ac8262',material}));
 g.world.weather='clear';g.renderer.render(items,c.viewProjection(),g.world.lighting(minutes,0),c.position);
 const gl=g.renderer.gl,pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
 return {pixels:[...pixels],gl:gl.getError()};
},minutes);}
try{
 const old=await pageFor(baseline),current=await pageFor();
 for(const minutes of [780,1260]){
  const a=await legacy(old,minutes),b=await legacy(current,minutes);assert.equal(a.gl,0);assert.equal(b.gl,0);assert.equal(a.pixels.length,b.pixels.length);
  let total=0,max=0;for(let i=0;i<a.pixels.length;i++){const d=Math.abs(a.pixels[i]-b.pixels[i]);total+=d;max=Math.max(max,d);}
  const mean=total/a.pixels.length;assert(mean<.25&&max<8,'Existing world material pixels remain stable after opt-in portrait materials');
  report.legacy.push({minutes,meanByteDifference:mean,maxByteDifference:max,beforeSHA256:createHash('sha256').update(Uint8Array.from(a.pixels)).digest('hex'),afterSHA256:createHash('sha256').update(Uint8Array.from(b.pixels)).digest('hex')});
 }
 await old.close();await current.setViewportSize({width:864,height:1080});
 await current.evaluate(()=>{const style=document.createElement('style');style.textContent='#app *:not(canvas){display:none!important}';document.head.append(style);});
 for(const [name,minutes,weather] of [['day',780,'clear'],['cloud',780,'cloudy'],['evening',1260,'clear']]){
  const data=await current.evaluate(async({minutes,weather})=>{
   const [{Character},{playerSpec},{Navigation},{Vec3}]=await Promise.all([import('/dist/entities/Character.js'),import('/dist/content/PlayerAvatars.js'),import('/dist/world/Navigation.js'),import('/dist/rendering/Math3D.js')]);
   const g=window.__rh.game,c=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});c.racketStowed=true;for(let i=0;i<240;i++)c.update(1/60);
   const camera=g.camera;camera.autoFrame=false;camera.aspect=g.renderer.resize();camera.target.set(0,c.analysisPose().head.y,0);camera.distance=1.55;camera.azimuth=.45;camera.elevation=.035;camera.pin();camera.update(0);g.world.weather=weather;
   const items=c.meshes(),lighting=g.world.lighting(minutes,0);g.renderer.render(items,camera.viewProjection(),lighting,camera.position);
   // Read the actual cheek pixel immediately after the production render.
   const head=c.analysisPose().head,screen=camera.project(new Vec3(head.x+.060,head.y-.040,head.z+.090)),canvas=g.renderer.canvas,gl=g.renderer.gl,rgba=new Uint8Array(4);
   gl.readPixels(Math.floor(screen.x*canvas.width/innerWidth),canvas.height-1-Math.floor(screen.y*canvas.height/innerHeight),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
   window.__presenceRender=()=>g.renderer.render(items,camera.viewProjection(),lighting,camera.position);g.render=window.__presenceRender;
   return {rgba:[...rgba],gl:gl.getError(),materials:[...new Set(items.map(m=>m.material))],drawCalls:g.renderer.drawCalls,triangles:g.renderer.triangles};
  },{minutes,weather});
  assert.equal(data.gl,0);assert(data.rgba.slice(0,3).every(v=>v>12&&v<250),'Readable nonclipped cheek shading in each real club lighting profile');
  for(const kind of ['humanSkin','groomedHair','lip','iris'])assert(data.materials.includes(kind));
  await current.screenshot({path:`${out}/lighting-${name}.png`});report.lighting.push({name,minutes,weather,...data});
 }
 assert.deepEqual(report.errors,[]);
}finally{fs.writeFileSync(`${out}/lighting-report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report));
