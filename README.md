# TI4 Map Maker

A personal-use, freeform Twilight Imperium Fourth Edition galaxy builder written in React, TypeScript, and Vite.

The application keeps tile-pool composition and slice balancing separate from board shape. You design the physical layout first, and the generator discovers the player slices from the finished board graph.

## Freeform workflow

1. Enable the boxes you are using.
2. Use the placement ribbon to add:
   - **New Player** — adds the next home system from P1 through P8.
   - **Mecatol** — places or moves Mecatol Rex.
   - **Sector** — marks a position that will receive a system tile.
   - **Warp Lane** — chooses an available physical lane tile, face, and rotation.
   - **Erase** — removes a placed position.
3. Pan with Shift-drag, middle-drag, or right-drag. Zoom with the mouse wheel.
4. Choose map composition, tile-selection mode, distribution mode, balance goal, and equidistant behavior.
5. Generate the map.
6. Drag generated systems onto one another to swap them, or click a system and choose **Select Different System** to replace it with an unused tile.

Removing a player renumbers every remaining home consecutively. Generation requires at least three players and one sector.

## Generation model

### Tile selection

- **Random** chooses a random legal pool while attempting to satisfy exact composition choices.
- **Optimized** searches the eligible tile library for a pool that satisfies the requested composition and gives the distributor stronger balancing material.

Composition controls support Auto or exact counts for red-backed systems, anomalies and anomaly types, wormholes and wormhole types, tech-specialty systems and individual icons, legendary systems, empty systems, and one-, two-, and three-planet systems. Numeric choices are limited by the enabled tile library and current number of Sector positions.

### Slice construction

The board is converted into a graph. Every normal active hex connects across its shared edges. A warp-lane tile is not a system; its printed lanes create edge-to-edge connections, and chains of adjacent warp lanes are followed when measuring distance.

Each reachable sector is assigned by shortest path from the player homes:

- A uniquely closest system belongs to that player's slice.
- A system tied between homes is equidistant.
- A sector unreachable from every home is excluded from slice optimization and scoring, but still receives a random unused system when the map is generated.
- Mecatol participates in travel-distance calculations but is never assigned to or scored for a slice.

### Equidistants

- **Split** gives every tied player an equal fractional share of the system for analysis and optimization.
- **Included** assigns every equidistant wholly to one of its tied players. Every player must receive the same number. If the layout cannot support that, generation is stopped, the conflicting homes and systems are identified, and the affected outlines are highlighted.

### Balance goals

- **Even** minimizes normalized differences between complete slices.
- **Tiered** creates a modest descending order: P1, then P2, P3, and so forth. The homes can be positioned to control where those tiers appear.

Balance priorities control how strongly the optimizer values resources, influence, planet count, tech skips, legendary systems, wormhole access, anomalies, and empty systems.

## Warp-lane components

The package includes the original Prophecy of Kings A/B artwork and connection data for tiles 83–91. Thunder's Edge tiles 119A–124A are included as schematic previews using the official A-side ring connections. The reverse-side physical pairings are deliberately omitted rather than guessed; adding verified scans later only requires updating `src/lib/hyperlanes.ts` and image assets.

Each physical warp-lane tile may appear only once. Rotation is available in 60-degree increments.

## Manual editing after generation

Generated system tiles can be drag-swapped. Clicking without dragging opens the tile inspector; the unused-system browser is shown only after pressing **Select Different System**. Every swap or replacement immediately recalculates slice scores. Replacements are treated as manual overrides and may intentionally depart from the original composition targets.

Home systems, Mecatol, warp lanes, and the board layout are locked after generation. Choose **Edit Layout** to discard the generated tile placement and alter them.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

## Verification

```bash
npm test
npm run build
```

## Project structure

- `src/App.tsx` — editor workflow and generation state.
- `src/components/FreeformBoard.tsx` — unbounded visible hex grid, pan/zoom, tile interactions, and slice overlays.
- `src/lib/freeform.ts` — board graph, warp traversal, shortest paths, equidistants, and equal-assignment flow solver.
- `src/lib/selection.ts` — constrained random/optimized tile-pool selection.
- `src/lib/distribution.ts` — random/balanced placement over discovered slices.
- `src/lib/scoring.ts` — slice metrics and even/tiered objectives.
- `src/lib/hyperlanes.ts` — physical warp-lane inventory and edge connections.

## Source credit

System metadata and tile artwork were adapted from the public `KeeganW/ti4` project and its Thunder's Edge contributions. Twilight Imperium and its artwork are owned by Fantasy Flight Games/Asmodee. This package is intended for personal, noncommercial use.
