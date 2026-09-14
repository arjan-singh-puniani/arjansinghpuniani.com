// Agent-driven browser interaction session. This is not an independent human playtest.
import {chromium,browserOptions} from './runtime.mjs';
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';
const root=process.argv[4]||process.cwd(),label=process.argv[2]||'v15-guided',duration=Number(process.argv[3]||1200),dir=`qa/${label}`;fs.mkdirSync(dir,{recursive:true});
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]||'/')),file=p===root?path.join(root,'index.html'):p;if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(browserOptions),page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[],actions=[],rows=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const close=async()=>{await page.keyboard.press('Escape');};
const act=async(minute)=>{
 if(minute===0){await page.click('#bookBtn');await page.click('[data-tab="people"]');return 'Read all four member cards';}
 if(minute===1){await close();await page.locator('#game').focus();await page.keyboard.press('2');return 'Select Lucresia with keyboard';}
 if(minute===2){await close();await page.click('#cameraBtn');return 'Watch from alternate camera';}
 if(minute===3){await page.click('#bookBtn');await page.click('[data-tab="moments"]');return 'Inspect accumulated history';}
 if(minute===4){await close();return 'Watch without steering characters';}
 if(minute>=5&&minute<=8){await close();const types=['bench','plant','basket','lamp'],type=types[minute-5];await page.click('#buildBtn');await page.click(`[data-build="${type}"]`);const point=await page.evaluate(type=>{const g=window.__rh.game;for(let z=-7;z<7;z+=1)for(let x=-5;x<=7;x+=1){if(!g.world.canPlace(x,z)||g.characters.some(c=>Math.hypot(c.position.x-x,c.position.z-z)<1.2))continue;const p=g.camera.project({x,y:0,z});if(p.x>120&&p.x<900&&p.y>160&&p.y<530)return p;}return null;},type);if(!point)return 'No visible legal placement candidate';await page.mouse.click(point.x,point.y);return `Place ${type} through catalog and floor click`;}
 if(minute===9){await close();await page.click('#bookBtn');await page.click('[data-tab="academy"]');return 'Inspect club after building';}
 if(minute===10){await close();await page.click('#weatherBtn');await page.click('#weatherBtn');return 'Change weather to rain';}
 if(minute===11){await close();await page.click('#coachBtn');const b=page.getByText('Drop-feed timing',{exact:true});await b.click();await page.waitForFunction(()=>window.__rh.game.queuedLesson||window.__rh.game.activities.active.some(a=>a.kind==='lesson'));return 'Selected timing lesson and confirmed commitment';}
 if(minute===12){await close();return 'Observe lesson or its queued start';}
 if(minute===13){await page.click('#coachBtn');return 'Inspect coaching evidence during play';}
 if(minute===14){await close();await page.click('#bookBtn');await page.click('[data-tab="coaching"]');return 'Review completed coaching';}
 if(minute===15){await close();await page.click('#coachBtn');const b=page.getByText('Movement + recovery',{exact:true});await b.click();await page.waitForFunction(()=>window.__rh.game.queuedLesson||window.__rh.game.activities.active.some(a=>a.kind==='lesson'));return 'Selected movement lesson and confirmed commitment';}
 if(minute===16){await close();await page.click('#saveBtn');return 'Save current club';}
 if(minute===17){await page.reload();await page.waitForFunction(()=>window.__rh?.ready);return 'Reload and observe activity recovery';}
 if(minute===18){await page.setViewportSize({width:390,height:844});await page.click('#bookBtn');await page.click('[data-tab="people"]');return 'Read members in portrait viewport';}
 if(minute===19){await close();await page.setViewportSize({width:844,height:390});await page.click('#buildBtn');return 'Inspect landscape build controls';}
 return 'Observe';
};
try{await page.goto(`http://127.0.0.1:${server.address().port}/?debug=1`);await page.waitForFunction(()=>window.__rh?.ready);await page.evaluate(()=>window.__rh.game.ui.closeContext());const start=Date.now();let minute=-1;
 do{const elapsed=(Date.now()-start)/1000,m=Math.floor(elapsed/60);if(m!==minute){minute=m;try{const description=await act(m);actions.push({seconds:elapsed,description});console.log(label,m,description);}catch(e){actions.push({seconds:elapsed,error:e.message});}await page.screenshot({path:`${dir}/minute-${m}.png`,timeout:60000});}
 const data=await page.evaluate(()=>{const g=window.__rh.game;return {report:window.__rh.report(),activities:g.activities.serialize(),placements:g.world.placements,progress:g.mikaProgress,book:document.querySelector('#bookContent')?.textContent,toast:document.querySelector('#toast')?.textContent};});rows.push({seconds:(Date.now()-start)/1000,...data});fs.writeFileSync(`${dir}/session.json`,JSON.stringify({kind:'agent-driven browser session; not independent human testing',errors,actions,rows},null,2));await page.waitForTimeout(10000);
 }while((Date.now()-start)/1000<duration);console.log('SESSION FINISHED',label,(Date.now()-start)/1000,errors);
}finally{await browser.close();await new Promise(r=>server.close(r));}
