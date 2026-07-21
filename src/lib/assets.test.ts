import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_OFFICIAL_TILES } from './tiles';

describe('official tile assets', () => {
  it('has an image for every eligible system and both Mecatol faces', () => {
    const ids = [...ALL_OFFICIAL_TILES.map((tile) => tile.id), '18', '112'];
    for (const id of ids) {
      expect(existsSync(resolve(process.cwd(), 'public', 'tiles', `ST_${id}.webp`)), `missing tile ${id}`).toBe(true);
    }
  });
});
