import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const runtime=path.resolve(process.env.QA_RUNTIME??'dist'),load=p=>import(pathToFileURL(path.join(runtime,p)).href);
const [{Character},{memberData},{playerSpec},{Navigation},{Vec3}]=await Promise.all([load('entities/Character.js'),load('content/content.js'),load('content/PlayerAvatars.js'),load('world/Navigation.js'),load('rendering/Math3D.js')]);
// Measure the same authored arm lengths and garment clearance as the browser.
const originalFetch=globalThis.fetch,originalImage=globalThis.Image;
try{globalThis.fetch=async url=>new Response(fs.readFileSync(new URL(url)));globalThis.Image=class{naturalWidth=1024;naturalHeight=1024;async decode(){}};await (await load('animation/AuthoredAthlete.js')).loadAuthoredAthlete();}
finally{globalThis.fetch=originalFetch;globalThis.Image=originalImage;}
const results=[];
for(const spec of [...memberData,playerSpec('taylor'),playerSpec('arjan')]){
 const c=new Character({...spec},new Vec3(),new Navigation([]),{});c.racketStowed=true;c.goTo(new Vec3(0,0,8));
 let last=null,events=0,plantedPairs=0,maxSlide=0;const heads=[],hips=[],arms=[],flex=[],clearance=[];
 for(let i=0;i<240;i++){
  c.update(1/60);const p=c.analysisPose(),k=c.debugKinematics();if(c.consumeStepEvent()&&i>=60)events++;
  if(i>=60){heads.push(p.head.y);hips.push(p.pelvisCenter.y);
   for(const side of ['L','R']){const hand=p[`hand${side}`],elbow=p[`elbow${side}`],shoulder=p[`shoulder${side}`],a=Vec3.sub(shoulder,elbow).normalize(),b=Vec3.sub(hand,elbow).normalize();arms.push(Math.abs(elbow.x-shoulder.x));flex.push(180-Math.acos(Math.max(-1,Math.min(1,Vec3.dot(a,b))))*180/Math.PI);clearance.push(p[`foot${side}`].y-.11);
    const key=side==='L'?'leftFoot':'rightFoot',flag=side==='L'?'leftFootPlanted':'rightFootPlanted';if(last&&last[flag]&&k[flag]){maxSlide=Math.max(maxSlide,Vec3.sub(last[key],k[key]).len());plantedPairs++;}
   }
  }last=k;
 }
 const mean=a=>a.reduce((s,v)=>s+v,0)/a.length,range=a=>Math.max(...a)-Math.min(...a);
 results.push({id:spec.avatar??spec.id,name:spec.name,cadence:events/3*60,headVerticalRange:range(heads),pelvisVerticalRange:range(hips),meanElbowOutward:mean(arms),meanElbowFlexion:mean(flex),peakFootLift:Math.max(...clearance),maxSlide,plantedPairs});
}
const file=process.env.QA_REPORT??'evidence/gait-20261016/after-audit.json';fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
