import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { deviceActions, anatomyFocus } from '../../lib/device-action';
import { parseFDAUpdates } from '../../lib/fda-updates';
import { readFileSync } from 'node:fs';

test("body callout to anatomy, evidence, history, comparison, research and export", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("group", { name: "Whole-body intervention map" }),
  ).toBeVisible();
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
    { timeout: 45000 },
  );
  await expect(page.getByTestId("human-reference")).toHaveAttribute(
    "data-internal-status",
    "loaded",
    { timeout: 45000 },
  );
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-atlas.png`,
    fullPage: true,
  });
  // This is an HTML callout anchored inside the rendered body, not the sidebar.
  await page.getByRole("button", { name: "Show region labels" }).click();
  await page.getByRole("button", { name: /Brain — \d+ approaches/ }).click();
  await expect(page.locator(".map-breadcrumb")).toContainText("Brain");
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
    { timeout: 45000 },
  );
  await page
    .locator(".brain-shortcuts")
    .getByRole("button", { name: /Thalamus/ })
    .click();
  await page
    .getByRole("button", { name: "Inspect Activa Tremor Control System" })
    .click();
  const inspector = page.getByRole("complementary", {
    name: "Interventions and evidence",
  });
  await expect(
    inspector.getByText("Model 7424 pulse generator", { exact: true }),
  ).toBeVisible();
  await inspector
    .getByRole("button", { name: /Explore Chest implants for Model 7424/ })
    .click();
  await expect(page.locator(".map-breadcrumb")).toContainText("Chest implants");
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
  );
  const generator = inspector
    .locator("article")
    .filter({ hasText: "Model 7424 pulse generator" });
  await generator.getByText("Evidence", { exact: true }).click();
  await expect(
    generator.getByText(/subclavicular or subcostal/).first(),
  ).toBeVisible();
  await expect(
    generator.getByRole("link", { name: "Original source" }),
  ).toHaveAttribute("href", /P960009B.pdf/);
  await page.getByRole("button", { name: "Focus brain" }).click();
  await page
    .locator(".brain-shortcuts")
    .getByRole("button", { name: /Thalamus/ })
    .click();
  await page
    .getByRole("slider", { name: "Documented history through year" })
    .fill("1999");
  await expect(page.getByRole("slider", { name: "Documented history through year" })).toHaveAttribute("min", "1999");
  await expect(page.locator(".atlas-events")).toContainText("1997");
  await page
    .getByRole("slider", { name: "Documented history through year" })
    .fill("2026");
  await page.getByRole("button", { name: /^Compare 2$/ }).click();
  await expect(page.getByRole("table")).toContainText("ExAblate Neuro");
  await expect(page.getByRole("table")).toContainText("PMA approval");
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "Export comparison", exact: true })
    .click();
  expect((await downloadEvent).suggestedFilename()).toBe("body-atlas-brief.md");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: /^Records \d+$/ }).click();
  await page
    .getByRole("textbox", { name: "Search source records" })
    .fill("P100026");
  await page.getByRole("button", { name: /FDA:P100026/ }).click();
  await expect(
    page.getByRole("link", { name: "NEUROPACE RNS SYSTEM" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Questions", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search the indexed evidence" })
    .fill("Which authorized devices interface with the vagus nerve?");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    "VNS",
  );
  await expect(
    page
      .getByRole("dialog")
      .getByRole("status")
      .getByRole("link", { name: "VNS THERAPY SYSTEM" }),
  ).toHaveAttribute("href", /P970003/);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Atlas", exact: true }).click();
  await page.getByRole("combobox", { name:"Explore anatomical region" }).selectOption("UBERON:0001844");
  await page
    .getByRole("button", { name: /Inspect Nucleus Multichannel/ })
    .click();
  await expect(
    inspector.getByText("No location assigned", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("body surface itself selects; repeated view controls and source search respond", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
    { timeout: 45000 },
  );
  await page.getByRole("button", { name: "Show region labels" }).click();
  const canvas = page.locator("canvas");
  const box = (await canvas.boundingBox())!;
  // A body-surface hit must select a region; its exact screen position varies by viewport.
  await canvas.click({
    position: { x: box.width * 0.5, y: box.height * 0.14 },
  });
  await expect(page.locator(".map-breadcrumb")).not.toHaveText("Human");
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
    { timeout: 45000 },
  );
  await page.getByRole("button", { name: "Show whole human" }).click();
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
  );
  await page.getByRole("button", { name: "Show whole human" }).click();
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
  );
  await page.getByRole("button", { name: "Atlas", exact: true }).click();
  const search = page.getByRole("textbox", {
    name:
      testInfo.project.name === "mobile"
        ? "Find an intervention on mobile"
        : "Find an intervention",
    exact: true,
  });
  await page.getByRole("combobox",{name:"Explore anatomical region",exact:true}).selectOption("all");
  await search.fill("NeuroPace");
  await expect(
    page.getByRole("button", { name: "Inspect NeuroPace RNS System" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Inspect Activa Tremor Control System" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Inspect NeuroPace RNS System" })
    .click();
  await page.getByRole("button", { name: "Brief", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Unresolved questions" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Export Markdown" }),
  ).toHaveAttribute("href", /ids=rns/);
});

test("accessibility, keyboard tabs and modal focus", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
    { timeout: 45000 },
  );
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Inspect NeuroPace RNS System" })
    .click();
  await page.getByRole("tab", { name: "Anatomy", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", {name:"Dossier",exact:true})).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Sources", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("tab", { name: "Sources", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Sources and model" }).click();
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Sources and model" }),
  ).toBeFocused();
});

test("API boundaries, citation export and performance evidence", async ({
  request,
  page,
}, testInfo) => {
  const t = Date.now();
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const query = await request.get(
    "/api/search?q=Which%20authorized%20devices%20interface%20with%20the%20vagus%20nerve",
  );
  expect(query.status()).toBe(200);
  expect(
    (await query.json()).records.some(
      (r: { id: string }) => r.id === "FDA:P970003:",
    ),
  ).toBeTruthy();
  expect((await request.get("/api/search?q=" + "a".repeat(501))).status()).toBe(
    400,
  );
  expect((await request.get("/api/brief?ids=../../etc/passwd")).status()).toBe(
    400,
  );
  expect((await request.get("/api/source/" + "0".repeat(64))).status()).toBe(
    404,
  );
  const markdown = await request.get("/api/brief?ids=rns");
  expect(await markdown.text()).toContain("P100026");
  expect(markdown.headers()["content-type"]).toContain("text/markdown");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["content-security-policy"]).toContain(
    "object-src 'none'",
  );
  await page.goto("/");
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
    { timeout: 45000 },
  );
  const metrics = await page.evaluate(() => ({
    navigation: performance
      .getEntriesByType("navigation")
      .map((n) => n.toJSON()),
    resources: performance
      .getEntriesByType("resource")
      .filter((r) => r.name.includes("body.glb"))
      .map((r) => r.toJSON()),
    heap: (performance as Performance & { memory?: { usedJSHeapSize: number } })
      .memory?.usedJSHeapSize,
    paint: performance.getEntriesByType("paint").map((p) => p.toJSON()),
  }));
  await testInfo.attach("performance.json", {
    body: JSON.stringify({ elapsed: Date.now() - t, metrics }, null, 2),
    contentType: "application/json",
  });
});

test("body asset failure preserves region selection and brief export", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/anatomy/body.glb", (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByText("3D unavailable. Select a region:"),
  ).toBeVisible();
  await expect(page.getByTestId("scene-status")).toContainText(
    "3D unavailable",
  );
  await page
    .getByRole("button", { name: /Inspect NeuroPace RNS System/ })
    .click();
  await expect(
    page.getByText("RNS-300M neurostimulator", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Brief", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Unresolved questions" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Export Markdown" }),
  ).toHaveAttribute("href", /ids=rns/);
});

test("region results and original links stay visible in the compact split preview", async ({
  page,
}) => {
  await page.setViewportSize({ width: 540, height: 680 });
  await page.goto("/");
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
    { timeout: 45000 },
  );
  await page.getByRole("button", { name: "Show region labels" }).click();
  await page.getByRole("button", { name: /Brain —/ }).click();
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
    { timeout: 45000 },
  );
  await page.screenshot({ path: "test-results/compact-region-preview.png" });
  const panel = page.getByRole("complementary", {
    name: "Interventions and evidence",
  });
  const bounds = await panel.boundingBox();
  expect(bounds!.y).toBeLessThan(450);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(681);
  await expect(
    panel.getByRole("button", { name: "Inspect NeuroStar TMS Therapy System" }),
  ).toBeInViewport();
  await expect(
    panel.getByRole("link", { name: "FDA K130233" }),
  ).toBeInViewport();
  await panel
    .getByRole("button", { name: "Inspect NeuroPace RNS System" })
    .click();
  await expect(panel.getByRole("link", { name: "FDA P100026" })).toBeVisible();
  await expect(
    panel.getByRole("link", { name: "Device description" }),
  ).toHaveAttribute("href", /P100026B.pdf/);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await panel
    .getByRole("combobox", {
      name: "Choose another intervention in this region",
    })
    .selectOption("activa");
  await expect(
    panel.getByText("Activa Tremor Control System", { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByRole("link", { name: "FDA P960009" }),
  ).toHaveAttribute("href", /P960009/);
  await page
    .getByRole("slider", { name: "Documented history through year" })
    .fill("1999");
  await expect(panel.getByText("Through 1999")).toBeVisible();
  await panel.getByRole("button", { name: "Show all years" }).click();
  await expect(page.getByRole("slider")).toHaveValue("2026");
  await page.getByRole("button", { name: "Expand 3D anatomy" }).click();
  await expect(page.locator("#intervention-results")).toHaveAttribute(
    "inert",
    "",
  );
  await page
    .getByRole("button", { name: "Show interventions alongside anatomy" })
    .click();
  await expect(page.locator("#intervention-results")).not.toHaveAttribute(
    "inert",
    "",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("on-model innovation labels select facts and original sources without leaving anatomy", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
    { timeout: 45000 },
  );
  await page.getByRole("combobox", {name:testInfo.project.name==='mobile'?'Map evidence layer':'Evidence layer',exact:true}).selectOption('reviewed');
  await page.getByRole("button", {name:"Show intervention callouts"}).click();
  const annotations = page.getByRole("group", {
    name: "Interventions on anatomy",
  });
  await expect(annotations).toBeVisible();
  const activa = annotations.getByRole("button", {
    name: "Select Activa Tremor Control System on anatomy",
  });
  if ((await activa.count()) === 0)
    await annotations
      .getByRole("button", { name: "Next intervention labels" })
      .click();
  if (testInfo.project.name === "mobile") await activa.tap();
  else await activa.click();
  await expect(activa).toHaveAttribute("aria-pressed", "true");
  const panel = page.getByRole("complementary", {
    name: "Interventions and evidence",
  });
  await expect(
    panel.getByText(
      "Implanted electrodes stimulate thalamic VIM for tremor suppression.",
    ),
  ).toBeVisible();
  await expect(
    annotations.getByRole("link", {
      name: "Original source for Activa Tremor Control System",
    }),
  ).toHaveAttribute("href", /P960009B.pdf/);
  const line = page.locator(".intervention-leaders .leader-selected path");
  const before = await line.getAttribute("d");
  const box = (await page.locator("canvas").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.72);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.73, {
    steps: 12,
  });
  await page.mouse.up();
  await expect.poll(() => line.getAttribute("d")).not.toBe(before);
  await expect(activa).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Expand 3D anatomy" }).click();
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")!.getBoundingClientRect().height > 400,
  );
  const rns = annotations.getByRole("button", {
    name: "Select NeuroPace RNS System on anatomy",
  });
  await rns.click();
  const quick = page.getByRole("region", {
    name: "Selected intervention on anatomy",
  });
  await expect(
    quick.getByRole("heading", { name: "Responsive neurostimulation" }),
  ).toBeVisible();
  await expect(
    quick.getByText(/Records brain electrical activity/),
  ).toBeVisible();
  await expect(
    quick.getByRole("link", { name: "Original source", exact: true }),
  ).toHaveAttribute("href", /P100026B.pdf/);
  await expect(page.locator("#intervention-results")).toHaveAttribute(
    "inert",
    "",
  );
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-innovation-labels.png`,
  });
  await page
    .getByRole("button", { name: "Show interventions alongside anatomy" })
    .click();
  await page.getByRole("button", { name: "Focus brain" }).click();
  await expect(page.getByTestId("scene-status")).toContainText(
    "Reference loaded",
    { timeout: 45000 },
  );
  const brainActiva = page.getByRole("button", {
    name: "Select Activa Tremor Control System on anatomy",
  });
  if ((await brainActiva.count()) === 0)
    await page
      .getByRole("group", { name: "Interventions on anatomy" })
      .getByRole("button", { name: "Next intervention labels" })
      .click();
  await brainActiva.focus();
  await page.keyboard.press("Enter");
  await expect(brainActiva).toHaveAttribute("aria-pressed", "true");
  await expect(
    panel.getByText("Activa Tremor Control System", { exact: true }),
  ).toBeVisible();
  expect(
    await page
      .getByRole("button", { name: /Select Nucleus.*on anatomy/ })
      .count(),
  ).toBe(0);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page
    .getByRole("slider", { name: "Documented history through year" })
    .fill("1999");
  await expect(brainActiva).toBeVisible();
  await expect(page.getByRole("button", { name: "Select NeuroPace RNS System on anatomy" })).toHaveCount(0);
  await page.getByRole("slider", { name: "Documented history through year" }).fill("2026");
  await page.getByRole("button", { name: "Play history" }).click();
  await expect.poll(async () => Number(await page.locator("#atlas-year").inputValue())).toBeLessThan(2004);
  await page.getByRole("button", { name: "Pause history" }).click();
});


