import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.SEIZEFREEZE_BASE_URL || 'http://127.0.0.1:3212';
const output = new URL('../../Documentation/Validation/SeizeFreeze/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'], headless: true });
const results = [];
const defects = [];
const snapshot = page => page.evaluate(() => window.seizefreeze.snapshot());
const waitReady = page => page.waitForFunction(() => window.seizefreeze?.snapshot().stats && window.seizefreeze.snapshot().summary, { timeout: 45000 });
const capture = (page, name) => page.screenshot({ path: fileURLToPath(new URL(`anatomy-${name}.png`, output)) });
const check = (condition, message) => { if (!condition) defects.push(message); };
const scanMode = async (page, mode) => {
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  return { mode, violations: scan.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description,
    nodes: v.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary })) })), incompleteCount: scan.incomplete.length };
};
try {
  for (const [width, height] of [[1440, 1000], [768, 1024], [390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [], requests = [];
    const accessibility = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', response => { if (response.status() >= 400) requests.push(`${response.status()} ${response.url()}`); });
    const start = Date.now();
    await page.goto(`${base}/seizefreeze-lab/index.html`);
    await waitReady(page);
    const interactiveMs = Date.now() - start;
    const initial = await snapshot(page);
    assert.equal(initial.chapter, 'placement');
    assert.equal(initial.peel, .86);
    assert.match(initial.stats.anatomy.targetDescription, /illustrative/i);
    assert.match(await page.locator('#anatomy-panel').innerText(), /No patient-specific seizure localization/);
    assert.deepEqual(initial.stats.contactSpanMm, [10, 10]);
    const originalTarget = initial.stats.target;
    assert.ok(originalTarget.every(Number.isFinite));
    const mountDistance = Math.hypot(...originalTarget.map((v, i) => v - initial.stats.mountPoint[i]));
    assert.ok(Math.abs(mountDistance - .65) < 1e-6, 'Device mount must remain offset along the reference target normal.');
    const layout = await page.evaluate(() => Object.fromEntries(['.scene', '.scene-tools', '.peel-control', '.inspector'].map(selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return [selector, { x: r.x, y: r.y, width: r.width, height: r.height }];
    })));
    await capture(page, `${width}-placement`);
    const peels = [];
    for (const value of [0, 1]) {
      await page.locator(`.peel-stops [data-peel="${value}"]`).click();
      let state = await snapshot(page);
      assert.equal(state.peel, value); assert.equal(state.stats.peel, value);
      assert.deepEqual(state.stats.target, originalTarget);
      assert.equal(await page.locator('#peel').inputValue(), String(value));
      const geometryBefore = state.stats.geometries;
      await page.waitForTimeout(200);
      state = await snapshot(page);
      assert.equal(state.stats.geometries, geometryBefore, 'Peeling should update existing geometry.');
      peels.push({ value, output: await page.locator('#peel-value').innerText(), geometryCount: state.stats.geometries });
      await capture(page, `${width}-peel-${value}`);
    }
    await page.locator('#peel').focus();
    await page.keyboard.press('Home');
    assert.equal((await snapshot(page)).peel, 0);
    await page.keyboard.press('End');
    assert.equal((await snapshot(page)).peel, 1);
    await page.keyboard.press('ArrowLeft');
    assert.equal((await snapshot(page)).peel, .99);
    for (const [layer, value] of [['scalp', .22], ['skull', .44], ['dura', .64], ['arachnoid', .84], ['pia', 1]]) {
      const button = page.locator(`[data-layer="${layer}"]`);
      await button.focus(); await page.keyboard.press('Enter');
      assert.equal((await snapshot(page)).peel, value);
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
    }
    const cameraPositions = [];
    for (const camera of ['head', 'region', 'interface']) {
      await page.locator(`#${camera}-view`).focus(); await page.keyboard.press('Space');
      const state = await snapshot(page);
      assert.equal(state.stats.view, camera);
      assert.deepEqual(state.stats.target, originalTarget, 'Camera must never move the anatomical target.');
      assert.equal(await page.locator(`#${camera}-view`).getAttribute('aria-pressed'), 'true');
      cameraPositions.push({ camera, position: state.stats.cameraPosition });
      await capture(page, `${width}-camera-${camera}`);
    }
    assert.equal(new Set(cameraPositions.map(v => JSON.stringify(v.position))).size, 3);
    await page.locator('#overview').click();
    assert.equal((await snapshot(page)).stats.view, 'region');
    await page.locator('#assembly-tab').focus(); await page.keyboard.press('Enter');
    assert.equal((await snapshot(page)).chapter, 'assembly');
    assert.equal(await page.locator('#assembly-panel').isVisible(), true);
    assert.equal(await page.locator('.peel-control').isVisible(), false);
    assert.equal(await page.locator('#explode').isVisible(), true);
    assert.deepEqual((await snapshot(page)).stats.target, originalTarget);
    await page.locator('#parts button').nth(2).focus(); await page.keyboard.press('Enter');
    assert.equal((await snapshot(page)).selected, 'tec');
    await page.locator('#seat').click();
    assert.equal((await snapshot(page)).stats.componentOffsets.tec, 0);
    await capture(page, `${width}-assembly`);
    accessibility.push(await scanMode(page, 'assembly'));
    await page.locator('#explode').click();
    await page.locator('#parts button').first().click();
    await page.locator('#interface-view').click();
    const canvas = page.locator('#scene canvas'), canvasBox = await canvas.boundingBox();
    await canvas.click({ position: { x: canvasBox.width / 2, y: canvasBox.height / 2 } });
    assert.equal((await snapshot(page)).selected, 'package', 'Picking the actual lid must select packaging, through hidden covering flaps.');
    await page.locator('#lab-tab').focus(); await page.keyboard.press('Enter');
    assert.equal((await snapshot(page)).chapter, 'lab');
    await page.evaluate(() => window.seizefreeze.goTo(45));
    let state = await snapshot(page);
    assert.equal(state.stats.view, 'interface');
    assert.deepEqual(state.stats.target, originalTarget);
    assert.equal(await page.locator('#surface-value').innerText(), `${state.frame.tissue[0].toFixed(2)} °C`);
    assert.equal(await page.locator('#hot-value').innerText(), `${state.frame.Th.toFixed(2)} °C`);
    assert.equal(state.playing, false);
    await page.locator('#scenario').selectOption('sensor');
    await page.waitForFunction(() => window.seizefreeze.snapshot().params?.scenario === 'sensor');
    await page.evaluate(() => window.seizefreeze.goTo(60));
    state = await snapshot(page);
    assert.equal(state.frame.sensor, null); assert.equal(state.frame.current, 0);
    await capture(page, `${width}-signal`);
    accessibility.push(await scanMode(page, 'signal'));
    check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${width}: signal-mode horizontal overflow`);
    await page.locator('#placement-tab').click();
    assert.equal((await snapshot(page)).peel, 1);
    assert.equal((await snapshot(page)).stats.peel, 1);
    check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${width}: placement horizontal overflow`);
    assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    await page.waitForTimeout(300);
    const idleFramesBefore = (await snapshot(page)).stats.frames;
    await page.waitForTimeout(700);
    const idleFramesAfter = (await snapshot(page)).stats.frames;
    assert.equal(idleFramesAfter, idleFramesBefore, 'Reduced-motion paused view must not keep rendering.');
    accessibility.push(await scanMode(page, 'placement'));
    for (const mode of accessibility) for (const violation of mode.violations) defects.push(`${width}: ${mode.mode} axe ${violation.id} (${violation.impact})`);
    check(errors.length === 0, `${width}: JavaScript errors ${errors.join('; ')}`);
    check(requests.length === 0, `${width}: failed assets ${requests.join('; ')}`);
    const stats = (await snapshot(page)).stats;
    results.push({ width, height, interactiveMs, viewportEmulation: true, physicalDeviceTest: false,
      layout, peels, cameraPositions, actualMeshPicking: 'Clicking the complete device lid selects packaging through hidden covering flaps', keyboard: 'Native range Home/End/ArrowLeft and layer/camera/mode Enter/Space passed',
      reducedMotion: { idleFramesBefore, idleFramesAfter }, accessibility, stats, errors, requests });
    console.log(JSON.stringify({ width, height, adapter: stats.adapter, passed: accessibility.every(mode => !mode.violations.length) && !errors.length && !requests.length }));
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (String(type).startsWith('webgl')) return null;
      return original.call(this, type, ...args);
    };
  });
  const page = await context.newPage();
  await page.goto(`${base}/seizefreeze-lab/index.html`);
  await page.waitForFunction(() => window.seizefreeze?.snapshot().staticView && window.seizefreeze.snapshot().summary);
  assert.equal(await page.locator('#poster').isVisible(), true);
  await page.locator('#peel').focus(); await page.keyboard.press('Home');
  assert.equal((await snapshot(page)).peel, 0);
  assert.match(await page.locator('#peel-description').innerText(), /Scalp covers/);
  await page.locator('#lab-tab').click();
  await page.evaluate(() => window.seizefreeze.goTo(45));
  assert.ok((await snapshot(page)).frame.current > 0);
  await capture(page, '390-no-webgl');
  results.push({ fallback: 'WebGL contexts intentionally unavailable', staticDiagramVisible: true,
    keyboardPeelDescriptionWorks: true, numericalModelWorks: true });
  await context.close();
} catch (error) {
  defects.push(error.stack || String(error));
} finally {
  await writeFile(new URL('anatomy-qa.json', output), JSON.stringify({ base, browserVersion: browser.version(),
    rendererRequested: 'native Chromium --use-angle=metal; inspect actual adapter in each result', results, defects }, null, 2));
  await browser.close();
}
assert.deepEqual(defects, [], 'Anatomical browser review found defects; inspect anatomy-qa.json.');
