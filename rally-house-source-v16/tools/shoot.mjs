// Headless capture harness.
// Serves the project over http, loads it in Chromium (SwiftShader WebGL2),
// drives the live game via window.__rh hooks, and writes real screenshots.
// Usage: node tools/shoot.mjs <outDir> [shots.json]
import {chromium} from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.resolve(process.argv[2] || path.join(ROOT, 'shots'));
fs.mkdirSync(outDir, {recursive: true});

const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.map': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml'};
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  const f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
  if (!fs.existsSync(f)) {res.writeHead(404); return res.end('nope');}
  res.writeHead(200, {'content-type': MIME[path.extname(f)] || 'application/octet-stream'});
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(8099, r));

const shots = JSON.parse(fs.readFileSync(process.argv[3] || path.join(ROOT, 'tools', 'shots.json'), 'utf8'));

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-lcd-text'],
});

const errors = [];
for (const shot of shots) {
  const page = await browser.newPage({
    viewport: shot.viewport || {width: 1280, height: 800},
    deviceScaleFactor: 1,
    isMobile: !!shot.mobile,
    hasTouch: !!shot.mobile,
  });
  page.on('console', m => {if (m.type() === 'error') errors.push(`[${shot.name}] ${m.text()}`);});
  page.on('pageerror', e => errors.push(`[${shot.name}] PAGEERROR ${e.message}`));
  await page.goto('http://127.0.0.1:8099/index.html');
  await page.waitForFunction('window.__rh && window.__rh.ready', null, {timeout: 30000}).catch(e => errors.push(`[${shot.name}] no __rh hook: ${e.message}`));
  if (shot.setup) await page.evaluate(shot.setup);
  // Let the simulation settle for the requested number of simulated seconds.
  if (shot.settleMs) await page.waitForTimeout(shot.settleMs);
  await page.screenshot({path: path.join(outDir, shot.name + '.png')});
  if (shot.report) {
    const data = await page.evaluate('JSON.stringify(window.__rh.report())');
    fs.writeFileSync(path.join(outDir, shot.name + '.json'), data);
    console.log(`-- ${shot.name} --\n` + data);
  }
  await page.close();
}
await browser.close();
server.close();
if (errors.length) {console.log('CONSOLE ERRORS:\n' + errors.join('\n'));} else {console.log('no console errors');}
console.log('shots written to ' + outDir);
