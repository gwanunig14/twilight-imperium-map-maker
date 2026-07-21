## 0.3.0 — Presets, save/load, and predictable regeneration

- Added editable official layout presets for standard 3-, 4-, 5-, 6-, 7-, and 8-player galaxies.
- Added the correct Prophecy of Kings hyperlane faces and positions to the standard five- and seven-player presets.
- Random tile selection now uses the official blue/red system mix when a standard preset is active and Red-backed systems remains Auto.
- Optimized tile selection deliberately ignores the preset RAW ratio unless the user chooses an exact red-backed target.
- Corrected the initial composition-state bug: composition controls now begin and remain on Auto rather than being initialized from a one-sector layout and stuck at zero.
- Separated requested composition from generated counts and display the generated result beside each setting.
- Regenerate Map now creates a fresh seed; Rebuild Seed reproduces the current map deterministically.
- Added versioned JSON import that restores layouts, expansions, settings, warp lanes, seeds, generated placements, swaps, and replacements.
- Added regression coverage for preset geometry and all official random blue/red pool counts.

## 0.2.2 — TI4 visual theme

- Reworked the application palette around the base-game, Prophecy of Kings, and Thunder’s Edge box art.
- Updated P1–P8 defaults to blue, red, yellow, green, purple, orange, pink, and black plastic colors.
- Improved home-system label contrast across all eight player colors.
- Added warmer imperial-gold controls, ember highlights, teal accents, and a subtler starfield background.

# 0.2.1 — Warp graph correction

- Corrected hyperlane edge numbering to match the canonical TI4/tile-data order: north, northeast, southeast, south, southwest, northwest.
- Fixed shortest-path and equidistant detection through rotated and chained warp lanes.
- Added a regression check for a system reached equally through two warp-lane routes.
- Renamed Distribution to Placement Method and clarified that Balanced is the optimizer while Even/Tiered selects its target.
- Disabled Slice Goal while Random placement is selected because it is not used in that mode.

# TI4 Map Maker 0.2.0

## Freeform board rebuild

- Replaced the fixed six-player board with an arbitrary axial-hex editor.
- Added pannable and zoomable blank-hex canvas.
- Added placement tools for New Player, Mecatol, Sector, Warp Lane, and Erase.
- Added three-to-eight-player support derived from placed home systems.
- Removing a home now renumbers all remaining players consecutively.
- Generation requires at least three homes.
- Sector placement is capped by the enabled official tile supply.
- Every physical warp-lane tile can be used only once.
- Added 60-degree warp-lane rotation and visual previews.

## Graph-based slices

- Slice ownership is calculated from shortest-path distance to every home.
- Warp-lane edge connections and chained warp lanes participate in pathfinding.
- Mecatol participates in distance but is excluded from ownership and scoring.
- Unreachable sectors are excluded from balancing and receive random tiles afterward.
- Added split equidistant analysis.
- Added exact included-equidistant allocation using a maximum-flow solver.
- Impossible included allocation now identifies conflicting homes and highlights involved systems.

## Generation and balance

- Preserved independent random/optimized tile selection.
- Preserved independent random/balanced distribution.
- Preserved all composition controls and balance weights.
- Added Even and Tiered complete-slice goals.
- Tiered order is always P1 through P8 with deliberately modest gaps.
- Optimizer works with the discovered freeform slices rather than a predefined map template.

## Post-generation editing

- Added drag-and-drop system swaps.
- Added system inspector with an explicit **Select Different System** action.
- Unused-system browser appears only after that action.
- Manual replacements may override composition targets and are visibly flagged.
- Every swap and replacement recalculates slice scores.
- Layout-defining components are locked until **Edit Layout** discards the generated placement.

## Warp-lane data

- Prophecy of Kings 83A–91B artwork and connection definitions included.
- Thunder's Edge 119A–124A official-ring connections included as clean schematics.
- Unverified Thunder's Edge reverse-face pairings intentionally omitted rather than guessed.

## Verification coverage

Regression checks cover player renumbering, closest/equidistant/unreachable classification, direct and chained warp traversal, feasible and infeasible equal equidistant allocation, unique tile selection, disconnected-sector filling, and complete freeform generation.
