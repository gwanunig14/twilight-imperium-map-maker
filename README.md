# TI4 Map Maker

A free, unofficial galaxy-building tool for **Twilight Imperium Fourth Edition**, built with React, TypeScript, and Vite.

TI4 Map Maker separates three concerns that are often combined in map generators:

1. **Board shape** — where homes, Mecatol Rex, systems, and hyperlanes are placed.
2. **Tile-pool composition** — which system tiles are selected.
3. **Slice distribution** — how those tiles are assigned among the player slices.

The editor supports standard layouts for three through eight players as well as completely custom map shapes.

## Features

### Freeform board editor

- Build any connected or disconnected arrangement on an open hex grid.
- Add three to eight player home systems with **New Player**.
- Place or move Mecatol Rex.
- Add sector positions until the enabled tile supply is exhausted.
- Add, flip, and rotate official hyperlane tiles.
- Pan with Shift-drag, middle-drag, or right-drag.
- Zoom with the mouse wheel.
- Removing a home system automatically renumbers the remaining players consecutively.

Map generation requires at least three player homes and one sector position.

### Standard layout presets

Editable presets are included for standard:

- 3-player maps
- 4-player maps
- 5-player maps
- 6-player maps
- 7-player maps
- 8-player maps

Five- and seven-player presets include their required Prophecy of Kings hyperlanes. Applying a preset creates an ordinary editable layout; it does not lock the user into that arrangement.

### Expansion support

- Twilight Imperium Fourth Edition base game
- Prophecy of Kings
- Thunder’s Edge

The enabled boxes determine which systems, Mecatol tile, and hyperlane components are available.

## Generation workflow

1. Enable the game boxes being used.
2. Apply a standard layout preset or construct a custom board.
3. Choose map-composition settings.
4. Choose **Random** or **Optimized** tile selection.
5. Choose **Random** or **Balanced** placement.
6. Choose the **Even** or **Tiered** slice goal when using Balanced placement.
7. Choose how equidistant systems are handled.
8. Generate the map.
9. Inspect, swap, or replace generated systems as desired.

## Tile selection

### Random

Random selection chooses a legal tile pool while respecting exact composition settings.

When an unmodified standard-layout preset is active and **Red-backed systems** remains set to **Auto**, Random selection uses that setup’s official blue/red system-tile composition. For example, the standard six-player map uses:

- 18 blue-backed systems
- 12 red-backed systems

Choosing an exact red-backed count overrides the preset ratio.

### Optimized

Optimized selection searches the eligible tile library for a pool suited to the requested composition and the selected balance priorities.

Optimized selection deliberately does **not** enforce the standard preset’s official blue/red deal ratio unless the user selects an exact red-backed target. Its goal is to produce the strongest available material for the requested balance objective.

## Composition controls

Composition settings may be left on **Auto** or assigned exact values for:

- Red-backed systems
- Total anomalies
- Asteroid fields
- Nebulae
- Gravity rifts
- Supernovas
- Total wormhole systems
- Individual wormhole types
- Tech-specialty systems
- Individual technology-skip icons
- Legendary systems
- Empty systems
- One-, two-, and three-planet systems

Available values are limited by:

- Enabled expansions
- The number of sector positions
- The remaining official tile supply

Requested settings and the resulting generated counts are stored separately. Generating a map does not change an **Auto** selection into zero or overwrite the user’s requested composition.

## Slice construction

The completed layout is converted into a board graph.

- Normal active hexes connect across shared sides.
- Hyperlane tiles are not systems themselves.
- Printed hyperlane paths create edge-to-edge adjacency.
- Chains of adjacent hyperlanes are followed when calculating distance.
- Mecatol Rex participates in travel-distance calculations but is not assigned to or scored for any slice.
- A sector unreachable from every home is excluded from balancing and slice scoring, but still receives a random unused system after generation.

Each reachable sector is assigned according to shortest-path distance from every player home:

- A uniquely closest sector belongs to that player.
- A sector equally close to multiple homes is equidistant.

## Equidistant systems

### Split

Each tied player receives an equal fractional share of an equidistant system for scoring and optimization.

### Included

Each equidistant system is assigned wholly to one of the tied players. Every player must receive the same number of included equidistant systems.

When the layout cannot support an equal allocation, generation stops and the app:

