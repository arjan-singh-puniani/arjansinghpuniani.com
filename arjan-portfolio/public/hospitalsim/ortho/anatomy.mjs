import * as T from '../vendor/build/three.module.js';
import {mergeGeometries} from '../vendor/examples/jsm/utils/BufferGeometryUtils.js';

const point = (...p) => new T.Vector3(...p);
const paint = (color,roughness,metalness=0) => new T.MeshStandardMaterial({color,roughness,metalness});
const tube = (points,r,segments=24) => new T.TubeGeometry(
  new T.CatmullRomCurve3(points.map(p=>point(...p))),segments,r,8,false
);

let cortexGrain;
function corticalTexture() {
  const n=256, pixels=new Uint8Array(n*n*4);
  let seed=39;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)>>>24);
  const coarse=Uint8Array.from({length:16*16},random);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const u=x/16,v=y/16,ix=Math.floor(u),iy=Math.floor(v),tx=u-ix,ty=v-iy;
    const at=(y*n+x)*4, sample=(a,b)=>coarse[(b%16)*16+a%16];
    pixels[at]=T.MathUtils.lerp(T.MathUtils.lerp(sample(ix,iy),sample(ix+1,iy),tx),
      T.MathUtils.lerp(sample(ix,iy+1),sample(ix+1,iy+1),tx),ty);
    pixels[at+1]=random();
    pixels[at+2]=0;pixels[at+3]=255;
  }
  const tex=new T.DataTexture(pixels,n,n);
  tex.wrapS=tex.wrapT=T.RepeatWrapping;
  tex.magFilter=T.LinearFilter;
  tex.minFilter=T.LinearMipmapLinearFilter;
  tex.generateMipmaps=true;
  tex.needsUpdate=true;
  return tex;
}

