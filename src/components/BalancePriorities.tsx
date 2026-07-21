import { WEIGHT_ROWS } from "../lib/mapSettings";
import { DEFAULT_WEIGHTS } from "../lib/scoring";
import type { BalanceWeights } from "../types";

type BalancePrioritiesProps = {
  weights: BalanceWeights;
  onChange: (weights: BalanceWeights) => void;
};

export function BalancePriorities({
  weights,
  onChange,
}: BalancePrioritiesProps) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>Balance Priorities</h2>
        <button
          type="button"
          className="text-button"
          onClick={() => onChange(DEFAULT_WEIGHTS)}
        >
          Reset
        </button>
      </div>
      <div className="weight-list">
        {WEIGHT_ROWS.map((row) => (
          <label key={row.key} title={row.hint}>
            <span>
              <span>{row.label}</span>
              <b>{weights[row.key]}</b>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={weights[row.key]}
              onChange={(event) =>
                onChange({ ...weights, [row.key]: Number(event.target.value) })
              }
            />
          </label>
        ))}
      </div>
    </section>
  );
}
