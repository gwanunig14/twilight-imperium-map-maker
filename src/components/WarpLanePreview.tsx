import type { WarpLaneDefinition } from "../types";
import { rotatedPaths } from "../lib/hyperlanes";

// Same clockwise edge order used by tileData and the board graph:
// top, upper-right, lower-right, bottom, lower-left, upper-left.
const EDGE_POINTS: [number, number][] = [
  [50, 6],
  [87.5, 28],
  [87.5, 72],
  [50, 94],
  [12.5, 72],
  [12.5, 28],
];

const HEX = "25,6 75,6 100,50 75,94 25,94 0,50";

export function WarpLanePreview({
  lane,
  rotation = 0,
  className = "",
  showLabel = true,
}: {
  lane: WarpLaneDefinition;
  rotation?: number;
  className?: string;
  showLabel?: boolean;
}) {
  if (lane.imageUrl) {
    return (
      <div className={`warp-preview image-preview ${className}`}>
        <img
          src={lane.imageUrl}
          alt={`Warp lane ${lane.id}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        {showLabel && <span>{lane.id}</span>}
      </div>
    );
  }

  return (
    <div className={`warp-preview ${className}`}>
      <svg viewBox="0 0 100 100" aria-label={`Warp lane ${lane.id}`}>
        <defs>
          <radialGradient id={`space-${lane.id}`} cx="45%" cy="45%" r="70%">
            <stop offset="0" stopColor="#146b6e" />
            <stop offset="0.42" stopColor="#0b3044" />
            <stop offset="1" stopColor="#050b18" />
          </radialGradient>
          <filter id={`glow-${lane.id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id={`clip-${lane.id}`}><polygon points={HEX}/></clipPath>
        </defs>
        <polygon points={HEX} fill={`url(#space-${lane.id})`} stroke="#344d68" strokeWidth="2" />
        <g clipPath={`url(#clip-${lane.id})`} filter={`url(#glow-${lane.id})`}>
          {rotatedPaths(lane, rotation).map(([a, b], index) => {
            const [ax, ay] = EDGE_POINTS[a];
            const [bx, by] = EDGE_POINTS[b];
            return (
              <g key={`${a}-${b}-${index}`}>
                <path d={`M ${ax} ${ay} Q 50 50 ${bx} ${by}`} fill="none" stroke="#5be4ff" strokeWidth="5" opacity="0.42" />
                <path d={`M ${ax} ${ay} Q 50 50 ${bx} ${by}`} fill="none" stroke="#b8f7ff" strokeWidth="1.6" />
              </g>
            );
          })}
        </g>
      </svg>
      {showLabel && <span>{lane.id}</span>}
    </div>
  );
}
