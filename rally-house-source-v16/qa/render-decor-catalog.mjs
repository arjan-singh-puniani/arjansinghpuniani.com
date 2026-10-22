import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
import {DECOR_CATALOG} from '../dist/content/DecorCatalog.js';
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:400,height:400},deviceScaleFactor:1});
 await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:18080'}/?debug`);await page.waitForFunction(()=>window.__rh?.ready);
 const images=await page.evaluate(types=>{
  const g=window.__rh.game,r=g.renderer,V=g.player.position.constructor;g.clock.paused=true;g.render=()=>{};r.renderScale=1;r.resize();
  const cam=g.camera;cam.aspect=1.2;cam.fov=40*Math.PI/180;cam.azimuth=cam.desiredAzimuth=.65;cam.elevation=cam.desiredElevation=.38;
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=200;const ctx=canvas.getContext('2d'),images={};
  for(const type of types){
   g.world.placements=[{id:'preview',type,x:0,z:0,rotation:0}];const meshes=g.world.placementMeshes(),height=Math.max(...meshes.map(m=>m.position.y+m.scale.y*.6));
   cam.target.set(0,height*.47,0);cam.desiredTarget=cam.target.clone();cam.distance=cam.desiredDistance=Math.max(3.2,height*2.5);cam.update(0);
   const light=g.world.lighting(780,0,cam.target);light.background=[.947,.926,.878,1];light.ambient=.65;
   r.render([{kind:'roundBox',position:new V(0,-.06,0),scale:new V(6,.10,6),color:'#e5ddcb',material:'stone'},...meshes],cam.viewProjection(),light,cam.position);
   ctx.drawImage(g.canvas,0,0,g.canvas.width,g.canvas.height,0,0,240,200);images[type]=canvas.toDataURL('image/webp',.86).split(',')[1];
  }
  return images;
 },DECOR_CATALOG.map(d=>d.id));
 fs.mkdirSync('assets/decor',{recursive:true});for(const [type,data] of Object.entries(images))fs.writeFileSync(`assets/decor/${type}.webp`,Buffer.from(data,'base64'));
 console.log(`${Object.keys(images).length} catalog images rendered from the placed-object meshes.`);
}finally{await browser.close();}
