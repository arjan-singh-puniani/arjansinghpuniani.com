import {Mat4, Vec3, clamp, compose, hexToRgb, sunViewProjection} from './Math3D.js';

/** The academy footprint. The shadow frustum is fitted to this once, so texel density stays constant all day. */
export const SHADOW_CENTRE=new Vec3(-.4,1.5,-1.0);
export const SHADOW_RADIUS=17.0;
export const SHADOW_RESOLUTION=2048;
export const LAMP_SHADOW_RESOLUTION=1024;

export type GeometryKind='box'|'roundBox'|'sphere'|'cylinder'|'cone'|'torus';
export type MaterialKind='matte'|'wood'|'fabric'|'ceramic'|'metal'|'glass'|'court'|'skin'|'hair'|'leaf';
export interface Mesh {
  kind:GeometryKind;
  position:Vec3;
  rotation?:Vec3;
  scale:Vec3;
  color:string;
  material?:MaterialKind;
  alpha?:number;
  unlit?:boolean;
  /** Opt a mesh out of the shadow pass. Floor decals and glass set this. */
  noShadow?:boolean;
  id?:string;
}

export interface SkinGeometry {id:string;positions:Float32Array;normals:Float32Array;boneIndices:Float32Array;boneWeights:Float32Array}
export interface SkinnedMesh {
  skin:SkinGeometry; boneMatrices:Float32Array; position:Vec3; rotation?:Vec3; scale?:Vec3; color:string; material?:MaterialKind; alpha?:number; unlit?:boolean; noShadow?:boolean; id?:string;
}
export type RenderItem=Mesh|SkinnedMesh;
interface Geo {vao:WebGLVertexArrayObject;count:number}
interface SkinGeo {vao:WebGLVertexArrayObject;count:number}
export interface PointLight {position:Vec3;color:[number,number,number];intensity:number;radius:number}
export interface Lighting {
  sunDir:Vec3;ambient:number;background:[number,number,number,number];warmth?:number;pointLights?:PointLight[];
  /** 0 flattens shadows entirely (heavy overcast), 1 is full sun. */
  shadowStrength?:number;
  /** Direct sunlight tint. Defaults to a warm white. */
  sunColor?:[number,number,number];
  /** Sky fill tint used for upward-facing surfaces. */
  skyColor?:[number,number,number];
  /** Bounce tint used for downward-facing surfaces. */
  bounceColor?:[number,number,number];
  /** One interior fixture may cast a separate shadow map across the court. */
  castingLight?:{centre:Vec3;radius:number;direction:Vec3;position:Vec3;strength:number};
}

/** Shared lighting maths. One source of truth for both the rigid and skinned fragment shaders. */
const LIGHT_UNIFORMS=`
uniform vec3 u_color;uniform vec3 u_sun;uniform vec3 u_viewPos;uniform float u_ambient;uniform float u_alpha;uniform float u_unlit;uniform float u_warmth;uniform float u_roughness;uniform float u_specular;uniform float u_softness;
uniform vec3 u_pointPos[8];uniform vec3 u_pointColor[8];uniform vec2 u_pointParams[8];
uniform mat4 u_lightVP;uniform highp sampler2DShadow u_shadowMap;uniform float u_shadowStrength;uniform float u_shadowTexel;
uniform mat4 u_lampVP;uniform highp sampler2DShadow u_lampShadow;uniform float u_lampStrength;uniform vec3 u_lampDir;uniform float u_lampTexel;
uniform vec3 u_sunColor;uniform vec3 u_skyColor;uniform vec3 u_bounceColor;`;

