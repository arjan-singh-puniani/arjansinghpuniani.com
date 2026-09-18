import {
  add3, bboxCenter, bboxEmpty, bboxInclude, bboxRadius, bboxSize, bboxUnion,
  clamp, cross3, hexToRgb01, length3, lerp, mat4LookAt, mat4Multiply, mat4Perspective, normalize3, scale3, sub3
} from './math.js';
import { LAYERS, MATERIALS } from '../anatomy/manifest.js';
import { QUALITY_SETTINGS } from './quality.js';
import { structureVisibility } from '../state/store.js';
import { preferredStageSide, stageSlot } from '../interaction/stageLayout.js';

const VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
uniform mat4 uViewProjection;
uniform vec3 uDataCenter;
uniform float uDataScale;
uniform vec3 uOffset;
out vec3 vNormal;
out vec3 vWorldPosition;
void main() {
  vec3 p = (aPosition - uDataCenter) * uDataScale + uOffset;
  vWorldPosition = p;
  vNormal = normalize(aNormal);
  gl_Position = uViewProjection * vec4(p, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorldPosition;
uniform vec3 uColor;
uniform vec3 uCameraPosition;
uniform vec3 uLightDirection;
uniform float uAlpha;
uniform float uSpecularPower;
uniform float uRimStrength;
uniform float uSelected;
uniform float uIntro;
uniform bool uClipEnabled;
uniform vec4 uClipPlane;
out vec4 outColor;
void main() {
  if (uClipEnabled && dot(vWorldPosition, uClipPlane.xyz) - uClipPlane.w > 0.0) discard;
  vec3 n = normalize(vNormal);
  vec3 l = normalize(-uLightDirection);
  vec3 v = normalize(uCameraPosition - vWorldPosition);
  vec3 h = normalize(l + v);
  float diffuse = max(dot(n, l), 0.0);
  float wrap = max((dot(n, l) + 0.42) / 1.42, 0.0);
  float specular = pow(max(dot(n, h), 0.0), max(2.0, uSpecularPower));
  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.7);
  vec3 base = uColor * (0.20 + 0.61 * wrap + 0.15 * diffuse);
  vec3 spec = vec3(1.0, 0.95, 0.88) * specular * 0.26;
  vec3 rim = mix(uColor, vec3(0.84,0.88,0.92), 0.28) * fresnel * uRimStrength;
  vec3 selectedGlow = vec3(0.95,0.79,0.48) * fresnel * uSelected * 0.62;
  vec3 color = base + spec + rim + selectedGlow;
  color = color / (color + vec3(0.72));
  color = pow(color, vec3(1.0/2.2));
  outColor = vec4(color * mix(0.55, 1.0, uIntro), uAlpha * uIntro);
}`;

const PICK_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vWorldPosition;
uniform vec3 uPickColor;
uniform bool uClipEnabled;
uniform vec4 uClipPlane;
out vec4 outColor;
void main() {
  if (uClipEnabled && dot(vWorldPosition, uClipPlane.xyz) - uClipPlane.w > 0.0) discard;
  outColor = vec4(uPickColor, 1.0);
}`;


const OUTLINE_VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
uniform mat4 uViewProjection;
uniform vec3 uDataCenter;
uniform float uDataScale;
uniform vec3 uOffset;
uniform float uOutlineWidth;
out vec3 vWorldPosition;
void main() {
  vec3 p = (aPosition - uDataCenter) * uDataScale + uOffset;
  p += normalize(aNormal) * uOutlineWidth;
  vWorldPosition = p;
  gl_Position = uViewProjection * vec4(p, 1.0);
}`;

const OUTLINE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vWorldPosition;
uniform vec4 uOutlineColor;
uniform bool uClipEnabled;
uniform vec4 uClipPlane;
out vec4 outColor;
void main() {
  if (uClipEnabled && dot(vWorldPosition, uClipPlane.xyz) - uClipPlane.w > 0.0) discard;
  outColor = uOutlineColor;
}`;

function shader(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`Shader compile failed: ${message}`);
  }
  return s;
}

function program(gl, fragmentSource, vertexSource = VERTEX_SHADER) {
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.bindAttribLocation(p, 0, 'aPosition');
  gl.bindAttribLocation(p, 1, 'aNormal');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`Program link failed: ${gl.getProgramInfoLog(p)}`);
  return p;
}

