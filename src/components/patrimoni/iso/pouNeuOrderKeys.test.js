import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPouNeuScene } from './modelPouNeu.js';
import { POU_ORDER_KEYS, POU_ORDER_GEOMETRY_SHA256 } from './pouNeuOrderKeys.js';

describe('measured production painter keys', () => {
  it('rejects a table generated from stale geometry or audit mathematics', () => {
    const hash = createHash('sha256');
    for (const path of ['modelPouNeu.js', 'ruralIsoEngine.js', 'vendor/iso-kit.js', 'vendor/lathe.js', 'vendor/audit.js', 'vendor/tube.js'])
      hash.update(readFileSync(new URL(path, import.meta.url)));
    expect(POU_ORDER_GEOMETRY_SHA256).toBe(hash.digest('hex'));
  });

  it.each(['winter', 'summer'])('covers all 41 supported integer camera angles in %s', (season) => {
    const angles = Object.keys(POU_ORDER_KEYS[season]).map(Number).sort((a, b) => a - b);
    expect(angles).toEqual(Array.from({ length: 41 }, (_, i) => i + 25));
    for (const keys of Object.values(POU_ORDER_KEYS[season])) {
      expect(Object.keys(keys).length).toBeGreaterThanOrEqual(103);
      expect(Object.values(keys).every(Number.isFinite)).toBe(true);
    }
  });

  for (const season of ['winter', 'summer']) for (const azimuth of [25, 45, 65]) {
    it(`contains exactly the actual drawing partitions at ${azimuth}° in ${season}`, () => {
      const scene = buildPouNeuScene({ season, azimuth });
      expect(Object.keys(POU_ORDER_KEYS[season][azimuth]).sort()).toEqual(scene.parts.map((part) => part.id).sort());
      expect(scene.physicalSolidCount).toBe(103);
    });
  }
});
