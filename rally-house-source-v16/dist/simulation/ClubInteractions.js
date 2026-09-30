/** Shared by built-in objects and player-placed furniture. No new inventory. */
export const CLUB_TOUCHES = {
    cafe: { title: 'Sip a warm cup', detail: 'Steam, ceramic, a small pause.', animation: 'drink', effect: 'cafe', prop: 'cup', seconds: 3.4 },
    equipment: { title: 'Pluck the strings', detail: 'A different voice in every frame.', animation: 'watch', effect: 'stringing', prop: null, seconds: 2.2 },
    training: { title: 'Feed one ball', detail: 'A soft motor, one little bounce.', animation: 'watch', effect: 'training', prop: 'ball', seconds: 2.6 },
    bonsai: { title: 'Tend the leaves', detail: 'Take a quiet moment with the tree.', animation: 'watch', effect: 'bonsai', prop: 'wateringCan', seconds: 3 },
    reception: { title: 'Ring the desk bell', detail: 'A brass note travels through the club.', animation: 'watch', effect: 'bell', prop: null, seconds: 1.7 },
    lounge: { title: 'Settle in', detail: 'Rest your feet. The club carries on.', animation: 'sit', effect: 'comfort', prop: null, seconds: 5 },
    water: { title: 'Take a cool drink', detail: 'Fill, lift, take a breath.', animation: 'drink', effect: 'water', prop: 'cup', seconds: 3.2 },
    board: { title: 'Leaf through the notes', detail: 'One useful cue from the last lesson.', animation: 'watch', effect: 'paper', prop: 'notebook', seconds: 3 },
    paper: { title: 'Turn a page', detail: 'The club journal has a little history.', animation: 'watch', effect: 'paper', prop: 'notebook', seconds: 3 },
    lamp: { title: 'Warm your hands', detail: 'A small pool of light to pause beside.', animation: 'watch', effect: 'lamp', prop: null, seconds: 2.5 },
    trophy: { title: 'Look a little closer', detail: 'A club memory, kept on the shelf.', animation: 'watch', effect: 'comfort', prop: null, seconds: 2.5 },
};
export function touchForDecor(type) {
    if (['bench', 'stool'].includes(type))
        return CLUB_TOUCHES.lounge;
    if (['plant', 'planter'].includes(type))
        return CLUB_TOUCHES.bonsai;
    if (['lamp', 'lantern'].includes(type))
        return CLUB_TOUCHES.lamp;
    if (['racketRack', 'tennisBag'].includes(type))
        return CLUB_TOUCHES.equipment;
    if (['cafeTable', 'sideTable'].includes(type))
        return CLUB_TOUCHES.cafe;
    if (type === 'towelRack')
        return { ...CLUB_TOUCHES.lounge, title: 'Cool down', animation: 'stretch', seconds: 2.8 };
    if (type === 'trophy')
        return CLUB_TOUCHES.trophy;
    if (type === 'scoreboard')
        return CLUB_TOUCHES.board;
    return CLUB_TOUCHES.training;
}
/** Attention is bounded, distance-based, and never interrupts a reservation. */
export function interactionWitnesses(characters, origin, busy, last, now) {
    return characters.filter(c => !busy(c.id) && !c.majorActivity && ['idle', 'watch', 'sit'].includes(c.state)
        && Math.hypot(c.position.x - origin.x, c.position.z - origin.z) < 4.6
        && now - (last.get(c.id) ?? -100) > 7)
        .sort((a, b) => Math.hypot(a.position.x - origin.x, a.position.z - origin.z) - Math.hypot(b.position.x - origin.x, b.position.z - origin.z)).slice(0, 2);
}
