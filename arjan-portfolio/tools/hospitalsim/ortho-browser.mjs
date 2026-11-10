import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium, devices, webkit} from 'playwright';
import {makeCase} from '../../public/hospitalsim/ortho/model.mjs';

const base = process.env.ORTHO_BASE || 'http://127.0.0.1:8782/hospitalsim';
const out = process.env.ORTHO_OUT;
const soft = process.env.ORTHO_SOFTWARE === '1';
const metal = process.env.ORTHO_METAL === '1';
const url = base + '/ortho/index.html';
if (out) await mkdir(out,{recursive:true});
const browser = await chromium.launch({args:soft
  ? ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
  : metal ? ['--use-gl=angle','--use-angle=metal','--enable-gpu'] : []});
const report = {chromium:browser.version(), runs:[]};
const baseline = makeCase().baseline;

try {
  const clinic = await browser.newPage();
  await clinic.goto(base+'/index.html');
  await clinic.getByRole('button',{name:/Build Reception/}).first().waitFor({timeout:20000});
  const link = clinic.getByRole('link',{name:/Ortho Lab/});
  assert((await link.getAttribute('href')).endsWith('ortho/index.html'));
  if (out) await clinic.screenshot({path:join(out,'clinic-entry.png')});
  await clinic.close();

  for (const touch of [false,true]) {
    const context = await browser.newContext({
      ...(touch ? devices['iPhone 13'] : {viewport:{width:1280,height:900}}),
      ...(out && process.env.ORTHO_VIDEO ? {recordVideo:{dir:out,size:touch?{width:390,height:664}:{width:1280,height:900}}} : {})
    });
    const p = await context.newPage(), errors = [];
    const client = touch ? await context.newCDPSession(p) : null;
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    p.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));
    p.on('response',r=>{if(r.status() >= 400)errors.push(r.url()+' '+r.status());});
    const grip = p.locator('#grip'), field = p.locator('#field'), step = p.locator('#step');
    const action = p.locator('#action'), progress = p.locator('#travel');
    const button = name => p.getByRole('button',{name,exact:true});
    const screenshot = async name => {if(out)await p.screenshot({path:join(out,(touch?'touch-':'')+name+'.png'),animations:'disabled'});};
    const settled = () => p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const click = async locator => {if(touch) await locator.tap(); else await locator.click(); await settled();};
    const waitStep = title => p.getByRole('heading',{name:title,exact:true}).waitFor();
    const now = () => Number(process.hrtime.bigint()) / 1e6;
    const loaded = now();
    await p.goto(url);
    await waitStep('Find the break');
    const ready = now();
    if (!report.renderer) report.renderer = await p.evaluate(() => {
      const gl=document.querySelector('#scene').getContext('webgl2');
      const info=gl.getExtension('WEBGL_debug_renderer_info');
      return gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    });
    if (!touch) {
      await click(button('Fluoro')); await click(button('Side'));
      assert.equal(await p.locator('#view-label').textContent(),'SIMULATED FLUOROSCOPY');
      await click(button('Front'));
    }
    await click(action);
    await waitStep('Line up the fragments');
    const firstInput = now();
    const initial = await p.locator('#metrics').innerText();
    if(!touch){
      await click(button('Fluoro'));
      await grip.waitFor({state:'hidden'});
      assert.equal(await p.locator('#view-label').textContent(),'SIMULATED FLUOROSCOPY');
      await click(button('Fluoro'));
      await grip.waitFor();
    }
    const drive = async (dx,dy,{finish=true,steps=12}={}) => {
      await grip.scrollIntoViewIfNeeded();
      const g=await grip.boundingBox(), f=await field.boundingBox();
      const close = (await step.textContent()) === 'Line up the fragments';
      const scale = Math.max(close?4.2:5.86,(close?4.7:2.88)/(f.width/f.height))/f.height;
      const x=g.x+g.width/2, y=g.y+g.height/2;
      if(close){
        const roll=-.15, c=Math.cos(roll), s=Math.sin(roll);
        [dx,dy]=[c*dx+s*dy,-s*dx+c*dy];
      }
      const send = (type,px,py)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:px===undefined?[]:[{x:px,y:py,id:1}]});
      if(touch)await send('touchStart',x,y);
      else {await p.mouse.move(x,y); await p.mouse.down();}
      for(let i=1;i<=steps;i++) {
        const px=x+dx*i/steps/scale,py=y+dy*i/steps/scale;
        if(touch) await send('touchMove',px,py);
        else await p.mouse.move(px,py);
      }
      if (finish) {
        if(touch)await send('touchEnd');
        else await p.mouse.up();
        await settled();
      }
      return async kind=>{
        if(touch)await send(kind || 'touchCancel');
        else await p.mouse.up();
      };
    };

    const stationary = await drive(0,0,{finish:false,steps:1});
    await p.locator('#grip-state[data-locked]').waitFor();
    assert.equal(await p.locator('#metrics').innerText(),initial);
    await screenshot('jaws-locked');
    await stationary(touch?'touchEnd':undefined);
    await p.getByText('Jaws open',{exact:true}).waitFor();
    assert.equal(await p.locator('#metrics').innerText(),initial);
    await screenshot('jaws-open');
    if (!touch) {
      await click(action);
      await p.getByRole('status').filter({hasText:'outside the game band'}).waitFor();
      const interrupted = await drive(.22,.12,{finish:false});
      await p.locator('#grip[data-active]').waitFor();
      await grip.dispatchEvent('pointercancel',{pointerId:1});
      await interrupted();
      await p.locator('#grip:not([data-active])').waitFor();
      assert.equal(await p.locator('#metrics').innerText(),initial);
      const viewSwitch = await drive(.12,.10,{finish:false});
      await button('Side').evaluate(element=>element.click());
      await viewSwitch();
      await click(button('Front'));
      assert.equal(await p.locator('#metrics').innerText(),initial);
    } else {
      const interrupted = await drive(.22,.12,{finish:false});
      await interrupted();
      await p.locator('#grip:not([data-active])').waitFor();
      assert.equal(await p.locator('#metrics').innerText(),initial);
      const rotated = await drive(.17,.13,{finish:false});
      await p.setViewportSize({width:844,height:390});
      await p.locator('#grip:not([data-active])').waitFor();
      await rotated();
      await p.setViewportSize({width:390,height:664});
      await settled();
      assert.equal(await p.locator('#metrics').innerText(),initial);
    }
    await screenshot('reduction');
    const measure = p.evaluate(() => new Promise(resolve => {
      const gaps=[];
      const start=performance.now();
      let prev;
      function tick(now) {
        if(prev!==undefined)gaps.push(now-prev);
        prev=now;
        if(now-start<1250)requestAnimationFrame(tick);
        else {
          const sorted=[...gaps].sort((a,b)=>a-b);
          resolve({frames:gaps.length,medianMs:sorted[Math.floor(sorted.length*.5)],
            p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1)});
        }
      }
      requestAnimationFrame(tick);
    }));
    const gain = axis => .65+.35*Math.min(1,Math.abs(baseline[axis])/.40);
    await drive(-baseline.x/gain('x'),(.055-baseline.gap)/.76,{steps:60});
    await click(button('Rotate'));
    await drive(-baseline.front/.48,baseline.twist/.51);
    await click(action);
    await p.getByRole('button',{name:'View checked ✓',exact:true}).waitFor();
    await click(button('Side'));
    const gripRect = await grip.boundingBox(), fieldRect = await field.boundingBox();
    assert(gripRect.x > fieldRect.x + 2 && gripRect.x + gripRect.width < fieldRect.x + fieldRect.width - 2,
      'Side-view grip follows the tool inside the field instead of sticking to a viewport edge');
    assert(await p.locator('#secondary[data-nudge]').evaluate(element =>
      parseFloat(getComputedStyle(element).fontSize) < parseFloat(getComputedStyle(document.querySelector('#action')).fontSize)
    ));
    await screenshot('side-displaced');
    if(!touch) {
      await click(action);
      await p.getByRole('status').filter({hasText:'outside the game band'}).waitFor();
    }
    await click(button('Move'));
    await drive(-baseline.z/gain('z'),0);
    await click(button('Rotate'));
    await drive(-baseline.side/.48,0);
    await screenshot('reduction-aligned');
    assert.match(await p.locator('#reduction-progress').textContent(),/Front ✓/);
    await click(action);
    await waitStep('Advance the nail');
    await drive(0,.85);
    assert(Number(await progress.getAttribute('value')) > .3);
    await drive(0,1.10);
    await waitStep('Match the locking target');
    await screenshot('cutaway');
    await drive(.36,-.30);
    await p.getByRole('status').filter({hasText:'Upper lock seated'}).waitFor();
    await drive(-.37,.29);
    await waitStep('Save the final images');
    await screenshot('final-image');
    await click(action); await click(button('Side')); await click(action);
    await waitStep('Cover the site');
    await click(action);
    await waitStep('Compare your result');
    assert.match(await p.locator('#notice').textContent(),/Alignment 60\/60 · Fixation 30\/30/);
    const sideImage = await p.locator('#after').getAttribute('src');
    await screenshot('comparison-side');
    await click(button('Front'));
    await p.waitForFunction(previous=>document.querySelector('#after').getAttribute('src')!==previous,sideImage);
    await screenshot('comparison');
    assert.equal(await p.locator('#secondary').textContent(),'Try harder setup');
    const elapsed = now();
    for(let replay=0;replay<3;replay++) {
      await click(replay ? p.locator('#restart') : action);
      await waitStep('Find the break');
      await click(action);
      assert.equal(await p.locator('#metrics').innerText(),initial);
      assert.equal(await p.locator('#seed').textContent(),'SETUP 431');
      assert.equal(await p.locator('canvas').count(),1);
    }
    if(!touch) {
      await field.focus();
      await p.keyboard.press('ArrowRight');
      await p.locator('#grip[data-active]').waitFor();
      await p.keyboard.press('Escape');
      await p.locator('#grip:not([data-active])').waitFor();
      assert.equal(await p.locator('#metrics').innerText(),initial);
      const backgrounded = await drive(.12,.14,{finish:false});
      await p.evaluate(() => {
        Object.defineProperty(document,'hidden',{value:true,configurable:true});
        document.dispatchEvent(new Event('visibilitychange'));
        delete document.hidden;
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await backgrounded();
      await p.locator('#grip:not([data-active])').waitFor();
      assert.equal(await p.locator('#metrics').innerText(),initial);
    }
    if(touch) {
      const nudge = p.getByRole('button',{name:/^Nudge /});
      for (const view of ['Front','Side']) {
        await click(button(view));
        for(let i=0; i<20 && await nudge.isVisible(); i++) await click(nudge);
        assert.equal(await p.locator('#metrics [data-good]').count(),4);
        await click(action);
      }
      await waitStep('Advance the nail');
    }
    assert.deepEqual(errors,[]);
    report.runs.push({input:touch?'CDP touch, iPhone 13 profile':'mouse and keyboard',loadMs:Math.round(ready-loaded),
      firstInputMs:Math.round(firstInput-ready),caseMs:Math.round(elapsed-firstInput),frameSample:await measure});
    const video = p.video();
    await context.close();
    if(video) {await video.saveAs(join(out,touch?'femur-touch.webm':'femur-case.webm')); await video.delete();}
    console.log('Completed',report.runs.at(-1));
  }
  for(const failure of ['missing module','missing anatomy','missing glove','WebGL disabled']) {
    const page=await browser.newPage();
    if(failure==='missing module')await page.route('**/scene.mjs',route=>route.abort());
    else if(failure==='missing anatomy')await page.route('**/femur.glb',route=>route.abort());
    else if(failure==='missing glove')await page.route('**/glove.glb',route=>route.abort());
    else await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args);};});
    await page.goto(url);
    await page.getByRole('button',{name:'Reload case'}).waitFor();
    assert.match(await page.locator('#loading').textContent(),/could not load/);
    await page.close();
  }
} finally {
  await browser.close();
}

const safari = await webkit.launch();
try {
  const page=await safari.newPage(devices['iPhone 13']);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.getByRole('button',{name:'Take the clamp'}).tap();
  await page.getByRole('button',{name:'Grab reduction clamp'}).waitFor();
  await page.getByRole('button',{name:'Side',exact:true}).tap();
  await page.locator('#side[aria-pressed=true]').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  report.webkit=safari.version();
} finally {
  await safari.close();
}
console.log(JSON.stringify(report,null,2));
