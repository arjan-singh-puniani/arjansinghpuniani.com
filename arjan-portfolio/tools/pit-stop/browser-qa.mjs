import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base=process.env.PIT_STOP_URL||'http://127.0.0.1:4173';
const output=process.env.PIT_STOP_EVIDENCE||'/tmp/pit-stop-evidence';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PIT_CHROME_METAL==='1'?{channel:'chrome',args:['--use-angle=metal','--enable-gpu']}:{})});
const report={checks:[],errors:[],screenshots:[],performance:{}};
const check=(name,pass)=>{assert.ok(pass,name);report.checks.push(name);};
async function shot(page,name){await page.screenshot({path:`${output}/${name}.png`});report.screenshots.push(name);}
async function seek(page,time){await page.locator('#timeline').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},time);}
const state=page=>page.evaluate(()=>window.__PIT_LAB_STATE__);
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',response=>{if(response.status()>=400)report.errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(`${base}/pit-stop-lab/index.html`);await page.waitForFunction(()=>window.__SIM_READY__);await page.locator('button[data-experience=engineer]').click();await page.locator('[data-scene-camera=overview]').click();await page.waitForTimeout(900);
  check('WebGL world renders',Boolean((await state(page)).render));
  await shot(page,'01-miniature-overview');
  check('Operational KPI values come from the simulation',(await page.locator('#opsSecured').innerText())===`${(await state(page)).operations.secured} / 4`);
  check('Spatial facility and station controls exist',await page.locator('[data-spatial]').count()===7);
  await page.locator('[data-spatial=tires]').click();check('Tire preparation asset opens a model-derived inspector',(await page.locator('#assetTitle').innerText()).includes('Tire preparation'));
  check('Allocated inventory is shown',await page.locator('#assetMetrics').innerText().then(text=>text.includes('Allocated replacements')));
  await page.locator('[data-scene-camera=box]').click();await page.waitForFunction(()=>window.__PIT_LAB_STATE__.render.camera==='box');
  await seek(page,2.8);await shot(page,'13-detailed-pit-box');
  await page.selectOption('#lighting','night');await page.waitForFunction(()=>window.__PIT_LAB_STATE__.render.lighting==='night');await shot(page,'14-night-session');
  await page.locator('#roof').check();await page.waitForFunction(()=>window.__PIT_LAB_STATE__.render.roof);check('Roof section changes actual world geometry',(await state(page)).render.roof);await shot(page,'15-roof-section');await page.locator('#roof').uncheck();
  await page.selectOption('#lighting','golden');await page.waitForFunction(()=>window.__PIT_LAB_STATE__.render.lighting==='golden');check('All three lighting presets execute',report.errors.length===0);await page.selectOption('#lighting','day');
  await page.locator('[data-scene-camera=facility]').click();await page.waitForFunction(()=>window.__PIT_LAB_STATE__.render.camera==='facility');await page.waitForTimeout(700);await shot(page,'16-full-complex');
  await page.locator('[data-mode=world]').click();await page.locator('#resetBtn').click();

  await page.selectOption('#speed','.25');
  await page.locator('#playBtn').click();await page.waitForTimeout(350);await page.locator('#playBtn').click();const paused=(await state(page)).time;await page.waitForTimeout(250);check('Pause freezes authoritative time',(await state(page)).time===paused);
  await page.locator('#playBtn').click();await page.waitForFunction(previous=>window.__PIT_LAB_STATE__.time>previous,paused,{timeout:15000});await page.locator('#playBtn').click();check('Resume advances time',(await state(page)).time>paused);await page.selectOption('#speed','1');
  await page.locator('#resetBtn').click();check('Reset reconstructs time zero',(await state(page)).time===0);
  await page.locator('#stepFwdBtn').click();check('Step forward is 0.05 seconds',Math.abs((await state(page)).time-.05)<1e-9);await page.locator('#stepBackBtn').click();check('Step backward reconstructs state',(await state(page)).time===0);
  await seek(page,2.8);const sought=(await state(page)).snapshot;await seek(page,4);await seek(page,2.8);check('Backward seeking reproduces full snapshot',JSON.stringify((await state(page)).snapshot)===JSON.stringify(sought));
  await shot(page,'02-four-corner-service');
  await page.locator('[data-mode=mechanics]').click();await page.waitForTimeout(750);await page.locator('#cutaway').check();await page.locator('#exploded').check();await page.selectOption('#corner','RR');await page.waitForTimeout(750);await shot(page,'03-mechanical-inspection');check('Mechanical corner and cutaway are interactive',(await state(page)).corner==='RR');
  for(const camera of ['hero','gun','hub','brake','top','wide']){await page.locator(`[data-detail-camera=${camera}]`).click();await page.waitForTimeout(60);}
  await page.locator('[data-mode=world]').click();for(const camera of ['overview','follow','FL','FR','RL','RR','top','release','cutaway']){await page.selectOption('#camera',camera);await page.waitForTimeout(80);}
  check('All camera presets execute',report.errors.length===0);
  await page.locator('[data-mode=world]').click();await page.locator('#controlsBtn').click();
  const baseline=(await state(page)).result.stationary;
  await page.locator('[data-parameter=rrDelay]').evaluate(el=>{el.value='1.4';el.dispatchEvent(new Event('input',{bubbles:true}));});
  check('A timing parameter changes the numerical result',(await state(page)).result.stationary>baseline+1);
  await seek(page,3);check('Parameter changes observed RR animation state',(await state(page)).snapshot.cars[0].corners.RR.state==='REPLACEMENT_ALIGNMENT');
  await page.locator('[data-close=controls]').click();await page.locator('#restoreDefaults').evaluate(el=>el.click());
  for(const scenario of ['coordinated','gun','alignment','position','traffic','stack','unsecured']){
    await page.selectOption('#scenario',scenario);await seek(page,Number(await page.locator('#timeline').getAttribute('max')));const value=await state(page);
    check(`Scenario ${scenario} loads and seeks to completion`,value.configuration.scenario===scenario&&Number.isFinite(value.time));
    if(scenario==='unsecured'){check('Unsecured wheel never releases',value.result.stationary===null&&!value.snapshot.cars[0].released);await shot(page,'04-safety-hold');}
    if(scenario==='stack'){check('Second car has its own service and queue',value.snapshot.cars.length===2&&value.result.queueWait>0);check('Second car appears on the facility map',!await page.locator('#mapSecond').evaluate(el=>el.hasAttribute('hidden')));check('Double-stack inventory tracks both sets',value.operations.inventory.fitted===8&&value.operations.inventory.removed===8);}
  }
  await page.selectOption('#scenario','gun');await page.locator('[data-mode=timing]').click();
  await page.locator('#event-car1-FR-LOOSENING').click();check('Event selection seeks and selects its corner',(await state(page)).corner==='FR');
  await shot(page,'05-critical-path');
  await page.locator('[data-analysis=telemetry]').click();await shot(page,'06-telemetry');check('Telemetry cursor is synchronized',Math.abs(Number(await page.locator('#plotCursor').getAttribute('x1'))-(40+930*(await state(page)).time/Number(await page.locator('#timeline').getAttribute('max'))))<.001);
  await page.locator('[data-analysis=experiments]').click();await page.selectOption('#sensitivityParam','confirmation');check('Sensitivity comparison uses actual model',(await page.locator('#sensitivityResult').innerText()).includes('Δ +0.100'));
  await page.locator('#pinBtn').click();await page.selectOption('#scenario','alignment');
  await seek(page,5.2);await page.waitForFunction(()=>window.__PIT_LAB_STATE__.render.reference?.visible);check('Pinned run renders a reference ghost',(await state(page)).render.reference.visible);await shot(page,'17-reference-ghost');
  await page.locator('#ghost').uncheck();await page.waitForFunction(()=>window.__PIT_LAB_STATE__.render.reference?.visible===false);check('Reference ghost can be hidden without changing the model',(await state(page)).configuration.scenario==='alignment');await page.locator('#ghost').check();
