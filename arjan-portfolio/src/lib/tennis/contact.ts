import { ENDLESS_RALLY_CONFIG, type EndlessRallyConfig, type OpeningAssistanceKeyframe } from "@/lib/tennis/config";

export type ContactLabel = "PERFECT" | "CLEAN" | "DEFENSIVE" | "SCRAMBLE" | "EARLY" | "LATE" | "FRAME" | "UNREACHABLE";
export type FailureCause = "early" | "late" | "frame" | "net" | "long" | "unreachable";

export type ContactEvaluationInput = {
  timingErrorMs: number;
  ballX: number;
  ballZ: number;
  ballHeight: number;
  racketX: number;
  racketZ: number;
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
    || Math.abs(input.ballZ - input.racketZ) > config.contact.racketReachZ
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

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smootherstep = (value: number) => {
  const x = clamp01(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

/** Smooth, inspectable onboarding assistance. There is no score-specific cliff. */
export function openingAssistanceForRally(incomingRally: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): OpeningAssistanceKeyframe {
  const keyframes = config.openingAssistance.keyframes;
  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (incomingRally <= first.incomingRally) return { ...first };
  if (incomingRally >= last.incomingRally) return { ...last };
  const upperIndex = keyframes.findIndex((keyframe) => incomingRally <= keyframe.incomingRally);
  const lower = keyframes[upperIndex - 1];
  const upper = keyframes[upperIndex];
  const progress = smootherstep((incomingRally - lower.incomingRally) / (upper.incomingRally - lower.incomingRally));
  return {
    incomingRally,
    earlyBufferMs: mix(lower.earlyBufferMs, upper.earlyBufferMs, progress),
    lateToleranceMs: mix(lower.lateToleranceMs, upper.lateToleranceMs, progress),
    racketReachX: mix(lower.racketReachX, upper.racketReachX, progress),
    racketReachZ: mix(lower.racketReachZ, upper.racketReachZ, progress),
    racketReachHeight: mix(lower.racketReachHeight, upper.racketReachHeight, progress),
    sweetSpotMaxOffset: mix(lower.sweetSpotMaxOffset, upper.sweetSpotMaxOffset, progress),
    frameMinOffset: mix(lower.frameMinOffset, upper.frameMinOffset, progress),
    minFaceNormalZ: mix(lower.minFaceNormalZ, upper.minFaceNormalZ, progress),
    minRacketHeadSpeed: mix(lower.minRacketHeadSpeed, upper.minRacketHeadSpeed, progress),
  };
}

export function assistedConfigForRally(incomingRally: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): EndlessRallyConfig {
  const assistance = openingAssistanceForRally(incomingRally, config);
  return {
    ...config,
    contact: {
      ...config.contact,
      racketReachX: assistance.racketReachX,
      racketReachZ: assistance.racketReachZ,
      racketReachHeight: assistance.racketReachHeight,
      sweetSpotMaxOffset: assistance.sweetSpotMaxOffset,
      frameMinOffset: assistance.frameMinOffset,
      minFaceNormalZ: assistance.minFaceNormalZ,
      minRacketHeadSpeed: assistance.minRacketHeadSpeed,
    },
  };
}

export function evaluateRallyContact(input: ContactEvaluationInput, successfulReturns: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): ContactEvaluation {
  const baseContact = evaluateContact(input, config);
  if (baseContact.successful) return baseContact;

  const assistance = openingAssistanceForRally(successfulReturns + 1, config);
  const assistedScrambleMaxMs = input.timingErrorMs < 0
    ? Math.max(config.timing.scrambleMaxMs, assistance.earlyBufferMs)
    : config.timing.scrambleMaxMs;

  const assistedConfig = assistedConfigForRally(successfulReturns + 1, config);
  assistedConfig.timing = { ...config.timing, scrambleMaxMs: assistedScrambleMaxMs };
  const assistedContact = evaluateContact(input, assistedConfig);
  if (!assistedContact.successful) return baseContact;

  // Assistance can preserve a plausible physical touch, but never upgrades its
  // quality. A save is always visible as SCRAMBLE and produces a weaker ball.
  return {
    ...assistedContact,
    label: "SCRAMBLE",
    restitution: Math.min(0.58, assistedContact.restitution),
    spinTransfer: Math.min(0.26, assistedContact.spinTransfer),
    paceScale: Math.min(0.62, assistedContact.paceScale),
    directionalControl: Math.min(0.45, assistedContact.directionalControl),
  };
}
