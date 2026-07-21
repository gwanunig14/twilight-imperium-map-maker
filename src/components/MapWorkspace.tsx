import { BalanceTable } from "./BalanceTable";
import { FreeformBoard } from "./FreeformBoard";
import { TileInspector } from "./TileInspector";
import type {
  EditorTool,
  GeneratedMap,
  LayoutCell,
  SliceGeometry,
  SystemTile,
} from "../types";

type MapWorkspaceProps = {
  cells: LayoutCell[];
  generatedMap: GeneratedMap | null;
  previewGeometry?: SliceGeometry;
  tileById: Map<string, SystemTile>;
  tool: EditorTool;
  selectedSlotId: string | null;
  selectedLayoutCell: LayoutCell | null;
  highlightedSlotIds: Set<string>;
  playerColors: string[];
  useThunderEdgeMecatol: boolean;
  phase: "design" | "generated";
  selectedTile: SystemTile | null;
  onCellClick: (coord: { q: number; r: number }, existing?: LayoutCell) => void;
  onSelectGenerated: (slotId: string) => void;
  onSwapGenerated: (fromSlotId: string, toSlotId: string) => void;
  onCloseLayoutInspector: () => void;
  onMoveLayoutCell: (cell: LayoutCell) => void;
  onEditWarpLane: (cell: LayoutCell) => void;
  onRemoveLayoutCell: (cell: LayoutCell) => void;
  onCloseTileInspector: () => void;
  onRequestReplacement: () => void;
};

export function MapWorkspace({
  cells,
  generatedMap,
  previewGeometry,
  tileById,
  tool,
  selectedSlotId,
  selectedLayoutCell,
  highlightedSlotIds,
  playerColors,
  useThunderEdgeMecatol,
  phase,
  selectedTile,
  onCellClick,
  onSelectGenerated,
  onSwapGenerated,
  onCloseLayoutInspector,
  onMoveLayoutCell,
  onEditWarpLane,
  onRemoveLayoutCell,
  onCloseTileInspector,
  onRequestReplacement,
}: MapWorkspaceProps) {
  return (
    <section className="map-and-analysis">
      <div className="board-stage">
        <FreeformBoard
          cells={cells}
          generatedMap={generatedMap}
          previewGeometry={previewGeometry}
          tileById={tileById}
          tool={tool}
          selectedSlotId={selectedSlotId}
          highlightedSlotIds={highlightedSlotIds}
          playerColors={playerColors}
          useThunderEdgeMecatol={useThunderEdgeMecatol}
          phase={phase}
          onCellClick={onCellClick}
          onSelectGenerated={onSelectGenerated}
          onSwapGenerated={onSwapGenerated}
        />

        {phase === "design" && selectedLayoutCell && (
          <aside className="layout-cell-inspector">
            <button
              type="button"
              className="icon-button close-button"
              onClick={onCloseLayoutInspector}
            >
              ×
            </button>
            <span className="eyebrow">Layout hex</span>
            <h3>
              {selectedLayoutCell.kind === "home"
                ? `P${(selectedLayoutCell.player ?? 0) + 1} Home`
                : selectedLayoutCell.kind === "mecatol"
                  ? "Mecatol Rex"
                  : selectedLayoutCell.kind === "warp"
                    ? `Warp Lane ${selectedLayoutCell.warp?.laneId}`
                    : "Sector"}
            </h3>
            {selectedLayoutCell.kind === "warp" && (
              <p>Rotation: {selectedLayoutCell.warp?.rotation ?? 0}°</p>
            )}
            <div className="inspector-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => onMoveLayoutCell(selectedLayoutCell)}
              >
                Move
              </button>
              {selectedLayoutCell.kind === "warp" && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onEditWarpLane(selectedLayoutCell)}
                >
                  Edit lane
                </button>
              )}
              <button
                type="button"
                className="danger-button"
                onClick={() => onRemoveLayoutCell(selectedLayoutCell)}
              >
                Remove
              </button>
            </div>
          </aside>
        )}

        <TileInspector
          tile={selectedTile}
          onClose={onCloseTileInspector}
          onRequestReplacement={selectedTile ? onRequestReplacement : undefined}
        />
      </div>
      <div className="analysis-region">
        <BalanceTable map={generatedMap} />
      </div>
    </section>
  );
}
