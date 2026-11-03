import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

// Source evidence and large meshes have separate content-hash checks in the domain tests.
export async function exportDigest(root) {
  const files = ['package.json', 'tsconfig.json'];
  async function walk(directory) {
    for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
      const relative = `${directory}/${entry.name}`;
      if (relative === 'app/api') continue;
      if (entry.isDirectory()) await walk(relative);
      else if (/\.(tsx?|css|json|mjs)$/.test(entry.name)) files.push(relative);
    }
  }
  for (const directory of ['app', 'components', 'lib', 'public/anatomy', 'scripts']) await walk(directory);
  for (const name of ['atlas', 'catalogue', 'body-regions', 'dossier-summary', 'source-hosts', 'fda-applications']) files.push(`data/${name}.json`);
  const digest = createHash('sha256');
  for (const file of files.sort()) {
    const bytes = await readFile(path.join(root, file));
    digest.update(`${Buffer.byteLength(file)}:${file}:${bytes.length}:`).update(bytes);
  }
  return digest.digest('hex');
}
