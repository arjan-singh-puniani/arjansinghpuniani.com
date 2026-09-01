import { describe, expect, it } from "vitest";
import { ENDLESS_RALLY_CONFIG } from "@/lib/tennis/config";
import { classifyTiming, evaluateContact } from "@/lib/tennis/contact";
import { applyContactToScore, canAcceptSwing, createRunScore, endRun, transitionEndlessRally } from "@/lib/tennis/endless-rally-machine";
import { dailyRallySeed, difficultyTierForRally, generatePatternSequence, generateRallyPattern, isPatternReachable } from "@/lib/tennis/rally-generator";
import { DEFAULT_ENDLESS_RALLY_STATS, loadEndlessRallyStats, mergeRunIntoStats, parseEndlessRallyStats, saveEndlessRallyStats } from "@/lib/tennis/persistence";

const physicalContact = {
  ballX: 0.1,
  ballHeight: 0.31,
  racketX: 0.08,
  racketHeight: 0.3,
  racketFaceNormalZ: 0.92,
  racketHeadSpeed: 1.24,
  stringBedOffset: 0.12,
  incomingSpeed: 1.7,
  incomingSpin: 2.2,
};

describe("Endless Rally contact", () => {
  it("uses the exact published contact-window boundaries", () => {
    expect(classifyTiming(35)).toBe("PERFECT");
    expect(classifyTiming(-35)).toBe("PERFECT");
    expect(classifyTiming(36)).toBe("CLEAN");
    expect(classifyTiming(80)).toBe("CLEAN");
    expect(classifyTiming(81)).toBe("DEFENSIVE");
    expect(classifyTiming(130)).toBe("DEFENSIVE");
    expect(classifyTiming(-131)).toBe("EARLY");
    expect(classifyTiming(131)).toBe("LATE");
  });

  it("distinguishes early from late using signed simulation error", () => {
    expect(evaluateContact({ ...physicalContact, timingErrorMs: -150 }).failureCause).toBe("early");
    expect(evaluateContact({ ...physicalContact, timingErrorMs: 150 }).failureCause).toBe("late");
  });

  it("requires physical intersection and distinguishes strings from frame", () => {
    expect(evaluateContact({ ...physicalContact, timingErrorMs: 0 }).label).toBe("PERFECT");
    expect(evaluateContact({ ...physicalContact, timingErrorMs: 0, stringBedOffset: 0.86 }).label).toBe("FRAME");
    expect(evaluateContact({ ...physicalContact, timingErrorMs: 0, ballX: 0.8 }).label).toBe("UNREACHABLE");
  });
});

describe("Endless Rally generator", () => {
  it("is deterministic for the same seed and sequence", () => {
    expect(generatePatternSequence(73421, 32)).toEqual(generatePatternSequence(73421, 32));
    expect(generatePatternSequence(73421, 8)).not.toEqual(generatePatternSequence(73422, 8));
  });

  it("progresses every four returns without changing timing bands", () => {
    expect(difficultyTierForRally(0)).toBe(0);
    expect(difficultyTierForRally(3)).toBe(0);
    expect(difficultyTierForRally(4)).toBe(1);
    expect(difficultyTierForRally(12)).toBe(3);
    expect(ENDLESS_RALLY_CONFIG.timing).toEqual({ perfectMaxMs: 35, cleanMaxMs: 80, defensiveMaxMs: 130, swingLeadMs: 54 });
  });

  it("caps speed, placement, spin, and filters every generated ball for reachability", () => {
    const patterns = generatePatternSequence(918273, 120);
    for (const pattern of patterns) {
      expect(pattern.incomingSpeed).toBeLessThanOrEqual(ENDLESS_RALLY_CONFIG.difficulty.maxIncomingSpeed);
      expect(Math.abs(pattern.targetX)).toBeLessThanOrEqual(ENDLESS_RALLY_CONFIG.reachability.courtLimitX);
      expect(Math.abs(pattern.topspin)).toBeLessThanOrEqual(ENDLESS_RALLY_CONFIG.difficulty.maxTopspin);
    }
    const pattern = generateRallyPattern(7, 40, { playerX: -0.8, availableSeconds: 0.7 });
    expect(isPatternReachable(pattern, { playerX: -0.8, availableSeconds: 0.7 })).toBe(true);
  });

  it("derives a stable daily seed from the local calendar date", () => {
    expect(dailyRallySeed(new Date(2026, 7, 31))).toEqual(dailyRallySeed(new Date(2026, 7, 31)));
    expect(dailyRallySeed(new Date(2026, 7, 31))).not.toEqual(dailyRallySeed(new Date(2026, 8, 1)));
  });
});

describe("Endless Rally scoring and state", () => {
  it("increments score and streak only for successful contacts", () => {
    const perfect = evaluateContact({ ...physicalContact, timingErrorMs: 12 });
    const clean = evaluateContact({ ...physicalContact, timingErrorMs: 55 });
    const first = applyContactToScore(createRunScore(), perfect);
    expect(first.rally).toBe(1);
    expect(first.perfectStreak).toBe(1);
    const second = applyContactToScore(first, clean);
    expect(second.rally).toBe(2);
    expect(second.perfectStreak).toBe(0);
    expect(second.precisionMultiplier).toBe(1);
  });

  it("does not score after run termination", () => {
    const ended = endRun(createRunScore());
    const contact = evaluateContact({ ...physicalContact, timingErrorMs: 0 });
    expect(applyContactToScore(ended, contact)).toBe(ended);
  });

  it("enforces valid transitions, duplicate-input prevention, and immediate restart", () => {
    expect(transitionEndlessRally("TITLE", "ARM")).toBe("READY");
    expect(transitionEndlessRally("READY", "START")).toBe("PLAYING");
    expect(transitionEndlessRally("PLAYING", "CONTACT")).toBe("IMPACT");
    expect(transitionEndlessRally("IMPACT", "IMPACT_DONE")).toBe("PLAYING");
    expect(transitionEndlessRally("PLAYING", "MISS")).toBe("RUN_END");
    expect(transitionEndlessRally("RUN_END", "SHOW_RESULTS")).toBe("RESULTS");
    expect(transitionEndlessRally("RESULTS", "RESTART")).toBe("PLAYING");
    expect(canAcceptSwing("PLAYING", false)).toBe(true);
    expect(canAcceptSwing("PLAYING", true)).toBe(false);
    expect(canAcceptSwing("RESULTS", false)).toBe(false);
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
