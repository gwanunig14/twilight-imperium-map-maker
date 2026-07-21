import { useMemo, useRef, useState } from "react";
import type {
  EditorTool,
  GeneratedMap,
  LayoutCell,
  SliceAssignment,
  SliceGeometry,
  SystemTile,
} from "../types";
import { coordKey } from "../lib/freeform";
import { WARP_LANE_BY_ID, rotatedPaths } from "../lib/hyperlanes";
import { tileImageUrl } from "../lib/tiles";

const SIZE = 43;
const SQRT3 = Math.sqrt(3);
const BASE_WIDTH = 1480;
const BASE_HEIGHT = 920;
const HEX_HEIGHT = SIZE * SQRT3;
const HEX_HALF_HEIGHT = HEX_HEIGHT / 2;
const PLAYER_COLORS = [
  "#1d4fb2",
  "#c0131c",
  "#ecc31c",
  "#26724a",
  "#5e2b6f",
  "#ed7609",
  "#d543ae",
  "#343038",
];

function toPixel(q: number, r: number) {
  return {
    x: SIZE * 1.5 * q,
    y: SIZE * SQRT3 * (r + q / 2),
  };
}

function roundAxial(x: number, y: number) {
  const q = (2 / 3) * (x / SIZE);
  const r = ((-1 / 3) * x + (SQRT3 / 3) * y) / SIZE;
  const cubeX = q;
  const cubeZ = r;
  const cubeY = -cubeX - cubeZ;
  let rx = Math.round(cubeX);
  let ry = Math.round(cubeY);
  let rz = Math.round(cubeZ);
  const xDiff = Math.abs(rx - cubeX);
  const yDiff = Math.abs(ry - cubeY);
  const zDiff = Math.abs(rz - cubeZ);

  if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
  else if (yDiff > zDiff) ry = -rx - rz;
  else rz = -rx - ry;

  return { q: rx, r: rz };
}

function visibleGrid(
  center: { x: number; y: number },
  width: number,
  height: number,
) {
  const margin = SIZE * 2;
  const minX = center.x - width / 2 - margin;
  const maxX = center.x + width / 2 + margin;
  const minY = center.y - height / 2 - margin;
  const maxY = center.y + height / 2 + margin;
  const qMin = Math.floor((2 / 3) * (minX / SIZE)) - 2;
  const qMax = Math.ceil((2 / 3) * (maxX / SIZE)) + 2;
  const coords: { q: number; r: number }[] = [];

  for (let q = qMin; q <= qMax; q += 1) {
    const rMin = Math.floor(minY / (SIZE * SQRT3) - q / 2) - 2;
    const rMax = Math.ceil(maxY / (SIZE * SQRT3) - q / 2) + 2;
    for (let r = rMin; r <= rMax; r += 1) {
      coords.push({ q, r });
    }
  }

  return coords;
}

function hexPoints(radius = SIZE) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (60 * index * Math.PI) / 180;
    return `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`;
  }).join(" ");
}

const HEX_POINTS = hexPoints();
const INNER_HEX_POINTS = hexPoints(SIZE - 4);

function edgePoint(edge: number) {
  // Edge numbering follows tileData: top, upper-right, lower-right,
  // bottom, lower-left, upper-left.
  const angle = ((-90 + 60 * edge) * Math.PI) / 180;
  return {
    x: Math.cos(angle) * HEX_HALF_HEIGHT,
    y: Math.sin(angle) * HEX_HALF_HEIGHT,
  };
}

function assignmentColors(
  assignment: SliceAssignment | undefined,
  colors: string[],
) {
  if (!assignment || !assignment.reachable) return ["#817968"];

  if (assignment.assignedPlayer !== undefined) {
    return [
      colors[assignment.assignedPlayer] ??
        PLAYER_COLORS[assignment.assignedPlayer],
    ];
  }

  return assignment.nearestPlayers.map(
    (player) => colors[player] ?? PLAYER_COLORS[player],
  );
}

function displayLabel(
  cell: LayoutCell,
  assignment: SliceAssignment | undefined,
) {
  if (cell.kind === "home") return `P${(cell.player ?? 0) + 1}`;
  if (cell.kind === "mecatol") return "MECATOL";
  if (cell.kind === "warp") return cell.warp?.laneId ?? "WARP";
  if (assignment?.reachable === false) return "UNASSIGNED";

  if (assignment?.equidistant) {
    if (assignment.assignedPlayer !== undefined) {
      return `ED → P${assignment.assignedPlayer + 1}`;
    }

    return `ED ${assignment.nearestPlayers
      .map((player) => `P${player + 1}`)
      .join("/")}`;
  }

  if (assignment?.assignedPlayer !== undefined) {
    return `P${assignment.assignedPlayer + 1}`;
  }

  return "SECTOR";
}

