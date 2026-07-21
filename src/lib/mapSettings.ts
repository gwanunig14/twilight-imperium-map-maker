import {
  availableFeatureKeys,
  featureCount,
  featureLabel,
  featureRange,
} from "./tiles";
import type {
  BalanceWeights,
  CompositionTargets,
  EditorTool,
  FeatureKey,
  SystemTile,
} from "../types";

const PRIMARY_FEATURES: FeatureKey[] = [
  "redSystems",
  "anomalySystems",
  "wormholeSystems",
  "specialtySystems",
  "legendarySystems",
  "emptySystems",
];

// Ordered to preserve the existing P1-P8 convention while matching the
// physical player plastic: blue, red, yellow, green, purple, orange, pink,
// and black.
export const PLAYER_COLORS = [
  "#1d4fb2",
  "#c0131c",
  "#ecc31c",
  "#26724a",
  "#5e2b6f",
  "#ed7609",
  "#d543ae",
  "#343038",
];

export const TOOL_OPTIONS: {
  value: EditorTool;
  label: string;
  help: string;
}[] = [
  {
    value: "player",
    label: "New Player",
    help: "Place the next home system. Click an existing home to move it.",
  },
  { value: "mecatol", label: "Mecatol", help: "Place or move Mecatol Rex." },
  {
    value: "sector",
    label: "Sector",
    help: "Add systems that will be filled when the map is generated.",
  },
  {
    value: "warp",
    label: "Warp Lane",
    help: "Choose a physical warp-lane tile, face, and rotation.",
  },
  {
    value: "erase",
    label: "Erase",
    help: "Remove a placed hex. Remaining players renumber automatically.",
  },
];

export const WEIGHT_ROWS: {
  key: keyof BalanceWeights;
  label: string;
  hint: string;
}[] = [
  { key: "resources", label: "Resources", hint: "Production economy." },
  {
    key: "influence",
    label: "Influence",
    hint: "Command-token and voting economy.",
  },
  {
    key: "planets",
    label: "Planet count",
    hint: "Control and exploration opportunities.",
  },
  {
    key: "specialties",
    label: "Tech skips",
    hint: "Technology specialty icons.",
  },
  { key: "legendary", label: "Legendary access", hint: "Legendary systems." },
  {
    key: "wormholes",
    label: "Wormhole access",
    hint: "Mobility and unusual adjacency.",
  },
  {
    key: "anomalies",
    label: "Anomaly burden",
    hint: "How strongly anomaly clustering is discouraged.",
  },
  {
    key: "empty",
    label: "Empty systems",
    hint: "Empty-space objectives and weak economic positions.",
  },
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function recommendedTargets(
  tiles: SystemTile[],
  poolSize: number,
): CompositionTargets {
  const targets: CompositionTargets = {};
  const keys = availableFeatureKeys(tiles);
  keys.forEach((key) => (targets[key] = null));
  if (!poolSize) return targets;

  const scale = poolSize / 30;
  const requested: Partial<Record<FeatureKey, number>> = {
    redSystems: Math.round(12 * scale),
    anomalySystems: Math.round(8 * scale),
    wormholeSystems: Math.round(4 * scale),
    specialtySystems: Math.round(8 * scale),
    legendarySystems: Math.max(1, Math.round(3 * scale)),
    emptySystems: Math.round(8 * scale),
  };

  for (const [key, value] of Object.entries(requested) as [
    FeatureKey,
    number,
  ][]) {
    if (!keys.includes(key)) continue;
    const range = featureRange(tiles, key, poolSize);
    targets[key] = clamp(value, range.min, range.max);
  }
  return targets;
}

export function featureGroups(keys: FeatureKey[]) {
  return {
    primary: PRIMARY_FEATURES.filter((key) => keys.includes(key)),
    tech: keys.filter((key) => key.startsWith("specialty:")),
    anomalies: keys.filter((key) => key.startsWith("anomaly:")),
    wormholes: keys.filter((key) => key.startsWith("wormhole:")),
    planets: keys.filter((key) =>
      ["onePlanetSystems", "twoPlanetSystems", "threePlanetSystems"].includes(
        key,
      ),
    ),
  };
}

export function compositionDifferences(
  tiles: SystemTile[],
  targets: CompositionTargets,
): string[] {
  return Object.entries(targets)
    .filter(
      (entry): entry is [FeatureKey, number] =>
        entry[1] !== null && entry[1] !== undefined,
    )
    .map(([key, requested]) => {
      const actual = tiles.reduce(
        (sum, tile) => sum + featureCount(tile, key),
        0,
      );
      return actual === requested
        ? null
        : `${featureLabel(key)}: requested ${requested}, now ${actual}`;
    })
    .filter((value): value is string => Boolean(value));
}
