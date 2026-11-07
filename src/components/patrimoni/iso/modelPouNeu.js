/**
 * Pou de neu del Rentonar (la Torre de les Maçanes), after the survey by the
 * archaeologist Josep Mª Segura Martí (1987). Measured dimensions; estimated physics.
 */
import * as G from './ruralIsoEngine.js';
const DEG = Math.PI / 180;
const UP = (o = [0, 0, 0]) => ({ o, a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] });
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : a));
/** Volume of the recorded meridian/prism in cubic metres (10 world units/m). */
export function pouShapeVolumeM3(shape) {
  if (shape.kind === 'ball') return 4 * Math.PI * shape.r ** 3 / 3 / 1000;
  if (shape.kind === 'body') return Math.abs(shape.poly.slice(1).reduce((sum, [s1, r1], i) => {
    const [s0, r0] = shape.poly[i];
    return sum + Math.PI * (s1 - s0) * (r0 * r0 + r0 * r1 + r1 * r1) / 3;
  }, 0)) / 1000;
  if (shape.kind === 'prism') return Math.abs(shape.poly.reduce((sum, [x, y], i) => {
    const [nx, ny] = shape.poly[(i + 1) % shape.poly.length];
    return sum + x * ny - nx * y;
  }, 0) / 2) * (shape.s1 - shape.s0) / 1000;
  if (shape.kind === 'tube') return shape.points.slice(1).reduce((sum, point, i) => {
    const a = shape.radii[i], b = shape.radii[i + 1];
    return sum + Math.PI * G.len3(G.sub3(point, shape.points[i])) * (a * a + a * b + b * b) / 3;
  }, 0) / 1000;
  throw new TypeError(`Unsupported volume shape: ${shape.kind}`);
}

export const WORLD_UNITS_PER_METRE = 10;
/**
 * Segura (1987): 13,75 m from the floor to the window sills, Ø 9,80 m inside,
 * 1,50 m wall, ingress at +10,00 m, 9,10 m tunnel, 29 m drain, ≈1.030 m³.
 */
export const POU_DIMENSIONS = Object.freeze({
  depth: 13.75, diameter: 9.8, innerRadius: 4.9, wall: 1.5, cutawayDegrees: 290,
  ingressHeight: 10, ingressWidth: 1.35, ingressClearHeight: 1.55, tunnelLength: 9.1, tunnelMouthWidth: 2.35, tunnelMouthHeight: 2.1,
  windowWidth: 1.55, windowHeight: 1.7, drainWidth: 0.5, drainHeight: 0.7, drainLength: 29, snowTop: 13.6, crownThickness: 0.7,
});
const U = WORLD_UNITS_PER_METRE;
const Z0 = 2; // Floor of the well (Segura's level 0) on the bedrock ring.
const R_IN = POU_DIMENSIONS.innerRadius * U;
const R_OUT = R_IN + POU_DIMENSIONS.wall * U;
const TOP = Z0 + POU_DIMENSIONS.depth * U; // Window sills and springing of the false vault.
const SILL_M = TOP / U; // Physical z is reported in metres relative to the sills.
const INGRESS_Z = Z0 + POU_DIMENSIONS.ingressHeight * U;
const SNOW_TOP = Z0 + POU_DIMENSIONS.snowTop * U;
const ICE_R = R_IN - 5, STRAW_R = ICE_R + 0.6, STRAW = 1.3;
const ICE_FLOOR = 0.3 + (ICE_R - 5) / (R_IN - 5) * (Z0 - 0.3);
const LAYER_H = (SNOW_TOP - ICE_FLOOR) / 6 - STRAW;
const ICE_AREA_M2 = Math.PI * (ICE_R / U) ** 2;
const SHELL_M2 = 2 * Math.PI * POU_DIMENSIONS.innerRadius * POU_DIMENSIONS.depth + Math.PI * POU_DIMENSIONS.innerRadius ** 2;
// The extrados is a sphere through the wall face at the springing and the 0,7 m crown.
const CROWN_TOP = R_IN + POU_DIMENSIONS.crownThickness * U;
const EXT_DROP = (R_OUT ** 2 - CROWN_TOP ** 2) / (2 * CROWN_TOP);
const EXT_C = TOP - EXT_DROP, EXT_R = CROWN_TOP + EXT_DROP, COVER_R = EXT_R + 2;
const HOLE = 6, S_FLAT = TOP + 55, S_HOLE = TOP + Math.sqrt(R_IN ** 2 - HOLE ** 2);
const WINDOW_HALF = POU_DIMENSIONS.windowWidth * U / 2, WINDOW_H = POU_DIMENSIONS.windowHeight * U;
const INGRESS_HALF = POU_DIMENSIONS.ingressWidth * U / 2, INGRESS_H = POU_DIMENSIONS.ingressClearHeight * U;
const MOUTH_HALF = POU_DIMENSIONS.tunnelMouthWidth * U / 2, MOUTH_H = POU_DIMENSIONS.tunnelMouthHeight * U;
const TUNNEL_END = -94; // 9,10 m tunnel drawn with an engineering break.
const DRAIN_END = 86, DRAIN_Z = -10.5; // 29 m gallery drawn with an engineering break.
// Compass bearings → plan angles (north = +Y, east = +X).
const BEARING = { E: 0, N: 90, W: 180, S: 270 };
const CUT_FROM = 10, CUT_TO = 80;

