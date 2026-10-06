import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {memberData} from '../dist/content/content.js';
const states=['idle','walk','jog','ready','sit','talk','drink','stretch','watch','swingForehand','swingBackhand','serve','volley','celebrate','reactMiss','coachFeed','coachExplain','recover'];
const report={method:'Conservative proxy warnings: shoe centers < .08 apart, shoe center below .08 floor, hand center inside .13 torso-axis radius at y .8–1.45, racket center inside .20 head radius at y 1.78. These proxies do not prove mesh clearance.',samples:0,rows:[],warnings:[]};
for(const spec of memberData)for(const hz of [30,60,120])for(const state of states){
  const c=new Character(spec,new Vec3(),new Navigation(),{});c.setAnimation(state);
  if(state==='sit')c.seatDepth=.8;
  if(state==='walk'||state==='jog')c.goTo(new Vec3(0,0,10),state);
  let floor=Infinity,shoeGap=Infinity,handTorso=Infinity,racketHead=Infinity;
  for(let frame=0;frame<hz*2;frame++){
    c.update(1/hz);const k=c.debugKinematics();report.samples++;
    for(const key of ['leftFoot','rightFoot','leftHand','rightHand','racketCenter'])assert(Number.isFinite(k[key].x+k[key].y+k[key].z));
    floor=Math.min(floor,k.leftFoot.y,k.rightFoot.y);shoeGap=Math.min(shoeGap,Vec3.sub(k.leftFoot,k.rightFoot).len());
    for(const hand of [k.leftHand,k.rightHand])if(hand.y>.8&&hand.y<1.45)handTorso=Math.min(handTorso,Math.hypot(hand.x-c.position.x,hand.z-c.position.z));
    racketHead=Math.min(racketHead,Vec3.sub(k.racketCenter,new Vec3(c.position.x,1.78,c.position.z)).len());
  }
  const row={person:spec.id,hz,state,floor,shoeGap,handTorso,racketHead};report.rows.push(row);
  if(floor<.08||shoeGap<.08||handTorso<.13||racketHead<.20)report.warnings.push(row);
}
const output=process.argv[2]??'../takeover-evidence/after/poses.json';fs.writeFileSync(output,JSON.stringify(report,null,2));console.log('Pose proxy sweep:',report.samples,'finite samples;',report.warnings.length,'suspicious scenario warnings (review, not mesh collision proof)');
