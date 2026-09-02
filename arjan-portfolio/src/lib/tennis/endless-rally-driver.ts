import { ENDLESS_RALLY_CONFIG } from "@/lib/tennis/config";
import { evaluateRallyContact, openingAssistanceForRally, type ContactEvaluation, type ContactLabel } from "@/lib/tennis/contact";
import { applyContactToScore, createRunScore } from "@/lib/tennis/endless-rally-machine";
import { autoFootworkForPattern, bufferPrimarySwing, createContactTimeline, predictRacketBallIntercept, prepareIncomingBall, timingTrace, type CuePlayerState } from "@/lib/tennis/contact-cue";
import { strikeEndlessRallyBall, validateLegalReturn } from "@/lib/tennis/rally-contact-physics";
import { generateRallyPattern, isPatternReachable } from "@/lib/tennis/rally-generator";
import { stepArcadeBallInPlace } from "@/lib/vector-tennis";

export type DrivenReturn = {
  rally: number;
  inputErrorMs: number;
  contact: ContactEvaluation;
  legalReturn: boolean;
  legalFailureCause: "net" | "long" | "unreachable" | null;
  resolvedBall: { x: number; z: number; height: number; bounces: number };
  trace: ReturnType<typeof timingTrace>;
};

export type OpeningExchangeTrace = {
  rallyIndex: number;
  difficultyPhase: string;
  difficultyTier: number;
  seed: number;
  incomingVelocity: { x: number; y: number; z: number };
  incomingSpin: { topspin: number; sidespin: number };
  lateralPlacement: number;
  targetContactPoint: { x: number; z: number; height: number };
  predictedContactTimeMs: number;
  readableFlightTimeMs: number;
  playerRecoveryDistance: number;
  playerArrivalTimeMs: number;
  racketReach: { x: number; z: number; height: number };
  activeInputWindow: { earlyMs: number; lateMs: number };
  acceptanceBoundaries: { perfectMs: number; cleanMs: number; defensiveMs: number; scrambleMs: number };
  reachable: boolean;
  failureClassification: ContactLabel | null;
  assistanceApplied: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function estimatePlayerArrivalMs(player: CuePlayerState, targetX: number) {
  let x = player.x;
  let vx = player.vx;
  let elapsedMs = 0;
  for (let step = 0; step < 600; step += 1) {
    if (Math.abs(targetX - x) <= ENDLESS_RALLY_CONFIG.contact.racketReachX * 0.5) return elapsedMs;
    const dt = ENDLESS_RALLY_CONFIG.fixedStepSeconds;
    const desiredVelocity = clamp((targetX - x) * 5.2, -ENDLESS_RALLY_CONFIG.reachability.playerMaxSpeedPerSecond, ENDLESS_RALLY_CONFIG.reachability.playerMaxSpeedPerSecond);
    const maxChange = ENDLESS_RALLY_CONFIG.reachability.playerAccelerationPerSecond2 * dt;
    vx += clamp(desiredVelocity - vx, -maxChange, maxChange);
    x += vx * dt;
    elapsedMs += dt * 1000;
  }
  return Number.POSITIVE_INFINITY;
}

/** Development-only balance trace used to compare the opening across seeds. */
export function traceOpeningExchanges(seed: number, count = 12): OpeningExchangeTrace[] {
  const trace: OpeningExchangeTrace[] = [];
  let player: CuePlayerState = { x: 0, vx: 0, targetX: 0, z: 0.78, racketHeight: 0.32, forehand: true };
  let availableSeconds = 1.4;
  let launchSimMs = 0;
  for (let index = 0; index < count; index += 1) {
    const pattern = generateRallyPattern(seed, index, { playerX: player.x, playerVelocityX: player.vx, racketHeight: player.racketHeight, availableSeconds });
    const recoveryDistance = Math.abs(pattern.targetX - player.x);
    const arrivalMs = estimatePlayerArrivalMs(player, pattern.targetX);
    const assistance = openingAssistanceForRally(index + 1);
    player = { ...player, ...autoFootworkForPattern(player.x, pattern) };
    const incoming = prepareIncomingBall(pattern);
    const intercept = predictRacketBallIntercept(incoming, player, pattern.contactZ);
    const timeline = createContactTimeline(launchSimMs, intercept.delayMs, ENDLESS_RALLY_CONFIG, assistance.earlyBufferMs);
    const reachable = isPatternReachable(pattern, { playerX: player.x, playerVelocityX: player.vx, racketHeight: player.racketHeight, availableSeconds }) && intercept.reachable;
    trace.push({
      rallyIndex: index + 1,
      difficultyPhase: pattern.phase,
      difficultyTier: pattern.tier,
      seed,
      incomingVelocity: { x: incoming.vx, y: incoming.vy, z: incoming.vz },
      incomingSpin: { topspin: incoming.topspin, sidespin: incoming.sidespin },
      lateralPlacement: pattern.targetX,
      targetContactPoint: { x: intercept.ballX, z: intercept.ballZ, height: intercept.ballHeight },
      predictedContactTimeMs: timeline.predictedInterceptSimMs,
      readableFlightTimeMs: intercept.delayMs,
      playerRecoveryDistance: recoveryDistance,
      playerArrivalTimeMs: arrivalMs,
      racketReach: { x: assistance.racketReachX, z: assistance.racketReachZ, height: assistance.racketReachHeight },
      activeInputWindow: { earlyMs: assistance.earlyBufferMs, lateMs: assistance.lateToleranceMs },
      acceptanceBoundaries: {
        perfectMs: ENDLESS_RALLY_CONFIG.timing.perfectMaxMs,
        cleanMs: ENDLESS_RALLY_CONFIG.timing.cleanMaxMs,
        defensiveMs: ENDLESS_RALLY_CONFIG.timing.defensiveMaxMs,
        scrambleMs: ENDLESS_RALLY_CONFIG.timing.scrambleMaxMs,
      },
      reachable,
      failureClassification: reachable ? null : "UNREACHABLE",
      assistanceApplied: index + 1 < assistance.incomingRally || assistance.racketReachX > ENDLESS_RALLY_CONFIG.contact.racketReachX,
    });
    player = { ...player, x: intercept.racketX, racketHeight: intercept.racketHeight };
    availableSeconds = pattern.recoverySeconds;
    launchSimMs = timeline.predictedInterceptSimMs + 500;
  }
  return trace;
}

/** Development balance driver: the same seed and cue-relative inputs reproduce the same physical returns. */
export function driveCueFollowingRun(seed: number, inputErrorsMs: readonly number[]): DrivenReturn[] {
  const returns: DrivenReturn[] = [];
  let score = createRunScore();
  let player: CuePlayerState = { x: 0, vx: 0, targetX: 0, z: 0.78, racketHeight: 0.32, forehand: true };
  let availableSeconds = 1.4;
  let launchSimMs = 0;

  for (let index = 0; index < inputErrorsMs.length; index += 1) {
    const pattern = generateRallyPattern(seed, index, { playerX: player.x, playerVelocityX: player.vx, racketHeight: player.racketHeight, availableSeconds });
    player = { ...player, ...autoFootworkForPattern(player.x, pattern) };
    const incoming = prepareIncomingBall(pattern);
    const intercept = predictRacketBallIntercept(incoming, player, pattern.contactZ);
    const assistance = openingAssistanceForRally(index + 1);
    const timeline = createContactTimeline(launchSimMs, intercept.delayMs, ENDLESS_RALLY_CONFIG, assistance.earlyBufferMs);
    const inputSimMs = timeline.displayedIdealInputSimMs + inputErrorsMs[index];
    const buffered = bufferPrimarySwing(inputSimMs, timeline, false);
    if (!buffered) break;

    const collisionBall = { ...incoming };
    const steps = Math.max(0, Math.round((buffered.racketPeakVelocitySimMs - launchSimMs) / (ENDLESS_RALLY_CONFIG.fixedStepSeconds * 1000)));
    for (let step = 0; step < steps && collisionBall.active; step += 1) stepArcadeBallInPlace(collisionBall, ENDLESS_RALLY_CONFIG.fixedStepSeconds);
    const timingErrorMs = buffered.inputErrorMs;
    const contact = evaluateRallyContact({
      timingErrorMs,
      ballX: collisionBall.x,
      ballZ: collisionBall.z,
      ballHeight: collisionBall.height,
      racketX: intercept.racketX,
      racketZ: intercept.racketZ,
      racketHeight: intercept.racketHeight,
      racketFaceNormalZ: 0.97 - Math.min(0.2, Math.abs(timingErrorMs) / 1200),
      racketHeadSpeed: 1.46 - Math.min(0.42, Math.abs(timingErrorMs) / 720),
      stringBedOffset: (collisionBall.x - intercept.racketX) / ENDLESS_RALLY_CONFIG.contact.racketReachX + timingErrorMs / 760,
      incomingSpeed: Math.hypot(collisionBall.vx, collisionBall.vz, collisionBall.vy),
      incomingSpin: collisionBall.topspin + collisionBall.sidespin,
    }, score.rally);
    const validation = contact.successful
      ? validateLegalReturn(strikeEndlessRallyBall(collisionBall, contact))
      : { legal: false, cause: contact.failureCause === "unreachable" ? "unreachable" as const : "long" as const, ball: collisionBall };
    const legalReturn = validation.legal;
    returns.push({
      rally: index + 1,
      inputErrorMs: timingErrorMs,
      contact,
      legalReturn,
      legalFailureCause: validation.cause,
      resolvedBall: { x: validation.ball.x, z: validation.ball.z, height: validation.ball.height, bounces: validation.ball.bounces },
      trace: timingTrace(buffered, buffered.racketPeakVelocitySimMs),
    });
    if (!contact.successful || !legalReturn) break;
    score = applyContactToScore(score, contact);
    player = { ...player, x: intercept.racketX, racketHeight: intercept.racketHeight };
    availableSeconds = pattern.recoverySeconds;
    launchSimMs = buffered.racketPeakVelocitySimMs + 500;
  }
  return returns;
}
