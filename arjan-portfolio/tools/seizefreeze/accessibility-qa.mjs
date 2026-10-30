import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.SF_QA_URL || 'http://127.0.0.1:3211/seizefreeze-lab/index.html';
const output = new URL('../../Documentation/Validation/SeizeFreeze/accessibility-results.json', import.meta.url);
const report = { timestamp: new Date().toISOString(), base, scope: 'Chromium bounded accessibility and failure review; phone viewport emulation, not a physical phone; no claim of manual screen-reader certification', cases: [], issues: [] };
const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal'] });
const ready = page => page.waitForFunction(() => window.seizefreeze, { timeout: 30000 });
const snapshot = page => page.evaluate(() => window.seizefreeze.snapshot());
const axe = async page => {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
  return { violations: result.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), incompleteRules: result.incomplete.map(v => ({ id: v.id, nodes: v.nodes.length, sample:v.nodes.slice(0,8).map(n=>({target:n.target,reason:n.failureSummary})) })), passes: result.passes.length };
};
try {
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['phone-emulation', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(base); await ready(page);
    await page.waitForFunction(() => Boolean(window.seizefreeze.snapshot().summary));
    const start = await snapshot(page);
    await page.waitForTimeout(700);
    const idle = await snapshot(page);
    const assemblyAxe = await axe(page);
    await page.locator('#parts button').nth(2).focus(); await page.keyboard.press('Enter');
    const keyboardPartSelected = (await snapshot(page)).selected === 'tec';
    await page.locator('#seat').focus(); await page.keyboard.press('Space');
    const keyboardSeatWorked = (await snapshot(page)).installed.includes('tec');
    await page.locator('#lab-tab').focus(); await page.keyboard.press('Enter');
    const keyboardChapterWorked = (await snapshot(page)).chapter === 'lab';
    await page.locator('#timeline').focus(); await page.keyboard.press('ArrowRight');
    const keyboardScrubWorked = (await snapshot(page)).index > 0;
    const timelineLabel = await page.locator('#timeline').evaluate(el => [...el.labels].map(l => l.textContent).join(' '));
    await page.evaluate(()=>{window.sfLiveMutations=0;window.sfLiveObserver=new MutationObserver(records=>window.sfLiveMutations+=records.length);window.sfLiveObserver.observe(document.getElementById('teaching'),{childList:true,subtree:true});});
    await page.locator('#play').click();await page.waitForTimeout(600);await page.locator('#play').click();
    const repeatedLiveMutations=await page.evaluate(()=>{window.sfLiveObserver.disconnect();return window.sfLiveMutations;});
    await page.locator('[data-depth=model]').click();
    const labAxe = await axe(page);
    await page.locator('#static-view').focus(); await page.keyboard.press('Enter');
    const staticKeyboardWorked = (await snapshot(page)).staticView && await page.locator('#poster').isVisible();
    const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    const focusStyle = await page.locator('#static-view').evaluate(el => ({ outline: getComputedStyle(el).outlineStyle, outlineWidth: getComputedStyle(el).outlineWidth }));
    const controls = await page.locator('button:visible,summary:visible,select:visible,input:visible').evaluateAll(elements => elements.map(el => { const r=el.getBoundingClientRect(); return { id: el.id, label: (el.getAttribute('aria-label') || el.textContent || el.id).trim().slice(0,70), width:r.width, height:r.height }; }));
    report.cases.push({ name, viewport, reducedMotion: true, noAutoplay: !start.playing && !idle.playing, idleRenderFrames: { start:start.stats?.frames, end:idle.stats?.frames }, keyboardPartSelected, keyboardSeatWorked, keyboardChapterWorked, keyboardScrubWorked, timelineLabel, repeatedLiveMutations, staticKeyboardWorked, focusStyle, overflow, smallTargets:controls.filter(c=>c.width<24 || c.height<24), assemblyAxe, labAxe });
    if(repeatedLiveMutations>2)report.issues.push({case:name,issue:'Repeated mutations of an unchanged aria-live teaching message during early playback',observedMutations:repeatedLiveMutations});
    for(const [view,scan] of [['assembly',assemblyAxe],['lab',labAxe]])for(const rule of scan.incompleteRules)if(rule.id==='aria-prohibited-attr')report.issues.push({case:name,view,issue:'Labeled generic container requires semantic role',targets:rule.sample.map(n=>n.target)});
    await context.close();
  }
  const fallbackContext = await browser.newContext({ viewport:{width:1280,height:900} });
  await fallbackContext.addInitScript(() => { const original=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(type,...args){if(String(type).includes('webgl'))return null;return original.call(this,type,...args);}; });
  const fallbackPage = await fallbackContext.newPage();
  await fallbackPage.goto(base); await ready(fallbackPage);
  await fallbackPage.waitForFunction(()=>Boolean(window.seizefreeze.snapshot().summary));
  await fallbackPage.locator('#parts button').nth(4).click();
  await fallbackPage.locator('#lab-tab').click();
  await fallbackPage.locator('#timeline').fill('30');
  const fallback = await snapshot(fallbackPage);
  report.cases.push({name:'WebGL-unavailable',staticView:fallback.staticView,posterVisible:await fallbackPage.locator('#poster').isVisible(),componentSelection:fallback.selected,solverAvailable:Boolean(fallback.summary),scrubTime:fallback.frame?.t,sceneError:fallback.sceneError,caption:await fallbackPage.locator('#scene-caption').textContent()});
  await fallbackContext.close();
  const workerContext=await browser.newContext();const workerPage=await workerContext.newPage();
  await workerPage.route('**/worker.js', route=>route.abort('failed'));
  await workerPage.goto(base);await ready(workerPage);await workerPage.waitForFunction(()=>Boolean(window.seizefreeze.snapshot().modelError));
  const failure=await snapshot(workerPage);
  report.cases.push({name:'worker-load-failure',modelError:failure.modelError,status:await workerPage.locator('#model-status').textContent(),noResult:!failure.frame,playDisabled:await workerPage.locator('#play').isDisabled(),timelineDisabled:await workerPage.locator('#timeline').isDisabled(),componentExplorerAvailable:await workerPage.locator('#component-detail').isVisible(),teaching:await workerPage.locator('#teaching').textContent()});
  await workerContext.close();
} catch(error) {report.error=error.stack;}
finally {await browser.close();await mkdir(new URL('.',output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');}
for(const c of report.cases){
  console.log(JSON.stringify({name:c.name,assemblyViolations:c.assemblyAxe?.violations.length,labViolations:c.labAxe?.violations.length,keyboard:c.keyboardScrubWorked,static:c.staticView??c.staticKeyboardWorked,failure:c.modelError,smallTargets:c.smallTargets?.length}));
}
if(report.error){console.error(report.error);process.exitCode=1;}
