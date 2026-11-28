import fs from 'node:fs';import assert from 'node:assert/strict';
import {chromium,webkit,browserOptions} from './runtime.mjs';
const [base='http://127.0.0.1:18134',out='evidence/release-arrival']=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});const reports=[];
for(const mobile of [false,true]){
 const engine=mobile?'webkit':'chromium',browser=await(mobile?webkit.launch({headless:true}):chromium.launch({...browserOptions,args:['--use-angle=metal']}));
 try{const context=await browser.newContext({viewport:mobile?{width:402,height:874}:{width:1440,height:960},isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push({status:r.status(),url:r.url()});});
 await page.goto(base+'/playground/rally-house',{waitUntil:'domcontentloaded',timeout:120000});await page.getByRole('heading',{level:1,name:'The Sims meets Mario Tennis.'}).waitFor();assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.locator('#how-to-play h3').count(),4);
 for(const img of await page.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());}
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.evaluate(()=>scrollTo({top:0,behavior:"instant"}));await page.waitForFunction(()=>scrollY===0);await page.screenshot({path:out+'/'+engine+'-landing.png'});
 const cta=page.getByRole('link',{name:'Play Rally House ↗',exact:true});await cta.click();
 let game;
 if(mobile){await page.waitForURL('**/rally-house/index.html');game=page;assert.equal(await page.locator('iframe').count(),0);}else{game=page.frameLocator('iframe[title="Play Rally House"]');}
 await game.getByText('Arjan',{exact:true}).click({timeout:40000});await game.locator('.arrival-play').click();await game.locator('.championshipHud[data-phase=serving]').waitFor({timeout:30000});await game.getByRole('button',{name:'Swing racket',exact:true}).click();await game.locator('.championshipHud[data-phase=rally]').waitFor({timeout:15000});await page.screenshot({path:out+'/'+engine+'-play.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);reports.push({engine,mobile,entry:mobile?'native full page':'deferred iframe',rallyStarted:true,overflow:false,errors,failed});await context.close();
 }finally{await browser.close();}
}
fs.writeFileSync(out+'/report.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
