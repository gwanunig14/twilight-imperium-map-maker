type LayoutSummaryProps = {
  playerCount: number;
  sectorCount: number;
  warpLaneCount: number;
  equidistantCount: number;
};

export function LayoutSummary({
  playerCount,
  sectorCount,
  warpLaneCount,
  equidistantCount,
}: LayoutSummaryProps) {
  return (
    <section className="panel-section intro-section">
      <div className="layout-totals">
        <div>
          <strong>{playerCount}</strong>
          <span>Players</span>
        </div>
        <div>
          <strong>{sectorCount}</strong>
          <span>Sectors</span>
        </div>
        <div>
          <strong>{warpLaneCount}</strong>
          <span>Warp lanes</span>
        </div>
        <div>
          <strong>{equidistantCount}</strong>
          <span>Equidistants</span>
        </div>
      </div>
      {playerCount < 3 && (
        <p className="inline-warning">
          At least three player home systems are required before map generation.
        </p>
      )}
    </section>
  );
}
