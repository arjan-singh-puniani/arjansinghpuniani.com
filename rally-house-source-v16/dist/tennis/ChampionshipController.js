import { CHAMPIONSHIP_TUNING, } from './ChampionshipTuning.js';
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
    tuning;
    phaseValue = 'inactive';
    cameraModeValue = 'club';
    opponentValue = null;
    phaseAge = 0;
    scoreValue = { player: 0, opponent: 0 };
    serverValue = 'player';
    currentRallyValue = 0;
    bestRallyValue = 0;
    lastPointValue = null;
    constructor(tuning = CHAMPIONSHIP_TUNING) {
        this.tuning = tuning;
    }
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
    get score() {
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
    beginChallenge(opponent) {
        if (this.phaseValue !== 'inactive')
            return false;
        this.resetMatchData();
        this.opponentValue = opponent;
        this.transition('challenge', 'challengeEstablishing');
        return true;
    }
    /** The opponent accepted and both players are now committed to the match. */
    acceptChallenge() {
        if (this.phaseValue !== 'challenge' || !this.opponentValue)
            return false;
        this.transition('intro', 'matchIntro');
        return true;
    }
    /**
     * Advances non-gameplay presentation phases.
     * Gameplay itself stays fixed-step in the existing Game loop.
     */
    update(dt, reducedMotion = false) {
        if (!Number.isFinite(dt) || dt <= 0 || this.phaseValue === 'inactive')
            return;
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
        if (this.phaseValue === 'pointResult' &&
            this.phaseAge >= this.tuning.pointResultSeconds) {
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
        if (this.phaseValue !== 'serving')
            return false;
        this.transition('rally', 'behindPlayer');
        return true;
    }
    /** Call on every authoritative racket/ball contact. */
    recordRallyContact() {
        if (this.phaseValue !== 'rally')
            return false;
        this.currentRallyValue += 1;
        this.bestRallyValue = Math.max(this.bestRallyValue, this.currentRallyValue);
        return true;
    }
    /**
     * Resolves one point. Physics decides who actually won; this method only
     * records that result and advances match state.
     */
    resolvePoint(result) {
        if (this.phaseValue !== 'rally' && this.phaseValue !== 'serving')
            return false;
        this.lastPointValue = {
            ...result,
            rallyLength: Math.max(result.rallyLength, this.currentRallyValue),
        };
        if (result.winner === 'player') {
            this.scoreValue.player += 1;
        }
        else {
            this.scoreValue.opponent += 1;
        }
        if (this.hasMatchWinner()) {
            this.transition('matchResult', 'matchResult');
        }
        else {
            this.transition('pointResult', 'pointReaction');
        }
        return true;
    }
    /** Reset only match scoring. Keep the selected opponent for a fast rematch. */
    rematch() {
        if (this.phaseValue !== 'matchResult' || !this.opponentValue)
            return false;
        this.resetMatchData();
        this.transition('ready', 'behindPlayer');
        return true;
    }
    /** Begin the visual transition back to the ordinary club. */
    requestExit() {
        if (this.phaseValue === 'inactive' || this.phaseValue === 'exiting')
            return false;
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
    snapshot() {
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
    transition(phase, cameraMode) {
        this.phaseValue = phase;
        this.cameraModeValue = cameraMode;
        this.phaseAge = 0;
    }
    resetMatchData() {
        this.scoreValue = { player: 0, opponent: 0 };
        this.serverValue = 'player';
        this.currentRallyValue = 0;
        this.bestRallyValue = 0;
        this.lastPointValue = null;
    }
    hasMatchWinner() {
        const high = Math.max(this.scoreValue.player, this.scoreValue.opponent);
        const low = Math.min(this.scoreValue.player, this.scoreValue.opponent);
        return high >= this.tuning.pointsToWin && high - low >= this.tuning.winBy;
    }
    nextServer() {
        // Alternate after each completed point for the compact championship format.
        return this.serverValue === 'player' ? 'opponent' : 'player';
    }
    finishExit() {
        this.phaseValue = 'inactive';
        this.cameraModeValue = 'club';
        this.phaseAge = 0;
        this.opponentValue = null;
        this.resetMatchData();
    }
}
