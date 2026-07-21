import type {
  Axial,
  EquidistantFailure,
  EquidistantMode,
  LayoutCell,
  SliceAssignment,
  SliceGeometry,
} from "../types";
import { WARP_LANE_BY_ID, rotatedPaths } from "./hyperlanes";

// Canonical TI4 hyperlane edge order, clockwise from the flat top side:
// 0 north, 1 northeast, 2 southeast, 3 south, 4 southwest, 5 northwest.
// This matches the edge numbering used by tileData's hyperlane definitions.
export const DIRECTIONS: Axial[] = [
  { q: 0, r: -1 },
  { q: 1, r: -1 },
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
];

export function coordKey({ q, r }: Axial): string {
  return `${q},${r}`;
}

export function parseCoord(key: string): Axial {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

export function addCoord(a: Axial, b: Axial): Axial {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function gridCoordinates(radius: number): Axial[] {
  const coords: Axial[] = [];
  for (let q = -radius; q <= radius; q += 1) {
    for (let r = -radius; r <= radius; r += 1) {
      if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= radius) {
        coords.push({ q, r });
      }
    }
  }
  return coords;
}

export function renumberPlayers(cells: LayoutCell[]): LayoutCell[] {
  const homes = cells
    .filter((cell) => cell.kind === "home")
    .sort((a, b) => (a.player ?? 0) - (b.player ?? 0));
  const numberById = new Map(homes.map((home, index) => [home.id, index]));
  return cells.map((cell) =>
    cell.kind === "home"
      ? { ...cell, player: numberById.get(cell.id) ?? 0 }
      : cell,
  );
}

function regularCell(cell: LayoutCell): boolean {
  return cell.kind === "home" || cell.kind === "mecatol" || cell.kind === "sector";
}

function addEdge(adjacency: Map<string, Set<string>>, a: string, b: string) {
  if (a === b) return;
  adjacency.get(a)?.add(b);
  adjacency.get(b)?.add(a);
}

function exitsForEntry(cell: LayoutCell, entry: number): number[] {
  if (cell.kind !== "warp" || !cell.warp) return [];
  const lane = WARP_LANE_BY_ID.get(cell.warp.laneId);
  if (!lane) return [];
  const exits: number[] = [];
  for (const [a, b] of rotatedPaths(lane, cell.warp.rotation)) {
    if (a === entry && b !== entry) exits.push(b);
    if (b === entry && a !== entry) exits.push(a);
  }
  return [...new Set(exits)];
}

function followWarp(
  startWarp: LayoutCell,
  entryEdge: number,
  byCoord: Map<string, LayoutCell>,
): string[] {
  const results = new Set<string>();
  const queue: { cell: LayoutCell; entry: number }[] = [
    { cell: startWarp, entry: entryEdge },
  ];
  const seen = new Set<string>();

  while (queue.length) {
    const current = queue.shift()!;
    const stateKey = `${current.cell.id}:${current.entry}`;
    if (seen.has(stateKey)) continue;
    seen.add(stateKey);

    for (const exit of exitsForEntry(current.cell, current.entry)) {
      const nextCoord = addCoord(current.cell.coord, DIRECTIONS[exit]);
      const next = byCoord.get(coordKey(nextCoord));
      if (!next) continue;
      if (regularCell(next)) {
        results.add(next.id);
      } else if (next.kind === "warp") {
        queue.push({ cell: next, entry: (exit + 3) % 6 });
      }
    }
  }

  return [...results];
}

export function buildBoardAdjacency(cells: LayoutCell[]): Record<string, string[]> {
  const byCoord = new Map(cells.map((cell) => [coordKey(cell.coord), cell]));
  const regular = cells.filter(regularCell);
  const adjacency = new Map(regular.map((cell) => [cell.id, new Set<string>()]));

  for (const cell of regular) {
    DIRECTIONS.forEach((direction, directionIndex) => {
      const neighbor = byCoord.get(coordKey(addCoord(cell.coord, direction)));
      if (!neighbor) return;
      if (regularCell(neighbor)) {
        addEdge(adjacency, cell.id, neighbor.id);
        return;
      }
      if (neighbor.kind === "warp") {
        const linked = followWarp(neighbor, (directionIndex + 3) % 6, byCoord);
        linked.forEach((targetId) => addEdge(adjacency, cell.id, targetId));
      }
    });
  }

  return Object.fromEntries(
    [...adjacency.entries()].map(([id, neighbors]) => [id, [...neighbors]]),
  );
}

function shortestDistances(
  source: string,
  adjacency: Record<string, string[]>,
): Record<string, number> {
  const distance: Record<string, number> = { [source]: 0 };
  const queue = [source];
  while (queue.length) {
    const current = queue.shift()!;
    for (const next of adjacency[current] ?? []) {
      if (distance[next] !== undefined) continue;
      distance[next] = distance[current] + 1;
      queue.push(next);
    }
  }
  return distance;
}

class Dinic {
  private graph: { to: number; rev: number; cap: number }[][];
  constructor(private size: number) {
    this.graph = Array.from({ length: size }, () => []);
  }
  addEdge(from: number, to: number, cap: number) {
    const f = { to, rev: this.graph[to].length, cap };
    const r = { to: from, rev: this.graph[from].length, cap: 0 };
    this.graph[from].push(f);
    this.graph[to].push(r);
  }
  maxFlow(source: number, sink: number): number {
    let total = 0;
    while (true) {
      const level = Array(this.size).fill(-1);
      level[source] = 0;
      const queue = [source];
      while (queue.length) {
        const v = queue.shift()!;
        for (const edge of this.graph[v]) {
          if (edge.cap > 0 && level[edge.to] < 0) {
            level[edge.to] = level[v] + 1;
            queue.push(edge.to);
          }
        }
      }
      if (level[sink] < 0) return total;
      const it = Array(this.size).fill(0);
      const dfs = (v: number, f: number): number => {
        if (v === sink) return f;
        for (; it[v] < this.graph[v].length; it[v] += 1) {
          const edge = this.graph[v][it[v]];
          if (edge.cap <= 0 || level[v] + 1 !== level[edge.to]) continue;
          const pushed = dfs(edge.to, Math.min(f, edge.cap));
          if (pushed > 0) {
            edge.cap -= pushed;
            this.graph[edge.to][edge.rev].cap += pushed;
            return pushed;
          }
        }
        return 0;
      };
      while (true) {
        const pushed = dfs(source, Number.MAX_SAFE_INTEGER);
        if (!pushed) break;
        total += pushed;
      }
    }
  }
  edgesFrom(node: number) {
    return this.graph[node];
  }
}

function assignEquidistantsEvenly(
  equidistants: SliceAssignment[],
  playerCount: number,
): { assignments?: Record<string, number>; failure?: EquidistantFailure } {
  if (equidistants.length === 0) {
    return { assignments: {} };
  }
  if (equidistants.length % playerCount !== 0) {
    return {
      failure: {
        message: `${equidistants.length} equidistant systems cannot be divided evenly among ${playerCount} players.`,
        playerCount,
        equidistantCount: equidistants.length,
        requiredPerPlayer: null,
        conflictingPlayers: Array.from({ length: playerCount }, (_, index) => index),
        highlightedSlotIds: equidistants.map((item) => item.slotId),
      },
    };
  }

  const target = equidistants.length / playerCount;
  const source = 0;
  const eqStart = 1;
  const playerStart = eqStart + equidistants.length;
  const sink = playerStart + playerCount;
  const flow = new Dinic(sink + 1);

  equidistants.forEach((assignment, index) => {
    const node = eqStart + index;
    flow.addEdge(source, node, 1);
    assignment.nearestPlayers.forEach((player) => {
      flow.addEdge(node, playerStart + player, 1);
    });
  });
  for (let player = 0; player < playerCount; player += 1) {
    flow.addEdge(playerStart + player, sink, target);
  }

  const result = flow.maxFlow(source, sink);
  const assignments: Record<string, number> = {};
  const received = Array(playerCount).fill(0);
  equidistants.forEach((assignment, index) => {
    const node = eqStart + index;
    for (const edge of flow.edgesFrom(node)) {
      if (
        edge.to >= playerStart &&
        edge.to < playerStart + playerCount &&
        edge.cap === 0
      ) {
        const player = edge.to - playerStart;
        assignments[assignment.slotId] = player;
        received[player] += 1;
        break;
      }
    }
  });

  if (result !== equidistants.length) {
    const conflicts = received
      .map((count, player) => ({ count, player }))
      .filter(({ count }) => count < target)
      .map(({ player }) => player);
    const conflictSet = new Set(conflicts);
    const highlighted = equidistants
      .filter((item) => item.nearestPlayers.some((player) => conflictSet.has(player)))
      .map((item) => item.slotId);
    return {
      failure: {
        message: `The equidistant network cannot give every player exactly ${target} system${target === 1 ? "" : "s"}. P${conflicts.map((player) => player + 1).join(", P")} cannot receive enough of the systems to which they are tied.`,
        playerCount,
        equidistantCount: equidistants.length,
        requiredPerPlayer: target,
        conflictingPlayers: conflicts,
        highlightedSlotIds: highlighted,
      },
    };
  }

  return { assignments };
}

export function constructSliceGeometry(
  cells: LayoutCell[],
  equidistantMode: EquidistantMode,
): { geometry?: SliceGeometry; failure?: EquidistantFailure } {
  const homes = cells
    .filter((cell) => cell.kind === "home")
    .sort((a, b) => (a.player ?? 0) - (b.player ?? 0));
  const sectors = cells.filter((cell) => cell.kind === "sector");
  const adjacency = buildBoardAdjacency(cells);
  const distances = homes.map((home) => shortestDistances(home.id, adjacency));
  const assignments: Record<string, SliceAssignment> = {};

  for (const sector of sectors) {
    const finite = distances
      .map((bySlot, player) => ({ player, distance: bySlot[sector.id] }))
      .filter((item): item is { player: number; distance: number } => item.distance !== undefined);
    if (!finite.length) {
      assignments[sector.id] = {
        slotId: sector.id,
        reachable: false,
        distances: {},
        nearestPlayers: [],
        equidistant: false,
      };
      continue;
    }
    const minimum = Math.min(...finite.map((item) => item.distance));
    const nearestPlayers = finite
      .filter((item) => item.distance === minimum)
      .map((item) => item.player);
    assignments[sector.id] = {
      slotId: sector.id,
      reachable: true,
      distances: Object.fromEntries(finite.map((item) => [item.player, item.distance])),
      nearestPlayers,
      assignedPlayer: nearestPlayers.length === 1 ? nearestPlayers[0] : undefined,
      equidistant: nearestPlayers.length > 1,
    };
  }

  const equidistants = Object.values(assignments).filter(
    (assignment) => assignment.reachable && assignment.equidistant,
  );
  if (equidistantMode === "included") {
    const result = assignEquidistantsEvenly(equidistants, homes.length);
    if (result.failure) {
      const highlighted = new Set(result.failure.highlightedSlotIds);
      for (const assignment of Object.values(assignments)) {
        if (
          assignment.assignedPlayer !== undefined &&
          result.failure.conflictingPlayers.includes(assignment.assignedPlayer)
        ) {
          highlighted.add(assignment.slotId);
        }
      }
      return {
        geometry: {
          playerCount: homes.length,
          equidistantMode: "split",
          assignments,
          adjacency,
          equidistantSlotIds: equidistants.map((assignment) => assignment.slotId),
          unreachableSlotIds: Object.values(assignments)
            .filter((assignment) => !assignment.reachable)
            .map((assignment) => assignment.slotId),
          assignedEquidistants: Object.fromEntries(
            homes.map((_, player) => [player, 0]),
          ),
        },
        failure: {
          ...result.failure,
          highlightedSlotIds: [...highlighted],
        },
      };
    }
    Object.entries(result.assignments ?? {}).forEach(([slotId, player]) => {
      assignments[slotId].assignedPlayer = player;
    });
  }

  const assignedEquidistants: Record<number, number> = Object.fromEntries(
    homes.map((_, player) => [player, 0]),
  );
  if (equidistantMode === "included") {
    equidistants.forEach((assignment) => {
      if (assignment.assignedPlayer !== undefined) {
        assignedEquidistants[assignment.assignedPlayer] += 1;
      }
    });
  }

  return {
    geometry: {
      playerCount: homes.length,
      equidistantMode,
      assignments,
      adjacency,
      equidistantSlotIds: equidistants.map((assignment) => assignment.slotId),
      unreachableSlotIds: Object.values(assignments)
        .filter((assignment) => !assignment.reachable)
        .map((assignment) => assignment.slotId),
      assignedEquidistants,
    },
  };
}
