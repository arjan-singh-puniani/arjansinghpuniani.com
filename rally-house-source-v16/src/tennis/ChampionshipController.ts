import {
  CHAMPIONSHIP_TUNING,
  type ChampionshipTuning,
} from './ChampionshipTuning.js';

export type ChampionshipPhase =
  | 'inactive'
  | 'challenge'
  | 'intro'
  | 'ready'
  | 'serving'
  | 'rally'
  | 'pointResult'
  | 'matchResult'
  | 'exiting';

export type ChampionshipCameraMode =
  | 'club'
  | 'challengeEstablishing'
  | 'matchIntro'
  | 'behindPlayer'
  | 'pointReaction'
  | 'matchResult';

export interface ChampionshipOpponentProfile {
  id: string;
  name: string;

  /** Delay before AI commits to an intercept, in seconds. Lower is stronger. */
  reaction: number;

  /** Relative movement multiplier used by the interactive match system. */
  movementSpeed: number;

  /** How accurately the AI predicts/positions for the next ball, 0..1. */
  anticipation: number;

  /** Relative contact forgiveness, 0..1. */
  contactWindow: number;

  /** Relative target precision, 0..1. */
  aimAccuracy: number;

  /** Relative outgoing pace, 0..1. */
  power: number;

  /** Higher values attempt smaller margins and accept more errors. */
  riskTolerance: number;

  /** How quickly the AI returns to a useful neutral court position. */
  recovery: number;

  /** Preferred baseline depth in world-space Z units. Larger means deeper. */
  courtDepth: number;

  /** 0..1 tendency to stretch the opponent laterally instead of hitting through center. */
  angleBias: number;

  /** Extra deterministic delay before the AI begins its serve motion. */
  serveCadence: number;
}

export interface ChampionshipScore {
  player: number;
  opponent: number;
}

export interface ChampionshipPointResult {
  winner: 'player' | 'opponent';
  reason: string;
  rallyLength: number;
}

export interface ChampionshipSnapshot {
  phase: ChampionshipPhase;
  cameraMode: ChampionshipCameraMode;
  opponentId: string | null;
  score: ChampionshipScore;
  server: 'player' | 'opponent';
  bestRally: number;
  currentRally: number;
  lastPoint: ChampionshipPointResult | null;
}

/**
 * ChampionshipController owns match lifecycle and scoring only.
 *
 * It deliberately does NOT own:
 * - Character movement
 * - racket animation
 * - ball physics
 * - rendering
 * - audio
 * - DOM state
 * - court reservations
 *
 * Those remain with the existing Rally House systems. This keeps the new mode
 * testable and sharply limits the regression surface.
 */
export class ChampionshipController {
  private phaseValue: ChampionshipPhase = 'inactive';
  private cameraModeValue: ChampionshipCameraMode = 'club';
  private opponentValue: ChampionshipOpponentProfile | null = null;
  private phaseAge = 0;
  private scoreValue: ChampionshipScore = { player: 0, opponent: 0 };
  private serverValue: 'player' | 'opponent' = 'player';
  private currentRallyValue = 0;
  private bestRallyValue = 0;
  private lastPointValue: ChampionshipPointResult | null = null;

  constructor(
    private readonly tuning: ChampionshipTuning = CHAMPIONSHIP_TUNING,
  ) {}

  get phase() {
    return this.phaseValue;
  }

  get cameraMode() {
    return this.cameraModeValue;
  }

  get opponent() {
    return this.opponentValue;
  }

  get active() {
    return this.phaseValue !== 'inactive';
  }

  get acceptsGameplayInput() {
    return this.phaseValue === 'serving' || this.phaseValue === 'rally';
  }

  get score(): ChampionshipScore {
    return { ...this.scoreValue };
  }

  get currentRally() {
    return this.currentRallyValue;
  }

  get bestRally() {
    return this.bestRallyValue;
  }

  /**
   * Called only after Game has confirmed the opponent and court can be reserved.
   * Keeping reservation authority outside this class prevents two independent
   * systems from believing they own the same court.
   */
  beginChallenge(opponent: ChampionshipOpponentProfile) {
    if (this.phaseValue !== 'inactive') return false;

    this.resetMatchData();
    this.opponentValue = opponent;
    this.transition('challenge', 'challengeEstablishing');
    return true;
  }

  /** The opponent accepted and both players are now committed to the match. */
  acceptChallenge() {
    if (this.phaseValue !== 'challenge' || !this.opponentValue) return false;

    this.transition('intro', 'matchIntro');
    return true;
  }

