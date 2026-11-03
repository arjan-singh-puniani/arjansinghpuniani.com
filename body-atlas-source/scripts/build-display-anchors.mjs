// Derive representative display points from the shipped reference meshes, never device coordinates.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Box3,DoubleSide,Mesh,Raycaster,Triangle,Vector3} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
const dir=new URL('../public/anatomy/',import.meta.url),assets={};
const load=async name=>{const bytes=await readFile(new URL(name,dir));assets[name]=createHash('sha256').update(bytes).digest('hex');const scene=(await new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer,'')).scene;scene.updateMatrixWorld(true);scene.traverse(o=>{if(o instanceof Mesh)o.material.side=DoubleSide;});return scene;};
const body=await load('body.glb'),organs=await load('organs.glb'),nervous=await load('nervous.glb');
const bounds=new Box3().setFromObject(body),center=bounds.getCenter(new Vector3()),scale=6/bounds.getSize(new Vector3()).y;
const regions=JSON.parse(await readFile(new URL('organ-regions.json',dir),'utf8'));
const specs=Object.fromEntries(Object.entries(regions).map(([id,r])=>[id,[organs,[r.sourceNode]] ]));
Object.assign(specs,{
 'BODY:heart-valves':[organs,['VH_M_heart_valve']],
 'BODY:coronary':[organs,['VH_M_arteries_of_heart']],
 'BODY:cornea':[organs,['VH_M_cornea_L','VH_M_cornea_R']],
 'UBERON:0000955':[nervous,['Allen_brain']],
 'UBERON:0001897':[nervous,['Allen_thalamus_L','Allen_thalamus_R']],
 'UBERON:0001906':[nervous,['Allen_subthalamic_nucleus_L','Allen_subthalamic_nucleus_R']],
 'UBERON:0002240':[nervous,['VH_M_spinal_cord']],
});
const anchors={};
for(const [id,[scene,names]] of Object.entries(specs)){
 const roots=names.map(name=>{const node=scene.getObjectByName(name);assert.ok(node,'Missing source node '+name);return node;});
 const meshes=[];for(const root of roots)root.traverse(o=>{if(o instanceof Mesh&&!meshes.includes(o))meshes.push(o);});assert.ok(meshes.length);
 const box=new Box3();for(const root of roots)box.union(new Box3().setFromObject(root));
 const target=box.getCenter(new Vector3());
 let hit=new Raycaster(new Vector3(target.x,target.y,box.max.z+1),new Vector3(0,0,-1)).intersectObjects(meshes,false)[0];
 let point=hit?.point,mesh=hit?.object,faceIndex=hit?.faceIndex;
 if(!point){
  let best=Infinity;const tri=new Triangle(),candidate=new Vector3();
  for(const m of meshes){const p=m.geometry.getAttribute('position'),index=m.geometry.index;
   for(let i=0;i<(index?.count||p.count);i+=3){
    for(const [vertex,j] of [[tri.a,0],[tri.b,1],[tri.c,2]])vertex.fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(m.matrixWorld);
    tri.closestPointToPoint(target,candidate);const distance=candidate.distanceToSquared(target);
    if(distance<best){best=distance;point=candidate.clone();mesh=m;faceIndex=i/3;}
   }
  }
 }
 assert.ok(point&&mesh&&Number.isInteger(faceIndex));
 anchors[id]={position:point.clone().sub(center).multiplyScalar(scale).toArray().map(v=>Number(v.toFixed(9))),nodes:names,asset:scene===organs?'organs.glb':'nervous.glb',mesh:mesh.name,triangle:faceIndex,method:hit?'front surface intersection':'nearest surface to region bounds center',precision:'representative reference surface',laterality:'display representative; device laterality is not inferred'};
}
await writeFile(new URL('display-anchors.json',dir),JSON.stringify({frame:'HRA united male v1.5; original skin centered and uniformly scaled to height 6',assets,anchors},null,2)+'\n');
console.log('Generated',Object.keys(anchors).length,'reference-surface anchors; no device placement coordinates.');
