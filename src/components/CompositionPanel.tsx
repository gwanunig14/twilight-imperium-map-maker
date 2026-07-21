import { recommendedTargets } from "../lib/mapSettings";
import { featureLabel, featureRange } from "../lib/tiles";
import type { CompositionTargets, FeatureKey, SystemTile } from "../types";

type FeatureGroups = Record<
  "primary" | "tech" | "anomalies" | "wormholes" | "planets",
  FeatureKey[]
>;

type CompositionPanelProps = {
  eligibleTiles: SystemTile[];
  poolSize: number;
  groups: FeatureGroups;
  targets: CompositionTargets;
  onTargetsChange: (targets: CompositionTargets) => void;
  onChanged: () => void;
};

export function CompositionPanel({
  eligibleTiles,
  poolSize,
  groups,
  targets,
  onTargetsChange,
  onChanged,
}: CompositionPanelProps) {
  const renderFeatureSelect = (key: FeatureKey) => {
    const range = featureRange(eligibleTiles, key, poolSize);
    const current = targets[key] ?? null;
    const options = Array.from(
      { length: Math.max(0, range.max - range.min + 1) },
      (_, index) => range.min + index,
    );

    return (
      <label className="feature-select" key={key}>
        <span>
          {featureLabel(key)}
          <small>
            {range.min}-{range.max} possible with this tile count
          </small>
        </span>
        <select
          value={current === null ? "auto" : String(current)}
          disabled={!poolSize}
          onChange={(event) => {
            const value =
              event.target.value === "auto" ? null : Number(event.target.value);
            onTargetsChange({ ...targets, [key]: value });
            onChanged();
          }}
        >
          <option value="auto">Auto</option>
          {options.map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    );
  };

  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>Map Composition</h2>
        <button
          type="button"
          className="text-button"
          disabled={!poolSize}
          onClick={() =>
            onTargetsChange(recommendedTargets(eligibleTiles, poolSize))
          }
        >
          Recommended
        </button>
      </div>
      <p className="help-copy">
        Exact choices are limited to counts that exist in the enabled tile
        library for {poolSize || "the current number of"} sector
        {poolSize === 1 ? "" : "s"}. Auto leaves the category to the selector.
      </p>
      <div className="composition-grid">
        {groups.primary.map(renderFeatureSelect)}
      </div>
      <details>
        <summary>Tech skip counts</summary>
        <div className="nested-grid composition-grid">
          {groups.tech.map(renderFeatureSelect)}
        </div>
      </details>
      <details>
        <summary>Anomaly types</summary>
        <div className="nested-grid composition-grid">
          {groups.anomalies.map(renderFeatureSelect)}
        </div>
      </details>
      <details>
        <summary>Wormhole types</summary>
        <div className="nested-grid composition-grid">
          {groups.wormholes.map(renderFeatureSelect)}
        </div>
      </details>
      <details>
        <summary>Planet-system counts</summary>
        <div className="nested-grid composition-grid">
          {groups.planets.map(renderFeatureSelect)}
        </div>
      </details>
    </section>
  );
}
