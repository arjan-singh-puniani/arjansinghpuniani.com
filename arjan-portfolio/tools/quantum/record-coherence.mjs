import { chromium } from "playwright";
import { copyFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chromium" });
try {
  await mkdir("/tmp/quantum-coherence-video", { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    recordVideo: {
      dir: "/tmp/quantum-coherence-video",
      size: { width: 1440, height: 1100 },
    },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);
  await page.goto(
    (process.env.QUANTUM_BASE_URL || "http://127.0.0.1:8865") +
      "/quantum-computer-lab/index.html#compute",
  );
  await page.waitForFunction(() => window.quantumLab?.snapshot().cursor === 1);
  await page.locator("#inspect-coherence").click();
  await page.locator("#bell-phase-experiment").click();
  await page
    .locator("#coherent-stage")
    .evaluate((el) =>
      el.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await page.waitForTimeout(800);
  for (let k = 1; k <= 45; k++) {
    await page.locator("#stage-bell-phase").evaluate(
      (el, value) => {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      },
      (Math.PI / 2) * (k / 45),
    );
    await page.waitForTimeout(35);
  }
  await page.waitForTimeout(850);
  await page.screenshot({
    path: "Documentation/Validation/Quantum/coherence-phase-main.png",
  });
  await page.locator("#inspect-coherence").click();
  await page
    .locator("#coherence-inspector")
    .evaluate((el) =>
      el.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await page.waitForTimeout(900);
  await page.screenshot({
    path: "Documentation/Validation/Quantum/coherence-phase-inspector.png",
  });
  await page.locator('[data-coherence-basis="XY"]').click();
  await page.waitForFunction(() => quantumLab.snapshot().shotProgress === 1);
  await page
    .locator(".readout-panel")
    .evaluate((el) =>
      el.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await page.waitForTimeout(1100);
  const video = page.video();
  await context.close();
  await copyFile(
    await video.path(),
    "Documentation/Validation/Quantum/bell-phase-experiment.webm",
  );
  console.log(
    "Saved Documentation/Validation/Quantum/bell-phase-experiment.webm",
  );
} finally {
  await browser.close();
}
