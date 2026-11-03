import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {decisionEvidence,decisionForecast,validationPoints,prepareTelemetry,telemetryAt,locationAt,timeAtProgress,brakingZones} from '../public/pit-stop-lab/pit-wall.js';
import {configuration} from '../public/pit-stop-lab/simulation.js';
const bundle=JSON.parse(fs.readFileSync('public/pit-stop-lab/data/bahrain-2024.json'));
const archive=JSON.parse(fs.readFileSync('public/pit-stop-lab/data/telemetry-bahrain-2024.json'));
const evidence=decisionEvidence(bundle,16,32),drivers=prepareTelemetry(archive);

describe('A decision may only learn from information available at its timestamp',()=>{
 it('excludes all unfinished/future laps, flags and weather from the decision prefix',()=>{
  const cutoff=evidence.cutoff;
  expect(evidence.prefix.laps.every(r=>Date.parse(r.date_start)+r.lap_duration*1000<=cutoff)).toBe(true);
  expect(evidence.prefix.race_control.every(r=>Date.parse(r.date)<=cutoff)).toBe(true);
  expect(evidence.prefix.weather.every(r=>Date.parse(r.date)<=cutoff)).toBe(true);
  expect(evidence.model.data.rows.some(r=>r.driver===16&&r.lap>=32)).toBe(false);
  expect(evidence.model.data.maxLap).toBe(57);
 });
 it('cannot improve by seeing future outcomes, weather or stint compounds',()=>{
  const changed=structuredClone(bundle);
  changed.laps.forEach(r=>{if(Date.parse(r.date_start)>=evidence.cutoff)r.lap_duration=180;});
  changed.weather.forEach(r=>{if(Date.parse(r.date)>evidence.cutoff){r.rainfall=1;r.track_temperature=70;}});
  changed.race_control.forEach(r=>{if(Date.parse(r.date)>evidence.cutoff){r.flag='RED';r.message='RED FLAG';}});
  changed.stints.forEach(s=>{const start=bundle.laps.find(r=>r.driver_number===s.driver_number&&r.lap_number===s.lap_start);if(start&&Date.parse(start.date_start)>evidence.cutoff)s.compound='MEDIUM';});
  const second=decisionEvidence(changed,16,32);
  expect(second.model.weights).toEqual(evidence.model.weights);
  expect(second.model.validation).toEqual(evidence.model.validation);
  expect(second.counts).toEqual(evidence.counts);
 });
 it('validates against later available laps and reports the comparator honestly',()=>{
  const v=evidence.model.validation;
  expect(v.train).toBeGreaterThan(300);expect(v.test).toBeGreaterThan(100);
  expect(v.mae).toBeLessThan(v.baselineMae);
  expect(validationPoints(evidence).every(r=>r.lap>v.cutoff&&r.lap<=evidence.observedThrough)).toBe(true);
  expect(validationPoints(evidence).length).toBe(v.test);
 });
 it.each([24,32,40,48])('trains only a sufficient dry prefix at decision lap %i',lap=>{
  const e=decisionEvidence(bundle,16,lap);expect(e.current).toBe('HARD');expect(e.counts.accepted).toBeGreaterThan(200);
 });
 it('rejects wet observations and unavailable decision timestamps',()=>{
  const wet=structuredClone(bundle);wet.weather[0].rainfall=1;
  expect(()=>decisionEvidence(wet,16,32)).toThrow(/Dry-race/);
  expect(()=>decisionEvidence(bundle,16,8)).toThrow(/24 to 48/);
  expect(()=>decisionEvidence(bundle,999,32)).toThrow(/unavailable/);
 });
});

