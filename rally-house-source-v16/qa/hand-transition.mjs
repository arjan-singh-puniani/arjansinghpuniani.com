import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'/tmp/rh-hand-transitions',baseline=process.env.QA_BASELINE_RUNTIME;if(!baseline||!fs.existsSync(path.join(baseline,'main.js')))throw Error('Supply the previous committed runtime with QA_BASELINE_RUNTIME');fs.mkdirSync(out,{recursive:true});
const baselineAssets=path.resolve(baseline,'../assets/characters');if(!fs.existsSync(path.join(baselineAssets,'taylor/provenance.json')))throw Error('Archive matching character assets with the baseline runtime');
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),report={method:'Matched production Character/Renderer diagnostic stage; real-time state transitions and native canvas recordings.',cases:[]};
try{for(const label of ['before','after'])for(const state of ['sit','ready']){
 const context=await browser.newContext({viewport:{width:864,height:1080}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  if(label==='before')await page.route('**/dist/**',route=>route.fulfill({path:path.join(baseline,new URL(route.request().url()).pathname.split('/dist/')[1]),contentType:'text/javascript'}));
  if(label==='before')await page.route('**/assets/characters/**',route=>route.fulfill({path:path.join(baselineAssets,new URL(route.request().url()).pathname.split('/assets/characters/')[1])}));
  await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:18080'}/?debug`);await page.waitForFunction(()=>window.__rh?.ready,null,{timeout:20000});
  const result=await page.evaluate(async state=>{
   const [{Character},{playerSpec},{Navigation},{Vec3}]=await Promise.all([import('/dist/entities/Character.js'),import('/dist/content/PlayerAvatars.js'),import('/dist/world/Navigation.js'),import('/dist/rendering/Math3D.js')]),g=window.__rh.game,c=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});c.matchCompetitor=true;c.racketStowed=false;c.seatDepth=.8;for(let i=0;i<180;i++)c.update(1/60);g.clock.paused=true;g.settings.visuals='detail';const style=document.createElement('style');style.textContent='#app *:not(canvas){display:none!important}';document.head.append(style);
   const camera=g.camera;camera.autoFrame=false;camera.aspect=g.renderer.resize();camera.target.set(0,1.26,0);camera.distance=6.45;camera.azimuth=.35;camera.elevation=.04;camera.pin();camera.update(0);
   const stage=()=>g.renderer.render([{kind:'roundBox',position:new Vec3(0,-.06,0),scale:new Vec3(8,.10,8),color:'#ded6bd',material:'stone'},...c.meshes()],camera.viewProjection(),g.world.lighting(780,0),camera.position);g.render=stage;stage();const canvas=g.renderer.canvas;
   return await new Promise((resolve,reject)=>{const stream=canvas.captureStream(60),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:1800000}),chunks=[];let onset='',changed=false,frames=0,jointShift=0,last=performance.now(),start=last;
    const deadline=setTimeout(()=>{stream.getTracks().forEach(t=>t.stop());reject(Error('Transition recording deadline'));},6000);
    g.render=()=>{const now=performance.now(),dt=Math.min(.03,(now-last)/1000);last=now;if(!changed&&now-start>=500){const hand=c.analysisPose().handR;c.trigger(state);stage();onset=canvas.toDataURL('image/png');jointShift=Vec3.sub(hand,c.analysisPose().handR).len();changed=true;}else{c.update(dt);stage();}frames++;};
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=()=>{clearTimeout(deadline);stream.getTracks().forEach(t=>t.stop());reject(Error('Transition recorder failed'));};
    recorder.onstop=()=>{clearTimeout(deadline);stream.getTracks().forEach(t=>t.stop());g.render=stage;stage();const end=canvas.toDataURL('image/png'),reader=new FileReader();reader.onerror=()=>reject(Error('Transition video could not be read'));reader.onload=()=>resolve({video:reader.result,onset,end,frames,jointShift,gl:g.renderer.gl.getError(),liveTracks:stream.getTracks().filter(t=>t.readyState==='live').length});reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};
    recorder.start();setTimeout(()=>recorder.stop(),2400);
   });
  },state);
  assert.equal(result.gl,0);assert.equal(result.liveTracks,0);assert(result.frames>40);assert(result.jointShift<1e-5);assert.deepEqual(errors,[]);
  for(const [key,extension] of [['video','webm'],['onset','png'],['end','png']])fs.writeFileSync(`${out}/${label}-${state}-${key}.${extension}`,Buffer.from(result[key].split(',')[1],'base64'));
  report.cases.push({label,state,frames:result.frames,jointShift:result.jointShift,gl:result.gl,liveTracks:result.liveTracks,errors});
 }finally{await context.close();}
}}finally{await browser.close();fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
