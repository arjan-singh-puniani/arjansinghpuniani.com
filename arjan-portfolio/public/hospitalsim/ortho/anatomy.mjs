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
  const width=256,height=256, bytes=new Uint8Array(width*height*4);
  for(let j=0;j<height;j++)for(let i=0;i<width;i++){
    const u=i/width*2*Math.PI,v=j/height*2*Math.PI;
    const fiber=u+.025*Math.sin(v+3*u)+.013*Math.sin(3*v-9*u);
    const bundles=Math.sin(18*fiber+.6*Math.sin(4*v+u));
    const striation=.46*Math.sin(67*fiber)+.26*Math.sin(41*fiber+2*Math.cos(v-3*u))
      +.13*Math.sin(88*fiber+3*v);
    const relief=bundles*(.70+.30*Math.sin(2*v-11*u));
    const shade=202+35*striation+19*relief+8*Math.sin(13*u+7*v)*Math.sin(23*u-11*v);
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
  const base=new T.Color(shade), fascia=new T.Color(0xeab1a3), dark=new T.Color(0x431c22);
  const verts=[],uv=[],colors=[],indices=[],sides=30,rows=52;
  for(let i=0;i<=rows;i++){
    const t=i/rows,c=spline.getPoint(t), cross=Math.pow(Math.sin(Math.PI*t),.73);
    for(let j=0;j<=sides;j++){
      const a=j/sides*2*Math.PI, envelope=Math.max(.015,cross);
      const folds=1+.066*Math.sin(a*7+t*12)+.034*Math.cos(a*11-t*17)
        +.027*Math.sin(a*4-t*8)*Math.sin(Math.PI*t);
      verts.push(c.x+Math.cos(a)*envelope*width*folds,c.y,c.z+Math.sin(a)*envelope*thickness*folds);
      uv.push(j/sides,t);
      const taper=Math.pow(Math.abs(t-.5)*2,5)*.68;
      const tint=base.clone().lerp(fascia,taper).lerp(dark,.20*(1-Math.sin(a)))
        .multiplyScalar(.93+.08*Math.sin(a*6+t*9)+.04*Math.cos(a*13-t*13));
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

function retractorContact(bank, side) {
  const x=side*.93,y=side<0?.46:.24;
  const ray=new T.Raycaster(point(x,y,2),point(0,0,-1));
  const z=ray.intersectObject(bank,false)[0]?.point.z ?? .48;
  const {position,color}=bank.geometry.attributes;
  for(let i=0;i<position.count;i++){
    const depth=position.getZ(i);
    const dx=(position.getX(i)-x)*side, dy=position.getY(i)-y;
    const surface=T.MathUtils.smoothstep(depth,z-.35,z-.13);
    if(!surface) continue;
    const pit=Math.exp(-((dx/.14)**2+(dy/.15)**2)*1.55);
    const ridge=Math.exp(-(((dx-.075)/.19)**2+((Math.abs(dy)-.16)/.058)**2)*1.4);
    position.setZ(i,depth+surface*(.049*ridge-.104*pit));
    const shade=1+surface*(.08*ridge-.29*pit);
    color.setXYZ(i,color.getX(i)*shade,color.getY(i)*shade,color.getZ(i)*shade);
  }
  bank.geometry.computeVertexNormals();
  return {x,y,z};
}

export function operativeTissue(steel) {
  const material=paint(0xffffff,.54);
  material.vertexColors=true;
  material.side=T.DoubleSide;
  material.map=material.bumpMap=fiberTexture();
  material.bumpScale=.045;
  const bed=new T.Mesh(fascicle([[-.18,3,-.63],[-.03,1.5,-.64],[.05,-1,-.70],[.10,-2.9,-.61]],1.18,.26,0x733c3a),material);
  bed.receiveShadow=true;
  const blades=[];
  const sides=[-1,1].map(side=>{
    const f=(x,y,z)=>[x*side,y,z];
    const layers=[
      fascicle([f(.45,2.85,-.46),f(.50,1.38,-.39),f(.47,.03,-.39),f(.51,-1.34,-.31),f(.22,-2.82,-.37)],.40,.22,0x823d3a),
      fascicle([f(.52,2.95,-.37),f(.72,1.40,-.09),f(.78,.24,-.05),f(.67,-1.44,-.14),f(.32,-2.78,-.30)],.38,.32,side<0?0xa96154:0x97473c),
      fascicle([f(.79,2.64,-.21),f(.91,1.21,.13),f(1.00,-.17,.20),f(.87,-1.57,.11),f(.43,-2.78,-.12)],.36,.36,side<0?0xba6c57:0xaa5747),
      fascicle([f(1.09,2.48,-.12),f(1.24,1.27,.26),f(1.24,-.24,.30),f(1.07,-1.33,.19),f(.64,-2.42,.10)],.28,.28,0xae715e),
      fascicle([f(.70,2.55,.03),f(.94,1.57,.39),f(.92,.77,.48),f(.85,.38,.38)],.16,.09,0xc58f79),
      fascicle([f(.99,-.68,.46),f(.89,-1.18,.49),f(.73,-1.96,.36),f(.47,-2.62,.02)],.18,.10,0xc68e75),
      fascicle([f(1.17,2.37,.04),f(1.40,1.21,.29),f(1.49,-.25,.37),f(1.37,-1.43,.20),f(.94,-2.40,-.04)],.19,.21,0xa76c5c)
    ];
    const result=new T.Group();
    const bank=new T.Mesh(mergeGeometries(layers),material);
    bank.receiveShadow=true;
    result.add(bank);
    for(const layer of layers)layer.dispose();
    const {x,y,z}=retractorContact(bank,side);
    const p=(dx,dy,dz)=>[x+dx*side,y+dy,z+dz], slope=side<0?.48:.19;
    const blade=new T.Mesh(retractor([p(-.015,-.095,-.105),p(-.026,-.03,-.035),p(.035,.025,.075),
      p(.30,slope*.39,.24),p(1.28,slope,.48),p(3.42,slope*2.5,.70)]),steel);
    blade.castShadow=true;
    result.add(blade);
    blades.push(blade);
    return result;
  });
  const group=new T.Group();
  group.add(bed,...sides);
  return {group,sides,blades};
}

function retractor(path) {
  const curve=new T.CatmullRomCurve3(path.map(p=>point(...p)));
  const pos=[],tri=[], segments=34, corners=[[-.8,-1],[.8,-1],[1,-.4],[1,.4],[.8,1],[-.8,1],[-1,.4],[-1,-.4]];
  for(let i=0;i<=segments;i++){
    const t=i/segments, center=curve.getPoint(t), tangent=curve.getTangent(t);
    const lateral=point(-tangent.y,tangent.x,0).normalize();
    const normal=point(tangent.x,tangent.y,tangent.z).cross(lateral).normalize();
    const width=.044+.061*(1-T.MathUtils.smoothstep(t,.18,.45));
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

export function theatreDetails() {
  const props=new T.Group();
  const structures=[
    [0xa84f4c,.023,[[-.93,2.08,.38],[-.92,1.21,.51],[-.96,.47,.44],[-1.04,-.37,.57],[-.94,-1.48,.42]]],
    [0xa84f4c,.012,[[-.96,.47,.44],[-1.09,.35,.48],[-1.23,.10,.58]]],
    [0x365c7a,.028,[[.92,1.77,.39],[1.05,1.08,.57],[1.12,.47,.56],[1.11,.25,.45],[1.09,-.22,.59],[1.03,-.79,.58],[.93,-1.47,.46]]],
    [0x365c7a,.013,[[1.11,.25,.45],[1.25,.14,.48],[1.43,-.05,.55]]],
    [0xb2874a,.015,[[.71,1.85,.30],[.72,1.12,.37],[.75,.55,.39],[.74,-.03,.36],[.62,-.72,.27]]],
  ];
  for(const [color,radius,path] of structures){
    const structure=new T.Mesh(tube(path,radius,22),paint(color,.56));
    structure.receiveShadow=true;
    props.add(structure);
  }
  return props;
}
