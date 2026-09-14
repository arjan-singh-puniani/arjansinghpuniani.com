import {chromium,browserOptions} from './runtime.mjs';
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';
const root=process.cwd(),label=process.argv[2]||'v14',duration=Number(process.argv[3]||600),dir=`qa/${label}`;fs.mkdirSync(dir,{recursive:true});
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]||'/'));const file=p===root?path.join(root,'index.html'):p;if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(res)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(browserOptions);
const page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/?debug=1`);await page.waitForFunction(()=>window.__rh?.ready);await page.evaluate(()=>{window.__rh.game.ui.closeContext();window.__rh.game.audio.enabled=false;});console.log('READY',label);
 const rows=[],start=Date.now();let i=0;
 do{await page.waitForTimeout(10000);const data=await page.evaluate(()=>{const g=window.__rh.game;return {report:window.__rh.report(),activity:g.activities.serialize(),everyday:g.everyday?.serialize(),memories:g.life.memories,relationships:g.relations.serialize(),perf:g.perf.snapshot()}});rows.push({seconds:(Date.now()-start)/1000,...data});fs.writeFileSync(`${dir}/watch.json`,JSON.stringify({errors,rows},null,2));if(i%6===0)console.log(label,Math.round(rows.at(-1).seconds),'completed',data.report.completed,'life',data.everyday?.history?.length);if(i===0||i===29)await page.screenshot({path:`${dir}/watch-${i}.png`,timeout:60000});i++;}while(Date.now()-start<duration*1000);
 await page.screenshot({path:`${dir}/watch-end.png`,timeout:60000});if(errors.length)throw Error(errors.join('\n'));console.log('WATCH PASSED',label,Math.round((Date.now()-start)/1000));
}finally{await browser.close();await new Promise(r=>server.close(r))}
