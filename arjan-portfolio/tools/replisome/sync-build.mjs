import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const portfolio = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const source = resolve(portfolio, '../replisome-source');
const destination = join(portfolio, 'public/replisome');
const output = mkdtempSync(join(tmpdir(), 'replisome-bundle-'));
const digest = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
function files(root, prefix = '') {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const name = prefix + entry.name;
    return entry.isDirectory() ? files(join(root, entry.name), name + '/') : [name];
  }).sort();
}

try {
  const build = spawnSync('npm', ['run', 'build', '--', '--base', '/replisome/', '--outDir', output, '--emptyOutDir'], { cwd: source, stdio: 'inherit' });
  if (build.status !== 0) throw new Error('Standalone build failed; deployed assets were not changed.');
  const index = join(output, 'index.html');
  let html = readFileSync(index, 'utf8');
  html = html.replace('<head>', '<head>\n    <meta name="robots" content="noindex,follow" />\n    <link rel="canonical" href="https://arjansinghpuniani.com/playground/replisome" />');
  // Keep font loading relative to the standalone document, independently of the portfolio.
  html = html.replace('href="./fonts/fonts.css"', 'href="/replisome/fonts/fonts.css"');
  writeFileSync(index, html);
  const manifest = {
    app: 'REPLISOME',
    version: JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')).version,
    base: '/replisome/',
    source: '../../../replisome-source',
    lockfileSha256: digest(join(source, 'package-lock.json')),
    files: Object.fromEntries(files(output).map(file => [file, digest(join(output, file))])),
  };
  // Preserve the locally captured poster when refreshing only the application bundle.
  if (existsSync(join(destination, 'preview.webp'))) cpSync(join(destination, 'preview.webp'), join(output, 'preview.webp'));
  rmSync(destination, { recursive: true, force: true });
  cpSync(output, destination, { recursive: true });
  writeFileSync(join(destination, 'build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Published standalone assets to ${destination}`);
} finally {
  rmSync(output, { recursive: true, force: true });
}
