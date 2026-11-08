import {Vec3,compose,transformPoint} from '../rendering/Math3D.js';
import type {RenderItem,SkinGeometry} from '../rendering/Renderer.js';

const landmarks=new WeakMap<SkinGeometry,{L:number;R:number}>();
/** Follow the rendered shirt, rather than a point offset from the partner's root. */
export function hugBackContacts(items:RenderItem[]):{L:Vec3;R:Vec3}|undefined{
 const mesh=items.find(m=>'skin' in m&&m.material==='performanceKnit'&&!m.skirt);
 if(!mesh||!('skin' in mesh))return;
 const g=mesh.skin;
 let indices=landmarks.get(g);
 if(!indices){
  indices={L:-1,R:-1};
  for(const side of ['L','R'] as const){
   const native=!!mesh.rig,x=(side==='L'?-1:1)*(native?.21:.23),y=(mesh.rig?.bind[`upperArm${side}`].y??1.34)-(side==='L'?(native?.16:.13):(native?.34:.28));let best=Infinity;
   for(let v=0;v<g.positions.length/3;v++){
    if(g.positions[v*3+2]>-.02||g.normals[v*3+2]>-.2)continue;
    const score=(g.positions[v*3]-x)**2+(g.positions[v*3+1]-y)**2;
    if(score<best){best=score;indices[side]=v;}
   }
  }
  if(indices.L<0||indices.R<0)return;
  landmarks.set(g,indices);
 }
 const world=compose(mesh.position,mesh.rotation??new Vec3(),mesh.scale??new Vec3(1,1,1)),points={} as {L:Vec3;R:Vec3};
 for(const side of ['L','R'] as const){
  const v=indices[side],source=new Vec3(...g.positions.subarray(v*3,v*3+3)),point=new Vec3();
  for(let j=0;j<4;j++){const w=g.boneWeights[v*4+j];if(w){const p=transformPoint(mesh.boneMatrices.subarray(g.boneIndices[v*4+j]*16,g.boneIndices[v*4+j]*16+16),source);point.add(new Vec3(p.x,p.y,p.z).scale(w));}}
  const p=transformPoint(world,point);points[side]=new Vec3(p.x,p.y,p.z);
 }
 return points;
}
