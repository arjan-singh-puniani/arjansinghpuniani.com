import {describe,it,expect} from 'vitest';
import {crewPosture,jointBetween,stationHeading,stationCrewPose,outgoingWheelPose,jackCrewPose,planFootContacts,feetAt} from '../public/pit-stop-lab/crew.js';
import {simulate,snapshot,cornerSnapshot,progress} from '../public/pit-stop-lab/simulation.js';
import {pitLaneFrame} from '../public/pit-stop-lab/pit-lane-layout.js';
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
  for(const scenario of ['coordinated','gun','unsecured','position']){const stop=simulate({scenario}).stops[0];
  for(const corner of ['FL','FR','RL','RR'])for(let role=0;role<3;role++){
   const heading=stationHeading(corner,role),at=t=>stationCrewPose(stop,corner,role,t,corner.startsWith('F')?.8:.7625);
   const start=stop.stopAt-.7,end=stop.corners[corner].events.at(-1).end+.9,plan=planFootContacts(at,start,end,heading);let previous=null;
   for(let t=start;t<end;t+=1/120){
    const motion=at(t),contacts=feetAt(plan,t);if(previous)contacts.forEach((f,i)=>{if(f.planted&&previous[i].planted)expect(f.position).toEqual(previous[i].position);});previous=contacts;
    const feet=contacts.map(({position:f})=>{const x=f[0]-motion.root[0],z=f[2]-motion.root[2];return [x*Math.cos(heading)-z*Math.sin(heading),f[1],x*Math.sin(heading)+z*Math.cos(heading)];});
    const p=crewPosture({...motion,feet});
    if(motion.kneel<.05)expect(p.pelvis[1]).toBeGreaterThan(.86);
    for(const l of p.legs){expect(distance(l.hip,l.knee)).toBeCloseTo(.43,7);expect(distance(l.knee,l.ankle)).toBeCloseTo(.43,7);expect(l.foot[1]).toBeGreaterThanOrEqual(.06);expect(l.knee[1]).toBeGreaterThan(.065);}
   }
  }
 }
 });
 it('keeps handlers in their own bay while the car is still approaching',()=>{
  const stop=simulate().stops[0];for(let role=0;role<3;role++)for(let t=0;t<stop.stopAt;t+=.02){const {root}=stationCrewPose(stop,'FL',role,t,.8);expect(Math.abs(root[0])).toBeLessThan(2.7);expect(Math.abs(root[2]+1.65)).toBeLessThan(1.65);}
 });
 it('stages the crew before arrival and lets them stand before retreating',()=>{
  const stop=simulate().stops[0];for(const corner of ['FL','FR','RL','RR'])for(let role=0;role<3;role++){
   expect(stationCrewPose(stop,corner,role,0,.8).kneel).toBeGreaterThan(.8);
   const clear=stop.corners[corner].events.find(e=>e.state==='TOOL_CLEAR').start;
   expect(stationCrewPose(stop,corner,role,clear+.39,.8).kneel).toBe(0);
  }
 });
 it('lands each foot without a vertical snap or toe penetrating the floor',()=>{
  const at=t=>({root:[t*.6,0,0],kneel:0}),plan=planFootContacts(at,0,2,0);
  for(const step of plan.steps){for(const t of [step.start,step.end]){const a=feetAt(plan,t)[step.foot],b=feetAt(plan,t+(t===step.start?1e-5:-1e-5))[step.foot];expect(Math.abs(a.position[1]-b.position[1])/1e-5).toBeLessThan(.001);expect(a.pitch).toBeCloseTo(0,8);}
   for(let t=step.start;t<step.end;t+=.001){const f=feetAt(plan,t)[step.foot],vertical=Math.hypot(.06*Math.cos(f.pitch),.14*Math.sin(f.pitch));expect(f.position[1]-vertical).toBeGreaterThanOrEqual(-1e-8);}
  }
 });
 it('shifts weight toward the planted foot without moving its contact',()=>{const feet=[[-.105,.06,-.055],[.105,.135,-.055]],p=crewPosture({feet});expect(p.pelvis[0]).toBeLessThan(0);expect(p.pelvis[0]).toBeGreaterThan(-.04);expect(p.legs[0].foot).toEqual(feet[0]);for(const l of p.legs){expect(distance(l.hip,l.knee)).toBeCloseTo(.43,8);expect(distance(l.knee,l.ankle)).toBeCloseTo(.43,8);}});
 it('solves a reachable arm with fixed upper and lower lengths',()=>{
  const a=[.2,1.2,0],b=[.1,.7,-.25],j=jointBetween(a,b,.31,.30,[1,0,.2]);
  expect(distance(a,j)).toBeCloseTo(.31,8);expect(distance(j,b)).toBeCloseTo(.30,8);
 });
});


