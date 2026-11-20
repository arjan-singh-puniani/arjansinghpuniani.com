import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.MOTORCYCLE_URL || "http://127.0.0.1:3225";
const out = process.env.QA_OUT || "/tmp/motorcycle-qa";
const route = "/motorcycle-mechanism-lab/index.html";
await mkdir(out,{ recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: false, args: process.platform === "darwin" ? ["--use-angle=metal","--enable-gpu","--ignore-gpu-blocklist"] : ["--enable-gpu"] });
const results = [];

async function setRange(page,id,value) {
  await page.locator(`#${id}`).fill(String(value));
  await page.locator(`#${id}`).dispatchEvent("change");
}

async function atTop(page,path) {
  await page.evaluate(() => scrollTo({ top: 0,behavior: "instant" }));
  await page.waitForTimeout(150);
  await page.screenshot({ path });
}

async function geometryState(page,id) {
  return page.evaluate(id => {
    const part = window.motorcycleLab.parts.get(id);
    let maxDifference = 0;
    for (const mesh of part.meshes) {
      const position = mesh.geometry.attributes.position.array;
      for (let i = 0; i < position.length; i++) maxDifference = Math.max(maxDifference,Math.abs(position[i] - mesh.userData.original[i]));
    }
    return { maxDifference,released: part.released,dent: part.dentAmount,parent: part.group.parent.name,position: part.group.getWorldPosition(part.group.position.clone()).toArray(),edited: part.editedSurfaces };
  },id);
}

async function visibleSurface(page,id) {
  return page.evaluate(async id => {
    const T = await import("/hospitalsim/vendor/build/three.module.js");
    const lab = window.motorcycleLab;
    const part = lab.parts.get(id);
    const bike = lab.parts.get("frame").group.parent;
    bike.updateMatrixWorld(true);
    const rect = lab.renderer.domElement.getBoundingClientRect();
    const ray = new T.Raycaster();
    for (const mesh of part.meshes) {
      const geometry = mesh.geometry,position = geometry.attributes.position;
      const count = geometry.index?.count ?? position.count;
      const step = Math.max(3,Math.floor(count / 450) * 3);
      for (let index = 0; index < count; index += step) {
        const point = new T.Vector3();
        for (let j = 0; j < 3; j++) point.add(new T.Vector3().fromBufferAttribute(position,geometry.index ? geometry.index.getX(index + j) : index + j));
        point.multiplyScalar(1/3).applyMatrix4(mesh.matrixWorld).project(lab.camera);
        const x = rect.x + (point.x + 1) * rect.width / 2,y = rect.y + (1 - point.y) * rect.height / 2;
        if (x < rect.x + 12 || x > rect.right - 12 || y < rect.y + 120 || y > rect.bottom - 120) continue;
        ray.setFromCamera(new T.Vector2(point.x,point.y),lab.camera);
        if (ray.intersectObject(bike,true)[0]?.object.userData.assembly === id) return { x,y };
      }
    }
    return null;
  },id);
}

async function dragGesture(page,context,point,dx,dy,touch) {
  if (touch) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent",{ type: "touchStart",touchPoints: [{ x: point.x,y: point.y }] });
    for (let step = 1; step <= 8; step++) await cdp.send("Input.dispatchTouchEvent",{ type: "touchMove",touchPoints: [{ x: point.x + dx * step / 8,y: point.y + dy * step / 8 }] });
    await cdp.send("Input.dispatchTouchEvent",{ type: "touchEnd",touchPoints: [] });
    await cdp.detach();
  } else {
    await page.mouse.move(point.x,point.y); await page.mouse.down();
    await page.mouse.move(point.x + dx,point.y + dy,{ steps: 8 }); await page.mouse.up();
  }
}