describe('Shared seeded futures, actual crew variation and safety gates',()=>{
 const opts={runs:100};
 it('is exactly reproducible and returns all nine explicit actions',async()=>{
  const a=await decisionForecast(evidence,configuration(),{},opts),b=await decisionForecast(evidence,configuration(),{},opts);
  expect(a).toEqual(b);expect(a.plans).toHaveLength(9);expect(a.plans.find(p=>p.wait===-1).relativeTime).toEqual([0,0,0]);
  expect(a.plans.every(p=>p.relativeTime[0]<=p.relativeTime[1]&&p.relativeTime[1]<=p.relativeTime[2])).toBe(true);
  expect(a.evidence.cutoff).toBe(new Date(evidence.cutoff).toISOString());expect(a.paceModel.features.length).toBe(a.paceModel.coefficients.length);expect(a.paceModel.coefficients).toEqual(evidence.model.weights);
  expect(a.plans.every(p=>p.interval[0]<=p.probability&&p.interval[1]>=p.probability)).toBe(true);
 });
 it('propagates the gun-delay intervention while keeping no-stop elapsed time unchanged',async()=>{
  const clean=await decisionForecast(evidence,configuration(),{},opts),delay=await decisionForecast(evidence,configuration({scenario:'gun'}),{},opts);
  expect(delay.service.median).toBeGreaterThan(clean.service.median+.5);
  expect(delay.plans.find(p=>p.wait===0&&p.compound==='HARD').medianTime).toBeGreaterThan(clean.plans.find(p=>p.wait===0&&p.compound==='HARD').medianTime+.5);
  expect(delay.plans.find(p=>p.wait===-1).medianTime).toBe(clean.plans.find(p=>p.wait===-1).medianTime);
 });
 it('refuses unsafe release and invalid assumptions instead of manufacturing a call',async()=>{
  await expect(decisionForecast(evidence,configuration({scenario:'unsecured'}),{},opts)).rejects.toThrow(/Unsafe retention/);
  await expect(decisionForecast(evidence,configuration(),{gap:NaN},opts)).rejects.toThrow(/gap/);
  await expect(decisionForecast(evidence,configuration(),{scProbability:1.1},opts)).rejects.toThrow(/neutralisation/);
 });
});

describe('Recorded lap telemetry and location replay',()=>{
 it('reproduces every captured canonical source checksum',()=>{
  archive.requests.forEach((request,i)=>{
   const records=archive.drivers[Math.floor(i/2)][i%2?'location':'car_data'];
   const canonical=JSON.stringify(records.map(r=>Object.fromEntries(Object.entries(r).sort(([a],[b])=>a.localeCompare(b)))));
   expect(createHash('sha256').update(canonical).digest('hex')).toBe(request.canonical_sha256);
  });
 });
 it('retains bounded real records and plausible integrated distance',()=>{
  expect(drivers.map(d=>d.samples.length)).toEqual([369,370]);
  for(const d of drivers){expect(d.distance).toBeGreaterThan(5300);expect(d.distance).toBeLessThan(5400);expect(d.samples[0].progress).toBe(0);expect(d.samples.at(-1).progress).toBe(1);}
 });
 it('maps measured channels deterministically through seeks and driver-distance alignment',()=>{
  const a=telemetryAt(drivers[0],22.5);telemetryAt(drivers[0],4);expect(telemetryAt(drivers[0],22.5)).toEqual(a);
  const sample=drivers[0].samples[80];expect(telemetryAt(drivers[0],sample.time).speed).toBeCloseTo(sample.speed,8);expect(telemetryAt(drivers[0],sample.time).brake).toBe(sample.brake);expect(telemetryAt(drivers[0],sample.time).gear).toBe(sample.gear);
  const t=timeAtProgress(drivers[0],.5);expect(telemetryAt(drivers[0],t).progress).toBeCloseTo(.5,8);
  expect(locationAt(drivers[0],t)).toEqual(locationAt(drivers[0],t));
  expect(brakingZones(drivers[0]).length).toBeGreaterThan(5);
 });
 it('does not interpolate speed across a material gap in source samples',()=>{
  const d={...drivers[0],samples:[{...drivers[0].samples[0],time:0},{...drivers[0].samples[1],time:3}]};
  expect(telemetryAt(d,1.5)).toBeNull();
 });
 it('rejects mixed sessions and corrupt numerical channels at the archive boundary',()=>{
  const bad=structuredClone(archive);bad.drivers[0].car_data[3].session_key=999;
  expect(()=>prepareTelemetry(bad)).toThrow(/Invalid car-data/);
  const nan=structuredClone(archive);nan.drivers[0].car_data[4].speed='fast';
  expect(()=>prepareTelemetry(nan)).toThrow(/Invalid car-data/);
 });
});
