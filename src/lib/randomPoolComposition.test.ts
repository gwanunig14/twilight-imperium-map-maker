import { describe, expect, it } from "vitest";
import { STANDARD_LAYOUTS } from "./layoutPresets";
import { createRng } from "./rng";
import { DEFAULT_WEIGHTS } from "./scoring";
import { selectTilePool } from "./selection";
import { eligibleTiles } from "./tiles";

describe("RAW random pool composition", () => {
  it("guarantees each standard layout's official blue/red split", () => {
    const eligible = eligibleTiles(new Set(["base", "pok", "te"]));
    for (const preset of STANDARD_LAYOUTS) {
      const result = selectTilePool(
        eligible,
        { redSystems: preset.rawPool.red },
        "random",
        preset.rawPool.blue + preset.rawPool.red,
        preset.playerCount,
        DEFAULT_WEIGHTS,
        createRng(`raw-${preset.playerCount}`),
      );
      expect(result.tiles.filter((tile) => tile.type === "red")).toHaveLength(preset.rawPool.red);
      expect(result.tiles.filter((tile) => tile.type === "blue")).toHaveLength(preset.rawPool.blue);
      expect(new Set(result.tiles.map((tile) => tile.id)).size).toBe(result.tiles.length);
      expect(result.unmetTargets).toEqual([]);
    }
  });
});
