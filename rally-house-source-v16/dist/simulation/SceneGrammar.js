import { MEMBERS } from './CharacterMind.js';
const N = { coach: 'Contessa', mika: 'Lucresia', leo: 'Leo', nia: 'Barbara' };
const line = (speaker, text, gesture = 'none', seconds = 4) => ({ seconds, speaker, line: text, poses: { [speaker]: 'talk' }, gestures: { [speaker]: gesture } });
const quiet = (id, pose = 'watch', seconds = 7, prop) => ({ seconds, poses: { [id]: pose }, gestures: { [id]: pose === 'watch' ? 'inspect' : 'none' }, prop });
const make = (id, title, people, place, motive, beats, memory, extra = {}) => ({ id, title, people, place, motive, beats, memory, family: motive, motif: id, minInterval: 180, ...extra });
/** Systemic setup; small authored reactions; consequences remain in completion. */
export class SceneGrammar {
    compose(mind, c) {
        const out = [];
        const favorite = (id, type) => c.objects.filter(p => (!type || p.type === type) && c.favorite(id, p.id))[0];
        for (const id of MEMBERS) {
            const who = N[id], s = mind.states[id], bench = favorite(id, 'bench'), place = bench ? 'built-bench' : id === 'coach' ? 'cafeTable' : id === 'leo' ? 'lounge' : 'courtBench';
            const restText = { coach: 'The note can wait for the tea this time.', mika: 'Just a minute. Then I’ll know what I want to try.', leo: 'This is recovery. I am being very disciplined.', nia: 'The club can manage while I finish this.' };
            out.push(make(`rest-${id}`, `${who} takes a real minute`, [id], place, 'rest', [quiet(id, 'watch', 8, id === 'coach' || id === 'nia' ? 'cup' : undefined), line(id, restText[id], 'think'), quiet(id, 'watch', 8)], `${who} took an unhurried break${bench ? ' at a familiar bench' : ''}.`, { objectId: bench?.id, motif: 'take-a-minute', ritual: `rest-${id}`, minInterval: 210 }));
            if (c.courtActive && (id === 'coach' || id === 'nia'))
                out.push(make(`watch-court-${id}`, `${who} watches without interrupting`, [id], 'courtBench', 'witness', [{ seconds: 8, poses: { [id]: 'watch' }, gestures: { [id]: 'none' } }, { seconds: 8, poses: { [id]: 'watch' }, gestures: { [id]: 'nod' } }], `${who} made time to watch the game.`, { family: 'watch-court', motif: 'pay-attention', minInterval: 200, ritual: `watch-${id}` }));
            if (id === 'mika' || id === 'leo') {
                const basket = c.objects.filter(p => p.type === 'basket').sort((a, b) => Number(c.favorite(id, b.id)) - Number(c.favorite(id, a.id)))[0];
                out.push(make(`rehearse-${id}`, id === 'mika' ? 'Lucresia gives herself a slower count' : 'Leo works on the unglamorous part', [id], basket ? 'built-object' : 'warmup', 'practice', [quiet(id, 'stretch', 5), line(id, id === 'mika' ? (s.confidence < .5 ? 'No audience. Just get comfortable with it.' : 'Split. Set. And leave time for the next ball.') : 'Back to the middle. Before admiring the shot.', 'point'), quiet(id, 'shuffle', 6, 'ball'), line(id, id === 'mika' ? 'Again, without rushing.' : 'The grip gets no credit for that.', 'nod')], `${who} spent a few quiet minutes rehearsing recovery footwork.`, { objectId: basket?.id, motif: 'recovery-rehearsal', ritual: `rehearse-${id}` }));
            }
            if (id === 'coach')
                out.push(make('june-quiet-notes', 'Contessa leaves a little space on the page', [id], 'cafeTable', 'reflect', [quiet(id, 'watch', 9, 'notebook'), line(id, 'One useful sentence. The rest can wait.', 'think'), quiet(id, 'watch', 8, 'notebook')], 'Contessa kept her notes short and left room to look up.', { ritual: 'june-notes', motif: 'quiet-notes' }));
            if (id === 'leo')
                out.push(make('leo-strings', 'Leo checks what he already knows', [id], 'stringing', 'gear', [quiet(id, 'watch', 7), line(id, 'Even tension. No mysterious new problem.', 'inspect'), quiet(id, 'watch', 6)], 'Leo checked his strings and kept the racket he already knew.', { ritual: 'leo-strings', motif: 'equipment-check' }));
            if (id === 'nia') {
                const plant = c.objects.filter(p => p.type === 'plant').sort((a, b) => Number(c.favorite(id, b.id)) - Number(c.favorite(id, a.id)))[0];
                out.push(make('nia-tends', 'Barbara checks the quiet corner', [id], plant ? 'built-object' : 'bonsai', 'care', [{ ...quiet(id, 'watch', 8, 'wateringCan'), effect: 'water' }, line(id, 'A little water. Not a committee meeting.', 'nod'), quiet(id, 'watch', 5)], `Barbara tended ${plant ? 'your planted corner' : 'the bonsai'} and took a moment to look at it.`, { objectId: plant?.id, ritual: 'nia-tends', motif: 'plant-care' }));
            }
        }
        // Each initiator has their own language; familiarity shortens the invitation.
        const invitation = { coach: 'A short break? I could use another pair of eyes on the day.', mika: 'Do you have a minute? I’m trying not to spend all of mine practicing.', leo: 'I was about to take a very tactical break.', nia: 'There’s room for one more. No need to make an occasion of it.' };
        const reply = { coach: 'A minute without a correction. That sounds useful.', mika: 'Yes. I can leave one thing unfinished.', leo: 'I can spare a minute. Several, if they’re good.', nia: 'I was hoping someone would ask me for once.' };
        for (const actor of MEMBERS)
            for (const partner of MEMBERS) {
                if (actor === partner)
                    continue;
                const rel = c.relationship(actor, partner), bench = favorite(actor, 'bench') ?? favorite(partner, 'bench'), familiar = rel.familiarity >= 35;
                const place = bench ? 'built-bench' : c.weather === 'rain' ? 'cafe' : rel.warmth > 35 ? 'courtBench' : 'cafeTable';
                const hello = familiar ? actor === 'nia' && partner === 'mika' && c.usualKnown ? 'Extra foam. I remembered.' : actor === 'leo' ? 'Same spot?' : actor === 'coach' ? 'A minute together?' : 'Joining you, if that’s okay.' : invitation[actor];
                out.push(make(`company-${[actor, partner].sort().join('-')}-${place}`, `${N[actor]} makes time for ${N[partner]}`, [actor, partner], place, 'company', [line(actor, hello, 'offer'), line(partner, reply[partner], 'nod'), { seconds: rel.warmth >= 40 ? 9 : 6, poses: { [actor]: 'watch', [partner]: 'watch' }, gestures: { [actor]: 'none', [partner]: 'none' } }, line(actor, actor === 'leo' ? 'That was a better use of the minute than checking my strings.' : actor === 'nia' ? 'Good. Neither of us rushed off.' : actor === 'mika' ? 'I needed that more than another repetition.' : 'Some things settle if you give them time.', 'nod')], `${N[actor]} invited ${N[partner]} to a shared break${bench ? ' at their familiar bench' : ''}.`, { objectId: bench?.id, family: 'shared-break', motif: 'invitation', minInterval: 180 }));
            }
        if (mind.states.mika.confidence < .62)
            out.push(make('mika-asks-june', 'Lucresia asks for one small thing', ['mika', 'coach'], 'training', 'advice', [line('mika', c.relationship('mika', 'coach').trust > 35 ? 'Can I tell you the bit I’m avoiding?' : 'Could you watch the first part? I’m getting in my own way.', 'think'), quiet('mika', 'stretch', 5), line('coach', 'Start with enough time. You don’t have to solve the whole swing.', 'point'), line('mika', 'Just the start. I can do that.', 'nod')], 'Lucresia asked Contessa for a smaller starting point, then rehearsed it.', { motif: 'admit-difficulty', family: 'seek-advice' }));
        for (const e of mind.events.slice(0, 12)) {
            if (mind.time - e.at > 1000 && e.importance < .95)
                continue;
            if (e.kind === 'match') {
                const host = e.witnesses.find(id => ['coach', 'nia'].includes(id) && e.pending.includes(id));
                if (host && c.relationship('mika', 'leo').familiarity >= 20)
                    out.push(make(`three-${e.id}-${host}`, `${N[host]} leaves room for both sides`, [host, 'mika', 'leo'], 'cafeTable', 'company', [
                        line(host, host === 'coach' ? 'I watched that game. One useful thing each.' : 'I saw the finish. There is room here for both of you.', 'offer'),
                        line('mika', e.winner === 'mika' ? 'I stayed with it, even when I wanted to rush.' : 'I know which part I want to try again.', 'think'),
                        line('leo', e.winner === 'leo' ? 'She made me earn the last one.' : 'I have a very impressive list of things to try.', 'shrug'),
                        line(host, host === 'coach' ? 'Good. Keep one. You can leave the list here.' : 'The list can wait for the tea.', 'nod')
                    ], `${N[host]}, Lucresia and Leo made room for both perspectives after the game.`, { eventId: e.id, family: 'three-person-reflection', motif: 'both-sides', minInterval: 420 }));
            }
            for (const actor of e.pending) {
                if (e.kind === 'move') {
                    const object = c.objects.find(p => p.id === e.place);
                    if (!object)
                        continue;
                    out.push(make(`find-${e.id}`, `${N[actor]} finds the moved ${object.type}`, [actor], object.type === 'bench' ? 'built-bench' : 'built-object', 'rest', [line(actor, actor === 'leo' ? 'I had a system for where this was.' : 'Oh, it’s over here now.', 'point'), quiet(actor, 'watch', 6), line(actor, actor === 'nia' ? 'Still our little corner.' : 'All right. This works.', 'nod')], `${N[actor]} found the familiar ${object.type} in its new position.`, { eventId: e.id, objectId: object.id, family: 'moved-favorite', motif: 'finding-again' }));
                    continue;
                }
                if (e.kind === 'match' && ['mika', 'leo'].includes(actor)) {
                    const won = e.winner === actor, bench = favorite(actor, 'bench');
                    out.push(make(`after-${e.id}-${actor}`, won ? `${N[actor]} lets the result sink in` : `${N[actor]} returns to the small things`, [actor], won ? (bench ? 'built-bench' : 'courtBench') : 'warmup', won ? 'celebrate' : 'practice', [quiet(actor, won ? 'watch' : 'stretch', 7), line(actor, won ? (actor === 'mika' ? 'I actually stayed with that game.' : 'A good one. Now keep doing the ordinary bits.') : (actor === 'leo' ? 'Same racket. Better recovery. That’s the plan.' : 'Keep the useful points. Work on the rest.'), won ? 'nod' : 'think'), quiet(actor, won ? 'watch' : 'shuffle', 7)], `${N[actor]} ${won ? 'paused to enjoy' : 'quietly worked on recovery after'} the completed game.`, { objectId: won ? bench?.id : undefined, eventId: e.id, family: 'after-result', motif: won ? 'keep-the-win' : 'reset-after-game' }));
                }
                else if (e.kind === 'lesson' && actor === 'mika') {
                    out.push(make(`try-cue-${e.id}`, 'Lucresia tries the cue without an audience', ['mika'], 'warmup', 'practice', [quiet('mika', 'stretch', 6), line('mika', 'Start with the part we just worked on.', 'think'), quiet('mika', 'shuffle', 7)], 'Lucresia returned to the warm-up space to rehearse the completed lesson’s cue.', { eventId: e.id, family: 'lesson-followup', motif: 'try-the-cue' }));
                }
                else if (e.witnesses.includes(actor) && actor !== e.subject) {
                    const loser = e.winner === 'mika' ? 'leo' : 'mika', subject = e.kind === 'match' && actor === 'nia' && e.winner !== 'draw' && mind.states[loser].tone < .58 ? loser : e.subject, isWin = e.kind === 'match' && e.winner === subject, bench = favorite(subject, 'bench');
                    out.push(make(`witness-${e.id}-${actor}`, `${N[actor]} remembers what they saw`, [actor, subject], bench ? 'built-bench' : 'cafe', 'witness', [line(actor, isWin ? (actor === 'coach' ? 'I saw you stay patient in that game.' : 'I saw the end of that. You looked pleased with yourself.') : (actor === 'nia' ? 'I saw how much you put into that. A cup before the next thing?' : 'I was watching. You don’t have to carry every point into the next one.'), 'offer'), line(subject, subject === 'leo' ? 'Just the useful bits, then.' : subject === 'mika' ? 'You noticed? I was still sorting it out.' : 'Thank you for noticing.', 'think'), { seconds: 7, poses: { [actor]: 'watch', [subject]: 'drink' }, prop: 'cup' }], `${N[actor]} and ${N[subject]} talked over a cup about ${e.kind === 'lesson' ? 'the lesson' : 'the game'}.`, { objectId: bench?.id, eventId: e.id, family: 'witness-followup', motif: isWin ? 'congratulate' : 'reassure' }));
                }
            }
        }
        return out.filter(s => s.people.every(id => c.free.has(id)) && c.available(s));
    }
}
//# sourceMappingURL=SceneGrammar.js.map