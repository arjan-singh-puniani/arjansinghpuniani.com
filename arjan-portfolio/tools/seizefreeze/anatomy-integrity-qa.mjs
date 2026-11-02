import assert from 'node:assert/strict';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.SEIZEFREEZE_BASE_URL || 'http://127.0.0.1:3219';
const engine = process.env.SEIZEFREEZE_ENGINE || 'chromium', type = { chromium, firefox, webkit }[engine];
assert.ok(type);
const output = new URL('../../Documentation/Validation/SeizeFreeze/', import.meta.url);
await mkdir(output, { recursive: true });
const options = { headless: true, ...(engine === 'chromium' ? { channel: 'chromium', args: ['--use-angle=metal'] } : {}) };
if (engine === 'firefox') {
  try { await access(type.executablePath()); } catch { options.executablePath = homedir() + '/Library/Caches/ms-playwright/firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox'; }
}
const browser = await type.launch(options), results = [];
try {
  for (const [width, height] of [[1440, 1000], [768, 1024], [390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' }), page = await context.newPage();
    const errors = [], failed = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) failed.push(r.url()); });
    await page.goto(base + '/seizefreeze-lab/index.html');
    await page.waitForFunction(() => window.seizefreeze?.snapshot().stats?.frames > 0);
    const snapshot = () => page.evaluate(() => window.seizefreeze.snapshot());
    const initial = await snapshot(), poses = [];
    assert.equal(initial.stats.anatomy.sourceCorticalParcels, 104);
    assert.deepEqual(initial.stats.target, [-63.61758041381836, -1.8063535690307617, 10.481131553649902]);
    assert.ok(initial.stats.device.rigidClearanceMm >= .3 - 1e-8);
    const capture = async name => {
      await page.locator('#scene').scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
      await page.screenshot({ path: new URL(`integrity-${engine}-${width}-${name}.png`, output).pathname });
    };
    await capture('opening');
    for (let view = 0; view < 4; view++) {
      if (view) {
        await page.locator('#scene canvas').focus();
        for (let step = 0; step < 10; step++) await page.keyboard.press('ArrowRight');
      }
      await capture(`orbit-${view}`);
      const state = await snapshot();
      assert.deepEqual(state.stats.target, initial.stats.target);
      const labeled = /LEFT (STG|SUPERIOR TEMPORAL)/.test(await page.locator('[data-sf-label]').innerText());
      assert.equal(labeled, state.stats.targetFacingCamera, 'The left-target callout must hide when facing away.');
      poses.push({ camera: state.stats.cameraPosition, target: state.stats.cameraTarget, targetFacingCamera: state.stats.targetFacingCamera, labeled });
    }
    assert.equal(new Set(poses.map(p => p.targetFacingCamera)).size, 2, 'Orbit must inspect both target-facing and opposite sides.');
    await page.locator('#overview').click();
    await page.locator('#peel-action').click();
    for (const value of [0, .44, .64, .84, 1]) {
      await page.locator('#peel').fill(String(value));
      await page.locator('#peel').dispatchEvent('input');
      assert.equal((await snapshot()).stats.peel, value);
      if (value === .44 || value === 1) await capture(`peel-${value}`);
    }
    await page.locator('#overview').click();
    const scans = [];
    scans.push((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#assembly-tab').click();
    await page.locator('#parts button').first().click(); await page.locator('#focus-component').click();
    assert.equal((await snapshot()).stats.focus, 'interface'); await capture('contact');
    await page.locator('#lab-tab').click(); await page.evaluate(() => window.seizefreeze.goTo(45));
    const thermal = await snapshot();
    assert.ok(thermal.frame.current > 0); assert.ok(Math.abs(thermal.frame.qh - thermal.frame.qc - thermal.frame.power) < 1e-12);
    await capture('lab');
    scans.push((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations);
    assert.ok(scans.every(s => s.length === 0)); assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    await page.waitForTimeout(300); const frames = (await snapshot()).stats.frames;
    await page.waitForTimeout(500); assert.equal((await snapshot()).stats.frames, frames);
    results.push({ width, height, poses, corticalParcels: 104, targetUnchanged: true, sourceTriangleClearanceMm: initial.stats.device.rigidClearanceMm,
      axeViolations: 0, reducedMotionIdleFrames: 0, errors, failed, adapter: initial.stats.adapter, physicalPhoneTest: false });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(new URL(`integrity-${engine}-results.json`, output), JSON.stringify({ base, engine, passed: true, results }, null, 2));
console.log(JSON.stringify({ passed: true, engine, widths: results.map(r => r.width) }));
