import { Segmented } from "./Segmented";
import type {
  BalanceMode,
  DistributionMode,
  EquidistantMode,
  SelectionMode,
} from "../types";

type GenerationSettingsProps = {
  selectionMode: SelectionMode;
  onSelectionModeChange: (value: SelectionMode) => void;
  distributionMode: DistributionMode;
  onDistributionModeChange: (value: DistributionMode) => void;
  balanceMode: BalanceMode;
  onBalanceModeChange: (value: BalanceMode) => void;
  equidistantMode: EquidistantMode;
  onEquidistantModeChange: (value: EquidistantMode) => void;
};

export function GenerationSettings({
  selectionMode,
  onSelectionModeChange,
  distributionMode,
  onDistributionModeChange,
  balanceMode,
  onBalanceModeChange,
  equidistantMode,
  onEquidistantModeChange,
}: GenerationSettingsProps) {
  return (
    <>
      <section className="panel-section two-up-section">
        <Segmented
          selectionTitle="Tile Selection"
          value={selectionMode}
          onChange={onSelectionModeChange}
          options={[
            {
              value: "random",
              label: "Random",
              description:
                "Choose the pool randomly while respecting exact composition targets.",
            },
            {
              value: "optimized",
              label: "Optimized",
              description:
                "Choose a pool that can support stronger final slice balance.",
            },
          ]}
        />
        <Segmented
          selectionTitle="Placement Method"
          value={distributionMode}
          onChange={onDistributionModeChange}
          options={[
            {
              value: "random",
              label: "Random",
              description:
                "Shuffle the selected systems. Slice Goal is not used.",
            },
            {
              value: "balanced",
              label: "Balanced",
              description:
                "Optimize placement according to the selected Slice Goal.",
            },
          ]}
        />
      </section>
      {distributionMode === "balanced" && (
        <section className="panel-section two-up-section">
          <Segmented
            selectionTitle="Slice Goal"
            value={balanceMode}
            onChange={onBalanceModeChange}
            options={[
              {
                value: "even",
                label: "Even",
                description:
                  "Minimize differences between complete accessible slices.",
              },
              {
                value: "tiered",
                label: "Tiered",
                description:
                  "Create a close descending order from P1 through the final player.",
              },
            ]}
            warnings={[
              {
                show: balanceMode === "tiered",
                warningText:
                  "Tier order always follows player number: P1 strongest, then P2, P3, and so on. Place the homes accordingly.",
              },
            ]}
          />
          <Segmented
            selectionTitle="Equidistants"
            value={equidistantMode}
            onChange={onEquidistantModeChange}
            options={[
              {
                value: "split",
                label: "Split",
                description:
                  "Count an equidistant fractionally for every tied player.",
              },
              {
                value: "included",
                label: "Included",
                description:
                  "Assign each equidistant wholly to one tied player, equally across all players.",
              },
            ]}
          />
        </section>
      )}
    </>
  );
}