const LIGHT_BODY=`
float shadowFactor(vec3 world,vec3 N,float ndl){
  if(u_shadowStrength<=0.001) return 1.0;
  // Normal offset scales with grazing angle, which removes acne without visible peter-panning.
  float slope=clamp(1.0-ndl,0.0,1.0);
  vec3 offset=world+N*(u_shadowTexel*(1.1+slope*3.4));
  vec4 lp=u_lightVP*vec4(offset,1.0);
  vec3 proj=lp.xyz/lp.w*0.5+0.5;
  if(proj.x<0.0||proj.x>1.0||proj.y<0.0||proj.y>1.0||proj.z>1.0) return 1.0;
  float bias=0.0013+slope*0.0032;
  float lit=0.0;
  for(int y=-1;y<=1;y++){
    for(int x=-1;x<=1;x++){
      vec2 o=vec2(float(x),float(y))*1.35/float(${SHADOW_RESOLUTION});
      lit+=texture(u_shadowMap,vec3(proj.xy+o,proj.z-bias));
    }
  }
  lit/=9.0;
  // Fade the shadow out at the very edge of the map so the club border does not get a hard line.
  vec2 edge=abs(proj.xy-0.5)*2.0;
  float fade=1.0-smoothstep(0.86,1.0,max(edge.x,edge.y));
  return mix(1.0,mix(1.0,lit,fade),u_shadowStrength);
}


float lampFactor(vec3 world,vec3 N){
  if(u_lampStrength<=0.001) return 1.0;
  vec3 L=normalize(-u_lampDir);
  float ndl=max(dot(N,L),0.0);
  if(ndl<=0.02) return 1.0;
  float slope=clamp(1.0-ndl,0.0,1.0);
  vec3 offset=world+N*(u_lampTexel*(1.2+slope*3.2));
  vec4 lp=u_lampVP*vec4(offset,1.0);
  vec3 proj=lp.xyz/lp.w*0.5+0.5;
  if(proj.x<0.0||proj.x>1.0||proj.y<0.0||proj.y>1.0||proj.z>1.0) return 1.0;
  float bias=0.0015+slope*0.0035;
  float lit=0.0;
  for(int y=-1;y<=1;y++){
    for(int x=-1;x<=1;x++){
      vec2 o=vec2(float(x),float(y))*1.25/float(${LAMP_SHADOW_RESOLUTION});
      lit+=texture(u_lampShadow,vec3(proj.xy+o,proj.z-bias));
    }
  }
  lit/=9.0;
  vec2 edge=abs(proj.xy-0.5)*2.0;
  float fade=1.0-smoothstep(0.90,1.0,max(edge.x,edge.y));
  return mix(1.0,mix(1.0,lit,fade),u_lampStrength);
}

vec3 shade(vec3 N,vec3 world){
  vec3 L=normalize(-u_sun);vec3 V=normalize(u_viewPos-world);
  float ndl=max(dot(N,L),0.0);
  float wrap=clamp((dot(N,L)+0.32)/1.32,0.0,1.0);
  float hemi=N.y*0.5+0.5;
  float shadow=shadowFactor(world,N,ndl);

  // Ambient: sky above, warm bounce below. This is what gives the model its soft modelled look.
  vec3 ambient=u_ambient*mix(u_bounceColor,u_skyColor,hemi);
  // Direct sun, occluded by the shadow map.
  vec3 direct=u_sunColor*wrap*0.62*shadow;
  // Very soft sky-side rim so silhouettes separate from the background.
  float rim=pow(1.0-max(dot(N,V),0.0),3.2)*0.055;
  // Contact darkening near the floor keeps small props anchored.
  float ground=0.86+0.14*smoothstep(0.02,1.35,world.y);

  vec3 H=normalize(L+V);
  float glossExp=mix(72.0,9.0,clamp(u_roughness,0.0,1.0));
  float spec=pow(max(dot(N,H),0.0),glossExp)*u_specular*(0.18+ndl*0.82)*shadow;
  float velvet=pow(1.0-max(dot(N,V),0.0),2.0)*u_softness*0.055;
  vec3 local=vec3(0.0);
  float lampOcc=lampFactor(world,N);
  for(int i=0;i<8;i++){
    float intensity=u_pointParams[i].x;float radius=max(.001,u_pointParams[i].y);
    if(intensity>0.0){
      vec3 D=u_pointPos[i]-world;float dist=length(D);
      float att=pow(clamp(1.0-dist/radius,0.0,1.0),2.0);
      float nl=max(dot(N,normalize(D)),0.0);
      float occ=(i==0)?lampOcc:mix(1.0,lampOcc,0.55);
      local+=u_pointColor[i]*intensity*att*(0.24+nl*0.76)*occ;
    }
  }
  vec3 warmTint=mix(vec3(1.0),vec3(1.06,0.985,0.905),clamp(u_warmth,0.0,1.0));
  vec3 c=u_color*warmTint*((ambient+direct)*ground)+u_color*local+u_sunColor*rim+u_sunColor*spec+u_color*velvet;
  c=mix(c,u_color,u_unlit);
  // Filmic-ish roll off, then a small saturation lift so the pastel palette does not go grey.
  c=1.0-exp(-max(c,vec3(0.0))*1.18);
  float luma=dot(c,vec3(0.2126,0.7152,0.0722));
  c=mix(vec3(luma),c,1.15);
  c=pow(clamp(c,0.0,1.0),vec3(0.94));
  return c;
}`;

