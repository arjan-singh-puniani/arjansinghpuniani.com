import * as THREE from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {OBJLoader} from './vendor/loaders/OBJLoader.js';
import {TISSUES,CUFF_COLORS,tissueFor,SITS,visibility,PRESETS,clamp,zoomDistance} from './model.js';
export class ShoulderScene {
 constructor(canvas,state,onFrame){
  this.canvas=canvas;this.state=state;this.onFrame=onFrame;this.meshes=new Map();this.fragments=new Map();this.parts=new Map();this.frameTimes=[];
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer:coarse)').matches?1.5:2));
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.localClippingEnabled=true;
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(32,1,.05,40);this.target=new THREE.Vector3(0,.12,0);this.yaw=-2.85;this.pitch=.17;this.distance=3.6;
  this.scene.add(new THREE.HemisphereLight(0xfff9ec,0x767882,2.0));
  const key=new THREE.DirectionalLight(0xfff5e6,3.1);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:16});key.shadow.bias=-.0008;key.shadow.normalBias=.006;this.scene.add(key);
  const fill=new THREE.DirectionalLight(0xdde5f3,1.8);fill.position.set(3,1,-4);this.scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffe6ca,.9);rim.position.set(-3,2,-3);this.scene.add(rim);
  this.ray=new THREE.Raycaster();this.crop=new THREE.Plane(new THREE.Vector3(0,1,0),.95);this.sectionPlane=new THREE.Plane(new THREE.Vector3(1,0,0),0);
  this.resizeObserver=new ResizeObserver(()=>{this.resize();this.invalidate();});this.resizeObserver.observe(canvas);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;window.dispatchEvent(new CustomEvent('shoulder-error',{detail:'Graphics context was released. Reload to restore the model.'}));});
  this.resize();
 }
 async load(){
  const start=performance.now();const response=await fetch('./assets/provenance.json');if(!response.ok)throw Error('Anatomy provenance is unavailable.');this.provenance=await response.json();
  for(const part of this.provenance.structures)this.parts.set(part.id,part);
  const params=new URLSearchParams(location.search);const requested=params.get('lod');this.lod=['0','1','2'].includes(requested)?Number(requested):0;
  let root;
  try{if(params.get('format')==='obj')throw Error('Requested OBJ compatibility path');const gltf=await new GLTFLoader().loadAsync(`./assets/shoulder-lod${this.lod}.glb`);root=gltf.scene;this.transport='glb';}
  catch(error){this.fallbackReason=error.message;root=new THREE.Group();const loader=new OBJLoader();
   await Promise.all(this.provenance.structures.map(async p=>{const obj=await loader.loadAsync(`../anatomy/${p.id}.obj`);obj.traverse(m=>{if(!m.isMesh)return;m.name=p.id;m.geometry.translate(130,45,-1275);m.geometry.scale(.01,.01,.01);m.geometry.rotateX(-Math.PI/2);});root.add(obj);}));this.transport='obj';}
  this.root=root;this.scene.add(root);root.updateMatrixWorld(true);
  root.traverse(mesh=>{if(!mesh.isMesh)return;let owner=mesh;while(owner&&!this.parts.has(owner.userData.structureId||owner.name))owner=owner.parent;const id=owner?.userData.structureId||owner?.name;const part=this.parts.get(id);if(!part)return;
   mesh.userData.structureId=id;const tissue=TISSUES[tissueFor(part)];
   const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];mesh.material=materials.map(original=>{
    const material=new THREE.MeshPhysicalMaterial({color:CUFF_COLORS[id]||tissue.baseColor,roughness:tissue.roughness,metalness:0,specularIntensity:tissue.specular});
    // glTF's loader owns color-space and UV-set handling. Preserve future texture channels.
    for(const key of ['map','normalMap','roughnessMap','aoMap','alphaMap'])if(original[key])material[key]=original[key];
    if(original.map)material.color.copy(original.color);material.normalScale.copy(original.normalScale||new THREE.Vector2(1,1));material.aoMapIntensity=original.aoMapIntensity??1;
    material.emissive.set(0);material.clippingPlanes=[];material.userData.baseColor=material.color.clone();return material;
   });if(mesh.material.length===1)mesh.material=mesh.material[0];
   mesh.castShadow=true;mesh.receiveShadow=true;mesh.geometry.computeBoundingBox();mesh.userData.home=mesh.position.clone();
   if(!this.meshes.has(id))this.meshes.set(id,mesh);if(!this.fragments.has(id))this.fragments.set(id,[]);this.fragments.get(id).push(mesh);
  });
  if(this.meshes.size!==20)throw Error(`Incomplete anatomy: ${this.meshes.size}/20 structures.`);
  this.loadMs=performance.now()-start;this.applyView(this.state.view,false);this.refresh();this.ready=true;this.invalidate();
 }
 allMeshes(){return [...this.fragments.values()].flat();}
 materials(mesh){return Array.isArray(mesh.material)?mesh.material:[mesh.material];}
 resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 applyView(id,animate=true){const p=PRESETS[id];this.state.view=id;this.transition=null;
  const distance=p.distance*(this.camera.aspect<1?1.24:1);
  if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)this.transition={start:performance.now(),from:{yaw:this.yaw,pitch:this.pitch,distance:this.distance,target:this.target.clone()},to:{yaw:p.yaw,pitch:p.pitch,distance,target:new THREE.Vector3(...p.target)}};
  else {this.yaw=p.yaw;this.pitch=p.pitch;this.distance=distance;this.target.fromArray(p.target);}
  this.camera.fov=p.fov;this.camera.updateProjectionMatrix();this.refresh();this.invalidate();
 }
 orient(yaw,pitch){this.transition=null;this.yaw=yaw;this.pitch=clamp(pitch,-1.48,1.48);this.invalidate();}
 orbit(dx,dy){this.transition=null;this.yaw-=dx*.006;this.pitch=clamp(this.pitch+dy*.006,-1.48,1.48);this.invalidate();}
 previewPull(id,dx,dy){const meshes=this.fragments.get(id);if(!meshes)return;const scale=2*this.distance*Math.tan(this.camera.fov*Math.PI/360)/this.canvas.clientHeight;const right=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,1);for(const mesh of meshes)mesh.position.copy(mesh.userData.home).addScaledVector(right,clamp(dx*scale,-1,1)).addScaledVector(up,clamp(-dy*scale,-.7,.7));this.invalidate();}
 pan(dx,dy){this.transition=null;const scale=2*this.distance*Math.tan(this.camera.fov*Math.PI/360)/this.canvas.clientHeight;const right=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,1);this.target.addScaledVector(right,-dx*scale).addScaledVector(up,dy*scale);this.invalidate();}
 zoom(delta,x,y){this.transition=null;const old=this.distance;this.distance=zoomDistance(old,delta);if(Number.isFinite(x)){const r=this.canvas.getBoundingClientRect();const nx=(x-r.left-r.width/2),ny=(y-r.top-r.height/2);this.pan(-nx*(1-this.distance/old),-ny*(1-this.distance/old));}this.invalidate();}
 focus(id){const mesh=this.meshes.get(id);if(!mesh)return;const box=new THREE.Box3();for(const part of this.fragments.get(id))box.union(new THREE.Box3().setFromObject(part));box.getCenter(this.target);this.distance=clamp(box.getSize(new THREE.Vector3()).length()*2.1,1.4,5);this.transition=null;this.invalidate();}
 refresh(){if(this.state.staged.length&&!this.stagingOriginal){this.stagingOriginal=this.distance;this.distance=Math.max(this.distance,5.8/Math.min(this.camera.aspect,1));this.transition=null;}else if(!this.state.staged.length&&this.stagingOriginal){this.distance=this.stagingOriginal;this.stagingOriginal=null;}for(const mesh of this.allMeshes()){const id=mesh.userData.structureId;const v=visibility(this.state,id);mesh.visible=v!=='hidden';for(const mat of this.materials(mesh)){
   mat.transparent=v==='ghost';mat.opacity=v==='ghost'?TISSUES[tissueFor(this.parts.get(id))].ghostAlpha:1;mat.depthWrite=v!=='ghost';
   mat.color.copy(mat.userData.baseColor);mat.emissive.setHex(id===this.state.selected?0x24140b:0);mat.emissiveIntensity=.22;
   mat.clippingPlanes=[...(id==='FJ3368'&&this.state.view!=='vascular'?[this.crop]:[]),...(this.state.section?[this.sectionPlane]:[])];mat.needsUpdate=true;
  }mesh.castShadow=v==='visible';
  mesh.position.copy(mesh.userData.home);
 }this.invalidate();}
 pick(x,y){const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),this.camera);
  return this.ray.intersectObjects(this.allMeshes().filter(m=>m.visible&&visibility(this.state,m.userData.structureId)==='visible'),false).find(hit=>this.materials(hit.object)[0].clippingPlanes.every(p=>p.distanceToPoint(hit.point)>=0))?.object.userData.structureId||null;
 }
 hover(id){if(this.hoverId===id)return;this.hoverId=id;if(this.outline){this.outline.parent.remove(this.outline);this.outline.material.dispose();this.outline=null;}const mesh=this.meshes.get(id);if(mesh&&this.state.mode!=='quiz'){
   const outline=new THREE.Mesh(mesh.geometry,new THREE.MeshBasicMaterial({color:0x805c3c,side:THREE.BackSide,transparent:true,opacity:.65,clippingPlanes:this.materials(mesh)[0].clippingPlanes}));outline.scale.setScalar(1.012);mesh.add(outline);this.outline=outline;
  }this.invalidate();
 }
 project(id){const mesh=this.meshes.get(id);if(!mesh?.visible)return null;const center=mesh.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);const v=center.clone().project(this.camera);return {id,x:(v.x*.5+.5)*this.canvas.clientWidth,y:(-.5*v.y+.5)*this.canvas.clientHeight,visible:v.z>-1&&v.z<1};}
 labelAnchor(id){const mesh=this.meshes.get(id);if(!mesh?.visible||visibility(this.state,id)!=='visible')return null;const r=this.canvas.getBoundingClientRect(),c=this.project(id);if(c?.visible&&this.pick(r.left+c.x,r.top+c.y)===id)return c;
  const positions=mesh.geometry.attributes.position;for(let i=0;i<positions.count;i+=Math.max(1,Math.floor(positions.count/12))){const v=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).project(this.camera);if(v.z< -1||v.z>1)continue;const x=(v.x*.5+.5)*r.width,y=(-v.y*.5+.5)*r.height;if(this.pick(r.left+x,r.top+y)===id)return{id,x,y,visible:true};}return null;
 }
 invalidate(){if(this.pending||this.lost)return;this.pending=true;requestAnimationFrame(t=>this.render(t));}
 render(time){this.pending=false;if(this.lost)return;
  if(this.transition){const {from,to,start}=this.transition;const f=clamp((time-start)/500,0,1),k=f*f*(3-2*f);const angle=((to.yaw-from.yaw+Math.PI*3)%(Math.PI*2))-Math.PI;this.yaw=from.yaw+angle*k;this.pitch=from.pitch+(to.pitch-from.pitch)*k;this.distance=from.distance+(to.distance-from.distance)*k;this.target.lerpVectors(from.target,to.target,k);if(f===1)this.transition=null;}
  this.camera.position.set(this.distance*Math.cos(this.pitch)*Math.sin(this.yaw),this.distance*Math.sin(this.pitch),this.distance*Math.cos(this.pitch)*Math.cos(this.yaw)).add(this.target);this.camera.lookAt(this.target);this.camera.updateMatrixWorld();
  if(this.state.staged.length){const right=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,1);const hh=this.distance*Math.tan(this.camera.fov*Math.PI/360),hw=hh*this.camera.aspect;
   this.state.staged.forEach((id,i)=>{const fragments=this.fragments.get(id);for(const mesh of fragments)mesh.position.copy(mesh.userData.home);this.scene.updateMatrixWorld(true);const box=new THREE.Box3();for(const mesh of fragments)box.union(new THREE.Box3().setFromObject(mesh));const center=box.getCenter(new THREE.Vector3());const desired=this.target.clone().addScaledVector(right,(i%2?1:-1)*hw*.58).addScaledVector(up,i<2?hh*.26:-hh*.38);const delta=desired.sub(center);for(const mesh of fragments){const inverse=mesh.parent.matrixWorld.clone().invert();const origin=new THREE.Vector3().applyMatrix4(inverse),local=delta.clone().applyMatrix4(inverse).sub(origin);mesh.position.add(local);}});
  }
  this.renderer.render(this.scene,this.camera);if(this.previousFrame&&time-this.previousFrame<150)this.frameTimes.push(time-this.previousFrame);this.previousFrame=time;if(this.frameTimes.length>600)this.frameTimes.shift();this.onFrame?.();if(this.transition||this.profileUntil>time)this.invalidate();
 }
 metrics(){const sorted=[...this.frameTimes].sort((a,b)=>a-b);return {transport:this.transport,lod:this.lod,loadMs:this.loadMs,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,vertices:this.allMeshes().filter(m=>m.visible).reduce((s,m)=>s+m.geometry.attributes.position.count,0),textures:this.renderer.info.memory.textures,textureBytes:this.allMeshes().flatMap(m=>this.materials(m)).flatMap(m=>['map','normalMap','roughnessMap','aoMap'].map(k=>m[k])).filter(Boolean).reduce((s,t)=>s+(t.image?.width||0)*(t.image?.height||0)*4*4/3,0),dpr:this.renderer.getPixelRatio(),samples:sorted.length,meanFrameMs:sorted.length?sorted.reduce((s,n)=>s+n,0)/sorted.length:null,p95FrameMs:sorted.length?sorted[Math.floor(sorted.length*.95)]:null};}
}
