import * as T from '../vendor/build/three.module.js';
import {mergeGeometries} from '../vendor/examples/jsm/utils/BufferGeometryUtils.js';
import {aligned, stations} from './model.mjs';

const V = (x,y,z) => new T.Vector3(x,y,z);
const mat = (color, roughness=.55, metalness=0) => new T.MeshStandardMaterial({color, roughness, metalness});
const mesh = (geometry, material, parent) => {
  const object = new T.Mesh(geometry, material);
  parent.add(object);
  return object;
};
const tube = (points, radius, segments=28) => new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => V(...p))),segments,radius,10,false);
const curve = (points, radius, material, parent, segments) => mesh(tube(points,radius,segments),material,parent);
const bead = (x,y,z,sx,sy,sz,material,parent) => {
  const object = mesh(new T.SphereGeometry(1,24,16),material,parent);
  object.position.set(x,y,z);
  object.scale.set(sx,sy,sz);
  return object;
};
const shaftX = y => .07 * Math.sin(y * 1.3);
const shaftZ = y => .055 * Math.sin(y * 1.2);
const jag = a => .072 * Math.sin(3*a+.45) + .028 * Math.sin(7*a) + .12 * Math.cos(a);

function shaft(parent, rings, bone, marrow) {
  const vertices=[], indices=[], n=48;
  for (const [y, width, depth] of rings) {
    for (let i=0;i<n;i++) {
      const angle=i/n*Math.PI*2;
      const surface=1+.028*Math.sin(angle*5+y*2)+.018*Math.cos(angle*9-y);
      vertices.push(shaftX(y)+Math.cos(angle)*width*surface,
        y===0 ? jag(angle) : y, shaftZ(y)+Math.sin(angle)*depth*surface);
    }
  }
  for (let row=0;row<rings.length-1;row++) for (let col=0;col<n;col++) {
    const a=row*n+col,b=row*n+(col+1)%n;
    indices.push(a,a+n,b,b,a+n,b+n);
  }
  const geom=new T.BufferGeometry();
  geom.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  mesh(geom,bone,parent);
  const seam=rings.findIndex(([y])=>y===0)*n;
  const face=[], triangles=[];
  for (const scale of [1,.57]) for(let i=0;i<n;i++) {
    const at=(seam+i)*3;
    face.push(vertices[at]*scale, vertices[at+1], vertices[at+2]*scale);
  }
  for(let i=0;i<n;i++){
    const next=(i+1)%n;
    triangles.push(i,next,n+i,next,n+next,n+i);
  }
  const cap=new T.BufferGeometry();
  cap.setAttribute('position',new T.Float32BufferAttribute(face,3));
  cap.setIndex(triangles);
  cap.computeVertexNormals();
  mesh(cap,marrow,parent);
}

function drape(parent, material) {
  const geom=new T.PlaneGeometry(12,10,68,56);
  const pos=geom.attributes.position, colors=[];
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i);
    const folds=.6*Math.sin(x*7+y*1.3)+.4*Math.sin(y*3.2+x*2.3);
    pos.setZ(i, .055*Math.sin(x*13+y*2)+.13*folds);
    const shade=.84+.13*folds+.022*Math.sin(x*23+y*17);
    colors.push(shade,shade,shade);
  }
  geom.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geom.computeVertexNormals();
  material.vertexColors=true;
  const cloth=mesh(geom,material,parent);
  cloth.position.z=-1.15;
}

