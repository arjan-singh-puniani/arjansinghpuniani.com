export const ENDLESS_RALLY_STORAGE_KEY = "vector-tennis.endless-rally.v1";

export type EndlessRallyStats = {
  version: 1;
  allTimeBestRally: number;
  sessionBestRally: number;
  highestPerfectStreak: number;
  bestPrecisionScore: number;
  muted: boolean;
  daily: Record<string, { bestRally: number; bestPerfectStreak: number }>;
};

export const DEFAULT_ENDLESS_RALLY_STATS: EndlessRallyStats = {
  version: 1,
  allTimeBestRally: 0,
  sessionBestRally: 0,
  highestPerfectStreak: 0,
  bestPrecisionScore: 0,
  muted: false,
  daily: {},
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const finiteNonnegative = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;

export function parseEndlessRallyStats(raw: string | null): EndlessRallyStats {
  if (!raw) return { ...DEFAULT_ENDLESS_RALLY_STATS, daily: {} };
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (value.version === 0) {
      return {
        ...DEFAULT_ENDLESS_RALLY_STATS,
        allTimeBestRally: finiteNonnegative(value.bestRally),
        highestPerfectStreak: finiteNonnegative(value.bestStreak),
        bestPrecisionScore: finiteNonnegative(value.bestScore),
      };
    }
    if (value.version !== 1) return { ...DEFAULT_ENDLESS_RALLY_STATS, daily: {} };
    const daily: EndlessRallyStats["daily"] = {};
    if (value.daily && typeof value.daily === "object") {
      for (const [key, record] of Object.entries(value.daily as Record<string, unknown>)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !record || typeof record !== "object") continue;
        const entry = record as Record<string, unknown>;
        daily[key] = { bestRally: finiteNonnegative(entry.bestRally), bestPerfectStreak: finiteNonnegative(entry.bestPerfectStreak) };
      }
    }
    return {
      version: 1,
      allTimeBestRally: finiteNonnegative(value.allTimeBestRally),
      sessionBestRally: finiteNonnegative(value.sessionBestRally),
      highestPerfectStreak: finiteNonnegative(value.highestPerfectStreak),
      bestPrecisionScore: finiteNonnegative(value.bestPrecisionScore),
      muted: value.muted === true,
      daily,
    };
  } catch {
    return { ...DEFAULT_ENDLESS_RALLY_STATS, daily: {} };
  }
}

export function loadEndlessRallyStats(storage: StorageLike | null | undefined) {
  try {
    return parseEndlessRallyStats(storage?.getItem(ENDLESS_RALLY_STORAGE_KEY) ?? null);
  } catch {
    return { ...DEFAULT_ENDLESS_RALLY_STATS, daily: {} };
  }
}

export function saveEndlessRallyStats(storage: StorageLike | null | undefined, stats: EndlessRallyStats) {
  try {
    storage?.setItem(ENDLESS_RALLY_STORAGE_KEY, JSON.stringify(stats));
    return true;
  } catch {
    return false;
  }
}

export function mergeRunIntoStats(stats: EndlessRallyStats, run: { rally: number; bestPerfectStreak: number; precisionScore: number }, dailyKey?: string) {
  const next: EndlessRallyStats = {
    ...stats,
    allTimeBestRally: Math.max(stats.allTimeBestRally, run.rally),
    sessionBestRally: Math.max(stats.sessionBestRally, run.rally),
    highestPerfectStreak: Math.max(stats.highestPerfectStreak, run.bestPerfectStreak),
    bestPrecisionScore: Math.max(stats.bestPrecisionScore, run.precisionScore),
    daily: { ...stats.daily },
  };
  if (dailyKey) {
    const current = stats.daily[dailyKey] ?? { bestRally: 0, bestPerfectStreak: 0 };
    next.daily[dailyKey] = { bestRally: Math.max(current.bestRally, run.rally), bestPerfectStreak: Math.max(current.bestPerfectStreak, run.bestPerfectStreak) };
  }
  return next;
}
