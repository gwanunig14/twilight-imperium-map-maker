import { describe, expect, it } from "vitest";
import type { LayoutCell } from "../types";
import { constructSliceGeometry } from "./freeform";
import { createRng } from "./rng";
import { DEFAULT_WEIGHTS } from "./scoring";
import { distributeTiles } from "./distribution";
import { selectTilePool } from "./selection";
import { eligibleTiles } from "./tiles";

const layout: LayoutCell[] = [
  { id: "p1", coord: { q: -3, r: 0 }, kind: "home", player: 0 },
  { id: "p2", coord: { q: 3, r: 0 }, kind: "home", player: 1 },
  { id: "p3", coord: { q: 0, r: 3 }, kind: "home", player: 2 },
  ...[
    [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0],
    [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1],
    [-1, 2], [0, 2], [1, 2],
    [9, 9],
  ].map(([q, r], index): LayoutCell => ({
    id: `s${index}`,
    coord: { q, r },
    kind: "sector",
  })),
];

describe("freeform generation", () => {
  it("selects one unique tile per sector and fills wayward sectors", () => {
    const geometry = constructSliceGeometry(layout, "split").geometry!;
    const eligible = eligibleTiles(new Set(["base", "pok", "te"]));
    const rng = createRng("freeform-regression");
    const selection = selectTilePool(
      eligible,
      { redSystems: 5, wormholeSystems: 2 },
      "optimized",
      Object.keys(geometry.assignments).length,
      geometry.playerCount,
      DEFAULT_WEIGHTS,
      rng,
    );
    const result = distributeTiles(
      selection.tiles,
      "balanced",
      "even",
      geometry,
      DEFAULT_WEIGHTS,
      rng,
    );

    expect(Object.keys(result.placements)).toHaveLength(Object.keys(geometry.assignments).length);
    expect(new Set(Object.values(result.placements)).size).toBe(selection.tiles.length);
    expect(geometry.unreachableSlotIds).toEqual(["s13"]);
    expect(result.placements.s13).toBeTruthy();
    expect(result.analysis.players).toHaveLength(3);
  });
});
