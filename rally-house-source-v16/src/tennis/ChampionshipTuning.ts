/**
 * Central tuning values for Championship Mode.
 *
 * Keep numbers that directly change game feel here rather than scattering them
 * through Game.ts or the match state machine. That makes playtesting changes
 * deliberate, reviewable, and easy to revert.
 */
export const CHAMPIONSHIP_TUNING = {
  introSeconds: 1.9,
  readySeconds: 0.78,
  pointResultSeconds: 2.2,
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
  swingBufferSeconds: 0.62,
  perfectWindowSeconds: 0.085,
  cleanWindowSeconds: 0.22,
  defensiveWindowSeconds: 0.38,

  /**
   * Court steering is filtered before it reaches Character.moveOnCourt.
   * Acceleration stays quick enough for arcade tennis, while release and
   * direction changes retain a little momentum instead of snapping instantly.
   */
  movementAcceleration: 12.5,
  movementDeceleration: 13.5,
  movementReverseSharpness: 20.5,
  playerMinCourtSpeedScale: 0.08,
  playerMaxCourtSpeedScale: 1.08,

  /**
   * First-rally readability. Early opponent balls deliberately arrive slower
   * and closer to the player so the game teaches contact before difficulty.
   */
  assistContacts: 5,
  assistOpponentFlightSeconds: 1.14,
  assistOpponentServeFlightSeconds: 1.24,
  assistOpponentSpread: 0.28,
  playerReturnReach: 2.55,
  opponentServeReadSeconds: 0.55,

  /** Presentation scale for the championship ball and its locator. */
  ballVisualRadius: 0.235,
  /** A livelier rebound, without changing flight targets or horizontal pace. */
  ballRestitution: 0.64,
  ballHaloRadius: 0.35,
} as const;

export type ChampionshipTuning = typeof CHAMPIONSHIP_TUNING;
