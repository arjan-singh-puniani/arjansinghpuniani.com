import { describe, expect, it } from "vitest";
import { ENDLESS_RALLY_CONFIG } from "@/lib/tennis/config";
import { classifyTiming, evaluateContact, evaluateRallyContact } from "@/lib/tennis/contact";
import { bufferPrimarySwing, consumeBufferedSwing, createContactTimeline, cuePresentation, hasBallPassedContactVolume, timingTrace } from "@/lib/tennis/contact-cue";
import { driveCueFollowingRun } from "@/lib/tennis/endless-rally-driver";
import {
  applyContactToScore,
  canAcceptRestart,
  canAcceptSwing,
  coachObservation,
  createRunScore,
  endRun,
  impactFeedback,
  personalBestStatus,
  resultsPresentation,
  transitionEndlessRally,
  type FailureTelemetry,
} from "@/lib/tennis/endless-rally-machine";
import {
  createSafeFallbackPattern,
  capIncomingSpeedForReadability,
  dailyRallySeed,
  difficultyForRally,
  generatePatternSequence,
  generateRallyPattern,
  isPatternReachable,
  maxReachableDistance,
  smootherstep,
} from "@/lib/tennis/rally-generator";
import { DEFAULT_ENDLESS_RALLY_STATS, loadEndlessRallyStats, mergeRunIntoStats, parseEndlessRallyStats, saveEndlessRallyStats } from "@/lib/tennis/persistence";

const physicalContact = {
  ballX: 0.1,
  ballZ: 0.69,
  ballHeight: 0.31,
  racketX: 0.08,
  racketZ: 0.78,
  racketHeight: 0.3,
  racketFaceNormalZ: 0.92,
  racketHeadSpeed: 1.24,
  stringBedOffset: 0.12,
  incomingSpeed: 1.7,
  incomingSpin: 2.2,
};

describe("Endless Rally fixed contact model", () => {
  it("uses the exact published Standard timing boundaries", () => {
    expect(classifyTiming(70)).toBe("PERFECT");
    expect(classifyTiming(-70)).toBe("PERFECT");
    expect(classifyTiming(71)).toBe("CLEAN");
    expect(classifyTiming(150)).toBe("CLEAN");
    expect(classifyTiming(151)).toBe("DEFENSIVE");
    expect(classifyTiming(260)).toBe("DEFENSIVE");
    expect(classifyTiming(261)).toBe("SCRAMBLE");
    expect(classifyTiming(360)).toBe("SCRAMBLE");
    expect(classifyTiming(-361)).toBe("EARLY");
    expect(classifyTiming(361)).toBe("LATE");
  });

  it("classifies a physically valid 246 ms early input as Defensive", () => {
    const contact = evaluateContact({ ...physicalContact, timingErrorMs: -246 });
    expect(contact.label).toBe("DEFENSIVE");
    expect(contact.successful).toBe(true);
  });

  it("requires physical contact for Scramble and every timing-valid return", () => {
    expect(evaluateContact({ ...physicalContact, timingErrorMs: 320 }).label).toBe("SCRAMBLE");
    expect(evaluateContact({ ...physicalContact, timingErrorMs: 320, ballX: 0.8 }).label).toBe("UNREACHABLE");
    expect(evaluateContact({ ...physicalContact, timingErrorMs: 30, ballX: 0.8 }).successful).toBe(false);
    expect(evaluateContact({ ...physicalContact, timingErrorMs: 30, ballZ: 1.1 }).successful).toBe(false);
  });

  it("turns marginal frame contact into Scramble but rejects severe frame contact", () => {
    expect(evaluateContact({ ...physicalContact, timingErrorMs: 20, stringBedOffset: 0.9 }).label).toBe("SCRAMBLE");
    expect(evaluateContact({ ...physicalContact, timingErrorMs: 20, stringBedOffset: 1.12 }).label).toBe("FRAME");
  });

  it("lets first-time players discover Perfect without changing the published Standard bands", () => {
    const wideContact = { ...physicalContact, timingErrorMs: 100, ballX: 0.48, stringBedOffset: 0.2 };
    expect(evaluateRallyContact(wideContact, 0).label).toBe("PERFECT");
    expect(evaluateRallyContact({ ...wideContact, timingErrorMs: 180 }, 0).label).toBe("CLEAN");
    expect(evaluateRallyContact({ ...wideContact, timingErrorMs: 280 }, 0).label).toBe("DEFENSIVE");
    expect(evaluateRallyContact({ ...wideContact, timingErrorMs: 350 }, 0).label).toBe("SCRAMBLE");
    expect(evaluateRallyContact(wideContact, 5).label).toBe("CLEAN");
    expect(evaluateRallyContact(wideContact, 6).label).toBe("UNREACHABLE");
    expect(classifyTiming(100)).toBe("CLEAN");
  });
});

