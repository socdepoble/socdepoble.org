import { describe, expect, it } from 'vitest';
import {
  A, annularSector, bandsOf, curveRuns, dotsOf, fitProjection, frameOf, iso, lathe,
  prepareRuralOrder, ribsOf, sectorLathe, sectorShape, slabOf,
  sortRuralParts, sphereOf, splitWrappingParts, layerDepthOrder, stepSpring, tubePieces, tubeSvg,
} from './ruralIsoEngine.js';

const UP = frameOf([0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const P = fitProjection([[-10, -10, -1], [10, 10, 22]], 480, 480, { azimuth: 45, elevation: 34 });
const finitePaths = (paths) => {
  for (const value of [paths.fill, paths.top, paths.outline, paths.crease, ...paths.shades]) {
    expect(value).toBeTypeOf('string');
    expect(value).not.toMatch(/NaN|Infinity|undefined/);
  }
};

describe('ruralIsoEngine · real world geometry', () => {
  it('keeps a 240° hollow cutaway open through the actual removed world wedge', () => {
    const from = 105 * Math.PI / 180;
    const to = 345 * Math.PI / 180;
    const profile = [[0, 4], [0, 5], [10, 5], [10, 4]];
    const shape = sectorShape(profile, UP, from, to);
    const p = (angle, r = 4.5) => [r * Math.cos(angle * Math.PI / 180), r * Math.sin(angle * Math.PI / 180), 5];
    expect(A.sdf(shape, p(180))).toBeLessThan(0);
    expect(A.sdf(shape, p(45))).toBeGreaterThan(0);
    expect(A.sdf(shape, [0, 0, 5])).toBeGreaterThan(0);
    expect(A.sdf(shape, p(105))).toBeCloseTo(0, 7);
    expect(A.sdf(shape, p(345))).toBeCloseTo(0, 7);
    finitePaths(sectorLathe(profile, UP, P, { from, to }));
    const plan = annularSector(4, 5, from, to, 120);
    const extruded = A.extruded(plan, 0, 10);
    expect(A.sdf(extruded, p(180))).toBeLessThan(0);
    expect(A.sdf(extruded, p(45))).toBeGreaterThan(0);
  });

  it('shares analytic curved normals across clipped sectors and depth-sortable bands', () => {
    const radius = (s) => Math.sqrt(100 - s * s);
    const slope = (s) => -s / radius(s);
    const profile = Array.from({ length: 25 }, (_, i) => {
      const s = i * 8 / 24;
      return [s, radius(s), 1];
    });
    const bands = bandsOf(profile, [2, 4, 6], UP, P, { radius, slope });
    expect(bands.bands).toHaveLength(4);
    for (let i = 1; i < bands.bands.length; i++) {
      const before = bands.bands[i - 1].profile.at(-1);
      const after = bands.bands[i].profile[0];
      expect(before.slice(0, 2)).toEqual(after.slice(0, 2));
    }
    for (const paths of [
      lathe(profile, UP, P, { smooth: { radius, slope } }),
      sectorLathe(profile, UP, P, { from: 1.2, to: 2.1, smooth: { slope } }),
      sphereOf([0, 0, 3], 2, P),
    ]) finitePaths(paths);
  });

  it('traces the curved sphere silhouette instead of a constant cylinder limb', () => {
    const radius = (s) => Math.sqrt(25 - s * s);
    const slope = (s) => -s / radius(s);
    const profile = Array.from({ length: 17 }, (_, i) => [i / 4, radius(i / 4), 1]);
    const paths = sectorLathe(profile, UP, P, { from: 0, to: Math.PI * 2 - 0.01, smooth: { radius, slope } });
    const s = 3;
    const elevation = P.elevation * Math.PI / 180;
    const theta = P.azimuth * Math.PI / 180 + Math.acos(slope(s) * Math.tan(elevation));
    const expected = iso([radius(s) * Math.cos(theta), radius(s) * Math.sin(theta), s], P);
    const points = [...paths.outline.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((match) => [Number(match[1]), Number(match[2])]);
    const distance = Math.min(...points.map(([x, y]) => Math.hypot(x - expected[0], y - expected[1])));
    expect(distance).toBeLessThan(0.15);
  });

  it('retains faded masonry seams and full bolt circles on upward-facing rings', () => {
    const ribs = ribsOf(UP, 0, 10, 5, 36, P, { fade: [0.1, 0.55], seams: true });
    expect(ribs.some((rib) => rib.alpha > 0 && rib.alpha < 1)).toBe(true);
    expect(ribs.filter((rib) => rib.alpha === 1).length).toBeGreaterThanOrEqual(2);
    expect(dotsOf(UP, 10, 4.6, 12, P, { all: true })).toHaveLength(12);
  });

  it('separates an upward outer meridian from a downward inner meridian', () => {
    const segments = curveRuns([[0, 4], [2, 3, 1], [3, 2, 1], [2.5, 1, 1], [0, 0.5]]);
    expect(segments[1].slope(3)).toBeLessThan(0);
    expect(segments[2].slope(3)).toBeGreaterThan(0);
  });

  it('recognises a true annular rim contact when the connector centre is empty', () => {
    const fitting = A.ring(UP, 0, 1, 1, 2, { name: 'flange', move: [0, 0, 5] });
    const tube = A.tube([[0, 0, -2], [0, 0, 0]], 1, {
      name: 'water', owner: 'water', move: [0, 0, 5], tips: [null, [0, 0, 0]],
      free: [false, false],
    });
    expect(A.sdf(fitting, [0, 0, 0])).toBeGreaterThan(0.15);
    expect(A.terminals([tube], [fitting])).toEqual([]);
    expect(A.looseEnds([tube], [fitting])).toEqual([]);
  });

  it('builds continuously phased, individually sortable 3D rope chunks', () => {
    const points = [[0, 0, 20], [0, 0, 10], [4, 0, 6], [9, 0, 6]];
    const pieces = tubePieces(points, 0.4, P, {
      maxLength: 4, spacing: 0.2, rings: { pitch: 0.7, twist: 2, cross: true, fade: [0.05, 0.5] },
    });
    expect(pieces.length).toBeGreaterThan(4);
    expect(pieces[0].ends[0]).toBe(true);
    expect(pieces.at(-1).ends[1]).toBe(true);
    for (const [i, piece] of pieces.entries()) {
      expect(piece.radii.every((r) => Math.abs(r - 0.4) < 1e-9)).toBe(true);
      expect(piece.points.length).toBe(piece.radii.length);
      expect(tubeSvg(piece)).not.toMatch(/NaN|Infinity|undefined/);
      if (i) expect(piece.from).toBeCloseTo(pieces[i - 1].to, 8);
    }
  });
});

describe('ruralIsoEngine · measured painter order and springs', () => {
  it('splits a wall at the camera limb while retaining one physical part', () => {
    const from = 105 * Math.PI / 180;
    const to = 165 * Math.PI / 180;
    const profile = [[0, 4.2], [0, 4.8], [10, 4.8], [10, 4.2], [0, 4.2]];
    const wall = {
      id: 'wall.course', physicalId: 'wall.course', assembly: 'pou-cilindric',
      centre: [-3, 3, 5], move: [0, 0, 0], layer: 'front', details: [],
      paths: sectorLathe(profile, UP, P, { from, to }),
      shape: sectorShape(profile, UP, from, to),
      sector: { profile, F: UP, from, to },
    };
    const split = splitWrappingParts([wall], P);
    expect(split).toHaveLength(2);
    expect(new Set(split.map((part) => part.physicalId)).size).toBe(1);
    expect(split.map((part) => part.layer)).toEqual(['front', 'back']);
    const prepared = prepareRuralOrder(split, P, { states: [0] });
    expect(prepared.depth.problems).toEqual([]);
    expect(layerDepthOrder(split, prepared, P).problems).toEqual([]);
  });

  it('repairs reversed centre keys from true surface overlap at rest and apart', () => {
    const plan = { x: -2, y: -2, w: 4, d: 4, r: 0 };
    const parts = [
      { id: 'bottom', assembly: 'base', centre: [0, 0, 20], move: [0, 0, 0], paths: slabOf(plan, 0, 2, P), shape: A.slab(plan, 0, 2) },
      { id: 'upper', assembly: 'roof', centre: [0, 0, -20], move: [0, 0, 4], paths: slabOf(plan, 4, 2, P), shape: A.slab(plan, 4, 2) },
    ];
    const prepared = prepareRuralOrder(parts, P, { states: [0, 0.25, 0.5, 0.75, 1] });
    expect(prepared.depth.problems).toEqual([]);
    expect(prepared.depth.missing).toEqual([]);
    for (const share of [0, 0.25, 0.5, 0.75, 1]) {
      expect(sortRuralParts(parts, P, share, prepared).map((part) => part.id)).toEqual(['bottom', 'upper']);
    }
  });

  it('lets an interlocked geometry fail visibly instead of concealing it with key biases', () => {
    const h = { x: -4, y: -0.8, w: 8, d: 1.6, r: 0 };
    const v = { x: -0.8, y: -4, w: 1.6, d: 8, r: 0 };
    const parts = [h, v].map((plan, i) => ({
      id: `cross-${i}`, assembly: 'cross', centre: [0, 0, 1], move: [0, 0, 0],
      paths: slabOf(plan, 0, 2, P), shape: A.slab(plan, 0, 2),
    }));
    const prepared = prepareRuralOrder(parts, P, { states: [0], step: 0.5, tolerance: 0.02, least: 0.1 });
    expect(prepared.depth.problems.length).toBeGreaterThan(0);
  });

  it('replays critical springs continuously through opening and midflight reversal', () => {
    const state = { x: 0, v: 0 };
    let prior = 0;
    for (let i = 0; i < 40; i++) {
      stepSpring(state, 1, 1 / 60);
      expect(state.x).toBeGreaterThanOrEqual(prior);
      expect(state.x).toBeLessThanOrEqual(1);
      prior = state.x;
    }
    let largestJump = 0;
    for (let i = 0; i < 240; i++) {
      const before = state.x;
      stepSpring(state, 0, 1 / 60);
      largestJump = Math.max(largestJump, Math.abs(state.x - before));
      expect(state.x).toBeGreaterThanOrEqual(0);
    }
    expect(largestJump).toBeLessThan(0.06);
    expect(state).toEqual({ x: 0, v: 0 });
  });
});
