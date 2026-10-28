import { seededRandom, percentile } from './simulation.js';
const DRY = ['SOFT', 'MEDIUM', 'HARD'];
const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
const finite = (x, min, max) => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
function requireValue(condition, message) { if (!condition)
    throw new Error(message); }
// OpenF1 bundle, also used for local JSON imports. Never execute imported content.
export function prepareDataset(bundle) {
    requireValue(bundle?.schema === 1 && bundle.source === 'OpenF1', 'Expected a schema 1 OpenF1 bundle. Export the example to inspect its format.');
    const session = bundle.session;
    requireValue(Number.isInteger(session?.session_key) && session.session_key > 0 && session.session_name === 'Race' && Number.isFinite(Date.parse(session.date_start)), 'A dated race session is required.');
    for (const key of ['laps', 'stints', 'race_control', 'weather'])
        requireValue(Array.isArray(bundle[key]) && bundle[key].length <= 20000 && bundle[key].every(r => r && typeof r === 'object' && r.session_key === session.session_key), `Invalid or mixed-session ${key} records.`);
    requireValue([...bundle.race_control, ...bundle.weather].every(r => Number.isFinite(Date.parse(r.date))), 'Weather and race-control timestamps must be valid.');
    requireValue(bundle.weather.length > 0 && bundle.weather.every(r => r.rainfall === 0), 'Dry-race model only: wet or unknown rainfall blocks training.');
    requireValue(bundle.race_control.length > 0, 'Race-control records are required for incident filtering.');
    const blocked = new Set();
    let neutralised = false;
    for (const event of [...bundle.race_control].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))) {
        const message = String(event.message ?? '').toUpperCase();
        if (/SAFETY CAR DEPLOYED|VIRTUAL SAFETY CAR DEPLOYED|\bRED FLAG\b/.test(message) || event.flag === 'RED')
            neutralised = true;
        if (neutralised || ['YELLOW', 'DOUBLE YELLOW', 'RED'].includes(event.flag))
            if (Number.isInteger(event.lap_number)) {
                blocked.add(event.lap_number);
                blocked.add(event.lap_number + 1);
            }
        if (/SAFETY CAR IN THIS LAP|VIRTUAL SAFETY CAR ENDING|GREEN LIGHT|GREEN FLAG/.test(message))
            neutralised = false;
    }
    // Neutralisation messages lack a dependable end lap in some feeds: filter by time too.
    const controls = [...bundle.race_control].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const neutralAt = date => {
        let active = false;
        for (const e of controls) {
            if (Date.parse(e.date) > date)
                break;
            if (/SAFETY CAR DEPLOYED|VIRTUAL SAFETY CAR DEPLOYED|\bRED FLAG\b/.test(String(e.message)) || e.flag === 'RED')
                active = true;
            if (/SAFETY CAR IN THIS LAP|VIRTUAL SAFETY CAR ENDING|GREEN LIGHT|GREEN FLAG/.test(String(e.message)))
                active = false;
        }
        return active;
    };
    const rows = [], seen = new Set(), rejected = { invalid: 0, duplicate: 0, pitOrStart: 0, incident: 0, slow: 0 };
    for (const lap of bundle.laps) {
        if (!Number.isInteger(lap.driver_number) || !Number.isInteger(lap.lap_number) || !finite(lap.lap_number, 1, 200) || !finite(lap.lap_duration, 30, 300) || !Number.isFinite(Date.parse(lap.date_start))) {
            rejected.invalid++;
            continue;
        }
        const key = `${lap.driver_number}:${lap.lap_number}`;
        if (seen.has(key)) {
            rejected.duplicate++;
            continue;
        }
        seen.add(key);
        const stints = bundle.stints.filter(s => s.driver_number === lap.driver_number).sort((a, b) => a.stint_number - b.stint_number);
        const stint = stints.find(s => lap.lap_number >= s.lap_start && lap.lap_number <= s.lap_end);
        if (!stint || !DRY.includes(stint.compound) || !Number.isInteger(stint.stint_number) || !finite(stint.lap_start, 1, 200) || !finite(stint.lap_end, stint.lap_start, 200) || !finite(stint.tyre_age_at_start, 0, 100)) {
            rejected.invalid++;
            continue;
        }
        if (lap.lap_number <= 1 || lap.is_pit_out_lap !== false || lap.lap_number <= stint.lap_start || (lap.lap_number >= stint.lap_end && stint !== stints.at(-1))) {
            rejected.pitOrStart++;
            continue;
        }
        if (blocked.has(lap.lap_number) || neutralAt(Date.parse(lap.date_start)) || neutralAt(Date.parse(lap.date_start) + lap.lap_duration * 1000)) {
            rejected.incident++;
            continue;
        }
        rows.push({ driver: lap.driver_number, lap: lap.lap_number, age: stint.tyre_age_at_start + lap.lap_number - stint.lap_start, compound: stint.compound, stint: `${lap.driver_number}:${stint.stint_number}`, seconds: lap.lap_duration });
    }
    // A fixed per-driver pace gate removes obvious slow laps; traffic can still remain.
    const paceCutoff = Math.floor(Math.max(...rows.map(r => r.lap)) * .8);
    const medians = new Map([...new Set(rows.map(r => r.driver))].map(driver => [driver, percentile(rows.filter(r => r.driver === driver && r.lap <= paceCutoff).map(r => r.seconds).sort((a, b) => a - b), .5)]));
    const clean = rows.filter(r => {
        const median = medians.get(r.driver);
        if (r.seconds > median * 1.07) {
            rejected.slow++;
            return false;
        }
        return true;
    });
    requireValue(clean.length >= 80, 'At least 80 clean dry laps are required.');
    const compounds = DRY.filter(c => clean.filter(r => r.compound === c).length >= 25);
    const usable = clean.filter(r => compounds.includes(r.compound));
    const drivers = [...new Set(usable.map(r => r.driver))].filter(d => usable.filter(r => r.driver === d).length >= 15).sort((a, b) => a - b);
    const accepted = usable.filter(r => drivers.includes(r.driver));
    requireValue(compounds.length >= 2 && drivers.length >= 3 && accepted.length >= 80, 'Need two supported dry compounds and three drivers with sufficient laps.');
    const temperatures = bundle.weather.map(w => w.track_temperature).filter(x => finite(x, -10, 80));
    return { rows: accepted.sort((a, b) => a.lap - b.lap || a.driver - b.driver), compounds, drivers, rejected, excluded: bundle.laps.length - accepted.length, rawCount: bundle.laps.length, session: { key: session.session_key, name: `${String(session.location ?? session.circuit_short_name ?? 'Race').slice(0, 80)} ${session.year}`, date: session.date_start }, retrievedAt: String(bundle.retrievedAt ?? 'unknown').slice(0, 80), weather: { samples: bundle.weather.length, trackMin: temperatures.length ? Math.min(...temperatures) : null, trackMax: temperatures.length ? Math.max(...temperatures) : null }, maxLap: Math.max(...accepted.map(r => r.lap)) };
}
function features(model, row) {
    return [1, row.lap / 60, ...model.compounds.map(c => row.compound === c ? row.age / 30 : 0), ...model.compounds.slice(1).map(c => +(row.compound === c)), ...model.drivers.slice(1).map(d => +(row.driver === d))];
}
function fit(model, rows) {
    const size = features(model, rows[0]).length, matrix = Array.from({ length: size }, () => Array(size + 1).fill(0));
    const center = mean(rows.map(r => r.seconds));
    for (const row of rows) {
        const x = features(model, row), y = row.seconds - center;
        for (let i = 0; i < size; i++) {
            matrix[i][size] += x[i] * y;
            for (let j = 0; j < size; j++)
                matrix[i][j] += x[i] * x[j];
        }
    }
    for (let i = 1; i < size; i++)
        matrix[i][i] += .1;
    for (let i = 0; i < size; i++) {
        const pivot = matrix[i][i];
        requireValue(Math.abs(pivot) > 1e-10, 'Insufficient independent training features.');
        for (let j = i; j <= size; j++)
            matrix[i][j] /= pivot;
        for (let k = 0; k < size; k++)
            if (k !== i) {
                const factor = matrix[k][i];
                for (let j = i; j <= size; j++)
                    matrix[k][j] -= factor * matrix[i][j];
            }
    }
    const weights = matrix.map(row => row[size]);
    weights[0] += center;
    return weights;
}
export function predict(model, row, weights = model.weights) {
    requireValue(model.compounds.includes(row.compound) && model.drivers.includes(row.driver) && finite(row.age, 0, 100) && finite(row.lap, 1, 200), 'Unsupported prediction features.');
    return features(model, row).reduce((sum, value, i) => sum + value * weights[i], 0);
}
export function trainModel(data, { bootstrap = 32, seed = 42 } = {}) {
    requireValue(Number.isInteger(bootstrap) && bootstrap >= 1 && bootstrap <= 64, 'Bootstrap count must be 1–64.');
    requireValue(Number.isInteger(seed) && finite(seed, 0, 4294967295), 'Training seed must be a uint32.');
    const model = { compounds: data.compounds, drivers: data.drivers }, cutoff = Math.floor(data.maxLap * .8);
    const train = data.rows.filter(r => r.lap <= cutoff), test = data.rows.filter(r => r.lap > cutoff);
    requireValue(train.length >= 60 && test.length >= 20 && model.drivers.every(d => train.some(r => r.driver === d)) && model.compounds.every(c => train.some(r => r.compound === c)), 'Insufficient chronological training/validation coverage.');
    model.weights = fit(model, train);
    const residuals = test.map(r => r.seconds - predict(model, r));
    const baseline = r => { const group = train.filter(t => t.driver === r.driver && t.compound === r.compound); return mean((group.length ? group : train.filter(t => t.driver === r.driver)).map(t => t.seconds)); };
    model.validation = { train: train.length, test: test.length, cutoff, mae: mean(residuals.map(Math.abs)), baselineMae: mean(test.map(r => Math.abs(r.seconds - baseline(r)))), bias: mean(residuals), p90: percentile(residuals.map(Math.abs).sort((a, b) => a - b), .9) };
    // Stint-level resampling keeps within-stint correlation in the parameter draws.
    const random = seededRandom(seed), stints = [...new Set(train.map(r => r.stint))].map(key => train.filter(r => r.stint === key));
    const groups = model.drivers.map(d => stints.filter(stint => stint[0].driver === d));
    model.draws = Array.from({ length: bootstrap }, () => fit(model, groups.flatMap(group => group.flatMap(() => group[Math.floor(random() * group.length)]))));
    model.residuals = residuals;
    model.support = Object.fromEntries(model.compounds.map(c => { const rows = train.filter(r => r.compound === c); return [c, { minAge: Math.min(...rows.map(r => r.age)), maxAge: Math.max(...rows.map(r => r.age)), count: rows.length }]; }));
    model.data = data;
    return model;
}
function validateScenario(model, s) {
    requireValue(Number.isInteger(s.lap) && finite(s.lap, 2, 199) && Number.isInteger(s.laps) && finite(s.laps, 2, 40) && s.lap + s.laps - 1 <= model.data.maxLap, 'Race horizon must fit the historical session (2–40 laps).');
    requireValue(finite(s.transitLoss, 5, 60) && finite(s.scProbability, 0, 1) && finite(s.traffic, 0, 10) && finite(s.rivalService, .5, 15), 'Invalid pit transit, rival service, neutralisation probability or traffic cost.');
    requireValue(model.drivers.includes(s.driver) && model.compounds.includes(s.current) && model.compounds.includes(s.next) && Number.isInteger(s.age) && finite(s.age, 0, 60), 'Choose supported driver, compounds and a tire age of 0–60 laps.');
    requireValue(Array.isArray(s.rivals) && s.rivals.length >= 1 && s.rivals.length <= 5 && new Set([s.driver, ...s.rivals.map(r => r.driver)]).size === s.rivals.length + 1, 'Choose one to five different rival drivers.');
    for (const r of s.rivals)
        requireValue(model.drivers.includes(r.driver) && finite(r.gap, -60, 120) && Number.isInteger(r.age) && finite(r.age, 0, 60) && Number.isInteger(r.pit) && finite(r.pit, -1, s.laps - 1), 'Invalid rival: pit -1 means stay out; otherwise 0 through laps remaining minus 1.');
}
const wilson = (wins, n) => { const p = wins / n, z = 1.96, d = 1 + z * z / n, center = (p + z * z / (2 * n)) / d, width = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [Math.max(0, center - width), Math.min(1, center + width)]; };
// A nominal model trace is distinct from the uncertain Monte Carlo outcomes.
export function raceProfile(model, scenario, driver, age, wait, compound, service) {
    validateScenario(model, scenario);
    requireValue(model.drivers.includes(driver) && finite(age, 0, 60) && Number.isInteger(wait) && finite(wait, -1, scenario.laps - 1) && model.compounds.includes(compound) && finite(service, .1, 60), 'Invalid replay plan.');
    let clock = 0;
    const laps = Array.from({ length: scenario.laps }, (_, index) => {
        const stopped = wait >= 0 && index >= wait, tire = stopped ? compound : scenario.current, tireAge = stopped ? index - wait + 1 : age + index + 1;
        const start = clock, hold = index === wait ? scenario.transitLoss + service + scenario.traffic : 0;
        const seconds = predict(model, { driver, age: tireAge, compound: tire, lap: scenario.lap + index });
        clock += hold + seconds;
        return { lap: scenario.lap + index, index, start, pitEnd: start + hold, end: clock, seconds, compound: tire, age: tireAge };
    });
    return { driver, wait, compound, laps, duration: clock };
}
export function raceFrame(profile, time) {
    requireValue(Number.isFinite(time), 'Invalid replay clock.');
    const row = profile.laps.find(lap => time < lap.end) ?? profile.laps.at(-1);
    const finished = time >= profile.duration, pit = time >= row.start && time < row.pitEnd;
    const fraction = Math.max(0, Math.min(1, (time - row.pitEnd) / row.seconds));
    return { lap: row.lap, age: row.age, compound: row.compound, progress: finished ? profile.laps.length : row.index + fraction, phase: finished ? 'FINISHED' : time < 0 ? 'START GAP' : pit ? 'PIT' : 'TRACK' };
}
export async function evaluateStrategies(model, scenario, { runs = 1500, seed = 42, serviceSamples = [2.6], yieldBatch = () => Promise.resolve() } = {}) {
    validateScenario(model, scenario);
    requireValue(Number.isInteger(runs) && finite(runs, 100, 5000) && Number.isInteger(seed) && finite(seed, 0, 4294967295), 'Use 100–5000 trials and a uint32 seed.');
    requireValue(serviceSamples.length > 0 && serviceSamples.length <= 1000 && serviceSamples.every(t => finite(t, .1, 60)), 'A completed safe pit service is required.');
    const s = scenario, random = seededRandom(seed), waits = [...new Set([0, 1, 2, Math.min(5, s.laps - 1)])];
    const rivalsOutside = s.rivals.some(r => Array.from({ length: s.laps }, (_, lap) => {
        const stopped = r.pit >= 0 && lap >= r.pit, tire = stopped ? s.next : s.current, age = stopped ? lap - r.pit + 1 : r.age + lap + 1;
        return age < model.support[tire].minAge || age > model.support[tire].maxAge;
    }).some(Boolean));
    const plans = [{ wait: -1, compound: s.current, label: 'Stay out' }, ...model.compounds.flatMap(compound => waits.map(wait => ({ wait, compound, label: `${wait ? `Box +${wait}` : 'Box now'} · ${compound.toLowerCase()}` })))].map(plan => ({ ...plan, wins: 0, margins: [], times: [], outside: false }));
    const drawResidual = () => model.residuals[Math.floor(random() * model.residuals.length)];
    for (let run = 0; run < runs; run++) {
        const weights = model.draws[Math.floor(random() * model.draws.length)], neutral = random() < s.scProbability ? Math.floor(random() * s.laps) : -99;
        const service = serviceSamples[Math.floor(random() * serviceSamples.length)];
        const noises = Array.from({ length: s.rivals.length + 1 }, () => Array.from({ length: Math.ceil(s.laps / 3) }, drawResidual));
        const elapsed = (driver, age, wait, compound, noiseIndex, plan) => {
            let total = 0;
            for (let lap = 0; lap < s.laps; lap++) {
                const stopped = wait >= 0 && lap >= wait, tire = stopped ? compound : s.current, tireAge = stopped ? lap - wait + 1 : age + lap + 1;
                if (plan && (tireAge < model.support[tire].minAge || tireAge > model.support[tire].maxAge))
                    plan.outside = true;
                const underSC = lap >= neutral && lap < neutral + 3;
                const pace = predict(model, { driver, compound: tire, age: tireAge, lap: s.lap + lap }, weights) + noises[noiseIndex][Math.floor(lap / 3)];
                total += pace * (underSC ? 1.4 : 1);
                if (lap === wait)
                    total += s.transitLoss * (underSC ? .55 : 1) + (noiseIndex === 0 ? service : s.rivalService) + s.traffic;
            }
            return total;
        };
        const rivals = s.rivals.map((r, i) => r.gap + elapsed(r.driver, r.age, r.pit, s.next, i + 1));
        const fastest = Math.min(...rivals);
        for (const plan of plans) {
            const total = elapsed(s.driver, s.age, plan.wait, plan.compound, 0, plan), margin = fastest - total;
            plan.times.push(total);
            plan.margins.push(margin);
            if (margin > 0)
                plan.wins++;
        }
        if (run % 100 === 99)
            await yieldBatch();
    }
    for (const p of plans) {
        p.probability = p.wins / runs;
        p.interval = wilson(p.wins, runs);
        p.medianTime = percentile(p.times.sort((a, b) => a - b), .5);
        p.margins.sort((a, b) => a - b);
        p.margin = [percentile(p.margins, .1), percentile(p.margins, .5), percentile(p.margins, .9)];
        delete p.times;
        delete p.margins;
    }
    plans.sort((a, b) => b.probability - a.probability || a.medianTime - b.medianTime);
    const now = plans.find(p => p.wait === 0 && p.compound === s.next);
    const warnings = [plans[0].outside && 'Leading plan extrapolates tire ages beyond training support.', rivalsOutside && 'Rival plans extrapolate tire ages beyond training support.', model.validation.mae >= model.validation.baselineMae && 'ML does not beat the constant-pace baseline on held-out laps; do not treat its ranking as validated.'].filter(Boolean);
    return { plans, runs, seed, scenario: s, rivalsOutside, service: { median: percentile([...serviceSamples].sort((a, b) => a - b), .5), min: Math.min(...serviceSamples), max: Math.max(...serviceSamples) }, uplift: plans[0].probability - now.probability, baseline: now.label, evidence: model.validation, source: model.data.session, warning: warnings.length ? warnings.join(' ') : 'Conditional scenario ranking; finishing first here means ahead of the entered rivals only.' };
}
