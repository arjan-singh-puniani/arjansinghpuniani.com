import assert from 'node:assert/strict';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const base = process.env.SEIZEFREEZE_BASE_URL || 'http://127.0.0.1:3212';
const output = new URL('../../Documentation/Validation/SeizeFreeze/', import.meta.url);
await mkdir(output, { recursive: true });
const results = [];
const engines = process.argv.includes('--smoke') ? [['chromium', chromium]] : [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]];
for (const [name, type] of engines) {
  const options = { headless: true };
  if (name === 'firefox') {
    try { await access(type.executablePath()); }
    catch { options.executablePath = `${homedir()}/Library/Caches/ms-playwright/firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox`; }
  }
  let browser;
  try { browser = await type.launch(options); }
  catch (e) { results.push({ engine: name, blocked: e.message }); continue; }
  const sizes = name === 'chromium' ? [[390,844],[768,1024],[1440,1000],[1920,1080]] : [[390,844],[1440,1000]];
  for (const [width,height] of sizes) {
    const context = await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    const page = await context.newPage(), errors=[], requests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)requests.push(`${r.status()} ${r.url()}`);});
    const start=Date.now();
    await page.goto(`${base}/seizefreeze-lab/index.html`);
    await page.waitForFunction(()=>window.seizefreeze?.snapshot().summary);
    const interactiveMs=Date.now()-start;
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'assembly overflow');
    await page.screenshot({path:fileURLToPath(new URL(`pass3-${name}-${width}-opening.png`,output))});
    await page.locator('#scene').screenshot({path:fileURLToPath(new URL(`pass3-${name}-${width}-device.png`,output))});
    const first=await page.evaluate(()=>window.seizefreeze.snapshot());
    assert.ok(first.stats,'WebGL should work in standard browser path');
    for(let j=0;j<7;j++) {
      await page.locator('#parts button').nth(j).click();
      await page.locator('#seat').click();
    }
    assert.equal((await page.evaluate(()=>window.seizefreeze.snapshot())).installed.length,7);
    const offset=await page.evaluate(()=>window.seizefreeze.snapshot().stats.componentOffsets);
    assert.ok(Object.values(offset).every(v=>v===0),'seated part stays seated');
    await page.locator('#explode').click();
    await page.locator('#head-view').click();
    await page.locator('#scene').screenshot({path:fileURLToPath(new URL(`pass3-${name}-${width}-scale.png`,output))});
    await page.locator('#overview').click();
    await page.locator('#rotate-left').focus(); await page.keyboard.press('Enter');
    await page.locator('#lab-tab').click();
    await page.evaluate(()=>window.seizefreeze.goTo(45));
    const frame=await page.evaluate(()=>window.seizefreeze.snapshot().frame);
    assert.equal(await page.locator('#surface-value').innerText(),`${frame.tissue[0].toFixed(2)} °C`);
    assert.equal(await page.locator('#hot-value').innerText(),`${frame.Th.toFixed(2)} °C`);
    assert.ok(Math.abs(frame.qh-frame.qc-frame.power)<1e-12);
    await page.locator('[data-depth=model]').click();
    assert.equal(await page.locator('.katex-mathml').count(),6,'accessible local equations');
    assert.equal(await page.locator('.katex-error').count(),0);
    await page.screenshot({path:fileURLToPath(new URL(`pass3-${name}-${width}-laboratory.png`,output)),fullPage:true});
    if(width===1440) {
      for(const scenario of ['baseline','disabled','event','delay','false','saturation','sensor','resistance','rejection','shutdown','repeated']) {
        await page.locator('#scenario').selectOption(scenario);
        await page.waitForFunction(s=>window.seizefreeze.snapshot().params?.scenario===s,scenario);
        await page.evaluate(()=>window.seizefreeze.goTo(60));
        const s=await page.evaluate(()=>window.seizefreeze.snapshot());
        assert.ok(s.summary.maxResidual<1e-8);
        if(scenario==='sensor'){assert.equal(s.frame.sensor,null);assert.equal(s.frame.current,0);}
        assert.equal(s.modelError,'');
      }
      await page.locator('#parameter-details summary').click();
      await page.locator('#initialTemperature').fill('35');
      await page.locator('#initialTemperature').dispatchEvent('change');
      await page.waitForFunction(()=>window.seizefreeze.snapshot().params?.initialTemperature===35);
      assert.match(await page.locator('#surface-value').innerText(),/35\.00/);
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'lab overflow');
    await page.locator('#static-view').click(); assert.equal(await page.locator('#poster').isVisible(),true);
    await page.evaluate(()=>window.seizefreeze.goTo(0));
    await page.locator('#static-view').click(); assert.equal(await page.locator('#poster').isVisible(),false);
    assert.deepEqual(errors,[]); assert.deepEqual(requests,[]);
    const stats=await page.evaluate(()=>window.seizefreeze.snapshot().stats);
    results.push({engine:name,version:browser.version(),width,height,interactiveMs,stats,errors,requests,emulation:'Desktop host viewport emulation; not physical-phone testing'});
    console.log(JSON.stringify({engine:name,width,height,interactiveMs,passed:true}));
    await context.close();
  }
  await browser.close();
}
await writeFile(new URL('browser-results.json',output),JSON.stringify({base,results},null,2));
assert.equal(results.filter(r=>r.blocked).length,0,'all browser engines must execute');
