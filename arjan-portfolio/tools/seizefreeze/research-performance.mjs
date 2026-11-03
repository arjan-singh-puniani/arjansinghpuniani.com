import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const base = process.env.SEIZEFREEZE_BASE_URL || 'http://127.0.0.1:3219';
const output = new URL('../../Documentation/Validation/SeizeFreeze/research-2/', import.meta.url); await mkdir(output, { recursive: true });
const results = [];
for (const mode of ['native', 'software']) {
  const browser = await chromium.launch(mode === 'native' ? { headless: true, channel: 'chromium', args: ['--use-angle=metal'] } : { headless: true, args: ['--use-angle=swiftshader'] });
  try {
    for (const [width, height, deviceScaleFactor] of mode === 'native' ? [[1440, 1000, 1], [390, 844, 3], [1440, 900, 2]] : [[1440, 1000, 1], [390, 844, 1]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor, reducedMotion: 'reduce' }), page = await context.newPage(), start = Date.now();
      await page.goto(base + '/seizefreeze-lab/research.html'); await page.waitForFunction(() => window.seizefreezeResearch?.snapshot().summary);
      const readyMs = Date.now() - start, initial = await page.evaluate(() => window.seizefreezeResearch.snapshot());
      assert.equal(initial.scene.softwareRenderer, mode === 'software', 'Record actual renderer classification.');
      if (initial.staticView) await page.locator('#static-research').click();
      for (const workload of ['timeline', 'section-orbit', 'prototype-orbit']) {
        if (workload === 'section-orbit') await page.locator('#section-view').click();
        if (workload === 'prototype-orbit') await page.locator('.mode-nav [data-mode=prototype]').click();
        await page.locator('#research-scene').scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
        const timing = await page.evaluate(async workload => {
          const start = performance.now(), intervals = []; let prior = start, callbacks = 0;
          await new Promise(resolve => { const tick = now => {
            intervals.push(now - prior); prior = now; callbacks++;
            if (workload === 'timeline') window.seizefreezeResearch.goTo(18 + callbacks % 700 * .05);
            else document.querySelector('#research-scene canvas').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
            if (now - start < 2500) requestAnimationFrame(tick); else resolve();
          }; requestAnimationFrame(tick); });
          intervals.sort((a, b) => a - b); const elapsedMs = performance.now() - start, stats = window.seizefreezeResearch.snapshot().scene;
          const count = stats.renderCount; await new Promise(resolve => setTimeout(resolve, 400));
          return { interactionRafFps: callbacks * 1000 / elapsedMs, intervalP95Ms: intervals[Math.floor(intervals.length * .95)], renderCpuMs: stats.renderCPU,
            idleRenders: window.seizefreezeResearch.snapshot().scene.renderCount - count, adapter: stats.adapter, softwareRenderer: stats.softwareRenderer,
            triangles: stats.triangles, drawCalls: stats.drawCalls, memory: stats.memory };
        }, workload);
        const record = { mode, width, height, deviceScaleFactor, workload, readyMs, staticByDefault: initial.staticView, physicalPhoneTest: false,
          measurement: 'Short unthrottled desktop-host interaction RAF cadence; not GPU execution time or physical-device performance. Multiple synchronous renderer submissions may occur per presented frame.', ...timing };
        assert.ok(record.interactionRafFps > 0 && Number.isFinite(record.interactionRafFps)); assert.equal(record.idleRenders, 0);
        results.push(record); console.log(JSON.stringify(record));
      }
      await context.close();
    }
  } finally { await browser.close(); }
}
const names = ['research.html', 'research.css', 'research.js', 'research-scene.js', 'research-worker.js', 'research-poster.svg', 'organoid-model.js', 'organoid-signal.js', 'ORGANOID_MODEL.md', 'PROTOTYPE_EVIDENCE.md', 'VALIDATION_PLAN.md', 'RESEARCH_SOURCES.md'];
const assets = [];
for (const name of names) { const bytes = await readFile(new URL('../../public/seizefreeze-lab/' + name, import.meta.url)); assets.push({ name, bytes: bytes.length, gzipBytes: gzipSync(bytes).length }); }
await writeFile(new URL('performance.json', output), JSON.stringify({ base, results, assets, totalAddedBytes: assets.reduce((s, x) => s + x.bytes, 0), summedAddedGzipBytes: assets.reduce((s, x) => s + x.gzipBytes, 0),
  sharedRuntime: 'Existing local Three.js and KaTeX reused; no new dependency. Generated full experiment JSON is about17MB per run, not a downloaded site asset.' }, null, 2));
