/// <reference types="vite/client" />

declare module './data/tileData.js' {
  const tileData: any;
  export const getPlanetTraits: (planet: any) => string[];
  export const getPlanetSpecialties: (planet: any) => string[];
  export default tileData;
}
