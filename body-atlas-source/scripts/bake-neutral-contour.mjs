import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { sculptPersonalContour } from "../lib/personal-contour.ts";

// Three's binary exporter uses FileReader in the browser.
globalThis.FileReader ??= class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend();
  }
};

const asset = new URL("../public/anatomy/", import.meta.url);
const source = await readFile(new URL("../data/contour-source.glb", import.meta.url));
const base = JSON.parse(await readFile(new URL("contour-manifest.json", asset), "utf8"));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
assert.equal(digest(source), base.sha256);
const { scene } = await new GLTFLoader().parseAsync(Uint8Array.from(source).buffer, "");
const mesh = scene.getObjectByName("Body_Contour");
assert.ok(mesh?.isMesh);
mesh.geometry = sculptPersonalContour(mesh.geometry);
mesh.name = "Exterior_Hologram";
const output = Buffer.from(await new GLTFExporter().parseAsync(mesh, { binary: true }));
const data = JSON.parse(output.subarray(20, 20 + output.readUInt32LE(12)).toString());
assert.ok(!data.images && !data.textures);
assert.ok(data.meshes.every(item => item.primitives.every(primitive => !primitive.attributes._SURFACE_DETAIL)));
await writeFile(new URL("hologram.glb", asset), output);
await writeFile(new URL("hologram-manifest.json", asset), JSON.stringify({
  asset: "Neutral exterior hologram",
  creators: base.creators,
  sourceSha256: base.sha256,
  license: "CC BY 4.0 with Apache-2.0 facial topology attribution retained.",
  adapted: "Photo-guided regional silhouette with a neutral interior face surface and no facial-detail attribute.",
  sha256: digest(output),
  bytes: output.length,
}, null, 2) + "\n");
