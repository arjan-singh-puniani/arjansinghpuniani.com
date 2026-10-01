import assert from 'node:assert/strict';
import { chromium, browserOptions } from './runtime.mjs';

const baseUrl = process.env.RH_URL ?? 'http://127.0.0.1:8076/?debug';

async function ensureAvatar(page) {
  const picker = page.locator('#context.open');
  if (await picker.count()) {
    const arjan = page.getByText('Arjan', { exact: true });
    if (await arjan.count()) await arjan.click();
  }
}

async function scorePlayerPoint(page) {
  await page.evaluate(() => window.__rh.championshipPoint('player'));
  await page.waitForFunction(() => {
    const phase = window.__rh.championship().phase;
    return phase === 'pointResult' || phase === 'matchResult';
  });
}

async function finishMatch(page) {
  while (true) {
    const snapshot = await page.evaluate(() => window.__rh.championship());
    if (snapshot.phase === 'matchResult') return snapshot;

    if (snapshot.phase === 'pointResult') {
      await page.waitForFunction(() => window.__rh.championship().phase === 'serving');
    }

    await scorePlayerPoint(page);
  }
}

async function runCase(browser, name, contextOptions) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const errors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__rh?.ready === true);
  await ensureAvatar(page);

  await page.evaluate(() => window.__rh.challenge('leo'));
  await page.waitForFunction(
    () => ['intro', 'ready', 'serving'].includes(window.__rh.championship().phase),
    undefined,
    { timeout: 20000 },
  );
  await page.waitForFunction(
    () => window.__rh.championship().phase === 'serving',
    undefined,
    { timeout: 10000 },
  );

  assert.equal(
    await page.locator('.championshipHud').isVisible(),
    true,
    `${name}: Championship HUD should be visible`,
  );

  if (contextOptions.hasTouch) {
    assert.equal(await page.locator('.championshipSwing').isVisible(), true);
    assert.equal(await page.locator('.championshipTouchPad').isVisible(), true);
    await page.locator('.championshipSwing').tap();
  } else {
    await page.keyboard.press('Space');
  }

  // This transition requires the real procedural racket animation to reach its
  // authoritative contact frame. It is the browser-level guard against a fake
  // timer-only serve implementation.
  await page.waitForFunction(
    () => window.__rh.championship().phase === 'rally',
    undefined,
    { timeout: 5000 },
  );

  let result = await finishMatch(page);
  assert.equal(result.score.player >= 7, true);
  assert.equal(result.phase, 'matchResult');

  await page.getByText('Rematch', { exact: true }).click();
  await page.waitForFunction(() => window.__rh.championship().phase === 'serving');
  const rematch = await page.evaluate(() => window.__rh.championship());
  assert.deepEqual(rematch.score, { player: 0, opponent: 0 });

  result = await finishMatch(page);
  assert.equal(result.phase, 'matchResult');

  await page.getByText('Return to Club', { exact: true }).click();
  await page.waitForFunction(
    () => window.__rh.championship().phase === 'inactive',
    undefined,
    { timeout: 5000 },
  );

  const restored = await page.evaluate(() => ({
    championship: window.__rh.championship(),
    bodyClass: document.body.classList.contains('championship-active'),
    report: window.__rh.report(),
  }));

  assert.equal(restored.championship.cameraMode, 'club');
  assert.equal(restored.bodyClass, false);
  assert.equal(errors.length, 0, `${name}: console/page errors: ${errors.join('\n')}`);

  console.log(`${name}: Championship smoke PASS`);
  await context.close();
}

const browser = await chromium.launch(browserOptions);

try {
  await runCase(browser, 'desktop', {
    viewport: { width: 1280, height: 800 },
  });

  await runCase(browser, 'mobile portrait', {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
} finally {
  await browser.close();
}
