import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Character} from '../dist/entities/Character.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {loadArjanAuthoredHead} from '../dist/animation/ArjanAuthoredHead.js';
import {captureFrame,interpolateFrame} from '../dist/analysis/MotionCapture.js';

const make=avatar=>new Character(playerSpec(avatar),new Vec3(),new Navigation([]),{});
const cases=[];
for(const hz of [30,60,120])for(const state of ['idle','walk','serve','swingForehand','swingBackhand','drink']){
 const c=make('arjan');c.racketStowed=true;c.trigger(state);if(state==='walk')c.goTo(new Vec3(1,0,1));for(let i=0;i<hz;i++)c.update(1/hz);
 cases.push({c,pose:JSON.parse(JSON.stringify(c.analysisPose())),meshes:c.meshes()});
}
const taylor=make('taylor'),protectedCast=taylor.meshes();
const fetch=globalThis.fetch,Image=globalThis.Image;let fault='';
globalThis.Image=class{naturalWidth=1024;naturalHeight=1024;async decode(){if(fault==='decode')throw Error('decode failure');}};
globalThis.fetch=async url=>{let b=fs.readFileSync(fileURLToPath(url));if(fault==='hash'&&String(url).endsWith('.glb')){b=Buffer.from(b);b[b.length-1]^=1;}if(fault==='texture'&&String(url).endsWith('.webp')){b=Buffer.from(b);b[b.length-1]^=1;}if(fault==='body'&&String(url).endsWith('/provenance.json')){const m=JSON.parse(b);m.sha256='0'.repeat(64);b=Buffer.from(JSON.stringify(m));}if(fault==='eye'&&String(url).endsWith('.json')){const m=JSON.parse(b);m.eyeCenters=[[null,0,0],[0,0,0]];b=Buffer.from(JSON.stringify(m));}return new Response(b);};
try{
 await loadArjanAuthoredHead();
 const parts=cases[0].c.meshes().filter(m=>m.skin?.id.startsWith('asset-'));assert.equal(parts.length,6);
 const face=parts.find(m=>m.material==='humanSkin'),scalp=parts.find(m=>m.material==='hair'&&m.diffuse===face.diffuse);
 assert(scalp&&scalp.neckBlend===face.neckBlend&&scalp.boneMatrices===face.boneMatrices,'Scalp hair shares the fitted face attachment');
 const triangles=[];
 for(const {skin:g} of [face,scalp])for(let i=0;i<g.positions.length/3;i+=3){
  const row=new Float32Array(114);let offset=0;
  for(let v=i;v<i+3;v++)for(const [values,size] of [[g.positions,3],[g.normals,3],[g.uvs,2],...g.morphs.map(a=>[a,3]),...g.morphNormals.map(a=>[a,3])]){row.set(values.subarray(v*size,(v+1)*size),offset);offset+=size;}
  triangles.push(Buffer.from(row.buffer));
 }
 const provenance=JSON.parse(fs.readFileSync(new URL('../assets/characters/arjan/head-provenance.json',import.meta.url)));
 assert.equal(createHash('sha256').update(Buffer.concat(triangles.sort(Buffer.compare))).digest('hex'),provenance.sourceFaceGeometrySha256,'Material separation preserves every triangle, UV and facial channel');
 // UV seams may duplicate a card vertex, but must not split its lighting normal into hard strips.
 const hair=parts.find(m=>m.material==='hair'&&m.diffuse&&m.diffuse!==face.diffuse).skin,seams=new Map();let seamChecks=0;
 for(let i=0;i<hair.positions.length/3;i++){
  const key=Array.from(hair.positions.subarray(i*3,i*3+3)).map(v=>v.toFixed(6)).join(','),n=hair.normals.subarray(i*3,i*3+3),old=seams.get(key);
  assert(Math.abs(Math.hypot(...n)-1)<1e-5,'Hair lighting normal remains unit length');
  if(old){assert(Math.abs(old[0]*n[0]+old[1]*n[1]+old[2]*n[2])>.999,'Hair UV seams keep one smooth volume normal');seamChecks++;}else seams.set(key,n);
  for(const delta of hair.morphNormals){const posed=Array.from(n,(v,j)=>v+delta[i*3+j]);assert(Math.abs(Math.hypot(...posed)-1)<1e-5,'Expression channels retain unit hair normals');}
 }
 assert(seamChecks>100,'Exercise actual duplicated hair-card vertices');
 const ids=new Set(parts.map(m=>m.skin.id));
 assert.equal(parts.filter(m=>m.brownIris).length,1);assert(parts.find(m=>m.brownIris).eyeCenters.every(Number.isFinite));
 for(const {c,pose,meshes} of cases){
  const current=c.meshes();assert.deepEqual(JSON.parse(JSON.stringify(c.analysisPose())),pose,'The head asset cannot change accepted walking, stance or stroke landmarks');
  assert(!current.some(m=>m.skin?.id.startsWith('arjan-reference-')),'No doubled procedural face, eyes or hair');
  // Remove only the previous face/hair/details and its two ear spheres when comparing body parts.
  const oldBody=meshes.filter(m=>!m.skin?.id.startsWith('arjan-reference-')&&!(m.kind==='sphere'&&Math.abs(m.scale.y-.058*1.05)<.001));
  assert.deepEqual(current.filter(m=>!ids.has(m.skin?.id)),oldBody,'Body, clothing, hands, feet, racket and neck remain unchanged');
  for(const m of current.filter(m=>ids.has(m.skin?.id))){assert(m.skin.morphs.length===5&&m.skin.morphNormals.length===5);assert([...m.boneMatrices,...m.expression].every(Number.isFinite));assert(Math.max(...m.skin.positions.map(Math.abs))<.4);}
 }
 assert.deepEqual(taylor.meshes(),protectedCast,'Other cast geometry and eyes stay unchanged');
 const c=cases[0].c;
 // Relaxed idle adds a mild squint; lids still stay over seven-eighths open until a timed blink.
 c.animTime=1;c.facePose={smile:0,mouthOpen:0,squint:0,browRaise:0,focus:0};
 assert(c.meshes().filter(m=>ids.has(m.skin?.id)).every(m=>m.expression[2]<.125),'Neutral eyes are not held in a squint');
 c.animTime=3.28;let frame=captureFrame(c,0,null);assert(frame.body.filter(m=>ids.has(m.skin?.id)).every(m=>m.expression[2]>.99),'Authored blink is connected');
 c.animTime=3.30;c.facePose={smile:.7,mouthOpen:.6,squint:0,browRaise:.2,focus:0};const next=captureFrame(c,.02,null),mid=interpolateFrame(frame,next,.01);
 for(const m of mid.body.filter(m=>ids.has(m.skin?.id))){assert(m.diffuse||m.material==='hair');assert(Math.abs(m.expression[1]-.3)<1e-6,'Replay interpolates actual speech morph');}
 assert(mid.body.some(m=>m.brownIris&&m.eyeCenters&&m.diffuse),'Replay keeps eye registration and source texture');
 for(const failure of ['hash','texture','eye','decode','body']){fault=failure;await assert.rejects(loadArjanAuthoredHead());assert.deepEqual(c.meshes().filter(m=>ids.has(m.skin?.id)).map(m=>m.skin.id),[...ids],'Failed load keeps verified head');}
 console.log('Arjan authored head PASS: 18 actual consumer poses, protected body/cast, facial channels, replay, atomic download/decode failures.');
}finally{globalThis.fetch=fetch;globalThis.Image=Image;}
