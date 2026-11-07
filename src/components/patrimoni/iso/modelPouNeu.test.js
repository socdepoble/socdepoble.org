import { describe, expect, it } from 'vitest';
import { buildPouNeuScene, iceLayersOf, pouNeuState, POU_DIMENSIONS, POU_ASSEMBLIES } from './modelPouNeu.js';
describe('Pou de la Neu · SI physics and architecture', () => {
  it('conserves mass at six declared snow densities', () => {
    const layers = iceLayersOf();
    expect(layers).toHaveLength(6);
    for (const l of layers) {
      expect(l.density).toBeGreaterThanOrEqual(550); expect(l.density).toBeLessThanOrEqual(720);
      expect(l.massKg).toBeCloseTo(l.volumeM3 * l.density, 8);
    }
    const s = pouNeuState();
    expect(s.massTonnes * 1000).toBeCloseTo(layers.reduce((a, l) => a + l.massKg, 0), 8);
    expect(s.density * s.iceVolumeM3).toBeCloseTo(s.massTonnes * 1000, 8);
    expect(s.iceVolumeM3).toBeLessThan(Math.PI * POU_DIMENSIONS.innerRadius ** 2 * POU_DIMENSIONS.depth);
  });
  it('uses latent heat for summer drainage and conserves the remaining snow', () => {
    const first = pouNeuState({ season: 'summer' }), later = pouNeuState({ season: 'summer', elapsedHours: 24 });
    expect(first.drainageLh * 334000 / 3600).toBeCloseTo(first.heatWatts, 8);
    expect((first.massTonnes - later.massTonnes) * 1000).toBeCloseTo(first.drainageLh * 24, 7);
    expect(first.temperature).toBe(0); expect(pouNeuState().drainageLh).toBe(0);
    expect(first.massTonnes).toBeLessThan(pouNeuState().massTonnes);
    expect(first.z).toBeLessThan(pouNeuState().z);
  });
  it('keeps physical elevation distinct from illustration displacement', () => {
    const rest = pouNeuState({ assembly: 'volta-cupula' });
    const apart = pouNeuState({ assembly: 'volta-cupula', shares: { 'volta-cupula': 1 } });
    expect(apart.z).toBe(rest.z); expect(apart.explodedZ - rest.z).toBeCloseTo(9.5, 8);
    for (const a of POU_ASSEMBLIES) {
      const s = pouNeuState({ assembly: a.id });
      for (const key of ['z', 'temperature', 'density', 'massTonnes', 'drainageLh']) expect(Number.isFinite(s[key])).toBe(true);
      expect(s.massTonnes).toBeGreaterThan(0);
      if (a.id === 'pou-cilindric') expect(s.density).toBe(2350);
    }
  });
  it('builds real shapes for every part without counting pipe chunks as extra parts', () => {
    const s = buildPouNeuScene();
    expect(s.physicalSolidCount).toBe(103); expect(s.renderItemCount).toBeGreaterThanOrEqual(103);
    expect(new Set(s.parts.map(({ assembly }) => assembly)).size).toBe(7);
    expect(new Set(s.parts.map(({ id }) => id)).size).toBe(s.parts.length);
    expect(s.parts.every(({ paths, shapes }) => paths.fill && shapes.length)).toBe(true);
    expect(s.effect.iceTops).toHaveLength(6); expect(s.engraving.text).toBe('POU DE NEU · EL RENTONAR');
    expect(s.recorder.items).toHaveLength(s.parts.length);
    expect(s.recorder.solids.length + s.recorder.tubes.length).toBe(s.physicalSolidCount);
  });
  it('derives structural mass from the same recorded geometry volumes', () => {
    const scene = buildPouNeuScene();
    for (const assembly of POU_ASSEMBLIES.filter(({ id }) => id !== 'estrats-gel')) {
      expect(assembly.volume).toBeCloseTo(scene.assemblyVolumes[assembly.id], 8);
      const state = pouNeuState({ assembly: assembly.id, volumes: scene.assemblyVolumes });
      expect(state.massTonnes * 1000).toBeCloseTo(scene.assemblyVolumes[assembly.id] * assembly.density, 7);
      expect(state.densityScope).toBe('dominant-material');
    }
    expect(scene.assemblyVolumes['base-roca']).toBeGreaterThan(84.5);
  });
  it('follows the Rentonar survey by Segura (1987) with 103 solids in 7 assemblies', () => {
    expect(POU_DIMENSIONS).toMatchObject({ depth: 13.75, diameter: 9.8, innerRadius: 4.9, wall: 1.5, ingressHeight: 10, tunnelLength: 9.1, drainLength: 29 });
    expect(POU_DIMENSIONS.diameter).toBeCloseTo(2 * POU_DIMENSIONS.innerRadius, 12);
    // Segura rounds π·4,90²·13,75 m³ to 1.030 m³.
    expect(Math.PI * POU_DIMENSIONS.innerRadius ** 2 * POU_DIMENSIONS.depth).toBeGreaterThan(1030);
    expect(Math.PI * POU_DIMENSIONS.innerRadius ** 2 * POU_DIMENSIONS.depth).toBeLessThan(1040);
    const s = buildPouNeuScene();
    expect(s.physicalSolidCount).toBe(103);
    expect(POU_ASSEMBLIES.map(({ id }) => id)).toEqual(['base-roca', 'pou-cilindric', 'estrats-gel', 'volta-cupula', 'portell-empouar', 'porta-extraccio', 'desaigue-fusio']);
    const byPhysical = new Map(s.parts.map((part) => [part.physicalId, part]));
    const courses = [...byPhysical.values()].filter(({ physicalId }) => physicalId.startsWith('wall.course-'));
    expect(courses).toHaveLength(24);
    const radii = courses.flatMap(({ sector }) => sector.profile.map(([, r]) => r));
    const heights = courses.flatMap(({ sector }) => sector.profile.map(([z]) => z));
    expect(Math.min(...radii)).toBeCloseTo(49, 9); expect(Math.max(...radii)).toBeCloseTo(64, 9);
    expect(Math.min(...heights)).toBeCloseTo(2, 9); expect(Math.max(...heights)).toBeCloseTo(139.5, 9);
    for (const id of ['wall.window-frame-0', 'wall.window-frame-1', 'wall.window-frame-2']) expect(byPhysical.get(id).shape.s0).toBeCloseTo(139.5, 9);
    for (const id of ['dome.arch-springer-0', 'dome.arch-springer-1', 'dome.arch-springer-2']) {
      expect(byPhysical.get(id).shape.s0).toBeCloseTo(102, 9); expect(byPhysical.get(id).shape.s1).toBeCloseTo(139.5, 9);
    }
    for (const id of ['door.tunnel-wall-0', 'door.tunnel-wall-1']) expect(byPhysical.get(id).shape.s0).toBeCloseTo(102, 9);
    expect([...byPhysical.keys()].filter((id) => id.startsWith('wall.step-'))).toHaveLength(6);
    expect(Math.max(...s.effect.iceTops) + 1.3).toBeLessThanOrEqual(138 + 1e-9);
    expect(s.effect.drainOrigin[0]).toBeGreaterThan(64);
  });
  it('reprojects a stable world box across camera and disassembly', () => {
    const compact = buildPouNeuScene({ azimuth: 25 });
    const apart = buildPouNeuScene({ azimuth: 25, shares: Object.fromEntries(POU_ASSEMBLIES.map(({ id }) => [id, 1])) });
    const rotated = buildPouNeuScene({ azimuth: 65 });
    expect(apart.P).toEqual(compact.P);
    expect(rotated.parts.find(({ id }) => id === 'base.rock').paths.fill).not.toBe(compact.parts.find(({ id }) => id === 'base.rock').paths.fill);
    expect(buildPouNeuScene({ azimuth: 100 }).P.azimuth).toBe(65);
  });
});
