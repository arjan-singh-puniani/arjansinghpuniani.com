import assert from 'node:assert/strict';
import {Vec3,transformPoint} from '../dist/rendering/Math3D.js';
import {HUMAN_TAYLOR_GEOMETRY,HUMAN_FACE_VARIANTS} from '../dist/animation/TaylorHuman.js';
import {CHARACTER_SKIN,ATHLETE_WARDROBE} from '../dist/animation/CharacterSkin.js';
import {ATHLETE_TRAINER_DETAIL,TAYLOR_FOOTWEAR} from '../dist/animation/TaylorAppearance.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {World} from '../dist/world/World.js';
import {RACKET_FRAME} from '../dist/animation/RacketGeometry.js';

const pupil=HUMAN_TAYLOR_GEOMETRY.pupil.positions;
for(const side of [-1,1]){const points=[];for(let i=0;i<pupil.length;i+=3)if(Math.sign(pupil[i])===side)points.push([pupil[i],pupil[i+1]]);const span=k=>Math.max(...points.map(p=>p[k]))-Math.min(...points.map(p=>p[k]));assert(Math.abs(span(0)/span(1)-1)<.01,'Human pupils have a circular emitted aperture');}
const face=HUMAN_FACE_VARIANTS.masculineFace,edges=new Map();
const key=(g,i)=>[...g.positions.slice(i,i+3)].map(v=>Number(v.toFixed(6))).join(',');
for(let i=0;i<face.positions.length;i+=9){const points=[0,3,6].map(k=>key(face,i+k));for(let j=0;j<3;j++){const edge=[points[j],points[(j+1)%3]].sort().join(';');edges.set(edge,(edges.get(edge)||0)+1);}}
for(const count of edges.values())assert.equal(count,2,'Masculine jaw remains a closed facial surface');
for(const g of [face,...Object.values(ATHLETE_TRAINER_DETAIL)])for(let i=0;i<g.positions.length;i+=9){const a=new Vec3(...g.positions.slice(i,i+3)),b=new Vec3(...g.positions.slice(i+3,i+6)),c=new Vec3(...g.positions.slice(i+6,i+9)),n=new Vec3(...g.normals.slice(i,i+3)),cross=Vec3.cross(Vec3.sub(b,a),Vec3.sub(c,a));assert(cross.len()>1e-10&&Vec3.dot(cross,n)>0);assert([...g.positions.slice(i,i+9)].every(Number.isFinite));}
// Recover the actual two emitted knee boundaries, rather than checking only
// their joint centers. Center registration alone cannot detect a radial gap.
function ring(g,side){const center=new Vec3(side*.17,.43,.04),axis=new Vec3(0,-.32,.04).normalize(),vertices=new Map();for(let i=0;i<g.positions.length;i+=3){const p=new Vec3(...g.positions.slice(i,i+3));if(Vec3.sub(p,center).len()<.16&&Math.abs(Vec3.dot(Vec3.sub(p,center),axis))<1e-6)vertices.set(key(g,i),i/3);}assert.equal(vertices.size,24);return [...vertices.values()];}
const thigh=ATHLETE_WARDROBE.legs,calf=ATHLETE_WARDROBE.calves,pairs=[];
for(const side of [-1,1]){const a=ring(thigh,side),b=ring(calf,side);for(const i of a){const p=new Vec3(...thigh.positions.slice(i*3,i*3+3)),j=b.reduce((best,j)=>Vec3.sub(p,new Vec3(...calf.positions.slice(j*3,j*3+3))).len()<Vec3.sub(p,new Vec3(...calf.positions.slice(best*3,best*3+3))).len()?j:best);assert(Vec3.sub(p,new Vec3(...calf.positions.slice(j*3,j*3+3))).len()<1e-7);pairs.push([i,j]);}}
const deform=(g,i,bones)=>{const out=new Vec3(),p=new Vec3(...g.positions.slice(i*3,i*3+3));for(let n=0;n<4;n++){const w=g.boneWeights[i*4+n];if(w){const v=transformPoint(bones.slice(g.boneIndices[i*4+n]*16,g.boneIndices[i*4+n]*16+16),p);out.add(new Vec3(v.x,v.y,v.z).scale(w));}}return out;};
let kneeChecks=0,maxKneeGap=0;
for(const hz of [30,60,120])for(const state of ['idle','walk','serve','swingForehand','reach']){const c=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});if(state==='reach')c.setInteractionTarget(new Vec3(.4,1.6,.5));else c.trigger(state);if(state==='walk')c.goTo(new Vec3(1,0,3));for(let f=0;f<30;f++){c.update(1/hz);const parts=c.meshes(),a=parts.find(m=>m.skin===thigh).boneMatrices,b=parts.find(m=>m.skin===calf).boneMatrices;for(const [i,j] of pairs){const gap=Vec3.sub(deform(thigh,i,a),deform(calf,j,b)).len();maxKneeGap=Math.max(maxKneeGap,gap);assert(gap<1e-6,'Actual knee boundaries stay joined during animation');kneeChecks++;}}}
// Intersect the actual trainer triangles in X/Z to ensure the added laces
// follow the upper surface instead of floating beside or passing through it.
function shoeTop(x,z){const p=TAYLOR_FOOTWEAR.upper.positions;let y=-Infinity;for(let i=0;i<p.length;i+=9){const ax=p[i],az=p[i+2],bx=p[i+3],bz=p[i+5],cx=p[i+6],cz=p[i+8],det=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(det)<1e-12)continue;const a=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/det,b=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/det,c=1-a-b;if(a>=-1e-6&&b>=-1e-6&&c>=-1e-6)y=Math.max(y,a*p[i+1]+b*p[i+4]+c*p[i+7]);}return y;}
let trainerChecks=0;for(const g of Object.values(ATHLETE_TRAINER_DETAIL))for(let i=0;i<g.positions.length;i+=3){const gap=g.positions[i+1]-shoeTop(g.positions[i],g.positions[i+2]);assert(gap>0&&gap<.008,'Emitted trainer detail stays just above its real shoe surface');trainerChecks++;}
console.log(JSON.stringify({kneeChecks,maxKneeGap,trainerChecks,masculineTriangles:face.positions.length/9}));
const w=new World(),baseline=w.meshes.filter(m=>Math.abs(m.position.y-.085)<1e-6&&Math.abs(m.scale.z-.055)<1e-6&&m.scale.x>3&&Math.abs(m.position.z)>6),width=baseline[0].scale.x,length=Math.abs(baseline[0].position.z-baseline[1].position.z);
assert.equal(baseline.length,2);assert(Math.abs(length/width-23.77/10.97)<1e-6,'Emitted outer court markings use the regulation aspect ratio');
const service=w.meshes.filter(m=>Math.abs(m.position.y-.085)<1e-6&&Math.abs(m.scale.z-.045)<1e-6&&m.scale.x>3&&Math.abs(m.position.z)>3);
assert.equal(service.length,2);assert(Math.abs(service[0].scale.x/width-8.23/10.97)<1e-6,'Service boxes end at singles sidelines, preserving doubles alleys');
assert(Math.abs(Math.abs(service[0].position.z)/length-6.40/23.77)<1e-6);
const rp=RACKET_FRAME.positions,xs=[...rp.filter((_,i)=>i%3===0)],ys=[...rp.filter((_,i)=>i%3===1)],headWidth=Math.max(...xs)-Math.min(...xs),headHeight=Math.max(...ys)-Math.min(...ys);
assert(headWidth>.35&&headWidth<.40&&headHeight>.49&&headHeight<.53,'Actual adult racket head stays proportional to the 2.4-unit player');
console.log(JSON.stringify({courtLength:length,courtDoublesWidth:width,racketHeadWidth:headWidth,racketHeadHeight:headHeight}));
console.log('Surface realism PASS: round pupils, closed facial variant, continuous knees, registered trainers, regulation court ratios and proportional racket head.');
