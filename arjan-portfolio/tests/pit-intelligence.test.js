import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { prepareDataset, trainModel, predict, evaluateStrategies, raceProfile, raceFrame } from '../public/pit-stop-lab/intelligence.js';
import { watchShot } from '../public/pit-stop-lab/experience.js';
import { simulate } from '../public/pit-stop-lab/simulation.js';

const fixture = JSON.parse(readFileSync('public/pit-stop-lab/data/bahrain-2024.json', 'utf8'));
const data = prepareDataset(fixture), model = trainModel(data);
const state = { driver: 1, current: 'HARD', next: 'SOFT', age: 20, lap: 39, laps: 18, transitLoss: 20, rivalService: 2.6, traffic: .5, scProbability: .15, rivals: [{ driver: 11, age: 20, pit: 2, gap: -3 }, { driver: 55, age: 18, pit: 4, gap: -9 }] };
const options = { runs: 200, seed: 42, serviceSamples: [2.5, 2.6, 2.7] };

describe('Historical race evidence and learned pace', () => {
    it('joins real laps to stints and removes known pit/start/incident laps', () => {
        expect(data.rawCount).toBe(1129); expect(data.rows.length).toBe(974); expect(data.excluded).toBe(155);
        expect(data.compounds).toEqual(['SOFT', 'HARD']);
        expect(data.rows.some(r => [1, 2, 10, 11].includes(r.lap))).toBe(false);
        const first = data.rows.find(r => r.driver === 1 && r.lap === 3);
        expect(data.rows.some(r => r.driver === 1 && r.lap === 57)).toBe(true);
        expect(first.age).toBe(5); expect(first.compound).toBe('SOFT');
        expect(data.rows.some(r => r.driver === 1 && [17, 18].includes(r.lap))).toBe(false);
    });
    it('rejects wet, mixed-session, malformed and sparse evidence', () => {
        expect(() => prepareDataset({ ...fixture, schema: 2 })).toThrow('schema 1');
        expect(() => prepareDataset({ ...fixture, weather: [{ ...fixture.weather[0], rainfall: 1 }] })).toThrow('Dry-race');
        expect(() => prepareDataset({ ...fixture, laps: [{ ...fixture.laps[0], session_key: 1 }] })).toThrow('mixed-session');
        expect(() => prepareDataset({ ...fixture, laps: fixture.laps.slice(0, 20) })).toThrow('80 clean');
        expect(() => prepareDataset({ ...fixture, race_control: [] })).toThrow('Race-control');
    });
    it('does not train on chronologically held-out outcomes', () => {
        const changed = { ...fixture, laps: fixture.laps.map(r => r.lap_number > model.validation.cutoff && typeof r.lap_duration === 'number' ? { ...r, lap_duration: r.lap_duration + .25 } : r) };
        const retrained = trainModel(prepareDataset(changed));
        expect(retrained.weights).toEqual(model.weights); expect(retrained.draws).toEqual(model.draws);
        expect(retrained.validation.bias - model.validation.bias).toBeCloseTo(.25, 8);
        expect(model.validation.train + model.validation.test).toBe(data.rows.length);
    });
    it('measures held-out accuracy against the stated baseline without inventing medium support', () => {
        expect(model.validation.mae).toBeCloseTo(.409521, 5); expect(model.validation.baselineMae).toBeCloseTo(.828059, 5);
        expect(model.validation.test).toBe(229); expect(model.draws).toHaveLength(32);
        expect(() => predict(model, { driver: 1, lap: 40, age: 10, compound: 'MEDIUM' })).toThrow('Unsupported');
        expect(predict(model, { driver: 1, lap: 40, age: 18, compound: 'HARD' })).toBeGreaterThan(predict(model, { driver: 1, lap: 40, age: 8, compound: 'HARD' }));
    });
});

