/**
 * Rural isometric geometry. World coordinates are x/y on the ground, z up.
 * The original mathematical primitives are MIT © 2026 Ryan (vendor/LICENSE).
 * Rendering deliberately has no colour literals: the host owns --sdp-* inks.
 */
import * as k from './vendor/iso-kit.js';
import * as G from './vendor/lathe.js';
import * as A from './vendor/audit.js';

export * from './vendor/iso-kit.js';
export * from './vendor/lathe.js';
export { tubePieces, tubeSvg, ringsSvg, crossingsOf, runsOf as tubeRunsOf } from './vendor/tube.js';
export { GLSL_ISO, GLSL_TURN, glCamera, glLayer, smooth, burst, settle, glslPose } from './vendor/gl.js';
export { A };

const TAU = Math.PI * 2;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** A polygonal annular sector, suitable for extrude(...,{convex:false}). */
export function annularSector(rInner, rOuter, from, to, steps = 48, centre = [0, 0]) {
  const count = Math.max(2, Math.ceil(steps * Math.abs(to - from) / TAU));
  const at = (r, i) => {
    const angle = from + (to - from) * i / count;
    return [centre[0] + r * Math.cos(angle), centre[1] + r * Math.sin(angle)];
  };
  return [
    ...Array.from({ length: count + 1 }, (_, i) => at(rOuter, i)),
    ...Array.from({ length: count + 1 }, (_, i) => at(rInner, count - i)),
  ];
}

/**
 * Exact audit counterpart of sectorLathe. The lathe keeps its real hollow
 * meridian. The absent angular wedge is subtracted using the same cut planes.
 */
export function sectorShape(profile, F, from, to, meta = {}) {
  const span = clamp(to - from, 0, TAU);
  const shape = A.lathe(F, profile, meta);
  if (span >= TAU - 1e-9) return shape;
  const radius = Math.max(...profile.map(([, r]) => r)) * 4 + 1;
  const s0 = Math.min(...profile.map(([s]) => s)) - 1;
  const s1 = Math.max(...profile.map(([s]) => s)) + 1;
  const absent = TAU - span;
  const count = Math.max(2, Math.ceil(absent / (Math.PI / 12)));
  const polygon = [[0, 0], ...Array.from({ length: count + 1 }, (_, i) => {
    const a = to + absent * i / count;
    return [radius * Math.cos(a), radius * Math.sin(a)];
  })];
  const cut = A.prism(F, polygon, s0, s1);
  shape.cut = meta.cut ? [cut, ...[meta.cut].flat()] : cut;
  // True angular bounds avoid ray-marching the absent three quarters of a
  // sector's parent cylinder. Extrema occur at meridian vertices and at the
  // analytic x/y/z extrema of its circular arcs.
  const angles = [from, to];
  for (let axis = 0; axis < 3; axis++) {
    const extremum = Math.atan2(F.v[axis], F.u[axis]);
    for (const a of [extremum, extremum + Math.PI]) for (let turn = -2; turn <= 2; turn++) {
      const angle = a + turn * TAU;
      if (angle > from && angle < to) angles.push(angle);
    }
  }
  const points = shape.poly.flatMap(([s, r]) => angles.map((angle) => G.pointOf(F, s, r, angle)));
  shape._b = {
    min: [0, 1, 2].map((axis) => Math.min(...points.map((point) => point[axis]))),
    max: [0, 1, 2].map((axis) => Math.max(...points.map((point) => point[axis]))),
  };
  return shape;
}

/**
 * Revolve a closed meridian through a limited angle. Unlike clipping a 2D
 * drawing, this builds the radial cut faces and the inner surface in world
 * space. Adjacent sectors are separate depth-sortable solids. The analytic
 * slope shares the same normal convention as the upstream lathe.
 */
