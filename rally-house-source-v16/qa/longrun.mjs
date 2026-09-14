import {chromium} from '/Users/arjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';
const mode='golden',root=process.cwd();
const server=http.createServer((req,res)=>{let p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);return res.end();}if(p===root)p+='/index.html';if(!fs.existsSync(p)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');fs.createReadStream(p).pipe(res)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:'/Users/arjan/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
await page.goto(`http://127.0.0.1:${server.address().port}/?debug=1`);await page.waitForFunction(()=>window.__rh?.ready,null,{timeout:60000}).catch(async e=>{console.log('STARTUP',await page.locator('#loading').innerText());await page.screenshot({path:'qa/startup-failure.png'});throw e;});await page.evaluate(()=>window.__rh.game.audio.enabled=false);
const result=()=>page.evaluate(()=>({report:window.__rh.report(),perf:window.__rh.game.perf.snapshot(),history:window.__rh.game.life.memories,activity:window.__rh.game.activities?.serialize(),progress:window.__rh.game.mikaProgress}));
if(mode==='baseline'){await page.waitForTimeout(10000);await page.screenshot({path:'qa/v11-baseline.png'});const before=await result();await page.click('#coachBtn');await page.getByText('Drop-feed timing',{exact:true}).click();const immediate=await result();await page.waitForTimeout(20000);fs.writeFileSync('qa/baseline-browser.json',JSON.stringify({before,immediate,after:await result(),errors},null,2));}
if(mode==='verify'){await import('./verify-browser.mjs').then(m=>m.verify(page,result));}
if(mode==='spectator'||mode==='golden'){
 const start=Date.now();for(let i=0;i<(mode==='golden'?90:60);i++){
 if(mode==='golden'&&i===2){await page.click('#coachBtn');await page.getByText('Drop-feed timing',{exact:true}).click();}
 if(mode==='golden'&&i===25)await page.evaluate(()=>window.__rh.game.place('bench',-5,2));
 if(mode==='golden'&&i===55)await page.evaluate(()=>window.__rh.setWeather('rain'));
 if(mode==='golden'&&i===70){await page.click('#saveBtn');await page.waitForTimeout(500);await page.reload();await page.waitForFunction(()=>window.__rh?.ready);}
 await page.waitForTimeout(10000);const data=await result();fs.appendFileSync(`qa/final-${mode}.jsonl`,JSON.stringify({elapsed:Date.now()-start,...data})+'\n');if(i%6===0)console.log(mode,i*10,data.progress,data.report.minutes);if(i%15===0)await page.screenshot({path:`qa/final-${mode}-${i}.png`});
 }}
console.log('errors',errors);await browser.close();await new Promise(r=>server.close(r));
