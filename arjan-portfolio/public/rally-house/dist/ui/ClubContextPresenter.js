import { DECOR_BY_ID } from '../content/DecorCatalog.js';
import { CLUB_TOUCHES, touchForDecor } from '../simulation/ClubInteractions.js';
import { championshipOpponentFor } from '../tennis/ChampionshipOpponents.js';
/** Reservations mirror the existing challenge path, including a yielding demonstration. */
export function canChallenge(a, id) {
    return !!championshipOpponentFor(id) && !a.active.some(a => a.kind !== 'observe' && (a.resource === 'court' || a.participants.includes(id) || a.participants.includes('player')));
}
export function characterContext(c, s) {
    const state = s.mind.states[c.id], active = s.activities.active.find(a => a.participants.includes(c.id));
    const free = !s.activities.busy(c.id) && !s.activities.busy('player'), facts = [];
    const match = s.history.matches.find(m => Object.hasOwn(m.score, c.id)), memory = s.mind.recall(c.id)[0];
    const favorite = Object.entries(s.affordances.objects).find(([, h]) => h.favoriteOf.includes(c.id));
    const championship = s.relations.recall(c.id, 'championship');
    if (championship) {
        facts.push({ label: 'Last Championship with you', text: championship.detail });
    }
    else if (match) {
        const score = Object.entries(match.score).map(([id, n]) => `${s.characters.find(p => p.id === id)?.spec.name ?? id} ${n}`).join(' · ');
        facts.push({ label: 'Last club match', text: `${match.winner === 'draw' ? 'Draw' : match.winner === c.id ? 'Won' : 'Lost'} · ${score}` });
    }
    else if (memory)
        facts.push({ label: 'A remembered moment', text: memory.detail });
    else if (c.id === 'mika')
        facts.push({ label: 'Forehand development', text: `${Math.round(s.progress)}% · from completed coaching` });
    if (favorite && !facts.length) {
        const p = s.placements.find(p => p.id === favorite[0]);
        if (p)
            facts.push({ label: 'Favorite place', text: DECOR_BY_ID[p.type].label });
    }
    const actions = [];
    if (free) {
        actions.push({ id: 'talk', title: 'Spend a moment', detail: 'Walk over and listen' });
        if (!s.activities.reserved('cafe-table'))
            actions.push({ id: 'tea', title: 'Share matcha', detail: 'Meet at the matcha nook' });
    }
    if (active?.resource === 'court' && !s.activities.busy('player'))
        actions.push({ id: 'watch', title: 'Watch practice', detail: 'Join from the sideline' });
    if (c.id === 'mika' && !s.activities.busy('coach') && !s.activities.busy(c.id) && !s.activities.reserved('court'))
        actions.push({ id: 'coach', title: 'Coach a lesson', detail: 'Choose a cue for Lucresia' });
    if (canChallenge(s.activities, c.id))
        actions.push({ id: 'challenge', title: 'Challenge to Match', detail: 'First to 7 · win by 2', primary: true });
    else
        facts.push({ label: 'Court availability', text: 'A committed activity is in progress.' });
    return { eyebrow: c.spec.role, title: c.spec.name, subtitle: c.spec.playStyle, status: `${s.mind.mood(c.id)} · Energy ${Math.round(state.energy * 100)}%`, facts: [{ label: s.relations.label(c.id), text: active ? `${active.detail} · ${active.phase === 'traveling' ? 'on the way' : active.phase}` : c.activity || c.spec.goal }, ...facts].slice(0, 3), actions: actions.slice(0, 4) };
}
export function objectContext(o, a, e, memories) {
    const touch = o.id === 'warmup' ? touchForDecor('towelRack') : o.id === 'spectatorRow' ? CLUB_TOUCHES.lounge : CLUB_TOUCHES[o.kind], free = !a.busy('player') && !a.reserved(o.id);
    const actions = free && touch ? [{ id: 'touch', title: touch.title, detail: touch.detail, primary: true }] : [];
    if (o.kind === 'cafe' && free && !a.busy('nia') && !a.reserved('cafe-table'))
        actions.push({ id: 'tea', title: 'Share matcha', detail: 'Make time with Barbara' });
    if (o.kind === 'equipment')
        actions.push({ id: 'equipment', title: 'Customize racket', detail: 'Frames, strings and tension' });
    if (o.id === 'machine' && !a.busy('coach') && !a.busy('mika') && !a.reserved('court'))
        actions.push({ id: 'drill', title: 'Run ball-machine drill', detail: 'Contessa guides a rhythm block' });
    if (o.kind === 'court' && !a.busy('player'))
        actions.push({ id: 'watch', title: 'Watch a rally', detail: 'Head to the sideline' });
    const facts = [];
    const lastVisit = a.history.find(receipt => receipt.kind === 'touch' && receipt.resource === o.id && receipt.phase === 'completed');
    if (lastVisit)
        facts.push({ label: 'Your last completed visit', text: lastVisit.result ?? lastVisit.detail });
    if (o.kind === 'equipment')
        facts.push({ label: 'Your racket', text: `${e.frame} · ${e.string} · ${e.tension} lb` });
    if (['board', 'paper', 'trophy'].includes(o.kind) && memories[0])
        facts.push({ label: 'From the club scrapbook', text: memories[0] });
    return { eyebrow: 'A little club ritual', title: o.label, subtitle: o.description, status: free ? 'Take a moment here' : 'A shared moment is in progress', facts, actions };
}
export function furnitureContext(p, f, a, names) {
    const h = f.objects[p.id], touch = touchForDecor(p.type), free = !a.reserved(p.id), facts = [];
    if (h?.favoriteOf.length)
        facts.push({ label: 'A familiar place', text: `A favorite of ${h.favoriteOf.map(names).join(', ')}` });
    if (h?.visits.player)
        facts.push({ label: 'Your history here', text: `${h.visits.player} completed ${h.visits.player === 1 ? 'visit' : 'visits'}` });
    if (h?.revision)
        facts.push({ label: 'Still the same place', text: `Moved ${h.revision} ${h.revision === 1 ? 'time' : 'times'} · history kept` });
    const actions = [];
    if (free && !a.busy('player'))
        actions.push({ id: 'touch', title: touch.title, detail: touch.detail, primary: true });
    if (f.affordances(p).includes('spectate') && !a.busy('player'))
        actions.push({ id: 'watch', title: 'Watch a rally', detail: 'Walk to the court sideline' });
    if (free)
        actions.push({ id: 'arrange', title: 'Arrange this detail', detail: 'Move, rotate or return to catalog' });
    return { eyebrow: 'Your academy', title: DECOR_BY_ID[p.type].label, subtitle: f.affordances(p).join(' · '), status: free ? 'A place for a small ritual' : 'Someone is using this place', facts: facts.slice(0, 2), actions };
}
