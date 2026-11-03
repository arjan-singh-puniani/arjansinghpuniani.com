import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportDigest } from './export-digest.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv.includes('--self-test')) {
  const temporary = await mkdtemp(path.join(tmpdir(), 'atlas-export-check-'));
  try {
    for (const name of ['app/api', 'components', 'lib', 'public/anatomy', 'scripts', 'data']) await mkdir(path.join(temporary, name), { recursive: true });
    for (const name of ['package.json', 'tsconfig.json', ...['atlas', 'catalogue', 'body-regions', 'dossier-summary', 'source-hosts', 'fda-applications'].map(name => `data/${name}.json`)]) await writeFile(path.join(temporary, name), '{}');
    const before = await exportDigest(temporary);
    assert.equal(before, await exportDigest(temporary));
    await writeFile(path.join(temporary, 'app/api/private.ts'), 'server-only change');
    assert.equal(before, await exportDigest(temporary));
    await writeFile(path.join(temporary, 'components/view.tsx'), 'changed UI');
    assert.notEqual(before, await exportDigest(temporary));
    console.log('Export digest determinism, server-route exclusion and stale-UI detection passed.');
  } finally { await rm(temporary, { recursive: true, force: true }); }
} else {
  const manifest = JSON.parse(await readFile(path.join(root, '../arjan-portfolio/public/atlas/body-atlas-export.json'), 'utf8'));
  assert.equal(manifest.application, 'BODY//ATLAS');
  assert.equal(manifest.sourceDigest, await exportDigest(root), 'Atlas export is stale. Run node scripts/export-static.mjs ../arjan-portfolio/public/atlas from body-atlas-source.');
  console.log('Checked-in atlas export matches its source digest.');
}
