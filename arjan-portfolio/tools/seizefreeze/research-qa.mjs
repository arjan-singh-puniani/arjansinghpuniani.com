import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { homedir } from 'node:os';
const base = process.env.SEIZEFREEZE_BASE_URL || 'http://127.0.0.1:3219', engine = process.env.SEIZEFREEZE_ENGINE || 'chromium';
const output = new URL('../../Documentation/Validation/SeizeFreeze/research-2/', import.meta.url); await mkdir(output, { recursive: true });
const type = { chromium, firefox, webkit }[engine]; assert.ok(type);
const launch = { headless: true, ...(engine === 'chromium' ? { channel: 'chromium', args: ['--use-angle=metal'] } : {}) };
if (engine === 'firefox') { try { await access(type.executablePath()); } catch { launch.executablePath = homedir() + '/Library/Caches/ms-playwright/firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox'; } }
const browser = await type.launch(launch), results = [];
try {
  for (const [width, height] of engine === 'chromium' ? [[1440, 1000], [768, 1024], [390, 844], [320, 900]] : [[1440, 1000], [390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' }), page = await context.newPage(), errors = [], failed = [];
    page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) failed.push(r.url()); });
    await page.goto(base + '/seizefreeze-lab/research.html');
    await page.waitForFunction(() => window.seizefreezeResearch?.snapshot().summary && !window.seizefreezeResearch.snapshot().pending);
    const snapshot = () => page.evaluate(() => window.seizefreezeResearch.snapshot());
    assert.equal((await snapshot()).modelError, ''); assert.equal((await snapshot()).staticView, false);
    const capture = name => page.screenshot({ path: new URL(`${engine}-${width}-${name}.png`, output).pathname, fullPage: false });
    await capture('experiment');
    const stageHeight = await page.locator('#research-scene').evaluate(n => n.clientHeight);
    await page.locator('#component-disclosure').evaluate(n => { n.open = true; });
    await page.getByRole('button', { name: 'Medium', exact: true }).click(); assert.equal((await snapshot()).selected, 'medium');
    assert.equal(await page.locator('#research-scene').evaluate(n => n.clientHeight), stageHeight, 'Disclosures must not resize the 3D stage.');
    await page.locator('#component-disclosure').evaluate(n => { n.open = false; });
    await page.locator('#stage-timeline').fill('35'); await page.locator('#stage-timeline').dispatchEvent('input'); assert.equal(await page.locator('#stage-clock').innerText(), '35.00 s'); assert.equal(await page.locator('#research-clock').innerText(), '35.00 s');
    let s = await snapshot(); assert.ok(s.frame.current > 0); assert.ok(Math.abs(s.frame.qh - s.frame.qc - s.frame.power) < 1e-12);
    assert.match(await page.locator('#research-voltage-value').innerText(), /V$/);
    assert.deepEqual(s.scene.shellTemperatures, s.frame.tissue); assert.equal(s.scene.radiusMm, s.inputs.radiusMm);
    await page.locator('#section-view').click(); assert.equal((await snapshot()).scene.section, true); await capture('section');
    await page.locator('#research-scene canvas').focus(); const before = (await snapshot()).scene.cameraPosition;
    await page.keyboard.press('ArrowRight'); assert.notDeepEqual((await snapshot()).scene.cameraPosition, before);
    await page.keyboard.press('Enter'); assert.equal((await snapshot()).selected, 'tissue');
    const priorPath = await page.locator('#research-voltage path').first().getAttribute('d'); await page.locator('#signal-channel').selectOption({ value: '1' });
    assert.ok(await page.locator('#research-voltage path').first().getAttribute('d') !== priorPath, 'Selecting another channel changes the actual synthetic voltage trace.');
    await page.locator('#compare-sham').click(); await page.waitForFunction(() => window.seizefreezeResearch.snapshot().comparison && !window.seizefreezeResearch.snapshot().pending);
    assert.equal((await snapshot()).comparison.electricalEnergy, 0); assert.equal(await page.locator('#comparison-table tr').count(), 2);
    await page.evaluate(() => window.seizefreezeResearch.goTo(35)); const replayFrame = (await snapshot()).frame;
    if (width === 1440) {
      await page.locator('.experiment-plan').evaluate(node => { node.open = true; });
      const planBefore = await page.evaluate(() => window.seizefreezeResearch.record().plan); await page.locator('#hypothesis').fill('An edit made after the completed calculation'); assert.deepEqual(await page.evaluate(() => window.seizefreezeResearch.record().plan), planBefore); assert.equal(planBefore.capturedBeforeComputation, true); assert.equal(planBefore.externalPreregistration, false); await page.locator('#hypothesis').fill(planBefore.hypothesis);
      const summaryEvent = page.waitForEvent('download'); await page.locator('#export-summary').click(); const summaryDownload = await summaryEvent; assert.match(await readFile(await summaryDownload.path(), 'utf8'), /SYNTHETIC COMPUTATIONAL EXPERIMENT/);
      const downloadEvent = page.waitForEvent('download'); await page.locator('#export-json').click(); const download = await downloadEvent;
      const path = await download.path(), record = JSON.parse(await readFile(path, 'utf8'));
      assert.equal(record.recordType, 'SEIZEFREEZE_SYNTHETIC_COMPUTATIONAL_EXPERIMENT'); assert.equal(record.model.signals.sampleRateHz, 500);
      assert.equal(record.model.params.inputs.seed, 20261102); assert.ok(record.model.summary.maxResidual < 1e-8);
      await page.locator('#research-assumptions').evaluate(n => { n.open = true; });
      await page.locator('#research-seed').fill('12'); await page.locator('#run-experiment').click(); await page.waitForFunction(() => window.seizefreezeResearch.snapshot().inputs?.seed === 12 && !window.seizefreezeResearch.snapshot().pending);
      await page.locator('#import-record').setInputFiles(path); await page.waitForFunction(() => window.seizefreezeResearch.snapshot().inputs?.seed === 20261102 && !window.seizefreezeResearch.snapshot().pending);
      await page.evaluate(() => window.seizefreezeResearch.goTo(35)); assert.deepEqual((await snapshot()).frame, replayFrame);
      const csvEvent = page.waitForEvent('download'); await page.locator('#export-csv').click(); const csv = await csvEvent, rows = (await readFile(await csv.path(), 'utf8')).split('\n');
      assert.equal(rows.length, 2402); assert.match(rows[1], /^SYNTHETIC_COMPUTATIONAL,/);
      for (const row of rows.slice(1).filter((_, i) => i % 37 === 0)) { const values = row.split(',').map(Number); assert.ok(Math.abs(values[14] - values[12] - values[13]) < 1e-12); }
      await page.locator('#import-record').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"recordType":"measured"}') });
      await page.waitForFunction(() => document.getElementById('export-status').textContent.includes('Record rejected'));
      for (const condition of ['baseline', 'sham', 'perturbation', 'recovery', 'repeated', 'sensor', 'rejection', 'contact']) {
        await page.locator('#research-condition').selectOption(condition); await page.waitForFunction(c => window.seizefreezeResearch.snapshot().inputs?.condition === c && !window.seizefreezeResearch.snapshot().pending, condition);
        await page.evaluate(() => window.seizefreezeResearch.goTo(35)); s = await snapshot(); assert.ok(s.summary.maxResidual < 1e-8);
        if (['baseline', 'sham', 'recovery', 'sensor'].includes(condition)) assert.equal(s.frame.current, 0);
        if (condition === 'sensor') assert.equal(s.frame.sensor, null);
      }
      await page.locator('#comparison-control').selectOption('perturbation'); await page.locator('#compare-sham').click(); await page.waitForFunction(() => window.seizefreezeResearch.snapshot().comparison?.electricalEnergy > 0 && !window.seizefreezeResearch.snapshot().pending);
      assert.notEqual((await snapshot()).summary.electricalEnergy, (await snapshot()).comparison.electricalEnergy, 'Contact resistance changes energy versus the active reference.');
      await page.locator('#research-radiusMm').fill('3'); await page.locator('#run-experiment').click(); await page.waitForFunction(() => window.seizefreezeResearch.snapshot().inputs?.radiusMm === 3 && !window.seizefreezeResearch.snapshot().pending);
      assert.equal((await snapshot()).scene.radiusMm, 3);
      const short = { recordType: record.recordType, schemaVersion: 1, model: { modelId: record.model.modelId, version: record.model.version, params: { inputs: { ...record.model.params.inputs, duration: 1.013 } } } };
      await page.locator('#import-record').setInputFiles({ name: 'short-synthetic.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(short)) });
      await page.waitForFunction(() => window.seizefreezeResearch.snapshot().inputs?.duration === 1.013 && !window.seizefreezeResearch.snapshot().pending);
      await page.evaluate(() => window.seizefreezeResearch.goTo(1.013)); assert.equal((await snapshot()).frame.t, 1.013);
      assert.match(await page.locator('#raster-duration').innerText(), /1.013/);

    }
    const scans = [];
    const scan = async () => { const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); scans.push(report.violations); assert.deepEqual(report.violations, []); };
    await scan(); await page.locator('[data-mode=prototype]').click(); assert.equal((await snapshot()).scene.mode, 'prototype');
    assert.match(await page.locator('#prototype-panel').innerText(), /User-reported/); await capture('prototype'); await scan();
    await page.locator('[data-mode=summary]').click(); assert.equal(await page.locator('#summary-panel').isVisible(), true); await capture('summary'); await scan();
    await page.locator('[data-mode=organoid]').click();
    const memoryBefore = (await snapshot()).scene.memory.geometries;
    for (let i = 0; i < 4; i++) { await page.locator('[data-mode=prototype]').click(); await page.locator('[data-mode=organoid]').click(); }
    assert.equal((await snapshot()).scene.memory.geometries, memoryBefore);
    await page.waitForTimeout(150); const frames = (await snapshot()).scene.renderCount; await page.waitForTimeout(350); assert.equal((await snapshot()).scene.renderCount, frames);
    await page.locator('#static-research').click(); assert.equal(await page.locator('#research-poster').isVisible(), true);
    await page.locator('#static-research').click(); assert.equal(await page.locator('#research-poster').isVisible(), false);
    if (engine === 'chromium' && width === 1440) {
      const timeBeforeLoss = (await snapshot()).frame.t;
      await page.locator('#research-scene canvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
      await page.waitForFunction(() => window.seizefreezeResearch.snapshot().staticView);
      await page.locator('#static-research').click();
      await page.waitForFunction(() => !window.seizefreezeResearch.snapshot().staticView && !window.seizefreezeResearch.snapshot().scene.contextLost);
      assert.equal(await page.locator('#research-scene canvas').count(), 1);
      assert.equal((await snapshot()).frame.t, timeBeforeLoss);
      assert.equal((await snapshot()).scene.section, true);
    }

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    results.push({ width, height, scans: scans.length, axeViolations: 0, reducedMotionIdleFrames: 0, physicalPhoneTest: false, scene: (await snapshot()).scene, errors, failed }); await context.close();
  }
  if (engine === 'chromium') {
    for (const fault of ['webgl', 'worker']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      if (fault === 'webgl') await context.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return String(type).startsWith('webgl') ? null : original.call(this, type, ...args); }; });
      else await context.route('**/research-worker.js', route => route.abort());
      const page = await context.newPage(); await page.goto(base + '/seizefreeze-lab/research.html');
      if (fault === 'webgl') { await page.waitForFunction(() => window.seizefreezeResearch?.snapshot().staticView && window.seizefreezeResearch.snapshot().summary); assert.equal(await page.locator('#research-poster').isVisible(), true); }
      else { await page.waitForFunction(() => window.seizefreezeResearch?.snapshot().modelError); assert.equal(await page.locator('#export-json').isDisabled(), true); }
      results.push({ fault, passed: true }); await context.close();
    }
  }
} finally { await browser.close(); }
await writeFile(new URL(`${engine}-results.json`, output), JSON.stringify({ base, engine, version: browser.version(), passed: true, results }, null, 2));
console.log(JSON.stringify({ passed: true, engine, cases: results.length }));