export function sectorLathe(profile, F, P, {
  from = 0, to = TAU, steps = 96, smooth = null, cutFaces = true, clipPlanes = [], circularRows = null, hemisphere = 0,
} = {}) {
  if (to - from >= TAU - 1e-9 && !clipPlanes.length) return G.lathe(profile, F, P, { steps, smooth: smooth ?? 'auto' });
  if (!(to > from)) throw new RangeError('sectorLathe: to must be greater than from');
  const V = G.viewOf(P);
  const L = G.lightOf(P);
  const n = Math.max(3, Math.ceil((to - from) * steps / TAU));
  const angleAt = (i) => from + (to - from) * i / n;
  const flat = (s, r, angle) => {
    const world = G.pointOf(F, s, r, angle);
    return clipPlanes.length ? [...k.iso(world, P), ...world] : k.iso(world, P);
  };
  const faces = [];
  const lines = [];
  const buckets = [[], [], [], [], []];
  let smoothed = null;
  if (smooth && hemisphere && circularRows) {
    smoothed = [[], [], [], [], []];
    // On concentric spheres the visible outer skin is wholly on the near
    // hemisphere, and the visible inner skin wholly on the far hemisphere.
    // Keep those analytic sheets whole. Clipping a nonplanar sheet polygon
    // across its interior would replace its true curved cut with a chord.
    let start = -1;
    let circular = false;
    const flush = (end) => {
      if (start < 0) return;
      const offset = start;
      const buckets = G.smoothRows(profile.slice(start, end + 1), F, P, {
        ...smooth, steps, from, to, clipPlanes: circular ? [] : clipPlanes,
        radius: smooth.radius ? (s, r, i) => smooth.radius(s, r, i + offset) : null,
        slope: smooth.slope ? (s, r, i) => smooth.slope(s, r, i + offset) : null,
      });
      buckets.forEach((list, tone) => smoothed[tone].push(...list));
      start = -1;
    };
    for (let i = 0; i < profile.length - 1; i++) {
      const ds = profile[i + 1][0] - profile[i][0];
      const isCircular = circularRows[i];
      const visible = Math.abs(ds) > 1e-9 && (!isCircular || Math.sign(ds) === hemisphere);
      if (!visible) { flush(i); continue; }
      if (start >= 0 && circular !== isCircular) flush(i);
      if (start < 0) { start = i; circular = isCircular; }
    }
    flush(profile.length - 1);
  } else if (smooth) smoothed = G.smoothRows(profile, F, P, { ...smooth, steps, from, to, clipPlanes });
  if (smoothed) smoothed.forEach((list, tone) => list.forEach((d) => {
    faces.push(d);
    buckets[tone].push(d);
  }));
  const pointPath = (points) => {
    const clipped = G.clipProjectedPolygon(points, clipPlanes);
    const area = clipped.reduce((sum, [x, y], i) => {
      const next = clipped[(i + 1) % clipped.length];
      return sum + x * next[1] - next[0] * y;
    }, 0);
    return clipped.length >= 3 ? k.pathOf(area < 0 ? clipped.slice().reverse() : clipped, true) : '';
  };
  for (let row = 0; row < profile.length - 1; row++) {
    const [s0, r0] = profile[row];
    const [s1, r1] = profile[row + 1];
    const ds = s1 - s0;
    const dr = r1 - r0;
    if (Math.hypot(ds, dr) < 1e-10) continue;
    if (smoothed && Math.abs(ds) > 1e-9) continue;
    const sign = Math.sign(ds) || 1;
    const slope = typeof smooth?.slope === 'function' && Math.abs(ds) > 1e-9
      ? smooth.slope((s0 + s1) / 2, (r0 + r1) / 2) : null;
    for (let i = 0; i < n; i++) {
      const a = angleAt(i);
      const b = angleAt(i + 1);
      const radial = G.radialOf(F, (a + b) / 2);
      const normal = G.unit3(slope === null
        ? G.sub3(G.mul3(radial, ds), G.mul3(F.a, dr))
        : G.mul3(G.sub3(radial, G.mul3(F.a, slope)), sign));
      if (G.dot3(normal, V) <= 1e-9) continue;
      const p = pointPath([flat(s0, r0, a), flat(s0, r0, b), flat(s1, r1, b), flat(s1, r1, a)]);
      faces.push(p);
      buckets[G.bandOf(G.dot3(normal, L))].push(p);
    }
  }
  const cut = (angle, sign) => {
    const normal = G.mul3(G.tangentOf(F, angle), sign);
    if (!cutFaces || G.dot3(normal, V) <= 1e-9) return;
    const d = pointPath(profile.map(([s, r]) => flat(s, r, angle)));
    faces.push(d);
    buckets[G.bandOf(G.dot3(normal, L))].push(d);
    lines.push(d);
  };
  cut(from, -1);
  cut(to, 1);
  // The meridian's end rings and the silhouettes meet the cut faces exactly.
  for (const index of [0, profile.length - 1]) {
    const [s, r] = profile[index];
    if (r > 0) lines.push(G.clipProjectedLine(Array.from({ length: n + 1 }, (_, i) => flat(s, r, angleAt(i))), clipPlanes));
  }
  const facing = G.angleToward(F, V);
  const aV = G.dot3(F.a, V);
  const flatV = Math.hypot(G.dot3(F.u, V), G.dot3(F.v, V));
  const angularPlanes = to - from <= Math.PI + 1e-8 ? [
    { normal: G.tangentOf(F, from), constant: G.dot3(G.tangentOf(F, from), F.o), side: 1 },
    { normal: G.tangentOf(F, to), constant: G.dot3(G.tangentOf(F, to), F.o), side: -1 },
  ] : [];
  const tag = (world) => [...k.iso(world, P), ...world];
  // A curved meridian's silhouette is not a cylinder's constant-angle limb:
  // dot(radial - axis*dr/ds, V)=0. Trace that same analytic curve and clip its
  // true world points at the sector and silhouette planes.
  for (let row = 0; row < profile.length - 1; row++) {
    const [s0, r0] = profile[row];
    const [s1, r1] = profile[row + 1];
    if (Math.abs(s1 - s0) < 1e-9) continue;
    const samples = Math.max(4, Math.ceil(Math.hypot(s1 - s0, r1 - r0) * G.scaleOf(P) / 1.5));
    for (const sign of [-1, 1]) {
      let run = [];
      const flush = () => {
        if (run.length > 1) lines.push(G.clipProjectedLine(run, [...clipPlanes, ...angularPlanes]));
        run = [];
      };
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const s = s0 + (s1 - s0) * t;
        const linear = r0 + (r1 - r0) * t;
        const r = smooth?.radius ? smooth.radius(s, linear, row) : linear;
        const slope = smooth?.slope ? smooth.slope(s, r, row) : (r1 - r0) / (s1 - s0);
        const c = slope * aV / Math.max(flatV, 1e-9);
        if (Math.abs(c) > 1) { flush(); continue; }
        const angle = facing + sign * Math.acos(clamp(c, -1, 1));
        if (!angularPlanes.length && ![-2, -1, 0, 1, 2].some((turn) => angle + turn * TAU >= from && angle + turn * TAU <= to)) { flush(); continue; }
        run.push(tag(G.pointOf(F, s, r, angle)));
      }
      flush();
    }
  }
  // Explicit shoulders/end rings are real edges, including the crown around
  // the filling hatch. Their arcs meet the curved silhouette exactly.
  for (let i = 1; i < profile.length - 1; i++) {
    const [s, r, soft] = profile[i];
    if (soft || r <= 0 || (Math.abs(s - profile[i - 1][0]) > 1e-9 && Math.abs(s - profile[i + 1][0]) > 1e-9)) continue;
    const points = Array.from({ length: n + 1 }, (_, j) => tag(G.pointOf(F, s, r, angleAt(j))));
    lines.push(G.clipProjectedLine(points, clipPlanes));
  }
  return {
    fill: faces.join(''), top: buckets[4].join(''),
    shades: buckets.slice(0, 4).map((paths) => paths.join('')),
    outline: lines.join(''), crease: '', seamless: true,
  };
}

