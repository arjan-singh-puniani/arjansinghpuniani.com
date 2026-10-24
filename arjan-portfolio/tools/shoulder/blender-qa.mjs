import { chromium, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
const out = "Documentation/shoulder-conference-qa/blender";

const b = await chromium.launch({ channel: "chrome" });
const result = {};
try {
  for (const label of ["current", "occlusion", "smooth"]) {
    const candidate = label !== "current";
    const data = await readFile(
      candidate
        ? `${out}/shoulder-${label === "occlusion" ? "study" : "smooth"}.glb`
        : `${out}/source-lod0.glb`,
    );
    const page = await b.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/shoulder-lod0.glb", (r) =>
      r.fulfill({ body: data, contentType: "model/gltf-binary" }),
    );
    await page.goto("http://127.0.0.1:4190/holoanatomy/shoulder/");
    await page.waitForFunction(() => window.shoulderStudio?.ready);

    for (const view of ["posterior", "anterior", "superior"]) {
      await page.evaluate((v) => shoulderStudio.applyView(v), view);
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${out}/web-${label}-${view}.png` });
    }
    result[label] = await page.evaluate(() => ({
      metrics: shoulderStudio.metrics(),
      cuff: ["FJ1506", "FJ1500", "FJ1508", "FJ1504"].map((id) => {
        const m = shoulderStudio.scene.meshes.get(id);
        return {
          id,
          uv: !!m.geometry.attributes.uv,
          normal: !!m.geometry.attributes.normal,
          ao: !!m.material.aoMap,
          strength: m.material.aoMapIntensity,
        };
      }),
    }));
    for (const m of result[label].cuff) {
      expect(m.normal).toBe(true);
      expect(m.uv).toBe(label === "occlusion");
      expect(m.ao).toBe(label === "occlusion");
      if (label === "occlusion") expect(m.strength).toBe(0.35);
    }
    await page.evaluate(async () => {
      const s = shoulderStudio.scene;
      s.frameTimes = [];
      for (let i = 0; i < 150; i++) {
        s.orbit(2, 0);
        await new Promise(requestAnimationFrame);
      }
    });
    result[label].orbitMetrics = await page.evaluate(() =>
      shoulderStudio.metrics(),
    );
    expect(errors).toEqual([]);
    await page.close();
  }
  await writeFile(
    `${out}/web-comparison.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(result);
} finally {
  await b.close();
}