export const POU_SPRING = Object.freeze({ stiffness: 64, damping: 16, substeps: 4, stagger: 0 });
// Structural volumes are derived from the actual rest plans/meridians.
// modelPouNeu.test.js checks these compiled pure-model values against geometry.
// Structural density is the dominant material of each mixed assembly.
// z is the volume-weighted elevation in metres relative to the window sills.
export const POU_ASSEMBLIES = Object.freeze([
  { id: 'base-roca', move: [0, 0, 0], z: -14.6, density: 2350, volume: 321.1465193325805 },
  { id: 'pou-cilindric', move: [0, 0, 10], z: -6.8, density: 2350, volume: 595.1385222818324 },
  { id: 'estrats-gel', move: [0, 0, 45], z: -7.4, density: 635, volume: 0 },
  { id: 'volta-cupula', move: [0, 0, 95], z: 2.7, density: 2250, volume: 198.46601595925262 },
  { id: 'portell-empouar', move: [0, 0, 60], z: 1.1, density: 650, volume: 0.9383392365494391 },
  { id: 'porta-extraccio', move: [0, -20, 30], z: -2.9, density: 2200, volume: 10.06613375910569 },
  { id: 'desaigue-fusio', move: [0, 0, -34], z: -15, density: 2350, volume: 3.0915256096136416 },
]);
export const POU_EXPLODE_ORDER = Object.freeze(['portell-empouar', 'volta-cupula', 'estrats-gel', 'porta-extraccio', 'pou-cilindric', 'desaigue-fusio', 'base-roca']);
export function iceLayersOf(season = 'winter', elapsedHours = 0) {
  const retained = season === 'summer' ? 0.76 : 1, densities = [720, 686, 652, 618, 584, 550];
  const heat = season === 'summer' ? 0.34 * SHELL_M2 * 24 : 0;
  const initial = densities.reduce((s, rho) => s + rho * ICE_AREA_M2 * LAYER_H / U * retained, 0);
  const remaining = Math.max(0.05, 1 - heat * 3600 / 334000 * clamp(elapsedHours, 0, 720) / initial);
  let z = ICE_FLOOR;
  return densities.map((density, index) => {
    const height = LAYER_H * retained * remaining;
    const layer = { index, z, height, top: z + height, radius: ICE_R, density, volumeM3: ICE_AREA_M2 * height / U, massKg: density * ICE_AREA_M2 * height / U };
    z += height + STRAW; return layer;
  });
}
/** m=ρV, melt L/h=Q watts·3600/Lf; water≈1 kg/L. No sensors are implied. */
export function pouNeuState({ season = 'winter', assembly = 'estrats-gel', shares = {}, elapsedHours = 0, volumes } = {}) {
  const selected = POU_ASSEMBLIES.find(({ id }) => id === assembly) ?? POU_ASSEMBLIES[2];
  const layers = iceLayersOf(season, elapsedHours);
  const mass = layers.reduce((s, l) => s + l.massKg, 0), volume = layers.reduce((s, l) => s + l.volumeM3, 0);
  const summer = season === 'summer', temperature = summer ? 0 : -2, ambientTemperature = summer ? 24 : 4;
  const conductance = 0.34, area = SHELL_M2;
  const heatWatts = summer ? conductance * area * (ambientTemperature - temperature) : 0;
  const snow = selected.id === 'estrats-gel';
  const snowZ = layers.reduce((sum, layer) => sum + layer.massKg * ((layer.z + layer.height / 2) / U - SILL_M), 0) / mass;
  const z = snow ? snowZ : selected.z;
  return { season, assembly: selected.id, z, explodedZ: z + selected.move[2] * clamp(shares[selected.id] ?? 0) / U, temperature: snow || selected.id === 'desaigue-fusio' ? temperature : summer ? 10 : 1, density: snow ? mass / volume : selected.density, massTonnes: snow ? mass / 1000 : (volumes?.[selected.id] ?? selected.volume) * selected.density / 1000, drainageLh: heatWatts * 3600 / 334000, heatWatts, totalIceMassTonnes: mass / 1000, iceVolumeM3: volume, ambientTemperature, conductance, latentHeatJkg: 334000, estimated: true, densityScope: snow ? 'bulk-compacted-snow' : 'dominant-material', massScope: snow ? 'stored-strata' : 'assembly-volume' };
}
const rotatedRing = (cx, cy, along, across, angle) => {
  const a = [Math.cos(angle), Math.sin(angle)], b = [-a[1], a[0]];
  return [[-along / 2, -across / 2], [along / 2, -across / 2], [along / 2, across / 2], [-along / 2, across / 2]].map(([x, y]) => [cx + x * a[0] + y * b[0], cy + x * a[1] + y * b[1]]);
};
const counterClockwise = (ring) => ring.reduce((sum, [x, y], i) => {
  const [nx, ny] = ring[(i + 1) % ring.length];
  return sum + x * ny - nx * y;
}, 0) > 0 ? ring : ring.slice().reverse();
// Points on the outer wall face (r = R_OUT) on the south side, west → east.
const southFace = (x0, x1, steps = 12) => Array.from({ length: steps + 1 }, (_, i) => {
  const x = x0 + (x1 - x0) * i / steps;
  return [x, -Math.sqrt(R_OUT ** 2 - x * x)];
});
// Notch a straight east–west trench into a rounded plan after its lowest east-edge vertex.
const withTrench = (ring, half, west) => {
  const east = Math.max(...ring.map(([x]) => x));
  const edge = ring.map((p, i) => [p, i]).filter(([[x]]) => Math.abs(x - east) < 1e-6).sort(([[, a]], [[, b]]) => a - b)[0][1];
  return [...ring.slice(0, edge + 1), [east, -half], [west, -half], [west, half], [east, half], ...ring.slice(edge + 1)];
};
const sphereR = (radius, centre) => (s) => Math.sqrt(Math.max(0.0001, radius ** 2 - (s - centre) ** 2));
const sphereSlope = (radius, centre) => (s) => -(s - centre) / sphereR(radius, centre)(s);
/** Rest geometry and exact shape descriptors; rigid vectors feed animation/audit. */
export function buildPouNeuScene({ azimuth = 45, width = 760, height = 720, season = 'winter', elapsedHours = 0, shares = {} } = {}) {
  const assemblies = POU_ASSEMBLIES.map((a) => ({ ...a, offset: G.mul3(a.move, clamp(shares[a.id] ?? 0)) }));
  const byId = Object.fromEntries(assemblies.map((a) => [a.id, a]));
  const P = G.fitProjection(G.boxCorners({ x: -84, y: -118, w: 186, d: 202 }, -52, 300), width, height, { pad: 22, azimuth: clamp(azimuth, 25, 65), elevation: 32 });
  const parts = [], routes = [], layers = iceLayersOf(season, elapsedHours);
  const line = (d, tone = 'lo', alpha = 1) => ({ d, tone, alpha });
  const meta = (id, assembly, centre, tone = 'mid', extra = {}) => ({ id, physicalId: id, assembly, centre, tone, move: byId[assembly].move, layer: ['base-roca', 'estrats-gel', 'desaigue-fusio'].includes(assembly) ? 'back' : 'front', details: [], dots: [], ...extra });
  const add = (part) => { part.volumeM3 ??= pouShapeVolumeM3(part.shape) * (part.sector ? (part.sector.to - part.sector.from) / (Math.PI * 2) : 1); part.shapes ??= [part.shape]; for (const shape of part.shapes) Object.assign(shape, { name: part.id, piece: part.assembly, ride: part.assembly, move: part.move }); parts.push(part); return part; };
  const slab = (id, assembly, plan, z, h, tone = 'mid') => add({ ...meta(id, assembly, [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], tone), paths: G.slabOf(plan, z, h, P, 4, Math.min(0.65, h / 4)), shape: G.A.slab(plan, z, h) });
  const prism = (id, assembly, ring, z, h, tone = 'mid') => add({ ...meta(id, assembly, [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length, z + h / 2], tone), paths: G.extrude(ring, z, h, P, { convex: false, bevel: Math.min(0.5, h / 4) }), shape: G.A.extruded(ring, z, h) });
  const turned = (id, assembly, F, profile, tone = 'mid', options = {}) => add({ ...meta(id, assembly, G.add3(F.o, G.mul3(F.a, (Math.min(...profile.map(([s]) => s)) + Math.max(...profile.map(([s]) => s))) / 2)), tone), paths: G.lathe(profile, F, P, options), shape: G.A.lathe(F, profile) });
  const disc = (id, assembly, x, y, z, h, r, tone = 'mid') => turned(id, assembly, UP([x, y, 0]), [[z, 0], [z, r], [z + h, r], [z + h, 0]], tone, { steps: 64, bevel: 0.35 });
  const sectorPart = (id, assembly, centre, profile, from, to, steps, smooth, tone = 'mid') => {
    const options = smooth ? { steps, smooth: { slope: smooth } } : { steps };
    return add({ ...meta(id, assembly, centre, tone), paths: G.sectorLathe(profile, UP(), P, { ...options, from, to }), shape: G.sectorShape(profile, UP(), from, to), sector: { profile, F: UP(), from, to, options } });
  };
  const tube = (id, assembly, route, radius, tone = 'hi', options = {}) => {
    const volumeM3 = pouShapeVolumeM3(G.A.tube(route, radius));
    routes.push({ id, assembly, points: route, radius, free: options.free ?? [false, false], ends: options.ends ?? [true, true] });
    G.tubePieces(route, radius, P, { maxLength: options.maxLength ?? 22, spacing: 0.7, rings: options.rings ?? null, breaks: options.breaks ?? [] }).forEach((piece, chunk) => add({ ...meta(`${id}:${chunk}`, assembly, piece.mid, tone, { physicalId: id, route: id, chunk, kind: 'tube', volumeM3 }), paths: { fill: piece.body, shades: [piece.shade, '', '', ''], top: piece.shine, outline: piece.edges, crease: '' }, tube: piece, shape: G.A.tube(piece.points, piece.radii), details: piece.rings.map(({ d, alpha }) => line(d, 'lo', alpha)) }));
  };
  const polyline = (points) => points.slice(1).map((point, i) => G.segment(points[i], point, P)).join('');
  const view = G.viewOf(P);
  const facesViewer = (angle) => Math.cos(angle) * view[0] + Math.sin(angle) * view[1] > 0;
  // A 70° wedge facing the camera is cut away; 290° of masonry is retained.
  const span = (360 - (CUT_TO - CUT_FROM)) / 4;
  const sectors = Array.from({ length: 4 }, (_, i) => [(CUT_TO + i * span) * DEG, (CUT_TO + (i + 1) * span) * DEG]);
  const inside = (angle, from, to) => [-1, 0, 1].some((turn) => angle + turn * Math.PI * 2 >= from && angle + turn * Math.PI * 2 <= to);

  // 01 · Cut limestone base, turned feet, metric rulers and engraved plate.
  const basePlan = { x: -80, y: -80, w: 160, d: 160, r: 9 };
  const base = slab('base.rock', 'base-roca', basePlan, -14, 10, 'lo');
  const rockRing = withTrench(G.roundedPlan(basePlan, 4), 6, -6);
  base.paths = G.extrude(rockRing, -14, 10, P, { convex: false, bevel: 0.65 });
  Object.assign(base.shape, G.A.extruded(rockRing, -14, 10));
  base.shape.ground = true; base.volumeM3 = pouShapeVolumeM3(base.shape);
  const groove = withTrench(G.roundedPlan(G.insetPlan(basePlan, 4), 4), 10, -10);
  base.details.push(line(G.onTop(groove, -4, P, true)));
  // Partition the carved rock into convex blocks around its straight drain
  // trench, so the lowered gallery can paint between the far and near stone.
  // The complete physical rock remains one recorded structural solid.
  const viewFloor = G.towardViewer(P);
  const clipRockPlan = (polygon, constant, side, normal = viewFloor) => {
    const output = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[(i + polygon.length - 1) % polygon.length], b = polygon[i];
      const da = side * (a[0] * normal[0] + a[1] * normal[1] - constant);
      const db = side * (b[0] * normal[0] + b[1] * normal[1] - constant);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        output.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
      if (db >= 0) output.push(b);
    }
    return output;
  };
  const facing = rockRing.map(([x, y], i) => {
    const next = rockRing[(i + 1) % rockRing.length];
    return (next[1] - y) * viewFloor[0] - (next[0] - x) * viewFloor[1] > 0;
  });
  const tagged = ([x, y], z) => [...G.iso([x, y, z], P), x, y, z];
  const edgeWorld = [], creaseWorld = [];
  for (let i = 0; i < rockRing.length; i++) {
    const a = rockRing[i], b = rockRing[(i + 1) % rockRing.length];
    const z = facing[i] ? -14 : -4;
    edgeWorld.push([tagged(a, z), tagged(b, z)]);
    if (facing[i]) creaseWorld.push([tagged(a, -4), tagged(b, -4)]);
    if (facing[i] !== facing[(i + rockRing.length - 1) % rockRing.length]) edgeWorld.push([tagged(a, -14), tagged(a, -4)]);
  }
  const wholeRock = base.shape;
  const xPlane = (constant, side) => ({ normal: [1, 0, 0], constant, side });
  const yPlane = (constant, side) => ({ normal: [0, 1, 0], constant, side });
  const strips = [[xPlane(-6, -1)], [xPlane(-6, 1), yPlane(-6, -1)], [xPlane(-6, 1), yPlane(6, 1)]];
  const rockDrawParts = strips.map((planes, i) => {
    let polygon = G.roundedPlan(basePlan, 4);
    for (const plane of planes) polygon = clipRockPlan(polygon, plane.constant, plane.side, plane.normal);
    const paths = G.extrude(polygon, -14, 10, P, { convex: false });
    paths.outline = edgeWorld.map((points) => G.clipProjectedLine(points, planes)).join('');
    paths.crease = creaseWorld.map((points) => G.clipProjectedLine(points, planes)).join('');
    const shape = G.A.extruded(polygon, -14, 10);
    return { ...base, id: i ? `base.rock.slice-${i}` : 'base.rock', physicalId: 'base.rock', physicalShape: wholeRock, paths, shape, shapes: [shape], detailClip: paths.fill, centre: [polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length, polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length, -9] };
  });
  parts.splice(parts.indexOf(base), 1, ...rockDrawParts);
  for (const [i, [x, y]] of G.corners(basePlan, 13).entries()) {
    const foot = turned(`base.foot-${i}`, 'base-roca', UP([x, y, 0]), [[-18, 0], [-18, 5.3], [-17, 5.3], [-15.3, 4.4, 1], [-14, 4.4], [-14, 0]], 'lo', { steps: 40 });
    foot.shape.ground = true; foot.details.push(line(G.ring(x, y, 3.8, -14, P)));
  }
  // Ruler of the 9,80 m inner diameter, majors every metre from the axis.
  const scale = slab('base.diameter-scale', 'base-roca', { x: -R_IN, y: 68, w: 2 * R_IN, d: 5, r: 0.6 }, -4, 0.7, 'lo');
  const ticks = G.topTicks(-R_IN, R_IN, 2, 5, 68, -3.3, [1.8, 3.6], P);
  scale.details.push(line(ticks.minor), line(ticks.major, 'mid'));
  // Ruler of the 13,75 m depth from the floor to the window sills.
  const vScale = slab('base.depth-scale', 'base-roca', { x: -75, y: -12, w: 4.3, d: 3.5, r: 0.5 }, -4, TOP + 2 + 4, 'lo');
  for (let m = 0; m <= TOP - Z0 + 1e-9; m += 2.5) {
    const major = Math.abs(m / 10 - Math.round(m / 10)) < 1e-9 || Math.abs(m - (TOP - Z0)) < 1e-9;
    vScale.details.push(line(G.segment([-70.7, -12, Z0 + m], [-70.7, major ? -8.5 : -10.3, Z0 + m], P), major ? 'mid' : 'lo'));
  }
  const plaquePlan = { x: -78, y: 8, w: 8, d: 64, r: 0.8 };
  const plaque = slab('base.engraved-plate', 'base-roca', plaquePlan, -4, 0.9, 'mid');
  plaque.details.push(line(G.planOutline(G.insetPlan(plaquePlan, 1), -3.1, P)));
  const engraving = { partId: plaque.id, transform: G.topMatrix([-72.5, 69], -3.05, P, 'y'), text: 'POU DE NEU · EL RENTONAR', size: 2.6 };
  const bowlProfile = [[-4, 5], [-4, R_OUT], [Z0, R_OUT], [Z0, R_IN], [0.3, 5], [-4, 5]];
  const bowl = turned('base.concave-bedrock-floor', 'base-roca', UP(), bowlProfile, 'lo', { steps: 96, fill: 'faces' });
  bowl.paths.outline = G.outlineOf(bowlProfile, UP(), P, { steps: 96, hole: [0.3, 5] }).outline;
  bowl.sector = { profile: bowlProfile, F: UP(), from: 0, to: Math.PI * 2, options: { steps: 96 } };
  bowl.details.push(line(G.ring(0, 0, R_IN, Z0, P)), line(G.ring(0, 0, 7, 0.4, P)));

  // 02 · 24 masonry sectors (13,75 m, Ø 9,80 m, 1,50 m wall), three window
  // frames N/W/E at the 13,75 m sills and six steps under the south ingress.
  const courseH = (TOP - Z0) / 6;
  const ingressFrom = (BEARING.S * DEG) - INGRESS_HALF / R_IN, ingressTo = (BEARING.S * DEG) + INGRESS_HALF / R_IN;
  for (let course = 0; course < 6; course++) {
    const z = Z0 + course * courseH;
    for (const [sector, [from, to]] of sectors.entries()) {
      const profile = [[z, R_IN], [z, R_OUT], [z + courseH, R_OUT], [z + courseH, R_IN], [z, R_IN]], a = (from + to) / 2;
      const part = add({ ...meta(`wall.course-${course}.sector-${sector}`, 'pou-cilindric', [(R_IN + R_OUT) / 2 * Math.cos(a), (R_IN + R_OUT) / 2 * Math.sin(a), z + courseH / 2]), paths: G.sectorLathe(profile, UP(), P, { from, to, steps: 112 }), shape: G.sectorShape(profile, UP(), from, to), sector: { profile, F: UP(), from, to, options: { steps: 112 } } });
      part.detailsOf = (from, to) => {
        const details = [];
        for (let row = 0; row < 3; row++) {
          const s = z + row * courseH / 3;
          details.push(line(G.arcOf(UP(), s, R_OUT, P, { from, to, trim: 0 })), line(G.arcOf(UP(), s, R_IN, P, { from, to, inward: true, trim: 0 })));
          for (let angle = from + (row % 2 ? 5 : 10) * DEG; angle < to; angle += 10 * DEG) {
            const facing = G.dot3([Math.cos(angle), Math.sin(angle), 0], G.viewOf(P));
            const radius = facing > 0 ? R_OUT : R_IN;
            const [x, y] = [radius * Math.cos(angle), radius * Math.sin(angle)];
            const d = G.segment([x, y, s], [x, y, s + courseH / 3], P);
            if (facing > 0) {
              const rib = G.ribsOf(UP(), s, s + courseH / 3, R_OUT, 1, P, { phase: angle, fade: [0.04, 0.45], seams: true }).find((entry) => entry.d === d);
              if (rib) details.push(line(rib.d, 'lo', rib.alpha));
            } else details.push(line(d, 'lo', G.fadeOf(-facing, [0.04, 0.45])));
          }
        }
        // South ingress (+10,00 m, 1,35 × 1,55 m) outlined on the inner face.
        const z0 = Math.max(z, INGRESS_Z), z1 = Math.min(z + courseH, INGRESS_Z + INGRESS_H);
        if (z0 < z1) {
          for (const angle of [ingressFrom, ingressTo]) if (inside(angle, from, to)) {
            const [x, y] = [R_IN * Math.cos(angle), R_IN * Math.sin(angle)];
            details.push(line(G.segment([x, y, z0], [x, y, z1], P), 'mid'));
          }
          for (const s of [INGRESS_Z, INGRESS_Z + INGRESS_H]) if (s >= z && s <= z + courseH) {
            const lo = Math.max(from, ingressFrom), hi = Math.min(to, ingressTo);
            if (lo < hi) details.push(line(G.arcOf(UP(), s, R_IN, P, { from: lo, to: hi, inward: true, trim: 0 }), 'mid'));
          }
        }
        return details;
      };
      part.details = part.detailsOf(from, to);
    }
  }
  for (const [i, bearing] of [BEARING.N, BEARING.W, BEARING.E].entries()) {
    const a = bearing * DEG, ring = rotatedRing((R_OUT + 2) * Math.cos(a), (R_OUT + 2) * Math.sin(a), 4, 2 * WINDOW_HALF + 6, a);
    const frame = prism(`wall.window-frame-${i}`, 'pou-cilindric', ring, TOP, WINDOW_H + 3);
    if (!facesViewer(a)) continue;
    const face = (u, z) => [(R_OUT + 4) * Math.cos(a) - u * Math.sin(a), (R_OUT + 4) * Math.sin(a) + u * Math.cos(a), z];
    const head = Array.from({ length: 9 }, (_, k) => { const u = -WINDOW_HALF + 2 * WINDOW_HALF * k / 8; return face(u, TOP + WINDOW_H - 1.5 + 1.5 * (1 - (u / WINDOW_HALF) ** 2)); });
    frame.details.push(line(polyline([face(-WINDOW_HALF, TOP + 0.5), ...head, face(WINDOW_HALF, TOP + 0.5), face(-WINDOW_HALF, TOP + 0.5)]), 'mid'));
    // North and east windows are blocked with masonry today; the west one is open.
    if (bearing !== BEARING.W) for (const z of [TOP + 4, TOP + 8, TOP + 12]) frame.details.push(line(G.segment(face(-WINDOW_HALF, z), face(WINDOW_HALF, z), P)));
  }
  for (let i = 0; i < 6; i++) prism(`wall.step-${i}`, 'pou-cilindric', G.annularSector(R_IN - 2.5, R_IN, (BEARING.S - 5.85) * DEG, (BEARING.S + 5.85) * DEG, 192), INGRESS_Z - 14 * (i + 1), 1.1, 'mid');

  // 03 · Six compacted snow strata up to 13,60 m, six straw layers, guide posts, blocks.
  for (const layer of layers) {
    const ice = disc(`ice.compacted-${layer.index}`, 'estrats-gel', 0, 0, layer.z, layer.height, layer.radius, layer.index === 0 ? 'lit' : 'hi');
    const skin = G.bandsOf([[layer.z, layer.radius], [layer.top, layer.radius]], [layer.z + layer.height * 0.42], UP(), P, { radius: () => layer.radius, slope: () => 0, steps: 96 });
    ice.paths.shades = Array.from({ length: 4 }, (_, shade) => skin.bands.map(({ paths }) => paths.shades[shade]).join(''));
    ice.details.push(...skin.bands.filter(({ seam }) => seam).map(({ seam }) => line(seam)));
    ice.paths.seamless = true;
    ice.dots.push(...G.dotsOf(UP(), layer.top, ICE_R - 3.2, 30, P, { all: true, fade: [0.04, 0.42] }));
    const straw = disc(`ice.insulating-straw-${layer.index}`, 'estrats-gel', 0, 0, layer.top, STRAW, STRAW_R, 'lo');
    const t = G.radialTicks(0, 0, STRAW_R - 0.3, 72, 6, layer.top + STRAW, [1.3, 2.7], P);
    straw.details.push(line(t.minor), line(t.major));
  }
  for (const [i, degrees] of [160, 250, 290].entries()) {
    const a = degrees * DEG; disc(`ice.guide-${i}`, 'estrats-gel', (R_IN - 2.2) * Math.cos(a), (R_IN - 2.2) * Math.sin(a), Z0, SNOW_TOP - Z0, 0.9);
  }
  for (let i = 0; i < 4; i++) {
    const a = (22 + i * 12) * DEG, r = (R_IN + R_OUT) / 2; prism(`ice.cut-block-${i}`, 'estrats-gel', rotatedRing(r * Math.cos(a), r * Math.sin(a), 4.6, 5.2, a), Z0, 4.8, 'hi');
  }

  // 04 · Corbelled false vault (phase 2), earth/rubble cover, apex hole and the
  // three visible phase-1 arch springers; the north-east one lies in the cut.
  const intR = sphereR(R_IN, TOP), intSlope = sphereSlope(R_IN, TOP);
  const extR = sphereR(EXT_R, EXT_C), extSlope = sphereSlope(EXT_R, EXT_C);
  const coverR = sphereR(COVER_R, EXT_C), coverSlope = sphereSlope(COVER_R, EXT_C);
  const outer = Array.from({ length: 25 }, (_, i) => { const s = TOP + (S_FLAT - TOP) * i / 24; return [s, extR(s), 1]; });
  const inner = Array.from({ length: 25 }, (_, i) => { const s = TOP + (S_HOLE - TOP) * i / 24; return [s, i === 24 ? HOLE : intR(s), 1]; });
  const domeProfile = [...outer, [S_FLAT, HOLE], ...inner.slice().reverse(), outer[0]];
  const coverProfile = [...outer.map(([s], i) => [s, coverR(s), i > 0 && i < outer.length - 1 ? 1 : 0]), ...outer.slice().reverse().map(([s, r], i) => [s, r, i > 0 && i < outer.length - 1 ? 1 : 0]), [TOP, coverR(TOP)]];
  const stoneSlope = (s, r) => r > intR(s) + 1 ? extSlope(s) : intSlope(s);
  const windowW = BEARING.W * DEG, windowSpan = WINDOW_HALF / R_IN;
  for (const [sector, [from, to]] of sectors.entries()) {
    const a = (from + to) / 2;
    const stone = sectorPart(`dome.stone-sector-${sector}`, 'volta-cupula', [30 * Math.cos(a), 30 * Math.sin(a), TOP + 27], domeProfile, from, to, 128, stoneSlope);
    stone.detailsOf = (from, to) => {
      const details = [TOP + 6, TOP + 13, TOP + 20, TOP + 27, TOP + 34, TOP + 41].map((s) => line(G.arcOf(UP(), s, extR(s), P, { from, to, slope: extSlope(s), least: 0, trim: 0 })));
      // West window jambs seen from inside, on the intrados below its arch.
      for (const angle of [windowW - windowSpan, windowW + windowSpan]) if (inside(angle, from, to))
        details.push(line(polyline(Array.from({ length: 7 }, (_, k) => { const s = TOP + (WINDOW_H - 1.5) * k / 6; return [intR(s) * Math.cos(angle), intR(s) * Math.sin(angle), s]; })), 'mid'));
      return details;
    };
    stone.details = stone.detailsOf(from, to);
  }
  for (const [sector, [from, to]] of [[99.5, 135], [135, 170.5], [189.5, 275], [275, 350.5]].map(([f, t]) => [f * DEG, t * DEG]).entries()) {
    const a = (from + to) / 2;
    const cover = sectorPart(`dome.cover-sector-${sector}`, 'volta-cupula', [32 * Math.cos(a), 32 * Math.sin(a), TOP + 28], coverProfile, from, to, 128, (s, r) => r > extR(s) + 0.3 ? coverSlope(s) : extSlope(s), 'hi');
    cover.detailsOf = (from, to) => [TOP + 6, TOP + 13, TOP + 20, TOP + 27, TOP + 34, TOP + 41].map((s) => line(G.arcOf(UP(), s, coverR(s), P, { from, to, slope: coverSlope(s), least: 0, trim: 0 })));
    cover.details = cover.detailsOf(from, to);
  }
  for (const [i, degrees] of [135, 225, 315].entries()) {
    const ring = G.annularSector(R_IN - 4, R_IN, (degrees - 4.7) * DEG, (degrees + 4.7) * DEG, 192);
    const springer = prism(`dome.arch-springer-${i}`, 'volta-cupula', ring, INGRESS_Z, TOP - INGRESS_Z);
    for (let z = INGRESS_Z + 7.5; z < TOP; z += 7.5) springer.details.push(line(G.ringSeam(ring, z, P)));
  }
  // Segmental head of the open west window, laid in sardinell on the intrados.
  const archOn = Array.from({ length: 9 }, (_, k) => { const s = TOP + WINDOW_H + 3 * k / 8; return [s, intR(s), 1]; });
  const archProfile = [...archOn, ...archOn.slice().reverse().map(([s, r]) => [s, r - 1.5, 1]), archOn[0]];
  sectorPart('dome.window-arch-w', 'volta-cupula', [-44, 0, TOP + WINDOW_H + 1.5], archProfile, windowW - windowSpan - 3 * DEG, windowW + windowSpan + 3 * DEG, 96, intSlope);
  const key = [[S_FLAT, HOLE], [S_FLAT, HOLE + 4], [S_FLAT + 2.5, HOLE + 4], [S_FLAT + 2.5, HOLE], [S_FLAT, HOLE]];
  sectorPart('dome.crown-ring', 'volta-cupula', [-3, -3, S_FLAT + 1.25], key, CUT_TO * DEG, (CUT_FROM + 360) * DEG, 96, null, 'hi');
  // Loose stones on the northern cover (the southern slope shows bare earth).
  for (let i = 0; i < 8; i++) {
    const a = [104, 112, 121, 129, 140, 149, 158, 166][i] * DEG, s = TOP + [8, 20, 12, 28, 6, 18, 24, 10][i];
    const r = Math.sqrt((COVER_R + 1.55) ** 2 - (s - EXT_C) ** 2), c = [r * Math.cos(a), r * Math.sin(a), s];
    const stone = add({ ...meta(`dome.cover-stone-${i}`, 'volta-cupula', c), paths: G.sphereOf(c, 1.6, P, { steps: 32 }), shape: G.A.ball(c, 1.6) }); stone.dots.push(G.iso(c, P));
  }
  for (const part of parts) if (part.sector && /^dome\.(stone|cover)-sector/.test(part.id)) part.sector.silhouette = { s: EXT_C, radialRatio: 1 };

  // 05 · Loading by the west window: timber gallows on the snow, sheave,
  // axle, hemp rope, hook and basket (generic gear, not documented on site).
  const ox = -26, zb = layers[5].top + STRAW;
  for (const [i, x] of [-12, 10].entries()) slab(`hatch.upright-${i}`, 'portell-empouar', { x: ox + x, y: -3.3, w: 2, d: 6.6, r: 0.35 }, zb, 26);
  for (const [i, y] of [-5.5, 4.5].entries()) slab(`hatch.tie-${i}`, 'portell-empouar', { x: ox - 10, y, w: 20, d: 1, r: 0.25 }, zb, 2);
  const sheaveF = G.frameAlong([ox, 0, zb + 24], [1, 0, 0]);
  const sheave = turned('hatch.turned-wooden-sheave', 'portell-empouar', sheaveF, [[-1.4, 0.65], [-1.4, 3.2], [-0.8, 3.2], [-0.4, 2.9, 1], [0.4, 2.9, 1], [0.8, 3.2], [1.4, 3.2], [1.4, 0.65], [-1.4, 0.65]], 'hi', { steps: 64 });
  sheave.details.push(line(G.circleOf(sheaveF, 1.4, 2.3, P)));
  const axleShape = G.A.lathe(sheaveF, [[-10, 0], [-10, 0.65], [10, 0.65], [10, 0]]);
  for (const [name, a, b] of [['rear', -10, -1.4], ['through', -1.4, 1.4], ['front', 1.4, 10]]) {
    const axle = turned(`hatch.axle.${name}`, 'portell-empouar', sheaveF, [[a, 0], [a, 0.65], [b, 0.65], [b, 0]], 'mid', { steps: 32 });
    axle.physicalId = 'hatch.axle'; axle.physicalShape = axleShape; axle.volumeM3 = pouShapeVolumeM3(axleShape);
  }
  const rope = [[ox - 4, -5, zb + 2], [ox, -3.5, zb + 24], ...Array.from({ length: 25 }, (_, i) => { const a = Math.PI - Math.PI * i / 24; return [ox, Math.cos(a) * 3.5, zb + 24 + Math.sin(a) * 3.5]; }), [ox, 3.5, zb + 12]];
  tube('hatch.hemp-rope', 'portell-empouar', rope, 0.23, 'mid', { rings: { pitch: 0.9, twist: 2.2, fade: [0.08, 0.5] }, free: [false, false] });
  tube('hatch.iron-hook', 'portell-empouar', G.fillet([[ox, 3.5, zb + 12], [ox, 3.5, zb + 10], [ox, 6.85, zb + 10], [ox, 6.85, zb + 8.5]], 0.65, 12), 0.36, 'hi', { maxLength: 20 });
  const basketF = UP([ox, 3.5, 0]);
  const basket = turned('hatch.snow-basket', 'portell-empouar', basketF, [[zb + 3.5, 0], [zb + 3.5, 2.2], [zb + 8.5, 3.8], [zb + 8.5, 2.9], [zb + 4, 1.9], [zb + 4, 0]], 'mid', { steps: 64 });
  basket.details.push(...G.ribsOf(basketF, zb + 3.5, zb + 8.5, 2.2, 24, P, { r1: 3.8, seams: true, fade: [0.06, 0.48] }).map(({ d, alpha }) => line(d, 'lo', alpha)));

  // 06 · South ingress tunnel (north is +Y): walls, segmental vault, today's
  // iron grille at the mouth, and esparto panniers (sàrries) on the rock.
  const startHalf = INGRESS_HALF + (MOUTH_HALF - INGRESS_HALF) * (R_OUT - R_IN) / (POU_DIMENSIONS.tunnelLength * U);
  for (const [i, side] of [-1, 1].entries()) {
    const ring = counterClockwise([...southFace(side * startHalf, side * (startHalf + 4), 4), [side * (MOUTH_HALF + 4), TUNNEL_END], [side * MOUTH_HALF, TUNNEL_END]]);
    prism(`door.tunnel-wall-${i}`, 'porta-extraccio', ring, INGRESS_Z, MOUTH_H);
  }
  const vaultRing = counterClockwise([...southFace(-(startHalf + 4), startHalf + 4, 16), [MOUTH_HALF + 4, TUNNEL_END], [-(MOUTH_HALF + 4), TUNNEL_END]]);
  const tunnelVault = prism('door.tunnel-vault', 'porta-extraccio', vaultRing, INGRESS_Z + MOUTH_H, 4, 'hi');
  tunnelVault.details.push(line(G.segment([-(MOUTH_HALF + 4), TUNNEL_END, INGRESS_Z + MOUTH_H + 2], [MOUTH_HALF + 4, TUNNEL_END, INGRESS_Z + MOUTH_H + 2], P)));
  const grille = slab('door.iron-grille', 'porta-extraccio', { x: -(MOUTH_HALF + 4), y: TUNNEL_END - 1.2, w: 2 * MOUTH_HALF + 8, d: 1.2, r: 0.3 }, INGRESS_Z, MOUTH_H + 4);
  for (let x = -MOUTH_HALF + 2; x < MOUTH_HALF; x += 2.6) grille.details.push(line(G.segment([x, TUNNEL_END - 1.2, INGRESS_Z + 0.4], [x, TUNNEL_END - 1.2, INGRESS_Z + MOUTH_H + 3.6], P)));
  for (const [i, z] of [6, 17].entries()) {
    const hinge = slab(`door.forged-hinge-${i}`, 'porta-extraccio', { x: -MOUTH_HALF - 2, y: TUNNEL_END - 1.7, w: 7, d: 0.5, r: 0.25 }, INGRESS_Z + z, 1.1, 'hi');
    hinge.dots.push(...[-MOUTH_HALF - 0.5, -MOUTH_HALF + 3].map((x) => G.iso([x, TUNNEL_END - 2.2, INGRESS_Z + z + 0.55], P)));
  }
  for (const [i, x] of [-45, 45].entries()) {
    const F = UP([x, -60, 0]);
    const bag = turned(`door.esparto-pannier-${i}`, 'porta-extraccio', F, [[-4, 0], [-4, 2.7], [2, 4.4, 1], [6, 3.8], [6, 3.3], [-3, 2.2], [-3, 0]], 'mid', { steps: 56 });
    bag.details.push(...G.ribsOf(F, -3, 6, 2.8, 28, P, { r1: 3.8, fade: [0.04, 0.42], seams: true }).map(({ d, alpha }) => line(d, 'lo', alpha)));
  }

  // 07 · Slab over the lowest point, the east drain gallery (0,50 × 0,70 m,
  // 29 m, drawn interrupted), its slab-roofed outlet and the meltwater jet.
  const grate = disc('drain.stone-grate', 'desaigue-fusio', 0, 0, 0.3, 1.1, 5, 'hi');
  for (let x = -3; x <= 3; x += 2) grate.details.push(line(G.planOutline({ x: x - 0.3, y: -3.7, w: 0.6, d: 7.4, r: 0.25 }, 1.4, P)));
  const drainRoute = G.fillet([[0, 0, 0.3], [0, 0, DRAIN_Z], [DRAIN_END, 0, DRAIN_Z]], 6, 16);
  // The vertical drop inside the bedrock hole is its own chunk: only the
  // horizontal run lies under the north trench wall.
  const drainBreaks = [0.3 - DRAIN_Z - 6.5];
  let walkedDrain = 0;
  for (let i = 1; i < drainRoute.length; i++) {
    const a = drainRoute[i - 1], b = drainRoute[i], length = G.len3(G.sub3(b, a));
    const na = a[0] * viewFloor[0] + a[1] * viewFloor[1], nb = b[0] * viewFloor[0] + b[1] * viewFloor[1];
    for (const boundary of [6, 8, 10]) if (na < boundary && nb >= boundary) drainBreaks.push(walkedDrain + length * (boundary - na) / (nb - na));
    walkedDrain += length;
  }
  tube('drain.subterranean-duct', 'desaigue-fusio', drainRoute, 3, 'mid', { maxLength: 18, breaks: drainBreaks });
  const flangeF = G.frameAlong([DRAIN_END, 0, DRAIN_Z], [1, 0, 0]);
  const flange = turned('drain.terminal-flange', 'desaigue-fusio', flangeF, [[0, 2.2], [0, 4.6], [4, 4.6], [4, 2.2], [0, 2.2]], 'hi', { steps: 40 });
  flange.dots.push(...G.dotsOf(flangeF, 4, 3.5, 6, P, { all: true }));
  const jetX = DRAIN_END + 4;
  tube('drain.free-water-jet', 'desaigue-fusio', Array.from({ length: 19 }, (_, i) => { const t = i / 18; return [jetX + t * 10, 0, DRAIN_Z - 6 * t * t]; }), (t) => 2.2 - 0.9 * t, 'hi', { maxLength: 20, free: [false, true], ends: [true, false] });

  const split = G.splitWrappingParts(parts, P);
  parts.splice(0, parts.length, ...split);
  const recorder = G.recordRuralParts(parts, P, { order: POU_EXPLODE_ORDER, spring: POU_SPRING });
  for (const route of routes) recorder.route(route.id, route.points, route.radius, { piece: route.assembly, move: byId[route.assembly].move, free: route.free, ends: route.ends });
  parts.sort((a, b) => G.depthOf(a.centre, P) - G.depthOf(b.centre, P));
  const physicalSolidCount = new Set(parts.map(({ physicalId }) => physicalId)).size;
  const physicalParts = [...new Map(parts.map((part) => [part.physicalId, part])).values()];
  const assemblyVolumes = Object.fromEntries(assemblies.map(({ id }) => [id, physicalParts.filter((part) => part.assembly === id).reduce((sum, part) => sum + part.volumeM3, 0)]));
  return { P, width, height, parts, backParts: parts.filter(({ layer }) => layer === 'back'), frontParts: parts.filter(({ layer }) => layer === 'front'), halo: G.haloOf(basePlan, -18, 6, P), engraving, assemblies, solidCount: physicalSolidCount, physicalSolidCount, renderItemCount: parts.length, recorder, routes, assemblyVolumes, effect: { iceTops: layers.map((l) => l.top), iceRadius: ICE_R, iceMove: byId['estrats-gel'].move, drainMove: byId['desaigue-fusio'].move, drainFloorZ: DRAIN_Z, drainOrigin: [jetX, 0, DRAIN_Z], drainRoute, iceLayers: layers }, physics: pouNeuState({ season, elapsedHours, shares, volumes: assemblyVolumes }) };
}

export function orderPouNeuParts(scene, shares = {}, prepared) {
  return G.sortRuralParts(scene.parts, scene.P, shares, prepared);
}
