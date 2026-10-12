import fs from 'node:fs';import assert from 'node:assert/strict';import {chromium,browserOptions} from './runtime.mjs';
const out=process.env.QA_OUT??'evidence/taylor-adult-20261011';fs.mkdirSync(out,{recursive:true});
const baseline=fs.readFileSync(process.env.QA_BASELINE_RENDERER??'/tmp/taylor-adult-baseline-20261011/dist/rendering/Renderer.js','utf8').replaceAll("'./","'http://127.0.0.1:8078/dist/rendering/");
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']}),page=await browser.newPage();
await page.route('**/baseline-renderer.js',route=>route.fulfill({body:baseline,contentType:'text/javascript'}));
try{
 await page.goto('http://127.0.0.1:8078/?debug',{waitUntil:'networkidle'});
 const report=await page.evaluate(async()=>{
  const {Renderer}=await import('/dist/rendering/Renderer.js'),{Renderer:Before}=await import('/baseline-renderer.js'),{Vec3,compose,identity,multiply,transformPoint}=await import('/dist/rendering/Math3D.js');
  const gl=document.createElement('canvas').getContext('webgl2');if(!gl)throw Error('WebGL2 unavailable');const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const normal=new Vec3(1,1,1).normalize(),u=new Vec3(1,-1,0).normalize(),v=Vec3.cross(normal,u).normalize();
  for(const [loc,data,size] of [[0,[.1,.2,.3],3],[1,[normal.x,normal.y,normal.z],3],[2,[0,1,0,0],4]]){gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);}
  const weights=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,weights);gl.bufferData(gl.ARRAY_BUFFER,16,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,4,gl.FLOAT,false,0,0);
  const feedback=gl.createBuffer();gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER,feedback);gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER,12,gl.DYNAMIC_READ);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,feedback);
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  const results={baseline:{maxError:0},current:{maxError:0},cases:0};
  for(const [name,renderer] of [['baseline',Before],['current',Renderer]]){
   const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,renderer.prototype.skinVS(false)));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;out vec4 color;void main(){color=vec4(1.0);}'));gl.transformFeedbackVaryings(program,['v_normal'],gl.INTERLEAVED_ATTRIBS);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);gl.uniformMatrix4fv(gl.getUniformLocation(program,'u_vp'),false,identity());
   for(const scale of [1,1.6,2.1])for(const angle of [0,.6,1.1])for(const w of [0,.5,1]){
    const model=compose(new Vec3(),new Vec3(.2,.4,0),new Vec3(.62,.62,.62)),a=compose(new Vec3(),new Vec3(.1,angle,0),new Vec3(1,scale,.85)),b=compose(new Vec3(),new Vec3(-.2,-angle,.1),new Vec3(.9,scale*.8,1)),bones=new Float32Array(15*16);for(let i=0;i<15;i++)bones.set(identity(),i*16);bones.set(a,0);bones.set(b,16);
    const blend=new Float32Array(16);for(let i=0;i<16;i++)blend[i]=a[i]*(1-w)+b[i]*w;const matrix=multiply(model,blend),point=p=>{const q=transformPoint(matrix,p);return new Vec3(q.x,q.y,q.z);},origin=point(new Vec3()),expected=Vec3.cross(point(u).sub(origin),point(v).sub(origin)).normalize();
    gl.uniformMatrix4fv(gl.getUniformLocation(program,'u_model'),false,model);gl.uniformMatrix4fv(gl.getUniformLocation(program,'u_bones[0]'),false,bones);gl.bindBuffer(gl.ARRAY_BUFFER,weights);gl.bufferSubData(gl.ARRAY_BUFFER,0,new Float32Array([1-w,w,0,0]));gl.enable(gl.RASTERIZER_DISCARD);gl.beginTransformFeedback(gl.POINTS);gl.drawArrays(gl.POINTS,0,1);gl.endTransformFeedback();gl.disable(gl.RASTERIZER_DISCARD);gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER,feedback);const captured=new Float32Array(3);gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER,0,captured);const error=Vec3.sub(new Vec3(...captured),expected).len();results[name].maxError=Math.max(results[name].maxError,error);if(name==='current')results.cases++;
   }gl.deleteProgram(program);
  }results.glError=gl.getError();return results;
 });fs.writeFileSync(`${out}/skin-normals.json`,JSON.stringify(report,null,2)+'\n');assert.equal(report.glError,0);assert(report.baseline.maxError>.1,'Original shader exposes the scaled-normal defect');assert(report.current.maxError<1e-5,'Actual production skin shader matches independent geometric normals');console.log(report);
}finally{await browser.close();}
