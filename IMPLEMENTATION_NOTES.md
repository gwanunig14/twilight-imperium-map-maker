# Implementation notes

## Scope

- Three to eight generic players.
- Arbitrary connected or disconnected freeform layouts.
- No faction selection, faction weighting, or faction accommodations.
- Base game, Prophecy of Kings, and Thunder's Edge blue/red systems.
- User-defined Mecatol, sector, home-system, and warp-lane positions.

## Board graph

Coordinates use an axial hex grid. Homes, Mecatol, and Sector cells are graph nodes. Directly neighboring normal cells share an edge.

Warp-lane cells are transit components rather than graph nodes. Each lane face stores pairs of connected edge indexes. Distance calculation enters a lane through one edge, exits through every edge connected to it, and recursively follows adjacent warp-lane cells until a normal active system is reached. Rotation adds a 0–5 edge offset to every stored connection.

This graph is used for:

- Shortest-path distance from every player home.
- Unique versus tied slice ownership.
- Detection of sectors unreachable from every home.
- Adjacency penalties after tile distribution.

Mecatol can carry paths through the graph but is excluded from slice ownership and scoring.

## Player lifecycle

The editor stores homes by player index. Adding a player appends the next index. Any removal calls `renumberPlayers`, which sorts the remaining homes by their previous index and rewrites them as P1 through Pn. This keeps tier order and reports contiguous without deleting higher-numbered players.

## Equidistant assignment

Split mode records every tied nearest player and grants each a `1 / tiedPlayerCount` analytical share.

Included mode is an exact bipartite-capacity problem:

- Each equidistant system supplies one assignment.
- It can connect only to a home tied for shortest distance.
- Every player demands the same number of equidistants.

A Dinic maximum-flow solver determines whether a complete equal assignment exists. Failure output includes the equidistant count, required per-player count, implicated homes, and highlighted cells for the UI diagnostic.

## Tile-pool selection

Exact composition differences receive the strongest penalty. Optimized mode uses seeded simulated annealing to swap systems into and out of the selected pool. Its secondary heuristic prefers a pool with useful aggregate economy and feature variety for the discovered number of players.

The selector returns the nearest composition when several individually valid exact choices conflict with one another. The UI reports every difference.

## Distribution

Unreachable sector positions receive random selected systems first and are then frozen. This prevents the optimizer from exploiting disconnected regions as a dumping ground for weak or unusual tiles.

Reachable positions are optimized through seeded restarts and pair swaps. The objective includes:

- Even or tiered complete-slice score.
- Resources, influence, planets, specialties, legendary systems, wormholes, anomalies, and empty systems according to user weights.
- Penalties for adjacent anomaly systems.
- Penalties for adjacent matching wormholes.

Tiered mode rewards the order P1 > P2 > ... while also penalizing excessive gaps, creating an ordered but reasonably close result.

## Manual edits

Generated placements are immutable data keyed by Sector cell ID. Drag swaps exchange two values. Manual replacement substitutes an unused tile ID in both the placement map and selected pool. Both operations call the same complete-map analyzer and therefore refresh all slice metrics immediately.

Layout components are locked after generation because changing homes, Mecatol, or warp connectivity invalidates the stored geometry. Returning to layout mode discards the generated placement.

## Component inventory

Sector placement is capped at the number of eligible blue/red system tiles from enabled boxes. Warp-lane physical IDs are unique, so selecting either face consumes that physical tile.

Prophecy of Kings tiles 83–91 include both faces and original artwork. Thunder's Edge 119A–124A are represented by verified A-side schematics. Reverse-face pairings are not included until authoritative component scans are available.
