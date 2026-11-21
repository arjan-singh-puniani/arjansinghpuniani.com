import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webkit,chromium,browserOptions} from './runtime.mjs';

const [base,out,engine='webkit']=process.argv.slice(2);assert(base&&out);
fs.mkdirSync(out,{recursive:true});
const report={engine,environment:'Desktop browser emulation, not a physical iPhone.',views:[],errors:[]};
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{...browserOptions,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:756,height:352},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(base+'?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.locator('#loading').waitFor({state:'hidden'});
 await page.getByText('Arjan',{exact:true}).tap();const entry=Date.now();await page.locator('.arrival-play').tap();
 await page.locator('.championshipHud[data-phase=serving]').waitFor({timeout:20000});
 // Observe actual inputs and animation; do not teleport athletes or manufacture a score.
 await page.evaluate(()=>{
  const g=window.__rh.game,original=g.updateFixed.bind(g);window.courtReadability={samples:0,minPedestrianDistance:Infinity,contactVisible:true};
  g.updateFixed=dt=>{
   original(dt);const s=window.courtReadability;
   if(!g.championship.active)return;s.samples++;
   const competitors=[g.player,g.characters.find(c=>c.id===g.championshipOpponentId)];
   for(const c of g.characters)if(c.id!==g.championshipOpponentId)for(const athlete of competitors)if(athlete)s.minPedestrianDistance=Math.min(s.minPedestrianDistance,Math.hypot(c.position.x-athlete.position.x,c.position.z-athlete.position.z));
   const m=g.interactiveMatch;
   if(m?.pending?.stroke==='serve'){
    const ball=m.visibleBallPosition(),p=ball&&g.camera.project(ball);
    if(p)s.contactVisible&&=p.x>0&&p.x<innerWidth&&p.y>0&&p.y<innerHeight;
   }
  };
 });
 report.firstServeMs=Date.now()-entry;assert(report.firstServeMs<15000,'Court clearance must not make entry sluggish');
 for(const [width,height,name] of [[756,352,'landscape'],[838,390,'wide-landscape'],[402,681,'portrait'],[1440,900,'desktop']]){
  await page.setViewportSize({width,height});await page.waitForTimeout(1500);
  const view=await page.evaluate(()=>{
   const g=window.__rh.game,p=g.player.position,foot=g.camera.project(p),head=g.camera.project({x:p.x,y:2.2,z:p.z});
   return {foot,head,playerPixels:foot.y-head.y};
  });
  assert(view.head.y>0&&view.foot.y<height-20,'Player stays fully visible');
  report.views.push({name,width,height,...view});
  await page.screenshot({path:out+'/'+name+'.png'});
 }
 await page.setViewportSize({width:756,height:352});await page.waitForTimeout(1500);
 await page.getByRole('button',{name:'Swing racket'}).tap();
 await page.waitForFunction(()=>window.__rh.game.interactiveMatch.pending?.stroke==='serve'&&window.__rh.game.player.animTime>.4);
 await page.screenshot({path:out+'/serve.png'});
 const start=Date.now();let lastSwing=0;
 while(Date.now()-start<60000){
  const state=await page.evaluate(()=>{const g=window.__rh.game;return {phase:g.championship.phase,server:g.championship.snapshot().server,cue:g.interactiveMatch?.playerCue()};});
  if(state.phase==='matchResult')await page.getByRole('button',{name:'Rematch',exact:true}).tap();
  else if(Date.now()-lastSwing>800&&((state.phase==='serving'&&state.server==='player'&&state.cue!=='serving')||state.cue==='swing')){
   await page.getByRole('button',{name:'Swing racket'}).tap();lastSwing=Date.now();
  }
  await page.waitForTimeout(120);
 }
 report.play=await page.evaluate(()=>({...window.courtReadability,score:window.__rh.game.championship.score}));
 assert(report.play.samples>1000);assert(report.play.contactVisible,'Serve toss/contact must remain visible');
 assert(report.play.minPedestrianDistance>1,'Spectators must leave the server room');
 await page.screenshot({path:out+'/after-play.png'});
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=error.message;throw error;}finally{
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();
}
console.log(JSON.stringify(report));
