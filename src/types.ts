export type ExpansionKey = "base" | "pok" | "te";
export type SelectionMode = "random" | "optimized";
export type DistributionMode = "random" | "balanced";
export type BalanceMode = "even" | "tiered";
export type EquidistantMode = "split" | "included";
export type EditorTool = "player" | "mecatol" | "sector" | "warp" | "erase";

export type Planet = {
  name: string;
  resources: number;
  influence: number;
  traits: string[];
  specialties: string[];
  legendary: boolean;
  ability?: string;
  spaceStation?: boolean;
};

export type SystemTile = {
  id: string;
  type: "blue" | "red";
  source: ExpansionKey;
  planets: Planet[];
  wormholes: string[];
  anomalies: string[];
  resources: number;
  influence: number;
  optimalSpend: number;
  planetCount: number;
  specialtyIcons: number;
  specialtySystems: number;
  specialtyByType: Record<string, number>;
  legendarySystems: number;
  emptySystems: number;
  wormholeSystems: number;
  anomalySystems: number;
  redSystems: number;
  onePlanetSystems: number;
  twoPlanetSystems: number;
  threePlanetSystems: number;
};

export type FeatureKey =
  | "redSystems"
  | "anomalySystems"
  | "wormholeSystems"
  | "specialtySystems"
  | "legendarySystems"
  | "emptySystems"
  | "onePlanetSystems"
  | "twoPlanetSystems"
  | "threePlanetSystems"
  | `specialty:${string}`
  | `anomaly:${string}`
  | `wormhole:${string}`;

export type CompositionTargets = Partial<Record<FeatureKey, number | null>>;

export type BalanceWeights = {
  resources: number;
  influence: number;
  planets: number;
  specialties: number;
  legendary: number;
  wormholes: number;
  anomalies: number;
  empty: number;
};

export type Axial = { q: number; r: number };

export type WarpLaneDefinition = {
  id: string;
  physicalId: string;
  side: "A" | "B";
  source: "pok" | "te";
  paths: [number, number][];
  imageUrl?: string;
  note?: string;
};

export type WarpPlacement = {
  laneId: string;
  physicalId: string;
  rotation: number;
};

export type LayoutCell = {
  id: string;
  coord: Axial;
  kind: "home" | "mecatol" | "sector" | "warp";
  player?: number;
  warp?: WarpPlacement;
};

export type SliceAssignment = {
  slotId: string;
  reachable: boolean;
  distances: Record<number, number>;
  nearestPlayers: number[];
  assignedPlayer?: number;
  equidistant: boolean;
};

export type SliceGeometry = {
  playerCount: number;
  equidistantMode: EquidistantMode;
  assignments: Record<string, SliceAssignment>;
  adjacency: Record<string, string[]>;
  equidistantSlotIds: string[];
  unreachableSlotIds: string[];
  assignedEquidistants: Record<number, number>;
};

export type Metrics = {
  resources: number;
  influence: number;
  optimalSpend: number;
  planets: number;
  specialties: number;
  legendary: number;
  wormholes: number;
  anomalies: number;
  empty: number;
  value: number;
  systems: number;
  equidistants: number;
};

export type PlayerAnalysis = {
  player: number;
  core: Metrics;
  accessible: Metrics;
  owned: Metrics;
};

export type MapAnalysis = {
  players: PlayerAnalysis[];
  objective: number;
  adjacencyViolations: number;
  grade: string;
  balanceMode: BalanceMode;
  spread: {
    resources: number;
    influence: number;
    optimalSpend: number;
    value: number;
  };
};

export type GeneratedMap = {
  placements: Record<string, string>;
  selectedTileIds: string[];
  geometry: SliceGeometry;
  analysis: MapAnalysis;
  targetCounts: Record<string, number>;
  unmetTargets: string[];
  seed: string;
  generatedAt: string;
  manualOverride: boolean;
};

export type EquidistantFailure = {
  message: string;
  playerCount: number;
  equidistantCount: number;
  requiredPerPlayer: number | null;
  conflictingPlayers: number[];
  highlightedSlotIds: string[];
};
