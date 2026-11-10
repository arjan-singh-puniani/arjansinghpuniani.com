import * as T from '../vendor/build/three.module.js';
import {GLTFLoader} from '../vendor/examples/jsm/loaders/GLTFLoader.js';
import {corticalFinish, operativeTissue, theatreDetails} from './anatomy.mjs';
import {fitClamp, steelReflections} from './clamp.mjs';
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
  return cloth;
}

export async function makeScene(canvas) {
  const loader=new GLTFLoader();
  const [{scene:atlas},{scene:hand}]=await Promise.all(['femur','glove'].map(asset =>
    loader.loadAsync(new URL('./assets/'+asset+'.glb',import.meta.url).href)
  ));
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer:coarse)').matches?1.18:1.45));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.10;
  const scene=new T.Scene(), camera=new T.OrthographicCamera(-2,2,2,-2,.1,50);
  const field=new T.Group(), proximal=new T.Group(), distal=new T.Group(), nail=new T.Group();
  scene.add(field,proximal,distal,nail);
  scene.add(new T.HemisphereLight(0xe5f6ff,0x381e29,1.67));
  const light=new T.DirectionalLight(0xffeddb,2.48);
  light.position.set(-4,5,7);
  const fill=new T.DirectionalLight(0x75b7db,1.48);
  fill.position.set(5,0,-4);
  scene.add(light,fill);

  const xray=new T.MeshBasicMaterial({color:0xd5e6e6,side:T.DoubleSide,transparent:true,opacity:.70,depthWrite:false});
  const cut=new T.MeshStandardMaterial({color:0xd7e2d7,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide,roughness:.62});
  const atlasDistal=atlas.getObjectByName('Distal');
  proximal.add(atlas.getObjectByName('Proximal'));
  distal.add(atlasDistal);
  const boneMeshes=[];
  for(const fragment of [proximal,distal])fragment.traverse(part=>{
    if(!part.isMesh)return;
    const original=part.material;
    corticalFinish(original,original.name!=='Cortex');
    const orientation=original.clone();
    orientation.emissive.set(0x4e88a1);
    orientation.emissiveIntensity=.19;
    boneMeshes.push({part,original,orientation});
  });

  const backdrop=drape(field,new T.MeshBasicMaterial({color:0x145a73}));
  const skin=bead(0,0,-.37,1.03,2.95,.40,mat(0xa86859,.81),field);
  const {group:muscle,sides:tissueSides}=operativeTissue();
  field.add(muscle);
  const cover=new T.Group();
  field.add(cover);
  const pad=bead(0,0,.03,.46,.95,.15,mat(0xf1eee4,.92),cover);
  pad.rotation.z=-.09;
  const seamMat=mat(0xd1dfd9,.95);
  for(let i=-7;i<=7;i++)curve([[-.26,i*.094,.145],[0,i*.094,.19],[.26,i*.094,.145]],.006,seamMat,cover,10);

  const steel=mat(0xa6b4bc,.22,.78), darkSteel=mat(0x465b69,.33,.68), gripMat=mat(0x254957,.39,.25);
  steel.envMap=darkSteel.envMap=steelReflections();
  steel.envMapIntensity=1.5;
  darkSteel.envMapIntensity=1.5;
  steel.side=darkSteel.side=T.DoubleSide;
  const tools=Object.fromEntries(['front','side'].map(view=>{
    const result=fitClamp(atlasDistal.userData,view,steel,darkSteel,hand);
    distal.add(result.tool);
    return [view,result];
  }));
  const props=theatreDetails(steel);
  const supportGlove=hand.clone();
  supportGlove.rotation.set(0,Math.PI,-.22);
  supportGlove.position.set(-.14,1.06,.98);
  const cuff=new T.Mesh(new T.CylinderGeometry(.12,.16,1.6,18),mat(0x17536d,.83));
  cuff.rotation.z=1.28;
  cuff.position.set(-2.47,.90,.79);
  props.add(supportGlove,cuff);
  field.add(props);
  const implant=mat(0x548ca0,.26,.62);
  const canal=atlasDistal.userData.canal;
  const path=Array.from({length:canal.length/3},(_,i)=>canal.slice(i*3,i*3+3));
  const center=y=>path.find(p=>p[1]===y);
  const tip=path.at(-1);
  curve(path,.070,implant,nail,52);
  bead(...tip,.083,.090,.083,implant,nail);
  proximal.updateMatrixWorld(true);
  distal.updateMatrixWorld(true);
  const ray=new T.Raycaster();
  const targets=stations.map(({y,view})=>{
    const [x,,z]=center(y);
    const fragment=y<0?distal:proximal;
    const cortex=sign=>{
      ray.set(V(x+sign*2,y,z),V(-sign,0,0));
      return ray.intersectObject(fragment.children[0],true)[0]?.point.x ?? x+sign*.24;
    };
    return {x,y,z,near:cortex(-1),far:cortex(1),view};
  });
  const locks=targets.map(({y,z,near,far})=>{
    const group=new T.Group();
    scene.add(group);
    curve([[near-.035,y,z],[far+.014,y,z]],.032,steel,group,12);
    bead(near-.035,y,z,.027,.056,.056,steel,group);
    return group;
  });
  const seatTool=new T.Group();
  nail.add(seatTool);
  curve([tip,[tip[0],2.27,tip[2]],[.37,2.36,tip[2]]],.049,steel,seatTool);
  curve([[.22,2.36,tip[2]],[.48,2.36,tip[2]]],.08,gripMat,seatTool);
  const ports=targets.map(({x,y,z})=>{
    const rim=mesh(new T.TorusGeometry(.043,.012,8,24),steel,nail);
    rim.rotation.y=Math.PI/2;
    rim.position.set(x-.071,y,z);
    const center=mesh(new T.CircleGeometry(.035,24),new T.MeshBasicMaterial({color:0x102a37,side:T.DoubleSide}),rim);
    center.position.z=-.001;
    return rim;
  });
  const jig=new T.Group(), upper=targets.at(-1), sleeveX=upper.near-.52;
  nail.add(jig);
  curve([[tip[0],2.25,tip[2]],[sleeveX,2.18,upper.z],[sleeveX,upper.y,upper.z]],.039,gripMat,jig);
  const sleeve=mesh(new T.CylinderGeometry(.056,.056,.28,16),steel,jig);
  sleeve.rotation.z=Math.PI/2;
  sleeve.position.set(sleeveX+.14,upper.y,upper.z);
  const guides=new T.Group();
  scene.add(guides);
  const line=new T.Line(new T.BufferGeometry().setFromPoints([V(0,-1.24,.31),V(0,1.24,.31)]),new T.LineDashedMaterial({color:0x78d8e7,dashSize:.075,gapSize:.055,transparent:true,opacity:.56,depthTest:false}));
  line.computeLineDistances();guides.add(line);
  const markMaterial=new T.MeshBasicMaterial({color:0x8dd6e4,depthTest:false});
  for(const [group,y] of [[guides,.27],[distal,-.29]]) {
    const mark=mesh(new T.TorusGeometry(.225,.011,6,44),markMaterial,group);
    mark.position.y=y;
    mark.rotation.x=Math.PI/2;
  }
  const movingMark=distal.children.at(-1);
  const background=new T.Color();
  scene.background=background;

  const fieldDepth=new T.Vector3();
  let width=1,height=1, span=5.65, roll=0;
  function size(w,h) {
    width=Math.max(1,w);height=Math.max(1,h);
    renderer.setSize(width,height,false);
  }
  function frame(view, close, operative, seating, distalLevel) {
    const aspect=width/height;
    span=Math.max(distalLevel!==undefined?2.5:seating?8.6:operative?4.2:close?3.28:5.86, (distalLevel!==undefined?2.4:operative?5:close?2.76:2.88)/aspect);
    const half=span/2, center=distalLevel??(seating?1.15:operative?-.57:close?-.11:0);
    const yaw=(view==='front'?0:-Math.PI/2)+(operative?-.23:0);
    roll=operative?-.15:0;
    camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
    camera.position.set(10*Math.sin(yaw),center+(operative?.95:0),10*Math.cos(yaw));
    camera.up.set(Math.cos(yaw)*Math.sin(roll),Math.cos(roll),-Math.sin(yaw)*Math.sin(roll));
    camera.lookAt(0,center,0);
    if(operative) camera.translateX(.49);
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
    const target=s.stage==='fix'?targets[s.locks]:null;
    const distalTarget=target?.view==='side';
    const film=options.film||s.stage==='image'||s.stage==='prelock'||distalTarget;
    const cutaway=['seat','fix'].includes(s.stage)&&!film;
    const close=s.stage==='reduce';
    const operative=close&&!film;
    const seating=s.stage==='seat';
    backdrop.scale.set(seating?1.85:1,seating?1.5:1,1);
    frame(view,close,operative,seating,distalTarget?target.y:undefined);
    // Recess the illustrative bed so it does not obscure the tools in an educational cutaway.
    if(operative||cutaway) field.position.copy(camera.getWorldDirection(fieldDepth).multiplyScalar(2.8));
    else field.position.set(0,0,0);
    distal.position.set(pose.x,-pose.gap,pose.z);
    distal.rotation.set(pose.side,pose.twist,-pose.front,'YXZ');
    field.visible=!film;
    skin.visible=s.stage==='inspect'||s.stage==='dress'||s.stage==='review';
    skin.position.z=s.stage==='inspect'?-.25:.08;
    skin.scale.z=s.stage==='inspect'?.34:.32;
    muscle.visible=s.stage!=='dress'&&s.stage!=='review';
    const axis=view==='front'?'x':'z';
    const tension=operative&&s.grip ? Math.min(1,Math.hypot(pose[axis]-s.grip.pose[axis],pose.gap-s.grip.pose.gap)*2.8) : 0;
    for(let i=0;i<tissueSides.length;i++){
      tissueSides[i].position.x=(i===0?-1:1)*tension*.052+(operative&&i===1?.075:0);
      tissueSides[i].scale.z=1-tension*.07;
      tissueSides[i].position.z=operative&&i===1?-.045:0;
    }
    props.visible=operative;
    cover.visible=s.stage==='dress'||s.stage==='review';
    cover.scale.setScalar(s.stage==='review'?1:.76);
    for(const {part,original,orientation} of boneMeshes) part.material=film?xray:cutaway?cut:s.stage==='inspect'?orientation:original;
    xray.opacity=.72;
    proximal.visible=distal.visible=s.stage!=='dress'&&s.stage!=='review'||film;
    for(const [name,result] of Object.entries(tools))result.tool.visible=operative&&view===name;
    const {tool,handle,setClosure}=tools[view];
    setClosure(options.closure ?? Number(Boolean(s.grip)));
    nail.visible=options.hardware!==undefined?options.hardware:['seat','prelock','fix','image'].includes(s.stage);
    nail.position.y=(1-s.nail)*2.24;
    jig.visible=Boolean(target&&!distalTarget);
    seatTool.visible=s.stage==='seat'||jig.visible;
    ports.forEach((port,i)=>{port.visible=distalTarget&&i===s.locks});
    locks.forEach((lock,i)=>{lock.visible=nail.visible&&i<s.locks});
    movingMark.visible=guides.visible=operative&&!s.expert;
    const markColor=aligned(pose,view)?0x98e6ba:0x78d8e7;
    line.material.color.set(markColor);
    markMaterial.color.set(markColor);
    background.set(film?0x101d26:0x0b3e51);
    renderer.render(scene,camera);
    if(operative)return {handle:point(tool.localToWorld(handle.clone()))};
    if(seating)return {handle:point(V(.36,2.36+nail.position.y,tip[2]))};
    if(target){
      const {x,y,z}=target;
      const contact=distalTarget?V(x-.071,y,z):V(sleeveX,y,z);
      const grip=contact.clone().add(V(distalTarget?0:s.aim.x,s.aim.y,distalTarget?s.aim.x:0));
      return {handle:point(grip),contact:point(contact)};
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
  return {
    draw,size,snapshot,
    modelDelta(x,y) {
      const scale=span/height, c=Math.cos(roll), s=Math.sin(roll);
      return [(c*x-s*y)*scale,(s*x+c*y)*scale];
    }
  };
}