function chipWidth(text: string, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, 13 + text.length * 4.7));
}

function WarpSvg({ cell }: { cell: LayoutCell }) {
  if (!cell.warp) return null;
  const lane = WARP_LANE_BY_ID.get(cell.warp.laneId);
  if (!lane) return null;

  if (lane.imageUrl) {
    return (
      <image
        href={lane.imageUrl}
        x={-SIZE}
        y={-HEX_HALF_HEIGHT}
        width={SIZE * 2}
        height={HEX_HEIGHT}
        transform={`rotate(${cell.warp.rotation})`}
      />
    );
  }

  return (
    <g>
      <polygon
        points={HEX_POINTS}
        fill="#091116"
        stroke="#376f72"
        strokeWidth="2"
      />
      {rotatedPaths(lane, cell.warp.rotation).map(([a, b], index) => {
        const ap = edgePoint(a);
        const bp = edgePoint(b);

        return (
          <g key={`${a}-${b}-${index}`}>
            <path
              d={`M ${ap.x} ${ap.y} Q 0 0 ${bp.x} ${bp.y}`}
              fill="none"
              stroke="#3ca8a6"
              strokeWidth="6"
              opacity=".45"
            />
            <path
              d={`M ${ap.x} ${ap.y} Q 0 0 ${bp.x} ${bp.y}`}
              fill="none"
              stroke="#d8fff4"
              strokeWidth="1.8"
            />
          </g>
        );
      })}
    </g>
  );
}

