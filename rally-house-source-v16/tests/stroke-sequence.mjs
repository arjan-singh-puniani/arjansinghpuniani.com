import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const root=process.env.QA_RUNTIME?pathToFileURL(process.env.QA_RUNTIME+'/'):new URL('../',import.meta.url);
const [{Character},{playerSpec},{memberData},{Navigation},{Vec3},{loadAuthoredAthlete},{captureFrame,interpolateFrame},{skinMatrices}]=await Promise.all(['entities/Character','content/PlayerAvatars','content/content','world/Navigation','rendering/Math3D','animation/AuthoredAthlete','analysis/MotionCapture','animation/CharacterSkin'].map(p=>import(new URL('dist/'+p+'.js',root))));
const previousFetch=globalThis.fetch,previousImage=globalThis.Image;
try{
 globalThis.fetch=async url=>new Response(fs.readFileSync(new URL(url)));globalThis.Image=class{async decode(){}};await loadAuthoredAthlete();
 let cases=0,minContinuity=1,maxContactError=0;
 for(const spec of [playerSpec('taylor'),playerSpec('arjan'),...memberData])for(const hz of [30,60,120])for(const stroke of ['swingForehand','swingBackhand'])for(const height of [.66,1.02,1.38]){
  const c=new Character(spec,new Vec3(1,0,2),new Navigation([]),{});c.yaw=.7;c.targetYaw=.7;c.matchCompetitor=true;c.setAnimation('ready');for(let i=0;i<hz;i++)c.update(1/hz);
  const front=new Vec3(Math.sin(c.yaw),0,Math.cos(c.yaw)),side=new Vec3(front.z,0,-front.x),target=c.position.clone().add(front.clone().scale(.8)).add(side.clone().scale(stroke==='swingForehand'?.6:-.6));target.y=height;
  c.setIncomingContact(target);c.triggerShot(stroke,c.position.clone().add(front.clone().scale(5)));const contact=c.shotContactTime(),duration=c.shotDuration(),times=[contact*.30,contact*.60,contact-.005,contact,contact+.005,duration*.98],poses=[];
  for(const time of times){while(c.animTime<time-1e-9)c.update(Math.min(1/hz,time-c.animTime));poses.push(c.analysisPose());}
  const [raised,drop,before,hit,after,finish]=poses;
  assert(raised.racketCenter.y-raised.racketGrip.y>.04,'Preparation carries the racket above the wrist');assert(drop.racketCenter.y-drop.racketGrip.y<-.12,'The racket drops below the wrist before driving up to impact');
  const incoming=Vec3.sub(hit.handR,before.handR).normalize(),outgoing=Vec3.sub(after.handR,hit.handR).normalize(),continuity=Vec3.dot(incoming,outgoing);minContinuity=Math.min(minContinuity,continuity);
  assert(continuity>.95,`${spec.id}/${stroke}/${hz}/${height}: wrist reverses at contact (${continuity})`);
  assert(Vec3.dot(Vec3.sub(after.handR,before.handR),front)>0,'The wrist extends through the ball before wrapping');
  const error=Vec3.sub(hit.racketCenter,c.debugKinematics().contactTarget).len();maxContactError=Math.max(maxContactError,error);assert(error<1e-6,'The continuous stroke must retain exact sweet-spot contact');
  assert(finish.handR.y>finish.shoulderR.y-.08,'The finish reaches the opposite shoulder');cases++;
 }
 const replayActor=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});replayActor.matchCompetitor=true;replayActor.setAnimation('ready');for(let i=0;i<30;i++)replayActor.update(1/60);replayActor.triggerShot('swingBackhand',new Vec3(0,.1,5));for(let i=0;i<12;i++)replayActor.update(1/60);
 const a=captureFrame(replayActor,.2,null);replayActor.update(1/30);const b=captureFrame(replayActor,.2+1/30,null),middle=interpolateFrame(a,b,.2+1/60),part=middle.body.find(m=>m.rig),phase=Math.max(0,Math.min(1,middle.pose.sp/.15)),expected=skinMatrices(part.rig.pose,part.rig.bind,phase*phase*(3-2*phase));
 const replayPaletteError=Math.max(...expected.map((n,i)=>Math.abs(n-part.boneMatrices[i])));assert(replayPaletteError<1e-6,'Fractional replay must keep the live forearm roll correction');
 console.log(JSON.stringify({cases,minContinuity,maxContactError,replayPaletteError}));
}finally{globalThis.fetch=previousFetch;globalThis.Image=previousImage;}
