import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
  await page.goto(process.env.RH_URL??'http://127.0.0.1:8078/?debug');
  await page.waitForFunction(()=>window.__rh?.ready);
  await page.getByText('Arjan',{exact:true}).click();
  await page.evaluate(()=>{
    const g=window.__rh.game;
    for(const a of [...g.activities.active])g.cancelActivity(a);
    g.observationStarted=true;g.clock.paused=false;g.clock.minutes=1040;
    g.everyday.next=1e9;g.history.nextSocial=1e9;g.history.nextObject=1e9;
    g.camera.focus(1,0,24);
    if(!g.startMatch())throw Error('Club match could not reserve court');
    window.qaContact={min:Infinity,frames:0,contacts:0,frozen:false};
    const update=g.updateFixed.bind(g);
    g.updateFixed=function(dt){
      if(window.qaContact.frozen)return;
      update(dt);
      const r=g.socialRally,p=r.pending;
      window.qaContact.contacts=r.sessionHits;
      if(p&&!p.released&&p.state!=='serve'){
        const q=r.stagedBall(p),front=(q.z-p.hitter.position.z)*-Math.sign(p.hitter.position.z);
        window.qaContact.min=Math.min(window.qaContact.min,front);window.qaContact.frames++;
        if(r.sessionHits>=6&&p.impactStarted)window.qaContact.frozen=true;
      }
    };
  });
  await page.waitForFunction(()=>window.qaContact.frozen,null,{timeout:60000});
  const result=await page.evaluate(()=>window.qaContact);
  assert(result.min>.1&&result.frames>40);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'qa/studio/club-front-contact.png'});
  fs.writeFileSync('qa/studio/club-front-contact.json',JSON.stringify({status:'PASS',...result,errors},null,2));
  console.log(JSON.stringify(result));
}finally{await browser.close();}
