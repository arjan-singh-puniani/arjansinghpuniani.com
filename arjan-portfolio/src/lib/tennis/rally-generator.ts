import { ENDLESS_RALLY_CONFIG, type EndlessRallyConfig } from "@/lib/tennis/config";
import type { ArcadeShot } from "@/lib/vector-tennis";

export type RallyPattern = {
  index: number;
  tier: number;
  targetX: number;
  contactZ: number;
  contactHeight: number;
  incomingSpeed: number;
  topspin: number;
  sidespin: number;
  shot: ArcadeShot;
  recoverySeconds: number;
};

export type ReachabilityState = { playerX: number; availableSeconds: number };

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

export function difficultyTierForRally(rally: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG) {
  return Math.max(0, Math.floor(rally / config.difficulty.returnsPerTier));
}

export function maxReachableDistance(availableSeconds: number, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG) {
  const accelerationTime = config.reachability.playerMaxSpeedPerSecond / config.reachability.playerAccelerationPerSecond2;
  if (availableSeconds <= accelerationTime) return 0.5 * config.reachability.playerAccelerationPerSecond2 * availableSeconds ** 2;
  const acceleratingDistance = 0.5 * config.reachability.playerAccelerationPerSecond2 * accelerationTime ** 2;
  return acceleratingDistance + config.reachability.playerMaxSpeedPerSecond * (availableSeconds - accelerationTime);
}

export function isPatternReachable(pattern: RallyPattern, state: ReachabilityState, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG) {
  const availableDistance = maxReachableDistance(state.availableSeconds, config) * config.reachability.assistance;
  return Math.abs(pattern.targetX - state.playerX) <= availableDistance
    && Math.abs(pattern.targetX) <= config.reachability.courtLimitX
    && pattern.contactHeight >= config.reachability.minContactHeight
    && pattern.contactHeight <= config.reachability.maxContactHeight;
}

export function generateRallyPattern(seed: number, index: number, state: ReachabilityState, config: EndlessRallyConfig = ENDLESS_RALLY_CONFIG): RallyPattern {
  const tier = difficultyTierForRally(index, config);
  const stage = Math.min(6, tier);
  const speed = Math.min(config.difficulty.maxIncomingSpeed, config.difficulty.baseIncomingSpeed * (1 + config.difficulty.speedIncreasePerTier) ** tier);
  const lateralNoise = random01(seed, index * 5) * 2 - 1;
  const side = index % 2 === 0 ? -1 : 1;
  const widthByStage = [0.05, 0.28, 0.38, 0.48, 0.58, 0.68, config.difficulty.maxPlacementX][stage];
  const depthNoise = random01(seed, index * 5 + 1);
  const spinNoise = random01(seed, index * 5 + 2);
  const targetX = stage === 0 ? lateralNoise * widthByStage : side * widthByStage * (0.7 + Math.abs(lateralNoise) * 0.3);
  const contactZ = stage < 2 ? 0.68 : depthNoise > 0.52 ? 0.76 : 0.56;
  const contactHeight = stage < 2 ? 0.3 : 0.2 + random01(seed, index * 5 + 3) * 0.42;
  const shot: ArcadeShot = stage < 3 ? "flat" : stage === 3 ? "topspin" : stage === 4 ? "slice" : spinNoise > 0.66 ? "slice" : spinNoise > 0.3 ? "topspin" : "flat";
  const pattern: RallyPattern = {
    index,
    tier,
    targetX,
    contactZ,
    contactHeight,
    incomingSpeed: Math.min(config.difficulty.maxIncomingSpeed, speed * (stage >= 5 ? 0.94 + random01(seed, index * 5 + 4) * 0.12 : 1)),
    topspin: shot === "topspin" ? Math.min(config.difficulty.maxTopspin, 2.4 + tier * 0.52) : shot === "slice" ? -2.2 : 0.7,
    sidespin: shot === "slice" ? side * Math.min(config.difficulty.maxSlice, 2.2 + tier * 0.42) : lateralNoise * 0.5,
    shot,
    recoverySeconds: Math.max(0.68, 1.08 - tier * 0.025),
  };
  if (isPatternReachable(pattern, state, config)) return pattern;
  return {
    ...pattern,
    targetX: Math.max(-config.reachability.courtLimitX, Math.min(config.reachability.courtLimitX, state.playerX + Math.sign(pattern.targetX - state.playerX) * maxReachableDistance(state.availableSeconds, config) * config.reachability.assistance * 0.82)),
    contactHeight: Math.max(config.reachability.minContactHeight, Math.min(config.reachability.maxContactHeight, pattern.contactHeight)),
  };
}

export function generatePatternSequence(seed: number, count: number, initialPlayerX = 0) {
  const patterns: RallyPattern[] = [];
  let playerX = initialPlayerX;
  for (let index = 0; index < count; index += 1) {
    const pattern = generateRallyPattern(seed, index, { playerX, availableSeconds: index === 0 ? 1.2 : patterns[index - 1].recoverySeconds });
    patterns.push(pattern);
    playerX = pattern.targetX;
  }
  return patterns;
}
