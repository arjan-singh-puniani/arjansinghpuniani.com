import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const base = "http://127.0.0.1:3100";
const latencies = [];
for (let i = 0; i < 30; i++) {
  const start = performance.now();
  const r = await fetch(
    base +
      "/api/search?q=" +
      encodeURIComponent(i % 2 ? "vagus nerve" : "focal cortical cooling"),
  );
  if (!r.ok) throw new Error("Search failed");
  await r.json();
  latencies.push(performance.now() - start);
}
latencies.sort((a, b) => a - b);
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto(base);
  await page
    .getByTestId("scene-status")
    .filter({ hasText: "Reference loaded" })
    .waitFor({ timeout: 45000 });
  await page.getByTestId("human-reference").filter({has:page.locator("canvas")}).waitFor();
  await page.waitForFunction(()=>document.querySelector("[data-internal-status]")?.getAttribute("data-internal-status")==="loaded");
  await page.waitForFunction(()=>document.querySelector("[data-organs-status]")?.getAttribute("data-organs-status")==="loaded");
  await page.screenshot({
    path: "validation/screenshots/desktop-viewport.png",
  });
  const box = await page.locator(".figure-canvas").boundingBox();
  if (!box) throw new Error("Missing scene");
  await page.evaluate(() => {
    window.__atlasFrameTimes = [];
    let previous = performance.now();
    window.__atlasMeasuring = true;
    function frame(t) {
      if (!window.__atlasMeasuring) return;
      window.__atlasFrameTimes.push(t - previous);
      previous = t;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.55, {
    steps: 40,
  });
  await page.mouse.up();
  const frames = await page.evaluate(() => {
    window.__atlasMeasuring = false;
    return window.__atlasFrameTimes;
  });
  const ordered = frames.filter((x) => x > 0).sort((a, b) => a - b);
  const report = {
    measuredAt: new Date().toISOString(),
    heapAfterAllGeometry: await page.evaluate(()=>performance.memory?.usedJSHeapSize),
    geometry: await page.evaluate(()=>performance.getEntriesByType("resource").filter(r=>/anatomy\/(body|nervous|organs)\.glb/.test(r.name)).map(r=>({asset:r.name.split("/").pop(),durationMs:r.duration,transferSize:r.transferSize,decodedBodySize:r.decodedBodySize}))),
    environment:
      "Local loopback production server, installed Chrome, no CPU or network throttle",
    search: {
      requests: 30,
      p50Ms: latencies[15],
      p95Ms: latencies[28],
      maxMs: latencies[29],
    },
    orbit: {
      samples: ordered.length,
      p50FrameIntervalMs: ordered[Math.floor(ordered.length * 0.5)],
      p95FrameIntervalMs: ordered[Math.floor(ordered.length * 0.95)],
      note: "requestAnimationFrame intervals during scripted mouse orbit; not an independently measured GPU frame rate or physical-device benchmark.",
    },
  };
  writeFileSync(
    "validation/interaction-benchmark.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
