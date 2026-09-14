import {chromium,browserOptions} from './runtime.mjs';
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';
const mode=process.argv[2]||'baseline',root=process.cwd();
let servingRoot=mode==='migration-v16'?path.resolve('../v16-audit-reference/Rally-House-Character-Life-v15'):mode==='migration-v15'?fs.readFileSync('qa/legacy-fixture-path.txt','utf8').trim():root;
const server=http.createServer((req,res)=>{const root=servingRoot;let p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);return res.end();}if(p===root)p+='/index.html';if(!fs.existsSync(p)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');fs.createReadStream(p).pipe(res)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(browserOptions);
const context=await browser.newContext({viewport:{width:1280,height:850}});const page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
await page.goto(`http://127.0.0.1:${server.address().port}/?debug=1`);await page.waitForFunction(()=>window.__rh?.ready,null,{timeout:60000}).catch(async e=>{console.log('STARTUP',await page.locator('#loading').innerText());await page.screenshot({path:'qa/startup-failure.png'});throw e;});await page.evaluate(()=>window.__rh.game.audio.enabled=false);
const result=()=>page.evaluate(()=>({report:window.__rh.report(),perf:window.__rh.game.perf.snapshot(),history:window.__rh.game.life.memories,activity:window.__rh.game.activities?.serialize(),progress:window.__rh.game.mikaProgress}));
if(mode==='baseline'){await page.waitForTimeout(10000);await page.screenshot({path:'qa/v11-baseline.png'});const before=await result();await page.click('#coachBtn');await page.getByText('Drop-feed timing',{exact:true}).click();const immediate=await result();await page.waitForTimeout(20000);fs.writeFileSync('qa/baseline-browser.json',JSON.stringify({before,immediate,after:await result(),errors},null,2));}
if(mode==='migration-v16')await import('./migration-v16.mjs').then(m=>m.migrate(page,()=>{servingRoot=root;}));
if(mode==='migration-v15')await import('./migration-v15.mjs').then(m=>m.verifyMigration(page,()=>{servingRoot=root;}));
if(mode==='presence')await import('./presence-browser.mjs').then(m=>m.presence(page));
if(mode==='avatars')await import('./avatars.mjs').then(m=>m.avatars(page));
if(mode==='night-v15')await import('./night-v15.mjs').then(m=>m.verifyNight(page));
if(mode==='coaching-v15')await import('./coaching-v15.mjs').then(m=>m.verifyCoaching(page));
if(mode==='life-v15')await import('./v15-browser.mjs').then(m=>m.verifyLife(page));
if(mode==='walking-full')await import('./check-everyday.mjs').then(m=>m.check(page));
if(mode==='walking'||mode==='walking-full')await import('./walking-check.mjs').then(m=>m.walking(page));
if(mode==='final-shot')await import('./final-shot.mjs').then(m=>m.capture(page));
if(mode==='frames')await import('./frame-check.mjs').then(m=>m.frames(page));
if(mode==='core-v14')await import('./core-v14.mjs').then(m=>m.core(page));
if(mode==='reliability')await import('./reliability-v14.mjs').then(m=>m.reliability(page));
if(mode==='acting')await import('./acting-check.mjs').then(m=>m.acting(page));
if(mode==='everyday')await import('./check-everyday.mjs').then(m=>m.check(page));
if(mode==='tomorrow')await import('./tomorrow.mjs').then(m=>m.tomorrow(page));
if(mode==='safety')await import('./reload-safety.mjs').then(m=>m.safety(page));
if(mode==='mobile')await import('./mobile.mjs').then(m=>m.mobileTest(page));
if(mode==='verify'){await import('./verify-browser.mjs').then(m=>m.verify(page,result));}
if(mode==='spectator'||mode==='golden'){
 const start=Date.now();for(let i=0;i<(mode==='golden'?90:60);i++){
 if(mode==='golden'&&i===2){await page.click('#coachBtn');await page.getByText('Drop-feed timing',{exact:true}).click();}
 if(mode==='golden'&&i===25)await page.evaluate(()=>window.__rh.game.place('bench',-5,2));
 if(mode==='golden'&&i===55)await page.evaluate(()=>window.__rh.setWeather('rain'));
 if(mode==='golden'&&i===70){await page.click('#saveBtn');await page.waitForTimeout(500);await page.reload();await page.waitForFunction(()=>window.__rh?.ready);}
 await page.waitForTimeout(10000);const data=await result();fs.appendFileSync(`qa/${mode}.jsonl`,JSON.stringify({elapsed:Date.now()-start,...data})+'\n');if(i%6===0)console.log(mode,i*10,data.progress,data.report.minutes);if(i%15===0)await page.screenshot({path:`qa/${mode}-${i}.png`});
 }}
console.log('errors',errors);await browser.close();await new Promise(r=>server.close(r));
