export type RallyPhaseName = "CALIBRATION" | "ORIENTATION" | "RHYTHM" | "CONFIDENCE" | "PRESSURE" | "MASTERY" | "HIGH PRESSURE" | "SURVIVAL";

export type RallyPhaseConfig = {
  name: RallyPhaseName;
  startRally: number;
  endRally: number | null;
  incomingPaceMultiplierMin: number;
  incomingPaceMultiplierMax: number;
  lateralReachFractionMax: number;
  spinIntensityMax: number;
  minimumTimeToContactMs: number;
  contactDepthMin: number;
  contactDepthMax: number;
};

export type OpeningAssistanceKeyframe = {
  /** Incoming exchange number. Values between keyframes are smootherstep-interpolated. */
  incomingRally: number;
  earlyBufferMs: number;
  lateToleranceMs: number;
  racketReachX: number;
  racketReachZ: number;
  racketReachHeight: number;
  sweetSpotMaxOffset: number;
  frameMinOffset: number;
  minFaceNormalZ: number;
  minRacketHeadSpeed: number;
};

export type EndlessRallyConfig = {
  fixedStepSeconds: number;
  timing: {
    perfectMaxMs: number;
    cleanMaxMs: number;
    defensiveMaxMs: number;
    scrambleMaxMs: number;
    inputBufferEarlyMs: number;
    swingPreparationMs: number;
    minimumLateSwingMs: number;
  };
  contact: {
    racketReachX: number;
    racketReachZ: number;
    racketReachHeight: number;
    sweetSpotMaxOffset: number;
    frameMinOffset: number;
    severeFrameMinOffset: number;
    minFaceNormalZ: number;
    severeFaceNormalZ: number;
    minRacketHeadSpeed: number;
    severeRacketHeadSpeed: number;
    perfectNetClearance: number;
    cleanNetClearance: number;
    defensiveNetClearance: number;
    scrambleNetClearance: number;
  };
  openingAssistance: {
    keyframes: readonly OpeningAssistanceKeyframe[];
  };
  difficulty: {
    standardIncomingSpeedPerSecond: number;
    maxIncomingSpeedPerSecond: number;
    maxPlacementX: number;
    maxTopspin: number;
    maxSlice: number;
    maximumConsecutivePaceDelta: number;
    survivalPlateauRally: number;
    spinPlateauRally: number;
    maxRegenerationAttempts: number;
    phases: readonly RallyPhaseConfig[];
    patternUnlocks: {
      leftCenterRightRally: number;
      depthVariationRally: number;
      alternatingPlacementRally: number;
      topspinRally: number;
      sliceRally: number;
      paceDepthCombinationRally: number;
      wideSpinCombinationRally: number;
      advancedSequenceRally: number;
    };
  };
  reachability: {
    playerAccelerationPerSecond2: number;
    playerMaxSpeedPerSecond: number;
    maxContactHeight: number;
    minContactHeight: number;
    courtLimitX: number;
    assistance: number;
    preparationTimeMs: number;
    collisionMarginX: number;
  };
  feedback: {
    perfectImpactMs: number;
    cleanImpactMs: number;
    defensiveImpactMs: number;
    scrambleImpactMs: number;
    resultsDelayMs: number;
    maximumRestartDelayMs: number;
    trailPoints: number;
    personalBestProximity: number;
  };
  cue: {
    completeThroughRally: number;
    ringThroughRally: number;
    fadedThroughRally: number;
    preparationColor: string;
    viableColor: string;
    idealColor: string;
    preparatoryPulseLeadMs: number;
  };
};

/**
 * Simulation time is milliseconds and seconds as named. Court coordinates are
 * normalized: x -1..1 spans the singles court and z -1..1 spans the baselines.
 * Difficulty is driven by ball behaviour; the published timing windows never shrink.
 */
