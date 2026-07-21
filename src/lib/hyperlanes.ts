import type { WarpLaneDefinition } from "../types";

const pok = (id: string, paths: [number, number][]): WarpLaneDefinition => ({
  id,
  physicalId: id.slice(0, -1),
  side: id.endsWith("A") ? "A" : "B",
  source: "pok",
  paths,
  imageUrl: `/warp-lanes/ST_${id}.webp`,
});

const te = (
  id: string,
  paths: [number, number][],
  note?: string,
): WarpLaneDefinition => ({
  id,
  physicalId: id.slice(0, -1),
  side: id.endsWith("A") ? "A" : "B",
  source: "te",
  paths,
  note,
});

export const WARP_LANES: WarpLaneDefinition[] = [
  pok("83A", [[1, 4]]),
  pok("83B", [[0, 3], [0, 2], [3, 5]]),
  pok("84A", [[2, 5]]),
  pok("84B", [[0, 3], [0, 4], [1, 3]]),
  pok("85A", [[1, 5]]),
  pok("85B", [[0, 3], [0, 2], [3, 5]]),
  pok("86A", [[1, 5]]),
  pok("86B", [[0, 3], [0, 4], [1, 3]]),
  pok("87A", [[0, 2], [2, 4], [2, 5]]),
  pok("87B", [[0, 2], [0, 3]]),
  pok("88A", [[0, 4], [1, 4], [2, 4]]),
  pok("88B", [[0, 3], [0, 2], [3, 5]]),
  pok("89A", [[0, 2], [0, 4], [2, 4]]),
  pok("89B", [[0, 3], [0, 4]]),
  pok("90A", [[1, 5], [2, 4]]),
  pok("90B", [[0, 3], [0, 4]]),
  pok("91A", [[0, 3], [0, 4], [1, 3]]),
  pok("91B", [[0, 2], [0, 3]]),

  // Thunder's Edge A sides are the six faces shown in the official setup
  // ring. They are rendered as clean schematics because individual official
  // image assets are not distributed with the source project. The reverse
  // faces are intentionally omitted until their physical-tile pairing can be
  // verified from an authoritative component scan; guessing here would make
  // shortest-path ownership calculations wrong.
  te("119A", [[4, 5]], "Official Thunder's Edge A-side schematic."),
  te("120A", [[0, 4], [1, 4], [5, 4]], "Official Thunder's Edge A-side schematic."),
  te("121A", [[2, 5]], "Official Thunder's Edge A-side schematic."),
  te("122A", [[1, 2]], "Official Thunder's Edge A-side schematic."),
  te("123A", [[1, 4]], "Official Thunder's Edge A-side schematic."),
  te("124A", [[2, 5], [3, 5], [4, 5]], "Official Thunder's Edge A-side schematic."),
];

export const WARP_LANE_BY_ID = new Map(WARP_LANES.map((lane) => [lane.id, lane]));

export function rotatedPaths(
  lane: WarpLaneDefinition,
  rotation: number,
): [number, number][] {
  const steps = ((Math.round(rotation / 60) % 6) + 6) % 6;
  return lane.paths.map(([a, b]) => [
    (a + steps) % 6,
    (b + steps) % 6,
  ]);
}

export function laneDisplayName(lane: WarpLaneDefinition): string {
  return `${lane.id} · ${lane.source === "pok" ? "Prophecy of Kings" : "Thunder's Edge"}`;
}
