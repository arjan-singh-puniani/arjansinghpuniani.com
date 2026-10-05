import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const b=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
const p=await b.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
fs.mkdirSync('qa/character-polish',{recursive:true});
try{await p.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:8078'}/?debug`);await p.waitForFunction(()=>window.__rh?.ready);await p.getByText('Taylor',{exact:true}).click();
await p.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.spatial?.clearSelection?.();for(const a of [...g.activities.active])g.cancelActivity(a);window.cast=[g.player,...g.characters.filter(c=>c!==g.player)];g.characters=window.cast;for(const [i,c] of window.cast.entries()){c.position.set(-3.6+i*1.8,0,1);c.yaw=c.targetYaw=0;c.state='idle';c.racketStowed=true;}const cam=g.camera;cam.autoFrame=false;cam.target.set(0,1,1);cam.desiredTarget.set(0,1,1);cam.distance=cam.desiredDistance=24;cam.azimuth=cam.desiredAzimuth=0;cam.elevation=cam.desiredElevation=.10;cam.locked=true;});
await p.waitForTimeout(500);await p.screenshot({path:'qa/character-polish/lineup.png'});
for(const id of ['player','coach','mika','leo','nia']){await p.evaluate(id=>{const g=window.__rh.game,c=window.cast.find(c=>c.id===id);g.camera.target.set(c.position.x,1.1,1);g.camera.desiredTarget.set(c.position.x,1.1,1);g.camera.distance=g.camera.desiredDistance=6.2;},id);await p.waitForTimeout(200);await p.screenshot({path:`qa/character-polish/${id}.png`});}
fs.writeFileSync('qa/character-polish/results.json',JSON.stringify({errors},null,2));if(errors.length)throw Error(errors.join(';'));console.log('Five character portraits and lineup captured; no browser errors.');}finally{await b.close();}
