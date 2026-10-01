import type { ChampionshipOpponentProfile } from './ChampionshipController.js';

/**
 * Small parameterized personality model for Rally House's existing members.
 *
 * These values are intentionally data, not branches in the AI. The eventual
 * InteractiveMatchSystem can use the same decision code for every opponent.
 */
export const CHAMPIONSHIP_OPPONENTS: Record<string, ChampionshipOpponentProfile> = {
  coach: {
    id: 'coach',
    courtDepth:5.1, angleBias:0.8, serveCadence:0.3,
    name: 'Coach Contessa',
    reaction: 0.13,
    movementSpeed: 1.08,
    anticipation: 0.94,
    contactWindow: 0.93,
    aimAccuracy: 0.94,
    power: 0.79,
    riskTolerance: 0.42,
    recovery: 0.96,
  },

  mika: {
    id: 'mika',
    courtDepth:4.85, angleBias:0.55, serveCadence:0.5,
    name: 'Lucresia',
    reaction: 0.2,
    movementSpeed: 1.0,
    anticipation: 0.76,
    contactWindow: 0.78,
    aimAccuracy: 0.76,
    power: 0.72,
    riskTolerance: 0.5,
    recovery: 0.82,
  },

  leo: {
    id: 'leo',
    courtDepth:5, angleBias:0.65, serveCadence:0.4,
    name: 'Leo',
    reaction: 0.17,
    movementSpeed: 1.05,
    anticipation: 0.86,
    contactWindow: 0.83,
    aimAccuracy: 0.82,
    power: 0.75,
    riskTolerance: 0.34,
    recovery: 0.94,
  },

  nia: {
    id: 'nia',
    courtDepth:4.7, angleBias:0.25, serveCadence:0.65,
    name: 'Barbara',
    reaction: 0.28,
    movementSpeed: 0.91,
    anticipation: 0.64,
    contactWindow: 0.67,
    aimAccuracy: 0.66,
    power: 0.62,
    riskTolerance: 0.28,
    recovery: 0.7,
  },
};

export function championshipOpponentFor(memberId: string) {
  return CHAMPIONSHIP_OPPONENTS[memberId] ?? null;
}
