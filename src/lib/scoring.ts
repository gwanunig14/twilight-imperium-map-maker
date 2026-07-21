import type {
  BalanceMode,
  BalanceWeights,
  MapAnalysis,
  Metrics,
  SliceGeometry,
  SystemTile,
} from "../types";

export const DEFAULT_WEIGHTS: BalanceWeights = {
  resources: 80,
  influence: 55,
  planets: 30,
  specialties: 35,
  legendary: 45,
  wormholes: 20,
  anomalies: 20,
  empty: 10,
};

export function emptyMetrics(): Metrics {
  return {
    resources: 0,
    influence: 0,
    optimalSpend: 0,
    planets: 0,
    specialties: 0,
    legendary: 0,
    wormholes: 0,
    anomalies: 0,
    empty: 0,
    value: 0,
    systems: 0,
    equidistants: 0,
  };
}

export function tileMetrics(tile: SystemTile, weights: BalanceWeights): Metrics {
  const value =
    (tile.resources * weights.resources) / 10 +
    (tile.influence * weights.influence) / 10 +
    (tile.planetCount * weights.planets) / 10 +
    (tile.specialtyIcons * weights.specialties) / 10 +
    (tile.legendarySystems * weights.legendary) / 10 +
    (tile.wormholeSystems * weights.wormholes) / 10 -
    (tile.anomalySystems * weights.anomalies) / 12 -
    (tile.emptySystems * weights.empty) / 12;

  return {
    resources: tile.resources,
    influence: tile.influence,
    optimalSpend: tile.optimalSpend,
    planets: tile.planetCount,
    specialties: tile.specialtyIcons,
    legendary: tile.legendarySystems,
    wormholes: tile.wormholeSystems,
    anomalies: tile.anomalySystems,
    empty: tile.emptySystems,
    value,
    systems: 1,
    equidistants: 0,
  };
}

export function addMetrics(a: Metrics, b: Metrics, multiplier = 1): Metrics {
  return {
    resources: a.resources + b.resources * multiplier,
    influence: a.influence + b.influence * multiplier,
    optimalSpend: a.optimalSpend + b.optimalSpend * multiplier,
    planets: a.planets + b.planets * multiplier,
    specialties: a.specialties + b.specialties * multiplier,
    legendary: a.legendary + b.legendary * multiplier,
    wormholes: a.wormholes + b.wormholes * multiplier,
    anomalies: a.anomalies + b.anomalies * multiplier,
    empty: a.empty + b.empty * multiplier,
    value: a.value + b.value * multiplier,
    systems: a.systems + b.systems * multiplier,
    equidistants: a.equidistants + b.equidistants * multiplier,
  };
}

function normalizedRange(values: number[]): number {
  if (!values.length) return 0;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return (max - min) / Math.max(Math.abs(mean), 1);
}

function coefficientOfVariation(values: number[]): number {
  if (!values.length) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (Math.abs(mean) < 0.0001) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / Math.abs(mean);
}

export function countAdjacencyViolations(
  placements: Record<string, string>,
  tileById: Map<string, SystemTile>,
  geometry: SliceGeometry,
): number {
  let violations = 0;
  const seen = new Set<string>();
  for (const [aId, neighbors] of Object.entries(geometry.adjacency)) {
    for (const bId of neighbors) {
      if (!geometry.assignments[aId] || !geometry.assignments[bId]) continue;
      const pair = [aId, bId].sort().join("|");
      if (seen.has(pair)) continue;
      seen.add(pair);
      const a = tileById.get(placements[aId]);
      const b = tileById.get(placements[bId]);
      if (!a || !b) continue;
      if (a.anomalySystems && b.anomalySystems) violations += 1;
      if (a.wormholes.some((wormhole) => b.wormholes.includes(wormhole))) {
        violations += 1;
      }
    }
  }
  return violations;
}

