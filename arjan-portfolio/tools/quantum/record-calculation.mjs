import { chromium } from "playwright";
import { copyFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chromium" });
try {
  await mkdir("/tmp/quantum-calculation-video", { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1150 },
    recordVideo: {
      dir: "/tmp/quantum-calculation-video",
      size: { width: 1440, height: 1150 },
    },
  });
  const page = await context.newPage();
  await page.goto(
    (process.env.QUANTUM_BASE_URL || "http://127.0.0.1:8865") +
      "/quantum-computer-lab/index.html#compute",
  );
  await page.waitForFunction(() => window.quantumLab?.snapshot().cursor === 1);
  await page
    .locator("#gate-calculation")
    .evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.locator('[data-calc="replay"]').click();
  await page.waitForFunction(
    () =>
      document.querySelector("#gate-calculation").dataset.phase === "result",
  );
  await page.waitForTimeout(1100);
  const video = page.video();
  await context.close();
  await copyFile(
    await video.path(),
    "Documentation/Validation/Quantum/exact-ket-transformation.webm",
  );
  console.log(
    "Saved Documentation/Validation/Quantum/exact-ket-transformation.webm",
  );
} finally {
  await browser.close();
}
