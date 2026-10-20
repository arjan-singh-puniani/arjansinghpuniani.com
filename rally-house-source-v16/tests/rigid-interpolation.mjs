import assert from 'node:assert/strict';
import {Vec3,identity,rotationX,rotationY,rotationZ,multiply,rigidFrame,interpolateRigidFrame,transformPoint} from '../dist/rendering/Math3D.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-5,`${a} differs from ${b}`);
const half=interpolateRigidFrame(identity(),rotationX(Math.PI),.5),point=transformPoint(half,new Vec3(0,1,0));near(point.y,0);near(point.z,1);
const wrapped=interpolateRigidFrame(rotationY(Math.PI-.02),rotationY(-Math.PI+.02),.5);near(wrapped[0],-1);near(wrapped[8],0);
let samples=0;
for(let i=0;i<64;i++){
 const a=multiply(rotationX(i*.19),rotationY(i*.37)),b=multiply(rotationZ(i*.23+Math.PI),rotationX(-i*.11));a[12]=2;b[12]=-4;
 for(const t of [0,.1,.25,.5,.75,.9,1]){const m=interpolateRigidFrame(a,b,t),axes=[new Vec3(m[0],m[1],m[2]),new Vec3(m[4],m[5],m[6]),new Vec3(m[8],m[9],m[10])];for(const v of axes)near(v.len(),1);near(Vec3.dot(axes[0],axes[1]),0);near(Vec3.dot(axes[1],axes[2]),0);near(Vec3.dot(Vec3.cross(axes[0],axes[1]),axes[2]),1);near(m[12],2-6*t);samples++;}
}
const parallel=rigidFrame(new Vec3(),new Vec3(1,0,0),new Vec3(1,0,0));for(const offset of [0,4,8])near(Math.hypot(...parallel.slice(offset,offset+3)),1);
console.log(JSON.stringify({rigidInterpolationSamples:samples,halfTurn:true,shortestArc:true,parallelHint:true}));
