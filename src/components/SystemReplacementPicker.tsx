import { useMemo, useState } from "react";
import type { SystemTile } from "../types";
import { tileImageUrl } from "../lib/tiles";

function tileName(tile: SystemTile): string {
  return tile.planets.map((planet) => planet.name).join(" / ") || "Empty System";
}

export function SystemReplacementPicker({
  tiles,
  currentTile,
  onChoose,
  onCancel,
}: {
  tiles: SystemTile[];
  currentTile: SystemTile;
  onChoose: (tile: SystemTile) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tiles;
    return tiles.filter((tile) =>
      `${tile.id} ${tileName(tile)} ${tile.anomalies.join(" ")} ${tile.wormholes.join(" ")}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, tiles]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="modal-card replacement-picker" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">Replacing tile {currentTile.id}</span>
            <h2>Select an unused system</h2>
          </div>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Close">×</button>
        </div>
        <p className="modal-help">Manual replacement may move the final map away from the composition targets. Slice scores update immediately.</p>
        <input
          className="search-field"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by tile number, planet, anomaly, or wormhole"
          autoFocus
        />
        <div className="replacement-grid">
          {filtered.map((tile) => (
            <button type="button" className="replacement-option" key={tile.id} onClick={() => onChoose(tile)}>
              <img src={tileImageUrl(tile.id)} alt={`Tile ${tile.id}`} />
              <span><strong>#{tile.id}</strong>{tileName(tile)}</span>
              <small>{tile.resources}/{tile.influence} · {tile.planetCount} planet{tile.planetCount === 1 ? "" : "s"}</small>
            </button>
          ))}
          {!filtered.length && <div className="empty-state">No unused systems match that search.</div>}
        </div>
      </section>
    </div>
  );
}