/**
 * Record the actual geometry and solve the painter constraints by ray tests.
 * Rebuild at the current camera/pose before calling; move is zero because the
 * supplied shapes already contain their physical assembly offsets.
 */
export function settleParts(parts, P, { step = 1, tolerance = 0.12, least = 0.25 } = {}) {
  const R = A.recorder(P);
  const originals = new Map(parts.map((part) => [part.id, part]));
  for (const part of parts) {
    const shapes = (part.shapes ?? (part.shape ? [part.shape] : [])).map((shape) => shape.kind === 'tube' ? shape : R.solid(shape));
    R.put({
      name: part.id, piece: part.assembly, at: part.centre,
      shapes, svg: part.svg ?? k.solidSvg(part.paths),
      route: part.route, chunk: part.chunk,
    });
  }
  const settled = A.settle(R, P, { states: [0], step, tolerance, least });
  const depth = A.depthOrder(R.items, P, { overlaps: settled.overlaps, solved: settled.solved });
  return {
    R, depth,
    parts: R.items.slice().sort((a, b) => a.key - b.key).map((item) => ({ ...originals.get(item.name), key: item.key })),
  };
}

/**
 * Settle static home geometry over the physical spring replay once per camera.
 * Runtime then evaluates only solved keys plus each assembly's motion.
 * Failures remain visible: an interlocked scene cannot claim a valid order.
 */
