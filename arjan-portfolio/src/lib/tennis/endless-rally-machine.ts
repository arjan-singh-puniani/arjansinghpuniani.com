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
  return {
    ...score,
    rally: score.rally + 1,
    precisionScore: score.precisionScore + Math.round(100 * nextMultiplier),
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

export function coachObservation(failure: FailureCause, timingErrorMs: number, score: RunScore) {
  const error = Math.round(Math.abs(timingErrorMs));
  if (failure === "early") return `You swung ${error} ms early. Let the ball enter the front hip before committing.`;
  if (failure === "late") return `You swung ${error} ms late. Begin preparation before the bounce reaches you.`;
  if (failure === "frame") return "The ball met the frame. Wait for the string bed to square behind the ball.";
  if (failure === "net") return "The return stayed too low. Contact slightly earlier to create more launch clearance.";
  if (failure === "long") return "The return carried long. A later contact will trade pace for safer shape.";
  if (score.rally >= 8) return "The ball moved beyond the assisted contact zone. Read the lateral pattern one exchange earlier.";
  return "The ball was unreachable from recovery. Prepare toward center immediately after contact.";
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
};

export function createRunResult(score: RunScore, failureCause: FailureCause, timingLabel: RunResult["timingLabel"], timingErrorMs: number): RunResult {
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
    coach: coachObservation(failureCause, timingErrorMs, score),
  };
}
