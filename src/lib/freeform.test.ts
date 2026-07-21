import { describe, expect, it } from "vitest";
import type { LayoutCell } from "../types";
import {
  buildBoardAdjacency,
  constructSliceGeometry,
  renumberPlayers,
} from "./freeform";

const home = (id: string, q: number, r: number, player: number): LayoutCell => ({
  id,
  coord: { q, r },
  kind: "home",
  player,
});
const sector = (id: string, q: number, r: number): LayoutCell => ({
  id,
  coord: { q, r },
  kind: "sector",
});

describe("freeform board graph", () => {
  it("renumbers remaining homes after a middle player is removed", () => {
    const cells = renumberPlayers([
      home("p1", 0, 0, 0),
      home("p3", 2, 0, 2),
      home("p4", 3, 0, 3),
    ]);
    expect(cells.filter((cell) => cell.kind === "home").map((cell) => cell.player)).toEqual([0, 1, 2]);
  });

  it("assigns closer systems, marks an equidistant, and excludes unreachable sectors", () => {
    const cells = [
      home("p1", -2, 0, 0),
      home("p2", 2, 0, 1),
      sector("left", -1, 0),
      sector("middle", 0, 0),
      sector("right", 1, 0),
      sector("wayward", 8, 8),
    ];
    const result = constructSliceGeometry(cells, "split");
    expect(result.geometry?.assignments.left.assignedPlayer).toBe(0);
    expect(result.geometry?.assignments.right.assignedPlayer).toBe(1);
    expect(result.geometry?.assignments.middle.equidistant).toBe(true);
    expect(result.geometry?.assignments.middle.nearestPlayers).toEqual([0, 1]);
    expect(result.geometry?.unreachableSlotIds).toEqual(["wayward"]);
  });

  it("follows a rotated physical warp lane instead of treating it as a system", () => {
    const cells: LayoutCell[] = [
      home("p1", -1, 1, 0),
      {
        id: "warp",
        coord: { q: 0, r: 0 },
        kind: "warp",
        warp: { laneId: "83A", physicalId: "83", rotation: 0 },
      },
      sector("linked", 1, -1),
      sector("ordinary", 1, 0),
    ];
    const adjacency = buildBoardAdjacency(cells);
    expect(adjacency.p1).toContain("linked");
    expect(adjacency).not.toHaveProperty("warp");
    expect(adjacency.p1).not.toContain("ordinary");
  });


  it("follows a chain of warp-lane tiles", () => {
    const cells: LayoutCell[] = [
      home("p1", -1, 1, 0),
      {
        id: "warp-1",
        coord: { q: 0, r: 0 },
        kind: "warp",
        warp: { laneId: "83A", physicalId: "83", rotation: 0 },
      },
      {
        id: "warp-2",
        coord: { q: 1, r: -1 },
        kind: "warp",
        warp: { laneId: "84B", physicalId: "84", rotation: 0 },
      },
      sector("linked-through-chain", 1, -2),
    ];
    expect(buildBoardAdjacency(cells).p1).toContain("linked-through-chain");
  });

  it("marks a system equidistant when two homes reach it through symmetric warp lanes", () => {
    const cells: LayoutCell[] = [
      home("p4", -2, 0, 0),
      {
        id: "left-warp",
        coord: { q: -1, r: 0 },
        kind: "warp",
        warp: { laneId: "84A", physicalId: "84", rotation: 0 },
      },
      sector("center", 0, 0),
      {
        id: "right-warp",
        coord: { q: 1, r: 0 },
        kind: "warp",
        warp: { laneId: "121A", physicalId: "121", rotation: 0 },
      },
      home("p5", 2, 0, 1),
    ];
    const result = constructSliceGeometry(cells, "split");
    expect(result.geometry?.assignments.center.equidistant).toBe(true);
    expect(result.geometry?.assignments.center.nearestPlayers).toEqual([0, 1]);
  });

  it("can include one equidistant per player when the tie network permits it", () => {
    const cells = [
      home("p1", 0, -2, 0),
      home("p2", -2, 2, 1),
      home("p3", 2, 0, 2),
      sector("a1", -1, -1),
      sector("a2", -1, 0),
      sector("a3", -2, 1),
      sector("b1", -1, 1),
      sector("b2", 0, 1),
      sector("b3", 1, 0),
      sector("c1", 1, -1),
      sector("c2", 0, -1),
    ];
    const result = constructSliceGeometry(cells, "included");
    expect(result.failure).toBeUndefined();
    expect(result.geometry?.equidistantSlotIds).toHaveLength(3);
    expect(result.geometry?.assignedEquidistants).toEqual({ 0: 1, 1: 1, 2: 1 });
  });

  it("rejects included equidistants when they cannot be divided evenly", () => {
    const cells = [
      home("p1", -1, 0, 0),
      home("p2", 1, 0, 1),
      home("p3", 0, 2, 2),
      sector("only-ed", 0, 0),
      sector("bridge", 0, 1),
    ];
    const result = constructSliceGeometry(cells, "included");
    expect(result.failure).toBeDefined();
    expect(result.failure?.equidistantCount % 3).not.toBe(0);
    expect(result.failure?.highlightedSlotIds.length).toBeGreaterThan(0);
  });
});
