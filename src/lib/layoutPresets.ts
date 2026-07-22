import type { Axial, LayoutCell, StandardLayoutId } from "../types";

export type StandardLayoutPreset = {
  id: StandardLayoutId;
  label: string;
  playerCount: number;
  rawPool: { blue: number; red: number };
  requiresPok: boolean;
  cells: LayoutCell[];
};

type PresetDefinition = {
  id: StandardLayoutId;
  label: string;
  playerCount: number;
  rawPool: { blue: number; red: number };
  requiresPok?: boolean;
  homes: number[];
  sectors: number[];
  warps?: [number, string, number][];
};

function axialRing(radius: number): Axial[] {
  if (radius === 0) return [{ q: 0, r: 0 }];
  const result: Axial[] = [];
  let q = 0;
  let r = -radius;
  const directions: Axial[] = [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
    { q: -1, r: 0 },
    { q: 0, r: -1 },
    { q: 1, r: -1 },
  ];
  for (const direction of directions) {
    for (let step = 0; step < radius; step += 1) {
      result.push({ q, r });
      q += direction.q;
      r += direction.r;
    }
  }
  return result;
}

const INDEX_COORDS: Axial[] = [
  { q: 0, r: 0 },
  ...axialRing(1),
  ...axialRing(2),
  ...axialRing(3),
  ...axialRing(4),
];

function coordForIndex(index: number): Axial {
  const coord = INDEX_COORDS[index];
  if (!coord) throw new Error(`Unknown standard-layout position ${index}.`);
  return coord;
}

function makeCells(definition: PresetDefinition): LayoutCell[] {
  const cells: LayoutCell[] = [
    { id: "cell:0,0", coord: { q: 0, r: 0 }, kind: "mecatol" },
  ];
  definition.homes.forEach((index, player) => {
    const coord = coordForIndex(index);
    cells.push({ id: `cell:${coord.q},${coord.r}`, coord, kind: "home", player });
  });
  definition.sectors.forEach((index) => {
    const coord = coordForIndex(index);
    cells.push({ id: `cell:${coord.q},${coord.r}`, coord, kind: "sector" });
  });
  for (const [index, laneId, rotationSteps] of definition.warps ?? []) {
    const coord = coordForIndex(index);
    cells.push({
      id: `cell:${coord.q},${coord.r}`,
      coord,
      kind: "warp",
      warp: {
        laneId,
        physicalId: laneId.slice(0, -1),
        rotation: rotationSteps * 60,
      },
    });
  }
  return cells;
}

const definitions: PresetDefinition[] = [
  {
    id: "standard-3",
    label: "Standard 3-player",
    playerCount: 3,
    rawPool: { blue: 18, red: 6 },
    homes: [22, 28, 34],
    sectors: [9, 13, 17, 6, 4, 2, 21, 27, 33, 35, 29, 23, 8, 12, 16, 18, 14, 10, 1, 3, 5, 15, 11, 7],
  },
  {
    id: "standard-4",
    label: "Standard 4-player",
    playerCount: 4,
    rawPool: { blue: 20, red: 12 },
    homes: [23, 27, 32, 36],
    sectors: [9, 12, 15, 18, 7, 16, 13, 10, 2, 4, 5, 1, 19, 33, 28, 24, 22, 26, 31, 35, 3, 6, 17, 14, 11, 8, 20, 25, 29, 34, 30, 21],
  },
  {
    id: "standard-5",
    label: "Standard 5-player (hyperlanes)",
    playerCount: 5,
    rawPool: { blue: 15, red: 10 },
    requiresPok: true,
    homes: [19, 22, 25, 31, 34],
    sectors: [7, 9, 11, 15, 17, 6, 5, 3, 2, 1, 13, 16, 18, 8, 10, 20, 23, 26, 32, 35, 33, 30, 24, 21, 36],
    warps: [[4, "86A", 0], [12, "88A", 0], [14, "87A", 0], [27, "83A", 0], [28, "85A", 0], [29, "84A", 0]],
  },
  {
    id: "standard-6",
    label: "Standard 6-player",
    playerCount: 6,
    rawPool: { blue: 18, red: 12 },
    homes: [19, 22, 25, 28, 31, 34],
    sectors: [7, 9, 11, 13, 15, 17, 6, 5, 4, 3, 2, 1, 20, 21, 24, 27, 30, 33, 18, 16, 14, 12, 10, 8, 23, 26, 29, 32, 35, 36],
  },
  {
    id: "standard-7",
    label: "Standard 7-player (hyperlanes)",
    playerCount: 7,
    rawPool: { blue: 31, red: 16 },
    requiresPok: true,
    homes: [37, 40, 43, 46, 52, 55, 58],
    sectors: [19, 21, 23, 25, 31, 33, 35, 18, 16, 15, 11, 10, 8, 7, 1, 2, 3, 4, 5, 6, 57, 54, 51, 47, 44, 41, 38, 60, 39, 42, 45, 53, 56, 59, 20, 36, 17, 14, 12, 9, 34, 32, 30, 26, 24, 22, 28],
    warps: [[13, "86A", 0], [27, "88A", 0], [29, "87A", 0], [48, "83A", 0], [49, "85A", 0], [50, "84A", 0]],
  },
  {
    id: "standard-8",
    label: "Standard 8-player",
    playerCount: 8,
    rawPool: { blue: 34, red: 18 },
    requiresPok: true,
    homes: [37, 40, 43, 46, 49, 52, 55, 58],
    sectors: [19, 35, 33, 30, 28, 26, 24, 21, 2, 3, 4, 5, 6, 1, 7, 18, 16, 14, 13, 12, 10, 8, 60, 57, 54, 51, 48, 45, 42, 39, 41, 44, 47, 50, 53, 56, 59, 38, 36, 20, 27, 29, 17, 15, 11, 9, 34, 32, 31, 25, 23, 22],
  },
];

export const STANDARD_LAYOUTS: StandardLayoutPreset[] = definitions.map((definition) => ({
  id: definition.id,
  label: definition.label,
  playerCount: definition.playerCount,
  rawPool: definition.rawPool,
  requiresPok: Boolean(definition.requiresPok),
  cells: makeCells(definition),
}));

export const STANDARD_LAYOUT_BY_ID = new Map(STANDARD_LAYOUTS.map((preset) => [preset.id, preset]));
