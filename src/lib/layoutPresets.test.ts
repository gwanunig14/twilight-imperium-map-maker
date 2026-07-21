import { describe, expect, it } from "vitest";
import { STANDARD_LAYOUTS } from "./layoutPresets";
import { constructSliceGeometry } from "./freeform";

describe("standard layout presets", () => {
  it("contains the expected homes, sectors, unique cells, and RAW pools", () => {
    for (const preset of STANDARD_LAYOUTS) {
      const homes = preset.cells.filter((cell) => cell.kind === "home");
      const sectors = preset.cells.filter((cell) => cell.kind === "sector");
      const keys = preset.cells.map((cell) => `${cell.coord.q},${cell.coord.r}`);
      expect(homes).toHaveLength(preset.playerCount);
      expect(sectors).toHaveLength(preset.rawPool.blue + preset.rawPool.red);
      expect(new Set(keys).size).toBe(keys.length);
      expect(homes.map((home) => home.player)).toEqual(
        Array.from({ length: preset.playerCount }, (_, index) => index),
      );
      const geometry = constructSliceGeometry(preset.cells, "split").geometry;
      expect(geometry?.unreachableSlotIds).toEqual([]);
      expect(Object.keys(geometry?.assignments ?? {})).toHaveLength(sectors.length);
    }
  });

  it("uses all six physical A-side hyperlanes for standard five and seven player maps", () => {
    for (const id of ["standard-5", "standard-7"] as const) {
      const preset = STANDARD_LAYOUTS.find((candidate) => candidate.id === id)!;
      const physicalIds = preset.cells
        .filter((cell) => cell.kind === "warp")
        .map((cell) => cell.warp?.physicalId);
      expect(new Set(physicalIds).size).toBe(6);
    }
  });
});
