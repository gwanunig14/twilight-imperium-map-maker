import type { GeneratedMap } from "../types";

function number(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function BalanceTable({ map }: { map: GeneratedMap | null }) {
  if (!map) {
    return <div className="empty-state">Generate a map to see slice analysis.</div>;
  }
  const { analysis, geometry } = map;
  const showOwned = geometry.equidistantMode === "included" && geometry.equidistantSlotIds.length > 0;
  const showAccessible = geometry.equidistantMode === "split" && geometry.equidistantSlotIds.length > 0;
  return (
    <div className="analysis-card">
      <div className="analysis-heading">
        <div>
          <span className={`grade grade-${analysis.grade.toLowerCase().replace(" ", "-")}`}>{analysis.grade}</span>
          <strong>{analysis.balanceMode === "tiered" ? "Tiered" : "Even"} objective {analysis.objective.toFixed(1)}</strong>
        </div>
        <div className="spread-list">
          <span>Resource spread <b>{Math.round(analysis.spread.resources * 100)}%</b></span>
          <span>Influence spread <b>{Math.round(analysis.spread.influence * 100)}%</b></span>
          <span>Optimal spread <b>{Math.round(analysis.spread.optimalSpend * 100)}%</b></span>
          <span>Value spread <b>{Math.round(analysis.spread.value * 100)}%</b></span>
        </div>
      </div>
      {map.manualOverride && <div className="notice-banner">Manual override active. Composition may differ from the original targets.</div>}
      {geometry.unreachableSlotIds.length > 0 && (
        <div className="notice-banner neutral">{geometry.unreachableSlotIds.length} unreachable sector{geometry.unreachableSlotIds.length === 1 ? " was" : "s were"} filled randomly and excluded from all slice scores.</div>
      )}
      {analysis.adjacencyViolations > 0 && (
        <div className="warning-banner">{analysis.adjacencyViolations} anomaly or matching-wormhole adjacency conflict{analysis.adjacencyViolations === 1 ? " remains" : "s remain"}.</div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{analysis.balanceMode === "tiered" ? "Tier" : "Slice"}</th>
              <th>Core systems</th>
              <th>Core R / I</th>
              {showOwned && <th>Owned R / I</th>}
              {showAccessible && <th>Accessible R / I</th>}
              <th>Optimal</th>
              <th>Planets</th>
              <th>Skips</th>
              <th>Legendary</th>
              <th>Wormholes</th>
              <th>Anomalies</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {analysis.players.map((player) => {
              const shown = showOwned ? player.owned : player.accessible;
              return (
                <tr key={player.player}>
                  <th>P{player.player + 1}{analysis.balanceMode === "tiered" ? ` · #${player.player + 1}` : ""}</th>
                  <td>{number(player.core.systems)}</td>
                  <td>{number(player.core.resources)} / {number(player.core.influence)}</td>
                  {showOwned && <td>{number(player.owned.resources)} / {number(player.owned.influence)}</td>}
                  {showAccessible && <td>{number(player.accessible.resources)} / {number(player.accessible.influence)}</td>}
                  <td>{number(shown.optimalSpend)}</td>
                  <td>{number(shown.planets)}</td>
                  <td>{number(shown.specialties)}</td>
                  <td>{number(shown.legendary)}</td>
                  <td>{number(shown.wormholes)}</td>
                  <td>{number(shown.anomalies)}</td>
                  <td><strong>{number(shown.value)}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showAccessible && <p className="analysis-note">Accessible totals divide each equidistant system equally among every tied player. Core totals remain separate.</p>}
      {showOwned && <p className="analysis-note">Included equidistants are assigned wholly and evenly across players before tile distribution.</p>}
      {analysis.balanceMode === "tiered" && <p className="analysis-note">Tier order follows player numbers: P1 is strongest, followed by P2, P3, and so on. The optimizer keeps the gaps modest.</p>}
    </div>
  );
}
