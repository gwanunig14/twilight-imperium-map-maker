import { useEffect, useState } from "react";
import { STANDARD_LAYOUTS } from "../lib/layoutPresets";
import type { StandardLayoutId } from "../types";

export function LayoutPresets({
  activePresetId,
  disabled,
  onApply,
}: {
  activePresetId: StandardLayoutId | null;
  disabled: boolean;
  onApply: (id: StandardLayoutId) => void;
}) {
  const [selected, setSelected] = useState<StandardLayoutId>(activePresetId ?? "standard-6");
  useEffect(() => {
    if (activePresetId) setSelected(activePresetId);
  }, [activePresetId]);
  return (
    <section className="panel-section preset-section">
      <div className="section-heading">
        <h2>Layout Presets</h2>
        {activePresetId && <span>Active</span>}
      </div>
      <p className="help-copy">Fill the editor with an official 3–8 player board shape. You can customize it afterward.</p>
      <div className="preset-controls">
        <select value={selected} disabled={disabled} onChange={(event) => setSelected(event.target.value as StandardLayoutId)}>
          {STANDARD_LAYOUTS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
        </select>
        <button type="button" className="secondary-button" disabled={disabled} onClick={() => onApply(selected)}>Apply</button>
      </div>
    </section>
  );
}