describe("Endless Rally smooth difficulty", () => {
  it("uses the named eight-phase emotional progression", () => {
    expect(difficultyForRally(1).phase).toBe("CALIBRATION");
    expect(difficultyForRally(2).phase).toBe("ORIENTATION");
    expect(difficultyForRally(8).phase).toBe("RHYTHM");
    expect(difficultyForRally(12).phase).toBe("CONFIDENCE");
    expect(difficultyForRally(20).phase).toBe("PRESSURE");
    expect(difficultyForRally(32).phase).toBe("MASTERY");
    expect(difficultyForRally(48).phase).toBe("HIGH PRESSURE");
    expect(difficultyForRally(49).phase).toBe("SURVIVAL");
  });

  it("stays shallow through Rally 8 and preserves readable flight time", () => {
    for (let rally = 1; rally <= 8; rally += 1) {
      const difficulty = difficultyForRally(rally);
      expect(difficulty.paceMultiplier).toBeLessThanOrEqual(0.82);
      expect(difficulty.placementRangeX).toBeLessThanOrEqual(ENDLESS_RALLY_CONFIG.difficulty.maxPlacementX * 0.2);
      expect(difficulty.minimumTimeToContactMs).toBeGreaterThanOrEqual(1050);
    }
    const cappedSpeed = capIncomingSpeedForReadability(1.44, 2.2, 1150);
    expect(1.44 / cappedSpeed).toBeGreaterThanOrEqual(1.15);
  });

  it("keeps spin absent through Rally 8 and strong spin out until Rally 21", () => {
    const patterns = generatePatternSequence(918273, 20);
    for (const pattern of patterns.slice(0, 8)) {
      expect(pattern.topspin).toBe(0);
      expect(pattern.sidespin).toBe(0);
    }
    for (const pattern of patterns) {
      expect(Math.abs(pattern.topspin) / ENDLESS_RALLY_CONFIG.difficulty.maxTopspin).toBeLessThanOrEqual(0.3);
      expect(Math.abs(pattern.sidespin) / ENDLESS_RALLY_CONFIG.difficulty.maxSlice).toBeLessThanOrEqual(0.3);
    }
  });

  it("increases monotonically with no post-calibration pace jump above 6%", () => {
    const values = Array.from({ length: 100 }, (_, index) => difficultyForRally(index + 1));
    for (let index = 1; index < values.length; index += 1) {
      expect(values[index].paceMultiplier).toBeGreaterThanOrEqual(values[index - 1].paceMultiplier);
      expect(values[index].placementRangeX).toBeGreaterThanOrEqual(values[index - 1].placementRangeX);
      expect(values[index].spinIntensity).toBeGreaterThanOrEqual(values[index - 1].spinIntensity);
      expect(values[index].minimumTimeToContactMs).toBeLessThanOrEqual(values[index - 1].minimumTimeToContactMs);

      // Rally 1 is intentionally a slower calibration feed. Enforce the 6%
      // consecutive pace cap after that special onboarding transition.
      if (index > 1) {
        const paceDelta =
  (values[index].paceMultiplier - values[index - 1].paceMultiplier) /
  values[index - 1].paceMultiplier;

expect(paceDelta).toBeLessThanOrEqual(
  ENDLESS_RALLY_CONFIG.difficulty.maximumConsecutivePaceDelta + 1e-10
);
      }
    }
  });

  it("approaches capped late-game values without introducing placement and spin maxima together", () => {
    const placementPlateau = difficultyForRally(ENDLESS_RALLY_CONFIG.difficulty.survivalPlateauRally);
    const final = difficultyForRally(200);
    expect(placementPlateau.placementRangeX).toBeCloseTo(ENDLESS_RALLY_CONFIG.difficulty.maxPlacementX * 0.78);
    expect(placementPlateau.spinIntensity).toBeLessThan(1);
    expect(final.paceMultiplier).toBeCloseTo(1.26);
    expect(final.spinIntensity).toBe(1);
    expect(final.minimumTimeToContactMs).toBe(620);
    expect(ENDLESS_RALLY_CONFIG.difficulty.standardIncomingSpeedPerSecond * final.paceMultiplier).toBeLessThanOrEqual(ENDLESS_RALLY_CONFIG.difficulty.maxIncomingSpeedPerSecond);
  });

  it("uses a bounded smootherstep curve", () => {
    expect(smootherstep(-1)).toBe(0);
    expect(smootherstep(0.5)).toBeCloseTo(0.5);
    expect(smootherstep(2)).toBe(1);
  });
});