export const ENDLESS_RALLY_CONFIG: EndlessRallyConfig = {
  fixedStepSeconds: 1 / 120,
  timing: {
    perfectMaxMs: 70,
    cleanMaxMs: 150,
    defensiveMaxMs: 260,
    scrambleMaxMs: 360,
    inputBufferEarlyMs: 420,
    swingPreparationMs: 180,
    minimumLateSwingMs: 16,
  },
  contact: {
    racketReachX: 0.36,
    racketReachZ: 0.2,
    racketReachHeight: 0.42,
    sweetSpotMaxOffset: 0.46,
    frameMinOffset: 0.86,
    severeFrameMinOffset: 1.08,
    minFaceNormalZ: 0.5,
    severeFaceNormalZ: 0.32,
    minRacketHeadSpeed: 0.58,
    severeRacketHeadSpeed: 0.38,
    perfectNetClearance: 0.3,
    cleanNetClearance: 0.3,
    defensiveNetClearance: 0.34,
    scrambleNetClearance: 0.4,
  },
  openingAssistance: {
    keyframes: [
      { incomingRally: 1, earlyBufferMs: 500, lateToleranceMs: 250, racketReachX: 0.56, racketReachZ: 0.34, racketReachHeight: 0.62, sweetSpotMaxOffset: 0.72, frameMinOffset: 0.98, minFaceNormalZ: 0.42, minRacketHeadSpeed: 0.48 },
      { incomingRally: 4, earlyBufferMs: 420, lateToleranceMs: 220, racketReachX: 0.5, racketReachZ: 0.3, racketReachHeight: 0.55, sweetSpotMaxOffset: 0.64, frameMinOffset: 0.94, minFaceNormalZ: 0.45, minRacketHeadSpeed: 0.51 },
      { incomingRally: 8, earlyBufferMs: 360, lateToleranceMs: 190, racketReachX: 0.43, racketReachZ: 0.25, racketReachHeight: 0.48, sweetSpotMaxOffset: 0.54, frameMinOffset: 0.9, minFaceNormalZ: 0.48, minRacketHeadSpeed: 0.55 },
      { incomingRally: 13, earlyBufferMs: 360, lateToleranceMs: 180, racketReachX: 0.36, racketReachZ: 0.2, racketReachHeight: 0.42, sweetSpotMaxOffset: 0.46, frameMinOffset: 0.86, minFaceNormalZ: 0.5, minRacketHeadSpeed: 0.58 },
    ],
  },
  difficulty: {
    standardIncomingSpeedPerSecond: 1.72,
    maxIncomingSpeedPerSecond: 2.17,
    maxPlacementX: 0.78,
    maxTopspin: 7.4,
    maxSlice: 5.8,
    maximumConsecutivePaceDelta: 0.06,
    survivalPlateauRally: 72,
    spinPlateauRally: 76,
    maxRegenerationAttempts: 4,
    phases: [
      { name: "CALIBRATION", startRally: 1, endRally: 1, incomingPaceMultiplierMin: 0.5, incomingPaceMultiplierMax: 0.5, lateralReachFractionMax: 0, spinIntensityMax: 0, minimumTimeToContactMs: 1400, contactDepthMin: 0.68, contactDepthMax: 0.68 },
      { name: "ORIENTATION", startRally: 2, endRally: 3, incomingPaceMultiplierMin: 0.53, incomingPaceMultiplierMax: 0.56, lateralReachFractionMax: 0.08, spinIntensityMax: 0, minimumTimeToContactMs: 1300, contactDepthMin: 0.66, contactDepthMax: 0.7 },
      { name: "RHYTHM", startRally: 4, endRally: 7, incomingPaceMultiplierMin: 0.58, incomingPaceMultiplierMax: 0.68, lateralReachFractionMax: 0.18, spinIntensityMax: 0, minimumTimeToContactMs: 1200, contactDepthMin: 0.64, contactDepthMax: 0.72 },
      { name: "CONFIDENCE", startRally: 8, endRally: 12, incomingPaceMultiplierMin: 0.7, incomingPaceMultiplierMax: 0.82, lateralReachFractionMax: 0.3, spinIntensityMax: 0.1, minimumTimeToContactMs: 1050, contactDepthMin: 0.6, contactDepthMax: 0.76 },
      { name: "PRESSURE", startRally: 13, endRally: 20, incomingPaceMultiplierMin: 0.83, incomingPaceMultiplierMax: 0.96, lateralReachFractionMax: 0.45, spinIntensityMax: 0.3, minimumTimeToContactMs: 900, contactDepthMin: 0.56, contactDepthMax: 0.8 },
      { name: "MASTERY", startRally: 21, endRally: 32, incomingPaceMultiplierMin: 0.97, incomingPaceMultiplierMax: 1.1, lateralReachFractionMax: 0.6, spinIntensityMax: 0.5, minimumTimeToContactMs: 760, contactDepthMin: 0.52, contactDepthMax: 0.82 },
      { name: "HIGH PRESSURE", startRally: 33, endRally: 48, incomingPaceMultiplierMin: 1.1, incomingPaceMultiplierMax: 1.18, lateralReachFractionMax: 0.68, spinIntensityMax: 0.72, minimumTimeToContactMs: 680, contactDepthMin: 0.5, contactDepthMax: 0.84 },
      { name: "SURVIVAL", startRally: 49, endRally: null, incomingPaceMultiplierMin: 1.19, incomingPaceMultiplierMax: 1.26, lateralReachFractionMax: 0.78, spinIntensityMax: 1, minimumTimeToContactMs: 620, contactDepthMin: 0.48, contactDepthMax: 0.86 },
    ],
    patternUnlocks: {
      leftCenterRightRally: 8,
      depthVariationRally: 8,
      alternatingPlacementRally: 8,
      topspinRally: 9,
      sliceRally: 17,
      paceDepthCombinationRally: 21,
      wideSpinCombinationRally: 25,
      advancedSequenceRally: 49,
    },
  },
  reachability: {
    playerAccelerationPerSecond2: 7.4,
    playerMaxSpeedPerSecond: 1.86,
    maxContactHeight: 0.94,
    minContactHeight: 0.08,
    courtLimitX: 0.88,
    assistance: 0.96,
    preparationTimeMs: 110,
    collisionMarginX: 0.12,
  },
  feedback: {
    perfectImpactMs: 56,
    cleanImpactMs: 34,
    defensiveImpactMs: 30,
    scrambleImpactMs: 26,
    resultsDelayMs: 160,
    maximumRestartDelayMs: 250,
    trailPoints: 42,
    personalBestProximity: 2,
  },
  cue: {
    completeThroughRally: 4,
    ringThroughRally: 8,
    fadedThroughRally: 12,
    preparationColor: "#35ecff",
    viableColor: "#ffeb49",
    idealColor: "#ffffff",
    preparatoryPulseLeadMs: 520,
  },
};
