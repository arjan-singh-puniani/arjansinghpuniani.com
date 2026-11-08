import assert from 'node:assert/strict';
import {PhoneCapture,PHONE_ANCHOR,PHONE_MARK,phoneMeshes} from '../dist/analysis/PhoneCapture.js';
import {Character} from '../dist/entities/Character.js';import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {World} from '../dist/world/World.js';import {Vec3} from '../dist/rendering/Math3D.js';import {CameraController} from '../dist/rendering/CameraController.js';
import {PerformanceLab} from '../dist/analysis/PerformanceLab.js';import {ReplayTimeline} from '../dist/analysis/MotionCapture.js';

class Element {
 children=[];dataset={};classList={add(){},remove(){}};hidden=false;
 constructor(tag){this.tag=tag;}append(...nodes){this.children.push(...nodes);}setAttribute(){}addEventListener(){}focus(){}remove(){}
 querySelector(tag){for(const c of this.children){if(c.tag===tag)return c;const child=c.querySelector?.(tag);if(child)return child;}return null;}
}
const previousDocument=globalThis.document,previousPerformance=globalThis.performance,previousMediaRecorder=globalThis.MediaRecorder;
let milliseconds=0;const app=new Element('app');globalThis.document={createElement:t=>new Element(t),body:new Element('body'),getElementById:()=>app};globalThis.performance={now:()=>milliseconds};globalThis.MediaRecorder=undefined;
try{
 const world=new World(),station=world.objects.find(o=>o.id==='performanceLab');
 assert(!world.nav.isBlocked(PHONE_MARK.x,PHONE_MARK.z));assert(world.identity.actions(station,800).some(a=>a.id==='capture'));
 for(const avatar of ['taylor','arjan'])for(const hz of [30,60,120]){
  const c=new Character(playerSpec(avatar),station.careSpot,world.nav,{}),canvas={focus(){},clientWidth:1440,clientHeight:900},camera=new CameraController(canvas),prior=camera.captureState(),p=new PhoneCapture(camera,canvas);
  let completed=0,cancelled=0,held=0,recorded=0;p.onComplete=()=>completed++;p.onCancel=()=>cancelled++;p.open(c);
  for(let i=0;i<hz*22&&p.active;i++){
   milliseconds+=1000/hz;p.update(1/hz);p.frameCamera(true);p.afterRender();
   if(p.phase==='mounting'){assert.deepEqual(p.meshes()[0].position,c.analysisPose().handR,'Phone belongs to the actual moving hand');held++;}
   if(p.phase==='recording'){assert(Vec3.sub(camera.position,PHONE_ANCHOR.clone().add(new Vec3(0,0,.04))).len()<1e-6,'Recording camera stays at the physical phone lens');recorded++;}
  }
  assert.equal(completed,1,`${avatar}/${hz}: actual mounted sequence completes`);assert.equal(cancelled,0);assert(held>10&&recorded>100);
  assert(p.last.clip.frames.length>100&&p.last.clip.frames.length<=360);assert.equal(p.last.clip.source,'phone-recording');assert.equal(p.last.url,null,'Unsupported encoder truthfully yields motion replay only');
  assert(p.last.clip.frames.every((f,i)=>i===0||f.time>p.last.clip.frames[i-1].time));assert(p.last.clip.frames.some(f=>f.state==='swingForehand'));
  assert.deepEqual(camera.captureState(),prior,'Capture returns the complete prior camera');assert.equal(c.majorActivity,false);assert(p.mounted);
  const northWall=world.meshes.find(m=>m.position.z===-9.75&&m.scale.x===26),nearEdge=northWall.position.z+northWall.scale.z/2;
  for(const width of [390,1440])for(const mode of ['body','combined']){
   const view=new CameraController(canvas);view.setAspect(width===390?390/844:1440/900);const timeline=new ReplayTimeline(p.last.clip);timeline.mode=mode;timeline.seek(timeline.start+(timeline.end-timeline.start)*.5);
   const lab={timeline,camera:view,canvas:{clientWidth:width,clientHeight:width===390?844:900},layer:{querySelector:()=>({getBoundingClientRect:()=>({bottom:56})})},panel:{getBoundingClientRect:()=>({top:436})},trackCamera:PerformanceLab.prototype.trackCamera};PerformanceLab.prototype.frameCamera.call(lab);view.target=view.desiredTarget.clone();view.distance=view.desiredDistance;view.azimuth=view.desiredAzimuth;view.elevation=view.desiredElevation;view.update(0);
   assert(view.position.z>nearEdge,'Phone review camera cannot hide the body behind the actual opaque back wall');PerformanceLab.prototype.zoom.call(lab,10000);assert(view.desiredDistance<15,'Phone inspection zoom cannot leave the authored room');
  }
  const first=p.last.clip.frames[0],root=first.root.clone();c.position.set(12,0,7);assert.deepEqual(first.root,root,'Motion recording is detached from future movement');
  p.dispose();
 }
 for(const phase of ['mounting','step-back','countdown','recording']){
  const c=new Character(playerSpec('taylor'),station.careSpot,world.nav,{}),canvas={focus(){}},camera=new CameraController(canvas),prior=camera.captureState(),p=new PhoneCapture(camera,canvas);let cancelled=0;p.onCancel=()=>cancelled++;p.open(c);
  for(let i=0;i<1500&&p.phase!==phase;i++){milliseconds+=1000/60;p.update(1/60);p.afterRender();}assert.equal(p.phase,phase);p.cancel();p.cancel();assert.equal(cancelled,1);assert(!p.active);assert.equal(p.last,null);assert.deepEqual(camera.captureState(),prior);p.dispose();
 }
 const original=new Vec3(2,3,4);assert(phoneMeshes(original,true).every(m=>Object.values(m.position).every(Number.isFinite)));assert.deepEqual(original,new Vec3(2,3,4));
 // A cancelled encoder may deliver stop/data callbacks after another recording begins.
 const recorders=[],tracks=[];globalThis.MediaRecorder=class {
  static isTypeSupported(){return true;}state='inactive';mimeType='video/webm';
  constructor(){recorders.push(this);}start(){this.state='recording';}stop(){this.state='inactive';}
 };
 const canvas={focus(){},captureStream(){const t={readyState:'live',stop(){this.readyState='ended';}};tracks.push(t);return {getTracks:()=>[t]};}},camera=new CameraController(canvas),c=new Character(playerSpec('arjan'),station.careSpot,world.nav,{}),p=new PhoneCapture(camera,canvas);
 const reachRecording=()=>{for(let i=0;i<1500&&p.phase!=='recording';i++){milliseconds+=1000/60;p.update(1/60);p.afterRender();}assert.equal(p.phase,'recording');};
 p.open(c);reachRecording();p.cancel();assert.equal(tracks[0].readyState,'ended');p.open(c);reachRecording();
 recorders[0].ondataavailable({data:new Blob(['late'])});recorders[0].onstop();
 assert.equal(tracks[1].readyState,'live','Late callback cannot stop a new capture stream');assert(p.active);assert.equal(p.chunks.length,0,'Cancelled encoder data stays discarded');
 p.cancel();recorders[1].onstop();assert.equal(tracks[1].readyState,'ended');p.dispose();
}finally{globalThis.document=previousDocument;globalThis.performance=previousPerformance;globalThis.MediaRecorder=previousMediaRecorder;}
console.log('Phone capture PASS: both selected avatars at three rates, exact hand attachment and anchored lens, detached real pose samples, truthful encoder fallback, cancellation in four phases, late recorder isolation and complete camera restoration.');
