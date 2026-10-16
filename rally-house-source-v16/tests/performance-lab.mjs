import assert from 'node:assert/strict';
import {Vec3} from '../dist/rendering/Math3D.js';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {World} from '../dist/world/World.js';
import {angle,metric,value,summary,captureFrame,MotionRecorder,ReplayTimeline} from '../dist/analysis/MotionCapture.js';
import {demonstration} from '../dist/analysis/LabDemonstrations.js';
import {PerformanceLab,rod,COURT_OVERLAY} from '../dist/analysis/PerformanceLab.js';
import {simulation} from '../qa/sim-harness.mjs';

const spec={id:'player',name:'Player',role:'Founder',shirt:'#d89a77',skin:'#d3a17d',hair:'#3e332b',playStyle:'',goal:''};
const a=new Vec3(1,0,0),v=new Vec3(),b=new Vec3(0,1,0);
assert.equal(angle(a,v,b),90);assert.equal(angle(a,v,a),0);assert.equal(angle(a,v,new Vec3(-1,0,0)),180);
assert.equal(angle(v,v,b),null);assert.equal(angle(new Vec3(Infinity,0,0),v,b),null);
const clips=['gait','forehand','serve'].map(k=>demonstration(k,spec));
for(const clip of clips){
 const t=new ReplayTimeline(clip),s=summary(clip);assert(s.duration>3);
 assert(clip.frames.every((f,i)=>!i||f.time>clip.frames[i-1].time));
 for(const f of clip.frames){
  for(const j of ['knee','hip','shoulder','elbow']){const n=metric(f,j);assert(n!==null&&n>=0&&n<=180);}
  assert.equal(metric(f,'ankle'),null,'A rig without a toe/heel cannot fabricate ankle flexion');
  assert.equal(value(f,'ankle'),f.pose.footR.y);
  for(const part of f.body){assert(Object.values(part.position).every(Number.isFinite));if('skin' in part)assert(part.boneMatrices.every(Number.isFinite));}
  t.seek(f.time);assert.equal(t.frame,f,'Avatar, metric, ball and events resolve to one recorded sample');
 }
 t.seek(-1);assert.equal(t.time,t.start);t.seek(1000);assert.equal(t.time,t.end);assert.equal(t.frame,clip.frames.at(-1));t.seek(NaN);assert.equal(t.time,t.end);
 t.seek(t.start);t.playing=false;t.update(.1,true);assert.equal(t.time,t.start);
 if(clip.kind==='gait'){assert(s.distance>5&&s.distance<5.6);assert(s.steps>=8);assert(s.cadence>100&&s.cadence<210);assert(s.stride>0);assert(s.stance.every(n=>n>10&&n<90));}
 else{assert.equal(s.contacts,1);assert.equal(s.bounces,1);assert.equal(s.cadence,null);const f=clip.frames.find(f=>f.contact);assert(Vec3.sub(f.ball,f.pose.racketCenter).len()<1e-6,'Ball release belongs to the captured racket');t.seek(f.time);t.playing=true;t.update(.05,true);assert(Math.abs(t.time-f.time-.011)<1e-9);}
}
assert.throws(()=>new ReplayTimeline({...clips[0],frames:[]}),/samples/);
assert.throws(()=>new ReplayTimeline({...clips[0],frames:[clips[0].frames[0],clips[0].frames[0]]}),/samples/);
const gap=new ReplayTimeline({...clips[0],frames:[clips[0].frames[0],{...clips[0].frames[1],time:3}]});gap.seek(1.5);assert.equal(gap.frame,null,'A replay gap must remain missing');
assert.equal(summary(gap.clip).distance,0,'Missing intervals cannot invent travelled distance');assert.equal(summary(gap.clip).cadence,null);
const lensTimeline=new ReplayTimeline(clips[1]),lens={timeline:lensTimeline,contactLens:true,separateRig:false};
for(const frame of clips[1].frames){lensTimeline.seek(frame.time);assert.equal(PerformanceLab.prototype.rigOffset.call(lens,false).len(),0,'Every default sample remains registered, including contact');assert.equal(PerformanceLab.prototype.rigOffset.call(lens,true).len(),0);}
lens.separateRig=true;for(const frame of clips[1].frames){lensTimeline.seek(frame.time);assert.equal(PerformanceLab.prototype.rigOffset.call(lens,false).x,.85,'Explicit separation stays still throughout the replay');assert.equal(PerformanceLab.prototype.rigOffset.call(lens,true).x,.85);}
const c=new Character(spec,new Vec3(),new Navigation([]),{}),snapshot=captureFrame(c,0,null),position=snapshot.body[0].position.clone(),bones=snapshot.body.find(m=>'skin' in m).boneMatrices.slice();
c.position.set(4,0,3);c.triggerShot('serve',new Vec3(0,0,-4));c.update(.2);assert.deepEqual(snapshot.body[0].position,position);assert.deepEqual(snapshot.body.find(m=>'skin' in m).boneMatrices,bones);
const r=new MotionRecorder();for(let i=0;i<6000;i++){if(i%37===0)r.markContact();r.record(1/60,c,c.racketContactPoint());}assert.equal(r.clip.frames.length,r.capacity);assert(r.clip.frames.some(f=>f.contact));assert(r.clip.frames[0].time>80);
r.reset();assert.equal(r.clip.frames.length,0);r.record(NaN,c,null);assert.equal(r.clip.frames.length,0);r.markBounce();r.record(1/120,c,null);assert.equal(r.clip.frames.length,1);assert(r.clip.frames[0].bounce);
const world=new World(),station=world.objects.find(o=>o.id==='performanceLab');assert(station?.selection);assert(world.nav.isBlocked(station.position.x,station.position.z));assert(!world.nav.isBlocked(station.careSpot.x,station.careSpot.z));assert.equal(world.identity.actions(station,800)[0].id,'analyze');
const court=world.meshes.find(m=>m.material==='court');assert(court,'Authoritative court surface exists');
const courtTop=court.position.y+court.scale.y/2;assert(COURT_OVERLAY.coverage-.005>courtTop,'Coverage must clear the actual floor');assert(COURT_OVERLAY.coverage+.005<.085,'Court markings remain above coverage');assert(COURT_OVERLAY.path-.014>.098,'Paths and event rings clear the court markings');
const g=simulation();g.performanceLab={active:true};const prior=g.clock.minutes,root=g.player.position.clone();for(let i=0;i<100;i++)g.updateFixed(1/60);assert(g.clock.minutes>prior);assert.deepEqual(g.player.position,root,'Read-only pose review does not teleport the live player');
for(const end of [new Vec3(1,2,3),new Vec3(0,-1,0),new Vec3()]){const m=rod(new Vec3(),end,'#fff');assert(Object.values(m.rotation).every(Number.isFinite));}
console.log('Performance Lab PASS: synchronized poses/metrics/events, three real-solver demos, gap abstention, contact authority, bounded capture, snapshot isolation, gait metrics and persistent live simulation.');
