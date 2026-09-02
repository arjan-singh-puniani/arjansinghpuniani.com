import { describe, expect, it } from "vitest";
import { ENDLESS_RALLY_CONFIG } from "@/lib/tennis/config";
import { assistedConfigForRally, classifyTiming, evaluateContact, evaluateRallyContact, openingAssistanceForRally } from "@/lib/tennis/contact";
import { autoFootworkForPattern, bufferPrimarySwing, consumeBufferedSwing, createContactTimeline, cuePresentation, hasBallPassedContactVolume, predictRacketBallIntercept, prepareIncomingBall, timingTrace } from "@/lib/tennis/contact-cue";
import { driveCueFollowingRun, traceOpeningExchanges } from "@/lib/tennis/endless-rally-driver";
import { impactSoundProfile, TennisAudio } from "@/lib/tennis/audio";
import { canRobotReturnBall, isLegalOpponentBounce, resolveDeadReturnedBall, strikeEndlessRallyBall, validateLegalReturn } from "@/lib/tennis/rally-contact-physics";
import { createArcadeBall } from "@/lib/vector-tennis";
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

class MockAudioParam {
  value = 0;
  setValueAtTime(value: number) { this.value = value; return this; }
  linearRampToValueAtTime(value: number) { this.value = value; return this; }
  exponentialRampToValueAtTime(value: number) { this.value = value; return this; }
}

class MockAudioNode {
  disconnected = false;
  connect<T>(node: T) { return node; }
  disconnect() { this.disconnected = true; }
}

class MockScheduledSource extends MockAudioNode {
  onended: (() => void) | null = null;
  starts = 0;
  stops = 0;
  start() { this.starts += 1; }
  stop() { this.stops += 1; }
}

class MockOscillator extends MockScheduledSource {
  type: OscillatorType = "sine";
  frequency = new MockAudioParam();
}

class MockBufferSource extends MockScheduledSource {
  buffer: AudioBuffer | null = null;
}

class MockGain extends MockAudioNode { gain = new MockAudioParam(); }
class MockDelay extends MockAudioNode { delayTime = new MockAudioParam(); }
class MockFilter extends MockAudioNode {
  type: BiquadFilterType = "lowpass";
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
}
class MockCompressor extends MockAudioNode {
  threshold = new MockAudioParam();
  knee = new MockAudioParam();
  ratio = new MockAudioParam();
  attack = new MockAudioParam();
  release = new MockAudioParam();
}

class MockAudioContext {
  state: AudioContextState = "running";
  currentTime = 0;
  sampleRate = 48000;
  destination = new MockAudioNode();
  sources: MockScheduledSource[] = [];
  resumeCalls = 0;
  closeCalls = 0;
  createGain() { return new MockGain(); }
  createDelay() { return new MockDelay(); }
  createBiquadFilter() { return new MockFilter(); }
  createDynamicsCompressor() { return new MockCompressor(); }
  createOscillator() { const source = new MockOscillator(); this.sources.push(source); return source; }
  createBufferSource() { const source = new MockBufferSource(); this.sources.push(source); return source; }
  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length);
    return { getChannelData: () => data };
  }
  resume() { this.resumeCalls += 1; this.state = "running"; return Promise.resolve(); }
  close() { this.closeCalls += 1; this.state = "closed"; return Promise.resolve(); }
}

function createAudioHarness(maximumVoices = 24, state: AudioContextState = "running") {
  const context = new MockAudioContext();
  context.state = state;
  let factoryCalls = 0;
  const audio = new TennisAudio(() => {
    factoryCalls += 1;
    return context as unknown as AudioContext;
  }, maximumVoices);
  return { audio, context, factoryCalls: () => factoryCalls };
}

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

  it("never lets opening assistance award a false Perfect", () => {
    const wideContact = { ...physicalContact, timingErrorMs: 100, ballX: 0.48, stringBedOffset: 0.2 };
    expect(evaluateRallyContact(wideContact, 0).label).toBe("SCRAMBLE");
    expect(evaluateRallyContact({ ...physicalContact, timingErrorMs: 100 }, 0).label).toBe("CLEAN");
    expect(evaluateRallyContact({ ...wideContact, timingErrorMs: 180 }, 0).label).toBe("SCRAMBLE");
    expect(evaluateRallyContact({ ...wideContact, timingErrorMs: 350 }, 0).label).toBe("SCRAMBLE");
    expect(evaluateRallyContact(wideContact, 12).label).toBe("UNREACHABLE");
    expect(classifyTiming(100)).toBe("CLEAN");
  });
});

