import { TOOL_OPTIONS } from "../lib/mapSettings";
import type { EditorTool } from "../types";

type ToolRibbonProps = {
  tool: EditorTool;
  phase: "design" | "generated";
  playerCount: number;
  poolSize: number;
  eligibleTileCount: number;
  usedWarpLaneCount: number;
  availableWarpLaneCount: number;
  hasWarpLanes: boolean;
  isGenerating: boolean;
  isMoving: boolean;
  status: string;
  onSelectTool: (tool: EditorTool, help: string) => void;
};

export function ToolRibbon({
  tool,
  phase,
  playerCount,
  poolSize,
  eligibleTileCount,
  usedWarpLaneCount,
  availableWarpLaneCount,
  hasWarpLanes,
  isGenerating,
  isMoving,
  status,
  onSelectTool,
}: ToolRibbonProps) {
  return (
    <nav className="tool-ribbon" aria-label="Map placement tools">
      {TOOL_OPTIONS.map((option) => {
        const disabled =
          phase === "generated" || (option.value === "warp" && !hasWarpLanes);
        return (
          <button
            type="button"
            key={option.value}
            className={tool === option.value ? "active" : ""}
            disabled={disabled}
            onClick={() => onSelectTool(option.value, option.help)}
            title={option.help}
          >
            <span>{option.label}</span>
            {option.value === "player" && <b>{playerCount}/8</b>}
            {option.value === "sector" && (
              <b>
                {poolSize}/{eligibleTileCount}
              </b>
            )}
            {option.value === "warp" && (
              <b>
                {usedWarpLaneCount}/{availableWarpLaneCount}
              </b>
            )}
          </button>
        );
      })}
      <div className="tool-status">
        <i className={isGenerating ? "pulse" : ""} />
        <span>
          {isMoving ? "Move mode: click the destination hex." : status}
        </span>
      </div>
    </nav>
  );
}