describe('Equipment stays with its handler',()=>{
 it('clears the hub axially before lifting the outgoing wheel, then holds it through retreat',()=>{
  for(const scenario of ['coordinated','gun','unsecured']){const sim=simulate({scenario}),stop=sim.stops[0];
   for(const corner of ['FL','FR','RL','RR']){const track=corner.startsWith('F')?.8:.7625,side=corner.endsWith('L')?1:-1;let previous=null;
    for(let t=stop.stopAt;t<sim.duration;t+=1/120){const c=cornerSnapshot(stop.corners[corner],t),p=outgoingWheelPose(stop,corner,t,track,.43);
     if(previous)expect(distance(p,previous)).toBeLessThan(.12);previous=p;
     if(c.removal<=.35)expect(p[1]).toBe(.43);
     if(c.removal===1){const handler=stationCrewPose(stop,corner,1,t,track);expect(distance(p,[handler.root[0]-side*.58,.75,handler.root[2]+.34])).toBeLessThan(1e-10);}
    }
   }
  }
 });
 it('keeps both jack operators outside the moving car envelope on entry and departure',()=>{
  const sim=simulate(),stop=sim.stops[0];for(let t=0;t<sim.duration;t+=1/120){const car=snapshot(sim,t).cars[0],x=pitLaneFrame(car).x;for(let i=0;i<2;i++){const {root}=jackCrewPose(stop,i,t);expect(Math.abs(root[2]-car.position)>3.3||Math.abs(root[0]-x)>1.15).toBe(true);}}
 });
 it('keeps jack handles ahead of their operators and preserves planted contacts through lift/lower',()=>{
  for(const scenario of ['coordinated','unsecured']){const sim=simulate({scenario}),stop=sim.stops[0];
   for(let index=0;index<2;index++){const sign=index===0?-1:1,up=index===0?stop.front:stop.rear,down=index===0?stop.frontDown:stop.rearDown,at=t=>jackCrewPose(stop,index,t),heading=sign<0?Math.PI:0,plan=planFootContacts(at,0,sim.duration,heading);let previous=null;
    for(let t=0;t<sim.duration;t+=1/120){const p=at(t),engage=progress(t,up.start,up.end)*(1-(down?progress(t,down.start,down.end):0)),handle=sign*(3.35+(1-engage)*.7)-stop.error;
     expect((p.root[2]-handle)*sign).toBeGreaterThan(.2);expect((p.root[2]-handle)*sign).toBeLessThan(.55);
     const feet=feetAt(plan,t),local=feet.map(({position:f})=>{const x=f[0]-p.root[0],z=f[2]-p.root[2];return [x*Math.cos(heading)-z*Math.sin(heading),f[1],x*Math.sin(heading)+z*Math.cos(heading)];});for(const leg of crewPosture({...p,feet:local}).legs){expect(distance(leg.hip,leg.knee)).toBeCloseTo(.43,8);expect(distance(leg.knee,leg.ankle)).toBeCloseTo(.43,8);expect(leg.knee[1]).toBeGreaterThan(.065);}if(previous)feet.forEach((f,i)=>{if(f.planted&&previous[i].planted)expect(f.position).toEqual(previous[i].position);});expect(feet.some(f=>f.planted)).toBe(true);previous=feet;
    }
   }
  }
 });
});