export class Renderer {
  gl:WebGL2RenderingContext;
  private program:WebGLProgram;
  private skinProgram:WebGLProgram;
  private depthProgram:WebGLProgram;
  private depthSkinProgram:WebGLProgram;
  private geos=new Map<GeometryKind,Geo>();
  private skinGeos=new Map<string,SkinGeo>();
  private shadowFB:WebGLFramebuffer;
  private shadowTex:WebGLTexture;
  private lampFB:WebGLFramebuffer;
  private lampTex:WebGLTexture;
  shadowEnabled=true;
  lampShadowEnabled=true;
  private u:Record<string,WebGLUniformLocation>={};
  private su:Record<string,WebGLUniformLocation>={};
  private du:Record<string,WebGLUniformLocation>={};
  private dsu:Record<string,WebGLUniformLocation>={};
  renderScale=1;
  drawCalls=0; triangles=0; shadowCasters=0; instancedDraws=0;

  constructor(public canvas:HTMLCanvasElement){
    const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance',premultipliedAlpha:false});
    if(!gl) throw new Error('WebGL2 is unavailable.'); this.gl=gl;
    this.program=this.link(this.rigidVS(false),this.litFS());
    this.skinProgram=this.link(this.skinVS(false),this.litFS());
    this.depthProgram=this.link(this.rigidVS(true),this.depthFS());
    this.depthSkinProgram=this.link(this.skinVS(true),this.depthFS());

    const litNames=['u_model','u_vp','u_color','u_sun','u_ambient','u_alpha','u_unlit','u_viewPos','u_warmth','u_roughness','u_specular','u_softness','u_pointPos[0]','u_pointColor[0]','u_pointParams[0]','u_lightVP','u_shadowMap','u_shadowStrength','u_shadowTexel','u_lampVP','u_lampShadow','u_lampStrength','u_lampDir','u_lampTexel','u_sunColor','u_skyColor','u_bounceColor'];
    const grab=(p:WebGLProgram,names:string[],required:string[])=>{
      const map:Record<string,WebGLUniformLocation>={};
      for(const n of names){const loc=gl.getUniformLocation(p,n);if(loc)map[n.replace('[0]','')]=loc;else if(required.includes(n))throw new Error(`Missing uniform ${n}`);}
      return map;
    };
    // u_model/u_vp/u_color must exist; the rest are allowed to be optimised away.
    this.u=grab(this.program,litNames,['u_model','u_vp','u_color']);
    this.su=grab(this.skinProgram,[...litNames,'u_bones[0]'],['u_model','u_vp','u_color','u_bones[0]']);
    this.du=grab(this.depthProgram,['u_model','u_lightVP'],['u_model','u_lightVP']);
    this.dsu=grab(this.depthSkinProgram,['u_model','u_lightVP','u_bones[0]'],['u_model','u_lightVP','u_bones[0]']);

    this.geos.set('box',this.upload(this.boxGeometry()));
    this.geos.set('roundBox',this.upload(this.roundedBoxGeometry(4,.095)));
    this.geos.set('sphere',this.upload(this.sphereGeometry(14,20)));
    this.geos.set('cylinder',this.upload(this.cylinderGeometry(20,1,1)));
    this.geos.set('cone',this.upload(this.cylinderGeometry(20,0.04,1)));
    this.geos.set('torus',this.upload(this.torusGeometry(28,10,.37,.075)));

    const [fb,tex]=this.makeShadowTarget(SHADOW_RESOLUTION);this.shadowFB=fb;this.shadowTex=tex;
    const [lfb,ltex]=this.makeShadowTarget(LAMP_SHADOW_RESOLUTION);this.lampFB=lfb;this.lampTex=ltex;
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  }

