import type {
  BalanceWeights,
  CompositionTargets,
  FeatureKey,
  SelectionMode,
  SystemTile,
} from "../types";
import { featureCount, poolFeatureCounts } from "./tiles";
import { approximatePoolQuality } from "./scoring";
import { shuffle } from "./rng";

function activeTargets(targets: CompositionTargets): [FeatureKey, number][] {
  return Object.entries(targets)
    .filter(
      (entry): entry is [FeatureKey, number] =>
        entry[1] !== null && entry[1] !== undefined,
    )
    .map(([key, value]) => [key as FeatureKey, value as number]);
}

function compositionPenalty(
  tiles: SystemTile[],
  targets: CompositionTargets,
): number {
  let penalty = 0;
  for (const [key, target] of activeTargets(targets)) {
    const actual = tiles.reduce(
      (sum, tile) => sum + featureCount(tile, key),
      0,
    );
    const delta = actual - target;
    penalty += delta * delta;
  }
  return penalty;
}

function representativePenalty(
  pool: SystemTile[],
  eligible: SystemTile[],
): number {
  const features: ((tile: SystemTile) => number)[] = [
    (tile) => tile.resources,
    (tile) => tile.influence,
    (tile) => tile.planetCount,
    (tile) => tile.specialtyIcons,
    (tile) => tile.legendarySystems,
  ];
  let result = 0;
  for (const getValue of features) {
    const expected =
      (eligible.reduce((sum, tile) => sum + getValue(tile), 0) /
        Math.max(eligible.length, 1)) *
      pool.length;
    const actual = pool.reduce((sum, tile) => sum + getValue(tile), 0);
    result += (Math.abs(actual - expected) / Math.max(expected, 1)) * 20;
  }
  return result;
}


function poolWithExactRedCount(
  eligible: SystemTile[],
  poolSize: number,
  redCount: number,
  rng: () => number,
): SystemTile[] {
  const red = shuffle(eligible.filter((tile) => tile.type === "red"), rng);
  const blue = shuffle(eligible.filter((tile) => tile.type === "blue"), rng);
  const blueCount = poolSize - redCount;
  if (redCount < 0 || blueCount < 0 || red.length < redCount || blue.length < blueCount) {
    throw new Error(`The requested pool needs ${blueCount} blue and ${redCount} red systems, but the enabled tile library cannot supply that composition.`);
  }
  return shuffle([...red.slice(0, redCount), ...blue.slice(0, blueCount)], rng);
}

export type PoolSelectionResult = {
  tiles: SystemTile[];
  targetCounts: Record<string, number>;
  unmetTargets: string[];
};

export function selectTilePool(
  eligible: SystemTile[],
  targets: CompositionTargets,
  mode: SelectionMode,
  poolSize: number,
  playerCount: number,
  weights: BalanceWeights,
  rng: () => number,
): PoolSelectionResult {
  if (poolSize < 1) {
    return { tiles: [], targetCounts: {}, unmetTargets: [] };
  }
  if (eligible.length < poolSize) {
    throw new Error(
      `Only ${eligible.length} eligible systems are available; ${poolSize} are required.`,
    );
  }

  const requested = activeTargets(targets);
  const hasTargets = requested.length > 0;
  const exactRedCount = mode === "random" && typeof targets.redSystems === "number"
    ? targets.redSystems
    : null;
  if (!hasTargets && mode === "random") {
    const tiles = shuffle(eligible, rng).slice(0, poolSize);
    return { tiles, targetCounts: poolFeatureCounts(tiles), unmetTargets: [] };
  }

  let bestPool: SystemTile[] | null = null;
  let bestComposition = Number.POSITIVE_INFINITY;
  let bestQuality = Number.POSITIVE_INFINITY;
  const candidateCount = mode === "optimized" ? 12 : 4;
  const iterations = hasTargets
    ? Math.min(18000, Math.max(5000, poolSize * 420))
    : Math.min(5000, Math.max(1000, poolSize * 100));

  for (let candidate = 0; candidate < candidateCount; candidate += 1) {
    let pool = exactRedCount === null
      ? shuffle(eligible, rng).slice(0, poolSize)
      : poolWithExactRedCount(eligible, poolSize, exactRedCount, rng);
    let poolIds = new Set(pool.map((tile) => tile.id));
    let currentPenalty = compositionPenalty(pool, targets);
    let localBest = [...pool];
    let localBestPenalty = currentPenalty;
    let temperature = 4;

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const poolIndex = Math.floor(rng() * poolSize);
      const previous = pool[poolIndex];
      const replacementOptions = exactRedCount === null
        ? eligible
        : eligible.filter((tile) => tile.type === previous.type);
      let replacement = replacementOptions[Math.floor(rng() * replacementOptions.length)];
      let guard = 0;
      while (poolIds.has(replacement.id) && guard < 60) {
        replacement = replacementOptions[Math.floor(rng() * replacementOptions.length)];
        guard += 1;
      }
      if (poolIds.has(replacement.id)) continue;

      const trial = [...pool];
      trial[poolIndex] = replacement;
      const trialPenalty = compositionPenalty(trial, targets);
      const delta = trialPenalty - currentPenalty;
      const accept =
        delta <= 0 || rng() < Math.exp(-delta / Math.max(temperature, 0.02));
      if (accept) {
        pool = trial;
        poolIds.delete(previous.id);
        poolIds.add(replacement.id);
        currentPenalty = trialPenalty;
      }
      if (currentPenalty < localBestPenalty) {
        localBest = [...pool];
        localBestPenalty = currentPenalty;
      }
      temperature *= 0.9996;
      if (localBestPenalty === 0 && mode === "random" && iteration > 400) break;
    }

    const quality =
      representativePenalty(localBest, eligible) +
      (mode === "optimized"
        ? approximatePoolQuality(localBest, weights, playerCount)
        : rng() * 4);

    if (
      localBestPenalty < bestComposition ||
      (localBestPenalty === bestComposition && quality < bestQuality)
    ) {
      bestPool = localBest;
      bestComposition = localBestPenalty;
      bestQuality = quality;
    }
  }

  const tiles = bestPool ?? shuffle(eligible, rng).slice(0, poolSize);
  const targetCounts = poolFeatureCounts(tiles);
  const unmetTargets = requested
    .filter(([key, target]) => targetCounts[key] !== target)
    .map(
      ([key, target]) =>
        `${key}: requested ${target}, generated ${targetCounts[key] ?? 0}`,
    );

  return { tiles, targetCounts, unmetTargets };
}
