import assert from 'node:assert/strict';import {Character} from '../dist/entities/Character.js';import {playerSpec} from '../dist/content/PlayerAvatars.js';import {memberData} from '../dist/content/content.js';import {Navigation} from '../dist/world/Navigation.js';import {Vec3,compose,transformPoint} from '../dist/rendering/Math3D.js';import {HUMAN_TENNIS_SKIN,ATHLETE_WARDROBE,rigFromPose,skinMatrices,BONE} from '../dist/animation/CharacterSkin.js';import {HUMAN_TAYLOR_GEOMETRY} from '../dist/animation/TaylorHuman.js';
function surface(mesh){const g=mesh.skin,world=compose(mesh.position,mesh.rotation,mesh.scale),out=[];for(let i=0;i<g.positions.length/3;i++){const p=new Vec3(...g.positions.slice(i*3,i*3+3)),v=new Vec3();for(let n=0;n<4;n++){const w=g.boneWeights[i*4+n];if(w){const q=transformPoint(mesh.boneMatrices.slice(g.boneIndices[i*4+n]*16,g.boneIndices[i*4+n]*16+16),p);v.add(new Vec3(q.x,q.y,q.z).scale(w));}}const q=transformPoint(world,v);out.push(q.x,q.y,q.z);}return out;}
function depths(p,x,y){const hits=[];for(let i=0;i<p.length;i+=9){const ax=p[i],ay=p[i+1],bx=p[i+3],by=p[i+4],cx=p[i+6],cy=p[i+7],det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(det)<1e-12)continue;const a=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/det,b=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/det,c=1-a-b;if(a>=-1e-6&&b>=-1e-6&&c>=-1e-6)hits.push(a*p[i+2]+b*p[i+5]+c*p[i+8]);}return hits;}
let checks=0;const failures=[];
for(const spec of [playerSpec('taylor'),...memberData.filter(s=>s.presentation==='feminine')])for(const state of ['idle','watch','drink','talk']){
 const c=new Character(spec,new Vec3(),new Navigation([]),{});c.racketStowed=true;for(let i=0;i<180;i++)c.update(1/60);c.trigger(state);
 for(let frame=0;frame<240;frame++){c.update(1/60);if(frame%30)continue;const p=c.analysisPose(),meshes=c.meshes(),body=surface(meshes.find(m=>m.skin===HUMAN_TENNIS_SKIN.dress||m.skin===ATHLETE_WARDROBE.bodice));
  for(const side of ['L','R'])for(const t of [.2,.5,.8,1]){const v=Vec3.lerp(p[`elbow${side}`],p[`hand${side}`],t);if(v.y<p.pelvisCenter.y+.08||v.y>p[`shoulder${side}`].y-.16)continue;const hits=depths(body,v.x,v.y);if(hits.length>1&&v.z>Math.min(...hits)+.015&&v.z<Math.max(...hits)-.015)failures.push({actor:spec.id,state,frame,side,t,point:v});checks++;}
 }
}
// Probe the emitted thigh's front as the knee crosses hip height. The old
// forward-hint frame inverted this surface at 90 degrees despite valid joints.
const seated=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});seated.seatDepth=.8;seated.trigger('sit');for(let i=0;i<120;i++)seated.update(1/120);
const pose=seated.analysisPose(),rig=rigFromPose(pose,seated.position,seated.yaw),leg=ATHLETE_WARDROBE.legs;let vertex=0,best=-Infinity;
for(let i=0;i<leg.positions.length/3;i++)if(leg.boneIndices[i*4]===BONE.thighL&&leg.boneWeights[i*4]>.999&&leg.positions[i*3+1]>.74&&leg.positions[i*3+2]>best){best=leg.positions[i*3+2];vertex=i;}
let rollChecks=0,maxRollStep=0;
for(const angle of [0,.7,Math.PI]){rig.forward.set(Math.sin(angle),0,Math.cos(angle));rig.thighL.set(-.16,.76,0);let prior=null;for(let height=-.04;height<=.0401;height+=.002){rig.shinL.set(-.16+Math.sin(angle)*.55,.76+height,Math.cos(angle)*.55);const bones=skinMatrices(rig),p=transformPoint(bones.slice(BONE.thighL*16,BONE.thighL*16+16),new Vec3(...leg.positions.slice(vertex*3,vertex*3+3))),point=new Vec3(p.x,p.y,p.z);assert(point.y>.84,'The front of a seated thigh remains above the leg');if(prior){const step=Vec3.sub(point,prior).len();maxRollStep=Math.max(maxRollStep,step);assert(step<.005,'No skin roll flip while a knee passes hip height');}prior=point;rollChecks++;}}
const skirt=seated.meshes().find(m=>m.skin===HUMAN_TENNIS_SKIN.dress),points=surface(skirt);let hem=-1,hemError=Infinity;
for(let i=0;i<skirt.skin.positions.length/3;i++){const x=skirt.skin.positions[i*3],y=skirt.skin.positions[i*3+1],z=skirt.skin.positions[i*3+2],error=Math.abs(y-.575)*10+Math.abs(x);if(z>0&&error<hemError){hem=i;hemError=error;}}
const hip=Vec3.lerp(pose.hipL,pose.hipR,.5);assert(points[hem*3+1]>hip.y+.10&&points[hem*3+2]>hip.z+.20,'The actual seated front hem covers the lap instead of hanging through it');
let rear=-1,rearError=Infinity;
for(let i=0;i<skirt.skin.positions.length/3;i++){const x=skirt.skin.positions[i*3],y=skirt.skin.positions[i*3+1],z=skirt.skin.positions[i*3+2],error=Math.abs(y-.575)*10+Math.abs(x);if(z<0&&error<rearError){rear=i;rearError=error;}}
assert(points[rear*3+2]<hip.z+.05&&points[rear*3+1]<hip.y-.10,'The back hem drapes below the seat instead of being pulled onto the lap');
const cap=HUMAN_TAYLOR_GEOMETRY.cap.positions,face=HUMAN_TAYLOR_GEOMETRY.face.positions;let hairChecks=0,minHairGap=Infinity;
for(let i=0;i<cap.length;i+=9){const x=(cap[i]+cap[i+3]+cap[i+6])/3,y=(cap[i+1]+cap[i+4]+cap[i+7])/3,z=(cap[i+2]+cap[i+5]+cap[i+8])/3;if(z<=0||y>.15)continue;const hits=depths(face,x,y);if(hits.length){const gap=z-Math.max(...hits);minHairGap=Math.min(minHairGap,gap);assert(gap>.002,'The emitted scalp stays outside the actual face at the hairline');hairChecks++;}}
console.log(JSON.stringify({checks,rollChecks,maxRollStep,hairChecks,minHairGap,failures:failures.slice(0,12),failureCount:failures.length}));assert.equal(failures.length,0,'Unconstrained wrists and forearms stay outside the actual clothing surface');
console.log('Body clearance PASS: actual skinned torso intersections and scalp/face separation through ordinary social poses.');

let seatChecks=0,maxSeatStep=0;
for(const hz of [30,60,120]){const c=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});c.racketStowed=true;c.seatDepth=.8;for(let i=0;i<hz;i++)c.update(1/hz);let previous=c.analysisPose().pelvisCenter;
 for(const state of ['sit','idle']){c.trigger(state);for(let i=0;i<hz;i++){c.update(1/hz);const p=c.analysisPose(),step=Vec3.sub(p.pelvisCenter,previous).len();maxSeatStep=Math.max(maxSeatStep,step);assert(step<.10,'Entering and leaving a seat cannot snap the adult pelvis');previous=p.pelvisCenter;seatChecks++;}
  if(state==='sit'){const p=c.analysisPose();for(const side of ['L','R']){const lap=Vec3.lerp(p[`hip${side}`],p[`knee${side}`],.6);assert(p[`hand${side}`].y>lap.y+.10,'Seated hands rest above the thighs');}}
 }
}
console.log(JSON.stringify({seatChecks,maxSeatStep}));
