import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'evidence/athletic-cast-20261015',label=process.env.QA_LABEL??'after',baseline=process.env.QA_BASELINE_RUNTIME;fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:864,height:1080}}),report={label,baseline:baseline??null,capture:'Actual production Character.meshes and Renderer on an isolated diagnostic stage',errors:[],actors:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
if(baseline)await page.route('**/dist/**',async route=>{const rel=new URL(route.request().url()).pathname.split('/dist/')[1],f=path.join(baseline,rel);assert(fs.existsSync(f));await route.fulfill({body:fs.readFileSync(f),contentType:'text/javascript'});});
try{
 await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__rh?.ready);
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.settings.visuals='detail';g.renderer.renderScale=1;const style=document.createElement('style');style.textContent='#app *:not(canvas){display:none!important}';document.head.append(style);});
 for(const id of ['coach','mika','nia','leo','arjan']){
  const data=await page.evaluate(async id=>{
   const [{Character},{memberData},{playerSpec},{Navigation},{Vec3}]=await Promise.all([import('/dist/entities/Character.js'),import('/dist/content/content.js'),import('/dist/content/PlayerAvatars.js'),import('/dist/world/Navigation.js'),import('/dist/rendering/Math3D.js')]);
   const spec=id==='arjan'?playerSpec('arjan'):memberData.find(s=>s.id===id),c=new Character(spec,new Vec3(),new Navigation([]),{});c.racketStowed=true;for(let i=0;i<240;i++)c.update(1/60);
   const g=window.__rh.game,camera=g.camera;camera.autoFrame=false;camera.aspect=g.renderer.resize();camera.target.set(0,1.35,0);camera.distance=6.7;camera.azimuth=.45;camera.elevation=.035;camera.pin();camera.update(0);
   g.render=()=>g.renderer.render([{kind:'roundBox',position:new Vec3(0,-.06,0),scale:new Vec3(8,.10,8),color:'#ded6bd',material:'stone'},...c.meshes()],camera.viewProjection(),g.world.lighting(780,0),camera.position);
   g.render();const p=c.analysisPose();return {id,name:spec.name,height:p.head.y,shoulderSpan:Vec3.sub(p.shoulderL,p.shoulderR).len(),gl:g.renderer.gl.getError(),drawCalls:g.renderer.drawCalls,triangles:g.renderer.triangles};
  },id);
  await page.screenshot({path:`${out}/${label}-${id}.png`});assert.equal(data.gl,0);report.actors.push(data);
 }
 assert.deepEqual(report.errors,[]);
}finally{fs.writeFileSync(`${out}/${label}-report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report));
