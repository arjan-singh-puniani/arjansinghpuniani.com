import { ENDLESS_RALLY_CONFIG, type EndlessRallyConfig } from "@/lib/tennis/config";

export type ContactLabel = "PERFECT" | "CLEAN" | "DEFENSIVE" | "EARLY" | "LATE" | "FRAME" | "UNREACHABLE";
export type FailureCause = "early" | "late" | "frame" | "net" | "long" | "unreachable";

export type ContactEvaluationInput = {
  timingErrorMs: number;
  ballX: number;
  ballHeight: number;
  racketX: number;
  racketHeight: number;
  racketFaceNormalZ: number;
  racketHeadSpeed: number;
  stringBedOffset: number;
  incomingSpeed: number;
  incomingSpin: number;
};

export type ContactEvaluation = {
  label: ContactLabel;
  successful: boolean;
  timingErrorMs: number;
  failureCause?: FailureCause;
  restitution: number;
  spinTransfer: number;
  paceScale: number;
};

export function classifyTiming(timingErrorMs: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): ContactLabel {
  const absoluteErrorMs = Math.abs(timingErrorMs);
  if (absoluteErrorMs <= config.timing.perfectMaxMs) return "PERFECT";
  if (absoluteErrorMs <= config.timing.cleanMaxMs) return "CLEAN";
  if (absoluteErrorMs <= config.timing.defensiveMaxMs) return "DEFENSIVE";
  return timingErrorMs < 0 ? "EARLY" : "LATE";
}

export function evaluateContact(input: ContactEvaluationInput, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): ContactEvaluation {
  const timingLabel = classifyTiming(input.timingErrorMs, config);
  if (timingLabel === "EARLY" || timingLabel === "LATE") {
    return { label: timingLabel, successful: false, timingErrorMs: input.timingErrorMs, failureCause: timingLabel === "EARLY" ? "early" : "late", restitution: 0, spinTransfer: 0, paceScale: 0 };
  }

  const unreachable = Math.abs(input.ballX - input.racketX) > config.contact.racketReachX
    || Math.abs(input.ballHeight - input.racketHeight) > config.contact.racketReachHeight;
  if (unreachable) return { label: "UNREACHABLE", successful: false, timingErrorMs: input.timingErrorMs, failureCause: "unreachable", restitution: 0, spinTransfer: 0, paceScale: 0 };

  const frame = Math.abs(input.stringBedOffset) >= config.contact.frameMinOffset
    || input.racketFaceNormalZ < config.contact.minFaceNormalZ
    || input.racketHeadSpeed < config.contact.minRacketHeadSpeed;
  if (frame) return { label: "FRAME", successful: false, timingErrorMs: input.timingErrorMs, failureCause: "frame", restitution: 0.28, spinTransfer: 0.12, paceScale: 0.24 };

  const sweetSpot = Math.abs(input.stringBedOffset) <= config.contact.sweetSpotMaxOffset;
  const label = timingLabel === "PERFECT" && sweetSpot ? "PERFECT" : timingLabel === "DEFENSIVE" ? "DEFENSIVE" : "CLEAN";
  const incomingLoad = Math.min(0.12, input.incomingSpeed * 0.025 + Math.abs(input.incomingSpin) * 0.003);
  if (label === "PERFECT") return { label, successful: true, timingErrorMs: input.timingErrorMs, restitution: 0.91 + incomingLoad, spinTransfer: 0.72, paceScale: 1.12 };
  if (label === "CLEAN") return { label, successful: true, timingErrorMs: input.timingErrorMs, restitution: 0.82 + incomingLoad, spinTransfer: 0.58, paceScale: 1 };
  return { label, successful: true, timingErrorMs: input.timingErrorMs, restitution: 0.7 + incomingLoad, spinTransfer: 0.42, paceScale: 0.78 };
}

export function evaluateRallyContact(input: ContactEvaluationInput, successfulReturns: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): ContactEvaluation {
  const openingAssist = successfulReturns < config.openingAssistance.successfulReturns;
  if (!openingAssist) return evaluateContact(input, config);

  const assistedConfig: EndlessRallyConfig = {
    ...config,
    contact: {
      ...config.contact,
      racketReachX: config.openingAssistance.racketReachX,
      racketReachHeight: config.openingAssistance.racketReachHeight,
      sweetSpotMaxOffset: config.openingAssistance.sweetSpotMaxOffset,
      frameMinOffset: config.openingAssistance.frameMinOffset,
      minFaceNormalZ: config.openingAssistance.minFaceNormalZ,
      minRacketHeadSpeed: config.openingAssistance.minRacketHeadSpeed,
    },
  };
  const evaluation = evaluateContact(input, assistedConfig);
  const assistedSweetSpot = evaluation.successful
    && evaluation.label === "CLEAN"
    && Math.abs(input.stringBedOffset) <= config.openingAssistance.sweetSpotMaxOffset;
  if (!assistedSweetSpot) return evaluation;
  return {
    ...evaluation,
    label: "PERFECT",
    restitution: Math.max(evaluation.restitution, 0.94),
    spinTransfer: Math.max(evaluation.spinTransfer, 0.7),
    paceScale: Math.max(evaluation.paceScale, 1.08),
  };
}