describe("Endless Rally deterministic pattern safety", () => {
  it("reproduces identical sequences for the same seed and keeps onboarding scripted", () => {
    expect(generatePatternSequence(73421, 80)).toEqual(generatePatternSequence(73421, 80));

    // The first eight rallies are intentionally seed-independent so every new
    // player learns the same readable opening pattern.
    expect(generatePatternSequence(73421, 8)).toEqual(generatePatternSequence(73422, 8));

    // Seeded variation should emerge once later-game pattern variety unlocks.
    expect(generatePatternSequence(73421, 60)).not.toEqual(generatePatternSequence(73422, 60));
  });

  it("keeps every generated pattern inside caps and reachable", () => {
    const patterns = generatePatternSequence(918273, 120);
    let playerX = 0;
    for (let index = 0; index < patterns.length; index += 1) {
      const pattern = patterns[index];
      const availableSeconds = index === 0 ? 1.2 : patterns[index - 1].recoverySeconds;
      expect(pattern.incomingSpeed).toBeLessThanOrEqual(ENDLESS_RALLY_CONFIG.difficulty.maxIncomingSpeedPerSecond);
      expect(Math.abs(pattern.targetX)).toBeLessThanOrEqual(ENDLESS_RALLY_CONFIG.reachability.courtLimitX);
      expect(isPatternReachable(pattern, { playerX, availableSeconds })).toBe(true);
      playerX = pattern.targetX;
    }
  });

  it("uses a deterministic fixed-attempt fallback that is reachable", () => {
    const fallbackConfig = { ...ENDLESS_RALLY_CONFIG, difficulty: { ...ENDLESS_RALLY_CONFIG.difficulty, maxRegenerationAttempts: 0 } };
    const state = { playerX: 0, availableSeconds: 0.2 };
    const first = generateRallyPattern(7, 35, state, fallbackConfig);
    const second = generateRallyPattern(7, 35, state, fallbackConfig);
    expect(first).toEqual(second);
    expect(first.usedFallback).toBe(true);
    expect(isPatternReachable(first, state, fallbackConfig)).toBe(true);
    expect(createSafeFallbackPattern(35, state)).toEqual(createSafeFallbackPattern(35, state));
  });

  it("accounts for recovery direction in reachability", () => {
    const movingToward = maxReachableDistance(0.75, ENDLESS_RALLY_CONFIG, 0.8);
    const movingAway = maxReachableDistance(0.75, ENDLESS_RALLY_CONFIG, -0.8);
    expect(movingToward).toBeGreaterThan(movingAway);
  });

  it("derives a stable daily seed from the local calendar date", () => {
    expect(dailyRallySeed(new Date(2026, 7, 31))).toEqual(dailyRallySeed(new Date(2026, 7, 31)));
    expect(dailyRallySeed(new Date(2026, 7, 31))).not.toEqual(dailyRallySeed(new Date(2026, 8, 1)));
  });
});

