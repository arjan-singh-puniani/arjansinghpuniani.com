import { ENDLESS_RALLY_CONFIG, type EndlessRallyConfig, type RallyPhaseConfig, type RallyPhaseName } from "@/lib/tennis/config";
import type { ArcadeShot } from "@/lib/vector-tennis";

export type RallyDifficulty = {
  rally: number;
  phaseIndex: number;
  phase: RallyPhaseName;
  paceMultiplier: number;
  placementRangeX: number;
  spinIntensity: number;
  minimumTimeToContactMs: number;
  contactDepthMin: number;
  contactDepthMax: number;
};

export type RallyPattern = {
  index: number;
  tier: number;
  phase: RallyPhaseName;
  targetX: number;
  contactZ: number;
  contactHeight: number;
  incomingSpeed: number;
  topspin: number;
  sidespin: number;
  shot: ArcadeShot;
  recoverySeconds: number;
  minimumTimeToContactMs: number;
  generatedAttempt: number;
  usedFallback: boolean;
  difficulty: RallyDifficulty;
};

export type ReachabilityState = {
  playerX: number;
  availableSeconds: number;
  playerVelocityX?: number;
  racketHeight?: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

export function smootherstep(value: number) {
  const x = clamp(value, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function dailyRallySeed(date: Date) {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { key, seed: hashSeed(`vector-tennis:${key}`) };
}

function random01(seed: number, stream: number) {
  let value = (seed + Math.imul(stream + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967296;
}

function phaseProgress(rally: number, phase: RallyPhaseConfig, config: EndlessRallyConfig) {
  const endRally = phase.endRally ?? config.difficulty.survivalPlateauRally;
  if (endRally <= phase.startRally) return 1;
  return smootherstep((rally - phase.startRally) / (endRally - phase.startRally));
}

export function difficultyForRally(rally: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): RallyDifficulty {
  const safeRally = Math.max(1, Math.floor(rally));
  const phaseIndex = Math.max(0, config.difficulty.phases.findIndex((phase) => phase.endRally === null || safeRally <= phase.endRally));
  const phase = config.difficulty.phases[phaseIndex];
  const priorPhase = config.difficulty.phases[Math.max(0, phaseIndex - 1)];
  const progress = phaseProgress(safeRally, phase, config);
  const spinProgress = phase.endRally === null
    ? smootherstep((safeRally - phase.startRally) / (config.difficulty.spinPlateauRally - phase.startRally))
    : progress;
  const placementStart = phaseIndex === 0 ? phase.lateralReachFractionMax * 0.75 : priorPhase.lateralReachFractionMax;
  const spinStart = phaseIndex === 0 ? 0 : priorPhase.spinIntensityMax;
  const readableStart = phaseIndex === 0 ? phase.minimumTimeToContactMs : priorPhase.minimumTimeToContactMs;
  return {
    rally: safeRally,
    phaseIndex,
    phase: phase.name,
    paceMultiplier: mix(phase.incomingPaceMultiplierMin, phase.incomingPaceMultiplierMax, progress),
    placementRangeX: config.difficulty.maxPlacementX * mix(placementStart, phase.lateralReachFractionMax, progress),
    spinIntensity: mix(spinStart, phase.spinIntensityMax, spinProgress),
    minimumTimeToContactMs: mix(readableStart, phase.minimumTimeToContactMs, progress),
    contactDepthMin: mix(phase.contactDepthMin, phase.contactDepthMax, progress * 0.35),
    contactDepthMax: phase.contactDepthMax,
  };
}

export function difficultyTierForRally(successfulReturns: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG) {
  return difficultyForRally(successfulReturns + 1, config).phaseIndex;
}

export function maxReachableDistance(availableSeconds: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG, initialVelocityTowardsTarget = 0) {
  let remainingSeconds = Math.max(0, availableSeconds - config.reachability.preparationTimeMs / 1000);
  let velocity = clamp(initialVelocityTowardsTarget, -config.reachability.playerMaxSpeedPerSecond, config.reachability.playerMaxSpeedPerSecond);
  let distance = 0;
  if (velocity < 0 && remainingSeconds > 0) {
    const reversalSeconds = Math.min(remainingSeconds, -velocity / config.reachability.playerAccelerationPerSecond2);
    distance += velocity * reversalSeconds + 0.5 * config.reachability.playerAccelerationPerSecond2 * reversalSeconds ** 2;
    velocity += config.reachability.playerAccelerationPerSecond2 * reversalSeconds;
    remainingSeconds -= reversalSeconds;
  }
  const accelerationSeconds = Math.min(remainingSeconds, Math.max(0, (config.reachability.playerMaxSpeedPerSecond - velocity) / config.reachability.playerAccelerationPerSecond2));
  distance += velocity * accelerationSeconds + 0.5 * config.reachability.playerAccelerationPerSecond2 * accelerationSeconds ** 2;
  remainingSeconds -= accelerationSeconds;
  distance += config.reachability.playerMaxSpeedPerSecond * remainingSeconds;
  return Math.max(0, distance);
}

export function isPatternReachable(pattern: RallyPattern, state: ReachabilityState, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG) {
  const availableSeconds = Math.max(state.availableSeconds, pattern.minimumTimeToContactMs / 1000);
  const targetDirection = Math.sign(pattern.targetX - state.playerX) || 1;
  const directionalVelocity = (state.playerVelocityX ?? 0) * targetDirection;
  const availableDistance = maxReachableDistance(availableSeconds, config, directionalVelocity) * config.reachability.assistance + config.reachability.collisionMarginX;
  const racketHeight = state.racketHeight ?? 0.32;
  return Math.abs(pattern.targetX - state.playerX) <= availableDistance
    && Math.abs(pattern.targetX) <= config.reachability.courtLimitX
    && pattern.contactHeight >= config.reachability.minContactHeight
    && pattern.contactHeight <= config.reachability.maxContactHeight
    && Math.abs(pattern.contactHeight - racketHeight) <= config.contact.racketReachHeight + 0.18;
}

export function capIncomingSpeedForReadability(distance: number, requestedSpeed: number, minimumTimeToContactMs: number) {
  const readableSpeedCap = Math.max(0.05, Math.abs(distance)) / Math.max(0.001, minimumTimeToContactMs / 1000);
  return Math.min(Math.max(0.05, requestedSpeed), readableSpeedCap);
}

function chooseShot(rally: number, spinRoll: number, config: EndlessRallyConfig): ArcadeShot {
  const unlocks = config.difficulty.patternUnlocks;
  if (rally < unlocks.topspinRally) return "flat";
  if (rally < unlocks.sliceRally) return spinRoll > 0.58 ? "topspin" : "flat";
  if (rally < unlocks.wideSpinCombinationRally) return spinRoll > 0.7 ? "slice" : spinRoll > 0.28 ? "topspin" : "flat";
  return spinRoll > 0.66 ? "slice" : spinRoll > 0.25 ? "topspin" : "flat";
}

function createCandidate(seed: number, index: number, attempt: number, state: ReachabilityState, config: EndlessRallyConfig): RallyPattern {
  const rally = index + 1;
  const difficulty = difficultyForRally(rally, config);
  const unlocks = config.difficulty.patternUnlocks;
  const stream = index * 31 + attempt * 7;
  const lateralRoll = random01(seed, stream) * 2 - 1;
  const depthRoll = random01(seed, stream + 1);
  const heightRoll = random01(seed, stream + 2);
  const spinRoll = random01(seed, stream + 3);
  const side = index % 2 === 0 ? -1 : 1;
  let targetX = lateralRoll * difficulty.placementRangeX;
  if (rally <= 4) targetX *= 0.42;
  else if (rally < unlocks.alternatingPlacementRally) targetX = (index % 3 - 1) * difficulty.placementRangeX * 0.58;
  else if (rally < unlocks.advancedSequenceRally) targetX = side * difficulty.placementRangeX * (0.55 + Math.abs(lateralRoll) * 0.45);

  const depthVariation = rally >= unlocks.depthVariationRally;
  const contactZ = depthVariation ? mix(difficulty.contactDepthMin, difficulty.contactDepthMax, depthRoll) : 0.68;
  const contactHeight = rally <= 8 ? 0.3 : 0.22 + heightRoll * Math.min(0.42, 0.16 + difficulty.spinIntensity * 0.34);
  const shot = chooseShot(rally, spinRoll, config);
  const safeSpin = rally < 9 ? 0 : difficulty.spinIntensity;
  const topspin = shot === "topspin" ? config.difficulty.maxTopspin * safeSpin * (0.62 + spinRoll * 0.38) : 0;
  const sidespin = shot === "slice" ? side * config.difficulty.maxSlice * safeSpin * (0.62 + spinRoll * 0.38) : 0;
  const incomingSpeed = Math.min(config.difficulty.maxIncomingSpeedPerSecond, config.difficulty.standardIncomingSpeedPerSecond * difficulty.paceMultiplier);
  return {
    index,
    tier: difficulty.phaseIndex,
    phase: difficulty.phase,
    targetX,
    contactZ,
    contactHeight,
    incomingSpeed,
    topspin,
    sidespin,
    shot,
    recoverySeconds: difficulty.minimumTimeToContactMs / 1000,
    minimumTimeToContactMs: difficulty.minimumTimeToContactMs,
    generatedAttempt: attempt,
    usedFallback: false,
    difficulty,
  };
}

export function createSafeFallbackPattern(index: number, state: ReachabilityState, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): RallyPattern {
  const difficulty = difficultyForRally(index + 1, config);
  const targetX = clamp(state.playerX * 0.25, -0.08, 0.08);
  return {
    index,
    tier: difficulty.phaseIndex,
    phase: difficulty.phase,
    targetX,
    contactZ: 0.68,
    contactHeight: 0.3,
    incomingSpeed: config.difficulty.standardIncomingSpeedPerSecond * 0.72,
    topspin: 0,
    sidespin: 0,
    shot: "flat",
    recoverySeconds: Math.max(1.15, difficulty.minimumTimeToContactMs / 1000),
    minimumTimeToContactMs: Math.max(1150, difficulty.minimumTimeToContactMs),
    generatedAttempt: config.difficulty.maxRegenerationAttempts,
    usedFallback: true,
    difficulty,
  };
}

export function generateRallyPattern(seed: number, index: number, state: ReachabilityState, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): RallyPattern {
  for (let attempt = 0; attempt < config.difficulty.maxRegenerationAttempts; attempt += 1) {
    const candidate = createCandidate(seed, index, attempt, state, config);
    if (isPatternReachable(candidate, state, config)) return candidate;
  }
  return createSafeFallbackPattern(index, state, config);
}

export function generatePatternSequence(seed: number, count: number, initialPlayerX = 0) {
  const patterns: RallyPattern[] = [];
  let playerX = initialPlayerX;
  for (let index = 0; index < count; index += 1) {
    const availableSeconds = index === 0 ? 1.2 : patterns[index - 1].recoverySeconds;
    const pattern = generateRallyPattern(seed, index, { playerX, availableSeconds });
    patterns.push(pattern);
    playerX = pattern.targetX;
  }
  return patterns;
}
