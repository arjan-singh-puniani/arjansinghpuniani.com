import {describe,it,expect} from 'vitest';import fs from 'node:fs';
import {prepareTelemetry} from '../public/pit-stop-lab/pit-wall.js';
import {cinematicTrack,cinematicFrame,raceCamera,pitFilmShot,pitFilmStart,pitFilmDuration,advanceReel} from '../public/pit-stop-lab/cinema.js';
import {simulate,snapshot} from '../public/pit-stop-lab/simulation.js';
const drivers=prepareTelemetry(JSON.parse(fs.readFileSync('public/pit-stop-lab/data/telemetry-bahrain-2024.json'))),track=cinematicTrack(drivers[0]);
describe('Recorded cinematic motion',()=>{
 it('preserves original measured coordinates with one declared scale and center',()=>{
  const raw=drivers[0].locations[40],p=track.points[40];expect(p.x).toBeCloseTo((raw.x-track.center[0])*.01,10);expect(p.z).toBeCloseTo(-(raw.y-track.center[1])*.01,10);
 });
 it('stays continuous at 60 Hz and rotates tires from traveled scene distance',()=>{
  let last=cinematicFrame(track,0),maxStep=0,maxTurn=0;
  for(let t=1/60;t<track.driver.duration;t+=1/60){const p=cinematicFrame(track,t);maxStep=Math.max(maxStep,Math.hypot(p.x-last.x,p.z-last.z));maxTurn=Math.max(maxTurn,Math.abs(Math.atan2(Math.sin(p.heading-last.heading),Math.cos(p.heading-last.heading))));expect(p.distance).toBeGreaterThanOrEqual(last.distance);expect(p.roll).toBeCloseTo(-p.distance/(.355*.38),9);expect(Math.abs(p.steer)).toBeLessThanOrEqual(.32);last=p;}
  expect(maxStep).toBeLessThan(.2);expect(maxTurn).toBeLessThan(.15);
 });
 it('replays exactly after backward seeks and clamps source time',()=>{
  const a=cinematicFrame(track,38.5);cinematicFrame(track,12);expect(cinematicFrame(track,38.5)).toEqual(a);expect(cinematicFrame(track,-3)).toEqual(cinematicFrame(track,0));expect(cinematicFrame(track,500)).toEqual(cinematicFrame(track,track.driver.duration));
 });
 it('produces finite camera poses through all source frames and every selectable view',()=>{
  for(const camera of ['director','chase','drone','oncar','overview'])for(let t=0;t<97;t+=.37){const shot=raceCamera(track,t,camera);expect([...shot.position,...shot.target,shot.fov].every(Number.isFinite)).toBe(true);expect(shot.position[1]).toBeGreaterThan(.25);expect(shot.fov).toBeGreaterThan(30);}
 });
});
describe('Directed pit operation',()=>{
 it('frames the actual approach/departure coordinates and keeps service shots below the ceiling',()=>{
  const sim=simulate(),arrival=pitFilmShot(sim,.2),car=snapshot(sim,.2).cars[0];expect(arrival.target[2]).toBe(car.position);expect(pitFilmShot(sim,sim.stops[0].stopAt+.2).position[1]).toBeLessThan(3.2);
  const late=pitFilmShot(sim,sim.duration-.2),state=snapshot(sim,sim.duration-.2).cars[0];expect(late.target[2]).toBeCloseTo(state.position-1,8);
 });
 it('directs a visible arrival and ends after a safe departure while retaining held stops',()=>{const sim=simulate();expect(pitFilmStart(sim)).toBeCloseTo(sim.stops[0].stopAt-.55);expect(pitFilmDuration(sim)).toBeLessThan(sim.duration);expect(pitFilmDuration(sim)).toBeGreaterThan(sim.stops[0].releaseAt+1);const held=simulate({scenario:'unsecured'});expect(pitFilmDuration(held)).toBe(held.duration);});
 it('never presents a held wheel as a release',()=>{
  const sim=simulate({scenario:'unsecured'});expect(pitFilmShot(sim,sim.duration-.01).shot).toBe('hold');expect(sim.result.stationary).toBeNull();
 });
 it('cycles only at chapter completion and pauses permanently on a safety hold',()=>{
  const lap={chapter:'lap',time:9.95,playing:true,speed:2,loop:true,blocked:false};expect(advanceReel(lap,.1,10,7).chapter).toBe('pit');
  const held={...lap,chapter:'pit',time:6.99,blocked:true};expect(advanceReel(held,.1,10,7)).toMatchObject({chapter:'pit',time:7,playing:false});
  expect(advanceReel({...lap,playing:false},4,10,7)).toEqual({...lap,playing:false});
 });
 it('does not catch up hidden-tab time or auto-advance an unlooped chapter',()=>{
  const s={chapter:'lap',time:2,playing:true,speed:2,loop:false};expect(advanceReel(s,200,10,7).time).toBeCloseTo(2.2);expect(advanceReel({...s,time:9.9},.1,10,7)).toMatchObject({time:10,playing:false});
 });
});