function uniforms(gl, p, names) {
  return Object.fromEntries(names.map(name => [name, gl.getUniformLocation(p, name)]));
}

function encodePick(index) {
  const n = index + 1;
  return [(n & 255)/255, ((n>>8)&255)/255, ((n>>16)&255)/255];
}
function decodePick(pixel) { return pixel[0] + (pixel[1]<<8) + (pixel[2]<<16) - 1; }

export class OrbitCamera {
  constructor() {
    this.yaw = -0.18;
    this.pitch = 0.02;
    this.distance = 3.25;
    this.target = [0,0,0];
    this.parallax = [0,0];
  }
  reset() { this.yaw=-0.18; this.pitch=0.02; this.distance=3.25; this.target=[0,0,0]; }
  orbit(dx, dy) { this.yaw += dx; this.pitch = clamp(this.pitch + dy, -1.38, 1.38); }
  zoom(delta) { this.distance = clamp(this.distance * Math.exp(delta), 1.25, 7.5); }
  getPosition(parallaxEnabled = false) {
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch), cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const base = [this.distance * cp * sy, this.distance * sp, this.distance * cp * cy];
    if (!parallaxEnabled) return add3(this.target, base);
    return add3(add3(this.target, base), [this.parallax[0] * 0.095, this.parallax[1] * 0.075, 0]);
  }
}

