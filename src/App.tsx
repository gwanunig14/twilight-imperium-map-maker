import { useMemo, useState } from "react";
import { MapWorkspace } from "./components/MapWorkspace";
import { LayoutSummary } from "./components/LayoutSummary";
import { CompositionPanel } from "./components/CompositionPanel";
import { BalancePriorities } from "./components/BalancePriorities";
import { GenerationSettings } from "./components/GenerationSettings";
import { SystemReplacementPicker } from "./components/SystemReplacementPicker";
import Topbar, { freshSeed } from "./components/TopBar";
import { TileLibrary } from "./components/TileLibrary";
import { ToolRibbon } from "./components/ToolRibbon";
import { WarpLanePicker } from "./components/WarpLanePicker";
import { useGenerationSettings } from "./hooks/useGenerationSettings";
import { distributeTiles } from "./lib/distribution";
import {
  constructSliceGeometry,
  coordKey,
  renumberPlayers,
} from "./lib/freeform";
import { WARP_LANE_BY_ID, WARP_LANES } from "./lib/hyperlanes";
import {
  compositionDifferences,
  featureGroups,
  PLAYER_COLORS,
} from "./lib/mapSettings";
import { createRng } from "./lib/rng";
import { analyzeCustomMap } from "./lib/scoring";
import { selectTilePool } from "./lib/selection";
import {
  availableFeatureKeys,
  eligibleTiles,
  featureLabel,
  poolFeatureCounts,
} from "./lib/tiles";
import type {
  Axial,
  EditorTool,
  EquidistantFailure,
  ExpansionKey,
  FeatureKey,
  GeneratedMap,
  LayoutCell,
  SliceGeometry,
  SystemTile,
  WarpPlacement,
} from "./types";

