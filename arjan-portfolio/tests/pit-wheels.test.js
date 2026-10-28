import {describe,it,expect} from 'vitest';
import {Group,Vector3} from '../public/pit-stop-lab/vendor/three.module.js';
import {setWheelRotation,alignmentTilt} from '../public/pit-stop-lab/hero-car.js';
describe('wheel axle orientation',()=>{
 it('keeps both axle normals aligned with the car through every turn and roll phase',()=>{
  const w=new Group();
  for(const side of [-1,1])for(const heading of [-.6,-.3,0,.3,.6])for(let spin=-20;spin<20;spin+=.37){
   setWheelRotation(w,heading,spin,side);const axle=new Vector3(1,0,0).applyQuaternion(w.quaternion),expected=new Vector3(side*Math.cos(heading),0,-side*Math.sin(heading));
   expect(axle.distanceTo(expected)).toBeLessThan(1e-12);
  }
 });
 it('rolls in the same physical direction on both sides and preserves the hub pivot',()=>{
  const left=new Group(),right=new Group();left.position.set(.8,.355,-1.65);right.position.set(-.8,.355,-1.65);
  for(const spin of [0,.2,1,3,8]){
   setWheelRotation(left,.4,spin,1);setWheelRotation(right,.4,spin,-1);
   const a=new Vector3(0,-.355,0).applyQuaternion(left.quaternion),b=new Vector3(0,-.355,0).applyQuaternion(right.quaternion);
   expect(a.distanceTo(b)).toBeLessThan(1e-12);expect(left.position.toArray()).toEqual([.8,.355,-1.65]);
  }
 });
 it('corrects alignment once and returns to zero tilt when seated',()=>{
  expect(alignmentTilt({correction:0,alignment:.5})).toBe(0);
  for(let alignment=0;alignment<=1;alignment+=.01)expect(alignmentTilt({correction:.65,alignment})).toBeGreaterThanOrEqual(-1e-12);
  expect(alignmentTilt({correction:.65,alignment:1})).toBeCloseTo(0,12);
 });
});