test("dense whole-body catalogue opens authentic evidence, region filtering and cited export",async({page,request},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.getByTestId('human-reference')).toHaveAttribute('data-organs-status','loaded',{timeout:45000});
 await page.getByRole('combobox',{name:testInfo.project.name==='mobile'?'Map evidence layer':'Evidence layer',exact:true}).selectOption('all');
 const map=page.getByRole('group',{name:'Whole-body intervention map'});
 await expect(map).toBeVisible();expect(await map.locator('.record-node').count()).toBeGreaterThan(500);
 await expect(map.getByText('Dots are indexed records, not implant sites.')).toBeVisible();
 await page.screenshot({path:`test-results/${testInfo.project.name}-whole-body.png`});
 if(testInfo.project.name==='desktop'){
  await map.locator('.node-reviewed').first().click();
  await expect(page.locator('.device-intro h2')).toContainText('Transcranial magnetic stimulation');
  await page.getByRole('button',{name:'Interventions',exact:true}).click();
 }else{
  await map.getByRole('button',{name:/Explore Heart —/}).tap();
  await expect(page.locator('.map-breadcrumb')).toContainText('Heart');
 }
 // All regions remain reachable through the native selector, including those decluttered on mobile.
 await page.getByRole('combobox',{name:'Explore anatomical region'}).selectOption('BODY:heart');
 await expect(page.locator('.map-breadcrumb')).toContainText('Heart');
 const panel=page.getByRole('complementary',{name:'Interventions and evidence'});
 expect(await panel.locator('.catalogue-badge').count()).toBeGreaterThan(50);
 await panel.locator('.choose-intervention').first().click();
 await expect(panel.locator('.catalogue-banner')).toContainText('Provisional');
 const source=panel.locator('.direct-evidence a').first();
 await expect(source).toHaveAttribute('href',/^https:\/\/www.accessdata.fda.gov\//);
 const text=await panel.locator('.device-action').innerText();expect(text.trim().length).toBeGreaterThan(0);
 const id=await panel.locator('.device-switch select').inputValue();
 const md=await request.get('/api/brief?ids='+encodeURIComponent(id));expect(md.ok()).toBeTruthy();
 expect(await md.text()).toContain('FDA source context (unreviewed)');expect(await md.text()).toContain('Provisional');
 await page.screenshot({path:`test-results/${testInfo.project.name}-heart-evidence.png`});
 await page.getByRole('button',{name:'Interventions',exact:true}).click();
 await page.getByRole('combobox',{name:'Explore anatomical region'}).selectOption('BODY:knee');
 await expect(panel.locator('.catalogue-badge').first()).toBeVisible();
 await page.getByRole('combobox',{name:'Explore anatomical region'}).selectOption('BODY:uterus');
 await expect(page.locator('.map-breadcrumb')).toContainText('Uterus');
 await expect(panel.locator('.catalogue-badge').first()).toBeVisible();
 // Female-only structures are indexed as text, never placed on this male reference.
 expect(await map.getByRole('button',{name:/Explore Uterus/}).count()).toBe(0);
 await page.getByRole('combobox',{name:'Explore anatomical region'}).selectOption('all');
 await page.getByRole('combobox',{name:testInfo.project.name==='mobile'?'Map evidence layer':'Evidence layer',exact:true}).selectOption('reviewed');
 await expect(page.locator('.catalogue-badge')).toHaveCount(0);expect(await map.locator('.record-node').count()).toBe(9);
 expect(errors).toEqual([]);
});

