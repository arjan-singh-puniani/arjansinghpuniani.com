import assert from 'node:assert/strict';
import {captureFrame,interpolateFrame} from '../dist/analysis/MotionCapture.js';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {CAST_DESIGN} from '../dist/content/CastDesign.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,compose,transformPoint,invertRigid} from '../dist/rendering/Math3D.js';
import {ATHLETE_WARDROBE,skinMatrices,rigFromPose} from '../dist/animation/CharacterSkin.js';
import {ARJAN_FACE_POINTS,ARJAN_FACE_TRIANGLES} from '../dist/animation/ArjanFaceData.js';
import {ARJAN_HEAD_GEOMETRY,HUMAN_FACE_VARIANTS,HUMAN_TAYLOR_GEOMETRY,humanTaylorHead} from '../dist/animation/TaylorHuman.js';

const surfaces=[...Object.values(ARJAN_HEAD_GEOMETRY),HUMAN_FACE_VARIANTS.arjanFace,ATHLETE_WARDROBE.arjanTop,ATHLETE_WARDROBE.arjanArms,ATHLETE_WARDROBE.arjanBand,ATHLETE_WARDROBE.arjanShorts];
for(const g of surfaces){
 assert(g.positions.length>0&&g.positions.length===g.normals.length&&g.positions.length/9<15000,g.id+' bounded surface');
 for(let i=0;i<g.positions.length;i+=3){
  assert([...g.positions.subarray(i,i+3)].every(Number.isFinite),g.id+' finite positions');
  assert(Math.abs(Math.hypot(...g.normals.subarray(i,i+3))-1)<1e-5,g.id+' unit normals');
  const v=i/3,w=[...g.boneWeights.subarray(v*4,v*4+4)];assert(w.every(x=>x>=0&&x<=1));assert(Math.abs(w.reduce((a,b)=>a+b,0)-1)<1e-6,g.id+' normalized skin weights');
 }
 if(g.morphs){assert.equal(g.morphs.length,5);assert.equal(g.morphNormals.length,5);for(const values of [...g.morphs,...g.morphNormals])assert(values.length===g.positions.length&&values.every(Number.isFinite),'Bounded renderer-compatible expression channels');}
 for(let i=0;i<g.positions.length;i+=9){const [a,b,c]=[0,3,6].map(k=>new Vec3(...g.positions.subarray(i+k,i+k+3)));assert(Vec3.cross(Vec3.sub(b,a),Vec3.sub(c,a)).len()>1e-10,g.id+' noncollapsed triangles');}
}
// Verify actual emitted reference coordinates, not similarity to a generic template.
const face=HUMAN_FACE_VARIANTS.arjanFace;
for(const id of [1,4,10,13,17,33,61,152,234,263,291,454])assert(Array.from({length:face.positions.length/3},(_,i)=>Math.hypot(...ARJAN_FACE_POINTS[id].map((v,k)=>v-face.positions[i*3+k]))).some(d=>d<1e-7),'Reference landmark is retained in the emitted face: '+id);
// Hair roots must sit on the emitted skull, rather than on an unrelated oval approximation.
const cap=ARJAN_HEAD_GEOMETRY.cap;
for(let i=0;i<80;i++){
 const p=new Vec3(...cap.positions.subarray(i*18,i*18+3));let nearest=Infinity;
 for(let j=0;j<face.positions.length;j+=9){const a=new Vec3(...face.positions.subarray(j,j+3)),b=new Vec3(...face.positions.subarray(j+3,j+6)),c=new Vec3(...face.positions.subarray(j+6,j+9)),v0=Vec3.sub(b,a),v1=Vec3.sub(c,a),n=Vec3.cross(v0,v1).normalize(),distance=Vec3.dot(Vec3.sub(p,a),n),q=p.clone().sub(n.clone().scale(distance)),v2=Vec3.sub(q,a),d00=Vec3.dot(v0,v0),d01=Vec3.dot(v0,v1),d11=Vec3.dot(v1,v1),d20=Vec3.dot(v2,v0),d21=Vec3.dot(v2,v1),det=d00*d11-d01*d01;if(det<1e-15)continue;const u=(d11*d20-d01*d21)/det,v=(d00*d21-d01*d20)/det;if(u>=0&&v>=0&&u+v<=1)nearest=Math.min(nearest,Math.abs(distance));for(const [start,end] of [[a,b],[b,c],[c,a]]){const edge=Vec3.sub(end,start),t=Math.max(0,Math.min(1,Vec3.dot(Vec3.sub(p,start),edge)/Vec3.dot(edge,edge)));nearest=Math.min(nearest,Vec3.sub(p,start.clone().add(edge.scale(t))).len());}}
 assert(nearest<.003,'Hair root remains attached to the actual skull '+JSON.stringify({i,nearest,p}));
}
const directed=new Map();for(const t of ARJAN_FACE_TRIANGLES)for(let i=0;i<3;i++){const a=t[i],b=t[(i+1)%3],key=[a,b].sort((a,b)=>a-b).join(',');const list=directed.get(key)??[];list.push([a,b]);directed.set(key,list);}
for(const list of directed.values())if(list.length===2)assert(list[0][0]===list[1][1]&&list[0][1]===list[1][0],'Shared face edges have opposite winding, including nose sidewalls');
assert.equal([...directed.values()].filter(v=>v.length===1).length,88,'Only the face oval, eyes and mouth have open reference boundaries');
function depth(x,y,fp){let z=-Infinity;for(let i=0;i<fp.length;i+=9){const ax=fp[i],ay=fp[i+1],bx=fp[i+3],by=fp[i+4],cx=fp[i+6],cy=fp[i+7],det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(det)<1e-12)continue;const a=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/det,b=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/det,c=1-a-b;if(a>=-1e-6&&b>=-1e-6&&c>=-1e-6)z=Math.max(z,a*fp[i+2]+b*fp[i+5]+c*fp[i+8]);}return z;}
function posed(m){const matrix=compose(m.position,m.rotation,m.scale),p=new Float32Array(m.skin.positions.length);for(let i=0;i<p.length;i+=3){const v=[...m.skin.positions.subarray(i,i+3)];for(let k=0;k<3;k++)for(let j=0;j<4;j++)v[k]+=(m.skin.morphs?.[j]?.[i+k]??0)*(m.expression?.[j]??0);const q=transformPoint(matrix,new Vec3(...v));p.set([q.x,q.y,q.z],i);}return p;}
let featureChecks=0;
for(const gaze of [-.30,0,.30])for(const time of [0,3.28,3.32])for(const expression of [{smile:0,mouthOpen:0,squint:0,browRaise:0},{smile:.7,mouthOpen:.3,squint:.4,browRaise:.7},{smile:.46,mouthOpen:.56,squint:.03,browRaise:.3}]){
 const meshes=humanTaylorHead(new Vec3(),0,0,expression,time,playerSpec('arjan').skin,{...CAST_DESIGN.arjan.head,width:1,height:1,eyeYaw:gaze}),fp=posed(meshes.find(m=>m.skin===face));
 for(const m of meshes.filter(m=>m.skin&&/lip|strand-brow/.test(m.skin.id))){const p=posed(m);for(let i=0;i<p.length;i+=90){const x=(p[i]+p[i+3]+p[i+6])/3,y=(p[i+1]+p[i+4]+p[i+7])/3,z=(p[i+2]+p[i+5]+p[i+8])/3;assert(z>depth(x,y,fp)+.00005,m.skin.id+' clears its actual deformed skin '+JSON.stringify({gaze,time,expression,x,y,z,skin:depth(x,y,fp),triangle:i/9}));featureChecks++;}}
 for(const index of [0,1]){const iris=meshes.find(m=>m.skin===ARJAN_HEAD_GEOMETRY['iris'+index]),white=meshes.find(m=>m.skin===ARJAN_HEAD_GEOMETRY['white'+index]),ip=posed(iris),wp=posed(white);let visible=0;for(let i=0;i<ip.length;i+=90){const x=(ip[i]+ip[i+3]+ip[i+6])/3,y=(ip[i+1]+ip[i+4]+ip[i+7])/3,z=(ip[i+2]+ip[i+5]+ip[i+8])/3,w=depth(x,y,wp),f=depth(x,y,fp);if(z>f){assert(Number.isFinite(w),'Visible iris stays in the eye opening');assert(z>w+.00005,'Visible iris stays above the sclera');visible++;}featureChecks++;}if(time===0&&expression.squint===0)assert(visible>5,'An open eye has a visible iris');}
}
const armGeometry=ATHLETE_WARDROBE.arjanArms,armVertices=new Map(),armEdges=new Map();
const armKey=i=>[...armGeometry.positions.subarray(i*3,i*3+3)].map(v=>v.toFixed(6)).join(',');
for(let i=0;i<armGeometry.positions.length/3;i++){const k=armKey(i),list=armVertices.get(k)??[];list.push(i);armVertices.set(k,list);}
for(let i=0;i<armGeometry.positions.length/3;i+=3){const points=[0,1,2].map(k=>armKey(i+k));for(let j=0;j<3;j++){const edge=[points[j],points[(j+1)%3]].sort().join(';');armEdges.set(edge,(armEdges.get(edge)??0)+1);}}
const openEdges=[...armEdges].filter(([,n])=>n===1);assert.equal(openEdges.length,48,'The only open arm rings are the two wrists; shoulder and elbow seams are closed');
for(const [edge] of openEdges)for(const key of edge.split(';'))assert(Math.abs(Number(key.split(',')[1])-.94)<.01,'No open shoulder or elbow boundary');
const seamGroups=[...armVertices.values()].filter(v=>v.length>1);
function skinArm(i,palette){const out=new Vec3(),p=new Vec3(...armGeometry.positions.subarray(i*3,i*3+3));for(let j=0;j<4;j++){const w=armGeometry.boneWeights[i*4+j];if(!w)continue;const b=armGeometry.boneIndices[i*4+j];const q=transformPoint(palette.subarray(b*16,b*16+16),p);out.x+=q.x*w;out.y+=q.y*w;out.z+=q.z*w;}return out;}
for(const hz of [30,60,120])for(const state of ['idle','walk','serve','swingForehand','swingBackhand','sit','drink']){
 const c=new Character(playerSpec('arjan'),new Vec3(),new Navigation([]),{});c.racketStowed=true;c.trigger(state);if(state==='walk')c.goTo(new Vec3(1,0,1));
 for(let i=0;i<hz;i++){
  c.update(1/hz);const pose=c.analysisPose(),meshes=c.meshes(),expected=skinMatrices(rigFromPose(pose,c.position,c.yaw));
  assert(meshes.some(m=>m.skin===HUMAN_FACE_VARIANTS.arjanFace));assert(meshes.some(m=>m.skin===ARJAN_HEAD_GEOMETRY.cap));
  for(const g of [ATHLETE_WARDROBE.arjanTop,ATHLETE_WARDROBE.arjanArms,ATHLETE_WARDROBE.arjanBand,ATHLETE_WARDROBE.arjanShorts])assert.deepEqual(meshes.find(m=>m.skin===g)?.boneMatrices,expected,'Likeness clothing retains the exact gameplay rig');
  for(const m of meshes){assert([m.position.x,m.position.y,m.position.z].every(Number.isFinite));if(m.boneMatrices)assert([...m.boneMatrices].every(Number.isFinite));}
  if(i===hz-1){const palette=meshes.find(m=>m.skin===armGeometry).boneMatrices;for(const group of seamGroups){const p=skinArm(group[0],palette);for(const index of group.slice(1))assert(Vec3.sub(p,skinArm(index,palette)).len()<1e-5,'Skinning preserves the fitted arm seam through motion');}}
 }
}
for(const hz of [30,60,120]){
 const c=new Character(playerSpec('arjan'),new Vec3(),new Navigation([]),{});c.update(1/hz);c.setLook(new Vec3(3,1.8,4));
 for(let i=0;i<Math.round(hz*.1);i++)c.update(1/hz);
 const a=captureFrame(c,0,null),eye=f=>f.body.find(m=>m.skin?.id.includes('reference-iris-0'));
 assert(a.pose.eyeYaw>.1,'The existing eye controller leads a head turn');
 assert(Math.abs(eye(a).expression[0]-Math.sin(a.pose.eyeYaw)/Math.sin(.3))<1e-7&&eye(a).expression[1]===0,'Actual Character consumes eye direction in the aperture-fitted morph');
 c.setLook(new Vec3(-3,1.8,4));for(let i=0;i<Math.round(hz*.1);i++)c.update(1/hz);
 const b=captureFrame(c,1,null),mid=interpolateFrame(a,b,.5);
 assert(b.pose.eyeYaw<-.1,'Eyes follow a reversed attention target');assert.equal(eye(a).skin,eye(b).skin,'Looking reuses cached eye geometry');
 for(let i=0;i<2;i++)assert(Math.abs(eye(mid).expression[i]-(eye(a).expression[i]+eye(b).expression[i])*.5)<1e-12,'Replay interpolates the observed gaze morph continuously');
 const frozen=[...eye(a).expression];c.update(.1);assert.deepEqual(eye(a).expression,frozen,'Recorded eye movement is detached from later attention');
 const first=c.meshes().find(m=>m.skin===eye(a).skin).expression;assert.deepEqual(c.meshes().find(m=>m.skin===eye(a).skin).expression,first,'Rendering does not advance eye motion');
}
const other=new Character(playerSpec('taylor'),new Vec3(),new Navigation([]),{});assert(!other.meshes().some(m=>surfaces.includes(m.skin)),'Arjan sculpt does not leak into another character');
console.log(JSON.stringify({surfaces:surfaces.length,featureChecks}));
console.log('Arjan head regression PASS: bounded cached sculpt, expression clearance, registered kit and finite animation at 30/60/120 Hz; other cast retains its own surfaces. Perceptual likeness requires human review.');