try {
  for (const [width,height] of [[1440,1000],[1024,768],[390,844],[320,740]]) {
    const context = await browser.newContext({ viewport: { width,height },hasTouch: width < 500,reducedMotion: width < 500 ? "reduce" : "no-preference",acceptDownloads: true });
    const page = await context.newPage();
    const errors = [], external = [];
    page.on("pageerror",error => errors.push(error.message));
    page.on("request",request => { if (!request.url().startsWith(base) && /^https?:/.test(request.url())) external.push(request.url()); });
    assert.equal((await page.goto(base + route,{ waitUntil: "networkidle" })).status(),200);
    await page.waitForFunction(() => document.querySelector("#scene")?.dataset.ready === "true",null,{ timeout: 45000 });
    await page.waitForTimeout(200);
    assert.equal(await page.locator("#part-select option").count(),15);
    assert.equal(await page.evaluate(() => window.motorcycleLab.stats.triangles),179747);
    assert.equal(await page.evaluate(() => window.motorcycleLab.stats.surfaces),83);
    assert.deepEqual(external,[],"The lab must load its renderer and model locally");
    await atTop(page,`${out}/${width}-assembled.png`);
    const canvas = page.locator("canvas");
    const beforeOrbit = await page.evaluate(() => window.motorcycleLab.camera.position.toArray());
    await canvas.focus();
    await page.keyboard.press("ArrowLeft");
    const afterOrbit = await page.evaluate(() => window.motorcycleLab.camera.position.toArray());
    assert.notDeepEqual(beforeOrbit,afterOrbit,"Keyboard orbit must move the actual camera");
    await page.locator('[data-view="three-quarter"]').click();

    await page.locator("#part-select").selectOption("front-fender");
    await setRange(page,"dent",85);
    const dented = await geometryState(page,"front-fender");
    assert.equal(dented.dent,85);
    assert.ok(dented.maxDifference > .01,"Deformation must alter actual vertices");
    assert.ok(dented.edited > 0);
    assert.equal((await geometryState(page,"rear-body")).maxDifference,0,"Front and rear bodywork must remain independently editable");
    await atTop(page,`${out}/${width}-dented.png`);
    await page.locator("#repair").click();
    assert.equal((await geometryState(page,"front-fender")).maxDifference,0);

    await page.locator("#part-select").selectOption("fork");
    const forkBefore = await geometryState(page,"fork"),wheelBefore = await geometryState(page,"front-wheel");
    await setRange(page,"pull",40);
    const forkAfter = await geometryState(page,"fork"),wheelAfter = await geometryState(page,"front-wheel");
    const forkDelta = forkAfter.position.map((value,i) => value - forkBefore.position[i]);
    const wheelDelta = wheelAfter.position.map((value,i) => value - wheelBefore.position[i]);
    assert.ok(Math.hypot(...forkDelta) > .1);
    assert.ok(forkDelta.every((value,i) => Math.abs(value - wheelDelta[i]) < .00001),"A connected front wheel must follow the fork");
    await page.locator("#pull").focus();
    await page.keyboard.press("End");
    assert.equal((await geometryState(page,"fork")).released,true);
    assert.equal((await geometryState(page,"front-wheel")).parent,"fork");
    await page.waitForFunction(() => !window.motorcycleLab.parts.get("fork").moving,null,{ timeout: 6000 });
    await page.locator("#fit-view").click();
    await atTop(page,`${out}/${width}-released.png`);
    await page.locator("#reset").click();
    assert.equal((await geometryState(page,"fork")).released,false);
    assert.equal((await geometryState(page,"fork")).parent,"frame");

    await atTop(page,`${out}/${width}-before-gesture.png`);
    await page.locator('[data-mode="dent"]').click();
    const contact = await visibleSurface(page,"front-fender");
    assert.ok(contact,"The front fender must expose an actual hittable surface");
    await dragGesture(page,context,contact,0,96,width < 500);
    assert.ok((await geometryState(page,"front-fender")).dent > 50,"A real pointer/touch gesture must deform the selected surface");
    assert.ok(await page.evaluate(() => window.motorcycleLab.actions.some(action => action.type === "local deformation" && action.source === "pointer" && action.point?.length === 3)));
    await page.locator("#reset").click();

    await atTop(page,`${out}/${width}-before-pull.png`);
    await page.locator('[data-mode="pull"]').click();
    const pullPoint = await visibleSurface(page,"front-fender");
    assert.ok(pullPoint);
    await page.mouse.move(pullPoint.x,pullPoint.y); await page.mouse.down();
    await page.mouse.move(pullPoint.x + 45,pullPoint.y - 12,{ steps: 6 });
    await canvas.dispatchEvent("pointercancel",{ pointerId: 1,pointerType: "mouse",isPrimary: true });
    await page.mouse.up();
    await page.waitForTimeout(width < 500 ? 100 : 900);
    assert.ok(await page.evaluate(() => window.motorcycleLab.actions.some(action => action.cancelled === true)),"Interrupted gestures must complete their record and release capture");
    await page.locator("#reset").click();

    await atTop(page,`${out}/${width}-before-release.png`);
    await page.locator('button[data-mode="pull"]').click();
    const releasePoint = await visibleSurface(page,"front-fender");
    assert.ok(releasePoint);
    await dragGesture(page,context,releasePoint,width < 500 ? 160 : 250,-10,width < 500);
    assert.equal((await geometryState(page,"front-fender")).released,true,"A real hard pull must release the selected visual connection");
    await page.waitForFunction(() => !window.motorcycleLab.parts.get("front-fender").moving,null,{ timeout: 6000 });
    assert.ok(await page.evaluate(type => window.motorcycleLab.actions.some(action => action.type === "released assembly moved" && action.pointerType === type),width < 500 ? "touch" : "mouse"));
    await page.locator("#fit-view").click();
    await atTop(page,`${out}/${width}-pull-released.png`);
    await page.locator("#reset").click();

    await setRange(page,"explode",65);
    assert.equal(await page.locator("#explode-value").innerText(),"65%");
    assert.ok((await geometryState(page,"front-wheel")).position.some((value,i) => Math.abs(value - wheelBefore.position[i]) > .1));
    await atTop(page,`${out}/${width}-exploded.png`);
    await page.locator("#part-select").selectOption("frame");
    assert.equal(await page.locator("#detach").isDisabled(),true);
    assert.equal(await page.locator("#pull").isDisabled(),true);
    await page.locator("#part-select").selectOption("cockpit");
    await page.locator('[data-view="cockpit"]').click();
    assert.ok(await page.evaluate(() => {
      const lab = window.motorcycleLab,point = lab.camera.position.clone();
      for (const mesh of lab.parts.get("cockpit").meshes) {
        const position = mesh.geometry.attributes.position;
        for (let index = 0; index < position.count; index++) {
          point.fromBufferAttribute(position,index).applyMatrix4(mesh.matrixWorld).project(lab.camera);
          if (Math.abs(point.x) > .99 || Math.abs(point.y) > .99) return false;
        }
      }
      return true;
    }),"The controls preset must keep both grips and levers in frame");
    await atTop(page,`${out}/${width}-controls.png`);
    await page.locator("#reset").click();
    assert.ok(await page.evaluate(() => [...window.motorcycleLab.parts.values()].every(part => !part.released && part.dentAmount === 0 && part.meshes.every(mesh => mesh.geometry.attributes.position.array.every((value,index) => value === mesh.userData.original[index]) && mesh.geometry.attributes.normal.array.every((value,index) => value === mesh.userData.originalNormals[index])))),"Reset must restore every vertex, authored normal and connection");
    assert.ok(await page.evaluate(() => [...window.motorcycleLab.parts.values()].every(part => part.meshes.every(mesh => [...mesh.geometry.attributes.position.array].every(Number.isFinite)))));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),`Overflow at ${width}`);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
    await writeFile(`${out}/${width}-axe.json`,JSON.stringify(axe.violations,null,2));
    assert.deepEqual(axe.violations.map(v => ({ id: v.id,nodes: v.nodes.map(n => n.target) })),[],`Accessibility violations at ${width}`);
    assert.deepEqual(errors,[]);
    if (width === 1440) {
      await page.locator(".record summary").click();
      const downloadPromise = page.waitForEvent("download");
      await page.locator("#export-record").click();
      const download = await downloadPromise;
      await download.saveAs(`${out}/scene-record.json`);
      const data = JSON.parse(await readFile(`${out}/scene-record.json`,"utf8"));
      assert.equal(data.asset.author,"Jacobdesigns");
      assert.equal(data.assemblies.length,15);
      assert.match(data.scope,/Not measured forces/);
      assert.ok(data.actions.some(action => action.source === "pointer"));
      for (const href of ["/motorcycle-mechanism-lab/MODEL.md","/motorcycle-mechanism-lab/provenance.json","/motorcycle-mechanism-lab/model/license.txt","/work/motorsport-neurotrauma-toolkit"]) assert.equal((await page.request.get(base + href)).status(),200);
      await page.locator(".record summary").click();
      await atTop(page,`${out}/1440-final.png`);
      const rendered = await page.evaluate(() => {
        const lab = window.motorcycleLab;
        lab.renderer.render(lab.parts.get("frame").group.parent.parent,lab.camera);
        return lab.renderer.domElement.toDataURL("image/png");
      });
      await writeFile(`${out}/model-render.png`,Buffer.from(rendered.split(",")[1],"base64"));
    }
    results.push({ browser: "Chrome hardware WebGL",width,height,touch: width < 500,reducedMotion: width < 500,triangles: 179747,assemblies: 15,editableSurfaces: 83,meshDeformation: true,independentBodywork: true,childConnections: true,releaseAndSettle: true,gestureRelease: true,pointerAndCancellation: true,resetGeometryAndNormals: true,axeViolations: 0 });
    await context.close();
  }
  for (const scenario of ["no-javascript","model-blocked","webgl-disabled"]) {
    const context = await browser.newContext({ viewport: { width: 390,height: 844 },javaScriptEnabled: scenario !== "no-javascript" });
    const page = await context.newPage();
    if (scenario === "model-blocked") await page.route("**/motorcycle-mechanism-lab/model/**",route => route.abort());
    if (scenario === "webgl-disabled") await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type,...args) { return /^webgl/.test(type) ? null : original.call(this,type,...args); }; });
    await page.goto(base + route,{ waitUntil: "networkidle" });
    await page.locator(".poster").evaluate(img => img.decode());
    assert.equal(await page.locator(".poster").isVisible(),true);
    assert.equal(await page.locator("#pull").isDisabled(),true);
    if (scenario !== "no-javascript") { await page.waitForFunction(() => document.querySelector("#load-status")?.textContent.includes("unavailable")); }
    assert.doesNotMatch(await page.locator("#asset-stat").innerText(),/loading/i);
    assert.equal(await page.getByRole("link",{ name: "Model, sources & limitations" }).isVisible(),true);
    await atTop(page,`${out}/${scenario}.png`);
    results.push({ scenario,poster: true,disabledEnhancedControls: true,sources: true });
    await context.close();
  }
} finally { await browser.close(); }

const safari = await webkit.launch();
try {
  const page = await safari.newPage({ viewport: { width: 390,height: 844 },hasTouch: true,reducedMotion: "reduce" });
  await page.goto(base + route,{ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector("#scene")?.dataset.ready === "true" || document.querySelector("#load-status")?.textContent.includes("unavailable"),null,{ timeout: 45000 });
  const rendered = await page.locator("#scene").getAttribute("data-ready") === "true";
  if (rendered) { await page.locator("#part-select").selectOption("seat"); await setRange(page,"dent",65); assert.ok((await geometryState(page,"seat")).maxDifference > .001); }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await atTop(page,`${out}/webkit-390.png`);
  results.push({ browser: "WebKit",width: 390,height: 844,touch: true,reducedMotion: true,rendered,usableFallback: !rendered });
} finally { await safari.close(); }

await writeFile(`${out}/results.json`,JSON.stringify({ base,checkedAt: new Date().toISOString(),results },null,2));
console.log(JSON.stringify(results,null,2));
