/**
 * Small deterministic planner for low-stakes club life.
 * It deliberately does not create activities itself; Game owns reservations and consequences.
 * The planner balances relationship warmth, place preference, novelty, and recent-pair repetition.
 */
export class AmbientSocialPlanner {
    choose(ids, placements, affordances, relations, busy, recentPairs, absoluteMinute) {
        const free = ids.filter(id => !busy.has(id));
        if (free.length < 2)
            return null;
        let best = null;
        for (const host of free) {
            const object = placements.length ? affordances.choose(placements, host) : undefined;
            for (const companion of free) {
                if (companion === host)
                    continue;
                const pair = [host, companion].sort().join('|');
                const social = relations.behaviorBias(host, companion).seekCompany;
                const history = object?.id ? affordances.objects[object.id] : undefined;
                const hostVisits = history?.visits[host] ?? 0, companionVisits = history?.visits[companion] ?? 0;
                const novelty = Math.max(0, 5 - Math.min(5, hostVisits + companionVisits)) * 0.65;
                const preferred = (history?.favoriteOf.includes(host) ? 2.2 : 0) + (history?.favoriteOf.includes(companion) ? 1.2 : 0);
                const recentCount = recentPairs.filter(p => p === pair).length;
                const roleBias = host === 'nia' ? 1.3 : host === 'mika' ? 0.7 : host === 'leo' ? 0.45 : 0.35;
                const deterministic = this.jitter(`${host}:${companion}:${object?.id ?? 'cafe'}:${Math.floor(absoluteMinute / 30)}`) * 1.15;
                const score = social * 8 + novelty + preferred + roleBias + deterministic - recentCount * 4.5;
                if (!best || score > best.score)
                    best = { host, companion, object, score };
            }
        }
        return best;
    }
    jitter(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    } return ((h >>> 0) % 1000) / 1000; }
}
//# sourceMappingURL=AmbientSocialPlanner.js.map