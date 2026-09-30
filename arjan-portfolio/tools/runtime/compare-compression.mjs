import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, draco } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import draco3d from "draco3dgltf";
import { gzipSync, brotliCompressSync } from "node:zlib";
import { readFile, writeFile, mkdir } from "node:fs/promises";
await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const encoder = await draco3d.createEncoderModule(),
  decoder = await draco3d.createDecoderModule();
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
    "draco3d.encoder": encoder,
    "draco3d.decoder": decoder,
  });
const root = new URL("../../", import.meta.url);
const data = await readFile(
  new URL("public/holoanatomy/shoulder/assets/shoulder-lod0.glb", root),
);
const results = [];
await mkdir(new URL("Documentation/shoulder-qa/compression", root), {
  recursive: true,
});
for (const kind of ["uncompressed", "meshopt", "draco"]) {
  const document = await io.readBinary(data);
  let start = performance.now();
  if (kind === "meshopt")
    await document.transform(
      meshopt({ encoder: MeshoptEncoder, level: "medium" }),
    );
  if (kind === "draco")
    await document.transform(
      draco({ method: "edgebreaker", encodeSpeed: 5, decodeSpeed: 5 }),
    );
  const output =
    kind === "uncompressed" ? data : await io.writeBinary(document);
  const encodeMs = performance.now() - start;
  const times = [];
  for (let i = 0; i < 5; i++) {
    start = performance.now();
    await io.readBinary(output);
    times.push(performance.now() - start);
  }
  results.push({
    kind,
    bytes: output.length,
    gzipBytes: gzipSync(output).length,
    brotliBytes: brotliCompressSync(output).length,
    encodeMs,
    meanParseDecodeMs: times.reduce((s, n) => s + n, 0) / times.length,
    notes:
      kind === "uncompressed"
        ? "No decoder dependency or quantization."
        : "Quantized candidate; not shipped until error/landmark validation.",
  });
  await writeFile(
    new URL(`Documentation/shoulder-qa/compression/${kind}.glb`, root),
    output,
  );
}
await writeFile(
  new URL("Documentation/shoulder-qa/compression/results.json", root),
  JSON.stringify(
    {
      environment: process.version,
      results,
      ktx2: {
        sourceTextures: 0,
        sourceTextureBytes: 0,
        decision:
          "No texture payload to compress. Basis/KTX2 introduces decoder/transcoder cost without a current benefit.",
      },
      decision:
        "Ship plain indexed GLB with HTTP compression. Keep compressed candidates in QA only until per-landmark quantization is validated.",
    },
    null,
    2,
  ),
);
console.log(results);
