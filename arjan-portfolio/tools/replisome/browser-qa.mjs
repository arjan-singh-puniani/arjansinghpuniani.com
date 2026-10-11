import { chromium, webkit, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = (process.env.REPLISOME_QA_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const out = process.env.REPLISOME_QA_OUT || 'Documentation/replisome-qa';
mkdirSync(out, { recursive: true });
const results = [];
const errors = [];
const failed = [];
const routes = ['/','/about','/cv','/work','/research','/notes','/contact','/playground/holoanatomy','/playground/vector-tennis','/playground/rally-house','/playground/pit-stop','/playground/hemodynamic-observatory'];

for (const [name, type] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await type.launch(name === 'chromium' ? { channel: 'chrome', headless: true, args: ['--enable-webgl'] } : { headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const label = `${name}-${viewport.width}`;
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const requests = [];
      page.on('request', r => requests.push(r.url()));
      page.on('pageerror', e => errors.push({ case: label, message: e.message }));
      page.on('response', r => { if (r.status() >= 400) failed.push({ case: label, status: r.status(), url: r.url() }); });
      await page.goto(`${base}/playground`);
      const cards = page.locator('article');
      await expect(cards).toHaveCount(6);
      await expect(cards.nth(0).getByRole('heading')).toHaveText('Anatomy Learner');
      await expect(cards.nth(1).getByRole('heading')).toHaveText('REPLISOME');
      expect(await cards.nth(1).getByRole('heading').evaluate(h => h.scrollWidth <= h.clientWidth + 1)).toBe(true);
      const runtimeRequests = () => requests.filter(url => /\/replisome\/(?:index\.html|assets\/|molecules\/|fonts\/)/.test(url));
      expect(runtimeRequests()).toEqual([]);
      await cards.nth(1).scrollIntoViewIfNeeded();
      await expect.poll(() => cards.nth(1).locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      await page.screenshot({ path: `${out}/${label}-card.png` });
      await page.getByRole('link', { name: 'Explore DNA replication', exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('REPLISOME');
      await expect(page.locator('iframe')).toHaveCount(0);
      expect(runtimeRequests()).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://arjansinghpuniani.com/playground/replisome');
      await page.getByRole('button', { name: 'Enter experience' }).scrollIntoViewIfNeeded();
      await expect.poll(() => page.locator('img[alt="Colorful molecular complexes surrounding the DNA replication fork"]').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      await page.getByRole('heading', { level: 1 }).click();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: `${out}/${label}-landing.png`, fullPage: true });
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
      const launch = page.getByRole('button', { name: 'Enter experience' });
      await launch.focus();
      await page.keyboard.press('Enter');
      const frame = page.frameLocator('iframe');
      await expect(frame.locator('canvas')).toBeVisible({ timeout: 30000 });
      expect(await page.locator('iframe').evaluate(el => el.getBoundingClientRect().top >= document.querySelector('.site-header').getBoundingClientRect().bottom - 1)).toBe(true);
      await expect(frame.getByText('Preparing molecular structures…')).toBeHidden({ timeout: 30000 });
      expect(requests.some(url => /\/replisome\/molecules\/7pfo\.json/.test(url))).toBe(true);
      expect(requests.some(url => /\/replisome\/fonts\/.*\.ttf/.test(url))).toBe(true);
      expect(requests.some(url => /chatgpt\.site/.test(url))).toBe(false);
      expect(await frame.locator('body').evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await frame.getByRole('button', { name: 'Pause simulation', exact: true }).click();
      await frame.getByRole('button', { name: 'EXPLORE', exact: true }).click();
      await expect(frame.getByRole('button', { name: 'Zoom in', exact: true })).toBeVisible();
      await frame.getByRole('button', { name: 'PLAY', exact: true }).click();
      await expect(frame.getByRole('heading', { name: 'Find the starting point', exact: true })).toBeVisible();
      await frame.getByRole('button', { name: 'WATCH', exact: true }).click();
      await page.locator('iframe').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${out}/${label}-embedded.png` });
      const fullscreen = page.getByRole('button', { name: 'Enter fullscreen ↗', exact: true });
      await fullscreen.click();
      if (await page.evaluate(() => !!document.fullscreenElement)) await page.evaluate(() => document.exitFullscreen());
      else await expect(page.getByRole('status')).toContainText('Fullscreen is unavailable');
      await page.getByRole('button', { name: 'Close experience', exact: true }).click();
      await expect(page.locator('iframe')).toHaveCount(0);
      await expect(launch).toBeFocused();
      await launch.click();
      await expect(frame.locator('canvas')).toBeVisible({ timeout: 30000 });
      await page.getByRole('button', { name: 'Close experience', exact: true }).click();
      await page.getByRole('link', { name: '← Playground', exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Playground.');
      const xml = await page.request.get(`${base}/sitemap.xml`);
      expect(await xml.text()).toContain('https://arjansinghpuniani.com/playground/replisome');
      const standalone = await page.request.get(`${base}/replisome/index.html`);
      expect(await standalone.text()).toContain('noindex,follow');
      expect(standalone.headers()['x-frame-options']).toBe('SAMEORIGIN');
      results.push({ case: label, checks: ['card placement', 'no eager runtime requests', 'canonical/sitemap', 'responsive layout', 'WCAG scan', 'keyboard launch', 'embedded assets/fonts', 'Watch/Explore/Play', 'fullscreen/fallback', 'close and focus restoration', 'reopen', 'back navigation'] });
      await context.close();
    }
    const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        if (type === 'webgl2' || type === 'webgl' || type === 'experimental-webgl') return null;
        return original.call(this, type, ...args);
      };
    });
    await fallback.goto(`${base}/playground/replisome`);
    await fallback.getByRole('button', { name: 'Enter experience' }).click();
    await expect(fallback.frameLocator('iframe').getByText('3D graphics unavailable. Explore molecule descriptions and play the challenge below.')).toBeVisible();
    await fallback.getByRole('button', { name: 'Close experience', exact: true }).click();
    results.push({ case: `${name}-no-webgl`, checks: ['readable fallback', 'close remains available'] });
    await fallback.close();
    const standalonePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    standalonePage.on('pageerror', e => errors.push({ case: `${name}-standalone`, message: e.message }));
    standalonePage.on('response', r => { if (r.status() >= 400) failed.push({ case: `${name}-standalone`, status: r.status(), url: r.url() }); });
    await standalonePage.goto(`${base}/replisome/index.html`);
    await expect(standalonePage.locator('canvas')).toBeVisible({ timeout: 30000 });
    await expect(standalonePage.getByText('Preparing molecular structures…')).toBeHidden({ timeout: 30000 });
    expect(await standalonePage.locator('link[rel="icon"]').getAttribute('href')).toBe('/icon.svg');
    results.push({ case: `${name}-standalone`, checks: ['direct/new-tab launch', 'local icon', 'rendered molecular view'] });
    await standalonePage.close();
    if (name === 'chromium') {
      const page = await browser.newPage();
      for (const route of routes) {
        const response = await page.goto(base + route);
        expect(response.status(), route).toBe(200);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Skip to content', exact: true })).toHaveCount(1);
        results.push({ case: route, checks: ['existing route HTTP 200', 'page heading', 'shared accessibility/navigation'] });
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
writeFileSync(`${out}/results.json`, JSON.stringify({ base, results, errors, failed }, null, 2) + '\n');
expect(errors).toEqual([]);
expect(failed).toEqual([]);
console.log(`${results.length} integration/regression scenarios passed; no page errors or failed responses.`);
