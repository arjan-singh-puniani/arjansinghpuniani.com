import { ENDLESS_RALLY_CONFIG } from "@/lib/tennis/config";
import type { ContactEvaluation, ContactLabel, FailureCause } from "@/lib/tennis/contact";

export type EndlessRallyState = "TITLE" | "READY" | "PLAYING" | "IMPACT" | "RUN_END" | "RESULTS" | "PAUSED";
export type EndlessRallyEvent = "ARM" | "START" | "CONTACT" | "IMPACT_DONE" | "MISS" | "SHOW_RESULTS" | "RESTART" | "PAUSE" | "RESUME" | "RESET";

const transitions: Record<EndlessRallyState, Partial<Record<EndlessRallyEvent, EndlessRallyState>>> = {
  TITLE: { ARM: "READY", START: "PLAYING" },
  READY: { START: "PLAYING", RESET: "READY" },
  PLAYING: { CONTACT: "IMPACT", MISS: "RUN_END", PAUSE: "PAUSED", RESET: "READY" },
  IMPACT: { IMPACT_DONE: "PLAYING", MISS: "RUN_END", PAUSE: "PAUSED" },
  RUN_END: { SHOW_RESULTS: "RESULTS", RESTART: "PLAYING" },
  RESULTS: { RESTART: "PLAYING", RESET: "READY" },
  PAUSED: { RESUME: "PLAYING", RESET: "READY" },
};

export function transitionEndlessRally(state: EndlessRallyState, event: EndlessRallyEvent) {
  return transitions[state][event] ?? state;
}

export function canAcceptSwing(state: EndlessRallyState, swingPending: boolean) {
  return state === "PLAYING" && !swingPending;
}

export function canAcceptRestart(state: EndlessRallyState, primaryInputConsumed: boolean) {
  return (state === "RUN_END" || state === "RESULTS") && !primaryInputConsumed;
}

export type RunScore = {
  rally: number;
  precisionScore: number;
  precisionMultiplier: number;
  perfectContacts: number;
  perfectStreak: number;
  bestPerfectStreak: number;
  timingErrorTotalMs: number;
  timingSamples: number;
  ended: boolean;
};

export function createRunScore(): RunScore {
  return { rally: 0, precisionScore: 0, precisionMultiplier: 1, perfectContacts: 0, perfectStreak: 0, bestPerfectStreak: 0, timingErrorTotalMs: 0, timingSamples: 0, ended: false };
}

export function applyContactToScore(score: RunScore, contact: ContactEvaluation): RunScore {
  if (score.ended || !contact.successful) return score;
  const absoluteErrorMs = Math.abs(contact.timingErrorMs);
  const perfect = contact.label === "PERFECT";
  const nextStreak = perfect ? score.perfectStreak + 1 : 0;
  const nextMultiplier = perfect ? Math.min(5, 1 + nextStreak * 0.25) : 1;
  const qualityPoints = contact.label === "SCRAMBLE" ? 50 : contact.label === "DEFENSIVE" ? 75 : 100;
  return {
    ...score,
    rally: score.rally + 1,
    precisionScore: score.precisionScore + Math.round(qualityPoints * nextMultiplier),
    precisionMultiplier: nextMultiplier,
    perfectContacts: score.perfectContacts + (perfect ? 1 : 0),
    perfectStreak: nextStreak,
    bestPerfectStreak: Math.max(score.bestPerfectStreak, nextStreak),
    timingErrorTotalMs: score.timingErrorTotalMs + absoluteErrorMs,
    timingSamples: score.timingSamples + 1,
  };
}

export function endRun(score: RunScore) {
  return score.ended ? score : { ...score, ended: true };
}

export function meanAbsoluteTimingError(score: RunScore) {
  return score.timingSamples ? Math.round(score.timingErrorTotalMs / score.timingSamples) : 0;
}

export type FailureTelemetry = {
  ballX: number;
  ballHeight: number;
  racketX: number;
  racketHeight: number;
  racketFaceNormalZ: number;
  racketHeadSpeed: number;
  stringBedOffset: number;
  incomingSpeed: number;
  incomingSpin: number;
  difficultyTier: number;
  reachabilityPassed: boolean;
  resultingBallX?: number;
  resultingBallZ?: number;
  resultingBallHeight?: number;
};

