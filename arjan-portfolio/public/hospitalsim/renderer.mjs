import * as THREE from 'three';
import {samplePose,dangle,restoreBones} from './animation.mjs?v=066';
import {sampleRoute,interiorPath,sampleInterior,staffPost,staffInteriorPath,drapePose} from './motion.mjs?v=066';
import {GLTFLoader} from './vendor/examples/jsm/loaders/GLTFLoader.js';
import {clone} from './vendor/examples/jsm/utils/SkeletonUtils.js';
import {OrbitControls} from './vendor/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from './vendor/examples/jsm/environments/RoomEnvironment.js';
import {GRID,TYPES,door,path,placement,entrance,exit,gateDirection,gatePlacement,dropPlacement} from './simulation.mjs?v=066';

export const roomHeight=type=>({scan:.63,care:.25,consult:.85,rest:.25,plan:.85}[type]);
export function world(x,y,height=.25){return new THREE.Vector3((x-4)*GRID.step,height,(y-3.5)*GRID.step)}
const center=r=>world(r.x+.5,r.y+.5,roomHeight(r.type));
const speedForTurn=(paused,simDt,dt)=>paused?16:16*Math.max(1,simDt/dt);
const pale=new THREE.MeshStandardMaterial({color:0xc1e0eb,roughness:.73});
const blue=new THREE.MeshStandardMaterial({color:0x287eac,roughness:.6});
const ivory=new THREE.MeshStandardMaterial({color:0xf2f3ed,roughness:.87});

function beveledBox(w,h,d,r=.035){
 r=Math.min(r,h/3);const x=w/2-r,z=d/2-r,shape=new THREE.Shape();shape.moveTo(-x,-d/2);shape.lineTo(x,-d/2);shape.quadraticCurveTo(w/2,-d/2,w/2,-z);shape.lineTo(w/2,z);shape.quadraticCurveTo(w/2,d/2,x,d/2);shape.lineTo(-x,d/2);shape.quadraticCurveTo(-w/2,d/2,-w/2,z);shape.lineTo(-w/2,-z);shape.quadraticCurveTo(-w/2,-d/2,-x,-d/2);const g=new THREE.ExtrudeGeometry(shape,{depth:h-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r/2,bevelSegments:2,steps:1,curveSegments:3});g.rotateX(-Math.PI/2);g.translate(0,-h/2+r,0);return g;
}