check('Scenario comparison retains pinned result',(await page.locator('#comparison').innerText()).includes('Pinned Slow wheel gun'));
  await page.locator('#monteBtn').click();await page.waitForFunction(()=>document.querySelector('#monteResult').textContent.includes('1000 runs'),null,{timeout:60000});check('Bounded Monte Carlo completes and charts distribution',await page.locator('#histogram rect').count()===24);
  const downloadPromise=page.waitForEvent('download');await page.locator('#exportBtn').click();const download=await downloadPromise;await download.saveAs(`${output}/scenario.json`);const exported=JSON.parse(await fs.readFile(`${output}/scenario.json`,'utf8'));check('JSON export contains computed events and telemetry',exported.events.length>50&&exported.telemetry.length===301);
  await page.locator('[data-mode=strategy]').click();check('Three race strategies are computed',await page.locator('.strategy-row').count()===3);const before=await page.locator('#strategyResults').innerText();await page.selectOption('#compound','soft');check('Compound changes race prediction',await page.locator('#strategyResults').innerText()!==before);await shot(page,'07-strategy');
  await page.locator('#hideBtn').click();check('Overlays can be hidden',await page.locator('body').evaluate(el=>el.classList.contains('hide-ui')));await page.locator('#hideBtn').click();
  await page.locator('#fullscreenBtn').click();await page.waitForFunction(()=>Boolean(document.fullscreenElement),null,{timeout:5000});check('Full-screen presentation works',await page.evaluate(()=>Boolean(document.fullscreenElement)));await page.evaluate(()=>document.exitFullscreen());
  await page.locator('[data-mode=world]').click();await page.locator('#analysisBtn').evaluate(el=>{if(el.getAttribute('aria-expanded')==='true')el.click();});
  await page.selectOption('#scenario','coordinated');await seek(page,2.8);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await page.locator('#cameraReset').click();await page.waitForTimeout(750);await shot(page,'08-mobile-world');check('Mobile transport stays in the top bar',await page.locator('#playBtn').evaluate(el=>el.getBoundingClientRect().top>=0&&el.getBoundingClientRect().bottom<=105));
  check('Mobile has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  await page.locator('#controlsBtn').click();check('Mobile controls drawer opens',await page.locator('#controls').isVisible());await page.locator('[data-close=controls]').click();await page.locator('#inspectorBtn').click();check('Mobile inspector is reachable',await page.locator('#inspector').isVisible());await shot(page,'09-mobile-inspector');await page.locator('[data-close=inspector]').click();
  await page.locator('[data-mode=mechanics]').click();check('Mobile exposes cutaway controls',await page.locator('#cutaway').isVisible());await shot(page,'10-mobile-mechanics');
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-mode=world]').click();await page.locator('#resetBtn').click();await page.locator('#playBtn').click();await page.waitForTimeout(1500);report.performance=await page.evaluate(()=>({stats:window.__PIT_LAB_STATE__.render,display:document.querySelector('#renderStats').textContent,renderer:(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl?.getParameter(7937);})()}));await page.locator('#playBtn').click();
  const memory=(await state(page)).render;for(let i=0;i<10;i++)await seek(page,2+i*.1);const afterMemory=(await state(page)).render;check('Repeated seeks do not allocate GPU geometry',memory.geometries===afterMemory.geometries&&memory.textures===afterMemory.textures);
  const fallback=await browser.newPage({viewport:{width:1000,height:800}});await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args);};});
  await fallback.goto(`${base}/pit-stop-lab/index.html`);await fallback.waitForFunction(()=>window.__SIM_READY__);check('WebGL-unavailable fallback retains working analysis',await fallback.locator('#fallback').isVisible()&&await fallback.locator('.event').count()>50);await fallback.locator('#stepFwdBtn').click();check('Fallback timing controls work',(await state(fallback)).time===.05);await shot(fallback,'11-2d-fallback');await fallback.close();
  const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(`${base}/pit-stop-lab/index.html?play=1`);await reduced.waitForFunction(()=>window.__SIM_READY__);check('Reduced motion prevents autoplay',!(await state(reduced)).playing);await reduced.close();
  const embedded=await browser.newPage({viewport:{width:1440,height:1000}});embedded.on('pageerror',e=>report.errors.push(e.message));
  const response=await embedded.goto(`${process.env.PIT_STOP_PORTFOLIO_URL||'http://127.0.0.1:4174'}/playground/pit-stop`);
  check('Existing portfolio route responds',response.status()===200);await embedded.locator('iframe').scrollIntoViewIfNeeded();const frame=embedded.frames().find(f=>f.url().includes('/pit-stop-lab/'));
  await frame.waitForFunction(()=>window.__SIM_READY__);check('Embedded lab renders through the production route',Boolean(await frame.evaluate(()=>window.__PIT_LAB_STATE__.render)));
  check('Canonical metadata is preserved',await embedded.locator('link[rel=canonical]').getAttribute('href')==='https://arjansinghpuniani.com/playground/pit-stop');
  await shot(embedded,'12-portfolio-embed');await embedded.close();
  check('No uncaught errors or missing resources',report.errors.length===0);
} finally {
  await fs.writeFile(`${output}/report.json`,JSON.stringify(report,null,2));await browser.close();
  console.log(JSON.stringify(report,null,2));
}
