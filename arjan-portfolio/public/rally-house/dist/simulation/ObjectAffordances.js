const training = new Set(['basket', 'ballHopper', 'coneSet', 'racketRack', 'scoreboard', 'tennisBag']);
const social = new Set(['bench', 'cafeTable', 'stool', 'sideTable']);
const care = new Set(['plant', 'planter', 'towelRack']);
export class ObjectAffordances {
    objects = {};
    sequence = 0;
    sync(placements, day) {
        const used = new Set();
        for (const p of placements) {
            if (!p.id || used.has(p.id))
                p.id = `furniture-${++this.sequence}`;
            used.add(p.id);
            this.objects[p.id] ??= { placedDay: day, visits: {}, memories: [], favoriteOf: [] };
        }
        for (const id of Object.keys(this.objects))
            if (!used.has(id))
                delete this.objects[id];
    }
    affordances(p) { return social.has(p.type) ? ['sit', 'spectate', 'talk'] : care.has(p.type) ? ['admire', 'tend'] : training.has(p.type) ? ['stretch', 'practice'] : p.type === 'trophy' ? ['admire', 'remember'] : ['quiet-break']; }
    choose(placements, person) {
        return [...placements].sort((a, b) => this.score(b, person) - this.score(a, person))[0];
    }
    score(p, id) { const visits = this.objects[p.id ?? '']?.visits[id] ?? 0; return Math.min(6, visits) * 2 + (social.has(p.type) ? (id === 'nia' ? 8 : 5) : care.has(p.type) ? (id === 'nia' || id === 'leo' ? 6 : 2) : training.has(p.type) ? (id === 'mika' ? 7 : 2) : 3); }
    visit(id, people, day, quality = 1) { const h = this.objects[id]; if (!h)
        return; h.comfort ??= {}; h.usageCount = (h.usageCount ?? 0) + people.length; for (const person of people) {
        h.visits[person] = Math.min(999, (h.visits[person] ?? 0) + 1);
        h.comfort[person] = Math.min(20, (h.comfort[person] ?? 0) + Math.max(0, Math.min(1, quality)));
        if (h.visits[person] >= 3 && h.comfort[person] >= 2.5 && !h.favoriteOf.includes(person)) {
            h.favoriteOf.push(person);
            h.importantEvents ??= [];
            h.importantEvents.push(`Day ${day} · ${person} made this a favorite.`);
        }
    } h.memories.unshift(`Day ${day} · ${people.join(' and ')} spent time here.`); h.memories = h.memories.slice(0, 6); }
    moved(id) { const h = this.objects[id]; if (!h)
        return 0; return h.revision = (h.revision ?? 0) + 1; }
    serialize() { return JSON.parse(JSON.stringify({ objects: this.objects, sequence: this.sequence })); }
    load(s) {
        if (!s)
            return;
        if (!s.objects || typeof s.objects !== 'object' || Array.isArray(s.objects) || !Number.isSafeInteger(s.sequence) || s.sequence < 0)
            throw Error('Object history is invalid.');
        const counts = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.entries(v).every(([k, n]) => ['coach', 'mika', 'leo', 'nia', 'player'].includes(k) && typeof n === 'number' && Number.isFinite(n) && n >= 0);
        const strings = (v) => Array.isArray(v) && v.every(x => typeof x === 'string');
        for (const h of Object.values(s.objects)) {
            if (!h || !Number.isFinite(h.placedDay) || !counts(h.visits) || !strings(h.memories) || !Array.isArray(h.favoriteOf) || !h.favoriteOf.every(v => ['coach', 'mika', 'leo', 'nia', 'player'].includes(v)) || (h.comfort !== undefined && !counts(h.comfort)) || (h.usageCount !== undefined && (!Number.isSafeInteger(h.usageCount) || h.usageCount < 0)) || (h.revision !== undefined && (!Number.isSafeInteger(h.revision) || h.revision < 0)) || (h.importantEvents !== undefined && !strings(h.importantEvents)))
                throw Error('Object history is invalid.');
        }
        this.objects = structuredClone(s.objects);
        this.sequence = s.sequence;
        for (const h of Object.values(this.objects)) {
            h.comfort ??= { ...h.visits };
            h.usageCount ??= Object.values(h.visits).reduce((a, b) => a + b, 0);
            h.importantEvents ??= [];
            h.revision ??= 0;
        }
    }
}
