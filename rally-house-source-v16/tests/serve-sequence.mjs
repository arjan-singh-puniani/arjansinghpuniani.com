import {RACKET} from '../dist/animation/RacketGeometry.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {memberData} from '../dist/content/content.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,compose} from '../dist/rendering/Math3D.js';
import {loadAuthoredAthlete} from '../dist/animation/AuthoredAthlete.js';
import {serveToss} from '../dist/tennis/ServeToss.js';
import {captureFrame,interpolateFrame} from '../dist/analysis/MotionCapture.js';
import {demonstration} from '../dist/analysis/LabDemonstrations.js';
globalThis.fetch=async u=>new Response(fs.readFileSync(new URL(u)));globalThis.Image=class{async decode(){}};await loadAuthoredAthlete();
const start=new Vec3(-.2,2.2,.1),end=new Vec3(.14,3.04,.38);
assert.deepEqual(serveToss(start,end,0),start);assert.deepEqual(serveToss(start,end,1),end);
let peaks=0,previous=start.y,ascending=true;
for(let i=1;i<=100;i++){const y=serveToss(start,end,i/100).y;if(y<previous&&ascending){peaks++;ascending=false;}assert(ascending||y<previous,'Toss has one uninterrupted descent');previous=y;}
assert.equal(peaks,1);assert(serveToss(start,end,.99).y>end.y,'The ball descends onto the strings');
let cases=0,minContinuity=1,maxContactError=0,minTransfer=Infinity,minRecovery=Infinity,maxReplayError=0;
for(const spec of [playerSpec('taylor'),playerSpec('arjan'),...memberData])for(const hz of [30,60,120])for(const yaw of [0,.7,Math.PI,4.9]){
 const c=new Character(spec,new Vec3(),new Navigation([]),{});c.yaw=c.targetYaw=yaw;const forward=new Vec3(Math.sin(yaw),0,Math.cos(yaw));c.matchCompetitor=true;c.setAnimation('ready');for(let i=0;i<hz;i++)c.update(1/hz);c.triggerShot('serve',forward.clone().scale(5).add(new Vec3(0,.1,0)));const contact=c.shotContactTime(),duration=c.shotDuration(),poses=[];
 const sample=time=>{while(c.animTime<time-1e-9)c.update(Math.min(1/hz,time-c.animTime));return c.analysisPose();};
 for(const u of [.20,.40]){const p=sample(contact*u);assert(Vec3.sub(c.serveBallPoint(c.debugKinematics().contactTarget),p.handL).len()<1e-8,'Ball stays in the tossing palm before release');}
 for(const time of [contact*.5,contact*.70,contact-.002,contact,contact+.002,contact+(duration-contact)*.45,duration*.99])poses.push(sample(time));
 const [load,drop,before,hit,after,release,finish]=poses,continuity=Vec3.dot(Vec3.sub(hit.handR,before.handR).normalize(),Vec3.sub(after.handR,hit.handR).normalize());minContinuity=Math.min(minContinuity,continuity);assert(continuity>.95,`${spec.id}/${hz}: serving wrist reverses at impact (${continuity})`);
 const dropAxis=Vec3.sub(drop.racketCenter,drop.racketGrip);assert(dropAxis.y<-.35&&Vec3.dot(dropAxis,forward)<-.25,'Racket drops behind the wrist before acceleration');
 for(const p of poses){const shaft=Vec3.sub(p.racketCenter,p.racketGrip),frame=compose(new Vec3(),p.racketRot);assert(Math.abs(shaft.len()-RACKET.gripDistance)<1e-6,'Racket rotation preserves shaft length');assert(Vec3.dot(shaft.normalize(),new Vec3(frame[4],frame[5],frame[6]))>.999999,'Rendered shaft follows the measured racket axis');}
 const dropFrame=compose(new Vec3(),drop.racketRot),hitFrame=compose(new Vec3(),hit.racketRot);assert(Math.abs(Vec3.dot(new Vec3(dropFrame[8],dropFrame[9],dropFrame[10]),new Vec3(hitFrame[8],hitFrame[9],hitFrame[10])))<.3,'Racket face rotates out of the edge-on preparation');
 assert(Vec3.sub(release.racketCenter,release.racketGrip).y<-.30,'Racket turns down through the follow-through');assert(Vec3.sub(finish.racketCenter,finish.racketGrip).y>.50,'Recovery returns the racket toward receiving orientation');
 const shoulderTilt=p=>{const d=Vec3.sub(p.shoulderR,p.shoulderL);return Math.atan2(d.y,Math.hypot(d.x,d.z));};
 assert(shoulderTilt(load)<-.12&&shoulderTilt(hit)>.08,'Serve transfers from the elevated tossing shoulder to the elevated hitting shoulder');
 const right=new Vec3(forward.z,0,-forward.x);assert(Vec3.dot(Vec3.sub(load.head,load.pelvisCenter),right)>Vec3.dot(Vec3.sub(hit.head,hit.pelvisCenter),right)+.10,'Upper trunk carries the shoulder transfer instead of only moving the collar');
 assert(hit.handL.y<hit.shoulderL.y-.15,'The tossing arm tucks before impact instead of remaining overhead');
 const error=Vec3.sub(hit.racketCenter,c.debugKinematics().contactTarget).len();maxContactError=Math.max(maxContactError,error);assert(error<1e-6);
 const transfer=Vec3.dot(Vec3.sub(hit.pelvisCenter,load.pelvisCenter),forward),recovery=Vec3.dot(Vec3.sub(finish.footR,hit.footR),forward);minTransfer=Math.min(minTransfer,transfer);minRecovery=Math.min(minRecovery,recovery);assert(transfer>.16,'Hips drive toward contact before impact');assert(recovery>.20,'Trailing leg steps forward into recovery');
 assert(hit.pelvisCenter.y>load.pelvisCenter.y+.10,'Legs extend into impact instead of afterward');
 const frame=captureFrame(c,1,c.serveBallPoint(c.debugKinematics().contactTarget));c.update(1/hz);const next=captureFrame(c,1+1/hz,c.serveBallPoint(c.debugKinematics().contactTarget)),middle=interpolateFrame(frame,next,1+.5/hz);const errorReplay=Vec3.sub(middle.pose.handR,Vec3.lerp(frame.pose.handR,next.pose.handR,.5)).len();maxReplayError=Math.max(maxReplayError,errorReplay);assert(errorReplay<1e-6);cases++;
}
const demo=demonstration('serve',playerSpec('taylor')),toss=demo.frames.filter(f=>f.state==='serve'&&f.ball&&!f.contact&&f.pose.sp<.20);
assert(toss.length>1);for(const f of toss)assert(Vec3.sub(f.ball,f.pose.handL).len()<1e-8,'Analyze Swing demo shares the held-ball serve path');
console.log(JSON.stringify({cases,minContinuity,maxContactError,minTransfer,minRecovery,maxReplayError}));
console.log('Serve PASS: palm release, independent descending toss, leg drive into exact contact, continuous wrist, recovery step and faithful replay.');