  /**
   * Advances non-gameplay presentation phases.
   * Gameplay itself stays fixed-step in the existing Game loop.
   */
  update(dt: number, reducedMotion = false) {
    if (!Number.isFinite(dt) || dt <= 0 || this.phaseValue === 'inactive') return;

    this.phaseAge += dt;

    if (this.phaseValue === 'intro') {
      const introDuration = reducedMotion ? 0.05 : this.tuning.introSeconds;
      if (this.phaseAge >= introDuration) {
        this.transition('ready', 'behindPlayer');
      }
      return;
    }

    if (this.phaseValue === 'ready' && this.phaseAge >= this.tuning.readySeconds) {
      this.transition('serving', 'behindPlayer');
      return;
    }

    if (
      this.phaseValue === 'pointResult' &&
      this.phaseAge >= this.tuning.pointResultSeconds
    ) {
      this.serverValue = this.nextServer();
      this.currentRallyValue = 0;
      this.transition('serving', 'behindPlayer');
      return;
    }

    if (this.phaseValue === 'exiting') {
      const exitDuration = reducedMotion ? 0.05 : this.tuning.exitSeconds;
      if (this.phaseAge >= exitDuration) {
        this.finishExit();
      }
    }
  }

  /** Call when a serve has physically launched into play. */
  markServeStarted() {
    if (this.phaseValue !== 'serving') return false;

    this.transition('rally', 'behindPlayer');
    return true;
  }

  /** Call on every authoritative racket/ball contact. */
  recordRallyContact() {
    if (this.phaseValue !== 'rally') return false;

    this.currentRallyValue += 1;
    this.bestRallyValue = Math.max(this.bestRallyValue, this.currentRallyValue);
    return true;
  }

  /**
   * Resolves one point. Physics decides who actually won; this method only
   * records that result and advances match state.
   */
  resolvePoint(result: ChampionshipPointResult) {
    if (this.phaseValue !== 'rally' && this.phaseValue !== 'serving') return false;

    this.lastPointValue = {
      ...result,
      rallyLength: Math.max(result.rallyLength, this.currentRallyValue),
    };

    if (result.winner === 'player') {
      this.scoreValue.player += 1;
    } else {
      this.scoreValue.opponent += 1;
    }

    if (this.hasMatchWinner()) {
      this.transition('matchResult', 'matchResult');
    } else {
      this.transition('pointResult', 'pointReaction');
    }

    return true;
  }

  /** Reset only match scoring. Keep the selected opponent for a fast rematch. */
  rematch() {
    if (this.phaseValue !== 'matchResult' || !this.opponentValue) return false;

    this.resetMatchData();
    this.transition('ready', 'behindPlayer');
    return true;
  }

  /** Begin the visual transition back to the ordinary club. */
  requestExit() {
    if (this.phaseValue === 'inactive' || this.phaseValue === 'exiting') return false;

    this.transition('exiting', 'club');
    return true;
  }

  /**
   * Emergency cleanup for an externally cancelled Activity. Normal player exits
   * should use requestExit() so the camera can animate home first.
   */
  forceReset() {
    this.finishExit();
  }

  snapshot(): ChampionshipSnapshot {
    return {
      phase: this.phaseValue,
      cameraMode: this.cameraModeValue,
      opponentId: this.opponentValue?.id ?? null,
      score: { ...this.scoreValue },
      server: this.serverValue,
      bestRally: this.bestRallyValue,
      currentRally: this.currentRallyValue,
      lastPoint: this.lastPointValue ? { ...this.lastPointValue } : null,
    };
  }

  private transition(
    phase: ChampionshipPhase,
    cameraMode: ChampionshipCameraMode,
  ) {
    this.phaseValue = phase;
    this.cameraModeValue = cameraMode;
    this.phaseAge = 0;
  }

  private resetMatchData() {
    this.scoreValue = { player: 0, opponent: 0 };
    this.serverValue = 'player';
    this.currentRallyValue = 0;
    this.bestRallyValue = 0;
    this.lastPointValue = null;
  }

  private hasMatchWinner() {
    const high = Math.max(this.scoreValue.player, this.scoreValue.opponent);
    const low = Math.min(this.scoreValue.player, this.scoreValue.opponent);

    return high >= this.tuning.pointsToWin && high - low >= this.tuning.winBy;
  }

  private nextServer(): 'player' | 'opponent' {
    // Alternate after each completed point for the compact championship format.
    return this.serverValue === 'player' ? 'opponent' : 'player';
  }

  private finishExit() {
    this.phaseValue = 'inactive';
    this.cameraModeValue = 'club';
    this.phaseAge = 0;
    this.opponentValue = null;
    this.resetMatchData();
  }
}
