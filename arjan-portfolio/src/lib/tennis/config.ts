export type EndlessRallyConfig = {
  fixedStepSeconds: number;
  timing: {
    perfectMaxMs: number;
    cleanMaxMs: number;
    defensiveMaxMs: number;
    swingLeadMs: number;
  };
  contact: {
    racketReachX: number;
    racketReachHeight: number;
    sweetSpotMaxOffset: number;
    frameMinOffset: number;
    minFaceNormalZ: number;
    minRacketHeadSpeed: number;
  };
  difficulty: {
    returnsPerTier: number;
    speedIncreasePerTier: number;
    baseIncomingSpeed: number;
    maxIncomingSpeed: number;
    maxPlacementX: number;
    maxTopspin: number;
    maxSlice: number;
  };
  reachability: {
    playerAccelerationPerSecond2: number;
    playerMaxSpeedPerSecond: number;
    maxContactHeight: number;
    minContactHeight: number;
    courtLimitX: number;
    assistance: number;
  };
  feedback: {
    impactEmphasisMs: number;
    resultsDelayMs: number;
    trailPoints: number;
  };
};

/**
 * All timing values are simulation milliseconds. Court positions are normalized:
 * x -1..1 spans the singles court and z -1..1 runs far baseline to near baseline.
 */
export const ENDLESS_RALLY_CONFIG: EndlessRallyConfig = {
  fixedStepSeconds: 1 / 120,
  timing: {
    perfectMaxMs: 35,
    cleanMaxMs: 80,
    defensiveMaxMs: 130,
    swingLeadMs: 54,
  },
  contact: {
    racketReachX: 0.3,
    racketReachHeight: 0.34,
    sweetSpotMaxOffset: 0.34,
    frameMinOffset: 0.78,
    minFaceNormalZ: 0.58,
    minRacketHeadSpeed: 0.72,
  },
  difficulty: {
    returnsPerTier: 4,
    speedIncreasePerTier: 0.035,
    baseIncomingSpeed: 1.48,
    maxIncomingSpeed: 2.22,
    maxPlacementX: 0.78,
    maxTopspin: 7.4,
    maxSlice: 5.8,
  },
  reachability: {
    playerAccelerationPerSecond2: 5.4,
    playerMaxSpeedPerSecond: 1.48,
    maxContactHeight: 0.94,
    minContactHeight: 0.06,
    courtLimitX: 0.88,
    assistance: 0.92,
  },
  feedback: {
    impactEmphasisMs: 58,
    resultsDelayMs: 180,
    trailPoints: 42,
  },
};