  private makeShadowTarget(res:number):[WebGLFramebuffer,WebGLTexture]{
    const gl=this.gl;
    const tex=gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,res,res,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
    // Comparison sampling gives free hardware bilinear PCF on top of the 3x3 tap loop.
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const fb=gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,tex,0);
    const status=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    if(status!==gl.FRAMEBUFFER_COMPLETE){this.shadowEnabled=false;console.warn('Rally House: shadow map unavailable, falling back to ambient-only lighting.');}
    return [fb,tex];
  }

  resize(){const dpr=Math.min(1.65,devicePixelRatio||1)*this.renderScale,w=Math.max(1,Math.floor(this.canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(this.canvas.clientHeight*dpr));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.gl.viewport(0,0,w,h);return w/h;}

  /** Thin floor decals and glass must not cast, or the court fills with acne. */
  private casts(it:RenderItem){
    if(it.noShadow||it.unlit)return false;
    if((it.alpha??1)<.92)return false;
    if(!('skin' in it)){
      const flat=it.scale.y<=.09&&it.position.y<.55;
      if(flat)return false;
    }
    return true;
  }

  render(items:RenderItem[],viewProjection:Mat4,lighting:Lighting,viewPosition:Vec3){
    const gl=this.gl;
    this.drawCalls=0;this.triangles=0;this.shadowCasters=0;this.instancedDraws=0;
    const meshes:Mesh[]=[],skins:SkinnedMesh[]=[];for(const it of items){if('skin' in it)skins.push(it);else meshes.push(it);}
    const lightVP=sunViewProjection(lighting.sunDir,SHADOW_CENTRE,SHADOW_RADIUS,SHADOW_RESOLUTION);
    const strength=this.shadowEnabled?(lighting.shadowStrength??1):0;
    const lamp=lighting.castingLight;
    const lampStrength=(this.shadowEnabled&&this.lampShadowEnabled&&lamp)?lamp.strength:0;
    const lampVP=lamp?sunViewProjection(lamp.direction,lamp.centre,lamp.radius,LAMP_SHADOW_RESOLUTION):lightVP;

    if(strength>0.001) this.shadowPass(meshes,skins,lightVP,this.shadowFB,SHADOW_RESOLUTION);
    if(lampStrength>0.001) this.shadowPass(meshes,skins,lampVP,this.lampFB,LAMP_SHADOW_RESOLUTION);

    const canvasW=this.canvas.width,canvasH=this.canvas.height;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.viewport(0,0,canvasW,canvasH);
    gl.clearColor(...lighting.background);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    const opaque:Mesh[]=[],trans:Mesh[]=[];
    for(const m of meshes)((m.alpha??1)>=.999?opaque:trans).push(m);
    trans.sort((a,b)=>{const da=(a.position.x-viewPosition.x)**2+(a.position.y-viewPosition.y)**2+(a.position.z-viewPosition.z)**2,db=(b.position.x-viewPosition.x)**2+(b.position.y-viewPosition.y)**2+(b.position.z-viewPosition.z)**2;return db-da});
    const skinOpaque=skins.filter(s=>(s.alpha??1)>=.999),skinTrans=skins.filter(s=>(s.alpha??1)<.999);

    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadowTex);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.lampTex);
    gl.activeTexture(gl.TEXTURE0);
    this.setupProgram(this.program,this.u,viewProjection,lighting,viewPosition,lightVP,strength,lampVP,lampStrength);
    gl.depthMask(true);for(const m of opaque)this.drawMesh(m);
    this.setupProgram(this.skinProgram,this.su,viewProjection,lighting,viewPosition,lightVP,strength,lampVP,lampStrength);
    for(const sk of skinOpaque)this.drawSkin(sk);
    gl.depthMask(false);
    this.setupProgram(this.program,this.u,viewProjection,lighting,viewPosition,lightVP,strength,lampVP,lampStrength);
    for(const m of trans)this.drawMesh(m);
    this.setupProgram(this.skinProgram,this.su,viewProjection,lighting,viewPosition,lightVP,strength,lampVP,lampStrength);
    for(const sk of skinTrans)this.drawSkin(sk);
    gl.depthMask(true);
  }

  private shadowPass(meshes:Mesh[],skins:SkinnedMesh[],lightVP:Mat4,fb:WebGLFramebuffer,res:number){
    const gl=this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
    gl.viewport(0,0,res,res);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.colorMask(false,false,false,false);
    gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.6,3.0);
    gl.useProgram(this.depthProgram);gl.uniformMatrix4fv(this.du['u_lightVP'],false,lightVP);
    for(const m of meshes){
      if(!this.casts(m))continue;
      const g=this.geos.get(m.kind)!;
      gl.uniformMatrix4fv(this.du['u_model'],false,compose(m.position,m.rotation??new Vec3(),m.scale));
      gl.bindVertexArray(g.vao);gl.drawArrays(gl.TRIANGLES,0,g.count);this.shadowCasters++;
    }
    gl.useProgram(this.depthSkinProgram);gl.uniformMatrix4fv(this.dsu['u_lightVP'],false,lightVP);
    for(const s of skins){
      if(!this.casts(s))continue;
      const g=this.skinGeometry(s.skin);
      gl.uniformMatrix4fv(this.dsu['u_model'],false,compose(s.position,s.rotation??new Vec3(),s.scale??new Vec3(1,1,1)));
      gl.uniformMatrix4fv(this.dsu['u_bones'],false,s.boneMatrices);
      gl.bindVertexArray(g.vao);gl.drawArrays(gl.TRIANGLES,0,g.count);this.shadowCasters++;
    }
    gl.disable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(0,0);
    gl.colorMask(true,true,true,true);
  }

  private setupProgram(program:WebGLProgram,u:Record<string,WebGLUniformLocation>,vp:Mat4,lighting:Lighting,viewPosition:Vec3,lightVP:Mat4,strength:number,lampVP:Mat4,lampStrength:number){
    const gl=this.gl;gl.useProgram(program);
    const pls=(lighting.pointLights??[]).slice(0,8),pos=new Float32Array(24),col=new Float32Array(24),par=new Float32Array(16);
    for(let i=0;i<8;i++){const l=pls[i];if(l){pos.set([l.position.x,l.position.y,l.position.z],i*3);col.set(l.color,i*3);par.set([l.intensity,l.radius],i*2)}}
    const set=(n:string,fn:(loc:WebGLUniformLocation)=>void)=>{const loc=u[n];if(loc)fn(loc)};
    set('u_vp',l=>gl.uniformMatrix4fv(l,false,vp));
    set('u_sun',l=>gl.uniform3f(l,lighting.sunDir.x,lighting.sunDir.y,lighting.sunDir.z));
    set('u_ambient',l=>gl.uniform1f(l,lighting.ambient));
    set('u_viewPos',l=>gl.uniform3f(l,viewPosition.x,viewPosition.y,viewPosition.z));
    set('u_warmth',l=>gl.uniform1f(l,lighting.warmth??0));
    set('u_pointPos',l=>gl.uniform3fv(l,pos));
    set('u_pointColor',l=>gl.uniform3fv(l,col));
    set('u_pointParams',l=>gl.uniform2fv(l,par));
    set('u_lightVP',l=>gl.uniformMatrix4fv(l,false,lightVP));
    set('u_shadowMap',l=>gl.uniform1i(l,0));
    set('u_shadowStrength',l=>gl.uniform1f(l,strength));
    set('u_shadowTexel',l=>gl.uniform1f(l,(SHADOW_RADIUS*2)/SHADOW_RESOLUTION));
    const lamp=lighting.castingLight;
    set('u_lampVP',l=>gl.uniformMatrix4fv(l,false,lampVP));
    set('u_lampShadow',l=>gl.uniform1i(l,1));
    set('u_lampStrength',l=>gl.uniform1f(l,lampStrength));
    set('u_lampDir',l=>{const dir=lamp?.direction??lighting.sunDir;gl.uniform3f(l,dir.x,dir.y,dir.z);});
    set('u_lampTexel',l=>gl.uniform1f(l,(((lamp?.radius??SHADOW_RADIUS)*2))/LAMP_SHADOW_RESOLUTION));
    set('u_sunColor',l=>gl.uniform3fv(l,lighting.sunColor??[1.0,.96,.89]));
    set('u_skyColor',l=>gl.uniform3fv(l,lighting.skyColor??[.90,.94,1.0]));
    set('u_bounceColor',l=>gl.uniform3fv(l,lighting.bounceColor??[.82,.77,.70]));
  }

  private materialParams(kind:MaterialKind|undefined){
    switch(kind){
      case 'wood': return {roughness:.70,specular:.065,softness:.035};
      case 'fabric': return {roughness:.96,specular:.012,softness:.52};
      case 'ceramic': return {roughness:.30,specular:.17,softness:.025};
      case 'metal': return {roughness:.24,specular:.24,softness:0};
      case 'glass': return {roughness:.10,specular:.30,softness:0};
      case 'court': return {roughness:.90,specular:.020,softness:.04};
      case 'skin': return {roughness:.68,specular:.040,softness:.30};
      case 'hair': return {roughness:.48,specular:.090,softness:.14};
      case 'leaf': return {roughness:.67,specular:.052,softness:.18};
      default: return {roughness:.82,specular:.028,softness:.04};
    }
  }

  private drawMesh(m:Mesh){const gl=this.gl,g=this.geos.get(m.kind)!;gl.uniformMatrix4fv(this.u['u_model'],false,compose(m.position,m.rotation??new Vec3(),m.scale));const c=hexToRgb(m.color),mp=this.materialParams(m.material);gl.uniform3f(this.u['u_color'],c[0],c[1],c[2]);gl.uniform1f(this.u['u_alpha'],m.alpha??1);gl.uniform1f(this.u['u_unlit'],m.unlit?1:0);gl.uniform1f(this.u['u_roughness'],mp.roughness);gl.uniform1f(this.u['u_specular'],mp.specular);gl.uniform1f(this.u['u_softness'],mp.softness);gl.bindVertexArray(g.vao);gl.drawArrays(gl.TRIANGLES,0,g.count);this.drawCalls++;this.triangles+=g.count/3;}
  private drawSkin(m:SkinnedMesh){const gl=this.gl,g=this.skinGeometry(m.skin);gl.uniformMatrix4fv(this.su['u_model'],false,compose(m.position,m.rotation??new Vec3(),m.scale??new Vec3(1,1,1)));gl.uniformMatrix4fv(this.su['u_bones'],false,m.boneMatrices);const c=hexToRgb(m.color),mp=this.materialParams(m.material);gl.uniform3f(this.su['u_color'],c[0],c[1],c[2]);gl.uniform1f(this.su['u_alpha'],m.alpha??1);gl.uniform1f(this.su['u_unlit'],m.unlit?1:0);gl.uniform1f(this.su['u_roughness'],mp.roughness);gl.uniform1f(this.su['u_specular'],mp.specular);gl.uniform1f(this.su['u_softness'],mp.softness);gl.bindVertexArray(g.vao);gl.drawArrays(gl.TRIANGLES,0,g.count);this.drawCalls++;this.triangles+=g.count/3;}
  private skinGeometry(data:SkinGeometry){const hit=this.skinGeos.get(data.id);if(hit)return hit;const gl=this.gl,vao=gl.createVertexArray()!;gl.bindVertexArray(vao);const put=(loc:number,arr:Float32Array,size:number)=>{const b=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);};put(0,data.positions,3);put(1,data.normals,3);put(2,data.boneIndices,4);put(3,data.boneWeights,4);gl.bindVertexArray(null);const geo={vao,count:data.positions.length/3};this.skinGeos.set(data.id,geo);return geo;}

  private rigidVS(depthOnly:boolean){
    return `#version 300 es
    precision highp float;layout(location=0) in vec3 a_position;layout(location=1) in vec3 a_normal;
    uniform mat4 u_model;uniform mat4 ${depthOnly?'u_lightVP':'u_vp'};
    ${depthOnly?'':'out vec3 v_normal;out vec3 v_world;'}
    void main(){vec4 wp=u_model*vec4(a_position,1.0);
    ${depthOnly?'':'v_world=wp.xyz;v_normal=normalize(mat3(u_model)*a_normal);'}
    gl_Position=${depthOnly?'u_lightVP':'u_vp'}*wp;}`;
  }
  private skinVS(depthOnly:boolean){
    return `#version 300 es
    precision highp float;layout(location=0) in vec3 a_position;layout(location=1) in vec3 a_normal;layout(location=2) in vec4 a_bones;layout(location=3) in vec4 a_weights;
    uniform mat4 u_model;uniform mat4 ${depthOnly?'u_lightVP':'u_vp'};uniform mat4 u_bones[15];
    ${depthOnly?'':'out vec3 v_normal;out vec3 v_world;'}
    mat4 skin(){ivec4 b=ivec4(a_bones+.5);return u_bones[b.x]*a_weights.x+u_bones[b.y]*a_weights.y+u_bones[b.z]*a_weights.z+u_bones[b.w]*a_weights.w;}
    void main(){mat4 S=skin();vec4 wp=u_model*(S*vec4(a_position,1.0));
    ${depthOnly?'':'v_world=wp.xyz;v_normal=normalize(mat3(u_model)*mat3(S)*a_normal);'}
    gl_Position=${depthOnly?'u_lightVP':'u_vp'}*wp;}`;
  }
  private litFS(){
    return `#version 300 es
    precision highp float;in vec3 v_normal;in vec3 v_world;out vec4 outColor;
    ${LIGHT_UNIFORMS}
    ${LIGHT_BODY}
    void main(){outColor=vec4(shade(normalize(v_normal),v_world),u_alpha);}`;
  }
  private depthFS(){return `#version 300 es
    precision highp float;void main(){}`;}

  private link(vsSrc:string,fsSrc:string){
    const gl=this.gl;
    const compile=(type:number,src:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error((gl.getShaderInfoLog(s)||'Shader compile failed')+'\n'+src);return s};
    const p=gl.createProgram()!;gl.attachShader(p,compile(gl.VERTEX_SHADER,vsSrc));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fsSrc));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||'Shader link failed');
    return p;
  }

  private upload(data:{p:number[],n:number[]}){const gl=this.gl,vao=gl.createVertexArray()!;gl.bindVertexArray(vao);const pb=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.p),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);const nb=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,nb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.n),gl.STATIC_DRAW);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);gl.bindVertexArray(null);return {vao,count:data.p.length/3};}
  private boxGeometry(){const p:number[]=[],n:number[]=[];const faces:[number[],number[]][]=[[[1,0,0],[.5,-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,-.5,.5,.5,.5,.5,-.5,.5]], [[-1,0,0],[-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,-.5]], [[0,1,0],[-.5,.5,-.5,-.5,.5,.5,.5,.5,.5,-.5,.5,-.5,.5,.5,.5,.5,.5,-.5]], [[0,-1,0],[-.5,-.5,.5,-.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5,.5]], [[0,0,1],[-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,-.5,.5,.5,.5,.5,-.5,.5,.5]], [[0,0,-1],[.5,-.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5]]];for(const [nn,pp] of faces){p.push(...pp);for(let i=0;i<6;i++)n.push(...nn)}return {p,n};}
  private roundedBoxGeometry(seg:number,r:number){
    const p:number[]=[],n:number[]=[];const inner=.5-r;
    const faces=[
      {N:[1,0,0],U:[0,1,0],V:[0,0,1]},{N:[-1,0,0],U:[0,0,1],V:[0,1,0]},
      {N:[0,1,0],U:[0,0,1],V:[1,0,0]},{N:[0,-1,0],U:[1,0,0],V:[0,0,1]},
      {N:[0,0,1],U:[1,0,0],V:[0,1,0]},{N:[0,0,-1],U:[0,1,0],V:[1,0,0]}
    ] as const;
    const vert=(f:typeof faces[number],u:number,v:number)=>{let x=f.N[0]*.5+f.U[0]*u+f.V[0]*v,y=f.N[1]*.5+f.U[1]*u+f.V[1]*v,z=f.N[2]*.5+f.U[2]*u+f.V[2]*v;const ix=clamp(x,-inner,inner),iy=clamp(y,-inner,inner),iz=clamp(z,-inner,inner);let dx=x-ix,dy=y-iy,dz=z-iz;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;return {p:[ix+dx*r,iy+dy*r,iz+dz*r],n:[dx,dy,dz]};};
    for(const f of faces){for(let iy=0;iy<seg;iy++){for(let ix=0;ix<seg;ix++){const u0=-.5+ix/seg,u1=-.5+(ix+1)/seg,v0=-.5+iy/seg,v1=-.5+(iy+1)/seg;const q=[vert(f,u0,v0),vert(f,u1,v0),vert(f,u1,v1),vert(f,u0,v0),vert(f,u1,v1),vert(f,u0,v1)];for(const qv of q){p.push(...qv.p);n.push(...qv.n)}}}}return {p,n};
  }
  private sphereGeometry(lat:number,lon:number){const p:number[]=[],n:number[]=[];const pt=(a:number,b:number)=>{const y=Math.cos(a),rr=Math.sin(a);return [rr*Math.cos(b)*.5,y*.5,rr*Math.sin(b)*.5] as [number,number,number]};for(let i=0;i<lat;i++){const a0=i*Math.PI/lat,a1=(i+1)*Math.PI/lat;for(let j=0;j<lon;j++){const b0=j*2*Math.PI/lon,b1=(j+1)*2*Math.PI/lon;const q=[pt(a0,b0),pt(a1,b1),pt(a1,b0),pt(a0,b0),pt(a0,b1),pt(a1,b1)];for(const v of q){p.push(...v);const l=Math.hypot(...v)||1;n.push(v[0]/l,v[1]/l,v[2]/l)}}}return {p,n};}
  private cylinderGeometry(seg:number,topR:number,bottomR:number){const p:number[]=[],n:number[]=[];for(let i=0;i<seg;i++){const a=i*2*Math.PI/seg,b=(i+1)*2*Math.PI/seg;const aB=[Math.cos(a)*bottomR*.5,-.5,Math.sin(a)*bottomR*.5],bB=[Math.cos(b)*bottomR*.5,-.5,Math.sin(b)*bottomR*.5],aT=[Math.cos(a)*topR*.5,.5,Math.sin(a)*topR*.5],bT=[Math.cos(b)*topR*.5,.5,Math.sin(b)*topR*.5];for(const v of [aB,aT,bT,aB,bT,bB]){p.push(...v);const l=Math.hypot(v[0],v[2])||1;n.push(v[0]/l,0,v[2]/l)}for(const v of [[0,.5,0],bT,aT]){p.push(...v);n.push(0,1,0)}for(const v of [[0,-.5,0],aB,bB]){p.push(...v);n.push(0,-1,0)}}return {p,n};}
  private torusGeometry(uSeg:number,vSeg:number,R:number,r:number){const p:number[]=[],n:number[]=[];const pt=(u:number,v:number)=>{const cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v),rr=R+r*cv;return {p:[rr*cu,rr*su,r*sv],n:[cv*cu,cv*su,sv]};};for(let i=0;i<uSeg;i++){const u0=i*2*Math.PI/uSeg,u1=(i+1)*2*Math.PI/uSeg;for(let j=0;j<vSeg;j++){const v0=j*2*Math.PI/vSeg,v1=(j+1)*2*Math.PI/vSeg;const q=[pt(u0,v0),pt(u1,v0),pt(u1,v1),pt(u0,v0),pt(u1,v1),pt(u0,v1)];for(const a of q){p.push(...a.p);n.push(...a.n)}}}return {p,n};}
}