test('body contour switches and rotates while evidence retains its source',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const scene=page.getByTestId('human-reference');
 await expect(scene).toHaveAttribute('data-avatar-status','loaded',{timeout:45000});
 await expect(scene).toHaveAttribute('data-exterior','adapted');
 await expect(page.locator('body')).not.toContainText(/Arjan|personal contour/i);
 await expect(scene).toHaveAttribute('data-internal-status','loaded',{timeout:45000});
 await expect(scene).toHaveAttribute('data-organs-status','loaded',{timeout:45000});
 await page.getByRole('button',{name:'Toggle internal organs',exact:true}).click();
 await expect(scene).toHaveAttribute('data-internal-status','hidden');
 await expect(scene).toHaveAttribute('data-organs-status','hidden');
 await page.getByRole('button',{name:'Toggle body surface',exact:true}).click();
 await expect(page.getByRole('button',{name:'Toggle body surface',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.screenshot({path:`test-results/${testInfo.project.name}-surface-contours.png`});
 await page.getByRole('button',{name:'Toggle internal organs',exact:true}).click();
 await expect(scene).toHaveAttribute('data-internal-status','loaded');
 const before=await page.locator('canvas').screenshot();
 const box=(await page.locator('canvas').boundingBox())!;
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.6);await page.mouse.down();
 await page.mouse.move(box.x+box.width*.7,box.y+box.height*.6,{steps:12});await page.mouse.up();
 await expect.poll(async()=>Buffer.compare(before,await page.locator('canvas').screenshot())).not.toBe(0);
 await page.getByRole('button',{name:'Show HRA reference exterior',exact:true}).click();
 await expect(scene).toHaveAttribute('data-exterior','reference');await expect(scene).toHaveAttribute('data-avatar-status','loaded');
 await page.getByRole('button',{name:'Show adapted body contour',exact:true}).click();
 await expect(scene).toHaveAttribute('data-exterior','adapted');await expect(scene).toHaveAttribute('data-avatar-status','loaded');
 await page.getByRole('button',{name:/Inspect NeuroPace RNS System/}).click();
 await expect(page.getByRole('link',{name:/FDA P100026/}).first()).toHaveAttribute('href',/accessdata.fda.gov/);
 await page.screenshot({path:`test-results/${testInfo.project.name}-personal-exterior.png`,fullPage:true});
 expect(errors).toEqual([]);
});

test('unavailable body contour falls back to the original reference',async({page})=>{
 await page.route('**/anatomy/contour.glb',route=>route.abort());await page.goto('/');
 await expect(page.getByText('Body contour unavailable · reference exterior shown')).toBeVisible({timeout:45000});
 await expect(page.getByTestId('human-reference')).toHaveAttribute('data-exterior','reference');
 await expect(page.getByTestId('scene-status')).toContainText('Reference loaded',{timeout:45000});
 await page.getByRole('button',{name:/Inspect NeuroPace RNS System/}).click();
 await expect(page.getByRole('link',{name:/FDA P100026/}).first()).toHaveAttribute('href',/accessdata.fda.gov/);
});


test('shareable contour is an upper-body view with working copy and atlas navigation',async({page,context},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?view=portrait&entry=rns&unused=discard#discard');
 const scene=page.getByTestId('human-reference');
 await expect(scene).toHaveAttribute('data-presentation','portrait');
 await expect(scene).toHaveAttribute('data-avatar-status','loaded',{timeout:45000});
 await expect(scene).toHaveAttribute('data-internal-status','hidden');
 await expect(scene).toHaveAttribute('data-organs-status','hidden');
 await expect(page.getByRole('heading',{name:'Holographic contour',exact:true})).toBeVisible();
 await expect(page.getByRole('slider')).toHaveCount(0);
 await expect(page.getByRole('complementary',{name:'Interventions and evidence'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Inspect NeuroPace RNS System',exact:true})).toHaveCount(0);
 await expect(page.locator('body')).not.toContainText(/Arjan|personal contour/i);
 const canvas=page.locator('canvas'),before=await canvas.screenshot(),box=(await canvas.boundingBox())!;
 expect(box.height).toBeGreaterThan(page.viewportSize()!.height*.5);
 await page.screenshot({path:`test-results/${testInfo.project.name}-share-front.png`});
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.5,{steps:12});await page.mouse.up();
 await expect.poll(async()=>Buffer.compare(before,await canvas.screenshot())).not.toBe(0);
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.getByRole('button',{name:'Copy share link',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Share link copied');
 const copied=await page.evaluate(()=>navigator.clipboard.readText());expect(new URL(copied).search).toBe('?view=portrait');expect(new URL(copied).hash).toBe('');
 await page.screenshot({path:`test-results/${testInfo.project.name}-share-contour.png`});
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);
 await page.getByRole('button',{name:'Reset view',exact:true}).click();await expect(scene).toHaveAttribute('data-avatar-status','loaded',{timeout:45000});
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard denied')}}}));await page.reload();
 await page.getByRole('button',{name:'Copy share link',exact:true}).click();await expect(page.getByRole('textbox',{name:'Share link',exact:true})).toHaveValue(copied);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
 await page.getByRole('link',{name:'Explore atlas',exact:true}).click();await expect(page.getByRole('slider')).toHaveAttribute('min','1999');
 await page.getByRole('button',{name:'Sources and model',exact:true}).click();await expect(page.getByRole('link',{name:/Open shareable contour view/})).toHaveAttribute('href','/?view=portrait');
 expect(errors).toEqual([]);
});


test('overview names interventions on the body and opens their original evidence',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 const map=page.getByRole('group',{name:'Whole-body intervention map'});
 await expect(page.getByTestId('human-reference')).toHaveAttribute('data-avatar-status','loaded',{timeout:45000});
 await expect(map.locator('.constellation-intervention').first()).toBeVisible({timeout:45000});
 const labels=map.locator('.constellation-intervention');expect(await labels.count()).toBeGreaterThanOrEqual(testInfo.project.name==='desktop'?10:4);
 await expect(map.getByRole('button',{name:'Select NeuroPace RNS System from body map',exact:true})).toBeVisible();
 expect(await map.locator('.record-node').count()).toBeGreaterThan(50);
 const first=labels.first(),id=await first.getAttribute('data-family');
 await expect(first.getByRole('link',{name:/Original source for/})).toHaveAttribute('href',/^https:\/\//);
 await first.getByRole('button',{name:/Select .* from body map/}).click();
 await expect(page.locator('.device-intro h2')).toBeVisible();
 await expect(page.locator('.atlas-events button').first()).toHaveAttribute('data-family',id!);
 expect(await page.locator('.atlas-events button').evaluateAll(nodes=>nodes.every(n=>n.getAttribute('data-family')===nodes[0].getAttribute('data-family')))).toBe(true);
 await expect(page.locator('.atlas-events button').first()).toHaveAttribute('data-family',id!);
 await expect(map.locator(`.constellation-intervention[data-family="${id}"] .constellation-select`)).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.direct-evidence a').first()).toHaveAttribute('href',/^https:\/\//);
 await page.screenshot({path:`test-results/${testInfo.project.name}-named-map.png`});
 const more=map.getByRole('button',{name:/Explore all .* interventions in/});
 if(await more.count()){
  await more.first().click();await expect(page.locator('.map-breadcrumb')).not.toHaveText('Human');
  await expect(map.locator('.constellation-intervention').first()).toBeVisible();
 }
 await page.getByRole('combobox',{name:'Explore anatomical region',exact:true}).selectOption('BODY:heart');
 await expect(map.locator('.constellation-intervention').first()).toBeVisible();
 const seen=new Set<string>();let next=map.getByRole('button',{name:'Next mapped interventions',exact:true});
 for(let i=0;i<20;i++){
  for(const x of await map.locator('.constellation-intervention').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-family')!)))seen.add(x);
  if(!await next.count()||await next.isDisabled())break;
  await next.click();
 }
 expect(seen.size).toBe(12);
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});

test('selected intervention focuses reference anatomy with source-grounded mechanism and honest FDA refresh',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?entry=rns&panel=mechanism');
 const scene=page.getByTestId('human-reference'),panel=page.getByRole('region',{name:'Anatomy and mechanism'});
 await expect(scene).toHaveAttribute('data-avatar-status','loaded',{timeout:45000});
 await expect(scene).toHaveAttribute('data-focus-region','UBERON:0000955');
 await expect(scene).toHaveAttribute('data-action-kind','recording');
 await expect(panel).toContainText('Sense brain electrical activity');
 await expect(panel.getByRole('link',{name:'Mechanism source',exact:true})).toHaveAttribute('href',/P100026B.pdf/);
 await panel.getByRole('button',{name:'Play mechanism',exact:true}).click();
 await expect(panel.getByRole('button',{name:'Pause mechanism',exact:true})).toHaveAttribute('aria-pressed','true');
 await panel.getByRole('button',{name:'Pause mechanism',exact:true}).click();
 await page.screenshot({path:`test-results/${testInfo.project.name}-rns-mechanism.png`});
 const source=parseFDAUpdates('P100026',readFileSync('tests/fixtures/fda-p100026-20261027.json','utf8'),'2026-10-27T23:00:00Z');let calls=0;
 await page.route('**/api/fda?application=P100026',route=>{calls++;return calls===1?route.fulfill({json:source}):route.fulfill({status:503,json:{error:'Provider unavailable'}});});
 const updates=page.getByRole('region',{name:'Latest public FDA decisions'});
 await updates.getByRole('button',{name:'Check FDA updates',exact:true}).click();
 await expect(updates.getByRole('link',{name:/P100026S104/})).toHaveAttribute('href',/id=P100026S104$/);
 await expect(updates).toContainText('PMA supplement · OK30');
 await updates.getByRole('button',{name:'Check again',exact:true}).click();
 await expect(updates.getByRole('status')).toContainText('unavailable');
 await expect(updates.getByRole('link',{name:/P100026S104/})).toBeVisible();
 for(const [id,action] of Object.entries(deviceActions)){
   await page.getByRole('combobox',{name:'Choose another intervention in this region'}).selectOption(id);
   await expect(scene).toHaveAttribute('data-focus-region',anatomyFocus(id)!.region);
   await expect(scene).toHaveAttribute('data-action-kind',action.kind);
   await expect(panel).toContainText(action.steps[0]);
   await expect(panel).toContainText('not device shape or implant placement');
   await expect(panel.getByRole('link',{name:'Mechanism source',exact:true})).toHaveAttribute('href',action.sourceUrl);
 }
 await page.screenshot({path:`test-results/${testInfo.project.name}-hip-mechanism.png`});
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(panel.getByRole('button',{name:'Play mechanism',exact:true})).toBeDisabled();
 await panel.getByRole('button',{name:'Mechanism overlay',exact:true}).click();
 await expect(scene).toHaveAttribute('data-action-kind','none');
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
