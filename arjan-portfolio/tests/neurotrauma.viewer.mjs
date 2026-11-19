import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "playwright";

const base = process.env.NEUROTRAUMA_URL || "http://127.0.0.1:3225";
const out = process.env.QA_OUT || "/tmp/neurotrauma-viewer-qa";
await mkdir(out, { recursive: true });
// Sketchfab rejects software-only headless WebGL; exercise its real renderer in Chrome.
const browser = await chromium.launch({ channel: "chrome", headless: false, args: process.platform === "darwin" ? ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] : ["--enable-gpu"] });
const results = [];
try {
  for (const [width, height] of [[1440, 1000], [390, 844], [320, 740]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 500, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      let value;
      Object.defineProperty(window, "Sketchfab", { configurable: true, get() { return value; }, set(Ctor) {
        value = class extends Ctor {
          init(id, options) {
            const success = options.success;
            return super.init(id, { ...options, success(api) { window.__viewerApi = api; success(api); } });
          }
        };
      } });
    });
    const errors = [];
    const externalRequests = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (/https:\/\/(?:static\.|media\.)?sketchfab\.com\//.test(request.url())) externalRequests.push(request.url()); });
    assert.equal((await page.goto(`${base}/work/motorsport-neurotrauma-toolkit`, { waitUntil: "networkidle" })).status(), 200);
    await page.locator("[data-hero-illustration] img").evaluate(el => el.decode());
    await page.screenshot({ path: `${out}/${width}-opening.png` });
    assert.equal(externalRequests.length, 0, "The model service should load only when the visitor requests 3D");
    await page.getByRole("button", { name: "Explore in 3D" }).click();
    await page.waitForFunction(() => document.querySelector("[data-incident-car]")?.getAttribute("data-viewer-state") === "ready", null, { timeout: 65000 });
    const cameraPosition = () => page.evaluate(() => new Promise(resolve => window.__viewerApi.getCameraLookAt((error, camera) => resolve(camera.position))));
    const initialCamera = await cameraPosition();
    await page.waitForTimeout(3000);
    const settledCamera = await cameraPosition();
    assert.ok(initialCamera.every((value, index) => Math.abs(value - settledCamera[index]) < .05), "The provider intro must not overwrite the chosen camera");
    assert.ok(externalRequests.length > 0);
    const frame = page.getByTitle("Interactive Red Bull RB19 model by Redgrund");
    assert.ok(await frame.isVisible());
    await page.setViewportSize({ width, height: 2600 });
    await frame.evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 220, behavior: "instant" }));
    const box = await frame.boundingBox();
    await page.mouse.move(box.x + box.width * .55, box.y + box.height * .45);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .55 + 35, box.y + box.height * .45 + 10, { steps: 8 });
    await page.mouse.up();
    const explorer = page.getByRole("group", { name: "Explore incident stages" }).locator("..");
    const hashes = [];
    for (const [name, id] of [["Front-left", "front-left"], ["Front", "front"], ["Left side", "left-side"], ["Rear", "rear"]]) {
      await page.getByRole("radio", { name, exact: true }).check();
      await page.getByRole("button", { name: "Reset view", exact: true }).click();
      await page.waitForTimeout(1000);
      await explorer.evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "instant" }));
      const pixels = await frame.screenshot();
      hashes.push(createHash("sha256").update(pixels).digest("hex"));
      assert.equal(await page.locator("[data-incident-car]").getAttribute("data-direction"), id);
      assert.match(await page.locator("#direction-information").innerText(), new RegExp(name));
      await explorer.screenshot({ path: `${out}/${width}-${id}.png` });
    }
    assert.equal(new Set(hashes).size, 4, "All four camera views should produce different rendered images");
    for (const view of ["Top view", "Cockpit view"]) {
      await page.getByRole("button", { name: view, exact: true }).click();
      await page.waitForTimeout(700);
      await frame.evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 220, behavior: "instant" }));
      await frame.screenshot({ path: `${out}/${width}-${view.toLowerCase().replaceAll(" ", "-")}.png` });
    }
    await page.getByRole("radio", { name: "Front-left", exact: true }).check();
    await page.getByRole("button", { name: "Reset view", exact: true }).click();
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Reset view", exact: true }).click();
    await page.waitForTimeout(500);
    await explorer.evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "instant" }));
    await page.screenshot({ path: `${out}/${width}-incident.png` });
    await page.getByRole("radio", { name: "Rear", exact: true }).check();
    await page.locator("#direction-information").evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 200, behavior: "instant" }));
    await page.screenshot({ path: `${out}/${width}-information.png` });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    assert.deepEqual(errors, []);
    await page.getByRole("button", { name: "Close 3D", exact: true }).click();
    assert.equal(await frame.count(), 0);
    results.push({ browser: "Chrome with hardware rendering", width, height, reducedMotion: true, fourCameraViews: true, orbitDrag: true, presets: true, externalRequestsAfterActivation: externalRequests.length });
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${out}/results.json`, JSON.stringify({ base, checkedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));
