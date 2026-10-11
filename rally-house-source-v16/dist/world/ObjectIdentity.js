import { CLUB_TOUCHES } from '../simulation/ClubInteractions.js';
const observe = { id: 'observe', title: 'Observe', detail: 'Follow the branches. Take a thoughtful breath.', animation: 'watch', effect: 'leaves', prop: null, seconds: 3.8, gesture: 'think' };
const water = { id: 'water', title: 'Water', detail: 'A small pour into the soil. Then let it drink.', animation: 'watch', effect: 'bonsai', prop: 'wateringCan', seconds: 3, gesture: 'offer', water: true };
const action = (id, touch) => ({ id, ...touch });
export const OBJECT_ACTIONS = {
    performanceLab: [{ id: 'analyze', title: 'See the movement', detail: 'Walk to the instrument. Replay court paths and body joints.', animation: 'watch', effect: 'read', prop: null, seconds: 1.0, gesture: 'point' }],
    bonsai: [observe, water], plant: [{ ...observe, detail: 'Notice the shape and the moving leaves.' }, water],
    clock: [{ id: 'inspect', title: 'Play with the mechanism', detail: 'A tiny exploded view. Every piece finds its way home.', animation: 'watch', effect: 'clock', prop: null, seconds: 3.5, gesture: 'think', assembly: true }],
    board: [{ id: 'read', title: 'Read', detail: 'Look at the club’s board and remembered moments.', animation: 'watch', effect: 'read', prop: null, seconds: 2.8, gesture: 'think' },
        { id: 'sketch', title: 'Sketch a crosscourt arrow', detail: 'Leave a small tennis diagram on the board.', animation: 'watch', effect: 'sketch', prop: null, seconds: 2.5, gesture: 'point', sketch: true },
        { id: 'erase', title: 'Erase your sketch', detail: 'Clear just the corner you drew in.', animation: 'watch', effect: 'sketch', prop: null, seconds: 2.3, gesture: 'point', erase: true }],
    reception: [action('ring', CLUB_TOUCHES.reception)], cafe: [action('sip', CLUB_TOUCHES.cafe)],
    equipment: [{ ...action('pluck', CLUB_TOUCHES.equipment), gesture: 'inspect' }],
    displayRackets: [{ id: 'inspect', title: 'Inspect the hanging frames', detail: 'Look up at their shapes and colours. The stringing bench has a frame you can reach.', animation: 'watch', effect: 'read', prop: null, seconds: 2.8, gesture: 'think' }],
    training: [action('feed', CLUB_TOUCHES.training)], water: [action('drink', CLUB_TOUCHES.water)],
    lounge: [{ ...action('sit', CLUB_TOUCHES.lounge), title: 'Sit' }, { ...action('watchSeat', CLUB_TOUCHES.lounge), title: 'Watch a rally from here', detail: 'Settle into this seat and follow the ball.', seconds: 10, watchCourt: true }], paper: [action('read', CLUB_TOUCHES.paper)],
    lamp: [{ id: 'light', title: 'Adjust the glow', detail: 'Turn the shade’s pool of light down or up.', animation: 'watch', effect: 'lamp', prop: null, seconds: 2, gesture: 'point' }],
    trophy: [{ id: 'inspect', title: 'Inspect the display', detail: 'Pause by the club’s small victories.', animation: 'watch', effect: 'read', prop: null, seconds: 2.6, gesture: 'think' }],
    gear: [{ id: 'inspect', title: 'Check your kit', detail: 'Look over the bags before your next match.', animation: 'watch', effect: 'read', prop: null, seconds: 2.3, gesture: 'inspect' }],
    supply: [{ id: 'inspect', title: 'Check the ball supply', detail: 'Look over the visible stack before the next practice.', animation: 'watch', effect: 'read', prop: null, seconds: 2.3, gesture: 'think' }],
    warmup: [{ id: 'stretch', ...CLUB_TOUCHES.lounge, title: 'Stretch', detail: 'A quiet shoulder stretch on the mat.', animation: 'stretch', seconds: 2.8 }],
    score: [{ id: 'read', title: 'Read the scoreboard', detail: 'Check the last completed court result.', animation: 'watch', effect: 'read', prop: null, seconds: 2.4, gesture: 'think' }],
    trolley: [{ ...action('pluck', CLUB_TOUCHES.equipment), title: 'Pluck a spare frame' }],
};
/** Stable built-in identities augment World.objects. Furniture histories remain owned by ObjectAffordances. */
export class ObjectIdentity {
    objects;
    states = {};
    constructor(objects) {
        this.objects = objects;
    }
    state(id) { return this.states[id] ?? { uses: 0, lastAction: '', lastWater: null, sketched: false }; }
    actions(o, minute) {
        const s = this.state(o.id);
        return (OBJECT_ACTIONS[o.kind] ?? []).filter(a => !(o.observeOnly && a.water) && !(a.water && s.lastWater !== null && minute - s.lastWater < 30) && !(a.sketch && s.sketched) && !(a.erase && !s.sketched));
    }
    apply(id, a, minute) {
        if (!this.objects.some(o => o.id === id))
            return;
        const s = { ...this.state(id) };
        if (a.water)
            s.lastWater = minute;
        if (a.sketch)
            s.sketched = true;
        if (a.erase)
            s.sketched = false;
        if (a.effect === 'lamp')
            s.dimmed = !s.dimmed;
        this.states[id] = s;
    }
    complete(id, action) {
        if (!this.objects.some(o => o.id === id))
            return;
        this.states[id] = { ...this.state(id), uses: Math.min(9999, this.state(id).uses + 1), lastAction: action };
    }
    serialize() { return structuredClone(this.states); }
    load(data) {
        this.states = {};
        if (!data)
            return;
        for (const o of this.objects) {
            const s = data[o.id];
            if (s)
                this.states[o.id] = { ...s };
        }
    }
}
/** Deliberate selection volumes are independent of navigation. Ray depth resolves overlapping targets. */
export function rayBox(origin, dir, box) {
    let near = 0, far = Infinity;
    for (const axis of ['x', 'y', 'z']) {
        const low = box.centre[axis] - box.size[axis] / 2, high = box.centre[axis] + box.size[axis] / 2, d = dir[axis];
        if (Math.abs(d) < 1e-8) {
            if (origin[axis] < low || origin[axis] > high)
                return null;
            continue;
        }
        let a = (low - origin[axis]) / d, b = (high - origin[axis]) / d;
        if (a > b)
            [a, b] = [b, a];
        near = Math.max(near, a);
        far = Math.min(far, b);
        if (near > far)
            return null;
    }
    return far >= 0 ? near : null;
}
