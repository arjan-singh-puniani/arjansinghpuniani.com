import fs from 'node:fs';
import { chromium, browserOptions } from './runtime.mjs';

const output = '../takeover-evidence/session-20261009';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ ...browserOptions, args: ['--use-angle=metal'] });
const report = {};
try {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8078/?debug');
  await page.waitForFunction(() => window.__rh?.ready);
  await page.getByText('Arjan', { exact: true }).click();
  await page.evaluate(() => {
    const g = window.__rh.game;
    g.autosave = -10000;
    g.clock.paused = true;
    for (const a of [...g.activities.active]) g.cancelActivity(a);
    g.startChampionship(g.actor('leo'));
    for (let i = 0; i < 6000 && g.championship.phase !== 'serving'; i++) g.updateFixed(1 / 60);
  });
  await page.locator('.championshipExit').focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  report.focusedExit = await page.evaluate(() => ({
    phase: window.__rh.game.championship.phase,
    exiting: window.__rh.game.championship.phase === 'exiting' || !window.__rh.game.championship.active,
    swinging: !!window.__rh.game.interactiveMatch?.pending,
  }));
  report.touch = await page.evaluate(() => {
    const g = window.__rh.game, pad = document.querySelector('.championshipTouchPad');
    const bounds = pad.getBoundingClientRect();
    // Isolate DOM ownership from browser capture mechanics; real multitouch
    // dispatch is exercised in session-validation.mjs after the repair.
    pad.setPointerCapture = () => {};
    const send = (type, id, fraction) => pad.dispatchEvent(new PointerEvent(type, {
      pointerId: id, clientX: bounds.left + bounds.width * fraction,
      clientY: bounds.top + bounds.height / 2, bubbles: true,
    }));
    send('pointerdown', 11, .95);
    const first = g.matchInput.movement().x;
    send('pointerdown', 22, .05);
    const second = g.matchInput.movement().x;
    g.championship.resolvePoint({ winner: 'player', reason: 'winner', rallyLength: 1 });
    g.matchInput.setEnabled(false);
    g.championshipHud.render(g.championship.snapshot(), 'Arjan', 'Leo');
    const ownerAfterPoint = g.championshipHud.pointerId;
    return { first, second, ownerAfterPoint };
  });
  report.stall = await page.evaluate(() => {
    const g = window.__rh.game;
    let ticks = 0;
    g.updateFixed = () => { ticks++; };
    g.render = () => {};
    g.last = performance.now() - 2000;
    g.simAcc = 0;
    g.loop(performance.now());
    return { ticks };
  });
  report.pauseControl = await page.getByRole('button', { name: 'Pause match', exact: true }).count();
  await page.screenshot({ path: `${output}/baseline-landscape.png` });
  const saved = await context.newPage();
  await saved.addInitScript(() => localStorage.setItem('rally-house-save-v2', JSON.stringify({ version: 999, savedAt: 1, state: {} })));
  await saved.goto('http://127.0.0.1:8078/');
  await saved.locator('#loading.fallback').waitFor();
  report.protectedSave = await saved.locator('#loading').innerText();
  await saved.screenshot({ path: `${output}/baseline-save.png` });
  console.log(JSON.stringify(report));
} finally {
  fs.writeFileSync(`${output}/baseline.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
