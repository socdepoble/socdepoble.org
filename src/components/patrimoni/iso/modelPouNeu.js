/** Didactic Cava de Dalt reconstruction: supplied dimensions, estimated physics. */
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
export const POU_DIMENSIONS = Object.freeze({ depth: 11.2, diameter: 8.4, innerRadius: 4.2, wall: 0.6, cutawayDegrees: 240 });
export const POU_SPRING = Object.freeze({ stiffness: 64, damping: 16, substeps: 4, stagger: 0 });
// Structural volumes are derived from the actual rest plans/meridians.
// modelPouNeu.test.js checks these compiled pure-model values against geometry.
// Structural density is the dominant material of each mixed assembly.
export const POU_ASSEMBLIES = Object.freeze([
  { id: 'base-roca', move: [0, 0, 0], z: -11.6, density: 2350, volume: 119.15940883138194 },
  { id: 'pou-cilindric', move: [0, 0, 8], z: -5.6, density: 2350, volume: 138.76531643600495 },
  { id: 'estrats-gel', move: [0, 0, 38], z: -6.3, density: 635, volume: 0 },
  { id: 'volta-cupula', move: [0, 0, 84], z: 1.8, density: 2250, volume: 59.14378675911612 },
  { id: 'portell-empouar', move: [0, 0, 108], z: 5.2, density: 650, volume: 0.3991964307530307 },
  { id: 'porta-extraccio', move: [36, 38, 8], z: -7.7, density: 2200, volume: 4.72355708429229 },
  { id: 'desaigue-fusio', move: [0, 0, -34], z: -11.3, density: 2350, volume: 0.4999229808078812 },
]);
export const POU_EXPLODE_ORDER = Object.freeze(['portell-empouar', 'volta-cupula', 'estrats-gel', 'porta-extraccio', 'pou-cilindric', 'desaigue-fusio', 'base-roca']);
export function iceLayersOf(season = 'winter', elapsedHours = 0) {
  const retained = season === 'summer' ? 0.76 : 1, densities = [720, 686, 652, 618, 584, 550];
  const area = Math.PI * 3.85 ** 2;
  const heat = season === 'summer' ? 0.34 * (2 * Math.PI * 4.2 * 11.2 + Math.PI * 4.2 ** 2) * 24 : 0;
  const initial = densities.reduce((s, rho) => s + rho * area * 1.38 * retained, 0);
  const remaining = Math.max(0.05, 1 - heat * 3600 / 334000 * clamp(elapsedHours, 0, 720) / initial);
  let z = 0.3 + (38.5 - 5) / 37 * 1.7;
  return densities.map((density, index) => {
    const height = 13.8 * retained * remaining;
    const layer = { index, z, height, top: z + height, radius: 38.5, density, volumeM3: area * height / 10, massKg: density * area * height / 10 };
    z += height + 1.3; return layer;
  });
}
/** m=ρV, melt L/h=Q watts·3600/Lf; water≈1 kg/L. No sensors are implied. */
export function pouNeuState({ season = 'winter', assembly = 'estrats-gel', shares = {}, elapsedHours = 0, volumes } = {}) {
  const selected = POU_ASSEMBLIES.find(({ id }) => id === assembly) ?? POU_ASSEMBLIES[2];
  const layers = iceLayersOf(season, elapsedHours);
  const mass = layers.reduce((s, l) => s + l.massKg, 0), volume = layers.reduce((s, l) => s + l.volumeM3, 0);
  const summer = season === 'summer', temperature = summer ? 0 : -2, ambientTemperature = summer ? 24 : 4;
  const conductance = 0.34, area = 2 * Math.PI * 4.2 * 11.2 + Math.PI * 4.2 ** 2;
  const heatWatts = summer ? conductance * area * (ambientTemperature - temperature) : 0;
  const snow = selected.id === 'estrats-gel';
  const snowZ = layers.reduce((sum, layer) => sum + layer.massKg * ((layer.z + layer.height / 2) / 10 - 11.2), 0) / mass;
  const z = snow ? snowZ : selected.z;
  return { season, assembly: selected.id, z, explodedZ: z + selected.move[2] * clamp(shares[selected.id] ?? 0) / 10, temperature: snow || selected.id === 'desaigue-fusio' ? temperature : summer ? 10 : 1, density: snow ? mass / volume : selected.density, massTonnes: snow ? mass / 1000 : (volumes?.[selected.id] ?? selected.volume) * selected.density / 1000, drainageLh: heatWatts * 3600 / 334000, heatWatts, totalIceMassTonnes: mass / 1000, iceVolumeM3: volume, ambientTemperature, conductance, latentHeatJkg: 334000, estimated: true, densityScope: snow ? 'bulk-compacted-snow' : 'dominant-material', massScope: snow ? 'stored-strata' : 'assembly-volume' };
}
const rotatedRing = (cx, cy, along, across, angle) => {
  const a = [Math.cos(angle), Math.sin(angle)], b = [-a[1], a[0]];
  return [[-along / 2, -across / 2], [along / 2, -across / 2], [along / 2, across / 2], [-along / 2, across / 2]].map(([x, y]) => [cx + x * a[0] + y * b[0], cy + x * a[1] + y * b[1]]);
};
/** Rest geometry and exact shape descriptors; rigid vectors feed animation/audit. */
export function buildPouNeuScene({ azimuth = 45, width = 760, height = 720, season = 'winter', elapsedHours = 0, shares = {} } = {}) {
  const assemblies = POU_ASSEMBLIES.map((a) => ({ ...a, offset: G.mul3(a.move, clamp(shares[a.id] ?? 0)) }));
  const byId = Object.fromEntries(assemblies.map((a) => [a.id, a]));
  const P = G.fitProjection(G.boxCorners({ x: -69, y: -68, w: 151, d: 150 }, -48, 282), width, height, { pad: 22, azimuth: clamp(azimuth, 25, 65), elevation: 32 });
  const parts = [], routes = [], layers = iceLayersOf(season, elapsedHours);
  const line = (d, tone = 'lo', alpha = 1) => ({ d, tone, alpha });
  const meta = (id, assembly, centre, tone = 'mid', extra = {}) => ({ id, physicalId: id, assembly, centre, tone, move: byId[assembly].move, layer: ['base-roca', 'estrats-gel', 'desaigue-fusio'].includes(assembly) ? 'back' : 'front', details: [], dots: [], ...extra });
  const add = (part) => { part.volumeM3 ??= pouShapeVolumeM3(part.shape) * (part.sector ? (part.sector.to - part.sector.from) / (Math.PI * 2) : 1); part.shapes ??= [part.shape]; for (const shape of part.shapes) Object.assign(shape, { name: part.id, piece: part.assembly, ride: part.assembly, move: part.move }); parts.push(part); return part; };
  const slab = (id, assembly, plan, z, h, tone = 'mid') => add({ ...meta(id, assembly, [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], tone), paths: G.slabOf(plan, z, h, P, 4, Math.min(0.65, h / 4)), shape: G.A.slab(plan, z, h) });
  const prism = (id, assembly, ring, z, h, tone = 'mid') => add({ ...meta(id, assembly, [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length, z + h / 2], tone), paths: G.extrude(ring, z, h, P, { convex: false, bevel: Math.min(0.5, h / 4) }), shape: G.A.extruded(ring, z, h) });
  const turned = (id, assembly, F, profile, tone = 'mid', options = {}) => add({ ...meta(id, assembly, G.add3(F.o, G.mul3(F.a, (Math.min(...profile.map(([s]) => s)) + Math.max(...profile.map(([s]) => s))) / 2)), tone), paths: G.lathe(profile, F, P, options), shape: G.A.lathe(F, profile) });
  const disc = (id, assembly, x, y, z, h, r, tone = 'mid') => turned(id, assembly, UP([x, y, 0]), [[z, 0], [z, r], [z + h, r], [z + h, 0]], tone, { steps: 64, bevel: 0.35 });
  const tube = (id, assembly, route, radius, tone = 'hi', options = {}) => {
    const volumeM3 = pouShapeVolumeM3(G.A.tube(route, radius));
    routes.push({ id, assembly, points: route, radius, free: options.free ?? [false, false], ends: options.ends ?? [true, true] });
    G.tubePieces(route, radius, P, { maxLength: options.maxLength ?? 22, spacing: 0.7, rings: options.rings ?? null, breaks: options.breaks ?? [] }).forEach((piece, chunk) => add({ ...meta(`${id}:${chunk}`, assembly, piece.mid, tone, { physicalId: id, route: id, chunk, kind: 'tube', volumeM3 }), paths: { fill: piece.body, shades: [piece.shade, '', '', ''], top: piece.shine, outline: piece.edges, crease: '' }, tube: piece, shape: G.A.tube(piece.points, piece.radii), details: piece.rings.map(({ d, alpha }) => line(d, 'lo', alpha)) }));
  };
  const sectors = Array.from({ length: 4 }, (_, i) => [(105 + i * 60) * DEG, (165 + i * 60) * DEG]);
  // 01 · Cut limestone base, turned feet, metric rulers and engraved plate.
  const basePlan = { x: -65, y: -65, w: 130, d: 130, r: 7 };
  const base = slab('base.rock', 'base-roca', basePlan, -9, 5, 'lo');
  const rockRing = [];
  for (const point of G.roundedPlan(basePlan, 4)) {
    rockRing.push(point);
    if (Math.abs(point[0] - 65) < 0.001 && Math.abs(point[1] + 58) < 0.001)
      rockRing.push([65, 22], [8, 22], [8, -8], [-8, -8], [-8, 38], [65, 38]);
  }
  base.paths = G.extrude(rockRing, -9, 5, P, { convex: false, bevel: 0.65 });
  Object.assign(base.shape, G.A.extruded(rockRing, -9, 5));
  base.shape.ground = true; base.volumeM3 = pouShapeVolumeM3(base.shape);
  const groove = [];
  for (const point of G.roundedPlan(G.insetPlan(basePlan, 4), 4)) {
    groove.push(point);
    if (Math.abs(point[0] - 61) < 0.001 && Math.abs(point[1] + 58) < 0.001)
      groove.push([61, 18], [12, 18], [12, -12], [-12, -12], [-12, 42], [61, 42]);
  }
  base.details.push(line(G.onTop(groove, -4, P, true)));
  // Partition the carved rock into convex blocks around its actual L-shaped
  // trench. A lowered grate
  // and its conductor can then paint between the far and near stone surfaces.
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
    const z = facing[i] ? -9 : -4;
    edgeWorld.push([tagged(a, z), tagged(b, z)]);
    if (facing[i]) creaseWorld.push([tagged(a, -4), tagged(b, -4)]);
    if (facing[i] !== facing[(i + rockRing.length - 1) % rockRing.length]) edgeWorld.push([tagged(a, -9), tagged(a, -4)]);
  }
  const wholeRock = base.shape;
  const xPlane = (constant, side) => ({ normal: [1, 0, 0], constant, side });
  const yPlane = (constant, side) => ({ normal: [0, 1, 0], constant, side });
  const strips = [[xPlane(-8, -1)], [xPlane(-8, 1), yPlane(-8, -1)], [xPlane(-8, 1), yPlane(38, 1)], [xPlane(8, 1), yPlane(-8, 1), yPlane(22, -1)]];
  const rockDrawParts = strips.map((planes, i) => {
    let polygon = G.roundedPlan(basePlan, 4);
    for (const plane of planes) polygon = clipRockPlan(polygon, plane.constant, plane.side, plane.normal);
    const paths = G.extrude(polygon, -9, 5, P, { convex: false });
    paths.outline = edgeWorld.map((points) => G.clipProjectedLine(points, planes)).join('');
    paths.crease = creaseWorld.map((points) => G.clipProjectedLine(points, planes)).join('');
    const shape = G.A.extruded(polygon, -9, 5);
    return { ...base, id: i ? `base.rock.slice-${i}` : 'base.rock', physicalId: 'base.rock', physicalShape: wholeRock, paths, shape, shapes: [shape], detailClip: paths.fill, centre: [polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length, polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length, -6.5] };
  });
  parts.splice(parts.indexOf(base), 1, ...rockDrawParts);
  for (const [i, [x, y]] of G.corners(basePlan, 13).entries()) {
    const foot = turned(`base.foot-${i}`, 'base-roca', UP([x, y, 0]), [[-13, 0], [-13, 5.3], [-12, 5.3], [-10.3, 4.4, 1], [-9, 4.4], [-9, 0]], 'lo', { steps: 40 });
    foot.shape.ground = true; foot.details.push(line(G.ring(x, y, 3.8, -9, P)));
  }
  const scale = slab('base.diameter-scale', 'base-roca', { x: -42, y: 56, w: 84, d: 5, r: 0.6 }, -4, 0.7, 'lo');
  const ticks = G.topTicks(-42, 42, 2, 5, 56, -3.3, [1.8, 3.6], P);
  scale.details.push(line(ticks.minor), line(ticks.major, 'mid'));
  const vScale = slab('base.depth-scale', 'base-roca', { x: -58, y: -2, w: 4.3, d: 3.5, r: 0.5 }, -4, 116, 'lo');
  for (let z = 0; z <= 112; z += 2) vScale.details.push(line(G.segment([-53.7, -2, z], [-53.7, z % 10 === 0 ? 1.5 : -0.3, z], P), z % 10 === 0 ? 'mid' : 'lo'));
  const plaquePlan = { x: -62, y: 3, w: 8, d: 60, r: 0.8 };
  const plaque = slab('base.engraved-plate', 'base-roca', plaquePlan, -4, 0.9, 'mid');
  plaque.details.push(line(G.planOutline(G.insetPlan(plaquePlan, 1), -3.1, P)));
  const engraving = { partId: plaque.id, transform: G.topMatrix([-56.5, 60], -3.05, P, 'y'), text: 'CAVA DE DALT · RENTADOR', size: 2.6 };
  const bowlProfile = [[-4, 5], [-4, 48], [2, 48], [2, 42], [0.3, 5], [-4, 5]];
  const bowl = turned('base.concave-bedrock-floor', 'base-roca', UP(), bowlProfile, 'lo', { steps: 96, fill: 'faces' });
  bowl.paths.outline = G.outlineOf(bowlProfile, UP(), P, { steps: 96, hole: [0.3, 5] }).outline;
  bowl.sector = { profile: bowlProfile, F: UP(), from: 0, to: Math.PI * 2, options: { steps: 96 } };
  bowl.details.push(line(G.ring(0, 0, 42, 2, P)), line(G.ring(0, 0, 7, 0.4, P)));

  // 02 · 24 masonry sectors, three buttresses, six inner relief steps.
  const courseH = 110 / 6;
  for (let course = 0; course < 6; course++) {
    const z = 2 + course * courseH;
    for (const [sector, [from, to]] of sectors.entries()) {
      const profile = [[z, 42], [z, 48], [z + courseH, 48], [z + courseH, 42], [z, 42]], a = (from + to) / 2;
      const part = add({ ...meta(`wall.course-${course}.sector-${sector}`, 'pou-cilindric', [45 * Math.cos(a), 45 * Math.sin(a), z + courseH / 2]), paths: G.sectorLathe(profile, UP(), P, { from, to, steps: 112 }), shape: G.sectorShape(profile, UP(), from, to), sector: { profile, F: UP(), from, to, options: { steps: 112 } } });
      part.detailsOf = (from, to) => {
        const details = [];
      for (let row = 0; row < 3; row++) {
        const s = z + row * courseH / 3;
        details.push(line(G.arcOf(UP(), s, 48, P, { from, to, trim: 0 })), line(G.arcOf(UP(), s, 42, P, { from, to, inward: true, trim: 0 })));
        for (let angle = from + (row % 2 ? 5 : 10) * DEG; angle < to; angle += 10 * DEG) {
          const facing = G.dot3([Math.cos(angle), Math.sin(angle), 0], G.viewOf(P));
          const radius = facing > 0 ? 48 : 42;
          const [x, y] = [radius * Math.cos(angle), radius * Math.sin(angle)];
          const d = G.segment([x, y, s], [x, y, s + courseH / 3], P);
          if (facing > 0) {
            const rib = G.ribsOf(UP(), s, s + courseH / 3, 48, 1, P, { phase: angle, fade: [0.04, 0.45], seams: true }).find((entry) => entry.d === d);
            if (rib) details.push(line(rib.d, 'lo', rib.alpha));
          } else details.push(line(d, 'lo', G.fadeOf(-facing, [0.04, 0.45])));
        }
      }
        return details;
      };
      part.details = part.detailsOf(from, to);
    }
  }
  for (const [i, degrees] of [150, 225, 300].entries()) {
    const a = degrees * DEG, ring = rotatedRing(52.5 * Math.cos(a), 52.5 * Math.sin(a), 9, 6, a);
    const part = prism(`wall.buttress-${i}`, 'pou-cilindric', ring, 2, 88);
    for (let z = 13; z < 90; z += 11) part.details.push(line(G.ringSeam(ring, z, P)));
  }
  for (let i = 0; i < 6; i++) prism(`wall.interior-rung-${i}`, 'pou-cilindric', G.annularSector(40.2, 42, 109 * DEG, 121 * DEG, 192), 12 + i * 16, 1.1, 'mid');

  // 03 · Six compacted snow strata, six straw/fern layers, guide posts, blocks.
  for (const layer of layers) {
    const ice = disc(`ice.compacted-${layer.index}`, 'estrats-gel', 0, 0, layer.z, layer.height, layer.radius, layer.index === 0 ? 'lit' : 'hi');
    const skin = G.bandsOf([[layer.z, layer.radius], [layer.top, layer.radius]], [layer.z + layer.height * 0.42], UP(), P, { radius: () => layer.radius, slope: () => 0, steps: 96 });
    ice.paths.shades = Array.from({ length: 4 }, (_, shade) => skin.bands.map(({ paths }) => paths.shades[shade]).join(''));
    ice.details.push(...skin.bands.filter(({ seam }) => seam).map(({ seam }) => line(seam)));
    ice.paths.seamless = true;
    ice.dots.push(...G.dotsOf(UP(), layer.top, 35.3, 30, P, { all: true, fade: [0.04, 0.42] }));
    const straw = disc(`ice.insulating-straw-${layer.index}`, 'estrats-gel', 0, 0, layer.top, 1.3, 39.1, 'lo');
    const t = G.radialTicks(0, 0, 38.8, 72, 6, layer.top + 1.3, [1.3, 2.7], P);
    straw.details.push(line(t.minor), line(t.major));
  }
  for (const [i, degrees] of [150, 225, 300].entries()) {
    const a = degrees * DEG; disc(`ice.guide-${i}`, 'estrats-gel', 40.4 * Math.cos(a), 40.4 * Math.sin(a), 2, 98, 0.9);
  }
  for (let i = 0; i < 4; i++) {
    const a = (12 + i * 20) * DEG; prism(`ice.cut-block-${i}`, 'estrats-gel', rotatedRing(43 * Math.cos(a), 43 * Math.sin(a), 4.6, 5.2, a), 2, 4.8, 'hi');
  }

  // 04 · Analytic hemispherical stone vault and separately revolved tile skin.
  const outerR = (s) => 48 * Math.sqrt(Math.max(0.0001, 1 - ((s - 112) / 48) ** 2));
  const innerR = (s) => 42 * Math.sqrt(Math.max(0.0001, 1 - ((s - 112) / 42) ** 2));
  const outerSlope = (s) => -48 * (s - 112) / (48 ** 2 * Math.sqrt(Math.max(0.0001, 1 - ((s - 112) / 48) ** 2)));
  const innerSlope = (s) => -42 * (s - 112) / (42 ** 2 * Math.sqrt(Math.max(0.0001, 1 - ((s - 112) / 42) ** 2)));
  const outer = Array.from({ length: 25 }, (_, i) => { const s = 112 + 44 * i / 24; return [s, outerR(s), 1]; });
  const inner = Array.from({ length: 25 }, (_, i) => { const s = 112 + 39 * i / 24; return [s, innerR(s), 1]; });
  const domeProfile = [...outer, [156, 8], [151, 8], ...inner.slice().reverse(), outer[0]];
  const tileR = (s) => Math.sqrt(Math.max(0.0001, 49 ** 2 - (s - 112) ** 2));
  const tileSlope = (s) => -(s - 112) / tileR(s);
  const tileProfile = [...outer.map(([s], i) => [s, tileR(s), i > 0 && i < outer.length - 1 ? 1 : 0]), ...outer.slice().reverse().map(([s, r], i) => [s, r, i > 0 && i < outer.length - 1 ? 1 : 0]), [112, 49]];
  for (const [sector, [from, to]] of sectors.entries()) {
    const a = (from + to) / 2;
    const stone = add({ ...meta(`dome.stone-sector-${sector}`, 'volta-cupula', [25 * Math.cos(a), 25 * Math.sin(a), 139]), paths: G.sectorLathe(domeProfile, UP(), P, { from, to, steps: 128, smooth: { slope: (s, r) => r > innerR(s) + 1 ? outerSlope(s) : innerSlope(s) } }), shape: G.sectorShape(domeProfile, UP(), from, to), sector: { profile: domeProfile, F: UP(), from, to, options: { steps: 128, smooth: { slope: (s, r) => r > innerR(s) + 1 ? outerSlope(s) : innerSlope(s) } } } });
    const tile = add({ ...meta(`dome.arabic-tile-sector-${sector}`, 'volta-cupula', [26 * Math.cos(a), 26 * Math.sin(a), 140], 'hi'), paths: G.sectorLathe(tileProfile, UP(), P, { from, to, steps: 128, smooth: { slope: (s, r) => r > outerR(s) + 0.3 ? tileSlope(s) : outerSlope(s) } }), shape: G.sectorShape(tileProfile, UP(), from, to), sector: { profile: tileProfile, F: UP(), from, to, options: { steps: 128, smooth: { slope: (s, r) => r > outerR(s) + 0.3 ? tileSlope(s) : outerSlope(s) } } } });
    stone.detailsOf = (from, to) => [117, 123, 129, 135, 141].map((s) => line(G.arcOf(UP(), s, outerR(s), P, { from, to, slope: outerSlope(s), least: 0, trim: 0 })));
    tile.detailsOf = (from, to) => [117, 123, 129, 135, 141].map((s) => line(G.arcOf(UP(), s, tileR(s), P, { from, to, slope: tileSlope(s), least: 0, trim: 0 })));
    stone.details = stone.detailsOf(from, to); tile.details = tile.detailsOf(from, to);
  }
  for (const [i, degrees] of [125, 185, 245, 305].entries()) {
    const a = degrees * DEG, from = a - 0.8 * DEG, to = a + 0.8 * DEG;
    const onTile = outer.map(([z]) => [z, tileR(z), 1]);
    const crown = outer.map(([z]) => {
      const slope = tileSlope(z), norm = Math.hypot(1, slope);
      return [z - slope / norm * 0.8, tileR(z) + 0.8 / norm, 1];
    });
    const profile = [...crown, ...onTile.slice().reverse(), crown[0]];
    add({ ...meta(`dome.radial-rib-${i}`, 'volta-cupula', [29 * Math.cos(a), 29 * Math.sin(a), 140]), paths: G.sectorLathe(profile, UP(), P, { from, to, steps: 128, smooth: { slope: tileSlope } }), shape: G.sectorShape(profile, UP(), from, to), sector: { profile, F: UP(), from, to, options: { steps: 128, smooth: { slope: tileSlope } } } });
  }
  const key = [[156, 8], [156, 12], [159, 12], [159, 8], [156, 8]];
  add({ ...meta('dome.keystone-ring', 'volta-cupula', [-3, -3, 157.5], 'hi'), paths: G.sectorLathe(key, UP(), P, { from: 105 * DEG, to: 345 * DEG, steps: 96 }), shape: G.sectorShape(key, UP(), 105 * DEG, 345 * DEG), sector: { profile: key, F: UP(), from: 105 * DEG, to: 345 * DEG, options: { steps: 96 } } });
  for (let i = 0; i < 8; i++) {
    const a = (115 + i * 30) * DEG, c = [49.75 * Math.cos(a), 49.75 * Math.sin(a), 112];
    const p = add({ ...meta(`dome.perimeter-pin-${i}`, 'volta-cupula', c), paths: G.sphereOf(c, 0.75, P, { steps: 32 }), shape: G.A.ball(c, 0.75) }); p.dots.push(G.iso(c, P));
  }
  for (const part of parts) if (part.sector && /^dome\.(stone|arabic|radial)/.test(part.id)) part.sector.silhouette = { s: 112, radialRatio: 1 };

  // 05 · Upper filling hatch, turned sheave, axle, hemp rope, hook and basket.
  for (const [i, x] of [-9, 7].entries()) slab(`hatch.upright-${i}`, 'portell-empouar', { x, y: -2, w: 2, d: 4, r: 0.35 }, 159, 11);
  for (const [i, y] of [-5.5, 4.5].entries()) slab(`hatch.tie-${i}`, 'portell-empouar', { x: -7, y, w: 14, d: 1, r: 0.25 }, 159, 2);
  const sheaveF = G.frameAlong([0, 0, 167], [1, 0, 0]);
  const sheave = turned('hatch.turned-wooden-sheave', 'portell-empouar', sheaveF, [[-1.4, 0.65], [-1.4, 3.2], [-0.8, 3.2], [-0.4, 2.9, 1], [0.4, 2.9, 1], [0.8, 3.2], [1.4, 3.2], [1.4, 0.65], [-1.4, 0.65]], 'hi', { steps: 64 });
  sheave.details.push(line(G.circleOf(sheaveF, 1.4, 2.3, P)));
  const axleShape = G.A.lathe(sheaveF, [[-7, 0], [-7, 0.65], [7, 0.65], [7, 0]]);
  for (const [name, a, b] of [['rear', -7, -1.4], ['through', -1.4, 1.4], ['front', 1.4, 7]]) {
    const axle = turned(`hatch.axle.${name}`, 'portell-empouar', sheaveF, [[a, 0], [a, 0.65], [b, 0.65], [b, 0]], 'mid', { steps: 32 });
    axle.physicalId = 'hatch.axle'; axle.physicalShape = axleShape; axle.volumeM3 = pouShapeVolumeM3(axleShape);
  }
  const rope = [[-4, -5, 161], [0, -3.5, 167], ...Array.from({ length: 25 }, (_, i) => { const a = Math.PI - Math.PI * i / 24; return [0, Math.cos(a) * 3.5, 167 + Math.sin(a) * 3.5]; }), [0, 3.5, 140]];
  tube('hatch.hemp-rope', 'portell-empouar', rope, 0.23, 'mid', { rings: { pitch: 0.9, twist: 2.2, fade: [0.08, 0.5] }, free: [false, false] });
  tube('hatch.iron-hook', 'portell-empouar', G.fillet([[0, 3.5, 140], [0, 3.5, 138], [0, 6.85, 138], [0, 6.85, 136.5]], 0.65, 12), 0.36, 'hi', { maxLength: 20 });
  const basketF = UP([0, 3.5, 0]);
  const basket = turned('hatch.snow-basket', 'portell-empouar', basketF, [[131.5, 0], [131.5, 2.2], [136.5, 3.8], [136.5, 2.9], [132, 1.9], [132, 0]], 'mid', { steps: 64 });
  basket.details.push(...G.ribsOf(basketF, 131.5, 136.5, 2.2, 24, P, { r1: 3.8, seams: true, fade: [0.06, 0.48] }).map(({ d, alpha }) => line(d, 'lo', alpha)));

  // 06 · North is +Y in this illustrative coordinate system.
  for (const [i, x] of [-12, 8].entries()) slab(`door.chamfered-jamb-${i}`, 'porta-extraccio', { x, y: 46, w: 4, d: 6.7, r: 0.6 }, 2, 49);
  slab('door.chamfered-lintel', 'porta-extraccio', { x: -12, y: 46, w: 24, d: 6, r: 0.65 }, 51, 4.5, 'hi');
  const leaf = slab('door.timber-leaf', 'porta-extraccio', { x: -7.8, y: 51.5, w: 15.6, d: 1.2, r: 0.3 }, 2.2, 48.5);
  for (let x = -5.8; x < 8; x += 2.6) leaf.details.push(line(G.segment([x, 52.7, 2.2], [x, 52.7, 50.7], P)));
  for (const [i, z] of [29, 44].entries()) {
    const hinge = slab(`door.forged-hinge-${i}`, 'porta-extraccio', { x: -9, y: 52.7, w: 7, d: 0.5, r: 0.25 }, z, 1.1, 'hi');
    hinge.dots.push(...[-7.5, -3].map((x) => G.iso([x, 53.2, z + 0.55], P)));
  }
  for (const [i, x] of [-16, 17].entries()) {
    const F = UP([x, 51, 0]);
    const bag = turned(`door.esparto-pannier-${i}`, 'porta-extraccio', F, [[-4, 0], [-4, 2.7], [2, 4.4, 1], [6, 3.8], [6, 3.3], [-3, 2.2], [-3, 0]], 'mid', { steps: 56 });
    bag.details.push(...G.ribsOf(F, -3, 6, 2.8, 28, P, { r1: 3.8, fade: [0.04, 0.42], seams: true }).map(({ d, alpha }) => line(d, 'lo', alpha)));
  }

  // 07 · Floor grate, subterranean drain, flange and ballistic outflow.
  const grate = disc('drain.stone-grate', 'desaigue-fusio', 0, 0, 0.3, 1.1, 5, 'hi');
  for (let x = -3; x <= 3; x += 2) grate.details.push(line(G.planOutline({ x: x - 0.3, y: -3.7, w: 0.6, d: 7.4, r: 0.25 }, 1.4, P)));
  const drainRoute = G.fillet([[0, 0, 0.3], [0, 0, -7], [0, 30, -7], [68, 30, -7]], 8, 16);
  const drainBreaks = [];
  let walkedDrain = 0;
  for (let i = 1; i < drainRoute.length; i++) {
    const a = drainRoute[i - 1], b = drainRoute[i], length = G.len3(G.sub3(b, a));
    const na = a[0] * viewFloor[0] + a[1] * viewFloor[1], nb = b[0] * viewFloor[0] + b[1] * viewFloor[1];
    for (const boundary of [6, 8, 10]) if (na < boundary && nb >= boundary) drainBreaks.push(walkedDrain + length * (boundary - na) / (nb - na));
    walkedDrain += length;
  }
  tube('drain.subterranean-duct', 'desaigue-fusio', drainRoute, 1.1, 'mid', { maxLength: 18, breaks: drainBreaks });
  const flangeF = G.frameAlong([68, 30, -7], [1, 0, 0]);
  const flange = turned('drain.terminal-flange', 'desaigue-fusio', flangeF, [[0, 0.7], [0, 2], [1.6, 2], [1.6, 0.7], [0, 0.7]], 'hi', { steps: 40 });
  flange.dots.push(...G.dotsOf(flangeF, 1.6, 1.55, 6, P, { all: true }));
  tube('drain.free-water-jet', 'desaigue-fusio', Array.from({ length: 19 }, (_, i) => { const t = i / 18; return [69.6 + t * 10, 30, -7 - 6 * t * t]; }), (t) => 0.7 - 0.28 * t, 'hi', { maxLength: 20, free: [false, true], ends: [true, false] });

  const split = G.splitWrappingParts(parts, P);
  parts.splice(0, parts.length, ...split);
  const recorder = G.recordRuralParts(parts, P, { order: POU_EXPLODE_ORDER, spring: POU_SPRING });
  for (const route of routes) recorder.route(route.id, route.points, route.radius, { piece: route.assembly, move: byId[route.assembly].move, free: route.free, ends: route.ends });
  parts.sort((a, b) => G.depthOf(a.centre, P) - G.depthOf(b.centre, P));
  const physicalSolidCount = new Set(parts.map(({ physicalId }) => physicalId)).size;
  const physicalParts = [...new Map(parts.map((part) => [part.physicalId, part])).values()];
  const assemblyVolumes = Object.fromEntries(assemblies.map(({ id }) => [id, physicalParts.filter((part) => part.assembly === id).reduce((sum, part) => sum + part.volumeM3, 0)]));
  return { P, width, height, parts, backParts: parts.filter(({ layer }) => layer === 'back'), frontParts: parts.filter(({ layer }) => layer === 'front'), halo: G.haloOf(basePlan, -13, 6, P), engraving, assemblies, solidCount: physicalSolidCount, physicalSolidCount, renderItemCount: parts.length, recorder, routes, assemblyVolumes, effect: { iceTops: layers.map((l) => l.top), iceRadius: 38.5, iceMove: byId['estrats-gel'].move, drainMove: byId['desaigue-fusio'].move, drainFloorZ: -7, drainOrigin: [69.6, 30, -7], drainRoute, iceLayers: layers }, physics: pouNeuState({ season, elapsedHours, shares, volumes: assemblyVolumes }) };
}

export function orderPouNeuParts(scene, shares = {}, prepared) {
  return G.sortRuralParts(scene.parts, scene.P, shares, prepared);
}
