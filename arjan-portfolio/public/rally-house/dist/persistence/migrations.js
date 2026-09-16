import { DECOR_BY_ID } from '../content/DecorCatalog.js';
export const CURRENT_SAVE_VERSION = 8;
const invalid = () => { throw new Error('Saved club data is invalid. Storage has been left untouched.'); };
function scan(v, depth = 0) {
    if (depth > 20)
        invalid();
    if (typeof v === 'number' && !Number.isFinite(v))
        invalid();
    if (Array.isArray(v)) {
        if (v.length > 10000)
            invalid();
        v.forEach(x => scan(x, depth + 1));
    }
    else if (v && typeof v === 'object') {
        for (const [k, x] of Object.entries(v)) {
            if (['__proto__', 'prototype', 'constructor'].includes(k))
                invalid();
            scan(x, depth + 1);
        }
    }
}
function normalizeRelationship(v) {
    if (v && (![v.familiarity ?? 10, v.warmth ?? 12, v.trust ?? 10, v.rivalry ?? 0].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100) || !Array.isArray(v.memories ?? []) || !Array.isArray(v.events ?? [])))
        invalid();
    for (const e of v?.events ?? [])
        if (!e || typeof e.detail !== 'string' || !Array.isArray(e.people) || !Array.isArray(e.tags) || !e.people.every(p => typeof p === 'string') || !e.tags.every(p => typeof p === 'string') || !Number.isFinite(e.day))
            invalid();
    return { familiarity: v?.familiarity ?? 10, warmth: v?.warmth ?? 12, trust: v?.trust ?? 10, rivalry: v?.rivalry ?? 0, memories: v?.memories ?? [], events: v?.events ?? [] };
}
export function migrateGameSave(version, state) {
    if (version > CURRENT_SAVE_VERSION)
        throw new Error('Save needs a newer version.');
    if (!Number.isSafeInteger(version) || version < 1)
        invalid();
    scan(state);
    if (!state || !state.clock || ![state.clock.minutes, state.clock.day, state.coins, state.mikaProgress, state.player?.x, state.player?.z].every(Number.isFinite))
        invalid();
    if (state.clock.minutes < 0 || state.clock.minutes >= 1440 || !Number.isSafeInteger(state.clock.day) || state.clock.day < 1 || state.coins < 0 || state.mikaProgress < 0 || state.mikaProgress > 100 || ![.5, 1, 2].includes(state.clock.speed ?? 1))
        invalid();
    if (!Array.isArray(state.placements ?? []) || !['clear', 'cloudy', 'rain'].includes(state.weather ?? 'clear'))
        invalid();
    const ids = new Set();
    for (const p of state.placements ?? []) {
        if (!p || !(p.type in DECOR_BY_ID) || ![p.x, p.z].every(Number.isFinite) || Math.abs(p.x) > 12.5 || Math.abs(p.z) > 9.5 || (p.rotation !== undefined && (!Number.isFinite(p.rotation) || Math.abs(p.rotation) > Math.PI * 8)))
            invalid();
        if (p.id) {
            if (typeof p.id !== 'string' || ids.has(p.id))
                invalid();
            ids.add(p.id);
        }
    }
    if (state.settings && (!Number.isFinite(state.settings.volume) || state.settings.volume < 0 || state.settings.volume > 1 || typeof state.settings.reducedMotion !== 'boolean'))
        invalid();
    if (state.activities && (!Number.isSafeInteger(state.activities.sequence) || state.activities.sequence < 0 || !Array.isArray(state.activities.history)))
        invalid();
    if (state.history) {
        const h = state.history;
        if (!Array.isArray(h.matches) || !Array.isArray(h.intentions) || ![h.nextSocial, h.nextObject].every(Number.isFinite))
            invalid();
        for (const m of h.matches)
            if (!m || typeof m.id !== 'string' || !['mika', 'leo', 'draw'].includes(m.winner) || !m.score || !Object.values(m.score).every(n => Number.isFinite(n) && n >= 0) || !Number.isFinite(m.day))
                invalid();
        for (const i of h.intentions)
            if (!i || typeof i.id !== 'string' || typeof i.text !== 'string' || !Number.isFinite(i.notBefore))
                invalid();
    }
    if (state.playerAvatar != null && !['taylor', 'arjan'].includes(state.playerAvatar))
        invalid();
    if (state.queuedLesson != null && !['spacing', 'dropFeed', 'crosscourt', 'movement', 'shadowPrep'].includes(state.queuedLesson))
        invalid();
    const relationships = {};
    for (const [k, v] of Object.entries(state.relationships ?? {}))
        relationships[k] = normalizeRelationship(v);
    return { ...state, stars: state.stars ?? 3, coachXP: state.coachXP ?? 14, weather: state.weather ?? 'clear', placements: state.placements ?? [], equipment: state.equipment ?? { frame: 'Cedar 98', tension: 52, string: 'Soft poly' }, relationships, bestRally: state.bestRally ?? 0, development: state.development ?? { preparation: 0, recovery: 0 }, emergentSocial: version >= 4 ? state.emergentSocial : undefined, mind: version >= 7 ? state.mind : undefined };
}