export function recordRuralParts(parts, P, { order = [], spring = {} } = {}) {
  const R = A.recorder(P, { order, spring });
  const recorded = new Set();
  for (const part of parts) {
    const shapes = part.shapes ?? (part.shape ? [part.shape] : []);
    const physicalId = part.physicalId ?? part.id;
    const physical = part.physicalShape ? [part.physicalShape] : shapes;
    if (!recorded.has(physicalId)) {
      recorded.add(physicalId);
      for (const shape of physical) if (shape.kind !== 'tube') R.solid({
        ...shape, name: physicalId, piece: part.assembly, ride: part.assembly,
        move: part.move ?? [0, 0, 0],
      });
    }
    R.put({
      name: part.id, piece: part.assembly, at: part.centre,
      move: part.move ?? [0, 0, 0], shapes,
      svg: part.svg ?? (part.paths ? k.solidSvg(part.paths) : ''),
      route: part.route, chunk: part.chunk,
    });
  }
  return R;
}

export function prepareRuralOrder(parts, P, {
  order = [], spring = {}, states, step = 1.5, tolerance = 0.12, least = 0.25,
} = {}) {
  const R = recordRuralParts(parts, P, { order, spring });
  const result = A.settle(R, P, { ...(states ? { states } : {}), step, tolerance, least });
  const depth = A.depthOrder(R.items, P, { overlaps: result.overlaps, solved: result.solved });
  return { R, depth, keys: new Map(R.items.map((item) => [item.name, item.key])), V: R.V };
}

/** O(n log n), with no ray marching or path rebuilding in animation frames. */
export function sortRuralParts(parts, P, shares, prepared) {
  const V = prepared?.V ?? G.viewOf(P);
  const state = typeof shares === 'number' ? shares : { shares };
  return parts.map((part, index) => {
    const item = {
      key: prepared?.keys.get(part.id) ?? k.depthOf(part.centre, P),
      move: part.move ?? [0, 0, 0], piece: part.assembly,
    };
    return { part, index, key: A.keyAt(item, state, V) };
  }).sort((a, b) => a.key - b.key || a.index - b.index).map(({ part }) => part);
}

/**
 * A wall which crosses a camera limb wraps around the ice: one half is in
 * front and one behind. Split the actual revolved volume at those world
 * planes before assigning SVG layers. This creates drawing chunks, never
 * additional physical parts. The same rule places the near guide posts above
 * the effect and the far posts below it.
 */
