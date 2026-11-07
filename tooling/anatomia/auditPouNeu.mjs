#!/usr/bin/env node
/** True-surface geometry audit; no image, count or centre-order proxy. */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { A, prepareRuralOrder, layerDepthOrder } from '../../src/components/patrimoni/iso/ruralIsoEngine.js';
import * as Model from '../../src/components/patrimoni/iso/modelPouNeu.js';

const args = process.argv.slice(2);
const valueOf = (name) => {
  const at = args.indexOf(name);
  return at < 0 ? undefined : args[at + 1];
};
const full = args.includes('--full');
const azimuth = valueOf('--azimuth');
const cameras = azimuth ? [Number(azimuth)] : full ? [25, 35, 45, 55, 65] : [25, 45, 65];
if (cameras.some((a) => !Number.isFinite(a) || a < 25 || a > 65)) throw new Error('Camera must lie within 25°–65°.');
const started = performance.now();
const results = [];
const build = Model.buildPouNeuScene;
if (!build) throw new Error('modelPouNeu.js must export buildPouNeuScene.');
for (const angle of cameras) {
  const scene = build({ azimuth: angle, explode: 0 });
  const parts = scene.parts;
  const order = scene.order ?? Model.POU_EXPLODE_ORDER ?? Model.EXPLODE_ORDER ?? [...new Set(parts.map((part) => part.assembly))];
  const spring = scene.spring ?? Model.POU_SPRING ?? { stiffness: 64, damping: 16, substeps: 4, stagger: 0.035 };
  const frames = full
    ? A.springStates(order, { ...spring, stride: 1, reversals: [0.2, 0.6] })
    : [0.25, 0.5, 0.75].map((share) => ({
      label: `synchronous spring position ${share}`,
      shares: Object.fromEntries(order.map((id) => [id, share])),
    }));
  const states = [0, 1, ...frames];
  const settled = prepareRuralOrder(parts, scene.P, { order, spring, states, step: full ? 1 : 1.5, tolerance: 0.12, least: 0.25 });
  // Routes are recorded independently of their rendered sortable tube chunks.
  for (const route of scene.routes ?? []) {
    const assembly = (scene.assemblies ?? Model.POU_ASSEMBLIES ?? []).find((entry) => entry.id === route.assembly);
    settled.R.route(route.name ?? route.id, route.points, route.radius ?? route.r, {
      piece: route.assembly, move: assembly?.move ?? [0, 0, 0],
      ...route, ...route.options,
    });
  }
  const checked = A.audit(settled.R, scene.P, { frames, apart: true });
  checked.depth = A.depthOrder(settled.R.items, scene.P, {
    overlaps: settled.R.settled.overlaps, solved: settled.R.settled.solved, rest: states,
  });
  checked.layerDepth = layerDepthOrder(parts, settled, scene.P);
  const count = A.failures(checked) + checked.layerDepth.problems.length;
  const result = {
    azimuth: angle, physicalSolids: scene.physicalSolidCount, renderItems: parts.length,
    assemblies: order.length,
    states: states.length, replayFrames: frames.length,
    failures: count, elapsedSeconds: (performance.now() - started) / 1000,
    checks: checked,
    keys: Object.fromEntries(settled.keys),
  };
  results.push(result);
  console.log(`camera ${angle}° · ${scene.physicalSolidCount} physical solids · ${parts.length} drawing items · ${states.length} depth states · ${frames.length} spring frames`);
  console.log(A.report(checked, { limit: 30 }));
  console.log(`SVG layer depth: ${checked.layerDepth.problems.length} problems`);
  for (const problem of checked.layerDepth.problems.slice(0, 15))
    console.log(`  ${problem.label}: ${problem.front} must paint after ${problem.back}`);
}
const result = {
  schema: 'sdp-pou-neu-geometry-audit/v1',
  mode: full ? 'full' : 'quick',
  sampling: {
    stepPx: full ? 1 : 1.5, depthToleranceWorld: 0.12, leastAreaPx2: 0.25,
    connectionToleranceWorld: 0.15, solidSunkThresholdWorld: 0.5,
    tubeThroughThresholdWorld: 0.1,
  },
  failures: results.reduce((n, camera) => n + camera.failures, 0),
  elapsedSeconds: (performance.now() - started) / 1000,
  cameras: results,
};
if (valueOf('--out')) await writeFile(resolve(valueOf('--out')), JSON.stringify(result, null, 2) + '\n');
console.log(result.failures ? `geometry audit failed: ${result.failures}` : 'geometry audit passed');
if (result.failures) process.exitCode = 1;
