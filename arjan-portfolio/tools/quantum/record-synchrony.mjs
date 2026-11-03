import { chromium } from "playwright";
import { copyFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chromium" });
try {
  await mkdir("/tmp/quantum-synchrony-video", { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: {
      dir: "/tmp/quantum-synchrony-video",
      size: { width: 1440, height: 1000 },
    },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(
    (process.env.QUANTUM_BASE_URL || "http://127.0.0.1:8865") +
      "/quantum-computer-lab/index.html#compute",
  );
  await page.waitForFunction(() => window.quantumLab?.snapshot().cursor === 1);
  await page
    .locator("#coherent-stage")
    .evaluate((e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.waitForTimeout(1000);
  await page.locator("#coherent-play").click();
  await page
    .locator("#coherent-stage")
    .evaluate((e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.waitForFunction(() => {
    const s = quantumLab.snapshot();
    return s.cursor === 1 && s.fraction > 0.48 && s.fraction < 0.85;
  });
  await page.screenshot({
    path: "Documentation/Validation/Quantum/synchrony-hadamard-live.png",
  });
  await page.waitForFunction(() => {
    const s = quantumLab.snapshot();
    return s.cursor === 2 && s.fraction > 0.48 && s.fraction < 0.7;
  });
  await page.screenshot({
    path: "Documentation/Validation/Quantum/synchrony-entangling-live.png",
  });
  await page.waitForFunction(() => {
    const s = quantumLab.snapshot();
    return (
      s.shotProgress === 1 && document.body.classList.contains("measuring")
    );
  });
  await page
    .locator(".readout-panel")
    .evaluate((e) => e.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(1200);
  const video = page.video();
  await context.close();
  await copyFile(
    await video.path(),
    "Documentation/Validation/Quantum/synchronized-bell-experiment.webm",
  );
  console.log(
    "Saved Documentation/Validation/Quantum/synchronized-bell-experiment.webm",
  );
} finally {
  await browser.close();
}