export function FreeformBoard({
  cells,
  generatedMap,
  previewGeometry,
  tileById,
  tool,
  selectedSlotId,
  highlightedSlotIds,
  playerColors = PLAYER_COLORS,
  useThunderEdgeMecatol,
  phase,
  onCellClick,
  onSelectGenerated,
  onSwapGenerated,
}: {
  cells: LayoutCell[];
  generatedMap: GeneratedMap | null;
  previewGeometry?: SliceGeometry;
  tileById: Map<string, SystemTile>;
  tool: EditorTool;
  selectedSlotId: string | null;
  highlightedSlotIds: Set<string>;
  playerColors?: string[];
  useThunderEdgeMecatol: boolean;
  phase: "design" | "generated";
  onCellClick: (coord: { q: number; r: number }, cell?: LayoutCell) => void;
  onSelectGenerated: (slotId: string) => void;
  onSwapGenerated: (fromSlotId: string, toSlotId: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState(0.95);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const panRef = useRef<null | {
    x: number;
    y: number;
    centerX: number;
    centerY: number;
  }>(null);
  const dragRef = useRef<null | {
    slotId: string;
    x: number;
    y: number;
    moved: boolean;
  }>(null);
  const suppressClick = useRef(false);

  const byCoord = useMemo(
    () => new Map(cells.map((cell) => [coordKey(cell.coord), cell])),
    [cells],
  );

  const width = BASE_WIDTH / zoom;
  const height = BASE_HEIGHT / zoom;

  const visibleCoords = useMemo(
    () => visibleGrid(center, width, height),
    [center, width, height],
  );

  const geometry = generatedMap?.geometry ?? previewGeometry;
  const mecatolId = useThunderEdgeMecatol ? "112" : "18";

  const renderedCells = cells.map((cell) => {
    const point = toPixel(cell.coord.q, cell.coord.r);
    const assignment = geometry?.assignments[cell.id];
    const colors = assignmentColors(assignment, playerColors);
    const selected = selectedSlotId === cell.id;
    const highlighted = highlightedSlotIds.has(cell.id);
    const tileId =
      cell.kind === "sector" ? generatedMap?.placements[cell.id] : undefined;
    const tile = tileId ? tileById.get(tileId) : undefined;
    const label = displayLabel(cell, assignment);

    return {
      cell,
      point,
      assignment,
      colors,
      selected,
      highlighted,
      tileId,
      tile,
      label,
    };
  });

  const clientToSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svg.getScreenCTM();

    return matrix ? point.matrixTransform(matrix.inverse()) : { x: 0, y: 0 };
  };

  const fitLayout = () => {
    if (!cells.length) {
      setCenter({ x: 0, y: 0 });
      setZoom(0.95);
      return;
    }

    const points = cells.map((cell) => toPixel(cell.coord.q, cell.coord.r));
    const minX = Math.min(...points.map((point) => point.x)) - SIZE * 1.7;
    const maxX = Math.max(...points.map((point) => point.x)) + SIZE * 1.7;
    const minY = Math.min(...points.map((point) => point.y)) - SIZE * 1.7;
    const maxY = Math.max(...points.map((point) => point.y)) + SIZE * 1.7;

    setCenter({
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    });

    const requiredWidth = Math.max(maxX - minX, 1);
    const requiredHeight = Math.max(maxY - minY, 1);

    setZoom(
      Math.min(
        1.35,
        Math.max(
          0.42,
          Math.min(BASE_WIDTH / requiredWidth, BASE_HEIGHT / requiredHeight) *
            0.9,
        ),
      ),
    );
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button === 1 || event.button === 2 || event.shiftKey) {
      event.currentTarget.setPointerCapture(event.pointerId);
      panRef.current = {
        x: event.clientX,
        y: event.clientY,
        centerX: center.x,
        centerY: center.y,
      };
    }
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (panRef.current) {
      const dx =
        ((event.clientX - panRef.current.x) / event.currentTarget.clientWidth) *
        width;
      const dy =
        ((event.clientY - panRef.current.y) /
          event.currentTarget.clientHeight) *
        height;

      setCenter({
        x: panRef.current.centerX - dx,
        y: panRef.current.centerY - dy,
      });
      return;
    }

    if (dragRef.current) {
      const distance = Math.hypot(
        event.clientX - dragRef.current.x,
        event.clientY - dragRef.current.y,
      );
      if (distance > 6) dragRef.current.moved = true;
    }
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (panRef.current) {
      panRef.current = null;
      return;
    }

    if (!dragRef.current) return;

    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag.moved) return;

    const point = clientToSvg(event.clientX, event.clientY);
    const coord = roundAxial(point.x, point.y);
    const target = byCoord.get(coordKey(coord));

    if (target?.kind === "sector" && target.id !== drag.slotId) {
      onSwapGenerated(drag.slotId, target.id);
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }
  };

  return (
    <div className="freeform-map-shell">
      <svg
        ref={svgRef}
        className={`freeform-map tool-${tool}`}
        viewBox={`${center.x - width / 2} ${center.y - height / 2} ${width} ${height}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          panRef.current = null;
          dragRef.current = null;
        }}
        onContextMenu={(event) => event.preventDefault()}
        onWheel={(event) => {
          event.preventDefault();
          setZoom((value) =>
            Math.min(
              1.75,
              Math.max(0.42, value * (event.deltaY > 0 ? 0.9 : 1.1)),
            ),
          );
        }}
      >
        <defs>
          <filter id="cell-shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity=".55" />
          </filter>
          <clipPath id="tile-hex-clip" clipPathUnits="userSpaceOnUse">
            <polygon points={HEX_POINTS} />
          </clipPath>
        </defs>

        <rect
          x={center.x - width / 2}
          y={center.y - height / 2}
          width={width}
          height={height}
          fill="transparent"
        />

        {/* Blank construction grid. */}
        <g className="blank-grid-layer">
          {visibleCoords.map((coord) => {
            const key = coordKey(coord);
            if (byCoord.has(key)) return null;

            const point = toPixel(coord.q, coord.r);
            return (
              <polygon
                key={key}
                className="blank-grid-hex"
                points={HEX_POINTS}
                transform={`translate(${point.x} ${point.y})`}
                onClick={() => onCellClick(coord)}
              />
            );
          })}
        </g>

        {/*
          Artwork is intentionally rendered before every outline and label.
          This prevents a later neighboring tile from painting over an earlier
          tile's border, slice label, or system-number chip.
        */}
        <g className="map-artwork-layer">
          {renderedCells.map(({ cell, point, tileId }) => (
            <g
              key={`art-${cell.id}`}
              transform={`translate(${point.x} ${point.y})`}
              filter="url(#cell-shadow)"
            >
              <polygon
                points={HEX_POINTS}
                fill={
                  cell.kind === "home"
                    ? playerColors[cell.player ?? 0]
                    : "#0c0f16"
                }
              />

              <g clipPath="url(#tile-hex-clip)">
                {cell.kind === "sector" && tileId && (
                  <image
                    href={tileImageUrl(tileId)}
                    x={-SIZE}
                    y={-HEX_HALF_HEIGHT}
                    width={SIZE * 2}
                    height={HEX_HEIGHT}
                  />
                )}

                {cell.kind === "mecatol" && (
                  <image
                    href={tileImageUrl(mecatolId)}
                    x={-SIZE}
                    y={-HEX_HALF_HEIGHT}
                    width={SIZE * 2}
                    height={HEX_HEIGHT}
                  />
                )}

                {cell.kind === "warp" && <WarpSvg cell={cell} />}
              </g>
            </g>
          ))}
        </g>

        {/* All slice borders are above all tile artwork. */}
        <g className="map-outline-layer">
          {renderedCells.map(
            ({ cell, point, colors, selected, highlighted }) => (
              <g
                key={`outline-${cell.id}`}
                transform={`translate(${point.x} ${point.y})`}
                className={`active-map-cell kind-${cell.kind} ${
                  selected ? "selected" : ""
                } ${highlighted ? "conflict-highlight" : ""}`}
                pointerEvents="none"
              >
                <polygon
                  points={HEX_POINTS}
                  fill="none"
                  stroke={highlighted ? "#ff5461" : (colors[0] ?? "#817968")}
                  strokeWidth={highlighted ? 7 : selected ? 6 : 4}
                />

                {colors.length > 1 && (
                  <polygon
                    points={INNER_HEX_POINTS}
                    fill="none"
                    stroke={colors[1]}
                    strokeWidth="3"
                    strokeDasharray="8 5"
                  />
                )}
              </g>
            ),
          )}
        </g>

        {/* Labels are the final visible layer, so neighboring art cannot hide them. */}
        <g className="map-label-layer" pointerEvents="none">
          {renderedCells.map(
            ({ cell, point, assignment, tileId, tile, label }) => {
              const bottomText = tile?.id ?? label;
              const bottomWidth = chipWidth(bottomText, 34, 54);
              const sliceWidth = chipWidth(label, 38, 56);

              return (
                <g
                  key={`label-${cell.id}`}
                  transform={`translate(${point.x} ${point.y})`}
                >
                  {cell.kind === "sector" && !tileId && (
                    <g className="sector-placeholder">
                      <circle r="16" fill="#272117" />
                      <text textAnchor="middle" dy="4">
                        +
                      </text>
                    </g>
                  )}

                  {cell.kind === "home" && (
                    <g className="home-label">
                      <text textAnchor="middle" dy="-2">
                        P{(cell.player ?? 0) + 1}
                      </text>
                      <text
                        textAnchor="middle"
                        dy="14"
                        className="small-map-text"
                      >
                        HOME
                      </text>
                    </g>
                  )}

                  {cell.kind !== "home" && (
                    <g
                      className="map-chip"
                      transform={`translate(0 ${HEX_HALF_HEIGHT - 9})`}
                    >
                      <rect
                        x={-bottomWidth / 2}
                        y="-7"
                        width={bottomWidth}
                        height="14"
                        rx="7"
                      />
                      <text textAnchor="middle" dy="2.5">
                        {bottomText}
                      </text>
                    </g>
                  )}

                  {cell.kind === "sector" && tileId && assignment && (
                    <g
                      className="slice-chip"
                      transform={`translate(0 ${-HEX_HALF_HEIGHT + 9})`}
                    >
                      <rect
                        x={-sliceWidth / 2}
                        y="-7"
                        width={sliceWidth}
                        height="14"
                        rx="7"
                      />
                      <text textAnchor="middle" dy="2.5">
                        {label}
                      </text>
                    </g>
                  )}
                </g>
              );
            },
          )}
        </g>

        {/* Transparent hit targets stay on top without covering any visuals. */}
        <g className="map-interaction-layer">
          {renderedCells.map(({ cell, point, tileId }) => (
            <g
              key={`hit-${cell.id}`}
              transform={`translate(${point.x} ${point.y})`}
              className={`active-map-cell kind-${cell.kind}`}
              onClick={() => {
                if (suppressClick.current) return;

                if (phase === "generated" && cell.kind === "sector" && tileId) {
                  onSelectGenerated(cell.id);
                } else {
                  onCellClick(cell.coord, cell);
                }
              }}
              onPointerDown={(event) => {
                if (
                  phase === "generated" &&
                  cell.kind === "sector" &&
                  tileId &&
                  event.button === 0
                ) {
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragRef.current = {
                    slotId: cell.id,
                    x: event.clientX,
                    y: event.clientY,
                    moved: false,
                  };
                }
              }}
            >
              <polygon
                points={HEX_POINTS}
                fill="transparent"
                stroke="none"
                pointerEvents="all"
              />
            </g>
          ))}
        </g>
      </svg>

      <div className="map-view-controls">
        <button
          type="button"
          onClick={() => setZoom((value) => Math.min(1.75, value + 0.12))}
        >
          +
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => setZoom((value) => Math.max(0.42, value - 0.12))}
        >
          −
        </button>
        <button type="button" onClick={fitLayout}>
          Fit layout
        </button>
      </div>

      <div className="map-canvas-hint">
        {phase === "generated"
          ? "Click for details · Drag one generated system onto another to swap · Shift-drag to pan"
          : "Click to place · Shift-drag or middle-drag to pan · Scroll to zoom"}
      </div>
    </div>
  );
}
