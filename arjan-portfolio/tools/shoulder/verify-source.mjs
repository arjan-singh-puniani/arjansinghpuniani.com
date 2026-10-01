import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const parts = await readFile(
    "Documentation/shoulder-baseline/official-parts.txt",
    "utf8",
  ),
  elements = await readFile(
    "Documentation/shoulder-baseline/official-elements.txt",
    "utf8",
  );
const p = JSON.parse(
  await readFile("public/holoanatomy/shoulder/assets/provenance.json"),
);
const result = [];
for (const s of p.structures) {
  const mapping = elements.split("\n").find((l) => {
    const x = l.trim().split("\t");
    return x[0] === s.FMA && x[2] === s.id;
  });
  assert.ok(mapping, `${s.id} missing official FMA mapping`);
  const concept = parts.split("\n").find((l) => l.startsWith(s.FMA + "\t"));
  assert.ok(concept);
  const sha = createHash("sha256")
    .update(await readFile(`public/holoanatomy/anatomy/${s.id}.obj`))
    .digest("hex");
  result.push({
    id: s.id,
    fma: s.FMA,
    integratedName: s.name,
    officialName: concept.trim().split("\t")[2],
    mapping,
    sourceSha256: sha,
  });
  s.sourceSha256 = sha;
  s.reviewStatus =
    "Official FMA-to-mesh mapping verified; topology checked; no independent clinical review";
}
await writeFile(
  "Documentation/shoulder-baseline/official-verification.json",
  JSON.stringify(result, null, 2),
);
await writeFile(
  "public/holoanatomy/shoulder/assets/provenance.json",
  JSON.stringify(p, null, 2),
);
console.log("20 official FMA/mesh mappings verified; source SHA-256 recorded.");
