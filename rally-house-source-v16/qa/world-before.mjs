fs.mkdirSync('qa/world-interface',{recursive:true});
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const b=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2});await p.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:8078'}/?debug`);await p.waitForFunction(()=>window.__rh?.ready);await p.getByText('Arjan',{exact:true}).click();await p.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.camera.frameAcademy();g.settings.visuals='detail';});await p.waitForTimeout(2500);await p.screenshot({path:'qa/world-interface/before-overview.png'});await p.evaluate(()=>{const g=window.__rh.game;g.openCharacter(g.characters.find(c=>c.id==='leo'));});await p.waitForTimeout(800);await p.screenshot({path:'qa/world-interface/before-leo.png'});}finally{await b.close()}
