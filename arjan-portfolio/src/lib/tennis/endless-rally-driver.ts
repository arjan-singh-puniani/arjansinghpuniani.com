import { ENDLESS_RALLY_CONFIG } from "@/lib/tennis/config";
import { evaluateRallyContact, type ContactEvaluation } from "@/lib/tennis/contact";
import { applyContactToScore, createRunScore } from "@/lib/tennis/endless-rally-machine";
import { bufferPrimarySwing, createContactTimeline, predictRacketBallIntercept, prepareIncomingBall, timingTrace, type CuePlayerState } from "@/lib/tennis/contact-cue";
import { strikeEndlessRallyBall, validateLegalReturn } from "@/lib/tennis/rally-contact-physics";
import { generateRallyPattern } from "@/lib/tennis/rally-generator";
import { stepArcadeBallInPlace } from "@/lib/vector-tennis";

export type DrivenReturn = {
  rally: number;
  inputErrorMs: number;
  contact: ContactEvaluation;
  legalReturn: boolean;
  trace: ReturnType<typeof timingTrace>;
};

/** Development balance driver: the same seed and cue-relative inputs reproduce the same physical returns. */
export function driveCueFollowingRun(seed: number, inputErrorsMs: readonly number[]): DrivenReturn[] {
  const returns: DrivenReturn[] = [];
  let score = createRunScore();
  let player: CuePlayerState = { x: 0, vx: 0, targetX: 0, z: 0.78, racketHeight: 0.32, forehand: true };
  let availableSeconds = 1.4;
  let launchSimMs = 0;

  for (let index = 0; index < inputErrorsMs.length; index += 1) {
    const pattern = generateRallyPattern(seed, index, { playerX: player.x, playerVelocityX: player.vx, racketHeight: player.racketHeight, availableSeconds });
    player = { ...player, targetX: pattern.targetX, forehand: pattern.targetX >= player.x };
    const incoming = prepareIncomingBall(pattern);
    const intercept = predictRacketBallIntercept(incoming, player, pattern.contactZ);
    const timeline = createContactTimeline(launchSimMs, intercept.delayMs);
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
    const legalReturn = contact.successful && validateLegalReturn(strikeEndlessRallyBall(collisionBall, contact)).legal;
    returns.push({ rally: index + 1, inputErrorMs: timingErrorMs, contact, legalReturn, trace: timingTrace(buffered, buffered.racketPeakVelocitySimMs) });
    if (!contact.successful || !legalReturn) break;
    score = applyContactToScore(score, contact);
    player = { ...player, x: intercept.racketX, racketHeight: intercept.racketHeight };
    availableSeconds = pattern.recoverySeconds;
    launchSimMs = buffered.racketPeakVelocitySimMs + 500;
  }
  return returns;
}