export function coachObservation(failure: FailureCause, timingErrorMs: number, score: RunScore, telemetry?: FailureTelemetry) {
  const error = Math.round(Math.abs(timingErrorMs));
  if (failure === "early") return `You swung ${error} ms early. Let the ball enter the front-hip contact zone.`;
  if (failure === "late") return `You swung ${error} ms late. Begin preparation before the bounce reaches you.`;
  if (failure === "frame" && telemetry) {
    const faceDegrees = Math.round(Math.acos(Math.max(-1, Math.min(1, telemetry.racketFaceNormalZ))) * 180 / Math.PI);
    if (telemetry.racketFaceNormalZ < ENDLESS_RALLY_CONFIG.contact.minFaceNormalZ) return `Timing was playable, but the racket face was ${faceDegrees}° open.`;
    return `You reached the ball, but a ${Math.round(Math.abs(telemetry.stringBedOffset) * 100)}% string-bed offset found the frame.`;
  }
  if (failure === "frame") return "You reached the ball, but frame contact deflected the return.";
  if (failure === "net") return "The return stayed too low. Meet the next ball farther in front for safer clearance.";
  if (failure === "long") return "You reached the ball, but unstable contact sent the return long.";
  if (telemetry && !telemetry.reachabilityPassed) return `You arrived late to a ball ${Math.abs(telemetry.ballX - telemetry.racketX).toFixed(2)} court units outside the racket zone.`;
  if (score.rally < 4) return "Recover toward center as soon as the racket finishes across your body.";
  return "The ball moved beyond the reachable contact zone. Read the placement one exchange earlier.";
}

export type PersonalBestStatus = "BEST IN 2" | "BEST IN 1" | "TIED BEST" | "NEW BEST" | null;

export function personalBestStatus(rally: number, best: number): PersonalBestStatus {
  if (best <= 0) return rally > 0 ? "NEW BEST" : null;
  if (rally > best) return "NEW BEST";
  if (rally === best) return "TIED BEST";
  const remaining = best - rally;
  if (remaining === 1) return "BEST IN 1";
  if (remaining === 2) return "BEST IN 2";
  return null;
}

export function impactFeedback(label: ContactLabel, reducedMotion: boolean) {
  const durationMs = label === "PERFECT"
    ? ENDLESS_RALLY_CONFIG.feedback.perfectImpactMs
    : label === "CLEAN"
      ? ENDLESS_RALLY_CONFIG.feedback.cleanImpactMs
      : label === "DEFENSIVE"
        ? ENDLESS_RALLY_CONFIG.feedback.defensiveImpactMs
        : ENDLESS_RALLY_CONFIG.feedback.scrambleImpactMs;
  const cameraImpulsePx = reducedMotion ? 0 : label === "PERFECT" ? 4 : label === "CLEAN" ? 1.5 : label === "DEFENSIVE" ? 0.75 : 0.35;
  return { durationMs, cameraImpulsePx };
}

export type RunResult = {
  rally: number;
  perfectContacts: number;
  bestPerfectStreak: number;
  precisionScore: number;
  meanTimingErrorMs: number;
  failureCause: FailureCause;
  timingLabel: ContactLabel | "NET" | "LONG";
  timingErrorMs: number;
  coach: string;
  telemetry?: FailureTelemetry;
};

export function createRunResult(score: RunScore, failureCause: FailureCause, timingLabel: RunResult["timingLabel"], timingErrorMs: number, telemetry?: FailureTelemetry): RunResult {
  const measuredSamples = score.timingSamples + (Number.isFinite(timingErrorMs) ? 1 : 0);
  const measuredErrorTotalMs = score.timingErrorTotalMs + (Number.isFinite(timingErrorMs) ? Math.abs(timingErrorMs) : 0);
  return {
    rally: score.rally,
    perfectContacts: score.perfectContacts,
    bestPerfectStreak: score.bestPerfectStreak,
    precisionScore: score.precisionScore,
    meanTimingErrorMs: measuredSamples ? Math.round(measuredErrorTotalMs / measuredSamples) : meanAbsoluteTimingError(score),
    failureCause,
    timingLabel,
    timingErrorMs,
    coach: coachObservation(failureCause, timingErrorMs, score, telemetry),
    telemetry,
  };
}
