export type RallyPhaseName = "ORIENTATION" | "RHYTHM" | "CONFIDENCE" | "PRESSURE" | "MASTERY" | "HIGH PRESSURE" | "SURVIVAL";

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

export type EndlessRallyConfig = {
  fixedStepSeconds: number;
  timing: {
    perfectMaxMs: number;
    cleanMaxMs: number;
    defensiveMaxMs: number;
    scrambleMaxMs: number;
    swingLeadMs: number;
  };
  contact: {
    racketReachX: number;
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
    successfulReturns: number;
    racketReachX: number;
    racketReachHeight: number;
    sweetSpotMaxOffset: number;
    frameMinOffset: number;
    minFaceNormalZ: number;
    minRacketHeadSpeed: number;
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
};

/**
 * Simulation time is milliseconds and seconds as named. Court coordinates are
 * normalized: x -1..1 spans the singles court and z -1..1 spans the baselines.
 * Difficulty is driven by ball behaviour; the published timing windows never shrink.
 */
export const ENDLESS_RALLY_CONFIG: EndlessRallyConfig = {
  fixedStepSeconds: 1 / 120,
  timing: {
    perfectMaxMs: 45,
    cleanMaxMs: 100,
    defensiveMaxMs: 175,
    scrambleMaxMs: 220,
    swingLeadMs: 54,
  },
  contact: {
    racketReachX: 0.36,
    racketReachHeight: 0.42,
    sweetSpotMaxOffset: 0.46,
    frameMinOffset: 0.86,
    severeFrameMinOffset: 1.08,
    minFaceNormalZ: 0.5,
    severeFaceNormalZ: 0.32,
    minRacketHeadSpeed: 0.58,
    severeRacketHeadSpeed: 0.38,
    perfectNetClearance: 0.42,
    cleanNetClearance: 0.36,
    defensiveNetClearance: 0.34,
    scrambleNetClearance: 0.4,
  },
  openingAssistance: {
    successfulReturns: 4,
    racketReachX: 0.44,
    racketReachHeight: 0.5,
    sweetSpotMaxOffset: 0.72,
    frameMinOffset: 0.98,
    minFaceNormalZ: 0.42,
    minRacketHeadSpeed: 0.48,
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
      { name: "ORIENTATION", startRally: 1, endRally: 4, incomingPaceMultiplierMin: 0.72, incomingPaceMultiplierMax: 0.76, lateralReachFractionMax: 0.12, spinIntensityMax: 0, minimumTimeToContactMs: 1150, contactDepthMin: 0.66, contactDepthMax: 0.7 },
      { name: "RHYTHM", startRally: 5, endRally: 8, incomingPaceMultiplierMin: 0.77, incomingPaceMultiplierMax: 0.82, lateralReachFractionMax: 0.2, spinIntensityMax: 0.05, minimumTimeToContactMs: 1050, contactDepthMin: 0.64, contactDepthMax: 0.72 },
      { name: "CONFIDENCE", startRally: 9, endRally: 12, incomingPaceMultiplierMin: 0.83, incomingPaceMultiplierMax: 0.89, lateralReachFractionMax: 0.3, spinIntensityMax: 0.15, minimumTimeToContactMs: 950, contactDepthMin: 0.6, contactDepthMax: 0.76 },
      { name: "PRESSURE", startRally: 13, endRally: 20, incomingPaceMultiplierMin: 0.9, incomingPaceMultiplierMax: 0.99, lateralReachFractionMax: 0.42, spinIntensityMax: 0.3, minimumTimeToContactMs: 850, contactDepthMin: 0.56, contactDepthMax: 0.8 },
      { name: "MASTERY", startRally: 21, endRally: 32, incomingPaceMultiplierMin: 1, incomingPaceMultiplierMax: 1.09, lateralReachFractionMax: 0.55, spinIntensityMax: 0.5, minimumTimeToContactMs: 750, contactDepthMin: 0.52, contactDepthMax: 0.82 },
      { name: "HIGH PRESSURE", startRally: 33, endRally: 48, incomingPaceMultiplierMin: 1.1, incomingPaceMultiplierMax: 1.18, lateralReachFractionMax: 0.68, spinIntensityMax: 0.72, minimumTimeToContactMs: 680, contactDepthMin: 0.5, contactDepthMax: 0.84 },
      { name: "SURVIVAL", startRally: 49, endRally: null, incomingPaceMultiplierMin: 1.19, incomingPaceMultiplierMax: 1.26, lateralReachFractionMax: 0.78, spinIntensityMax: 1, minimumTimeToContactMs: 620, contactDepthMin: 0.48, contactDepthMax: 0.86 },
    ],
    patternUnlocks: {
      leftCenterRightRally: 5,
      depthVariationRally: 9,
      alternatingPlacementRally: 9,
      topspinRally: 12,
      sliceRally: 17,
      paceDepthCombinationRally: 21,
      wideSpinCombinationRally: 33,
      advancedSequenceRally: 49,
    },
  },
  reachability: {
    playerAccelerationPerSecond2: 5.4,
    playerMaxSpeedPerSecond: 1.48,
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
    resultsDelayMs: 180,
    maximumRestartDelayMs: 400,
    trailPoints: 42,
    personalBestProximity: 2,
  },
};
