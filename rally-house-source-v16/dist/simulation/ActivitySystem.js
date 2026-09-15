/** Reservations belong to the transaction, including travel and reaction time. */
export class ActivitySystem {
    active = [];
    history = [];
    sequence = 0;
    busy(id) { return this.active.some(a => a.participants.includes(id)); }
    reserved(resource) { return this.active.some(a => a.resource === resource); }
    begin(kind, participants, resource, detail = '') {
        if (!participants.length || new Set(participants).size !== participants.length || !resource)
            return null;
        if (this.reserved(resource) || participants.some(id => this.busy(id)))
            return null;
        const a = { id: `activity-${++this.sequence}`, kind, participants: [...participants], resource, phase: 'traveling', elapsed: 0, phaseTime: 0, detail };
        this.active.push(a);
        return a;
    }
    transition(a, phase) {
        const legal = { traveling: ['starting', 'interrupted', 'cancelled'], starting: ['active', 'interrupted', 'cancelled'], active: ['resolving', 'interrupted', 'cancelled'], resolving: ['completed', 'interrupted'], completed: [], interrupted: [], cancelled: [] };
        if (!this.active.includes(a) || !legal[a.phase].includes(phase))
            return false;
        a.phase = phase;
        a.phaseTime = 0;
        return true;
    }
    tick(dt) { if (!Number.isFinite(dt) || dt <= 0)
        return; for (const a of this.active) {
        a.elapsed += dt;
        a.phaseTime += dt;
    } }
    finish(a, result, consequence) {
        if (a.phase !== 'resolving' || !this.active.includes(a))
            return false;
        // Consequences are synchronous and saved together with the completed receipt.
        consequence();
        a.result = result;
        this.transition(a, 'completed');
        this.release(a);
        return true;
    }
    cancel(a, reason) { if (!this.transition(a, 'interrupted'))
        return; a.result = reason; this.release(a); }
    release(a) { this.active = this.active.filter(v => v !== a); this.history.unshift({ ...a, participants: [...a.participants] }); this.history = this.history.slice(0, 48); }
    serialize() { return { sequence: this.sequence, history: this.history.map(a => ({ ...a, participants: [...a.participants] })) }; }
    load(s) { this.active = []; this.sequence = s?.sequence ?? 0; this.history = (s?.history ?? []).slice(0, 48); }
}
