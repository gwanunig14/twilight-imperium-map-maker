import type { GeneratedMap } from "../types";

interface TopBarProps {
  seed: string;
  phase: "design" | "generated";
  canGenerate: boolean;
  isGenerating: boolean;
  generatedMap: GeneratedMap | null;
  setSeed: (s: string) => void;
  editLayout: () => void;
  resetLayout: () => void;
  performGeneration: (seedOverride?: string) => void;
}

export const freshSeed = () =>
  `${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;

export default function Topbar({
  seed,
  phase,
  canGenerate,
  isGenerating,
  generatedMap,
  setSeed,
  editLayout,
  resetLayout,
  performGeneration,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <h1>Twilight Imperium IV Map Maker</h1>
      </div>
      <div className="topbar-actions">
        <label className="seed-field">
          Seed
          <input
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setSeed(freshSeed())}
        >
          New seed
        </button>
        {phase === "generated" ? (
          <>
            <button
              type="button"
              className="secondary-button"
              disabled={isGenerating}
              onClick={() => performGeneration()}
            >
              Rebuild Seed
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={editLayout}
            >
              Edit Layout
            </button>
          </>
        ) : (
          <button
            type="button"
            className="secondary-button"
            onClick={resetLayout}
          >
            Clear Layout
          </button>
        )}
        <button
          type="button"
          className="primary-button generate-button"
          disabled={!canGenerate}
          onClick={() =>
            phase === "generated"
              ? performGeneration(freshSeed())
              : performGeneration()
          }
        >
          {isGenerating
            ? "Generating…"
            : generatedMap
              ? "Regenerate Map"
              : "Generate Map"}
        </button>
      </div>
    </header>
  );
}
