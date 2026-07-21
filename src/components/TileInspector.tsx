import type { SystemTile } from "../types";
import { SPECIALTY_LABELS, tileImageUrl } from "../lib/tiles";

export function TileInspector({
  tile,
  onClose,
  onRequestReplacement,
}: {
  tile: SystemTile | null;
  onClose: () => void;
  onRequestReplacement?: () => void;
}) {
  if (!tile) return null;
  return (
    <aside className="tile-inspector">
      <button type="button" className="icon-button close-button" onClick={onClose} aria-label="Close tile details">×</button>
      <img src={tileImageUrl(tile.id)} alt={`Tile ${tile.id}`} />
      <div className="inspector-copy">
        <span className="eyebrow">Tile {tile.id} · {tile.source === "pok" ? "Prophecy of Kings" : tile.source === "te" ? "Thunder's Edge" : "Base game"}</span>
        <h3>{tile.planets.map((planet) => planet.name).join(" / ") || "Empty System"}</h3>
        <div className="chip-row">
          <span>{tile.resources} resources</span>
          <span>{tile.influence} influence</span>
          {tile.anomalies.map((anomaly) => <span key={anomaly}>{anomaly}</span>)}
          {tile.wormholes.map((wormhole) => <span key={wormhole}>{wormhole.toUpperCase()} wormhole</span>)}
        </div>
        {tile.planets.map((planet) => (
          <section key={planet.name} className="planet-detail">
            <div><strong>{planet.name}</strong><span>{planet.resources}/{planet.influence}</span></div>
            <p>{planet.traits.join(" · ") || "No trait"}{planet.specialties.length ? ` · ${planet.specialties.map((value) => SPECIALTY_LABELS[value] ?? value).join(", ")}` : ""}</p>
            {planet.legendary && <b className="legendary-label">Legendary</b>}
            {planet.ability && <p className="ability">{planet.ability}</p>}
          </section>
        ))}
        {onRequestReplacement && (
          <button type="button" className="secondary-button full-button inspector-replace" onClick={onRequestReplacement}>
            Select Different System
          </button>
        )}
      </div>
    </aside>
  );
}
