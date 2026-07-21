import type { ExpansionKey } from "../types";

type TileLibraryProps = {
  expansions: Set<ExpansionKey>;
  isLocked: boolean;
  onToggle: (key: "pok" | "te") => void;
};

export function TileLibrary({
  expansions,
  isLocked,
  onToggle,
}: TileLibraryProps) {
  return (
    <section className="panel-section">
      <h2>Tile Library</h2>
      <label className="check-row locked">
        <input type="checkbox" checked readOnly /> Base game
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={expansions.has("pok")}
          disabled={isLocked}
          onChange={() => onToggle("pok")}
        />{" "}
        Prophecy of Kings
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={expansions.has("te")}
          disabled={isLocked}
          onChange={() => onToggle("te")}
        />{" "}
        Thunder&apos;s Edge
      </label>
      {isLocked && (
        <p className="help-copy">
          Expansion choices are locked until you return to layout editing.
        </p>
      )}
    </section>
  );
}
