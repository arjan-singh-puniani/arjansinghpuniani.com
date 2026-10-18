import {enterClub} from './enter-club.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import http from 'node:http';
import {chromium,browserOptions} from './runtime.mjs';
const root=path.resolve(process.argv[2]),out=process.env.QA_OUT;assert(out);fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+decodeURIComponent((req.url??'/').split('?')[0]));const file=f===root?path.join(root,'index.html'):f;if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(res);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({...browserOptions,...process.env.QA_METAL==='1'?{args:['--use-angle=metal']}:{}}),page=await browser.newPage({viewport:{width:1280,height:850}}),report={root,metal:process.env.QA_METAL==='1',errors:[],step:'startup'};
page.on('pageerror',e=>report.errors.push(e.message));
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/?debug=1`);await page.waitForFunction(()=>window.__rh?.ready,null,{timeout:60000});
 report.initial=await page.evaluate(()=>{const g=window.__rh.game,gl=g.renderer.gl,ext=gl.getExtension('WEBGL_debug_renderer_info'),button=[...document.querySelectorAll('#contextActions button')].find(b=>b.textContent.trim().startsWith('Arjan')),box=button?.getBoundingClientRect(),hit=box?document.elementFromPoint(box.x+box.width/2,box.y+box.height/2):null;return {context:document.querySelector('#context').textContent,opacity:getComputedStyle(document.querySelector('#context')).opacity,button:box?.toJSON(),hit:hit?.outerHTML.slice(0,300),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,scale:g.renderer.renderScale};});
 report.step='select';await enterClub(page,'Arjan',{timeout:30000});
 report.selected=await page.evaluate(()=>({avatar:window.__rh.game.playerAvatar,errors:window.__rh.game.renderer.gl.getError()}));assert.equal(report.selected.avatar,'arjan');
 report.step='members';await page.click('#bookBtn');await page.click('[data-tab="people"]');const text=await page.locator('#bookContent').innerText();for(const name of ['Contessa','Lucresia','Leo','Barbara'])assert(text.includes(name));await page.keyboard.press('Escape');
 report.step='reload';await page.click('#saveBtn');await page.waitForTimeout(500);await page.reload();await page.waitForFunction(()=>window.__rh?.ready);assert.equal(await page.evaluate(()=>window.__rh.game.playerAvatar),'arjan');
 report.step='complete';report.passed=true;assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.message;await page.screenshot({path:`${out}/failure.png`,timeout:15000}).catch(()=>{});throw e;}
finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}
console.log(JSON.stringify(report));
