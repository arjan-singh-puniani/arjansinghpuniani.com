import { fileURLToPath } from "node:url";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import vm from "node:vm";
import path from "node:path";
import assert from "node:assert/strict";
import {
  operations,
  concepts,
  sources,
} from "../../public/quantum-computer-lab/content.js";

import { diagnostics } from "../../public/quantum-computer-lab/diagnostics.js";
const root = path.resolve(fileURLToPath(new URL("../..", import.meta.url))),
  publicRoot = path.join(root, "public"),
  lab = path.join(publicRoot, "quantum-computer-lab"),
  output = path.join(root, "Documentation/Validation/Quantum");
const context = { module: { exports: {} } };
context.exports = context.module.exports;
vm.runInNewContext(
  await readFile(path.join(lab, "vendor/katex.min.js"), "utf8"),
  context,
);
const math = context.module.exports;
let equations = 0;
for (const lesson of Object.values(operations))
  for (const field of ["operator", "state", "hamiltonian"]) {
    math.renderToString(lesson[field], { throwOnError: true, strict: "error" });
    equations++;
  }
for (const lesson of concepts) {
  math.renderToString(lesson.latex, { throwOnError: true, strict: "error" });
  equations++;
}
for (const model of diagnostics) {
  math.renderToString(model.equation, { throwOnError: true, strict: "error" });
  equations++;
}
const files = await readdir(lab, { recursive: true }),
  inventory = [];
for (const relative of files) {
  const full = path.join(lab, relative);
  if (!(await stat(full)).isFile()) continue;
  const data = await readFile(full);
  inventory.push({
    path: "public/quantum-computer-lab/" + relative,
    bytes: data.length,
    gzipBytes: gzipSync(data).length,
  });
  if (relative.endsWith(".js") && !relative.startsWith("vendor")) {
    const text = data.toString();
    for (const match of text.matchAll(
      /(?:from\s*|import\s*\()(["'])(\.?\.?\/[^"']+|\/[^"']+)\1/g,
    )) {
      const target = match[2].startsWith("/")
        ? path.join(publicRoot, match[2])
        : path.resolve(path.dirname(full), match[2]);
      assert.ok(existsSync(target), `Missing module: ${match[2]}`);
    }
  }
}
const html = await readFile(path.join(lab, "index.html"), "utf8");
for (const m of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))
  assert.ok(existsSync(path.resolve(lab, m[1])), `Missing HTML asset ${m[1]}`);
const css = await readFile(path.join(lab, "vendor/katex.min.css"), "utf8");
for (const m of css.matchAll(/url\(([^)]+)\)/g))
  assert.ok(
    existsSync(path.join(lab, "vendor", m[1].replaceAll('"', ""))),
    `Missing font ${m[1]}`,
  );
const shared = [];
for (const name of ["three.module.js", "three.core.js", "OrbitControls.js"]) {
  const data = await readFile(
    path.join(publicRoot, "pit-stop-lab/vendor", name),
  );
  shared.push({
    path: "public/pit-stop-lab/vendor/" + name,
    bytes: data.length,
    gzipBytes: gzipSync(data).length,
    reused: true,
  });
}
const report = {
  equations,
  localAssets: "passed",
  inventory,
  shared,
  totals: {
    labBytes: inventory.reduce((s, f) => s + f.bytes, 0),
    labGzipBytes: inventory.reduce((s, f) => s + f.gzipBytes, 0),
    javascriptGzipBytes: [...inventory, ...shared]
      .filter((f) => f.path.endsWith(".js"))
      .reduce((s, f) => s + f.gzipBytes, 0),
  },
};
if (process.argv.includes("--links"))
  report.sourceLinks = await Promise.all(
    sources.map(async (s) => {
      try {
        const r = await fetch(s.url, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(15000),
        });
        return { url: s.url, status: r.status, finalUrl: r.url };
      } catch (e) {
        return { url: s.url, status: "unverified", reason: e.message };
      }
    }),
  );
await writeFile(
  path.join(output, "asset-and-source-results.json"),
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      ...report,
      inventory: `${inventory.length} assets; details saved`,
      shared: `${shared.length} shared modules`,
    },
    null,
    2,
  ),
);