- Identifies the affected player homes
- Identifies the conflicting equidistant systems
- Highlights the involved slice outlines on the map

## Placement methods and balance goals

### Random placement

The selected systems are shuffled into the available sector positions. Slice Goal is not used.

### Balanced placement

The distributor evaluates completed slices and searches for a stronger arrangement.

#### Even

Minimizes normalized differences between player slices.

#### Tiered

Creates a modest descending strength order:

`P1 > P2 > P3 > …`

The order always follows player number. Users can control where the strongest and weakest tiers appear by choosing where to place each player home before generation.

Balance priorities determine how strongly the optimizer values:

- Resources
- Influence
- Planet count
- Technology skips
- Legendary systems
- Wormhole access
- Anomalies
- Empty systems

## Hyperlanes

The app supports both faces of every included physical hyperlane tile:

### Prophecy of Kings

- `83A–91B`

### Thunder’s Edge

- `119A–124B`

Each physical tile can appear only once. For example, placing `119A` prevents `119B` from being used elsewhere, although the placed tile may be edited from one face to the other.

Every face may be rotated in 60-degree increments. Hyperlane face and rotation data are preserved in exported save files.

## Seeds and regeneration

- **Generate Map** uses the currently displayed seed.
- **Regenerate Map** creates a new seed and produces a new map.
- **Rebuild Seed** reproduces the current seeded result.

The seeded workflow allows both exploration and repeatable map sharing.

## Save and load

The JSON export is a complete versioned save file. Import restores:

- Board layout and coordinates
- Player homes
- Mecatol Rex
- Sector positions
- Hyperlane faces and rotations
- Enabled expansions
- Composition settings
- Tile-selection and placement methods
- Even or Tiered goal
- Equidistant behavior
- Balance priorities
- Seed
- Generated placements
- Manual swaps and replacements

Imports are validated before replacing the current project state.

## Editing a generated map

- Drag one generated system onto another to swap them.
- Click a system to open its information panel.
- The unused-system list appears only after clicking **Select Different System**.
- Manual replacements may intentionally depart from the requested composition.
- Slice scores and generated counts update after every swap or replacement.

Homes, Mecatol Rex, hyperlanes, and board geometry are locked after generation. Choose **Edit Layout** to discard the generated placement and change the board structure.

## Run locally

Requirements:

- Node.js 20 or newer
- npm

Install and start the development server:

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

## Tests and production build

```bash
npm test
npm run build
```

The production build is written to `docs/` for GitHub Pages deployment.

To preview the production build locally:

```bash
npm run preview
```

## GitHub Pages

The repository is configured to build into `docs/`. To publish from GitHub Pages:

1. Run `npm run build`.
2. Commit the generated `docs/` directory.
3. In the repository, open **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select the default branch and `/docs`.

The Vite `base` value in `vite.config.ts` must match the repository name when the site is hosted at `username.github.io/repository-name/`.

## Project structure

- `src/App.tsx` — main editor workflow and application state
- `src/components/FreeformBoard.tsx` — map canvas, pan/zoom, tile interaction, and slice overlays
- `src/components/WarpLanePicker.tsx` — hyperlane face and rotation selection
- `src/lib/freeform.ts` — board graph, shortest paths, hyperlane traversal, and equidistant allocation
- `src/lib/selection.ts` — random and optimized tile-pool selection
- `src/lib/distribution.ts` — random and balanced system placement
- `src/lib/scoring.ts` — slice metrics and Even/Tiered objectives
- `src/lib/hyperlanes.ts` — physical hyperlane inventory and edge connections
- `src/lib/layoutPresets.ts` — standard 3–8 player layouts and official random-pool compositions
- `public/tiles/` — system-tile artwork
- `public/warp-lanes/` — Prophecy of Kings and Thunder’s Edge hyperlane artwork

## Disclaimer and source credit

This is an unofficial, fan-made, noncommercial utility. It is not affiliated with or endorsed by Fantasy Flight Games or Asmodee.

Twilight Imperium Fourth Edition, Prophecy of Kings, Thunder’s Edge, associated names, and all game artwork are properties of Fantasy Flight Games and/or Asmodee.

System metadata and some original project assets were adapted from the public `KeeganW/ti4` project and community Thunder’s Edge contributions. Thunder’s Edge hyperlane component imagery was prepared from user-supplied reference assets for use in this map-building utility.
