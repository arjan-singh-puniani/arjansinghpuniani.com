import { CORNERS, clamp } from './simulation.js';
/** Read-only operational view of the authoritative schedule, shared by scene labels and UI. */
export function operations(sim, state) {
    const car = state.cars[state.activeCar - 1], stop = sim.stops[state.activeCar - 1], now = state.time;
    const wheelStates = CORNERS.map(key => ({ key, ...car.corners[key] }));
    const busy = wheelStates.filter(c => now >= stop.ready.start && !c.complete);
    const stages = [['Arrival', 0, stop.stopAt], ['Lift', stop.stopAt, Math.max(stop.front.end, stop.rear.end)], ['Four-corner service', Math.max(stop.front.end, stop.rear.end), stop.mechanicalEnd], ['Clear & verify', stop.mechanicalEnd, stop.releaseAt ?? sim.duration], ['Departure', stop.releaseAt ?? sim.duration, stop.releaseAt === null ? sim.duration : Math.min(sim.duration, stop.releaseAt + sim.exitDuration)]];
    const pipeline = stages.map(([name, start, end]) => { const blocked = stop.held && (name === 'Departure' || name === 'Clear & verify'); return { name, start, end, progress: blocked ? 0 : clamp((now - start) / Math.max(.001, end - start), 0, 1), status: blocked ? 'blocked' : now >= end ? 'complete' : now >= start ? 'active' : 'pending' }; });
    const removed = state.cars.reduce((sum, s) => sum + Object.values(s.corners).filter(c => c.removal === 1).length, 0);
    const installed = state.cars.reduce((sum, s) => sum + Object.values(s.corners).filter(c => c.incomingInstalled).length, 0);
    const inventory = { allocated: sim.stops.length * 4, replacementsRemaining: sim.stops.length * 4 - installed, fitted: installed, removed };
    const activeEvents = sim.events.filter(e => now >= e.start && now < e.end);
    const critical = new Set(stop.criticalIds);
    const blocking = activeEvents.filter(e => critical.has(e.id)).at(-1);
    const status = car.released ? 'RELEASED' : stop.held && now >= stop.mechanicalEnd ? 'SAFETY HOLD' : car.phase === 'RELEASE CHECK' && !car.safety.pathClear ? 'TRAFFIC HOLD' : car.phase;
    return { car: car.number, status, activeStations: busy.length, activeCrew: busy.length * 3 + (car.frontLift > 0 ? 1 : 0) + (car.rearLift > 0 ? 1 : 0), secured: wheelStates.filter(c => c.secured).length,
        pipeline, inventory, blocking: blocking ? { track: blocking.track, state: blocking.state, remaining: Math.max(0, blocking.end - now) } : null,
        corners: wheelStates.map(c => { const schedule = stop.corners[c.key]; const task = schedule.events.find(e => now >= e.start && now < e.end); return { key: c.key, state: c.state, secured: c.secured, critical: stop.criticalCorner === c.key, remaining: task ? task.end - now : 0, slack: stop.slack[c.key], progress: clamp((now - schedule.events[0].start) / (schedule.events.at(-1).end - schedule.events[0].start), 0, 1) }; }),
        release: { ...car.safety, approved: car.released, scheduled: stop.releaseAt, wait: stop.releaseAt === null ? null : Math.max(0, stop.releaseAt - now) },
        queueWait: sim.queue && now >= sim.queue.arrival && now < sim.queue.begin ? Math.min(sim.queue.wait, now - sim.queue.arrival) : 0,
    };
}