describe("Endless Rally scoring, feedback, and state", () => {
  it("lets Defensive and Scramble preserve the run while resetting the multiplier", () => {
    const perfect = evaluateContact({ ...physicalContact, timingErrorMs: 12 });
    const defensive = evaluateContact({ ...physicalContact, timingErrorMs: 138 });
    const scramble = evaluateContact({ ...physicalContact, timingErrorMs: 190 });
    const first = applyContactToScore(createRunScore(), perfect);
    const second = applyContactToScore(first, defensive);
    const third = applyContactToScore(second, scramble);
    expect([first.rally, second.rally, third.rally]).toEqual([1, 2, 3]);
    expect(second.precisionMultiplier).toBe(1);
    expect(third.precisionMultiplier).toBe(1);
  });

  it("ends on one miss and prevents scoring afterward", () => {
    const ended = endRun(createRunScore());
    const contact = evaluateContact({ ...physicalContact, timingErrorMs: 0 });
    expect(applyContactToScore(ended, contact)).toBe(ended);
  });

  it("enforces transitions, duplicate swings, immediate restart, and restart isolation", () => {
    expect(transitionEndlessRally("READY", "START")).toBe("PLAYING");
    expect(transitionEndlessRally("PLAYING", "CONTACT")).toBe("IMPACT");
    expect(transitionEndlessRally("IMPACT", "IMPACT_DONE")).toBe("PLAYING");
    expect(transitionEndlessRally("PLAYING", "MISS")).toBe("RUN_END");
    expect(transitionEndlessRally("RUN_END", "SHOW_RESULTS")).toBe("RESULTS");
    expect(transitionEndlessRally("RESULTS", "RESTART")).toBe("PLAYING");
    expect(canAcceptSwing("PLAYING", false)).toBe(true);
    expect(canAcceptSwing("PLAYING", true)).toBe(false);
    expect(canAcceptSwing("RESULTS", false)).toBe(false);
    expect(canAcceptRestart("RESULTS", false)).toBe(true);
    expect(canAcceptRestart("RESULTS", true)).toBe(false);
    expect(ENDLESS_RALLY_CONFIG.feedback.resultsDelayMs).toBeLessThan(ENDLESS_RALLY_CONFIG.feedback.maximumRestartDelayMs);
  });

  it("removes camera impulse for reduced motion", () => {
    expect(impactFeedback("PERFECT", false).cameraImpulsePx).toBeGreaterThan(0);
    expect(impactFeedback("PERFECT", true).cameraImpulsePx).toBe(0);
  });

  it("reports exact personal-best pressure states", () => {
    expect(personalBestStatus(8, 10)).toBe("BEST IN 2");
    expect(personalBestStatus(9, 10)).toBe("BEST IN 1");
    expect(personalBestStatus(10, 10)).toBe("TIED BEST");
    expect(personalBestStatus(11, 10)).toBe("NEW BEST");
    expect(personalBestStatus(3, 10)).toBeNull();
  });

  it("uses measured telemetry in Coach Brain", () => {
    const telemetry: FailureTelemetry = { ballX: 0.8, ballHeight: 0.3, racketX: 0.1, racketHeight: 0.3, racketFaceNormalZ: 0.4, racketHeadSpeed: 1.1, stringBedOffset: 0.2, incomingSpeed: 1.8, incomingSpin: 2, difficultyTier: 2, reachabilityPassed: true };
    expect(coachObservation("early", -138, createRunScore(), telemetry)).toContain("138 ms early");
    expect(coachObservation("frame", 40, createRunScore(), telemetry)).toMatch(/racket face was \d+° open/);
  });
});

describe("Endless Rally persistence", () => {
  it("migrates v0 data and recovers from corrupt data", () => {
    expect(parseEndlessRallyStats("not-json")).toEqual(DEFAULT_ENDLESS_RALLY_STATS);
    const migrated = parseEndlessRallyStats(JSON.stringify({ version: 0, bestRally: 12, bestStreak: 4, bestScore: 1500 }));
    expect(migrated.allTimeBestRally).toBe(12);
    expect(migrated.highestPerfectStreak).toBe(4);
    expect(migrated.bestPrecisionScore).toBe(1500);
  });

  it("loads, saves, and merges personal and daily bests safely", () => {
    let stored: string | null = null;
    const storage = { getItem: () => stored, setItem: (_key: string, value: string) => { stored = value; } };
    expect(loadEndlessRallyStats(storage).allTimeBestRally).toBe(0);
    const next = mergeRunIntoStats(DEFAULT_ENDLESS_RALLY_STATS, { rally: 9, bestPerfectStreak: 3, precisionScore: 1200 }, "2026-08-31");
    expect(saveEndlessRallyStats(storage, next)).toBe(true);
    expect(loadEndlessRallyStats(storage).daily["2026-08-31"].bestRally).toBe(9);
  });

  it("fails safely when storage throws", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(loadEndlessRallyStats(broken)).toEqual(DEFAULT_ENDLESS_RALLY_STATS);
    expect(saveEndlessRallyStats(broken, DEFAULT_ENDLESS_RALLY_STATS)).toBe(false);
  });
});
