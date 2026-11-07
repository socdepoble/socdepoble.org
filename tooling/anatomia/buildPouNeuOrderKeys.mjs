#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { A, prepareRuralOrder } from '../../src/components/patrimoni/iso/ruralIsoEngine.js';
import { buildPouNeuScene } from '../../src/components/patrimoni/iso/modelPouNeu.js';

function solveCase({ season, azimuth, step }) {
  const scene = buildPouNeuScene({ azimuth, season });
  const prepared = prepareRuralOrder(scene.parts, scene.P, { states: [0, 0.25, 0.5, 0.75, 1], step, tolerance: 0.12, least: 0.25 });
  const depth = A.depthOrder(prepared.R.items, scene.P, {
    overlaps: prepared.R.settled.overlaps, solved: prepared.R.settled.solved,
    rest: prepared.R.settled.states,
  });
  return {
    season, azimuth, physicalSolids: scene.physicalSolidCount, drawItems: scene.parts.length,
    failures: depth.problems.length + depth.missing.length, problems: depth.problems,
    keys: Object.fromEntries([...prepared.keys].map(([id, key]) => [id, Number(key.toFixed(9))])),
  };
}

if (!isMainThread) {
  parentPort.on('message', (job) => {
    try { parentPort.postMessage(solveCase(job)); }
    catch (error) { parentPort.postMessage({ ...job, error: String(error), failures: 1 }); }
  });
} else {
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const valueOf = (name) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const step = Number(valueOf('--step') ?? 1);
const output = resolve(valueOf('--out') ?? resolve(root, 'src/components/patrimoni/iso/pouNeuOrderKeys.js'));
const reportFile = valueOf('--report');
const jobs = Math.max(1, Math.min(4, Number(valueOf('--jobs') ?? 4)));
const hash = createHash('sha256');
for (const path of ['modelPouNeu.js', 'ruralIsoEngine.js', 'vendor/iso-kit.js', 'vendor/lathe.js', 'vendor/audit.js', 'vendor/tube.js']) hash.update(await readFile(resolve(root, 'src/components/patrimoni/iso', path)));
const geometryHash = hash.digest('hex');
const tables = { winter: {}, summer: {} };
const checks = [];
const started = performance.now();
const angles = [45, 25, 65, ...Array.from({ length: 41 }, (_, i) => i + 25).filter((a) => ![25, 45, 65].includes(a))];
const cases = ['winter', 'summer'].flatMap((season) => angles.map((azimuth) => ({ season, azimuth, step })));
let cursor = 0;
const workers = Array.from({ length: jobs }, () => new Worker(new URL(import.meta.url)));
try {
  await Promise.all(workers.map((worker) => new Promise((done, fail) => {
    const next = () => cursor < cases.length ? worker.postMessage(cases[cursor++]) : done();
    worker.on('message', ({ keys, problems, ...row }) => {
      checks.push(row);
      if (row.failures) {
        console.error(JSON.stringify({ ...row, problems }, null, 2));
        fail(new Error(`Depth audit failed at ${row.season} ${row.azimuth}°`));
        return;
      }
      tables[row.season][row.azimuth] = keys;
      console.log(`${row.season} ${row.azimuth}° · ${row.physicalSolids} physical · ${row.drawItems} draw items · depth 0`);
      next();
    });
    worker.once('error', fail);
    next();
  })));
} catch (error) {
  console.error(String(error));
  process.exitCode = 1;
} finally {
  await Promise.allSettled(workers.map((worker) => worker.terminate()));
}
if (!process.exitCode) {
  const source = `// Generated from true-surface ray tests by tooling/anatomia/buildPouNeuOrderKeys.mjs.\n// Geometry SHA-256: ${geometryHash}. Step ${step} px; five reachable spring poses per camera.\nexport const POU_ORDER_KEYS = ${JSON.stringify(tables)};\nexport const POU_ORDER_GEOMETRY_SHA256 = '${geometryHash}';\n`;
  await writeFile(output, source);
  console.log(`wrote ${output} · ${checks.length} camera/season cases · ${((performance.now() - started) / 1000).toFixed(1)} s`);
}
if (reportFile) await writeFile(resolve(reportFile), JSON.stringify({
  geometryHash, sampling: { stepPx: step, depthToleranceWorld: 0.12, leastAreaPx2: 0.25, shares: [0, 0.25, 0.5, 0.75, 1] },
  elapsedSeconds: (performance.now() - started) / 1000, checks,
}, null, 2) + '\n');
}
