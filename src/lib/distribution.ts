import type {
  BalanceMode,
  BalanceWeights,
  DistributionMode,
  SliceGeometry,
  SystemTile,
} from "../types";
import { analyzeCustomMap } from "./scoring";
import { shuffle } from "./rng";

function swap<T>(items: T[], a: number, b: number): T[] {
  const next = [...items];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

function placementsFor(
  fixed: Record<string, string>,
  reachableSlots: string[],
  order: SystemTile[],
): Record<string, string> {
  const placements = { ...fixed };
  reachableSlots.forEach((slotId, index) => {
    placements[slotId] = order[index].id;
  });
  return placements;
}

export function distributeTiles(
  pool: SystemTile[],
  mode: DistributionMode,
  balanceMode: BalanceMode,
  geometry: SliceGeometry,
  weights: BalanceWeights,
  rng: () => number,
): {
  placements: Record<string, string>;
  analysis: ReturnType<typeof analyzeCustomMap>;
} {
  const slotIds = Object.keys(geometry.assignments);
  if (pool.length !== slotIds.length) {
    throw new Error(
      `Expected ${slotIds.length} systems for this layout, found ${pool.length}.`,
    );
  }
  const tileById = new Map(pool.map((tile) => [tile.id, tile]));
  const unreachableSlots = geometry.unreachableSlotIds;
  const reachableSlots = slotIds.filter(
    (slotId) => !unreachableSlots.includes(slotId),
  );

  if (mode === "random" || reachableSlots.length < 2) {
    let bestPlacements: Record<string, string> = {};
    let bestAnalysis: ReturnType<typeof analyzeCustomMap> | null = null;
    const attempts = Math.min(500, Math.max(80, pool.length * 8));
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const order = shuffle(pool, rng);
      const placements = Object.fromEntries(
        slotIds.map((slotId, index) => [slotId, order[index].id]),
      );
      const analysis = analyzeCustomMap(
        placements,
        tileById,
        geometry,
        weights,
        balanceMode,
      );
      if (
        !bestAnalysis ||
        analysis.adjacencyViolations < bestAnalysis.adjacencyViolations ||
        (analysis.adjacencyViolations === bestAnalysis.adjacencyViolations &&
          rng() < 0.04)
      ) {
        bestPlacements = placements;
        bestAnalysis = analysis;
      }
      if (bestAnalysis.adjacencyViolations === 0 && attempt > 60) break;
    }
    return { placements: bestPlacements, analysis: bestAnalysis! };
  }

  // Wayward sectors are deliberately assigned once, at random, before slice
  // optimization begins. They are not scored and cannot become a convenient
  // dumping ground for unusually strong or weak systems during restarts.
  const shuffledPool = shuffle(pool, rng);
  const fixed: Record<string, string> = {};
  const unreachableTiles = shuffledPool.slice(0, unreachableSlots.length);
  unreachableSlots.forEach((slotId, index) => {
    fixed[slotId] = unreachableTiles[index].id;
  });
  const reachablePool = shuffledPool.slice(unreachableSlots.length);

  let globalBestPlacements: Record<string, string> | null = null;
  let globalBestAnalysis: ReturnType<typeof analyzeCustomMap> | null = null;
  const restarts = Math.min(10, Math.max(5, Math.ceil(pool.length / 8)));
  const iterations = Math.min(15000, Math.max(3500, reachableSlots.length * 260));

  for (let restart = 0; restart < restarts; restart += 1) {
    let order = shuffle(reachablePool, rng);
    let placements = placementsFor(fixed, reachableSlots, order);
    let analysis = analyzeCustomMap(
      placements,
      tileById,
      geometry,
      weights,
      balanceMode,
    );
    let temperature = balanceMode === "tiered" ? 30 : 24;

    if (!globalBestAnalysis || analysis.objective < globalBestAnalysis.objective) {
      globalBestPlacements = placements;
      globalBestAnalysis = analysis;
    }

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const a = Math.floor(rng() * order.length);
      let b = Math.floor(rng() * order.length);
      if (a === b) b = (b + 1) % order.length;
      const trialOrder = swap(order, a, b);
      const trialPlacements = placementsFor(fixed, reachableSlots, trialOrder);
      const trialAnalysis = analyzeCustomMap(
        trialPlacements,
        tileById,
        geometry,
        weights,
        balanceMode,
      );
      const delta = trialAnalysis.objective - analysis.objective;
      const accept =
        delta <= 0 || rng() < Math.exp(-delta / Math.max(temperature, 0.08));
      if (accept) {
        order = trialOrder;
        placements = trialPlacements;
        analysis = trialAnalysis;
      }
      if (!globalBestAnalysis || analysis.objective < globalBestAnalysis.objective) {
        globalBestPlacements = placements;
        globalBestAnalysis = analysis;
      }
      temperature *= 0.99925;
    }
  }

  return {
    placements: globalBestPlacements!,
    analysis: globalBestAnalysis!,
  };
}
