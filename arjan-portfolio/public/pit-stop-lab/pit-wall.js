import { prepareDataset, trainModel, evaluateStrategies, predict } from './intelligence.js';
import { simulate } from './simulation.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const endTime = row => Date.parse(row.date_start) + row.lap_duration * 1000;

// A historical decision may only consume records observable before its timestamp.
export function decisionEvidence(bundle, driver, lap) {
    assert(Number.isInteger(driver) && Number.isInteger(lap) && lap >= 24 && lap <= 48, 'Choose a decision lap from 24 to 48.');
    const target = bundle.laps.find(r => r.driver_number === driver && r.lap_number === lap);
    assert(target && Number.isFinite(Date.parse(target.date_start)), 'Decision timestamp is unavailable.');
    const cutoff = Date.parse(target.date_start);
    const laps = bundle.laps.filter(r => Number.isFinite(r.lap_duration) && r.lap_duration > 0 && endTime(r) <= cutoff);
    const completed = number => laps.filter(r => r.driver_number === number);
    const knownStints = bundle.stints.filter(s => bundle.laps.some(r => r.driver_number === s.driver_number && r.lap_number === s.lap_start && Date.parse(r.date_start) <= cutoff));
    const stints = knownStints.map(s => ({ ...s, lap_end: Math.min(s.lap_end, Math.max(s.lap_start, ...completed(s.driver_number).map(r => r.lap_number))) }));
    const prefix = { ...bundle, laps, stints, race_control: bundle.race_control.filter(r => Date.parse(r.date) <= cutoff), weather: bundle.weather.filter(r => Date.parse(r.date) <= cutoff) };
    const data = prepareDataset(prefix);
    const model = trainModel(data, { bootstrap: 32, seed: 42 });
    const observedThrough = data.maxLap;
    // Scheduled Bahrain distance is a horizon boundary, never a training feature.
    model.data = { ...data, observedThrough, maxLap: 57 };
    const current = knownStints.filter(s => s.driver_number === driver).sort((a, b) => b.lap_start - a.lap_start)[0];
    assert(current && model.drivers.includes(driver), 'Insufficient historical coverage for this driver.');
    const age = current.tyre_age_at_start + lap - current.lap_start;
    return { model, prefix, cutoff, lap, driver, age, current: current.compound, counts: { laps: laps.length, accepted: data.rows.length, excluded: data.excluded, stints: stints.length, flags: prefix.race_control.length, weather: prefix.weather.length }, observedThrough };
}

export async function decisionForecast(evidence, config, assumptions, options = {}) {
    const { transitLoss = 20, traffic = 0, scProbability = 0, gap = 2, rivalWait = 2, laps = 8 } = assumptions;
    assert(Number.isFinite(gap) && gap >= -30 && gap <= 30, 'Rival gap must be −30 to 30 seconds.');
    const sim = simulate(config);
    assert(sim.result.stationary !== null, 'Unsafe retention: no release or strategy recommendation is available.');
    const samples = Array.from({ length: 64 }, (_, i) => { const run = simulate({ ...config, seed: 42 + i }); return run.result.stationary + run.result.queueWait; });
    const rival = evidence.driver === 55 ? 16 : 55;
    const known = evidence.prefix.stints.filter(s => s.driver_number === rival).sort((a, b) => b.lap_start - a.lap_start)[0];
    assert(known && known.compound === evidence.current, 'The current comparison requires the same observed compound for both drivers.');
    const scenario = { driver: evidence.driver, lap: evidence.lap, laps, age: evidence.age, current: evidence.current, next: 'HARD', transitLoss, traffic, scProbability, rivalService: 2.6, rivals: [{ driver: rival, age: known.tyre_age_at_start + evidence.lap - known.lap_start, gap, pit: rivalWait }] };
    const result = await evaluateStrategies(evidence.model, scenario, { runs: 1200, seed: 42, serviceSamples: samples, ...options });
    const baseline = result.plans.find(p => p.wait === -1);
    const m=evidence.model,features=['intercept','race lap / 60',...m.compounds.map(c=>`${c} tire age / 30`),...m.compounds.slice(1).map(c=>`compound = ${c}`),...m.drivers.slice(1).map(d=>`driver = ${d}`)];
    return { ...result, paceModel:{family:'ridge',lambda:.1,features,coefficients:[...m.weights],support:m.support}, evidence: { ...evidence.model.validation, cutoff: new Date(evidence.cutoff).toISOString(), observedThrough: evidence.observedThrough, counts: evidence.counts }, config: { ...config }, baselineSeconds: baseline.medianTime, savedSeconds: -result.plans[0].relativeTime[1] };
}