function cellId(coord: Axial): string {
  return `cell:${coordKey(coord)}`;
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [expansions, setExpansions] = useState<Set<ExpansionKey>>(
    new Set(["base", "pok", "te"]),
  );
  const [seed, setSeed] = useState(freshSeed);
  const [cells, setCells] = useState<LayoutCell[]>([]);
  const [tool, setTool] = useState<EditorTool>("player");
  const [phase, setPhase] = useState<"design" | "generated">("design");
  const [generatedMap, setGeneratedMap] = useState<GeneratedMap | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedLayoutCellId, setSelectedLayoutCellId] = useState<
    string | null
  >(null);
  const [movingCellId, setMovingCellId] = useState<string | null>(null);
  const [warpTarget, setWarpTarget] = useState<{
    coord: Axial;
    existing?: LayoutCell;
  } | null>(null);
  const [replacementOpen, setReplacementOpen] = useState(false);
  const [failure, setFailure] = useState<EquidistantFailure | null>(null);
  const [failureGeometry, setFailureGeometry] = useState<
    SliceGeometry | undefined
  >();
  const [status, setStatus] = useState(
    "Build a layout, then generate the map.",
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const eligible = useMemo(() => eligibleTiles(expansions), [expansions]);
  const tileById = useMemo(
    () => new Map(eligible.map((tile) => [tile.id, tile])),
    [eligible],
  );
  const featureKeys = useMemo(() => availableFeatureKeys(eligible), [eligible]);
  const groups = useMemo(() => featureGroups(featureKeys), [featureKeys]);
  const sectorCells = useMemo(
    () => cells.filter((cell) => cell.kind === "sector"),
    [cells],
  );
  const homeCells = useMemo(
    () =>
      cells
        .filter((cell) => cell.kind === "home")
        .sort((a, b) => (a.player ?? 0) - (b.player ?? 0)),
    [cells],
  );
  const warpCells = useMemo(
    () => cells.filter((cell) => cell.kind === "warp"),
    [cells],
  );
  const poolSize = sectorCells.length;
  const playerCount = homeCells.length;
  const {
    selectionMode,
    setSelectionMode,
    distributionMode,
    setDistributionMode,
    balanceMode,
    setBalanceMode,
    equidistantMode,
    setEquidistantMode,
    weights,
    setWeights,
    targets,
    setTargets,
  } = useGenerationSettings(eligible, featureKeys, poolSize);
  const selectedLayoutCell =
    cells.find((cell) => cell.id === selectedLayoutCellId) ?? null;
  const selectedTileId =
    selectedSlotId && generatedMap
      ? generatedMap.placements[selectedSlotId]
      : null;
  const selectedTile = selectedTileId
    ? (tileById.get(selectedTileId) ?? null)
    : null;
  const allowedWarpLanes = useMemo(
    () => WARP_LANES.filter((lane) => expansions.has(lane.source)),
    [expansions],
  );
  const usedPhysicalIds = useMemo(
    () =>
      new Set(
        warpCells
          .map((cell) => cell.warp?.physicalId)
          .filter((value): value is string => Boolean(value)),
      ),
    [warpCells],
  );
  const sectorCapacityReached = poolSize >= eligible.length;
  const warpCapacityReached =
    usedPhysicalIds.size >=
    new Set(allowedWarpLanes.map((lane) => lane.physicalId)).size;

  const splitPreview = useMemo(() => {
    if (!homeCells.length || !sectorCells.length) return undefined;
    return constructSliceGeometry(cells, "split").geometry;
  }, [cells, homeCells.length, sectorCells.length]);
  const previewGeometry =
    failureGeometry ?? (phase === "design" ? splitPreview : undefined);
  const highlightedSlotIds = useMemo(
    () => new Set(failure?.highlightedSlotIds ?? []),
    [failure],
  );

  const clearFailure = () => {
    setFailure(null);
    setFailureGeometry(undefined);
  };

  const replaceCellAt = (coord: Axial, replacement: LayoutCell | null) => {
    setCells((current) => {
      const key = coordKey(coord);
      const next = current.filter((cell) => coordKey(cell.coord) !== key);
      if (replacement) next.push(replacement);
      return renumberPlayers(next);
    });
    setSelectedLayoutCellId(replacement?.id ?? null);
    setSelectedSlotId(null);
    clearFailure();
  };

  const removeCell = (cell: LayoutCell) => {
    setCells((current) =>
      renumberPlayers(current.filter((item) => item.id !== cell.id)),
    );
    setSelectedLayoutCellId(null);
    setMovingCellId(null);
    clearFailure();
    setStatus(
      cell.kind === "home"
        ? "Player removed. Remaining players were renumbered."
        : "Hex removed.",
    );
  };

  const beginMove = (cell: LayoutCell) => {
    setMovingCellId(cell.id);
    setSelectedLayoutCellId(cell.id);
    setStatus(
      `${cell.kind === "home" ? `P${(cell.player ?? 0) + 1}` : cell.kind === "mecatol" ? "Mecatol" : cell.kind === "warp" ? cell.warp?.laneId : "Sector"} selected. Click its new hex.`,
    );
  };

  const moveSelectedCell = (coord: Axial) => {
    const moving = cells.find((cell) => cell.id === movingCellId);
    if (!moving) {
      setMovingCellId(null);
      return;
    }
    const newId = cellId(coord);
    setCells((current) => {
      const key = coordKey(coord);
      const withoutSourceAndTarget = current.filter(
        (cell) => cell.id !== moving.id && coordKey(cell.coord) !== key,
      );
      return renumberPlayers([
        ...withoutSourceAndTarget,
        { ...moving, id: newId, coord },
      ]);
    });
    setMovingCellId(null);
    setSelectedLayoutCellId(newId);
    clearFailure();
    setStatus("Hex moved.");
  };

  const placeToolAt = (coord: Axial, existing?: LayoutCell) => {
    if (phase === "generated") {
      setStatus(
        "Choose Edit Layout before changing homes, Mecatol, sectors, or warp lanes.",
      );
      return;
    }
    if (movingCellId) {
      moveSelectedCell(coord);
      return;
    }
    if (tool === "erase") {
      if (existing) removeCell(existing);
      return;
    }
    if (tool === "player") {
      if (existing?.kind === "home") {
        beginMove(existing);
        return;
      }
      if (playerCount >= 8) {
        setStatus("The editor supports up to eight players.");
        return;
      }
      const replacement: LayoutCell = {
        id: cellId(coord),
        coord,
        kind: "home",
        player: playerCount,
      };
      replaceCellAt(coord, replacement);
      setStatus(`P${playerCount + 1} placed.`);
      return;
    }
    if (tool === "mecatol") {
      if (existing?.kind === "mecatol") {
        beginMove(existing);
        return;
      }
      setCells((current) => {
        const key = coordKey(coord);
        const next = current.filter(
          (cell) => cell.kind !== "mecatol" && coordKey(cell.coord) !== key,
        );
        next.push({ id: cellId(coord), coord, kind: "mecatol" });
        return renumberPlayers(next);
      });
      setSelectedLayoutCellId(cellId(coord));
      clearFailure();
      setStatus("Mecatol Rex placed.");
      return;
    }
    if (tool === "sector") {
      if (existing?.kind === "sector") {
        setSelectedLayoutCellId(existing.id);
        return;
      }
      if (sectorCapacityReached) {
        setStatus(
          `All ${eligible.length} eligible system tiles are already represented by Sector hexes.`,
        );
        return;
      }
      replaceCellAt(coord, { id: cellId(coord), coord, kind: "sector" });
      setStatus("Sector added.");
      return;
    }
    if (tool === "warp") {
      if (!allowedWarpLanes.length) {
        setStatus(
          "Enable Prophecy of Kings or Thunder's Edge to use warp lanes.",
        );
        return;
      }
      if (warpCapacityReached && existing?.kind !== "warp") {
        setStatus("Every available physical warp-lane tile is already in use.");
        return;
      }
      setWarpTarget({ coord, existing });
    }
  };

  const chooseWarp = (placement: WarpPlacement) => {
    if (!warpTarget) return;
    replaceCellAt(warpTarget.coord, {
      id: cellId(warpTarget.coord),
      coord: warpTarget.coord,
      kind: "warp",
      warp: placement,
    });
    setWarpTarget(null);
    setStatus(`${placement.laneId} placed at ${placement.rotation}°.`);
  };

  const toggleExpansion = (key: ExpansionKey) => {
    if (key === "base" || phase === "generated") return;
    const removing = expansions.has(key);
    if (removing) {
      const usesExpansionWarp = warpCells.some((cell) => {
        const lane = cell.warp
          ? WARP_LANE_BY_ID.get(cell.warp.laneId)
          : undefined;
        return lane?.source === key;
      });
      if (usesExpansionWarp) {
        setStatus(
          `Remove the ${key === "pok" ? "Prophecy of Kings" : "Thunder's Edge"} warp lanes before disabling that expansion.`,
        );
        return;
      }
      const next = new Set(expansions);
      next.delete(key);
      const nextEligible = eligibleTiles(next);
      if (nextEligible.length < poolSize) {
        setStatus(
          `This layout has ${poolSize} sectors, but only ${nextEligible.length} systems would remain available.`,
        );
        return;
      }
      setExpansions(next);
    } else {
      setExpansions(new Set(expansions).add(key));
    }
    clearFailure();
    setStatus("Expansion selection updated.");
  };

  const performGeneration = () => {
    if (playerCount < 3) {
      setStatus("Place at least three player home systems before generating.");
      return;
    }
    if (!poolSize) {
      setStatus("Place at least one Sector hex before generating.");
      return;
    }
    const geometryResult = constructSliceGeometry(cells, equidistantMode);
    if (geometryResult.failure) {
      setFailure(geometryResult.failure);
      setFailureGeometry(geometryResult.geometry);
      setStatus(
        "Equidistant systems cannot be included evenly in this layout.",
      );
      return;
    }
    if (!geometryResult.geometry) {
      setStatus("Could not calculate slices for this layout.");
      return;
    }

    setIsGenerating(true);
    setSelectedSlotId(null);
    setReplacementOpen(false);
    setStatus("Selecting the tile pool and optimizing complete slices…");
    clearFailure();
    window.setTimeout(() => {
      try {
        const rng = createRng(seed);
        const selection = selectTilePool(
          eligible,
          targets,
          selectionMode,
          poolSize,
          playerCount,
          weights,
          rng,
        );
        const distribution = distributeTiles(
          selection.tiles,
          distributionMode,
          balanceMode,
          geometryResult.geometry!,
          weights,
          rng,
        );
        const next: GeneratedMap = {
          placements: distribution.placements,
          selectedTileIds: selection.tiles.map((tile) => tile.id),
          geometry: geometryResult.geometry!,
          analysis: distribution.analysis,
          targetCounts: selection.targetCounts,
          unmetTargets: selection.unmetTargets.map((message) => {
            const [rawKey, rest] = message.split(":");
            return `${featureLabel(rawKey as FeatureKey)}:${rest ?? ""}`;
          }),
          seed,
          generatedAt: new Date().toISOString(),
          manualOverride: false,
        };
        setGeneratedMap(next);
        setPhase("generated");
        setSelectedLayoutCellId(null);
        setStatus(
          selection.unmetTargets.length
            ? "Generated the nearest available composition."
            : "Map generated.",
        );
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Generation failed.",
        );
      } finally {
        setIsGenerating(false);
      }
    }, 30);
  };

  const recalculateMap = (
    map: GeneratedMap,
    placements: Record<string, string>,
    selectedTileIds: string[],
    manualOverride: boolean,
  ): GeneratedMap => {
    const selectedTiles = selectedTileIds
      .map((id) => tileById.get(id))
      .filter((tile): tile is SystemTile => Boolean(tile));
    return {
      ...map,
      placements,
      selectedTileIds,
      targetCounts: poolFeatureCounts(selectedTiles),
      unmetTargets: compositionDifferences(selectedTiles, targets),
      analysis: analyzeCustomMap(
        placements,
        tileById,
        map.geometry,
        weights,
        balanceMode,
      ),
      manualOverride,
    };
  };

  const swapGenerated = (fromSlotId: string, toSlotId: string) => {
    if (!generatedMap) return;
    const from = generatedMap.placements[fromSlotId];
    const to = generatedMap.placements[toSlotId];
    if (!from || !to) return;
    const placements = {
      ...generatedMap.placements,
      [fromSlotId]: to,
      [toSlotId]: from,
    };
    setGeneratedMap(
      recalculateMap(
        generatedMap,
        placements,
        generatedMap.selectedTileIds,
        generatedMap.manualOverride,
      ),
    );
    setSelectedSlotId(toSlotId);
    setStatus("Systems swapped. Slice analysis recalculated.");
  };

  const replaceGenerated = (tile: SystemTile) => {
    if (!generatedMap || !selectedSlotId || !selectedTileId) return;
    const placements = {
      ...generatedMap.placements,
      [selectedSlotId]: tile.id,
    };
    const selectedTileIds = generatedMap.selectedTileIds.map((id) =>
      id === selectedTileId ? tile.id : id,
    );
    setGeneratedMap(
      recalculateMap(generatedMap, placements, selectedTileIds, true),
    );
    setReplacementOpen(false);
    setStatus(
      `Tile ${selectedTileId} replaced with tile ${tile.id}. Slice analysis recalculated.`,
    );
  };

  const unusedTiles = useMemo(() => {
    if (!generatedMap) return [];
    const used = new Set(generatedMap.selectedTileIds);
    return eligible.filter((tile) => !used.has(tile.id));
  }, [eligible, generatedMap]);

  const editLayout = () => {
    if (
      !window.confirm(
        "Return to layout editing? The generated systems and manual swaps will be discarded.",
      )
    )
      return;
    setPhase("design");
    setGeneratedMap(null);
    setSelectedSlotId(null);
    setReplacementOpen(false);
    clearFailure();
    setStatus("Layout unlocked. Generate again when finished.");
  };

  const resetLayout = () => {
    if (
      cells.length &&
      !window.confirm("Clear the entire layout and generated map?")
    )
      return;
    setCells([]);
    setGeneratedMap(null);
    setPhase("design");
    setSelectedSlotId(null);
    setSelectedLayoutCellId(null);
    setMovingCellId(null);
    setReplacementOpen(false);
    clearFailure();
    setStatus("Layout cleared.");
  };

  const canGenerate = playerCount >= 3 && poolSize > 0 && !isGenerating;
  const selectedWarpInitial =
    warpTarget?.existing?.kind === "warp"
      ? warpTarget.existing.warp
      : undefined;
  const activeToolDisabled =
    phase === "generated" || (tool === "warp" && !allowedWarpLanes.length);

  return (
    <div className="app-shell">
      <Topbar
        seed={seed}
        phase={phase}
        canGenerate={canGenerate}
        isGenerating={isGenerating}
        generatedMap={generatedMap}
        setSeed={setSeed}
        editLayout={editLayout}
        resetLayout={resetLayout}
        performGeneration={performGeneration}
      />

      <ToolRibbon
        tool={tool}
        phase={phase}
        playerCount={playerCount}
        poolSize={poolSize}
        eligibleTileCount={eligible.length}
        usedWarpLaneCount={usedPhysicalIds.size}
        availableWarpLaneCount={
          new Set(allowedWarpLanes.map((lane) => lane.physicalId)).size
        }
        hasWarpLanes={allowedWarpLanes.length > 0}
        isGenerating={isGenerating}
        isMoving={Boolean(movingCellId)}
        status={status}
        onSelectTool={(nextTool, help) => {
          setTool(nextTool);
          setMovingCellId(null);
          setSelectedLayoutCellId(null);
          setStatus(help);
        }}
      />

      <main className="workspace freeform-workspace">
        <aside className="control-panel">
          <LayoutSummary
            playerCount={playerCount}
            sectorCount={poolSize}
            warpLaneCount={warpCells.length}
            equidistantCount={splitPreview?.equidistantSlotIds.length ?? 0}
          />
          <TileLibrary
            expansions={expansions}
            isLocked={phase === "generated"}
            onToggle={toggleExpansion}
          />

          <GenerationSettings
            selectionMode={selectionMode}
            onSelectionModeChange={setSelectionMode}
            distributionMode={distributionMode}
            onDistributionModeChange={setDistributionMode}
            balanceMode={balanceMode}
            onBalanceModeChange={setBalanceMode}
            equidistantMode={equidistantMode}
            onEquidistantModeChange={setEquidistantMode}
          />

          <CompositionPanel
            eligibleTiles={eligible}
            poolSize={poolSize}
            groups={groups}
            targets={targets}
            onTargetsChange={setTargets}
            onChanged={() =>
              setStatus(
                "Composition changed. Generate or regenerate to apply it.",
              )
            }
          />

          <BalancePriorities weights={weights} onChange={setWeights} />

          {generatedMap && (
            <section className="panel-section export-section">
              <h2>Map Data</h2>
              <button
                type="button"
                className="secondary-button full-button"
                onClick={() =>
                  downloadJson(`ti4-map-${generatedMap.seed}.json`, {
                    version: 1,
                    expansions: [...expansions],
                    settings: {
                      selectionMode,
                      distributionMode,
                      balanceMode,
                      equidistantMode,
                      weights,
                      targets,
                    },
                    cells,
                    map: generatedMap,
                  })
                }
              >
                Export map JSON
              </button>
              <button
                type="button"
                className="text-button full-button"
                onClick={() =>
                  navigator.clipboard.writeText(
                    JSON.stringify({
                      cells,
                      placements: generatedMap.placements,
                    }),
                  )
                }
              >
                Copy layout + placements
              </button>
              {generatedMap.unmetTargets.length > 0 && (
                <div className="target-warning">
                  <strong>Composition differences</strong>
                  {generatedMap.unmetTargets.map((message) => (
                    <span key={message}>{message}</span>
                  ))}
                </div>
              )}
            </section>
          )}
        </aside>

        <MapWorkspace
          cells={cells}
          generatedMap={generatedMap}
          previewGeometry={previewGeometry}
          tileById={tileById}
          tool={tool}
          selectedSlotId={selectedSlotId ?? selectedLayoutCellId}
          selectedLayoutCell={selectedLayoutCell}
          highlightedSlotIds={highlightedSlotIds}
          playerColors={PLAYER_COLORS}
          useThunderEdgeMecatol={expansions.has("te")}
          phase={phase}
          selectedTile={selectedTile}
          onCellClick={placeToolAt}
          onSelectGenerated={(slotId) => {
            setSelectedSlotId(slotId);
            setSelectedLayoutCellId(null);
          }}
          onSwapGenerated={swapGenerated}
          onCloseLayoutInspector={() => setSelectedLayoutCellId(null)}
          onMoveLayoutCell={beginMove}
          onEditWarpLane={(cell) =>
            setWarpTarget({ coord: cell.coord, existing: cell })
          }
          onRemoveLayoutCell={removeCell}
          onCloseTileInspector={() => {
            setSelectedSlotId(null);
            setReplacementOpen(false);
          }}
          onRequestReplacement={() => setReplacementOpen(true)}
        />
      </main>

      {warpTarget && (
        <WarpLanePicker
          lanes={allowedWarpLanes}
          usedPhysicalIds={usedPhysicalIds}
          initial={selectedWarpInitial}
          onChoose={chooseWarp}
          onCancel={() => setWarpTarget(null)}
        />
      )}

      {replacementOpen && selectedTile && (
        <SystemReplacementPicker
          tiles={unusedTiles}
          currentTile={selectedTile}
          onChoose={replaceGenerated}
          onCancel={() => setReplacementOpen(false)}
        />
      )}

      {failure && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal-card failure-modal"
            role="dialog"
            aria-modal="true"
          >
            <span className="eyebrow">Equidistant assignment failed</span>
            <h2>These equidistants cannot be included evenly</h2>
            <p>{failure.message}</p>
            <div className="failure-facts">
              <span>
                <b>{failure.equidistantCount}</b> equidistant systems
              </span>
              <span>
                <b>{failure.playerCount}</b> players
              </span>
              <span>
                <b>{failure.requiredPerPlayer ?? "—"}</b> required per player
              </span>
            </div>
            {failure.conflictingPlayers.length > 0 && (
              <p>
                Conflicting homes:{" "}
                {failure.conflictingPlayers
                  .map((player) => `P${player + 1}`)
                  .join(", ")}
                . Their slice outlines and involved systems are highlighted
                behind this dialog.
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setFailure(null)}
              >
                Close and inspect highlights
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setEquidistantMode("split");
                  setFailure(null);
                  setFailureGeometry(undefined);
                  setStatus("Equidistants changed to Split. Generate again.");
                }}
              >
                Use Split Equidistants
              </button>
            </div>
          </section>
        </div>
      )}

      {activeToolDisabled && phase === "design" && (
        <span className="sr-only">
          The selected tool has reached its available component limit.
        </span>
      )}
    </div>
  );
}

export default App;
