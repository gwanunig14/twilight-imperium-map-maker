import { useMemo, useState } from "react";
import type { WarpPlacement } from "../types";
import type { WarpLaneDefinition } from "../types";
import { WarpLanePreview } from "./WarpLanePreview";

export function WarpLanePicker({
  lanes,
  usedPhysicalIds,
  initial,
  onChoose,
  onCancel,
}: {
  lanes: WarpLaneDefinition[];
  usedPhysicalIds: Set<string>;
  initial?: WarpPlacement;
  onChoose: (placement: WarpPlacement) => void;
  onCancel: () => void;
}) {
  const available = useMemo(
    () =>
      lanes.filter(
        (lane) =>
          !usedPhysicalIds.has(lane.physicalId) || lane.physicalId === initial?.physicalId,
      ),
    [lanes, usedPhysicalIds, initial?.physicalId],
  );
  const [laneId, setLaneId] = useState(initial?.laneId ?? available[0]?.id ?? "");
  const [rotation, setRotation] = useState(initial?.rotation ?? 0);
  const selected = available.find((lane) => lane.id === laneId) ?? available[0];

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="modal-card warp-picker" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">Choose a physical tile and face</span>
            <h2>Place Warp Lane</h2>
          </div>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Close">×</button>
        </div>
        <div className="warp-picker-layout">
          <div className="warp-library">
            {available.map((lane) => (
              <button
                type="button"
                key={lane.id}
                className={lane.id === selected?.id ? "warp-option selected" : "warp-option"}
                onClick={() => setLaneId(lane.id)}
              >
                <WarpLanePreview lane={lane} rotation={0} />
                <small>{lane.source === "pok" ? "Prophecy of Kings" : "Thunder's Edge"}</small>
              </button>
            ))}
          </div>
          {selected && (
            <div className="warp-choice-panel">
              <WarpLanePreview lane={selected} rotation={rotation} className="large" />
              <h3>{selected.id}</h3>
              <p>Physical tile {selected.physicalId}, side {selected.side}. Each physical tile can appear once.</p>
              {selected.note && <p className="warp-note">{selected.note}</p>}
              <div className="rotation-row">
                <button type="button" className="secondary-button" onClick={() => setRotation((rotation + 300) % 360)}>↺ 60°</button>
                <strong>{rotation}°</strong>
                <button type="button" className="secondary-button" onClick={() => setRotation((rotation + 60) % 360)}>60° ↻</button>
              </div>
              <button
                type="button"
                className="primary-button full-button"
                onClick={() => onChoose({ laneId: selected.id, physicalId: selected.physicalId, rotation })}
              >
                Use {selected.id}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