export function validationPoints(evidence) {
    return evidence.model.data.rows.filter(r => r.lap > evidence.model.validation.cutoff).map(r => ({ lap: r.lap, driver: r.driver, actual: r.seconds, predicted: predict(evidence.model, r), residual: r.seconds - predict(evidence.model, r) }));
}

export function prepareTelemetry(bundle) {
    assert(bundle?.schema === 1 && bundle.source === 'OpenF1' && bundle.session === 9472 && Array.isArray(bundle.drivers) && bundle.drivers.length === 2, 'Invalid telemetry archive.');
    assert(bundle.drivers[0].number === 16 && bundle.drivers[1].number === 55, 'Expected the archived Leclerc/Sainz comparison.');
    return bundle.drivers.map(driver => {
        const start = Date.parse(driver.lap?.date_start), duration = driver.lap?.lap_duration;
        assert(Number.isFinite(start) && Number.isFinite(duration) && duration > 0 && duration < 200, 'Invalid lap timing.');
        assert(Array.isArray(driver.car_data) && driver.car_data.length >= 200 && driver.car_data.length < 5000 && Array.isArray(driver.location) && driver.location.length >= 200 && driver.location.length < 5000, 'Incomplete telemetry archive.');
        const check = row => row.session_key === 9472 && row.driver_number === driver.number && Number.isFinite(Date.parse(row.date));
        const samples = driver.car_data.map(r => {
            assert(check(r) && [r.speed,r.throttle,r.brake,r.rpm,r.n_gear,r.drs].every(Number.isFinite) && r.speed >= 0 && r.speed <= 400 && r.throttle >= 0 && r.throttle <= 100 && [0,100].includes(r.brake), 'Invalid car-data sample.');
            return { time: (Date.parse(r.date) - start) / 1000, speed: r.speed, throttle: r.throttle, brake: r.brake, rpm: r.rpm, gear: r.n_gear, drs: r.drs, distance: 0 };
        }).sort((a,b) => a.time-b.time);
        let distance = 0;
        samples.forEach((r,i) => { if (i) distance += (r.time-samples[i-1].time) * (r.speed+samples[i-1].speed) / 7.2; r.distance = distance; });
        assert(distance > 4000 && distance < 6500, 'Telemetry distance is inconsistent with a complete Bahrain lap.');
        samples.forEach(r => r.progress = r.distance/distance);
        const locations = driver.location.map(r => { assert(check(r) && Number.isFinite(r.x) && Number.isFinite(r.y), 'Invalid location sample.'); return { time: (Date.parse(r.date)-start)/1000, x:r.x, y:r.y }; }).sort((a,b)=>a.time-b.time);
        assert(samples.every(r=>r.time>=0&&r.time<=duration+.01) && locations.every(r=>r.time>=0&&r.time<=duration+.01), 'Samples lie outside the recorded lap.');
        return { number: driver.number, name: driver.name, code: driver.code, color: driver.color, duration, start, samples, locations, distance };
    });
}

function bracket(rows, value, key) {
    let lo=0,hi=rows.length-1;
    while(lo<hi){const mid=Math.floor((lo+hi)/2);if(rows[mid][key]<value)lo=mid+1;else hi=mid;}
    return [rows[Math.max(0,lo-1)],rows[lo]];
}
export function telemetryAt(driver, time) {
    assert(Number.isFinite(time), 'Invalid replay time.');
    const [a,b]=bracket(driver.samples,time,'time'),span=b.time-a.time;
    if(span>1.5&&time>a.time&&time<b.time)return null;
    const f=span?Math.max(0,Math.min(1,(time-a.time)/span)):0;
    const mix=k=>a[k]+(b[k]-a[k])*f,discrete=time>=b.time?b:a;
    return { time, speed:mix('speed'),throttle:mix('throttle'),rpm:mix('rpm'),progress:mix('progress'),brake:discrete.brake,gear:discrete.gear,drs:[10,12,14].includes(discrete.drs) };
}
export function locationAt(driver, time) {
    const [a,b]=bracket(driver.locations,time,'time'),f=b.time===a.time?0:Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time)));
    return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};
}
export function timeAtProgress(driver, progress) {
    const [a,b]=bracket(driver.samples,Math.max(0,Math.min(1,progress)),'progress');
    return a.time+(b.time-a.time)*(b.progress===a.progress?0:(progress-a.progress)/(b.progress-a.progress));
}
export function brakingZones(driver) {
    return driver.samples.filter((r,i,rows)=>r.brake===100&&(!i||rows[i-1].brake===0)).filter((r,i,rows)=>!i||r.time-rows[i-1].time>1.5);
}
