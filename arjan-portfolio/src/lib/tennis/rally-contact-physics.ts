import { ENDLESS_RALLY_CONFIG } from "@/lib/tennis/config";
import type { ContactEvaluation } from "@/lib/tennis/contact";
import { ensureArcadeNetClearance, stepArcadeBallInPlace, strikeArcadeBall, type ArcadeBallState, type ArcadeShot } from "@/lib/vector-tennis";

const OPPONENT_BASELINE_Z = -1;
const SINGLES_SIDELINE_X = 1;
const LINE_TOLERANCE = 0.025;
const ROBOT_REACH_X = 0.29;
const ROBOT_RETURN_MAX_HEIGHT = 0.66;

export function strikeEndlessRallyBall(incoming: ArcadeBallState, contact: ContactEvaluation, robotX = 0): ArcadeBallState {
  const shot: ArcadeShot = contact.label === "PERFECT" ? "flat" : contact.label === "CLEAN" ? "topspin" : "slice";
  const charge = contact.label === "PERFECT" ? 0.96 : contact.label === "CLEAN" ? 0.74 : contact.label === "DEFENSIVE" ? 0.48 : 0.28;
  const intendedAim = -robotX * 0.35;
  const scrambleDrift = contact.label === "SCRAMBLE" ? Math.sign(contact.timingErrorMs || 1) * 0.18 : 0;
  const controlledAim = intendedAim * contact.directionalControl + scrambleDrift;
  const timing = contact.label === "PERFECT" ? 1 : contact.label === "CLEAN" ? 0.8 : contact.label === "DEFENSIVE" ? 0.54 : 0.34;
  const ball = strikeArcadeBall(incoming, "player", shot, controlledAim, charge, timing);
  ball.vz *= contact.restitution * contact.paceScale;
  ball.vx *= 0.8 + contact.spinTransfer * 0.35;
  if (contact.label === "DEFENSIVE") ball.vy += 0.38;
  if (contact.label === "SCRAMBLE") ball.vy += 0.68;
  const minimumNetClearance = contact.label === "PERFECT"
    ? ENDLESS_RALLY_CONFIG.contact.perfectNetClearance
    : contact.label === "CLEAN"
      ? ENDLESS_RALLY_CONFIG.contact.cleanNetClearance
      : contact.label === "DEFENSIVE"
        ? ENDLESS_RALLY_CONFIG.contact.defensiveNetClearance
        : ENDLESS_RALLY_CONFIG.contact.scrambleNetClearance;
  return ensureArcadeNetClearance(ball, minimumNetClearance);
}

/** A returned ball is judged by where its first bounce lands, not where it travels afterward. */
export function isLegalOpponentBounce(ball: Pick<ArcadeBallState, "x" | "z">) {
  return (
    Math.abs(ball.x) <= SINGLES_SIDELINE_X + LINE_TOLERANCE &&
    ball.z <= LINE_TOLERANCE &&
    ball.z >= OPPONENT_BASELINE_Z - LINE_TOLERANCE
  );
}

/**
 * The rival may return only after a legal first bounce and only if the ball is
 * physically close enough to its current position. This prevents the old
 * teleporting return and gives curved passing shots a real chance to become winners.
 */
export function canRobotReturnBall(ball: ArcadeBallState, robotX: number) {
  return (
    ball.active &&
    ball.lastHit === "player" &&
    ball.bounces === 1 &&
    ball.z < -0.4 &&
    Math.abs(ball.x - robotX) <= ROBOT_REACH_X &&
    ball.height <= ROBOT_RETURN_MAX_HEIGHT
  );
}

/** Any dead returned ball must resolve to a winner or an out; never a frozen PLAYING state. */
export function resolveDeadReturnedBall(ball: ArcadeBallState, firstBounceWasLegal: boolean | null) {
  if (ball.active) return null;
  if (firstBounceWasLegal === true && ball.bounces >= 2) return "winner" as const;
  if (firstBounceWasLegal === true) return "winner" as const;
  return "out" as const;
}

export function validateLegalReturn(source: ArcadeBallState) {
  const ball = { ...source };
  let priorZ = ball.z;
  let priorBounces = ball.bounces;
  for (let step = 0; step < 480; step += 1) {
    stepArcadeBallInPlace(ball, ENDLESS_RALLY_CONFIG.fixedStepSeconds);
    if (priorZ > 0 && ball.z <= 0 && ball.height < 0.2) return { legal: false, cause: "net" as const, ball };
    if (ball.bounces > priorBounces) {
      if (ball.bounces === 1) {
        const legal = isLegalOpponentBounce(ball);
        return { legal, cause: legal ? null : "long" as const, ball };
      }
      if (ball.bounces >= 2) return { legal: true, cause: null, ball };
    }
    if (!ball.active) return { legal: false, cause: "long" as const, ball };
    priorZ = ball.z;
    priorBounces = ball.bounces;
  }
  return { legal: false, cause: "unreachable" as const, ball };
}
