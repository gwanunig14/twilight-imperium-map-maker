import { useEffect, useRef, useState } from "react";
import { DEFAULT_WEIGHTS } from "../lib/scoring";
import { clamp, recommendedTargets } from "../lib/mapSettings";
import { featureRange } from "../lib/tiles";
import type {
  BalanceMode,
  BalanceWeights,
  CompositionTargets,
  DistributionMode,
  EquidistantMode,
  FeatureKey,
  SelectionMode,
  SystemTile,
} from "../types";

export function useGenerationSettings(
  eligibleTiles: SystemTile[],
  featureKeys: FeatureKey[],
  poolSize: number,
) {
  const [selectionMode, setSelectionMode] =
    useState<SelectionMode>("optimized");
  const [distributionMode, setDistributionMode] =
    useState<DistributionMode>("balanced");
  const [balanceMode, setBalanceMode] = useState<BalanceMode>("even");
  const [equidistantMode, setEquidistantMode] =
    useState<EquidistantMode>("split");
  const [weights, setWeights] = useState<BalanceWeights>(DEFAULT_WEIGHTS);
  const [targets, setTargets] = useState<CompositionTargets>({});
  const targetInitialized = useRef(false);

  useEffect(() => {
    setTargets((previous) => {
      const next: CompositionTargets = {};
      for (const key of featureKeys) {
        const range = featureRange(eligibleTiles, key, poolSize);
        const previousValue = previous[key];
        next[key] =
          previousValue == null
            ? null
            : clamp(previousValue, range.min, range.max);
      }
      if (!targetInitialized.current && poolSize > 0) {
        targetInitialized.current = true;
        return recommendedTargets(eligibleTiles, poolSize);
      }
      return next;
    });
  }, [eligibleTiles, featureKeys, poolSize]);

  return {
    selectionMode,
    setSelectionMode,
    distributionMode,
    setDistributionMode,
    balanceMode,
    setBalanceMode,
    equidistantMode,
    setEquidistantMode,
    weights,
    setWeights,
    targets,
    setTargets,
  };
}
