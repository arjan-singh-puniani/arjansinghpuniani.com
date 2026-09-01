import { ENDLESS_RALLY_CONFIG } from "@/lib/tennis/config";
import type { ContactEvaluation } from "@/lib/tennis/contact";
import { ensureArcadeNetClearance, stepArcadeBallInPlace, strikeArcadeBall, type ArcadeBallState, type ArcadeShot } from "@/lib/vector-tennis";

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

export function validateLegalReturn(source: ArcadeBallState) {
  const ball = { ...source };
  let priorZ = ball.z;
  for (let step = 0; step < 480 && ball.active; step += 1) {
    stepArcadeBallInPlace(ball, ENDLESS_RALLY_CONFIG.fixedStepSeconds);
    if (priorZ > 0 && ball.z <= 0 && ball.height < 0.2) return { legal: false, cause: "net" as const, ball };
    if (Math.abs(ball.x) > 1.06 || ball.z < -1.14) return { legal: ball.z < -1.14 && Math.abs(ball.x) <= 1.06, cause: "long" as const, ball };
    if (ball.z < -0.4) return { legal: true, cause: null, ball };
    priorZ = ball.z;
  }
  return { legal: false, cause: "unreachable" as const, ball };
}