describe("Endless Rally smooth difficulty", () => {
  it("uses the named eight-phase emotional progression", () => {
    expect(difficultyForRally(1).phase).toBe("CALIBRATION");
    expect(difficultyForRally(2).phase).toBe("ORIENTATION");
    expect(difficultyForRally(4).phase).toBe("RHYTHM");
    expect(difficultyForRally(8).phase).toBe("CONFIDENCE");
    expect(difficultyForRally(12).phase).toBe("CONFIDENCE");
    expect(difficultyForRally(20).phase).toBe("PRESSURE");
    expect(difficultyForRally(32).phase).toBe("MASTERY");
    expect(difficultyForRally(48).phase).toBe("HIGH PRESSURE");
    expect(difficultyForRally(49).phase).toBe("SURVIVAL");
  });

  it("has no fourth-exchange cliff in phase, pace, placement, or readable time", () => {
    const third = difficultyForRally(3);
    const fourth = difficultyForRally(4);
    const fifth = difficultyForRally(5);
    expect(fourth.phase).toBe(fifth.phase);
    expect(fourth.phaseIndex).toBe(fifth.phaseIndex);
    for (const [prior, next] of [[third, fourth], [fourth, fifth]] as const) {
      expect((next.paceMultiplier - prior.paceMultiplier) / prior.paceMultiplier).toBeLessThanOrEqual(ENDLESS_RALLY_CONFIG.difficulty.maximumConsecutivePaceDelta);
      expect(next.placementRangeX - prior.placementRangeX).toBeLessThanOrEqual(0.035);
      expect(prior.minimumTimeToContactMs - next.minimumTimeToContactMs).toBeLessThanOrEqual(100);
    }
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

  it("increases monotonically with no consecutive pace jump above 6%", () => {
    const values = Array.from({ length: 100 }, (_, index) => difficultyForRally(index + 1));
    for (let index = 1; index < values.length; index += 1) {
      expect(values[index].paceMultiplier).toBeGreaterThanOrEqual(values[index - 1].paceMultiplier);
      expect(values[index].placementRangeX).toBeGreaterThanOrEqual(values[index - 1].placementRangeX);
      expect(values[index].spinIntensity).toBeGreaterThanOrEqual(values[index - 1].spinIntensity);
      expect(values[index].minimumTimeToContactMs).toBeLessThanOrEqual(values[index - 1].minimumTimeToContactMs);

      const paceDelta =
        (values[index].paceMultiplier - values[index - 1].paceMultiplier) /
        values[index - 1].paceMultiplier;
      expect(paceDelta).toBeLessThanOrEqual(
        ENDLESS_RALLY_CONFIG.difficulty.maximumConsecutivePaceDelta + 1e-10,
      );
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

describe("Endless Rally opening trace and one-input control", () => {
  it("traces twelve reachable exchanges across deterministic seeds", () => {
    for (const seed of [7, 73421, 918273, 0xffffffff]) {
      const trace = traceOpeningExchanges(seed, 12);
      expect(trace).toHaveLength(12);
      expect(trace.every((exchange) => exchange.reachable)).toBe(true);
      expect(trace.every((exchange) => exchange.readableFlightTimeMs >= difficultyForRally(exchange.rallyIndex).minimumTimeToContactMs)).toBe(true);
      expect(trace[3].difficultyPhase).toBe(trace[4].difficultyPhase);
      expect(trace[4].incomingSpin).toEqual({ topspin: 0, sidespin: 0 });
      expect(trace[5].playerArrivalTimeMs).toBeLessThan(trace[5].readableFlightTimeMs);
      for (const [prior, next] of [[trace[2], trace[3]], [trace[3], trace[4]]] as const) {
        const priorPace = Math.hypot(prior.incomingVelocity.x, prior.incomingVelocity.z);
        const nextPace = Math.hypot(next.incomingVelocity.x, next.incomingVelocity.z);
        expect((nextPace - priorPace) / priorPace).toBeLessThanOrEqual(ENDLESS_RALLY_CONFIG.difficulty.maximumConsecutivePaceDelta);
      }
    }
    expect(traceOpeningExchanges(73421, 12)).toEqual(traceOpeningExchanges(73421, 12));
  });

  it("auto-positions toward every opening intercept without teleporting", () => {
    let playerX = 0;
    for (const pattern of generatePatternSequence(918273, 12)) {
      const footwork = autoFootworkForPattern(playerX, pattern);
      expect(footwork.targetX).toBe(pattern.targetX);
      expect(Math.abs(footwork.targetX - playerX)).toBeLessThanOrEqual(ENDLESS_RALLY_CONFIG.reachability.playerMaxSpeedPerSecond * pattern.recoverySeconds);
      playerX = footwork.targetX;
    }
  });

  it("smoothly fades the opening buffer and racket assistance", () => {
    const values = Array.from({ length: 13 }, (_, index) => openingAssistanceForRally(index + 1));
    expect(values[0].earlyBufferMs).toBe(560);
    expect(values[3].earlyBufferMs).toBe(540);
    expect(values[7].earlyBufferMs).toBe(500);
    expect(values[12].racketReachX).toBe(ENDLESS_RALLY_CONFIG.contact.racketReachX);
    for (let index = 1; index < values.length; index += 1) {
      expect(values[index].earlyBufferMs).toBeLessThanOrEqual(values[index - 1].earlyBufferMs);
      expect(values[index].racketReachX).toBeLessThanOrEqual(values[index - 1].racketReachX);
    }
  });

  it("buffers one cue-relative intention and consumes it exactly once", () => {
    const timeline = createContactTimeline(0, 1400, ENDLESS_RALLY_CONFIG, 500);
    const first = bufferPrimarySwing(timeline.displayedIdealInputSimMs - 400, timeline, false);
    expect(first).not.toBeNull();
    expect(first?.swingStartSimMs).toBe(first?.inputSimMs);
    expect(first?.racketPeakVelocitySimMs).toBe(timeline.predictedInterceptSimMs);
    expect(bufferPrimarySwing(timeline.displayedIdealInputSimMs - 390, timeline, first !== null)).toBeNull();
    expect(consumeBufferedSwing(first!, first!.swingStartSimMs - 1).consumed).toBe(false);
    expect(consumeBufferedSwing(first!, first!.swingStartSimMs).consumed).toBe(true);
    // Pointer, touch and keyboard all enter through this same primary-input gate.
    expect(bufferPrimarySwing(timeline.displayedIdealInputSimMs, timeline, false)?.inputErrorMs).toBe(0);
  });

  it("keeps the visible cue on the exact authoritative input timestamp", () => {
    const timeline = createContactTimeline(500, 1400, ENDLESS_RALLY_CONFIG, 500);
    const atCue = cuePresentation(timeline.displayedIdealInputSimMs, timeline, 1, false, false);
    const buffered = bufferPrimarySwing(timeline.displayedIdealInputSimMs, timeline, false)!;
    expect(atCue.phase).toBe("IDEAL");
    expect(atCue.showTap).toBe(true);
    expect(buffered.displayedIdealInputSimMs).toBe(timeline.displayedIdealInputSimMs);
    expect(buffered.inputErrorMs).toBe(0);
    expect(timingTrace(buffered, timeline.predictedInterceptSimMs).predictedInterceptTimestampMs).toBe(timeline.predictedInterceptSimMs);
  });

  it("does not remove the explicit timing cue after the fourth return", () => {
    const timeline = createContactTimeline(500, 1400, ENDLESS_RALLY_CONFIG, 500);
    const fifthBallCue = cuePresentation(timeline.displayedIdealInputSimMs, timeline, 5, false, false);
    const lateGameCue = cuePresentation(timeline.displayedIdealInputSimMs, timeline, 40, false, false);
    expect(fifthBallCue.showTap).toBe(true);
    expect(fifthBallCue.showRing).toBe(true);
    expect(lateGameCue.showTap).toBe(true);
    expect(lateGameCue.showRing).toBe(true);
  });

  it("keeps human-early taps playable through the former Rally 4 wall", () => {
    const run = driveCueFollowingRun(73421, Array.from({ length: 8 }, () => -480));
    expect(run).toHaveLength(8);
    expect(run.every((exchange) => exchange.contact.label === "SCRAMBLE")).toBe(true);
    expect(run.every((exchange) => exchange.legalReturn)).toBe(true);
  });

  it("does not inherit an ankle-low ball state when Rally 9 unlocks spin", () => {
    const pattern = generateRallyPattern(73421, 8, { playerX: 0, playerVelocityX: 0, racketHeight: 0.32, availableSeconds: 1.18 });
    const source = { ...createArcadeBall("player"), z: -0.58, height: 0.08, vy: -0.4, bounces: 1 };
    const incoming = prepareIncomingBall(pattern, source);
    const footwork = autoFootworkForPattern(0, pattern);
    const intercept = predictRacketBallIntercept(
      incoming,
      { x: 0, vx: 0, targetX: footwork.targetX, z: 0.78, racketHeight: 0.32, forehand: footwork.forehand },
      pattern.contactZ,
      assistedConfigForRally(9),
    );
    expect(incoming.height).toBeGreaterThanOrEqual(0.56);
    expect(incoming.bounces).toBe(0);
    expect(intercept.reachable).toBe(true);
  });

  it("drives a legal twelve-return run by following the cue", () => {
    const run = driveCueFollowingRun(73421, Array.from({ length: 12 }, () => 0));
    expect(run).toHaveLength(12);
    expect(run.every((exchange) => exchange.contact.label === "PERFECT")).toBe(true);
    expect(run.every((exchange) => exchange.legalReturn)).toBe(true);
  });

  it("classifies deterministic cue offsets and rejects input outside the envelope", () => {
    const expected = [
      { inputErrorMs: 0, label: "PERFECT" },
      { inputErrorMs: -100, label: "CLEAN" },
      { inputErrorMs: -200, label: "DEFENSIVE" },
      { inputErrorMs: -300, label: "SCRAMBLE" },
      { inputErrorMs: -400, label: "SCRAMBLE" },
    ] as const;
    for (const sample of expected) {
      const [result] = driveCueFollowingRun(73421, [sample.inputErrorMs]);
      expect(result.contact.label).toBe(sample.label);
      expect(result.legalReturn).toBe(true);
    }
    expect(driveCueFollowingRun(73421, [400])).toHaveLength(0);
  });

  it("still fails when no input arrives before the ball passes", () => {
    expect(hasBallPassedContactVolume(1.01, 0.78, 0.2, true)).toBe(true);
    expect(hasBallPassedContactVolume(0.78, 0.78, 0.2, true)).toBe(false);
  });

  it("keeps assisted Scramble trajectories physical and legal", () => {
    const contact = evaluateRallyContact({ ...physicalContact, ballX: 0.48, timingErrorMs: -400 }, 0);
    const ball = { ...createArcadeBall("rival"), x: 0.48, z: 0.69, height: 0.31, vx: 0.1, vy: -0.2, vz: 1.1, active: true };
    const struck = strikeEndlessRallyBall(ball, contact);
    expect(contact.label).toBe("SCRAMBLE");
    expect(contact.successful).toBe(true);
    expect(struck.vz).toBeLessThan(0);
    expect(struck.vy).toBeGreaterThan(0);
    expect(validateLegalReturn(struck).legal).toBe(true);
  });
});

describe("Endless Rally deterministic pattern safety", () => {
  it("reproduces identical sequences for the same seed and keeps onboarding scripted", () => {
    expect(generatePatternSequence(73421, 80)).toEqual(generatePatternSequence(73421, 80));

    // The first seven rallies are intentionally seed-independent so every new
    // player learns the same readable opening pattern.
    expect(generatePatternSequence(73421, 7)).toEqual(generatePatternSequence(73422, 7));

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
    expect(impactFeedback("PERFECT", true).particleCount).toBe(0);
    expect(impactFeedback("DEFENSIVE", false).cameraImpulsePx).toBe(0);
  });

  it("uses compact early results and fuller results after Rally 4", () => {
    expect(resultsPresentation(4)).toBe("COMPACT");
    expect(resultsPresentation(5)).toBe("FULL");
  });

  it("lets synthesized audio fail safely when Web Audio is unavailable", () => {
    const audio = new TennisAudio();
    expect(() => {
      audio.unlock();
      audio.impact("PERFECT", 1.4, 0.1);
      audio.impact("FRAME", 0.8, 0.94);
      audio.bounce();
      audio.net();
      audio.dispose();
    }).not.toThrow();
  });

  it("creates one shared audio context across repeated unlocks", () => {
    const { audio, context, factoryCalls } = createAudioHarness(24, "suspended");
    audio.unlock();
    audio.unlock();
    expect(factoryCalls()).toBe(1);
    expect(context.resumeCalls).toBe(1);
    audio.dispose();
  });

  it("suppresses every audio event while muted", () => {
    const { audio, context } = createAudioHarness();
    audio.unlock();
    audio.setMuted(true);
    const sourceCount = context.sources.length;
    audio.impact("PERFECT", 1.5, 0.02, 2.1);
    audio.opponentImpact(1, 1.5);
    audio.bounce(1.8);
    audio.net(2);
    audio.cuePulse();
    audio.personalBestMilestone("BEST IN 1");
    audio.result(true);
    expect(context.sources).toHaveLength(sourceCount);
    expect(audio.debugSnapshot().emittedEvents).toBe(0);
    audio.dispose();
  });

  it("caps voices, clears stale restart tails, and disposes safely", () => {
    const { audio, context } = createAudioHarness(8);
    audio.unlock();
    for (let index = 0; index < 10; index += 1) audio.impact("PERFECT", 1.45, 0.05, 2);
    expect(audio.debugSnapshot().activeVoices).toBeLessThanOrEqual(8);
    expect(context.sources.some((source) => source.stops > 1)).toBe(true);
    audio.beginRun();
    expect(audio.debugSnapshot().activeVoices).toBe(0);
    audio.dispose();
    expect(audio.debugSnapshot()).toMatchObject({ activeVoices: 0, pendingTimers: 0, disposed: true });
    expect(context.closeCalls).toBe(1);
  });

  it("fires each personal-best milestone once per run", () => {
    const { audio, context } = createAudioHarness();
    audio.unlock();
    expect(audio.personalBestMilestone("BEST IN 2")).toBe(true);
    const afterFirst = context.sources.length;
    expect(audio.personalBestMilestone("BEST IN 2")).toBe(false);
    expect(context.sources).toHaveLength(afterFirst);
    expect(audio.personalBestMilestone("BEST IN 1")).toBe(true);
    audio.beginRun();
    expect(audio.personalBestMilestone("BEST IN 2")).toBe(true);
    audio.dispose();
  });

  it("maps measured impact physics deterministically into bounded sound profiles", () => {
    const centered = impactSoundProfile("PERFECT", 1.5, 0.02, 2.1);
    const repeated = impactSoundProfile("PERFECT", 1.5, 0.02, 2.1);
    const frame = impactSoundProfile("FRAME", 0.8, 0.94, 1.4);
    expect(centered).toEqual(repeated);
    expect(centered.transientGain).toBeLessThanOrEqual(0.098);
    expect(centered.bodyGain).toBeLessThanOrEqual(0.078);
    expect(centered.brightnessHz).toBeGreaterThan(frame.brightnessHz * 0.5);
    expect(frame.dampingSeconds).toBeLessThan(centered.dampingSeconds);
  });

  it("reports exact personal-best pressure states", () => {
    expect(personalBestStatus(8, 10)).toBe("BEST IN 2");
    expect(personalBestStatus(9, 10)).toBe("BEST IN 1");
    expect(personalBestStatus(10, 10)).toBe("TIED BEST");
    expect(personalBestStatus(11, 10)).toBe("NEW BEST");
    expect(personalBestStatus(3, 10)).toBeNull();
  });

  it("uses measured telemetry in Coach Brain", () => {
    const telemetry: FailureTelemetry = { ballX: 0.8, ballZ: 0.72, ballHeight: 0.3, racketX: 0.1, racketZ: 0.78, racketHeight: 0.3, racketFaceNormalZ: 0.4, racketHeadSpeed: 1.1, stringBedOffset: 0.2, incomingSpeed: 1.8, incomingSpin: 2, difficultyTier: 2, reachabilityPassed: true };
    expect(coachObservation("early", -138, createRunScore(), telemetry)).toContain("138 ms early");
    expect(coachObservation("frame", 40, createRunScore(), telemetry)).toMatch(/racket face was \d+° open/);
  });
});


describe("Endless Rally opponent-side resolution", () => {
  it("judges legality from the first bounce rather than post-bounce curve", () => {
    expect(isLegalOpponentBounce({ x: 0.98, z: -0.72 })).toBe(true);
    expect(isLegalOpponentBounce({ x: 1.08, z: -0.72 })).toBe(false);
    expect(isLegalOpponentBounce({ x: 0.2, z: -1.08 })).toBe(false);
  });

  it("allows the rival to return only a reachable legal post-bounce ball", () => {
    const ball = { ...createArcadeBall("player"), x: 0.2, z: -0.52, height: 0.38, bounces: 1, lastHit: "player" as const, active: true };
    expect(canRobotReturnBall(ball, 0.02)).toBe(true);
    expect(canRobotReturnBall({ ...ball, x: 0.72 }, 0.02)).toBe(false);
    expect(canRobotReturnBall({ ...ball, bounces: 0 }, 0.02)).toBe(false);
  });

  it("resolves every dead returned ball as winner or out instead of freezing", () => {
    const dead = { ...createArcadeBall("player"), active: false, lastHit: "player" as const, bounces: 2, x: 1.18, z: -0.8 };
    expect(resolveDeadReturnedBall(dead, true)).toBe("winner");
    expect(resolveDeadReturnedBall({ ...dead, bounces: 0 }, null)).toBe("out");
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
