import fs from 'node:fs';
import {chromium,firefox,webkit,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'evidence/arrival-20261018';
fs.mkdirSync(out,{recursive:true});
const baseUrl=process.env.QA_BASE_URL??'http://127.0.0.1:8078';
const engine=process.env.QA_ENGINE??'chromium';
const browser=await {chromium,firefox,webkit}[engine].launch({...engine==='chromium'?{...browserOptions,args:['--use-angle=metal']}:{headless:true},...process.env.QA_BROWSER_EXECUTABLE?{executablePath:process.env.QA_BROWSER_EXECUTABLE}:{}});
const reports=[];
try{
 for(const profile of [{name:'desktop',width:1280,height:800,avatar:'Arjan'},{name:'phone',width:390,height:844,avatar:'Taylor'}].filter(p=>!process.env.QA_PROFILE||p.name===process.env.QA_PROFILE)){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:profile.name==='phone'});
  const page=await context.newPage(),report={engine,profile:profile.name,errors:[],requests:[]};reports.push(report);
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.requests.push([r.status(),r.url()]);});
  try{
   await page.goto(`${baseUrl}/?debug`,{waitUntil:'commit',timeout:15000});
   await page.waitForFunction(()=>window.__rh?.ready,null,{timeout:120000,polling:100});
   await page.locator('#loading').waitFor({state:'hidden',timeout:10000});
   await page.waitForFunction(()=>getComputedStyle(document.getElementById('loading')).opacity==='0');
   await page.screenshot({path:`${out}/after-${profile.name}-arrival.png`});
   report.arrival=await page.evaluate(()=>({paused:window.__rh.game.clock.paused,court:window.__rh.game.activities.reserved('court')}));
   await page.getByText(profile.avatar,{exact:true}).click();
   report.playButton=await page.getByRole('button',{name:'Play tennis',exact:true}).boundingBox();
   await page.bringToFront();
   const start=Date.now();await page.getByRole('button',{name:'Play tennis',exact:true}).click();
   report.accepted=await page.evaluate(()=>{const g=window.__rh.game;return {phase:g.championship.phase,paused:g.clock.paused,active:g.activities.active,player:g.player.position,blocked:g.world.nav.isBlocked(g.player.position.x,g.player.position.z),toast:document.getElementById('toast').textContent};});
   console.log(JSON.stringify({profile:profile.name,accepted:report.accepted}));
   if(report.accepted.phase==='inactive')throw Error('Play invitation was not accepted');
   report.focusResumes=0;
   const deadline=Date.now()+90000;
   while(Date.now()<deadline){
    const state=await page.evaluate(()=>({phase:window.__rh.championship().phase,paused:window.__rh.game.clock.paused}));
    if(state.phase==='serving')break;
    if(state.phase==='inactive')throw Error('Challenge ended before the serve');
    if(state.paused){await page.bringToFront();await page.getByRole('button',{name:'Resume match',exact:true}).click();report.focusResumes++;}
    await page.waitForTimeout(200);
   }
   if(await page.evaluate(()=>window.__rh.championship().phase!=='serving'))throw Error('Approach did not reach the serve in 90 seconds');
   report.secondsToServe=(Date.now()-start)/1000;
   await page.screenshot({path:`${out}/after-${profile.name}-match.png`});
   const swing=async()=>profile.name==='phone'?page.getByRole('button',{name:'Swing racket',exact:true}).tap():page.keyboard.press('Space');
   await swing();
   const until=Date.now()+90000;
   while(Date.now()<until){
    const state=await page.evaluate(()=>({phase:window.__rh.championship().phase,rally:window.__rh.championship().currentRally,paused:window.__rh.game.clock.paused,cue:document.querySelector('.championshipHud')?.dataset.cue}));
    if(state.paused){await page.bringToFront();await page.getByRole('button',{name:'Resume match',exact:true}).click();report.focusResumes++;continue;}
    if(state.rally>=3){report.realRally=state;break;}
    if(state.phase==='pointResult'||state.phase==='matchResult'){report.point=await page.evaluate(()=>window.__rh.championship());break;}
    if(state.cue==='swing'||state.rally>=2&&state.rally%2===0)await swing();
    await page.waitForTimeout(80);
   }
   await page.screenshot({path:`${out}/after-${profile.name}-rally.png`});
   await page.getByRole('button',{name:'Return to Club',exact:true}).first().click();
   await page.waitForFunction(()=>window.__rh.championship().phase==='inactive');
   report.returned=await page.evaluate(()=>({court:window.__rh.game.activities.reserved('court'),avatar:window.__rh.game.player.spec.name,actors:window.__rh.game.characters.length,paused:window.__rh.game.clock.paused}));
   await page.screenshot({path:`${out}/after-${profile.name}-returned.png`});
  }catch(e){report.failure=e.message;report.diagnostic=await page.evaluate(()=>{const g=window.__rh?.game;return g?{phase:g.championship.snapshot(),active:g.activities.active,history:g.activities.history.slice(-3),player:{p:g.player.position,path:g.player.path,index:g.player.pathIndex},characters:g.characters.map(c=>({id:c.id,p:c.position,path:c.path,index:c.pathIndex})),toast:document.getElementById('toast').textContent}:null;}).catch(()=>null);await page.screenshot({path:`${out}/after-${profile.name}-failure.png`}).catch(()=>{});}
   await context.close();fs.writeFileSync(`${out}/playtest.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify(report));
 }
}finally{fs.writeFileSync(`${out}/playtest.json`,JSON.stringify(reports,null,2));await browser.close();}

if(reports.some(r=>r.failure||r.errors.length||r.requests.length||!r.realRally&&!r.point||r.returned?.court||r.returned?.actors!==4))process.exitCode=1;
