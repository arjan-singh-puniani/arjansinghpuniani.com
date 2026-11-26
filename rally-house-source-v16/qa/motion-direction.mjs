import fs from 'node:fs';import assert from 'node:assert/strict';import {chromium,webkit,browserOptions} from './runtime.mjs';
const [label='before',base='http://127.0.0.1:18132/',out='evidence/motion-direction-20261123']=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const viewport=process.env.QA_MOBILE?{width:402,height:874}:{width:1200,height:900};
const b=await(process.env.QA_ENGINE==='webkit'?webkit.launch({headless:true}):chromium.launch({...browserOptions,args:['--use-angle=metal']})),context=await b.newContext({viewport,recordVideo:{dir:out+'/raw',size:viewport}}),page=await context.newPage(),errors=[],report={label,errors,scenarios:[]};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 if(process.env.QA_RUNTIME)await page.route('**/dist/**',route=>route.fulfill({body:fs.readFileSync(process.env.QA_RUNTIME+new URL(route.request().url()).pathname),contentType:'text/javascript'}));
 await page.route('**/qa/motion-scenarios.mjs',route=>route.fulfill({body:fs.readFileSync(new URL('./motion-scenarios.mjs',import.meta.url),'utf8'),contentType:'text/javascript'}));
 await page.goto(base+'?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Arjan',{exact:true}).click({noWaitAfter:true});await page.locator('[data-arrival-action="explore"]').click({noWaitAfter:true});
 await page.addStyleTag({content:'.lab-panel{display:none!important}.lab-transport{opacity:.7}.performance-lab header{pointer-events:none}'});
 for(const name of (process.env.QA_SCENARIO?[process.env.QA_SCENARIO]:['footwork','forehand','backhand','running','serve','volley'])){
  const stats=await page.evaluate(async name=>{
   const {scenario}=await import('/qa/motion-scenarios.mjs'),{Vec3}=await import('/dist/rendering/Math3D.js'),g=window.__rh.game,l=g.performanceLab,{spec,frames}=scenario(name);g.clock.paused=true;l.close();l.open(spec,{name:'Motion study · '+name,kind:'championship',source:'authored-demo',frames},null,'championship');l.timeline.playing=false;l.contactLens=false;l.timeline.mode='court';
   l.trackCamera=()=>{g.camera.desiredTarget=new Vec3(.2,1.2,4);g.camera.desiredDistance=innerWidth<600?15:10;g.camera.desiredAzimuth=.6;g.camera.desiredElevation=.30;};l.trackCamera();g.camera.target=g.camera.desiredTarget.clone();g.camera.distance=g.camera.desiredDistance;g.camera.azimuth=g.camera.desiredAzimuth;g.camera.elevation=g.camera.desiredElevation;g.camera.pin();
   document.querySelector('.performance-lab header small').textContent='Motion study · '+name;window.studyFrames=frames;
   return {name,frames:frames.length,poses:frames.filter((_,i)=>i%3===0).map(f=>({t:f.time,state:f.state,root:f.root,head:f.pose.head,hip:f.pose.pelvisCenter,L:f.pose.footL,R:f.pose.footR,hand:f.pose.handR,sp:f.pose.sp}))};
  },name);report.scenarios.push(stats);
  for(const speed of [1,.25]){await page.evaluate(speed=>{const l=window.__rh.game.performanceLab;l.timeline.seek(l.timeline.start);l.timeline.speed=speed;l.timeline.playing=true;l.invalidate();},speed);await page.waitForTimeout(speed===1?(stats.frames/60)*1000:2000);}
  for(const t of (name==='footwork'?[.38,1.2,1.85,2.6]:name==='running'?[.55,.75,.95,1.9]:[.42,.55,.70,.9])){
   await page.evaluate(t=>{const l=window.__rh.game.performanceLab;l.timeline.playing=false;l.timeline.seek(t);l.invalidate();l.update(0,true);},t);await page.waitForTimeout(40);await page.screenshot({path:out+'/'+label+'-'+name+'-'+t+'.png'});
  }
 }
 assert.deepEqual(errors,[]);report.passed=true;
}finally{const video=page.video();await context.close();await video.saveAs(out+'/'+label+'-motion.webm');await b.close();fs.writeFileSync(out+'/'+label+'.json',JSON.stringify(report));}
console.log(JSON.stringify({label,scenarios:report.scenarios.map(s=>({name:s.name,frames:s.frames})),errors}));