describe('Race decision support', () => {
    it('replays seeded shared futures exactly and bounds probabilities and intervals', async () => {
        const a = await evaluateStrategies(model, state, options), b = await evaluateStrategies(model, state, options);
        expect(a).toEqual(b); expect(a.plans).toHaveLength(9);
        for (const plan of a.plans) {
            expect(plan.probability).toBeGreaterThanOrEqual(0); expect(plan.probability).toBeLessThanOrEqual(1);
            expect(plan.interval[0]).toBeLessThanOrEqual(plan.probability); expect(plan.interval[1]).toBeGreaterThanOrEqual(plan.probability);
            expect(plan.margin.every(Number.isFinite)).toBe(true); expect(plan.margin[0]).toBeLessThanOrEqual(plan.margin[1]); expect(plan.margin[1]).toBeLessThanOrEqual(plan.margin[2]);
        }
        expect(a.plans.find(p => p.wait === -1).outside).toBe(true);
    });
    it('makes a slower real pit-stop sample reduce chances for a fixed stop plan', async () => {
        const base = simulate({ variability: 0 }), slow = simulate({ scenario: 'gun', variability: 0 });
        const a = await evaluateStrategies(model, state, { ...options, serviceSamples: [base.result.stationary] });
        const b = await evaluateStrategies(model, state, { ...options, serviceSamples: [slow.result.stationary] });
        const find = r => r.plans.find(p => p.wait === 0 && p.compound === 'HARD');
        expect(find(b).margin[1]).toBeCloseTo(find(a).margin[1] - (slow.result.stationary - base.result.stationary), 7);
        expect(find(b).probability).toBeLessThanOrEqual(find(a).probability);
        expect(b.plans.find(p => p.wait === -1).probability).toBe(a.plans.find(p => p.wait === -1).probability);
    });
    it('accounts for full-lane transit separately and leaves stay-out elapsed time unchanged', async () => {
        const a = await evaluateStrategies(model, { ...state, scProbability: 0 }, options), b = await evaluateStrategies(model, { ...state, scProbability: 0, transitLoss: 25 }, options);
        const find = r => r.plans.find(p => p.wait === 0 && p.compound === 'SOFT');
        expect(find(b).medianTime - find(a).medianTime).toBeCloseTo(5, 8);
        expect(b.plans.find(p => p.wait === -1).medianTime).toBe(a.plans.find(p => p.wait === -1).medianTime);
    });
    it('responds to rival state and neutralisation assumptions', async () => {
        const ahead = await evaluateStrategies(model, { ...state, rivals: state.rivals.map(r => ({ ...r, gap: 120 })) }, options);
        const behind = await evaluateStrategies(model, { ...state, rivals: state.rivals.map(r => ({ ...r, gap: -60 })) }, options);
        expect(ahead.plans[0].probability).toBeGreaterThan(behind.plans[0].probability);
        const sc = await evaluateStrategies(model, { ...state, scProbability: 1 }, options);
        const green = await evaluateStrategies(model, { ...state, scProbability: 0 }, options);
        expect(sc.plans.map(p => p.medianTime)).not.toEqual(green.plans.map(p => p.medianTime));
        const extrapolated = await evaluateStrategies(model, { ...state, rivals: state.rivals.map(r => ({ ...r, age: 35, pit: -1 })) }, options);
        expect(extrapolated.rivalsOutside).toBe(true); expect(extrapolated.warning).toContain('Rival plans extrapolate');
    });
    it('rejects holds, duplicate rivals, missing numbers, excessive horizon and runaway work', async () => {
        await expect(evaluateStrategies(model, state, { ...options, serviceSamples: [simulate({ scenario: 'unsecured' }).result.stationary] })).rejects.toThrow('safe pit');
        await expect(evaluateStrategies(model, { ...state, rivals: [{ ...state.rivals[0], driver: state.driver }] }, options)).rejects.toThrow('different');
        await expect(evaluateStrategies(model, { ...state, age: NaN }, options)).rejects.toThrow('tire age');
        await expect(evaluateStrategies(model, { ...state, laps: 40 }, options)).rejects.toThrow('horizon');
        await expect(evaluateStrategies(model, state, { ...options, runs: 100000 })).rejects.toThrow('100–5000');
    });
});


describe('Model-driven race playback and watch cameras', () => {
    it('holds at the pit box before advancing through the calculated lap time', () => {
        const profile = raceProfile(model, state, 1, 20, 0, 'SOFT', 2.6);
        const hold = state.transitLoss + state.traffic + 2.6;
        expect(profile.laps[0].pitEnd).toBeCloseTo(hold, 8);
        expect(raceFrame(profile, hold / 2).phase).toBe('PIT');
        expect(raceFrame(profile, hold / 2).progress).toBe(0);
        expect(raceFrame(profile, hold + profile.laps[0].seconds / 2).progress).toBeCloseTo(.5, 8);
        expect(profile.duration).toBeCloseTo(profile.laps.reduce((sum, lap) => sum + lap.seconds, 0) + hold, 8);
    });
    it('reconstructs replay positions on backward seeks and respects start gaps and finishes', () => {
        const profile = raceProfile(model, state, 1, 20, 2, 'HARD', 2.6);
        const early = raceFrame(profile, 120); raceFrame(profile, 900);
        expect(raceFrame(profile, 120)).toEqual(early);
        expect(raceFrame(profile, -5).phase).toBe('START GAP');
        expect(raceFrame(profile, profile.duration).phase).toBe('FINISHED');
        expect(raceFrame(profile, profile.duration).progress).toBe(state.laps);
        expect(() => raceFrame(profile, NaN)).toThrow('clock');
        expect(() => raceProfile(model, state, 1, 20, 99, 'HARD', 2.6)).toThrow('plan');
    });
    it('changes only stop-plan duration when service time changes and never charges stay-out service', () => {
        const a = raceProfile(model, state, 1, 20, 2, 'SOFT', 2.6), b = raceProfile(model, state, 1, 20, 2, 'SOFT', 3.6);
        expect(b.duration - a.duration).toBeCloseTo(1, 8);
        expect(raceProfile(model, state, 1, 20, -1, 'HARD', 2.6).duration).toBe(raceProfile(model, state, 1, 20, -1, 'HARD', 3.6).duration);
    });
    it('chooses the limiting wheel and safe-release shots from actual event times', () => {
        const sim = simulate({ scenario: 'gun' }), stop = sim.stops[0];
        expect(watchShot(sim, 0).camera).toBe('release');
        expect(watchShot(sim, stop.stopAt).camera).toBe('top');
        expect(watchShot(sim, stop.stopAt + 1).camera).toBe(stop.criticalCorner);
        expect(watchShot(sim, stop.releaseAt + .01).camera).toBe('follow');
        const held = simulate({ scenario: 'unsecured' }); expect(watchShot(held, held.duration).label).toContain('HOLD');
        expect(watchShot(held, held.duration).camera).toBe('RR');
    });
});
