# Release notes

## 0.3.1 — Complete Thunder’s Edge hyperlane support

- Added finished artwork for all twelve Thunder’s Edge hyperlane faces:
  - `119A/119B`
  - `120A/120B`
  - `121A/121B`
  - `122A/122B`
  - `123A/123B`
  - `124A/124B`
- Added connection definitions for all six Thunder’s Edge B sides.
- Preserved the one-physical-tile rule: selecting an A side prevents the corresponding B side from being placed elsewhere.
- Kept face switching available while editing an already placed physical tile.
- Added proper flat-top WebP assets matching the dimensions and shape of the existing Prophecy of Kings hyperlane images.
- Updated the hyperlane picker to expose all twelve Thunder’s Edge faces when the expansion is enabled.
- Ensured Thunder’s Edge face and rotation choices survive JSON export and import.
- Updated project documentation to describe complete Prophecy of Kings and Thunder’s Edge hyperlane support.

## 0.3.0 — Presets, save/load, and predictable regeneration

- Added editable standard-layout presets for 3-, 4-, 5-, 6-, 7-, and 8-player galaxies.
- Added the correct Prophecy of Kings hyperlane faces and positions to the standard five- and seven-player presets.
- Random tile selection now uses the official blue/red system mix when a standard preset is active and Red-backed systems remains Auto.
- Optimized tile selection ignores the preset RAW ratio unless the user chooses an exact red-backed target.
- Fixed composition controls initializing from a one-sector layout and becoming stuck at zero.
- Requested composition settings now remain separate from generated counts.
- Generated counts are displayed without mutating the user’s selected settings.
- **Regenerate Map** now creates a fresh seed.
- **Rebuild Seed** reproduces the current map deterministically.
- Added versioned JSON import and export.
- Save files restore layouts, expansions, settings, hyperlanes, seeds, generated placements, swaps, and manual replacements.
- Added regression coverage for preset geometry and official random blue/red pool counts.

## 0.2.2 — TI4 visual theme

- Reworked the interface palette around the base-game, Prophecy of Kings, and Thunder’s Edge box art.
- Updated P1–P8 defaults to match the physical plastic colors:
  - Blue
  - Red
  - Yellow
  - Green
  - Purple
  - Orange
  - Pink
  - Black
- Improved home-system label contrast across all eight player colors.
- Added imperial-gold controls, ember highlights, teal accents, and a subtler starfield background.

## 0.2.1 — Hyperlane graph correction

- Corrected hyperlane edge numbering to the project’s canonical clockwise order:
  - North
  - Northeast
  - Southeast
  - South
  - Southwest
  - Northwest
- Fixed shortest-path and equidistant detection through rotated hyperlanes.
- Fixed pathfinding through chains of multiple hyperlane tiles.
- Added a regression check for a system reached equally through two hyperlane routes.
- Renamed **Distribution** to **Placement Method**.
- Clarified that Balanced controls whether the placement optimizer runs, while Even/Tiered chooses its objective.
- Disabled Slice Goal when Random placement is selected because it has no effect in that mode.

## 0.2.0 — Freeform board rebuild

### Freeform editor

- Replaced the fixed six-player board with a freeform axial-hex editor.
- Added a pannable and zoomable map canvas.
- Added tools for New Player, Mecatol, Sector, Warp Lane, and Erase.
- Added 3–8 player support derived from the placed home systems.
- Removing a home now renumbers all remaining players consecutively.
- Generation requires at least three player homes.
- Sector placement is capped by the enabled official system-tile supply.
- Every physical hyperlane tile can be used only once.
- Added 60-degree hyperlane rotation and visual previews.

### Graph-based slice construction

- Slice ownership is calculated from shortest-path distance to every player home.
- Hyperlane edge connections participate in pathfinding.
- Chains of adjacent hyperlane tiles are followed.
- Mecatol Rex participates in distance calculations but is excluded from ownership and scoring.
- Unreachable sectors are excluded from balancing and receive random tiles afterward.
- Added split equidistant analysis.
- Added whole-system included-equidistant allocation.
- Added equal-allocation validation using a maximum-flow solver.
- Impossible included allocations now identify conflicting homes and highlight involved systems.

### Generation and balancing

- Preserved independent Random and Optimized tile selection.
- Preserved independent Random and Balanced placement.
- Preserved composition controls and balance priorities.
- Added Even and Tiered complete-slice goals.
- Tiered order always follows P1 through P8 with deliberately modest gaps.
- The optimizer works with discovered freeform slices rather than a predefined map template.

### Post-generation editing

- Added drag-and-drop system swaps.
- Added a tile inspector with an explicit **Select Different System** action.
- The unused-system browser remains hidden until that action is selected.
- Manual replacements may override composition targets.
- Every swap and replacement recalculates slice scores.
- Layout-defining components remain locked until **Edit Layout** discards the generated placement.

### Initial hyperlane support

- Added Prophecy of Kings `83A–91B` artwork and connection definitions.
- Added the six Thunder’s Edge A-side ring connections as preliminary schematic entries.

### Verification

Regression checks cover:

- Player renumbering
- Closest, equidistant, and unreachable classification
- Direct and chained hyperlane traversal
- Feasible and infeasible equal equidistant allocation
- Unique tile selection
- Disconnected-sector filling
- Complete freeform generation
