import { ENDLESS_RALLY_CONFIG, type EndlessRallyConfig } from "@/lib/tennis/config";
import { capIncomingSpeedForReadability, smootherstep, type RallyPattern } from "@/lib/tennis/rally-generator";
import { createArcadeBall, stepArcadeBallInPlace, type ArcadeBallState } from "@/lib/vector-tennis";

export type CuePlayerState = {
  x: number;
  vx: number;
  targetX: number;
  z: number;
  racketHeight: number;
  forehand: boolean;
};

export type PredictedIntercept = {
  delayMs: number;
  ballX: number;
  ballZ: number;
  ballHeight: number;
  racketX: number;
  racketZ: number;
  racketHeight: number;
  forehand: boolean;
  reachable: boolean;
};

export type ContactTimeline = {
  launchSimMs: number;
  displayedIdealInputSimMs: number;
  bufferOpensSimMs: number;
  predictedInterceptSimMs: number;
  swingPreparationMs: number;
  earlyBufferMs: number;
};

export type BufferedSwing = {
  inputSimMs: number;
  displayedIdealInputSimMs: number;
  inputErrorMs: number;
  swingStartSimMs: number;
  racketPeakVelocitySimMs: number;
  predictedInterceptSimMs: number;
  consumed: boolean;
};

export type CuePresentation = {
  visible: boolean;
  showRing: boolean;
  showTap: boolean;
  opacity: number;
  ringScale: number;
  color: string;
  phase: "PREPARE" | "VIABLE" | "IDEAL" | "PASSED";
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function autoFootworkForPattern(currentPlayerX: number, pattern: RallyPattern, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG) {
  const targetX = clamp(pattern.targetX, -config.reachability.courtLimitX, config.reachability.courtLimitX);
  return { targetX, forehand: targetX >= currentPlayerX };
}

export function prepareIncomingBall(pattern: RallyPattern, source?: ArcadeBallState): ArcadeBallState {
  const next = source ? { ...source } : createArcadeBall("rival");
  next.active = true;
  next.lastHit = "rival";
  next.shot = pattern.shot;
  next.bounces = 0;
  if (!source) {
    next.z = -0.76;
    next.x = pattern.targetX * -0.18;
    next.height = 0.6;
  } else {
    // A rival return is a fresh racket strike, so relaunch it from a readable
    // knee/hip-height contact instead of inheriting a near-ground bounce sample.
    // This rule is continuous across phase boundaries, including Rally 8 -> 9.
    next.height = Math.max(next.height, 0.56);
  }
  const flightDistance = Math.max(0.1, pattern.contactZ - next.z);
  next.vz = capIncomingSpeedForReadability(flightDistance, pattern.incomingSpeed, pattern.minimumTimeToContactMs);
  // Drag and the two-bounce lifetime require a small deterministic velocity floor
  // for the opening ball to remain active until contact. This still yields at least
  // 1.4 s on the calibration feed and avoids an artificial UNREACHABLE result.
  const openingProtection = pattern.index <= 7 ? 1 : smootherstep((12 - pattern.index) / 4);
  const protectedVelocityFloor = (1.1 + Math.min(pattern.index, 8) * 0.012) * openingProtection;
  next.vz = Math.max(next.vz, protectedVelocityFloor);
  const approximateFlightSeconds = Math.max(pattern.minimumTimeToContactMs / 1000, flightDistance / next.vz);
  next.vx = (pattern.targetX - next.x) / approximateFlightSeconds - pattern.sidespin * 0.075 * approximateFlightSeconds * 0.5;
  next.vy = pattern.shot === "topspin" ? 1.02 : pattern.shot === "slice" ? 0.78 : 0.88;
  next.topspin = pattern.topspin;
  next.sidespin = pattern.sidespin;
  return next;
}

/** Predicts the same auto-footwork and racket-height recovery used by the live loop. */
export function predictRacketBallIntercept(
  source: ArcadeBallState,
  playerSource: CuePlayerState,
  contactZ: number,
  config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG,
): PredictedIntercept {
  const ball = { ...source };
  const player = { ...playerSource };
  let elapsedMs = 0;
  for (let step = 0; step < 600 && ball.active; step += 1) {
    const dt = config.fixedStepSeconds;
    const desiredVelocity = clamp((player.targetX - player.x) * 5.2, -config.reachability.playerMaxSpeedPerSecond, config.reachability.playerMaxSpeedPerSecond);
    const maxVelocityChange = config.reachability.playerAccelerationPerSecond2 * dt;
    player.vx += clamp(desiredVelocity - player.vx, -maxVelocityChange, maxVelocityChange);
    player.x = clamp(player.x + player.vx * dt, -config.reachability.courtLimitX, config.reachability.courtLimitX);
    player.racketHeight += (clamp(ball.height, 0.16, 0.72) - player.racketHeight) * Math.min(1, dt * 5.8);
    stepArcadeBallInPlace(ball, dt);
    elapsedMs += dt * 1000;
    if (ball.z < contactZ) continue;
    const reachable = Math.abs(ball.x - player.x) <= config.contact.racketReachX
      && Math.abs(ball.z - player.z) <= config.contact.racketReachZ
      && Math.abs(ball.height - player.racketHeight) <= config.contact.racketReachHeight;
    return {
      delayMs: elapsedMs,
      ballX: ball.x,
      ballZ: ball.z,
      ballHeight: ball.height,
      racketX: player.x,
      racketZ: player.z,
      racketHeight: player.racketHeight,
      forehand: player.forehand,
      reachable,
    };
  }
  return {
    delayMs: 1400,
    ballX: source.x,
    ballZ: contactZ,
    ballHeight: source.height,
    racketX: playerSource.x,
    racketZ: playerSource.z,
    racketHeight: playerSource.racketHeight,
    forehand: playerSource.forehand,
    reachable: false,
  };
}

export function createContactTimeline(
  launchSimMs: number,
  interceptDelayMs: number,
  config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG,
  earlyBufferMs = config.timing.inputBufferEarlyMs,
): ContactTimeline {
  const predictedInterceptSimMs = launchSimMs + interceptDelayMs;
  const displayedIdealInputSimMs = predictedInterceptSimMs - config.timing.swingPreparationMs;
  return {
    launchSimMs,
    displayedIdealInputSimMs,
    bufferOpensSimMs: displayedIdealInputSimMs - earlyBufferMs,
    predictedInterceptSimMs,
    swingPreparationMs: config.timing.swingPreparationMs,
    earlyBufferMs,
  };
}

/** Input, cue and animation all reference this one simulation-time timeline. */
export function bufferPrimarySwing(inputSimMs: number, timeline: ContactTimeline, alreadyBuffered: boolean, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): BufferedSwing | null {
  if (alreadyBuffered || inputSimMs < timeline.bufferOpensSimMs || inputSimMs > timeline.displayedIdealInputSimMs + config.timing.scrambleMaxMs) return null;
  // A buffered tap begins visible preparation immediately, while the useful
  // racket-head peak remains aligned with the predicted physical intercept.
  const swingStartSimMs = inputSimMs;
  const racketPeakVelocitySimMs = inputSimMs <= timeline.predictedInterceptSimMs
    ? timeline.predictedInterceptSimMs
    : inputSimMs;
  return {
    inputSimMs,
    displayedIdealInputSimMs: timeline.displayedIdealInputSimMs,
    inputErrorMs: inputSimMs - timeline.displayedIdealInputSimMs,
    swingStartSimMs,
    racketPeakVelocitySimMs,
    predictedInterceptSimMs: timeline.predictedInterceptSimMs,
    consumed: false,
  };
}

export function consumeBufferedSwing(buffer: BufferedSwing, simTimeMs: number): BufferedSwing {
  return simTimeMs >= buffer.swingStartSimMs ? { ...buffer, consumed: true } : buffer;
}

export function hasBallPassedContactVolume(ballZ: number, racketZ: number, racketReachZ: number, ballActive = true) {
  return !ballActive || ballZ > racketZ + racketReachZ;
}

export function cuePresentation(simTimeMs: number, timeline: ContactTimeline, incomingRally: number, fullCueAssist: boolean, reducedMotion: boolean, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): CuePresentation {
  const inputErrorMs = simTimeMs - timeline.displayedIdealInputSimMs;
  const completeCue = fullCueAssist || config.cue.persistentStandardCue || incomingRally <= config.cue.completeThroughRally;
  const showRing = completeCue || incomingRally <= config.cue.ringThroughRally || incomingRally <= config.cue.fadedThroughRally;
  const visible = fullCueAssist || incomingRally <= config.cue.fadedThroughRally || simTimeMs <= timeline.predictedInterceptSimMs;
  const viableProgress = clamp((simTimeMs - timeline.bufferOpensSimMs) / Math.max(1, timeline.displayedIdealInputSimMs - timeline.bufferOpensSimMs), 0, 1);
  const ideal = Math.abs(inputErrorMs) <= config.timing.perfectMaxMs;
  const viable = simTimeMs >= timeline.bufferOpensSimMs && simTimeMs <= timeline.displayedIdealInputSimMs + config.timing.scrambleMaxMs;
  const phase = ideal ? "IDEAL" : simTimeMs > timeline.displayedIdealInputSimMs + config.timing.scrambleMaxMs ? "PASSED" : viable ? "VIABLE" : "PREPARE";
  const baseOpacity = incomingRally <= config.cue.ringThroughRally || fullCueAssist ? 0.94 : incomingRally <= config.cue.fadedThroughRally ? 0.48 : 0.24;
  return {
    visible,
    showRing,
    showTap: completeCue && ideal,
    opacity: phase === "PASSED" ? baseOpacity * 0.4 : baseOpacity,
    ringScale: showRing ? 1 + (reducedMotion ? 0.55 : 1.65) * (1 - viableProgress) : 1,
    color: phase === "IDEAL" ? config.cue.idealColor : phase === "VIABLE" ? config.cue.viableColor : config.cue.preparationColor,
    phase,
  };
}

export function timingTrace(buffer: BufferedSwing, actualCollisionSimMs: number) {
  return {
    inputTimestampMs: buffer.inputSimMs,
    displayedIdealInputTimestampMs: buffer.displayedIdealInputSimMs,
    swingStartTimestampMs: buffer.swingStartSimMs,
    racketPeakVelocityTimestampMs: buffer.racketPeakVelocitySimMs,
    predictedInterceptTimestampMs: buffer.predictedInterceptSimMs,
    actualCollisionTimestampMs: actualCollisionSimMs,
  };
}
