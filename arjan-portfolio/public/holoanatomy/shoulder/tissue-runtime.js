import * as THREE from 'three';
import { SurfaceTissue, weldSurface } from './deformation.js';
import { MUSCLE_DEFINITIONS, supportRegions } from './anatomy.js';
export class TissueRuntime {
  constructor(scene,id) {
    this.scene=scene;this.id=id;
    const d=MUSCLE_DEFINITIONS[id];if(!d)throw Error('No source-backed surface support definition');
    this.meshes=[id,...d.coupled].flatMap(key=>scene.fragments.get(key)||[]);
    const positions=[],triangles=[];this.ranges=[];
    scene.scene.updateMatrixWorld(true);
    const v=new THREE.Vector3();
    for(const mesh of this.meshes) {
      const p=mesh.geometry.attributes.position,start=positions.length/3;
      this.ranges.push({mesh,start,count:p.count,inverse:mesh.matrixWorld.clone().invert()});
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);positions.push(v.x,v.y,v.z);}
      const indices=mesh.geometry.index?.array||Array.from({length:p.count},(_,i)=>i);
      for(const i of indices)triangles.push(start+i);
      p.setUsage(THREE.DynamicDrawUsage);
    }
    this.surface=weldSurface(positions,triangles);
    const insertion=[];
    for(const mesh of scene.fragments.get(d.insertionRegion)||[]) {
      const p=mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);insertion.push(v.x,v.y,v.z);}
    }
    const contacts=[],distances=new Float64Array(this.surface.rest.length/3);
    const bones=['ZA_scapula','ZA_humerus','ZA_clavicle'].flatMap(key=>scene.fragments.get(key)||[]);
    const target={};
    for(let i=0;i<this.surface.rest.length;i+=3) {
      v.fromArray(this.surface.rest,i);let closest=null;
      for(const bone of bones) {
        const local=v.clone().applyMatrix4(bone.matrixWorld.clone().invert());
        const hit=bone.geometry.boundsTree.closestPointToPoint(local,target);
        if(!hit)continue;
        const point=hit.point.clone().applyMatrix4(bone.matrixWorld),distance=v.distanceTo(point);
        if(bone.userData.structureId==='ZA_scapula')distances[i/3]=distance;
        if(!closest || distance<closest.distance)closest={point,distance};
      }
      if(closest && closest.distance<.25 && closest.distance>1e-6) {
        const normal=v.clone().sub(closest.point).normalize();
        contacts.push({index:i/3,point:closest.point.toArray(),normal:normal.toArray(),margin:Math.min(closest.distance,.002)});
      }
    }
    this.supports=supportRegions(this.surface.rest,insertion,distances);
    const complianceScale=new Float64Array(this.surface.rest.length/3).fill(1);
    for(const {mesh,start,count} of this.ranges)if(scene.parts.get(mesh.userData.structureId).tissue === 'TENDON') {
      for(let i=0;i<count;i++)complianceScale[this.surface.renderMap[start+i]]=.15;
    }
    this.solver=new SurfaceTissue({...this.surface,pins:this.supports.pins,axis:this.supports.axis,contacts,complianceScale});
    this.contacts=contacts.length;
    this.normals=new Float64Array(this.surface.rest.length);
  }
  update() {
    const v=new THREE.Vector3(),normal=new THREE.Vector3(),x=this.solver.x,n=this.normals;n.fill(0);
    for(let f=0;f<this.surface.faces.length;f+=3) {
      const a=this.surface.faces[f]*3,b=this.surface.faces[f+1]*3,c=this.surface.faces[f+2]*3;
      const abx=x[b]-x[a],aby=x[b+1]-x[a+1],abz=x[b+2]-x[a+2],acx=x[c]-x[a],acy=x[c+1]-x[a+1],acz=x[c+2]-x[a+2];
      const nx=aby*acz-abz*acy,ny=abz*acx-abx*acz,nz=abx*acy-aby*acx;
      for(const i of [a,b,c]){n[i]+=nx;n[i+1]+=ny;n[i+2]+=nz;}
    }
    for(const {mesh,start,count,inverse} of this.ranges) {
      const p=mesh.geometry.attributes.position, normals=mesh.geometry.attributes.normal, normalMatrix=new THREE.Matrix3().getNormalMatrix(inverse);
      for(let i=0;i<count;i++) {
        v.fromArray(this.solver.x,this.surface.renderMap[start+i]*3).applyMatrix4(inverse);
        p.setXYZ(i,v.x,v.y,v.z);
        normal.fromArray(n,this.surface.renderMap[start+i]*3).applyMatrix3(normalMatrix).normalize();normals.setXYZ(i,normal.x,normal.y,normal.z);
      }
      p.needsUpdate=true;normals.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
      mesh.geometry.boundsTree.refit();
    }
  }
  restore() {this.solver.restore();this.update();}
  diagnostics(){return {...this.solver.diagnostics(),supports:this.supports.report,contactGuards:this.contacts};}
}