export function splitWrappingParts(parts, P) {
  const V = G.viewOf(P);
  const out = [];
  for (const part of parts) {
    const sector = part.sector;
    if (!sector) {
      let layer = part.layer;
      if (/^ice\.guide-/.test(part.physicalId ?? part.id))
        layer = part.centre[0] * V[0] + part.centre[1] * V[1] > 0 ? 'front' : 'back';
      out.push({ ...part, layer });
      continue;
    }
    const { profile, F, from, to, options = {}, detailsOf } = sector;
    let drawingOptions = options;
    if (sector.silhouette) {
      const centreS = sector.silhouette.s;
      const circular = profile.slice(0, -1).map(([s, r], i) => {
        const [nextS, nextR] = profile[i + 1];
        const a = (s - centreS) ** 2 + r * r;
        const b = (nextS - centreS) ** 2 + nextR * nextR;
        return Math.abs(nextS - s) > 1e-9 && Math.abs(a - b) < 1e-5 ? a : null;
      });
      const radius = (s, linear, i) => circular[i] === null ? linear : Math.sqrt(Math.max(0, circular[i] - (s - centreS) ** 2));
      const slope = (s, r, i) => circular[i] === null
        ? (profile[i + 1][1] - profile[i][1]) / (profile[i + 1][0] - profile[i][0] || 1)
        : -(s - centreS) / Math.max(1e-6, r);
      drawingOptions = { ...options, circularRows: circular.map((r) => r !== null), smooth: { ...options.smooth, radius, slope } };
    }
    const facing = G.angleToward(F, V);
    const cuts = [from, to];
    for (const limb of [facing - Math.PI / 2, facing + Math.PI / 2]) {
      for (let turn = -2; turn <= 2; turn++) {
        const angle = limb + turn * TAU;
        if (angle > from + 1e-8 && angle < to - 1e-8) cuts.push(angle);
      }
    }
    cuts.sort((a, b) => a - b);
    for (let index = 0; index < cuts.length - 1; index++) {
      const lo = cuts[index];
      const hi = cuts[index + 1];
      const mid = (lo + hi) / 2;
      const angularId = cuts.length === 2 ? part.id : `${part.id}.view-${index}`;
      const physicalId = part.physicalId ?? part.id;
      const { cut: _angularCut, _b: _bounds, _f: _field, ...meta } = part.shape ?? {};
      void _angularCut;
      void _bounds;
      void _field;
      // A long constant-radius side is divided at the silhouette plane. Its
      // near exterior and far interior now have one unambiguous depth each.
      const layer = part.assembly === 'pou-cilindric'
        ? G.dot3(G.radialOf(F, mid), V) > 0 ? 'front' : 'back'
        : part.layer;
      const r = Math.max(...profile.map(([, radius]) => radius));
      const s = (Math.min(...profile.map(([z]) => z)) + Math.max(...profile.map(([z]) => z))) / 2;
      const silhouette = sector.silhouette;
      const N = silhouette ? G.add3(
        G.add3(G.mul3(F.u, G.dot3(F.u, V)), G.mul3(F.v, G.dot3(F.v, V))),
        G.mul3(F.a, (silhouette.radialRatio ?? 1) * G.dot3(F.a, V)),
      ) : null;
      const constant = N ? G.dot3(N, G.add3(F.o, G.mul3(F.a, silhouette.s))) : 0;
      for (const side of silhouette ? [-1, 1] : [0]) {
        const id = side ? `${angularId}.${side > 0 ? 'near' : 'far'}` : angularId;
        const clipPlanes = side ? [{ normal: N, constant, side }] : [];
        const paths = sectorLathe(profile, F, P, { ...drawingOptions, from: lo, to: hi, clipPlanes, hemisphere: side });
        if (!paths.fill) continue;
        const shape = sectorShape(profile, F, lo, hi, { ...meta, ...sector.shapeMeta, name: id });
        if (side) {
          const normal = G.unit3(N);
          const centre = G.mul3(normal, constant / G.len3(N));
          const planeFrame = G.frameAlong(centre, normal);
          const M = 1000;
          const outside = A.prism(planeFrame, [[-M, -M], [M, -M], [M, M], [-M, M]], side > 0 ? -M : 0, side > 0 ? 0 : M);
          shape.cut = [...[shape.cut].flat().filter(Boolean), outside];
        }
        out.push({
          ...part, id, physicalId, layer, paths, shape, shapes: [shape],
          physicalShape: part.physicalShape ?? part.shape,
          centre: G.pointOf(F, s, r, mid),
          details: detailsOf ? detailsOf(lo, hi) : part.details,
          detailClip: paths.fill,
          sector: { ...sector, from: lo, to: hi },
        });
      }
    }
  }
  return out;
}

/** A contiguous cut preserves the globally measured order across SVG layers. */
export function splitRuralLayers(sorted) {
  let cutIndex = -1;
  sorted.forEach((part, index) => {
    const id = part.physicalId ?? part.id;
    if (/^ice\.compacted-/.test(id) || /^drain\.free-water-jet/.test(id)) cutIndex = index;
  });
  return { backParts: sorted.slice(0, cutIndex + 1), frontParts: sorted.slice(cutIndex + 1), cutIndex };
}

/** Verify the actual back-SVG/canvas/front-SVG paint constraint, too. */
export function layerDepthOrder(parts, prepared, P) {
  const sorted = sortRuralParts(parts, P, 0, prepared);
  const { backParts, frontParts } = splitRuralLayers(sorted);
  const ids = [...backParts, ...frontParts].map((part) => part.id);
  if (new Set(ids).size !== parts.length) throw new Error('Layer partition lost or duplicated geometry.');
  return A.depthOrder(prepared.R.items, P, {
    overlaps: prepared.R.settled.overlaps,
    solved: prepared.R.settled.solved,
    rest: prepared.R.settled.states,
  });
}

/** Deterministic semi-implicit spring shared by the viewer and replay tests. */
export function stepSpring(state, target, dt, { stiffness = 64, damping = 16, substeps = 4 } = {}) {
  const h = clamp(dt, 0, 1 / 30) / substeps;
  for (let i = 0; i < substeps; i++) {
    state.v += ((target - state.x) * stiffness - state.v * damping) * h;
    state.x += state.v * h;
  }
  if (Math.abs(target - state.x) < 1e-4 && Math.abs(state.v) < 1e-4) {
    state.x = target;
    state.v = 0;
    return false;
  }
  return true;
}
