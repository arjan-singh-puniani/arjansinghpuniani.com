import {
  radiusAt, radiusDerivativeAt, velocityAt, vorticityAt, axialPressurePa, wallShearPa,
  computeMetrics, lerp, clamp,
} from './physics.js';

const AXIAL_SCALE = 70;
const RADIAL_SCALE = 70;

function mat4Identity() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
function mat4Multiply(a,b) {
  const o=new Float32Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++) {
    o[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];
  }
  return o;
}
function mat4Perspective(fovy,aspect,near,far){
  const f=1/Math.tan(fovy/2), nf=1/(near-far);
  return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]);
}
function mat4Translate(x,y,z){const m=mat4Identity();m[12]=x;m[13]=y;m[14]=z;return m;}
function mat4RotateX(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);}
function mat4RotateY(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);}
function mat4Scale(s){return new Float32Array([s,0,0,0,0,s,0,0,0,0,s,0,0,0,0,1]);}

function compile(gl,type,src){
  const sh=gl.createShader(type); gl.shaderSource(sh,src); gl.compileShader(sh);
  if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)||'Shader compile failed');
  return sh;
}
function program(gl,vs,fs){
  const p=gl.createProgram(); gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,vs)); gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,fs)); gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)||'Program link failed');
  return p;
}

const VS=`#version 300 es
precision highp float;
in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
uniform mat4 u_mvp;
uniform mat4 u_model;
out vec3 v_color;
out float v_light;
void main(){
  vec3 n=normalize(mat3(u_model)*a_normal);
  vec3 l=normalize(vec3(-0.35,0.7,0.6));
  v_light=0.64+0.36*abs(dot(n,l));
  v_color=a_color;
  gl_Position=u_mvp*vec4(a_position,1.0);
}`;
const FS=`#version 300 es
precision highp float;
in vec3 v_color;
in float v_light;
uniform float u_alpha;
out vec4 outColor;
void main(){outColor=vec4(v_color*v_light,u_alpha);}`;
const LINE_VS=`#version 300 es
precision highp float;
in vec3 a_position;
in vec3 a_color;
uniform mat4 u_mvp;
out vec3 v_color;
void main(){v_color=a_color;gl_Position=u_mvp*vec4(a_position,1.0);gl_PointSize=3.2;}`;
const LINE_FS=`#version 300 es
precision highp float;
in vec3 v_color;
uniform float u_alpha;
out vec4 outColor;
void main(){outColor=vec4(v_color,u_alpha);}`;

const SEQ = [
  [0.08,0.16,0.19], [0.08,0.35,0.38], [0.19,0.56,0.52], [0.72,0.76,0.57], [0.76,0.30,0.16]
];
function cmap(t){
  t=clamp(t,0,1); const x=t*(SEQ.length-1),i=Math.min(SEQ.length-2,Math.floor(x)),f=x-i;
  return [lerp(SEQ[i][0],SEQ[i+1][0],f),lerp(SEQ[i][1],SEQ[i+1][1],f),lerp(SEQ[i][2],SEQ[i+1][2],f)];
}
const NEUTRAL=[0.48,0.55,0.55];

function physicalToWorld(p,c){
  const mid=(c.axialMinM+c.axialMaxM)/2;
  return [p.x*RADIAL_SCALE,(p.z-mid)*AXIAL_SCALE,p.y*RADIAL_SCALE];
}

function rk4Step(p,dt,phase,c){
  const f=(q)=>velocityAt(q.x,q.y,q.z,phase,c);
  const k1=f(p); if(!k1.inside)return null;
  const p2={x:p.x+k1.x*dt/2,y:p.y+k1.y*dt/2,z:p.z+k1.z*dt/2};
  const k2=f(p2); if(!k2.inside)return null;
  const p3={x:p.x+k2.x*dt/2,y:p.y+k2.y*dt/2,z:p.z+k2.z*dt/2};
  const k3=f(p3); if(!k3.inside)return null;
  const p4={x:p.x+k3.x*dt,y:p.y+k3.y*dt,z:p.z+k3.z*dt};
  const k4=f(p4); if(!k4.inside)return null;
  const n={
    x:p.x+dt*(k1.x+2*k2.x+2*k3.x+k4.x)/6,
    y:p.y+dt*(k1.y+2*k2.y+2*k3.y+k4.y)/6,
    z:p.z+dt*(k1.z+2*k2.z+2*k3.z+k4.z)/6,
  };
  const R=radiusAt(n.z,c);
  if(n.z<c.axialMinM||n.z>c.axialMaxM||Math.hypot(n.x,n.y)>=R*0.997)return null;
  return n;
}

function streamlineSeeds(c,count=44){
  const z=c.axialMinM+1.3e-3, R=radiusAt(z,c), seeds=[];
  seeds.push({x:0,y:0,z});
  const rings=[{r:.26,n:7},{r:.52,n:12},{r:.76,n:16},{r:.88,n:8}];
  for(const ring of rings)for(let i=0;i<ring.n;i++){
    const th=2*Math.PI*(i/ring.n)+(ring.r*1.7);
    seeds.push({x:R*ring.r*Math.cos(th),y:R*ring.r*Math.sin(th),z});
  }
  return seeds.slice(0,count);
}

