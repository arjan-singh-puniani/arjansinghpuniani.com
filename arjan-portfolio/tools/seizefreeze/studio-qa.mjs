import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.SEIZEFREEZE_BASE_URL || 'http://127.0.0.1:3215';
const output = new URL('../../Documentation/Validation/SeizeFreeze/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--use-angle=metal'] });
const results = [], defects = [];
const snapshot = page => page.evaluate(() => window.seizefreeze.snapshot());
const screenshot = (page, name) => page.screenshot({ path: fileURLToPath(new URL(`studio-${name}.png`, output)) });
const check = (condition, message) => { if (!condition) defects.push(message); };
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
async function scan(page, mode) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  return { mode, violations: result.violations.map(v => ({ id: v.id, impact: v.impact,
    nodes: v.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary })) })),
    incomplete: result.incomplete.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) })) };
}
try {
  for (const [width, height] of [[1440, 1000], [768, 1024], [390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [], requests = [], accessibility = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) requests.push(`${r.status()} ${r.url()}`); });
    const start = performance.now();
    await page.goto(`${base}/seizefreeze-lab/index.html`);
    await page.waitForFunction(() => window.seizefreeze?.snapshot().stats && window.seizefreeze.snapshot().summary, null, { timeout: 45000 });
    const interactiveMs = Math.round(performance.now() - start);
    const initial = await snapshot(page);
    assert.equal(initial.chapter, 'placement'); assert.equal(initial.peel, .86);
    assert.equal(initial.staticView, false, 'Native GPU path must start in interactive 3D.');
    assert.match(initial.stats.anatomy.targetDescription, /illustrative/i);
    const target = initial.stats.target;
    const layout = await page.evaluate(() => Object.fromEntries(['.scene', '#device-lens', '.scene-tools', '.peel-control', '.introduction', '.chapter-nav'].map(selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return [selector, { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }];
    })));
    const stage = layout['.scene'], lens = layout['#device-lens'];
    assert.ok(stage.width >= width * .95 && stage.y <= 90 && stage.height >= height * .7, 'Opening scene must occupy the viewport.');
    assert.ok(lens.x >= stage.x && lens.y >= stage.y && lens.right <= stage.right + 1 && lens.bottom <= stage.bottom + 1, 'Device lens must fit inside the stage.');
    check(layout['.scene-tools'].bottom <= layout['.peel-control'].y - 6, `${width}: camera controls need a visible gap above the peel card`);
    assert.match(await page.locator('#device-lens').innerText(), /ENLARGED/);
    assert.equal(await page.locator('#device-lens').isVisible(), true);
    assert.equal(await overflow(page), false);
    await screenshot(page, `${width}-opening`);
    await page.locator('#device-lens').screenshot({ path: fileURLToPath(new URL(`studio-${width}-lens.png`, output)) });
    await page.locator('#static-view').click();
    assert.equal(await page.locator('#device-lens').isVisible(), false, 'Static placement must hide the previously visible lens.');
    await page.locator('#static-view').click();
    assert.equal(await page.locator('#device-lens').isVisible(), true);
    const guided = [];
    for (const [i, value] of [0, .22, .44, .64, .84, 1].entries()) {
      await page.locator('#peel-action').focus(); await page.keyboard.press(i % 2 ? 'Space' : 'Enter');
      const state = await snapshot(page);
      assert.equal(state.peel, value, `Guided layer step ${i} has the wrong peel value.`);
      assert.equal(state.stats.peel, value); assert.deepEqual(state.stats.target, target);
      assert.match(await page.locator('#peel').getAttribute('aria-valuetext'), new RegExp(`${Math.round(value * 100)}%`));
      guided.push({ peel: value, output: await page.locator('#peel-value').innerText(), nextAction: await page.locator('#peel-action').innerText(), view: state.stats.view });
      if (i === 0) await screenshot(page, `${width}-intact`);
    }
    assert.equal((await snapshot(page)).stats.view, 'interface');
    await screenshot(page, `${width}-interface`);
    await page.locator('#peel-action').click();
    assert.equal((await snapshot(page)).peel, 0); assert.equal((await snapshot(page)).stats.view, 'region');
    await page.locator('#peel').focus(); await page.keyboard.press('End');
    assert.equal((await snapshot(page)).peel, 1);
    await page.keyboard.press('ArrowLeft'); assert.equal((await snapshot(page)).peel, .99);
    await page.keyboard.press('Home'); assert.equal((await snapshot(page)).peel, 0);
    for (const [layer, value] of [['scalp', .22], ['skull', .44], ['dura', .64], ['arachnoid', .84], ['pia', 1]]) {
      await page.locator(`[data-layer="${layer}"]`).focus(); await page.keyboard.press('Enter');
      assert.equal((await snapshot(page)).peel, value);
    }
    for (const camera of ['head', 'region', 'interface']) {
      await page.locator(`#${camera}-view`).focus(); await page.keyboard.press('Enter');
      assert.equal((await snapshot(page)).stats.view, camera);
      assert.deepEqual((await snapshot(page)).stats.target, target);
    }
    await page.locator('#region-view').click();
    await page.locator('.peel-stops [data-peel="0.86"]').click();
    accessibility.push(await scan(page, 'placement'));
    // The point is projected from the actual lid; the main canvas raycasts the lens camera.
    await page.locator('#device-lens').scrollIntoViewIfNeeded();
    const lensBox = await page.locator('#device-lens').boundingBox();
    assert.ok(lensBox && lensBox.width > 0);
    const lensState = (await snapshot(page)).stats.lens;
    const hostBox = await page.locator('#scene').boundingBox();
    assert.equal(lensState.visible, true);
    const pickX = hostBox.x + lensState.packagePixel.x, pickY = hostBox.y + lensState.packagePixel.y;
    assert.ok(pickX > 0 && pickX < width && pickY > 0 && pickY < height, 'Lens pick must lie inside the actual browser viewport.');
    assert.ok(pickX > lensBox.x && pickX < lensBox.x + lensBox.width && pickY > lensBox.y && pickY < lensBox.y + lensBox.height,
      'The actual projected package must be visible inside the lens.');
    await page.mouse.click(pickX, pickY);
    const picked = await snapshot(page);
    assert.equal(picked.chapter, 'assembly', 'A real lens click must open device assembly.');
    assert.equal(picked.selected, 'package', 'Clicking the actual lens lid must select packaging.');
    assert.equal(picked.stats.selected, picked.selected);
    assert.equal(await page.locator('#assembly-panel').isVisible(), true);
    check(!await overflow(page), `${width}: assembly horizontal overflow`);
    await screenshot(page, `${width}-assembly`);
    accessibility.push(await scan(page, 'assembly'));
    await page.locator('#lab-tab').focus(); await page.keyboard.press('Enter');
    await page.evaluate(() => window.seizefreeze.goTo(45));
    let state = await snapshot(page);
    assert.equal(state.chapter, 'lab');
    assert.equal(await page.locator('#surface-value').innerText(), `${state.frame.tissue[0].toFixed(2)} °C`);
    assert.equal(await page.locator('#hot-value').innerText(), `${state.frame.Th.toFixed(2)} °C`);
    assert.ok(Math.abs(state.frame.qh - state.frame.qc - state.frame.power) < 1e-12);
    await page.locator('#static-view').click();
    assert.equal(await page.locator('#device-lens').isVisible(), false);
    await page.waitForTimeout(150);
    const staticFrames = (await snapshot(page)).stats.frames;
    await page.evaluate(() => window.seizefreeze.goTo(0));
    await page.waitForTimeout(300);
    assert.equal((await snapshot(page)).stats.frames, staticFrames, 'Static mode must suspend scene rendering during model scrubbing.');
    await page.locator('#static-view').click();
    assert.equal((await snapshot(page)).staticView, false);
    await page.locator('#scenario').selectOption('sensor');
    await page.waitForFunction(() => window.seizefreeze.snapshot().params?.scenario === 'sensor');
    await page.evaluate(() => window.seizefreeze.goTo(60));
    state = await snapshot(page);
    assert.equal(state.frame.sensor, null); assert.equal(state.frame.current, 0);
    await screenshot(page, `${width}-signal`);
    check(!await overflow(page), `${width}: signal horizontal overflow`);
    accessibility.push(await scan(page, 'signal'));
    await page.locator('#placement-tab').click();
    await page.waitForTimeout(200);
    const idleBefore = (await snapshot(page)).stats.frames;
    await page.waitForTimeout(600);
    const idleAfter = (await snapshot(page)).stats.frames;
    assert.equal(idleAfter, idleBefore, 'Reduced-motion paused view must not keep rendering.');
    for (const mode of accessibility) for (const violation of mode.violations) defects.push(`${width}: ${mode.mode} axe ${violation.id}`);
    check(errors.length === 0, `${width}: JavaScript errors: ${errors.join('; ')}`);
    check(requests.length === 0, `${width}: failed assets: ${requests.join('; ')}`);
    const stats = (await snapshot(page)).stats;
    results.push({ width, height, interactiveMs, viewportEmulation: true, physicalPhoneTest: false,
      layout, guided, actualLensPick: { selected: picked.selected, chapter: picked.chapter }, staticFrames,
      reducedMotion: { idleBefore, idleAfter }, accessibility, errors, requests, stats });
    console.log(JSON.stringify({ width, height, adapter: stats.adapter, completed: true }));
    await context.close();
  }
  const reflowContext = await browser.newContext({ viewport: { width: 320, height: 844 }, reducedMotion: 'reduce' });
  const reflowPage = await reflowContext.newPage();
  await reflowPage.goto(`${base}/seizefreeze-lab/index.html`);
  await reflowPage.waitForFunction(() => window.seizefreeze?.snapshot().stats && window.seizefreeze.snapshot().summary);
  assert.equal(await overflow(reflowPage), false, '320 CSS px placement reflow must not overflow horizontally.');
  const reflowGap = await reflowPage.evaluate(() => document.querySelector('.peel-control').getBoundingClientRect().top
    - document.querySelector('.scene-tools').getBoundingClientRect().bottom);
  assert.ok(reflowGap >= 6, '320 CSS px wrapped camera controls must clear the peel card.');
  await screenshot(reflowPage, '320-reflow-opening');
  for (const mode of ['assembly', 'lab']) {
    await reflowPage.locator(`#${mode}-tab`).click();
    assert.equal(await overflow(reflowPage), false, `320 CSS px ${mode} reflow must not overflow horizontally.`);
  }
  results.push({ width: 320, height: 844, reflowOnly: true, modes: ['placement', 'assembly', 'lab'], horizontalOverflow: false, cameraControlGap: reflowGap,
    viewportEmulation: true, physicalPhoneTest: false });
  await reflowContext.close();
} catch (error) {
  defects.push(error.stack || String(error));
} finally {
  await writeFile(new URL('studio-qa.json', output), JSON.stringify({ base, browserVersion: browser.version(),
    requestedRenderer: 'Native Chromium --use-angle=metal; actual adapter recorded per viewport', results, defects }, null, 2));
  await browser.close();
}
assert.deepEqual(defects, [], 'Studio QA found defects; inspect studio-qa.json.');