export class Diorama {
 constructor(canvas,getState,onPick,onHover,onProgress,onLift,onDrop){
  this.canvas=canvas;this.state=getState;this.onPick=onPick;this.onHover=onHover;this.progress=onProgress;this.onLift=onLift;this.onDrop=onDrop;this.gates=new Map();this.mobile=matchMedia('(pointer:coarse)').matches||canvas.clientWidth<700;canvas.dataset.renderProfile=this.mobile?'mobile30':'desktop';
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#fafaf6');
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:!this.mobile,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');canvas.dataset.gpu=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.15:1.6));canvas.dataset.renderScale=this.renderer.getPixelRatio();canvas.dataset.shadowSize=this.mobile?1024:2048;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.13;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.type=this.mobile?THREE.PCFSoftShadowMap:THREE.VSMShadowMap;
  this.camera=new THREE.OrthographicCamera(-10,10,8,-8,.1,120);this.camera.position.set(16,19,23);this.camera.lookAt(0,.3,0);
  this.controls=new OrbitControls(this.camera,canvas);this.controls.enableRotate=false;this.controls.enableDamping=true;this.controls.dampingFactor=.12;this.controls.minZoom=.65;this.controls.maxZoom=2.8;this.controls.target.set(0,.3,0);this.controls.screenSpacePanning=true;this.controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};this.controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN};
  const env=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(this.renderer);this.scene.environment=pmrem.fromScene(env,.04).texture;env.dispose();pmrem.dispose();this.scene.environmentIntensity=.3;
  this.scene.add(new THREE.HemisphereLight(0xe9f6ff,0xb3b8b3,1.05));
  const key=new THREE.DirectionalLight(0xfff3dc,2.0);key.position.set(-8,18,9);key.castShadow=true;key.shadow.mapSize.set(this.mobile?1024:2048,this.mobile?1024:2048);key.shadow.camera.left=-13;key.shadow.camera.right=13;key.shadow.camera.top=13;key.shadow.camera.bottom=-13;key.shadow.normalBias=.025;key.shadow.bias=-.0002;key.shadow.radius=5;key.shadow.blurSamples=12;this.scene.add(key);
  const fill=new THREE.DirectionalLight(0xe4f5ff,.65);fill.position.set(8,5,-8);this.scene.add(fill);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0xfafaf6,roughness:1,toneMapped:false}));ground.rotation.x=-Math.PI/2;ground.position.y=-.23;ground.receiveShadow=true;this.scene.add(ground);
  this.static=new THREE.Group();this.scene.add(this.static);this.roomObjects=new Map();this.people=new Map();this.staffPeople=new Map();this.templates={};this.assets={};this.pickables=[];
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.floor=new THREE.Plane(new THREE.Vector3(0,1,0),-.25);
  this.selection=new THREE.Box3Helper(new THREE.Box3(),0x136b88);this.selection.visible=false;this.scene.add(this.selection);this.routeLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x166d83,depthTest:false,transparent:true,opacity:.7}));this.routeLine.renderOrder=10;this.routeLine.visible=false;this.scene.add(this.routeLine);
  this.ghost=new THREE.Group();const gm=new THREE.MeshStandardMaterial({color:0x309a88,transparent:true,opacity:.35,depthWrite:false});const plate=new THREE.Mesh(new THREE.BoxGeometry(3.22,.08,3.22),gm);plate.position.y=.03;this.ghost.add(plate);this.ghost.visible=false;this.scene.add(this.ghost);this.ghostMat=gm;
  this.grid=new THREE.GridHelper((GRID.w-1)*GRID.step,(GRID.w-1)*4,0x4f99b4,0xb6d1d7);this.grid.position.copy(world(4,3.5,.27));this.grid.visible=false;this.scene.add(this.grid);
  this.makeContacts();this.makeWalkways();
  this.characterContacts=new THREE.InstancedMesh(new THREE.PlaneGeometry(.65,.55),new THREE.MeshBasicMaterial({map:this.contactTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),220);this.characterContacts.frustumCulled=false;this.characterContacts.count=0;this.scene.add(this.characterContacts);
  let down,holdTimer;const clear=()=>{clearTimeout(holdTimer);holdTimer=null};
  const begin=()=>{if(!down?.person||this.carry)return;if(this.onLift(down.person.kind,down.person.id)){down.dragging=true;this.controls.enabled=false;canvas.style.cursor='grabbing'}};
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;down={x:e.clientX,y:e.clientY,person:this.tool?null:this.personAt(e)};if(down.person||this.carry){e.stopImmediatePropagation();e.preventDefault();canvas.setPointerCapture(e.pointerId);if(down.person)holdTimer=setTimeout(begin,280)}},{capture:true});
  canvas.addEventListener('pointermove',e=>{if(down?.person&&Math.hypot(down.x-e.clientX,down.y-e.clientY)>9){clear();begin()}const p=this.tile(e);if(p)this.onHover(p);if(this.carry){this.canvas.dataset.pointerX=e.clientX;this.canvas.dataset.pointerY=e.clientY;this.pointerCarry();e.stopImmediatePropagation();e.preventDefault()}},{capture:true});
  canvas.addEventListener('pointerup',e=>{clear();if(this.carry){e.stopImmediatePropagation();const p=this.tile(e);this.onDrop(p);down=null;return}if(down&&Math.hypot(down.x-e.clientX,down.y-e.clientY)<7)this.pick(e);down=null},{capture:true});
  canvas.addEventListener('pointercancel',()=>{clear();down=null;this.onDrop(null)});

  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
  this.metrics={frames:0,frameMs:[],triangles:0,drawCalls:0,peakTriangles:0,peakDrawCalls:0};
 }
 makeContacts(){
  const size=64,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;const d=Math.hypot((x-size/2)/(size/2),(y-size/2)/(size/2));data[i]=26;data[i+1]=54;data[i+2]=65;data[i+3]=Math.round(Math.max(0,1-d)**1.7*85)}
  this.contactTexture=new THREE.DataTexture(data,size,size);this.contactTexture.needsUpdate=true;
 }
 contact(parent,w=1,d=1){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:this.contactTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));p.rotation.x=-Math.PI/2;p.position.y=.008;parent.add(p);return p}
 makeWalkways(){
  const mat=new THREE.MeshStandardMaterial({color:0xc9e1e7,roughness:.83});
  this.corridor=new THREE.InstancedMesh(new THREE.BoxGeometry(GRID.step/2,.20,GRID.step/2),mat,GRID.w*GRID.h*4);this.corridor.receiveShadow=true;this.corridor.castShadow=true;this.static.add(this.corridor);
  this.updateWalkways();
  const arrival=new THREE.Group();this.reception=arrival;arrival.position.copy(world(entrance(this.state()).x+.6,entrance(this.state()).y-.5));this.static.add(arrival);
  const desk=new THREE.Mesh(new THREE.BoxGeometry(.95,.73,.42),ivory);desk.position.set(.27,.365,.35);desk.castShadow=true;arrival.add(desk);
  const top=new THREE.Mesh(new THREE.BoxGeometry(1.03,.045,.48),pale);top.position.set(.27,.75,.35);top.castShadow=true;arrival.add(top);
  const inset=new THREE.Mesh(new THREE.BoxGeometry(.67,.38,.012),blue);inset.position.set(.27,.41,.568);arrival.add(inset);
  const screen=new THREE.Mesh(new THREE.BoxGeometry(.29,.19,.025),new THREE.MeshStandardMaterial({color:0x23596b,roughness:.32}));screen.position.set(.38,.90,.35);screen.castShadow=true;arrival.add(screen);this.contact(arrival,1.6,1.2);
 }
 updateWalkways(){
  const s=this.state(),nodes=[entrance(s),exit(s),...s.rooms.map(door),...s.staff.filter(st=>st.position).map(st=>st.position)],layoutKey=JSON.stringify([s.rooms.map(r=>[r.x,r.y,r.type]),nodes]),layoutChanged=this.walkwayKey!==layoutKey,cells=layoutChanged?new Map():this.walkwayCells,beforeCount=cells.size,put=p=>{p={x:Math.round(p.x*2)/2,y:Math.round(p.y*2)/2};cells.set(`${p.x},${p.y}`,p)};
  if(layoutChanged){this.canvas.dataset.floorTopologyBuilds=Number(this.canvas.dataset.floorTopologyBuilds||0)+1;this.walkwayKey=layoutKey;this.walkwayCells=cells;for(const a of nodes)for(const b of nodes){put(a);for(const p of path(a,b,s.rooms)||[])put(p)}}
  for(const p of s.patients){if(!['service','transfer-in','transfer-out','uncovering','entering-room','leaving-room','handoff'].includes(p.state)&&!p.outside)put(p);for(const point of [...(p.motion||[]),...(p.route||[])])put(point)}
  if(layoutChanged){
  // Fill enclosed circulation holes so moving routes do not leave a patchwork floor.
  const exterior=new Set(),queue=[];const key=(x,y)=>`${x/2},${y/2}`,open=(x,y)=>x>=0&&x<GRID.w*2-1&&y>=0&&y<GRID.h*2-1&&!cells.has(key(x,y))&&!s.rooms.some(r=>x/2>=r.x&&x/2<r.x+2&&y/2>=r.y&&y/2<r.y+2);
  for(let y=0;y<GRID.h*2-1;y++)for(let x=0;x<GRID.w*2-1;x++)if((x===0||y===0||x===GRID.w*2-2||y===GRID.h*2-2)&&open(x,y)){queue.push({x,y});exterior.add(key(x,y))}
  for(let j=0;j<queue.length;j++){const p=queue[j];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(open(x,y)&&!exterior.has(k)){exterior.add(k);queue.push({x,y})}}}
  for(let y=0;y<GRID.h*2-1;y++)for(let x=0;x<GRID.w*2-1;x++)if(open(x,y)&&!exterior.has(key(x,y)))put({x:x/2,y:y/2});}
  if(!layoutChanged&&beforeCount===cells.size)return;this.canvas.dataset.floorUpdates=Number(this.canvas.dataset.floorUpdates||0)+1;
  const matrix=new THREE.Matrix4();let i=0;for(const p of cells.values()){matrix.makeTranslation(...world(p.x,p.y,.15));this.corridor.setMatrixAt(i++,matrix)}this.corridor.count=i;this.corridor.instanceMatrix.needsUpdate=true;this.corridor.computeBoundingBox();this.corridor.computeBoundingSphere();
 }
 syncGates(){
  if(!this.assets.doors)return;const s=this.state();
  for(const kind of ['entrance','exit']){let g=this.gates.get(kind);if(!g){g=this.assets.doors.scene.clone(true);this.soften(g);this.scene.add(g);this.gates.set(kind,g);g.userData.sliders=[];g.traverse(o=>{if(o.name.replace(/[ _]/g,'').startsWith('Doorglass'))g.userData.sliders.push({object:o,x:o.position.x})});const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#f6faf7';ctx.fillRect(0,0,512,96);ctx.fillStyle='#16556a';ctx.font='bold 44px sans-serif';ctx.textAlign='center';ctx.fillText(kind==='entrance'?'WELCOME  +':'HOME  →',256,64);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.245),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));sign.position.set(0,2.31,.96);g.add(sign)}
   const gate=kind==='entrance'?entrance(s):exit(s),out=gateDirection(gate);g.position.copy(world(gate.x,gate.y));g.rotation.y=Math.atan2(out.x,out.y);
   const visit=s.patients.find(p=>p.state===(kind==='entrance'?'entering-hospital':'leaving-hospital')),opening=visit?Math.min(1,(visit.progress+(this.lastAlpha||0))*4,(2-visit.progress-(this.lastAlpha||0))*4):0;for(const slider of g.userData.sliders)slider.object.position.x=slider.x+Math.sign(slider.x)*.66*opening;
  }
  if(this.reception)this.reception.position.copy(world(entrance(s).x+.65,entrance(s).y-.65));
 }
 personAt(e){
  this.tile(e);const hits=this.ray.intersectObjects([...this.people.values(),...this.staffPeople.values()].map(p=>p.group),true);if(!hits.length)return null;let o=hits[0].object;while(o&&!o.userData.patientId&&!o.userData.staffId)o=o.parent;return o?{kind:o.userData.patientId?'patient':'staff',id:o.userData.patientId||o.userData.staffId}:null;
 }
 hold(kind,id,tile){const person=(kind==='patient'?this.people:this.staffPeople).get(id),pose=[];person?.model.traverse(b=>{if(b.isBone)pose.push({bone:b,position:b.position.clone(),quaternion:b.quaternion.clone(),scale:b.scale.clone()})});const materials=[];person?.model.traverse(o=>{if(o.isMesh){materials.push({mesh:o,material:o.material});o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.65;o.material.depthWrite=false}});this.carry={kind,id,tile,time:0,pose,materials,gripHeight:person?.gripHeight||1.43};this.grid.visible=true;this.controls.enabled=false;this.canvas.style.cursor='grabbing';this.canvas.dataset.held=`${kind}:${id}`}
 release(){if(this.carry){const p=(this.carry.kind==='patient'?this.people:this.staffPeople).get(this.carry.id);if(p){restoreBones(this.carry.pose);for(const m of this.carry.materials){m.mesh.material.dispose();m.mesh.material=m.material}p.model.position.set(0,0,0);p.model.quaternion.identity();p.current=null}}this.carry=null;this.grid.visible=false;this.controls.enabled=true;this.canvas.style.cursor='';this.canvas.dataset.held='';if(this.carryRing)this.carryRing.visible=false}
 carryTo(tile){if(this.carry){this.carry.tile=tile;this.carry.target=world(tile.x,tile.y);this.carry.pin=null;const check=dropPlacement(this.state(),this.carry.kind,this.carry.id,tile.x,tile.y);this.canvas.dataset.dropValid=String(check.ok)}}
 pointerCarry(){if(!this.carry)return;const hit=new THREE.Vector3();if(this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-(1.13+this.carry.gripHeight)),hit))this.carry.pin=hit}
 updateCarry(dt,reduced){
  if(!this.carry)return;const c=this.carry,p=(c.kind==='patient'?this.people:this.staffPeople).get(c.id);if(!p)return;c.time+=dt;
  if(!c.target)c.target=p.group.position.clone();const target=c.pin?c.pin.clone().sub(new THREE.Vector3(0,c.gripHeight,0)):c.target.clone().setY(1.13);c.position??=target.clone();if(c.pin)c.position.copy(target);else c.position.lerp(target,1-Math.exp(-22*dt));p.group.position.copy(c.position);p.shadow.visible=false;
  // shortcut: damped authored joint sway, not a ragdoll solver; add physics only if collisions become gameplay.
  dangle(p,c.time,reduced);const collar=new THREE.Vector3(0,c.gripHeight,0);p.model.position.copy(collar).sub(collar.clone().applyQuaternion(p.model.quaternion));this.canvas.dataset.heldOpacity='.65';if(c.pin){const projected=p.group.position.clone().add(collar).project(this.camera),rect=this.canvas.getBoundingClientRect();this.canvas.dataset.gripX=(rect.left+(projected.x+1)*rect.width/2).toFixed(1);this.canvas.dataset.gripY=(rect.top+(1-projected.y)*rect.height/2).toFixed(1)}
  if(!this.carryRing){this.carryRing=new THREE.Mesh(new THREE.RingGeometry(.30,.38,32),new THREE.MeshBasicMaterial({color:0x258d7c,side:THREE.DoubleSide,depthTest:false}));this.carryRing.rotation.x=-Math.PI/2;this.carryRing.renderOrder=20;this.scene.add(this.carryRing)}this.carryRing.visible=true;this.carryRing.position.copy(c.target);this.carryRing.position.y=.29;this.carryRing.material.color.set(this.canvas.dataset.dropValid==='false'?0xc15e43:0x258d7c);
 }

 async load(){
  const response=await fetch('assets/patient-appearances.json?v=066');if(!response.ok)throw Error('Patient appearances could not load');const manifest=await response.json();
  if(manifest.appearances?.length!==11||new Set(manifest.appearances.map(a=>a.id)).size!==11||manifest.appearances.some(a=>!/^patient-\d{2}-lod\.glb$/.test(a.lod)||!/^patient-\d{2}\.glb$/.test(a.high)))throw Error('Invalid patient appearance manifest');
  this.patientAppearances=manifest.appearances;this.lowPatients=new Map();this.highPatients=new Map();
  const loader=new GLTFLoader(),names=['scan','care','consult','rest','clinician','coat','drape','doors'],jobs=[...names.map(name=>({name,file:['clinician','coat'].includes(name)?name+'-lod.glb':name+'.glb'})),...this.patientAppearances.map(appearance=>({appearance,file:appearance.lod}))];let done=0;
  for(let i=0;i<jobs.length;i+=4)await Promise.all(jobs.slice(i,i+4).map(async job=>{let gltf;for(let attempt=0;attempt<2;attempt++){try{gltf=await loader.loadAsync(`assets/${job.file}?v=066`);break}catch(error){if(attempt)throw error;await new Promise(resolve=>setTimeout(resolve,200))}}if(job.appearance)this.lowPatients.set(job.appearance.id,gltf);else this.assets[job.name]=gltf;this.progress(Math.round(++done/jobs.length*100))}));
  this.assets.patient=this.lowPatients.get(this.patientAppearances[0].id);this.lowAssets={...this.assets};this.canvas.dataset.appearances=this.patientAppearances.length;this.syncRooms();
 }

 soften(root){root.traverse(o=>{if(o.isMesh){o.castShadow=!o.isSkinnedMesh;o.receiveShadow=true;o.frustumCulled=!o.isSkinnedMesh}})}
 syncRooms(){
  const s=this.state();this.syncGates();for(const [id,g] of this.roomObjects){if(!s.rooms.some(r=>r.id===id)){this.scene.remove(g);this.roomObjects.delete(id)}}
  for(const r of s.rooms){if(this.roomObjects.has(r.id)){const g=this.roomObjects.get(r.id);g.position.copy(center(r));this.decorateRoom(g,r);continue}const group=new THREE.Group();group.position.copy(center(r));group.userData.roomId=r.id;this.scene.add(group);this.roomObjects.set(r.id,group);
   const equipment=this.assets[TYPES[r.type].asset].scene.clone(true);group.add(equipment);this.soften(equipment);
   if(r.type==='care'){const drape=this.assets.drape.scene.clone(true);drape.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=0;o.material.depthWrite=false;o.castShadow=false}});drape.visible=false;group.add(drape);group.userData.occupiedDrape=drape}
   const base=new THREE.Mesh(beveledBox(3.55,roomHeight(r.type)+.15,3.55,.045),blue);base.position.y=-(roomHeight(r.type)+.15)/2;base.castShadow=true;base.receiveShadow=true;group.add(base);
   const floor=new THREE.Mesh(beveledBox(3.56,.055,3.56,.012),pale);floor.position.y=-.022;floor.receiveShadow=true;group.add(floor);
   const seam=new THREE.Mesh(new THREE.BoxGeometry(3.56,.025,3.56),ivory);seam.position.y=-.09;group.add(seam);
   this.contact(group,4.5,4.5).position.y=-roomHeight(r.type)-.14;
   for(const [x,z,w,d] of r.type==='scan'?[[-.55,.5,2.2,1.6],[-.55,-.6,1.1,2]]:r.type==='care'?[[0,0,1.2,2.5],[1,-1,.8,.7]]:r.type==='consult'?[[.7,-1.1,2.1,.9],[-.61,.4,1,.8]]:[[0,-.4,2.6,1.3]]){const c=this.contact(group,w,d);c.position.x=x;c.position.z=z}
   const threshold=new THREE.Mesh(new THREE.BoxGeometry(.9,.035,.15),new THREE.MeshStandardMaterial({color:0x1d718c,roughness:.6}));threshold.position.set(-.825,.025,1.68);group.add(threshold);
   const ramp=new THREE.Mesh(new THREE.BoxGeometry(.92,.06,1.05),pale);const rise=roomHeight(r.type)-.25;ramp.rotation.x=Math.atan2(rise,1.05);ramp.position.set(-.825,-rise/2,2.12);ramp.receiveShadow=true;group.add(ramp);
   const badge=new THREE.Mesh(new THREE.BoxGeometry(.12,.04,.12),new THREE.MeshStandardMaterial({color:0x178c85,emissive:0x125347,emissiveIntensity:.4}));badge.position.set(1.57,.04,1.56);group.add(badge);group.userData.badge=badge;
   const upgrade=new THREE.Mesh(new THREE.BoxGeometry(.45,.10,.15),new THREE.MeshStandardMaterial({color:0xdab887,metalness:.5,roughness:.35}));upgrade.position.set(1.15,.04,1.53);group.add(upgrade);group.userData.upgrade=upgrade;
  }
  this.pickables=[...this.roomObjects.values(),...this.people.values()].map(p=>p.group||p);
  const signature=s.rooms.map(r=>`${r.id}:${r.type}:${r.x}:${r.y}`).join(',')+JSON.stringify([entrance(s),exit(s)]);if(this.layoutSignature!==signature){this.layoutSignature=signature;this.updateWalkways();this.fit();this.renderer.shadowMap.needsUpdate=true}
 }
 decorateRoom(group,r){
  const signature=r.decor.join(',');if(group.userData.decor===signature)return;
  if(group.userData.decoration)group.remove(group.userData.decoration);const g=new THREE.Group();group.add(g);group.userData.decoration=g;group.userData.decor=signature;
  if(r.decor.includes('plant')){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.14,.10,.23,12),ivory);pot.position.set(1.44,.115,-1.45);g.add(pot);for(let i=0;i<5;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshStandardMaterial({color:0x418c80,roughness:.9}));leaf.scale.set(.5,2,1);leaf.position.set(1.44+Math.cos(i*1.3)*.11,.35+(i%2)*.12,-1.45+Math.sin(i*1.3)*.11);g.add(leaf)}}
  if(r.decor.includes('art')){const print=new THREE.Mesh(new THREE.BoxGeometry(.50,.55,.035),blue);print.position.set(-1.45,.33,-1.50);g.add(print);const dot=new THREE.Mesh(new THREE.CircleGeometry(.14,16),ivory);dot.position.set(-1.45,.35,-1.48);g.add(dot)}
  if(r.decor.includes('palette')){const stripe=new THREE.Mesh(new THREE.BoxGeometry(3.4,.03,.08),new THREE.MeshStandardMaterial({color:0x41988e,roughness:.8}));stripe.position.set(0,.035,1.5);g.add(stripe)}
  this.soften(g);this.renderer.shadowMap.needsUpdate=true;
 }
 makePerson(kind,id){
  const appearance=kind==='patient'?this.patientAppearances[id%this.patientAppearances.length]:null,gltf=appearance?(this.highMode?this.highPatients.get(appearance.id):null)||this.lowPatients.get(appearance.id):this.assets[kind],model=clone(gltf.scene),group=new THREE.Group();if(appearance)group.userData.appearanceId=appearance.id;group.add(model);this.soften(model);this.scene.add(group);
  const mixer=new THREE.AnimationMixer(model),actions=new Map(gltf.animations.map(c=>[c.name,mixer.clipAction(c)]));const person={group,model,mixer,actions,current:null,id,initialized:false};this.play(person,'Idle');
  model.updateWorldMatrix(true,true);person.gripHeight=model.getObjectByName('head')?.getWorldPosition(new THREE.Vector3()).y||1.43;person.restBones=[];model.traverse(b=>{if(b.isBone)person.restBones.push({bone:b,position:b.position.clone(),quaternion:b.quaternion.clone(),scale:b.scale.clone()})});person.shadow={visible:true};return person;
 }
 removePerson(p){this.scene.remove(p.group);p.mixer.stopAllAction();p.mixer.uncacheRoot(p.model);p.model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose()})}
 play(p,name){if(p.current===name)return;const next=p.actions.get(name)||p.actions.get('Idle')||[...p.actions.values()][0];if(!next)return;for(const a of p.actions.values())if(a.isRunning())a.fadeOut(.2);next.reset().setEffectiveTimeScale(1).fadeIn(.2).play();p.current=name}
 async detailLOD(){
  const high=!this.mobile&&this.camera.zoom>1.5&&this.state().patients.length+this.state().staff.length<14;if(high&&!this.highAssets&&!this.loadingHigh){this.loadingHigh=true;try{const loader=new GLTFLoader(),items=await Promise.all(['clinician','coat'].map(async name=>[name,await loader.loadAsync(`assets/${name}.glb?v=066`)]));const jobs=this.patientAppearances;for(let i=0;i<jobs.length;i+=4)await Promise.all(jobs.slice(i,i+4).map(async a=>this.highPatients.set(a.id,await loader.loadAsync(`assets/${a.high}?v=066`))));this.highAssets=Object.fromEntries(items)}catch(error){console.warn('Close detail unavailable',error)}finally{this.loadingHigh=false}}

  if(high&&!this.highAssets)return;if(this.highMode===high)return;this.highMode=high;for(const kind of ['clinician','coat'])this.assets[kind]=high?this.highAssets[kind]:this.lowAssets[kind];for(const p of [...this.people.values(),...this.staffPeople.values(),this.ambient].filter(Boolean))this.removePerson(p);this.people.clear();this.staffPeople.clear();this.ambient=null;
 }
 tile(e){const rect=this.canvas.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=new THREE.Vector3();if(!this.ray.ray.intersectPlane(this.floor,hit))return null;this.pointerWorld=hit.clone();const spacing=this.carry?.25:.5,x=Math.round((hit.x/GRID.step+4)/spacing)*spacing,y=Math.round((hit.z/GRID.step+3.5)/spacing)*spacing;return x>=0&&x<=GRID.w-1&&y>=0&&y<=GRID.h-1?{x,y}:null}
 pick(e){this.tile(e);if(!this.tool){const hits=this.ray.intersectObjects([...this.people.values(),...this.staffPeople.values()].map(p=>p.group).concat([...this.roomObjects.values()]),true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.patientId&&!o.userData.roomId&&!o.userData.staffId)o=o.parent;if(o){this.onPick(o.userData.patientId?{patient:o.userData.patientId}:o.userData.staffId?{staff:o.userData.staffId}:{room:o.userData.roomId});return}}}
  const t=this.tile(e);if(t)this.onPick(t);
 }
 preview(type,tile){this.tool=type;this.grid.visible=!!type;this.ghost.visible=!!type&&!!tile;if(!this.ghost.visible)return;const check=['entrance','exit'].includes(type)?gatePlacement(this.state(),type,tile.x,tile.y):placement(this.state(),type,tile.x,tile.y);this.ghost.position.copy(world(tile.x+(['entrance','exit'].includes(type)?0:.5),tile.y+(['entrance','exit'].includes(type)?0:.5),.31));const gate=['entrance','exit'].includes(type);this.ghost.children[0].visible=!gate;if(gate&&!this.gateGhost){this.gateGhost=this.assets.doors.scene.clone(true);this.gateGhost.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.42;o.material.depthWrite=false;o.castShadow=false}});this.ghost.add(this.gateGhost)}if(this.gateGhost){this.gateGhost.visible=gate;if(gate){const out=gateDirection(tile);this.gateGhost.rotation.y=Math.atan2(out.x,out.y);this.gateGhost.traverse(o=>{if(o.isMesh)o.material.color.set(check.ok?0x359c91:0xc15e43)})}}this.ghostMat.color.set(check.ok?0x258d7c:0xc15e43);this.onHoverResult=check}
 select(id,kind='room'){this.selected={id,kind}}
 zoom(factor){this.camera.zoom=THREE.MathUtils.clamp(this.camera.zoom*factor,.65,2.8);this.camera.updateProjectionMatrix()}
 home(){this.camera.zoom=1;this.fit();this.camera.updateProjectionMatrix();this.controls.update()}
 fit(){
  const rect=this.canvas.getBoundingClientRect(),aspect=rect.width/rect.height;
  this.controls.target.set(0,.65,0);this.camera.position.set(16,17,23);this.camera.lookAt(this.controls.target);this.camera.updateMatrixWorld();
  const boxes=[...this.roomObjects.values(),...this.gates.values()].map(g=>{const b=new THREE.Box3().setFromObject(g);b.max.y=Math.max(b.max.y,g.position.y+2);return b});
  for(let i=0;i<this.corridor.count;i++){const m=new THREE.Matrix4();this.corridor.getMatrixAt(i,m);boxes.push(new THREE.Box3(new THREE.Vector3(-.83,-.1,-.83),new THREE.Vector3(.83,.1,.83)).applyMatrix4(m))}
  if(!boxes.length)boxes.push(new THREE.Box3(new THREE.Vector3(-7,0,-7),new THREE.Vector3(7,3,7)));
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const box of boxes)for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const v=new THREE.Vector3(x,y,z).applyMatrix4(this.camera.matrixWorldInverse);minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y)}
  const width=Math.max((maxX-minX)*1.08,(maxY-minY)*aspect*1.08);this.camera.left=-width/2;this.camera.right=width/2;this.camera.top=width/aspect/2;this.camera.bottom=-width/aspect/2;
  const basisX=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,0),basisY=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,1);const offset=basisX.multiplyScalar((minX+maxX)/2).add(basisY.multiplyScalar((minY+maxY)/2));this.camera.position.add(offset);this.controls.target.add(offset);this.camera.updateProjectionMatrix();this.controls.update();
 }
 resize(){const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;this.renderer.setSize(r.width,r.height,false);this.fit()}
 frame(dt,simDt,alpha,paused,elapsedMs=dt*1000){
  if(!this.assets.patient)return;this.lastAlpha=alpha;const s=this.state();this.detailLOD();this.syncRooms();if(this.routeSecond!==s.seconds){this.routeSecond=s.seconds;this.updateWalkways()}const reduced=this.reduced.matches||this.forceReduced;this.canvas.dataset.reducedMotion=String(!!reduced);
  for(const [id,p] of this.people)if(!s.patients.some(q=>q.id===id)){this.removePerson(p);this.people.delete(id)}
  for(const p of s.patients){let visual=this.people.get(p.id);if(!visual){visual=this.makePerson('patient',p.id);visual.group.userData.patientId=p.id;this.people.set(p.id,visual)}
   let target=world(p.x,p.y),rot=visual.model.rotation.y,lying=false,clip='Idle';
   visual.group.visible=!p.outside;
   let walkRate=1;const moving=['walking','queue-walking','exiting'].includes(p.state)&&p.moved&&p.previous;
   if(moving&&!reduced){const pose=sampleRoute(p.motion||[p.previous,p],alpha);target=world(pose.x,pose.y);rot=Math.atan2(pose.dx,pose.dy);walkRate=pose.rate;clip='Walk'}
   const bed=['scan','care'].includes(p.stage)&&['service','transfer-in','transfer-out','uncovering'].includes(p.state);
   visual.model.quaternion.identity();
   if(['entering-hospital','leaving-hospital'].includes(p.state)){const entering=p.state==='entering-hospital',gate=entering?entrance(s):exit(s),out=gateDirection(gate),u=Math.min(1,(p.progress+alpha)/2),distance=1.45*(entering?1-u:u);target=world(gate.x,gate.y).add(new THREE.Vector3(out.x*distance,0,out.y*distance));rot=Math.atan2(out.x,out.y)+(entering?Math.PI:0);clip='Walk';walkRate=1.45/(2*GRID.step)}else if(bed){
    const r=s.rooms.find(r=>r.id===p.room),c=center(r),bedCenter=new THREE.Vector3(r.type==='scan'?-.55:0,r.type==='scan'?.94:.88,r.type==='scan'?.57:0),turn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2),offset=new THREE.Vector3(-.45,.74,-.55).applyQuaternion(turn),anchor=c.clone().add(bedCenter).sub(offset);
    lying=true;target=anchor;visual.model.quaternion.copy(turn);
    if(['service','uncovering'].includes(p.state)){target.add(new THREE.Vector3(-1.33,.84,-.55).applyQuaternion(turn));visual.model.quaternion.multiply(new THREE.Quaternion(-.5,-.5,-.5,.5));clip='Rest'}
    else{clip=p.state==='transfer-in'?'TransferIn':'TransferOut';const progress=Math.min(3,p.progress+alpha);target.y-=anchor.y-c.y;target.y+=(anchor.y-c.y)*(p.state==='transfer-in'?progress/3:1-progress/3);this.play(visual,clip);const action=visual.actions.get(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;samplePose(visual,clip,progress)}
   }else if(['entering-room','leaving-room'].includes(p.state)){const r=s.rooms.find(r=>r.id===p.room),leaving=p.state==='leaving-room',progress=Math.min(3,p.progress+alpha)/3,pose=sampleInterior(interiorPath(r.type,roomHeight(r.type)),leaving?1-progress:progress);target=center(r).add(new THREE.Vector3(...pose.position));rot=Math.atan2(pose.dx*(leaving?-1:1),pose.dz*(leaving?-1:1));clip='Walk';walkRate=pose.rate;
   }else if(p.state==='service'){const r=s.rooms.find(r=>r.id===p.room);target=center(r).add(new THREE.Vector3(.77,.03,.48));clip='Sit';rot=Math.PI}
   else if(p.state==='handoff'){clip='Discuss'}
   visual.group.position.copy(target);visual.initialized=true;
   if(!bed){const previous=visual.heading??rot;visual.heading=previous+Math.atan2(Math.sin(rot-previous),Math.cos(rot-previous))*(paused?0:Math.min(1,dt*speedForTurn(paused,simDt,dt)));visual.model.rotation.y=visual.heading;visual.model.rotation.x=0}
   visual.shadow.visible=!lying&&!p.outside;this.play(visual,clip);
   if(!paused&&!reduced&&!clip.startsWith('Transfer')){visual.mixer.update(simDt*(clip==='Walk'?walkRate:1))}
  }
  this.canvas.dataset.activeAppearances=[...new Set([...this.people.values()].map(p=>p.group.userData.appearanceId))].join(',');
  const desired=new Set();for(const r of s.rooms){const g=this.roomObjects.get(r.id),busy=s.patients.some(p=>p.room===r.id&&p.state==='service');g.userData.badge.material.emissiveIntensity=busy?1.3:.15;g.userData.upgrade.visible=r.level>1;g.userData.upgrade.scale.x=r.level-1;const drape=g.userData.occupiedDrape;if(drape){const visit=s.patients.find(p=>p.room===r.id),pose=drapePose(visit?.state,visit?visit.progress+alpha:0);drape.visible=pose.visible;drape.scale.set(1,pose.scaleY,pose.scaleZ);drape.position.set(0,.88*(1-pose.scaleY),.96*(1-pose.scaleZ));drape.traverse(o=>{if(o.isMesh)o.material.opacity=pose.opacity})}

   r.staff.forEach((id,i)=>{desired.add(id);let p=this.staffPeople.get(id);if(!p){p=this.makePerson(r.type==='consult'&&i===0?'coat':'clinician',id);this.staffPeople.set(id,p);p.group.userData.staffId=id}const st=s.staff.find(a=>a.id===id),visit=s.patients.find(p=>p.room===r.id),post=staffPost(r.type,i);let local=post.position,clip=busy?(r.type==='scan'?'Work':r.type==='care'?'Attend':'Discuss'):'Idle',ry=post.heading,walkRate=1;
    if(r.type==='care'&&i===1&&visit){const t=visit.progress+alpha,ease=t=>Math.max(0,Math.min(1,t)),clear=visit.state==='entering-room'?ease(t):visit.state==='transfer-in'?1:visit.state==='service'?1-ease(t):visit.state==='uncovering'?ease(t):visit.state==='transfer-out'?1:visit.state==='leaving-room'?1-ease(t-2):0,away=staffPost('care',1,true).position;
     local=post.position.map((v,j)=>v+(away[j]-v)*clear);if((visit.state==='entering-room'||visit.state==='uncovering'||visit.state==='service')&&t<1||visit.state==='leaving-room'&&t>2&&t<3){const returning=['service','leaving-room'].includes(visit.state);clip='Walk';ry=Math.atan2((away[0]-post.position[0])*(returning?-1:1),(away[2]-post.position[2])*(returning?-1:1));walkRate=Math.hypot(away[0]-post.position[0],away[2]-post.position[2])/GRID.step}
    }
    p.group.position.copy(center(r)).add(new THREE.Vector3(...local));
    if(st.breakTrip){const trip=st.breakTrip,lounge=s.rooms.find(q=>q.id===trip.lounge),homeTransition=['home-exit','home-enter'].includes(trip.phase),loungeTransition=['lounge-enter','lounge-exit'].includes(trip.phase);
     if(homeTransition||loungeTransition&&lounge){const room=homeTransition?r:lounge,leaving=['home-exit','lounge-exit'].includes(trip.phase),progress=Math.min(3,(trip.progress||0)+alpha)/3,pose=sampleInterior(staffInteriorPath(room.type,roomHeight(room.type),homeTransition?i:id,!homeTransition),leaving?1-progress:progress);p.group.position.copy(center(room)).add(new THREE.Vector3(...pose.position));clip='Walk';ry=Math.atan2(pose.dx*(leaving?-1:1),pose.dz*(leaving?-1:1));walkRate=pose.rate}
     else{const pose=sampleRoute(trip.motion?.length>1?trip.motion:[trip.position,trip.position],alpha);p.group.position.copy(world(pose.x,pose.y));clip=trip.moved?'Walk':'Idle';walkRate=pose.rate;if(trip.moved)ry=Math.atan2(pose.dx,pose.dy);else if(trip.phase==='resting'&&lounge){p.group.position.copy(center(lounge)).add(new THREE.Vector3((id%2?-.45:.45),.05,-.35));clip='Sit';ry=Math.PI}}
    }
    const heading=p.heading??ry;p.heading=heading+Math.atan2(Math.sin(ry-heading),Math.cos(ry-heading))*(paused?0:Math.min(1,dt*speedForTurn(paused,simDt,dt)));p.model.rotation.y=p.heading;this.play(p,clip);if(!paused&&!reduced)p.mixer.update(simDt*(clip==='Walk'?walkRate:1));
   });
  }
  for(const st of s.staff.filter(st=>!desired.has(st.id))){desired.add(st.id);let p=this.staffPeople.get(st.id);if(!p){p=this.makePerson('clinician',st.id);this.staffPeople.set(st.id,p);p.group.userData.staffId=st.id}p.group.position.copy(st.position?world(st.position.x,st.position.y):world(4.6+(st.id%2)*.4,5.7));this.play(p,'Idle');if(!paused&&!reduced)p.mixer.update(simDt)}
  // The second planning clinician is an original ambient character, not extra modeled capacity.
  const planning=s.rooms.find(r=>r.type==='consult');if(planning&&!this.ambient){this.ambient=this.makePerson('clinician','planning')}
  if(planning&&this.ambient){this.ambient.group.position.copy(center(planning)).add(new THREE.Vector3(.04,0,.70));this.ambient.model.rotation.y=-Math.PI/2;this.play(this.ambient,'Discuss');if(!paused&&!reduced)this.ambient.mixer.update(simDt)}
  for(const [id,p] of this.staffPeople)if(!desired.has(id)){this.removePerson(p);this.staffPeople.delete(id)}
  this.updateCarry(dt,reduced);
  const stamp=new THREE.Object3D();stamp.rotation.x=-Math.PI/2;let contactCount=0;for(const p of [...this.people.values(),...this.staffPeople.values(),this.ambient].filter(Boolean)){if(!p.shadow.visible)continue;stamp.position.copy(p.group.position);stamp.position.y+=.008;stamp.updateMatrix();this.characterContacts.setMatrixAt(contactCount++,stamp.matrix)}this.characterContacts.count=contactCount;this.characterContacts.instanceMatrix.needsUpdate=true;
  if(this.selected){const o=this.selected.kind==='patient'?this.people.get(this.selected.id)?.group:this.roomObjects.get(this.selected.id);this.selection.visible=!!o;if(o){const b=new THREE.Box3().setFromObject(o);b.min.y=Math.max(.27,b.min.y);this.selection.box.copy(b)}}else this.selection.visible=false;
  if(this.selected&&this.routeKey!==`${this.selected.kind}:${this.selected.id}:${s.seconds}:${this.layoutSignature}`){this.routeKey=`${this.selected.kind}:${this.selected.id}:${s.seconds}:${this.layoutSignature}`;const p=this.selected.kind==='patient'?s.patients.find(p=>p.id===this.selected.id):null,r=s.rooms.find(r=>r.id===this.selected.id),points=p?[{x:p.x,y:p.y},...p.route]:r?[entrance(s),...(path(entrance(s),door(r),s.rooms)||[])]:[];this.routeLine.geometry.dispose();this.routeLine.geometry=new THREE.BufferGeometry().setFromPoints(points.map(q=>world(q.x,q.y,.29)));this.routeLine.visible=points.length>1}else if(!this.selected){this.routeLine.visible=false;this.routeKey=null}
  const delta=this.controls.target.clone();this.controls.target.x=THREE.MathUtils.clamp(this.controls.target.x,-3,3);this.controls.target.z=THREE.MathUtils.clamp(this.controls.target.z,-3,3);this.controls.target.y=THREE.MathUtils.clamp(this.controls.target.y,-.5,1.5);this.camera.position.add(this.controls.target.clone().sub(delta));this.controls.update();this.renderer.render(this.scene,this.camera);
  this.metrics.frames++;if(this.metrics.frameMs.length<1800&&elapsedMs<250)this.metrics.frameMs.push(elapsedMs);this.metrics.triangles=this.renderer.info.render.triangles;this.metrics.drawCalls=this.renderer.info.render.calls;this.metrics.peakTriangles=Math.max(this.metrics.peakTriangles,this.metrics.triangles);this.metrics.peakDrawCalls=Math.max(this.metrics.peakDrawCalls,this.metrics.drawCalls);this.canvas.dataset.peakTriangles=this.metrics.peakTriangles;this.canvas.dataset.peakDrawCalls=this.metrics.peakDrawCalls;this.canvas.dataset.triangles=this.metrics.triangles;this.canvas.dataset.drawCalls=this.metrics.drawCalls;
  if(this.metrics.frames%30===0){const a=[...this.metrics.frameMs].sort((a,b)=>a-b);this.canvas.dataset.frameMs=(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2);this.canvas.dataset.p95Ms=a[Math.ceil(a.length*.95)-1]?.toFixed(2);this.canvas.dataset.samples=a.length;
   let main=0;this.scene.traverseVisible(o=>{if(o.isMesh)main+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1)});this.canvas.dataset.mainTriangles=main;this.canvas.dataset.peakMainTriangles=Math.max(Number(this.canvas.dataset.peakMainTriangles||0),main);
  }
 }
}
