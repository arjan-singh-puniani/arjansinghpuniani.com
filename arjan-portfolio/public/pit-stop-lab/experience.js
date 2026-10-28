export function watchShot(sim, time) {
    const stop = sim.stops.findLast(s => time >= s.stopAt - .3) ?? sim.stops[0];
    if (time < stop.stopAt - .3) return { camera: 'release', label: 'Approach → braking marks' };
    if (time < stop.stopAt + .65) return { camera: 'top', label: 'Position → lift → four crews in parallel' };
    if (time < stop.mechanicalEnd) return { camera: stop.criticalCorner, label: `${stop.criticalCorner} → limiting wheel service` };
    if (stop.held) return { camera: 'RR', label: 'HOLD → retention not confirmed' };
    if (time < stop.releaseAt) return { camera: 'release', label: 'Tools clear → lower → release guard' };
    return { camera: 'follow', label: 'Safe release → accelerate out' };
}
