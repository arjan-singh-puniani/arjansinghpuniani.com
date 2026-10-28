import { operations } from '../public/pit-stop-lab/operations.js';
import { describe, it, expect } from 'vitest';
import { CORNERS, configuration, simulate, snapshot, telemetry, sensitivity, monteCarlo, percentile, strategy, SCENARIOS } from '../public/pit-stop-lab/simulation.js';

describe('Pit Stop Lab exact-event engine',()=>{
  it('replays a fixed seed with identical events, results and seek snapshots',()=>{
    const a=simulate({seed:18}),b=simulate({seed:18});expect(a.events).toEqual(b.events);expect(a.result).toEqual(b.result);
    const before=snapshot(a,a.stops[0].stopAt+1);snapshot(a,a.duration);expect(snapshot(a,a.stops[0].stopAt+1)).toEqual(before);
    expect(snapshot(a,0)).toEqual(snapshot(b,0));expect(snapshot(a,0).cars[0].corners.FL.secured).toBe(true);expect(snapshot(a,0).cars[0].corners.FL.installed).toBe(true);expect(snapshot(a,-1).time).toBe(0);expect(snapshot(a,100).time).toBe(a.duration);
    expect(simulate({seed:19}).result).not.toEqual(a.result);
  });
  it('validates configuration and query boundaries',()=>{
    for(const input of [{deceleration:0},{seed:-1},{seed:.5},{fastener:NaN},{approachSpeed:Infinity},{scenario:'unknown'},{scenario:'toString'},{scenario:'__proto__'},{rrDelay:-1}])expect(()=>simulate(input)).toThrow();
    expect(()=>snapshot(simulate(),NaN)).toThrow();expect(configuration().deceleration).toBeGreaterThan(0);
  });
  it('honors every dependency and all corner state transitions',()=>{
    const sim=simulate(),byId=new Map(sim.events.map(e=>[e.id,e]));
    for(const event of sim.events){expect(event.end).toBeGreaterThanOrEqual(event.start);for(const dep of event.deps)expect(event.start).toBeGreaterThanOrEqual(byId.get(dep).end);}
    const stop=sim.stops[0];for(const c of CORNERS){const events=stop.corners[c].events;expect(events.map(e=>e.state)).toEqual(['READY','GUN_APPROACH','SOCKET_ENGAGED','LOOSENING','NUT_RELEASED','WHEEL_REMOVAL','WHEEL_CLEAR','REPLACEMENT_ALIGNMENT','WHEEL_INSTALLED','TIGHTENING','FASTENING_CONFIRMED','TOOL_CLEAR','COMPLETE']);
      const install=events.find(e=>e.state==='WHEEL_INSTALLED');expect(snapshot(sim,install.start).cars[0].corners[c].secured).toBe(false);
    }
    const final=snapshot(sim,stop.releaseAt).cars[0];expect(final.guard).toBe(true);expect(final.released).toBe(true);
    expect(stop.frontDown.start).toBeGreaterThanOrEqual(Math.max(...CORNERS.map(c=>stop.corners[c].events.at(-1).end)));
  });
  it('runs corners in parallel and delays departure only after slack is exhausted',()=>{
    const baseline=simulate({rrDelay:1,variability:0,coordination:0});
    expect(baseline.result.criticalCorner).toBe('RR');
    const sim=simulate({rrDelay:1.4,variability:0,coordination:0});expect(sim.result.stationary-baseline.result.stationary).toBeCloseTo(.4,10);
    const stop=baseline.stops[0];expect(stop.slack.FL).toBeCloseTo(1,10);
    expect(baseline.result.serviceDuration).toBeLessThan(CORNERS.reduce((sum,c)=>sum+stop.corners[c].events.reduce((s,e)=>s+e.duration,0),0));
    // A faster noncritical front jack must not change a rear-jack-constrained stop.
    const config=configuration({frontJack:.1,rearJack:.7,variability:0,coordination:0});expect(sensitivity(config,'frontJack',.1).change).toBeCloseTo(0,10);
    const critical=new Set(sim.stops[0].criticalIds);expect(critical.has('car1-RR-REPLACEMENT_ALIGNMENT')).toBe(true);
  });
  it('matches constant-deceleration approach and continuous kinematics',()=>{
    const sim=simulate();expect(sim.approachDistance).toBeCloseTo(sim.speed*sim.config.driverResponse+sim.speed**2/(2*sim.config.deceleration));
    expect(snapshot(sim,sim.approachDuration-1e-6).cars[0].speed).toBeCloseTo(0,4);
    expect(snapshot(sim,sim.stops[0].stopAt).cars[0].speed).toBe(0);
    expect(sim.result.total).toBeCloseTo(sim.result.stationary+sim.result.transit);expect(sim.result.raceLoss).toBeCloseTo(sim.result.total-sim.result.reference);
  });
  it.each(Object.keys(SCENARIOS))('produces finite telemetry and safe states in %s',scenario=>{
    const sim=simulate({scenario}),samples=telemetry(sim,180);for(const sample of samples)for(const value of Object.values(sample))expect(Number.isFinite(value)).toBe(true);
    for(let t=0;t<=sim.duration;t+=.025){const state=snapshot(sim,t);for(const car of state.cars){for(const c of Object.values(car.corners))if(c.secured)expect(c.installed).toBe(true);if(car.released)expect(car.safety.wheelsSafe&&car.safety.toolsClear&&car.safety.jacksClear).toBe(true);}}
  });
  it('turns gun, alignment and positioning errors into reproducible penalties',()=>{
    const baseline=simulate({variability:0,coordination:0});
    const gun=simulate({scenario:'gun',variability:0,coordination:0});expect(gun.result.stationary-baseline.result.stationary).toBeCloseTo(.9);expect(gun.result.criticalCorner).toBe('FR');
    const align=simulate({scenario:'alignment',variability:0,coordination:0});expect(align.result.stationary-baseline.result.stationary).toBeCloseTo(.65);expect(align.result.criticalCorner).toBe('RR');
    expect(simulate({scenario:'position'}).result.stationary).toBeGreaterThan(simulate().result.stationary);
  });
  it('holds release for conflicts and lets non-conflicting traffic pass',()=>{
    const sim=simulate({scenario:'traffic'}),stop=sim.stops[0];expect(stop.releaseAt).toBeGreaterThanOrEqual(stop.traffic.end+sim.config.releaseGap);
    expect(sim.events.some(e=>e.state==='TRAFFIC HOLD')).toBe(true);expect(snapshot(sim,stop.traffic.start+.1).cars[0].released).toBe(false);
    const clear=simulate({scenario:'traffic',trafficAt:7});expect(clear.result.stationary).toBeCloseTo(simulate().result.stationary);
  });
  it('queues the second car until the box and first-car envelope are clear',()=>{
    const sim=simulate({scenario:'stack'});expect(snapshot(sim,0).activeCar).toBe(1);expect(sim.queue.wait).toBeGreaterThan(0);expect(sim.stops[1].stopAt).toBeGreaterThan(sim.stops[0].releaseAt);
    for(let t=0;t<sim.duration;t+=.025){const [first,second]=snapshot(sim,t).cars;expect(second.position-first.position).toBeGreaterThan(5.6);}
    expect(sim.result.total).toBeCloseTo(sim.result.transit+sim.result.stationary+sim.result.queueWait);
  });
  it('never schedules departure or jack release for an unsecured wheel',()=>{
    const sim=simulate({scenario:'unsecured'});expect(sim.result.stationary).toBeNull();expect(sim.result.total).toBeNull();expect(sim.stops[0].frontDown).toBeNull();
    expect(sim.events.some(e=>e.state==='RELEASE')).toBe(false);const state=snapshot(sim,sim.duration).cars[0];expect(state.released).toBe(false);expect(state.corners.RR.secured).toBe(false);expect(state.lift).toBe(.1);
  });
  it('reproduces Monte Carlo percentiles and outcomes without blocking the renderer',async()=>{
    const input={...configuration(),seed:42};let yields=0;const options={runs:100,threshold:3,yieldBatch:async()=>{yields++;}};
    const a=await monteCarlo(input,options),b=await monteCarlo(input,options);expect(a).toEqual(b);expect(yields).toBeGreaterThan(0);expect(a.p10).toBeLessThanOrEqual(a.median);expect(a.median).toBeLessThanOrEqual(a.p90);expect(Object.values(a.bottlenecks).reduce((a,b)=>a+b,0)).toBe(100);
    expect(percentile([1,2,3,4],.5)).toBe(2.5);expect(a.exceeding).toBeGreaterThanOrEqual(0);expect(a.exceeding).toBeLessThanOrEqual(1);
    const held=await monteCarlo({scenario:'unsecured'},{...options});expect(held.holds).toBe(100);expect(held.exceeding).toBe(1);expect(held.median).toBeNull();
  });
  it('links the reduced race strategy to simulated loss and sums every modeled lap',()=>{
    const a=simulate(),b=simulate({rrDelay:1}),plans=strategy(a),slower=strategy(b);
    expect(plans[0].elapsed).toBeCloseTo(a.result.raceLoss+plans[0].splits.reduce((a,b)=>a+b,0));
    expect(slower[0].elapsed-plans[0].elapsed).toBeCloseTo(b.result.raceLoss-a.result.raceLoss);
    expect(strategy(simulate({scenario:'unsecured'}))).toEqual([]);expect(strategy(a,{compound:'soft'})[0].elapsed).not.toBe(plans[0].elapsed);
  });
});


