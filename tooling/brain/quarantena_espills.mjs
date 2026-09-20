import fs from 'node:fs';
import path from 'node:path';
import { ROOT, segura, MIRRORS } from './cataleg_skills.mjs';
const args = process.argv.slice(2);
if (args.some(a => a !== '--aplica')) throw new Error('Ús: [--aplica]');
const seen = new Set();
const plan = [];
for (const rel of MIRRORS) {
  const candidate = path.join(ROOT, rel);
  if (!fs.existsSync(candidate)) continue;
  let cursor = ROOT;
  let exact = true;
  for (const part of rel.split('/')) {
    if (!fs.readdirSync(cursor).includes(part)) { exact = false; break; }
    cursor = path.join(cursor, part);
    if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error(`Symlink prohibit: ${rel}`);
  }
  if (!exact) continue; // APFS pot resoldre també l’àlies amb capitalització antiga.
  const real = fs.realpathSync(candidate);
  if (seen.has(real)) continue;
  seen.add(real);
  const canonical = path.relative(ROOT, real).split(path.sep).join('/');
  segura(ROOT, canonical);
  const target = `.brain-trash/260920_consolidacio/${canonical}`;
  segura(ROOT, target);
  if (fs.existsSync(path.join(ROOT, target))) throw new Error(`Quarantena ocupada: ${target}`);
  plan.push({ source: canonical, target });
}
console.log(JSON.stringify(plan, null, 2));
if (args.includes('--aplica')) for (const step of plan) {
  const target = segura(ROOT, step.target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.renameSync(segura(ROOT, step.source), target);
}