function playerAnalyses(
  placements: Record<string, string>,
  tileById: Map<string, SystemTile>,
  geometry: SliceGeometry,
  weights: BalanceWeights,
) {
  return Array.from({ length: geometry.playerCount }, (_, player) => {
    let core = emptyMetrics();
    let owned = emptyMetrics();
    let accessible = emptyMetrics();

    for (const assignment of Object.values(geometry.assignments)) {
      const tile = tileById.get(placements[assignment.slotId]);
      if (!tile || !assignment.reachable) continue;
      const metrics = tileMetrics(tile, weights);

      if (!assignment.equidistant && assignment.assignedPlayer === player) {
        core = addMetrics(core, metrics);
        owned = addMetrics(owned, metrics);
        accessible = addMetrics(accessible, metrics);
        continue;
      }

      if (!assignment.equidistant) continue;
      const eqMetrics = { ...metrics, equidistants: 1 };
      if (geometry.equidistantMode === "included") {
        if (assignment.assignedPlayer === player) {
          owned = addMetrics(owned, eqMetrics);
          accessible = addMetrics(accessible, eqMetrics);
        }
      } else if (assignment.nearestPlayers.includes(player)) {
        const share = 1 / assignment.nearestPlayers.length;
        accessible = addMetrics(accessible, eqMetrics, share);
      }
    }

    return { player, core, owned, accessible };
  });
}

function tierPenalty(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const gap = Math.max(Math.abs(mean) * 0.035, 0.75);
  const center = (values.length - 1) / 2;
  const targets = values.map((_, index) => mean + (center - index) * gap);
  const scale = Math.max(Math.abs(mean), 1);
  let penalty = 0;
  values.forEach((value, index) => {
    penalty += ((value - targets[index]) / scale) ** 2 * 120;
    if (index > 0 && values[index - 1] <= value) {
      penalty += 55 + ((value - values[index - 1]) / scale) ** 2 * 200;
    }
  });
  return penalty;
}

export function analyzeCustomMap(
  placements: Record<string, string>,
  tileById: Map<string, SystemTile>,
  geometry: SliceGeometry,
  weights: BalanceWeights,
  balanceMode: BalanceMode,
): MapAnalysis {
  const players = playerAnalyses(placements, tileById, geometry, weights);
  const adjacencyViolations = countAdjacencyViolations(
    placements,
    tileById,
    geometry,
  );

  const featureWeights: [keyof Metrics, number][] = [
    ["resources", weights.resources],
    ["influence", weights.influence],
    ["planets", weights.planets],
    ["specialties", weights.specialties],
    ["legendary", weights.legendary],
    ["wormholes", weights.wormholes],
    ["anomalies", weights.anomalies],
    ["empty", weights.empty],
  ];

  let objective = adjacencyViolations * 5000;
  for (const [feature, weight] of featureWeights) {
    const accessible = players.map((player) => player.accessible[feature]);
    if (balanceMode === "even") {
      objective += normalizedRange(accessible) * weight;
      objective += coefficientOfVariation(accessible) * weight * 0.55;
    } else {
      objective += tierPenalty(accessible) * (weight / 100) * 0.45;
      objective += coefficientOfVariation(accessible) * weight * 0.18;
    }
    objective +=
      normalizedRange(players.map((player) => player.core[feature])) *
      weight *
      (balanceMode === "even" ? 0.38 : 0.12);
  }

  const values = players.map((player) => player.accessible.value);
  objective +=
    balanceMode === "even"
      ? normalizedRange(values) * 90
      : tierPenalty(values) * 1.4;

  const spread = {
    resources: normalizedRange(players.map((player) => player.accessible.resources)),
    influence: normalizedRange(players.map((player) => player.accessible.influence)),
    optimalSpend: normalizedRange(players.map((player) => player.accessible.optimalSpend)),
    value: normalizedRange(values),
  };

  const gradeScore = objective - adjacencyViolations * 5000;
  const grade =
    adjacencyViolations > 0
      ? "Needs review"
      : gradeScore < 110
        ? "Excellent"
        : gradeScore < 175
          ? "Strong"
          : gradeScore < 270
            ? "Playable"
            : "Uneven";

  return {
    players,
    objective,
    adjacencyViolations,
    grade,
    balanceMode,
    spread,
  };
}

export function approximatePoolQuality(
  tiles: SystemTile[],
  weights: BalanceWeights,
  playerCount: number,
): number {
  const groups = Array.from({ length: Math.max(playerCount, 1) }, () => emptyMetrics());
  const sorted = [...tiles].sort(
    (a, b) => tileMetrics(b, weights).value - tileMetrics(a, weights).value,
  );
  sorted.forEach((tile) => {
    const target = groups
      .map((group, index) => ({ index, value: group.value }))
      .sort((a, b) => a.value - b.value)[0].index;
    groups[target] = addMetrics(groups[target], tileMetrics(tile, weights));
  });
  return (
    normalizedRange(groups.map((group) => group.value)) * 80 +
    normalizedRange(groups.map((group) => group.resources)) * weights.resources +
    normalizedRange(groups.map((group) => group.influence)) * weights.influence
  );
}