describe('Pit complex operations readout',()=>{
  it('makes replacement preparation an explicit dependency before service',()=>{const sim=simulate(),prep=sim.events.find(e=>e.id==='preparation');expect(prep.end).toBeLessThanOrEqual(sim.stops[0].stopAt);expect(sim.stops[0].ready.deps).toContain(prep.id);});
  it('derives inventory from fitted and removed wheels at any seek position',()=>{
    const sim=simulate({scenario:'stack'});
    const start=operations(sim,snapshot(sim,0));expect(start.inventory).toEqual({allocated:8,replacementsRemaining:8,fitted:0,removed:0});
    const final=operations(sim,snapshot(sim,sim.duration));expect(final.inventory).toEqual({allocated:8,replacementsRemaining:0,fitted:8,removed:8});
    const time=sim.stops[0].mechanicalEnd;const first=operations(sim,snapshot(sim,time));expect(first.inventory.fitted).toBe(4);expect(first.inventory.replacementsRemaining).toBe(4);
    snapshot(sim,sim.duration);expect(operations(sim,snapshot(sim,time))).toEqual(first);
  });
  it('reports concurrency and identifies the current critical operation',()=>{
    const sim=simulate({scenario:'gun'}),event=sim.events.find(e=>e.track==='FR'&&e.state==='LOOSENING');
    const ops=operations(sim,snapshot(sim,(event.start+event.end)/2));expect(ops.activeStations).toBe(4);expect(ops.activeCrew).toBe(14);expect(ops.blocking.track).toBe('FR');expect(ops.blocking.remaining).toBeGreaterThan(0);
    expect(ops.corners.find(c=>c.key==='FR').critical).toBe(true);
  });
  it('never depicts a completed departure during a retention hold',()=>{
    const sim=simulate({scenario:'unsecured'}),ops=operations(sim,snapshot(sim,sim.duration));expect(ops.status).toBe('SAFETY HOLD');expect(ops.release.approved).toBe(false);expect(ops.pipeline.at(-1).status).toBe('blocked');expect(ops.pipeline.at(-1).progress).toBe(0);
  });
  it('keeps progress, crew counts and inventory bounded in every scenario',()=>{
    for(const scenario of Object.keys(SCENARIOS)){const sim=simulate({scenario});for(let i=0;i<50;i++){const ops=operations(sim,snapshot(sim,sim.duration*i/49));expect(ops.activeCrew).toBeGreaterThanOrEqual(0);expect(ops.activeCrew).toBeLessThanOrEqual(14);expect(ops.inventory.replacementsRemaining).toBeGreaterThanOrEqual(0);for(const stage of ops.pipeline){expect(stage.progress).toBeGreaterThanOrEqual(0);expect(stage.progress).toBeLessThanOrEqual(1);}}}
  });
});
