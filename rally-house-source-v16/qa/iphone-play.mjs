import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webkit, chromium, browserOptions} from './runtime.mjs';

const base=process.argv[2], out=process.argv[3];
assert(base && out, 'Usage: node qa/iphone-play.mjs BASE_URL OUTPUT_DIRECTORY');
fs.mkdirSync(out,{recursive:true});
const report={base, environment:'Desktop browser emulation; physical iPhone Safari/Chrome performance is not measured.', browsers:[]};
// These visible viewports leave room for iPhone browser chrome rather than assuming fullscreen.
const views=[['portrait',402,681],['landscape',756,352],['short-portrait',402,580],['pro-max-portrait',440,763],['pro-max-landscape',838,390]];
try {
  for(const [name,engine] of [['webkit',webkit],['chromium',chromium]]) {
    const browser=await engine.launch(name==='chromium'?{...browserOptions,args:['--use-angle=metal']}:{headless:true});
    console.log(name+': starting phone checks');
    const result={name,errors:[],views:[],phases:[]};report.browsers.push(result);
    try {
      const context=await browser.newContext({viewport:{width:402,height:681},deviceScaleFactor:3,isMobile:true,hasTouch:true});
      const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
      for(const entry of ['Enter the club ↗','Play Rally House ↗']) {
        await page.goto(base+'/playground/rally-house');
        await page.getByRole('link',{name:entry,exact:true}).tap();
        await page.waitForURL('**/rally-house/index.html');
        await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
        await page.waitForLoadState('networkidle');
        assert.equal(await page.locator('iframe').count(),0);
      }
      await page.goto(base+'/rally-house/index.html?debug');
      await page.waitForFunction(()=>window.__rh?.ready,null,{timeout:60000});
      await page.getByText('Arjan',{exact:true}).tap();
      await page.locator('[data-arrival-action="explore"]').tap();
      // Skip NPC travel only; swing input, recording, and replay below use the live game.
      await page.evaluate(()=>{
        const g=window.__rh.game;g.autosave=-1e6;
        for(const a of [...g.activities.active])g.cancelActivity(a);
        g.settings.reducedMotion=true;g.startChampionship(g.actor('leo'));
        for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);
        g.settings.reducedMotion=false;
        if(g.championship.phase!=='serving')throw Error('Match did not start');
      });
      for(const [view,width,height] of views) {
        await page.setViewportSize({width,height});
        await page.waitForTimeout(300);
        for(const selector of ['#game','.championshipTouchPad','.championshipSwing','.championshipPause','.championshipExit']) {
          const rect=await page.locator(selector).boundingBox();assert(rect,view+' '+selector);
          assert(rect.x>=-1&&rect.y>=-1&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1,view+' clipped '+selector);
          if(selector!=='#game')assert(rect.width>=44&&rect.height>=44,view+' small target '+selector);
        }
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        await page.screenshot({path:out+'/'+name+'-'+view+'.png'});
        result.views.push(view);console.log(name+': '+view+' controls fit');
      }
      await page.locator('.championshipPause').tap();
      await page.getByRole('button',{name:'Resume match',exact:true}).tap();
      await page.locator('.championshipTouchPad').waitFor({state:'visible'});
      await page.locator('.championshipSwing').waitFor({state:'visible'});
      // Chromium's real touch dispatch can hold the stick while another finger swings.
      if(name==='chromium') {
        const pad=await page.locator('.championshipTouchPad').boundingBox();
        const swing=await page.locator('.championshipSwing').boundingBox();
        const cdp=await context.newCDPSession(page);
        const finger={x:pad.x+pad.width*.75,y:pad.y+pad.height*.5,id:1};
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger]});
        assert(await page.evaluate(()=>window.__rh.game.matchInput.movement().x>0));
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger,{x:swing.x+swing.width/2,y:swing.y+swing.height/2,id:2}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        assert.equal(await page.evaluate(()=>window.__rh.game.matchInput.movement().x),0);
        result.multitouch=true;
      } else await page.getByRole('button',{name:'Swing racket'}).tap();
      await page.waitForFunction(()=>window.__rh.game.motionRecorder.clip.frames.some(f=>f.contact),null,{timeout:20000});
      await page.waitForFunction(()=>window.__rh.game.championship.phase==='pointResult',null,{timeout:40000});
      await page.locator('.championshipQuickReview').tap();
      await page.waitForFunction(()=>window.__rh.game.performanceLab.active);
      for(const [view,width,height] of views.slice(0,2)) {
        await page.setViewportSize({width,height});
        for(const [phase,joint]of [['load','knee'],['contact','elbow'],['finish','shoulder']]) {
          const button=page.locator('[data-serve-phase='+phase+']');await button.tap();
          assert.equal(await button.getAttribute('aria-pressed'),'true');
          const timeline=await page.evaluate(()=>{const t=window.__rh.game.performanceLab.timeline;return {playing:t.playing,focus:t.focus,source:t.clip.source};});
          assert.deepEqual(timeline,{playing:false,focus:joint,source:'game-recording'});
          result.phases.push(view+':'+phase);
        }
        await page.screenshot({path:out+'/'+name+'-analysis-'+view+'.png'});
      }
      await page.locator('[data-lab-action=close]').tap();
      assert.deepEqual(result.errors,[]);result.passed=true;console.log(name+': touch serve and replay passed');
    } finally { await browser.close(); }
  }
  report.passed=true;
} finally { fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n'); }
console.log(JSON.stringify(report));
