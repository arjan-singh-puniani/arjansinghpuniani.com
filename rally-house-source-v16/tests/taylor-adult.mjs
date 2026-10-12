import assert from 'node:assert/strict';
import {Character} from '../dist/entities/Character.js';import {playerSpec} from '../dist/content/PlayerAvatars.js';import {Navigation} from '../dist/world/Navigation.js';import {Vec3} from '../dist/rendering/Math3D.js';
import {TAYLOR_BODY} from '../dist/animation/TaylorBody.js';import {TAYLOR_FOOTWEAR} from '../dist/animation/TaylorAppearance.js';
import {HUMAN_TAYLOR_GEOMETRY} from '../dist/animation/TaylorHuman.js';
const actor=()=>new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});
const c=actor();c.racketStowed=true;for(let i=0;i<180;i++)c.update(1/60);const rest=c.analysisPose();
assert(rest.pelvisCenter.y>1.20&&rest.pelvisCenter.y<1.29);assert(rest.head.y>2.1&&rest.head.y<2.4);assert(rest.shoulderL.y>1.8);
const face=c.meshes().find(m=>m.skin===HUMAN_TAYLOR_GEOMETRY.face),ys=[];for(let i=1;i<face.skin.positions.length;i+=3)ys.push(face.skin.positions[i]);
const faceHeight=(Math.max(...ys)-Math.min(...ys))*face.scale.y,anatomicalHeight=face.position.y+Math.max(...ys)*face.scale.y-rest.footL.y;
assert(anatomicalHeight/faceHeight>5.5&&anatomicalHeight/faceHeight<8,'Rendered head/body ratio reads as adult, rather than merely lengthening a chibi costume');assert.equal(face.scale.x,1);
let lengths=0,maxStretch=1,maxContactError=0;
const inspect=pose=>{for(const side of ['L','R'])for(const [a,b,l] of [[`shoulder${side}`,`elbow${side}`,TAYLOR_BODY.upperArm],[`elbow${side}`,`hand${side}`,TAYLOR_BODY.forearm],[`hip${side}`,`knee${side}`,TAYLOR_BODY.thigh],[`knee${side}`,`foot${side}`,TAYLOR_BODY.shin]]){const ratio=Vec3.sub(pose[a],pose[b]).len()/l;maxStretch=Math.max(maxStretch,ratio);assert(ratio>.999&&ratio<1.04,`${a}/${b}: no collapsed or exaggerated limb length (${ratio})`);lengths++;}assert.deepEqual(pose.racketGrip,pose.handR);};
for(const hz of [30,60,120])for(const state of ['idle','walk','jog','shuffle','ready','swingForehand','swingBackhand','serve','volley','drink','sit','reach']){
 const c=actor();if(state==='reach')c.setInteractionTarget(new Vec3(.3,1.42,-.5));else c.trigger(state);if(state==='walk'||state==='jog')c.goTo(new Vec3(3,0,1));
 for(let i=0;i<hz*2;i++){c.update(1/hz);inspect(c.analysisPose());}
}
for(const stroke of ['swingForehand','swingBackhand','volley','serve'])for(const height of [.66,1.02,1.38])for(const x of [-.76,.54,.88]){
 const c=actor();c.setAnimation('ready');c.update(.3);if(stroke!=='serve')c.setIncomingContact(new Vec3(x,height,.90));c.triggerShot(stroke,new Vec3(0,.09,-5));
 const time=c.shotContactTime(stroke);for(let i=0;i<60;i++)c.update(time/60);const pose=c.analysisPose();inspect(pose);const error=Vec3.sub(pose.racketCenter,c.debugKinematics().contactTarget).len();maxContactError=Math.max(maxContactError,error);assert(error<1e-6,'Actual world-space racket contact survives adult retargeting');
}
// Crossing state boundaries cannot retarget an already retargeted snapshot.
for(const state of ['walk','idle','ready','swingForehand','idle','sit','idle']){c.trigger(state);if(state==='walk')c.goTo(new Vec3(1,0,1));for(let i=0;i<45;i++){c.update(1/120);const p=c.analysisPose();inspect(p);assert(p.head.y<3&&p.head.y>.7,'Transition height remains bounded');}}
for(const [name,g] of Object.entries(TAYLOR_FOOTWEAR)){
 assert(g.positions.length/9<1200);const edges=new Map(),key=i=>[...g.positions.slice(i*3,i*3+3)].map(v=>v.toFixed(6)).join(',');
 for(let i=0;i<g.positions.length/3;i++){assert([...g.positions.slice(i*3,i*3+3)].every(v=>Number.isFinite(v)&&Math.abs(v)<.27));assert(Math.abs(Math.hypot(...g.normals.slice(i*3,i*3+3))-1)<1e-5);}
 for(let i=0;i<g.positions.length/3;i+=3){const tri=[0,1,2].map(n=>key(i+n));for(let j=0;j<3;j++){const edge=[tri[j],tri[(j+1)%3]].sort().join(';');edges.set(edge,(edges.get(edge)||0)+1);}}
 for(const count of edges.values())assert.equal(count,2,`${name}: closed footwear surface`);
}
console.log(JSON.stringify({adultHeadBodyRatio:anatomicalHeight/faceHeight,limbLengthChecks:lengths,maxStretch,maxContactError}));
console.log('Adult Taylor PASS: rendered adult proportions, stable anatomical chains, planted-foot-compatible transitions, exact world contact and closed contoured footwear.');
