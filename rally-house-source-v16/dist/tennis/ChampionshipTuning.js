/**
 * Central tuning values for Championship Mode.
 *
 * Keep numbers that directly change game feel here rather than scattering them
 * through Game.ts or the match state machine. That makes playtesting changes
 * deliberate, reviewable, and easy to revert.
 */
export const CHAMPIONSHIP_TUNING = {
    introSeconds: 1.9,
    readySeconds: 0.42,
    pointResultSeconds: 1.05,
    exitSeconds: 0.85,
    /** Compact tiebreak-style format: first to 7, win by 2. */
    pointsToWin: 7,
    winBy: 2,
    /**
     * Input windows are intentionally forgiving. These are controller-level
     * numbers only; physical racket/ball contact remains authoritative in the
     * interactive tennis system.
     */
    // A generous input buffer lets an intentional early press survive until the
    // ball actually enters a hittable window. The racket/ball geometry below is
    // still authoritative, so this improves feel without creating phantom hits.
    swingBufferSeconds: 1.1,
    perfectWindowSeconds: 0.15,
    cleanWindowSeconds: 0.42,
    defensiveWindowSeconds: 0.85,
    /**
     * Court steering is filtered before it reaches Character.moveOnCourt.
     * Acceleration stays quick enough for arcade tennis, while release and
     * direction changes have very little inertia; an arcade player can chase a ball immediately.
     */
    movementAcceleration: 38,
    movementDeceleration: 44,
    movementReverseSharpness: 62,
    playerMinCourtSpeedScale: 0.08,
    playerMaxCourtSpeedScale: 2.45,
    /**
     * First-rally readability. Early opponent balls deliberately arrive slower
     * and closer to the player so the game teaches contact before difficulty.
     */
    assistContacts: 5,
    assistOpponentFlightSeconds: 1.14,
    assistOpponentServeFlightSeconds: 1.24,
    assistOpponentSpread: 0.28,
    playerReturnReach: 2.85,
    returnEarlyLeadSeconds: 0.5,
    returnLateGraceSeconds: 0.065,
    arcadeStrokeTempo: 0.72,
    arcadeContactTempo: 0.7,
    opponentServeReadSeconds: 0.3,
    /** Presentation scale for the championship ball and its locator. */
    ballVisualRadius: 0.235,
    /** A livelier rebound, without changing flight targets or horizontal pace. */
    ballRestitution: 0.64,
    ballHaloRadius: 0.35,
};
