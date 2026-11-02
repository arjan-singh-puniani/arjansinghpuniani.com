import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Box3,Mesh,Triangle,Vector3} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import data from '../public/anatomy/display-anchors.json';
import {anchorDescription,humanRegionLocators,referenceRegionsForNode,referenceSurfaceAnchors} from '../lib/annotations';
import {anatomyFocus} from '../lib/device-action';

test('representative anchors lie on the identified source triangles in the same body frame',async()=>{
 const scenes=new Map();
 for(const [asset,sha] of Object.entries(data.assets)){
  const bytes=readFileSync('public/anatomy/'+asset);assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
  const scene=(await new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer,'')).scene;scene.updateMatrixWorld(true);scenes.set(asset,scene);
 }
 const bounds=new Box3().setFromObject(scenes.get('body.glb')),center=bounds.getCenter(new Vector3()),scale=6/bounds.getSize(new Vector3()).y;
 assert.equal(Object.keys(data.anchors).length,23);
 for(const [id,a] of Object.entries(data.anchors)){
  assert.equal(a.position.length,3);assert.ok(a.position.every(Number.isFinite));assert.deepEqual(humanRegionLocators[id],a.position);
  const mesh=scenes.get(a.asset).getObjectByName(a.mesh);assert.ok(mesh instanceof Mesh);
  const ancestry:string[]=[];for(let node:Mesh['parent']=mesh;node;node=node.parent)ancestry.push(node.name);
  assert.ok(a.nodes.some(n=>ancestry.includes(n)),id+' source hierarchy');
  const positions=mesh.geometry.getAttribute('position'),indices=mesh.geometry.index,tri=new Triangle();
  for(const [v,j] of [[tri.a,0],[tri.b,1],[tri.c,2]] as const)v.fromBufferAttribute(positions,indices?indices.getX(a.triangle*3+j):a.triangle*3+j).applyMatrix4(mesh.matrixWorld);
  const source=new Vector3(...a.position).divideScalar(scale).add(center);
  assert.ok(tri.closestPointToPoint(source,new Vector3()).distanceTo(source)<1e-7,id+' must meet its mesh, not an arbitrary offset');
  assert.match(a.laterality,/device laterality is not inferred/);
 }
});

test('specific reference parts stay distinct; missing geometry remains approximate and evidence is not upgraded',()=>{
 for(const id of ['UBERON:0001897','UBERON:0001906','BODY:heart-valves','BODY:cornea']){
  assert.notDeepEqual(humanRegionLocators[id],humanRegionLocators[id.startsWith('UBERON')?'UBERON:0000955':id==='BODY:cornea'?'BODY:eye':'BODY:heart']);
  assert.equal(anchorDescription(id),'Representative reference surface');
 }
 assert.equal(anatomyFocus('activa')!.region,'UBERON:0001897');assert.equal(anatomyFocus('brio')!.region,'UBERON:0001906');
 assert.equal(anatomyFocus('source-fda-p140031')!.region,'BODY:heart-valves');
 assert.match(anchorDescription('UBERON:0001759'),/Approximate region/);assert.equal(referenceSurfaceAnchors['UBERON:0001759'],undefined);
 assert.equal(anatomyFocus('cochlear'),null);assert.equal(humanRegionLocators['BODY:uterus'],undefined);
 assert.deepEqual(referenceRegionsForNode({name:'VH_M_aortic_valve',parent:{name:'VH_M_heart_valve',parent:{name:'VH_M_heart',parent:null}}}),['BODY:heart-valves','BODY:heart']);
});
