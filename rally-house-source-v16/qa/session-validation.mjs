import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, browserOptions } from './runtime.mjs';

const output = '../takeover-evidence/session-20261009';
fs.mkdirSync(output, { recursive: true });
const report = { views: [], pauses: [], stalls: [], saves: [], errors: [] };
const browser = await chromium.launch({ ...browserOptions, args: ['--use-angle=metal'] });
const base = process.env.QA_BASE_URL ?? 'http://127.0.0.1:8078';

async function enter(page) {
  await page.evaluate(() => {
    const g = window.__rh.game;
    if (g.championship.active) {
      g.requestChampionshipExit();
      for (let i = 0; i < 180; i++) g.updateFixed(1 / 60);
    }
    g.autosave = -10000;
    g.clock.paused = true;
    g.clock.speed = 2;
    for (const a of [...g.activities.active]) g.cancelActivity(a);
    g.startChampionship(g.actor('leo'));
    for (let i = 0; i < 6000 && g.championship.phase !== 'serving'; i++) g.updateFixed(1 / 60);
    if (g.championship.phase !== 'serving') throw Error('Court entry failed');
    g.canvas.focus();
  });
  await page.locator('.championshipHud[data-phase="serving"]').waitFor();
}

try {
  for (const [width, height] of [[1280, 800], [390, 844], [844, 390], [390, 280]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width !== 1280 });
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    await page.goto(`${base}/?debug`);
    await page.waitForFunction(() => window.__rh?.ready);
    await page.getByText('Arjan', { exact: true }).click();
    await page.screenshot({ path: `${output}/club-${width}x${height}.png` });
    await enter(page);

    // Native buttons retain Space/Enter, while the canvas retains gameplay.
    await page.locator('.championshipPause').focus();
    await page.keyboard.press('Space');
    await page.getByRole('region', { name: 'Match paused' }).waitFor();
    assert(await page.evaluate(() => window.__rh.game.clock.paused));
    assert.equal(await page.evaluate(() => !!window.__rh.game.interactiveMatch.pending), false);
    await page.getByRole('button', { name: 'Sound', exact: true }).focus();
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('button[aria-label="Sound"]').getAttribute('aria-pressed')==='false');
    assert(await page.evaluate(()=>{const g=window.__rh.game;return g.audio.enabled&&g.audio.volume===0&&g.settings.volume===0;}),'Mute shares the club volume preference');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('button[aria-label="Sound"]').getAttribute('aria-pressed')==='true');
    assert.equal(await page.evaluate(()=>window.__rh.game.audio.volume),.65,'Unmute restores the previous audible volume');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('button[aria-label="Sound"]').getAttribute('aria-pressed')==='false');
    await page.getByRole('button', { name: 'Reduced motion', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => [...document.querySelectorAll('.championshipPausePanel button')].some(b => b.textContent === 'Reduced motion' && b.getAttribute('aria-pressed') === 'true'));
    assert.equal(await page.getByRole('button', { name: 'Reduced motion', exact: true }).getAttribute('aria-pressed'), 'true');
    const { default: AxeBuilder } = await import('../../arjan-portfolio/node_modules/@axe-core/playwright/dist/index.js');
    const axe = await new AxeBuilder({ page }).include('.championshipHud').analyze();
    assert.deepEqual(axe.violations, []);
    await page.screenshot({ path: `${output}/paused-${width}x${height}.png` });
    const bounds = await page.locator('.championshipPausePanel').boundingBox();
    assert(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height);
    assert(await page.evaluate(() => [...document.querySelectorAll('.championshipPauseActions button')].every(button=>{
      const box=button.getBoundingClientRect();
      return document.elementFromPoint(box.x+box.width/2,box.y+box.height/2)===button;
    })),'Resume and Return receive pointer hits');
    report.views.push({ width, height, axe: axe.violations.length, pauseBounds: bounds });
    await page.getByRole('button', { name: 'Resume match', exact: true }).focus();
    await page.keyboard.press('Space');
    await page.getByRole('region', { name: 'Match paused' }).waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => document.activeElement.id), 'game');

    if (width !== 1280) {
      const pad = await page.locator('.championshipTouchPad').boundingBox();
      await page.evaluate(() => {
        window.sessionPointers=[];
        for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.querySelector('.championshipTouchPad').addEventListener(type,e=>window.sessionPointers.push({type,id:e.pointerId}));
      });
      const cdp = await context.newCDPSession(page);
      const point = (id, fraction) => ({ id, x: pad.x + pad.width * fraction, y: pad.y + pad.height / 2 });
      const first = point(11, .9), second = point(22, .1);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first] });
      const initial = await page.evaluate(() => window.__rh.game.matchInput.movement().x);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first, second] });
      const together = await page.evaluate(() => window.__rh.game.matchInput.movement().x);
      assert(initial > .7 && together > .7, 'A second finger cannot steal steering');
      // CDP requires an empty list for touchEnd. Release the real two-finger
      // gesture, then deliver a delayed DOM move from its retired pointer.
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(80);
      await page.evaluate(() => {
        const pad=document.querySelector('.championshipTouchPad');
        pad.dispatchEvent(new PointerEvent('pointermove',{pointerId:window.sessionPointers[0].id,clientX:0,clientY:0,bubbles:true}));
      });
      await page.waitForTimeout(80);
      const released=await page.evaluate(()=>({x:window.__rh.game.matchInput.movement().x,owner:window.__rh.game.championshipHud.pointerId,events:window.sessionPointers}));
      assert.equal(released.x, 0, `Late unowned movement stays idle ${JSON.stringify(released)}`);
      await cdp.detach();
      report.views.at(-1).multitouch = { initial, together, released: 0 };
    }

    // Freeze actual ball flight and actual string dwell, then release once.
    for (const kind of ['flight', 'contact']) {
      await enter(page);
      const before = await page.evaluate(kind => {
        const g = window.__rh.game, m = g.interactiveMatch;
        window.sessionHits = 0;
        const hit = m.callbacks.onHit;
        m.callbacks.onHit = (...args) => { window.sessionHits++; hit?.(...args); };
        m.prepareShot('player', 'serve', 'perfect');
        for (let i = 0; i < 200; i++) {
          g.updateFixed(1 / 120);
          if (kind === 'contact' ? m.pending?.impactStarted : m.ball.active && !m.pending) break;
        }
        if (kind === 'contact' && !m.pending?.impactStarted) throw Error('No string dwell');
        g.setChampionshipPaused(true);
        return JSON.stringify({ ball: m.ball.position, score: g.championship.score, player: g.player.position, pose: g.player.animTime, hold: g.player.contactHoldRemaining, hits: window.sessionHits });
      }, kind);
      await page.waitForTimeout(250);
      const after = await page.evaluate(() => {
        const g = window.__rh.game, m = g.interactiveMatch;
        return JSON.stringify({ ball: m.ball.position, score: g.championship.score, player: g.player.position, pose: g.player.animTime, hold: g.player.contactHoldRemaining, hits: window.sessionHits });
      });
      assert.equal(after, before, `${kind} remains physically frozen`);
      await page.getByRole('button', { name: 'Resume match', exact: true }).click();
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.sessionHits), 1, 'No duplicate contact on resume');
      report.pauses.push({ width, kind, exactFreeze: true, contactsAfterResume: 1 });
    }

    await enter(page);
    await page.locator('canvas').focus();
    await page.keyboard.down('d');
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.getByRole('region', { name: 'Match paused' }).waitFor();
    assert.equal(await page.evaluate(() => window.__rh.game.matchInput.enabled), false);
    await page.waitForTimeout(200);
    assert(await page.evaluate(() => window.__rh.game.clock.paused), 'Focus recovery does not silently resume');
    await page.locator('.championshipPausedExit').focus();
    await page.keyboard.press('Space');
    await page.locator('.championshipHud').waitFor({ state: 'hidden' });
    const restored = await page.evaluate(() => {
      const g = window.__rh.game;
      return { paused: g.clock.paused, speed: g.clock.speed, reserved: g.activities.reserved('court'), owner: g.championshipHud.pointerId };
    });
    assert.deepEqual(restored, { paused: true, speed: 2, reserved: false, owner: null });
    report.views.at(-1).exitWhilePaused = restored;
    await page.keyboard.up('d');
    await enter(page);
    await page.locator('.championshipExit').focus();
    await page.keyboard.press('Space');
    await page.locator('.championshipHud').waitFor({state:'hidden'});
    report.views.at(-1).nativeExitWhilePlaying=true;

    if (width === 1280) {
      for (const kind of ['serving', 'flight', 'contact']) for (const milliseconds of [100, 500, 2000]) {
        await enter(page);
        const row = await page.evaluate(async ({ kind, milliseconds }) => {
          const g = window.__rh.game, m = g.interactiveMatch;
          if (kind !== 'serving') {
            m.prepareShot('player', 'serve', 'perfect');
            for (let i = 0; i < 200; i++) {
              g.updateFixed(1 / 120);
              if (kind === 'contact' ? m.pending?.impactStarted : m.ball.active && !m.pending) break;
            }
          }
          const tick = g.updateFixed.bind(g);
          let ticks = 0;
          g.updateFixed = dt => { ticks++; tick(dt); };
          g.last = performance.now() - milliseconds;
          g.simAcc = 0;
          await new Promise(requestAnimationFrame);
          g.updateFixed = tick;
          return { kind, milliseconds, ticks, debt: g.simAcc, ballFinite: [m.ball.position.x, m.ball.position.y, m.ball.position.z].every(Number.isFinite), score: g.championship.score };
        }, { kind, milliseconds });
        assert(row.ticks <= 6 && row.debt < 1 / 60 && row.ballFinite);
        assert.deepEqual(row.score, { player: 0, opponent: 0 }, 'A stall cannot resolve an unseen point');
        report.stalls.push(row);
      }
      await enter(page);
      const other=await context.newPage();
      await other.goto('about:blank');
      await other.bringToFront();
      await page.waitForTimeout(100);
      const interrupted=await page.evaluate(()=>({hidden:document.hidden,paused:window.__rh.game.clock.paused,input:window.__rh.game.matchInput.enabled}));
      await page.bringToFront();
      await page.waitForTimeout(100);
      report.pageSwitch={...interrupted,lifecycleDelivered:interrupted.paused&&!interrupted.input};
      // This headless-shell runtime can keep both pages visible/focused.
      // Explicitly deliver the hidden/visible lifecycle if it cannot model tabs.
      if(!report.pageSwitch.lifecycleDelivered){
        await page.evaluate(()=>{
          Object.defineProperty(document,'hidden',{configurable:true,value:true});
          document.dispatchEvent(new Event('visibilitychange'));
        });
        assert(await page.evaluate(()=>window.__rh.game.clock.paused&&!window.__rh.game.matchInput.enabled));
        await page.evaluate(()=>{
          delete document.hidden;
          document.dispatchEvent(new Event('visibilitychange'));
        });
      }
      assert(await page.evaluate(()=>window.__rh.game.clock.paused),'Returning to visibility requires Resume');
      report.pageSwitch.explicitResumeRequired=true;
      await other.close();
    }
    await context.close();
  }

  for (const [kind, raw, width, height] of [['malformed', '{broken', 1280, 800], ['future', JSON.stringify({ version: 999, savedAt: 1, state: {} }), 390, 844], ['invalid', JSON.stringify({ version: 1, savedAt: 1, state: {} }), 844, 390]]) {
    const context = await browser.newContext({viewport:{width,height}});
    const page = await context.newPage();
    await page.addInitScript(raw => localStorage.setItem('rally-house-save-v2', raw), raw);
    await page.goto(base);
    await page.getByText('Your saved club could not open', { exact: true }).waitFor();
    const preserved = await page.evaluate(() => localStorage.getItem('rally-house-save-v2'));
    assert.equal(preserved, raw);
    assert.equal(await page.evaluate(() => typeof window.__rh), 'undefined');
    const retry=await page.getByRole('button',{name:'Try again',exact:true}).boundingBox();
    assert(retry.y>=0&&retry.y+retry.height<=height,'Recovery action is visible');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({ path: `${output}/save-${kind}.png` });
    report.saves.push({ kind, width, height, preserved: true, fallback: await page.locator('#loading').innerText() });
    await context.close();
  }
  const unavailableContext=await browser.newContext();
  const unavailable=await unavailableContext.newPage();
  await unavailable.addInitScript(()=>{
    localStorage.setItem('rally-house-save-v2','protected bytes');
    window.readProtectedStorage=Storage.prototype.getItem;
    Storage.prototype.getItem=()=>{throw new DOMException('Storage unavailable','SecurityError');};
    indexedDB.open=()=>{throw new DOMException('Storage unavailable','SecurityError');};
  });
  await unavailable.goto(base);
  await unavailable.getByText('Your saved club could not open',{exact:true}).waitFor();
  assert.equal(await unavailable.evaluate(()=>window.readProtectedStorage.call(localStorage,'rally-house-save-v2')),'protected bytes');
  report.saves.push({kind:'unavailable',preserved:true});
  await unavailableContext.close();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind === 'webgl2' ? null : original.call(this, kind, ...args);
    };
  });
  await page.goto(base);
  await page.getByText('The club’s graphics could not start', { exact: true }).waitFor();
  report.graphicsFallback = await page.locator('#loading').innerText();
  assert.deepEqual(report.errors, []);
  console.log('Session validation PASS:', report.views.length, 'layouts,', report.pauses.length, 'exact freezes,', report.stalls.length, 'stalls, protected saves and native controls');
} finally {
  fs.writeFileSync(`${output}/validation.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
