import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';

const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
  await page.goto(process.env.RH_URL??'http://127.0.0.1:8078/?debug');
  await page.waitForFunction(()=>window.__rh?.ready);
  await page.getByText('Arjan',{exact:true}).click();
  await page.evaluate(()=>{
    const g=window.__rh.game;
    g.clock.minutes=1040;g.clock.paused=true;
    g.openCharacter(g.characters.find(c=>c.id==='leo'));
  });
  await page.getByText('Challenge to Match',{exact:true}).click();
  await page.waitForFunction(()=>window.__rh.championship().phase==='serving',null,{timeout:35000});
  await page.evaluate(()=>{
    const g=window.__rh.game,m=g.interactiveMatch;
    window.qaOriginalTick=g.updateFixed.bind(g);
    window.qaStage='contact';window.qaFrozen=false;
    g.updateFixed=function(dt){
      if(window.qaFrozen)return;
      window.qaOriginalTick(dt);
      const hit=m.pending?.impactStarted&&!m.pending.released;
      const flight=m.ball.active&&m.trail.meshes(m.ball.position).length>=12&&m.ball.position.z<1.5;
      const bounce=m.bouncePulse===1;
      if((window.qaStage==='contact'&&hit)||(window.qaStage==='flight'&&flight)||(window.qaStage==='bounce'&&bounce))window.qaFrozen=true;
    };
  });
  await page.keyboard.press('Space');
  const evidence={};
  for(const stage of ['contact','flight','bounce']){
    if(stage!=='contact')await page.evaluate(stage=>{window.qaStage=stage;window.qaFrozen=false;},stage);
    await page.waitForFunction(()=>window.qaFrozen,null,{timeout:6000});
    await page.screenshot({path:`qa/studio/ball-${stage}.png`});
    evidence[stage]=await page.evaluate(()=>{
      const g=window.__rh.game,m=g.interactiveMatch;
      const ball=m.meshes().find(v=>v.id==='match-ball');
      return {scale:ball.scale,position:ball.position,trail:m.meshes().filter(v=>v.id==='ball-comet').length,strings:g.player.racketStringOffset(),errors:[]};
    });
  }
  assert(evidence.contact.scale.z<.1);
  assert(evidence.flight.trail>=12);
  assert(evidence.bounce.scale.y<evidence.bounce.scale.x);
  await page.evaluate(()=>{window.qaFrozen=false;window.qaStage='none';window.__rh.game.updateFixed=window.qaOriginalTick;});
  assert.deepEqual(errors,[]);
  fs.writeFileSync('qa/studio/ball-feel.json',JSON.stringify({status:'PASS',evidence,errors},null,2));
  console.log('Ball/contact/comet browser captures PASS');
}finally{await browser.close();}
