/** Exact-event, seeded simulation. Units: metres, seconds, m/s, m/s². No DOM or WebGL. */
export const CORNERS = ['FL', 'FR', 'RL', 'RR'];
export const SCENARIOS = {
    coordinated: { name: 'Coordinated stop', note: 'Four independent crews work in parallel. The last safe dependency determines departure.' },
    gun: { name: 'Slow wheel gun', note: 'Front-right fastener operations take an extra 0.45 s each.' },
    alignment: { name: 'Misaligned replacement', note: 'Rear-right alignment requires a visible correction, costing 0.65 s.' },
    position: { name: 'Missed stopping marks', note: 'A 0.45 m overshoot makes every crew reposition before engagement.' },
    traffic: { name: 'Conflicting traffic', note: 'The release controller holds until the passing car and the configured gap have cleared.' },
    stack: { name: 'Double stack', note: 'Car 02 queues behind Car 01. The shared box becomes available only after Car 01 clears it.' },
    unsecured: { name: 'Unsecured wheel · safety hold', note: 'Rear-right retention is unconfirmed. Jacks stay engaged and the car never receives a release.' },
};
// Every value is an illustrative teaching default, not measured team telemetry.
export const PARAMETERS = {
    approachSpeed: ['Approach speed', 60, 30, 80, 1, 'km/h', 'Arrival'],
    deceleration: ['Braking capability', 12, 5, 18, .5, 'm/s²', 'Arrival'],
    driverResponse: ['Braking response', .22, .05, .6, .01, 's', 'Arrival'],
    stopError: ['Stop-position error', .03, 0, .7, .01, 'm', 'Arrival'],
    positioning: ['Position settling', .08, .02, .4, .01, 's', 'Arrival'],
    engagement: ['Gun alignment', .20, .08, .6, .01, 's', 'Wheel service'],
    fastener: ['Fastener operation', .30, .15, .8, .01, 's', 'Wheel service'],
    removal: ['Old-wheel extraction', .35, .15, .8, .01, 's', 'Wheel service'],
    alignment: ['Replacement alignment', .36, .15, .9, .01, 's', 'Wheel service'],
    installation: ['Wheel installation', .18, .08, .5, .01, 's', 'Wheel service'],
    variability: ['Per-task variability', .06, 0, .3, .01, 'fraction', 'Wheel service'],
    rrDelay: ['Rear-right extra alignment', 0, 0, 1.5, .05, 's', 'Wheel service'],
    frontJack: ['Front-jack engagement', .22, .1, .7, .01, 's', 'Jacks & crew'],
    rearJack: ['Rear-jack engagement', .26, .1, .7, .01, 's', 'Jacks & crew'],
    jackRelease: ['Jack release', .20, .1, .6, .01, 's', 'Jacks & crew'],
    reaction: ['Crew reaction', .10, .04, .4, .01, 's', 'Jacks & crew'],
    coordination: ['Corner reaction variation', .04, 0, .25, .01, 's', 'Jacks & crew'],
    clearance: ['Equipment clearance', .24, .1, .7, .01, 's', 'Jacks & crew'],
    confirmation: ['Release confirmation', .12, .05, .6, .01, 's', 'Jacks & crew'],
    arrivalSpacing: ['Second-car spacing', 1.6, .8, 10, .1, 's', 'Traffic'],
    occupancy: ['Box reset after clearance', .25, 0, 2, .05, 's', 'Traffic'],
    trafficAt: ['Traffic arrival after stop', 2.5, 0, 7, .1, 's', 'Traffic'],
    trafficWindow: ['Traffic conflict duration', 1.5, .5, 3, .1, 's', 'Traffic'],
    releaseGap: ['Required release gap', .5, .2, 2, .1, 's', 'Traffic'],
};
export const DEFAULTS = Object.fromEntries(Object.entries(PARAMETERS).map(([key, spec]) => [key, spec[1]]));
export function configuration(input = {}) {
    const config = { ...DEFAULTS, scenario: 'coordinated', seed: 42, ...input };
    if (!Object.hasOwn(SCENARIOS, config.scenario))
        throw new RangeError('Unknown scenario');
    if (!Number.isInteger(config.seed) || config.seed < 0 || config.seed > 4294967295)
        throw new RangeError('Seed must be a uint32');
    for (const [key, [, , min, max]] of Object.entries(PARAMETERS)) {
        if (!Number.isFinite(config[key]) || config[key] < min || config[key] > max)
            throw new RangeError(`${key} must be between ${min} and ${max}`);
    }
    return config;
}
export function seededRandom(seed) {
    let value = seed >>> 0;
    return () => { value = (value + 0x6D2B79F5) >>> 0; let n = value; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
export function simulate(input = {}) {
    const config = configuration(input), random = seededRandom(config.seed);
    const events = [], byId = new Map();
    const add = (id, track, state, duration, deps = [], earliest = 0, car = 1) => {
        const start = Math.max(earliest, ...deps.map(id => byId.get(id).end));
        const event = { id, track, state, start, end: start + duration, duration, deps, car };
        events.push(event);
        byId.set(id, event);
        return event;
    };
    const variable = duration => duration * (1 + (random() + random() - 1) * config.variability);
    const speed = config.approachSpeed / 3.6;
    const approachDuration = config.driverResponse + speed / config.deceleration;
    const approachDistance = speed * config.driverResponse + speed * speed / (2 * config.deceleration);
    const exitDistance = 30, exitAcceleration = 8;
    const accelerationTime = speed / exitAcceleration;
    const exitDuration = exitDistance <= speed * speed / (2 * exitAcceleration) ? Math.sqrt(2 * exitDistance / exitAcceleration) : accelerationTime + (exitDistance - speed * speed / (2 * exitAcceleration)) / speed;
    const stops = [];
    function service(number, stopAt) {
        const prefix = `car${number}`, id = name => `${prefix}-${name}`;
        const stop = add(id('stop'), 'Arrival', 'STOPPED', 0, [], stopAt, number);
        const error = config.scenario === 'position' ? Math.max(.45, config.stopError) : config.stopError;
        const ready = add(id('ready'), 'Arrival', 'POSITIONING', config.positioning + error / 1.5 + config.reaction, [stop.id, 'preparation'], 0, number);
        const front = add(id('front-up'), 'Front jack', 'LIFT', config.frontJack, [stop.id], 0, number);
        const rear = add(id('rear-up'), 'Rear jack', 'LIFT', config.rearJack, [stop.id], 0, number);
        const corners = {};
        for (const corner of CORNERS) {
            const task = (name, duration, deps) => add(id(`${corner}-${name}`), corner, name, duration, deps, 0, number);
            const reaction = task('READY', random() * config.coordination, [ready.id]);
            const approach = task('GUN_APPROACH', variable(config.engagement), [reaction.id]);
            const engaged = task('SOCKET_ENGAGED', .04, [approach.id]);
            const gunDelay = config.scenario === 'gun' && corner === 'FR' ? .45 : 0;
            const loosen = task('LOOSENING', variable(config.fastener) + gunDelay, [engaged.id, front.id, rear.id]);
            const released = task('NUT_RELEASED', .03, [loosen.id]);
            const remove = task('WHEEL_REMOVAL', variable(config.removal) * .7, [released.id]);
            const clear = task('WHEEL_CLEAR', variable(config.removal) * .3, [remove.id]);
            const correction = (config.scenario === 'alignment' && corner === 'RR' ? .65 : 0) + (corner === 'RR' ? config.rrDelay : 0);
            const align = task('REPLACEMENT_ALIGNMENT', variable(config.alignment) + correction, [clear.id]);
            const install = task('WHEEL_INSTALLED', variable(config.installation), [align.id]);
            const tighten = task('TIGHTENING', variable(config.fastener) + gunDelay, [install.id]);
            const confirmed = task('FASTENING_CONFIRMED', .06, [tighten.id]);
            const toolClear = task('TOOL_CLEAR', variable(config.clearance) * .7, [confirmed.id]);
            const complete = task('COMPLETE', variable(config.clearance) * .3, [toolClear.id]);
            corners[corner] = { corner, events: [reaction, approach, engaged, loosen, released, remove, clear, align, install, tighten, confirmed, toolClear, complete], correction, secured: !(config.scenario === 'unsecured' && corner === 'RR') };
        }
        const completions = CORNERS.map(corner => corners[corner].events.at(-1));
        const last = completions.reduce((a, b) => a.end >= b.end ? a : b);
        const mechanicalEnd = Math.max(...CORNERS.map(c => corners[c].events[10].end));
        const held = config.scenario === 'unsecured';
        let release = null, frontDown = null, rearDown = null, traffic = null;
        if (!held) {
            const deps = completions.map(event => event.id);
            frontDown = add(id('front-down'), 'Front jack', 'LOWER & CLEAR', config.jackRelease, deps, 0, number);
            rearDown = add(id('rear-down'), 'Rear jack', 'LOWER & CLEAR', config.jackRelease, deps, 0, number);
            const confirm = add(id('confirmation'), 'Safety', 'VERIFY RELEASE', config.confirmation, [frontDown.id, rearDown.id], 0, number);
            let releaseDeps = [confirm.id];
            if (config.scenario === 'traffic') {
                const start = stopAt + config.trafficAt, end = start + config.trafficWindow;
                traffic = { start, end };
                if (confirm.end + config.releaseGap > start && confirm.end < end + config.releaseGap) {
                    const wait = add(id('traffic-hold'), 'Safety', 'TRAFFIC HOLD', end + config.releaseGap - confirm.end, [confirm.id], 0, number);
                    releaseDeps = [wait.id];
                }
            }
            release = add(id('release'), 'Safety', 'RELEASE', 0, releaseDeps, 0, number);
            add(id('exit'), 'Arrival', 'DEPARTURE', exitDuration, [release.id], 0, number);
        }
        else
            add(id('safety-hold'), 'Safety', 'HOLD · RR UNSECURED', 3, [last.id], 0, number);
        const criticalIds = new Set();
        let node = byId.get(held ? id('safety-hold') : id('release'));
        while (node) {
            criticalIds.add(node.id);
            node = node.deps.length ? node.deps.map(id => byId.get(id)).reduce((a, b) => a.end >= b.end ? a : b) : null;
        }
        const criticalCorner = last.track;
        const result = { number, stopAt, error, ready, front, rear, frontDown, rearDown, corners, releaseAt: release?.end ?? null, mechanicalEnd, criticalCorner, criticalIds: [...criticalIds], traffic, held,
            stationary: release ? release.end - stopAt : null, serviceDuration: mechanicalEnd - ready.start,
            slack: Object.fromEntries(completions.map(event => [event.track, last.end - event.end])) };
        stops.push(result);
        return result;
    }
    add('preparation', 'Preparation', 'REPLACEMENTS READY', Math.min(.9, approachDuration));
    add('approach', 'Arrival', 'BRAKING APPROACH', approachDuration);
    const first = service(1, approachDuration);
    let queue = null;
    if (config.scenario === 'stack') {
        const arrival = first.stopAt + config.arrivalSpacing;
        // The rear of a 5.6 m car must pass the next car's front before box occupation.
        const available = first.releaseAt + Math.sqrt(2 * 7 / exitAcceleration) + config.occupancy;
        const transfer = .9;
        const begin = Math.max(arrival, available);
        queue = { arrival, begin, end: begin + transfer, wait: begin - arrival };
        add('car2-queue', 'Arrival', 'CAR 02 QUEUE', queue.wait, [], arrival, 2);
        add('car2-transfer', 'Arrival', 'CAR 02 TO BOX', transfer, [], begin, 2);
        service(2, queue.end);
    }
    events.sort((a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id));
    const duration = Math.max(...events.map(event => event.end));
    const target = stops.at(-1);
    const stationary = target.stationary;
    const transit = approachDuration + exitDuration + (queue ? .9 : 0);
    const reference = (approachDistance + exitDistance) / 55;
    return { config, events, stops, queue, duration, approachDuration, approachDistance, exitDuration, exitDistance, speed, exitAcceleration,
        result: { status: target.held ? 'SAFETY HOLD' : 'SAFE RELEASE', stationary, serviceDuration: target.serviceDuration, transit,
            queueWait: queue?.wait ?? 0, total: stationary === null ? null : transit + stationary + (queue?.wait ?? 0),
            raceLoss: stationary === null ? null : transit + stationary + (queue?.wait ?? 0) - reference, reference, criticalCorner: target.criticalCorner } };
}
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const progress = (time, start, end) => end <= start ? Number(time >= end) : clamp((time - start) / (end - start), 0, 1);
export function cornerSnapshot(corner, time) {
    const events = corner.events;
    const current = events.find(event => time < event.end) ?? events.at(-1);
    const event = state => events.find(event => event.state === state);
    const removal = progress(time, event('WHEEL_REMOVAL').start, event('WHEEL_CLEAR').end);
    const alignment = progress(time, event('REPLACEMENT_ALIGNMENT').start, event('REPLACEMENT_ALIGNMENT').end);
    const installation = progress(time, event('WHEEL_INSTALLED').start, event('WHEEL_INSTALLED').end);
    const incomingInstalled = time >= event('WHEEL_INSTALLED').end;
    const outgoingInstalled = time < event('WHEEL_REMOVAL').start;
    const installed = incomingInstalled || outgoingInstalled;
    const secured = time < event('LOOSENING').start || (corner.secured && time >= event('FASTENING_CONFIRMED').end);
    const toolClear = progress(time, event('TOOL_CLEAR').start, events.at(-1).end);
    const gunApproach = progress(time, event('GUN_APPROACH').start, event('GUN_APPROACH').end);
    const retreat = progress(time, event('NUT_RELEASED').end, event('WHEEL_CLEAR').end);
    const gun = time < event('REPLACEMENT_ALIGNMENT').start ? gunApproach * (1 - retreat) : installation * (1 - toolClear);
    const gunActive = current.state === 'LOOSENING' || current.state === 'TIGHTENING';
    return { corner: corner.corner, state: time < events[0].start ? 'READY' : (!corner.secured && time >= event('FASTENING_CONFIRMED').start ? 'UNSECURED' : current.state), removal, alignment, installation, installed, incomingInstalled, outgoingInstalled, secured, toolClear, gun, gunActive,
        complete: time >= events.at(-1).end, loosen: progress(time, event('LOOSENING').start, event('LOOSENING').end), tighten: progress(time, event('TIGHTENING').start, event('TIGHTENING').end), correction: corner.correction,
        crew: { task: current.state, clear: toolClear === 1 }, tool: { engaged: gun > .99, operating: gunActive, clear: toolClear === 1 } };
}
export function snapshot(sim, requestedTime) {
    if (!Number.isFinite(requestedTime))
        throw new RangeError('Time must be finite');
    const time = clamp(requestedTime, 0, sim.duration);
    const cars = sim.stops.map(stop => {
        const corners = Object.fromEntries(CORNERS.map(c => [c, cornerSnapshot(stop.corners[c], time)]));
        let position = stop.error, speed = 0, acceleration = 0, phase = 'SERVICE';
        const approach = t => {
            if (t < sim.config.driverResponse)
                return { position: sim.approachDistance - sim.speed * t, speed: sim.speed, acceleration: 0 };
            const brake = t - sim.config.driverResponse;
            return { position: Math.max(0, .5 * sim.config.deceleration * (sim.speed / sim.config.deceleration - brake) ** 2), speed: Math.max(0, sim.speed - sim.config.deceleration * brake), acceleration: -sim.config.deceleration };
        };
        if (time < stop.stopAt) {
            phase = 'APPROACH';
            if (stop.number === 1)
                ({ position, speed, acceleration } = approach(time));
            else {
                const q = sim.queue;
                if (time < q.arrival) {
                    const remaining = q.arrival - time, brakeTime = sim.speed / sim.config.deceleration;
                    if (remaining < brakeTime) {
                        position = 9 + .5 * sim.config.deceleration * remaining * remaining;
                        speed = sim.config.deceleration * remaining;
                        acceleration = -sim.config.deceleration;
                    }
                    else {
                        position = 9 + sim.speed * sim.speed / (2 * sim.config.deceleration) + sim.speed * (remaining - brakeTime);
                        speed = sim.speed;
                    }
                }
                else if (time < q.begin) {
                    position = 9;
                    phase = 'QUEUED';
                }
                else {
                    const u = progress(time, q.begin, q.end);
                    position = 9 * (1 - u * u * (3 - 2 * u));
                    speed = 54 * u * (1 - u) / (q.end - q.begin);
                    acceleration = 54 * (1 - 2 * u) / (q.end - q.begin) ** 2;
                }
            }
            position -= stop.error;
        }
        else if (stop.releaseAt !== null && time >= stop.releaseAt) {
            phase = 'DEPARTURE';
            const elapsed = time - stop.releaseAt, ramp = Math.min(elapsed, sim.speed / sim.exitAcceleration);
            speed = Math.min(sim.speed, sim.exitAcceleration * elapsed);
            acceleration = ramp === elapsed ? sim.exitAcceleration : 0;
            position = -stop.error - .5 * sim.exitAcceleration * ramp * ramp - sim.speed * Math.max(0, elapsed - ramp);
        }
        else {
            position = -stop.error;
            if (stop.held && time >= stop.mechanicalEnd)
                phase = 'SAFETY HOLD';
            else if (time >= stop.mechanicalEnd)
                phase = 'RELEASE CHECK';
        }
        const lift = (up, down) => .1 * progress(time, up.start, up.end) * (1 - (down ? progress(time, down.start, down.end) : 0));
        const frontLift = lift(stop.front, stop.frontDown), rearLift = lift(stop.rear, stop.rearDown);
        const wheelsSafe = Object.values(corners).every(c => c.secured), toolsClear = Object.values(corners).every(c => c.toolClear === 1);
        const jacksClear = Boolean(stop.frontDown && time >= stop.frontDown.end && time >= stop.rearDown.end);
        const departed = stop.releaseAt !== null && time >= stop.releaseAt;
        const pathClear = departed || !stop.traffic || time < stop.traffic.start - sim.config.releaseGap || time >= stop.traffic.end + sim.config.releaseGap;
        const guard = wheelsSafe && toolsClear && jacksClear && pathClear;
        return { number: stop.number, phase, position, speed, acceleration, frontLift, rearLift, lift: (frontLift + rearLift) / 2, corners, guard,
            safety: { wheelsSafe, toolsClear, crewClear: toolsClear, jacksClear, pathClear }, released: stop.releaseAt !== null && time >= stop.releaseAt && guard };
    });
    const activeStop = sim.stops.filter(stop => time >= stop.stopAt).at(-1) ?? sim.stops[0];
    const active = cars[activeStop.number - 1];
    const traffic = sim.stops[0].traffic;
    return { time, cars, activeCar: active.number, phase: active.phase, traffic: traffic ? { visible: true, position: -(time - (traffic.start + traffic.end) / 2) * sim.speed } : { visible: false, position: 0 } };
}
export function telemetry(sim, count = 160) {
    return Array.from({ length: count + 1 }, (_, i) => {
        const state = snapshot(sim, sim.duration * i / count), car = state.cars.at(-1);
        return { time: state.time, speed: car.speed, acceleration: car.acceleration, position: car.position, lift: car.lift, secured: Object.values(car.corners).filter(c => c.secured).length, gunOccupancy: Object.values(car.corners).filter(c => c.gunActive).length };
    });
}
export function percentile(sorted, fraction) { const index = (sorted.length - 1) * fraction, lo = Math.floor(index); return sorted[lo] + (sorted[Math.ceil(index)] - sorted[lo]) * (index - lo); }
export async function monteCarlo(input, { runs = 1000, threshold = 3, yieldBatch = () => new Promise(resolve => setTimeout(resolve, 0)) } = {}) {
    if (!Number.isInteger(runs) || runs < 100 || runs > 10000 || !Number.isFinite(threshold) || threshold <= 0)
        throw new RangeError('Invalid batch size or threshold');
    const config = configuration(input), times = [], bottlenecks = Object.fromEntries(CORNERS.map(c => [c, 0]));
    let holds = 0;
    for (let i = 0; i < runs; i++) {
        const result = simulate({ ...config, seed: (config.seed + i) >>> 0 }).result;
        if (result.stationary === null)
            holds++;
        else
            times.push(result.stationary);
        bottlenecks[result.criticalCorner]++;
        if (i % 40 === 39)
            await yieldBatch();
    }
    times.sort((a, b) => a - b);
    return { runs, holds, median: times.length ? percentile(times, .5) : null, p10: times.length ? percentile(times, .1) : null, p90: times.length ? percentile(times, .9) : null, exceeding: (holds + times.filter(t => t > threshold).length) / runs, times, bottlenecks };
}
export function sensitivity(config, key, delta) {
    if (!Object.hasOwn(PARAMETERS, key) || !Number.isFinite(delta))
        throw new RangeError('Invalid sensitivity parameter');
    const [, , min, max] = PARAMETERS[key];
    const before = simulate(config), after = simulate({ ...config, [key]: clamp(config[key] + delta, min, max) });
    return { before: before.result, after: after.result, change: before.result.stationary === null || after.result.stationary === null ? null : after.result.stationary - before.result.stationary };
}
// shortcut: linear synthetic tire wear, calibrate against circuit data before making real race predictions.
export function strategy(sim, { laps = 8, age = 12, gap = 22, compound = 'medium', pace = 90, degradation = .07 } = {}) {
    if (![laps, age, gap, pace, degradation].every(Number.isFinite) || laps < 2 || age < 0 || pace <= 0 || degradation < 0)
        throw new RangeError('Invalid strategy inputs');
    const compounds = { soft: { offset: -.6, wear: 1.6 }, medium: { offset: 0, wear: 1 }, hard: { offset: .5, wear: .65 } };
    if (!compounds[compound])
        throw new RangeError('Invalid compound');
    if (sim.result.raceLoss === null)
        return [];
    return [0, 1, 2].map(wait => {
        let elapsed = sim.result.raceLoss;
        const splits = [];
        for (let lap = 0; lap < laps; lap++) {
            const tire = compounds[compound];
            const lapTime = lap < wait ? pace + degradation * (age + lap) : pace + tire.offset + degradation * tire.wear * (lap - wait) + (lap === wait ? .35 : 0);
            elapsed += lapTime;
            splits.push(lapTime);
        }
        const competitor = laps * (pace + .15);
        return { wait, elapsed, splits, exitGap: gap + competitor - elapsed, compound };
    });
}