export class HoloRenderer {
  constructor(canvas, state, { quality = 'high' } = {}) {
    this.canvas = canvas;
    this.state = state;
    this.quality = quality;
    this.gl = canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
      depth: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    if (!this.gl) throw new Error('WebGL 2 is unavailable');

    const gl = this.gl;
    this.program = program(gl, FRAGMENT_SHADER);
    this.pickProgram = program(gl, PICK_FRAGMENT_SHADER);
    this.outlineProgram = program(gl, OUTLINE_FRAGMENT_SHADER, OUTLINE_VERTEX_SHADER);
    this.u = uniforms(gl, this.program, ['uViewProjection','uDataCenter','uDataScale','uOffset','uColor','uCameraPosition','uLightDirection','uAlpha','uSpecularPower','uRimStrength','uSelected','uIntro','uClipEnabled','uClipPlane']);
    this.pu = uniforms(gl, this.pickProgram, ['uViewProjection','uDataCenter','uDataScale','uOffset','uPickColor','uClipEnabled','uClipPlane']);
    this.ou = uniforms(gl, this.outlineProgram, ['uViewProjection','uDataCenter','uDataScale','uOffset','uOutlineWidth','uOutlineColor','uClipEnabled','uClipPlane']);
    this.hoveredId = null;
    this.quizTargetId = null;
    this.meshes = [];
    this.globalBounds = bboxEmpty();
    this.dataCenter = [0,0,0];
    this.dataScale = 1;
    this.camera = new OrbitCamera();
    this.intro = state.reducedMotion ? 1 : 0;
    this.introStarted = performance.now();
    this.lastTime = performance.now();
    this.stats = { fps:0, frameMs:0, drawCalls:0, triangles:0, textures:0, geometries:0 };
    this.fpsWindow = [];
    this.pickFramebuffer = null;
    this.pickTexture = null;
    this.pickDepth = null;
    this.pickSize = [0,0];
    this.contextLost = false;
    this.stageSequence = 0;

    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault(); this.contextLost = true;
      window.dispatchEvent(new CustomEvent('holoanatomy:contextlost'));
    });
    canvas.addEventListener('webglcontextrestored', () => { window.location.reload(); });

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.018, 0.022, 0.030, 1);
  }

  activeMeshes() { return this.meshes.filter(mesh => mesh.part.module === this.state.module); }

  setModule(moduleId) {
    this.state.module = moduleId;
    this.reassembleAll();
    this.recalculateNormalization();
    this.camera.reset();
    this.intro = this.state.reducedMotion ? 1 : 0;
    this.introStarted = performance.now();
  }

  setQuality(level) { this.quality = level; this.resize(true); }

  addMesh(part, geometry) {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const pos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pos);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    const normal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normal);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    const index = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);

    const indexType = geometry.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    this.meshes.push({
      part, geometry, vao, indexType, indexCount: geometry.indices.length,
      explodeCurrent:[0,0,0], pullCurrent:[0,0,0], pullTarget:[0,0,0], renderOffset:[0,0,0],
      staged:false, stageSide:null, stageIndex:-1, stageOrder:0
    });
    bboxUnion(this.globalBounds, geometry.bounds);
    if (part.module === this.state.module) this.recalculateNormalization();
    const active = this.activeMeshes();
    this.stats.geometries = active.length;
    this.stats.triangles = active.reduce((n,m)=>n+m.geometry.triangles,0);
  }

  recalculateNormalization() {
    const meshes = this.activeMeshes();
    if (!meshes.length) return;
    const bounds = bboxEmpty();
    for (const mesh of meshes) bboxUnion(bounds, mesh.geometry.bounds);
    if (!Number.isFinite(bounds.min[0])) return;
    this.dataCenter = bboxCenter(bounds);
    const size = bboxSize(bounds);
    const maxDim = Math.max(...size) || 1;
    this.dataScale = 2.08 / maxDim;
  }

  resize(force = false) {
    const q = QUALITY_SETTINGS[this.quality] || QUALITY_SETTINGS.medium;
    const dpr = Math.min(window.devicePixelRatio || 1, q.maxDpr);
    const w = Math.max(2, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(2, Math.floor(this.canvas.clientHeight * dpr));
    if (force || this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
      this.gl.viewport(0,0,w,h);
      this.pickSize=[0,0];
    }
  }

  clipPlane() {
    const { enabled, axis, position, flip } = this.state.section;
    const n = axis === 'x' ? [1,0,0] : axis === 'y' ? [0,1,0] : [0,0,1];
    if (flip) { n[0]*=-1; n[1]*=-1; n[2]*=-1; }
    return { enabled, value: [n[0],n[1],n[2], flip ? -position : position] };
  }

  viewProjection() {
    const aspect = this.canvas.width / Math.max(1,this.canvas.height);
    const projection = mat4Perspective(42 * Math.PI/180, aspect, 0.03, 30);
    const eye = this.camera.getPosition(this.state.parallax);
    const view = mat4LookAt(eye, this.camera.target, [0,1,0]);
    return { matrix: mat4Multiply(projection, view), eye };
  }

  meshOffset(mesh, dt) {
    const cfg = LAYERS[mesh.part.layer];
    const targetAmount = this.state.explode && !mesh.staged ? 1 : 0;
    const explodeTarget = scale3(cfg.explode || [0,0,0], targetAmount);
    const pullTarget = mesh.staged ? this.stageTarget(mesh) : mesh.pullTarget;
    if (this.state.reducedMotion) {
      mesh.explodeCurrent = explodeTarget;
      mesh.pullCurrent = [...pullTarget];
    } else {
      const t = 1 - Math.exp(-dt * 8.5);
      mesh.explodeCurrent = mesh.explodeCurrent.map((v,i)=>lerp(v,explodeTarget[i],t));
      mesh.pullCurrent = mesh.pullCurrent.map((v,i)=>lerp(v,pullTarget[i],t));
    }
    mesh.renderOffset = add3(mesh.explodeCurrent, mesh.pullCurrent);
    return mesh.renderOffset;
  }

  stageTarget(mesh) {
    const slot = stageSlot(mesh.stageIndex, mesh.stageSide || preferredStageSide(mesh.part.layer));
    const { right, up, forward } = this.cameraBasis();
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    const halfHeight = Math.tan(42 * Math.PI / 360) * this.camera.distance;
    const halfWidth = halfHeight * aspect;
    const desired = add3(
      add3(scale3(right, slot[0] * halfWidth), scale3(up, slot[1] * halfHeight)),
      scale3(forward, slot[2])
    );
    const sourceCenter = bboxCenter(mesh.geometry.bounds).map((v,i)=>(v-this.dataCenter[i])*this.dataScale);
    return sub3(desired, sourceCenter);
  }

  reflowStage() {
    for (const side of ['left','right']) {
      const staged = this.activeMeshes()
        .filter(mesh => mesh.staged && mesh.stageSide === side)
        .sort((a,b)=>a.stageOrder-b.stageOrder);
      staged.forEach((mesh,index)=>{ mesh.stageIndex=index; });
    }
  }

  stageMesh(mesh) {
    if (!mesh) return;
    if (!mesh.staged) {
      mesh.staged = true;
      mesh.stageSide = preferredStageSide(mesh.part.layer);
      mesh.stageOrder = ++this.stageSequence;
    }
    this.reflowStage();
  }

  unstageMesh(mesh, { keepPosition = true } = {}) {
    if (!mesh || !mesh.staged) return;
    if (keepPosition) mesh.pullTarget = [...mesh.pullCurrent];
    mesh.staged = false;
    mesh.stageIndex = -1;
    mesh.stageSide = null;
    this.reflowStage();
  }

  stagePulledMeshes() {
    for (const mesh of this.activeMeshes()) {
      if (!mesh.staged && length3(mesh.pullTarget) > 0.12) this.stageMesh(mesh);
    }
    this.reflowStage();
  }

  unstageAll({ keepPosition = true } = {}) {
    const staged = this.activeMeshes().filter(mesh => mesh.staged);
    for (const mesh of staged) this.unstageMesh(mesh, { keepPosition });
  }

  stagedMeshes() {
    return this.activeMeshes().filter(mesh => mesh.staged).sort((a,b)=>a.stageOrder-b.stageOrder);
  }

  cameraBasis() {
    const eye = this.camera.getPosition(false);
    const forward = normalize3(sub3(this.camera.target, eye));
    let right = normalize3(cross3(forward, [0,1,0]));
    if (length3(right) < 1e-6) right = [1,0,0];
    const up = normalize3(cross3(right, forward));
    return { right, up, forward };
  }

  pullMesh(mesh, dxPixels, dyPixels) {
    if (!mesh) return;
    if (mesh.staged) this.unstageMesh(mesh, { keepPosition:true });
    const { right, up } = this.cameraBasis();
    const scale = 0.00135 * this.camera.distance;
    const delta = add3(scale3(right, dxPixels * scale), scale3(up, -dyPixels * scale));
    const next = add3(mesh.pullTarget, delta);
    const maxDistance = 1.75;
    const magnitude = length3(next);
    mesh.pullTarget = magnitude > maxDistance ? scale3(next, maxDistance / magnitude) : next;
  }

  pullMeshRadially(mesh, amount = 0.62) {
    if (!mesh) return;
    if (mesh.staged) this.unstageMesh(mesh, { keepPosition:false });
    const sourceCenter = bboxCenter(mesh.geometry.bounds);
    let direction = normalize3(sourceCenter.map((v,i)=>v-this.dataCenter[i]));
    if (length3(direction) < 1e-5) direction = this.cameraBasis().right;
    const current = length3(mesh.pullTarget);
    const targetDistance = Math.max(current, amount);
    mesh.pullTarget = scale3(direction, targetDistance);
  }

  returnMesh(mesh) {
    if (!mesh) return;
    if (mesh.staged) this.unstageMesh(mesh, { keepPosition:false });
    mesh.pullTarget = [0,0,0];
  }

  reassembleAll() {
    for (const mesh of this.meshes) {
      mesh.staged = false; mesh.stageSide = null; mesh.stageIndex = -1; mesh.pullTarget = [0,0,0];
    }
    this.state.explode = false;
  }

  pulledCount() {
    return this.activeMeshes().reduce((count, mesh) => count + (mesh.staged || length3(mesh.pullTarget) > 0.025 ? 1 : 0), 0);
  }

  isPulled(mesh) {
    return !!mesh && (mesh.staged || length3(mesh.pullTarget) > 0.025);
  }

  pullDistance(mesh) {
    if (!mesh) return 0;
    return length3(mesh.staged ? this.stageTarget(mesh) : mesh.pullTarget);
  }

  projectMeshCenter(mesh) {
    if (!mesh) return null;
    const center = bboxCenter(mesh.geometry.bounds).map((v,i)=>(v-this.dataCenter[i])*this.dataScale + mesh.renderOffset[i]);
    const m = this.viewProjection().matrix;
    const x=center[0], y=center[1], z=center[2];
    const cx=m[0]*x+m[4]*y+m[8]*z+m[12];
    const cy=m[1]*x+m[5]*y+m[9]*z+m[13];
    const cz=m[2]*x+m[6]*y+m[10]*z+m[14];
    const cw=m[3]*x+m[7]*y+m[11]*z+m[15];
    if (cw <= 0.0001) return null;
    const nx=cx/cw, ny=cy/cw, nz=cz/cw;
    const rect=this.canvas.getBoundingClientRect();
    return { x:(nx*0.5+0.5)*rect.width+rect.left, y:(1-(ny*0.5+0.5))*rect.height+rect.top, visible:nz>=-1&&nz<=1 };
  }

  drawMesh(mesh, p, u, viewProjection, eye, offset, { pick = false, pickIndex = 0 } = {}) {
    const gl = this.gl;
    const visibility = structureVisibility(this.state, mesh.part);
    if (!visibility.visible) return false;
    gl.bindVertexArray(mesh.vao);
    gl.uniformMatrix4fv(u.uViewProjection, false, viewProjection);
    gl.uniform3fv(u.uDataCenter, this.dataCenter);
    gl.uniform1f(u.uDataScale, this.dataScale);
    gl.uniform3fv(u.uOffset, offset);
    const clip = this.clipPlane();
    gl.uniform1i(u.uClipEnabled, clip.enabled ? 1 : 0);
    gl.uniform4fv(u.uClipPlane, clip.value);

    if (pick) {
      gl.uniform3fv(u.uPickColor, encodePick(pickIndex));
    } else {
      const layer = LAYERS[mesh.part.layer];
      const material = MATERIALS[layer.material];
      gl.uniform3fv(u.uColor, hexToRgb01(material.color));
      gl.uniform3fv(u.uCameraPosition, eye);
      gl.uniform3fv(u.uLightDirection, [-0.38,-0.55,-0.74]);
      gl.uniform1f(u.uAlpha, visibility.ghost ? 0.17 : 1.0);
      gl.uniform1f(u.uSpecularPower, material.specular);
      gl.uniform1f(u.uRimStrength, material.rim * (QUALITY_SETTINGS[this.quality]?.rimScale || 1));
      gl.uniform1f(u.uSelected, this.state.selectedId === mesh.part.id ? 1 : 0);
      gl.uniform1f(u.uIntro, this.intro);
    }
    gl.drawElements(gl.TRIANGLES, mesh.indexCount, mesh.indexType, 0);
    return true;
  }

  drawOutline(mesh, viewProjection, color = [0.55,0.93,1.0,0.92], width = 0.010) {
    if (!mesh) return false;
    const visibility = structureVisibility(this.state, mesh.part);
    if (!visibility.visible) return false;
    const gl = this.gl;
    const u = this.ou;
    gl.useProgram(this.outlineProgram);
    gl.bindVertexArray(mesh.vao);
    gl.uniformMatrix4fv(u.uViewProjection, false, viewProjection);
    gl.uniform3fv(u.uDataCenter, this.dataCenter);
    gl.uniform1f(u.uDataScale, this.dataScale);
    gl.uniform3fv(u.uOffset, mesh.renderOffset);
    gl.uniform1f(u.uOutlineWidth, width);
    gl.uniform4fv(u.uOutlineColor, color);
    const clip = this.clipPlane();
    gl.uniform1i(u.uClipEnabled, clip.enabled ? 1 : 0);
    gl.uniform4fv(u.uClipPlane, clip.value);
    gl.drawElements(gl.TRIANGLES, mesh.indexCount, mesh.indexType, 0);
    return true;
  }

  render(now = performance.now()) {
    if (this.contextLost) return;
    this.resize();
    const gl = this.gl;
    const dt = Math.min(0.05, Math.max(0, (now - this.lastTime)/1000));
    this.lastTime = now;
    if (!this.state.reducedMotion) this.intro = clamp((now - this.introStarted) / 1500, 0, 1);
    const vp = this.viewProjection();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0,0,this.canvas.width,this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    let calls = 0;

    const opaque = [], transparent = [];
    const activeMeshes = this.activeMeshes();
    this.stats.geometries = activeMeshes.length;
    this.stats.triangles = activeMeshes.reduce((n,m)=>n+m.geometry.triangles,0);
    for (const mesh of activeMeshes) {
      const vis = structureVisibility(this.state, mesh.part);
      if (!vis.visible) continue;
      (vis.ghost ? transparent : opaque).push(mesh);
    }

    gl.disable(gl.BLEND); gl.depthMask(true);
    for (const mesh of opaque) if (this.drawMesh(mesh, this.program, this.u, vp.matrix, vp.eye, this.meshOffset(mesh,dt))) calls++;

    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    for (const mesh of transparent) if (this.drawMesh(mesh, this.program, this.u, vp.matrix, vp.eye, this.meshOffset(mesh,dt))) calls++;
    gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);

    const outlineIds = [];
    if (this.state.selectedId) outlineIds.push({ id:this.state.selectedId, color:[0.96,0.80,0.48,0.92], width:0.009 });
    if (this.hoveredId) outlineIds.push({ id:this.hoveredId, color:[0.48,0.92,1.0,0.94], width:0.011 });
    if (this.quizTargetId) outlineIds.push({ id:this.quizTargetId, color:[0.48,0.98,1.0,0.98], width:0.015 });
    const seen = new Set();
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.cullFace(gl.FRONT);
    for (let i=outlineIds.length-1;i>=0;i--) {
      const style=outlineIds[i];
      if (seen.has(style.id)) continue;
      seen.add(style.id);
      const mesh=activeMeshes.find(m=>m.part.id===style.id);
      if (mesh && this.drawOutline(mesh,vp.matrix,style.color,style.width)) calls++;
    }
    gl.cullFace(gl.BACK); gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);

    const frameMs = Math.max(0.01, performance.now() - now);
    this.fpsWindow.push(frameMs);
    if (this.fpsWindow.length > 45) this.fpsWindow.shift();
    const avg = this.fpsWindow.reduce((a,b)=>a+b,0)/this.fpsWindow.length;
    this.stats.frameMs = avg;
    this.stats.fps = 1000/avg;
    this.stats.drawCalls = calls;
  }

  ensurePickBuffer() {
    const gl = this.gl, w=this.canvas.width, h=this.canvas.height;
    if (this.pickFramebuffer && this.pickSize[0]===w && this.pickSize[1]===h) return;
    if (this.pickTexture) gl.deleteTexture(this.pickTexture);
    if (this.pickDepth) gl.deleteRenderbuffer(this.pickDepth);
    if (this.pickFramebuffer) gl.deleteFramebuffer(this.pickFramebuffer);
    const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
    const depth=gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER,depth); gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw new Error('Picking framebuffer incomplete');
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    this.pickFramebuffer=fbo; this.pickTexture=tex; this.pickDepth=depth; this.pickSize=[w,h];
  }

  pick(clientX, clientY) {
    const activeMeshes = this.activeMeshes();
    if (!activeMeshes.length) return null;
    this.ensurePickBuffer();
    const gl=this.gl, rect=this.canvas.getBoundingClientRect();
    const x=Math.floor((clientX-rect.left)/rect.width*this.canvas.width);
    const y=Math.floor((rect.bottom-clientY)/rect.height*this.canvas.height);
    if (x<0||y<0||x>=this.canvas.width||y>=this.canvas.height) return null;
    const vp=this.viewProjection();
    gl.bindFramebuffer(gl.FRAMEBUFFER,this.pickFramebuffer); gl.viewport(0,0,this.canvas.width,this.canvas.height);
    gl.disable(gl.BLEND); gl.depthMask(true); gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); gl.useProgram(this.pickProgram);
    for (let i=0;i<activeMeshes.length;i++) {
      const mesh=activeMeshes[i];
      this.drawMesh(mesh,this.pickProgram,this.pu,vp.matrix,vp.eye,mesh.renderOffset,{pick:true,pickIndex:i});
    }
    const pixel=new Uint8Array(4); gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.clearColor(0.018,0.022,0.030,1);
    const index=decodePick(pixel);
    return index>=0&&index<activeMeshes.length ? activeMeshes[index] : null;
  }

  focusMesh(mesh) {
    if (!mesh) return;
    const c=bboxCenter(mesh.geometry.bounds).map((v,i)=>(v-this.dataCenter[i])*this.dataScale + mesh.renderOffset[i]);
    const radius=Math.max(0.08,bboxRadius(mesh.geometry.bounds)*this.dataScale);
    this.camera.target=c;
    this.camera.distance=clamp(radius*4.2,1.25,4.8);
  }

  dispose() {
    const gl=this.gl;
    for (const mesh of this.meshes) {
      gl.deleteVertexArray(mesh.vao);
    }
    if(this.pickTexture) gl.deleteTexture(this.pickTexture);
    if(this.pickDepth) gl.deleteRenderbuffer(this.pickDepth);
    if(this.pickFramebuffer) gl.deleteFramebuffer(this.pickFramebuffer);
    gl.deleteProgram(this.program); gl.deleteProgram(this.pickProgram); gl.deleteProgram(this.outlineProgram);
  }
}