export function makeScene(canvas) {
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;
  const scene=new T.Scene(), camera=new T.OrthographicCamera(-2,2,2,-2,.1,50);
  const field=new T.Group(), proximal=new T.Group(), distal=new T.Group(), nail=new T.Group();
  scene.add(field,proximal,distal,nail);
  scene.add(new T.HemisphereLight(0xe5f6ff,0x4e2428,2.1));
  const light=new T.DirectionalLight(0xffeed7,2.65);
  light.position.set(-4,5,7);
  const fill=new T.DirectionalLight(0x75b7db,1.75);
  fill.position.set(5,0,-4);
  scene.add(light,fill);

  const bone=mat(0xf2d6a8,.62), marrow=mat(0xc59060,.85);
  bone.side=marrow.side=T.DoubleSide;
  const xray=new T.MeshBasicMaterial({color:0xd5e6e6,side:T.DoubleSide,transparent:true,opacity:.70,depthWrite:false});
  const orientation=bone.clone();
  orientation.emissive.set(0x508bb4);
  orientation.emissiveIntensity=.31;
  const cut=bone.clone();
  cut.transparent=true;cut.opacity=.29;cut.depthWrite=false;
  const upper=[[0,.207,.174],[.13,.205,.169],[.32,.209,.172],[.65,.217,.183],[1.0,.227,.19],
    [1.32,.25,.213],[1.59,.28,.232],[1.87,.33,.246],[2.14,.32,.26],[2.32,.16,.16]];
  const lower=[[-2.46,.29,.245],[-2.29,.35,.26],[-2.03,.324,.248],[-1.72,.275,.217],[-1.42,.234,.203],
    [-1.13,.212,.19],[-.79,.201,.18],[-.44,.199,.173],[-.17,.20,.176],[0,.207,.174]];
  shaft(proximal,upper,bone,marrow);
  shaft(distal,lower,bone,marrow);
  bead(.13,2.20,.02,.28,.35,.24,bone,proximal);
  curve([[-.03,1.97,0],[-.27,2.18,.02],[-.55,2.40,.02]],.19,bone,proximal);
  bead(-.64,2.44,.018,.275,.267,.255,bone,proximal);
  bead(-.21,-2.35,.01,.236,.316,.29,bone,distal);
  bead(.22,-2.30,-.045,.235,.28,.25,bone,distal);
  const boneMeshes=[...proximal.children,...distal.children].map(part=>({part,original:part.material}));
  const landmarks=[
    curve([[.20,.32,.09],[.18,.54,.12],[.14,.72,.14]],.018,mat(0xd8ac77),proximal),
    curve([[.19,-.28,.09],[.178,-.52,.12],[.135,-.74,.14]],.018,mat(0xd8ac77),distal)
  ];

  drape(field,mat(0x06536a,.95));
  const skin=bead(0,0,-.37,.97,2.95,.40,mat(0xab6a58,.81),field);
  const muscle=new T.Group();
  field.add(muscle);
  const fibers=[];
  for(const [x,y,z,sx,sy,sz,shade] of [
    [-.58,.53,-.23,.26,1.98,.35,0x9a4f46],[.57,.52,-.23,.28,1.92,.36,0xaa5b4f],
    [-.83,-.48,-.20,.21,1.91,.29,0x773c40],[.81,-.36,-.18,.22,1.95,.31,0x884a48],
    [-.48,-.68,-.39,.32,1.75,.23,0xa95448],[.45,-.58,-.37,.31,1.82,.25,0xbc6b58]
  ]) {
    const layer=bead(x,y,z,sx,sy,sz,mat(shade,.87),muscle);
    layer.rotation.z=x*.10;
    for(let i=-3;i<=3;i++){
      const base=x+i*.042, tint=new T.Color(shade).lerp(new T.Color(0xffb58c),.14+Math.abs(i)*.018);
      const fiber=tube([[base*.72,y+sy*.84,z+.12],[base,y+sy*.27,z+sz*.92],
        [base*1.03,y-sy*.31,z+sz*.93],[base*.76,y-sy*.84,z+.115]],.009,14);
      const color=new Float32Array(fiber.attributes.position.count*3);
      for(let j=0;j<color.length;j+=3)tint.toArray(color,j);
      fiber.setAttribute('color',new T.BufferAttribute(color,3));
      fibers.push(fiber);
    }
  }
  const fiberMaterial=mat(0xffffff,.9);
  fiberMaterial.vertexColors=true;
  mesh(mergeGeometries(fibers),fiberMaterial,muscle);
  for(const fiber of fibers)fiber.dispose();
  const cover=new T.Group();
  field.add(cover);
  const pad=bead(0,0,.03,.46,.95,.15,mat(0xf1eee4,.92),cover);
  pad.rotation.z=-.09;
  const seamMat=mat(0xd1dfd9,.95);
  for(let i=-7;i<=7;i++)curve([[-.26,i*.094,.145],[0,i*.094,.19],[.26,i*.094,.145]],.006,seamMat,cover,10);

  const steel=mat(0xc0d2da,.27,.6), gripMat=mat(0x254957,.39,.25);
  const tool=new T.Group();
  distal.add(tool);
  tool.position.y=-.43;
  const jawParts=[];
  for(const sign of [-1,1]){
    const jaw=new T.Group();
    tool.add(jaw);
    curve([[.18,sign*.06,.17],[.04,sign*.17,.15],[-.15,sign*.17,.14],[-.22,sign*.08,.12]],.041,steel,jaw);
    curve([[.14,sign*.06,.17],[.38,sign*.078,.18],[.77,sign*.115,.22],[1.09,sign*.16,.25]],.045,steel,jaw);
    curve([[.61,sign*.10,.21],[.89,sign*.14,.25],[1.17,sign*.17,.28]],.064,gripMat,jaw);
    for(let i=0;i<4;i++)bead(-.18+i*.052,sign*(.115+i*.012),.132,.024,.023,.028,steel,jaw);
    jawParts.push(jaw);
  }
  bead(.19,0,.20,.087,.075,.053,steel,tool);
  const handle=V(1.10,0,.25);
  const implant=mat(0x548ca0,.26,.62);
  curve(Array.from({length:9},(_,i)=>{const y=-2.10+i*.51;return [shaftX(y),y,shaftZ(y)]}),.088,implant,nail,44);
  bead(shaftX(1.98),1.98,shaftZ(1.98),.108,.12,.106,implant,nail);
  const locks=stations.map(y=>{
    const group=new T.Group();
    group.position.y=y;
    scene.add(group);
    curve([[shaftX(y),0,-.32],[shaftX(y),0,.34]],.045,steel,group,12);
    bead(shaftX(y),0,.34,.074,.074,.034,steel,group);
    return group;
  });
  const seatTool=new T.Group();
  nail.add(seatTool);
  curve([[shaftX(2),1.99,shaftZ(2)],[shaftX(2),2.27,shaftZ(2)],[.37,2.36,shaftZ(2)]],.049,steel,seatTool);
  curve([[.22,2.36,shaftZ(2)],[.48,2.36,shaftZ(2)]],.08,gripMat,seatTool);
  const ports=stations.map(y=>bead(shaftX(y),y,shaftZ(y)+.077,.049,.049,.023,mat(0x102a37,.55),nail));
  const guides=new T.Group();
  scene.add(guides);
  const line=new T.Line(new T.BufferGeometry().setFromPoints([V(0,-1.24,.31),V(0,1.24,.31)]),new T.LineDashedMaterial({color:0x78d8e7,dashSize:.075,gapSize:.055,transparent:true,opacity:.56,depthTest:false}));
  line.computeLineDistances();guides.add(line);
  for(const y of [-.31,.31]) {
    const mark=mesh(new T.TorusGeometry(.24,.013,6,44),new T.MeshBasicMaterial({color:0x8dd6e4,depthTest:false}),guides);
    mark.position.y=y;
    mark.rotation.x=Math.PI/2;
  }

  let width=1,height=1, span=5.65;
  function size(w,h) {
    width=Math.max(1,w);height=Math.max(1,h);
    renderer.setSize(width,height,false);
  }
  function frame(view, close) {
    const aspect=width/height;
    span=Math.max(close?3.28:5.86, (close?2.76:2.88)/aspect);
    const half=span/2;
    camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
    const center=close?-.11:0;
    if(view==='front')camera.position.set(0,center,10);
    else camera.position.set(-10,center,0);
    camera.lookAt(0,center,0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    field.rotation.y=view==='front'?0:-Math.PI/2;
    guides.rotation.y=field.rotation.y;
  }
  function point(point) {
    point.project(camera);
    return {x:(point.x+1)*width/2,y:(1-point.y)*height/2};
  }
  function draw(s, options={}) {
    const pose=options.pose||s.pose, view=s.view;
    const film=options.film||s.stage==='image';
    const cutaway=['seat','fix'].includes(s.stage)&&!film;
    const close=s.stage==='reduce'&&!film;
    frame(view,close);
    distal.position.set(pose.x,-pose.gap,pose.z);
    distal.rotation.set(pose.side,pose.twist,-pose.front,'YXZ');
    field.visible=!film;
    skin.visible=s.stage==='inspect'||s.stage==='dress'||s.stage==='review';
    skin.position.z=s.stage==='inspect'?-.25:.08;
    skin.scale.z=s.stage==='inspect'?.34:.32;
    muscle.visible=s.stage!=='dress'&&s.stage!=='review';
    muscle.position.x=s.grip&&s.stage==='reduce' ? -.06*(view==='front'?pose.x:pose.z) : 0;
    cover.visible=s.stage==='dress'||s.stage==='review';
    cover.scale.setScalar(s.stage==='review'?1:.76);
    for(const {part,original} of boneMeshes) part.material=film?xray:cutaway?cut:s.stage==='inspect'?orientation:original;
    xray.opacity=.72;
    proximal.visible=distal.visible=s.stage!=='dress'&&s.stage!=='review'||film;
    for(const landmark of landmarks)landmark.visible=!cutaway&&(s.stage==='reduce'||film);
    tool.visible=s.stage==='reduce'&&!film;
    tool.rotation.y=view==='front'?0:-Math.PI/2;
    jawParts.forEach((jaw,i)=>{jaw.rotation.z=(i?1:-1)*(s.grip?.pose ? .015 : .11)});
    nail.visible=options.hardware!==undefined?options.hardware:['seat','fix','image'].includes(s.stage);
    nail.position.y=(1-s.nail)*2.04;
    seatTool.visible=s.stage==='seat'&&!film;
    for(const port of ports)port.visible=!film;
    locks.forEach((lock,i)=>{lock.visible=nail.visible&&i<s.locks});
    guides.visible=close&&!s.expert;
    line.material.color.set(aligned(pose,view)?0x98e6ba:0x78d8e7);
    scene.background=new T.Color(film?0x101d26:0x0b3e51);
    renderer.render(scene,camera);
    if(s.stage==='reduce')return {handle:point(tool.localToWorld(handle.clone())), contact:point(distal.localToWorld(V(0,-.43,.17)))};
    if(s.stage==='seat')return {handle:point(V(.42,Math.min(2.5,2.36+nail.position.y),.04)),contact:point(V(0,Math.min(2.45,1.98+nail.position.y),.08))};
    if(s.stage==='fix'){
      const y=stations[s.locks],x=shaftX(y);
      return {handle:point(V(x+s.aim.x,y+s.aim.y,.35)),contact:point(V(x,y,.35))};
    }
    return {};
  }
  const plate=document.createElement('canvas');
  const capture=plate.getContext('2d');
  function snapshot(s,pose,hardware) {
    draw(s,{pose,hardware,film:true});
    plate.width=Math.min(canvas.width,Math.round(canvas.height*.72));
    plate.height=canvas.height;
    capture.drawImage(canvas,Math.round((canvas.width-plate.width)/2),0,plate.width,plate.height,0,0,plate.width,plate.height);
    return plate.toDataURL('image/png');
  }
  return {draw,size,snapshot,worldPerPixel:()=>span/height};
}
