import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.NEUROTRAUMA_URL || "http://127.0.0.1:3225";
const out = process.env.QA_OUT || "/tmp/neurotrauma-qa";
const route = "/work/motorsport-neurotrauma-toolkit";
await mkdir(out, { recursive: true });
const results = [];
const browser = await chromium.launch();
try {
  for (const [width, height] of [[1440, 1000], [1024, 768], [768, 1024], [390, 844], [320, 740]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 500, reducedMotion: width === 1440 ? "no-preference" : "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    assert.match(await page.title(), /From Impact to Informed Care/);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), `https://arjansinghpuniani.com${route}`);
    await page.screenshot({ path: `${out}/${width}-opening.png` });
    await page.getByRole("link", { name: "Explore the incident", exact: true }).click();
    const names = ["Impact", "First report", "Medical review", "Handoff"];
    for (const name of names) {
      const button = page.getByRole("button", { name: new RegExp(name) });
      if (width < 500) await button.tap();
      else { await button.focus(); await page.keyboard.press("Enter"); }
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      assert.equal(await page.locator('[aria-pressed="true"]').count(), 1);
      assert.ok(await page.getByRole("heading", { name: "Still unknown", exact: true }).isVisible());
    }
    assert.match(await page.locator("#incident-view").innerText(), /acknowledgement has not been confirmed/);
    await page.getByRole("button", { name: /Impact/ }).click();
    await page.locator("#incident").evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await page.screenshot({ path: `${out}/${width}-incident.png` });
    await page.getByRole("button", { name: /Handoff/ }).click();
    await page.getByRole("link", { name: "Inspect the fictional handoff" }).click();
    const rationales = page.locator("#handoff details");
    assert.equal(await rationales.count(), 7);
    for (const detail of await rationales.all()) {
      await detail.locator("summary").click();
      assert.equal(await detail.getAttribute("open"), "");
      assert.ok(await detail.locator("a").getAttribute("href"));
    }
    await page.locator("#handoff").evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await page.screenshot({ path: `${out}/${width}-handoff.png` });
    for (const id of ["protection", "information", "contribution", "methods"]) {
      if (width === 1440 || width === 390) {
        await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
        await page.screenshot({ path: `${out}/${width}-${id}.png` });
      }
    }
    const sources = page.locator('[id^="source-"]');
    assert.equal(await sources.count(), 13);
    for (const detail of await sources.all()) {
      await detail.locator("summary").click();
      assert.ok(await detail.getAttribute("open") !== null);
      assert.match(await detail.locator("a").getAttribute("href"), /^https:\/\//);
    }
    const brokenAnchors = await page.evaluate(() => Array.from(document.querySelectorAll('main a[href^="#"]')).filter(a => !document.getElementById(a.getAttribute("href").slice(1))).map(a => a.getAttribute("href")));
    assert.deepEqual(brokenAnchors, []);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Overflow at ${width}`);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    await writeFile(`${out}/${width}-axe.json`, JSON.stringify(axe.violations, null, 2));
    assert.deepEqual(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `Accessibility violations at ${width}`);
    assert.deepEqual(errors, []);
    results.push({ browser: "chromium", width, height, touch: width < 500, reducedMotion: width !== 1440, violations: 0 });
    if (width === 1440) {
      await page.evaluate(() => { window.print = () => { document.documentElement.dataset.printRequested = "true"; }; });
      await page.getByRole("button", { name: "Print the fictional handoff", exact: true }).click();
      assert.equal(await page.locator("html").getAttribute("data-print-requested"), "true");
      await page.emulateMedia({ media: "print" });
      assert.equal(await page.locator("#incident").isVisible(), false);
      assert.equal(await page.locator("#handoff").isVisible(), true);
      await page.pdf({ path: `${out}/fictional-handoff.pdf`, preferCSSPageSize: true, printBackground: true });
      const og = await page.request.get(`${base}${route}/opengraph-image`);
      assert.equal(og.status(), 200);
      assert.match(og.headers()["content-type"], /image\/png/);
      await writeFile(`${out}/opengraph.png`, await og.body());
      const paths = await page.evaluate(() => [...new Set(Array.from(document.querySelectorAll('a[href^="/"]')).map(a => a.getAttribute("href").split("#")[0]))]);
      for (const path of paths) assert.ok((await page.request.get(new URL(path, base).href)).ok(), `Internal destination failed: ${path}`);
    }
    await context.close();
  }
  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await noJS.newPage();
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  await page.locator("#incident-transcript summary").click();
  assert.equal(await page.locator("#incident-transcript").getAttribute("open"), "");
  assert.match(await page.locator("#incident-transcript").innerText(), /receiving clinician has accepted/);
  assert.equal(await page.locator("#incident-transcript article").count(), 4);
  await page.locator("#handoff details summary").first().click();
  assert.equal(await page.locator("#handoff details").first().getAttribute("open"), "");
  results.push({ browser: "chromium", javaScript: false, textWalkthrough: true, fieldRationale: true });
  await noJS.close();
} finally { await browser.close(); }

const safari = await webkit.launch();
try {
  const page = await safari.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /First report/ }).tap();
  assert.match(await page.locator("#incident-view").innerText(), /head hurts/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.locator("#incident").evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.screenshot({ path: `${out}/webkit-390-incident.png` });
  results.push({ browser: "webkit", width: 390, height: 844, touch: true });
} finally { await safari.close(); }
await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