export function corticalFinish(material, detail) {
  cortexGrain ||= corticalTexture();
  material.onBeforeCompile = shader => {
    shader.uniforms.cortexGrain={value:cortexGrain};
    shader.vertexShader = 'varying vec3 vCortex;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>','#include <begin_vertex>\nvCortex=position;'
    );
    shader.fragmentShader = 'varying vec3 vCortex; uniform sampler2D cortexGrain;\n'
      +shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      vec2 surface=(vCortex.xy+vCortex.z*vec2(.47,.33))*vec2(1.48,${detail?'1.32':'.62'});
      vec2 grain=texture2D(cortexGrain,surface).rg;
      float pores=smoothstep(0.64,0.92,grain.g);
      diffuseColor.rgb*=(0.78+0.37*grain.r)*(1.0-${detail?'0.55':'0.24'}*pores);
    `);
  };
  material.customProgramCacheKey=()=>detail?'cancellous':'cortex';
}

function fiberTexture() {
  const width=256,height=128, bytes=new Uint8Array(width*height*4);
  for(let j=0;j<height;j++)for(let i=0;i<width;i++){
    const u=i/width*2*Math.PI,v=j/height*2*Math.PI;
    const striation=.49*Math.sin(67*u+1.9*Math.sin(2*v+5*u))
      +.22*Math.sin(38*u+1.3*Math.sin(3*v+7*u))+.13*Math.sin(21*u+2*v);
    const variation=.08*Math.sin(11*u+2*v)+.055*Math.cos(17*u-5*v);
    const shade=Math.min(255,215+42*striation+88*variation);
    const at=(j*width+i)*4;
    bytes[at]=bytes[at+1]=bytes[at+2]=shade;
    bytes[at+3]=255;
  }
  const texture=new T.DataTexture(bytes,width,height);
  texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.magFilter=T.LinearFilter;
  texture.minFilter=T.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;
  texture.needsUpdate=true;
  return texture;
}

function fascicle(path, width, thickness, shade) {
  const spline = new T.CatmullRomCurve3(path.map(p=>point(...p)));
  const base=new T.Color(shade), fascia=new T.Color(0xeab1a3), dark=new T.Color(0x692e30);
  const verts=[],uv=[],colors=[],indices=[],sides=26,rows=34;
  for(let i=0;i<=rows;i++){
    const t=i/rows,c=spline.getPoint(t), cross=Math.pow(Math.sin(Math.PI*t),.73);
    for(let j=0;j<=sides;j++){
      const a=j/sides*2*Math.PI, envelope=Math.max(.015,cross);
      const folds=1+.035*Math.sin(a*9+t*15)+.019*Math.cos(a*13-t*21);
      verts.push(c.x+Math.cos(a)*envelope*width*folds,c.y,c.z+Math.sin(a)*envelope*thickness*folds);
      uv.push(j/sides,t);
      const taper=Math.pow(Math.abs(t-.5)*2,5)*.68;
      const tint=base.clone().lerp(fascia,taper).lerp(dark,.12*(1-Math.sin(a)))
        .multiplyScalar(.92+.1*Math.sin(a*6+t*9)+.04*Math.cos(a*13-t*13));
      colors.push(tint.r,tint.g,tint.b);
      if(i<rows&&j<sides){
        const k=i*(sides+1)+j;
        indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);
      }
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(verts,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function operativeTissue() {
  const material=paint(0xffffff,.62);
  material.vertexColors=true;
  material.side=T.DoubleSide;
  material.map=fiberTexture();
  const bed=new T.Mesh(fascicle([[-.18,3,-.68],[0,1.5,-.57],[0,-1,-.62],[.05,-2.9,-.57]],1.02,.22,0x9e5449),material);
  const sides=[-1,1].map(side=>{
    const f=(x,y,z)=>[x*side,y,z];
    const layers=[
      fascicle([f(.58,3,-.20),f(.60,1.48,.14),f(.65,.14,.15),f(.53,-1.47,.18),f(.27,-2.76,-.04)],.36,.28,side<0?0xb96d59:0xa75549),
      fascicle([f(.40,2.85,-.27),f(.42,1.17,-.09),f(.47,-.38,-.01),f(.38,-1.95,-.06),f(.20,-2.82,-.12)],.22,.19,0x893e39),
      fascicle([f(.82,2.63,-.33),f(.90,1.10,.10),f(.91,-.59,.12),f(.76,-1.81,.09),f(.41,-2.82,-.18)],.31,.28,0xa75950),
      fascicle([f(.94,2.31,-.07),f(1.05,1.09,.22),f(1.12,-.13,.26),f(1.05,-1.33,.24),f(.64,-2.32,.12)],.15,.11,0xc28a76),
      fascicle([f(.35,2.26,.13),f(.54,1.66,.38),f(.67,1.07,.37),f(.71,.39,.31)],.14,.045,0xc69e85),
      fascicle([f(.80,-.98,.31),f(.67,-1.43,.40),f(.51,-2.03,.32),f(.26,-2.73,.07)],.18,.045,0xce9d85)
    ];
    const result=new T.Group();
    result.add(new T.Mesh(mergeGeometries(layers),material));
    for(const layer of layers)layer.dispose();
    return result;
  });
  const group=new T.Group();
  group.add(bed,...sides);
  return {group,sides};
}

function retractor(path) {
  const curve=new T.CatmullRomCurve3(path.map(p=>point(...p)));
  const pos=[],tri=[], segments=34, corners=[[-.8,-1],[.8,-1],[1,-.4],[1,.4],[.8,1],[-.8,1],[-1,.4],[-1,-.4]];
  for(let i=0;i<=segments;i++){
    const t=i/segments, center=curve.getPoint(t), tangent=curve.getTangent(t);
    const lateral=point(-tangent.y,tangent.x,0).normalize();
    const normal=point(tangent.x,tangent.y,tangent.z).cross(lateral).normalize();
    const width=.041+.043*Math.sin(Math.min(1,t*2.4)*Math.PI)**2;
    for(const [u,v] of corners){
      pos.push(...center.clone().addScaledVector(lateral,u*width).addScaledVector(normal,v*.021));
    }
    if(i===segments)continue;
    for(let j=0;j<corners.length;j++){
      const a=i*corners.length+j,b=i*corners.length+(j+1)%corners.length;
      tri.push(a,b,a+corners.length,b,b+corners.length,a+corners.length);
    }
  }
  for(let i=1;i<corners.length-1;i++){
    const end=segments*corners.length;
    tri.push(0,i+1,i,end,end+i,end+i+1);
  }
  const mesh=new T.BufferGeometry();
  mesh.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  mesh.setIndex(tri);
  mesh.computeVertexNormals();
  return mesh;
}

export function theatreDetails(steel) {
  const props=new T.Group();
  for(const side of [-1,1]){
    const s=(x,y,z)=>[x*side,y,z], y=side<0?.52:.28;
    const shape=retractor([s(.68,y-.11,.35),s(.83,y,.46),s(.92,y+.05,.61),s(1.26,y+.16,.72),s(1.72,y+.31,.74)]);
    props.add(new T.Mesh(shape,steel));
  }
  const structures=[
    [0x9a4c49,.021,[[-.87,2.08,.22],[-.86,1.26,.41],[-.94,.48,.43],[-.96,-.34,.41],[-.90,-1.48,.37]]],
    [0x9a4c49,.012,[[-.91,.62,.42],[-1.03,.44,.44],[-1.15,.08,.38]]],
    [0x375979,.024,[[.87,1.68,.32],[.84,.93,.41],[.89,.48,.42],[.99,.07,.43],[.98,-.85,.43],[.88,-1.45,.39]]],
    [0x375979,.012,[[.91,.39,.44],[1.05,.24,.41],[1.14,.02,.34]]],
    [0xa47a4e,.013,[[.68,1.85,.31],[.67,1.15,.43],[.70,.55,.44],[.67,-.01,.45],[.62,-.60,.34]]],
  ];
  for(const [color,radius,path] of structures)props.add(new T.Mesh(tube(path,radius,22),paint(color,.56)));
  return props;
}
