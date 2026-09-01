import { ENDLESS_RALLY_CONFIG, type EndlessRallyConfig } from "@/lib/tennis/config";

export type ContactLabel = "PERFECT" | "CLEAN" | "DEFENSIVE" | "SCRAMBLE" | "EARLY" | "LATE" | "FRAME" | "UNREACHABLE";
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
  directionalControl: number;
};

const failedContact = (label: "EARLY" | "LATE" | "FRAME" | "UNREACHABLE", input: ContactEvaluationInput, failureCause: FailureCause): ContactEvaluation => ({
  label,
  successful: false,
  timingErrorMs: input.timingErrorMs,
  failureCause,
  restitution: label === "FRAME" ? 0.28 : 0,
  spinTransfer: label === "FRAME" ? 0.12 : 0,
  paceScale: label === "FRAME" ? 0.24 : 0,
  directionalControl: 0,
});

export function classifyTiming(timingErrorMs: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): ContactLabel {
  const absoluteErrorMs = Math.abs(timingErrorMs);
  if (absoluteErrorMs <= config.timing.perfectMaxMs) return "PERFECT";
  if (absoluteErrorMs <= config.timing.cleanMaxMs) return "CLEAN";
  if (absoluteErrorMs <= config.timing.defensiveMaxMs) return "DEFENSIVE";
  if (absoluteErrorMs <= config.timing.scrambleMaxMs) return "SCRAMBLE";
  return timingErrorMs < 0 ? "EARLY" : "LATE";
}

export function evaluateContact(input: ContactEvaluationInput, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): ContactEvaluation {
  const timingLabel = classifyTiming(input.timingErrorMs, config);
  if (timingLabel === "EARLY" || timingLabel === "LATE") {
    return failedContact(timingLabel, input, timingLabel === "EARLY" ? "early" : "late");
  }

  const unreachable = Math.abs(input.ballX - input.racketX) > config.contact.racketReachX
    || Math.abs(input.ballHeight - input.racketHeight) > config.contact.racketReachHeight;
  if (unreachable) return failedContact("UNREACHABLE", input, "unreachable");

  const severeFrame = Math.abs(input.stringBedOffset) >= config.contact.severeFrameMinOffset
    || input.racketFaceNormalZ < config.contact.severeFaceNormalZ
    || input.racketHeadSpeed < config.contact.severeRacketHeadSpeed;
  if (severeFrame) return failedContact("FRAME", input, "frame");

  const marginalFrame = Math.abs(input.stringBedOffset) >= config.contact.frameMinOffset
    || input.racketFaceNormalZ < config.contact.minFaceNormalZ
    || input.racketHeadSpeed < config.contact.minRacketHeadSpeed;
  const incomingLoad = Math.min(0.12, input.incomingSpeed * 0.025 + Math.abs(input.incomingSpin) * 0.003);
  if (marginalFrame || timingLabel === "SCRAMBLE") {
    return { label: "SCRAMBLE", successful: true, timingErrorMs: input.timingErrorMs, restitution: 0.52 + incomingLoad * 0.35, spinTransfer: 0.24, paceScale: 0.56, directionalControl: 0.34 };
  }

  const sweetSpot = Math.abs(input.stringBedOffset) <= config.contact.sweetSpotMaxOffset;
  const label = timingLabel === "PERFECT" && sweetSpot ? "PERFECT" : timingLabel === "DEFENSIVE" ? "DEFENSIVE" : "CLEAN";
  if (label === "PERFECT") return { label, successful: true, timingErrorMs: input.timingErrorMs, restitution: 0.91 + incomingLoad, spinTransfer: 0.72, paceScale: 1.12, directionalControl: 1 };
  if (label === "CLEAN") return { label, successful: true, timingErrorMs: input.timingErrorMs, restitution: 0.82 + incomingLoad, spinTransfer: 0.58, paceScale: 1, directionalControl: 0.88 };
  return { label, successful: true, timingErrorMs: input.timingErrorMs, restitution: 0.72 + incomingLoad, spinTransfer: 0.42, paceScale: 0.8, directionalControl: 0.66 };
}

export function evaluateRallyContact(input: ContactEvaluationInput, successfulReturns: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): ContactEvaluation {
  if (successfulReturns >= config.openingAssistance.successfulReturns) return evaluateContact(input, config);
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
  return evaluateContact(input, assistedConfig);
}
