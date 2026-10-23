import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';
import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'/tmp/rh-arm-clearance';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:900,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(process.env.QA_BASELINE)await page.route('**/dist/**',r=>r.fulfill({path:path.join(process.env.QA_BASELINE,'dist',new URL(r.request().url()).pathname.split('/dist/')[1]),contentType:'text/javascript'}));
 await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:18080'}/?debug`);await page.waitForFunction(()=>window.__rh?.ready);
 const checks=await page.evaluate(async actor=>{
  const [{Character},{playerSpec},{Navigation},{Vec3,identity},{captureFrame,interpolateFrame}]=await Promise.all([import('/dist/entities/Character.js'),import('/dist/content/PlayerAvatars.js'),import('/dist/world/Navigation.js'),import('/dist/rendering/Math3D.js'),import('/dist/analysis/MotionCapture.js')]);
  const game=window.__rh.game,renderer=game.renderer,gl=renderer.gl,checks=[];game.clock.paused=true;
  const triangle=(points,i)=>{const p=[0,1,2].map(j=>Array.from(points.slice((i+j)*4,(i+j)*4+3)));return{p,min:[0,1,2].map(k=>Math.min(...p.map(v=>v[k]))),max:[0,1,2].map(k=>Math.max(...p.map(v=>v[k])))};};
  const sub=(a,b)=>a.map((n,i)=>n-b[i]),dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const crosses=([a,b,c],p,q)=>{const d=sub(q,p),e=sub(b,a),f=sub(c,a),h=cross(d,f),det=dot(e,h);if(Math.abs(det)<1e-10)return false;const o=sub(p,a),u=dot(o,h)/det;if(u<1e-5||u>1-1e-5)return false;const cr=cross(o,e),v=dot(d,cr)/det;if(v<1e-5||u+v>1-1e-5)return false;const t=dot(f,cr)/det;return t>1e-5&&t<1-1e-5;};
  const intersects=(a,b)=>!(a.min[0]>b.max[0]||b.min[0]>a.max[0]||a.min[1]>b.max[1]||b.min[1]>a.max[1]||a.min[2]>b.max[2]||b.min[2]>a.max[2])&&[a,b].some((t,i)=>[0,1,2].some(j=>crosses((i?a:b).p,t.p[j],t.p[(j+1)%3])));
  const spec=actor==='taylor'?playerSpec('taylor'):game.characters.find(c=>c.id===actor).spec;
  for(const depth of [false,true]){
   const shader=(kind,source)=>{const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
   const vertex=shader(gl.VERTEX_SHADER,renderer.skinVS(depth)),fragment=shader(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;out vec4 color;void main(){color=vec4(1);}'),program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.transformFeedbackVaryings(program,['gl_Position'],gl.INTERLEAVED_ATTRIBS);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
   const uniforms={};for(const name of ['u_model',depth?'u_lightVP':'u_vp','u_bones[0]','u_expression','u_handGrip','u_skirt','u_skirtPelvis','u_skirtHips[0]','u_skirtKnees[0]','u_albedo','u_textured','u_alphaCutoff'])uniforms[name.replace('[0]','')]=gl.getUniformLocation(program,name);
   const feedback=gl.createTransformFeedback(),buffer=gl.createBuffer();gl.useProgram(program);gl.uniformMatrix4fv(uniforms.u_model,false,identity());gl.uniformMatrix4fv(uniforms[depth?'u_lightVP':'u_vp'],false,identity());gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,feedback);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,buffer);gl.enable(gl.RASTERIZER_DISCARD);
   const surface=mesh=>{const geo=renderer.skinGeometry(mesh.skin),points=new Float32Array(geo.count*4);gl.uniformMatrix4fv(uniforms.u_bones,false,mesh.boneMatrices);renderer.bindSurface(mesh,uniforms);gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER,buffer);gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER,points.byteLength,gl.STREAM_READ);gl.bindVertexArray(geo.vao);gl.beginTransformFeedback(gl.POINTS);gl.drawArrays(gl.POINTS,0,geo.count);gl.endTransformFeedback();gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER,0,points);if(!points.every(Number.isFinite))throw Error('Invalid arm/cloth vertex');return points;};
   try{for(const mode of ['idle','walk','jog','turn','stop','swingForehand','swingBackhand','serve','volley'])for(const height of mode.startsWith('swing')||mode==='volley'?[.55,1.02,1.45]:[null]){
    const c=new Character(spec,new Vec3(),new Navigation([]),{}),shot=['swingForehand','swingBackhand','serve','volley'].includes(mode);
    if(shot){c.matchCompetitor=true;c.setAnimation('ready');c.update(.3);if(mode!=='serve')c.setIncomingContact(new Vec3(mode==='swingBackhand'?-.6:.6,height,.9));c.triggerShot(mode,new Vec3(0,.09,5));}
    else{c.racketStowed=true;for(let i=0;i<60;i++)c.update(1/60);if(mode==='jog')c.speed*=2;if(mode!=='idle')c.goTo(new Vec3(0,0,mode==='stop'?1.6:6));}
    const recover=shot?Math.ceil(c.shotDuration(mode)*60):Infinity;
    for(let frame=0;frame<(shot?recover+48:150);frame++){
     if(frame===recover){c.clearShotIntent();c.setAnimation('ready');}if(frame===recover+30){c.matchCompetitor=false;c.racketStowed=true;c.setAnimation('idle');}
     if(mode==='turn'&&frame===60)c.goTo(c.position.clone().add(new Vec3(4,0,-3)));c.update(1/60);if(frame%3)continue;
     const a=captureFrame(c,frame/60,null);let meshes=a.body;
     // Interpolated replay uses rebuilt palettes and must retain the same clearance.
     if(frame%6===3){c.update(1/120);const b=captureFrame(c,frame/60+1/120,null);meshes=interpolateFrame(a,b,frame/60+1/240).body;}
     const skirt=meshes.find(m=>m.skirt),cloth=surface(skirt),faces=Array.from({length:cloth.length/12},(_,i)=>triangle(cloth,i*3)),bounds={min:[0,1,2].map(k=>Math.min(...faces.map(f=>f.min[k]))),max:[0,1,2].map(k=>Math.max(...faces.map(f=>f.max[k])))};
     // Settled hip contact also checks the exposed waist; clothing remains the stroke/travel boundary.
     const torso=[];
     for(const kit of meshes.filter(m=>m.rig&&(m.material==='performanceKnit'||m.material==='humanSkin'&&c.state==='idle'&&c.clubIdleRelax>.95)&&!m.skirt)){const top=surface(kit);for(let v=0;v<top.length/4;v+=3)if([0,1,2].every(offset=>{let arm=0;for(let j=0;j<4;j++)if([5,6,7,8,9,10,17,18].includes(kit.skin.boneIndices[(v+offset)*4+j]))arm+=kit.skin.boneWeights[(v+offset)*4+j];return arm<.05;}))torso.push(triangle(top,v));}
     const rows=new Map();for(const face of torso)for(let row=Math.floor(face.min[1]*10);row<=Math.floor(face.max[1]*10);row++){if(!rows.has(row))rows.set(row,[]);rows.get(row).push(face);}
     let crossings=0,handTorso=0,restingHandCloth=0;
     for(const mesh of meshes.filter(m=>m.rig&&['humanSkin','performanceKnit'].includes(m.material)&&!m.skirt)){
      const g=mesh.skin,points=surface(mesh);for(let v=0;v<points.length/4;v+=3){if(![0,1,2].some(offset=>{let weight=0;for(let j=0;j<4;j++)if([5,6,7,8,9,10,17,18].includes(g.boneIndices[(v+offset)*4+j]))weight+=g.boneWeights[(v+offset)*4+j];return weight>.5;}))continue;const arm=triangle(points,v),isHand=mesh.material==='humanSkin'&&[0,1,2].some(offset=>{let hand=0;for(let j=0;j<4;j++)if([7,10].includes(g.boneIndices[(v+offset)*4+j]))hand+=g.boneWeights[(v+offset)*4+j];return hand>.5;});if(isHand&&Array.from({length:Math.floor(arm.max[1]*10)-Math.floor(arm.min[1]*10)+1},(_,i)=>rows.get(Math.floor(arm.min[1]*10)+i)??[]).some(row=>row.some(face=>intersects(arm,face))))handTorso++;if([0,1,2].some(k=>arm.min[k]>bounds.max[k]||bounds.min[k]>arm.max[k]))continue;for(const face of faces)if(intersects(arm,face)){if(isHand&&c.state==='idle'&&c.clubIdleRelax>.5)restingHandCloth++;else crossings++;break;}}
     }
     checks.push({height,handTorso,restingHandCloth,travel:c.position.len(),mode,frame,state:c.state,replay:frame%6===3,pass:depth?'shadow':'color',crossings,gl:gl.getError()});
    }
   }}finally{gl.disable(gl.RASTERIZER_DISCARD);gl.bindVertexArray(null);gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,null);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,null);gl.deleteBuffer(buffer);gl.deleteTransformFeedback(feedback);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);}
  }return checks;
 },process.env.QA_ACTOR??'taylor');
 fs.writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors},null,2)+'\n');assert.deepEqual(errors,[]);
 assert(checks.some(c=>c.mode==='walk'&&c.state==='walk'&&c.travel>.5),'Walking fixture must travel');assert(checks.some(c=>c.mode==='jog'&&c.state==='jog'&&c.travel>.5),'Jogging fixture must travel');
 assert(checks.some(c=>c.mode==='swingBackhand'&&c.state==='idle'&&c.replay),'Stroke fixture must reach interpolated club-idle recovery');
 const failures=checks.filter(c=>c.crossings||c.handTorso||c.gl);console.log(JSON.stringify({checks:checks.length,failures:failures.slice(0,12),failureCount:failures.length}));assert.equal(failures.length,0,'Rendered arms crossed the skirt beyond permitted resting-hand contact, or fingers crossed the torso, during travel, strokes, recovery or replay');
}finally{await browser.close();}
