import rawTileData, { getPlanetSpecialties, getPlanetTraits } from '../data/tileData.js';

const tileData: any = rawTileData;
import type { ExpansionKey, FeatureKey, SystemTile } from '../types';

const sourceById = new Map<string, ExpansionKey>();
for (const id of tileData.base as string[]) sourceById.set(String(id), 'base');
for (const id of tileData.pok as string[]) sourceById.set(String(id), 'pok');
for (const id of tileData.te as string[]) sourceById.set(String(id), 'te');

function normalizeTile(id: string): SystemTile | null {
  const raw = tileData.all[id];
  if (!raw || !['blue', 'red'].includes(raw.type) || raw.special) return null;
  const source = sourceById.get(id);
  if (!source) return null;

  const planets = (raw.planets ?? []).map((planet: any) => ({
    name: planet.name,
    resources: Number(planet.resources ?? 0),
    influence: Number(planet.influence ?? 0),
    traits: getPlanetTraits(planet),
    specialties: getPlanetSpecialties(planet),
    legendary: Boolean(planet.legendary),
    ability: planet.ability,
    spaceStation: Boolean(planet.spaceStation),
  }));

  const specialtyByType: Record<string, number> = {};
  for (const planet of planets) {
    for (const specialty of planet.specialties) {
      specialtyByType[specialty] = (specialtyByType[specialty] ?? 0) + 1;
    }
  }

  const resources = planets.reduce((sum: number, planet: any) => sum + planet.resources, 0);
  const influence = planets.reduce((sum: number, planet: any) => sum + planet.influence, 0);
  const optimalSpend = planets.reduce((sum: number, planet: any) => sum + Math.max(planet.resources, planet.influence), 0);
  const planetCount = planets.length;
  const specialtyIcons = Object.values(specialtyByType).reduce((sum, value) => sum + value, 0);

  return {
    id,
    type: raw.type,
    source,
    planets,
    wormholes: [...(raw.wormhole ?? [])],
    anomalies: [...(raw.anomaly ?? [])],
    resources,
    influence,
    optimalSpend,
    planetCount,
    specialtyIcons,
    specialtySystems: specialtyIcons > 0 ? 1 : 0,
    specialtyByType,
    legendarySystems: planets.some((planet: any) => planet.legendary) ? 1 : 0,
    emptySystems: planetCount === 0 ? 1 : 0,
    wormholeSystems: (raw.wormhole ?? []).length > 0 ? 1 : 0,
    anomalySystems: (raw.anomaly ?? []).length > 0 ? 1 : 0,
    redSystems: raw.type === 'red' ? 1 : 0,
    onePlanetSystems: planetCount === 1 ? 1 : 0,
    twoPlanetSystems: planetCount === 2 ? 1 : 0,
    threePlanetSystems: planetCount >= 3 ? 1 : 0,
  };
}

export const ALL_OFFICIAL_TILES: SystemTile[] = [...sourceById.keys()]
  .map(normalizeTile)
  .filter((tile): tile is SystemTile => Boolean(tile));

export const SPECIALTY_TYPES = ['biotic', 'warfare', 'propulsion', 'cybernetic'];
export const SPECIALTY_LABELS: Record<string, string> = {
  biotic: 'Green / Biotic',
  warfare: 'Red / Warfare',
  propulsion: 'Blue / Propulsion',
  cybernetic: 'Yellow / Cybernetic',
};

export function eligibleTiles(expansions: Set<ExpansionKey>): SystemTile[] {
  return ALL_OFFICIAL_TILES.filter((tile) => expansions.has(tile.source));
}

export function featureCount(tile: SystemTile, key: FeatureKey): number {
  if (key.startsWith('specialty:')) return tile.specialtyByType[key.slice('specialty:'.length)] ?? 0;
  if (key.startsWith('anomaly:')) return tile.anomalies.filter((value) => value === key.slice('anomaly:'.length)).length;
  if (key.startsWith('wormhole:')) return tile.wormholes.filter((value) => value === key.slice('wormhole:'.length)).length;
  switch (key) {
    case 'redSystems': return tile.redSystems;
    case 'anomalySystems': return tile.anomalySystems;
    case 'wormholeSystems': return tile.wormholeSystems;
    case 'specialtySystems': return tile.specialtySystems;
    case 'legendarySystems': return tile.legendarySystems;
    case 'emptySystems': return tile.emptySystems;
    case 'onePlanetSystems': return tile.onePlanetSystems;
    case 'twoPlanetSystems': return tile.twoPlanetSystems;
    case 'threePlanetSystems': return tile.threePlanetSystems;
    default: return 0;
  }
}

export function poolFeatureCounts(tiles: SystemTile[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const key of availableFeatureKeys(tiles)) {
    result[key] = tiles.reduce((sum, tile) => sum + featureCount(tile, key), 0);
  }
  return result;
}

export function availableFeatureKeys(tiles: SystemTile[]): FeatureKey[] {
  const anomalies = new Set<string>();
  const wormholes = new Set<string>();
  const specialties = new Set<string>();
  for (const tile of tiles) {
    tile.anomalies.forEach((value) => anomalies.add(value));
    tile.wormholes.forEach((value) => wormholes.add(value));
    Object.keys(tile.specialtyByType).forEach((value) => specialties.add(value));
  }
  return [
    'redSystems',
    'anomalySystems',
    ...[...anomalies].sort().map((value) => `anomaly:${value}` as FeatureKey),
    'wormholeSystems',
    ...[...wormholes].sort().map((value) => `wormhole:${value}` as FeatureKey),
    'specialtySystems',
    ...[...specialties].sort().map((value) => `specialty:${value}` as FeatureKey),
    'legendarySystems',
    'emptySystems',
    'onePlanetSystems',
    'twoPlanetSystems',
    'threePlanetSystems',
  ];
}

export function featureRange(tiles: SystemTile[], key: FeatureKey, poolSize = 30): { min: number; max: number } {
  const counts = tiles.map((tile) => featureCount(tile, key)).sort((a, b) => a - b);
  return {
    min: counts.slice(0, poolSize).reduce((sum, value) => sum + value, 0),
    max: counts.slice(-poolSize).reduce((sum, value) => sum + value, 0),
  };
}

export function featureLabel(key: FeatureKey): string {
  const base: Partial<Record<FeatureKey, string>> = {
    redSystems: 'Red-backed systems',
    anomalySystems: 'Anomaly systems',
    wormholeSystems: 'Wormhole systems',
    specialtySystems: 'Systems with tech skips',
    legendarySystems: 'Legendary systems',
    emptySystems: 'Empty systems',
    onePlanetSystems: 'One-planet systems',
    twoPlanetSystems: 'Two-planet systems',
    threePlanetSystems: 'Three-planet systems',
  };
  if (base[key]) return base[key]!;
  if (key.startsWith('specialty:')) return `${SPECIALTY_LABELS[key.slice(10)] ?? key.slice(10)} icons`;
  if (key.startsWith('anomaly:')) return `${titleCase(key.slice(8))} systems`;
  if (key.startsWith('wormhole:')) return `${key.slice(9).toUpperCase()} wormholes`;
  return key;
}

function titleCase(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function tileImageUrl(id: string): string {
  return `${import.meta.env.BASE_URL}tiles/ST_${id}.webp`;
}