function scalarAt(p,mode,phase,c,metrics){
  if(mode==='pressure') return axialPressurePa(p.z,phase,c);
  if(mode==='wall') return wallShearPa(p.z,phase,c);
  if(mode==='vorticity') return vorticityAt(p.x,p.y,p.z,phase,c).magnitude;
  return velocityAt(p.x,p.y,p.z,phase,c).speed;
}

export class HemodynamicRenderer {
  constructor(canvas,onFailure){
    this.canvas=canvas; this.onFailure=onFailure;
    this.gl=canvas.getContext('webgl2',{antialias:true,alpha:true,powerPreference:'high-performance'});
    if(!this.gl){ onFailure?.('WebGL 2 is unavailable. The longitudinal section remains available.'); return; }
    const gl=this.gl;
    this.surfaceProgram=program(gl,VS,FS); this.lineProgram=program(gl,LINE_VS,LINE_FS);
    this.surface={vao:gl.createVertexArray(),pos:gl.createBuffer(),color:gl.createBuffer(),normal:gl.createBuffer(),index:gl.createBuffer(),count:0};
    this.lines={vao:gl.createVertexArray(),pos:gl.createBuffer(),color:gl.createBuffer(),count:0,ranges:[],paths:[]};
    this.points={vao:gl.createVertexArray(),pos:gl.createBuffer(),color:gl.createBuffer(),count:0};
    this.yaw=-0.23; this.pitch=-0.08; this.zoom=0.94; this.drag=null;
    this.phase=0.28; this.mode='streamlines'; this.case=null;
    this.installInteractions();
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure?.('GPU context lost. Reload the lab to restore the 3D view.');});
  }

  installInteractions(){
    const c=this.canvas;
    c.addEventListener('pointerdown',e=>{this.drag={x:e.clientX,y:e.clientY,yaw:this.yaw,pitch:this.pitch};c.setPointerCapture(e.pointerId);});
    c.addEventListener('pointermove',e=>{if(!this.drag)return;this.yaw=this.drag.yaw+(e.clientX-this.drag.x)*0.007;this.pitch=clamp(this.drag.pitch+(e.clientY-this.drag.y)*0.006,-1.0,1.0);});
    c.addEventListener('pointerup',()=>this.drag=null); c.addEventListener('pointercancel',()=>this.drag=null);
    c.addEventListener('wheel',e=>{e.preventDefault();this.zoom=clamp(this.zoom*Math.exp(-e.deltaY*0.001),0.72,1.65);},{passive:false});
  }

  resetCamera(){this.yaw=-0.23;this.pitch=-0.08;this.zoom=0.94;}

  resize(){
    if(!this.gl)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const w=Math.max(1,Math.floor(this.canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(this.canvas.clientHeight*dpr));
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    this.gl.viewport(0,0,w,h);
  }

  mvp(){
    const aspect=this.canvas.width/Math.max(1,this.canvas.height);
    const p=mat4Perspective(38*Math.PI/180,aspect,.1,30);
    const view=mat4Translate(0,0,-6.6/this.zoom);
    const rot=mat4Multiply(mat4RotateY(this.yaw),mat4RotateX(this.pitch));
    return {model:rot,mvp:mat4Multiply(p,mat4Multiply(view,rot))};
  }

  setState(c,phase,mode){
    this.case=c;this.phase=phase;this.mode=mode;
    if(!this.gl)return;
    this.buildSurface(); this.buildStreamlines();
  }

  buildSurface(){
    const gl=this.gl,c=this.case,mode=this.mode,phase=this.phase;
    const axial=108,radial=42,positions=[],normals=[],colors=[],indices=[];
    let min=Infinity,max=-Infinity;
    const scalar=[];
    for(let i=0;i<=axial;i++){
      const z=lerp(c.axialMinM,c.axialMaxM,i/axial),R=radiusAt(z,c);
      const s= mode==='pressure'?axialPressurePa(z,phase,c):mode==='wall'?wallShearPa(z,phase,c):0;
      scalar.push(s);if(mode==='pressure'||mode==='wall'){min=Math.min(min,s);max=Math.max(max,s);}
      for(let j=0;j<=radial;j++){
        const th=2*Math.PI*j/radial,x=R*Math.cos(th),y=R*Math.sin(th);
        const w=physicalToWorld({x,y,z},c);positions.push(...w);
        const rp=radiusDerivativeAt(z,c), nx=Math.cos(th), nz=Math.sin(th), inv=1/Math.hypot(1,rp);
        normals.push(nx*inv,-rp*inv,nz*inv);
      }
    }
    for(let i=0;i<=axial;i++)for(let j=0;j<=radial;j++){
      let col=NEUTRAL;
      if(mode==='pressure'||mode==='wall')col=cmap((scalar[i]-min)/Math.max(1e-12,max-min));
      colors.push(...col);
    }
    for(let i=0;i<axial;i++)for(let j=0;j<radial;j++){
      const a=i*(radial+1)+j,b=a+radial+1;
      indices.push(a,b,a+1,b,b+1,a+1);
    }
    gl.bindVertexArray(this.surface.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.surface.pos);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);
    let loc=gl.getAttribLocation(this.surfaceProgram,'a_position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.surface.color);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.STATIC_DRAW);
    loc=gl.getAttribLocation(this.surfaceProgram,'a_color');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.surface.normal);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);
    loc=gl.getAttribLocation(this.surfaceProgram,'a_normal');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.surface.index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(indices),gl.STATIC_DRAW);
    this.surface.count=indices.length;
  }

  buildStreamlines(){
    const gl=this.gl,c=this.case,phase=this.phase,mode=this.mode;
    const seeds=streamlineSeeds(c,48),paths=[],values=[];
    let smin=Infinity,smax=-Infinity;
    const metrics=computeMetrics(phase,c);
    for(const seed of seeds){
      let p={...seed},path=[];
      for(let k=0;k<360;k++){
        const v=velocityAt(p.x,p.y,p.z,phase,c); if(!v.inside||v.speed<1e-5)break;
        const s=scalarAt(p,mode,phase,c,metrics); smin=Math.min(smin,s);smax=Math.max(smax,s);
        path.push({p:{...p},s,speed:v.speed});
        const n=rk4Step(p,0.00062,phase,c); if(!n)break; p=n;
      }
      if(path.length>8)paths.push(path);
    }
    if(!Number.isFinite(smin)||smax===smin){smin=0;smax=1;}
    const positions=[],colors=[],ranges=[];
    let cursor=0;
    for(const path of paths){
      const start=cursor;
      for(const item of path){positions.push(...physicalToWorld(item.p,c));colors.push(...cmap((item.s-smin)/(smax-smin)));cursor++;}
      ranges.push({start,count:path.length});
    }
    gl.bindVertexArray(this.lines.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.lines.pos);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);
    let loc=gl.getAttribLocation(this.lineProgram,'a_position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.lines.color);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.STATIC_DRAW);
    loc=gl.getAttribLocation(this.lineProgram,'a_color');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
    this.lines.count=cursor;this.lines.ranges=ranges;this.lines.paths=paths;this.lines.scalarRange=[smin,smax];
  }

  draw(timeS=0){
    const gl=this.gl;if(!gl||!this.case)return {drawCalls:0,triangles:0,lineVertices:0};
    this.resize();
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    const {model,mvp}=this.mvp(); let drawCalls=0;

    gl.useProgram(this.surfaceProgram);gl.uniformMatrix4fv(gl.getUniformLocation(this.surfaceProgram,'u_mvp'),false,mvp);gl.uniformMatrix4fv(gl.getUniformLocation(this.surfaceProgram,'u_model'),false,model);
    gl.uniform1f(gl.getUniformLocation(this.surfaceProgram,'u_alpha'),this.mode==='pressure'||this.mode==='wall'?0.28:0.16);
    gl.depthMask(false);gl.bindVertexArray(this.surface.vao);gl.drawElements(gl.TRIANGLES,this.surface.count,gl.UNSIGNED_INT,0);drawCalls++;

    gl.useProgram(this.lineProgram);gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProgram,'u_mvp'),false,mvp);gl.uniform1f(gl.getUniformLocation(this.lineProgram,'u_alpha'),0.78);
    gl.bindVertexArray(this.lines.vao);for(const r of this.lines.ranges){gl.drawArrays(gl.LINE_STRIP,r.start,r.count);drawCalls++;}

    const ppos=[],pcol=[];const [smin,smax]=this.lines.scalarRange||[0,1];
    for(let i=0;i<this.lines.paths.length;i++){
      const path=this.lines.paths[i];if(!path.length)continue;
      const idx=Math.floor((timeS/0.00062*0.72+i*7.31)%path.length);
      const item=path[idx];ppos.push(...physicalToWorld(item.p,this.case));pcol.push(...cmap((item.s-smin)/Math.max(1e-12,smax-smin)));
    }
    gl.bindVertexArray(this.points.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.points.pos);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(ppos),gl.DYNAMIC_DRAW);
    let loc=gl.getAttribLocation(this.lineProgram,'a_position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.points.color);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pcol),gl.DYNAMIC_DRAW);
    loc=gl.getAttribLocation(this.lineProgram,'a_color');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
    gl.uniform1f(gl.getUniformLocation(this.lineProgram,'u_alpha'),0.95);gl.drawArrays(gl.POINTS,0,ppos.length/3);drawCalls++;
    gl.depthMask(true);
    return {drawCalls,triangles:this.surface.count/3,lineVertices:this.lines.count,streamlines:this.lines.paths.length};
  }
}
