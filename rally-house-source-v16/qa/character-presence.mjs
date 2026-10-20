import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'/tmp/rh-character',label=process.env.QA_LABEL??'after',baseline=process.env.QA_BASELINE_RUNTIME;fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),report={label,errors:[],views:[],method:'Production Character.meshes and Renderer on the existing isolated diagnostic stage. Fixed camera, lighting and animation times.'};
try{
 const page=await browser.newPage({viewport:{width:864,height:1080},deviceScaleFactor:2});page.on('pageerror',e=>report.errors.push(e.message));
 if(baseline)await page.route('**/dist/**',route=>route.fulfill({path:path.join(baseline,new URL(route.request().url()).pathname.split('/dist/')[1]),contentType:'text/javascript'}));
 await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:18080'}/?debug`);await page.waitForFunction(()=>window.__rh?.ready);
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.settings.visuals='detail';g.renderer.renderScale=1;const style=document.createElement('style');style.textContent='#app *:not(canvas){display:none!important}';document.head.append(style);});
 const views=[...['taylor','mika','nia','coach'].map(id=>({id,state:'idle',angle:.35})),{id:'taylor',state:'idle',angle:1.5},{id:'taylor',state:'idle',angle:.1,face:true},{id:'taylor',state:'drink',angle:.65},{id:'taylor',state:'sit',angle:.65},{id:'taylor',state:'ready',angle:.35},{id:'taylor',state:'swingForehand',angle:.6},{id:'taylor',state:'swingBackhand',angle:.6},{id:'taylor',state:'serve',angle:.6}];
 for(const view of views.filter(v=>(!process.env.QA_FACE_ONLY||v.face)&&(!process.env.QA_STATE_ONLY||v.state===process.env.QA_STATE_ONLY))){const data=await page.evaluate(async view=>{
  const [{Character},{memberData},{playerSpec},{Navigation},{Vec3}]=await Promise.all([import('/dist/entities/Character.js'),import('/dist/content/content.js'),import('/dist/content/PlayerAvatars.js'),import('/dist/world/Navigation.js'),import('/dist/rendering/Math3D.js')]);
  const spec=view.id==='taylor'?playerSpec('taylor'):memberData.find(s=>s.id===view.id),c=new Character(spec,new Vec3(),new Navigation([]),{});c.racketStowed=true;for(let i=0;i<180;i++)c.update(1/60);
  if(['serve','swingForehand','swingBackhand'].includes(view.state)){c.matchCompetitor=true;c.triggerShot(view.state,new Vec3(0,.1,5));const duration=c.shotDuration(view.state);for(let t=0;t<duration*.78;t+=1/120)c.update(Math.min(1/120,duration*.78-t));}
  else if(view.state!=='idle'){c.matchCompetitor=view.state==='ready';c.seatDepth=view.state==='sit'?.8:0;c.trigger(view.state);for(let i=0;i<60;i++)c.update(1/120);}
  const g=window.__rh.game,camera=g.camera,p=c.analysisPose();camera.autoFrame=false;camera.aspect=g.renderer.resize();camera.target.set(0,view.face?p.head.y:1.26,view.face?p.head.z:0);camera.distance=view.face?1.45:6.45;camera.azimuth=view.angle;camera.elevation=.04;camera.pin();camera.update(0);
  g.render=()=>g.renderer.render([{kind:'roundBox',position:new Vec3(0,-.06,0),scale:new Vec3(8,.10,8),color:'#ded6bd',material:'stone'},...c.meshes()],camera.viewProjection(),g.world.lighting(780,0),camera.position);g.render();
  return {...view,height:p.head.y,shoulderSpan:Vec3.sub(p.shoulderL,p.shoulderR).len(),gl:g.renderer.gl.getError(),drawCalls:g.renderer.drawCalls,triangles:g.renderer.triangles};
 },view);const name=`${label}-${view.id}-${view.state}-${view.face?'face':view.angle}`;await page.screenshot({path:`${out}/${name}.png`});assert.equal(data.gl,0);report.views.push({...data,image:name+'.png'});}
 assert.deepEqual(report.errors,[]);
}finally{await browser.close();fs.writeFileSync(`${out}/${label}-report.json`,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
