import {describe,it,expect} from 'vitest';
import {crewPosture,jointBetween,stationCrewPose,planFootContacts,feetAt} from '../public/pit-stop-lab/crew.js';
import {simulate} from '../public/pit-stop-lab/simulation.js';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
describe('pit crew posture',()=>{
 it('rests upright with feet under the hips instead of a permanent wide squat',()=>{
  const p=crewPosture();expect(p.pelvis[1]).toBe(.9);
  for(const l of p.legs){expect(Math.abs(l.ankle[0])).toBe(.105);expect(Math.abs(l.knee[0])).toBe(.105);expect(l.foot[1]).toBe(.06);}
 });
 it('uses one grounded knee and a planted leading foot for stationary service',()=>{
  const p=crewPosture({kneel:1});expect(p.legs[0].knee[1]).toBeLessThan(.12);expect(p.legs[1].knee[1]).toBeGreaterThan(.3);
  for(const l of p.legs){expect(distance(l.hip,l.knee)).toBeCloseTo(.43,8);expect(distance(l.knee,l.ankle)).toBeCloseTo(.43,8);expect(l.foot[1]).toBe(.06);}
 });
 it('locks actual world contacts through nonlinear motion, stops, reversal and backward seeking',()=>{
  const at=t=>({root:[t<1?t*t:1-(t-1)*.5,0,Math.sin(t)*.2],kneel:0});
  const plan=planFootContacts(at,0,2,Math.PI/2);let previous=null;
  for(let t=0;t<2;t+=1/120){const feet=feetAt(plan,t);if(previous)feet.forEach((f,i)=>{if(f.planted&&previous[i].planted)expect(f.position).toEqual(previous[i].position);});expect(feet.some(f=>f.planted)).toBe(true);previous=feet;}
  const later=feetAt(plan,1.3);feetAt(plan,.2);expect(feetAt(plan,1.3)).toEqual(later);expect(plan.steps.length).toBeGreaterThan(3);
 });
 it('matches real station paths, keeping support soles still and legs within reach at every corner',()=>{
  const stop=simulate().stops[0];
  for(const corner of ['FL','FR','RL','RR'])for(let role=0;role<3;role++){
   const heading=corner.endsWith('L')?Math.PI/2:-Math.PI/2,at=t=>stationCrewPose(stop,corner,role,t,corner.startsWith('F')?.8:.7625);
   const start=stop.stopAt-.7,end=stop.corners[corner].events.at(-1).end+.9,plan=planFootContacts(at,start,end,heading);let previous=null;
   for(let t=start;t<end;t+=1/120){
    const motion=at(t),contacts=feetAt(plan,t);if(previous)contacts.forEach((f,i)=>{if(f.planted&&previous[i].planted)expect(f.position).toEqual(previous[i].position);});previous=contacts;
    const feet=contacts.map(({position:f})=>{const x=f[0]-motion.root[0],z=f[2]-motion.root[2];return [x*Math.cos(heading)-z*Math.sin(heading),f[1],x*Math.sin(heading)+z*Math.cos(heading)];});
    const p=crewPosture({...motion,feet});
    if(motion.kneel<.05)expect(p.pelvis[1]).toBeGreaterThan(.86);
    for(const l of p.legs){expect(distance(l.hip,l.knee)).toBeCloseTo(.43,7);expect(distance(l.knee,l.ankle)).toBeCloseTo(.43,7);expect(l.foot[1]).toBeGreaterThanOrEqual(.06);}
   }
  }
 });
 it('keeps handlers in their own bay while the car is still approaching',()=>{
  const stop=simulate().stops[0];for(let role=0;role<3;role++)for(let t=0;t<stop.stopAt;t+=.02){const {root}=stationCrewPose(stop,'FL',role,t,.8);expect(Math.abs(root[0])).toBeLessThan(2.5);expect(Math.abs(root[2]+1.65)).toBeLessThan(1.3);}
 });
 it('solves a reachable arm with fixed upper and lower lengths',()=>{
  const a=[.2,1.2,0],b=[.1,.7,-.25],j=jointBetween(a,b,.31,.30,[1,0,.2]);
  expect(distance(a,j)).toBeCloseTo(.31,8);expect(distance(j,b)).toBeCloseTo(.30,8);
 });
});
